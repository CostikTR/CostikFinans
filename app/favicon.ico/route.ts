import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export const dynamic = 'force-static'

export async function GET() {
  // Fall back to an existing PNG icon as favicon to avoid 404s on platforms
  const candidates = [
    'icons/icon-96x96.png',
    'icons/icon-72x72.png',
    'icons/icon-144x144.png',
  ]
  for (const rel of candidates) {
    const p = path.join(process.cwd(), 'public', rel)
    try {
      const buf = await fs.readFile(p)
      // Convert Node Buffer to ArrayBuffer slice for Web Response
      const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
      return new NextResponse(ab, {
        headers: {
          // Many browsers accept PNG even for /favicon.ico
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=86400',
        },
      })
    } catch {}
  }
  return new NextResponse(null, { status: 404 })
}
