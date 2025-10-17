"use client"

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Bell, BellOff } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export function PushNotificationToggle() {
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Check if service worker and push notifications are supported
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      setIsLoading(true)
      
      // Check current subscription status
      navigator.serviceWorker.ready
        .then((registration) => {
          return registration.pushManager.getSubscription()
        })
        .then((subscription) => {
          setIsSubscribed(!!subscription)
          setIsLoading(false)
        })
        .catch((error) => {
          console.error('Subscription status check failed:', error)
          setIsLoading(false)
        })
    }
  }, [])

  const requestNotificationPermission = async () => {
    if (!isSupported) {
      toast({
        title: 'Desteklenmiyor',
        description: 'Tarayıcınız push bildirimleri desteklemiyor.',
        variant: 'destructive',
      })
      return false
    }

    const permission = await Notification.requestPermission()
    
    if (permission === 'granted') {
      toast({
        title: 'İzin verildi',
        description: 'Bildirimler için izin verildi.',
      })
      return true
    } else if (permission === 'denied') {
      toast({
        title: 'İzin reddedildi',
        description: 'Bildirim izni reddedildi. Tarayıcı ayarlarından değiştirebilirsiniz.',
        variant: 'destructive',
      })
      return false
    }
    
    return false
  }

  const subscribeToPushNotifications = async () => {
    setIsLoading(true)
    
    try {
      // First check if Notification is supported
      if (typeof Notification === 'undefined') {
        throw new Error('Notifications not supported')
      }

      const hasPermission = await requestNotificationPermission()
      if (!hasPermission) {
        setIsLoading(false)
        return
      }

      // Wait for service worker with timeout
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Service worker timeout')), 10000)
        )
      ])
      
      // VAPID public key - Environment variable'dan alınıyor
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BO0GefjiYBcSWPeT_U8bfZCFNHqzwp7FaRCseiyxhLPxplGW1ob7rh19w_se2U6-svB6xUs3SEYwUh4NoSTX3bI'
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      })

      // Backend'e subscription kaydet - with timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)

      if (response.ok) {
        setIsSubscribed(true)
        toast({
          title: 'Başarılı',
          description: 'Push bildirimlere başarıyla abone oldunuz.',
        })
        
        // Test bildirimi gönder
        if ('serviceWorker' in navigator && registration) {
          registration.showNotification('CostikFinans', {
            body: 'Push bildirimler aktif edildi! 🎉',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
          } as NotificationOptions)
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Subscription kaydedilemedi')
      }
    } catch (error) {
      console.error('Push notification error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Push bildirimler etkinleştirilemedi.'
      toast({
        title: 'Hata',
        description: errorMessage,
        variant: 'destructive',
      })
      setIsSubscribed(false)
    } finally {
      setIsLoading(false)
    }
  }

  const unsubscribeFromPushNotifications = async () => {
    setIsLoading(true)
    
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      
      if (subscription) {
        await subscription.unsubscribe()
        setIsSubscribed(false)
        
        toast({
          title: 'Abonelik iptal edildi',
          description: 'Push bildirimlerden çıkış yapıldı.',
        })
      }
    } catch (error) {
      console.error('Unsubscribe error:', error)
      toast({
        title: 'Hata',
        description: 'Abonelik iptal edilemedi.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggle = () => {
    if (isSubscribed) {
      unsubscribeFromPushNotifications()
    } else {
      subscribeToPushNotifications()
    }
  }

  if (!isSupported) {
    return null
  }

  return (
    <div className="flex items-center justify-between space-x-2">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          {isSubscribed ? <Bell className="h-4 w-4 text-green-600" /> : <BellOff className="h-4 w-4 text-muted-foreground" />}
          <span className="font-medium text-sm">Push Bildirimler</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {isLoading 
            ? 'Kontrol ediliyor...'
            : isSubscribed 
              ? 'Önemli işlemler için bildirim alıyorsunuz' 
              : 'Önemli işlemler için bildirim alın'}
        </p>
      </div>
      <Button
        onClick={handleToggle}
        disabled={isLoading}
        variant={isSubscribed ? 'outline' : 'default'}
        size="sm"
      >
        {isLoading ? 'Yükleniyor...' : isSubscribed ? 'Kapat' : 'Aktif Et'}
      </Button>
    </div>
  )
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
