const crypto = require('crypto');
const { getDatabase } = require('../db/database');

/**
 * Persists a security audit event into the audit_logs table.
 * 
 * @param {object} req - Express request object (extracts IP and User-Agent)
 * @param {object} event - Audit event details
 * @param {string} event.event_type - Action identifier (e.g. LOGIN_SUCCESS, CSRF_REJECTED)
 * @param {string} event.severity - INFO | WARNING | SECURITY_ALERT | CRITICAL
 * @param {string} event.description - Human-readable explanation
 * @param {object|string} [event.details] - Optional JSON or string context
 * @param {string} event.status - SUCCESS | DENIED | FAILURE
 * @param {object} [event.actor] - Optional override actor { id, username, role }
 */
function recordAudit(req, {
  event_type,
  severity = 'INFO',
  description,
  details = null,
  status = 'SUCCESS',
  actor = null
}) {
  try {
    const db = getDatabase();
    const id = `AUD-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const timestamp = new Date().toISOString();

    const actorId = actor?.id || req?.user?.id || null;
    const actorUsername = actor?.username || req?.user?.username || null;
    const actorRole = actor?.role || req?.user?.role || null;

    const ipAddress = (req?.headers?.['x-forwarded-for'] || req?.socket?.remoteAddress || '127.0.0.1').toString().slice(0, 45);
    const userAgent = (req?.headers?.['user-agent'] || 'Unknown-Client').toString().slice(0, 255);

    const detailsStr = details ? (typeof details === 'string' ? details : JSON.stringify(details)) : null;

    const stmt = db.prepare(`
      INSERT INTO audit_logs (
        id, timestamp, actor_id, actor_username, actor_role,
        ip_address, user_agent, event_type, severity,
        description, details, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      timestamp,
      actorId,
      actorUsername,
      actorRole,
      ipAddress,
      userAgent,
      event_type,
      severity,
      description,
      detailsStr,
      status
    );
  } catch (err) {
    console.error('[AUDIT_LOG_ERROR] Failed to record security audit log:', err.message);
  }
}

module.exports = {
  recordAudit
};
