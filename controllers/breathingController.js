// ============================================================
// Controller: Breathing — a guided breathing exercise (box breathing /
// 4-7-8), the kind of feature well-loved in apps like Headspace/Calm.
// Lives under Health & Wellness. Ties into the stress-keyword journal
// insight and high-screen-time/low-mood insight in ReportEngine as a
// concrete, immediate thing to do about it, not just another log entry.
// ============================================================
const BreathingSession = require('../models/BreathingSession');
const Gamification = require('../models/Gamification');

const PATTERNS = {
  box: { label: 'Box Breathing', steps: [{ phase: 'Inhale', seconds: 4 }, { phase: 'Hold', seconds: 4 }, { phase: 'Exhale', seconds: 4 }, { phase: 'Hold', seconds: 4 }] },
  '4-7-8': { label: '4-7-8 (calming)', steps: [{ phase: 'Inhale', seconds: 4 }, { phase: 'Hold', seconds: 7 }, { phase: 'Exhale', seconds: 8 }] }
};

exports.getBreathe = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const weeklyCount = await BreathingSession.getWeeklyCount(req.session.user.id);
    res.render('breathe', { user: req.session.user, patterns: PATTERNS, weeklyCount });
  } catch (err) {
    console.error('Breathing page error:', err);
    req.session.error = 'Failed to load breathing exercise.';
    res.redirect('/modules/health');
  }
};

exports.postComplete = async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Please log in.' });
  const pattern = Object.keys(PATTERNS).includes(req.body.pattern) ? req.body.pattern : 'box';
  const cycles = Math.min(20, Math.max(1, parseInt(req.body.cycles, 10) || 1));
  try {
    await BreathingSession.create(req.session.user.id, pattern, cycles);
    const result = await Gamification.awardXp(req.session.user.id, 10);
    res.json({
      success: true, xpAwarded: 10,
      leveledUp: result.leveledUp, newLevel: result.newLevel, newTitle: result.newTitle
    });
  } catch (err) {
    console.error('Breathing complete error:', err);
    res.status(500).json({ error: 'Failed to save session.' });
  }
};
