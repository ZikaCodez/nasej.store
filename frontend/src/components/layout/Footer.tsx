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
    <footer className="border-t bg-background/70">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <NavLink
              to="/"
              aria-label={`${brandConfig.brandName} Home`}
              className="block">
              <img
                src={logoSrc}
                alt={brandConfig.brandName}
                className="h-16 mt-1.5 w-auto"
              />
            </NavLink>
            <p className="mt-3 text-sm text-muted-foreground">
              Premium local clothing. Crafted with care.
            </p>
          </div>

          {/* Links */}
          <nav className="grid grid-cols-2 gap-3">
            <a
              href="/faq"
              className="text-sm text-foreground/80 hover:text-foreground w-max">
              FAQ
            </a>
            <a
              href="/returns-policy"
              className="text-sm text-foreground/80 hover:text-foreground w-max">
              Returns Policy
            </a>
            <a
              href="/terms"
              className="text-sm text-foreground/80 hover:text-foreground w-max">
              Terms of Service
            </a>
            <a
              href="/privacy"
              className="text-sm text-foreground/80 hover:text-foreground w-max">
              Privacy Policy
            </a>
          </nav>

          {/* Social / Contact */}
          <div className="flex md:justify-end items-start gap-3">
            <a
              href="https://www.instagram.com/rova___eg/"
              aria-label="Instagram"
              title="Follow us on Instagram">
              <Button
                variant="outline"
                size="sm"
                data-icon="inline-start"
                className="rounded-full">
                <Instagram className="size-4" />
                <span className="ml-1">Instagram</span>
              </Button>
            </a>
            <a
              href="https://wa.me/+201276008484"
              aria-label="WhatsApp"
              title="Chat on WhatsApp">
              <Button
                variant="outline"
                size="sm"
                data-icon="inline-start"
                className="rounded-full">
                <Phone className="size-4" />
                <span className="ml-1">WhatsApp</span>
              </Button>
            </a>
          </div>
        </div>
        <div className="mt-8 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Rova. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
