const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    config.resolve.alias["@"] = path.resolve(__dirname, "src");
    return config;
  },

  // 🔽 This is the key part for Vercel
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
