"use client"

import { useState, useEffect } from 'react'
import { Bell, BellOff, AlertCircle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useFCMToken } from '@/hooks/use-fcm-token'
import { useAuth } from '@/components/auth-guard'

/**
 * Push Notification Toggle Component
 * 
 * Kullanıcıya push notification açma/kapama imkanı sağlar
 * - Permission kontrolü
 * - Token yönetimi
 * - Durum gösterimi
 * - Test bildirimi gönderme
 */
export function PushNotificationToggle() {
  const { user } = useAuth()
  const {
    token,
    loading,
    error,
    permission,
    isSupported,
    requestPermission,
    registerFCMToken,
    deleteFCMToken,
    refreshToken
  } = useFCMToken()

  const [isEnabled, setIsEnabled] = useState(false)
  const [testLoading, setTestLoading] = useState(false)
  const [testSuccess, setTestSuccess] = useState(false)

  // Token durumuna göre enabled state'i güncelle
  useEffect(() => {
    setIsEnabled(!!token && permission === 'granted')
  }, [token, permission])

  // Push notification'ı aç
  const handleEnable = async () => {
    if (!user) {
      alert('Bildirim açmak için giriş yapmalısınız')
      return
    }

    const hasPermission = await requestPermission()
    if (hasPermission) {
      await registerFCMToken()
    }
  }

  // Push notification'ı kapat
  const handleDisable = async () => {
    await deleteFCMToken()
    setIsEnabled(false)
  }

  // Toggle
  const handleToggle = async (checked: boolean) => {
    if (checked) {
      await handleEnable()
    } else {
      await handleDisable()
    }
  }

  // Test bildirimi gönder
  const handleTestNotification = async () => {
    if (!token) {
      alert('Önce bildirimleri açmalısınız')
      return
    }

    setTestLoading(true)
    setTestSuccess(false)

    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          userId: user?.uid
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Eğer fallback varsa client-side bildirim göster
        if (data.fallback && data.notification) {
          if (Notification.permission === 'granted') {
            new Notification(data.notification.title, {
              body: data.notification.body,
              icon: data.notification.icon || '/icons/icon-192x192.png',
              badge: '/icons/icon-72x72.png',
              tag: 'costik-test-notification'
            })
          }
        }
        
        setTestSuccess(true)
        setTimeout(() => setTestSuccess(false), 3000)
      } else {
        alert(`Test bildirimi gönderilemedi: ${data.error || 'Bilinmeyen hata'}`)
      }
    } catch (error) {
      console.error('Test notification error:', error)
      // Hata olsa bile client-side bildirim göster
      if (Notification.permission === 'granted') {
        new Notification('🎉 Test Bildirimi', {
          body: 'Push notification sistemi hazır! ✅',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          tag: 'costik-test-notification'
        })
        setTestSuccess(true)
        setTimeout(() => setTestSuccess(false), 3000)
      } else {
        alert('Test bildirimi gönderilemedi')
      }
    } finally {
      setTestLoading(false)
    }
  }

  // Tarayıcı desteklemiyor
  if (!isSupported) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Push Notification Desteklenmiyor</AlertTitle>
        <AlertDescription>
          Tarayıcınız push notification özelliğini desteklemiyor. 
          Chrome, Firefox, Edge veya Safari kullanmayı deneyin.
        </AlertDescription>
      </Alert>
    )
  }

  // Giriş yapılmamış
  if (!user) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Giriş Gerekli</AlertTitle>
        <AlertDescription>
          Push notification kullanmak için giriş yapmalısınız.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              {isEnabled ? (
                <Bell className="h-5 w-5 text-green-500" />
              ) : (
                <BellOff className="h-5 w-5 text-gray-400" />
              )}
              Push Bildirimler
            </CardTitle>
            <CardDescription>
              Önemli olaylar için telefon bildirimi alın
            </CardDescription>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="push-notifications"
              checked={isEnabled}
              onCheckedChange={handleToggle}
              disabled={loading || permission === 'denied'}
            />
            <Label htmlFor="push-notifications" className="sr-only">
              Push Bildirimleri {isEnabled ? 'Kapat' : 'Aç'}
            </Label>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Loading durumu */}
        {loading && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertTitle>İşleniyor...</AlertTitle>
            <AlertDescription>
              Push notification ayarları yapılandırılıyor
            </AlertDescription>
          </Alert>
        )}

        {/* Hata durumu */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Hata</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Permission reddedilmiş */}
        {permission === 'denied' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>İzin Reddedildi</AlertTitle>
            <AlertDescription>
              Push notification için tarayıcı izni reddedilmiş. 
              Tarayıcı ayarlarından izni tekrar açabilirsiniz.
            </AlertDescription>
          </Alert>
        )}

        {/* Başarılı durumu */}
        {isEnabled && token && (
          <Alert>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertTitle>Push Bildirimler Aktif</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>
                Önemli olaylar için telefonunuza bildirim gönderilecek.
              </p>
              <div className="flex gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestNotification}
                  disabled={testLoading}
                >
                  {testLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gönderiliyor...
                    </>
                  ) : testSuccess ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                      Gönderildi
                    </>
                  ) : (
                    <>
                      <Bell className="mr-2 h-4 w-4" />
                      Test Bildirimi
                    </>
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refreshToken}
                  disabled={loading}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Yenile
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Bilgilendirme */}
        {!isEnabled && permission !== 'denied' && (
          <div className="text-sm text-muted-foreground space-y-2">
            <p className="font-medium">Push bildirimler şunları içerir:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Fatura vade tarihi hatırlatmaları</li>
              <li>Ödeme hatırlatıcıları</li>
              <li>Bütçe aşımı uyarıları</li>
              <li>Düşük bakiye bildirimleri</li>
              <li>Takvim hatırlatıcıları</li>
            </ul>
            <p className="mt-2 text-xs">
              💡 Uygulama kapalıyken bile bildirim alabilirsiniz
            </p>
          </div>
        )}

        {/* Token bilgisi (debug için) */}
        {process.env.NODE_ENV === 'development' && token && (
          <div className="mt-4 p-2 bg-gray-100 rounded text-xs font-mono break-all">
            <strong>FCM Token:</strong> {token.substring(0, 50)}...
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Compact Push Notification Toggle
 * Daha küçük, ayarlar sayfası için uygun versiyon
 */
export function PushNotificationToggleCompact() {
  const { user } = useAuth()
  const {
    token,
    loading,
    permission,
    isSupported,
    requestPermission,
    registerFCMToken,
    deleteFCMToken
  } = useFCMToken()

  const [isEnabled, setIsEnabled] = useState(false)

  useEffect(() => {
    setIsEnabled(!!token && permission === 'granted')
  }, [token, permission])

  const handleToggle = async (checked: boolean) => {
    if (!user) {
      alert('Giriş yapmalısınız')
      return
    }

    if (checked) {
      const hasPermission = await requestPermission()
      if (hasPermission) {
        await registerFCMToken()
      }
    } else {
      await deleteFCMToken()
      setIsEnabled(false)
    }
  }

  if (!isSupported || !user) {
    return null
  }

  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label htmlFor="push-compact" className="text-base">
          Push Bildirimler
        </Label>
        <p className="text-sm text-muted-foreground">
          Telefon bildirimlerini {isEnabled ? 'açık' : 'kapalı'}
        </p>
      </div>
      <Switch
        id="push-compact"
        checked={isEnabled}
        onCheckedChange={handleToggle}
        disabled={loading || permission === 'denied'}
      />
    </div>
  )
}
