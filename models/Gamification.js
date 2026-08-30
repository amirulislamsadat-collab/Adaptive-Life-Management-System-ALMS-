// ============================================================
// Model: Gamification — XP and levels.
// A flat 100 XP per level (level = floor(xp/100)+1) keeps the math easy to
// reason about and easy to show progress for ("60/100 XP to level 5").
// ============================================================
const db = require('../config/db');

const XP_PER_LEVEL = 100;

const LEVEL_TITLES = [
  'Newcomer', 'Getting Started', 'Building Habits', 'Consistent', 'Disciplined',
  'Focused', 'Productive', 'Highly Organized', 'Master of Routine', 'ALMS Legend'
];

function levelTitle(level) {
  return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];
}

const Gamification = {
  awardXp: async (userId, amount) => {
    await db.query('UPDATE users SET xp = xp + ? WHERE id = ?', [amount, userId]);
  },

  getLevelInfo: (xp) => {
    const totalXp = xp || 0;
    const level = Math.floor(totalXp / XP_PER_LEVEL) + 1;
    const xpIntoLevel = totalXp % XP_PER_LEVEL;
    return {
      xp: totalXp,
      level,
      title: levelTitle(level),
      xpIntoLevel,
      xpForNextLevel: XP_PER_LEVEL,
      progressPercent: Math.round((xpIntoLevel / XP_PER_LEVEL) * 100)
    };
  }
};

module.exports = Gamification;
