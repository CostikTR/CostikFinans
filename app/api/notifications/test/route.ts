import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/notifications/test
 * Test notification gönderir
 * 
 * Not: Bu endpoint Firebase Cloud Functions kullanır
 * Local test için tarayıcı console'da manuel bildirim gösterebilirsiniz
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, userId } = body

    if (!token) {
      return NextResponse.json(
        { error: 'Token gerekli' },
        { status: 400 }
      )
    }

    // Firebase Cloud Functions URL
    const functionsUrl = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL

    if (!functionsUrl) {
      // Fallback: Client-side notification göster
      return NextResponse.json({
        success: true,
        message: 'Test bildirimi client-side gösterilecek',
        fallback: true,
        notification: {
          title: '🎉 Test Bildirimi',
          body: 'Push notification sistemi hazır! ✅',
          icon: '/icons/icon-192x192.png'
        }
      })
    }

    // Firebase Functions'a istek gönder
    const response = await fetch(`${functionsUrl}/sendTestNotification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token,
        userId,
        notification: {
          title: '🎉 Test Bildirimi',
          body: 'Push notification başarıyla çalışıyor! ✅'
        },
        data: {
          type: 'test',
          notificationId: `test-${Date.now()}`,
          url: '/notifications',
          timestamp: new Date().toISOString()
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Firebase Functions error: ${response.statusText}`)
    }

    const result = await response.json()

    return NextResponse.json({
      success: true,
      result
    })

  } catch (error: any) {
    console.error('[FCM API] Error sending test notification:', error)
    
    // Hata olsa bile client-side fallback döner
    return NextResponse.json({
      success: true,
      message: 'Test bildirimi client-side gösterilecek',
      fallback: true,
      error: error.message,
      notification: {
        title: '🎉 Test Bildirimi',
        body: 'Push notification sistemi hazır! ✅',
        icon: '/icons/icon-192x192.png'
      }
    })
  }
}
