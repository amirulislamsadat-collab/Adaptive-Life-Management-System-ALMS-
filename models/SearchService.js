// ============================================================
// SearchService — powers the Ctrl+K command palette's real search across
// everything a user has actually created (tasks, notes, alarms,
// reminders, habits, goals, journal entries, calendar events), not just
// the static list of module/nav links. Each content type is only
// searched if its module is enabled, matching how every other feature in
// this app respects module gating.
// ============================================================
const db = require('../config/db');

// One entry per searchable content type: which module gates it, the
// table/column to search, the icon to show, and how to build its edit URL.
const SOURCES = [
  { slug: 'tasks',    table: 'tasks',            titleCol: 'title', url: id => `/tasks/edit/${id}`,    icon: 'fa-tasks',        label: 'Task' },
  { slug: 'notes',    table: 'notes',            titleCol: 'title', url: id => `/notes/edit/${id}`,    icon: 'fa-sticky-note',  label: 'Note' },
  { slug: 'alarms',   table: 'alarms',           titleCol: 'title', url: id => `/alarms/edit/${id}`,   icon: 'fa-bell',         label: 'Alarm' },
  { slug: 'reminders',table: 'reminders',        titleCol: 'title', url: id => `/reminders/edit/${id}`,icon: 'fa-clock',        label: 'Reminder' },
  { slug: 'habits',   table: 'habits',           titleCol: 'name',  url: id => `/habits/edit/${id}`,   icon: 'fa-fire',         label: 'Habit' },
  { slug: 'goals',    table: 'goals',            titleCol: 'title', url: id => `/goals/edit/${id}`,    icon: 'fa-bullseye',     label: 'Goal' },
  { slug: 'journal',  table: 'journal_entries',  titleCol: 'title', url: id => `/journal/edit/${id}`,  icon: 'fa-pen',          label: 'Journal' },
  { slug: 'calendar', table: 'calendar_events',  titleCol: 'title', url: id => `/calendar/edit/${id}`, icon: 'fa-calendar-alt', label: 'Event' }
];

module.exports = {
  // Returns up to `limit` results across every enabled content type,
  // ranked so a title that starts with the query beats one that merely
  // contains it, then by most recently created.
  searchAll: async (userId, query, enabledSlugs, limit = 4) => {
    const like = `%${query}%`;
    const startsWith = `${query}%`;
    const applicable = SOURCES.filter(s => enabledSlugs.includes(s.slug));

    const perSourceResults = await Promise.all(applicable.map(async (src) => {
      const [rows] = await db.query(
        `SELECT id, ${src.titleCol} AS title, created_at,
                (${src.titleCol} LIKE ?) AS starts_with
         FROM ${src.table}
         WHERE user_id = ? AND ${src.titleCol} LIKE ?
         ORDER BY starts_with DESC, created_at DESC
         LIMIT ?`,
        [startsWith, userId, like, limit]
      );
      return rows.map(r => ({
        type: src.label,
        icon: src.icon,
        title: r.title,
        url: src.url(r.id),
        startsWith: !!r.starts_with,
        createdAt: r.created_at
      }));
    }));

    return perSourceResults
      .flat()
      .sort((a, b) => {
        if (a.startsWith !== b.startsWith) return a.startsWith ? -1 : 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      })
      .slice(0, limit);
  }
};
