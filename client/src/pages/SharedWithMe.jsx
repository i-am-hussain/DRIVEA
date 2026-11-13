import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Link2Icon,
  CopyIcon,
  ExternalLinkIcon,
  Trash2Icon,
  FolderIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { AppShell } from "../components/layout/AppShell";
import { Button } from "../components/ui/Button";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { EmptyState } from "../components/ui/EmptyState";
import { Spinner } from "../components/ui/Spinner";
import {
  shareApi,
  getFileIcon,
  copyShareLink,
  formatBytes,
} from "../assets/api";

const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

const SharedWithMe = () => {
  const [links, setLinks] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  const [revokeTarget, setRevokeTarget] = useState(null);

  const load = async () => {
    setIsFetching(true);
    try {
      const data = await shareApi.list();
      setLinks(data);
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to load shared links");
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const revoke = async () => {
    if (!revokeTarget) return;
    try {
      await shareApi.revoke(revokeTarget.id);
      setLinks((prev) => prev.filter((l) => l.id !== revokeTarget.id));
      toast.success("Share link revoked");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to revoke link");
    } finally {
      setRevokeTarget(null);
    }
  };

  return (
    <AppShell
      breadcrumbs={
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-[13px]"
        >
          <Link
            to="/"
            className="rounded-lg px-1.5 py-1 font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            My Drive
          </Link>
          <span className="text-slate-300">/</span>
          <span className="px-1.5 py-1 font-medium text-slate-500">
            Shared links
          </span>
        </nav>
      }
    >
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
          Shared links
        </h1>
        <p className="mt-1 text-[13px] text-slate-500">
          Every public link you've created. Revoke one at any time to turn off
          access.
        </p>
      </div>

      {isFetching ? (
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : links.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70">
          <EmptyState
            icon={Link2Icon}
            title="No shared links yet"
            description="Create a share link from any file or folder in My Drive and it will show up here."
            action={
              <Link to="/">
                <Button variant="secondary">Go to My Drive</Button>
              </Link>
            }
          />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {links.map((l) => {
            const isFolder = l.resource_type === "folder";
            return (
              <article
                key={l.id}
                className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-4 shadow-card transition hover:border-slate-300"
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`flex size-10 shrink-0 items-center justify-center rounded-xl ring-1 ${
                      isFolder
                        ? "bg-brand-50 text-brand-600 ring-brand-100"
                        : "bg-slate-50 ring-slate-100"
                    }`}
                  >
                    {isFolder ? (
                      <FolderIcon className="size-5" />
                    ) : (
                      getFileIcon(l.resource?.mime_type, "size-5")
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className="truncate text-sm font-semibold text-slate-800"
                      title={l.resource?.name}
                    >
                      {l.resource?.name || "Unknown item"}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-slate-400">
                      {isFolder ? "Folder" : formatBytes(l.resource?.size || 0)}{" "}
                      · shared {fmtDate(l.created_at)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRevokeTarget(l)}
                    aria-label="Revoke link"
                    title="Revoke link"
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2Icon className="size-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => copyShareLink(l.token)}
                  title="Copy link"
                  className="mt-3.5 flex w-full items-center gap-2 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-left transition hover:border-brand-200 hover:bg-brand-50/50"
                >
                  <Link2Icon className="size-3.5 shrink-0 text-slate-400" />
                  <span className="min-w-0 flex-1 truncate text-[11px] text-slate-500">
                    /s/{l.token}
                  </span>
                  <CopyIcon className="size-3.5 shrink-0 text-slate-400" />
                </button>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
                    <ShieldCheckIcon className="size-3.5" /> Link active
                  </span>
                  <a href={`/s/${l.token}`} target="_blank" rel="noreferrer">
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={ExternalLinkIcon}
                    >
                      Open
                    </Button>
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!revokeTarget}
        onClose={() => setRevokeTarget(null)}
        onConfirm={revoke}
        title="Revoke share link?"
        message="Anyone using this link will immediately lose access. This can't be undone, but you can create a new link later."
        confirmText="Revoke link"
      />
    </AppShell>
  );
};

export default SharedWithMe;
