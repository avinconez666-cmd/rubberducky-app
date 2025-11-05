# File Structure - 10/4 Rubberducky

## 📁 Complete Project Structure

```
rubberducky-app/
│
├── 📄 README.md                    # Project overview and main documentation
├── 📄 INSTALLATION.md              # Detailed installation instructions
├── 📄 QUICKSTART.md                # Quick 5-minute setup guide
├── 📄 PROJECT_SUMMARY.md           # Comprehensive project summary
│
├── 📁 backend/                     # Node.js Backend Server
│   ├── 📄 package.json             # Backend dependencies and scripts
│   ├── 📄 .env.example             # Environment variables template
│   │
│   └── 📁 src/                     # Source code
│       ├── 📄 server.js            # Main server entry point
│       │
│       ├── 📁 models/              # MongoDB Models
│       │   ├── 📄 User.js          # User schema and methods
│       │   ├── 📄 Message.js       # Message schema and methods
│       │   └── 📄 Channel.js       # Channel schema and methods
│       │
│       ├── 📁 routes/              # API Routes
│       │   ├── 📄 auth.js          # Authentication endpoints
│       │   ├── 📄 user.js          # User management endpoints
│       │   ├── 📄 channel.js       # Channel management endpoints
│       │   └── 📄 location.js      # Location endpoints
│       │
│       ├── 📁 middleware/          # Express Middleware
│       │   ├── 📄 auth.js          # JWT authentication middleware
│       │   ├── 📄 errorHandler.js  # Error handling middleware
│       │   └── 📄 rateLimiter.js   # Rate limiting middleware
│       │
│       ├── 📁 sockets/             # WebSocket Handlers
│       │   └── 📄 socketHandler.js # Socket.io event handlers
│       │
│       └── 📁 utils/               # Utility Functions
│           └── 📄 logger.js        # Winston logger configuration
│
├── 📁 mobile/                      # React Native Mobile App
│   ├── 📄 package.json             # Mobile dependencies and scripts
│   ├── 📄 app.json                 # Expo configuration
│   ├── 📄 App.js                   # Main app component
│   ├── 📄 .env.example             # Environment variables template
│   │
│   └── 📁 src/                     # Source code
│       ├── 📁 screens/             # App Screens
│       │   ├── 📄 LoginScreen.js   # Login/registration screen
│       │   ├── 📄 MapScreen.js     # Main map and messaging screen
│       │   ├── 📄 ChannelsScreen.js # Channel management screen
│       │   ├── 📄 SettingsScreen.js # Settings and profile screen
│       │   └── 📄 GroupCreateScreen.js # Group creation screen
│       │
│       ├── 📁 services/            # Service Layer
│       │   ├── 📄 api.js           # HTTP API client
│       │   ├── 📄 socketService.js # WebSocket client
│       │   └── 📄 locationService.js # Location tracking service
│       │
│       └── 📁 context/             # React Context
│           └── 📄 AuthContext.js   # Authentication context
│
├── 📁 docs/                        # Documentation
│   ├── 📄 API.md                   # Complete API reference
│   ├── 📄 DATABASE.md              # Database schema documentation
│   ├── 📄 DEPLOYMENT.md            # Production deployment guide
│   └── 📄 USER_GUIDE.md            # End-user documentation
│
└── 📁 database/                    # Database Scripts (to be added)
    └── 📄 init.js                  # Database initialization script
```

---

## 📋 File Descriptions

### Root Level Files

| File | Purpose | Key Contents |
|------|---------|--------------|
| `README.md` | Main project documentation | Overview, features, architecture, getting started |
| `INSTALLATION.md` | Setup instructions | Prerequisites, step-by-step installation, troubleshooting |
| `QUICKSTART.md` | Quick setup guide | 5-minute setup for developers |
| `PROJECT_SUMMARY.md` | Comprehensive overview | Technical details, architecture, use cases |

### Backend Files

#### Core Files
| File | Purpose | Key Components |
|------|---------|----------------|
| `server.js` | Application entry point | Express setup, middleware, routes, WebSocket initialization |
| `package.json` | Dependencies & scripts | Express, Socket.io, Mongoose, JWT, etc. |
| `.env.example` | Configuration template | Database URI, JWT secret, ports, settings |

#### Models (`src/models/`)
| File | Purpose | Key Features |
|------|---------|--------------|
| `User.js` | User data model | Location (GeoJSON), session management, privacy settings |
| `Message.js` | Message data model | Text/voice messages, TTL, geospatial queries |
| `Channel.js` | Channel data model | Custom groups, members, moderation |

#### Routes (`src/routes/`)
| File | Purpose | Endpoints |
|------|---------|-----------|
| `auth.js` | Authentication | `/register`, `/refresh`, `/logout` |
| `user.js` | User management | `/profile`, `/privacy`, `/stats` |
| `channel.js` | Channel operations | `/create`, `/join`, `/leave`, `/invite` |
| `location.js` | Location services | `/update`, `/nearby` |

#### Middleware (`src/middleware/`)
| File | Purpose | Functionality |
|------|---------|---------------|
| `auth.js` | Authentication | JWT token verification |
| `errorHandler.js` | Error handling | Centralized error responses |
| `rateLimiter.js` | Rate limiting | Request throttling |

#### Sockets (`src/sockets/`)
| File | Purpose | Events |
|------|---------|--------|
| `socketHandler.js` | WebSocket logic | `location:update`, `message:send`, `voice:send`, etc. |

#### Utils (`src/utils/`)
| File | Purpose | Features |
|------|---------|----------|
| `logger.js` | Logging | Winston logger with file/console output |

