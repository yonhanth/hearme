// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['i.scdn.co'], // ← Spotifyの画像ホストを許可！
  },
};

module.exports = nextConfig;
