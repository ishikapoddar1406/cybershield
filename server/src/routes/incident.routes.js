const express = require('express');
const crypto = require('crypto');
const { getDatabase } = require('../db/database');
const { requireAuth, requireRole } = require('../middleware/auth');
const { recordAudit } = require('../middleware/audit');
const { incidentCreateSchema, incidentUpdateSchema, investigationNoteSchema } = require('../utils/validators');

const router = express.Router();

/**
 * Helper to generate human-readable case IDs like CASE-2026-001
 */
function generateCaseId(db) {
  const currentYear = new Date().getFullYear();
  const countRow = db.prepare('SELECT COUNT(*) as count FROM incidents').get();
  const nextNum = (countRow.count || 0) + 1;
  return `CASE-${currentYear}-${String(nextNum).padStart(3, '0')}`;
}

/**
 * GET /api/incidents
 * Lists incidents. Enforces role boundaries:
 * - Reporters only see their own submitted cases.
 * - Investigators and Admins see all cases across the system.
 */
router.get('/', requireAuth, (req, res) => {
  const db = getDatabase();
  const { category, severity, status, search } = req.query;

  let query = `
    SELECT i.*, 
           u.full_name as reporter_name, u.username as reporter_username,
           inv.full_name as investigator_name, inv.badge_number as investigator_badge,
           (SELECT COUNT(*) FROM evidence e WHERE e.incident_id = i.id) as evidence_count,
           (SELECT COUNT(*) FROM investigation_notes n WHERE n.incident_id = i.id) as notes_count
    FROM incidents i
    LEFT JOIN users u ON i.reporter_id = u.id
    LEFT JOIN users inv ON i.assigned_investigator_id = inv.id
    WHERE 1=1
  `;
  const params = [];

  // Enforce reporter isolation: reporters cannot view other reporters' cases
  if (req.user.role === 'reporter') {
    query += ' AND i.reporter_id = ?';
    params.push(req.user.id);
  }

  if (category) {
    query += ' AND i.category = ?';
    params.push(category);
  }
  if (severity) {
    query += ' AND i.severity = ?';
    params.push(severity);
  }
  if (status) {
    query += ' AND i.status = ?';
    params.push(status);
  }
  if (search) {
    query += ' AND (i.title LIKE ? OR i.id LIKE ? OR i.description LIKE ?)';
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  query += ' ORDER BY i.created_at DESC';

  const rows = db.prepare(query).all(...params);
  res.json({ success: true, count: rows.length, incidents: rows });
});

/**
 * GET /api/incidents/:id
 * Fetches a specific case with access control check.
 */
router.get('/:id', requireAuth, (req, res) => {
  const db = getDatabase();
  const incident = db.prepare(`
    SELECT i.*, 
           u.full_name as reporter_name, u.email as reporter_email,
           inv.full_name as investigator_name, inv.badge_number as investigator_badge
    FROM incidents i
    LEFT JOIN users u ON i.reporter_id = u.id
    LEFT JOIN users inv ON i.assigned_investigator_id = inv.id
    WHERE i.id = ?
  `).get(req.params.id);

  if (!incident) {
    return res.status(404).json({ success: false, error: 'Incident not found.' });
  }

  // Reporter authorization boundary check
  if (req.user.role === 'reporter' && incident.reporter_id !== req.user.id) {
    recordAudit(req, {
      event_type: 'UNAUTHORIZED_CASE_ACCESS_DENIED',
      severity: 'SECURITY_ALERT',
      description: `Reporter '${req.user.username}' attempted to view unowned case '${incident.id}'`,
      status: 'DENIED',
      details: { requestedCaseId: incident.id, ownerId: incident.reporter_id }
    });

    return res.status(403).json({
      success: false,
      error: 'Access Denied: You are not authorized to view this incident record.'
    });
  }

  // Fetch associated notes
  const notes = db.prepare(`
    SELECT n.*, u.full_name as author_name, u.role as author_role, u.badge_number as author_badge
    FROM investigation_notes n
    JOIN users u ON n.author_id = u.id
    WHERE n.incident_id = ?
    ORDER BY n.created_at ASC
  `).all(incident.id);

  // Fetch associated evidence
  const evidence = db.prepare(`
    SELECT e.*, u.full_name as uploader_name
    FROM evidence e
    JOIN users u ON e.uploader_id = u.id
    WHERE e.incident_id = ?
    ORDER BY e.created_at DESC
  `).all(incident.id);

  res.json({
    success: true,
    incident,
    notes,
    evidence
  });
});

/**
 * POST /api/incidents
 * Creates a new cybercrime incident report.
 */
router.post('/', requireAuth, (req, res) => {
  const parseResult = incidentCreateSchema.safeParse(req.body);
  if (!parseResult.success) {
    const issues = parseResult.error.issues || parseResult.error.errors || [];
    const errorMsg = issues.map(e => e.message).join('. ');
    return res.status(400).json({ success: false, error: errorMsg });
  }

  const { title, description, category, severity, reported_ip, incident_date } = parseResult.data;
  const db = getDatabase();

  const id = generateCaseId(db);
  const now = new Date().toISOString();
  const initialStatus = 'Submitted';

  db.prepare(`
    INSERT INTO incidents (
      id, title, description, category, severity, status,
      reporter_id, assigned_investigator_id, reported_ip,
      incident_date, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?)
  `).run(
    id,
    title,
    description,
    category,
    severity,
    initialStatus,
    req.user.id,
    reported_ip || null,
    incident_date,
    now,
    now
  );

  recordAudit(req, {
    event_type: 'INCIDENT_CREATED',
    severity: 'INFO',
    description: `Incident report '${id}' registered by '${req.user.username}' (Category: ${category}, Severity: ${severity})`,
    status: 'SUCCESS',
    details: { caseId: id, category, severity }
  });

  res.status(201).json({
    success: true,
    message: 'Incident reported successfully.',
    caseId: id
  });
});

/**
 * PATCH /api/incidents/:id
 * Updates case details, status, or investigator assignment.
 * Restricted: Status changes and assignments require 'admin' or 'investigator' roles.
 */
router.patch('/:id', requireAuth, (req, res) => {
  const parseResult = incidentUpdateSchema.safeParse(req.body);
  if (!parseResult.success) {
    const issues = parseResult.error.issues || parseResult.error.errors || [];
    const errorMsg = issues.map(e => e.message).join('. ');
    return res.status(400).json({ success: false, error: errorMsg });
  }

  const db = getDatabase();
  const existing = db.prepare('SELECT * FROM incidents WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, error: 'Incident not found.' });
  }

  const updates = parseResult.data;

  // Authorization check: Reporters cannot reassign or change case status
  if (req.user.role === 'reporter') {
    if (updates.status || updates.assigned_investigator_id) {
      recordAudit(req, {
        event_type: 'RBAC_VIOLATION_INCIDENT_MUTATION',
        severity: 'WARNING',
        description: `Reporter '${req.user.username}' attempted unauthorized workflow modification on '${existing.id}'`,
        status: 'DENIED'
      });

      return res.status(403).json({
        success: false,
        error: 'Access Denied: Reporters cannot change workflow status or reassign investigators.'
      });
    }

    // Reporters can only update their own open cases
    if (existing.reporter_id !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access Denied.' });
    }
  }

  const newTitle = updates.title !== undefined ? updates.title : existing.title;
  const newDesc = updates.description !== undefined ? updates.description : existing.description;
  const newCategory = updates.category !== undefined ? updates.category : existing.category;
  const newSeverity = updates.severity !== undefined ? updates.severity : existing.severity;
  const newStatus = updates.status !== undefined ? updates.status : existing.status;
  const newAssigned = updates.assigned_investigator_id !== undefined ? updates.assigned_investigator_id : existing.assigned_investigator_id;
  const newIp = updates.reported_ip !== undefined ? updates.reported_ip : existing.reported_ip;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE incidents SET
      title = ?, description = ?, category = ?, severity = ?,
      status = ?, assigned_investigator_id = ?, reported_ip = ?,
      updated_at = ?
    WHERE id = ?
  `).run(newTitle, newDesc, newCategory, newSeverity, newStatus, newAssigned, newIp, now, existing.id);

  recordAudit(req, {
    event_type: 'INCIDENT_UPDATED',
    severity: 'INFO',
    description: `Incident '${existing.id}' updated by '${req.user.username}' (Status: ${newStatus}, Assigned: ${newAssigned || 'Unassigned'})`,
    status: 'SUCCESS',
    details: { caseId: existing.id, previousStatus: existing.status, newStatus }
  });

  res.json({
    success: true,
    message: 'Incident updated successfully.'
  });
});

/**
 * POST /api/incidents/:id/notes
 * Adds a formal investigation note or comment.
 */
router.post('/:id/notes', requireAuth, (req, res) => {
  const parseResult = investigationNoteSchema.safeParse(req.body);
  if (!parseResult.success) {
    const issues = parseResult.error.issues || parseResult.error.errors || [];
    const errorMsg = issues.map(e => e.message).join('. ');
    return res.status(400).json({ success: false, error: errorMsg });
  }

  const db = getDatabase();
  const incident = db.prepare('SELECT id, reporter_id FROM incidents WHERE id = ?').get(req.params.id);
  if (!incident) {
    return res.status(404).json({ success: false, error: 'Incident not found.' });
  }

  // Reporter ownership boundary
  if (req.user.role === 'reporter' && incident.reporter_id !== req.user.id) {
    return res.status(403).json({ success: false, error: 'Access Denied.' });
  }

  const { note_type, content } = parseResult.data;
  const id = `NOTE-${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO investigation_notes (id, incident_id, author_id, note_type, content, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, incident.id, req.user.id, note_type, content, now);

  recordAudit(req, {
    event_type: 'INVESTIGATION_NOTE_ADDED',
    severity: 'INFO',
    description: `Investigation note (${note_type}) added to '${incident.id}' by '${req.user.username}'`,
    status: 'SUCCESS'
  });

  res.status(201).json({
    success: true,
    message: 'Investigation note added successfully.',
    noteId: id
  });
});

module.exports = router;
