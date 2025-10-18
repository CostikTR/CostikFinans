import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { auth } from '@/lib/firebase'

// VAPID ayarları (Firebase Cloud Messaging)
const vapidPublicKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!
const vapidPrivateKey = process.env.FIREBASE_VAPID_PRIVATE_KEY!
const vapidEmail = process.env.VAPID_EMAIL || 'mailto:admin@costikfinans.site'

// VAPID detaylarını ayarla
if (vapidPublicKey && vapidPrivateKey) {
  try {
    webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey)
    console.log('[Push Subscribe] VAPID configured successfully')
  } catch (error) {
    console.error('[Push Subscribe] VAPID configuration error:', error)
  }
}

// Subscription storage (production'da veritabanı kullanılmalı)
const subscriptions = new Map<string, any>()

export async function POST(request: NextRequest) {
  try {
    const subscription = await request.json()
    
    // Kullanıcı kimlik doğrulama (opsiyonel ama önerilir)
    const userId = request.headers.get('x-user-id') || 'anonymous'
    
    // Subscription'ı sakla (production'da Firestore kullanın)
    subscriptions.set(userId, subscription)
    
    console.log('Push subscription kaydedildi:', userId)
    
    // Test bildirimi gönder
    try {
      const payload = JSON.stringify({
        title: 'CostikFinans',
        body: 'Push bildirimler başarıyla aktif edildi! 🎉',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
      })
      
      await webpush.sendNotification(subscription, payload)
      console.log('Test bildirimi gönderildi')
    } catch (sendError) {
      console.error('Test bildirimi gönderilemedi:', sendError)
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Subscription başarıyla kaydedildi' 
    })
  } catch (error) {
    console.error('Subscription kaydetme hatası:', error)
    return NextResponse.json(
      { success: false, error: 'Subscription kaydedilemedi' },
      { status: 500 }
    )
  }
}

// Bildirim gönderme endpoint'i
export async function PUT(request: NextRequest) {
  try {
    const { userId, title, body, data } = await request.json()
    
    const subscription = subscriptions.get(userId)
    if (!subscription) {
      return NextResponse.json(
        { success: false, error: 'Subscription bulunamadı' },
        { status: 404 }
      )
    }
    
    const payload = JSON.stringify({
      title: title || 'CostikFinans',
      body: body || 'Yeni bir işlem gerçekleşti',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      data: data || {},
    })
    
    await webpush.sendNotification(subscription, payload)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Bildirim gönderildi' 
    })
  } catch (error) {
    console.error('Bildirim gönderme hatası:', error)
    return NextResponse.json(
      { success: false, error: 'Bildirim gönderilemedi' },
      { status: 500 }
    )
  }
}

// Tüm abonelere bildirim gönder
export async function PATCH(request: NextRequest) {
  try {
    const { title, body, data } = await request.json()
    
    const payload = JSON.stringify({
      title: title || 'CostikFinans',
      body: body || 'Yeni bir işlem gerçekleşti',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      data: data || {},
    })
    
    const results = []
    for (const [userId, subscription] of subscriptions.entries()) {
      try {
        await webpush.sendNotification(subscription, payload)
        results.push({ userId, success: true })
      } catch (error) {
        console.error(`Bildirim gönderilemedi (${userId}):`, error)
        results.push({ userId, success: false })
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Bildirimler gönderildi',
      results 
    })
  } catch (error) {
    console.error('Toplu bildirim hatası:', error)
    return NextResponse.json(
      { success: false, error: 'Bildirimler gönderilemedi' },
      { status: 500 }
    )
  }
}
