/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: require('path').join(__dirname),
  experimental: {
    // Optimize for better performance
    optimizeCss: true,
  },
  // Ensure proper static file handling
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : '',
  // Configure allowed image hosts using remotePatterns
  images: {
    domains: [
      '7671cce951cfbc8e77bcd3e8aeeee8f6.r2.cloudflarestorage.com',
      'pub-16cad59449b5449d94c455f9654e7060.r2.dev'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '7671cce951cfbc8e77bcd3e8aeeee8f6.r2.cloudflarestorage.com',
        port: '',
      },
      {
        protocol: 'https',
        hostname: '*.7671cce951cfbc8e77bcd3e8aeeee8f6.r2.cloudflarestorage.com',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'pub-16cad59449b5449d94c455f9654e7060.r2.dev',
        port: '',
      },
    ],
  },
}

module.exports = nextConfig