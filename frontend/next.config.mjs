/** @type {import('next').NextConfig} */
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const apiUrlObj = new URL(apiUrl);

const nextConfig = {
  async rewrites() {
    // Only use rewrites in development
    if (apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1')) {
      return [
        {
          source: '/api/:path*',
          destination: `${apiUrl}/api/:path*`,
        },
      ];
    }
    return [];
  },
  images: {
    remotePatterns: [
      {
        protocol: apiUrlObj.protocol.replace(':', ''),
        hostname: apiUrlObj.hostname,
        pathname: '/storage/**',
      },
    ],
  },
};

export default nextConfig;