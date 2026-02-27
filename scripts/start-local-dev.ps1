$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$app = Join-Path $root 'app'
$anvilPort = 18645
$vitePort = 18646
$pidFile = Join-Path $root '.local-dev-pids.json'
$anvilLog = Join-Path $root 'anvil.log'
$anvilErr = Join-Path $root 'anvil.err.log'
$viteLog = Join-Path $app 'vite.log'
$viteErr = Join-Path $app 'vite.err.log'

function Test-PortListening {
  param([int]$Port)
  return [bool](Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue)
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
  $url = "http://127.0.0.1:$Port"
  for ($i = 0; $i -lt 40; $i++) {
    try {
      $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2
      if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 500) { return $true }
    } catch {}
    Start-Sleep -Milliseconds 500
  }
  return $false
}

if (Test-Path $pidFile) {
  Remove-Item -Force $pidFile
}

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

Push-Location $root
try {
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
} | ConvertTo-Json
$pidPayload | Set-Content $pidFile

Write-Output "ANVIL_PORT=$anvilPort"
Write-Output "VITE_PORT=$vitePort"
Write-Output "APP_URL=http://127.0.0.1:$vitePort"
if ($contractAddress) { Write-Output "CONTRACT_ADDRESS=$contractAddress" }
if ($anvilPid) { Write-Output "ANVIL_PID=$anvilPid" }
if ($vitePid) { Write-Output "VITE_PID=$vitePid" }
Write-Output "ANVIL_LOG=$anvilLog"
Write-Output "VITE_LOG=$viteLog"
