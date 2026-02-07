import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { Menu, ShoppingBag, Grid2X2, ChevronRight } from "lucide-react";
import CartDialog from "@/components/cart/CartDialog";
import { useCart } from "@/providers/CartProvider";
import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import brandConfig from "@/brand-config.json";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { useTheme } from "@/providers/ThemeProvider";
import { useAuth } from "@/providers/AuthProvider";
import LoginButton from "@/components/auth/LoginButton";
import UserMenu from "@/components/auth/UserMenu";

type NavItem = {
  label: string;
  href: string;
};

const primaryNav: NavItem[] = [];

export function Navbar() {
  const { items } = useCart();
  const { theme } = useTheme();
  const { isLoggedIn } = useAuth();
  const logoSrc =
    theme === "dark" ? brandConfig.logoDark : brandConfig.logoLight;
  // Map cart items to CartDialog item props
  const drawerItems = items.map((i) => ({
    productId: i.productId,
    sku: i.sku,
    title: i.name,
    variant:
      i.color && i.size
        ? `${String(i.color).toUpperCase()} / ${String(i.size).toUpperCase()}`
        : i.sku,
    price: i.priceAtPurchase,
    quantity: i.quantity,
    image: i.image,
    color: i.color,
    size: i.size,
  }));

  return (
    <header className="sticky top-0 z-50 bg-background/80 border-b">
      <div className="max-w-7xl mx-auto px-2">
        <div className="h-14 flex items-center justify-between">
          {/* Left: Mobile menu + Brand */}
          <div className="flex items-center gap-1">
            <div className="md:hidden">
              <MobileMenu logoSrc={logoSrc} />
            </div>
            <NavLink
              to="/"
              aria-label={`${brandConfig.brandName} Home`}
              className="block">
              <img
                src={logoSrc}
                alt={brandConfig.brandName}
                className="h-16 w-auto"
              />
            </NavLink>
          </div>

          {/* Center: Primary navigation (desktop) */}
          <nav className="hidden md:flex items-center gap-4">
            {primaryNav.map((item) => (
              <NavLink
                key={item.label}
                to={item.href}
                className={({ isActive }) =>
                  `text-xs font-normal transition-colors ${
                    isActive
                      ? "text-foreground"
                      : "text-foreground/70 hover:text-foreground"
                  }`
                }>
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-1">
            <AnimatedThemeToggler
              className="rounded-full p-1 text-foreground/80"
              aria-label="Toggle theme"
            />
            {isLoggedIn ? <UserMenu /> : <LoginButton label="Login" />}
            <CartDialog items={drawerItems} />
          </div>
        </div>
      </div>
    </header>
  );
}

function MobileMenu({ logoSrc }: { logoSrc: string }) {
  const [categories, setCategories] = useState<
    Array<{ _id: number; name: string; slug: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const res = await api.get("/categories", {
          params: {
            limit: 8,
            sort: JSON.stringify({ name: 1 }),
            _ts: Date.now(),
          },
        });
        if (mounted) {
          const items = Array.isArray(res.data?.items) ? res.data.items : [];
          setCategories(
            items.map((c: any) => ({ _id: c._id, name: c.name, slug: c.slug })),
          );
        }
      } catch {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Open menu"
          className="rounded-full">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <div className="px-4 pt-2">
          <NavLink
            to="/"
            aria-label={`${brandConfig.brandName} Home`}
            className="block py-1"
            onClick={() => setOpen(false)}>
            <img
              src={logoSrc}
              alt={brandConfig.brandName}
              className="h-8 w-auto"
            />
          </NavLink>

          {/* CTAs */}
          <div className="mt-2 grid gap-1">
            <Button
              onClick={() => {
                setOpen(false);
                navigate("/shop");
              }}
              className="justify-start"
              variant="secondary">
              <ShoppingBag className="mr-2 h-4 w-4" /> Products
            </Button>
          </div>

          {/* Categories */}
          <div className="mt-4">
            <div className="flex items-center gap-1 text-xs uppercase tracking-wide text-muted-foreground px-1">
              <Grid2X2 className="h-4 w-4" /> Categories
            </div>
            <div className="mt-1 divide-y rounded-xl border overflow-hidden">
              {loading && (
                <div className="p-2 text-xs text-muted-foreground">
                  Loading…
                </div>
              )}
              {!loading && categories.length === 0 && (
                <div className="p-2 text-xs text-muted-foreground">
                  No categories
                </div>
              )}
              {categories.map((c) => (
                <button
                  key={c._id}
                  className="w-full flex items-center justify-between px-2 py-2 text-left hover:bg-accent"
                  onClick={() => {
                    setOpen(false);
                    navigate(`/shop?category=${encodeURIComponent(c.slug)}`);
                  }}>
                  <span className="text-xs font-normal">{c.name}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default Navbar;
