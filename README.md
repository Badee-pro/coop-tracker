# Co-op Tracker

Track co-op / internship applications on a Kanban board.

- `backend/` — Rails 8 API (SQLite) at http://localhost:3000
- `frontend/` — React + Vite at http://localhost:5173 (proxies `/api` to Rails)

## Run

On Windows, double-click `start.cmd`. It opens both servers and the browser. Or run them manually:

```bash
cd backend && bundle install && ruby bin/rails db:prepare && ruby bin/rails server
```

```bash
cd frontend && npm install && npm run dev
```

## Viewing on your phone

Run `start-phone.cmd` instead of `start.cmd`, then open the **Network** address printed in the React window on a phone on the same Wi-Fi. Phones get a read-only view: syncing, adding, editing and deleting only work on the computer running the tracker (requests from other devices are rejected). Avoid sharing it on public or campus Wi-Fi, since anyone on that network could view your list.

## WaterlooWorks sync

Syncing uses the **Co-op Tracker Sync** browser extension in `extension/`.

One-time setup: open `edge://extensions` (or `chrome://extensions`), turn on **Developer mode**, click **Load unpacked** and pick the `extension` folder. Refresh the tracker; the "needs the extension" notice disappears once it's connected.

Then click **Sync from WaterlooWorks**. WaterlooWorks opens in a new tab beside the tracker; sign in there if asked (your browser's autofill works). The extension reads your applications from the same JSON call the WaterlooWorks Applications page uses (every page), hands them to the tracker tab, and closes the WaterlooWorks tab. Applications are matched by Job ID, so re-syncing updates them instead of duplicating.

After changing the extension, click **Reload** on it in `edge://extensions` and run `package-extension.ps1` to rebuild the zip offered by the tracker's **Download extension** button.

Optional cookie-based background syncing (`WW_COOKIE`, `WW_APPLICATIONS_URL`, `WW_SYNC_MINUTES` in `backend/.env`) is off by default.

API: `GET /api/waterloo_works/status`, `POST /api/waterloo_works/import` (items from the extension).

## API

| Method | Path | |
|---|---|---|
| GET | /api/job_applications | list |
| POST | /api/job_applications | create |
| PATCH | /api/job_applications/:id | update |
| DELETE | /api/job_applications/:id | delete |
| GET | /api/job_applications/stats | counts per status |

Statuses: `wishlist`, `applied`, `interviewing`, `offer`, `rejected`.
