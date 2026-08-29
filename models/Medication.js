// ============================================================
// Model: Medication — handles medication reminder CRUD (Feature 22)
// ============================================================
const db = require('../config/db');

const Medication = {
  findAllByUser: async (userId) => {
    const [rows] = await db.query(
      'SELECT * FROM medications WHERE user_id = ? ORDER BY time_of_day ASC',
      [userId]
    );
    return rows;
  },

  findById: async (id, userId) => {
    const [rows] = await db.query(
      'SELECT * FROM medications WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return rows[0] || null;
  },

  create: async (userId, data) => {
    const [result] = await db.query(
      `INSERT INTO medications (user_id, medication_name, dosage, frequency, days_of_week, time_of_day, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, data.medication_name, data.dosage || '', data.frequency || 'daily',
       data.days_of_week || null, data.time_of_day, data.notes || '']
    );
    return result;
  },

  update: async (id, userId, data) => {
    const [result] = await db.query(
      `UPDATE medications
       SET medication_name = ?, dosage = ?, frequency = ?, days_of_week = ?, time_of_day = ?, notes = ?
       WHERE id = ? AND user_id = ?`,
      [data.medication_name, data.dosage || '', data.frequency || 'daily',
       data.days_of_week || null, data.time_of_day, data.notes || '', id, userId]
    );
    return result;
  },

  toggleEnabled: async (id, userId, currentState) => {
    await db.query('UPDATE medications SET is_enabled = ? WHERE id = ? AND user_id = ?', [currentState ? 0 : 1, id, userId]);
  },

  delete: async (id, userId) => {
    await db.query('DELETE FROM medications WHERE id = ? AND user_id = ?', [id, userId]);
  }
};

module.exports = Medication;
