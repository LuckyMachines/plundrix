$ErrorActionPreference = 'Stop'

function Test-PortListening {
  param([int]$Port)
  return [bool](Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue)
}

function Get-FreePort {
  param([int]$StartPort, [int]$EndPort = 65535)
  for ($port = $StartPort; $port -le $EndPort; $port++) {
    if (-not (Test-PortListening -Port $port)) {
      return $port
    }
  }
  throw "No free port found in range $StartPort-$EndPort."
}

$requestedPort = [Environment]::GetEnvironmentVariable('ANVIL_PORT')
if ($requestedPort) {
  $anvilPort = [int]$requestedPort
} else {
  $anvilPort = Get-FreePort -StartPort 18645
}

$anvilExe = (Get-Command anvil.exe -ErrorAction Stop).Source
Write-Output "Starting anvil on port $anvilPort"
Write-Output "RPC_URL=http://127.0.0.1:$anvilPort"

& $anvilExe --port "$anvilPort"
