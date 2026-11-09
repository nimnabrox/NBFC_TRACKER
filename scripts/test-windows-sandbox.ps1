param([string]$ExePath = 'dist/release/NBFC TRACKER.exe')
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$probeRoot = Join-Path $projectRoot ('dist\sandbox-probe-' + [Guid]::NewGuid().ToString('N'))
$inputFolder = Join-Path $probeRoot 'input'
$outputFolder = Join-Path $probeRoot 'output'
$null = New-Item -ItemType Directory -Path $inputFolder,$outputFolder
Copy-Item -LiteralPath (Join-Path $projectRoot $ExePath) -Destination (Join-Path $inputFolder 'NBFC.TRACKER.exe')
$safeInput = [System.Security.SecurityElement]::Escape($inputFolder)
$safeOutput = [System.Security.SecurityElement]::Escape($outputFolder)
$configuration = @"
<Configuration>
  <Networking>Disable</Networking><ClipboardRedirection>Disable</ClipboardRedirection><VGpu>Disable</VGpu>
  <MappedFolders>
    <MappedFolder><HostFolder>$safeInput</HostFolder><SandboxFolder>C:\Input</SandboxFolder><ReadOnly>true</ReadOnly></MappedFolder>
    <MappedFolder><HostFolder>$safeOutput</HostFolder><SandboxFolder>C:\Output</SandboxFolder><ReadOnly>false</ReadOnly></MappedFolder>
  </MappedFolders>
  <LogonCommand><Command>powershell.exe -NoProfile -Command "Start-Process -FilePath 'C:\Input\NBFC.TRACKER.exe' -ArgumentList '--diagnose --diagnose-output C:\Output\diagnostics.json' -Wait; Set-Content -Path C:\Output\finished.txt -Value complete"</Command></LogonCommand>
</Configuration>
"@
$configPath = Join-Path $probeRoot 'probe.wsb'
$configuration | Set-Content -LiteralPath $configPath -Encoding UTF8
$process = Start-Process -FilePath 'WindowsSandbox.exe' -ArgumentList ('"' + $configPath + '"') -WindowStyle Hidden -PassThru
$process.Id | Set-Content -LiteralPath (Join-Path $probeRoot 'process-id.txt')
Write-Output ('Sandbox process: ' + $process.Id)
Write-Output ('Sandbox output: ' + $outputFolder)
