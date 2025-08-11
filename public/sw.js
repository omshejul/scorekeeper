// Service Worker for Score Keeper PWA
const CACHE_NAME = 'scorekeeper-v1';
const OFFLINE_URL = '/';

// Files to cache for offline use
const STATIC_CACHE_URLS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/favicon-16x16.png',
  '/favicon-32x32.png',
  '/favicon-48x48.png',
  '/favicon-64x64.png',
  '/favicon-128x128.png',
  '/favicon-256x256.png',
  '/favicon-512x512.png',
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      
      // Cache the offline page first
      await cache.add(new Request(OFFLINE_URL, { cache: 'reload' }));
      
      // Cache other static resources
      await cache.addAll(STATIC_CACHE_URLS.map(url => new Request(url, { cache: 'reload' })));
      
      console.log('Static resources cached');
    })()
  );
  
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => caches.delete(cacheName))
      );
      
      // Take control of all pages
      await self.clients.claim();
      
      console.log('Service Worker activated');
    })()
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-HTTP requests
  if (!request.url.startsWith('http')) {
    return;
  }
  
  // Handle navigation requests (page loads)
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Try network first
          const response = await fetch(request);
          return response;
        } catch (error) {
          // If network fails, serve cached offline page
          const cache = await caches.open(CACHE_NAME);
          const cachedResponse = await cache.match(OFFLINE_URL);
          return cachedResponse || new Response('Offline', { status: 200, statusText: 'OK' });
        }
      })()
    );
    return;
  }
  
  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      (async () => {
        try {
          // Try network first for API calls
          const response = await fetch(request);
          
          // Cache successful GET responses
          if (response.ok && request.method === 'GET') {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
          }
          
          return response;
        } catch (error) {
          // For GET requests, try to serve from cache
          if (request.method === 'GET') {
            const cache = await caches.open(CACHE_NAME);
            const cachedResponse = await cache.match(request);
            if (cachedResponse) {
              return cachedResponse;
            }
          }
          
          // Return offline response for failed requests
          return new Response(
            JSON.stringify({ 
              error: 'Offline', 
              message: 'This action requires an internet connection' 
            }),
            {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }
      })()
    );
    return;
  }
  
  // Handle static assets - cache first strategy
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        return cachedResponse;
      }
      
      try {
        const response = await fetch(request);
        
        // Cache successful responses for static assets
        if (response.ok) {
          cache.put(request, response.clone());
        }
        
        return response;
      } catch (error) {
        // Return a fallback for failed static asset requests
        return new Response('Resource not available offline', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      }
    })()
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'game-sync') {
    event.waitUntil(syncGameData());
  }
});

// Handle sync of offline game data
async function syncGameData() {
  try {
    console.log('Syncing offline game data...');
    
    // Get pending sync data from IndexedDB
    const syncData = await getSyncQueue();
    
    for (const item of syncData) {
      try {
        await syncSingleItem(item);
        await removeSyncItem(item.id);
      } catch (error) {
        console.error('Failed to sync item:', item, error);
      }
    }
    
    console.log('Game data sync completed');
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Helper functions for sync queue management
async function getSyncQueue() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('scorekeeperDB', 1);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['syncQueue'], 'readonly');
      const store = transaction.objectStore('syncQueue');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => {
        resolve(getAllRequest.result || []);
      };
      
      getAllRequest.onerror = () => {
        reject(getAllRequest.error);
      };
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
}

async function syncSingleItem(item) {
  const response = await fetch(item.url, {
    method: item.method,
    headers: {
      'Content-Type': 'application/json',
      ...item.headers
    },
    body: item.data ? JSON.stringify(item.data) : undefined
  });
  
  if (!response.ok) {
    throw new Error(`Sync failed: ${response.status}`);
  }
  
  return response.json();
}

async function removeSyncItem(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('scorekeeperDB', 1);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => {
        resolve();
      };
      
      deleteRequest.onerror = () => {
        reject(deleteRequest.error);
      };
    };
    
    request.onerror = () => {
      reject(request.error);
    };
  });
}
