const express = require('express');
const { getDatabase } = require('../db/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/stats/dashboard
 * Aggregates live operational statistics from the database.
 */
router.get('/dashboard', requireAuth, (req, res) => {
  const db = getDatabase();

  // Scope counts for reporter vs investigator/admin
  let caseScopeFilter = '';
  const params = [];
  if (req.user.role === 'reporter') {
    caseScopeFilter = ' WHERE reporter_id = ?';
    params.push(req.user.id);
  }

  // Total Incidents
  const totalCasesRow = db.prepare(`SELECT COUNT(*) as count FROM incidents ${caseScopeFilter}`).get(...params);
  const totalCases = totalCasesRow?.count || 0;

  // Status breakdown
  const statusRows = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM incidents ${caseScopeFilter}
    GROUP BY status
  `).all(...params);

  const statusBreakdown = {
    'Submitted': 0,
    'Under Review': 0,
    'Investigating': 0,
    'Resolved': 0,
    'Closed': 0
  };
  statusRows.forEach(r => {
    statusBreakdown[r.status] = r.count;
  });

  // Severity breakdown
  const severityRows = db.prepare(`
    SELECT severity, COUNT(*) as count
    FROM incidents ${caseScopeFilter}
    GROUP BY severity
  `).all(...params);

  const severityBreakdown = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0
  };
  severityRows.forEach(r => {
    severityBreakdown[r.severity] = r.count;
  });

  // Category breakdown
  const categoryRows = db.prepare(`
    SELECT category, COUNT(*) as count
    FROM incidents ${caseScopeFilter}
    GROUP BY category
    ORDER BY count DESC
  `).all(...params);

  // Evidence integrity metrics
  let evidenceQuery = 'SELECT COUNT(*) as total, SUM(CASE WHEN status = \'Verified\' THEN 1 ELSE 0 END) as verified, SUM(CASE WHEN status = \'Integrity Compromised\' THEN 1 ELSE 0 END) as compromised FROM evidence';
  let evidenceParams = [];
  if (req.user.role === 'reporter') {
    evidenceQuery = 'SELECT COUNT(*) as total, SUM(CASE WHEN e.status = \'Verified\' THEN 1 ELSE 0 END) as verified, SUM(CASE WHEN e.status = \'Integrity Compromised\' THEN 1 ELSE 0 END) as compromised FROM evidence e JOIN incidents i ON e.incident_id = i.id WHERE i.reporter_id = ?';
    evidenceParams = [req.user.id];
  }
  const evidenceStats = db.prepare(evidenceQuery).get(...evidenceParams);

  // Assigned to current investigator
  let myActiveCasesCount = 0;
  if (req.user.role === 'investigator') {
    const myCases = db.prepare('SELECT COUNT(*) as count FROM incidents WHERE assigned_investigator_id = ? AND status IN (\'Under Review\', \'Investigating\')').get(req.user.id);
    myActiveCasesCount = myCases?.count || 0;
  }

  // Recent timeline events
  const recentAuditEvents = db.prepare(`
    SELECT id, timestamp, actor_username, event_type, severity, description, status
    FROM audit_logs
    ORDER BY timestamp DESC
    LIMIT 6
  `).all();

  res.json({
    success: true,
    metrics: {
      totalCases,
      myActiveCasesCount,
      pendingReviewCount: statusBreakdown['Under Review'] || 0,
      activeInvestigationsCount: statusBreakdown['Investigating'] || 0,
      resolvedCount: statusBreakdown['Resolved'] || 0,
      totalEvidence: evidenceStats?.total || 0,
      intactEvidence: evidenceStats?.verified || 0,
      compromisedEvidence: evidenceStats?.compromised || 0,
      integrityPercentage: evidenceStats?.total > 0
        ? Math.round(((evidenceStats.verified || 0) / evidenceStats.total) * 100)
        : 100
    },
    statusBreakdown,
    severityBreakdown,
    categoryBreakdown: categoryRows,
    recentActivity: recentAuditEvents
  });
});

module.exports = router;
