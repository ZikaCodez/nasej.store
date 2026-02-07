import { Instagram, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavLink } from "react-router-dom";
import brandConfig from "@/brand-config.json";
import { useTheme } from "@/providers/ThemeProvider";

export default function Footer() {
  const { theme } = useTheme();
  const logoSrc =
    theme === "dark" ? brandConfig.logoDark : brandConfig.logoLight;
  return (
    <footer className="border-t bg-background/80">
      <div className="max-w-7xl mx-auto px-2 py-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex flex-col items-center md:items-start">
            <NavLink
              to="/"
              aria-label={`${brandConfig.brandName} Home`}
              className="block">
              <img
                src={logoSrc}
                alt={brandConfig.brandName}
                className="h-14 w-auto"
              />
            </NavLink>
            <p className="mt-2 text-xs text-muted-foreground font-light">
              Premium local clothing.
            </p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap gap-2 justify-center">
            <a
              href="/faq"
              className="text-xs text-foreground/70 hover:text-foreground">
              FAQ
            </a>
            <a
              href="/returns-policy"
              className="text-xs text-foreground/70 hover:text-foreground">
              Returns Policy
            </a>
            <a
              href="/terms"
              className="text-xs text-foreground/70 hover:text-foreground">
              Terms
            </a>
            <a
              href="/privacy"
              className="text-xs text-foreground/70 hover:text-foreground">
              Privacy
            </a>
          </nav>

          {/* Social / Contact */}
          <div className="flex gap-2">
            <a
              href="https://www.instagram.com/rova___eg/"
              aria-label="Instagram"
              title="Instagram">
              <Button variant="outline" size="icon-sm" className="rounded-full">
                <Instagram className="size-4" />
              </Button>
            </a>
            <a
              href="https://wa.me/+201276008484"
              aria-label="WhatsApp"
              title="WhatsApp">
              <Button variant="outline" size="icon-sm" className="rounded-full">
                <Phone className="size-4" />
              </Button>
            </a>
          </div>
        </div>
        <div className="mt-6 text-xs text-muted-foreground text-center">
          © {new Date().getFullYear()} Rova. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
