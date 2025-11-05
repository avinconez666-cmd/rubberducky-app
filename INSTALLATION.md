# Installation Guide - 10/4 Rubberducky

This guide will help you set up the 10/4 Rubberducky application on your local development environment.

---

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software
- **Node.js**: Version 18.x or higher ([Download](https://nodejs.org/))
- **npm**: Comes with Node.js
- **MongoDB**: Version 6.0 or higher ([Download](https://www.mongodb.com/try/download/community))
- **Git**: For cloning the repository ([Download](https://git-scm.com/))

### For Mobile Development
- **Expo CLI**: Will be installed via npm
- **iOS Development** (macOS only):
  - Xcode 14+ from App Store
  - iOS Simulator
- **Android Development**:
  - Android Studio
  - Android SDK
  - Android Emulator or physical device

---

## Backend Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/rubberducky-app.git
cd rubberducky-app
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

### 3. Configure Environment Variables
```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:
```env
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

MONGODB_URI=mongodb://localhost:27017/rubberducky
JWT_SECRET=your-development-secret-key

# Add other configuration as needed
```

### 4. Start MongoDB
**macOS (with Homebrew):**
```bash
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
```

**Windows:**
```bash
net start MongoDB
```

### 5. Create Database Indexes
```bash
# Connect to MongoDB
mongo

# Switch to database
use rubberducky

# Create geospatial indexes
db.users.createIndex({ location: "2dsphere" })
db.messages.createIndex({ location: "2dsphere" })

# Create other indexes
db.users.createIndex({ sessionId: 1 })
db.users.createIndex({ deviceId: 1 })
db.messages.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })

# Exit
exit
```

### 6. Start the Backend Server
```bash
npm run dev
```

The server should now be running at `http://localhost:3000`

### 7. Verify Backend is Running
Open your browser or use curl:
```bash
curl http://localhost:3000/health
```

You should see:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 1.234,
  "environment": "development"
}
```

---

## Mobile App Setup

### 1. Navigate to Mobile Directory
```bash
cd ../mobile
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
```bash
cp .env.example .env
```

Edit the `.env` file:
```env
API_URL=http://localhost:3000
WS_URL=ws://localhost:3000
```

**Note for iOS Simulator:** Use your computer's IP address instead of localhost:
```env
API_URL=http://192.168.1.100:3000
WS_URL=ws://192.168.1.100:3000
```

To find your IP address:
- **macOS/Linux**: `ifconfig | grep "inet "`
- **Windows**: `ipconfig`

### 4. Start Expo Development Server
```bash
npm start
```

This will open Expo DevTools in your browser.

### 5. Run on iOS Simulator (macOS only)
```bash
npm run ios
```

Or press `i` in the Expo DevTools terminal.

### 6. Run on Android Emulator
```bash
npm run android
```

Or press `a` in the Expo DevTools terminal.

### 7. Run on Physical Device
1. Install **Expo Go** app from App Store or Google Play
2. Scan the QR code shown in the terminal or Expo DevTools
3. The app will load on your device

---

## Troubleshooting

### Backend Issues

**MongoDB Connection Error:**
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Ensure MongoDB is running:
```bash
# Check MongoDB status
# macOS
brew services list | grep mongodb

# Linux
sudo systemctl status mongod

# Windows
sc query MongoDB
```

**Port Already in Use:**
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Solution:** Change the port in `.env` or kill the process using port 3000:
```bash
# Find process
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Mobile App Issues

**Cannot Connect to Backend:**
- Ensure backend is running
- Check API_URL in `.env` matches your backend address
- For physical devices, use your computer's IP address, not localhost
- Ensure your device is on the same network as your computer

**Expo CLI Not Found:**
```bash
npm install -g expo-cli
```

**iOS Simulator Not Opening:**
- Ensure Xcode is installed
- Open Xcode and accept license agreements
- Install iOS Simulator from Xcode preferences

**Android Emulator Issues:**
- Ensure Android Studio is installed
- Create an AVD (Android Virtual Device) in Android Studio
- Start the emulator before running `npm run android`

**Location Permissions:**
- iOS: Simulator > Features > Location > Custom Location
- Android: Use emulator controls to set location

---

## Development Workflow

### Running Both Backend and Mobile App

**Terminal 1 - Backend:**
```bash
cd rubberducky-app/backend
npm run dev
```

**Terminal 2 - Mobile App:**
```bash
cd rubberducky-app/mobile
npm start
```

### Hot Reloading
- **Backend**: Automatically reloads with nodemon
- **Mobile**: Shake device or press `r` in terminal to reload

### Debugging

**Backend Debugging:**
```bash
# View logs
tail -f logs/app.log

# Debug mode
node --inspect src/server.js
```

**Mobile Debugging:**
- Shake device to open developer menu
- Enable "Debug Remote JS" for Chrome debugging
- Use React Native Debugger for advanced debugging

---

## Testing

### Backend Tests
```bash
cd backend
npm test
```

### Mobile Tests
```bash
cd mobile
npm test
```

---

## Building for Production

### Backend
```bash
cd backend
npm install --production
NODE_ENV=production npm start
```

### Mobile App

**iOS:**
```bash
cd mobile
eas build --platform ios
```

**Android:**
```bash
cd mobile
eas build --platform android
```

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for detailed production deployment instructions.

---

## Additional Resources

- **API Documentation**: [docs/API.md](./docs/API.md)
- **Database Schema**: [docs/DATABASE.md](./docs/DATABASE.md)
- **User Guide**: [docs/USER_GUIDE.md](./docs/USER_GUIDE.md)
- **Deployment Guide**: [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)

---

## Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Review the documentation in the `docs/` folder
3. Check existing GitHub issues
4. Create a new issue with:
   - Your operating system
   - Node.js version (`node --version`)
   - Error messages
   - Steps to reproduce

---

## Next Steps

After successful installation:

1. **Explore the App**: Try all features on the mobile app
2. **Review the Code**: Understand the architecture
3. **Read Documentation**: Familiarize yourself with the API
4. **Customize**: Modify settings to suit your needs
5. **Contribute**: Submit improvements via pull requests

---

**Happy Coding! 🦆**