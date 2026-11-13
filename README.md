# Drivea

A full-stack cloud storage application built with **MERN** (MongoDB, Express, React, Node.js) and **Tailwind CSS v4**. Drivea lets a user keep files and nested folders in one private drive, move them to a trash with restore, share files or folders through public links, and monitor a per-account storage quota.

The UI is a responsive single-page app with a desktop sidebar, a mobile bottom navigation bar, drag-and-drop uploads, grid/list views, light and dark themes, and a small in-house component kit built on Lucide icons.

---

## Table of contents

- [Feature overview](#feature-overview)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Install](#install)
  - [Environment variables](#environment-variables)
  - [Run in development](#run-in-development)
  - [Production build](#production-build)
- [Usage guide](#usage-guide)
- [API reference](#api-reference)
  - [Conventions](#conventions)
  - [Auth](#auth-endpoints)
  - [Folders](#folder-endpoints)
  - [Files](#file-endpoints)
  - [Trash](#trash-endpoints)
  - [Share links](#share-link-endpoints)
  - [Health](#health)
- [Data model](#data-model)
- [Storage layer](#storage-layer)
- [Authentication and security](#authentication-and-security)
- [Frontend architecture](#frontend-architecture)
  - [Routes](#routes)
  - [Layout and responsive behavior](#layout-and-responsive-behavior)
  - [Theming and dark mode](#theming-and-dark-mode)
  - [State and data fetching](#state-and-data-fetching)
- [Scripts](#scripts)
- [Testing and verification](#testing-and-verification)
- [Deployment on Vercel](#deployment-on-vercel)
- [Troubleshooting](#troubleshooting)
- [Known limitations](#known-limitations)
- [Conventions](#conventions)
- [License](#license)

---

## Feature overview

### Storage and organization

- Email/password accounts with JWT sessions.
- Multipart file uploads (multiple files per request) with aggregate progress in the UI.
- Drag-and-drop upload onto the drive, including into the currently open folder.
- Nested folders with unlimited depth, breadcrumb navigation, rename and move.
- Server-side cycle protection when moving folders (a folder cannot become its own ancestor).
- Search by file name (case-insensitive substring) inside the current location.
- Sorting by name, date or size in either direction.
- Grid and list views with per-item action menus, previews for images, video, audio and PDF.
- Per-user storage quota (default 1 GB) enforced on upload, copy and register.
- Folder ZIP download endpoint (streamed server-side; UI helper exists in the API client).

### Trash and recovery

- Soft delete for files and folders; trashing a folder also trashes every descendant folder and file.
- Restore an item, a folder subtree, or permanently delete a single item.
- Restoring an item whose parent is still trashed places it back at the drive root.
- Empty-trash action that deletes everything and releases the stored bytes.

### Sharing

- Create a public link for a file or folder; links are short random tokens (`/s/<token>`).
- Links can be view or download permission and may expire (API-level; the current UI always creates download links with no expiry).
- Creating a link for an item that already has an active link returns the existing link instead of duplicating it.
- Public share page lists a shared folder's direct files with download links, or previews a single file.
- Access count is incremented on every public access.
- "Shared links" page lists active links with copy, open and revoke actions.

### UI and UX

- Shared app shell for every signed-in page: fixed sidebar on desktop, sticky header with search, mobile bottom tabs.
- Light and dark themes with a persisted preference and OS-preference fallback.
- Responsive grids from 2 columns on phones to 6 on very wide screens.
- Accessible primitives: labelled controls, focus rings, Escape-to-close menus and dialogs, reduced-motion support, safe-area padding.
- Toasts for success/failure feedback and inline validation errors on auth forms.
- Skeleton loaders while data is fetching.

### Developer-facing capabilities (API only, not wired into the UI)

- Copy file / copy folder with a real duplicate of the stored bytes.
- Star / unstar files and folders (single and batch).
- Recent files endpoint sorted by last update.
- Batch move, batch trash and batch star for files, batch permanent delete for folders.
- Browser-direct upload registration for Vercel Blob (`POST /api/files/register`).

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router 7, Vite 8 |
| Styling | Tailwind CSS 4 (`@tailwindcss/vite`), custom design tokens, Lucide icons |
| HTTP client | Axios with request/response interceptors |
| Drag and drop | `react-dropzone` |
| Notifications | `react-hot-toast` |
| Backend | Node.js, Express 5 |
| Database | MongoDB via Mongoose 9 |
| Auth | JWT (`jsonwebtoken`) + `bcryptjs` password hashing |
| File storage | Local disk in development; Vercel Blob in production |
| Validation/lint | oxlint |
| Local DB fallback | `mongodb-memory-server` |

---

## Architecture

```
┌──────────────────────────────┐
│  Browser (React SPA)         │
│  AppShell · pages · UI kit   │
│  AuthContext · ThemeContext  │
└──────────────┬───────────────┘
               │  /api/*  (JSON + multipart, Bearer JWT)
┌──────────────▼───────────────┐
│  Express app (server/app.js) │
│  auth · folders · files      │
│  trash · shares              │
└───────┬──────────────┬───────┘
        │              │
┌───────▼──────┐  ┌────▼─────────────────────┐
│  MongoDB     │  │  Storage adapter         │
│  User        │  │  dev  → .uploads/ on disk│
│  Folder      │  │  prod → Vercel Blob      │
│  File        │  └──────────────────────────┘
│  ShareLink   │
└──────────────┘
```

- `api/index.js` is the Vercel serverless entry point. It imports the same `createApp()` factory used by the local dev server, so local and production behavior stay identical.
- `server/app.js` mounts JSON parsing, CORS, the five route groups, a JSON 404 handler for unknown `/api` routes, and a central error handler that never leaks stack traces.
- The React app is served as a SPA. In development Vite proxies `/api` to `http://localhost:4000`; in production `vercel.json` rewrites `/api/*` to the serverless function and everything else to `index.html`.

---

## Project structure

```
.
├── api/
│   └── index.js                 # Vercel serverless handler → createApp()
├── client/                      # React + Tailwind frontend
│   ├── index.html               # SPA shell + pre-paint theme bootstrap
│   ├── vite.config.js           # React/Tailwind plugins, /api dev proxy
│   └── src/
│       ├── assets/
│       │   ├── api.js           # Axios instance + auth/folder/file/trash/share APIs
│       │   └── assets.jsx       # file-type icons, sort options, byte formatting
│       ├── components/
│       │   ├── layout/AppShell.jsx   # sidebar, header, mobile nav, storage card
│       │   └── ui/                  # Button, Input, Modal, Dropdown, EmptyState,
│       │                            # ConfirmDialog, ProgressBar, Spinner,
│       │                            # ItemDropdown, ThemeToggle
│       ├── context/
│       │   ├── AuthContext.jsx  # session bootstrap, login/register/logout, UserButton
│       │   └── ThemeContext.jsx # light/dark/system preference
│       ├── lib/auth-token.js    # localStorage token bridge
│       ├── pages/
│       │   ├── Drive.jsx        # main drive: uploads, folders, files, modals
│       │   ├── Trash.jsx        # restore / delete forever / empty trash
│       │   ├── SharedWithMe.jsx # manage created share links
│       │   ├── SharedFile.jsx   # public /s/:token page
│       │   └── Login.jsx        # login + register views
│       ├── App.jsx              # providers, toaster, routes, protected routes
│       ├── index.css            # Tailwind import, design tokens, dark theme, motion
│       └── main.jsx             # React root
├── server/
│   ├── app.js                   # Express app factory
│   ├── dev.js                   # dev server, optional in-memory MongoDB
│   ├── config/db.js             # cached Mongoose connection (serverless-safe)
│   ├── middleware/auth.js       # JWT sign/verify, requireAuth, storage accounting
│   ├── models/                  # User, Folder, File, ShareLink schemas
│   ├── routes/                  # auth, folders, files, trash, shares
│   ├── services/storage.js      # Vercel Blob + local-disk storage adapter
│   └── utils/transforms.js      # toJSON: string ids, snake_case API contract
├── scripts/api-test.mjs         # end-to-end API smoke test
├── .env.example                 # environment variable template
├── package.json                 # root scripts and server dependencies
└── vercel.json                  # build, rewrites, security headers
```

---

## Getting started

### Prerequisites

- **Node.js 20.19+ or 22.12+** (required by Vite 8). Node 22 LTS is recommended.
- **npm 10+**.
- **MongoDB** — optional for local development. If `MONGODB_URI` is unset, `server/dev.js` starts an in-memory MongoDB through `mongodb-memory-server`.
- No Blob account is needed locally: without `BLOB_READ_WRITE_TOKEN`, files are written to `.uploads/` in the project root.

### Install

```bash
# from the repository root
npm install
npm install --prefix client
```

### Environment variables

Create a `.env` file in the **repository root** (used by the API). A template is provided in `.env.example`.

```bash
cp .env.example .env
```

| Variable | Where | Required | Description |
|---|---|---|---|
| `MONGODB_URI` | root `.env` / Vercel | No (dev) · Yes (prod) | MongoDB connection string. Absent in dev → in-memory MongoDB. |
| `JWT_SECRET` | root `.env` / Vercel | Yes in production | Secret used to sign and verify JWTs. Falls back to `drivea_dev_secret_change_me` when unset. |
| `STORAGE_LIMIT_BYTES` | root `.env` / Vercel | No | Quota assigned to **newly registered** users. Default `1073741824` (1 GB). |
| `BLOB_READ_WRITE_TOKEN` | root `.env` / Vercel | No (dev) · Yes (prod) | Enables the Vercel Blob storage adapter. Absent → local disk adapter. |
| `VERCEL_BLOB_DOMAIN` | root `.env` / Vercel | No | Used only to build a full URL when a stored blob URL is not absolute. |
| `VITE_API_URL` | `client/.env` | No | Overrides the API base URL. Defaults to `/api` (the dev proxy / production rewrite). |
| `PORT` | root `.env` / environment | No | API port for `server/dev.js`. Default `4000`. |

Notes:

- The API loads `.env` from the **current working directory**. Run npm scripts from the repository root.
- Vite only reads environment files inside `client/`. If you want the SPA to call an API on a different origin, create `client/.env` with `VITE_API_URL=http://localhost:4000/api` (or your deployed API URL).
- `JWT_SECRET` is read when the auth middleware module loads, so restart the API after changing it.
- A user's quota is copied onto the user document at registration. Lowering `STORAGE_LIMIT_BYTES` later affects only new accounts.

### Run in development

Use two terminals from the repository root:

```bash
# Terminal 1 — API on http://localhost:4000
npm run dev:api

# Terminal 2 — Vite dev server on http://localhost:5173
npm run dev:client
```

Then open `http://localhost:5173`, create an account, and start uploading.

What happens without `MONGODB_URI`:

1. `mongodb-memory-server` downloads/caches a MongoDB binary on first run (needs network access and a few seconds).
2. An ephemeral database is created and the API logs `[dev] In-memory MongoDB ready`.
3. All data is **lost when the API restarts**. Uploaded bytes may remain in `.uploads/` and become orphaned.

Health check:

```bash
curl http://localhost:4000/api/health
# {"ok":true,"service":"drivea-api","auth":"jwt"}
```

### Production build

```bash
npm run build          # builds client/dist
npm run preview --prefix client   # serve the built SPA locally
```

`npm run build` only builds the frontend. The API is a Node process (`npm run dev:api`) locally or a Vercel function in production.

---

## Usage guide

1. **Create an account** — `/register` asks for a name, email and a password of at least 6 characters. You are signed in immediately.
2. **Upload** — use the “Upload” button or drag files anywhere onto the drive. Progress is shown as files upload; the list refreshes on completion.
3. **Organize** — create folders from the sidebar or toolbar, open them to navigate, and use the breadcrumb to go back. The per-item “⋯” menu offers Share, Rename, Move and Delete.
4. **View** — switch between grid and list, sort by name/date/size, and search the current folder. Clicking a file previews it; images, video, audio and PDF render inline.
5. **Share** — choose “Share link” on a file or folder, then copy the generated `/s/<token>` URL. Manage or revoke all links under **Shared links**.
6. **Trash** — deleting moves items to Trash. Restore them, delete a single item forever, or empty the whole trash.
7. **Theme** — the sun/moon button in the header toggles dark mode. The choice is stored per browser; until you choose, the OS preference is used.

---

## API reference

### Conventions

- **Base URL:** `/api` (e.g. `http://localhost:4000/api`).
- **Auth:** every endpoint except `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /health` and `GET /shares/access/:token` requires `Authorization: Bearer <jwt>`.
- **Content types:** JSON for most endpoints; `multipart/form-data` for `POST /files/upload`.
- **Errors:** always JSON of the shape `{ "error": "message" }`. `500` responses return a generic message; details are logged server-side.
- **IDs:** resources expose a string `id`; timestamps are ISO strings; keys are snake_case (the models transform camelCase Mongo fields on serialization).
- **Common status codes:** `200` OK, `201` created, `400` validation error, `401` missing/invalid token, `404` not found or not owned by you, `409` conflict (duplicate email), `413` storage quota exceeded, `500` server error.
- Every resource query is scoped to the authenticated owner, so IDs belonging to another user resolve as `404`.

Quick example:

```bash
# Register
curl -s -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Ada","email":"ada@example.com","password":"secret123"}'

# Use the returned token
TOKEN=...
curl -s http://localhost:4000/api/auth/me -H "Authorization: Bearer $TOKEN"
```

### Auth endpoints

| Method | Endpoint | Body | Returns |
|---|---|---|---|
| `POST` | `/auth/register` | `{ name?, email, password }` | `201 { user, token }` |
| `POST` | `/auth/login` | `{ email, password }` | `200 { user, token }` |
| `GET` | `/auth/me` | — | `200 { user }` |
| `POST` | `/auth/logout` | — | `200 { message }` (stateless; client drops the token) |

Rules:

- Email is trimmed and lowercased; duplicates return `409`.
- Passwords must be at least 6 characters and are hashed with bcrypt (10 rounds).
- If `name` is omitted, the local part of the email is used.
- Tokens are signed with `{ sub: <user id>, email }` and expire after **30 days**.

User object (password hash is never serialized):

```json
{
  "id": "6af7...",
  "name": "Ada",
  "email": "ada@example.com",
  "storage_used": 0,
  "storage_limit": 1073741824,
  "clerk_id": null,
  "created_at": "2026-11-13T16:07:16.590Z",
  "updated_at": "2026-11-13T16:07:16.590Z"
}
```

### Folder endpoints

All require authentication. Folders are returned with `id`, `name`, `parent_id`, `path`, `is_trashed`, `trashed_at` and timestamps.

| Method | Endpoint | Body / query | Returns |
|---|---|---|---|
| `GET` | `/folders` | `parent_id` (optional) | `{ folders }`, sorted by name |
| `POST` | `/folders` | `{ name?, parent_id? }` | `201 { folder }` |
| `GET` | `/folders/:id` | — | `{ folder, breadcrumbs }` |
| `PATCH` | `/folders/:id/rename` | `{ name }` | `{ folder }` |
| `PATCH` | `/folders/:id/move` | `{ target_parent \| target_parent_id }` (`null` = root) | `{ folder }` |
| `POST` | `/folders/:id/copy` | `{ target_parent_id?, name? }` | `201 { folder }` |
| `DELETE` | `/folders/:id` | — | `{ message }` (soft delete) |
| `POST` | `/folders/:id/restore` | — | `{ folder }` |
| `DELETE` | `/folders/:id/permanent` | — | `{ message }` |
| `POST` | `/folders/batch/delete` | `{ ids: [] }` | `{ deleted }` |
| `PATCH` | `/folders/:id/star` | `{ is_starred }` | `{ folder }` |

Behavior:

- **Listing:** omit `parent_id` to list every non-trashed folder in the account; pass `parent_id=null` for the root, or a folder id for its children. `breadcrumbs` are the folder's ancestors from root to parent (not including the folder itself).
- **Create:** the parent must belong to you; `name` defaults to `Untitled Folder`.
- **Move:** moving into itself or one of its descendants is rejected with `400`. Descendant `path` arrays are rewritten in the same request.
- **Copy:** creates a deep copy of the folder tree and duplicates file bytes. The new name defaults to `Copy of <name>`. Quota is checked before copying and charged per copied file; if file content cannot be duplicated the request fails with `500`.
- **Trash:** sets `isTrashed`/`trashedAt` on the folder, all descendant folders and all their files. Plain `DELETE` is reversible.
- **Restore:** restores the subtree. If the original parent is missing or trashed, the folder is restored to the root with an empty `path`.
- **Permanent delete:** removes the folder, all descendants (matched by `path`) and their file documents.

### File endpoints

All require authentication. Files are returned with `id`, `name`, `mime_type`, `size`, `blob_url`, `folder_id`, `is_trashed`, `trashed_at` and timestamps.

| Method | Endpoint | Body / query | Returns |
|---|---|---|---|
| `GET` | `/files` | `folder_id`, `search`, `sort` | `{ files }` |
| `POST` | `/files/upload` | `multipart/form-data`: `files`, `folder_id` | `201 { files, file }` |
| `POST` | `/files/register` | `{ name, s3_key, blob_url, size?, mime_type?, folder_id? }` | `201 { file, files }` |
| `GET` | `/files/:id/download` | — | File bytes or `302` to the blob URL |
| `GET` | `/files/:id/preview` | — | `{ preview_url, url, file }` |
| `PATCH` | `/files/:id/rename` | `{ name }` | `{ file }` |
| `PATCH` | `/files/:id/move` | `{ target_folder \| target_folder_id }` (`null` = root) | `{ file }` |
| `POST` | `/files/:id/copy` | `{ target_folder_id?, name? }` | `201 { file }` |
| `DELETE` | `/files/:id` | — | `{ message }` (soft delete) |
| `POST` | `/files/:id/restore` | — | `{ file }` |
| `DELETE` | `/files/:id/permanent` | — | `{ message }` |
| `GET` | `/files/folder/:id/download` | — | Streamed ZIP of the folder tree |
| `GET` | `/files/recent` | `limit` (1–100, default 20) | `{ files }` |
| `PATCH` | `/files/:id/star` | `{ is_starred }` | `{ file }` |
| `POST` | `/files/batch/delete` | `{ ids: [] }` | `{ moved }` |
| `POST` | `/files/batch/move` | `{ ids: [], target_folder_id }` | `{ moved }` |
| `POST` | `/files/batch/star` | `{ ids: [], is_starred }` | `{ updated }` |

Behavior:

- **Listing:** omit `folder_id` for files across the whole account, or pass `folder_id=null` for root files. `search` is an escaped, case-insensitive substring match on the file name. `sort` accepts `name_asc`, `name_desc`, `date_asc`, `date_desc`, `size_asc`, `size_desc` (default `name_asc`). Trashed files are always excluded.
- **Upload:** the multipart field is `files` (up to **20 files per request**; the client sends one request per file). `folder_id` may be `null`/`"null"`. The account quota is checked against the total request size and returns `413` when exceeded. Local files are stored through the storage adapter and recorded in MongoDB; `storageUsed` is incremented.
- **Per-file limit:** multer is configured for a 4.5 GB file ceiling, but serverless platforms impose much smaller request-body limits — use blob-direct uploads for large files in production.
- **Register:** records an object uploaded directly to Vercel Blob. The caller is trusted to supply `s3_key` and `blob_url`; `size` counts against the quota.
- **Download:** streams local files with `Content-Disposition: attachment`, or redirects to the public blob URL in production.
- **Preview:** returns the same URL the client uses for inline preview.
- **Copy:** duplicates the stored bytes under a new key, checks quota and charges the copy.
- **Permanent delete:** deletes stored bytes, decrements `storageUsed`, then removes the document.
- **ZIP:** streams an archive of the folder and all descendant folders, capped at 10,000 files. Files are added by base name (the archive is flat), and an empty folder yields an empty zip.

### Trash endpoints

| Method | Endpoint | Body | Returns |
|---|---|---|---|
| `GET` | `/trash` | — | `{ files, folders }`, newest first |
| `POST` | `/trash/empty` | — | `{ message }` |

Emptying the trash deletes all trashed files and folders, removes their stored objects, and subtracts freed bytes from `storageUsed`.

### Share link endpoints

| Method | Endpoint | Auth | Body | Returns |
|---|---|---|---|---|
| `POST` | `/shares` | Yes | `{ resource_type?: "file"\|"folder", resource_id, permission?: "view"\|"download", expires_at? }` | `201` new link, or `200` existing active link: `{ share, share_link, is_existing }` |
| `GET` | `/shares` | Yes | — | `{ share_links, shares }` — active (non-expired) links, newest first |
| `DELETE` | `/shares/:id` | Yes | — | `{ message }` |
| `GET` | `/shares/access/:token` | **No** | — | Public payload for the shared resource |

Behavior:

- Tokens are 9 random bytes encoded as base64url (`crypto.randomBytes(9).toString('base64url')`).
- `permission` is stored as metadata; access is granted by possession of the token either way.
- `expires_at` is an ISO date; expired links behave as `404` and are omitted from the list (but not deleted).
- Creating a link for an item that already has an active link returns that link with `is_existing: true`.
- `access_count` is incremented whenever a live token is resolved, before the resource availability check.
- Public payload for a file:

  ```json
  {
    "share": { "token": "...", "resource_type": "file", "permission": "download", "access_count": 3 },
    "file": { "id": "...", "name": "report.pdf", "mime_type": "application/pdf", "size": 12345 },
    "resource_type": "file",
    "permission": "download",
    "preview_url": "https://...",
    "url": "https://...",
    "owner": { "name": "Ada", "email": "ada@example.com" }
  }
  ```

  For a folder, `folder` and `files` (each with a `url`) are returned instead of `file`, and only direct children are listed — the public page does not recurse into subfolders.

### Health

| Method | Endpoint | Returns |
|---|---|---|
| `GET` | `/health` | `{ "ok": true, "service": "drivea-api", "auth": "jwt" }` |

---

## Data model

Four Mongoose models, all with `timestamps: true`.

### User

| Field | Type | Notes |
|---|---|---|
| `name` | String | Defaults to `User`; registration falls back to the email local part. |
| `email` | String | Required, unique in practice (checked in the register handler), lowercased, indexed. |
| `passwordHash` | String | bcrypt hash; `null` for accounts without a password. Never serialized. |
| `clerkId` | String | Legacy/optional external id column; unused by the current auth flow. |
| `storageUsed` | Number | Denormalized total of stored bytes. |
| `storageLimit` | Number | Quota copied from `STORAGE_LIMIT_BYTES` at registration (default 1 GB). |

### Folder

| Field | Type | Notes |
|---|---|---|
| `name` | String | Required, default `Untitled Folder`. |
| `parentId` | ObjectId → Folder | `null` for root folders. |
| `ownerId` | ObjectId → User | Indexed; every query is scoped to it. |
| `path` | ObjectId[] | Ancestors from root to direct parent. This denormalization makes “all descendants” a single indexed query and makes cycle checks cheap. |
| `isTrashed` / `trashedAt` | Boolean / Date | Soft-delete state. |
| `isStarred` | Boolean | Stored and exposed through the star endpoint; not shown in the current UI. |

### File

| Field | Type | Notes |
|---|---|---|
| `name` | String | Display name (renameable). |
| `originalName` | String | Original upload name, used for download filenames. |
| `mimeType` | String | Defaults to `application/octet-stream`. |
| `size` | Number | Bytes, charged against the quota. |
| `s3Key` | String | Storage key (`users/<ownerId>/<timestamp>-<random>-<name>`). |
| `blobUrl` | String | Public Vercel Blob URL, or `null` for local storage. |
| `localPath` | String | Dev-only disk path; hidden by the serializer. |
| `folderId` | ObjectId → Folder | `null` for root files. |
| `ownerId` | ObjectId → User | Indexed. |
| `isTrashed` / `trashedAt` | Boolean / Date | Soft-delete state. |
| `isStarred` | Boolean | Stored; not surfaced in the UI. |

### ShareLink

| Field | Type | Notes |
|---|---|---|
| `token` | String | Unique, indexed, base64url. |
| `resourceType` | `file` \| `folder` | What the token points at. |
| `resourceId` | ObjectId | File or Folder id. |
| `ownerId` | ObjectId → User | Indexed. |
| `permission` | `view` \| `download` | Defaults to `download`. |
| `expiresAt` | Date \| null | Checked on access and listing. |
| `accessCount` | Number | Incremented per public access. |

### Serialization contract

`server/utils/transforms.js` converts documents to plain JSON:

- `_id` → string `id` (`_id` and `__v` removed).
- Timestamps → `created_at` / `updated_at` ISO strings.
- Model-specific snake_case fields (`parent_id`, `path`, `mime_type`, `blob_url`, `folder_id`, `is_trashed`, `trashed_at`, `storage_used`, `storage_limit`, `resource_type`, `access_count`, …).
- `localPath` and `passwordHash` are never exposed.

---

## Storage layer

`server/services/storage.js` chooses an adapter at runtime:

| Condition | Adapter | Behavior |
|---|---|---|
| `BLOB_READ_WRITE_TOKEN` set | Vercel Blob | Uploads under `drivea/users/<ownerId>/...`, returns a public URL. Downloads redirect to the URL. Deletes call the Blob API. |
| Token absent | Local disk | Writes to `.uploads/` in the working directory, with path separators escaped into the filename. Downloads stream through the API. |

Key details:

- Keys are generated from a timestamp, random suffix and a sanitized file name, which avoids collisions and path traversal.
- Copying a file re-downloads the source bytes and uploads a new independent object (or copies the local file).
- `fileUrl(file)` returns `blobUrl` when present, otherwise the authenticated API download route.
- `.uploads/` is git-ignored and is **not** persistent or writable on serverless platforms, so production requires Blob storage.
- `createUploadUrl` in the storage service can generate Blob upload contexts, but no HTTP route currently exposes it; the `POST /files/register` endpoint is the supported way to record a direct upload.
- Blob objects are uploaded with public access. Anyone who obtains a blob URL can read the object, independently of share-link revocation.

---

## Authentication and security

- **Passwords:** bcrypt hashing with 10 rounds; the hash never leaves the server.
- **Sessions:** stateless JWT, HS256 by default, 30-day expiry. The client stores it in `localStorage` under `drivea_token` and an Axios request interceptor adds the `Authorization` header.
- **401 handling:** the Axios response interceptor clears the token and redirects to `/login` when a request returns 401.
- **Route protection:** `ProtectedRoute` in `App.jsx` blocks `/`, `/f/:id`, `/trash` and `/shared` until `GET /auth/me` resolves; the server enforces ownership on every resource query.
- **Share links:** bearer-capability URLs; possession of the token grants access. Tokens are unguessable but cannot be password-protected.
- **Transport:** deployment config adds `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN` and `Referrer-Policy: strict-origin-when-cross-origin`.
- **CORS:** the API reflects the request origin (`origin: true`, credentials enabled). Tighten this if you expose the API publicly.
- **Not included:** rate limiting, brute-force protection, email verification, password reset, refresh tokens, per-file ACLs, CSRF tokens (not needed with bearer tokens), audit logging.

Local storage of the JWT means any XSS on the origin can read it. If you harden the app, move to an httpOnly cookie session and add a Content-Security-Policy.

---

## Frontend architecture

### Routes

| Path | Page | Access |
|---|---|---|
| `/` | `Drive` — root of My Drive | Protected |
| `/f/:id` | `Drive` — a specific folder | Protected |
| `/trash` | `Trash` | Protected |
| `/shared` | `SharedWithMe` — manage created links | Protected |
| `/login` | `Login` | Public |
| `/register` | `Register` (same module as Login) | Public |
| `/s/:token` | `SharedFile` — public share page | Public |
| `*` | Redirect to `/` | — |

The app is wrapped in `ThemeProvider` → `AuthProvider` → `Toaster` → `Routes`.

### Layout and responsive behavior

`components/layout/AppShell.jsx` is the single chrome used by Drive, Trash and Shared Links:

- **Desktop (`lg`, ≥1024px):** fixed 272px sidebar (logo, primary actions, workspace nav, storage meter, account), sticky translucent header with breadcrumbs, centered search and page actions, `max-w-[1500px]` content area.
- **Mobile:** compact brand header with actions and theme toggle, full-width search row, and a fixed bottom tab bar (My Drive / Shared links / Trash) with safe-area padding. Content reserves bottom padding so nothing hides behind the bar.
- **Grid breakpoints:** `grid-cols-2 → sm:3 → md:4 → xl:5 → 2xl:6`.

The shell accepts `breadcrumbs`, `searchValue`/`onSearchChange`, `sidebarActions`, `headerActions` and `contentProps` (used to spread `react-dropzone`'s root props onto `<main>` so the whole page accepts drops).

### Theming and dark mode

- `ThemeContext` manages `light`, `dark` and `system`. The preference is persisted in `localStorage` under `drivea-theme`; `system` follows `prefers-color-scheme` and updates live.
- `index.html` includes a tiny inline script that applies the `.dark` class before first paint to avoid a flash of the wrong theme, and sets `color-scheme` so native controls adapt.
- `index.css` defines semantic color tokens inside `@theme` (`surface`, `subtle`, `line`, `ink`, `muted`, `faint`, `accent`, `track`, `canvas`, plus danger/success/warning). The `.dark` block redefines those tokens, so components do not need per-element dark variants.
- The brand ramp (`brand-50…900`) is mapped to the orange in `/logo.svg`; 50/100/200 are darkened in dark mode so tinted surfaces recede instead of glowing.
- Custom shadows (`shadow-card`, `shadow-float`, `shadow-overlay`) have dark equivalents, as do skeletons and selection colors.
- `ThemeToggle` appears in the app header and on the auth/public pages.

### State and data fetching

- `context/AuthContext.jsx` bootstraps the session from the stored token, exposes `user`, `loading`, `login`, `register`, `logout`, `refresh` and `updateUser`, and renders the `UserButton` menu.
- `assets/api.js` wraps Axios and groups calls into `authApi`, `folderApi`, `fileApi`, `trashApi` and `shareApi`. It also exports shared helpers: `SORT_OPTIONS`, `formatBytes`, `getFileIcon`, `copyShareLink`.
- Pages fetch on mount and after mutations, keeping local state in `useState`; there is no global cache/query library.
- Uploads go through `fileApi.upload`, which sends one multipart request per file while aggregating progress across the batch.
- All user-visible errors surface through `react-hot-toast`, except auth form errors which render inline.

### UI kit

| Component | Responsibility |
|---|---|
| `Button` | `primary`, `secondary`, `subtle`, `ghost`, `danger` variants; `sm`/`md`/`lg`; loading and icon support. |
| `Input` | Label, icon, hint, error state. |
| `Modal` | Bottom sheet on mobile, centered dialog on desktop; Escape handling, scroll lock, optional footer. |
| `ConfirmDialog` | Destructive-action confirmation built on `Modal`. |
| `Dropdown` / `DropdownItem` | Click-outside and Escape closing; selected/danger states. |
| `ItemDropdown` | Per-file/folder action menu; always visible on touch, hover-revealed on pointer devices. |
| `ProgressBar` | Accessible (`role="progressbar"`) storage/upload meter. |
| `EmptyState` | Icon, title, description and optional action. |
| `Spinner` | Inline/route loading indicator. |
| `ThemeToggle` | Light/dark switch. |

---

## Scripts

Run from the repository root:

| Script | Description |
|---|---|
| `npm run dev:api` | Start the Express API with the dev bootstrap (in-memory MongoDB if needed). |
| `npm run dev:client` | Start the Vite dev server (proxies `/api` to port 4000). |
| `npm run build` | Production build of the SPA into `client/dist`. |

From `client/`:

| Script | Description |
|---|---|
| `npm run dev` | Vite dev server. |
| `npm run build` | Vite production build. |
| `npm run preview` | Serve the built SPA. |
| `npm run lint` | Run `oxlint`. |

---

## Testing and verification

There is no unit or integration test suite in the repository. Two checks are available:

**1. End-to-end API smoke test**

Start the API, then run the script. It registers a throwaway user and exercises auth, folder creation/nesting, uploads, search, rename, move, preview/download, share creation and access, trash/restore, and trash emptying.

```bash
npm run dev:api
node scripts/api-test.mjs
# optional: API_URL=https://your-api/api node scripts/api-test.mjs
```

> ⚠️ The smoke test creates and deletes data in the configured database. Point `MONGODB_URI` at a disposable database — never at production.

**2. Build and lint**

```bash
npm run build
npm run lint --prefix client
```

The build catches unresolved imports and Tailwind compilation issues; `oxlint` reports code-quality warnings.

---

## Deployment on Vercel

The repository ships a `vercel.json` that:

- installs root and client dependencies,
- builds the client with `npm run build`,
- serves `client/dist` as the output directory,
- rewrites `/api/*` to the serverless entry `api/index.js` and all other paths to `index.html` (so client-side routes survive refresh),
- applies the security headers listed above.

Steps:

1. **Database** — create a MongoDB Atlas cluster (or any reachable MongoDB), allow Vercel's egress, and set `MONGODB_URI` in the Vercel project.
2. **Blob storage** — create a Vercel Blob store and set `BLOB_READ_WRITE_TOKEN`. Optionally set `VERCEL_BLOB_DOMAIN` if your blob URLs are not absolute.
3. **Secrets** — set a long random `JWT_SECRET`. Optionally set `STORAGE_LIMIT_BYTES`.
4. **Deploy** — import the repository; `vercel.json` handles the build. No `VITE_API_URL` is needed because the SPA calls the same-origin `/api`.
5. **Verify** — open `/api/health`, register an account, upload a file, download it, and create/revoke a share link.

Production caveats:

- The filesystem is ephemeral/read-only on Vercel. Without a Blob token, uploads fail or disappear — Blob storage is required.
- Serverless functions have request-body limits (on the order of a few MB). Multipart uploads of large files will be rejected by the platform; use Vercel Blob direct upload plus `POST /api/files/register` for large files.
- The Mongoose connection is cached on `global` to survive warm invocations; cold starts connect on demand.
- Share links and blob URLs are publicly readable; do not store secrets in shared files.

---

## Troubleshooting

| Symptom | Likely cause / fix |
|---|---|
| `MONGODB_URI is not set` | You started the API without `server/dev.js` (which injects the in-memory URI). Use `npm run dev:api`, or set `MONGODB_URI`. |
| API hangs on first start | `mongodb-memory-server` is downloading a MongoDB binary. Wait, or set `MONGODB_URI` to a local/Atlas database. |
| Uploads vanish after restarting the API | The in-memory dev database was reset. Files may still exist in `.uploads/`; start from a persistent MongoDB for durable state. |
| Every request returns 401 / login loops | Token expired or `JWT_SECRET` changed. Clear `drivea_token` in localStorage and sign in again. |
| `413 Storage limit exceeded` | The account quota (`storageUsed + new size > storageLimit`) is full. Delete files permanently or raise the limit for new accounts. |
| Share page says “Link unavailable” | Token was revoked, expired, or the underlying file/folder is trashed/deleted. |
| File preview stays blank | The browser cannot render that MIME type, or a local blob is missing from `.uploads/`. Use the download action. |
| Vite serves 404 on refresh in production | SPA rewrite is missing. `vercel.json` includes it; replicate it in other hosts. |
| `VITE_API_URL` seems ignored | Vite reads `client/.env`, not the root `.env`. Create `client/.env` or rely on the proxy. |
| Upload works but downloads 404 in production | Blob URL is relative and `VERCEL_BLOB_DOMAIN` is unset, or the file was stored with the local adapter on an ephemeral disk. |

---

## Known limitations

These are behaviors of the current implementation, not promises:

- **No automated tests** beyond the smoke script; no CI configuration is included.
- **Folder ZIP downloads are flat** — nested files are archived by base name, so duplicate names can collide, and the structure is not preserved.
- **Permanently deleting a folder does not decrement `storageUsed`** for the files inside it, and the folder batch-delete endpoint only matches the supplied ids (it does not expand to descendants). Storage accounting can drift after those operations until files are removed individually.
- **Share `permission` is metadata** — a `view` link still returns a download URL; expiry and revocation are enforced.
- **No pagination** on file/folder lists, recent files or share links.
- **Folders cannot be searched by name**; search only matches file names in the selected folder.
- **Batch operations and copy/star/recent** are available in the API but not exposed in the UI.
- **No password reset or email verification**, and JWTs cannot be revoked server-side before expiry (30 days).
- **No rate limiting**, upload resumption, chunking, or virus scanning.
- **Duplicate names are allowed** in the same folder.
- **Dark mode is per browser**, not stored on the user account.
- **Public blob URLs and share tokens are capability URLs** — anyone with the link can read the content.

---

## Conventions

- **Module system:** ESM everywhere (`"type": "module"` in both packages).
- **API naming:** database fields are camelCase; the HTTP contract is snake_case, produced centrally by `server/utils/transforms.js`. Keep new endpoints consistent with that transform rather than hand-rolling response shapes.
- **Server organization:** one router per resource in `server/routes`, shared logic in `middleware/`, `services/` and `utils/`.
- **Frontend organization:** pages in `pages/`, reusable primitives in `components/ui/`, layout in `components/layout/`, cross-cutting state in `context/`, HTTP access in `assets/api.js`.
- **Styling:** use the semantic tokens (`bg-surface`, `border-line`, `text-ink`, `text-muted`, `text-accent`, …) instead of raw `white`/`slate-*` values so both themes keep working.
- **Icons:** Lucide React only.
- **Feedback:** toast for async outcomes; inline text for form validation.

---

## License

Private project. All rights reserved unless stated otherwise in the repository.
