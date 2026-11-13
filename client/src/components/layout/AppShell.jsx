import { Link, useLocation } from "react-router-dom";
import {
  HardDriveIcon,
  Share2Icon,
  TrashIcon,
  SearchIcon,
  XCircleIcon,
} from "lucide-react";
import { useAuth, UserButton } from "../../context/AuthContext";
import { ProgressBar } from "../ui/ProgressBar";
import { ThemeToggle } from "../ui/ThemeToggle";
import { formatBytes } from "../../assets/api";

export const NAV_ITEMS = [
  {
    label: "My Drive",
    to: "/",
    Icon: HardDriveIcon,
    isActive: (pathname) => pathname === "/" || pathname.startsWith("/f/"),
  },
  {
    label: "Shared links",
    to: "/shared",
    Icon: Share2Icon,
    isActive: (p) => p === "/shared",
  },
  {
    label: "Trash",
    to: "/trash",
    Icon: TrashIcon,
    isActive: (p) => p === "/trash",
  },
];

function StorageCard() {
  const { user } = useAuth();
  const used = Number(user?.storage_used || 0);
  const limit = Number(user?.storage_limit || 0) || 1;
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const isFull = pct >= 90;

  return (
    <div className="rounded-2xl border border-line/80 bg-subtle/80 p-3.5">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="flex items-center gap-2 text-[13px] font-semibold text-ink-soft">
          <HardDriveIcon className="size-4 text-faint" />
          Storage
        </span>
        <span className="text-[11px] font-medium text-faint">{pct}%</span>
      </div>
      <ProgressBar
        progress={pct}
        size="sm"
        color={isFull ? "bg-danger" : "bg-brand-500"}
      />
      <p className="mt-2 truncate text-[11px] text-muted">
        <span className="font-semibold text-ink-soft">
          {formatBytes(used)}
        </span>{" "}
        of {formatBytes(limit)} used
      </p>
    </div>
  );
}

function Logo({ compact = false }) {
  return (
    <Link
      to="/"
      className="group flex items-center gap-2.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 focus-visible:ring-offset-2"
    >
      <img
        src="/logo.svg"
        alt=""
        className={
          compact
            ? "h-7 w-auto"
            : "h-8 w-auto transition-transform group-hover:scale-105"
        }
      />
      <span className="text-[19px] font-bold tracking-tight text-ink">
        Drivea
      </span>
    </Link>
  );
}

/**
 * Shared responsive chrome for every signed-in page.
 * Desktop: fixed sidebar + sticky header. Mobile: compact header + bottom tab bar.
 */
export function AppShell({
  breadcrumbs,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search files and folders…",
  sidebarActions,
  headerActions,
  contentProps = {},
  children,
}) {
  const { pathname } = useLocation();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-canvas text-ink">
      {/* ---------------------------------------------------- sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[272px] flex-col border-r border-line/80 bg-surface lg:flex">
        <div className="px-5 pb-4 pt-5">
          <Logo />
        </div>

        {sidebarActions && <div className="px-4 pb-4">{sidebarActions}</div>}

        <nav className="flex-1 overflow-y-auto px-3">
          <p className="px-3 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-faint">
            Workspace
          </p>
          <ul className="space-y-1">
            {NAV_ITEMS.map(({ label, to, Icon, isActive }) => {
              const active = isActive(pathname);
              return (
                <li key={to}>
                  <Link
                    to={to}
                    aria-current={active ? "page" : undefined}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                      active
                        ? "bg-brand-50 font-semibold text-accent"
                        : "font-medium text-ink-soft hover:bg-subtle-strong/80 hover:text-ink"
                    }`}
                  >
                    <span
                      className={`flex size-8 items-center justify-center rounded-lg transition-colors ${
                        active
                          ? "bg-brand-100/80 text-accent"
                          : "bg-subtle-strong text-muted group-hover:bg-surface group-hover:text-ink-soft"
                      }`}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="truncate">{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="mt-auto space-y-3 border-t border-line-soft p-3">
          <StorageCard />
          <div className="flex items-center gap-2.5 rounded-2xl px-1.5 py-1">
            <UserButton />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-ink">
                {user?.name || "User"}
              </p>
              <p className="truncate text-[11px] text-faint">
                {user?.email || ""}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ------------------------------------------------------- main */}
      <div className="flex min-h-screen flex-col lg:pl-[272px]">
        <header className="sticky top-0 z-30 border-b border-line/80 bg-surface/85 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:px-6 lg:px-8">
            <div className="lg:hidden">
              <Logo compact />
            </div>

            {/* Page context (desktop) */}
            <div className="hidden min-w-0 flex-1 items-center lg:flex">{breadcrumbs}</div>

            {onSearchChange && (
              <div className="relative order-last w-full min-w-0 lg:order-none lg:w-[360px] lg:shrink-0">
                <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" />
                <input
                  type="search"
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={searchPlaceholder}
                  aria-label="Search files"
                  className="h-10 w-full rounded-xl border border-line bg-subtle/80 pl-10 pr-9 text-sm text-ink transition placeholder:text-faint focus:border-brand-400 focus:bg-surface focus:outline-none focus:ring-4 focus:ring-brand-500/10"
                />
                {searchValue && (
                  <button
                    type="button"
                    onClick={() => onSearchChange("")}
                    aria-label="Clear search"
                    className="absolute right-1.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-faint transition hover:bg-track/70 hover:text-ink-soft"
                  >
                    <XCircleIcon className="size-4" />
                  </button>
                )}
              </div>
            )}

            <div className="ml-auto flex items-center gap-2">
              {headerActions}
              <ThemeToggle />
              <div className="lg:hidden">
                <UserButton />
              </div>
            </div>
          </div>
        </header>

        <main
          {...contentProps}
          className={`mx-auto w-full max-w-[1500px] flex-1 px-4 pb-28 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pb-10 ${contentProps.className || ""}`}
        >
          {children}
        </main>
      </div>

      {/* ------------------------------------------------- mobile nav */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line/80 bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
      >
        <div className="mx-auto flex max-w-md items-stretch gap-1 px-3 py-1.5">
          {NAV_ITEMS.map(({ label, to, Icon, isActive }) => {
            const active = isActive(pathname);
            return (
              <Link
                key={to}
                to={to}
                aria-current={active ? "page" : undefined}
                className={`flex flex-1 flex-col items-center gap-1 rounded-xl px-1 py-2 text-[10px] font-medium transition-colors ${
                  active
                    ? "text-accent"
                    : "text-muted hover:text-ink"
                }`}
              >
                <span
                  className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${
                    active ? "bg-brand-50 text-accent" : "text-muted"
                  }`}
                >
                  <Icon className="size-[18px]" />
                </span>
                <span className="truncate">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export { StorageCard };
