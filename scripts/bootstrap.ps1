param(
  [string]$MySqlUser = "root",
  [string]$MySqlExePath = "",
  [switch]$SkipDbInit,
  [switch]$SkipInstall
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$dbScript = Join-Path $projectRoot "database\init.sql"
$serverDir = Join-Path $projectRoot "server"
$clientDir = Join-Path $projectRoot "client"

if (-not (Test-Path $dbScript)) {
  throw "Database script not found: $dbScript"
}

if (-not $SkipDbInit) {
  if (-not $MySqlExePath) {
    $defaultMySql = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
    if (Test-Path $defaultMySql) {
      $MySqlExePath = $defaultMySql
    } else {
      $candidate = Get-ChildItem "C:\Program Files\MySQL" -Recurse -Filter "mysql.exe" -ErrorAction SilentlyContinue |
        Select-Object -First 1

      if ($candidate) {
        $MySqlExePath = $candidate.FullName
      }
    }
  }

  if (-not $MySqlExePath -or -not (Test-Path $MySqlExePath)) {
    throw "mysql.exe not found. Pass -MySqlExePath explicitly."
  }

  Write-Host "[1/4] Initializing MySQL schema and seed data..." -ForegroundColor Cyan
  $escapedMySqlPath = '"' + $MySqlExePath + '"'
  $escapedSqlPath = '"' + $dbScript + '"'
  cmd /c "$escapedMySqlPath -u $MySqlUser -p < $escapedSqlPath"
  if ($LASTEXITCODE -ne 0) {
    throw "MySQL initialization failed."
  }
} else {
  Write-Host "[1/4] Skipping DB initialization (-SkipDbInit)." -ForegroundColor Yellow
}

if (-not $SkipInstall) {
  Write-Host "[2/4] Installing backend dependencies..." -ForegroundColor Cyan
  Push-Location $serverDir
  npm install
  if ($LASTEXITCODE -ne 0) {
    Pop-Location
    throw "Backend dependency installation failed."
  }

  if (-not (Test-Path (Join-Path $serverDir ".env"))) {
    Copy-Item (Join-Path $serverDir ".env.example") (Join-Path $serverDir ".env")
    Write-Host "Created server/.env from .env.example. Review MYSQL_PASSWORD and JWT_SECRET." -ForegroundColor Yellow
  }
  Pop-Location

  Write-Host "[3/4] Installing frontend dependencies..." -ForegroundColor Cyan
  Push-Location $clientDir
  npm install
  if ($LASTEXITCODE -ne 0) {
    Pop-Location
    throw "Frontend dependency installation failed."
  }
  Pop-Location
} else {
  Write-Host "[2/4] Skipping dependency installation (-SkipInstall)." -ForegroundColor Yellow
  Write-Host "[3/4] Skipping dependency installation (-SkipInstall)." -ForegroundColor Yellow
}

Write-Host "[4/4] Starting backend and frontend dev servers in new terminals..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$serverDir'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$clientDir'; npm run dev"

Write-Host "Bootstrap complete." -ForegroundColor Green
Write-Host "Backend: http://localhost:4000" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Green
