param([string]$ExePath = 'dist/release/NBFC TRACKER.exe')
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$source = (Resolve-Path -LiteralPath (Join-Path $projectRoot $ExePath)).Path
$probeFolder = Join-Path $projectRoot ('dist\portable-probe-' + [Guid]::NewGuid().ToString('N'))
$null = New-Item -ItemType Directory -Path $probeFolder
$probeExe = Join-Path $probeFolder 'NBFC.TRACKER.exe'
Copy-Item -LiteralPath $source -Destination $probeExe
$reportPath = Join-Path $probeFolder 'diagnostics.json'
$savedRoot = $env:DOTNET_ROOT
$savedLookup = $env:DOTNET_MULTILEVEL_LOOKUP
try {
    $env:DOTNET_ROOT = Join-Path $probeFolder 'no-shared-runtime'
    $env:DOTNET_MULTILEVEL_LOOKUP = '0'
    $process = Start-Process -FilePath $probeExe -WorkingDirectory $probeFolder -ArgumentList @('--diagnose','--diagnose-output',('"' + $reportPath + '"')) -PassThru -Wait -WindowStyle Hidden
    if ($process.ExitCode -ne 0) { throw ('Portable executable failed with exit code ' + $process.ExitCode) }
    $report = Get-Content -LiteralPath $reportPath -Raw | ConvertFrom-Json
    if (!$report.success -or !$report.embeddedUi -or !$report.allLanguagesEmbedded) { throw 'Embedded dependencies are incomplete.' }
    $dlls = @(Get-ChildItem -LiteralPath $probeFolder -Filter '*.dll')
    if ($dlls.Count) { throw 'Probe unexpectedly depended on adjacent DLLs.' }
    Write-Output 'PASS Standalone EXE starts from an empty folder with shared .NET lookup disabled.'
    Write-Output ('PASS Embedded UI and all 18 languages; startup mode: ' + $report.startupMode)
    Write-Output ('Report: ' + $reportPath)
} finally {
    $env:DOTNET_ROOT = $savedRoot
    $env:DOTNET_MULTILEVEL_LOOKUP = $savedLookup
}
