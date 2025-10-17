// Enhanced Service Worker with Push Notification Support
// This file extends the auto-generated sw.js from next-pwa

// Push notification event handler
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received:', event)
  
  let notificationData = {
    title: 'CostikFinans',
    body: 'Yeni bir işlem gerçekleşti',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
  }
  
  try {
    if (event.data) {
      notificationData = event.data.json()
    }
  } catch (e) {
    console.error('[SW] Push data parse error:', e)
    if (event.data) {
      notificationData.body = event.data.text()
    }
  }

  const options = {
    body: notificationData.body || 'Yeni bir işlem gerçekleşti',
    icon: notificationData.icon || '/icons/icon-192x192.png',
    badge: notificationData.badge || '/icons/icon-72x72.png',
    tag: notificationData.tag || 'costikfinans-notification',
    data: notificationData.data || {},
    actions: notificationData.actions || [],
    requireInteraction: notificationData.requireInteraction || false,
    timestamp: Date.now(),
  }

  event.waitUntil(
    self.registration.showNotification(
      notificationData.title || 'CostikFinans',
      options
    )
  )
})

// Notification click event handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag)
  
  event.notification.close()

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Açık bir pencere varsa onu odakla
        for (const client of clientList) {
          if (client.url.includes(self.registration.scope) && 'focus' in client) {
            return client.focus()
          }
        }
        // Yoksa yeni pencere aç
        if (clients.openWindow) {
          return clients.openWindow('/')
        }
      })
  )
})

// Background sync for offline transactions
self.addEventListener('sync', (event) => {
  console.log('[SW] Sync event:', event.tag)
  
  if (event.tag === 'sync-transactions') {
    event.waitUntil(syncOfflineTransactions())
  }
})

async function syncOfflineTransactions() {
  try {
    console.log('[SW] Syncing offline transactions...')
    
    const cache = await caches.open('offline-transactions')
    const requests = await cache.keys()
    
    let syncCount = 0
    for (const request of requests) {
      try {
        await fetch(request)
        await cache.delete(request)
        syncCount++
      } catch (error) {
        console.error('[SW] Failed to sync transaction:', error)
      }
    }
    
    if (syncCount > 0) {
      // Başarılı sync bildirimi göster
      self.registration.showNotification('CostikFinans', {
        body: `${syncCount} işlem senkronize edildi`,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: 'sync-success',
      })
    }
    
    console.log('[SW] Sync completed:', syncCount, 'transactions')
  } catch (error) {
    console.error('[SW] Sync failed:', error)
  }
}

// Periodic sync for checking updates (if supported)
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'check-updates') {
      event.waitUntil(checkForUpdates())
    }
  })
}

async function checkForUpdates() {
  try {
    console.log('[SW] Checking for updates...')
    // Burada uygulamanızın güncellemelerini kontrol edebilirsiniz
  } catch (error) {
    console.error('[SW] Update check failed:', error)
  }
}

console.log('[SW] Enhanced service worker loaded with push notification support')
