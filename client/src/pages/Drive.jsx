import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useDropzone } from "react-dropzone";
import {
  FolderPlusIcon,
  UploadIcon,
  LayoutGridIcon,
  ListIcon,
  HardDriveIcon,
  Share2Icon,
  ChevronRightIcon,
  DownloadIcon,
  ArrowUpRightIcon,
  SortAscIcon,
  XCircleIcon,
  CopyIcon,
  FolderIcon,
  CloudUploadIcon,
  CheckIcon,
} from "lucide-react";
import { AppShell } from "../components/layout/AppShell";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Modal } from "../components/ui/Modal";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Dropdown, DropdownItem } from "../components/ui/Dropdown";
import { ItemDropdown } from "../components/ui/ItemDropdown";
import { EmptyState } from "../components/ui/EmptyState";
import { Spinner } from "../components/ui/Spinner";
import { ProgressBar } from "../components/ui/ProgressBar";
import { useAuth } from "../context/AuthContext";
import {
  folderApi,
  fileApi,
  shareApi,
  copyShareLink,
  getFileIcon,
  formatBytes,
  SORT_OPTIONS,
} from "../assets/api";

const fmtDate = (iso) => {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const GRID_CLASS =
  "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6";

/* ------------------------------------------------------------------ pieces */

function Breadcrumbs({ items }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex min-w-0 items-center gap-1 text-[13px]"
    >
      <Link
        to="/"
        className="flex shrink-0 items-center gap-1.5 rounded-lg px-1.5 py-1 font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
      >
        <HardDriveIcon className="size-4 text-slate-400" />
        My Drive
      </Link>
      {items.map((b) => (
        <React.Fragment key={b.id}>
          <ChevronRightIcon className="size-3.5 shrink-0 text-slate-300" />
          <Link
            to={`/f/${b.id}`}
            title={b.name}
            className="max-w-[160px] truncate rounded-lg px-1.5 py-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            {b.name}
          </Link>
        </React.Fragment>
      ))}
    </nav>
  );
}

function SectionHeading({ children, count }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <h2 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-slate-500">
        {children}
      </h2>
      {typeof count === "number" && count > 0 && (
        <span className="rounded-full bg-slate-200/70 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
          {count}
        </span>
      )}
    </div>
  );
}

function ViewToggle({ view, setView }) {
  return (
    <div className="flex items-center gap-0.5 rounded-xl border border-slate-200 bg-white p-1">
      {[
        ["grid", LayoutGridIcon, "Grid view"],
        ["list", ListIcon, "List view"],
      ].map(([value, Icon, label]) => (
        <button
          key={value}
          type="button"
          onClick={() => setView(value)}
          aria-label={label}
          aria-pressed={view === value}
          title={label}
          className={`flex size-7 items-center justify-center rounded-lg transition ${
            view === value
              ? "bg-slate-100 text-slate-900"
              : "text-slate-400 hover:bg-slate-50 hover:text-slate-700"
          }`}
        >
          <Icon className="size-4" />
        </button>
      ))}
    </div>
  );
}

function FolderCard({ folder, onOpen, onShare, onRename, onMove, onDelete }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(folder)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(folder);
        }
      }}
      className="group relative flex cursor-pointer flex-col rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-float focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
    >
      <div className="flex items-start justify-between">
        <span className="flex size-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <FolderIcon className="size-5" />
        </span>
        <ItemDropdown
          item={folder}
          onShare={onShare}
          onRename={onRename}
          onMove={onMove}
          onDelete={onDelete}
        />
      </div>
      <p
        className="mt-3 truncate text-[13px] font-semibold text-slate-800 sm:text-sm"
        title={folder.name}
      >
        {folder.name}
      </p>
      <p className="mt-0.5 text-[11px] text-slate-400">
        {fmtDate(folder.created_at)}
      </p>
    </div>
  );
}

