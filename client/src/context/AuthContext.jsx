import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { LogOutIcon } from "lucide-react";
import { authApi } from "../assets/api";
import { getAuthHeaders, setToken, getToken } from "../lib/auth-token";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

// ---------------------------------------------------------------------------
// Standard JWT auth (no third-party provider).
// The token lives in localStorage and is attached to every request by the
// axios client. `user` is the server-side profile from GET /auth/me.
// ---------------------------------------------------------------------------

function mergeUser(serverUser) {
  return {
    id: serverUser?.id || null,
    name: serverUser?.name || "User",
    email: serverUser?.email || null,
    imageUrl: serverUser?.imageUrl || null,
    storage_used: Number(serverUser?.storage_used || 0),
    storage_limit: Number(serverUser?.storage_limit || 0),
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));

  // Reload the current user from the server using the stored token.
  const refresh = useCallback(async () => {
    const headers = await getAuthHeaders();
    if (!headers.Authorization) {
      setUser(null);
      setLoading(false);
      return null;
    }
    try {
      const serverUser = await authApi.me();
      setUser(mergeUser(serverUser));
      return serverUser;
    } catch (err) {
      console.error("[auth] /auth/me failed:", err);
      // The axios 401 interceptor clears the token and redirects; this
      // handler only makes sure the context settles into a signed-out
      // state if /auth/me failed for another reason (e.g. network error).
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    // Best-effort server call; the session is stateless, so what matters is
    // dropping the local token and resetting the context.
    try {
      await authApi.logout();
    } catch {}
    setToken(null);
    setUser(null);
    window.location.href = "/login";
  }, []);

  const updateUser = useCallback((patch) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const { user: serverUser, token } = await authApi.login({
      email,
      password,
    });
    setToken(token);
    await refresh();
    return serverUser;
  }, [refresh]);

  const register = useCallback(async ({ name, email, password }) => {
    const { user: serverUser, token } = await authApi.register({
      name,
      email,
      password,
    });
    setToken(token);
    await refresh();
    return serverUser;
  }, [refresh]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        refresh,
        logout,
        updateUser,
        login,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// UserButton — simple local-avatar + dropdown with user info and log out.
// ---------------------------------------------------------------------------

export function UserButton({ afterSignOutUrl, className, ...props }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [open]);

  const initials = (user?.name || "U")
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className={`relative ${className || ""}`} {...props}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-[13px] font-bold text-white ring-2 ring-white transition hover:ring-brand-100 focus:outline-none focus-visible:ring-brand-300"
        title={user?.email || user?.name || "Account"}
      >
        {initials || "U"}
      </button>
      {open && (
        <div
          role="menu"
          className="animate-slide-up absolute right-0 z-50 mt-2 w-60 rounded-xl border border-slate-200/80 bg-white p-1.5 shadow-overlay"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[12px] font-bold text-brand-700">
              {initials || "U"}
            </span>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-slate-900">
                {user?.name || "User"}
              </p>
              {user?.email && (
                <p className="truncate text-[11px] text-slate-500">{user.email}</p>
              )}
            </div>
          </div>
          <div className="my-1 h-px bg-slate-100" />
          <button
            type="button"
            role="menuitem"
            onClick={() => logout()}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-600"
          >
            <LogOutIcon className="size-4" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
