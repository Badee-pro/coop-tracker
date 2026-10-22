$ErrorActionPreference = "Stop"

$root = $PSScriptRoot
$frontend = Join-Path $root "frontend"
$remote = (git -C $root remote get-url origin).Trim()
$source = (git -C $root rev-parse --short HEAD).Trim()
$staging = Join-Path $env:TEMP "coop-tracker-site"

Push-Location $frontend
try {
  npm run lint
  if ($LASTEXITCODE -ne 0) { throw "Lint failed" }
  npm run build:web
  if ($LASTEXITCODE -ne 0) { throw "Build failed" }
} finally {
  Pop-Location
}

Remove-Item $staging -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item (Join-Path $frontend "dist") $staging -Recurse
New-Item -ItemType File (Join-Path $staging ".nojekyll") -Force | Out-Null

Push-Location $staging
try {
  git init -q -b gh-pages
  git config user.name (git -C $root config user.name)
  git config user.email (git -C $root config user.email)
  git add -A
  git commit -q -m "Publish site from $source"
  git push -q --force $remote gh-pages
  if ($LASTEXITCODE -ne 0) { throw "Push failed" }
} finally {
  Pop-Location
  Remove-Item $staging -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Output "Published https://badee-pro.github.io/coop-tracker/ from $source"
