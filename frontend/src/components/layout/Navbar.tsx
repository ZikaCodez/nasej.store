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
    <header className="sticky top-0 z-50 backdrop-blur-md bg-background/70 border-b">
      <div className="container mx-auto px-4">
        <div className="h-16 flex items-center justify-between">
          {/* Left: Mobile menu + Brand */}
          <div className="flex items-center gap-2">
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
                className="h-24 mt-1.5 w-auto"
              />
            </NavLink>
          </div>

          {/* Center: Primary navigation (desktop) */}
          <nav className="hidden md:flex items-center gap-6">
            {primaryNav.map((item) => (
              <NavLink
                key={item.label}
                to={item.href}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors ${
                    isActive
                      ? "text-foreground"
                      : "text-foreground/80 hover:text-foreground"
                  }`
                }>
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <AnimatedThemeToggler
              className="rounded-full p-2 hover:bg-accent text-foreground/90"
              aria-label="Toggle theme"
            />
            {isLoggedIn ? <UserMenu /> : <LoginButton label="Login" />}
            {/* Cart Dialog trigger connected to cart state */}
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
          className="rounded-full hover:bg-accent">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <div className="px-6 pt-4">
          <NavLink
            to="/"
            aria-label={`${brandConfig.brandName} Home`}
            className="block py-2"
            onClick={() => setOpen(false)}>
            <img
              src={logoSrc}
              alt={brandConfig.brandName}
              className="h-16 w-auto"
            />
          </NavLink>

          {/* CTAs */}
          <div className="mt-4 grid gap-2">
            <Button
              onClick={() => {
                setOpen(false);
                navigate("/shop");
              }}
              className="justify-start rounded-xl"
              variant="secondary">
              <ShoppingBag className="mr-2 h-4 w-4" /> See All Products
            </Button>
          </div>

          {/* Categories */}
          <div className="mt-6">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground px-1">
              <Grid2X2 className="h-4 w-4" /> Check These Categories
            </div>
            <div className="mt-2 divide-y rounded-2xl border overflow-hidden">
              {loading && (
                <div className="p-3 text-sm text-muted-foreground">
                  Loading…
                </div>
              )}
              {!loading && categories.length === 0 && (
                <div className="p-3 text-sm text-muted-foreground">
                  No categories
                </div>
              )}
              {categories.map((c) => (
                <button
                  key={c._id}
                  className="w-full flex items-center justify-between px-3 py-3 text-left hover:bg-accent"
                  onClick={() => {
                    setOpen(false);
                    navigate(`/shop?category=${encodeURIComponent(c.slug)}`);
                  }}>
                  <span className="text-sm font-medium">{c.name}</span>
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
