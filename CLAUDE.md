# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Conduit is a healthcare team collaboration tool for managing patient case workflows and interdepartmental notifications between four teams: Home Office (admin), NCM, SP, and ISS. It replaces a Power BI / Power App setup.

**Stack:** FastAPI (Python) + PostgreSQL backend · React + Vite frontend · deployed on Railway as a single Docker service.

## Commands

### Backend (run from `backend/`)
```bash
# Install deps
pip install -r requirements.txt

# Run dev server (requires DATABASE_URL env var)
DATABASE_URL=postgresql://localhost/aaim uvicorn app.main:app --reload

# The server auto-creates tables and seeds data on first start
```

### Frontend (run from `frontend/`)
```bash
npm install
npm run dev      # dev server at :5173, proxies /api → :8000
npm run build    # outputs to ../static/ (served by FastAPI in prod)
```

### Docker (full stack)
```bash
docker build -t aaim-portal .
docker run -e DATABASE_URL=postgresql://... -p 8000:8000 aaim-portal
```

## Architecture

### Backend (`backend/app/`)

```
main.py          FastAPI app, lifespan creates DB tables + seeds, mounts static/
database.py      SQLAlchemy engine + SessionLocal + Base
models.py        Patient, User, Notification, NotificationReply
schemas.py       Pydantic request/response models
seed.py          Initial patient (26 records) and user (8 records) data
routers/
  patients.py    GET /api/patients/ (search, region, channel filters), GET /api/patients/{id}
  notifications.py  GET/POST /api/notifications/, PATCH /api/notifications/{id}, POST /api/notifications/{id}/replies
  users.py       GET /api/users/, POST /api/users/login
```

**No auth tokens** — login just returns a User object stored in localStorage. `X-User-ID` header is attached to requests (reserved for future auth).

**Auto-seed:** On startup, if `users` table is empty, `seed.py` inserts all patients and users.

**Static serving:** In production, FastAPI serves `static/` (the Vite build output) and catches all non-API routes to serve `index.html`.

### Frontend (`frontend/src/`)

```
constants.js     BUCKETS, TEAM_COLORS, STATUS_COLORS, assignBuckets(), helpers
api.js           fetch wrapper; all API calls go through api.* functions
App.jsx          Root component — all app state, polling, filtering logic
components/
  LoginScreen.jsx       Login form → POST /api/users/login
  PatientDetailPanel.jsx  Modal: patient details, notification history, new notification form
  NotificationCard.jsx  Single notification with thread, acknowledge, reply
  Shared.jsx            TeamBadge, StatusBadge, AgingBadge, GLOBAL_STYLES (CSS keyframes)
```

**Key patterns:**
- Bucketing (`assignBuckets`) runs client-side — it's pure computation from patient fields (snake_case in API, same logic as original)
- Notifications polled every 5s; new ones trigger toast notifications
- Patient fields are snake_case from API (e.g. `p.prescriber`, `p.aging_of_status`) vs the original PascalCase

### Database Models

| Model | Key fields |
|---|---|
| `Patient` | prescriber, referral_date, latest_sp_substatus, latest_hub_sub_status, aging_of_status, primary_channel, region, program_type |
| `User` | username, password (plain text, demo only), name, team, role |
| `Notification` | patient_id, from_team, from_user, to_team, comment, priority, status (pending/replied/acknowledged) |
| `NotificationReply` | notification_id, text, from_user, from_team |

### Deployment (Railway)

1. Add a PostgreSQL plugin in Railway — it injects `DATABASE_URL` automatically
2. Set the service to use the `Dockerfile` (already configured in `railway.toml`)
3. Deploy — tables are created and seeded on first boot

## Demo Credentials

All passwords: `pass123`

| User | Team |
|---|---|
| `sarah.johnson` | Home Office |
| `lisa.torres` | NCM |
| `amy.patel` | SP |
| `diana.reyes` | ISS |
