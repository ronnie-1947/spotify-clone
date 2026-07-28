/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // `images.domains` was removed in Next 16 -- remotePatterns is the replacement.
    // Spotify serves album art from a number of *.scdn.co subdomains (i, mosaic,
    // thisis-images, ...), so match the wildcard rather than listing them one by one.
    remotePatterns: [
      { protocol: 'https', hostname: '**.scdn.co' },
      { protocol: 'https', hostname: 'platform-lookaside.fbsbx.com' },
    ],
  },
}

module.exports = nextConfig
