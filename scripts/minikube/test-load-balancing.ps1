<#
.SYNOPSIS
  Manual round-robin load-balancing test for node-api and nutrition-api (2 replicas each).

.DESCRIPTION
  Runs an HTTP probe from inside the cluster (via kubectl cp/exec into an existing pod)
  against each Service DNS name, then prints per-pod instance hit counts.

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\scripts\minikube\test-load-balancing.ps1
  powershell -ExecutionPolicy Bypass -File .\scripts\minikube\test-load-balancing.ps1 -Requests 40
#>

[CmdletBinding()]
param(
  [int]$Requests = 30,
  [string]$Namespace = 'bakery-shop'
)

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $false
. (Join-Path $PSScriptRoot 'common.ps1')
Initialize-BakeryPath
Assert-Command kubectl

function Get-ReplicaNames {
  param([string]$App)
  $names = kubectl get pods -n $Namespace -l "app=$App" -o jsonpath="{.items[*].metadata.name}"
  return @($names -split '\s+' | Where-Object { $_ })
}

function Test-ServiceRoundRobin {
  param(
    [Parameter(Mandatory = $true)][string]$App,
    [Parameter(Mandatory = $true)][string]$ServiceHost,
    [Parameter(Mandatory = $true)][string]$HealthPath,
    [Parameter(Mandatory = $true)][int]$Port,
    [Parameter(Mandatory = $true)][string]$RunnerApp,
    [Parameter(Mandatory = $true)][ValidateSet('node', 'python')][string]$RunnerRuntime
  )

  Write-Host ''
  Write-Host "=== Load balancing: $App ===" -ForegroundColor Cyan

  $replicas = Get-ReplicaNames -App $App
  if ($replicas.Count -lt 2) {
    throw "$App must have at least 2 Ready pods for an HA/LB test. Found: $($replicas.Count)"
  }

  Write-Host ('Replicas ({0}): {1}' -f $replicas.Count, ($replicas -join ', '))

  # Short Service DNS works inside the same namespace.
  $url = 'http://{0}:{1}{2}' -f $ServiceHost, $Port, $HealthPath
  Write-Host ('Sending {0} in-cluster requests to {1} (runner app={2}) ...' -f $Requests, $url, $RunnerApp)

  $raw = Invoke-InClusterHttpProbe `
    -Namespace $Namespace `
    -RunnerApp $RunnerApp `
    -RunnerRuntime $RunnerRuntime `
    -Url $url `
    -Count $Requests

  $probe = Parse-ProbeOutput -Raw $raw
  if (-not $probe) {
    Write-Host 'Probe output (debug):' -ForegroundColor Yellow
    Write-Host $raw
    throw "Could not parse in-cluster probe summary for $App."
  }

  Write-Host ('Successful responses: {0} / {1}' -f $probe.Ok, $Requests)
  if ($probe.Fail -gt 0) {
    Write-Host ('Failed responses: {0}' -f $probe.Fail) -ForegroundColor Yellow
  }

  Write-Host 'Instance distribution:'
  foreach ($key in ($probe.Counts.Keys | Sort-Object)) {
    $share = if ($probe.Ok -gt 0) { [math]::Round(100.0 * $probe.Counts[$key] / $probe.Ok, 1) } else { 0 }
    Write-Host ('  {0,-50} {1,4}  ({2}%)' -f $key, $probe.Counts[$key], $share)
  }

  $distinct = @($probe.Counts.Keys | Where-Object { $_ -ne 'unknown' }).Count
  if ($distinct -lt 2) {
    Write-Host ('RESULT: FAIL - only {0} distinct instance(s) seen (expected >= 2).' -f $distinct) -ForegroundColor Red
    return $false
  }

  Write-Host ('RESULT: PASS - traffic reached {0} replicas (Service round-robin).' -f $distinct) -ForegroundColor Green
  return $true
}

Write-Host 'Waiting for Ready replicas...'
Wait-BakeryPodsReady -Namespace $Namespace -TimeoutSeconds 180

# Probe node-api from a nutrition pod (Python).
$nodePass = Test-ServiceRoundRobin `
  -App 'node-api' `
  -ServiceHost 'node-api' `
  -HealthPath '/api/health' `
  -Port 4000 `
  -RunnerApp 'nutrition-api' `
  -RunnerRuntime 'python'

# Probe nutrition-api from a node-api pod (Node fetch).
$nutritionPass = Test-ServiceRoundRobin `
  -App 'nutrition-api' `
  -ServiceHost 'nutrition-api' `
  -HealthPath '/health' `
  -Port 8000 `
  -RunnerApp 'node-api' `
  -RunnerRuntime 'node'

Write-Host ''
Write-Host 'Note: probes run via kubectl exec inside existing pods (reliable on Docker Desktop Windows).'

if (-not ($nodePass -and $nutritionPass)) {
  exit 1
}

Write-Host ''
Write-Host 'Load-balancing test finished successfully.' -ForegroundColor Green
