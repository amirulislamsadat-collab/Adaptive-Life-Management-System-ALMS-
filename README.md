# ALMS — Adaptive Life Management System

CSE470 (Software Engineering) — Group 09 project. A modular Node.js / Express / MySQL life-management platform: task manager, notes, calendar, reminders/alarms, subjects, study planner, health & wellness tracking, habit tracker, digital wellbeing, and finance tracker, all with per-user module enable/disable.

Built with plain **MVC**: `models/` (MySQL data access), `views/` (EJS templates), `controllers/` (request handling), `routes/` (Express routers), `config/` (DB connection), `middleware/` (notification checks).

## Features

1–14 (original): User role selection & workspace recommendation, module customization/enable-disable with data preservation, Task Manager, Notes (create/edit/search/pin/delete), Calendar with conflict detection, Reminders, Alarms with recurring schedules, due notifications, Subject Management.

15–21 (this increment):

| # | Feature | Where |
|---|---|---|
| 15 | Assignment Management | `/assignments` (Study Planner) |
| 16 | Examination Management with countdown | `/exams` (Study Planner) |
| 17 | Study Session Management | `/study-sessions` (Study Planner) |
| 18 | Sleep Tracking | `/sleep` (Health & Wellness) |
| 19 | Water Intake Tracking | `/water` (Health & Wellness) |
| 20 | Exercise Tracking | `/exercise` (Health & Wellness) |
| 21 | Mood Tracking | `/mood` (Health & Wellness) |

22–28 (this increment):

| # | Feature | Where |
|---|---|---|
| 22 | Medication Reminder | `/medications` (Health & Wellness) |
| 23 | Habit Management | `/habits` (Habit Tracker) |
| 24 | Habit Streak Calculation | `/habits` (Habit Tracker — current & longest streak per habit) |
| 25 | Screen Time Recording | `/screen-time` (Digital Wellbeing) |
| 26 | Social Media Usage Tracking | `/social-media` (Digital Wellbeing) |
| 27 | Productive Time Analysis | `/modules/screentime` (Digital Wellbeing hub — productive vs. non-productive breakdown) |
| 28 | Expense Tracking | `/expenses` (Finance Tracker) |

29–35 (this increment):

| # | Feature | Where |
|---|---|---|
| 29 | Savings Goal Management | `/savings-goals` (Finance Tracker — goals with a contribution log) |
| 30 | Goal Management | `/goals` (Goals) |
| 31 | Journal Management | `/journal` (Personal Journal — create/edit/search) |
| 32 | Productivity Report Generation | `/modules/reports` (Reports & Insights) |
| 33 | Life Balance Report | `/modules/reports` (Life Score gauge computed from active modules) |
| 34 | Personalized Recommendation Generation | `/modules/reports` (rule-based recommendations) |
| 35 | Recommendation Explanation | `/modules/reports` (each recommendation shows the data behind it) |

Features 32-35 are read-only: `models/ReportEngine.js` computes them fresh on every visit from the other feature tables (tasks, study, health, habits, screen time, finance) instead of storing generated reports.

## The 2026 upgrade (this deploy only)

This `alms-vercel-deploy` folder has been upgraded well past the original 35-feature scope for the Vercel-hosted version, while the main project folder was left untouched. What's new:

- **Installable app (PWA)** — a Web App Manifest and Service Worker make the site installable on Android, desktop Chrome/Edge, and iOS. An "Install App" button appears both in the top bar and the sidebar: on Android/desktop it triggers the browser's native install prompt; on iOS (which has no install-prompt API) it shows step-by-step "Add to Home Screen" instructions instead. Static assets are cached for offline use, with a branded offline fallback page for navigation when there's no connection.
- **Focus Mode** (`/focus`) — schedule daily/weekly distraction-free time blocks. Being honest about what a website can and can't do: a browser tab cannot get OS-level permission to block other apps, so this is deliberately built as an accountability tool in the spirit of apps like Opal, not a fake app-blocker. During an active session the dashboard shows a banner to check in as "Stayed focused" or "Got distracted," and streak/success-rate stats are tracked per session.
- **Gamification (XP & levels)** — completing tasks, checking in on habits, finishing assignments/exams/study sessions, hitting 100% on a goal, and staying focused during a Focus Mode session all award XP. Level and progress-to-next-level are shown as a badge in the sidebar and as a progress ring on the Settings page.
- **Quick-Add** — a natural-language task box on the Today dashboard (e.g. "Submit report tomorrow high priority") parses a due date and priority from plain text instead of requiring the full task form.
- **Redesigned "Today" dashboard** (`/dashboard`) — instead of just module tiles, the dashboard now leads with what's actually due today: tasks, habit check-ins, medications, upcoming reminders, today's calendar events, and a one-tap "+250ml" water log — each card only appears if its module is enabled, and the whole thing collapses to a friendly empty state when nothing's due.
- **Profile pictures & expanded Account settings** — upload a photo (client-side resized/compressed to keep the database payload small) or remove it, and rename your display name, from the "Account" section of Settings.
- **5 new roles at setup** — Entrepreneur, Parent/Caregiver, Fitness Enthusiast, Creative/Content Creator, and Remote Worker join the original Student/Professional/Freelancer, each with its own recommended-module set (Focus Mode included where it fits).
- **Modern visual redesign + Ctrl+K command palette** — a refreshed look with hover/lift micro-interactions on cards, and a searchable command palette (Ctrl+K / Cmd+K, or the topbar search button) that jumps straight to any enabled module.

