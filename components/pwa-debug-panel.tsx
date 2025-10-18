'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

interface PWACheckResult {
  manifest: boolean
  serviceWorker: boolean
  https: boolean
  icons: boolean
  displayMode: string
  beforeInstallPrompt: boolean
  deviceType: string
  standalone: boolean
}

export function PWADebugPanel() {
  const [checks, setChecks] = useState<PWACheckResult | null>(null)
  const [showPanel, setShowPanel] = useState(false)

  useEffect(() => {
    // CTRL + SHIFT + P ile panel aç/kapat
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setShowPanel(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  useEffect(() => {
    if (!showPanel) return

    const runChecks = async () => {
      const results: PWACheckResult = {
        manifest: false,
        serviceWorker: false,
        https: false,
        icons: false,
        displayMode: 'browser',
        beforeInstallPrompt: false,
        deviceType: 'unknown',
        standalone: false
      }

      // 1. HTTPS Check
      results.https = window.location.protocol === 'https:' || window.location.hostname === 'localhost'

      // 2. Manifest Check
      try {
        const manifestLink = document.querySelector('link[rel="manifest"]')
        if (manifestLink) {
          const manifestUrl = (manifestLink as HTMLLinkElement).href
          const response = await fetch(manifestUrl)
          const manifest = await response.json()
          results.manifest = !!manifest.name
          results.icons = manifest.icons && manifest.icons.length > 0
        }
      } catch (e) {
        console.error('Manifest check failed:', e)
      }

      // 3. Service Worker Check
      if ('serviceWorker' in navigator) {
        results.serviceWorker = true
        const registration = await navigator.serviceWorker.getRegistration()
        console.log('SW Registration:', registration)
      }

      // 4. Display Mode
      results.displayMode = window.matchMedia('(display-mode: standalone)').matches ? 'standalone' : 'browser'
      results.standalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true

      // 5. Device Type
      const ua = navigator.userAgent.toLowerCase()
      if (/iphone|ipad|ipod/.test(ua)) results.deviceType = 'iOS'
      else if (/android/.test(ua)) results.deviceType = 'Android'
      else results.deviceType = 'Desktop'

      // 6. beforeinstallprompt Support
      let promptReceived = false
      const handler = () => { promptReceived = true }
      window.addEventListener('beforeinstallprompt', handler)
      
      setTimeout(() => {
        results.beforeInstallPrompt = promptReceived
        window.removeEventListener('beforeinstallprompt', handler)
        setChecks(results)
      }, 1000)
    }

    runChecks()
  }, [showPanel])

  if (!showPanel || !checks) return null

  const CheckItem = ({ label, status, note }: { label: string, status: boolean | string, note?: string }) => (
    <div className="flex items-start gap-3 p-3 bg-background rounded-lg border">
      {typeof status === 'boolean' ? (
        status ? (
          <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
        ) : (
          <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
        )
      ) : (
        <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="font-medium">{label}</div>
        {note && <div className="text-sm text-muted-foreground mt-1">{note}</div>}
        {typeof status === 'string' && <div className="text-sm text-blue-600 dark:text-blue-400 font-mono mt-1">{status}</div>}
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="max-w-2xl mx-auto bg-card border rounded-lg p-6 my-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">PWA Debug Panel</h2>
          <button 
            onClick={() => setShowPanel(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕ Kapat
          </button>
        </div>

        <div className="space-y-3">
          <CheckItem 
            label="HTTPS / Localhost" 
            status={checks.https}
            note={checks.https ? "✓ Güvenli bağlantı" : "✗ HTTPS gerekli (localhost hariç)"}
          />
          
          <CheckItem 
            label="Manifest Dosyası" 
            status={checks.manifest}
            note={checks.manifest ? "✓ manifest.json bulundu" : "✗ manifest.json bulunamadı"}
          />
          
          <CheckItem 
            label="App Icons" 
            status={checks.icons}
            note={checks.icons ? "✓ İkonlar tanımlı" : "✗ manifest.json'da icon eksik"}
          />
          
          <CheckItem 
            label="Service Worker" 
            status={checks.serviceWorker}
            note={checks.serviceWorker ? "✓ Service Worker destekleniyor" : "✗ Service Worker desteklenmiyor"}
          />
          
          <CheckItem 
            label="Cihaz Tipi" 
            status={checks.deviceType}
          />
          
          <CheckItem 
            label="Display Mode" 
            status={checks.displayMode}
            note={checks.standalone ? "✓ Standalone modda çalışıyor (zaten kurulu)" : "Browser modda"}
          />
          
          <CheckItem 
            label="beforeinstallprompt Event" 
            status={checks.beforeInstallPrompt}
            note={checks.beforeInstallPrompt ? 
              "✓ Chrome/Android otomatik prompt destekleniyor" : 
              checks.deviceType === 'iOS' ? 
                "iOS manuel kurulum gerektirir (normal)" : 
                "✗ Event tetiklenmedi - PWA kriterleri karşılanmamış olabilir"
            }
          />
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">💡 Kullanım:</h3>
          <ul className="text-sm space-y-1 text-blue-800 dark:text-blue-200">
            <li>• <strong>CTRL + SHIFT + P</strong> ile bu paneli aç/kapat</li>
            <li>• Browser Console'da <strong>[PWA Install]</strong> loglarını kontrol edin</li>
            <li>• Chrome DevTools → Application → Manifest</li>
            <li>• Chrome DevTools → Application → Service Workers</li>
          </ul>
        </div>

        <div className="mt-4 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">localStorage Debug:</h3>
          <div className="text-sm font-mono space-y-1">
            <div>pwa-install-dismissed: {localStorage.getItem('pwa-install-dismissed') || 'null'}</div>
            <div>pwa-installed: {localStorage.getItem('pwa-installed') || 'null'}</div>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('pwa-install-dismissed')
              localStorage.removeItem('pwa-installed')
              alert('localStorage temizlendi! Sayfayı yenileyin.')
            }}
            className="mt-2 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
          >
            localStorage Temizle
          </button>
        </div>

        <div className="mt-4 text-xs text-muted-foreground text-center">
          PWA Debug Panel - Press CTRL+SHIFT+P to toggle
        </div>
      </div>
    </div>
  )
}
