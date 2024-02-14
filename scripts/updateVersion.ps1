$packageJsonFilePath = Join-Path $PSScriptRoot "../package.json"
$packageJson = Get-Content $packageJsonFilePath -Raw | ConvertFrom-Json
$version = $packageJson.version
Write-Information "Updating version to $version"
$constantsFilePath = Join-Path $PSScriptRoot "../utils/version.ts"
Write-Output "export const coreVersion = `"$version`";" | Set-Content $constantsFilePath -Verbose