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
            title={title}
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
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-danger-soft text-danger">
                    <AlertTriangleIcon className="size-5" />
                </div>
                <p className="min-w-0 pt-1 text-[13px] leading-relaxed text-muted">{message}</p>
            </div>
        </Modal>
    );
}