function FileCard({
  file,
  onOpen,
  onPreview,
  onShare,
  onRename,
  onMove,
  onDelete,
}) {
  const isImage = file.mime_type?.startsWith("image/");
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(file)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(file);
        }
      }}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-float focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50"
    >
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden border-b border-slate-100 bg-slate-50">
        {isImage ? (
          <img
            src={file.blob_url || `/api/files/${file.id}/download`}
            alt={file.name}
            loading="lazy"
            className="absolute inset-0 size-full object-cover transition duration-300 group-hover:scale-[1.03]"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="flex size-12 items-center justify-center rounded-2xl bg-white ring-1 ring-slate-100 sm:size-14">
            {getFileIcon(file.mime_type, "size-6 sm:size-7")}
          </div>
        )}
        <div className="absolute right-1.5 top-1.5 rounded-lg bg-white/90 backdrop-blur">
          <ItemDropdown
            item={file}
            onPreview={onPreview}
            onShare={onShare}
            onRename={onRename}
            onMove={onMove}
            onDelete={onDelete}
          />
        </div>
      </div>
      <div className="p-3">
        <p
          className="truncate text-[13px] font-semibold text-slate-800 sm:text-sm"
          title={file.name}
        >
          {file.name}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-slate-400">
          {formatBytes(file.size)} · {fmtDate(file.created_at)}
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- page */

