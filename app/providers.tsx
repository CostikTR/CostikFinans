"use client"

import { ReactNode, useEffect } from "react"
import { CalendarProvider } from "@/hooks/use-calendar-simple"
import { AuthProvider } from "@/components/auth-guard"
import { ThemeProvider } from "@/components/theme-provider"

export default function Providers({ children }: { children: ReactNode }) {
  // Service Worker Registration
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      const registerSW = async () => {
        try {
          console.log('🔄 Service Worker registration başlatılıyor...')
          
          // Ana service worker'ı register et
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
          })
          
          console.log('✅ Service Worker registered:', registration)
          
          // Update kontrolü
          registration.addEventListener('updatefound', () => {
            console.log('🔄 Service Worker güncellemesi bulundu')
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'activated') {
                  console.log('✅ Service Worker activated')
                  // Sayfayı yenile (isteğe bağlı)
                  // window.location.reload()
                }
              })
            }
          })

          // Enhanced service worker'ı da register et (push notifications için)
          await navigator.serviceWorker.register('/sw-enhanced.js')
          console.log('✅ Enhanced Service Worker registered')

        } catch (error) {
          console.error('❌ Service Worker registration failed:', error)
        }
      }

      registerSW()
    }
  }, [])

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <CalendarProvider>
          {children}
        </CalendarProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
