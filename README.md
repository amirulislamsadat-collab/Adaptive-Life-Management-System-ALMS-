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
routes/       Express routers, mounted in server.js
views/        EJS templates (header/footer shared shell + one list/form pair per feature)
server.js     App entry point — view engine, sessions, routes, table creation, server start
```
