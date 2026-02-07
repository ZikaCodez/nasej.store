import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Package, ShoppingBag, Users } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/providers/AuthProvider";

type AdminLayoutProps = {
  children: React.ReactNode;
};

const navItems = [
  {
    to: "/dashboard/overview",
    label: "Overview",
    icon: LayoutDashboard,
    value: "overview",
    minRole: "editor",
  },
  {
    to: "/dashboard/products",
    label: "Products",
    icon: Package,
    value: "products",
    minRole: "editor",
  },
  {
    to: "/dashboard/orders",
    label: "Orders",
    icon: ShoppingBag,
    value: "orders",
    minRole: "admin",
  },
  {
    to: "/dashboard/users",
    label: "Users",
    icon: Users,
    value: "users",
    minRole: "admin",
  },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const current =
    navItems.find((item) => location.pathname.startsWith(item.to))?.value ||
    "overview";

  const { user } = useAuth();
  const roleRank: Record<string, number> = { customer: 0, editor: 1, admin: 2 };
  const userRole = (user && (user.role as string)) || "customer";

  // Only include nav items where user's role meets or exceeds the minimum required role
  const allowedNav = navItems.filter((item) => {
    const min = (item.minRole as string) || "customer";
    return (roleRank[userRole] || 0) >= (roleRank[min] || 0);
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">Dashboard</h1>
          <p className="text-xs text-muted-foreground">
            Rova Management Portal
          </p>
        </div>
      </div>
      <Tabs
        value={current}
        onValueChange={(val) => {
          const target = navItems.find((item) => item.value === val);
          if (target) navigate(target.to);
        }}
        className="w-full">
        <TabsList className="w-full justify-start">
          {allowedNav.map((item) => (
            <TabsTrigger
              key={item.to}
              value={item.value}
              className="flex gap-2">
              <item.icon className="h-4 w-4" />
              <span className="hidden md:inline-block">{item.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
