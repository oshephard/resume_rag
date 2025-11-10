/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Handle optional canvas dependency for pdfjs-dist
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
      };
      
      // Externalize canvas to prevent bundling issues
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push('canvas');
      } else {
        config.externals = [config.externals, 'canvas'];
      }
    }
    return config;
  },
}

module.exports = nextConfig

