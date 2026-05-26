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
export const APP_ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/admin",
  SETTINGS: "/settings",
  PRODUCTS: "/products",
  CATEGORIES: "/categories",
  STOCK: "/stock",
  OUTLETS: "/outlets",
};
