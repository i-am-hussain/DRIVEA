import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { RotateCcwIcon, Trash2Icon, FolderIcon, TrashIcon, InboxIcon } from "lucide-react";
import { AppShell } from "../components/layout/AppShell";
import { Button } from "../components/ui/Button";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { EmptyState } from "../components/ui/EmptyState";
import { Spinner } from "../components/ui/Spinner";
import { trashApi, fileApi, folderApi, getFileIcon, formatBytes } from "../assets/api";

const fmtDate = (iso) =>
    iso
        ? new Date(iso).toLocaleString(undefined, {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
          })
        : "";

function TrashRow({ type, item, busy, onRestore, onDelete }) {
    const isFolder = type === "folder";
    return (
        <div className="flex items-center gap-3 px-3 py-3 transition hover:bg-subtle sm:px-4">
            <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-xl ring-1 ${
                    isFolder ? "bg-brand-50 text-accent ring-brand-100" : "bg-subtle ring-line-soft"
                }`}
            >
                {isFolder ? <FolderIcon className="size-[18px]" /> : getFileIcon(item.mime_type, "size-[18px]")}
            </span>

            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink" title={item.name}>
                    {item.name}
                </p>
                <p className="mt-0.5 text-[11px] text-faint">
                    {isFolder ? "Folder" : formatBytes(item.size)} · Deleted {fmtDate(item.trashed_at)}
                </p>
            </div>

            <div className="flex shrink-0 items-center gap-1">
                <Button
                    size="sm"
                    variant="secondary"
                    icon={RotateCcwIcon}
                    disabled={busy}
                    onClick={() => onRestore(type, item.id)}
                    className="px-2.5 sm:px-3"
                >
                    <span className="hidden sm:inline">Restore</span>
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    icon={Trash2Icon}
                    disabled={busy}
                    onClick={() => onDelete(type, item.id)}
                    title="Delete forever"
                    className="px-2.5 text-danger hover:bg-danger-soft hover:text-danger"
                >
                    <span className="hidden sm:inline">Delete</span>
                </Button>
            </div>
        </div>
    );
}

const Trash = () => {
    const [files, setFiles] = useState([]);
    const [folders, setFolders] = useState([]);
    const [isFetching, setIsFetching] = useState(true);
    const [confirmEmpty, setConfirmEmpty] = useState(false);
    const [busyId, setBusyId] = useState(null);

    const load = async () => {
        setIsFetching(true);
        try {
            const data = await trashApi.list();
            setFiles(data.files);
            setFolders(data.folders);
        } catch (err) {
            toast.error(err?.response?.data?.error || "Failed to load trash");
        } finally {
            setIsFetching(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const restoreItem = async (type, id) => {
        setBusyId(id);
        try {
            if (type === "folder") await folderApi.restore(id);
            else await fileApi.restore(id);
            if (type === "folder") setFolders((prev) => prev.filter((f) => f.id !== id));
            else setFiles((prev) => prev.filter((f) => f.id !== id));
            toast.success("Restored to My Drive");
        } catch (err) {
            toast.error(err?.response?.data?.error || "Restore failed");
        } finally {
            setBusyId(null);
        }
    };

    const deleteForever = async (type, id) => {
        setBusyId(id);
        try {
            if (type === "folder") await folderApi.deletePermanent(id);
            else await fileApi.deletePermanent(id);
            if (type === "folder") setFolders((prev) => prev.filter((f) => f.id !== id));
            else setFiles((prev) => prev.filter((f) => f.id !== id));
            toast.success("Deleted forever");
        } catch (err) {
            toast.error(err?.response?.data?.error || "Delete failed");
        } finally {
            setBusyId(null);
        }
    };

    const emptyTrash = async () => {
        setConfirmEmpty(false);
        try {
            await trashApi.empty();
            setFiles([]);
            setFolders([]);
            toast.success("Trash emptied");
        } catch (err) {
            toast.error(err?.response?.data?.error || "Failed to empty trash");
        }
    };

    const isEmpty = files.length === 0 && folders.length === 0;
    const total = files.length + folders.length;

    return (
        <AppShell
            breadcrumbs={
                <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px]">
                    <Link
                        to="/"
                        className="rounded-lg px-1.5 py-1 font-semibold text-ink-soft transition hover:bg-subtle-strong"
                    >
                        My Drive
                    </Link>
                    <span className="text-line-strong">/</span>
                    <span className="px-1.5 py-1 font-medium text-muted">Trash</span>
                </nav>
            }
            headerActions={
                !isEmpty && (
                    <Button variant="danger" size="sm" icon={Trash2Icon} onClick={() => setConfirmEmpty(true)}>
                        Empty trash
                    </Button>
                )
            }
        >
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-ink sm:text-2xl">Trash</h1>
                    <p className="mt-1 text-[13px] text-muted">
                        {isEmpty
                            ? "Deleted items will appear here before being permanently removed."
                            : `${total} item${total === 1 ? "" : "s"} · restore anything before deleting it forever.`}
                    </p>
                </div>
                {!isEmpty && (
                    <Button
                        variant="danger"
                        size="sm"
                        icon={Trash2Icon}
                        className="lg:hidden"
                        onClick={() => setConfirmEmpty(true)}
                    >
                        Empty trash
                    </Button>
                )}
            </div>

            {isFetching ? (
                <div className="flex justify-center py-24">
                    <Spinner size="lg" />
                </div>
            ) : isEmpty ? (
                <div className="rounded-3xl border border-dashed border-line-strong bg-surface/70">
                    <EmptyState
                        icon={InboxIcon}
                        title="Trash is empty"
                        description="Files and folders you delete will be kept here until you remove them permanently."
                        action={
                            <Link to="/">
                                <Button variant="secondary">Back to My Drive</Button>
                            </Link>
                        }
                    />
                </div>
            ) : (
                <div className="space-y-7">
                    {folders.length > 0 && (
                        <section>
                            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-muted">
                                Folders
                            </h2>
                            <div className="divide-y divide-line-soft overflow-hidden rounded-2xl border border-line/80 bg-surface shadow-card">
                                {folders.map((f) => (
                                    <TrashRow
                                        key={`f-${f.id}`}
                                        type="folder"
                                        item={f}
                                        busy={busyId === f.id}
                                        onRestore={restoreItem}
                                        onDelete={deleteForever}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    {files.length > 0 && (
                        <section>
                            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-muted">
                                Files
                            </h2>
                            <div className="divide-y divide-line-soft overflow-hidden rounded-2xl border border-line/80 bg-surface shadow-card">
                                {files.map((f) => (
                                    <TrashRow
                                        key={f.id}
                                        type="file"
                                        item={f}
                                        busy={busyId === f.id}
                                        onRestore={restoreItem}
                                        onDelete={deleteForever}
                                    />
                                ))}
                            </div>
                        </section>
                    )}

                    <p className="flex items-center gap-2 text-[12px] text-faint">
                        <TrashIcon className="size-3.5" />
                        Items in trash still count toward your storage until permanently deleted.
                    </p>
                </div>
            )}

            <ConfirmDialog
                isOpen={confirmEmpty}
                onClose={() => setConfirmEmpty(false)}
                onConfirm={emptyTrash}
                title="Empty trash?"
                message="Every item in the trash will be permanently deleted. This cannot be undone."
                confirmText="Empty trash"
            />
        </AppShell>
    );
};

export default Trash;
