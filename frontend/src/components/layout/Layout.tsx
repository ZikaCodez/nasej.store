import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { toast } from "sonner";

type LayoutProps = {
  children: React.ReactNode;
};

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search || "");
      if (params.get("sessionExpired") === "1") {
        toast.error("Your session has expired. Please sign in again.");
        params.delete("sessionExpired");
        const search = params.toString();
        const next = `${location.pathname}${search ? `?${search}` : ""}${window.location.hash}`;
        window.history.replaceState(null, "", next);
      }
    } catch {
      // ignore
    }
  }, [location.pathname, location.search]);

  return (
    <div className="min-h-dvh flex flex-col p-3">
      {/* Sticky Navbar with backdrop blur handled in Navbar component */}
      <Navbar />
      {/* Page content */}
      <main className="flex-1 p-6">{children}</main>
      {/* Consistent Footer */}
      <Footer />
      {/* App-wide notifications handled in root `main.tsx` Toaster */}
    </div>
  );
}
