export function Input({ label, error, hint, icon: Icon, className = "", type = "text", required = false, ...props }) {
    return (
        <div className="w-full">
            {label && (
                <label className="mb-1.5 block text-[13px] font-semibold text-slate-700">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                        <Icon className="size-4" />
                    </div>
                )}
                <input
                    type={type}
                    className={`h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 transition placeholder:text-slate-400 focus:outline-none focus:ring-4 ${
                        error
                            ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
                            : "border-slate-200 hover:border-slate-300 focus:border-brand-400 focus:ring-brand-500/10"
                    } ${Icon ? "pl-10" : ""} ${className}`}
                    {...props}
                />
            </div>
            {error ? (
                <p className="mt-1.5 text-xs text-red-600">{error}</p>
            ) : hint ? (
                <p className="mt-1.5 text-xs text-slate-400">{hint}</p>
            ) : null}
        </div>
    );
}
