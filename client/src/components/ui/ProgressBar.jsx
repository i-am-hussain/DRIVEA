export function ProgressBar({ progress = 0, className = "", color = "bg-brand-500", size = "md" }) {
    const heights = {
        xs: "h-1",
        sm: "h-1.5",
        md: "h-2",
    };

    return (
        <div
            role="progressbar"
            aria-valuenow={Math.round(Math.min(100, Math.max(0, progress)))}
            aria-valuemin={0}
            aria-valuemax={100}
            className={`w-full overflow-hidden rounded-full bg-track/80 ${heights[size] || heights.md} ${className}`}
        >
            <div
                className={`h-full rounded-full transition-[width] duration-500 ease-out ${color}`}
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
        </div>
    );
}
