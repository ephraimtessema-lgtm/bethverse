# Builds Expo + Flutter APKs after Android Studio / SDK is set up.
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$sdk = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { Join-Path $env:LOCALAPPDATA "Android\Sdk" }
$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = $sdk

$ndkProps = Join-Path $sdk "ndk\26.1.10909125\source.properties"
if (-not (Test-Path $ndkProps)) {
  Write-Host "NDK not ready. In Android Studio:" -ForegroundColor Yellow
  Write-Host "  Settings -> Android SDK -> SDK Tools -> NDK (Side by side) -> Apply"
  Write-Host "Then run this script again."
  exit 1
}

Write-Host "=== Expo APK ===" -ForegroundColor Cyan
Set-Location (Join-Path $root "expo-app")
if (-not (Test-Path "node_modules")) { npm install }
npm run build:apk
Write-Host "Expo APK: $root\expo-app\dist\bethverse.apk" -ForegroundColor Green

$flutter = Get-Command flutter -ErrorAction SilentlyContinue
if (-not $flutter) {
  $candidate = "$env:USERPROFILE\Downloads\flutter_windows_3.44.1-stable\flutter\bin\flutter.bat"
  if (Test-Path $candidate) { $flutter = $candidate }
}
if ($flutter) {
  Write-Host ""
  Write-Host "=== Flutter APK ===" -ForegroundColor Cyan
  Set-Location (Join-Path $root "mobile")
  & $flutter pub get
  & $flutter build apk --release
  $dist = Join-Path $root "mobile\dist"
  New-Item -ItemType Directory -Path $dist -Force | Out-Null
  Copy-Item (Join-Path $root "mobile\build\app\outputs\flutter-apk\app-release.apk") (Join-Path $dist "bethverse-flutter.apk") -Force
  Write-Host "Flutter APK: $dist\bethverse-flutter.apk" -ForegroundColor Green
} else {
  Write-Host "Flutter not in PATH — skip Flutter APK or add Flutter to PATH." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Copy the .apk file(s) to your phone and open to install." -ForegroundColor Green
