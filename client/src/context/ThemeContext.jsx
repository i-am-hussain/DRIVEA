import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "drivea-theme";
const ThemeContext = createContext(null);

const prefersDark = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-color-scheme: dark)").matches;

const resolveIsDark = (theme) => theme === "dark" || (theme === "system" && prefersDark());

function applyTheme(theme) {
  if (typeof document === "undefined") return;
  const dark = resolveIsDark(theme);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || "system";
    } catch {
      return "system";
    }
  });

  const [isDark, setIsDark] = useState(() => {
    try {
      return resolveIsDark(localStorage.getItem(STORAGE_KEY) || "system");
    } catch {
      return false;
    }
  });

  useEffect(() => {
    applyTheme(theme);
    setIsDark(resolveIsDark(theme));
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* storage can be unavailable in private mode */
    }
  }, [theme]);

  // Follow the OS while the preference is "system".
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      applyTheme("system");
      setIsDark(prefersDark());
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  const setTheme = useCallback((next) => setThemeState(next), []);
  const toggle = useCallback(() => setThemeState(isDark ? "light" : "dark"), [isDark]);

  const value = useMemo(
    () => ({ theme, isDark, setTheme, toggle }),
    [theme, isDark, setTheme, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside a ThemeProvider");
  return ctx;
}