### Mobile App Files

#### Core Files
| File | Purpose | Key Components |
|------|---------|----------------|
| `App.js` | Main app component | Navigation, authentication, context providers |
| `app.json` | Expo configuration | App metadata, permissions, build settings |
| `package.json` | Dependencies & scripts | React Native, Expo, navigation, maps |

#### Screens (`src/screens/`)
| File | Purpose | Features |
|------|---------|----------|
| `LoginScreen.js` | Login/registration | Device registration, name/avatar selection |
| `MapScreen.js` | Main interface | Live map, messaging, voice recording, channels |
| `ChannelsScreen.js` | Channel management | List channels, join/leave, create groups |
| `SettingsScreen.js` | User settings | Profile, privacy, proximity, statistics |
| `GroupCreateScreen.js` | Group creation | Create custom groups with settings |

#### Services (`src/services/`)
| File | Purpose | Functions |
|------|---------|-----------|
| `api.js` | HTTP client | REST API calls with authentication |
| `socketService.js` | WebSocket client | Real-time messaging, location updates |
| `locationService.js` | Location tracking | GPS tracking, permission handling |

#### Context (`src/context/`)
| File | Purpose | State |
|------|---------|-------|
| `AuthContext.js` | Authentication state | User data, login/logout functions |

### Documentation Files

| File | Purpose | Contents |
|------|---------|----------|
| `API.md` | API reference | All endpoints, WebSocket events, examples |
| `DATABASE.md` | Database documentation | Schema, indexes, queries, optimization |
| `DEPLOYMENT.md` | Deployment guide | Production setup, scaling, monitoring |
| `USER_GUIDE.md` | User manual | Features, usage, troubleshooting, FAQ |

---

## 🔍 Key File Relationships

### Authentication Flow
```
LoginScreen.js
    ↓ (calls)
api.js → authAPI.register()
    ↓ (HTTP POST)
backend/routes/auth.js
    ↓ (creates)
backend/models/User.js
    ↓ (returns JWT)
AuthContext.js (stores token)
```

### Real-time Messaging Flow
```
MapScreen.js
    ↓ (user action)
socketService.js → sendMessage()
    ↓ (WebSocket emit)
backend/sockets/socketHandler.js
    ↓ (processes)
backend/models/Message.js
    ↓ (broadcasts)
socketService.js → message:received
    ↓ (updates UI)
MapScreen.js
```

### Location Update Flow
```
locationService.js (GPS)
    ↓ (every 5s/10m)
socketService.js → updateLocation()
    ↓ (WebSocket emit)
backend/sockets/socketHandler.js
    ↓ (updates)
backend/models/User.js
    ↓ (queries nearby)
MongoDB (geospatial query)
    ↓ (broadcasts)
socketService.js → user:nearby
    ↓ (updates map)
MapScreen.js
```

---

## 📦 Dependencies Overview

### Backend Dependencies
```json
{
  "express": "Web framework",
  "socket.io": "WebSocket server",
  "mongoose": "MongoDB ODM",
  "jsonwebtoken": "JWT authentication",
  "bcryptjs": "Password hashing",
  "cors": "CORS middleware",
  "helmet": "Security headers",
  "winston": "Logging"
}
```

### Mobile Dependencies
```json
{
  "react-native": "Mobile framework",
  "expo": "Development platform",
  "react-navigation": "Navigation",
  "react-native-maps": "Map component",
  "expo-location": "Location services",
  "expo-av": "Audio recording",
  "socket.io-client": "WebSocket client",
  "axios": "HTTP client"
}
```

---

## 🎯 File Size Estimates

| Category | Files | Lines of Code | Size |
|----------|-------|---------------|------|
| Backend | 13 | ~2,000 | ~100 KB |
| Mobile | 10 | ~1,500 | ~80 KB |
| Documentation | 5 | ~5,000 | ~200 KB |
| **Total** | **28** | **~8,500** | **~380 KB** |

---

## 🔧 Configuration Files

### Backend Configuration
- `.env` - Environment variables
- `package.json` - Dependencies and scripts
- `.gitignore` - Git ignore rules

### Mobile Configuration
- `.env` - API endpoints
- `app.json` - Expo configuration
- `package.json` - Dependencies and scripts
- `.gitignore` - Git ignore rules

---

## 📝 Notes

### File Naming Conventions
- **Components**: PascalCase (e.g., `MapScreen.js`)
- **Services**: camelCase (e.g., `socketService.js`)
- **Models**: PascalCase (e.g., `User.js`)
- **Routes**: lowercase (e.g., `auth.js`)
- **Documentation**: UPPERCASE (e.g., `README.md`)

### Code Organization
- **Separation of Concerns**: Each file has a single responsibility
- **Modular Design**: Easy to maintain and extend
- **Clear Structure**: Intuitive file organization
- **Documentation**: Every major component documented

---

## 🚀 Adding New Features

### To add a new API endpoint:
1. Create route handler in `backend/src/routes/`
2. Add model if needed in `backend/src/models/`
3. Register route in `backend/src/server.js`
4. Update `docs/API.md`

### To add a new screen:
1. Create screen in `mobile/src/screens/`
2. Add navigation in `mobile/App.js`
3. Create service functions if needed
4. Update `docs/USER_GUIDE.md`

### To add a new WebSocket event:
1. Add handler in `backend/src/sockets/socketHandler.js`
2. Add client function in `mobile/src/services/socketService.js`
3. Update `docs/API.md` WebSocket section

---

This structure provides a solid foundation for the 10/4 Rubberducky application with clear separation of concerns and easy maintainability.