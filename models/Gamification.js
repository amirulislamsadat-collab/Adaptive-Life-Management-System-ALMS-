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

const Gamification = {
  PRIORITY_MULTIPLIER,

  // Returns { newXp, leveledUp, newLevel } so a caller can flash a
  // level-up message when a single award crosses a threshold.
  awardXp: async (userId, amount) => {
    const [[before]] = await db.query('SELECT xp FROM users WHERE id = ?', [userId]);
    const beforeXp = (before && before.xp) || 0;
    const afterXp = beforeXp + Math.round(amount);
    await db.query('UPDATE users SET xp = ? WHERE id = ?', [afterXp, userId]);
    const beforeLevel = levelForXp(beforeXp).level;
    const afterInfo = levelForXp(afterXp);
    return { newXp: afterXp, leveledUp: afterInfo.level > beforeLevel, newLevel: afterInfo.level, newTitle: afterInfo.title };
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
