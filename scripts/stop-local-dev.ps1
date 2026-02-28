$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$pidFile = Join-Path $root '.local-dev-pids.json'

function Stop-IfRunning {
  param([int]$PidValue)
  if (-not $PidValue) { return }
  $proc = Get-Process -Id $PidValue -ErrorAction SilentlyContinue
  if ($proc) {
    Stop-Process -Id $PidValue -Force -ErrorAction SilentlyContinue
    Write-Output "Stopped PID $PidValue"
  }
}

function Stop-ByPort {
  param([int]$Port)
  if (-not $Port) { return }
  $conns = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue
  foreach ($conn in $conns) {
    Stop-IfRunning -PidValue $conn.OwningProcess
  }
}

if (-not (Test-Path $pidFile)) {
  Write-Output 'No local dev pid file found for this project.'
  return
}

$json = Get-Content $pidFile -Raw | ConvertFrom-Json
Stop-IfRunning -PidValue $json.vite_pid
Stop-IfRunning -PidValue $json.anvil_pid
Stop-ByPort -Port $json.vite_port
Stop-ByPort -Port $json.anvil_port

Remove-Item -Force $pidFile
Write-Output 'Stopped local dev services from pid file.'
