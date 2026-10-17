const session = require('express-session');
const { getDatabase } = require('../db/database');
const { recordAudit } = require('./audit');

/**
 * Custom SQLite session store using Node.js DatabaseSync.
 * Ensures server-side persistence of sessions across restarts and clean invalidation.
 */
class SqliteSessionStore extends session.Store {
  constructor(options = {}) {
    super(options);
    this.db = getDatabase();
    // Periodically clean expired sessions every 15 minutes
    this.cleanupInterval = setInterval(() => {
      try {
        const now = Math.floor(Date.now() / 1000);
        this.db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(now);
      } catch (err) {
        console.error('Session cleanup error:', err.message);
      }
    }, 15 * 60 * 1000);
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  get(sid, callback) {
    try {
      const now = Math.floor(Date.now() / 1000);
      const row = this.db.prepare('SELECT data, expires_at FROM sessions WHERE sid = ?').get(sid);
      if (!row) {
        return callback(null, null);
      }
      if (row.expires_at < now) {
        this.destroy(sid, () => {});
        return callback(null, null);
      }
      const sess = JSON.parse(row.data);
      callback(null, sess);
    } catch (err) {
      callback(err);
    }
  }

  set(sid, sess, callback) {
    try {
      let expires;
      if (sess.cookie && sess.cookie.expires) {
        expires = Math.floor(new Date(sess.cookie.expires).getTime() / 1000);
      } else {
        // Default 2 hours from now
        expires = Math.floor(Date.now() / 1000) + 7200;
      }
      const dataStr = JSON.stringify(sess);
      const candidateUserId = (sess.user && sess.user.id) || sess.userId || null;
      let validUserId = null;
      if (candidateUserId) {
        try {
          const exists = this.db.prepare('SELECT id FROM users WHERE id = ?').get(candidateUserId);
          if (exists) validUserId = exists.id;
        } catch (e) {
          validUserId = null;
        }
      }
      const csrfToken = sess.csrfToken || '';
      const createdAt = new Date().toISOString();

      const stmt = this.db.prepare(`
        INSERT INTO sessions (sid, user_id, csrf_token, expires_at, data, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(sid) DO UPDATE SET
          user_id = excluded.user_id,
          csrf_token = excluded.csrf_token,
          expires_at = excluded.expires_at,
          data = excluded.data
      `);
      stmt.run(sid, validUserId, csrfToken, expires, dataStr, createdAt);
      callback(null);
    } catch (err) {
      callback(err);
    }
  }

  destroy(sid, callback) {
    try {
      this.db.prepare('DELETE FROM sessions WHERE sid = ?').run(sid);
      if (callback) callback(null);
    } catch (err) {
      if (callback) callback(err);
    }
  }
}

/**
 * Middleware that loads user details from the database based on session state.
 */
function loadUser(req, res, next) {
  if (!req.session || !req.session.userId) {
    req.user = null;
    return next();
  }

  try {
    const db = getDatabase();
    const user = db.prepare(`
      SELECT id, username, email, role, full_name, badge_number,
             totp_enabled, failed_login_attempts, lockout_until, created_at
      FROM users WHERE id = ?
    `).get(req.session.userId);

    if (!user) {
      req.session.destroy(() => {});
      req.user = null;
      return next();
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Middleware requiring an active, fully authenticated session.
 */
function requireAuth(req, res, next) {
  if (!req.session || !req.session.authenticated || !req.user) {
    recordAudit(req, {
      event_type: 'UNAUTHORIZED_ACCESS_ATTEMPT',
      severity: 'WARNING',
      description: `Unauthenticated access attempted on ${req.method} ${req.originalUrl}`,
      status: 'DENIED'
    });

    return res.status(401).json({
      success: false,
      error: 'Authentication required. Please sign in.'
    });
  }
  next();
}

/**
 * Middleware requiring specific role(s).
 * @param {string[]} allowedRoles 
 */
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      recordAudit(req, {
        event_type: 'RBAC_ACCESS_DENIED',
        severity: 'SECURITY_ALERT',
        description: `User '${req.user.username}' (${req.user.role}) denied access to ${req.method} ${req.originalUrl}. Required: [${allowedRoles.join(', ')}]`,
        status: 'DENIED',
        details: { requiredRoles: allowedRoles, userRole: req.user.role }
      });

      return res.status(403).json({
        success: false,
        error: `Access Denied: Your role '${req.user.role}' is not authorized to perform this operation.`
      });
    }

    next();
  };
}

module.exports = {
  SqliteSessionStore,
  loadUser,
  requireAuth,
  requireRole
};
