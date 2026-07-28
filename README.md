# Bakery Shop Fullstack Service

Ingress-Nginx Server + Kubernetes with persistent volume + Docker minikube high available cluster with round-robin balancing which contains ReactJS SPA with Redux and Vite Web Frontend + React Native with Expo Mobile+ExpressJS Backend[ with MySQL 3NF Database] + Python Fast API Nutrition Tracker Service [with PostgreSQL 3NF Database]

Manual Tests videos show latest versions of service

Screenshots of web version show first versions of app

## Manual Tests videos

https://drive.google.com/drive/folders/1dsEt2c7almzm1bwLIdj7N55EChgjuDhk?usp=sharing

## Screenshots

<table>
 <tr>
  <td><img src="screenshots/screenshot_1.jpg" alt="Screenshot 1"></td>
  <td><img src="screenshots/screenshot_2.jpg" alt="Screenshot 2"></td>
 </tr>
 <tr>
  <td><img src="screenshots/screenshot_3.jpg" alt="Screenshot 3"></td>
  <td><img src="screenshots/screenshot_4.jpg" alt="Screenshot 4"></td>
 </tr>
 <tr>
  <td><img src="screenshots/screenshot_5.jpg" alt="Screenshot 5"></td>
  <td><img src="screenshots/screenshot_6.jpg" alt="Screenshot 6"></td>
 </tr>
 <tr>
  <td><img src="screenshots/screenshot_7.jpg" alt="Screenshot 7"></td>
  <td><img src="screenshots/screenshot_8.jpg" alt="Screenshot 8"></td>
 </tr>
 <tr>
  <td><img src="screenshots/screenshot_9.jpg" alt="Screenshot 9"></td>
  <td><img src="screenshots/screenshot_10.jpg" alt="Screenshot 10"></td>
 </tr>
 <tr>
  <td><img src="screenshots/screenshot_11.jpg" alt="Screenshot 11"></td>
  <td><img src="screenshots/screenshot_12.jpg" alt="Screenshot 12"></td>
 </tr>
 <tr>
  <td><img src="screenshots/screenshot_13.jpg" alt="Screenshot 13"></td>
  <td><img src="screenshots/screenshot_14.jpg" alt="Screenshot 14"></td>
 </tr>
 <tr>
  <td><img src="screenshots/screenshot_15.jpg" alt="Screenshot 15"></td>
  <td><img src="screenshots/screenshot_16.jpg" alt="Screenshot 16"></td>
 </tr>
 <tr>
  <td><img src="screenshots/screenshot_17.jpg" alt="Screenshot 17"></td>
  <td><img src="screenshots/screenshot_18.jpg" alt="Screenshot 18"></td>
 </tr>
 <tr>
  <td><img src="screenshots/screenshot_19.jpg" alt="Screenshot 19"></td>
  <td><img src="screenshots/screenshot_20.jpg" alt="Screenshot 20"></td>
 </tr>
 <tr>
  <td><img src="screenshots/screenshot_21.jpg" alt="Screenshot 21"></td>
  <td><img src="screenshots/screenshot_22.jpg" alt="Screenshot 22"></td>
 </tr>
</table>



Stack:
- Kubernetes + Minikube for local High Available Cluster with Round Robin load balancing
- Docker for Containerizing
- MySQL (database)
- Node.js + Express (backend API)
- React + Redux + Vite (web SPA Frontend)
- React Native mobile Expo app
- Python + PosrgreSQL for Nutrition Tracker Service

## 1) Database

Schema and seed data are in `database/init.sql`.

Create dedicated app DB user (recommended):

1. Edit `database/create_app_user.sql` and change the default password.
2. Run it as MySQL root/admin:

```powershell
cd c:\bakery_shop
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p < .\database\create_app_user.sql
```

Run (PowerShell example):

```powershell
cd c:\bakery_shop
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p < .\database\init.sql
```

The script creates normalized tables (1NF/2NF/3NF), FK constraints, 30 bakery products, and product image URLs.

If your DB already exists and you only need image URLs, run migration:

```powershell
Get-Content "c:\bakery_shop\database\add_product_images.sql" | & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p
```

Metrics activity tables (3NF) are created automatically on backend startup via `database/add_metrics_tables.sql`, or can be applied manually:

```powershell
Get-Content "c:\bakery_shop\database\add_metrics_tables.sql" | & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root -p
```

## 2) Backend

```powershell
cd c:\bakery_shop\server
copy .env.example .env
npm install
npm run dev
```

Run backend tests:

```powershell
cd c:\bakery_shop\server
npm test
```

## 3) Frontend

```powershell
cd c:\bakery_shop\client
npm install
npm run dev
```

Run frontend tests:

```powershell
cd c:\bakery_shop\client
npm test
```

Vite dev server runs at `http://localhost:5173` and proxies API requests to `http://localhost:4000`.

## 4) Mobile (React Native / Expo)

```powershell
cd c:\bakery_shop\mobile
npm install
npm start
```

There is no admin UI on mobile. Orders placed from the app appear in web `/admin/orders`. Activity events are logged with `platform=MOBILE` and visible in web `/admin/metrics`.

