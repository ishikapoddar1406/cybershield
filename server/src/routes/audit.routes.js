const express = require('express');
const { getDatabase } = require('../db/database');
const { requireAuth, requireRole } = require('../middleware/auth');
const { recordAudit } = require('../middleware/audit');

const router = express.Router();

/**
 * GET /api/audit
 * Admin-only security audit log inspector with filtering and pagination.
 */
router.get('/', requireAuth, requireRole(['admin']), (req, res) => {
  const db = getDatabase();
  const { eventType, severity, status, search, limit = 50, offset = 0 } = req.query;

  let query = 'SELECT * FROM audit_logs WHERE 1=1';
  const params = [];

  if (eventType) {
    query += ' AND event_type = ?';
    params.push(eventType);
  }
  if (severity) {
    query += ' AND severity = ?';
    params.push(severity);
  }
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (search) {
    query += ' AND (description LIKE ? OR actor_username LIKE ? OR ip_address LIKE ?)';
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  // Count total matching
  const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
  const totalRow = db.prepare(countQuery).get(...params);

  query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit, 10), parseInt(offset, 10));

  const rows = db.prepare(query).all(...params);

  res.json({
    success: true,
    total: totalRow.total || 0,
    count: rows.length,
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10),
    logs: rows
  });
});

/**
 * GET /api/audit/export
 * Admin-only CSV or JSON export of audit trail for forensic record-keeping.
 */
router.get('/export', requireAuth, requireRole(['admin']), (req, res) => {
  const db = getDatabase();
  const logs = db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC').all();

  recordAudit(req, {
    event_type: 'AUDIT_LOGS_EXPORTED',
    severity: 'WARNING',
    description: `Security audit logs exported by Admin '${req.user.username}'`,
    status: 'SUCCESS',
    details: { totalExported: logs.length }
  });

  res.setHeader('Content-Disposition', 'attachment; filename="cybershield_audit_trail.json"');
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(logs, null, 2));
});

module.exports = router;
