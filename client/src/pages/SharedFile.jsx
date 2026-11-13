import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
    AlertCircleIcon, CloudIcon, DownloadIcon, FolderIcon, UserIcon, ShieldCheckIcon,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { Spinner } from "../components/ui/Spinner";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { shareApi, getFileIcon, formatBytes } from "../assets/api";

const SharedFile = () => {
    const { token } = useParams();
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                if (cancelled) return;
                const result = await shareApi.access(token);
                if (cancelled) return;
                setData({
                    resource_type: result.resource_type || result.resourceType,
                    file: result.file,
                    folder: result.folder,
                    files: result.files,
                    url: result.url || result.preview_url,
                    owner: result.owner,
                    permission: result.permission,
                });
            } catch (err) {
                if (!cancelled) setError(err?.response?.data?.error || "This shared link is not available.");
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [token]);

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-canvas">
                <Spinner size="lg" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
                <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-8 text-center shadow-card">
                    <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-danger-soft text-danger">
                        <AlertCircleIcon className="size-6" />
                    </div>
                    <h1 className="text-lg font-semibold text-ink">Link unavailable</h1>
                    <p className="mt-1.5 text-sm text-muted">{error}</p>
                    <Link to="/" className="mt-6 inline-block">
                        <Button variant="secondary">Go to Drivea</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const isFolder = data.resource_type === "folder";
    const ownerName = data.owner?.name || "Unknown";

    return (
        <div className="flex min-h-screen flex-col bg-canvas text-ink">
            <header className="sticky top-0 z-20 border-b border-line/80 bg-surface/85 backdrop-blur-xl">
                <div className="mx-auto flex h-16 w-full max-w-5xl items-center gap-3 px-4 sm:px-6">
                    <Link to="/" className="flex items-center gap-2.5">
                        <img src="/logo.svg" alt="" className="h-7 w-auto" />
                        <span className="text-lg font-bold tracking-tight text-ink">Drivea</span>
                    </Link>
                    <div className="ml-auto flex items-center gap-2">
                        <span className="flex max-w-[60vw] items-center gap-1.5 rounded-full border border-line bg-subtle px-3 py-1.5 text-[11px] font-medium text-muted sm:max-w-none">
                            <UserIcon className="size-3.5 shrink-0" />
                            <span className="truncate">Shared by {ownerName}</span>
                        </span>
                        <ThemeToggle />
                    </div>
                </div>
            </header>

            <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
                {isFolder ? (
                    <div>
                        <div className="mb-5 flex items-center gap-3.5">
                            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-accent ring-1 ring-brand-100">
                                <FolderIcon className="size-6" />
                            </span>
                            <div className="min-w-0">
                                <h1 className="truncate text-lg font-bold text-ink sm:text-xl">
                                    {data.folder?.name}
                                </h1>
                                <p className="mt-0.5 text-[13px] text-muted">
                                    {data.files?.length || 0} file{data.files?.length === 1 ? "" : "s"} in this shared folder
                                </p>
                            </div>
                        </div>

                        {data.files?.length ? (
                            <div className="overflow-hidden rounded-2xl border border-line/80 bg-surface shadow-card">
                                {data.files.map((f, i) => (
                                    <a
                                        key={f.id}
                                        href={f.url || f.blob_url || `/api/files/${f.id}/download`}
                                        download={f.name}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={`group flex items-center gap-3 px-3 py-3 transition hover:bg-subtle sm:px-4 ${
                                            i > 0 ? "border-t border-line-soft" : ""
                                        }`}
                                    >
                                        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-subtle ring-1 ring-line-soft">
                                            {f.mime_type?.startsWith("image/") ? (
                                                <img
                                                    src={f.url || f.blob_url}
                                                    alt=""
                                                    className="size-full rounded-xl object-cover"
                                                />
                                            ) : (
                                                getFileIcon(f.mime_type, "size-[18px]")
                                            )}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-ink">{f.name}</p>
                                            <p className="text-[11px] text-faint">{formatBytes(f.size)}</p>
                                        </div>
                                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg text-faint transition group-hover:bg-surface group-hover:text-accent">
                                            <DownloadIcon className="size-4" />
                                        </span>
                                    </a>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-line-strong bg-surface/70">
                                <EmptyState
                                    icon={FolderIcon}
                                    title="Folder is empty"
                                    description="The owner hasn't added any files to this shared folder yet."
                                />
                            </div>
                        )}
                    </div>
                ) : data.file ? (
                    <div className="overflow-hidden rounded-2xl border border-line/80 bg-surface shadow-card">
                        <div className="flex flex-wrap items-center gap-3 border-b border-line-soft px-4 py-3.5 sm:px-5">
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-subtle ring-1 ring-line-soft">
                                {getFileIcon(data.file.mime_type, "size-5")}
                            </span>
                            <div className="min-w-0 flex-1">
                                <h1 className="truncate text-sm font-semibold text-ink sm:text-base">
                                    {data.file.name}
                                </h1>
                                <p className="mt-0.5 text-[11px] text-faint">
                                    {formatBytes(data.file.size)}
                                </p>
                            </div>
                            <a
                                href={data.url}
                                download={data.file.name}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full sm:w-auto"
                            >
                                <Button icon={DownloadIcon} className="w-full sm:w-auto">
                                    Download
                                </Button>
                            </a>
                        </div>

                        <div className="flex min-h-48 items-center justify-center bg-subtle/60 p-3 sm:min-h-64 sm:p-5">
                            {data.file.mime_type?.startsWith("image/") ? (
                                <img
                                    src={data.url}
                                    alt={data.file.name}
                                    className="max-h-[55vh] rounded-xl object-contain"
                                />
                            ) : data.file.mime_type?.startsWith("video/") ? (
                                <video src={data.url} controls className="max-h-[55vh] w-full rounded-xl bg-black" />
                            ) : data.file.mime_type?.startsWith("audio/") ? (
                                <audio src={data.url} controls className="w-full" />
                            ) : data.file.mime_type === "application/pdf" ? (
                                <iframe
                                    src={data.url}
                                    className="h-[55vh] w-full rounded-xl border border-line bg-surface"
                                    title={data.file.name}
                                />
                            ) : (
                                <div className="flex flex-col items-center gap-3 py-10">
                                    <div className="flex size-16 items-center justify-center rounded-2xl bg-surface ring-1 ring-line">
                                        {getFileIcon(data.file.mime_type, "size-8")}
                                    </div>
                                    <p className="text-sm text-muted">Preview isn't available for this file type.</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="rounded-2xl border border-dashed border-line-strong bg-surface/70">
                        <EmptyState
                            icon={CloudIcon}
                            title="Nothing to show"
                            description="This shared item no longer exists."
                        />
                    </div>
                )}

                <p className="mt-5 flex items-center justify-center gap-1.5 text-[11px] text-faint">
                    <ShieldCheckIcon className="size-3.5" />
                    Shared securely with a Drivea link
                </p>
            </main>

            <footer className="border-t border-line/80 py-5 text-center text-xs text-faint">
                Powered by{" "}
                <Link to="/" className="font-semibold text-accent hover:text-accent">
                    Drivea
                </Link>
            </footer>
        </div>
    );
};

export default SharedFile;
