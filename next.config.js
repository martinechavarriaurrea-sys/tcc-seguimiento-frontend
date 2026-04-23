/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return process.env.NEXT_PUBLIC_MOCK_MODE === 'true'
      ? []
      : [
          {
            source: '/api/proxy/:path*',
            destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/:path*`,
          },
        ];
  },
};

module.exports = nextConfig;
