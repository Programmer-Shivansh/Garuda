const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
    domains: ['maps.galli.com']
  },
  experimental: {
    serverActions: true
  }
};

export default nextConfig;