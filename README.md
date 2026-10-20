# Co-op Tracker

Track co-op / internship applications on a Kanban board.

- `backend/` — Rails 8 API (SQLite) at http://localhost:3000
- `frontend/` — React + Vite at http://localhost:5173 (proxies `/api` to Rails)

## Run

```bash
cd backend && bundle install && ruby bin/rails db:prepare && ruby bin/rails server
```

```bash
cd frontend && npm install && npm run dev
```

## API

| Method | Path | |
|---|---|---|
| GET | /api/job_applications | list |
| POST | /api/job_applications | create |
| PATCH | /api/job_applications/:id | update |
| DELETE | /api/job_applications/:id | delete |
| GET | /api/job_applications/stats | counts per status |

Statuses: `wishlist`, `applied`, `interviewing`, `offer`, `rejected`.
