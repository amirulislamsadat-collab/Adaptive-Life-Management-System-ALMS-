// ============================================================
// Controller: Module — handles module settings & toggle
// ============================================================
const Module        = require('../models/Module');
const Assignment     = require('../models/Assignment');
const Examination    = require('../models/Examination');
const StudySession   = require('../models/StudySession');
const WaterLog       = require('../models/WaterLog');
const MoodLog        = require('../models/MoodLog');
const SleepLog       = require('../models/SleepLog');
const ExerciseLog    = require('../models/ExerciseLog');
const Medication     = require('../models/Medication');
const ScreenTimeLog  = require('../models/ScreenTimeLog');
const SocialMediaLog = require('../models/SocialMediaLog');
const Expense        = require('../models/Expense');

exports.getSettings = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const modules = await Module.findAllWithUserStatus(req.session.user.id);
    res.render('module-settings', { user: req.session.user, modules });
  } catch (err) {
    console.error('Settings error:', err);
    res.status(500).send('An error occurred while loading the module settings. Please try again.');
  }
};

exports.toggleModule = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const userId = req.session.user.id;
  const moduleId = req.params.id;
  try {
    const existing = await Module.findUserModule(userId, moduleId);
    if (existing) {
      await Module.toggleUserModule(userId, moduleId, existing.is_enabled);
    } else {
      await Module.enableForUser(userId, moduleId);
    }
    res.redirect('/modules/settings');
  } catch (err) {
    console.error('Toggle module error:', err);
    req.session.error = 'Failed to update module.';
    res.redirect('/modules/settings');
  }
};

exports.getModulePage = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const userId = req.session.user.id;
  try {
    const mod = await Module.findBySlug(req.params.slug);
    if (!mod) {
      req.session.error = 'Module not found.';
      return res.redirect('/dashboard');
    }

    if (mod.slug === 'study') {
      const [assignmentStats, upcomingExams, sessionStats] = await Promise.all([
        Assignment.getStats(userId),
        Examination.findUpcomingByUser(userId, 3),
        StudySession.getStats(userId)
      ]);
      return res.render('study-hub', { user: req.session.user, module: mod, assignmentStats, upcomingExams, sessionStats });
    }

    if (mod.slug === 'health') {
      const [todayWater, latestMood, avgSleepMinutes, weeklyExerciseMinutes, medications] = await Promise.all([
        WaterLog.getTodayTotal(userId),
        MoodLog.findLatest(userId),
        SleepLog.getAverageMinutes(userId, 7),
        ExerciseLog.getWeeklyMinutes(userId),
        Medication.findAllByUser(userId)
      ]);
      return res.render('health-hub', { user: req.session.user, module: mod, todayWater, latestMood, avgSleepMinutes, weeklyExerciseMinutes, medicationCount: medications.length });
    }

    if (mod.slug === 'finance') {
      const summary = await Expense.getSummary(userId);
      return res.render('finance-hub', { user: req.session.user, module: mod, summary });
    }

    if (mod.slug === 'screentime') {
      const [summary, weeklyByPlatform] = await Promise.all([
        ScreenTimeLog.getSummary(userId, 7),
        SocialMediaLog.getWeeklyByPlatform(userId)
      ]);
      return res.render('digital-hub', { user: req.session.user, module: mod, summary, weeklyByPlatform });
    }

    res.render('module-page', { user: req.session.user, module: mod });
  } catch (err) {
    console.error('Module page error:', err);
    req.session.error = 'Failed to load module.';
    res.redirect('/dashboard');
  }
};
