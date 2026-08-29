// ============================================================
// Controller: Medication — handles medication reminder CRUD (Feature 22)
// ============================================================
const Medication = require('../models/Medication');

exports.getMedications = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const medications = await Medication.findAllByUser(req.session.user.id);
    res.render('medications-list', { user: req.session.user, medications });
  } catch (err) {
    console.error('Medication list error:', err);
    req.session.error = 'Failed to load medications.';
    res.redirect('/modules/health');
  }
};

exports.getCreateMedication = (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('medications-form', { user: req.session.user, medication: null, formAction: '/medications/create', pageTitle: 'New Medication Reminder' });
};

exports.postCreateMedication = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { medication_name, dosage, frequency, time_of_day, notes } = req.body;
  let days_of_week = req.body.days_of_week || [];
  if (!Array.isArray(days_of_week)) days_of_week = [days_of_week];
  if (!medication_name || !medication_name.trim()) { req.session.error = 'Medication name is required.'; return res.redirect('/medications/new'); }
  if (!time_of_day) { req.session.error = 'Reminder time is required.'; return res.redirect('/medications/new'); }
  try {
    await Medication.create(req.session.user.id, {
      medication_name: medication_name.trim(), dosage, frequency, time_of_day, notes,
      days_of_week: days_of_week.length ? days_of_week.join(',') : null
    });
    req.session.success = 'Medication reminder created successfully!';
    res.redirect('/medications');
  } catch (err) {
    console.error('Create medication error:', err);
    req.session.error = 'Failed to create medication reminder.';
    res.redirect('/medications/new');
  }
};

exports.getEditMedication = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const medication = await Medication.findById(req.params.id, req.session.user.id);
    if (!medication) {
      req.session.error = 'Medication reminder not found.';
      return res.redirect('/medications');
    }
    res.render('medications-form', { user: req.session.user, medication, formAction: `/medications/edit/${req.params.id}`, pageTitle: 'Edit Medication Reminder' });
  } catch (err) {
    console.error('Edit medication form error:', err);
    req.session.error = 'Failed to load medication reminder.';
    res.redirect('/medications');
  }
};

exports.postEditMedication = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { medication_name, dosage, frequency, time_of_day, notes } = req.body;
  let days_of_week = req.body.days_of_week || [];
  if (!Array.isArray(days_of_week)) days_of_week = [days_of_week];
  if (!medication_name || !medication_name.trim()) {
    req.session.error = 'Medication name is required.';
    return res.redirect(`/medications/edit/${req.params.id}`);
  }
  try {
    const result = await Medication.update(req.params.id, req.session.user.id, {
      medication_name: medication_name.trim(), dosage, frequency, time_of_day, notes,
      days_of_week: days_of_week.length ? days_of_week.join(',') : null
    });
    if (!result.affectedRows) {
      req.session.error = 'Medication reminder not found.';
      return res.redirect('/medications');
    }
    req.session.success = 'Medication reminder updated successfully!';
    res.redirect('/medications');
  } catch (err) {
    console.error('Update medication error:', err);
    req.session.error = 'Failed to update medication reminder.';
    res.redirect(`/medications/edit/${req.params.id}`);
  }
};

exports.toggleMedication = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    const medication = await Medication.findById(req.params.id, req.session.user.id);
    if (medication) await Medication.toggleEnabled(req.params.id, req.session.user.id, medication.is_enabled);
  } catch (err) {
    console.error('Toggle medication error:', err);
    req.session.error = 'Failed to update medication reminder.';
  }
  res.redirect('/medications');
};

exports.deleteMedication = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  try {
    await Medication.delete(req.params.id, req.session.user.id);
    req.session.success = 'Medication reminder deleted.';
  } catch (err) {
    console.error('Delete medication error:', err);
    req.session.error = 'Failed to delete medication reminder.';
  }
  res.redirect('/medications');
};
