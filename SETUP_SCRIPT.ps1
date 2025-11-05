# 10/4 Rubberducky - Complete Setup PowerShell Script
# Automated setup for https://github.com/avinconez666-cmd/rubberducky-app.git

param(
    [string]$RepoUrl = "https://github.com/avinconez666-cmd/rubberducky-app.git",
    [string]$ProjectDir = "C:\rubberducky-app",
    [switch]$SkipMongoDB = $false,
    [switch]$SkipMobile = $false,
    [switch]$Production = $false
)

# Colors for output
$Green = "`e[32m"
$Yellow = "`e[33m"
$Red = "`e[31m"
$Blue = "`e[34m"
$Reset = "`e[0m"

function Write-ColorOutput {
    param([string]$Color, [string]$Message)
    Write-Host "$Color$Message$Reset"
}

function Test-CommandExists {
    param([string]$command)
    try {
        if (Get-Command $command -ErrorAction SilentlyContinue) {
            return $true
        }
    } catch {
        return $false
    }
    return $false
}

function Check-Prerequisites {
    Write-ColorOutput $Blue "`n🔍 Checking Prerequisites...`n"
    
    # Check Node.js
    if (Test-CommandExists "node") {
        $nodeVersion = node --version
        Write-ColorOutput $Green "✅ Node.js: $nodeVersion"
        
        # Check if version is 18+
        $majorVersion = [int]($nodeVersion -replace 'v','' -split '\.')[0]
        if ($majorVersion -ge 18) {
            Write-ColorOutput $Green "✅ Node.js version meets requirements (18+)"
        } else {
            Write-ColorOutput $Red "❌ Node.js version too old. Please install Node.js 18+ from https://nodejs.org/"
            exit 1
        }
    } else {
        Write-ColorOutput $Red "❌ Node.js not found. Please install from https://nodejs.org/"
        exit 1
    }
    
    # Check npm
    if (Test-CommandExists "npm") {
        $npmVersion = npm --version
        Write-ColorOutput $Green "✅ npm: $npmVersion"
    } else {
        Write-ColorOutput $Red "❌ npm not found. Please install Node.js which includes npm."
        exit 1
    }
    
    # Check Git
    if (Test-CommandExists "git") {
        $gitVersion = git --version
        Write-ColorOutput $Green "✅ Git: $gitVersion"
    } else {
        Write-ColorOutput $Red "❌ Git not found. Please install Git from https://git-scm.com/"
        exit 1
    }
    
    # Check MongoDB
    if (-not $SkipMongoDB) {
        if (Test-CommandExists "mongod") {
            $mongoVersion = mongod --version | Select-Object -First 1
            Write-ColorOutput $Green "✅ MongoDB: $mongoVersion"
        } else {
            Write-ColorOutput $Yellow "⚠️  MongoDB not found. Will install MongoDB Community Edition."
            return $false
        }
    }
    
    # Check Expo CLI
    if (Test-CommandExists "expo") {
        $expoVersion = expo --version
        Write-ColorOutput $Green "✅ Expo CLI: $expoVersion"
    } else {
        Write-ColorOutput $Yellow "⚠️  Expo CLI not found. Will install globally."
        return $false
    }
    
    return $true
}

function Install-MongoDB {
    Write-ColorOutput $Blue "`n📦 Installing MongoDB Community Edition...`n"
    
    try {
        # Download MongoDB installer
        $mongoUrl = "https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-6.0.8-signed.msi"
        $installerPath = "$env:TEMP\mongodb-installer.msi"
        
        Write-ColorOutput $Yellow "Downloading MongoDB installer..."
        Invoke-WebRequest -Uri $mongoUrl -OutFile $installerPath -UseBasicParsing
        
        Write-ColorOutput $Yellow "Installing MongoDB..."
        Start-Process msiexec.exe -Wait -ArgumentList "/i $installerPath /quiet /norestart"
        
        Write-ColorOutput $Green "✅ MongoDB installed successfully!"
        
        # Add MongoDB to PATH
        $mongoPath = "C:\Program Files\MongoDB\Server\6.0\bin"
        $env:Path += ";$mongoPath"
        [Environment]::SetEnvironmentVariable("Path", $env:Path, [EnvironmentVariableTarget]::Machine)
        
        # Start MongoDB service
        Write-ColorOutput $Yellow "Starting MongoDB service..."
        Start-Service MongoDB -ErrorAction SilentlyContinue
        Set-Service MongoDB -StartupType Automatic
        
        Write-ColorOutput $Green "✅ MongoDB service configured and started!"
        
    } catch {
        Write-ColorOutput $Red "❌ Failed to install MongoDB: $($_.Exception.Message)"
        Write-ColorOutput $Yellow "Please install MongoDB manually from https://www.mongodb.com/try/download/community"
        exit 1
    }
}