const Drive = () => {
  const navigate = useNavigate();
  const params = useParams();
  const folderId = params.id || null;

  const { user, updateUser } = useAuth();

  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("name_asc");
  const [view, setView] = useState("grid");

  const [uploadProgress, setUploadProgress] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [moveTarget, setMoveTarget] = useState(null);
  const [shareTarget, setShareTarget] = useState(null);
  const [shareLink, setShareLink] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [movingFolderId, setMovingFolderId] = useState(null);

  const onDrop = useCallback(
    async (accepted) => {
      if (accepted.length === 0) return;
      setIsUploading(true);
      setUploadProgress({
        done: 0,
        total: accepted.reduce((a, f) => a + f.size, 0),
      });
      try {
        const created = await fileApi.upload(
          accepted,
          folderId,
          (done, total) => setUploadProgress({ done, total }),
        );
        setFiles((prev) => [...created, ...prev]);
        const added = created.reduce((a, f) => a + Number(f.size || 0), 0);
        updateUser({ storage_used: Number(user?.storage_used || 0) + added });
        toast.success(
          `${created.length} file${created.length > 1 ? "s" : ""} uploaded`,
        );
      } catch (err) {
        toast.error(err?.response?.data?.error || "Upload failed");
      } finally {
        setIsUploading(false);
        setUploadProgress(null);
      }
    },
    [folderId, user, updateUser],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
  });

  const load = useCallback(
    async (opts = {}) => {
      setIsFetching(true);
      try {
        const [fols, fils] = await Promise.all([
          folderApi.list(opts?.parent_id),
          fileApi.list({
            folder_id: opts?.folder_id ?? null,
            search: opts?.search ?? search,
            sort: opts?.sort ?? sort,
          }),
        ]);
        setFolders(fols);
        setFiles(fils);
        if (opts?.parent_id) {
          try {
            const { breadcrumbs: crumbs } = await folderApi.get(opts.parent_id);
            setBreadcrumbs(crumbs);
            return { breadcrumbs: crumbs };
          } catch {
            navigate("/", { replace: true });
          }
        } else {
          setBreadcrumbs([]);
        }
      } catch (err) {
        toast.error(err?.response?.data?.error || "Failed to load drive");
      } finally {
        setIsFetching(false);
      }
    },
    [search, sort, navigate],
  );

  const searchTimer = useRef(null);
  const handleSearchChange = (value) => {
    setSearch(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      fileApi
        .list({ folder_id: folderId, search: value, sort })
        .then((fils) => setFiles(fils))
        .catch(() => {});
    }, 300);
  };

  useEffect(() => {
    load({ parent_id: folderId ?? null, folder_id: folderId ?? null });
  }, [folderId]);

  const handleSort = (value) => {
    setSort(value);
    fileApi
      .list({ folder_id: folderId ?? null, search, sort: value })
      .then((fils) => setFiles(fils))
      .catch(() => {});
  };

  const handleCreateFolder = async () => {
    try {
      const folder = await folderApi.create({
        name: newFolderName || "Untitled Folder",
        parent_id: folderId,
      });
      setFolders((prev) => [...prev, folder]);
      setShowNewFolder(false);
      setNewFolderName("");
      toast.success("Folder created");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to create folder");
    }
  };

  const handleRename = async () => {
    if (!renameTarget) return;
    try {
      if (renameTarget.type === "folder") {
        const folder = await folderApi.rename(renameTarget.id, renameValue);
        setFolders((prev) =>
          prev.map((f) => (f.id === folder.id ? { ...f, ...folder } : f)),
        );
      } else {
        const file = await fileApi.rename(renameTarget.id, renameValue);
        setFiles((prev) =>
          prev.map((f) => (f.id === file.id ? { ...f, ...file } : f)),
        );
      }
      setRenameTarget(null);
      toast.success("Renamed");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Rename failed");
    }
  };

  const handleMove = async () => {
    if (!moveTarget) return;
    try {
      if (moveTarget.type === "folder") {
        await folderApi.move(moveTarget.id, movingFolderId);
      } else {
        await fileApi.move(moveTarget.id, movingFolderId);
      }
      const fils = await fileApi.list({
        folder_id: folderId ?? null,
        search,
        sort,
      });
      const fols = await folderApi.list(folderId);
      setFiles(fils);
      setFolders(fols);
      setMoveTarget(null);
      toast.success("Moved");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Move failed");
    }
  };

  const handleShare = async (target) => {
    setShareTarget(target);
    setIsSharing(true);
    setShareLink(null);
    try {
      const share = await shareApi.create({
        resource_id: target.id,
        resource_type: target.type,
        permission: "download",
      });
      setShareLink(share);
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to create share link");
      setShareTarget(null);
    } finally {
      setIsSharing(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === "folder")
        await folderApi.trash(deleteTarget.id);
      else await fileApi.trash(deleteTarget.id);
      setFolders((prev) => prev.filter((f) => f.id !== deleteTarget.id));
      setFiles((prev) => prev.filter((f) => f.id !== deleteTarget.id));
      toast.success("Moved to trash");
    } catch (err) {
      toast.error(err?.response?.data?.error || "Delete failed");
    } finally {
      setDeleteTarget(null);
    }
  };

  const openPreview = async (file) => {
    setPreviewItem(file);
    setPreviewUrl(null);
    try {
      const url = await fileApi.preview(file.id);
      setPreviewUrl(url);
    } catch {
      toast.error("Preview unavailable");
      setPreviewItem(null);
    }
  };

  const folderTreeOptions = useMemo(
    () => folders.filter((f) => f.id !== moveTarget?.id),
    [folders, moveTarget],
  );

  const currentSortLabel =
    SORT_OPTIONS.find((o) => o.value === sort)?.label || "Sort";
  const openUpload = () =>
    document.getElementById("drive-upload-input")?.click();
  const hasItems = folders.length > 0 || files.length > 0;
  const currentFolder = breadcrumbs[breadcrumbs.length - 1];
  const title = currentFolder?.name || "My Drive";

  const folderActions = {
    onShare: (it) => handleShare({ ...it, type: "folder" }),
    onRename: (it) => {
      setRenameTarget({ type: "folder", id: it.id, name: it.name });
      setRenameValue(it.name);
    },
    onMove: (it) => setMoveTarget({ type: "folder", id: it.id, name: it.name }),
    onDelete: (it) =>
      setDeleteTarget({ type: "folder", id: it.id, name: it.name }),
  };

  const fileActions = {
    onPreview: openPreview,
    onShare: (it) => handleShare({ ...it, type: "file" }),
    onRename: (it) => {
      setRenameTarget({ type: "file", id: it.id, name: it.name });
      setRenameValue(it.name);
    },
    onMove: (it) => setMoveTarget({ type: "file", id: it.id, name: it.name }),
    onDelete: (it) =>
      setDeleteTarget({ type: "file", id: it.id, name: it.name }),
  };

  return (
    <AppShell
      breadcrumbs={<Breadcrumbs items={breadcrumbs} />}
      searchValue={search}
      onSearchChange={handleSearchChange}
      sidebarActions={
        <div className="space-y-2">
          <Button icon={UploadIcon} className="w-full" onClick={openUpload}>
            Upload files
          </Button>
          <Button
            variant="secondary"
            icon={FolderPlusIcon}
            className="w-full"
            onClick={() => setShowNewFolder(true)}
          >
            New folder
          </Button>
        </div>
      }
      headerActions={
        <>
          <input
            id="drive-upload-input"
            type="file"
            multiple
            hidden
            {...getInputProps()}
          />
          <Button
            icon={UploadIcon}
            onClick={openUpload}
            className="h-9 sm:h-10"
          >
            <span className="hidden sm:inline">Upload</span>
          </Button>
        </>
      }
      contentProps={getRootProps()}
    >
      <div className="relative">
        {/* Toolbar */}
        <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
          <div className="min-w-0">
            <div className="mb-1.5 flex items-center gap-1 text-[13px] lg:hidden">
              <Breadcrumbs items={breadcrumbs} />
            </div>
            <h1 className="truncate text-xl font-bold text-slate-900 sm:text-2xl">
              {title}
            </h1>
            <p className="mt-1 text-[13px] text-slate-500">
              {isFetching
                ? "Loading…"
                : hasItems
                  ? `${folders.length} folder${folders.length === 1 ? "" : "s"} · ${files.length} file${files.length === 1 ? "" : "s"}`
                  : "No items in this location yet"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={FolderPlusIcon}
              className="h-9 lg:hidden"
              onClick={() => setShowNewFolder(true)}
            >
              New folder
            </Button>

            <Dropdown
              trigger={
                <button
                  type="button"
                  title="Sort"
                  className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                >
                  <SortAscIcon className="size-4" />
                  <span className="hidden md:inline">{currentSortLabel}</span>
                </button>
              }
            >
              {SORT_OPTIONS.map((opt) => (
                <DropdownItem
                  key={opt.value}
                  icon={sort === opt.value ? CheckIcon : undefined}
                  onClick={() => handleSort(opt.value)}
                >
                  {opt.label}
                </DropdownItem>
              ))}
            </Dropdown>

            <ViewToggle view={view} setView={setView} />
          </div>
        </div>

        {/* Drag & drop overlay */}
        {isDragActive && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-start justify-center rounded-3xl border-2 border-dashed border-brand-400 bg-brand-50/80 p-10 backdrop-blur-[2px]">
            <div className="text-center">
              <span className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-float">
                <CloudUploadIcon className="size-7" />
              </span>
              <p className="text-base font-semibold text-brand-800">
                Drop files to upload
              </p>
              <p className="mt-1 text-sm text-brand-700/70">
                {currentFolder
                  ? `They'll be added to “${currentFolder.name}”`
                  : "They'll be added to My Drive"}
              </p>
            </div>
          </div>
        )}

        {isFetching ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="h-[132px] rounded-2xl border border-slate-200/80 bg-white p-3.5"
              >
                <div className="skeleton size-10 rounded-xl" />
                <div className="skeleton mt-4 h-3 w-4/5 rounded-full" />
                <div className="skeleton mt-2 h-2.5 w-1/2 rounded-full" />
              </div>
            ))}
          </div>
        ) : !hasItems ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 px-4 py-6 sm:px-10">
            <EmptyState
              icon={CloudUploadIcon}
              title={search ? "No matching items" : "This folder is empty"}
              description={
                search
                  ? `Nothing matches “${search}”. Try a different search term.`
                  : "Drag & drop files anywhere on this page, or upload and create folders to get started."
              }
              action={
                search ? (
                  <Button
                    variant="secondary"
                    icon={XCircleIcon}
                    onClick={() => handleSearchChange("")}
                  >
                    Clear search
                  </Button>
                ) : (
                  <div className="flex flex-col gap-2.5 sm:flex-row">
                    <Button icon={UploadIcon} onClick={openUpload}>
                      Upload files
                    </Button>
                    <Button
                      variant="secondary"
                      icon={FolderPlusIcon}
                      onClick={() => setShowNewFolder(true)}
                    >
                      New folder
                    </Button>
                  </div>
                )
              }
            />
          </div>
        ) : (
          <div className="space-y-7">
            {folders.length > 0 && (
              <section>
                <SectionHeading count={folders.length}>Folders</SectionHeading>
                {view === "grid" ? (
                  <div className={GRID_CLASS}>
                    {folders.map((f) => (
                      <FolderCard
                        key={f.id}
                        folder={f}
                        onOpen={(folder) => navigate(`/f/${folder.id}`)}
                        {...folderActions}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
                    {folders.map((f, i) => (
                      <div
                        key={f.id}
                        onClick={() => navigate(`/f/${f.id}`)}
                        className={`group flex cursor-pointer items-center gap-3 px-3 py-2.5 transition hover:bg-slate-50 sm:px-4 ${
                          i > 0 ? "border-t border-slate-100" : ""
                        }`}
                      >
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                          <FolderIcon className="size-4" />
                        </span>
                        <p className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
                          {f.name}
                        </p>
                        <p className="hidden w-28 shrink-0 text-xs text-slate-400 sm:block">
                          {fmtDate(f.created_at)}
                        </p>
                        <ItemDropdown item={f} {...folderActions} />
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {files.length > 0 && (
              <section>
                <SectionHeading count={files.length}>Files</SectionHeading>
                {view === "grid" ? (
                  <div className={GRID_CLASS}>
                    {files.map((f) => (
                      <FileCard
                        key={f.id}
                        file={f}
                        onOpen={openPreview}
                        {...fileActions}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-card">
                    <div className="hidden items-center gap-3 border-b border-slate-100 bg-slate-50/60 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-400 sm:flex">
                      <span className="flex-1">Name</span>
                      <span className="w-24 shrink-0">Size</span>
                      <span className="w-28 shrink-0">Modified</span>
                      <span className="w-9 shrink-0" />
                    </div>
                    {files.map((f, i) => (
                      <div
                        key={f.id}
                        onClick={() => openPreview(f)}
                        className={`group flex cursor-pointer items-center gap-3 px-3 py-2.5 transition hover:bg-slate-50 sm:px-4 ${
                          i > 0 ? "border-t border-slate-100" : ""
                        }`}
                      >
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 ring-1 ring-slate-100">
                          {getFileIcon(f.mime_type, "size-4")}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-800">
                            {f.name}
                          </p>
                          <p className="text-[11px] text-slate-400 sm:hidden">
                            {formatBytes(f.size)} · {fmtDate(f.created_at)}
                          </p>
                        </div>
                        <p className="hidden w-24 shrink-0 text-xs text-slate-400 sm:block">
                          {formatBytes(f.size)}
                        </p>
                        <p className="hidden w-28 shrink-0 text-xs text-slate-400 sm:block">
                          {fmtDate(f.created_at)}
                        </p>
                        <ItemDropdown item={f} {...fileActions} />
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </div>

      {/* Upload progress */}
      {isUploading && (
        <div className="animate-slide-up fixed bottom-24 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-4 shadow-overlay lg:bottom-6 lg:left-auto lg:right-6 lg:translate-x-0 lg:w-80">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Spinner size="sm" /> Uploading…
            </span>
            <span className="text-xs font-medium text-slate-400">
              {uploadProgress
                ? `${Math.round((uploadProgress.done / Math.max(1, uploadProgress.total)) * 100)}%`
                : ""}
            </span>
          </div>
          <ProgressBar
            progress={
              uploadProgress
                ? (uploadProgress.done / Math.max(1, uploadProgress.total)) *
                  100
                : 0
            }
          />
          {uploadProgress && (
            <p className="mt-2 text-[11px] text-slate-400">
              {formatBytes(uploadProgress.done)} of{" "}
              {formatBytes(uploadProgress.total)}
            </p>
          )}
        </div>
      )}

      {/* ------------------------------------------------ modals */}
      <Modal
        isOpen={showNewFolder}
        onClose={() => setShowNewFolder(false)}
        title="Create new folder"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowNewFolder(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder}>Create folder</Button>
          </>
        }
      >
        <Input
          autoFocus
          label="Folder name"
          placeholder="e.g. Project assets"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
        />
      </Modal>

      <Modal
        isOpen={!!renameTarget}
        onClose={() => setRenameTarget(null)}
        title={`Rename ${renameTarget?.type || "item"}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRenameTarget(null)}>
              Cancel
            </Button>
            <Button onClick={handleRename}>Save changes</Button>
          </>
        }
      >
        <Input
          autoFocus
          label="Name"
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleRename()}
        />
      </Modal>

      <Modal
        isOpen={!!moveTarget}
        onClose={() => setMoveTarget(null)}
        title="Move item"
        maxWidth="max-w-md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setMoveTarget(null)}>
              Cancel
            </Button>
            <Button onClick={handleMove}>Move here</Button>
          </>
        }
      >
        <p className="mb-3 text-sm text-slate-500">
          Choose a destination for{" "}
          <span className="font-medium text-slate-700">{moveTarget?.name}</span>
          .
        </p>
        <div className="-mx-1 max-h-72 space-y-1 overflow-y-auto px-1">
          <button
            type="button"
            onClick={() => setMovingFolderId(null)}
            className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition ${
              movingFolderId === null
                ? "bg-brand-50 font-semibold text-brand-700"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <HardDriveIcon className="size-4" /> My Drive (root)
          </button>
          {folderTreeOptions.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setMovingFolderId(f.id)}
              className={`flex w-full items-center gap-2.5 truncate rounded-xl px-3 py-2.5 text-sm transition ${
                movingFolderId === f.id
                  ? "bg-brand-50 font-semibold text-brand-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <FolderIcon className="size-4 shrink-0 text-brand-500" /> {f.name}
            </button>
          ))}
        </div>
      </Modal>

      <Modal
        isOpen={!!shareTarget}
        onClose={() => setShareTarget(null)}
        title="Share link"
      >
        {isSharing ? (
          <div className="flex items-center justify-center py-10">
            <Spinner />
          </div>
        ) : shareLink ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-600 ring-1 ring-slate-100">
                <Share2Icon className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {shareTarget?.name}
                </p>
                <p className="text-[11px] text-slate-400">
                  Anyone with the link can view and download
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="min-w-0 flex-1 truncate rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-600">
                {`${window.location.origin}/s/${shareLink.token}`}
              </div>
              <Button
                icon={CopyIcon}
                onClick={() => copyShareLink(shareLink.token)}
              >
                Copy
              </Button>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{shareLink.access_count || 0} views</span>
              <span>Link is active</span>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <Button variant="ghost" onClick={() => setShareTarget(null)}>
                Done
              </Button>
              <a
                href={`/s/${shareLink.token}`}
                target="_blank"
                rel="noreferrer"
              >
                <Button variant="secondary" icon={ArrowUpRightIcon}>
                  Open link
                </Button>
              </a>
            </div>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Move to trash?"
        message={`"${deleteTarget?.name || ""}" will be moved to trash. You can restore it later.`}
        confirmText="Move to trash"
      />

      <Modal
        isOpen={!!previewItem}
        onClose={() => setPreviewItem(null)}
        title={previewItem?.name || "Preview"}
        maxWidth="max-w-4xl"
        footer={
          previewItem && (
            <>
              <span className="mr-auto text-xs text-slate-400">
                {formatBytes(previewItem.size || 0)}
              </span>
              <Button variant="ghost" onClick={() => setPreviewItem(null)}>
                Close
              </Button>
              <a href={previewUrl || "#"} download={previewItem.name}>
                <Button variant="secondary" icon={DownloadIcon}>
                  Download
                </Button>
              </a>
            </>
          )
        }
      >
        {!previewUrl ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            {previewItem?.mime_type?.startsWith("image/") && (
              <img
                src={previewUrl}
                alt={previewItem.name}
                className="max-h-[62vh] rounded-xl object-contain"
              />
            )}
            {previewItem?.mime_type?.startsWith("video/") && (
              <video
                src={previewUrl}
                controls
                className="max-h-[62vh] w-full rounded-xl bg-black"
              />
            )}
            {previewItem?.mime_type?.startsWith("audio/") && (
              <audio src={previewUrl} controls className="mt-4 w-full" />
            )}
            {previewItem?.mime_type === "application/pdf" && (
              <iframe
                src={previewUrl}
                className="h-[62vh] w-full rounded-xl border border-slate-100"
                title={previewItem.name}
              />
            )}
            {!previewItem?.mime_type?.match(
              /^(image|video|audio\/)|^application\/pdf/,
            ) && (
              <div className="flex flex-col items-center gap-3 py-14 text-center">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-slate-50 ring-1 ring-slate-100">
                  {getFileIcon(previewItem?.mime_type, "size-8")}
                </div>
                <p className="text-sm text-slate-500">
                  No inline preview available for this file type.
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </AppShell>
  );
};

export default Drive;
