$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$serverDir = Join-Path $projectRoot "server"
$clientDir = Join-Path $projectRoot "client"

Write-Host "Starting backend and frontend dev servers..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$serverDir'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$clientDir'; npm run dev"

Write-Host "Done. Backend: http://localhost:4000 | Frontend: http://localhost:5173" -ForegroundColor Green
