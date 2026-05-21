/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['file-type'],
  turbopack: {},

  allowedDevOrigins: ['10.0.226.63', '10.0.239.166']
};

module.exports = nextConfig;
