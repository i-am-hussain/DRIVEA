export function Input({ label, error, hint, icon: Icon, className = "", type = "text", required = false, ...props }) {
    return (
        <div className="w-full">
            {label && (
                <label className="mb-1.5 block text-[13px] font-semibold text-ink-soft">
                    {label} {required && <span className="text-danger">*</span>}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-faint">
                        <Icon className="size-4" />
                    </div>
                )}
                <input
                    type={type}
                    className={`h-11 w-full rounded-xl border bg-surface px-3.5 text-sm text-ink transition placeholder:text-faint focus:outline-none focus:ring-4 ${
                        error
                            ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
                            : "border-line hover:border-line-strong focus:border-brand-400 focus:ring-brand-500/10"
                    } ${Icon ? "pl-10" : ""} ${className}`}
                    {...props}
                />
            </div>
            {error ? (
                <p className="mt-1.5 text-xs text-danger">{error}</p>
            ) : hint ? (
                <p className="mt-1.5 text-xs text-faint">{hint}</p>
            ) : null}
        </div>
    );
}
