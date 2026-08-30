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
const SavingsGoal    = require('../models/SavingsGoal');
const ReportEngine   = require('../models/ReportEngine');

exports.getSettings = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const modules = await Module.findAllWithUserStatus(req.session.user.id);
    res.render('settings', { user: req.session.user, modules });
  } catch (err) {
    console.error('Settings error:', err);
    res.status(500).send('An error occurred while loading settings. Please try again.');
  }
};

exports.toggleModule = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const userId = req.session.user.id;
  const moduleId = req.params.id;
  try {
    const mod = await Module.findById(moduleId);
    const existing = await Module.findUserModule(userId, moduleId);
    const wasEnabled = existing ? !!existing.is_enabled : false;
    if (existing) {
      await Module.toggleUserModule(userId, moduleId, existing.is_enabled);
    } else {
      await Module.enableForUser(userId, moduleId);
    }
    const name = mod ? mod.name : 'Module';
    req.session.success = wasEnabled ? `${name} disabled.` : `${name} enabled!`;
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

    const enabledModules = await Module.findEnabledForUser(userId);
    const isEnabled = enabledModules.some(m => m.slug === mod.slug);
    if (!isEnabled) {
      req.session.error = 'That module is currently disabled. Enable it in Settings to use this feature.';
      return res.redirect('/modules/settings');
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
      const [summary, savingsGoals] = await Promise.all([
        Expense.getSummary(userId),
        SavingsGoal.findAllByUser(userId)
      ]);
      return res.render('finance-hub', { user: req.session.user, module: mod, summary, savingsGoals });
    }

    if (mod.slug === 'screentime') {
      const [summary, weeklyByPlatform] = await Promise.all([
        ScreenTimeLog.getSummary(userId, 7),
        SocialMediaLog.getWeeklyByPlatform(userId)
      ]);
      return res.render('digital-hub', { user: req.session.user, module: mod, summary, weeklyByPlatform });
    }

    if (mod.slug === 'reports') {
      const [productivity, lifeScore, recommendations] = await Promise.all([
        ReportEngine.getProductivityReport(userId),
        ReportEngine.getLifeScore(userId),
        ReportEngine.getRecommendations(userId)
      ]);
      return res.render('reports-hub', { user: req.session.user, module: mod, productivity, lifeScore, recommendations });
    }

    req.session.error = 'That module does not have a page yet.';
    res.redirect('/dashboard');
  } catch (err) {
    console.error('Module page error:', err);
    req.session.error = 'Failed to load module.';
    res.redirect('/dashboard');
  }
};
