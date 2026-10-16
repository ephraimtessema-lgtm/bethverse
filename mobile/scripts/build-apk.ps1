# Build Flutter APK. Uses short paths (no spaces) — required when Windows username has a space.
$ErrorActionPreference = "Stop"

function Get-ShortPath([string]$path) {
  if (-not (Test-Path $path)) { return $path }
  $fso = New-Object -ComObject Scripting.FileSystemObject
  return $fso.GetFolder((Resolve-Path $path).Path).ShortPath
}

$realMobile = Split-Path $PSScriptRoot -Parent
$realFlutter = "$env:USERPROFILE\Downloads\flutter_windows_3.44.1-stable\flutter"
$realSdk = "$env:LOCALAPPDATA\Android\Sdk"
$realPubCache = "$env:LOCALAPPDATA\Pub\Cache"

$mobile = Get-ShortPath $realMobile
$flutter = Join-Path (Get-ShortPath $realFlutter) "bin\flutter.bat"

if (-not (Test-Path $flutter)) {
  Write-Host "Flutter not found at $realFlutter" -ForegroundColor Red
  exit 1
}

$ndkOk = Get-ChildItem "$realSdk\ndk" -Directory -ErrorAction SilentlyContinue |
  Where-Object { Test-Path (Join-Path $_.FullName "source.properties") } |
  Select-Object -First 1
if (-not $ndkOk) {
  Write-Host "NDK not installed. Android Studio -> SDK Manager -> SDK Tools -> NDK -> Apply" -ForegroundColor Red
  exit 1
}

$env:PUB_CACHE = Get-ShortPath $realPubCache
$env:ANDROID_HOME = Get-ShortPath $realSdk
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME

Write-Host "Building from $mobile" -ForegroundColor Cyan
Write-Host "(Short paths fix the 'Eph Tess' space bug in Flutter)" -ForegroundColor DarkGray

$devMode = Get-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\AppModelUnlock" -Name AllowDevelopmentWithoutDevLicense -ErrorAction SilentlyContinue
if (-not $devMode -or $devMode.AllowDevelopmentWithoutDevLicense -ne 1) {
  Write-Host ""
  Write-Host "Developer Mode must be ON (Settings -> Privacy -> For developers)." -ForegroundColor Red
  Write-Host "Run: start ms-settings:developers" -ForegroundColor Yellow
  exit 1
}

Write-Host "First build: 10-20 minutes..." -ForegroundColor Cyan

Set-Location $mobile
& $flutter clean 2>&1 | Out-Null
& $flutter pub get
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

& $flutter build apk --release
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$dist = Join-Path $realMobile "dist"
New-Item -ItemType Directory -Path $dist -Force | Out-Null
$out = Join-Path $dist "bethverse-flutter.apk"
Copy-Item (Join-Path $mobile "build\app\outputs\flutter-apk\app-release.apk") $out -Force

Write-Host ""
Write-Host "DONE. APK:" -ForegroundColor Green
Write-Host $out
