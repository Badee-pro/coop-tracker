# Co-op Tracker

Track all your University of Waterloo co-op applications, from WaterlooWorks and anywhere else, in one place.

**Live site:** https://badee-pro.github.io/coop-tracker/

## Using the live site

1. Open the site and click **Download extension**, unzip it, then in `edge://extensions` (or `chrome://extensions`) turn on **Developer mode**, click **Load unpacked** and pick the unzipped `coop-tracker-sync` folder.
2. Click **Sync from WaterlooWorks**. WaterlooWorks opens in a new tab; sign in if asked. The extension reads your applications and closes the tab.
3. Add notes to any application, or add applications from outside WaterlooWorks with **+ Add application**.

No account and no server: the live site keeps everything in your own browser (`localStorage`). Syncing again updates your WaterlooWorks applications and keeps your notes and the applications you added yourself. Data stays in the browser where you saved it.

The site is built with `npm run build:web` (browser storage, `/coop-tracker/` path) and served by GitHub Pages from the `gh-pages` branch. To publish changes, run `deploy-site.ps1` (it lints, builds, and pushes the built site to `gh-pages`).

## Project layout

- `frontend/` — React + Vite. `npm run dev` uses the Rails API; `npm run build:web` builds the browser-storage website
- `backend/` — Rails 8 API (SQLite) for running the tracker locally at http://localhost:3000
- `extension/` — Co-op Tracker Sync browser extension (Manifest V3)

## Run locally with Rails

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
