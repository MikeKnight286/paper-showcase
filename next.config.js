/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['file-type'],
  turbopack: {},

  allowedDevOrigins: ['10.0.226.63']
};

module.exports = nextConfig;
