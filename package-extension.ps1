Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem

$root = $PSScriptRoot
$source = Join-Path $root "extension"
$downloadZip = Join-Path $root "frontend\public\coop-tracker-sync.zip"
$distDir = Join-Path $root "dist"
$version = (Get-Content (Join-Path $source "manifest.json") -Raw | ConvertFrom-Json).version
$storeZip = Join-Path $distDir "coop-tracker-sync-$version-store.zip"
New-Item -ItemType Directory -Force $distDir | Out-Null

$files = Get-ChildItem $source -Recurse -File | Where-Object { $_.Name -ne "make-icons.js" }

function New-ExtensionZip($zipPath, $prefix) {
  if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
  $zip = [System.IO.Compression.ZipFile]::Open($zipPath, "Create")
  try {
    foreach ($file in $files) {
      $relative = $file.FullName.Substring($source.Length + 1).Replace("\", "/")
      [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $file.FullName, "$prefix$relative") | Out-Null
    }
  } finally {
    $zip.Dispose()
  }
}

New-ExtensionZip $downloadZip "coop-tracker-sync/"
New-ExtensionZip $storeZip ""

Write-Output "Download zip (for Load unpacked): $downloadZip"
Write-Output "Store zip (for Edge Add-ons):      $storeZip"
