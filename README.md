# CostikFinans — Deploy & Setup Guide

This repo is a Next.js (App Router) + TypeScript + Tailwind + Firebase app.

## Prerequisites
- Firebase project: `finans-sitem` (done). Add your web app config as environment variables.
- GitHub repo: `CostikFinans` (use this as the remote).
- Vercel account connected to GitHub.

## Environment variables (Firebase)
Create a `.env.local` in the project root (already present locally and ignored by git) and set:
- NEXT_PUBLIC_FIREBASE_API_KEY
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
- NEXT_PUBLIC_FIREBASE_PROJECT_ID
- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- NEXT_PUBLIC_FIREBASE_APP_ID
- NEXT_PUBLIC_FIREBASE_DATABASE_URL (optional)
- NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID (optional)

On Vercel, add the SAME variables in Project Settings > Environment Variables for both Production and Preview.

Optional: local installment runner
- NEXT_PUBLIC_ENABLE_LOCAL_TAKSIT_RUNNER=true

## Push to GitHub (CostikFinans)
You can use GitHub Desktop (recommended on Windows) or Git Bash.

GitHub Desktop:
1. File > Add local repository > Select this folder
2. Set the remote to `https://github.com/<kullanici>/CostikFinans.git`
3. Commit & Push.

Git (after you install Git for Windows):
```
# From this folder
git init
git add .
git commit -m "chore: initial commit"
git branch -M main
git remote add origin https://github.com/<kullanici>/CostikFinans.git
git push -u origin main
```

## Deploy on Vercel
1. Vercel Dashboard > Add New > Project > Import `CostikFinans` repo
2. Framework detected: Next.js; Build: `next build`; Install: `pnpm` (pnpm-lock.yaml present)
3. Add the Firebase env vars (above) for Production and Preview
4. Deploy

## Firebase Authentication — Authorized domains
In Firebase Console > Authentication > Settings > Authorized domains:
- Add your Vercel domain: `<project>.vercel.app`
- Add your custom domain if any

If you enable GitHub provider, configure callback URL:
- `https://<YOUR_AUTH_DOMAIN>/__/auth/handler` (e.g., https://finans-sitem.firebaseapp.com/__/auth/handler)

## Optional: Cloud Functions (taksit scheduler)
This repo contains `functions/` for scheduled installment processing. To deploy:
1. Install Firebase CLI
2. Login: `firebase login`
3. Ensure `.firebaserc` default is `finans-sitem` (already set)
4. From repo root: `firebase deploy --only functions`

## Local development
```
pnpm install
pnpm dev
```
The app runs on http://localhost:3000

## Notes
- Do NOT commit `.env*` files. `.gitignore` already excludes them.
- Keep `pnpm-lock.yaml` in the repo for deterministic builds on Vercel.
