# Installs Android SDK command-line tools and NDK (fixes incomplete NDK / missing sdkmanager).
$ErrorActionPreference = "Stop"
$sdk = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { Join-Path $env:LOCALAPPDATA "Android\Sdk" }
$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = $sdk

Write-Host "Android SDK: $sdk"

$badNdk = Join-Path $sdk "ndk\26.1.10909125"
if ((Test-Path $badNdk) -and -not (Test-Path (Join-Path $badNdk "source.properties"))) {
  Write-Host "Removing incomplete NDK..."
  Remove-Item $badNdk -Recurse -Force
}

$cmdlineLatest = Join-Path $sdk "cmdline-tools\latest\bin\sdkmanager.bat"
if (-not (Test-Path $cmdlineLatest)) {
  Write-Host "Downloading Android command-line tools..."
  $zip = Join-Path $env:TEMP "android-cmdline-tools.zip"
  $url = "https://dl.google.com/android/repository/commandlinetools-win-13114758_latest.zip"
  if (-not (Test-Path $zip)) {
    Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing
  }
  $extract = Join-Path $env:TEMP "android-cmdline-extract"
  if (Test-Path $extract) { Remove-Item $extract -Recurse -Force }
  Expand-Archive -Path $zip -DestinationPath $extract -Force

  $sdkmgr = Get-ChildItem $extract -Recurse -Filter "sdkmanager.bat" | Select-Object -First 1
  if (-not $sdkmgr) { throw "sdkmanager.bat not found in downloaded zip" }

  $binDir = $sdkmgr.Directory.FullName
  $toolRoot = Split-Path $binDir -Parent
  $dest = Join-Path $sdk "cmdline-tools\latest"
  if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
  New-Item -ItemType Directory -Path $dest -Force | Out-Null
  Copy-Item -Path (Join-Path $toolRoot "*") -Destination $dest -Recurse -Force
  Write-Host "Command-line tools installed to $dest"
}

if (-not (Test-Path $cmdlineLatest)) {
  throw "sdkmanager not found at $cmdlineLatest"
}

Write-Host "Installing NDK and build packages (may take several minutes)..."
$packages = @(
  "platform-tools",
  "platforms;android-35",
  "build-tools;35.0.0",
  "ndk;26.1.10909125"
)
foreach ($p in $packages) {
  Write-Host "  -> $p"
  & $cmdlineLatest $p --sdk_root=$sdk
}

Write-Host "Accepting SDK licenses..."
$yes = ("y`n" * 50)
$yes | & $cmdlineLatest --licenses --sdk_root=$sdk 2>&1 | Out-Null

$props = Join-Path $sdk "ndk\26.1.10909125\source.properties"
if (-not (Test-Path $props)) {
  throw "NDK install failed: source.properties still missing."
}
Write-Host "OK: NDK installed."
