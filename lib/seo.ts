export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://minihisab.com";
export const SITE_NAME = "MiniHisab";
export const SITE_DESCRIPTION = "A service-first platform for retail owners who need billing, stock, outlets, staff, credit, GST invoices, and reports in one place.";
export const DEFAULT_KEYWORDS = ["retail billing", "inventory management", "hisab book", "pos system", "gst billing", "retail operations"];

export const PUBLIC_ROUTES = [
  "/",
  "/about",
  "/services",
  "/features",
  "/features/billing",
  "/features/inventory",
  "/features/gst-invoices",
  "/features/customer-khata",
  "/pricing",
  "/blog",
  "/contact",
] as const;

export function absoluteUrl(path: string) {
  return new URL(path, SITE_URL).toString();
}

export function getAbsoluteApiUrl(path = "") {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
  let baseUrl = envUrl;
  if (envUrl.startsWith("/")) {
    baseUrl = `http://localhost:4000${envUrl}`;
  }
  // Remove trailing slash from baseUrl if present, and leading slash from path
  const cleanBase = baseUrl.replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}
