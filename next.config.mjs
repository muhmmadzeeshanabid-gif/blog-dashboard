/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    return {
      fallback: [
        {
          source: '/images/:path*',
          destination: '/api/resolve-image?url=/images/:path*',
        },
      ],
    };
  },
};

export default nextConfig;