function Install-ExpoCLI {
    Write-ColorOutput $Blue "`n📱 Installing Expo CLI...`n"
    
    try {
        Write-ColorOutput $Yellow "Installing Expo CLI globally..."
        npm install -g expo-cli
        
        Write-ColorOutput $Green "✅ Expo CLI installed successfully!"
    } catch {
        Write-ColorOutput $Red "❌ Failed to install Expo CLI: $($_.Exception.Message)"
        Write-ColorOutput $Yellow "Please install Expo CLI manually: npm install -g expo-cli"
        exit 1
    }
}

function Clone-Repository {
    Write-ColorOutput $Blue "`n📥 Cloning Repository...`n"
    
    if (Test-Path $ProjectDir) {
        Write-ColorOutput $Yellow "Directory exists. Removing existing files..."
        Remove-Item -Path $ProjectDir -Recurse -Force
    }
    
    try {
        Write-ColorOutput $Yellow "Cloning from $RepoUrl..."
        git clone $RepoUrl $ProjectDir
        
        if (Test-Path $ProjectDir) {
            Write-ColorOutput $Green "✅ Repository cloned successfully!"
            Set-Location $ProjectDir
        } else {
            Write-ColorOutput $Red "❌ Failed to clone repository"
            exit 1
        }
    } catch {
        Write-ColorOutput $Red "❌ Failed to clone repository: $($_.Exception.Message)"
        exit 1
    }
}

function Setup-Backend {
    Write-ColorOutput $Blue "`n⚙️  Setting Up Backend...`n"
    
    try {
        Set-Location "$ProjectDir\backend"
        
        Write-ColorOutput $Yellow "Installing backend dependencies..."
        npm install
        
        Write-ColorOutput $Yellow "Creating backend .env file..."
        Copy-Item ".env.example" ".env" -Force
        
        if ($Production) {
            # Update .env for production
            (Get-Content ".env") -replace 'NODE_ENV=development', 'NODE_ENV=production' | Set-Content ".env"
            Write-ColorOutput $Yellow "Configured for production environment"
        }
        
        Write-ColorOutput $Green "✅ Backend setup completed!"
        
        # Start backend in background
        Write-ColorOutput $Yellow "Starting backend server..."
        Start-Process "npm" -ArgumentList "run dev" -NoNewWindow -PassThru
        
        # Wait a moment for server to start
        Start-Sleep 5
        
        # Test if backend is running
        try {
            $response = Invoke-RestMethod -Uri "http://localhost:3000/health" -TimeoutSec 10
            Write-ColorOutput $Green "✅ Backend server is running!"
        } catch {
            Write-ColorOutput $Yellow "⚠️  Backend may still be starting up..."
        }
        
    } catch {
        Write-ColorOutput $Red "❌ Backend setup failed: $($_.Exception.Message)"
        exit 1
    }
}

function Setup-Mobile {
    if ($SkipMobile) {
        Write-ColorOutput $Yellow "`n⏭️  Skipping mobile setup as requested`n"
        return
    }
    
    Write-ColorOutput $Blue "`n📱 Setting Up Mobile App...`n"
    
    try {
        Set-Location "$ProjectDir\mobile"
        
        Write-ColorOutput $Yellow "Installing mobile dependencies..."
        npm install
        
        Write-ColorOutput $Yellow "Creating mobile .env file..."
        Copy-Item ".env.example" ".env" -Force
        
        # Update API URLs for your local network if needed
        $backendUrl = "http://localhost:3000"
        if ($Production) {
            $backendUrl = "https://your-domain.com"
        }
        
        (Get-Content ".env") -replace 'API_URL=http://localhost:3000', "API_URL=$backendUrl" | Set-Content ".env"
        (Get-Content ".env") -replace 'WS_URL=ws://localhost:3000', "WS_URL=ws://localhost:3000" | Set-Content ".env"
        
        Write-ColorOutput $Green "✅ Mobile setup completed!"
        
        Write-ColorOutput $Blue "`n🚀 Starting Expo development server...`n"
        Write-ColorOutput $Yellow "Expo DevTools will open in your browser."
        Write-ColorOutput $Yellow "Scan the QR code with your phone or use an emulator."
        
        # Start Expo in background
        Start-Process "npm" -ArgumentList "start" -NoNewWindow -PassThru
        
    } catch {
        Write-ColorOutput $Red "❌ Mobile setup failed: $($_.Exception.Message)"
        exit 1
    }
}

