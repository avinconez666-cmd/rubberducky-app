# 10/4 Rubberducky — Mobile App Design Plan

## Brand Identity
- **App Name**: 10/4 Rubberducky
- **Tagline**: "Keep the rubber side down"
- **Primary Color**: #F59E0B (Amber/Yellow — CB radio feel)
- **Accent Color**: #0F172A (Dark Navy)
- **Emergency Red**: #EF4444
- **Channel Green**: #22C55E
- **Channel Blue**: #3B82F6
- **Background**: #0F172A (dark navy, night-driving friendly)
- **Surface**: #1E293B (slate dark)
- **Foreground**: #F8FAFC (near white)
- **Muted**: #94A3B8

## Design Principles
1. **Safety First** — Large touch targets (min 56px), minimal distractions
2. **Dark-First** — Dark theme for night driving, easy on eyes
3. **Voice-First** — Push-to-Talk is the hero interaction, always prominent
4. **Instant Clarity** — Channel status, safety mode, connection state visible at all times
5. **CB Radio Aesthetic** — Amber/yellow accents, radio wave iconography, trucker culture

## Screen List

### 1. Onboarding / Login Screen
- **Content**: App logo, tagline, display name input, vehicle type selector (Car/Truck/Motorcycle/RV)
- **Functionality**: Set display name, select vehicle icon, store locally with AsyncStorage
- **Flow**: Enter name → Select vehicle → Tap "Hit the Road" → Map Screen

### 2. Map Screen (Main / Home Tab)
- **Content**: Full-screen map with nearby driver markers, message feed overlay at bottom, channel indicator at top, safety mode banner
- **Functionality**: 
  - Live map with simulated nearby drivers (markers with vehicle icons + display names)
  - Push-to-Talk button (large, center bottom) — hold to record, release to send
  - Text message input (disabled in safety mode)
  - Channel selector (Public/Emergency/Custom)
  - Safety mode auto-activates at speed > 10 km/h (simulated)
  - Message feed shows last 5 messages
- **Layout**: Map fills screen, translucent top bar (channel + connection), translucent bottom sheet (messages + PTT button)

### 3. Channels Screen (Channels Tab)
- **Content**: List of available channels — Public Nearby (green), Emergency (red), Custom Groups (blue)
- **Functionality**: 
  - Switch active channel by tapping
  - Create new custom group (name, description, radius)
  - Join/leave groups
  - Active channel highlighted
- **Layout**: FlatList of channel cards with color-coded left border

### 4. Settings Screen (Settings Tab)
- **Content**: Profile section, privacy controls, proximity radius slider, vehicle type, statistics
- **Functionality**:
  - Edit display name
  - Toggle map visibility (opt-in)
  - Adjust proximity radius (500m – 5km)
  - Change vehicle type
  - View session stats (messages sent, distance traveled)
  - Safety mode speed threshold
- **Layout**: Grouped settings list with section headers

## Key User Flows

### Flow 1: First Launch
App opens → Onboarding screen → Enter name → Select vehicle → "Hit the Road" → Map screen

### Flow 2: Send a Voice Message
Map screen → Hold PTT button → Speak → Release → Message broadcasts to channel → Other drivers hear it

### Flow 3: Switch to Emergency Channel
Map screen → Tap channel indicator → Channel sheet opens → Tap Emergency → Red indicator shows

### Flow 4: Create a Convoy Group
Channels tab → Tap "+" → Enter group name → Set radius → Create → Share code with friends

### Flow 5: Safety Mode Activation
Speed detected > 10 km/h → Yellow safety banner appears → Text input disabled → PTT still works → Emergency always accessible

## Tab Bar
- Tab 1: **Map** (map pin icon) — Main screen
- Tab 2: **Channels** (radio tower icon) — Channel management
- Tab 3: **Settings** (gear icon) — Profile & preferences
