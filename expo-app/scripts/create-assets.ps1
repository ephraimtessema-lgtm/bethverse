# Creates default Expo assets from a temporary blank template.
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

if (-not (Test-Path "assets")) { New-Item -ItemType Directory -Path "assets" | Out-Null }

$tmp = Join-Path $env:TEMP "bethverse-expo-assets"
if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }

Write-Host "Creating temporary Expo template for assets..."
npx create-expo-app@latest $tmp --template blank --yes
Copy-Item "$tmp\assets\*" ".\assets\" -Recurse -Force
Remove-Item $tmp -Recurse -Force
Write-Host "Assets copied to expo-app/assets/"
