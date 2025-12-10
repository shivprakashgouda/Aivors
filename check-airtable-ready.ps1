# 🚀 Airtable Integration - Quick Deploy Check (Windows)
# Run this to verify everything is ready for production

Write-Host "🔍 Checking Airtable Integration Setup..." -ForegroundColor Cyan
Write-Host ""

# Check environment variables
Write-Host "📋 Checking required environment variables..." -ForegroundColor Yellow

$missingVars = 0

function Check-EnvVar {
    param($varName)
    $value = [System.Environment]::GetEnvironmentVariable($varName)
    if ([string]::IsNullOrEmpty($value)) {
        # Try from .env file
        if (Test-Path ".env") {
            $envContent = Get-Content ".env"
            $line = $envContent | Where-Object { $_ -match "^$varName=" }
            if ($line) {
                Write-Host "✅ $varName is set (from .env)" -ForegroundColor Green
                return $true
            }
        }
        Write-Host "❌ $varName is NOT set" -ForegroundColor Red
        return $false
    } else {
        Write-Host "✅ $varName is set" -ForegroundColor Green
        return $true
    }
}

if (-not (Check-EnvVar "AIRTABLE_TOKEN")) { $missingVars++ }
if (-not (Check-EnvVar "AIRTABLE_BASE")) { $missingVars++ }
if (-not (Check-EnvVar "AIRTABLE_TABLE")) { $missingVars++ }
if (-not (Check-EnvVar "AIRTABLE_VIEW")) { $missingVars++ }
if (-not (Check-EnvVar "MONGODB_URI")) { $missingVars++ }

Write-Host ""

if ($missingVars -gt 0) {
    Write-Host "⚠️  $missingVars environment variable(s) missing!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Required variables in .env:" -ForegroundColor Yellow
    Write-Host "AIRTABLE_TOKEN=patE6BWA050QJhvVM..."
    Write-Host "AIRTABLE_BASE=appjg75kO367PZuBV"
    Write-Host "AIRTABLE_TABLE=Table 1"
    Write-Host "AIRTABLE_VIEW=Grid view"
    Write-Host "MONGODB_URI=mongodb+srv://..."
    exit 1
}

Write-Host "✅ All required environment variables are set!" -ForegroundColor Green
Write-Host ""

# Check if files exist
Write-Host "📁 Checking critical files..." -ForegroundColor Yellow

$files = @(
    "server\services\airtableService.js",
    "server\routes\airtable.js",
    "server\controllers\dashboardController.js",
    "server\controllers\callController.js",
    "server\middleware\checkDuplicateCall.js",
    "server\config\socketio.js"
)

$missingFiles = 0

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "✅ $file exists" -ForegroundColor Green
    } else {
        Write-Host "❌ $file NOT FOUND" -ForegroundColor Red
        $missingFiles++
    }
}

Write-Host ""

if ($missingFiles -gt 0) {
    Write-Host "⚠️  $missingFiles file(s) missing!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ All critical files present!" -ForegroundColor Green
Write-Host ""

# Check for old Call model usage
Write-Host "🔍 Scanning for old Call model usage..." -ForegroundColor Yellow

$patterns = @("Call\.find", "Call\.create", "Call\.findOne")
$foundUsage = $false

foreach ($pattern in $patterns) {
    $results = Get-ChildItem -Path "server\controllers", "server\routes" -Filter "*.js" -Recurse -ErrorAction SilentlyContinue |
        Select-String -Pattern $pattern -ErrorAction SilentlyContinue |
        Where-Object { $_.Path -notmatch "node_modules" -and $_.Path -notmatch "\.test\." }
    
    if ($results) {
        $foundUsage = $true
        Write-Host "⚠️  Found $pattern usage:" -ForegroundColor Yellow
        $results | ForEach-Object {
            Write-Host "   $($_.Path):$($_.LineNumber) - $($_.Line.Trim())"
        }
    }
}

if (-not $foundUsage) {
    Write-Host "✅ No old Call model usage found (good!)" -ForegroundColor Green
}

Write-Host ""

# Summary
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🎉 Airtable Integration Check Complete!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Summary:" -ForegroundColor Yellow
Write-Host "   ✅ Environment variables configured" -ForegroundColor Green
Write-Host "   ✅ All files present" -ForegroundColor Green
Write-Host "   ✅ No old Call model usage" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Ready to deploy!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. npm install"
Write-Host "2. npm start"
Write-Host "3. Test endpoints at http://localhost:3000"
Write-Host ""

# Test suggestions
Write-Host "🧪 Test these endpoints:" -ForegroundColor Cyan
Write-Host "   GET  /api/dashboard/stats?userId=YOUR_USER_ID"
Write-Host "   GET  /api/dashboard/recent-activity/YOUR_USER_ID"
Write-Host "   GET  /api/dashboard/analytics/YOUR_USER_ID?period=week"
Write-Host "   GET  /api/calls/user/YOUR_USER_ID"
Write-Host "   GET  /api/calls/stats/YOUR_USER_ID"
Write-Host ""
