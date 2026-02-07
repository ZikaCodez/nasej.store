import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { AuthContextValue, AuthState, AuthUser } from "@/types/auth";
import api from "@/lib/api";

const AUTH_STORAGE_KEY = "rova_auth_user";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    sessionVerified: false,
  });

  // Load from backend session (preferred), fallback to localStorage
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Use axios instance so baseURL works in prod and credentials are sent
        const res = await api.get("/auth/current_user");
        if (res.status === 200) {
          const data = res.data;
          if (mounted) {
            if (data && typeof data === "object") {
              const user = normalizeUser(data);
              localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
              setState({ user, loading: false, sessionVerified: true });
              // If incomplete profile (no phone or no address), redirect to complete-register once
              const needsProfile =
                !user.phone || !user.addresses || user.addresses.length === 0;
              const redirected = sessionStorage.getItem(
                "rova_profile_redirected",
              );
              if (needsProfile && !redirected) {
                sessionStorage.setItem("rova_profile_redirected", "1");
                // Avoid interfering with OAuth callback immediate navigation
                setTimeout(() => {
                  if (window.location.pathname !== "/complete-register") {
                    window.location.href = "/complete-register";
                  }
                }, 50);
              }
              return;
            } else {
              // Explicitly not logged in
              localStorage.removeItem(AUTH_STORAGE_KEY);
              setState({ user: null, loading: false, sessionVerified: false });
              return;
            }
          }
        }
      } catch {
        // ignore network errors, fall back to localStorage
      }
      try {
        const raw = localStorage.getItem(AUTH_STORAGE_KEY);
        if (raw) {
          const user: AuthUser = JSON.parse(raw);
          if (mounted)
            setState({ user, loading: false, sessionVerified: false });
        } else {
          if (mounted)
            setState({ user: null, loading: false, sessionVerified: false });
        }
      } catch {
        if (mounted)
          setState({ user: null, loading: false, sessionVerified: false });
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const login = (user: AuthUser) => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
    setState({ user, loading: false, sessionVerified: true });
  };

  const logout = async () => {
    try {
      await api.get("/auth/logout");
    } catch {
      // ignore
    }
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setState({ user: null, loading: false, sessionVerified: false });
  };

  const startGoogleLogin = (redirectPath?: string) => {
    const path = redirectPath || window.location.pathname;
    const raw = import.meta.env.VITE_API_URL;
    let backendOrigin = raw ? String(raw).replace(/\/$/, "") : "";
    // Always use backend API URL in production
    if (import.meta.env.MODE === "production" && backendOrigin) {
      window.location.href = `${backendOrigin}/auth/google?redirect=${encodeURIComponent(path)}`;
    } else {
      window.location.href = `/auth/google?redirect=${encodeURIComponent(path)}`;
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user: state.user,
      loading: state.loading,
      sessionVerified: state.sessionVerified,
      login,
      logout,
      startGoogleLogin,
      isLoggedIn: !!state.user,
    }),
    [state],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

function normalizeUser(raw: any): AuthUser {
  return {
    _id: Number(raw._id),
    name: String(raw.name || "User"),
    email: String(raw.email || ""),
    phone: raw.phone ? String(raw.phone) : undefined,
    role: raw.role,
    googleId: raw.googleId,
    addresses: Array.isArray(raw.addresses) ? raw.addresses : [],
    cartItems: Array.isArray(raw.cartItems) ? raw.cartItems : [],
  };
}
