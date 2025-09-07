/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  transpilePackages: ["@repo/ui", "@repo/utils", "@repo/database"],
}

module.exports = nextConfig
