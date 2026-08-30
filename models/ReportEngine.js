// ============================================================
// ReportEngine — Productivity Report (32), Life Balance / Life Score (33),
// and rule-based Recommendations + Explanations (34-35).
//
// Unlike every other model in this app, nothing here writes to the
// database — it only reads across the other feature tables and turns that
// into numbers and plain-English sentences. Recommendations are generated
// fresh on every visit from a small table of rules instead of being stored,
// so they always reflect the latest data.
// ============================================================
const Module         = require('./Module');
const User            = require('./User');
const HealthGuidelines = require('./HealthGuidelines');
const Task            = require('./Task');
const Assignment       = require('./Assignment');
const StudySession     = require('./StudySession');
const SleepLog          = require('./SleepLog');
const WaterLog           = require('./WaterLog');
const ExerciseLog        = require('./ExerciseLog');
const MoodLog             = require('./MoodLog');
const Habit                = require('./Habit');
const ScreenTimeLog          = require('./ScreenTimeLog');
const Expense                 = require('./Expense');
const JournalEntry              = require('./JournalEntry');

const WATER_DAILY_GOAL_ML = 2000;
const MOOD_SCORES = { great: 100, good: 80, okay: 60, low: 40, bad: 20 };
const STRESS_KEYWORDS = ['tired', 'stressed', 'anxious', 'overwhelmed'];

function daysSince(dateStr) {
  const then = new Date(dateStr);
  const now = new Date();
  const a = new Date(then.getFullYear(), then.getMonth(), then.getDate());
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((b - a) / 86400000);
}

async function enabledSlugSet(userId) {
  const enabled = await Module.findEnabledForUser(userId);
  return new Set(enabled.map(m => m.slug));
}

// ------------------------------------------------------------
// Feature 32 — Productivity Report
// ------------------------------------------------------------
async function getProductivityReport(userId) {
  const [taskStats, assignmentStats, sessionStats, habits, screenSummary] = await Promise.all([
    Task.getStats(userId),
    Assignment.getStats(userId),
    StudySession.getStats(userId),
    Habit.findAllByUserWithStats(userId),
    ScreenTimeLog.getSummary(userId, 7)
  ]);

  const taskCompletionRate = taskStats.total ? Math.round((taskStats.completed / taskStats.total) * 100) : null;
  const assignmentCompletionRate = assignmentStats.total ? Math.round((assignmentStats.completed / assignmentStats.total) * 100) : null;
  const sessionCompletionRate = sessionStats.total ? Math.round((sessionStats.completed / sessionStats.total) * 100) : null;

  let habitConsistency = null;
  if (habits.length) {
    const checkedInToday = habits.filter(h => h.checkedInToday).length;
    habitConsistency = Math.round((checkedInToday / habits.length) * 100);
  }

  const insights = [];
  if (taskCompletionRate !== null) {
    insights.push(taskCompletionRate >= 70
      ? `Solid task completion rate — ${taskCompletionRate}% of your tasks are done.`
      : `Only ${taskCompletionRate}% of your tasks are complete so far — worth a push.`);
  }
  if (assignmentStats.overdue > 0) {
    insights.push(`You have ${assignmentStats.overdue} overdue assignment${assignmentStats.overdue === 1 ? '' : 's'}.`);
  }
  if (sessionStats.total_minutes > 0) {
    insights.push(`You've logged ${Math.floor(sessionStats.total_minutes / 60)}h ${sessionStats.total_minutes % 60}m of completed study time.`);
  }
  if (screenSummary.totalMinutes > 0) {
    insights.push(`${screenSummary.productivePct}% of your recorded screen time this week was productive.`);
  }
  if (!insights.length) {
    insights.push('Not enough activity logged yet to generate insights — start tracking tasks, study, or screen time.');
  }

  return {
    taskCompletionRate,
    assignmentCompletionRate,
    sessionCompletionRate,
    habitConsistency,
    productiveScreenPct: screenSummary.totalMinutes > 0 ? screenSummary.productivePct : null,
    insights
  };
}

