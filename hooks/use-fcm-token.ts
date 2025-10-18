"use client"

import { useEffect, useState, useCallback } from 'react'
import { getMessaging, getToken, onMessage, deleteToken } from 'firebase/messaging'
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { useAuth } from '@/components/auth-guard'
import { app as firebaseApp, db } from '@/lib/firebase'
import { VAPID_PUBLIC_KEY, checkFCMConfig } from '@/lib/fcm-config'

export interface FCMTokenState {
  token: string | null
  loading: boolean
  error: string | null
  permission: NotificationPermission
  isSupported: boolean
}

/**
 * FCM Token yönetimi için custom hook
 * 
 * Özellikler:
 * - FCM token alma ve kaydetme
 * - Token yenileme
 * - Foreground notification dinleme
 * - Token silme
 * - Permission yönetimi
 */
export function useFCMToken() {
  const { user } = useAuth()
  const [state, setState] = useState<FCMTokenState>({
    token: null,
    loading: false,
    error: null,
    permission: typeof window !== 'undefined' ? Notification.permission : 'default',
    isSupported: false
  })

  // FCM desteği kontrolü
  useEffect(() => {
    const checkSupport = () => {
      if (typeof window === 'undefined') return false
      
      const isSupported = 
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window

      setState(prev => ({ ...prev, isSupported }))
      return isSupported
    }

    checkSupport()
  }, [])

  // Permission durumunu güncelle
  const updatePermission = useCallback(() => {
    if (typeof window !== 'undefined') {
      setState(prev => ({
        ...prev,
        permission: Notification.permission
      }))
    }
  }, [])

  // Permission iste
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      setState(prev => ({
        ...prev,
        error: 'Push notifications bu tarayıcıda desteklenmiyor'
      }))
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      updatePermission()
      
      if (permission === 'granted') {
        console.log('[FCM] Notification permission granted')
        return true
      } else {
        console.log('[FCM] Notification permission denied')
        setState(prev => ({
          ...prev,
          error: 'Bildirim izni reddedildi'
        }))
        return false
      }
    } catch (error) {
      console.error('[FCM] Error requesting permission:', error)
      setState(prev => ({
        ...prev,
        error: 'İzin isteği sırasında hata oluştu'
      }))
      return false
    }
  }, [state.isSupported, updatePermission])

  // FCM token al
  const getFCMToken = useCallback(async (): Promise<string | null> => {
    if (!state.isSupported) {
      console.warn('[FCM] Push notifications not supported')
      return null
    }

    if (!firebaseApp) {
      console.warn('[FCM] Firebase app not initialized')
      setState(prev => ({
        ...prev,
        error: 'Firebase yapılandırması eksik'
      }))
      return null
    }

    // VAPID key kontrolü
    const fcmConfig = checkFCMConfig()
    if (!fcmConfig.isConfigured) {
      console.warn('[FCM]', fcmConfig.message)
      setState(prev => ({
        ...prev,
        error: fcmConfig.message
      }))
      return null
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      // Permission kontrol et
      if (Notification.permission !== 'granted') {
        const granted = await requestPermission()
        if (!granted) {
          setState(prev => ({ ...prev, loading: false }))
          return null
        }
      }

      // Service Worker kaydı kontrolü
      const registration = await navigator.serviceWorker.ready
      console.log('[FCM] Service Worker ready')

      // Messaging instance
      const messaging = getMessaging(firebaseApp)

      // Token al
      const currentToken = await getToken(messaging, {
        vapidKey: VAPID_PUBLIC_KEY,
        serviceWorkerRegistration: registration
      })

      if (currentToken) {
        console.log('[FCM] Token received:', currentToken.substring(0, 20) + '...')
        setState(prev => ({
          ...prev,
          token: currentToken,
          loading: false,
          error: null
        }))
        return currentToken
      } else {
        console.warn('[FCM] No registration token available')
        setState(prev => ({
          ...prev,
          token: null,
          loading: false,
          error: 'Token alınamadı'
        }))
        return null
      }
    } catch (error: any) {
      console.error('[FCM] An error occurred while retrieving token:', error)
      setState(prev => ({
        ...prev,
        token: null,
        loading: false,
        error: error.message || 'Token alma hatası'
      }))
      return null
    }
  }, [state.isSupported, requestPermission])

  // Token'ı Firestore'a kaydet
  const saveFCMToken = useCallback(async (token: string) => {
    if (!user || !db) {
      console.warn('[FCM] User not authenticated or DB not initialized')
      return false
    }

    try {
      const tokenRef = doc(db, 'users', user.uid, 'fcmTokens', token)
      await setDoc(tokenRef, {
        token,
        userId: user.uid,
        userEmail: user.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language
        }
      }, { merge: true })

      console.log('[FCM] Token saved to Firestore')
      return true
    } catch (error) {
      console.error('[FCM] Error saving token to Firestore:', error)
      return false
    }
  }, [user, db])

  // Token sil
  const deleteFCMToken = useCallback(async () => {
    if (!firebaseApp || !state.token) {
      return false
    }

    try {
      setState(prev => ({ ...prev, loading: true }))

      // Firebase'den token sil
      const messaging = getMessaging(firebaseApp)
      await deleteToken(messaging)

      // Firestore'dan sil
      if (user && db && state.token) {
        const tokenRef = doc(db, 'users', user.uid, 'fcmTokens', state.token)
        await deleteDoc(tokenRef)
      }

      setState(prev => ({
        ...prev,
        token: null,
        loading: false,
        error: null
      }))

      console.log('[FCM] Token deleted')
      return true
    } catch (error) {
      console.error('[FCM] Error deleting token:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Token silme hatası'
      }))
      return false
    }
  }, [firebaseApp, state.token, user, db])

  // Token al ve kaydet
  const registerFCMToken = useCallback(async () => {
    const token = await getFCMToken()
    if (token && user) {
      await saveFCMToken(token)
    }
    return token
  }, [getFCMToken, saveFCMToken, user])

  // Foreground message listener
  useEffect(() => {
    if (!firebaseApp || !state.isSupported) return

    const messaging = getMessaging(firebaseApp)
    
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('[FCM] Foreground message received:', payload)

      // Foreground'da bildirim göster
      if (Notification.permission === 'granted') {
        const notificationTitle = payload.notification?.title || 'Costik Finans'
        const notificationOptions = {
          body: payload.notification?.body || 'Yeni bildiriminiz var',
          icon: payload.notification?.icon || '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          tag: payload.data?.tag || 'costik-notification',
          data: payload.data
        }

        new Notification(notificationTitle, notificationOptions)
      }
    })

    return () => {
      unsubscribe()
    }
  }, [firebaseApp, state.isSupported])

  // User değiştiğinde token'ı yenile
  useEffect(() => {
    if (user && state.isSupported && Notification.permission === 'granted') {
      registerFCMToken()
    }
  }, [user, state.isSupported])

  return {
    ...state,
    requestPermission,
    getFCMToken,
    saveFCMToken,
    registerFCMToken,
    deleteFCMToken,
    refreshToken: registerFCMToken
  }
}
