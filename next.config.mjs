/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/r/:token/room-status',
        destination: '/r/:token',
        permanent: true,
      },
      {
        source: '/r/demo-:token',
        destination: '/r/:token',
        permanent: true,
      },
      {
        source: '/r/demo-:token/:path*',
        destination: '/r/:token/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
