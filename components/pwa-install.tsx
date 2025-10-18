'use client'

import { useEffect, useState } from 'react'
import { X, Download, Smartphone, Share, MoreVertical, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function PWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showIOSInstructions, setShowIOSInstructions] = useState(false)
  const [showAndroidInstructions, setShowAndroidInstructions] = useState(false)
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop' | 'unknown'>('unknown')
  const [showInstallButton, setShowInstallButton] = useState(false)

  useEffect(() => {
    // Cihaz tipini belirle
    const userAgent = navigator.userAgent.toLowerCase()
    const isIOS = /iphone|ipad|ipod/.test(userAgent)
    const isAndroid = /android/.test(userAgent)
    const isDesktop = !isIOS && !isAndroid

    console.log('[PWA Install] User Agent:', userAgent)
    console.log('[PWA Install] Device Detection:', { isIOS, isAndroid, isDesktop })

    if (isIOS) {
      setDeviceType('ios')
    } else if (isAndroid) {
      setDeviceType('android')
    } else if (isDesktop) {
      setDeviceType('desktop')
    }

    // Zaten yüklenmiş mi kontrol et
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const isIOSStandalone = (window.navigator as any).standalone === true
    
    console.log('[PWA Install] Standalone Check:', { isStandalone, isIOSStandalone })
    
    if (isStandalone || isIOSStandalone) {
      console.log('[PWA Install] Already installed, hiding button')
      setIsInstalled(true)
      return
    }

    // Android/Desktop için beforeinstallprompt event'ini dinle
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      console.log('[PWA Install] beforeinstallprompt event triggered')
      setInstallPrompt(e as BeforeInstallPromptEvent)
      setShowInstallButton(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // iOS için - beforeinstallprompt desteklenmiyor, manuel göster
    if (isIOS && !isIOSStandalone) {
      // iOS'ta dismiss edilmemişse butonu göster
      const isDismissed = localStorage.getItem('pwa-install-dismissed')
      console.log('[PWA Install] iOS dismissed status:', isDismissed)
      if (!isDismissed) {
        console.log('[PWA Install] Showing install button for iOS')
        setShowInstallButton(true)
      }
    }

    // Android için - beforeinstallprompt gelmezse manuel göster
    if (isAndroid && !isStandalone) {
      // Android için timeout ile kontrol - eğer 3 saniye içinde event gelmezse manuel göster
      const androidTimeout = setTimeout(() => {
        if (!installPrompt) {
          const isDismissed = localStorage.getItem('pwa-install-dismissed')
          console.log('[PWA Install] Android - No beforeinstallprompt after 3s, showing manual button. Dismissed:', isDismissed)
          if (!isDismissed) {
            console.log('[PWA Install] Showing manual install button for Android')
            setShowInstallButton(true)
          }
        }
      }, 3000)

      return () => {
        clearTimeout(androidTimeout)
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      }
    }

    // appinstalled event'ini dinle
    const handleAppInstalled = () => {
      console.log('[PWA Install] appinstalled event triggered')
      setIsInstalled(true)
      setShowInstallButton(false)
      localStorage.setItem('pwa-installed', 'true')
    }

    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deviceType === 'ios') {
      // iOS için talimatları göster
      setShowIOSInstructions(true)
    } else if (deviceType === 'android' && !installPrompt) {
      // Android'de prompt yoksa talimatları göster
      setShowAndroidInstructions(true)
    } else if (installPrompt) {
      // Android/Desktop için otomatik kurulum
      try {
        await installPrompt.prompt()
        const choiceResult = await installPrompt.userChoice
        
        if (choiceResult.outcome === 'accepted') {
          console.log('PWA kurulumu kabul edildi')
          setShowInstallButton(false)
        }
        
        setInstallPrompt(null)
      } catch (error) {
        console.error('Kurulum hatası:', error)
      }
    }
  }

  const dismissPrompt = () => {
    setShowInstallButton(false)
    localStorage.setItem('pwa-install-dismissed', 'true')
    
    // 7 gün sonra tekrar göster
    setTimeout(() => {
      localStorage.removeItem('pwa-install-dismissed')
    }, 7 * 24 * 60 * 60 * 1000)
  }

  // Zaten yüklüyse veya dismiss edildiyse gösterme
  console.log('[PWA Install] Render check:', { isInstalled, showInstallButton })
  
  if (isInstalled) {
    console.log('[PWA Install] Not rendering - already installed')
    return null
  }
  
  if (!showInstallButton) {
    console.log('[PWA Install] Not rendering - button not shown')
    return null
  }

  // Dismiss edilmiş mi kontrol et
  const isDismissed = localStorage.getItem('pwa-install-dismissed')
  console.log('[PWA Install] Dismissed check:', isDismissed)
  
  if (isDismissed) {
    console.log('[PWA Install] Not rendering - dismissed by user')
    return null
  }

  console.log('[PWA Install] Rendering button!', { deviceType })

  return (
    <>
      {/* Kurulum Butonu - Sağ alt köşede floating */}
      <div className="fixed bottom-20 right-4 z-[100] sm:bottom-6">
        <Button
          onClick={handleInstallClick}
          size="lg"
          className="rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 px-6 py-6 group"
        >
          <Download className="h-5 w-5 mr-2 group-hover:animate-bounce" />
          <span className="font-semibold">Uygulamayı İndir</span>
          <Button
            variant="ghost"
            size="icon"
            className="ml-2 h-6 w-6 rounded-full hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation()
              dismissPrompt()
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </Button>
      </div>

      {/* iOS Kurulum Talimatları */}
      <Dialog open={showIOSInstructions} onOpenChange={setShowIOSInstructions}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              iOS Kurulum Talimatları
            </DialogTitle>
            <DialogDescription>
              CostikFinans uygulamasını iPhone veya iPad'inize kurun
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert>
              <AlertTitle className="flex items-center gap-2">
                <Share className="h-4 w-4" />
                Adım 1: Paylaş Butonuna Dokun
              </AlertTitle>
              <AlertDescription>
                Safari tarayıcısında ekranın alt kısmındaki <strong>"Paylaş"</strong> butonuna (yukarı ok işareti) dokun
              </AlertDescription>
            </Alert>

            <Alert>
              <AlertTitle className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Adım 2: Ana Ekrana Ekle
              </AlertTitle>
              <AlertDescription>
                Açılan menüden <strong>"Ana Ekrana Ekle"</strong> seçeneğini bul ve dokun
              </AlertDescription>
            </Alert>

            <Alert>
              <AlertTitle className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Adım 3: Onayla
              </AlertTitle>
              <AlertDescription>
                Sağ üst köşedeki <strong>"Ekle"</strong> butonuna dokun. Uygulama ana ekranınıza eklenecek!
              </AlertDescription>
            </Alert>

            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                💡 <strong>İpucu:</strong> Safari tarayıcısı kullanmalısınız. Chrome veya başka bir tarayıcıdaysanız, bu sayfayı Safari'de açın.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowIOSInstructions(false)}>
              Anladım
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Android Manuel Kurulum Talimatları */}
      <Dialog open={showAndroidInstructions} onOpenChange={setShowAndroidInstructions}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Android Kurulum Talimatları
            </DialogTitle>
            <DialogDescription>
              CostikFinans uygulamasını Android cihazınıza kurun
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Alert>
              <AlertTitle className="flex items-center gap-2">
                <MoreVertical className="h-4 w-4" />
                Adım 1: Menüyü Aç
              </AlertTitle>
              <AlertDescription>
                Chrome tarayıcısında sağ üst köşedeki <strong>üç nokta</strong> menüsüne dokun
              </AlertDescription>
            </Alert>

            <Alert>
              <AlertTitle className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Adım 2: Uygulamayı Yükle
              </AlertTitle>
              <AlertDescription>
                Menüden <strong>"Ana ekrana ekle"</strong> veya <strong>"Uygulamayı yükle"</strong> seçeneğine dokun
              </AlertDescription>
            </Alert>

            <Alert>
              <AlertTitle className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Adım 3: Onayla
              </AlertTitle>
              <AlertDescription>
                Açılan pencerede <strong>"Yükle"</strong> veya <strong>"Ekle"</strong> butonuna dokun
              </AlertDescription>
            </Alert>

            <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-900 dark:text-green-100">
                💡 <strong>İpucu:</strong> Chrome tarayıcısı kullanmanız önerilir. Bazı tarayıcılarda bu özellik desteklenmeyebilir.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAndroidInstructions(false)}>
              Anladım
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
