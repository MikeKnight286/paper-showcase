# Paper Showcase

A Next.js app with three views:

| Route | Who | Purpose |
|-------|-----|---------|
| `/` | Monitor | Rotating paper carousel with QR codes |
| `/dashboard` | Anyone on the network | Browse, filter by tag, personal reading checklist |
| `/admin` | Localhost only | Add and remove papers |

---

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:3000` for the monitor display.
Open `http://localhost:3000/admin` to manage papers (localhost only).
Point guests to `http://<your-ip>:3000/dashboard`.

---

## Configuration — `.env.local`

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_WIFI_NAME` | `LabNet` | WiFi name shown on the display |
| `NEXT_PUBLIC_DASHBOARD_PORT` | `3000` | Port shown in the display message |
| `NEXT_PUBLIC_ROTATE_MS` | `20000` | Rotation interval in ms |

---

## Paper data

Papers live in `data/papers.json`. Add/remove via `/admin`.
Remote users attempting to add/delete receive **403 Forbidden**.

Dashboard checklists are `localStorage`-only — per-device, never sent to the server.

---

## Production

```bash
npm run build && npm start
# or with pm2:
pm2 start npm --name paper-showcase -- start
```
