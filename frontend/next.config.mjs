/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { typedRoutes: true },
  async rewrites() {
    const BE = process.env.BACKEND_URL; // örn: https://estate-commission-backend.onrender.com
    return [
      // API’yi backend’e yönlendir
      { source: '/api/transactions/:path*', destination: `${BE}/api/transactions/:path*` },
      { source: '/api/users/:path*',        destination: `${BE}/api/users/:path*` },
      { source: '/api/agents/:path*',       destination: `${BE}/api/agents/:path*` },

      // HealthCheck bileşeni /api/health çağırıyor; backend endpoint’i /health.
      { source: '/api/health',              destination: `${BE}/health` },
    ];
  },
};
export default nextConfig;
