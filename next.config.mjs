/** @type {import('next').NextConfig} */
const dashboardSections = [
  "admin",
  "audit-logs",
  "billing",
  "categories",
  "customers",
  "expenses",
  "invoices",
  "orders",
  "outlets",
  "products",
  "profit",
  "reports",
  "roles",
  "settings",
  "staff",
  "stock",
  "subscribe",
  "units",
];

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
];

const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '4000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'minihisab.com',
      }
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return dashboardSections.map((section) => ({
      source: `/${section}/:path*`,
      destination: `/dashboard/${section}/:path*`,
      permanent: true,
    }));
  },
};

export default nextConfig;
