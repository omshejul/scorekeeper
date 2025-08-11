# Guest vs Authenticated User Sync Behavior

## The Problem
Previously, the offline functionality was showing sync status for all users, including guests. This was confusing because:

- **Guest users** don't have accounts to sync to
- **Guest games** are stored only locally 
- **Sync queue** was being populated even for guest operations
- **Sync status** was displayed even when there was nothing to sync

## The Solution

### 🔐 Authentication-Aware Offline API

The offline API now tracks authentication status and only performs sync operations for authenticated users:

```typescript
class OfflineAPI {
  private isAuthenticated: boolean = false;
  
  setAuthenticationStatus(isAuthenticated: boolean): void {
    this.isAuthenticated = isAuthenticated;
  }
}
```

### 📱 Guest User Behavior (Not Authenticated)

**What guests experience:**
- ✅ Games are created and saved locally
- ✅ Scores are updated locally  
- ✅ Games persist across browser sessions
- ❌ **No sync operations** are queued
- ❌ **No sync status** is displayed
- ❌ **No background sync** attempts

**Technical implementation:**
```typescript
// For guest users - only local operations
if (this.isOnline && this.isAuthenticated) {
  // Try to sync with server
} else if (!this.isOnline && this.isAuthenticated) {
  // Queue for later sync
}
// Guest users: no sync operations at all
```

### 👤 Authenticated User Behavior

**What authenticated users experience:**
- ✅ Games are created and saved locally + synced to server
- ✅ Offline changes are queued for sync
- ✅ Sync status is displayed when relevant
- ✅ Background sync when connection returns
- ✅ Seamless online/offline experience

### 🎯 UI Changes

**Compact Offline Status visibility:**
- **Guests**: Status component never appears (no sync = no status)
- **Authenticated**: Appears only when there are pending syncs or offline

```typescript
// Only show for authenticated users with sync activity
if (!isAuthenticated || (isOnline && pendingSyncCount === 0 && !showSyncComplete)) {
  return null;
}
```

## Benefits

### 🧹 Cleaner Guest Experience
- No confusing sync messages
- Simpler offline experience
- Focus on local gameplay

### ⚡ Better Performance  
- No unnecessary sync queue operations
- No background sync attempts for guests
- Reduced IndexedDB writes

### 🎯 Accurate Status Information
- Sync status only shows when relevant
- No misleading "syncing" messages for guests
- Clear distinction between local and cloud storage

## Technical Details

### Authentication Status Tracking
```typescript
// In ScoreKeeper component
useEffect(() => {
  if (status !== "loading") {
    offlineAPI.setAuthenticationStatus(!!session?.user);
  }
}, [session, status]);
```

### Sync Queue Management
```typescript
async getPendingSyncCount(): Promise<number> {
  // Only return sync count for authenticated users
  if (!this.isAuthenticated) {
    return 0;
  }
  const syncQueue = await indexedDBManager.getSyncQueue();
  return syncQueue.length;
}
```

### Conditional Sync Operations
All create/update/delete operations now check authentication before queuing sync:

```typescript
// Only authenticated users get sync operations
if (this.isOnline && this.isAuthenticated) {
  // Immediate sync attempt
} else if (!this.isOnline && this.isAuthenticated) {
  // Queue for later sync
}
// Guests: no sync operations
```

## Migration Behavior

**Guest to Authenticated Migration still works:**
- Guest games remain in localStorage
- Upon sign-in, games are migrated to user account
- After migration, all new operations follow authenticated flow
- Sync status becomes relevant after authentication

This ensures that the app provides the right experience for each type of user while maintaining the offline-first functionality where appropriate.
