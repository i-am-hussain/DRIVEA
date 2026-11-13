import { Spinner } from "./Spinner";

export function Button({
    children,
    variant = "primary", // primary | secondary | ghost | danger | subtle
    size = "md", // sm | md | lg
    isLoading = false,
    disabled = false,
    className = "",
    type = "button",
    onClick,
    icon: Icon,
    ...props
}) {
    const baseStyle =
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.985]";

    const variants = {
        primary:
            "bg-brand-600 text-white shadow-card hover:bg-brand-700 focus-visible:ring-brand-500/70",
        secondary:
            "border border-slate-200 bg-white text-slate-700 shadow-card hover:border-slate-300 hover:bg-slate-50 focus-visible:ring-slate-400/70",
        subtle:
            "bg-slate-100 text-slate-700 hover:bg-slate-200/80 focus-visible:ring-slate-400/70",
        ghost:
            "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-300",
        danger:
            "bg-red-600 text-white shadow-card hover:bg-red-700 focus-visible:ring-red-500/70",
    };

    const sizes = {
        sm: "h-8 px-3 text-[13px]",
        md: "h-10 px-4 text-sm",
        lg: "h-11 px-5 text-sm",
    };

    return (
        <button
            type={type}
            disabled={disabled || isLoading}
            onClick={onClick}
            className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
            {...props}
        >
            {isLoading ? (
                <Spinner size="sm" className="text-current" />
            ) : Icon ? (
                <Icon className="size-4 shrink-0" />
            ) : null}
            {children}
        </button>
    );
}
