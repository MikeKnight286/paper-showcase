/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['file-type'],
  turbopack: {},

  allowedDevOrigins: ['']
};

module.exports = nextConfig;
