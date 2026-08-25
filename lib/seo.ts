export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://minihisab.com";

export const PUBLIC_ROUTES = [
  "/",
  "/about",
  "/services",
  "/pricing",
  "/contact",
  "/login",
] as const;

export function absoluteUrl(path: string) {
  return new URL(path, SITE_URL).toString();
}
