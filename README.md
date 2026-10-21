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

## WaterlooWorks auto-sync

The Rails server calls the same JSON endpoint the WaterlooWorks Applications page uses (`applications.htm?page=N&…`), using your browser session cookie, and imports every page.

Click **Sync from WaterlooWorks** in the tracker. The Rails server drives its own Microsoft Edge profile (via [Ferrum](https://github.com/rubycdp/ferrum), stored in `backend/tmp/waterloo_works_browser`):

1. It first checks invisibly whether that profile is still signed in. If so, it opens your Applications page, reads every page of the same JSON call WaterlooWorks uses, imports them and closes. No window appears.
2. If not, it opens a visible Edge window on the WaterlooWorks sign-in. Sign in (Edge can save your password there for next time); the window then reads your applications and closes by itself.

The status bar shows each step and the last sync time. Sessions live in `backend/tmp/` (gitignored) and are filtered from logs. `WW_COOKIE` / `WW_APPLICATIONS_URL` in `backend/.env` still work as a manual fallback.

Applications are matched by Job ID, so re-syncing updates them instead of duplicating.

API: `GET /api/waterloo_works/status`, `POST /api/waterloo_works/sync`, `POST /api/waterloo_works/sync/cancel`.

## API

| Method | Path | |
|---|---|---|
| GET | /api/job_applications | list |
| POST | /api/job_applications | create |
| PATCH | /api/job_applications/:id | update |
| DELETE | /api/job_applications/:id | delete |
| GET | /api/job_applications/stats | counts per status |

Statuses: `wishlist`, `applied`, `interviewing`, `offer`, `rejected`.
