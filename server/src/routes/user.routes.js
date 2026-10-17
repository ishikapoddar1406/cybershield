const express = require('express');
const { getDatabase } = require('../db/database');
const { requireAuth, requireRole } = require('../middleware/auth');
const { recordAudit } = require('../middleware/audit');

const router = express.Router();

/**
 * GET /api/users
 * Returns list of platform users.
 * Accessible to Admins (all users) and Investigators (to view available assignees).
 */
router.get('/', requireAuth, (req, res) => {
  const db = getDatabase();

  // If user is a reporter, they cannot enumerate platform accounts
  if (req.user.role === 'reporter') {
    return res.status(403).json({ success: false, error: 'Access Denied.' });
  }

  // Investigators can only see investigators and admins for assignment selection
  let query = `
    SELECT id, username, email, role, full_name, badge_number,
           totp_enabled, failed_login_attempts, lockout_until, created_at
    FROM users
  `;

  if (req.user.role === 'investigator') {
    query += " WHERE role IN ('investigator', 'admin')";
  }

  query += ' ORDER BY created_at ASC';
  const users = db.prepare(query).all();

  res.json({
    success: true,
    count: users.length,
    users: users.map(u => ({
      ...u,
      totp_enabled: Boolean(u.totp_enabled),
      isLocked: Boolean(u.lockout_until && new Date(u.lockout_until) > new Date())
    }))
  });
});

/**
 * PATCH /api/users/:id/role
 * Admin-only: Updates user role.
 */
router.patch('/:id/role', requireAuth, requireRole(['admin']), (req, res) => {
  const { role } = req.body;
  if (!['admin', 'investigator', 'reporter'].includes(role)) {
    return res.status(400).json({ success: false, error: 'Invalid role specified.' });
  }

  const db = getDatabase();
  const targetUser = db.prepare('SELECT id, username, role FROM users WHERE id = ?').get(req.params.id);
  if (!targetUser) {
    return res.status(404).json({ success: false, error: 'User not found.' });
  }

  // Prevent self-demotion of last admin
  if (targetUser.id === req.user.id && role !== 'admin') {
    return res.status(400).json({ success: false, error: 'Cannot demote your own administrator account.' });
  }

  db.prepare('UPDATE users SET role = ?, updated_at = ? WHERE id = ?')
    .run(role, new Date().toISOString(), targetUser.id);

  recordAudit(req, {
    event_type: 'USER_ROLE_UPDATED',
    severity: 'WARNING',
    description: `User '${targetUser.username}' role changed from '${targetUser.role}' to '${role}' by Admin '${req.user.username}'`,
    status: 'SUCCESS',
    details: { targetUserId: targetUser.id, oldRole: targetUser.role, newRole: role }
  });

  res.json({ success: true, message: `Role updated to ${role}.` });
});

/**
 * POST /api/users/:id/unlock
 * Admin-only: Clears temporary account lockout and resets failed attempts.
 */
router.post('/:id/unlock', requireAuth, requireRole(['admin']), (req, res) => {
  const db = getDatabase();
  const targetUser = db.prepare('SELECT id, username FROM users WHERE id = ?').get(req.params.id);
  if (!targetUser) {
    return res.status(404).json({ success: false, error: 'User not found.' });
  }

  db.prepare(`
    UPDATE users SET failed_login_attempts = 0, lockout_until = NULL, updated_at = ?
    WHERE id = ?
  `).run(new Date().toISOString(), targetUser.id);

  recordAudit(req, {
    event_type: 'ACCOUNT_UNLOCKED_BY_ADMIN',
    severity: 'INFO',
    description: `Account '${targetUser.username}' unlocked by Admin '${req.user.username}'`,
    status: 'SUCCESS'
  });

  res.json({ success: true, message: `Account '${targetUser.username}' has been unlocked.` });
});

/**
 * POST /api/users/:id/reset-mfa
 * Admin-only: Clears TOTP secret if user loses authenticator access.
 */
router.post('/:id/reset-mfa', requireAuth, requireRole(['admin']), (req, res) => {
  const db = getDatabase();
  const targetUser = db.prepare('SELECT id, username FROM users WHERE id = ?').get(req.params.id);
  if (!targetUser) {
    return res.status(404).json({ success: false, error: 'User not found.' });
  }

  db.prepare(`
    UPDATE users SET totp_secret = NULL, totp_enabled = 0, updated_at = ?
    WHERE id = ?
  `).run(new Date().toISOString(), targetUser.id);

  recordAudit(req, {
    event_type: 'MFA_RESET_BY_ADMIN',
    severity: 'WARNING',
    description: `MFA reset for user '${targetUser.username}' by Admin '${req.user.username}'`,
    status: 'SUCCESS'
  });

  res.json({ success: true, message: `MFA for '${targetUser.username}' has been reset. They must re-enroll on next login.` });
});

module.exports = router;
