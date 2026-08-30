// ============================================================
// Controller: Assistant — an in-app AI helper that can answer "how do I
// do X in ALMS" questions and explain what a module does. It only ever
// talks about the app; it doesn't read or write the user's actual data.
// ============================================================
const Anthropic = require('@anthropic-ai/sdk');
const AssistantMessage = require('../models/AssistantMessage');

const isConfigured = !!process.env.ANTHROPIC_API_KEY;
const client = isConfigured ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null;
const MODEL = process.env.ASSISTANT_MODEL || 'claude-sonnet-5';

const MODULE_GUIDE = `
- Tasks: create/edit/delete to-dos with priority, difficulty, and an optional due date. The "Today" dashboard's Quick-Add box also parses plain text like "submit report tomorrow high priority".
- Study Planner: Assignments, Examinations (with a countdown), Study Sessions, Subjects.
- Health & Wellness: Sleep, Water Intake (one-tap +250ml on the dashboard), Exercise, Mood, Medication reminders.
- Habit Tracker: daily check-ins with current/longest streaks.
- Focus Mode: schedule a daily/weekly distraction-free time block, then check in as "stayed focused" or "got distracted" — it's an honest accountability tool (like the app Opal), not literal app-blocking, since a website can't get OS permission to block other apps.
- Digital Wellbeing: Screen Time and Social Media usage logs, plus a productive-vs-non-productive breakdown.
- Finance Tracker: Expenses and Savings Goals.
- Goals: personal goals with a progress percentage.
- Personal Journal: free-form dated entries.
- Reports & Insights: auto-generated productivity/life-balance reports and recommendations, computed fresh from the other modules' data — nothing to fill in manually.
- Notes, Calendar (with conflict detection), Reminders, Alarms (recurring schedules).
- Gamification: completing tasks/habits/assignments/goals/focus check-ins earns XP; level and progress show in the sidebar and on Settings.
- Settings (top of sidebar): enable/disable modules (data is preserved, not deleted, while a module is off), switch light/dark theme, upload a profile picture, sign in with Google.
- Install App button (sidebar/topbar): installs ALMS as an app on Android/Windows/Mac (one click) or shows Add-to-Home-Screen steps on iOS (Apple doesn't allow anything else from a website). Native Windows/Android installers are also available as downloads for anyone who wants those instead of the browser install.
`.trim();

function buildSystemPrompt(user, enabledModules) {
  return `You are the in-app assistant for ALMS (Adaptive Life Management System), a personal life-management web app. You are speaking with ${user.name}, whose role is "${user.role}".

Only help with using ALMS itself: what a feature does, where to find it, and how to do something in it. You have no access to the user's actual tasks, habits, or other stored data, and no ability to take actions in the app on their behalf — if asked to "do" something (e.g. "add a task for me"), explain how they can do it themselves. If asked something unrelated to ALMS, briefly say that's outside what you can help with here and redirect to ALMS topics.

Currently enabled modules for this user: ${enabledModules.length ? enabledModules.join(', ') : '(none yet — they should visit Settings to enable some)'}.

Reference guide to every module/feature in ALMS:
${MODULE_GUIDE}

Keep replies short (2-5 sentences unless genuinely more is needed), friendly, and concrete — name the exact page/button when relevant.`;
}

// In-memory sliding-window rate limit (per-process, so on a multi-instance
// serverless deployment this is a best-effort cap, not a hard guarantee).
const requestLog = new Map();
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60 * 60 * 1000;

function isRateLimited(userId) {
  const now = Date.now();
  const timestamps = (requestLog.get(userId) || []).filter(t => now - t < RATE_WINDOW_MS);
  timestamps.push(now);
  requestLog.set(userId, timestamps);
  return timestamps.length > RATE_LIMIT;
}

exports.isConfigured = isConfigured;

exports.getHistory = async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Please log in.' });
  try {
    const history = await AssistantMessage.findRecentByUser(req.session.user.id);
    res.json({ history });
  } catch (err) {
    console.error('Assistant history error:', err);
    res.status(500).json({ error: 'Failed to load chat history.' });
  }
};

exports.clearHistory = async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Please log in.' });
  try {
    await AssistantMessage.clearForUser(req.session.user.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Assistant clear history error:', err);
    res.status(500).json({ error: 'Failed to clear chat history.' });
  }
};

exports.postChat = async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Please log in.' });
  if (!isConfigured) return res.status(503).json({ error: 'The AI assistant is not configured on this server.' });

  const { message } = req.body;
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'Message is required.' });
  }
  if (message.length > 2000) return res.status(400).json({ error: 'Message is too long.' });

  if (isRateLimited(req.session.user.id)) {
    return res.status(429).json({ error: "You've hit the hourly limit for the assistant — try again shortly." });
  }

  const trimmedMessage = message.trim();

  try {
    const Module = require('../models/Module');
    const [enabled, priorTurns] = await Promise.all([
      Module.findEnabledForUser(req.session.user.id),
      AssistantMessage.findRecentByUser(req.session.user.id)
    ]);
    const enabledNames = enabled.map(m => m.name);

    // Conversation context is read back from the DB (not trusted from the
    // client) so it can't be spoofed and stays consistent across devices.
    const messages = priorTurns
      .slice(-10)
      .map(m => ({ role: m.role, content: m.content }));
    messages.push({ role: 'user', content: trimmedMessage });

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 500,
      system: buildSystemPrompt(req.session.user, enabledNames),
      messages
    });

    const reply = response.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n')
      .trim() || "Sorry, I didn't catch that — could you rephrase?";

    await AssistantMessage.create(req.session.user.id, 'user', trimmedMessage);
    await AssistantMessage.create(req.session.user.id, 'assistant', reply);

    res.json({ reply });
  } catch (err) {
    console.error('!!! ASSISTANT CHAT ERROR !!! ->', err);
    res.status(500).json({ error: 'The assistant is having trouble right now. Please try again in a moment.' });
  }
};
