// ============================================================
// DailyQuote — a small rotating line on the dashboard, same idea as
// Duolingo's daily nudge. One per calendar day (stable all day, changes
// at midnight), picked deterministically so no DB storage is needed.
// ============================================================
const QUOTES = [
  "Small stuff done today beats a perfect plan you never start.",
  "You don't need to feel motivated to start. Starting is what makes the motivation show up.",
  "One task. Just one. The rest can wait.",
  "Nobody's checking your streak but you, so keep it for you, not for show.",
  "Rest counts as progress too. Don't skip it out of guilt.",
  "Future you is going to be so glad present you didn't put this off.",
  "Bad days don't erase good weeks. Keep going.",
  "You've survived 100% of your hard days so far. Solid record.",
  "Done is better than perfect, every single time.",
  "The goal isn't to do everything today. It's to not do nothing.",
  "Progress is quiet most days. That's fine, quiet still counts.",
  "You're allowed to have an easy day. It's still a day you showed up.",
  "The smallest version of the habit still keeps the streak alive.",
  "Comparing today to yesterday is more useful than comparing it to your best day ever.",
  "It doesn't have to feel good to be worth doing.",
  "Tidy the one thing in front of you. The rest sorts itself out after.",
  "You're not behind. You're just where you are, which is a fine place to start from.",
  "A five-minute version of the task beats a zero-minute version every time.",
  "Nobody builds a habit by being perfect at it. They build it by not quitting after a bad day.",
  "Whatever you get done today is more than nothing. That's the bar.",
  "Your future self is reading this from a slightly better place because of what you do next.",
  "Slow progress is still the kind that adds up.",
  "You get to decide what today counts as a win.",
  "Consistency beats intensity almost every time."
];

module.exports = {
  today: () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now - start) / 86400000);
    return QUOTES[dayOfYear % QUOTES.length];
  }
};
