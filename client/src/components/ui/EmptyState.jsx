import { FolderOpenIcon } from "lucide-react";

export function EmptyState({
    title = "No items found",
    description = "Drag & drop files here or click New to get started.",
    icon: Icon = FolderOpenIcon,
    action,
}) {
    return (
        <div className="flex flex-col items-center justify-center px-4 py-14 text-center sm:py-20">
            <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-brand-50 text-accent ring-1 ring-brand-100">
                <Icon className="size-7" />
            </div>
            <h3 className="text-base font-semibold text-ink sm:text-lg">{title}</h3>
            <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted sm:text-sm">
                {description}
            </p>
            {action && <div className="mt-6">{action}</div>}
        </div>
    );
}
