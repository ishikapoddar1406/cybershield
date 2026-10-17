const express = require('express');
const rateLimit = require('express-rate-limit');
const { requireAuth, requireRole } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { getDatabase } = require('../db/database');
const { recordAudit } = require('../middleware/audit');
const { passwordPolicy } = require('../utils/validators');

const router = express.Router();

/**
 * Dedicated test rate limiter for the lab demo (3 requests per 30 seconds)
 */
const labRateLimiter = rateLimit({
  windowMs: 30 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    recordAudit(req, {
      event_type: 'LAB_RATE_LIMIT_TRIGGERED',
      severity: 'WARNING',
      description: `Security Lab rate limit triggered for IP ${req.ip}`,
      status: 'DENIED'
    });

    res.status(429).json({
      success: false,
      allowed: false,
      message: 'Request blocked: Too many rapid requests. Rate limit successfully triggered.'
    });
  }
});

/**
 * POST /api/security-lab/test-password-policy
 * Tests password strength against server-side policy rules.
 */
router.post('/test-password-policy', (req, res) => {
  const { password } = req.body;
  if (typeof password !== 'string') {
    return res.status(400).json({ success: false, error: 'Password string required.' });
  }

  const checks = {
    minLength: password.length >= 10,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password)
  };

  const parseResult = passwordPolicy.safeParse(password);
  const isValid = parseResult.success;

  res.json({
    success: true,
    isValid,
    checks,
    errors: isValid ? [] : (parseResult.error.issues || parseResult.error.errors || []).map(e => e.message),
    message: isValid
      ? 'Password meets all enterprise complexity requirements.'
      : 'Password fails server-enforced security policy.'
  });
});

/**
 * POST /api/security-lab/test-rate-limit
 * Triggers 429 Too Many Requests after 3 quick attempts.
 */
router.post('/test-rate-limit', labRateLimiter, (req, res) => {
  res.json({
    success: true,
    allowed: true,
    message: 'Request allowed: Attempt accepted under the rate limit (maximum 3 allowed per 30 seconds).'
  });
});

/**
 * POST /api/security-lab/reset-rate-limit
 * Resets the demonstration rate limiter counter for the client's IP.
 */
router.post('/reset-rate-limit', (req, res) => {
  if (labRateLimiter && typeof labRateLimiter.resetKey === 'function') {
    try {
      labRateLimiter.resetKey(req.ip);
      labRateLimiter.resetKey('::1');
      labRateLimiter.resetKey('127.0.0.1');
      labRateLimiter.resetKey('::ffff:127.0.0.1');
    } catch (e) {
      // Ignore if key was not present
    }
  }
  res.json({
    success: true,
    message: 'Rate limit test counter reset. You can run the click-by-click test again.'
  });
});

/**
 * GET /api/security-lab/test-admin-only-rbac
 * Strict Admin-only endpoint. Testing as Investigator or Reporter returns 403 Forbidden.
 */
router.get('/test-admin-only-rbac', requireAuth, requireRole(['admin']), (req, res) => {
  res.json({
    success: true,
    message: `RBAC Authorization Verified: Access granted to '${req.user.username}' with role '${req.user.role}'.`
  });
});

/**
 * POST /api/security-lab/test-csrf-protected
 * State-changing request requiring valid X-CSRF-Token.
 */
router.post('/test-csrf-protected', requireAuth, (req, res) => {
  res.json({
    success: true,
    message: 'CSRF Verification Passed: Valid X-CSRF-Token was provided and matched active session secret.'
  });
});

/**
 * POST /api/security-lab/test-file-upload-defense
 * Tests upload defense against malicious file extensions or oversized files.
 */
router.post('/test-file-upload-defense', requireAuth, (req, res) => {
  upload.single('testFile')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        rejected: true,
        reason: err.message,
        errorCode: err.code || 'UPLOAD_REJECTED',
        explanation: 'The server rejected this file before it could reach the filesystem. Only explicitly allowlisted non-executable extensions (TXT, LOG, CSV, EML, PDF, PNG, JPG, PCAP) are accepted.'
      });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file received.' });
    }

    // Clean up temporary test file immediately
    const fs = require('fs');
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.json({
      success: true,
      rejected: false,
      message: `File '${req.file.originalname}' passed allowlist checks and was safely processed without saving.`
    });
  });
});

/**
 * GET /api/security-lab/inspect-headers
 * Returns overview of active security headers and session cookie protection flags.
 */
router.get('/inspect-headers', (req, res) => {
  res.json({
    success: true,
    activeSecurityHeaders: [
      {
        header: 'Content-Security-Policy (CSP)',
        value: "default-src 'self'; script-src 'self'; frame-ancestors 'none'; object-src 'none'",
        threatMitigated: 'Prevents Cross-Site Scripting (XSS), inline script injection, and clickjacking attacks.'
      },
      {
        header: 'X-Frame-Options',
        value: 'DENY',
        threatMitigated: 'Prevents the platform from being embedded in unauthorized iframes or frame tags (Clickjacking defense).'
      },
      {
        header: 'X-Content-Type-Options',
        value: 'nosniff',
        threatMitigated: 'Prevents MIME-confusion attacks and forces browsers to respect declared Content-Type.'
      },
      {
        header: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
        threatMitigated: 'Prevents leaking private case URL paths and tokens to external third-party origins in HTTP Referer.'
      },
      {
        header: 'Cross-Origin Resource Sharing (CORS)',
        value: 'Restricted to client origin with credentials: true',
        threatMitigated: 'Prevents arbitrary malicious origins from executing authenticated API calls.'
      }
    ],
    cookieSecurityFlags: [
      {
        flag: 'HttpOnly = true',
        purpose: 'Ensures session cookies cannot be accessed via JavaScript document.cookie, neutralising cookie-theft XSS payloads.'
      },
      {
        flag: 'SameSite = Lax',
        purpose: 'Restricts cookies from being transmitted on third-party cross-site requests, mitigating Cross-Site Request Forgery (CSRF).'
      },
      {
        flag: 'Path = /',
        purpose: 'Confines session scope to platform application routes.'
      }
    ]
  });
});

/**
 * GET /api/security-lab/recent-audit-events
 * Fetches recent audit events for live observation in the security lab.
 */
router.get('/recent-audit-events', requireAuth, (req, res) => {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT id, timestamp, actor_username, actor_role, ip_address,
           event_type, severity, description, status
    FROM audit_logs
    ORDER BY timestamp DESC
    LIMIT 20
  `).all();

  res.json({ success: true, count: rows.length, events: rows });
});

module.exports = router;
