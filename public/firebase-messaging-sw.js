// Firebase Cloud Messaging Service Worker
// Push notification event handlers

// Firebase konfigürasyonu import edilecek
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js')

// Firebase yapılandırması
// Not: Bu değerler production'da environment variable'lardan gelmelidir
const firebaseConfig = {
  apiKey: "AIzaSyBV5o-ZtMOh6d4kp4vZo0LKJPB4T2wdMnM",
  authDomain: "costikfinans.firebaseapp.com",
  projectId: "costikfinans",
  storageBucket: "costikfinans.firebasestorage.app",
  messagingSenderId: "1058715488542",
  appId: "1:1058715488542:web:baeac8b7b95c4baa1c0e81",
  measurementId: "G-42N1N33S77"
}

// Firebase başlat
firebase.initializeApp(firebaseConfig)

// Firebase Messaging instance
const messaging = firebase.messaging()

console.log('[FCM SW] Firebase Messaging Service Worker initialized')

// Background message handler
messaging.onBackgroundMessage((payload) => {
  console.log('[FCM SW] Received background message:', payload)

  const notificationTitle = payload.notification?.title || 'Costik Finans'
  const notificationOptions = {
    body: payload.notification?.body || 'Yeni bildiriminiz var',
    icon: payload.notification?.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: payload.data?.tag || 'costik-notification',
    data: payload.data || {},
    vibrate: [200, 100, 200],
    requireInteraction: false,
    actions: []
  }

  // Eğer action'lar varsa ekle
  if (payload.data?.actions) {
    try {
      const actions = JSON.parse(payload.data.actions)
      notificationOptions.actions = actions
    } catch (e) {
      console.error('[FCM SW] Failed to parse actions:', e)
    }
  }

  return self.registration.showNotification(notificationTitle, notificationOptions)
})

// Push event handler (FCM olmayan push'lar için)
self.addEventListener('push', (event) => {
  console.log('[FCM SW] Push event received:', event)

  if (!event.data) {
    console.log('[FCM SW] Push event has no data')
    return
  }

  let payload
  try {
    payload = event.data.json()
  } catch (e) {
    // JSON değilse text olarak al
    payload = {
      notification: {
        title: 'Costik Finans',
        body: event.data.text()
      }
    }
  }

  const notificationTitle = payload.notification?.title || 'Costik Finans'
  const notificationOptions = {
    body: payload.notification?.body || 'Yeni bildiriminiz var',
    icon: payload.notification?.icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: payload.data?.tag || 'costik-notification',
    data: payload.data || {},
    vibrate: [200, 100, 200],
    requireInteraction: false
  }

  event.waitUntil(
    self.registration.showNotification(notificationTitle, notificationOptions)
  )
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[FCM SW] Notification click received:', event)

  event.notification.close()

  // Hangi action'a tıklandı kontrol et
  const clickedAction = event.action
  const notificationData = event.notification.data || {}

  // URL belirle
  let urlToOpen = notificationData.url || '/'

  if (clickedAction) {
    // Action'a özel URL varsa kullan
    if (notificationData.actions && notificationData.actions[clickedAction]) {
      urlToOpen = notificationData.actions[clickedAction].url || urlToOpen
    }
  }

  // Bildirim tipine göre URL belirle
  if (notificationData.type) {
    switch (notificationData.type) {
      case 'bill_due':
      case 'payment_reminder':
        urlToOpen = '/odemeler'
        break
      case 'budget_exceeded':
        urlToOpen = '/budgets'
        break
      case 'low_balance':
      case 'transaction_alert':
        urlToOpen = '/'
        break
      case 'calendar_daily':
      case 'calendar_event':
      case 'calendar_summary':
        urlToOpen = '/'
        break
      default:
        urlToOpen = '/notifications'
    }
  }

  // Notification ID varsa URL'ye ekle
  if (notificationData.notificationId) {
    urlToOpen += `?notification=${notificationData.notificationId}`
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Zaten açık bir pencere var mı kontrol et
        for (const client of clientList) {
          if (client.url.includes(self.registration.scope) && 'focus' in client) {
            // Açık pencereyi odakla ve URL'yi güncelle
            return client.focus().then(() => {
              if ('navigate' in client) {
                return client.navigate(urlToOpen)
              }
            })
          }
        }
        // Açık pencere yoksa yeni pencere aç
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
  )
})

// Notification close handler
self.addEventListener('notificationclose', (event) => {
  console.log('[FCM SW] Notification closed:', event)

  const notificationData = event.notification.data || {}

  // Analytics için bildirim kapatma event'i gönderebilirsiniz
  if (notificationData.notificationId) {
    // Burada analytics tracking yapılabilir
    console.log('[FCM SW] Notification closed:', notificationData.notificationId)
  }
})

// Service Worker activate handler
self.addEventListener('activate', (event) => {
  console.log('[FCM SW] Service Worker activated')
  event.waitUntil(clients.claim())
})

// Service Worker install handler
self.addEventListener('install', (event) => {
  console.log('[FCM SW] Service Worker installed')
  self.skipWaiting()
})

console.log('[FCM SW] All event listeners registered')
