# PWA 404 Hata Çözümü

Bu dokümantasyon, PWA (Progressive Web App) uygulamasında 404 hatalarının önlenmesi için uygulanan yapılandırmaları açıklar.

## Uygulanan Çözümler

### 1. Vercel Routing Yapılandırması (vercel.json)

#### PWA Dosyaları için Özel Yönlendirmeler
```json
"rewrites": [
  {
    "source": "/sw.js",
    "destination": "/sw.js"
  },
  {
    "source": "/workbox-:hash.js",
    "destination": "/workbox-:hash.js"
  },
  {
    "source": "/manifest.json",
    "destination": "/manifest.json"
  }
]
```

#### PWA Dosyaları için Özel Routes ve Headers
```json
"routes": [
  {
    "src": "/sw.js",
    "headers": {
      "Cache-Control": "public, max-age=0, must-revalidate",
      "Service-Worker-Allowed": "/"
    },
    "dest": "/sw.js"
  },
  {
    "src": "/workbox-(.*).js",
    "headers": {
      "Cache-Control": "public, max-age=31536000, immutable"
    },
    "dest": "/workbox-$1.js"
  },
  {
    "src": "/manifest.json",
    "headers": {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=0, must-revalidate"
    },
    "dest": "/manifest.json"
  }
]
```

#### Ek Headers
PWA dosyaları için özel cache ve güvenlik header'ları:
- **sw.js**: Cache-Control: no-cache + Service-Worker-Allowed
- **workbox-*.js**: Long-term caching
- **manifest.json**: Proper content-type + no-cache

### 2. Next.js PWA Yapılandırması (next.config.mjs)

#### Runtime Caching
```javascript
runtimeCaching: [
  {
    urlPattern: /^https?.*/,
    handler: 'NetworkFirst',
    options: {
      cacheName: 'offlineCache',
      expiration: {
        maxEntries: 200,
      },
    },
  },
]
```

#### Fallback Sayfası
```javascript
fallbacks: {
  document: '/offline',
}
```

### 3. Middleware Koruması (middleware.ts)

PWA dosyaları middleware'den hariç tutuldu:
```typescript
matcher: [
  '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|sw.js|manifest.json|icons).*)',
]
```

## Çalışma Prensibi

### 1. Service Worker Kaydı
- Service worker `/sw.js` yolundan sunulur
- `Cache-Control: no-cache` ile her zaman fresh sürüm yüklenir
- `Service-Worker-Allowed: /` ile tüm site için çalışma izni

### 2. Offline Destek
- Network yoksa veya 404 alırsa → `/offline` sayfasına yönlendirir
- Kritik sayfa ve asset'ler precache'lenir
- Runtime'da ziyaret edilen sayfalar cache'lenir

### 3. Caching Stratejisi

#### NetworkFirst (Default)
- İnternet varsa önce network'ten getir
- Başarısız olursa cache'ten sun
- Cache'i güncelle

#### CacheFirst (Static Assets)
- Önce cache'e bak
- Yoksa network'ten getir
- Hızlı yükleme için ideal

### 4. Fallback Mekanizması
```javascript
{
  handlerDidError: async ({ request }) => self.fallback(request)
}
```
Her route için hata durumunda offline sayfasına yönlendirme

## Test Etme

### 1. Production Deployment
```bash
git add .
git commit -m "PWA: 404 fix"
git push origin main
```

### 2. Browser'da Test
1. Chrome DevTools > Application > Service Workers
2. Service worker'ın registered olduğunu doğrula
3. Network > Offline modda test et
4. PWA install prompt'unu kontrol et

### 3. Dosya Erişimi Test
```bash
# Service worker
curl https://costikfinans.site/sw.js

# Manifest
curl https://costikfinans.site/manifest.json

# Workbox
curl https://costikfinans.site/workbox-*.js
```

## Beklenen Davranış

### ✅ Çalışması Gerekenler
- PWA install prompt görünür
- Offline modda uygulama çalışır
- Service worker hatasız yüklenir
- Manifest doğru parse edilir
- 404 hatası alınmaz

### ⚠️ Dikkat Edilmesi Gerekenler
- Service worker her deploymentda güncellenir
- Cache'lenen sayfalar eski kalabilir (hard refresh ile temizle)
- iOS Safari'de PWA desteği sınırlı
- Local storage ve IndexedDB offline data için kullanılır

## Sorun Giderme

### Service Worker Yüklenmiyor
1. HTTPS kullanıldığından emin ol
2. Browser console'da hata var mı kontrol et
3. Application > Service Workers > Unregister > Hard refresh

### 404 Hataları Devam Ediyor
1. `vercel.json` dosyası deployment'a dahil mi kontrol et
2. Vercel dashboard'da build logs'u incele
3. Cache'i temizle: `vercel --prod --force`

### Manifest Bulunamıyor
1. `/public/manifest.json` dosyası var mı kontrol et
2. Content-Type header doğru mu: `application/manifest+json`
3. CORS header'ları uygun mu kontrol et

## Faydalı Komutlar

```bash
# Vercel logs
vercel logs

# Force redeploy
vercel --prod --force

# Local test
pnpm dev

# Build test
pnpm build
pnpm start
```

## Kaynaklar

- [Next.js PWA](https://github.com/shadowwalker/next-pwa)
- [Workbox](https://developers.google.com/web/tools/workbox)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Vercel Routing](https://vercel.com/docs/concepts/projects/project-configuration)

## Son Güncelleme

Tarih: 2025-10-17
Versiyon: 2.0
Durum: ✅ Aktif ve Çalışıyor
