import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircleIcon,
  EyeIcon,
  EyeOffIcon,
  FolderTreeIcon,
  HardDriveIcon,
  Link2Icon,
  LoaderCircleIcon,
  LockIcon,
  MailIcon,
  ShieldCheckIcon,
  UserIcon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const FEATURES = [
  { Icon: HardDriveIcon, title: "1 GB free storage", text: "Keep documents, photos and media in one place." },
  { Icon: FolderTreeIcon, title: "Folders that make sense", text: "Nest, rename and move files without friction." },
  { Icon: Link2Icon, title: "Share with a single link", text: "Send files to anyone — no account required." },
];

function BrandPanel() {
  return (
    <aside className="relative hidden flex-col justify-between overflow-hidden bg-slate-950 p-12 lg:flex">
      <div className="pointer-events-none absolute -left-24 -top-24 size-96 rounded-full bg-brand-600/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-16 size-96 rounded-full bg-brand-500/15 blur-3xl" />

      <Link to="/" className="relative flex items-center gap-2.5">
        <img src="/logo.svg" alt="" className="h-8 w-auto" />
        <span className="text-xl font-bold tracking-tight text-white">Drivea</span>
      </Link>

      <div className="relative max-w-md">
        <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-white">
          All your files,
          <br />
          in one calm place.
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-slate-400">
          Store, organise and share your work with a drive that stays out of your way.
        </p>

        <ul className="mt-10 space-y-5">
          {FEATURES.map(({ Icon, title, text }) => (
            <li key={title} className="flex items-start gap-3.5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-brand-400 ring-1 ring-white/10">
                <Icon className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="mt-0.5 text-[13px] text-slate-400">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="relative flex items-center gap-2 text-xs text-slate-500">
        <ShieldCheckIcon className="size-4" />
        Private by default. Only you decide what gets shared.
      </p>
    </aside>
  );
}

function AuthPage({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen bg-canvas lg:grid lg:grid-cols-[1.1fr_1fr]">
      <BrandPanel />

      <main className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-[420px]">
          <Link to="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
            <img src="/logo.svg" alt="" className="h-8 w-auto" />
            <span className="text-xl font-bold tracking-tight text-slate-900">Drivea</span>
          </Link>

          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">{title}</h2>
          <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>

          <div className="mt-7">{children}</div>

          {footer}
        </div>
      </main>
    </div>
  );
}

function Field({ id, label, icon: Icon, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[13px] font-semibold text-slate-700">
        {label}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          id={id}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-sm text-slate-900 transition placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
          {...props}
        />
      </div>
    </div>
  );
}

function AuthForm({ mode }) {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const isRegister = mode === "register";

  const getErrMessage = (err) =>
    err?.response?.data?.error || err?.message || "Something went wrong";

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (isRegister) await register({ name, email, password });
      else await login({ email, password });
      navigate("/", { replace: true });
    } catch (err) {
      setError(getErrMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {isRegister && (
        <Field
          id="auth-name"
          label="Full name"
          icon={UserIcon}
          type="text"
          autoComplete="name"
          placeholder="Alex Morgan"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      )}

      <Field
        id="auth-email"
        label="Email address"
        icon={MailIcon}
        type="email"
        required
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="auth-password" className="text-[13px] font-semibold text-slate-700">
            Password
          </label>
          {isRegister && <span className="text-[11px] text-slate-400">Minimum 6 characters</span>}
        </div>
        <div className="relative">
          <LockIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            id="auth-password"
            type={showPassword ? "text" : "password"}
            required
            minLength={6}
            autoComplete={isRegister ? "new-password" : "current-password"}
            placeholder={isRegister ? "Create a password" : "Enter your password"}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-11 text-sm text-slate-900 transition placeholder:text-slate-400 hover:border-slate-300 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-500/10"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-[13px] text-red-700">
          <AlertCircleIcon className="mt-px size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={busy}
        className="mt-1 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 text-sm font-semibold text-white shadow-card transition hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy && <LoaderCircleIcon className="size-4 animate-spin" aria-hidden="true" />}
        {isRegister ? "Create account" : "Sign in"}
      </button>

      <p className="mt-1 text-center text-sm text-slate-500">
        {isRegister ? (
          <>
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New to Drivea?{" "}
            <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">
              Create a free account
            </Link>
          </>
        )}
      </p>
    </form>
  );
}

export default function Login() {
  return (
    <AuthPage
      title="Welcome back"
      subtitle="Sign in to pick up where you left off."
      footer={
        <p className="mt-8 text-center text-[11px] leading-relaxed text-slate-400">
          By continuing you agree to our Terms of Service and Privacy Policy.
        </p>
      }
    >
      <AuthForm mode="login" />
    </AuthPage>
  );
}

/** Register page — creates the account with name, email and password. */
export function Register() {
  return (
    <AuthPage
      title="Create your account"
      subtitle="Free forever for your first gigabyte."
      footer={
        <p className="mt-8 text-center text-[11px] leading-relaxed text-slate-400">
          Your files stay private until you choose to share them.
        </p>
      }
    >
      <AuthForm mode="register" />
    </AuthPage>
  );
}
