import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/providers/AuthProvider";

type ProtectedRouteProps = {
  children: React.ReactNode;
  minRole?: "editor" | "admin";
};

function roleRank(role?: string | null) {
  if (role === "admin") return 3;
  if (role === "editor") return 2;
  return 1;
}

export default function ProtectedRoute({
  children,
  minRole,
}: ProtectedRouteProps) {
  const { isLoggedIn, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!isLoggedIn) {
    // Smart Redirect to Google OAuth to preserve current path
    const redirect = encodeURIComponent(location.pathname);
    window.location.href = `/auth/google?redirect=${redirect}`;
    return <Navigate to="/" replace />;
  }

  if (minRole) {
    const currentRank = roleRank(user?.role ?? "customer");
    const requiredRank = roleRank(minRole);
    if (currentRank < requiredRank) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
}
