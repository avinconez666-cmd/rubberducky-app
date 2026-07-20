# 10/4 Rubberducky - One-Click Setup
# Run this script to get everything running immediately!

Write-Host "🦆 10/4 Rubberducky - One-Click Setup" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Green
Write-Host "Repository: https://github.com/avinconez666-cmd/rubberducky-app" -ForegroundColor Yellow
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "backend\package.json")) {
    Write-Host "❌ Please run this script from the rubberducky-app folder" -ForegroundColor Red
    Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
    pause
    exit 1
}

# Check Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js not found. Please install from https://nodejs.org/" -ForegroundColor Red
    pause
    exit 1
}

# Check MongoDB
if (-not (Get-Command mongod -ErrorAction SilentlyContinue)) {
    Write-Host "❌ MongoDB not found. Please install from https://www.mongodb.com/try/download/community" -ForegroundColor Red
    pause
    exit 1
}

# Start MongoDB service
Write-Host "🗄️  Starting MongoDB..." -ForegroundColor Blue
Start-Service MongoDB -ErrorAction SilentlyContinue

# Setup backend
Write-Host "⚙️  Setting up backend..." -ForegroundColor Blue
Set-Location "backend"
npm install
Copy-Item ".env.example" ".env" -Force
Start-Process "npm" -ArgumentList "run dev" -NoNewWindow -PassThru
Set-Location ..

# Setup mobile
Write-Host "📱 Setting up mobile..." -ForegroundColor Blue
Set-Location "mobile"
npm install
Copy-Item ".env.example" ".env" -Force
Start-Process "npm" -ArgumentList "start" -NoNewWindow -PassThru
Set-Location ..

# Setup database
Write-Host "🗄️  Setting up database..." -ForegroundColor Blue
@'
use rubberducky
db.users.createIndex({location: "2dsphere"})
db.users.createIndex({sessionId: 1})
db.users.createIndex({deviceId: 1})
db.messages.createIndex({location: "2dsphere"})
db.messages.createIndex({expiresAt: 1}, {expireAfterSeconds: 0})
print("Database setup complete!")
'@ | mongo --quiet

Write-Host ""
Write-Host "🎉 SETUP COMPLETE!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Your app is running at:" -ForegroundColor Yellow
Write-Host "   Backend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "   Mobile: Check the Expo terminal that opened" -ForegroundColor Cyan
Write-Host ""
Write-Host "📱 Next steps:" -ForegroundColor Yellow
Write-Host "   1. Backend should be running in a new terminal" -ForegroundColor White
Write-Host "   2. Expo DevTools should be open in your browser" -ForegroundColor White
Write-Host "   3. Scan QR code with Expo Go app or use emulator" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Yellow
Write-Host "   - Quick Start: QUICKSTART.md" -ForegroundColor White
Write-Host "   - Full Guide: INSTALLATION.md" -ForegroundColor White
Write-Host "   - API: docs/API.md" -ForegroundColor White
Write-Host ""
Write-Host "🦆 Happy coding! 10/4 Rubberducky is ready!" -ForegroundColor Green
Write-Host ""

# Keep PowerShell window open
pause