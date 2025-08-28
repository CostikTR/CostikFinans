# CostikFinans

Next.js + Firebase finans uygulaması.

## Depoya Eklenecek Dosyalar (GitHub’a push)
- package.json, pnpm-lock.yaml
- next.config.mjs, tsconfig.json, postcss.config.mjs
- app/, components/, hooks/, lib/, styles/, public/, types/
- firebase.json, firestore.rules, firestore.indexes.json (önerilir)
- functions/ (Firebase Functions kullanıyorsanız)
- .env.example (örnek ortam değişkenleri)
- .gitignore

Hariç (commit etmeyin):
- node_modules/, .next/, out/, dist/, build/, .turbo/, .cache/
- .vercel/
- .env, .env.local, .env.*.local
- tsconfig.tsbuildinfo

## Sürüm/Uyum
- Node.js: 18–22 (Vercel’de 22.x önerilir)
- pnpm: 10.15.0 (packageManager ile kilitli)

## Ortam Değişkenleri
`.env.example` dosyasını kopyalayıp doldurun.

Windows PowerShell:
```powershell
Copy-Item .env.example .env.local
```

macOS/Linux (isteğe bağlı):
```bash
cp .env.example .env.local
```

Gerekli anahtarlar `lib/firebase.ts` içinde okunur (NEXT_PUBLIC_FIREBASE_*).

## Geliştirme
```powershell
pnpm install
pnpm dev
```

## GitHub’a Yükleme (ilk kez)
```powershell
git init
git add .
git commit -m "ilk sürüm"
git branch -M main
git remote add origin https://github.com/<kullanici>/<repo>.git
git push -u origin main
```

## Vercel Deploy
1) Vercel > New Project > GitHub repo’yu içe aktarın.
2) Framework: Next.js otomatik algılanır; pnpm-lock.yaml ile pnpm kullanılır.
3) Settings > Environment Variables: `.env.local` içeriğini ekleyin (NEXT_PUBLIC_FIREBASE_*).
4) Deploy.

İsteğe bağlı kurulum komutu (onay isteyen paketler için):
```bash
pnpm install --frozen-lockfile && pnpm approve-builds
```

## Sorun Giderme
- Ortam değişkenleri eksik: Vercel’de NEXT_PUBLIC_FIREBASE_* anahtarlarını ekleyin.
- 404/route: `app/` rotalarını ve dosya adlarını kontrol edin.
- Firebase hatası: `lib/firebase.ts` içindeki env anahtarlarının dolu olduğunu doğrulayın.
- Vercel uyarıları (Node/pnpm): Proje Ayarları > Node.js 22.x; pnpm otomatik. Lockfile (v9) ile uyumlu.
