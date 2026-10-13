# Paper Showcase

A research paper carousel and library for labs and reading groups.

| Route | Who | Purpose |
|---|---|---|
| `/` | Monitor display | Rotating paper carousel with LAN QR code |
| `/dashboard` | Anyone on the network | Browse, search, filter by tag, submit papers |
| `/admin` | Admin only | Add papers (DOI auto-fill), edit tags, manage library |
| `/paperreading` | Anyone (approve/reject: admin only) | Submit papers; admins review the queue |

## Quick start

```bash
npm install
cp .env.example .env.local   # set ADMIN_PASSWORD and NEXT_PUBLIC_WIFI_NAME
npm run dev
```

Open `http://localhost:3000`. Admin is at `/admin` (log in with `ADMIN_PASSWORD`).

## Configuration (`.env.local`)

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_WIFI_NAME` | `LabNet` | WiFi name shown on the monitor |
| `NEXT_PUBLIC_DASHBOARD_PORT` | `3000` | Port in the QR code URL |
| `NEXT_PUBLIC_ROTATE_MS` | `20000` | Carousel rotation interval (ms) |
| `NEXT_PUBLIC_LAN_IP` | _(auto)_ | Override LAN IP detection |
| `ADMIN_PASSWORD` | `changeme_now` | Admin password |
| `MAX_UPLOAD_BYTES` | `20971520` | Max PDF upload size |

## Data

- `data/papers.json` — approved library
- `data/pending.json`, `data/pending/*.pdf` — pending submissions (not public)
- `public/papers/*.pdf` — approved PDFs
