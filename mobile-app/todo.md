# 10/4 Rubberducky — TODO

- [x] Generate and apply app icon (logo)
- [x] Update theme colors (dark navy, amber, CB radio palette)
- [x] Add icon mappings for all tabs and UI elements
- [x] Update app.config.ts with branding
- [x] Build AppContext (user profile, channels, safety mode, messages, isHydrated)
- [x] Build Onboarding/Login screen
- [x] Build Map screen with simulated nearby drivers
- [x] Build Push-to-Talk button with recording timer animation
- [x] Build message feed overlay on Map screen
- [x] Build channel selector bottom sheet on Map screen
- [x] Build Safety Mode banner
- [x] Build Channels screen with channel list
- [x] Build Create Group modal
- [x] Build Settings screen
- [x] Wire up tab navigation (Map / Channels / Settings)
- [x] Fix navigation-before-mount crash with hydration gate
- [x] Save checkpoint
- [x] Push to GitHub repository


## Phase 2: Hazard Reporting System
- [x] Add Hazard type (accident, speed camera, police, debris)
- [x] Create HazardReport interface in AppContext
- [x] Build Hazard Report modal (type selector, description, location)
- [x] Add hazard pins to Map screen
- [x] Build Hazard feed overlay on Map
- [x] Add hazard expiry (auto-remove after 1 hour)

## Phase 3: Navigation System
- [x] Create Navigation screen with destination input
- [x] Add destination marker to map
- [x] Simulate real-time directions (turn-by-turn)
- [x] Display current speed (simulated)
- [x] Display speed limit (simulated)
- [x] Add navigation controls (start/stop/recalculate)

## Phase 4: Friend System
- [x] Add Friend type to AppContext
- [x] Create Friends screen
- [x] Build add friend modal (search by handle)
- [x] Build friend list with status (online/offline/last seen)
- [x] Add friend activity feed
- [x] Build friend profile view
- [x] Add remove friend action

## Phase 5: Subscription/Premium Tier
- [x] Create Subscription type (free, premium)
- [x] Build Paywall screen
- [x] Add premium features indicator throughout app
- [x] Restrict hazard reporting to premium
- [x] Restrict navigation to premium
- [x] Restrict friend system to premium
- [x] Add subscription management screen
- [x] Simulate subscription purchase (no real payment)

## Phase 6: Integration
- [x] Update AppContext with all new state
- [x] Add new tabs to tab bar (Hazards, Navigation, Friends, Premium)
- [x] Update Map screen with hazard pins overlay
- [x] Add hazard report button to Map
- [x] Update Settings with subscription info
- [x] Wire up all navigation flows

## Phase 7: Testing & Delivery
- [x] Test all new features end-to-end
- [x] Verify no TypeScript errors
- [ ] Save checkpoint
- [ ] Push to GitHub
