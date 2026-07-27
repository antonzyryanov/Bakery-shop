# Minikube deployment for Bakery Shop (HA + round-robin)

## Prerequisites

- Docker
- Minikube
- kubectl

## Build images into Minikube

```bash
minikube start
eval $(minikube docker-env)

docker build -t bakery-node-api:latest ./server
docker build -t bakery-nutrition-api:latest ./calories_tracker_service
docker build -t bakery-nutrition-worker:latest -f ./calories_tracker_service/Dockerfile.worker ./calories_tracker_service
```

## Deploy stack

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/mysql.yaml
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/db-pvc.yaml
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/nutrition-api.yaml
kubectl apply -f k8s/nutrition-worker.yaml
kubectl apply -f k8s/uploads-pvc.yaml
kubectl apply -f k8s/node-api.yaml
kubectl apply -f k8s/ingress.yaml
```

`node-api` and `nutrition-api` run with **2 replicas** each. Kubernetes Services provide **round-robin** load balancing across pods.

### Persistent data

These PVCs keep data across `minikube stop` / `minikube start` and pod restarts:

| PVC | Mount | Contents |
|-----|--------|----------|
| `mysql-data` | MySQL `/var/lib/mysql` | Users, orders, products, chat, metrics |
| `postgres-data` | Postgres `/var/lib/postgresql/data` | Nutrition users, dishes, food entries |
| `node-api-uploads` | Node `/app/uploads` | Product / nutrition images |

`minikube delete` still wipes the cluster and its volumes. Re-apply manifests and restore from backup if you delete the cluster.

Product / nutrition upload files are stored on a shared PVC (`node-api-uploads`) mounted at `/app/uploads`, so images survive pod restarts and are visible to every `node-api` replica.

## Access

```bash
minikube service node-api -n bakery-shop --url
```

Or enable ingress addon:

```bash
minikube addons enable ingress
echo "$(minikube ip) bakery.local" | sudo tee -a /etc/hosts
```

## Local Docker Compose (without Kubernetes)

```bash
docker compose up --build
```

Services:

- Node API: http://localhost:4000
- Nutrition API: http://localhost:8000
- PostgreSQL nutrition DB: localhost:5434
- MySQL bakery DB: localhost:3306
- Redis: localhost:6379
