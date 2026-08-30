// ============================================================
// ALMS — Adaptive Life Management System
// Entry Point: server.js
// Architecture: MVC (Model-View-Controller)
// Database: MySQL via mysql2/promise
// ============================================================
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const path    = require('path');
const db      = require('./config/db');

// --- Route Imports ---
const authRoutes      = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const taskRoutes      = require('./routes/taskRoutes');
const notesRoutes     = require('./routes/notesRoutes');
const calendarRoutes  = require('./routes/calendarRoutes');
const reminderRoutes  = require('./routes/reminderRoutes');
const alarmRoutes     = require('./routes/alarmRoutes');
const subjectRoutes   = require('./routes/subjectRoutes');
const studyRoutes     = require('./routes/studyRoutes');
const healthRoutes    = require('./routes/healthRoutes');
const habitRoutes     = require('./routes/habitRoutes');
const digitalRoutes   = require('./routes/digitalRoutes');
const financeRoutes   = require('./routes/financeRoutes');
const goalRoutes      = require('./routes/goalRoutes');
const journalRoutes   = require('./routes/journalRoutes');

// --- Middleware Imports ---
const notificationMiddleware = require('./middleware/notificationMiddleware');
const Module = require('./models/Module');

const app  = express();
const PORT = process.env.PORT || 3000;

