# 🔔 Push Notification Kurulum Rehberi

Push notification sistemi **başarıyla kuruldu**! 🎉

## ✅ Tamamlanan Adımlar

### 1. Paket Kurulumu
```bash
✅ pnpm add web-push
✅ pnpm add -D @types/web-push
```

### 2. VAPID Anahtarları Oluşturuldu
```bash
Public Key: BO0GefjiYBcSWPeT_U8bfZCFNHqzwp7FaRCseiyxhLPxplGW1ob7rh19w_se2U6-svB6xUs3SEYwUh4NoSTX3bI
Private Key: lA2gD039CTNOl20i4zszHr66evBcXIRTwsDx9JD3UcM
```

### 3. Environment Variables (.env.local)
```bash
✅ NEXT_PUBLIC_VAPID_PUBLIC_KEY eklendi
✅ VAPID_PRIVATE_KEY eklendi
✅ VAPID_EMAIL eklendi
```

### 4. Dosyalar Oluşturuldu/Güncellendi
```
✅ app/api/notifications/subscribe/route.ts - API endpoint'leri
✅ components/push-notification-toggle.tsx - Push notification toggle component
✅ public/sw-enhanced.js - Enhanced service worker
✅ app/notifications/page.tsx - Component entegrasyonu
✅ public/manifest.json - Notification izinleri eklendi
```

---

## 🚀 Kullanım

### 1. Uygulamayı Başlatın
```bash
pnpm dev
```

### 2. Bildirimler Sayfasına Gidin
- Ana menüden **"Bildirimler"** sayfasına tıklayın
- **"Push Bildirimler"** kartını göreceksiniz

### 3. Push Bildirimleri Aktif Edin
- **"Aktif Et"** butonuna tıklayın
- Tarayıcı bildirim izni isteyecek - **"İzin Ver"** seçin
- Hemen test bildirimi alacaksınız! 🎉

---

## 📱 API Kullanımı

### Tek Kullanıcıya Bildirim Gönder
```bash
curl -X PUT http://localhost:3000/api/notifications/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "title": "Yeni İşlem",
    "body": "1.500 TL harcama yapıldı",
    "data": {
      "amount": 1500,
      "type": "expense"
    }
  }'
```

### Tüm Kullanıcılara Bildirim Gönder
```bash
curl -X PATCH http://localhost:3000/api/notifications/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Sistem Bildirimi",
    "body": "Yeni özellikler eklendi!",
    "data": {
      "version": "2.0"
    }
  }'
```

---

## 🔧 Özelleştirme

### Bildirim Gönderme Örneği (Koddan)
```typescript
// Kullanıcıya push notification gönder
const sendPushNotification = async (userId: string, title: string, body: string) => {
  try {
    const response = await fetch('/api/notifications/subscribe', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        title,
        body,
        data: {
          timestamp: Date.now(),
        },
      }),
    })
    
    const result = await response.json()
    console.log('Bildirim gönderildi:', result)
  } catch (error) {
    console.error('Bildirim gönderilemedi:', error)
  }
}

// Kullanım
sendPushNotification('user123', 'Yeni Gelir', '5.000 TL maaş yatırıldı')
```

### Otomatik Bildirimler
İşlem eklendiğinde otomatik bildirim göndermek için:

```typescript
// app/page.tsx veya işlem ekleme fonksiyonunuzda
const onAdd = async (transaction: Transaction) => {
  // İşlemi kaydet...
  
  // Push notification gönder
  if (user?.uid) {
    await fetch('/api/notifications/subscribe', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.uid,
        title: transaction.type === 'gelir' ? 'Yeni Gelir' : 'Yeni Gider',
        body: `${formatTRY(transaction.amount)} - ${transaction.description}`,
        data: { transactionId: transaction.id },
      }),
    })
  }
}
```

---

## 🧪 Test Etme

### 1. Development Ortamında
```bash
pnpm dev
```
- http://localhost:3000/notifications adresine gidin
- Push bildirimleri aktif edin
- Test bildirimi otomatik gelecek

### 2. Production Ortamında
- PWA olarak telefona yükleyin
- Arka planda bile bildirim alabilirsiniz
- Uygulama kapalıyken bile çalışır!

---

## 📚 Ek Özellikler

### Service Worker Özellikleri
✅ Push notification desteği
✅ Background sync (offline işlemler)
✅ Cache yönetimi
✅ Offline mod desteği

### Bildirim Özellikleri
✅ Başlık ve açıklama
✅ Icon ve badge
✅ Tıklanabilir (uygulama açar)
✅ Vibrasyon desteği (mobil)
✅ Özel data gönderme

---

## 🔒 Güvenlik Notları

1. **VAPID Keys Güvenliği**
   - Private key'i asla client-side'da kullanmayın
   - .env.local dosyası git'e commit edilmemeli (.gitignore'da olmalı)

2. **Production Deployment**
   - Render.com veya hosting platformunda environment variables ekleyin
   - HTTPS zorunludur (PWA ve push notification için)

---

## 🎯 Sonuç

Push notification sistemi **tam çalışır** durumda! 

### Kullanıcı Deneyimi
1. Kullanıcı bildirimler sayfasına gider
2. "Aktif Et" butonuna tıklar
3. Tarayıcıdan izin verir
4. Hemen test bildirimi alır
5. Artık tüm önemli işlemler için bildirim alabilir!

### Geliştirici Faydaları
- Kolay API kullanımı
- Otomatik test bildirimi
- Production-ready kod
- TypeScript desteği
- Offline çalışma desteği

---

## 🆘 Sorun Giderme

### Bildirim Gelmiyor
1. Tarayıcı izni verildiğinden emin olun
2. HTTPS kullanıldığından emin olun (localhost'ta da çalışır)
3. Service worker kayıtlı mı kontrol edin: `navigator.serviceWorker.ready`
4. Console'da hata var mı kontrol edin

### API Hataları
1. Environment variables doğru mu kontrol edin
2. VAPID keys doğru format mı kontrol edin
3. Backend çalışıyor mu kontrol edin

---

**🎉 Kurulum tamamlandı! Artık push notification sisteminiz hazır!**