function Setup-Database {
    Write-ColorOutput $Blue "`n🗄️  Setting Up Database...`n"
    
    try {
        Write-ColorOutput $Yellow "Creating MongoDB indexes..."
        
        # Create indexes script
        $mongoScript = @"
use rubberducky
db.users.createIndex({ location: "2dsphere" })
db.users.createIndex({ sessionId: 1 })
db.users.createIndex({ deviceId: 1 })
db.messages.createIndex({ location: "2dsphere" })
db.messages.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
db.channels.createIndex({ channelId: 1 })
db.channels.createIndex({ 'members.sessionId': 1 })
print("✅ Database indexes created successfully!")
"@
        
        $mongoScript | mongo --quiet
        
        Write-ColorOutput $Green "✅ Database setup completed!"
        
    } catch {
        Write-ColorOutput $Yellow "⚠️  Could not create indexes automatically. Please run manually:"
        Write-ColorOutput $Blue "mongo < backend/src/models/setupIndexes.js"
    }
}

function Show-SuccessMessage {
    Write-ColorOutput $Green "`n🎉 SETUP COMPLETE! 🎉`n"
    
    Write-ColorOutput $Blue "📋 Next Steps:"
    Write-ColorOutput $Yellow "1. Backend server should be running at: http://localhost:3000"
    Write-ColorOutput $Yellow "2. Expo DevTools should be open in your browser"
    Write-ColorOutput $Yellow "3. Scan QR code with Expo Go app on your phone"
    Write-ColorOutput $Yellow "4. Or use iOS/Android emulator"
    
    Write-ColorOutput $Blue "`n📱 Mobile App Options:"
    Write-ColorOutput $Yellow "- iOS Simulator: Press 'i' in Expo terminal"
    Write-ColorOutput $Yellow "- Android Emulator: Press 'a' in Expo terminal"
    Write-ColorOutput $Yellow "- Physical Device: Scan QR code with Expo Go app"
    
    Write-ColorOutput $Blue "`n🔧 Useful Commands:"
    Write-ColorOutput $Yellow "- Test backend: curl http://localhost:3000/health"
    Write-ColorOutput $Yellow "- View backend logs: Check the terminal where 'npm run dev' is running"
    Write-ColorOutput $Yellow "- View mobile logs: Check the terminal where 'npm start' is running"
    
    Write-ColorOutput $Blue "`n📚 Documentation:"
    Write-ColorOutput $Yellow "- Quick Start: QUICKSTART.md"
    Write-ColorOutput $Yellow "- Full Installation: INSTALLATION.md"
    Write-ColorOutput $Yellow "- API Reference: docs/API.md"
    Write-ColorOutput $Yellow "- User Guide: docs/USER_GUIDE.md"
    Write-ColorOutput $Yellow "- Deployment: docs/DEPLOYMENT.md"
    
    Write-ColorOutput $Green "`n🚀 Happy coding! 10/4 Rubberducky is ready to use!`n"
}

function Main {
    Write-ColorOutput $Blue @"
    
    🦆 10/4 RUBBERDUCKY - AUTOMATED SETUP 🦆
    ==========================================
    Real-time driver communication app setup
    Repository: $RepoUrl
    Target Directory: $ProjectDir
    
"@
    
    # Check prerequisites
    $prereqsOk = Check-Prerequisites
    
    # Install missing prerequisites
    if (-not $prereqsOk) {
        if (-not (Test-CommandExists "mongod")) {
            Install-MongoDB
        }
        
        if (-not (Test-CommandExists "expo")) {
            Install-ExpoCLI
        }
    }
    
    # Clone repository
    Clone-Repository
    
    # Setup backend
    Setup-Backend
    
    # Setup database
    Setup-Database
    
    # Setup mobile
    Setup-Mobile
    
    # Show success message
    Show-SuccessMessage
}

# Run the main function
Main