// ------------------------------------------------------------
// Feature 33 — Life Balance Report (Life Score)
// ------------------------------------------------------------
async function getLifeScore(userId) {
  const enabledSlugs = await enabledSlugSet(userId);
  const fullUser = await User.findById(userId);
  const waterGoal = (fullUser && fullUser.daily_water_goal_ml) || WATER_DAILY_GOAL_ML;
  const sleepTarget = HealthGuidelines.sleepRangeForAge(fullUser && fullUser.age).max;
  const exerciseTarget = HealthGuidelines.exerciseWeeklyTarget(fullUser && fullUser.activity_level);
  const components = [];

  if (enabledSlugs.has('tasks')) {
    const stats = await Task.getStats(userId);
    if (stats.total > 0) {
      components.push({ label: 'Tasks', score: Math.round((stats.completed / stats.total) * 100) });
    }
  }

  if (enabledSlugs.has('study')) {
    const [assignmentStats, sessionStats] = await Promise.all([Assignment.getStats(userId), StudySession.getStats(userId)]);
    const rates = [];
    if (assignmentStats.total) rates.push((assignmentStats.completed / assignmentStats.total) * 100);
    if (sessionStats.total) rates.push((sessionStats.completed / sessionStats.total) * 100);
    if (rates.length) components.push({ label: 'Study', score: Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) });
  }

  if (enabledSlugs.has('health')) {
    const [avgSleep, todayWater, weeklyExercise, latestMood] = await Promise.all([
      SleepLog.getAverageMinutes(userId, 7),
      WaterLog.getTodayTotal(userId),
      ExerciseLog.getWeeklyMinutes(userId),
      MoodLog.findLatest(userId)
    ]);
    const healthScores = [];
    if (avgSleep > 0) healthScores.push(Math.min(100, (avgSleep / sleepTarget) * 100));
    if (todayWater > 0) healthScores.push(Math.min(100, (todayWater / waterGoal) * 100));
    if (weeklyExercise > 0) healthScores.push(Math.min(100, (weeklyExercise / exerciseTarget) * 100));
    if (latestMood) healthScores.push(MOOD_SCORES[latestMood.mood] || 60);
    if (healthScores.length) components.push({ label: 'Health & Wellness', score: Math.round(healthScores.reduce((a, b) => a + b, 0) / healthScores.length) });
  }

  if (enabledSlugs.has('habits')) {
    const habits = await Habit.findAllByUserWithStats(userId);
    if (habits.length) {
      const ratios = habits.map(h => (h.longestStreak > 0 ? h.currentStreak / h.longestStreak : (h.currentStreak > 0 ? 1 : 0)));
      const avgRatio = ratios.reduce((a, b) => a + b, 0) / ratios.length;
      components.push({ label: 'Habits', score: Math.round(avgRatio * 100) });
    }
  }

  if (enabledSlugs.has('screentime')) {
    const summary = await ScreenTimeLog.getSummary(userId, 7);
    if (summary.totalMinutes > 0) components.push({ label: 'Digital Wellbeing', score: summary.productivePct });
  }

  if (enabledSlugs.has('finance')) {
    const summary = await Expense.getSummary(userId);
    if (summary.totalIncome > 0 || summary.totalExpense > 0) {
      const financeScore = summary.balance >= 0 ? 100 : Math.max(0, 100 + (summary.balance / Math.max(summary.totalIncome, 1)) * 100);
      components.push({ label: 'Finance', score: Math.round(financeScore) });
    }
  }

  const overall = components.length
    ? Math.round(components.reduce((sum, c) => sum + c.score, 0) / components.length)
    : null;

  return { overall, components };
}

