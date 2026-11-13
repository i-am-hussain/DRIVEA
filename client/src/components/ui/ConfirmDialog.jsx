import { Modal } from "./Modal";
import { Button } from "./Button";
import { AlertTriangleIcon } from "lucide-react";

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title = "Are you sure?",
    message = "This action cannot be undone.",
    confirmText = "Delete",
    confirmVariant = "danger",
    isLoading = false,
}) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="max-w-md"
            footer={
                <>
                    <Button variant="ghost" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button variant={confirmVariant} onClick={onConfirm} isLoading={isLoading}>
                        {confirmText}
                    </Button>
                </>
            }
        >
            <div className="flex items-start gap-3.5">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                    <AlertTriangleIcon className="size-5" />
                </div>
                <div className="min-w-0 pt-0.5">
                    <h3 className="text-[15px] font-semibold text-slate-900">{title}</h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{message}</p>
                </div>
            </div>
        </Modal>
    );
}
