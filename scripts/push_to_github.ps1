# Push OmniResolve to your GitHub Account (@h4ckf0r0day)
param(
  [string]$RemoteUrl = "https://github.com/h4ckf0r0day/OmniResolve-Meko.git"
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " OmniResolve // Push to GitHub (@h4ckf0r0day)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Check if git is available
$gitCmd = Get-Command git -ErrorAction SilentlyContinue

if ($gitCmd) {
  Write-Host "[+] Using system git CLI..." -ForegroundColor Green
  git remote set-url origin $RemoteUrl
  git branch -M main
  git push -u origin main
} else {
  Write-Host "[!] Git CLI was not detected in system PATH." -ForegroundColor Yellow
  Write-Host "To push this repository to GitHub, you can:" -ForegroundColor Yellow
  Write-Host "  1. Install Git from https://git-scm.com/download/win" -ForegroundColor White
  Write-Host "  2. Or open GitHub Desktop and click 'Add Existing Repository' -> select this directory" -ForegroundColor White
  Write-Host "  3. Or run: git push -u origin main" -ForegroundColor White
}

