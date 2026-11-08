$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$releaseSource = Join-Path $projectRoot 'dist\release\NBFC TRACKER.exe'
if (!(Test-Path -LiteralPath $releaseSource)) { throw 'Build the release first.' }
foreach ($relativeTarget in @('v3\NBFC TRACKER.exe', 'NBFC TRACKER.exe')) {
    $releaseTarget = Join-Path $projectRoot $relativeTarget
    try {
        Copy-Item -LiteralPath $releaseSource -Destination $releaseTarget -Force
    } catch [System.IO.IOException] {
        # Windows allows renaming a running executable. Preserve it until the user closes it.
        $backupName = 'NBFC TRACKER.previous-' + (Get-Date -Format 'yyyyMMddHHmmssfff') + '.exe'
        $backupTarget = Join-Path (Split-Path -Parent $releaseTarget) $backupName
        Move-Item -LiteralPath $releaseTarget -Destination $backupTarget
        Copy-Item -LiteralPath $releaseSource -Destination $releaseTarget
    }
    Write-Output ('Updated ' + $relativeTarget)
}