// --- View Engine ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// --- Body Parsers & Static Files ---
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Session ---
app.use(session({
  secret: process.env.SESSION_SECRET || 'alms-secret-key-470',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));

// --- Flash Messages Middleware ---
app.use((req, res, next) => {
  res.locals.user    = req.session.user    || null;
  res.locals.success = req.session.success || null;
  res.locals.error   = req.session.error   || null;
  delete req.session.success;
  delete req.session.error;
  next();
});

// --- Setup Gate: block every page until the setup wizard is finished ---
// (Feature 1) — without this, a brand-new user could type any feature URL
// directly and skip role/module selection entirely.
app.use((req, res, next) => {
  const user = req.session.user;
  const isSetupRelatedPath = req.path.startsWith('/setup') || req.path.startsWith('/logout') || req.path.startsWith('/api');
  if (user && user.setup_completed != 1 && !isSetupRelatedPath) {
    return res.redirect('/setup');
  }
  next();
});

// --- Enabled Modules Lookup (Feature 4) — so the sidebar can hide the nav
// links for whatever a user has disabled, instead of only the dashboard
// cards respecting it.
app.use(async (req, res, next) => {
  res.locals.enabledSlugs = [];
  if (req.session.user && req.session.user.setup_completed == 1) {
    try {
      const enabled = await Module.findEnabledForUser(req.session.user.id);
      res.locals.enabledSlugs = enabled.map(m => m.slug);
    } catch (err) {
      console.error('Enabled modules lookup error:', err);
    }
  }
  next();
});

// --- Notification Middleware (Feature 13) ---
app.use(notificationMiddleware);

// --- Routes ---
app.use('/', authRoutes);
app.use('/', dashboardRoutes);
app.use('/', taskRoutes);
app.use('/', notesRoutes);
app.use('/', calendarRoutes);
app.use('/', reminderRoutes);
app.use('/', alarmRoutes);
app.use('/', subjectRoutes);
app.use('/', studyRoutes);
app.use('/', healthRoutes);
app.use('/', habitRoutes);
app.use('/', digitalRoutes);
app.use('/', financeRoutes);
app.use('/', goalRoutes);
app.use('/', journalRoutes);

// --- Notifications API (for client-side polling without page refresh) ---
const Reminder = require('./models/Reminder');
const Alarm    = require('./models/Alarm');
const DAY_CODES_API = ['SU','MO','TU','WE','TH','FR','SA'];

app.get('/api/notifications', async (req, res) => {
  if (!req.session.user) return res.json({ count: 0, items: [] });
  try {
    const userId = req.session.user.id;
    const dueReminders = await Reminder.findDue(userId, 5);
    const alarms = await Alarm.findEnabledByUser(userId);
    const now = new Date();
    const nowHHMM = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    const dayCode = DAY_CODES_API[now.getDay()];
    const dueAlarms = [];
    for (const alarm of alarms) {
      let matches = false;
      if (alarm.frequency === 'daily') matches = true;
      else if (alarm.frequency === 'weekdays') matches = ['MO','TU','WE','TH','FR'].includes(dayCode);
      else if (alarm.frequency === 'custom') matches = alarm.days_of_week && alarm.days_of_week.split(',').includes(dayCode);
      if (!matches) continue;
      const alarmTime = String(alarm.time_of_day || '').slice(0,5);
      if (!alarmTime || alarmTime > nowHHMM) continue;
      const last = alarm.last_triggered_at ? new Date(alarm.last_triggered_at) : null;
      const triggeredToday = last && last.getFullYear()===now.getFullYear() && last.getMonth()===now.getMonth() && last.getDate()===now.getDate();
      if (!triggeredToday) dueAlarms.push(alarm);
    }
    if (dueReminders.length) {
      await Reminder.markNotified(userId, dueReminders.map(r => r.id));
    }
    // r.due_at is a JS Date object (from a MySQL DATETIME column) — format it
    // to a short readable string instead of letting the client stringify the
    // raw Date/ISO value into the notification popup.
    const items = [
      ...dueReminders.map(r => ({ type:'reminder', title: r.title, time: new Date(r.due_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) })),
      ...dueAlarms.map(a => ({ type:'alarm', title: a.title, time: String(a.time_of_day || '').slice(0, 5) }))
    ];
    res.json({ count: items.length, items });
  } catch (err) {
    console.error('Notifications API error:', err);
    res.json({ count: 0, items: [] });
  }
});

// --- Root Redirect ---
app.get('/', (req, res) => {
  if (req.session.user) {
    if (req.session.user.setup_completed != 1) return res.redirect('/setup');
    return res.redirect('/dashboard');
  }
  res.redirect('/login');
});

// ============================================================
// Database Initialization — creates all tables and seed data
// ============================================================
async function initDB() {
  try {
    // ---------- TABLE 1: roles ----------
    await db.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.query(`
      INSERT IGNORE INTO roles (id, name, description) VALUES
      (1, 'Student', 'Academic learner managing coursework, study schedules, and campus life'),
      (2, 'Professional', 'Working professional balancing career tasks, meetings, and personal growth'),
      (3, 'Freelancer', 'Independent worker managing clients, projects, deadlines, and invoicing')
    `);

    // ---------- TABLE 2: users ----------
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role_id INT DEFAULT NULL,
        setup_completed TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL
      )
    `);

    // ---------- TABLE 3: modules ----------
    await db.query(`
      CREATE TABLE IF NOT EXISTS modules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        slug VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        icon VARCHAR(50) DEFAULT 'fas fa-cube',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.query(`
      INSERT IGNORE INTO modules (id, name, slug, description, icon) VALUES
      (1, 'Task Manager',     'tasks',    'Create, organize, and track your daily tasks and to-dos',             'tasks'),
      (2, 'Study Planner',    'study',    'Plan study sessions, track coursework, and manage academic deadlines','book'),
      (3, 'Finance Tracker',  'finance',  'Monitor expenses, income, and maintain a personal budget',            'wallet'),
      (4, 'Health & Wellness','health',   'Track fitness goals, water intake, and wellness habits',              'heart'),
      (6, 'Personal Journal', 'journal',  'Write daily reflections, mood tracking, and personal notes',         'pen'),
      (7, 'Notes',            'notes',    'Capture, pin, and search your notes quickly',                         'note'),
      (8, 'Calendar',         'calendar', 'Manage calendar events and detect scheduling conflicts',              'calendar'),
      (9, 'Reminders',        'reminders','Track reminders with due date and time',                              'bell'),
      (10, 'Alarms',          'alarms',   'Set recurring alarms with customizable schedules',                    'alarm'),
      (11, 'Subjects',        'subjects', 'Manage your academic subjects and instructors',                       'subject'),
      (12, 'Habit Tracker',   'habits',     'Build consistent habits and track your daily completion streaks',            'habit'),
      (13, 'Digital Wellbeing','screentime','Track screen time and social media usage, and see how productive your time really is', 'mobile'),
      (14, 'Goals',           'goals',      'Set personal goals, track progress, and celebrate milestones',               'bullseye'),
      (15, 'Reports & Insights','reports',  'Generate productivity and life balance reports with personalized recommendations', 'chart-line')
    `);

    // "Project Board" was seeded early on but never got a real feature built
    // behind it. Removing it here (not just from the INSERT list above) so it
    // also disappears from databases that already seeded it; the FK cascade
    // on user_modules cleans up any per-user enable/disable rows for it too.
    await db.query(`DELETE FROM modules WHERE slug = 'projects'`);

    // ---------- TABLE 4: user_modules ----------
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_modules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        module_id INT NOT NULL,
        is_enabled TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_user_module (user_id, module_id),
        FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
        FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
      )
    `);

    // ---------- TABLE 5: categories ----------
    await db.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        color VARCHAR(7) DEFAULT '#6366f1',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await db.query(`
      INSERT IGNORE INTO categories (id, name, color) VALUES
      (1, 'Work',     '#ef4444'),
      (2, 'Personal', '#3b82f6'),
      (3, 'Study',    '#8b5cf6'),
      (4, 'Health',   '#10b981'),
      (5, 'Finance',  '#f59e0b'),
      (6, 'Other',    '#6b7280')
    `);

    // ---------- TABLE 6: tasks ----------
    await db.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        category_id INT DEFAULT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        priority VARCHAR(10) DEFAULT 'medium',
        difficulty VARCHAR(20) DEFAULT 'normal',
        availability VARCHAR(20) DEFAULT 'flexible',
        status VARCHAR(10) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      )
    `);

    // ---------- TABLE 7: notes (Feature 8) ----------
    await db.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        is_pinned TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // ---------- TABLE 8: calendar_events (Features 9-10) ----------
    await db.query(`
      CREATE TABLE IF NOT EXISTS calendar_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        location VARCHAR(255),
        start_time DATETIME NOT NULL,
        end_time DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // ---------- TABLE 9: reminders (Features 11, 13) ----------
    await db.query(`
      CREATE TABLE IF NOT EXISTS reminders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        due_at DATETIME NOT NULL,
        notified_at DATETIME DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // ---------- TABLE 10: alarms (Features 12-13) ----------
    await db.query(`
      CREATE TABLE IF NOT EXISTS alarms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        frequency VARCHAR(20) NOT NULL DEFAULT 'daily',
        days_of_week VARCHAR(64),
        time_of_day TIME NOT NULL,
        is_enabled TINYINT(1) DEFAULT 1,
        last_triggered_at DATETIME DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // ---------- TABLE 11: subjects (Feature 14) ----------
    await db.query(`
      CREATE TABLE IF NOT EXISTS subjects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(64),
        instructor VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // ---------- TABLE 12: assignments (Feature 15) ----------
    await db.query(`
      CREATE TABLE IF NOT EXISTS assignments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        subject_id INT DEFAULT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        due_date DATETIME NOT NULL,
        priority VARCHAR(10) DEFAULT 'medium',
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
      )
    `);

    // ---------- TABLE 13: examinations (Feature 16) ----------
    await db.query(`
      CREATE TABLE IF NOT EXISTS examinations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        subject_id INT DEFAULT NULL,
        title VARCHAR(255) NOT NULL,
        exam_date DATETIME NOT NULL,
        location VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
      )
    `);

    // ---------- TABLE 14: study_sessions (Feature 17) ----------
    await db.query(`
      CREATE TABLE IF NOT EXISTS study_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        subject_id INT DEFAULT NULL,
        title VARCHAR(255) NOT NULL,
        session_date DATETIME NOT NULL,
        duration_minutes INT DEFAULT 60,
        status VARCHAR(20) DEFAULT 'planned',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL
      )
    `);

    // ---------- TABLE 15: sleep_logs (Feature 18) ----------
    await db.query(`
      CREATE TABLE IF NOT EXISTS sleep_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        sleep_date DATE NOT NULL,
        bedtime TIME NOT NULL,
        wake_time TIME NOT NULL,
        duration_minutes INT NOT NULL,
        quality VARCHAR(20) DEFAULT 'okay',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // ---------- TABLE 16: water_logs (Feature 19) ----------
    await db.query(`
      CREATE TABLE IF NOT EXISTS water_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        log_date DATE NOT NULL,
        amount_ml INT NOT NULL,
        logged_at TIME DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // ---------- TABLE 17: exercise_logs (Feature 20) ----------
    await db.query(`
      CREATE TABLE IF NOT EXISTS exercise_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        log_date DATE NOT NULL,
        activity_type VARCHAR(100) NOT NULL,
        duration_minutes INT NOT NULL,
        intensity VARCHAR(20) DEFAULT 'moderate',
        calories_burned INT DEFAULT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // ---------- TABLE 18: mood_logs (Feature 21) ----------
    await db.query(`
      CREATE TABLE IF NOT EXISTS mood_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        log_date DATE NOT NULL,
        mood VARCHAR(20) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // ---------- TABLE 19: medications (Feature 22) ----------
    await db.query(`
      CREATE TABLE IF NOT EXISTS medications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        medication_name VARCHAR(255) NOT NULL,
        dosage VARCHAR(100),
        frequency VARCHAR(20) NOT NULL DEFAULT 'daily',
        days_of_week VARCHAR(64),
        time_of_day TIME NOT NULL,
        notes TEXT,
        is_enabled TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // ---------- TABLE 20: habits (Feature 23) ----------
    await db.query(`
      CREATE TABLE IF NOT EXISTS habits (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        frequency VARCHAR(20) NOT NULL DEFAULT 'daily',
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // ---------- TABLE 21: habit_logs (Feature 24) ----------
    await db.query(`
      CREATE TABLE IF NOT EXISTS habit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        habit_id INT NOT NULL,
        user_id INT NOT NULL,
        log_date DATE NOT NULL,
        completed TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_habit_date (habit_id, log_date),
        FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // ---------- TABLE 22: screen_time_logs (Features 25, 27) ----------
    await db.query(`
      CREATE TABLE IF NOT EXISTS screen_time_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        log_date DATE NOT NULL,
        activity_name VARCHAR(150) NOT NULL,
        minutes INT NOT NULL,
        category VARCHAR(20) NOT NULL DEFAULT 'non_productive',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // ---------- TABLE 23: social_media_logs (Feature 26) ----------
    await db.query(`
      CREATE TABLE IF NOT EXISTS social_media_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        log_date DATE NOT NULL,
        platform VARCHAR(100) NOT NULL,
        minutes INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // ---------- TABLE 24: expenses (Feature 28) ----------
    await db.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        type VARCHAR(10) NOT NULL DEFAULT 'expense',
        category VARCHAR(100) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        description VARCHAR(255),
        expense_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // ---------- TABLE 25: goals (Feature 30) ----------
    await db.query(`
      CREATE TABLE IF NOT EXISTS goals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        target_date DATE,
        progress_percent INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // ---------- TABLE 26: savings_goals (Feature 29) ----------
    await db.query(`
      CREATE TABLE IF NOT EXISTS savings_goals (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        target_amount DECIMAL(10,2) NOT NULL,
        target_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // ---------- TABLE 27: savings_contributions (Feature 29) ----------
    await db.query(`
      CREATE TABLE IF NOT EXISTS savings_contributions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        goal_id INT NOT NULL,
        user_id INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        contributed_on DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (goal_id) REFERENCES savings_goals(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // ---------- TABLE 28: journal_entries (Feature 31) ----------
    await db.query(`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        entry_date DATE NOT NULL,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        mood_tag VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log('[DB] All 28 tables created and seeded successfully.');
  } catch (err) {
    console.error('[DB] Initialization error ->', err.message);
  }
}

// ============================================================
// Start Server
// ============================================================
// initDB() is idempotent (CREATE TABLE IF NOT EXISTS / INSERT IGNORE), so it is
// safe to run once per process — both for a long-running local/XAMPP server and
// for a Vercel serverless cold start.
initDB().catch(err => console.error('[DB] Startup init failed ->', err.message));

// Only bind to a port when run directly (`node server.js` / XAMPP + local dev).
// On Vercel the exported `app` is wrapped as a serverless function instead —
// calling app.listen() there would conflict with the platform's own HTTP handling.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[ALMS] Server running -> http://localhost:${PORT}`);
  });
}

module.exports = app;
