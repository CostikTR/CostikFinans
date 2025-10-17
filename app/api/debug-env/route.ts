import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  // Security: Only show which vars exist, not their values
  const firebaseVars = {
    NEXT_PUBLIC_FIREBASE_API_KEY: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: !!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_FIREBASE_DATABASE_URL: !!process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: !!process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  }

  const missing = Object.entries(firebaseVars)
    .filter(([, exists]) => !exists)
    .map(([key]) => key)

  return NextResponse.json({
    status: missing.length === 0 ? 'ok' : 'missing_vars',
    missing,
    allPresent: missing.length === 0,
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV,
  })
}
