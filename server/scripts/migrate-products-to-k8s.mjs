#!/usr/bin/env node
/**
 * Migrates products (rows + image files) from local MySQL to Minikube bakery-shop MySQL.
 *
 * Usage:
 *   npm run migrate:products:k8s
 *
 * Requires: kubectl, minikube cluster running, local MySQL with server/.env credentials.
 */

import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const serverEnvPath = path.join(repoRoot, 'server', '.env');
const uploadsDir = path.join(repoRoot, 'server', 'uploads', 'products');
const publicImagesDir = path.join(repoRoot, 'client', 'public', 'images', 'products');

const K8S_NAMESPACE = 'bakery-shop';
const K8S_MYSQL_LOCAL_PORT = 33306;
const K8S_MYSQL_USER = 'bakery_app';
const K8S_MYSQL_PASSWORD = 'ChangeMe_BakeryApp_123!';
const K8S_MYSQL_DATABASE = 'bakery_shop';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const log = (message) => {
  process.stdout.write(`${message}\n`);
};

const resolveImageFile = (imageUrl) => {
  const normalized = String(imageUrl || '').trim();
  if (!normalized) {
    return null;
  }

  const fileName = path.basename(normalized);

  if (normalized.startsWith('/uploads/products/')) {
    const filePath = path.join(uploadsDir, fileName);
    return fs.existsSync(filePath) ? filePath : null;
  }

  if (normalized.startsWith('/images/products/')) {
    const filePath = path.join(publicImagesDir, fileName);
    return fs.existsSync(filePath) ? filePath : null;
  }

  return null;
};

const startMysqlPortForward = () => {
  const child = spawn(
    'kubectl',
    [
      'port-forward',
      '-n',
      K8S_NAMESPACE,
      'svc/mysql',
      `${K8S_MYSQL_LOCAL_PORT}:3306`
    ],
    { stdio: ['ignore', 'pipe', 'pipe'] }
  );

  return new Promise((resolve, reject) => {
    let settled = false;

    const onReady = (chunk) => {
      const text = String(chunk);
      if (text.includes('Forwarding from')) {
        settled = true;
        resolve(child);
      }
    };

    child.stdout.on('data', onReady);
    child.stderr.on('data', onReady);

    child.on('error', (error) => {
      if (!settled) {
        reject(error);
      }
    });

    child.on('exit', (code) => {
      if (!settled) {
        reject(new Error(`kubectl port-forward exited early with code ${code}`));
      }
    });

    setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(child);
      }
    }, 5000);
  });
};

const getNodeApiPods = () => {
  const output = execSync(
    `kubectl get pods -n ${K8S_NAMESPACE} -l app=node-api --field-selector=status.phase=Running -o jsonpath="{.items[*].metadata.name}"`,
    { encoding: 'utf8' }
  ).trim();

  return output.split(/\s+/).filter(Boolean);
};

const copyImagesToPods = (filesByName) => {
  const pods = getNodeApiPods();
  if (!pods.length) {
    throw new Error('No running node-api pods found in bakery-shop namespace.');
  }

  // All replicas share the same PVC at /app/uploads — copy once to any Running pod.
  const pod = pods[0];
  const stagingDir = path.join(repoRoot, 'server', 'scripts', '.migration-staging', 'uploads', 'products');
  fs.mkdirSync(stagingDir, { recursive: true });

  for (const fileName of Object.keys(filesByName)) {
    fs.copyFileSync(filesByName[fileName], path.join(stagingDir, fileName));
  }

  log(`Copying ${Object.keys(filesByName).length} image(s) to shared uploads volume via pod ${pod}...`);
  execSync(
    `kubectl exec -n ${K8S_NAMESPACE} ${pod} -- mkdir -p /app/uploads/products`,
    { stdio: 'inherit' }
  );

  const tarCommand =
    `tar -cf - -C "${stagingDir}" . | kubectl exec -i -n ${K8S_NAMESPACE} ${pod} -- tar -xf - -C /app/uploads/products`;

  execSync(tarCommand, { stdio: 'inherit', shell: true });
};

