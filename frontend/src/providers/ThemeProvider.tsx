import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const THEME_STORAGE_KEY = "nasej_theme";

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  // Load initial theme from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
      if (raw === "light" || raw === "dark") {
        setThemeState(raw);
      } else {
        setThemeState("light");
      }
    } catch {
      setThemeState("light");
    }
  }, []);

  // Apply theme to document and persist
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  // Sync with other tabs/windows
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY) {
        const value = e.newValue as Theme | null;
        if (value === "light" || value === "dark") {
          setThemeState(value);
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setTheme = (next: Theme) => setThemeState(next);
  const toggleTheme = () =>
    setThemeState((t) => (t === "dark" ? "light" : "dark"));

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, setTheme, toggleTheme }),
    [theme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
