<#
.SYNOPSIS
  Start Minikube, build images into the cluster Docker daemon, and apply bakery-shop manifests.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\scripts\minikube\start-cluster.ps1
#>

[CmdletBinding()]
param(
  [int]$Cpus = 2,
  [int]$MemoryMb = 4000,
  [switch]$SkipBuild,
  [switch]$SkipApply
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'common.ps1')
Initialize-BakeryPath
Assert-Command minikube
Assert-Command kubectl
Assert-Command docker
Assert-Command npm

$repoRoot = Get-RepoRoot
Set-Location $repoRoot

Write-Host '=== Start Minikube ===' -ForegroundColor Cyan
minikube start --driver=docker --cpus=$Cpus --memory=$MemoryMb
minikube update-context | Out-Null
minikube status

if (-not $SkipBuild) {
  Write-Host '=== Build web client ===' -ForegroundColor Cyan
  Push-Location (Join-Path $repoRoot 'client')
  npm run build
  Pop-Location

  Write-Host '=== Point Docker at Minikube ===' -ForegroundColor Cyan
  minikube docker-env --shell powershell | Invoke-Expression

  Write-Host '=== Build images into Minikube ===' -ForegroundColor Cyan
  docker build -t bakery-node-api:latest -f .\server\Dockerfile.k8s .
  docker build -t bakery-nutrition-api:latest .\calories_tracker_service
  docker build -t bakery-nutrition-worker:latest -f .\calories_tracker_service\Dockerfile.worker .\calories_tracker_service
}

if (-not $SkipApply) {
  Write-Host '=== Apply Kubernetes manifests ===' -ForegroundColor Cyan
  kubectl apply -f .\k8s\namespace.yaml
  kubectl apply -f .\k8s\secret.yaml
  kubectl apply -f .\k8s\configmap.yaml
  kubectl apply -f .\k8s\db-pvc.yaml
  kubectl apply -f .\k8s\uploads-pvc.yaml
  kubectl apply -f .\k8s\mysql.yaml
  kubectl apply -f .\k8s\postgres.yaml
  kubectl apply -f .\k8s\redis.yaml
  kubectl apply -f .\k8s\nutrition-api.yaml
  kubectl apply -f .\k8s\nutrition-worker.yaml
  kubectl apply -f .\k8s\node-api.yaml
  kubectl apply -f .\k8s\ingress.yaml

  Write-Host '=== Restart app deployments to pick up local images ===' -ForegroundColor Cyan
  kubectl rollout restart deployment/node-api deployment/nutrition-api deployment/nutrition-worker -n bakery-shop | Out-Null
  Wait-BakeryPodsReady
}

Write-Host ''
Write-Host 'Cluster is ready.' -ForegroundColor Green
Write-Host 'Pods:'
kubectl get pods -n bakery-shop
Write-Host ''
$minikubeIp = minikube ip
Write-Host "Node API (NodePort):      http://${minikubeIp}:30080"
Write-Host "Nutrition API (NodePort): http://${minikubeIp}:30081/health"
Write-Host 'Local port-forward UI:    kubectl port-forward -n bakery-shop svc/node-api 4000:4000'
Write-Host 'Then open:                http://127.0.0.1:4000'
Write-Host ''
Write-Host 'HA / LB tests:'
Write-Host '  powershell -ExecutionPolicy Bypass -File .\scripts\minikube\test-load-balancing.ps1'
Write-Host '  powershell -ExecutionPolicy Bypass -File .\scripts\minikube\test-high-availability.ps1'
