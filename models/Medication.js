// ============================================================
// Model: Medication — handles medication reminder CRUD (Feature 22)
// ============================================================
const db = require('../config/db');

async function findAllByUser(userId) {
  const [rows] = await db.query(
    'SELECT * FROM medications WHERE user_id = ? ORDER BY time_of_day ASC',
    [userId]
  );
  return rows;
}

async function findById(id, userId) {
  const [rows] = await db.query(
    'SELECT * FROM medications WHERE id = ? AND user_id = ?',
    [id, userId]
  );
  return rows[0] || null;
}

async function create(userId, data) {
  const sql = `INSERT INTO medications (user_id, medication_name, dosage, frequency, days_of_week, time_of_day, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`;
  const params = [
    userId,
    data.medication_name,
    data.dosage || '',
    data.frequency || 'daily',
    data.days_of_week || null,
    data.time_of_day,
    data.notes || ''
  ];
  const [result] = await db.query(sql, params);
  return result;
}

async function update(id, userId, data) {
  const sql = `UPDATE medications
       SET medication_name = ?, dosage = ?, frequency = ?, days_of_week = ?, time_of_day = ?, notes = ?
       WHERE id = ? AND user_id = ?`;
  const params = [
    data.medication_name,
    data.dosage || '',
    data.frequency || 'daily',
    data.days_of_week || null,
    data.time_of_day,
    data.notes || '',
    id,
    userId
  ];
  const [result] = await db.query(sql, params);
  return result;
}

async function toggleEnabled(id, userId, currentState) {
  const newState = currentState ? 0 : 1;
  await db.query('UPDATE medications SET is_enabled = ? WHERE id = ? AND user_id = ?', [newState, id, userId]);
}

async function remove(id, userId) {
  await db.query('DELETE FROM medications WHERE id = ? AND user_id = ?', [id, userId]);
}

module.exports = {
  findAllByUser,
  findById,
  create,
  update,
  toggleEnabled,
  delete: remove
};
