// ============================================================
// Achievements — a badge wall on the Profile page, in the same spirit as
// the level/streak system: small, visible proof of progress that turns
// "I did the thing" into something worth celebrating. Badges are defined
// here in code (not a DB catalog table) since the list only ever changes
// by editing this file; what's tracked per-user is just which ones they've
// unlocked and when.
// ============================================================
const db = require('../config/db');

const CATALOG = [
  { key: 'first_step',     emoji: '🌱', name: 'Getting Started', desc: 'Earn your very first XP' },
  { key: 'streak_3',       emoji: '🔥', name: 'On a Roll',       desc: 'Reach a 3-day streak' },
  { key: 'streak_7',       emoji: '⚡', name: 'Week Warrior',    desc: 'Reach a 7-day streak' },
  { key: 'streak_30',      emoji: '💎', name: 'Unstoppable',     desc: 'Reach a 30-day streak' },
  { key: 'level_5',        emoji: '⭐', name: 'Rising Star',     desc: 'Reach level 5' },
  { key: 'level_10',       emoji: '👑', name: 'Legend',          desc: 'Reach level 10' },
  { key: 'task_master',    emoji: '✅', name: 'Task Master',     desc: 'Finish 25 tasks' },
  { key: 'breather',       emoji: '🌬️', name: 'First Breath',    desc: 'Complete a breathing exercise' },
  { key: 'journal_keeper', emoji: '📖', name: 'Storyteller',     desc: 'Write 5 journal entries' },
  { key: 'hydrated',       emoji: '💧', name: 'Hydration Hero',  desc: 'Log water 7 times' }
];

module.exports = {
  CATALOG,

  // Checks current stats against the catalog, records any newly-qualified
  // badges (INSERT IGNORE keeps this safe to call on every profile visit),
  // and returns the full badge list plus which ones (if any) are brand new
  // this check, so the page can show a small unlock celebration.
  checkAndUnlock: async (userId, fullUser, levelInfo) => {
    const [existingRows] = await db.query('SELECT badge_key FROM user_achievements WHERE user_id = ?', [userId]);
    const already = new Set(existingRows.map(r => r.badge_key));

    const [[taskCount]] = await db.query("SELECT COUNT(*) AS c FROM tasks WHERE user_id = ? AND status = 'done'", [userId]);
    const [[breathCount]] = await db.query('SELECT COUNT(*) AS c FROM breathing_sessions WHERE user_id = ?', [userId]);
    const [[journalCount]] = await db.query('SELECT COUNT(*) AS c FROM journal_entries WHERE user_id = ?', [userId]);
    const [[waterCount]] = await db.query('SELECT COUNT(*) AS c FROM water_logs WHERE user_id = ?', [userId]);

    const qualifies = {
      first_step:     (fullUser.xp || 0) > 0,
      streak_3:       (fullUser.longest_streak || 0) >= 3,
      streak_7:       (fullUser.longest_streak || 0) >= 7,
      streak_30:      (fullUser.longest_streak || 0) >= 30,
      level_5:        levelInfo.level >= 5,
      level_10:       levelInfo.level >= 10,
      task_master:    taskCount.c >= 25,
      breather:       breathCount.c >= 1,
      journal_keeper: journalCount.c >= 5,
      hydrated:       waterCount.c >= 7
    };

    const newlyUnlocked = [];
    for (const badge of CATALOG) {
      if (qualifies[badge.key] && !already.has(badge.key)) {
        await db.query('INSERT IGNORE INTO user_achievements (user_id, badge_key) VALUES (?, ?)', [userId, badge.key]);
        newlyUnlocked.push(badge.key);
      }
    }

    const [finalRows] = await db.query('SELECT badge_key, unlocked_at FROM user_achievements WHERE user_id = ?', [userId]);
    const unlockedMap = {};
    finalRows.forEach(r => { unlockedMap[r.badge_key] = r.unlocked_at; });

    return {
      badges: CATALOG.map(b => ({ ...b, unlocked: !!unlockedMap[b.key], unlockedAt: unlockedMap[b.key] || null })),
      newlyUnlocked
    };
  }
};
