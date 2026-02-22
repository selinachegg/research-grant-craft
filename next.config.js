/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // scheme_packs are loaded at runtime via fs — mark them as server-only assets
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't attempt to import 'fs' on the client
      config.resolve.fallback = { ...config.resolve.fallback, fs: false, path: false };
    }
    return config;
  },
};

module.exports = nextConfig;
