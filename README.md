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

## WaterlooWorks auto-sync

The Rails server calls the same JSON endpoint the WaterlooWorks Applications page uses (`applications.htm?page=N&…`), using your browser session cookie, and imports every page.

1. In Edge DevTools → Network on the WaterlooWorks Applications page, select the `applications.htm?page=1&sort…` request.
2. In `backend/.env` (copied from `.env.example`, gitignored), set `WW_COOKIE` to its **Cookie** request header and `WW_APPLICATIONS_URL` to its URL.
3. Restart the app. It syncs on startup and every `WW_SYNC_MINUTES` (default 15). The board also has a **Sync now** button.

The cookie expires when your WaterlooWorks login does; the sync bar shows an error then, and you paste a fresh one. Applications are matched by Job ID, so re-syncing updates them instead of duplicating.

API: `GET /api/waterloo_works/status`, `POST /api/waterloo_works/sync`.

## API

| Method | Path | |
|---|---|---|
| GET | /api/job_applications | list |
| POST | /api/job_applications | create |
| PATCH | /api/job_applications/:id | update |
| DELETE | /api/job_applications/:id | delete |
| GET | /api/job_applications/stats | counts per status |

Statuses: `wishlist`, `applied`, `interviewing`, `offer`, `rejected`.
