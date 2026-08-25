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

const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  async redirects() {
    return dashboardSections.map((section) => ({
      source: `/${section}/:path*`,
      destination: `/dashboard/${section}/:path*`,
      permanent: true,
    }));
  },
};

export default nextConfig;
