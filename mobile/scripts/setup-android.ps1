# One-time Android SDK fix for Flutter builds on this PC.
$ErrorActionPreference = "Stop"

$realSdk = Join-Path $env:LOCALAPPDATA "Android\Sdk"
$linkSdk = "C:\Android\Sdk"
$sdkmgr = Join-Path $realSdk "cmdline-tools\latest\bin\sdkmanager.bat"

Write-Host "=== BethVerse Flutter Android setup ===" -ForegroundColor Cyan

if (-not (Test-Path $realSdk)) {
  throw "Android SDK not found. Open Android Studio SDK Manager."
}

if (-not (Test-Path $linkSdk)) {
  Write-Host "Creating path without spaces: $linkSdk"
  cmd /c mklink /J "$linkSdk" "$realSdk" | Out-Null
  if (-not (Test-Path $linkSdk)) {
    Write-Host "Could not create $linkSdk - try PowerShell as Administrator." -ForegroundColor Yellow
  }
}

$sdk = if (Test-Path $linkSdk) { $linkSdk } else { $realSdk }
$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = $sdk
Write-Host "ANDROID_HOME=$sdk"

$ndkRoot = Join-Path $realSdk "ndk"
if (Test-Path $ndkRoot) {
  Get-ChildItem $ndkRoot -Directory | ForEach-Object {
    $props = Join-Path $_.FullName "source.properties"
    if (-not (Test-Path $props)) {
      Write-Host "Removing broken NDK: $($_.Name)"
      Remove-Item $_.FullName -Recurse -Force -ErrorAction SilentlyContinue
    }
  }
}

if (Test-Path $sdkmgr) {
  Write-Host "Installing NDK (several minutes)..."
  & $sdkmgr --install "ndk;28.2.13676358" "--sdk_root=$realSdk"
  Write-Host "Accepting licenses..."
  $yes = ("y`n" * 50)
  $yes | & $sdkmgr --licenses "--sdk_root=$realSdk" 2>&1 | Out-Null
} else {
  Write-Host "Open Android Studio: SDK Tools -> NDK (Side by side) -> Apply" -ForegroundColor Yellow
}

$ndkProps = Join-Path $realSdk "ndk\28.2.13676358\source.properties"
if (-not (Test-Path $ndkProps)) {
  Write-Host "NDK still missing. Use Android Studio SDK Manager to install NDK." -ForegroundColor Red
  exit 1
}

Write-Host "NDK OK. Android setup done." -ForegroundColor Green
