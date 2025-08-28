# CostikFinans

Next.js + Firebase uygulaması.

## Gerekli Dosyalar (GitHub’a push)
- package.json, pnpm-lock.yaml
- next.config.mjs, tsconfig.json, postcss.config.mjs
- app/, components/, hooks/, lib/, styles/, public/, types/
- firebase.json, firestore.rules, firestore.indexes.json (opsiyonel ama önerilir)
- functions/ (Firebase Functions kullanıyorsanız)
- .env.example (örnek ortam değişkenleri)
- .gitignore

Hariç (commit etmeyin):
- node_modules/, .next/, out/, dist/, build/, .turbo/, .cache/
- .vercel/
- .env, .env.local, .env.*.local
- tsconfig.tsbuildinfo

## Ortam Değişkenleri
`.env.example` dosyasını kopyalayıp doldurun:
```
cp .env.example .env.local
```
Gerekli anahtarlar `lib/firebase.ts` içinde okunuyor (NEXT_PUBLIC_FIREBASE_*).

## Geliştirme
```
pnpm install
pnpm dev
```

## GitHub’a Yükleme (ilk kez)
```
git init
git add .
git commit -m "init"
git branch -M main
git remote add origin https://github.com/<kullanici>/<repo>.git
git push -u origin main
```

## Vercel Deploy
1) Vercel > New Project > GitHub repo’yu import edin.
2) Framework: Next.js otomatik; pnpm-lock.yaml ile pnpm kullanılır.
3) Settings > Environment Variables: `.env.local` içeriğini ekleyin.
4) Deploy.

## Sorun Giderme
- Build env eksik: Vercel’de NEXT_PUBLIC_FIREBASE_* anahtarlarını ekleyin.
- 404/route hataları: app/ yönlendirmelerini kontrol edin.
- Firebase hatası: `lib/firebase.ts` env’lerin dolu olduğunu doğrulayın.
