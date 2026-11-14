param([switch]$FinalChecks)
$ErrorActionPreference = 'Stop'
$projectRoot = 'K:\ANTIGRAVITY\HABILIDADES\TEXT ANIMATION AUTOMATION'
if ((Get-Location).Path -ne $projectRoot) { throw 'Incorrect cwd' }
$cursor = Get-Item -LiteralPath $projectRoot
while ($null -ne $cursor) {
    if ($cursor.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw "Reparse ancestor: $($cursor.FullName)" }
    $cursor = $cursor.Parent
}
$runtimeRoot = Join-Path $projectRoot '.automation-runtime'
$evidenceRoot = Join-Path $projectRoot 'docs/automation/evidence/N00'
$prefix = if ($FinalChecks) { 'final' } else { 'controlled' }
$externalCandidates = @($env:TEMP, $env:TMP, (Join-Path $env:LOCALAPPDATA 'npm-cache'), (Join-Path $env:LOCALAPPDATA 'next-swc'), (Join-Path $env:LOCALAPPDATA 'electron/Cache'), (Join-Path $env:LOCALAPPDATA 'electron-builder/Cache')) | Select-Object -Unique
function Snapshot-External {
    foreach ($candidate in $externalCandidates) {
        [pscustomobject]@{path=$candidate;exists=(Test-Path -LiteralPath $candidate);children=@(if (Test-Path -LiteralPath $candidate) { Get-ChildItem -LiteralPath $candidate -Force | Select-Object Name,Length,LastWriteTimeUtc,Attributes })}
    }
}
$externalBefore = @(Snapshot-External)
$settings = [ordered]@{
    TEMP=(Join-Path $runtimeRoot 'temp'); TMP=(Join-Path $runtimeRoot 'tmp')
    NPM_CONFIG_CACHE=(Join-Path $runtimeRoot 'npm-cache')
    XDG_CACHE_HOME=(Join-Path $runtimeRoot 'tool-cache')
    LOCALAPPDATA=(Join-Path $runtimeRoot 'local-appdata')
    APPDATA=(Join-Path $runtimeRoot 'roaming-appdata')
    electron_config_cache=(Join-Path $runtimeRoot 'tool-cache/electron')
    ELECTRON_BUILDER_CACHE=(Join-Path $runtimeRoot 'tool-cache/electron-builder')
    NEXT_SWC_PATH=(Join-Path $runtimeRoot 'tool-cache/next-swc')
}
$routeRows = @()
foreach ($key in $settings.Keys) {
    $value = [IO.Path]::GetFullPath($settings[$key])
    if (-not $value.StartsWith($projectRoot + '\', [StringComparison]::OrdinalIgnoreCase)) { throw 'Outside root' }
    $existed = Test-Path -LiteralPath $value
    New-Item -ItemType Directory -Path $value -Force | Out-Null
    $cursor = Get-Item -LiteralPath $value
    while ($null -ne $cursor) {
        if ($cursor.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw "Reparse path: $value" }
        $cursor = $cursor.Parent
    }
    [Environment]::SetEnvironmentVariable($key, $value, 'Process')
    $routeRows += [pscustomobject]@{name=$key;path=$value;insideAutomation=$true;existsBeforeSetup=$existed;existsBeforeCommands=$true;existsAfter=$null}
}
$env:NEXT_TELEMETRY_DISABLED = '1'
$env:POWERSHELL_TELEMETRY_OPTOUT = '1'
$cache = (& npm.cmd config get cache | Out-String).Trim()
if ($LASTEXITCODE -ne 0 -or $cache -ne $settings.NPM_CONFIG_CACHE) { throw 'npm cache mismatch' }
$nodeInfo = & node -e 'console.log(JSON.stringify({version:process.version,tmpdir:require("os").tmpdir(),homedir:require("os").homedir(),cwd:process.cwd()}))' | ConvertFrom-Json
if ($nodeInfo.tmpdir -ne $settings.TEMP) { throw 'Node temp mismatch' }
$toolPaths = & node -e 'console.log(JSON.stringify({nextSwc:require("./node_modules/next/dist/lib/helpers/get-cache-directory.js").getCacheDirectory("next-swc",process.env.NEXT_SWC_PATH),remotionBrowser:require("./node_modules/@remotion/renderer/dist/browser/get-download-destination.js").getDownloadsCacheDir(),nextOutput:require("path").resolve(".next"),nextCache:require("path").resolve(".next/cache"),vitestCache:require("path").resolve("node_modules/.vite"),testOutputs:require("path").resolve("public/renders"),nodeCompileCache:require("path").join(require("os").tmpdir(),"node-compile-cache")}))' | ConvertFrom-Json
foreach ($property in $toolPaths.PSObject.Properties) {
    $value = $property.Value
    $inside = $value.StartsWith($projectRoot + '\', [StringComparison]::OrdinalIgnoreCase)
    if (-not $inside) { throw "External tooling path: $value" }
    $routeRows += [pscustomobject]@{name=$property.Name;path=$value;insideAutomation=$inside;existsBeforeSetup=(Test-Path -LiteralPath $value);existsBeforeCommands=(Test-Path -LiteralPath $value);existsAfter=$null}
}
$inputCommit = (& git rev-parse HEAD | Out-String).Trim()
$manifest = [ordered]@{kind=$prefix;startedAtUtc=[datetime]::UtcNow.ToString('o');inputCommit=$inputCommit;cwd=$projectRoot;paths=$routeRows;npmCacheEffective=$cache;node=$nodeInfo;npm=(& npm.cmd --version | Out-String).Trim();os=(Get-CimInstance Win32_OperatingSystem).Caption;HOME=$env:HOME;USERPROFILE=$env:USERPROFILE;homeInsideAutomation=$nodeInfo.homedir.StartsWith($projectRoot+'\');homeExistsBefore=(Test-Path -LiteralPath $nodeInfo.homedir);NEXT_TELEMETRY_DISABLED=$env:NEXT_TELEMETRY_DISABLED;historicalTempEvidence='UNKNOWN / NOT CAPTURED'}
$manifest | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $evidenceRoot "$prefix-environment-before.json")
$externalBefore | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $evidenceRoot "$prefix-external-before.json")
$commands = @()
if (-not $FinalChecks) { $commands += @{name='npm-ci';exe='npm.cmd';arguments=@('ci')} }
$commands += @(@{name='tests';exe='npm.cmd';arguments=@('run','test:editor')}, @{name='typescript';exe='node';arguments=@('node_modules/typescript/bin/tsc','--noEmit','--incremental','false')}, @{name='lint';exe='npm.cmd';arguments=@('run','lint')})
if (-not $FinalChecks) { $commands += @{name='build';exe='npm.cmd';arguments=@('run','build')} }
$results = @()
foreach ($command in $commands) {
    $start = [datetime]::UtcNow.ToString('o')
    $log = Join-Path $evidenceRoot "$prefix-$($command.name).txt"
    Write-Output "START $($command.name)"
    $commandArgs = $command.arguments
    & $command.exe @commandArgs *> $log
    $code = $LASTEXITCODE
    $results += [pscustomobject]@{command=($command.exe + ' ' + ($commandArgs -join ' '));exitCode=$code;startedAtUtc=$start;endedAtUtc=[datetime]::UtcNow.ToString('o');log=[IO.Path]::GetFileName($log)}
    $results | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $evidenceRoot "$prefix-commands.json")
    Write-Output "END $($command.name): $code"
    if ($code -ne 0) { throw "Check failed: $log" }
}
foreach ($row in $routeRows) { $row.existsAfter = Test-Path -LiteralPath $row.path }
$manifest.paths = $routeRows
$manifest.homeExistsAfter = Test-Path -LiteralPath $nodeInfo.homedir
$manifest.endedAtUtc = [datetime]::UtcNow.ToString('o')
$manifest | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $evidenceRoot "$prefix-environment-after.json")
$externalAfter = @(Snapshot-External)
$externalAfter | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $evidenceRoot "$prefix-external-after.json")
$externalComparison = foreach ($i in 0..($externalBefore.Count-1)) {
    [pscustomobject]@{path=$externalBefore[$i].path;unchanged=(($externalBefore[$i] | ConvertTo-Json -Depth 8 -Compress) -eq ($externalAfter[$i] | ConvertTo-Json -Depth 8 -Compress))}
}
$externalComparison | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $evidenceRoot "$prefix-external-comparison.json")
$externalChanges = foreach ($i in 0..($externalBefore.Count-1)) {
    $beforeChildren = @($externalBefore[$i].children)
    $afterChildren = @($externalAfter[$i].children)
    if ($beforeChildren.Count -gt 0 -and $afterChildren.Count -gt 0) {
        foreach ($delta in (Compare-Object $beforeChildren $afterChildren -Property Name,Length,LastWriteTimeUtc)) {
            [pscustomobject]@{root=$externalBefore[$i].path;name=$delta.Name;bytes=$delta.Length;lastWriteTimeUtc=$delta.LastWriteTimeUtc;side=$delta.SideIndicator;attribution='UNKNOWN - metadata only, no PID trace'}
        }
    }
}
@($externalChanges) | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $evidenceRoot "$prefix-external-deltas.json")
$baseline = Get-Content -Raw (Join-Path $evidenceRoot 'production-before.json') | ConvertFrom-Json
$productionRows = foreach ($entry in $baseline.files) {
    $item = Get-Item -LiteralPath (Join-Path $baseline.sourceRoot $entry.path)
    $hash = (Get-FileHash -LiteralPath $item.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
    [pscustomobject]@{path=$entry.path;unchanged=($hash -eq $entry.sha256 -and $item.Length -eq $entry.sizeBytes -and $item.LastWriteTimeUtc -eq [datetime]$entry.lastWriteTimeUtc);sha256=$hash}
}
$installerBaseline = Get-Content -Raw (Join-Path $evidenceRoot 'authoritative-installer.json') | ConvertFrom-Json
$installer = Get-Item -LiteralPath (Join-Path $baseline.sourceRoot $installerBaseline.path)
$installerHash = (Get-FileHash -LiteralPath $installer.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
$integrity = [ordered]@{checkedAtUtc=[datetime]::UtcNow.ToString('o');checked=$productionRows.Count;unchanged=@($productionRows | Where-Object unchanged).Count;differences=@($productionRows | Where-Object { -not $_.unchanged });installerSha256=$installerHash;installerUnchanged=($installerHash -eq $installerBaseline.sha256 -and $installer.Length -eq $installerBaseline.sizeBytes -and $installer.LastWriteTimeUtc -eq [datetime]$installerBaseline.lastWriteTimeUtc);lockHash=(Get-FileHash -LiteralPath (Join-Path $projectRoot 'package-lock.json') -Algorithm SHA256).Hash.ToLowerInvariant()}
$integrity | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $evidenceRoot "$prefix-production-integrity.json")
if ($integrity.unchanged -ne 258 -or -not $integrity.installerUnchanged) { throw 'Production integrity failure' }
Write-Output ($integrity | ConvertTo-Json -Depth 5)
