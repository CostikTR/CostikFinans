import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/notifications/send
 * Push notification gönderir (Firebase Cloud Functions üzerinden)
 * 
 * Bu endpoint Firebase Cloud Functions üzerinden çalışacak
 * şekilde tasarlanmıştır. Local'de çalışması için firebase-admin
 * paketi ve credentials gerekir.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      token, 
      tokens, // Çoklu token için
      title, 
      body: messageBody, 
      data,
      notificationType 
    } = body

    // Token kontrolü
    if (!token && (!tokens || tokens.length === 0)) {
      return NextResponse.json(
        { error: 'En az bir token gerekli' },
        { status: 400 }
      )
    }

    // Title kontrolü
    if (!title || !messageBody) {
      return NextResponse.json(
        { error: 'Title ve body gerekli' },
        { status: 400 }
      )
    }

    // Firebase Cloud Functions'a istek gönder
    const functionsUrl = process.env.FIREBASE_FUNCTIONS_URL
    
    if (!functionsUrl) {
      return NextResponse.json(
        { 
          error: 'Firebase Functions yapılandırılmamış',
          message: 'Push notification göndermek için Firebase Functions gereklidir'
        },
        { status: 500 }
      )
    }

    const response = await fetch(`${functionsUrl}/sendPushNotification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token,
        tokens,
        notification: {
          title,
          body: messageBody
        },
        data: {
          ...data,
          type: notificationType || 'general',
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
    console.error('[FCM API] Error sending push notification:', error)
    return NextResponse.json(
      { 
        error: 'Push notification gönderilemedi',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/notifications/send
 * API bilgisi döner
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/notifications/send',
    method: 'POST',
    description: 'Push notification gönderir',
    requiredFields: {
      token: 'FCM token (string) or tokens (array)',
      title: 'Notification title (string)',
      body: 'Notification body (string)'
    },
    optionalFields: {
      data: 'Extra data (object)',
      notificationType: 'Notification type (string)'
    }
  })
}
