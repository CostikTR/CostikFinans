import withPWA from 'next-pwa'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel için SSR modunda deploy (dynamic routes çalışır)
  distDir: '.next',
  // Public assets için explicit config
  publicRuntimeConfig: {},
  
  // Netlify/Vercel için environment variables (explicit export for client)
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_FIREBASE_DATABASE_URL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Vercel deployment için gerekli
  poweredByHeader: false,
  reactStrictMode: true,
  
  // Next.js 15 için experimental features
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  
  // Webpack config
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      config.cache = false
    }
    // Prevent webpack warnings
    config.infrastructureLogging = {
      level: 'error',
    }
    
    // PWA dosyalarını static export'a ekle
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
      }
    }
    
    return config
  },
  
  // Public asset prefix
  assetPrefix: undefined,
}

export default withPWA({
  dest: 'public',
  register: false, // Manuel registration yapıyoruz (app/providers.tsx'de)
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  // BASIT CONFIG - 404 hatalarını önlemek için
  publicExcludes: ['!robots.txt', '!sitemap.xml'],
})(nextConfig)
