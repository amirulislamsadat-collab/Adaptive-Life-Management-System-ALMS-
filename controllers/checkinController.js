// ============================================================
// Controller: DailyCheckin — energy / water goal / today's focus, one per
// local day. "Local day" is decided by the client (it sends today's date
// string), since the server has no reliable way to know the user's
// timezone otherwise.
// ============================================================
const DailyCheckin = require('../models/DailyCheckin');
const User = require('../models/User');
const Gamification = require('../models/Gamification');

const ENERGY_NOTES = {
  1: "Low energy today — that's okay. Maybe keep today's plan light and be kind to yourself.",
  2: "A slower day. Small wins still count — pick one easy thing and go from there.",
  3: "Steady energy — a solid, ordinary day to make real progress on.",
  4: "Good energy today! A great day to tackle something you've been putting off.",
  5: "Great energy — go make today count!"
};

exports.getStatus = async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Please log in.' });
  const date = req.query.date;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: 'A valid date is required.' });
  try {
    const checkin = await DailyCheckin.findByDate(req.session.user.id, date);
    res.json({ completed: !!checkin, checkin: checkin || null });
  } catch (err) {
    console.error('Check-in status error:', err);
    res.status(500).json({ error: 'Failed to load check-in status.' });
  }
};

exports.postCheckin = async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Please log in.' });
  const { checkin_date, energy_level, water_goal_ml, focus_text } = req.body;
  const energy = parseInt(energy_level, 10);
  const waterGoal = parseInt(water_goal_ml, 10);

  if (!checkin_date || !/^\d{4}-\d{2}-\d{2}$/.test(checkin_date)) return res.status(400).json({ error: 'A valid date is required.' });
  if (!energy || energy < 1 || energy > 5) return res.status(400).json({ error: 'Energy level must be between 1 and 5.' });
  if (!waterGoal || waterGoal < 500 || waterGoal > 4000) return res.status(400).json({ error: 'Water goal must be between 500 and 4000 ml.' });

  try {
    const existing = await DailyCheckin.findByDate(req.session.user.id, checkin_date);
    if (existing) return res.status(409).json({ error: "You've already checked in today." });

    await DailyCheckin.create(req.session.user.id, {
      checkin_date, energy_level: energy, water_goal_ml: waterGoal, focus_text: (focus_text || '').trim().slice(0, 255)
    });
    await User.updateWaterGoal(req.session.user.id, waterGoal);
    const result = await Gamification.awardXp(req.session.user.id, 15);

    res.json({
      success: true,
      xpAwarded: 15,
      leveledUp: result.leveledUp,
      newLevel: result.newLevel,
      newTitle: result.newTitle,
      note: ENERGY_NOTES[energy]
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: "You've already checked in today." });
    console.error('Daily check-in error:', err);
    res.status(500).json({ error: 'Failed to save check-in.' });
  }
};
