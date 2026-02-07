import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/AuthProvider";
import { useLocation } from "react-router-dom";
import { LogIn } from "lucide-react";

export default function LoginButton({ label = "Login" }: { label?: string }) {
  const { startGoogleLogin } = useAuth();
  const location = useLocation();

  const onClick = () => {
    startGoogleLogin(location.pathname);
  };

  return (
    <Button onClick={onClick} variant="default" size="sm" aria-label="Login">
      <LogIn className="h-4 w-4" />
      <span className="hidden md:inline-block ml-2">{label}</span>
    </Button>
  );
}
