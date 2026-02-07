import axios from "axios";
import { toast } from "sonner";

// API base: use VITE_API_URL if provided, else proxy base '/api'
// Ensure '/api' suffix when using absolute backend origin.
const raw = import.meta.env.VITE_API_URL;
export const API_URL = raw ? `${raw.replace(/\/$/, "")}/api` : "/api";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 30000,
});

api.interceptors.request.use(
  (config: any) => {
    if (import.meta.env.DEV) {
      console.log(
        `API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
      );
    }
    return config;
  },
  (error: any) => {
    if (import.meta.env.DEV) {
      console.error("API Request Error:", error);
    }
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response: any) => {
    const data = response?.data;
    if (
      data &&
      typeof data === "object" &&
      "code" in data &&
      data.code !== 200
    ) {
      const msg =
        (data as any).details ||
        (data as any).message ||
        `Request failed (code ${(data as any).code})`;
      toast.error(String(msg));
    }
    if (import.meta.env.DEV) {
      console.log(`API Response: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error: any) => {
    const status = error.response?.status;
    const data = error.response?.data;
    const cfg = error.config || {};
    const isSilent = cfg.headers?.["x-silent"] === "1";
    if (import.meta.env.DEV && !isSilent) {
      console.error("API Response Error:", status, data);
    }
    // Handle expired sessions: clear local auth and redirect with a flag
    if (status === 401 && !isSilent && typeof window !== "undefined") {
      try {
        localStorage.removeItem("rova_auth_user");
      } catch {
        // ignore
      }
      const url = new URL(window.location.href);
      if (!url.searchParams.has("sessionExpired")) {
        url.searchParams.set("sessionExpired", "1");
      }
      window.location.href = `${url.pathname}${url.search}${url.hash}`;
      return Promise.reject(error);
    }
    if (!isSilent) {
      const message =
        (data && (data.details || data.message)) ||
        error.message ||
        "An error occurred";
      toast.error(String(message));
    }
    return Promise.reject(error);
  },
);

export default api;

export const createApiUrl = (path: string) => {
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${API_URL}/${cleanPath}`;
};
