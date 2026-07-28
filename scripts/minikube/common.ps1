# Shared helpers for Minikube scripts (Windows PowerShell).

function Initialize-BakeryPath {
  $paths = @(
    'C:\Program Files\Kubernetes\minikube',
    'C:\Program Files\Docker\Docker\resources\bin'
  )
  foreach ($p in $paths) {
    if ((Test-Path $p) -and ($env:Path -notlike "*$p*")) {
      $env:Path = "$p;$env:Path"
    }
  }

  Remove-Item Env:MINIKUBE_ACTIVE_DOCKERD -ErrorAction SilentlyContinue
  Remove-Item Env:DOCKER_HOST -ErrorAction SilentlyContinue
  Remove-Item Env:DOCKER_CERT_PATH -ErrorAction SilentlyContinue
  Remove-Item Env:DOCKER_TLS_VERIFY -ErrorAction SilentlyContinue
}

function Get-RepoRoot {
  return (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
}

function Assert-Command($name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "Required command not found: $name"
  }
}

function Wait-BakeryPodsReady {
  param(
    [string]$Namespace = 'bakery-shop',
    [int]$TimeoutSeconds = 240
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  do {
    $pods = kubectl get pods -n $Namespace -o json | ConvertFrom-Json
    $items = @($pods.items)
    if ($items.Count -eq 0) {
      Start-Sleep -Seconds 3
      continue
    }

    $notReady = @($items | Where-Object {
      $_.status.phase -ne 'Running' -or
      (@($_.status.containerStatuses | Where-Object { -not $_.ready })).Count -gt 0
    })

    if ($notReady.Count -eq 0) {
      Write-Host "All pods Ready in namespace $Namespace"
      return
    }

    Write-Host ("Waiting for Ready pods... ({0} not ready)" -f $notReady.Count)
    Start-Sleep -Seconds 5
  } while ((Get-Date) -lt $deadline)

  kubectl get pods -n $Namespace
  throw "Timed out waiting for bakery-shop pods to become Ready."
}

function Get-FirstReadyPodName {
  param(
    [Parameter(Mandatory = $true)][string]$Namespace,
    [Parameter(Mandatory = $true)][string]$App
  )

  $json = kubectl get pods -n $Namespace -l "app=$App" -o json | ConvertFrom-Json
  $pod = @($json.items | Where-Object {
    $_.status.phase -eq 'Running' -and
    (@($_.status.containerStatuses | Where-Object { $_.ready })).Count -gt 0
  } | Select-Object -First 1)

  if (-not $pod) {
    throw "No Ready pod found for app=$App in namespace $Namespace"
  }

  return [string]$pod.metadata.name
}

function Invoke-KubectlCapture {
  param([Parameter(Mandatory = $true)][scriptblock]$Script)

  # Windows PowerShell wraps kubectl stderr as ErrorRecords; with $ErrorActionPreference=Stop
  # that aborts even when the command succeeds. Capture as plain text instead.
  $prev = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
    $out = & $Script 2>&1 | ForEach-Object { "$_" }
    return ($out -join "`n")
  } finally {
    $ErrorActionPreference = $prev
  }
}

function Copy-TextToPod {
  param(
    [Parameter(Mandatory = $true)][string]$Namespace,
    [Parameter(Mandatory = $true)][string]$Pod,
    [Parameter(Mandatory = $true)][string]$RemoteFile,
    [Parameter(Mandatory = $true)][string]$Content
  )

  # Avoid `kubectl cp` with Windows absolute paths (C:\... is parsed as host:path).
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($Content)
  $b64 = [Convert]::ToBase64String($bytes)
  $errors = New-Object System.Collections.Generic.List[string]

  $writeCmd = "printf '%s' '$b64' | base64 -d > '$RemoteFile'"
  $out = Invoke-KubectlCapture -Script { kubectl exec -n $Namespace $Pod -- sh -c $writeCmd }
  if ($LASTEXITCODE -eq 0) { return }
  $errors.Add("sh/base64: $out")

  $pyOneLiner = "import base64,pathlib; pathlib.Path('$RemoteFile').write_bytes(base64.b64decode('$b64'))"
  $out = Invoke-KubectlCapture -Script { kubectl exec -n $Namespace $Pod -- python -c $pyOneLiner }
  if ($LASTEXITCODE -eq 0) { return }
  $errors.Add("python: $out")

  $nodeOneLiner = "require('fs').writeFileSync('$RemoteFile', Buffer.from('$b64','base64'))"
  $out = Invoke-KubectlCapture -Script { kubectl exec -n $Namespace $Pod -- node -e $nodeOneLiner }
  if ($LASTEXITCODE -eq 0) { return }
  $errors.Add("node: $out")

  throw ("Failed to upload probe script to pod {0}:`n{1}" -f $Pod, ($errors -join "`n"))
}

