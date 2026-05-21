# Paper Showcase

A research paper carousel and library for labs and reading groups. Three views, three audiences.

| Route | Who | Purpose |
|---|---|---|
| `/` | Monitor display | Rotating paper carousel with LAN QR code |
| `/dashboard` | Anyone on the network | Browse, search, filter by tag, reading checklist, PDF viewer, submit papers |
| `/admin` | Admin only | Add papers (with DOI auto-fill), manage library |
| `/admin/queue` | Admin only | Review and approve/reject user-submitted papers |

---

## Quick start

```bash
npm install
cp .env.example .env.local   # edit ADMIN_PASSWORD and NEXT_PUBLIC_WIFI_NAME
npm run dev
```

- Monitor: `http://localhost:3000`
- Dashboard: `http://<your-LAN-IP>:3000/dashboard`
- Admin: `http://localhost:3000/admin`

---

## Configuration (`.env.local`)

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_WIFI_NAME` | `LabNet` | WiFi name shown on the monitor display |
| `NEXT_PUBLIC_DASHBOARD_PORT` | `3000` | Port shown in the QR code URL |
| `NEXT_PUBLIC_ROTATE_MS` | `20000` | Rotation interval in ms |
| `NEXT_PUBLIC_LAN_IP` | _(auto)_ | Override LAN IP auto-detection (multi-homed machines) |
| `ADMIN_PASSWORD` | `changeme_now` | Admin password — **change before deploying** |
| `MAX_UPLOAD_BYTES` | `20971520` | Max PDF upload size (bytes) |

---

## Features

### Feature 1 — LAN QR code on the monitor
The monitor page fetches `/api/lan-ip` at startup, which reads `os.networkInterfaces()` to find the machine's LAN IP. A QR code is generated pointing to `http://<IP>:<PORT>/dashboard`, allowing guests on the same WiFi to navigate directly to the library.

### Feature 2 — User paper submissions with admin approval queue
Anyone can submit a PDF and metadata via the dashboard. Uploaded files go to `data/pending/` and are never publicly accessible — they are served through an authenticated API proxy (`/api/pending-pdf/[id]`). Admins review submissions at `/admin/queue`, preview them inline, and approve or reject. Approved PDFs move to `public/papers/`; rejected ones are deleted.

**Security measures:**
- PDF magic bytes validated server-side (`%PDF` header), not just MIME type
- File size capped (default 20 MB)
- Pending files served through API proxy, not static paths
- All admin API routes check `isAdmin()` (localhost or session cookie)
- Path traversal prevention via `path.basename()`

### Feature 3 — DOI auto-fill for admins
Admins paste a DOI into the admin panel and click Fetch. The server calls CrossRef (`api.crossref.org`), parses title, authors, year, abstract, and URL, and pre-fills the add form. Tags must be entered manually. Duplicate DOI detection fires before the CrossRef request.

---

## Data storage

- `data/papers.json` — approved library
- `data/pending.json` — pending submission manifest
- `data/pending/*.pdf` — pending PDF files (not publicly accessible)
- `public/papers/*.pdf` — approved PDF files (served as static assets)

---

## Production

```bash
npm run build && npm start
# or with pm2:
pm2 start npm --name paper-showcase -- start
```

> For a production deployment, consider migrating `papers.json` and `pending.json` to SQLite via `better-sqlite3` to handle concurrent writes safely.
