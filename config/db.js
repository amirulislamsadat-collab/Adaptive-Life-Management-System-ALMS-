// ============================================================
// Database Configuration — MySQL Connection Pool via MAMP
// ============================================================

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:     process.env.DB_HOST || '127.0.0.1',
  user:     process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'alms_db',
  port:     parseInt(process.env.DB_PORT || '3306', 10),
  // Cloud MySQL providers like Aiven require TLS (local XAMPP does not
  // support it, so only enable it when DB_HOST is explicitly set).
  ssl:      process.env.DB_HOST ? { rejectUnauthorized: false } : undefined,
  waitForConnections: true,
  connectionLimit: 10
});

// Cloud MySQL providers with a free/idle tier (Aiven included) can power
// themselves off after a stretch of inactivity, so a query can start failing
// at any point during the app's lifetime, not just at startup. Rather than
// letting that show up as a different raw error on every single page, the
// server checks this before routing each request and shows one friendly
// "the database is asleep" page instead. Cached briefly so healthy traffic
// doesn't pay for an extra round trip on every request, and re-checked often
// enough that recovery (someone powers the database back on) is picked up
// within moments, no redeploy needed.
let lastHealthCheck = { ok: true, checkedAt: 0 };
const HEALTH_CHECK_TTL_MS = 15000;

pool.isHealthy = async () => {
  const now = Date.now();
  if (now - lastHealthCheck.checkedAt < HEALTH_CHECK_TTL_MS) return lastHealthCheck.ok;
  try {
    await pool.query('SELECT 1');
    lastHealthCheck = { ok: true, checkedAt: now };
  } catch (e) {
    lastHealthCheck = { ok: false, checkedAt: now };
  }
  return lastHealthCheck.ok;
};

module.exports = pool;
