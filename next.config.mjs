/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare Pages gibi statik barındırma için "out/" klasörüne export al
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Disable webpack persistent cache in dev to avoid OneDrive file locking/rename issues causing chunk errors
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false
    }
    return config
  },
}

export default nextConfig
