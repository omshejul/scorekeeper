# Score Keeper - Offline Features

The Score Keeper app now supports complete offline functionality with the following features:

## 🚀 Progressive Web App (PWA)

- **Installable**: Users can install the app on their devices for quick access
- **App-like Experience**: Runs in standalone mode without browser UI
- **Cross-platform**: Works on mobile, tablet, and desktop devices

## 💾 Offline Data Storage

- **IndexedDB Integration**: All game data is stored locally using IndexedDB
- **Persistent Storage**: Games and scores are saved permanently on the device
- **No Data Loss**: Games continue to work even without internet connection

## 🔄 Offline-First Architecture

- **Local-First**: All operations work offline first, then sync when online
- **Automatic Sync**: Pending changes are automatically synced when connection is restored
- **Conflict Resolution**: Smart handling of data conflicts during sync
- **Background Sync**: Uses service workers for background synchronization

## 📡 Smart Connectivity Handling

- **Online Detection**: Visual indicators show current connection status
- **Offline Indicators**: Users are informed when the app is running offline
- **Sync Status**: Real-time feedback on pending synchronizations
- **Graceful Degradation**: All core features work without internet

## 🎯 Core Offline Features

### Game Management

- ✅ Create new games offline
- ✅ Play and update scores offline
- ✅ Delete games offline
- ✅ View game history offline
- ✅ All changes sync automatically when online

### Data Persistence

- ✅ Guest user games stored locally
- ✅ Authenticated user games cached locally
- ✅ Automatic migration from guest to authenticated mode
- ✅ No data loss during offline periods

### User Experience

- ✅ Instant app loading with cached resources
- ✅ Smooth offline/online transitions
- ✅ Install prompts for PWA installation
- ✅ Background app updates

## 🛠 Technical Implementation

### Service Worker

- Caches static assets and API responses
- Handles offline requests gracefully
- Manages background synchronization
- Provides fallback pages for offline access

### IndexedDB Storage

- **Games Store**: Stores game data with metadata
- **Sync Queue**: Manages pending changes for synchronization
- **API Cache**: Caches server responses for faster access
- **Settings Store**: Stores user preferences and app state

### Offline API Layer

- Wraps all API calls with offline-first logic
- Automatically queues requests for later sync
- Provides consistent interface regardless of connectivity
- Handles authentication and authorization offline

## 📱 Installation

### Desktop (Chrome, Edge)

1. Look for the install icon in the address bar
2. Click "Install Score Keeper"
3. The app will be added to your applications

### Mobile (iOS Safari)

1. Tap the share button
2. Select "Add to Home Screen"
3. The app will appear on your home screen

### Mobile (Android Chrome)

1. Tap the menu (three dots)
2. Select "Add to Home Screen" or "Install app"
3. Follow the prompts to install

## 🔧 Development Notes

### File Structure

```
/lib/offline/
├── indexedDB.ts      # IndexedDB wrapper and management
├── offlineAPI.ts     # Offline-first API layer
└── storage.ts        # Safe storage utilities

/app/components/
├── OfflineStatus.tsx    # Connection status indicator
├── InstallPrompt.tsx    # PWA installation prompt
└── ServiceWorkerRegistration.tsx

/public/
├── manifest.json     # PWA manifest
└── sw.js            # Service worker
```

### Key Technologies

- **Service Workers**: For caching and background sync
- **IndexedDB**: For client-side database storage
- **Background Sync API**: For automatic synchronization
- **Web App Manifest**: For PWA installation
- **Cache API**: For resource caching

## 🎮 Usage Examples

### Playing Offline

1. Start the app while online
2. Create a new game
3. Disconnect from internet
4. Continue playing - scores are saved locally
5. Reconnect - changes sync automatically

### Guest to Authenticated Migration

1. Play games as a guest (offline or online)
2. Sign in with Google later
3. Guest games are automatically migrated to your account
4. No data is lost in the process

## 🔒 Data Security

- All data is stored locally on the user's device
- No sensitive information is cached unnecessarily
- Authentication tokens are handled securely
- Sync operations use secure HTTPS connections

## 🌟 Benefits

1. **Always Available**: App works regardless of connectivity
2. **Fast Performance**: Instant loading with cached resources
3. **Data Reliability**: No lost games or scores
4. **Seamless Experience**: Transparent online/offline transitions
5. **Mobile-Friendly**: Native app-like experience on mobile devices

The app now provides a complete offline experience while maintaining all the benefits of a web application!
