// Firebase Cloud Messaging Configuration
// Web Push Notification için VAPID Key yapılandırması

/**
 * VAPID Public Key
 * 
 * ÖNEMLİ: Bu key'i Firebase Console'dan almanız gerekiyor:
 * 
 * 1. Firebase Console'a gidin: https://console.firebase.google.com
 * 2. Projenizi seçin
 * 3. Project Settings > Cloud Messaging
 * 4. Web Push certificates bölümüne gidin
 * 5. "Generate key pair" butonuna tıklayın
 * 6. Oluşan "Key pair" değerini buraya yapıştırın
 * 
 * Alternatif olarak .env.local dosyasına da ekleyebilirsiniz:
 * NEXT_PUBLIC_FIREBASE_VAPID_KEY=your-vapid-key-here
 */

export const VAPID_PUBLIC_KEY = 
  process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || 
  'BFJ6F-ojC6DQX7k-nWHKSE1bdmQ1PAp6093hZXcSzHqREcculZPgUxyH7GZ9xC2hrhkFspYrljEFG4_DFKxnhOM'

/**
 * FCM yapılandırma kontrolü
 */
export function checkFCMConfig(): { isConfigured: boolean; message: string } {
  if (!VAPID_PUBLIC_KEY) {
    return {
      isConfigured: false,
      message: 'VAPID Public Key yapılandırılmamış. Firebase Console > Cloud Messaging > Web Push certificates bölümünden key alın.'
    }
  }

  return {
    isConfigured: true,
    message: 'FCM yapılandırması tamamlanmış.'
  }
}

/**
 * Push notification özellikleri
 */
export const NOTIFICATION_CONFIG = {
  // Bildirim gösterim süresi (ms)
  displayDuration: 5000,
  
  // Bildirim badge
  badge: '/icons/icon-72x72.png',
  
  // Bildirim icon
  icon: '/icons/icon-192x192.png',
  
  // Titreşim paterni (ms) [titreşim, duraklama, titreşim, ...]
  vibrate: [200, 100, 200],
  
  // Bildirim sesi
  silent: false,
  
  // Bildirim gerektir etkileşim (otomatik kapanmasın)
  requireInteraction: false,
  
  // Bildirim etiketi (aynı etiketli bildirimler gruplanır)
  tag: 'costik-finans-notification',
  
  // Bildirim yeniden gösterim (aynı etiketli bildirim varsa)
  renotify: true
}

/**
 * Push notification desteklenebilirlik kontrolü
 */
export function isPushNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false
  
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

/**
 * Notification permission durumu
 */
export async function getNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushNotificationSupported()) {
    return 'denied'
  }
  
  return Notification.permission
}

/**
 * Notification permission iste
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isPushNotificationSupported()) {
    console.warn('Push notifications desteklenmiyor')
    return false
  }
  
  const permission = await Notification.requestPermission()
  return permission === 'granted'
}
