/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/ui", "@repo/utils", "@repo/database"],
}

module.exports = nextConfig
