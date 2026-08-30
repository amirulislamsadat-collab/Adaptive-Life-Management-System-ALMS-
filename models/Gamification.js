// ============================================================
// Model: Gamification — XP and levels.
// Cumulative XP thresholds (not a flat amount per level) so early levels
// come quickly and later ones take real sustained use to reach.
// ============================================================
const db = require('../config/db');

const LEVELS = [
  { level: 1,  xp: 0,    title: 'Getting Started' },
  { level: 2,  xp: 100,  title: 'Building Habits' },
  { level: 3,  xp: 300,  title: 'Finding Rhythm' },
  { level: 4,  xp: 600,  title: 'On Track' },
  { level: 5,  xp: 1000, title: 'Focused Scholar' },
  { level: 6,  xp: 1500, title: 'Life Architect' },
  { level: 7,  xp: 2200, title: 'Wellness Warrior' },
  { level: 8,  xp: 3000, title: 'Peak Performer' },
  { level: 9,  xp: 4000, title: 'Life Master' },
  { level: 10, xp: 5500, title: 'ALMS Legend' }
];
const LEVEL_10_STEP = 1500; // XP needed per level past 10, all still titled "ALMS Legend"

function levelForXp(totalXp) {
  if (totalXp >= LEVELS[LEVELS.length - 1].xp) {
    const last = LEVELS[LEVELS.length - 1];
    const extraLevels = Math.floor((totalXp - last.xp) / LEVEL_10_STEP);
    const level = last.level + extraLevels;
    const xpAtLevel = last.xp + extraLevels * LEVEL_10_STEP;
    const xpForNext = LEVEL_10_STEP;
    return { level, title: last.title, xpIntoLevel: totalXp - xpAtLevel, xpForNextLevel: xpForNext };
  }
  let current = LEVELS[0];
  let next = LEVELS[1];
  for (let i = 0; i < LEVELS.length - 1; i++) {
    if (totalXp >= LEVELS[i].xp && totalXp < LEVELS[i + 1].xp) {
      current = LEVELS[i];
      next = LEVELS[i + 1];
      break;
    }
  }
  return {
    level: current.level,
    title: current.title,
    xpIntoLevel: totalXp - current.xp,
    xpForNextLevel: next.xp - current.xp
  };
}

const PRIORITY_MULTIPLIER = { low: 1, medium: 1.5, high: 2 };
const STREAK_MILESTONES = [3, 7, 14, 30, 50, 100, 200, 365];

function toDateOnly(d) {
  const dt = new Date(d);
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
}

const Gamification = {
  PRIORITY_MULTIPLIER,
  STREAK_MILESTONES,

  // A ready-to-append suffix for level-ups and streak milestones, so
  // every controller doesn't hand-write its own copy of this sentence.
  // Empty string when neither happened, so callers can always just do
  // `baseMessage + Gamification.bonusSuffix(result)`.
  bonusSuffix: (result) => {
    var parts = [];
    if (result.streakMilestone) parts.push(`🔥 ${result.currentStreak} days in a row now!`);
    if (result.leveledUp) parts.push(`🎉 Level up! You just hit Level ${result.newLevel}: ${result.newTitle}!`);
    return parts.length ? ' ' + parts.join(' ') : '';
  },

  // Any XP-earning action counts as "active today" for the daily streak
  // (Duolingo-style: do *something* meaningful once a day to keep it
  // alive), so streak bookkeeping lives here rather than being called
  // separately from every controller.
  //
  // Returns { newXp, leveledUp, newLevel, newTitle, currentStreak,
  // longestStreak, streakExtended, streakMilestone } so a caller can flash
  // a level-up and/or streak message inline with the action's own message.
  awardXp: async (userId, amount) => {
    const [[before]] = await db.query(
      'SELECT xp, current_streak, longest_streak, last_active_date FROM users WHERE id = ?',
      [userId]
    );
    const beforeXp = (before && before.xp) || 0;
    const afterXp = beforeXp + Math.round(amount);

    const today = toDateOnly(new Date());
    const lastActive = before && before.last_active_date ? toDateOnly(before.last_active_date) : null;
    const gapDays = lastActive ? Math.round((today - lastActive) / 86400000) : null;

    let currentStreak = (before && before.current_streak) || 0;
    let streakExtended = false;
    if (gapDays === 0) {
      // Already counted today — no change.
    } else if (gapDays === 1) {
      currentStreak += 1;
      streakExtended = true;
    } else {
      currentStreak = 1;
      streakExtended = true;
    }
    const longestStreak = Math.max((before && before.longest_streak) || 0, currentStreak);

    await db.query(
      'UPDATE users SET xp = ?, current_streak = ?, longest_streak = ?, last_active_date = CURDATE() WHERE id = ?',
      [afterXp, currentStreak, longestStreak, userId]
    );

    const beforeLevel = levelForXp(beforeXp).level;
    const afterInfo = levelForXp(afterXp);
    return {
      newXp: afterXp,
      leveledUp: afterInfo.level > beforeLevel,
      newLevel: afterInfo.level,
      newTitle: afterInfo.title,
      currentStreak,
      longestStreak,
      streakExtended,
      streakMilestone: streakExtended && STREAK_MILESTONES.includes(currentStreak)
    };
  },

  getLevelInfo: (xp) => {
    const totalXp = xp || 0;
    const info = levelForXp(totalXp);
    return {
      xp: totalXp,
      level: info.level,
      title: info.title,
      xpIntoLevel: info.xpIntoLevel,
      xpForNextLevel: info.xpForNextLevel,
      progressPercent: info.xpForNextLevel ? Math.round((info.xpIntoLevel / info.xpForNextLevel) * 100) : 100
    };
  }
};

module.exports = Gamification;