All 35 original features remain fully functional and were regression-tested end-to-end after these changes (all routes return 200, module enable/disable still gates every new and old feature correctly, no server errors).

## Later additions

- **Native Windows (`desktop-app/`) and Android (`mobile-app/`) apps** — real installers, not just the PWA, built via GitHub Actions (`.github/workflows/build-apps.yml`) and attached to GitHub Releases. See each folder's README.
- **Google Sign-In**, **AI Assistant** (Claude-powered chat bubble, server-persisted history), **Daily Check-In** (energy/water goal/today's focus, one per local day), **customizable Today dashboard** (drag-reorder and hide widgets, saved per user), **cross-module insights** (Reports page — rules that correlate two modules at once, e.g. low sleep + low task completion), and an **expanded gamification system** (cumulative XP levels, priority multipliers, streak bonuses) — each documented in its own commit message; set the corresponding env vars in `.env.example` to activate the ones that need a third-party key (Google OAuth, Anthropic).
- **Daily streak** (Duolingo-style) — any meaningful action keeps a running daily streak alive, shown as a flame badge in the sidebar with a "streak at risk" nudge on the dashboard if nothing's been done yet today.
- **Real push notifications** for reminders/alarms (Settings > Notifications), so they can notify even when ALMS isn't open in a tab — unlike the in-app banner, which only ever fires while someone has a page loaded. Needs `VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY` set (generate with `npx web-push generate-vapid-keys`) and is delivered by a scheduled job (`vercel.json`'s `crons` → `/api/cron/notify`, secured by `CRON_SECRET`).
  > **Vercel plan note:** cron jobs on Vercel's free **Hobby** plan run **at most once per day**, regardless of the schedule configured (`*/15 * * * *` here) — Vercel silently throttles it. On Hobby, this means reminders/alarms get swept for delivery roughly once daily, not every 15 minutes. True near-real-time delivery needs a **Pro** plan, or pinging `/api/cron/notify` yourself from a free external scheduler (e.g. cron-job.org) with the `Authorization: Bearer <CRON_SECRET>` header.

## Local development (XAMPP)

1. Install [XAMPP](https://www.apachefriends.org/) and start **MySQL** from the XAMPP Control Panel (Apache is not required — this app runs its own Node server).
2. Create the database once, e.g. via phpMyAdmin or:
   ```
   C:\xampp\mysql\bin\mysql.exe -u root -e "CREATE DATABASE IF NOT EXISTS alms_db;"
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. (Optional) Copy `.env.example` to `.env` if your MySQL isn't the XAMPP default (root / no password / port 3306) — the app already falls back to those defaults, so a fresh XAMPP install needs no `.env` at all.
5. Start the server:
   ```
   node server.js
   ```
   or
   ```
   npm start
   ```
6. Open **http://localhost:3000** — all tables are created automatically (and are safe to re-run; existing data is preserved).

## Deploying (Vercel + a cloud MySQL database)

Vercel runs this app as a serverless function (`server.js` exports the Express `app`; `vercel.json` routes all requests to it and serves `/public` as static files). Two things to set up:

1. **A cloud MySQL database.** XAMPP only runs on your machine, so Vercel's servers can't reach it — you need a publicly reachable MySQL instance (free tiers work fine): [Aiven](https://aiven.io/mysql), [Railway](https://railway.app/), [Clever Cloud](https://www.clever-cloud.com/), or similar.
2. **Push this repo to GitHub, then import it in Vercel** (New Project → Import Git Repository) and set these Environment Variables in the Vercel project settings, using your cloud database's credentials:
   - `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`
   - `SESSION_SECRET` — any long random string

Deploy. The first request initializes the schema automatically (idempotent, same as local).

> **Session storage note:** this app uses `express-session`'s default in-memory store, which is fine for local development and light single-instance use. Serverless platforms can spin up multiple instances, so under real traffic a persistent session store (e.g. a MySQL- or Redis-backed store) would make logins more reliable in production. Swapping the store in `server.js` is a drop-in change if you need that later.

## Pushing to a Git repository

This project is already a local git repository with an initial commit. To publish it:

```
git remote add origin <your-empty-github-repo-url>
git push -u origin main
```

Then follow the Vercel steps above to deploy.

## Project structure

```
config/       MySQL connection pool
controllers/  Request handlers (one per feature area)
middleware/   Due-notification check, runs on every request
models/       Parameterized MySQL queries, one per entity
public/css/   Stylesheet
public/js/    Client-side scripts (PWA install prompt, service worker registration, command palette)
public/icons/ PWA app icons; public/manifest.json and public/service-worker.js are the PWA config
routes/       Express routers, mounted in server.js
views/        EJS templates (header/footer shared shell + one list/form pair per feature)
server.js     App entry point — view engine, sessions, routes, table creation, server start
```
