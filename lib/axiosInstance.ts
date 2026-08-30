import axios from "axios";
import { store } from "@/store/store";
import { clearAuth } from "@/store/authSlice";

const api = axios.create({
  baseURL: (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9090/api'),
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to each request & handle FormData
api.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.token; // read token from Redux state
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // When sending FormData, delete the default JSON Content-Type
    // so the browser auto-sets multipart/form-data with the correct boundary
    if (typeof FormData !== "undefined" && config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle unauthorized + rate-limit responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 401) {
      // Unauthorized → log out
      store.dispatch(clearAuth());
    } else if (status === 429) {
      // Too Many Requests → notify user
      console.error("Too many requests, please try again later.");
      // You can also trigger a toast or global error handler
    }

    return Promise.reject(error);
  }
);

export default api;
