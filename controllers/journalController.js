// ============================================================
// Controller: JournalEntry — handles daily journal CRUD & search (Feature 31)
// ============================================================
const JournalEntry = require('../models/JournalEntry');

exports.getEntries = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const q = (req.query.q || '').trim();
  try {
    const [entries, daysWritten] = await Promise.all([
      JournalEntry.findAllByUser(req.session.user.id, q || null),
      JournalEntry.getDaysWrittenLast30(req.session.user.id)
    ]);
    res.render('journal-list', { user: req.session.user, entries, q, daysWritten });
  } catch (err) {
    console.error('Journal list error:', err);
    req.session.error = 'Failed to load journal entries.';
    res.redirect('/dashboard');
  }
};

exports.getCreateEntry = (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('journal-form', { user: req.session.user, entry: null, formAction: '/journal/create', pageTitle: 'New Journal Entry' });
};

exports.postCreateEntry = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { entry_date, title, content, mood_tag } = req.body;
  if (!entry_date || !title || !title.trim()) {
    req.session.error = 'Date and title are required.';
    return res.redirect('/journal/new');
  }
  try {
    await JournalEntry.create(req.session.user.id, { entry_date, title: title.trim(), content, mood_tag });
    req.session.success = 'Journal entry saved!';
    res.redirect('/journal');
  } catch (err) {
    console.error('Create journal entry error:', err);
    req.session.error = 'Failed to save journal entry.';
    res.redirect('/journal/new');
  }
};

exports.getEditEntry = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const entry = await JournalEntry.findById(req.params.id, req.session.user.id);
    if (!entry) {
      req.session.error = 'Journal entry not found.';
      return res.redirect('/journal');
    }
    res.render('journal-form', { user: req.session.user, entry, formAction: `/journal/edit/${req.params.id}`, pageTitle: 'Edit Journal Entry' });
  } catch (err) {
    console.error('Edit journal entry form error:', err);
    req.session.error = 'Failed to load journal entry.';
    res.redirect('/journal');
  }
};

exports.postEditEntry = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { entry_date, title, content, mood_tag } = req.body;
  if (!entry_date || !title || !title.trim()) {
    req.session.error = 'Date and title are required.';
    return res.redirect(`/journal/edit/${req.params.id}`);
  }
  try {
    const result = await JournalEntry.update(req.params.id, req.session.user.id, { entry_date, title: title.trim(), content, mood_tag });
    if (!result.affectedRows) {
      req.session.error = 'Journal entry not found.';
      return res.redirect('/journal');
    }
    req.session.success = 'Journal entry updated!';
    res.redirect('/journal');
  } catch (err) {
    console.error('Update journal entry error:', err);
    req.session.error = 'Failed to update journal entry.';
    res.redirect(`/journal/edit/${req.params.id}`);
  }
};

exports.deleteEntry = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    await JournalEntry.delete(req.params.id, req.session.user.id);
    req.session.success = 'Journal entry deleted.';
  } catch (err) {
    console.error('Delete journal entry error:', err);
    req.session.error = 'Failed to delete journal entry.';
  }
  res.redirect('/journal');
};
