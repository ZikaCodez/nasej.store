import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/providers/AuthProvider";
import {
  UserRound,
  ShoppingBag,
  Settings as SettingsIcon,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const name = user?.name || "Account";
  const role = user?.role;

  const go = (path: string) => {
    navigate(path);
  };

  const onLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" aria-label="User menu">
          <UserRound className="h-4 w-4" />
          <span className="hidden md:inline-block ml-2">{name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuItem onClick={() => go("/orders")}>
          <ShoppingBag className="mr-2 h-4 w-4" /> Orders
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => go("/account")}>
          <SettingsIcon className="mr-2 h-4 w-4" /> Settings
        </DropdownMenuItem>
        {(role === "admin" || role === "editor") && (
          <DropdownMenuItem onClick={() => go("/dashboard")}>
            <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onLogout}>
          <LogOut className="mr-2 h-4 w-4" /> Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
