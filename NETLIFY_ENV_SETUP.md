# 🔧 NETLIFY ENVIRONMENT VARIABLES KURULUM REHBERİ

## 📋 Netlify Dashboard'da Yapılacaklar

1. **Netlify Dashboard'ı aç:**
   - https://app.netlify.com
   - Site'nizi seçin

2. **Environment Variables sayfasına git:**
   ```
   Site configuration → Environment variables
   ```

3. **"Add a variable" butonuna tıkla**

4. **Aşağıdaki değişkenleri TEK TEK ekle:**

---

## 🔥 Firebase Configuration (8 adet)

### 1. API Key
```
Key:   NEXT_PUBLIC_FIREBASE_API_KEY
Value: AIzaSyDx17NJkAZknMvRyDlNuFYaMdlMGFa-QmQ
Scope: All deploy contexts (veya Production + Deploy previews)
```

### 2. Auth Domain
```
Key:   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
Value: finans-sitem.firebaseapp.com
Scope: All deploy contexts
```

### 3. Project ID
```
Key:   NEXT_PUBLIC_FIREBASE_PROJECT_ID
Value: finans-sitem
Scope: All deploy contexts
```

### 4. Storage Bucket
```
Key:   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
Value: finans-sitem.firebasestorage.app
Scope: All deploy contexts
```

### 5. Messaging Sender ID
```
Key:   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
Value: 117402758273
Scope: All deploy contexts
```

### 6. App ID
```
Key:   NEXT_PUBLIC_FIREBASE_APP_ID
Value: 1:117402758273:web:93a296f43e393352057180
Scope: All deploy contexts
```

### 7. Database URL
```
Key:   NEXT_PUBLIC_FIREBASE_DATABASE_URL
Value: https://finans-sitem-default-rtdb.firebaseio.com
Scope: All deploy contexts
```

### 8. Measurement ID
```
Key:   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
Value: G-WLLK7B3WB5
Scope: All deploy contexts
```

---

## 🔔 VAPID Keys (Push Notifications - 3 adet)

### 9. VAPID Public Key
```
Key:   NEXT_PUBLIC_VAPID_PUBLIC_KEY
Value: [Firebase Console → Cloud Messaging → Web Push certificates → Copy]
Scope: All deploy contexts
```

**Nasıl Bulunur:**
1. Firebase Console → Projeniz → Project Settings
2. Cloud Messaging tab'ına git
3. "Web Push certificates" bölümünde "Generate key pair" (eğer yoksa)
4. Key'i kopyala (BFx... ile başlar)

### 10. VAPID Private Key
```
Key:   VAPID_PRIVATE_KEY
Value: [Firebase Console → Service accounts → Generate new private key → JSON'dan al]
Scope: All deploy contexts
```

**Nasıl Bulunur:**
1. Firebase Console → Project Settings → Service accounts
2. "Generate new private key" butonuna tıkla
3. İndirilen JSON dosyasını aç
4. `private_key` alanındaki değeri kopyala (tırnak işaretleri olmadan)

### 11. VAPID Email
```
Key:   VAPID_EMAIL
Value: mailto:admin@costikfinans.site
Scope: All deploy contexts
```

---

## ⚙️ Node Configuration (2 adet)

### 12. Node Version
```
Key:   NODE_VERSION
Value: 20
Scope: All deploy contexts
```

### 13. NPM Flags
```
Key:   NPM_FLAGS
Value: --legacy-peer-deps
Scope: All deploy contexts
```

---

## ✅ Son Adımlar

1. **Tüm değişkenleri ekledikten sonra:**
   - "Save" butonuna bas
   - Environment variables sayfasında 13 değişken görmeli

2. **Deploy'u tetikle:**
   ```
   Deploys → Trigger deploy → Deploy site
   ```

3. **Build log'unu izle:**
   - Deploy sayfasında "Deploy log" tıkla
   - "Building" → "Deploying" → "Published" sırasını bekle

4. **Test et:**
   - `https://your-site.netlify.app/api/debug-env` → JSON yanıt görmeli
   - `https://your-site.netlify.app/` → Ana sayfa yüklenmeli

---

## 🚨 Sık Yapılan Hatalar

❌ **Key kısmına değer, Value kısmına key yazmak**
✅ Key: `NEXT_PUBLIC_FIREBASE_API_KEY`, Value: `AIza...`

❌ **Scope'u "Production" seçmek (Deploy previews çalışmaz)**
✅ Scope: "All deploy contexts"

❌ **Değişkenleri ekledikten sonra deploy tetiklememek**
✅ Mutlaka "Trigger deploy" yap

❌ **VAPID key'leri tırnak işaretleriyle birlikte kopyalamak**
✅ Sadece key değerini kopyala (tırnaksız)

---

## 📞 Destek

Eğer hâlâ sorun yaşıyorsan:
1. Netlify build log'unu paylaş
2. `https://your-site.netlify.app/api/debug-env` yanıtını paylaş
3. Tarayıcı console'unu (F12) paylaş
