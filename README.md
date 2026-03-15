# AAIM Portal

A secure team collaboration platform for managing patient case workflows and interdepartmental notifications, built by **FireFly Software LLC**.

Teams — **Home Office**, **NCM**, **SP**, and **Sales** — can view a shared patient dashboard, send notifications to each other, reply, acknowledge, add private case notes, and set follow-up reminders.

## Stack

- **Backend:** FastAPI + PostgreSQL (SQLAlchemy)
- **Frontend:** React + Vite
- **Deployment:** Railway (single Docker service)
- **Email:** Resend API (Sales team notifications)

---

## Onboarding a New Organization

### Step 1 — Deploy
Follow the [Deploy to Railway](#deploy-to-railway) steps below. The system starts with demo data pre-loaded.

### Step 2 — Clear demo data (optional)
Log in as an admin (`sarah.johnson` / `pass123`), go to **Settings → Patients** and delete the demo cases, and **Settings → Users** to remove demo accounts.

### Step 3 — Import your users
1. Go to **Settings → Import**
2. Under **Import Users**, click **Download Template** to get `aaim_users_template.csv`
3. Fill in your team's login accounts:

| Column | Description | Values |
|---|---|---|
| `username` | Login username (lowercase) | e.g. `john.doe` |
| `password` | Initial password | any string |
| `name` | Display name | e.g. `John Doe` |
| `team` | Team assignment | `Home Office`, `NCM`, `SP`, `Sales` |
| `role` | Permission level | `admin`, `partner` |

4. Upload the filled CSV — duplicate usernames are skipped automatically.

### Step 4 — Import your case data
1. Under **Import Cases**, click **Download Template** to get `aaim_cases_template.csv`
2. Fill in your patient/case records:

| Column | Description |
|---|---|
| `prescriber` | **Required.** Patient or prescriber identifier |
| `referral_date` | YYYY-MM-DD |
| `latest_sp_partner` | Specialty pharmacy partner name |
| `latest_sp_status` | SP status string |
| `latest_sp_substatus` | SP substatus string |
| `aging_of_status` | Integer — days since last status change |
| `latest_hub_sub_status` | HUB substatus |
| `primary_channel` | Commercial, Medicare, Medicaid, etc. |
| `primary_payer` | Payer name |
| `primary_pbm` | PBM name |
| `secondary_channel` | Secondary insurance channel |
| `territory` | Territory code |
| `region` | Region name (used for filtering) |
| `language` | Patient language |
| `hippa_consent` | `Yes`, `No`, or `Pending` |
| `program_type` | Program type label |
| `first_ship_date` | YYYY-MM-DD |
| `last_ship_date` | YYYY-MM-DD |
| `last_comment` | Free text comment |

3. Upload — each row becomes a case in the dashboard immediately.

### Step 5 — Share login credentials
Send each user their `username` and `password`. They log in at your Railway URL. Passwords can be updated at any time via **Settings → Users**.

---

## Feature Log

### v1.7.0 — 2026-03-15
- **Admin Panel** — New 🔒 Admin tab in Settings, visible only to users with `role = admin`.
  - **Login Audit Log** — Every successful login records the user, team, timestamp, IP address, and browser user-agent. Displayed in a sortable table (most recent first, last 500 events).
  - **Database Table Viewer** — Browse raw rows from all six database tables: `patients`, `users`, `notifications`, `notification_replies`, `case_notes`, `audit_logs`. Live filter, sticky header, up to 2000 rows per query.
- **API: Admin endpoints** — `GET /api/admin/audit-logs` and `GET /api/admin/tables/{table}`.

### v1.6.4 — 2026-03-15
- **Bug fix: logos not loading** — FastAPI was only serving `/assets/` as static files; `/img/*.svg` requests were falling through to the SPA catch-all and returning `index.html`. Fixed by mounting `/img` as a dedicated static directory. Affects all brand logos on login page and nav bar.

### v1.6.3 — 2026-03-15
- **Mark Done from Calendar** — ✓ Mark Done / ↩ Undo buttons now appear directly on every follow-up card in the Follow-Up Calendar view (overdue banner, selected date panel, upcoming sidebar). No need to open a patient detail panel to complete a follow-up.
- **Cycling brand logos** — Login page shows a rotating logo banner cycling through all 8 brand options (RelayRx A–D, Conduit E–H) every 3.5 seconds. Nav upper left picks 2 logos randomly per session and alternates between them every 4 seconds.

### v1.6.0 — 2026-03-15
- **Bulk Import** — New Settings → Import tab for onboarding new organizations.
  - Import users and case data from CSV files with live preview before upload.
  - Downloadable CSV templates with correct column formats and sample data.
  - Per-row error reporting; duplicate usernames automatically skipped.
- **API: Bulk endpoints** — `POST /api/users/bulk` and `POST /api/patients/bulk` accept JSON arrays and return `{ created, skipped, errors }`.
- **Onboarding guide** — README now includes step-by-step instructions for deploying to a new org and importing their data.

### v1.5.0 — 2026-03-14
- **Favicon** — FireFly Software SVG firefly logo as browser tab icon (glowing green abdomen, blue body, wings, antennae on dark circle background).
- **Version badge** — `vX.Y.Z` version tag displayed in the nav bar next to the AAIM Portal logo on both desktop and mobile.
- **Guided Tour** — 🗺 Guide button in the nav launches an 11-step interactive walkthrough. Spotlight effect dims the page and highlights each feature with a pulsing blue ring. Keyboard ← → and Esc supported. Progress dots allow jumping to any step.
- **Per-user follow-up privacy** — Follow-up notes and calendar are scoped to the logged-in user. You see only your own follow-ups; other users' private notes are never surfaced.
- **Follow-up nav badge** — Live badge on the Follow-Ups nav item: red count if any follow-ups are overdue, blue count if upcoming, no badge if none. Updates immediately as notes are added or deleted.
- **Overdue alert popup** — On first dashboard load after login, a modal warns the user if they have any past-due follow-ups, listing each patient with a direct "View Calendar" shortcut to the follow-up calendar.

### v1.4.0 — 2026-03-14
- **Case Notes** — Add private notes to any case without sending a team notification. Notes are visible only in the patient detail panel.
- **Follow-Up Dates** — Set a follow-up date on any note. Date picker in the Notes tab of the patient panel.
- **Follow-Up Calendar** — New nav section with a full calendar grid showing all follow-up dates as color-coded bars. Overdue follow-ups flagged in red. Upcoming sidebar with "Today / Tomorrow / In N days" labels. Click any day to see that day's notes.
- **API: Case Notes** — `GET/POST/PATCH/DELETE /api/notes/`

### v1.3.0 — 2026-03-14
- **Demo Slideshow** — 10-slide presentation in Settings → Demo tab. Keyboard arrow navigation. Covers problem, solution, features, workflow, analytics, security, and CTA.
- **About Page** — Corporate about us in Settings → About tab. FireFly Software LLC branding, leadership bios (CEO Nick Milero, CTO Rick Boulanger), company stats, product philosophy.
- **FireFly Software Logo** — Custom inline SVG firefly logo used throughout the presentation and about page.

### v1.2.0 — 2026-03-14
- **Analytics Page** — New nav tab with SVG charts, arc gauge, donut charts, and deep case insights.
  - Aging analysis with tabbed views: Distribution, Critical Cases, By Region
  - SP Partner performance cards (case count + avg aging)
  - Insurance channel, region, and language donut charts
  - HIPAA consent ring chart and notification resolution ring
  - Avg days from referral to first ship
- **Avg Aging card** on dashboard is clickable — navigates directly to Analytics.
- **Enhanced Filters** — Dashboard now has SP Partner, Payer, and Aging range filters. Active filters highlighted. Clear button.

### v1.1.0 — 2026-03-13
- **Settings Page** redesigned with three tabs: Appearance, Users, Patients.
- **Appearance tab** — Two large visual cards for Dark/Light mode selection.
- **Patients tab** — Full patient CRUD: searchable table, Edit modal with all 18 fields, Delete with confirmation.
- **Patient API** — `PATCH /api/patients/{id}` and `DELETE /api/patients/{id}` endpoints.

### v1.0.0 — 2026-03-12
- **Multi-team dashboard** — Patient table with search, region, channel, SP partner, payer, aging filters. Bucket bar (case stages).
- **Notification inbox** — Priority-based notifications with reply and acknowledge. 5-second polling. Toast popups.
- **Email escalation** — Resend integration sends styled HTML email to Sales team on critical notifications.
- **One-click demo login** — Click any user card on the login screen to sign in instantly.
- **Responsive design** — Mobile bottom nav, card layouts, bottom-sheet patient detail panel.
- **Dark/Light mode** — Persistent theme via localStorage.
- **User management** — Full CRUD for users in Settings.
- **Analytics** — Case stage buckets, avg aging, notification counts.
- **Role-based teams** — Home Office, NCM, SP, Sales with color coding.

---

## Local Development

### Prerequisites
- Python 3.12+
- Node 20+
- PostgreSQL running locally

### Backend

```bash
cd backend
pip install -r requirements.txt
DATABASE_URL=postgresql://localhost/aaim uvicorn app.main:app --reload
```

The server auto-creates tables and seeds demo data on first start.

### Frontend

```bash
cd frontend
npm install
npm run dev   # runs at http://localhost:5173, proxies /api → :8000
```

## Deploy to Railway

1. Create a new project at [railway.app](https://railway.app)
2. Connect this GitHub repo
3. Add a **PostgreSQL** plugin — Railway injects `DATABASE_URL` automatically
4. Set `RESEND_API_KEY` and `SALES_EMAIL` environment variables
5. Deploy — the Dockerfile handles the build, tables are created and seeded on first boot

## Demo Credentials

All passwords: `pass123`
Or click any user card on the login screen for one-click login.

| Username | Team |
|---|---|
| `sarah.johnson` | Home Office |
| `mike.chen` | Home Office |
| `lisa.torres` | NCM |
| `james.wright` | NCM |
| `amy.patel` | SP |
| `robert.kim` | SP |
| `diana.reyes` | Sales |
| `carlos.vega` | Sales |

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/users/login` | Login |
| `GET` | `/api/users/` | List users |
| `POST` | `/api/users/` | Create user |
| `PATCH` | `/api/users/{id}` | Update user |
| `DELETE` | `/api/users/{id}` | Delete user |
| `GET` | `/api/patients/` | List patients (`search`, `region`, `channel`) |
| `PATCH` | `/api/patients/{id}` | Update patient |
| `DELETE` | `/api/patients/{id}` | Delete patient |
| `GET` | `/api/notifications/` | List all notifications |
| `POST` | `/api/notifications/` | Create notification (triggers email if `to_team=Sales`) |
| `PATCH` | `/api/notifications/{id}` | Update status (acknowledge) |
| `POST` | `/api/notifications/{id}/replies` | Add reply |
| `POST` | `/api/users/bulk` | Bulk create users from JSON array; returns `{ created, skipped, errors }` |
| `POST` | `/api/patients/bulk` | Bulk create patients from JSON array; returns `{ created, skipped, errors }` |
| `GET` | `/api/notes/` | List case notes (optional `?patient_id=` and `?user_id=` for per-user scoping) |
| `POST` | `/api/notes/` | Create case note |
| `PATCH` | `/api/notes/{id}` | Update note |
| `DELETE` | `/api/notes/{id}` | Delete note |
| `GET` | `/api/admin/audit-logs` | Last 500 login events (admin UI) |
| `GET` | `/api/admin/tables/{table}` | Raw rows from any DB table; tables: `patients`, `users`, `notifications`, `notification_replies`, `case_notes`, `audit_logs` |

---

*Built by [FireFly Software LLC](https://fireflysoftware.com) — Illuminating Healthcare Operations*
