import { useState, useRef, useEffect } from "react";

export function Dropdown({ trigger, children, align = "right", className = "", width = "w-56" }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        const handleEscape = (e) => e.key === "Escape" && setIsOpen(false);
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [isOpen]);

    const alignStyle = align === "right" ? "right-0" : "left-0";

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

            {isOpen && (
                <div
                    className={`animate-fade-in absolute ${alignStyle} z-50 mt-2 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-line/80 bg-surface p-1.5 shadow-overlay ${width} ${className}`}
                    onClick={() => setIsOpen(false)}
                >
                    {children}
                </div>
            )}
        </div>
    );
}

export function DropdownItem({ children, icon: Icon, onClick, danger = false, disabled = false, selected = false }) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition disabled:cursor-not-allowed disabled:opacity-50 ${
                danger
                    ? "text-danger hover:bg-danger-soft"
                    : selected
                        ? "bg-subtle-strong font-semibold text-ink"
                        : "text-ink-soft hover:bg-subtle-strong hover:text-ink"
            }`}
        >
            {Icon && <Icon className="size-4 shrink-0 opacity-80" />}
            <span className="truncate">{children}</span>
        </button>
    );
}