function Invoke-InClusterHttpProbe {
  param(
    [Parameter(Mandatory = $true)][string]$Namespace,
    [Parameter(Mandatory = $true)][string]$RunnerApp,
    [Parameter(Mandatory = $true)][ValidateSet('node', 'python')][string]$RunnerRuntime,
    [Parameter(Mandatory = $true)][string]$Url,
    [Parameter(Mandatory = $true)][int]$Count
  )

  $pod = Get-FirstReadyPodName -Namespace $Namespace -App $RunnerApp

  if ($RunnerRuntime -eq 'python') {
    $remoteFile = '/tmp/bakery_probe.py'
    $code = @"
import collections
import json
import urllib.error
import urllib.request

url = '$Url'
count = $Count
counts = collections.Counter()
ok = 0
fail = 0

for _ in range(count):
    try:
        with urllib.request.urlopen(url, timeout=3) as response:
            payload = json.load(response)
        if payload.get('status') == 'ok':
            ok += 1
            counts[str(payload.get('instance') or 'unknown')] += 1
        else:
            fail += 1
    except Exception:
        fail += 1

print('__SUMMARY__ ok=%d fail=%d' % (ok, fail))
print('__COUNTS__ %s' % json.dumps(dict(counts)))
"@
    Copy-TextToPod -Namespace $Namespace -Pod $pod -RemoteFile $remoteFile -Content $code
    return (Invoke-KubectlCapture -Script {
      kubectl exec -n $Namespace $pod -- python $remoteFile
    })
  }

  $remoteFile = '/tmp/bakery_probe.js'
  $code = @"
const url = '$Url';
const count = $Count;
const counts = {};
let ok = 0;
let fail = 0;

(async () => {
  for (let i = 0; i < count; i += 1) {
    try {
      const response = await fetch(url);
      const payload = await response.json();
      if (payload && payload.status === 'ok') {
        ok += 1;
        const instance = String(payload.instance || 'unknown');
        counts[instance] = (counts[instance] || 0) + 1;
      } else {
        fail += 1;
      }
    } catch (error) {
      fail += 1;
    }
  }
  console.log('__SUMMARY__ ok=' + ok + ' fail=' + fail);
  console.log('__COUNTS__ ' + JSON.stringify(counts));
})();
"@
  Copy-TextToPod -Namespace $Namespace -Pod $pod -RemoteFile $remoteFile -Content $code
  return (Invoke-KubectlCapture -Script {
    kubectl exec -n $Namespace $pod -- node $remoteFile
  })
}

function Parse-ProbeOutput {
  param([Parameter(Mandatory = $true)][string]$Raw)

  $ok = 0
  $fail = 0
  $counts = @{}
  $summarySeen = $false

  foreach ($line in ($Raw -split "`r?`n")) {
    $trim = $line.Trim()
    if ($trim -match '^__SUMMARY__ ok=(\d+) fail=(\d+)$') {
      $ok = [int]$Matches[1]
      $fail = [int]$Matches[2]
      $summarySeen = $true
      continue
    }

    if ($trim -match '^__COUNTS__\s+(\{.*\})$') {
      try {
        $json = $Matches[1] | ConvertFrom-Json
        foreach ($prop in $json.PSObject.Properties) {
          $counts[$prop.Name] = [int]$prop.Value
        }
      } catch {
        # ignore
      }
    }
  }

  if (-not $summarySeen) {
    return $null
  }

  return [pscustomobject]@{
    Ok = $ok
    Fail = $fail
    Counts = $counts
    Raw = $Raw
  }
}
