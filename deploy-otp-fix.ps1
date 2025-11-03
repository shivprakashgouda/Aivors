# Quick Deploy Script
# Fix OTP verification 500 error

Write-Host "`n🚀 Deploying OTP Verification Fix...`n" -ForegroundColor Cyan

# Navigate to project directory
Set-Location "c:\Users\Tanmay Bari\Videos\Aivors-main (1) OTP\Aivors-main"

# Check git status
Write-Host "📋 Checking git status..." -ForegroundColor Yellow
git status

# Add changes
Write-Host "`n📦 Adding changes..." -ForegroundColor Yellow
git add server/routes/auth.js

# Show what will be committed
Write-Host "`n📝 Changes to commit:" -ForegroundColor Yellow
git diff --cached --stat

# Commit
Write-Host "`n💾 Committing changes..." -ForegroundColor Yellow
git commit -m "Fix OTP verification 500 error - add detailed logging and make email/audit async"

# Push
Write-Host "`n📤 Pushing to GitHub..." -ForegroundColor Yellow
git push origin main

Write-Host "`n✅ Deploy initiated!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "  1. Go to Render Dashboard → Your Service → Logs" -ForegroundColor White
Write-Host "  2. Wait for auto-deploy to complete (~5 minutes)" -ForegroundColor White
Write-Host "  3. Test OTP verification again" -ForegroundColor White
Write-Host "  4. Check logs for detailed verification flow`n" -ForegroundColor White
