# 10/4 Rubberducky - Real-Time Driver Communication App

## Overview
10/4 Rubberducky is a location-based, real-time voice and text communication platform designed specifically for drivers. It enables safe, hands-free communication between nearby drivers using push-to-talk voice messages, live mapping, and smart channel management.

## 🎯 Core Features

### 1. Proximity Detection
- GPS-based user discovery within configurable ranges (500m - 5km)
- Real-time location updates using WebSocket connections
- Efficient geospatial queries for nearby user detection

### 2. Push-to-Talk Voice Communication
- Walkie-talkie style voice messaging
- Audio compression for efficient transmission
- Voice playback queue management
- Hands-free operation support

### 3. Live Map Interface
- Real-time display of nearby active drivers
- Anonymized user icons for privacy
- Interactive map with zoom and pan controls
- Visual indicators for different channel types

### 4. Smart Channel System
- **Public Nearby**: Open communication with all users in range
- **Emergency Only**: Priority channel for hazards and emergencies
- **Custom Groups**: Private channels for friends, convoys, road trips

### 5. Voice-Activated Messaging
- Fully hands-free interaction
- Voice command recognition
- "Hey Rubberducky" wake word activation
- Voice-controlled channel switching

### 6. Safety Mode
- Automatic speed detection via GPS
- Disables text input when moving above threshold (e.g., 10 km/h)
- Voice-only mode during driving
- Visual indicators for safety status

## 🔐 Privacy & Safety

### Privacy Features
- Temporary, rotating user IDs (regenerated every session)
- Opt-in map visibility
- No persistent location storage
- Anonymous communication by default
- User-controlled profile visibility

### Safety Features
- Content moderation and filtering
- Report and block functionality
- Emergency channel prioritization
- No voice data storage beyond active session
- Automatic session cleanup

## 🏗️ Architecture

### Technology Stack
- **Mobile App**: React Native (iOS & Android)
- **Backend**: Node.js with Express
- **Real-time Communication**: Socket.io (WebSocket)
- **Database**: MongoDB with geospatial indexing
- **Voice Processing**: Web Audio API / React Native Audio
- **Maps**: React Native Maps (Google Maps / Apple Maps)
- **Authentication**: JWT tokens with rotating session IDs

### System Components
1. **Mobile Client**: React Native app with voice recording, map display, and real-time messaging
2. **API Server**: RESTful API for user management, authentication, and data operations
3. **WebSocket Server**: Real-time message delivery and location updates
4. **Geospatial Service**: Proximity detection and user discovery
5. **Voice Processing**: Audio encoding, compression, and streaming
6. **Moderation Service**: Content filtering and user safety

## 📱 Use Cases

1. **Hazard Warnings**: "Kangaroo on the road ahead at the 50km marker!"
2. **Convoy Coordination**: Friends traveling in multiple vehicles staying connected
3. **Local Tips**: Asking nearby drivers for directions or recommendations
4. **Emergency Assistance**: Reporting accidents or requesting help
5. **Traffic Updates**: Real-time traffic condition sharing
6. **Road Trip Communication**: Group chat for travelers on the same route

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- React Native development environment
- MongoDB 6.0+
- iOS/Android development tools

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/rubberducky-app.git
cd rubberducky-app
```

2. **Install backend dependencies**
```bash
cd backend
npm install
```

3. **Install mobile app dependencies**
```bash
cd ../mobile
npm install
```

4. **Configure environment variables**
```bash
# Backend (.env)
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration

# Mobile (.env)
cp mobile/.env.example mobile/.env
# Edit mobile/.env with your configuration
```

5. **Start MongoDB**
```bash
mongod --dbpath /path/to/data
```

6. **Run the backend server**
```bash
cd backend
npm run dev
```

7. **Run the mobile app**
```bash
cd mobile
# For iOS
npm run ios

# For Android
npm run android
```

## 📚 Documentation

- [API Documentation](./docs/API.md)
- [Database Schema](./docs/DATABASE.md)
- [Architecture Overview](./docs/ARCHITECTURE.md)
- [User Guide](./docs/USER_GUIDE.md)
- [Privacy Policy](./docs/PRIVACY.md)
- [Safety Guidelines](./docs/SAFETY.md)

## 🔧 Configuration

### Backend Configuration
```javascript
{
  "port": 3000,
  "mongodb": "mongodb://localhost:27017/rubberducky",
  "jwtSecret": "your-secret-key",
  "proximityRadius": 5000, // meters
  "maxVoiceMessageDuration": 30, // seconds
  "sessionTimeout": 3600 // seconds
}
```

### Mobile App Configuration
```javascript
{
  "apiUrl": "http://localhost:3000",
  "wsUrl": "ws://localhost:3000",
  "defaultProximityRange": 2000, // meters
  "safetyModeSpeedThreshold": 10, // km/h
  "mapProvider": "google" // or "apple"
}
```

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Mobile app tests
cd mobile
npm test
```

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please read CONTRIBUTING.md for guidelines.

## 📞 Support

For issues and questions:
- GitHub Issues: https://github.com/yourusername/rubberducky-app/issues
- Email: support@rubberducky.app

## 🙏 Acknowledgments

- Inspired by CB radio culture and modern driver safety needs
- Built with love for the driving community
- Special thanks to all contributors and testers

---

**Note**: This app is designed to promote safe driving. Always prioritize road safety and follow local traffic laws. Use voice commands and hands-free features while driving.