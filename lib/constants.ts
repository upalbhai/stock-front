export const API_BASE_URL =
  typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? "/api"
    : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api");

export const CONTACT_EMAIL = "contact-us@minihisab.com";
