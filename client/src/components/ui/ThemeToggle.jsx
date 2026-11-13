import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

/**
 * Small icon button that flips between the light and dark themes.
 * The choice is persisted by ThemeProvider (localStorage: `drivea-theme`).
 */
export function ThemeToggle({ className = "" }) {
  const { isDark, toggle } = useTheme();
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={`flex size-9 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-muted shadow-card transition hover:bg-subtle hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 ${className}`}
    >
      {isDark ? (
        <SunIcon className="size-[18px]" aria-hidden="true" />
      ) : (
        <MoonIcon className="size-[18px]" aria-hidden="true" />
      )}
    </button>
  );
}
