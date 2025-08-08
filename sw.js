// Service Worker for Needle Break Logger
// Provides offline functionality and caching

const CACHE_NAME = 'needle-logger-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/styles.css',
  '/src/app.js',
  '/config.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Installation failed', error);
      })
  );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activation complete');
        return self.clients.claim();
      })
      .catch((error) => {
        console.error('Service Worker: Activation failed', error);
      })
  );
});

// Fetch Event - Network First Strategy
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin) && 
      !event.request.url.includes('googleapis.com') && 
      !event.request.url.includes('script.google.com') &&
      !event.request.url.includes('cdnjs.cloudflare.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        // Cache the response
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });

        return response;
      })
      .catch(() => {
        // Network failed, try to get from cache
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              console.log('Service Worker: Serving from cache:', event.request.url);
              return response;
            }
            
            // If it's a navigation request and we don't have it cached,
            // return the main page
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
            
            // For other requests, return a generic offline response
            return new Response(
              JSON.stringify({
                success: false,
                message: 'Offline - data will be synced when connection is restored',
                offline: true
              }),
              {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({
                  'Content-Type': 'application/json'
                })
              }
            );
          });
      })
  );
});

// Background Sync for offline form submissions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered');
  
  if (event.tag === 'background-sync-needle-entries') {
    event.waitUntil(syncOfflineEntries());
  }
});

// Function to sync offline entries when connection is restored
async function syncOfflineEntries() {
  try {
    console.log('Service Worker: Syncing offline entries...');
    
    // Get offline entries from IndexedDB
    const offlineEntries = await getOfflineEntries();
    
    if (offlineEntries.length === 0) {
      console.log('Service Worker: No offline entries to sync');
      return;
    }

    let syncedCount = 0;
    let failedCount = 0;

    for (const entry of offlineEntries) {
      try {
        // Attempt to submit the entry
        const response = await fetch(entry.scriptUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(entry.data)
        });

        const result = await response.json();
        
        if (result.success) {
          // Remove from offline storage
          await removeOfflineEntry(entry.id);
          syncedCount++;
          console.log('Service Worker: Synced offline entry:', entry.id);
        } else {
          failedCount++;
          console.error('Service Worker: Failed to sync entry:', entry.id, result.message);
        }
      } catch (error) {
        failedCount++;
        console.error('Service Worker: Error syncing entry:', entry.id, error);
      }
    }

    // Notify the main application about sync results
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        syncedCount,
        failedCount,
        totalEntries: offlineEntries.length
      });
    });

    console.log(`Service Worker: Sync complete. Synced: ${syncedCount}, Failed: ${failedCount}`);
  } catch (error) {
    console.error('Service Worker: Background sync failed:', error);
  }
}

// IndexedDB helper functions for offline storage
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('NeedleLoggerDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('offlineEntries')) {
        const store = db.createObjectStore('offlineEntries', { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

async function getOfflineEntries() {
  try {
    const db = await openDB();
    const transaction = db.transaction(['offlineEntries'], 'readonly');
    const store = transaction.objectStore('offlineEntries');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  } catch (error) {
    console.error('Service Worker: Error getting offline entries:', error);
    return [];
  }
}

async function removeOfflineEntry(entryId) {
  try {
    const db = await openDB();
    const transaction = db.transaction(['offlineEntries'], 'readwrite');
    const store = transaction.objectStore('offlineEntries');
    
    return new Promise((resolve, reject) => {
      const request = store.delete(entryId);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error('Service Worker: Error removing offline entry:', error);
  }
}

// Handle messages from the main application
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
  
  if (event.data && event.data.type === 'FORCE_SYNC') {
    // Trigger background sync manually
    syncOfflineEntries();
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});

// Push notification handler (for future use)
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received');
  
  const options = {
    body: event.data ? event.data.text() : 'New needle break entry submitted',
    icon: '/assets/icon-192x192.png',
    badge: '/assets/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'view',
        title: 'View Details',
        icon: '/assets/view-icon.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/assets/close-icon.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Needle Break Logger', options)
  );
});

// Update available notification
self.addEventListener('updatefound', () => {
  console.log('Service Worker: Update found');
  
  const newWorker = self.registration.installing;
  newWorker.addEventListener('statechange', () => {
    if (newWorker.state === 'installed') {
      if (navigator.serviceWorker.controller) {
        // New update available
        console.log('Service Worker: New version available');
        
        // Notify the main application
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'UPDATE_AVAILABLE'
            });
          });
        });
      }
    }
  });
});

console.log('Service Worker: Script loaded');