# Generates Flutter platform folders and fetches packages.
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)

if (-not (Get-Command flutter -ErrorAction SilentlyContinue)) {
    Write-Host "Flutter is not installed. Install from https://docs.flutter.dev/get-started/install"
    exit 1
}

flutter create . --project-name bethverse
flutter pub get
Write-Host "Done. Run: flutter run"
