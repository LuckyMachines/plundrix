$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$app = Join-Path $root 'app'
$pidFile = Join-Path $root '.local-dev-pids.json'
$anvilLog = Join-Path $root 'anvil.log'
$anvilErr = Join-Path $root 'anvil.err.log'
$viteLog = Join-Path $app 'vite.log'
$viteErr = Join-Path $app 'vite.err.log'

function Test-PortListening {
  param([int]$Port)
  return [bool](Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue)
}

function Get-FreePort {
  param(
    [int]$StartPort,
    [int]$EndPort = 65535
  )

  for ($port = $StartPort; $port -le $EndPort; $port++) {
    if (-not (Test-PortListening -Port $port)) {
      return $port
    }
  }

  throw "No free port found in range $StartPort-$EndPort."
}

function Wait-ForAnvil {
  param([int]$Port)
  $url = "http://127.0.0.1:$Port"
  for ($i = 0; $i -lt 30; $i++) {
    try {
      $body = '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
      $resp = Invoke-RestMethod -Uri $url -Method Post -ContentType 'application/json' -Body $body -TimeoutSec 2
      if ($resp.result) { return $true }
    } catch {}
    Start-Sleep -Milliseconds 500
  }
  return $false
}

function Wait-ForHttp {
  param([int]$Port)
  $urls = @("http://localhost:$Port", "http://127.0.0.1:$Port")
  for ($i = 0; $i -lt 40; $i++) {
    foreach ($url in $urls) {
      try {
        $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2
        if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 500) { return $true }
      } catch {}
    }
    Start-Sleep -Milliseconds 500
  }
  return $false
}

function Resolve-Port {
  param(
    [string]$EnvVar,
    [int]$DefaultStart,
    [int]$AvoidPort = 0
  )

  $requested = [Environment]::GetEnvironmentVariable($EnvVar)
  if ($requested) {
    $parsed = [int]$requested
    if ($parsed -eq $AvoidPort) {
      throw "$EnvVar cannot match reserved port $AvoidPort."
    }
    return $parsed
  }

  $candidate = Get-FreePort -StartPort $DefaultStart
  if ($candidate -eq $AvoidPort) {
    return Get-FreePort -StartPort ($candidate + 1)
  }
  return $candidate
}

if (Test-Path $pidFile) {
  Remove-Item -Force $pidFile
}

$anvilPort = Resolve-Port -EnvVar 'ANVIL_PORT' -DefaultStart 18645
$vitePort = Resolve-Port -EnvVar 'VITE_PORT' -DefaultStart 18646 -AvoidPort $anvilPort

$anvilPid = $null
$vitePid = $null

if (-not (Test-PortListening -Port $anvilPort)) {
  $anvilExe = (Get-Command anvil.exe -ErrorAction Stop).Source
  $anvilProc = Start-Process `
    -FilePath $anvilExe `
    -ArgumentList @('--port', "$anvilPort") `
    -WorkingDirectory $root `
    -WindowStyle Hidden `
    -RedirectStandardOutput $anvilLog `
    -RedirectStandardError $anvilErr `
    -PassThru
  $anvilPid = $anvilProc.Id
}

if (-not (Wait-ForAnvil -Port $anvilPort)) {
  throw "Anvil failed to start on $anvilPort."
}

$anvilRpcUrl = "http://127.0.0.1:$anvilPort"

Push-Location $root
try {
  $env:ANVIL_RPC_URL = $anvilRpcUrl
  node scripts/deploy-local.mjs | Out-Host
} finally {
  Pop-Location
}

if (-not (Test-PortListening -Port $vitePort)) {
  $npmCmd = (Get-Command npm.cmd -ErrorAction Stop).Source
  $viteProc = Start-Process `
    -FilePath $npmCmd `
    -ArgumentList @('run', 'dev', '--', '--port', "$vitePort") `
    -WorkingDirectory $app `
    -WindowStyle Hidden `
    -RedirectStandardOutput $viteLog `
    -RedirectStandardError $viteErr `
    -PassThru
  $vitePid = $viteProc.Id
}

if (-not (Wait-ForHttp -Port $vitePort)) {
  throw "Vite failed to start on $vitePort."
}

$contractAddress = ''
$envLocal = Join-Path $app '.env.local'
if (Test-Path $envLocal) {
  $line = Get-Content $envLocal | Where-Object { $_ -like 'VITE_CONTRACT_ADDRESS=*' } | Select-Object -First 1
  if ($line) { $contractAddress = $line.Split('=')[1] }
}

$pidPayload = @{
  anvil_pid = $anvilPid
  vite_pid = $vitePid
  anvil_port = $anvilPort
  vite_port = $vitePort
  anvil_rpc_url = $anvilRpcUrl
} | ConvertTo-Json
$pidPayload | Set-Content $pidFile

Write-Host "ANVIL_PORT=$anvilPort"
Write-Host "ANVIL_RPC_URL=$anvilRpcUrl"
Write-Host "VITE_PORT=$vitePort"
Write-Host "APP_URL=http://localhost:$vitePort"
if ($contractAddress) { Write-Host "CONTRACT_ADDRESS=$contractAddress" }
if ($anvilPid) { Write-Host "ANVIL_PID=$anvilPid" }
if ($vitePid) { Write-Host "VITE_PID=$vitePid" }
Write-Host "ANVIL_LOG=$anvilLog"
Write-Host "VITE_LOG=$viteLog"