## Default Admin Login

- Email/Login: `Admin` via UI means use `admin@bakery.local`
- Password: `Ko1337Bra?`

The backend ensures this admin account exists at startup.

## Security Features Included

- Helmet
- CSRF protection
- Morgan logging
- Rate limiting + slowdown (DDoS mitigation baseline)
- Input validation for auth/admin/order requests
- JWT auth with role-based authorization (cookie for web, Bearer token for mobile)
- Redis cache for product listing endpoint
- User activity metrics (3NF MySQL) shared by web and mobile

## One-Command Bootstrap

Use this to initialize DB, install dependencies, and start both dev servers:

```powershell
cd c:\bakery_shop
powershell -ExecutionPolicy Bypass -File .\scripts\bootstrap.ps1 -MySqlUser root
```

Optional arguments:

- `-MySqlUser` for DB user
- `-MySqlExePath` if `mysql.exe` is not auto-detected
- `-SkipDbInit` to avoid re-running `database/init.sql`
- `-SkipInstall` to avoid reinstalling npm dependencies

## Daily Start (Recommended)

For normal day-to-day work, do not re-run DB init. Use:

```powershell
cd c:\bakery_shop
powershell -ExecutionPolicy Bypass -File .\scripts\start-dev.ps1
```

Why: `database/init.sql` drops and recreates tables, so running bootstrap without `-SkipDbInit` will reset data.

## 5) Minikube HA cluster (2× Node API + 2× Nutrition API)

The Kubernetes stack runs:

| Deployment | Replicas | Role |
|------------|----------|------|
| `node-api` | 2 | Express API + React SPA |
| `nutrition-api` | 2 | FastAPI nutrition service |
| `nutrition-worker` | 2 | Celery workers |
| mysql / postgres / redis | 1 each | Persistent data + queues |

Kubernetes Services distribute traffic across Ready pods (**round-robin** / kube-proxy load balancing).

### Prerequisites

- Docker Desktop running
- Minikube + kubectl on `PATH` (see `k8s/WINDOWS.md`)

### Start / rebuild the cluster

Full start (Minikube + image builds + `kubectl apply`):

```powershell
cd c:\bakery_shop
powershell -ExecutionPolicy Bypass -File .\scripts\minikube\start-cluster.ps1
```

Useful flags:

- `-SkipBuild` — only start Minikube / re-apply manifests
- `-SkipApply` — only build images into Minikube Docker
- `-Cpus 2 -MemoryMb 4000` — resource sizing

After start:

```powershell
kubectl get pods -n bakery-shop
minikube ip
# Node API NodePort:      http://<minikube-ip>:30080
# Nutrition health NodePort: http://<minikube-ip>:30081/health

# Convenient local UI tunnel (does NOT prove round-robin by itself):
kubectl port-forward -n bakery-shop svc/node-api 4000:4000
# open http://127.0.0.1:4000
```

Persistent volumes (`mysql-data`, `postgres-data`, `node-api-uploads`) keep users/orders/nutrition/images across `minikube stop` / `start`. `minikube delete` still wipes volumes.

More detail: `k8s/README.md`, `k8s/WINDOWS.md`.

### Manual test: round-robin load balancing

Health endpoints return the pod name in `instance` so you can see which replica answered:

- Node: `GET /api/health` → `{ "status":"ok", "service":"node-api", "instance":"<pod>" }`
- Nutrition: `GET /health` → `{ "status":"ok", "service":"nutrition-tracker", "instance":"<pod>" }`

Run:

```powershell
cd c:\bakery_shop
powershell -ExecutionPolicy Bypass -File .\scripts\minikube\test-load-balancing.ps1
# optional: -Requests 40
```

What the script does:

1. Checks that `node-api` and `nutrition-api` each have **2 Ready** pods
2. Copies a tiny probe script into an existing pod (`kubectl cp`)
3. Runs it with `kubectl exec` against Service DNS (`http://node-api:4000`, `http://nutrition-api:8000`)
4. Reads `instance` (pod name) hit counts
5. Prints **PASS** if ≥ 2 distinct instances answered

Why this approach?
- Host NodePort via `minikube ip` is often unreachable on Docker Desktop Windows
- `kubectl run --rm` / shell quoting is fragile in PowerShell
- Executing from an already-running pod is reliable and still uses real Service load balancing


Optional host smoke checks after the script:

```powershell
$minikubeIp = minikube ip
Invoke-RestMethod "http://$minikubeIp:30080/api/health"
Invoke-RestMethod "http://$minikubeIp:30081/health"
```

### Manual test: high availability

```powershell
cd c:\bakery_shop
powershell -ExecutionPolicy Bypass -File .\scripts\minikube\test-high-availability.ps1
```

What the script does for both `node-api` and `nutrition-api`:

1. Confirms 2 Ready replicas
2. Deletes **one** pod
3. Immediately probes the Service health endpoint many times (must mostly stay `200`)
4. Waits until Kubernetes recreates the replica and both pods are Ready again
5. Prints **PASS** / **FAIL** per service

Expected outcome: while one replica is down, the Service still serves traffic from the surviving replica; shortly after, replica count returns to 2.
