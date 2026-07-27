# Bakery Shop Minikube helpers (Windows PowerShell)

## PATH (already configured for your user)
- minikube: `C:\Program Files\Kubernetes\minikube`
- docker/kubectl: `C:\Program Files\Docker\Docker\resources\bin`

Open a **new** PowerShell after install so PATH applies.

## Daily start
```powershell
cd C:\bakery_shop
minikube start --driver=docker
minikube -p minikube docker-env --shell powershell | Out-File .\minikube-docker-env.ps1 -Encoding utf8
. .\minikube-docker-env.ps1
```

## Rebuild images into Minikube Docker
```powershell
. .\minikube-docker-env.ps1
docker build -t bakery-nutrition-api:latest ./calories_tracker_service
docker build -t bakery-nutrition-worker:latest -f ./calories_tracker_service/Dockerfile.worker ./calories_tracker_service
docker build -t bakery-node-api:latest -f ./server/Dockerfile.k8s .
kubectl rollout restart deployment/node-api deployment/nutrition-api deployment/nutrition-worker -n bakery-shop
```

## Access the app
```powershell
minikube service node-api -n bakery-shop
# or
kubectl port-forward -n bakery-shop svc/node-api 4000:4000
# then open http://127.0.0.1:4000
```

## Status
```powershell
kubectl get pods -n bakery-shop
minikube status
```
