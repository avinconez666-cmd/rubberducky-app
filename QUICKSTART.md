# Quick Start Guide - 10/4 Rubberducky

Get up and running with 10/4 Rubberducky in under 10 minutes!

---

## ⚡ Prerequisites Check

Before starting, verify you have:
- ✅ Node.js 18+ installed (`node --version`)
- ✅ MongoDB 6.0+ installed (`mongod --version`)
- ✅ Git installed (`git --version`)

---

## 🚀 5-Minute Setup

### Step 1: Clone & Install (2 minutes)

```bash
# Clone the repository
git clone https://github.com/yourusername/rubberducky-app.git
cd rubberducky-app

# Install backend dependencies
cd backend
npm install

# Install mobile dependencies
cd ../mobile
npm install
```

### Step 2: Start MongoDB (30 seconds)

```bash
# macOS (Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
net start MongoDB
```

### Step 3: Configure Backend (1 minute)

```bash
cd ../backend
cp .env.example .env
# Edit .env if needed (default settings work for local development)
```

### Step 4: Start Backend Server (30 seconds)

```bash
npm run dev
```

You should see:
```
🚀 Server running on 0.0.0.0:3000
📱 Environment: development
🗺️  WebSocket server ready
```

### Step 5: Start Mobile App (1 minute)

Open a new terminal:

```bash
cd mobile
cp .env.example .env
npm start
```

### Step 6: Run on Device/Simulator (30 seconds)

**iOS Simulator (macOS only):**
```bash
npm run ios
```

**Android Emulator:**
```bash
npm run android
```

**Physical Device:**
1. Install "Expo Go" from App Store/Google Play
2. Scan the QR code shown in terminal

---

## 🎉 You're Ready!

The app should now be running. Try these features:

1. **Create Account**: Enter your name and choose a vehicle
2. **Grant Permissions**: Allow location and microphone access
3. **See the Map**: Your location appears on the map
4. **Send a Message**: Type or record a voice message
5. **Switch Channels**: Try Public, Emergency, and Custom channels

---

## 🐛 Quick Troubleshooting

### Backend won't start?
```bash
# Check if MongoDB is running
mongo --eval "db.runCommand({ ping: 1 })"

# Check if port 3000 is available
lsof -i :3000
```

### Mobile app can't connect?
```bash
# For physical devices, use your computer's IP
# Find your IP:
ifconfig | grep "inet "  # macOS/Linux
ipconfig                 # Windows

# Update mobile/.env:
API_URL=http://YOUR_IP:3000
WS_URL=ws://YOUR_IP:3000
```

### Location not working?
- **iOS Simulator**: Features → Location → Custom Location
- **Android Emulator**: Use emulator controls to set location
- **Physical Device**: Ensure location permissions are granted

---

## 📚 Next Steps

- **Read the User Guide**: [docs/USER_GUIDE.md](./docs/USER_GUIDE.md)
- **Explore the API**: [docs/API.md](./docs/API.md)
- **Understand the Database**: [docs/DATABASE.md](./docs/DATABASE.md)
- **Deploy to Production**: [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)

---

## 💡 Quick Tips

1. **Safety Mode**: Automatically activates when speed > 10 km/h
2. **Voice Messages**: Hold microphone button to record (max 30s)
3. **Emergency Channel**: Extended 10km range for urgent messages
4. **Custom Groups**: Create private channels for friends
5. **Privacy**: Your session ID rotates each time you login

---

## 🆘 Need Help?

- **Documentation**: Check the `docs/` folder
- **Issues**: Create a GitHub issue
- **Email**: support@rubberducky.app

---

**Happy Driving! 🦆**