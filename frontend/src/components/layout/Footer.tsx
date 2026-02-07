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
    <footer className="w-full border-t bg-background py-6">
      <div className="max-w-4xl mx-auto flex flex-col items-center gap-4 px-4">
        <NavLink
          to="/"
          aria-label={`${brandConfig.brandName} Home`}
          className="flex items-center gap-2">
          <img
            src={logoSrc}
            alt={brandConfig.brandName}
            className="h-16 w-auto"
          />
        </NavLink>
        <nav className="flex flex-wrap gap-2 justify-center">
          <a
            href="/faq"
            className="text-sm text-foreground/70 hover:text-primary">
            FAQ
          </a>
          <a
            href="/returns-policy"
            className="text-sm text-foreground/70 hover:text-primary">
            Returns Policy
          </a>
          <a
            href="/terms"
            className="text-sm text-foreground/70 hover:text-primary">
            Terms
          </a>
          <a
            href="/privacy"
            className="text-sm text-foreground/70 hover:text-primary">
            Privacy
          </a>
        </nav>
        <div className="flex gap-2">
          <a
            href="https://www.instagram.com/rova___eg/"
            aria-label="Instagram"
            title="Instagram">
            <Button variant="ghost" size="icon-sm" className="rounded-full">
              <Instagram className="size-4" />
            </Button>
          </a>
          <a
            href="https://wa.me/+201276008484"
            aria-label="WhatsApp"
            title="WhatsApp">
            <Button variant="ghost" size="icon-sm" className="rounded-full">
              <Phone className="size-4" />
            </Button>
          </a>
        </div>
        <div className="text-xs text-muted-foreground text-center mt-2">
          © {new Date().getFullYear()} {brandConfig.brandName}. Minimal design.
          All rights reserved.
        </div>
      </div>
    </footer>
  );
}
