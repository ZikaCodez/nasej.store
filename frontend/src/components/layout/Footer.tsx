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
    <footer className="w-full border-t border-border/40 bg-background/90 backdrop-blur-lg py-10 rounded-t-2xl mt-12 shadow-inner">
      <div className="max-w-5xl mx-auto flex flex-col items-center gap-6 px-6">
        <NavLink
          to="/"
          aria-label={`Nasej Home`}
          className="flex items-center gap-3 mb-2">
          <img
            src={logoSrc}
            alt="Nasej"
            className="h-14 w-auto drop-shadow-md rounded-xl"
          />
        </NavLink>
        <nav className="flex flex-wrap gap-4 justify-center mb-2">
          <a
            href="/faq"
            className="text-base font-medium text-foreground/70 hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-primary/10">
            FAQ
          </a>
          <a
            href="/returns-policy"
            className="text-base font-medium text-foreground/70 hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-primary/10">
            Returns Policy
          </a>
          <a
            href="/terms"
            className="text-base font-medium text-foreground/70 hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-primary/10">
            Terms
          </a>
          <a
            href="/privacy"
            className="text-base font-medium text-foreground/70 hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-primary/10">
            Privacy
          </a>
        </nav>
        <div className="flex gap-3 mb-2">
          <a
            href="https://www.instagram.com/nasej.store/"
            aria-label="Instagram"
            title="Instagram">
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-full hover:bg-primary/10">
              <Instagram className="size-5" />
            </Button>
          </a>
          <a
            href="https://wa.me/+201063081850"
            aria-label="WhatsApp"
            title="WhatsApp">
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-full hover:bg-primary/10">
              <Phone className="size-5" />
            </Button>
          </a>
        </div>
        <div className="text-xs text-muted-foreground text-center mt-2">
          © {new Date().getFullYear()} Nasej. Modern design. All rights
          reserved.
        </div>
      </div>
    </footer>
  );
}
