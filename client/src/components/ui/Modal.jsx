import { XIcon } from "lucide-react";
import { useEffect } from "react";

export function Modal({ isOpen, onClose, title, description, children, footer, maxWidth = "max-w-lg" }) {
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e) => e.key === "Escape" && onClose?.();
        document.addEventListener("keydown", onKey);
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = previous;
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            onClick={onClose}
            className="animate-fade-in fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-6"
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label={typeof title === "string" ? title : undefined}
                className={`animate-slide-up flex max-h-[92dvh] w-full ${maxWidth} flex-col overflow-hidden rounded-t-3xl border border-slate-200/80 bg-white shadow-overlay sm:rounded-2xl`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
                    <div className="min-w-0">
                        <h2 className="truncate text-base font-semibold text-slate-900">{title}</h2>
                        {description && (
                            <p className="mt-0.5 text-[13px] text-slate-500">{description}</p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close dialog"
                        className="-mr-1.5 flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    >
                        <XIcon className="size-[18px]" />
                    </button>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>

                {footer && (
                    <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3.5 sm:px-6">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
