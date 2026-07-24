// API endpoint paths
export const API_ROUTES = {
  AUTH: {
    REGISTER: "/auth/register",
    LOGIN: "/auth/login",
    LOGIN_EMAIL: "/auth/login-email",
    ME: "/auth/me",
    SEND_OTP: "/auth/send-otp",
    VERIFY_OTP: "/auth/verify-otp",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
  },
  USERS: {
    BASE: "/users",
    INVITES: "/users/invites",
  },
  BUSINESS: {
    BASE: "/businesses",
  },
  // Add more API routes here as needed
};

// Frontend application routes
export const APP_BASE_ROUTE = "/dashboard";

export function appRoute(path = "") {
  if (!path || path === "/") return APP_BASE_ROUTE;
  return `${APP_BASE_ROUTE}${path.startsWith("/") ? path : `/${path}`}`;
}

export const APP_ROUTES = {
  HOME: "/",
  ABOUT: "/about",
  SERVICES: "/services",
  PRICING: "/pricing",
  CONTACT: "/contact",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: APP_BASE_ROUTE,
  BILLING: appRoute("/billing"),
  ORDERS: appRoute("/orders"),
  CUSTOMERS: appRoute("/customers"),
  INVOICES: appRoute("/invoices"),
  PRODUCTS: appRoute("/products"),
  CATEGORIES: appRoute("/categories"),
  STOCK: appRoute("/stock"),
  STOCK_TRANSFERS: appRoute("/stock/transfers"),
  UNITS: appRoute("/units"),
  PROFIT: appRoute("/profit"),
  REPORTS: appRoute("/reports"),
  EXPENSES: appRoute("/expenses"),
  OUTLETS: appRoute("/outlets"),
  STAFF: appRoute("/staff"),
  ROLES: appRoute("/roles"),
  AUDIT_LOGS: appRoute("/audit-logs"),
  SETTINGS: appRoute("/settings"),
  SUBSCRIBE: appRoute("/subscribe"),
  SUBSCRIBE_SUCCESS: appRoute("/subscribe/success"),
  ADMIN: appRoute("/admin"),
  ADMIN_BUSINESSES: appRoute("/admin/businesses"),
  ADMIN_AGENTS: appRoute("/admin/agents"),
  ADMIN_AGENTS_PERFORMANCE: appRoute("/admin/agents/performance"),
  ADMIN_PAYMENTS: appRoute("/admin/payments"),
  ADMIN_OUTLETS: appRoute("/admin/outlets"),
  ADMIN_USERS: appRoute("/admin/users"),
  ADMIN_PLAN_REQUESTS: appRoute("/admin/plan-requests"),
  ADMIN_SUBSCRIPTIONS: appRoute("/admin/subscriptions"),
  ADMIN_AUDIT_LOGS: appRoute("/admin/audit-logs"),
  ADMIN_PLANS: appRoute("/admin/plans"),
  ADMIN_SETTINGS: appRoute("/admin/settings"),
  AGENT: appRoute("/agent"),
  AGENT_CLIENTS: appRoute("/agent/clients"),
  AGENT_SETTINGS: appRoute("/agent/settings"),
  customerDetail: (id: string) => appRoute(`/customers/${id}`),
  invoiceDetail: (id: string) => appRoute(`/invoices/${id}`),
};
