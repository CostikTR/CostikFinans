import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()

  // Sadece trailing slash normalization; dosyaları ve root'u es geç
  if (
    url.pathname !== '/' &&
    url.pathname.endsWith('/') &&
    !url.pathname.includes('.')
  ) {
    url.pathname = url.pathname.slice(0, -1)
    return NextResponse.redirect(url, 308)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // API ve Next statiklerini dışla; uzantılı dosyaları dışla
    '/((?!api|_next/static|_next/image|favicon.ico|icons/|.*\\..*).*)',
  ],
}
