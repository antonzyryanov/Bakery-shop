<#
.SYNOPSIS
  Manual high-availability test: kill one replica and verify the Service keeps serving.

.DESCRIPTION
  1) Confirms 2 Ready replicas for node-api and nutrition-api
  2) Deletes one pod of each deployment
  3) Immediately probes Service health from another in-cluster pod
  4) Waits until Kubernetes recreates the missing replicas

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\scripts\minikube\test-high-availability.ps1
#>

[CmdletBinding()]
param(
  [string]$Namespace = 'bakery-shop',
  [int]$ProbeCount = 10
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false
. (Join-Path $PSScriptRoot 'common.ps1')
Initialize-BakeryPath
Assert-Command kubectl

function Get-ReadyPods {
  param([string]$App)
  $json = kubectl get pods -n $Namespace -l "app=$App" -o json | ConvertFrom-Json
  return @($json.items | Where-Object {
    $_.status.phase -eq 'Running' -and
    (@($_.status.containerStatuses | Where-Object { $_.ready })).Count -gt 0
  })
}

function Test-AppHighAvailability {
  param(
    [Parameter(Mandatory = $true)][string]$App,
    [Parameter(Mandatory = $true)][string]$ServiceHost,
    [Parameter(Mandatory = $true)][string]$HealthPath,
    [Parameter(Mandatory = $true)][int]$Port,
    [Parameter(Mandatory = $true)][string]$RunnerApp,
    [Parameter(Mandatory = $true)][ValidateSet('node', 'python')][string]$RunnerRuntime
  )

  Write-Host ''
  Write-Host "=== High availability: $App ===" -ForegroundColor Cyan

  $before = Get-ReadyPods -App $App
  if ($before.Count -lt 2) {
    throw "$App needs 2 Ready replicas before HA test. Found $($before.Count)."
  }

  $victim = $before[0].metadata.name
  $url = 'http://{0}:{1}{2}' -f $ServiceHost, $Port, $HealthPath

  Write-Host ('Ready replicas: {0}' -f $before.Count)
  Write-Host ('Deleting pod: {0}' -f $victim)

  kubectl delete pod -n $Namespace $victim --wait=false | Out-Null
  Start-Sleep -Seconds 2

  $during = Get-ReadyPods -App $App
  Write-Host ('Ready replicas right after delete: {0}' -f $during.Count)

  # If we deleted the runner pod's sibling service, pick a runner that is still alive.
  if ($RunnerApp -eq $App) {
    throw "Internal error: runner app must differ from target app ($App)."
  }

  Write-Host ('Probing Service while one replica is down ({0} requests)...' -f $ProbeCount)
  $raw = Invoke-InClusterHttpProbe `
    -Namespace $Namespace `
    -RunnerApp $RunnerApp `
    -RunnerRuntime $RunnerRuntime `
    -Url $url `
    -Count $ProbeCount

  $probe = Parse-ProbeOutput -Raw $raw
  if (-not $probe) {
    Write-Host 'Probe output (debug):' -ForegroundColor Yellow
    Write-Host $raw
    throw "Could not parse in-cluster probe summary for $App."
  }

  Write-Host ('Health while degraded: ok={0} fail={1}' -f $probe.Ok, $probe.Fail)
  if ($probe.Ok -lt [math]::Ceiling($ProbeCount * 0.8)) {
    Write-Host 'RESULT: FAIL - Service did not stay healthy enough during pod loss.' -ForegroundColor Red
    return $false
  }

  Write-Host 'Waiting for Deployment to recreate the missing replica...'
  kubectl rollout status ('deployment/{0}' -f $App) -n $Namespace --timeout=180s | Out-Null
  $after = Get-ReadyPods -App $App
  Write-Host ('Ready replicas after recovery: {0}' -f $after.Count)

  if ($after.Count -lt 2) {
    Write-Host 'RESULT: FAIL - did not recover to 2 Ready replicas.' -ForegroundColor Red
    return $false
  }

  Write-Host ('RESULT: PASS - {0} stayed available and recovered to {1} replicas.' -f $App, $after.Count) -ForegroundColor Green
  return $true
}

Wait-BakeryPodsReady -Namespace $Namespace -TimeoutSeconds 180

$nodePass = Test-AppHighAvailability `
  -App 'node-api' `
  -ServiceHost 'node-api' `
  -HealthPath '/api/health' `
  -Port 4000 `
  -RunnerApp 'nutrition-api' `
  -RunnerRuntime 'python'

$nutritionPass = Test-AppHighAvailability `
  -App 'nutrition-api' `
  -ServiceHost 'nutrition-api' `
  -HealthPath '/health' `
  -Port 8000 `
  -RunnerApp 'node-api' `
  -RunnerRuntime 'node'

Write-Host ''
kubectl get pods -n $Namespace -l 'app in (node-api,nutrition-api)' -o wide

if (-not ($nodePass -and $nutritionPass)) {
  exit 1
}

Write-Host ''
Write-Host 'High-availability test finished successfully.' -ForegroundColor Green