// ------------------------------------------------------------
// Features 34-35 — Personalized Recommendations + Explanations
// Each rule is (data) => a recommendation object, or null if it doesn't apply.
// ------------------------------------------------------------
async function getRecommendations(userId) {
  const enabledSlugs = await enabledSlugSet(userId);
  const fullUser = await User.findById(userId);
  const waterGoal = (fullUser && fullUser.daily_water_goal_ml) || WATER_DAILY_GOAL_ML;
  const sleepRange = HealthGuidelines.sleepRangeForAge(fullUser && fullUser.age);
  const exerciseTarget = HealthGuidelines.exerciseWeeklyTarget(fullUser && fullUser.activity_level);
  const recommendations = [];

  if (enabledSlugs.has('health')) {
    const avgSleep = await SleepLog.getAverageMinutes(userId, 7);
    if (avgSleep > 0 && avgSleep < sleepRange.min) {
      recommendations.push({
        icon: 'fa-bed',
        message: 'Try to get a bit more sleep.',
        reason: `Your 7-day average is ${(avgSleep / 60).toFixed(1)}h, below your recommended ${Math.round(sleepRange.min/60)}-${Math.round(sleepRange.max/60)} hours.`
      });
    }

    const todayWater = await WaterLog.getTodayTotal(userId);
    const hour = new Date().getHours();
    if (hour >= 15 && todayWater < waterGoal * 0.5) {
      recommendations.push({
        icon: 'fa-tint',
        message: 'Drink more water today.',
        reason: `You've had ${todayWater} ml so far — less than half of your ${waterGoal} ml goal, and it's already afternoon.`
      });
    }

    const weeklyExercise = await ExerciseLog.getWeeklyMinutes(userId);
    if (weeklyExercise < exerciseTarget) {
      recommendations.push({
        icon: 'fa-running',
        message: 'Fit in a bit more physical activity this week.',
        reason: `You've logged ${weeklyExercise} minutes of exercise in the last 7 days, under your ${exerciseTarget}-minute weekly target.`
      });
    }

    const recentMoods = await MoodLog.findAllByUser(userId);
    const lastThree = recentMoods.slice(0, 3);
    if (lastThree.length >= 2 && lastThree.every(m => m.mood === 'low' || m.mood === 'bad')) {
      recommendations.push({
        icon: 'fa-heart',
        message: 'Consider taking some time for yourself.',
        reason: `Your last ${lastThree.length} mood check-ins have all been on the lower end.`
      });
    }
  }

  if (enabledSlugs.has('habits')) {
    const habits = await Habit.findAllByUserWithStats(userId);
    const stalled = habits.filter(h => h.currentStreak === 0 && h.totalCheckIns > 0);
    if (stalled.length) {
      recommendations.push({
        icon: 'fa-fire',
        message: `Get back on track with "${stalled[0].name}".`,
        reason: `This habit has a broken streak right now (best streak so far: ${stalled[0].longestStreak} day${stalled[0].longestStreak === 1 ? '' : 's'}).`
      });
    }
  }

  if (enabledSlugs.has('study')) {
    const assignmentStats = await Assignment.getStats(userId);
    if (assignmentStats.overdue > 0) {
      recommendations.push({
        icon: 'fa-file-signature',
        message: 'Focus on your overdue assignments first.',
        reason: `You currently have ${assignmentStats.overdue} assignment${assignmentStats.overdue === 1 ? '' : 's'} past its due date.`
      });
    }
  }

  if (enabledSlugs.has('screentime')) {
    const summary = await ScreenTimeLog.getSummary(userId, 7);
    if (summary.totalMinutes > 0 && summary.nonProductivePct > 60) {
      recommendations.push({
        icon: 'fa-mobile-alt',
        message: 'Try cutting back on non-productive screen time.',
        reason: `${summary.nonProductivePct}% of your recorded screen time this week was non-productive.`
      });
    }
  }

  if (enabledSlugs.has('finance')) {
    const summary = await Expense.getSummary(userId);
    if (summary.balance < 0) {
      recommendations.push({
        icon: 'fa-wallet',
        message: 'Your expenses have outpaced your income.',
        reason: `Your recorded balance is -$${Math.abs(summary.balance).toFixed(2)}.`
      });
    }
  }

  if (enabledSlugs.has('tasks')) {
    const stats = await Task.getStats(userId);
    if (stats.high_priority > 0) {
      recommendations.push({
        icon: 'fa-exclamation-circle',
        message: 'Clear your high-priority tasks first.',
        reason: `You have ${stats.high_priority} pending high-priority task${stats.high_priority === 1 ? '' : 's'}.`,
        actionLabel: 'View tasks', actionHref: '/tasks/view'
      });
    }
  }

  // ---- Cross-module insights: rules that combine two unrelated modules ----

  if (enabledSlugs.has('health') && enabledSlugs.has('tasks')) {
    const [avgSleep, taskStats] = await Promise.all([SleepLog.getAverageMinutes(userId, 7), Task.getStats(userId)]);
    const completionRate = taskStats.total ? (taskStats.completed / taskStats.total) * 100 : null;
    if (avgSleep > 0 && avgSleep < sleepRange.min && completionRate !== null && completionRate < 60) {
      recommendations.push({
        icon: 'fa-bed',
        message: 'Short sleep may be dragging down your task completion.',
        reason: `Your 7-day average sleep is ${(avgSleep / 60).toFixed(1)}h and only ${Math.round(completionRate)}% of tasks are complete — these two often move together.`,
        actionLabel: 'Log sleep', actionHref: '/sleep/new'
      });
    }
  }

  if (enabledSlugs.has('screentime') && enabledSlugs.has('health')) {
    const [screenSummary, recentMoods] = await Promise.all([ScreenTimeLog.getSummary(userId, 7), MoodLog.findAllByUser(userId)]);
    const recentMoodScores = recentMoods.slice(0, 5).map(m => MOOD_SCORES[m.mood] || 60);
    const avgMoodScore = recentMoodScores.length ? recentMoodScores.reduce((a, b) => a + b, 0) / recentMoodScores.length : null;
    if (screenSummary.totalMinutes > 300 && avgMoodScore !== null && avgMoodScore < 60) {
      recommendations.push({
        icon: 'fa-mobile-alt',
        message: 'High screen time and lower mood have shown up together this week.',
        reason: `${Math.round(screenSummary.totalMinutes / 60)}h of screen time in 7 days alongside a below-average mood trend — worth a deliberate break.`,
        actionLabel: 'Try a breathing exercise', actionHref: '/breathe'
      });
    }
  }

  if (enabledSlugs.has('habits')) {
    const habits = await Habit.findAllByUserWithStats(userId);
    const strong = habits.filter(h => h.currentStreak > 7).sort((a, b) => b.currentStreak - a.currentStreak)[0];
    if (strong) {
      recommendations.push({
        icon: 'fa-trophy',
        message: `🎉 ${strong.currentStreak}-day streak on "${strong.name}" — great consistency!`,
        reason: `Keep it going — you're well past the first-week mark, which is usually the hardest part.`
      });
    }
  }

  if (enabledSlugs.has('health')) {
    const exerciseLogs = await ExerciseLog.findAllByUser(userId);
    const daysSinceLastExercise = exerciseLogs.length ? daysSince(exerciseLogs[0].log_date) : null;
    if (daysSinceLastExercise === null || daysSinceLastExercise >= 3) {
      recommendations.push({
        icon: 'fa-running',
        message: "It's been a few days since you moved — a short walk counts.",
        reason: daysSinceLastExercise === null ? "No exercise logged yet." : `Last exercise logged ${daysSinceLastExercise} days ago.`,
        actionLabel: 'Log exercise', actionHref: '/exercise/new'
      });
    }

    const recentWaterLogs = await WaterLog.findAllByUser(userId);
    const last5Dates = [...new Set(recentWaterLogs.map(w => new Date(w.log_date).toDateString()))].slice(0, 5);
    if (last5Dates.length >= 3) {
      const totalsByDay = last5Dates.map(d => recentWaterLogs.filter(w => new Date(w.log_date).toDateString() === d).reduce((s, w) => s + w.amount_ml, 0));
      const avgDaily = totalsByDay.reduce((a, b) => a + b, 0) / totalsByDay.length;
      if (avgDaily < waterGoal * 0.7) {
        recommendations.push({
          icon: 'fa-tint',
          message: "You've been consistently under your water goal.",
          reason: `Averaging ${Math.round(avgDaily)} ml/day over your last ${totalsByDay.length} logged days, below your ${waterGoal} ml goal.`,
          actionLabel: 'Log water', actionHref: '/water/new'
        });
      }
    }
  }

  if (enabledSlugs.has('journal')) {
    const entries = await JournalEntry.findAllByUser(userId);
    const last5 = entries.slice(0, 5);
    const hasStressSignal = last5.some(e => STRESS_KEYWORDS.some(k => (e.content || '').toLowerCase().includes(k)));
    if (hasStressSignal) {
      recommendations.push({
        icon: 'fa-heart',
        message: 'Your recent journal entries mention feeling stressed or overwhelmed.',
        reason: 'A few of your last entries used words like "tired," "stressed," or "overwhelmed" — might be worth a check-in with yourself, or someone you trust.',
        actionLabel: enabledSlugs.has('health') ? 'Try a breathing exercise' : 'Log mood',
        actionHref: enabledSlugs.has('health') ? '/breathe' : '/journal/new'
      });
    }
  }

  return recommendations.slice(0, 8);
}

module.exports = { getProductivityReport, getLifeScore, getRecommendations };