const clearProductCache = () => {
  const keysOutput = execSync(
    `kubectl exec -n ${K8S_NAMESPACE} deploy/redis -- redis-cli KEYS "products:*"`,
    { encoding: 'utf8' }
  ).trim();

  const keys = keysOutput.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  for (const key of keys) {
    execSync(
      `kubectl exec -n ${K8S_NAMESPACE} deploy/redis -- redis-cli DEL "${key}"`,
      { stdio: 'inherit' }
    );
  }
};

const normalizeImageUrlForK8s = (imageUrl, resolvedFilePath) => {
  if (resolvedFilePath) {
    return `/uploads/products/${path.basename(resolvedFilePath)}`;
  }

  return imageUrl;
};

const main = async () => {
  if (!fs.existsSync(serverEnvPath)) {
    throw new Error(`Missing ${serverEnvPath}. Configure local MySQL credentials first.`);
  }

  dotenv.config({ path: serverEnvPath });

  const localConfig = {
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE || 'bakery_shop'
  };

  log('Reading products from local MySQL...');
  const localDb = await mysql.createConnection(localConfig);
  const [products] = await localDb.execute(
    'SELECT id, name, description, image_url AS imageUrl, price FROM products ORDER BY name ASC'
  );
  await localDb.end();

  if (!products.length) {
    throw new Error('No products found in local database.');
  }

  log(`Found ${products.length} local product(s).`);

  const filesByName = {};
  const preparedProducts = products.map((product) => {
    const sourceFile = resolveImageFile(product.imageUrl);
    const imageUrl = normalizeImageUrlForK8s(product.imageUrl, sourceFile);

    if (sourceFile) {
      filesByName[path.basename(sourceFile)] = sourceFile;
    } else {
      log(`Warning: image file not found for ${product.id} (${product.imageUrl})`);
    }

    return {
      ...product,
      imageUrl
    };
  });

  log('Opening port-forward to Kubernetes MySQL...');
  const portForward = await startMysqlPortForward();
  await sleep(1500);

  let k8sDb;
  try {
    k8sDb = await mysql.createConnection({
      host: '127.0.0.1',
      port: K8S_MYSQL_LOCAL_PORT,
      user: K8S_MYSQL_USER,
      password: K8S_MYSQL_PASSWORD,
      database: K8S_MYSQL_DATABASE,
      multipleStatements: true
    });

    log('Replacing products in Kubernetes MySQL...');
    await k8sDb.beginTransaction();
    await k8sDb.query('SET FOREIGN_KEY_CHECKS = 0');
    await k8sDb.query('DELETE FROM chosen_products');
    await k8sDb.query('DELETE FROM products');

    for (const product of preparedProducts) {
      await k8sDb.execute(
        'INSERT INTO products (id, name, description, image_url, price) VALUES (?, ?, ?, ?, ?)',
        [product.id, product.name, product.description, product.imageUrl, product.price]
      );
    }

    await k8sDb.query('SET FOREIGN_KEY_CHECKS = 1');
    await k8sDb.commit();

    const [countRows] = await k8sDb.execute('SELECT COUNT(*) AS cnt FROM products');
    log(`Kubernetes MySQL now has ${countRows[0].cnt} product(s).`);
  } catch (error) {
    if (k8sDb) {
      await k8sDb.rollback().catch(() => {});
    }
    throw error;
  } finally {
    if (k8sDb) {
      await k8sDb.end();
    }
    portForward.kill('SIGTERM');
  }

  if (Object.keys(filesByName).length) {
    copyImagesToPods(filesByName);
  } else {
    log('No local image files to copy.');
  }

  log('Clearing Redis product cache...');
  try {
    clearProductCache();
  } catch {
    log('Redis cache clear skipped (non-fatal).');
  }

  log('Migration complete.');
};

main().catch((error) => {
  process.stderr.write(`Migration failed: ${error.message}\n`);
  process.exit(1);
});
