$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$pidFile = Join-Path $root '.local-dev-pids.json'
$knownPorts = @(18645, 18646)

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
  $conns = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue
  foreach ($conn in $conns) {
    Stop-IfRunning -PidValue $conn.OwningProcess
  }
}

if (Test-Path $pidFile) {
  $json = Get-Content $pidFile -Raw | ConvertFrom-Json
  Stop-IfRunning -PidValue $json.vite_pid
  Stop-IfRunning -PidValue $json.anvil_pid
  Remove-Item -Force $pidFile
  Write-Output 'Stopped local dev services from pid file.'
}

foreach ($port in $knownPorts) {
  Stop-ByPort -Port $port
}

if (-not (Test-Path $pidFile)) {
  Write-Output 'Local dev cleanup complete.'
}
