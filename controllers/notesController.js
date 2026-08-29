// ============================================================
// Controller: Notes — handles note CRUD (Feature 8)
// ============================================================
const Note = require('../models/Note');

exports.getNotes = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const q = (req.query.q || '').trim();
  try {
    const notes = await Note.findAllByUser(req.session.user.id, q || null);
    res.render('notes-list', { user: req.session.user, notes, q });
  } catch (err) {
    console.error('Notes list error:', err);
    req.session.error = 'Failed to load notes.';
    res.redirect('/dashboard');
  }
};

exports.getCreateNote = (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('notes-form', { user: req.session.user, note: null, formAction: '/notes/create', pageTitle: 'Create Note' });
};

exports.postCreateNote = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { title, content } = req.body;
  if (!title || !title.trim()) {
    req.session.error = 'Note title is required.';
    return res.redirect('/notes/new');
  }
  try {
    await Note.create(req.session.user.id, title.trim(), (content || '').trim());
    req.session.success = 'Note created successfully!';
    res.redirect('/notes');
  } catch (err) {
    console.error('Create note error:', err);
    req.session.error = 'Failed to create note.';
    res.redirect('/notes/new');
  }
};

exports.getEditNote = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const note = await Note.findById(req.params.id, req.session.user.id);
    if (!note) {
      req.session.error = 'Note not found.';
      return res.redirect('/notes');
    }
    res.render('notes-form', {
      user: req.session.user,
      note,
      formAction: `/notes/edit/${req.params.id}`,
      pageTitle: 'Edit Note'
    });
  } catch (err) {
    console.error('Edit note form error:', err);
    req.session.error = 'Failed to load note.';
    res.redirect('/notes');
  }
};

exports.postEditNote = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { title, content } = req.body;
  if (!title || !title.trim()) {
    req.session.error = 'Note title is required.';
    return res.redirect(`/notes/edit/${req.params.id}`);
  }
  try {
    await Note.update(req.params.id, req.session.user.id, title.trim(), (content || '').trim());
    req.session.success = 'Note updated successfully!';
    res.redirect('/notes');
  } catch (err) {
    console.error('Update note error:', err);
    req.session.error = 'Failed to update note.';
    res.redirect(`/notes/edit/${req.params.id}`);
  }
};

exports.togglePin = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    await Note.togglePin(req.params.id, req.session.user.id);
    req.session.success = 'Note updated.';
  } catch (err) {
    console.error('Toggle pin error:', err);
    req.session.error = 'Failed to update note pin.';
  }
  res.redirect('/notes');
};

exports.deleteNote = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    await Note.delete(req.params.id, req.session.user.id);
    req.session.success = 'Note deleted.';
  } catch (err) {
    console.error('Delete note error:', err);
    req.session.error = 'Failed to delete note.';
  }
  res.redirect('/notes');
};
