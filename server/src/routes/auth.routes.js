const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { generateSecret, generateURI, verifySync } = require('otplib');
const qrcode = require('qrcode');
const { encryptTotpSecret, decryptTotpSecret } = require('../utils/mfaCrypto');
const { getDatabase } = require('../db/database');
const { loginLimiter } = require('../middleware/rateLimiter');
const { requireAuth } = require('../middleware/auth');
const { generateCsrfToken } = require('../middleware/security');
const { recordAudit } = require('../middleware/audit');
const {
  loginSchema,
  totpVerifySchema,
  registerUserSchema,
  updatePasswordSchema
} = require('../utils/validators');

const router = express.Router();

/**
 * GET /api/auth/me
 * Retrieves current active session profile and CSRF token.
 */
router.get('/me', (req, res) => {
  if (!req.session || !req.session.authenticated || !req.user) {
    return res.json({
      authenticated: false,
      user: null,
      csrfToken: null
    });
  }

  res.json({
    authenticated: true,
    user: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role,
      fullName: req.user.full_name,
      badgeNumber: req.user.badge_number,
      totpEnabled: Boolean(req.user.totp_enabled),
      createdAt: req.user.created_at
    },
    csrfToken: req.session.csrfToken
  });
});

/**
 * POST /api/auth/login
 * Rate-limited login with password verification, lockout handling, and MFA redirection.
 */
router.post('/login', loginLimiter, async (req, res) => {
  const parseResult = loginSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: 'Invalid input format. Please check your username and password.'
    });
  }

  const { username, password } = parseResult.data;
  const db = getDatabase();

  const user = db.prepare(`
    SELECT id, username, email, password_hash, role, full_name,
           badge_number, totp_secret, totp_enabled, failed_login_attempts,
           lockout_until
    FROM users WHERE username = ? OR email = ?
  `).get(username, username);

  if (!user) {
    recordAudit(req, {
      event_type: 'LOGIN_FAILURE',
      severity: 'WARNING',
      description: `Failed login attempt for non-existent user '${username}'`,
      status: 'FAILURE'
    });

    return res.status(401).json({
      success: false,
      error: 'Invalid credentials or account locked. Please check your inputs.'
    });
  }

  // Check temporary account lockout
  const now = new Date();
  if (user.lockout_until && new Date(user.lockout_until) > now) {
    const remainingSeconds = Math.ceil((new Date(user.lockout_until) - now) / 1000);
    recordAudit(req, {
      event_type: 'LOGIN_BLOCKED_LOCKOUT',
      severity: 'WARNING',
      description: `Login attempt on locked account '${user.username}'. Lockout remaining: ${remainingSeconds}s`,
      status: 'DENIED',
      actor: { id: user.id, username: user.username, role: user.role }
    });

    return res.status(403).json({
      success: false,
      error: `Security Lockout: Account is temporarily locked due to repeated failed attempts. Please try again in ${remainingSeconds} seconds.`
    });
  }

  // Verify password hash with bcrypt
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    const newFailCount = user.failed_login_attempts + 1;
    let newLockoutUntil = null;

    if (newFailCount >= 5) {
      // 15-minute lockout after 5 consecutive failures
      newLockoutUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      recordAudit(req, {
        event_type: 'ACCOUNT_LOCKED',
        severity: 'SECURITY_ALERT',
        description: `Account '${user.username}' locked for 15 minutes due to 5 consecutive failed login attempts.`,
        status: 'FAILURE',
        actor: { id: user.id, username: user.username, role: user.role }
      });
    } else {
      recordAudit(req, {
        event_type: 'LOGIN_FAILURE',
        severity: 'WARNING',
        description: `Failed login password attempt (${newFailCount}/5) for user '${user.username}'`,
        status: 'FAILURE',
        actor: { id: user.id, username: user.username, role: user.role }
      });
    }

    db.prepare(`
      UPDATE users SET failed_login_attempts = ?, lockout_until = ?, updated_at = ?
      WHERE id = ?
    `).run(newFailCount, newLockoutUntil, new Date().toISOString(), user.id);

    return res.status(401).json({
      success: false,
      error: newFailCount >= 5
        ? 'Account temporarily locked due to excessive failed attempts. Please wait 15 minutes.'
        : `Invalid credentials. Attempts remaining before lockout: ${5 - newFailCount}.`
    });
  }

  // Reset failed attempts on valid password
  db.prepare(`
    UPDATE users SET failed_login_attempts = 0, lockout_until = NULL, updated_at = ?
    WHERE id = ?
  `).run(new Date().toISOString(), user.id);

  // If MFA is enabled, issue pre-MFA session challenge
  if (user.totp_enabled === 1 && user.totp_secret) {
    req.session.preMfaUserId = user.id;
    req.session.preMfaTimestamp = Date.now();
    req.session.authenticated = false;
    req.session.failedMfaAttempts = 0;

    recordAudit(req, {
      event_type: 'MFA_CHALLENGE_ISSUED',
      severity: 'INFO',
      description: `Primary authentication passed for '${user.username}'. TOTP MFA challenge issued.`,
      status: 'SUCCESS',
      actor: { id: user.id, username: user.username, role: user.role }
    });

    return res.json({
      success: true,
      mfaRequired: true,
      message: 'Password verified. Please provide your 6-digit TOTP authenticator code.'
    });
  }

  // No MFA enabled: complete login, regenerate session, issue CSRF token
  req.session.regenerate((err) => {
    if (err) {
      return res.status(500).json({ success: false, error: 'Session creation failure.' });
    }

    const csrfToken = generateCsrfToken();
    req.session.userId = user.id;
    req.session.authenticated = true;
    req.session.csrfToken = csrfToken;

    recordAudit(req, {
      event_type: 'LOGIN_SUCCESS',
      severity: 'INFO',
      description: `User '${user.username}' logged in successfully (Role: ${user.role}).`,
      status: 'SUCCESS',
      actor: { id: user.id, username: user.username, role: user.role }
    });

    res.json({
      success: true,
      mfaRequired: false,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.full_name,
        badgeNumber: user.badge_number,
        totpEnabled: Boolean(user.totp_enabled)
      },
      csrfToken
    });
  });
});

/**
 * POST /api/auth/verify-mfa
 * Validates the 6-digit TOTP code during login challenge or initial enrollment.
 */
router.post('/verify-mfa', async (req, res) => {
  const parseResult = totpVerifySchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({
      success: false,
      error: 'Invalid MFA token. Please enter exactly 6 numeric digits.'
    });
  }

  const { token } = parseResult.data;
  const db = getDatabase();

  // Rate limiting failed attempts on session
  if (!req.session.failedMfaAttempts) {
    req.session.failedMfaAttempts = 0;
  }
  if (req.session.failedMfaAttempts >= 5) {
    return res.status(429).json({
      success: false,
      error: 'Too many invalid authenticator attempts. Please wait 5 minutes before trying again.'
    });
  }

  // CASE 1: Pre-MFA challenge during login
  if (req.session?.preMfaUserId) {
    const user = db.prepare(`
      SELECT id, username, email, role, full_name, badge_number, totp_secret, totp_enabled, last_used_totp_timestep
      FROM users WHERE id = ?
    `).get(req.session.preMfaUserId);

    if (!user || !user.totp_secret || !user.totp_enabled) {
      return res.status(400).json({
        success: false,
        error: 'Multi-factor authentication is not active on this account.'
      });
    }

    const plaintextSecret = decryptTotpSecret(user.totp_secret);
    if (!plaintextSecret) {
      return res.status(500).json({
        success: false,
        error: 'Cryptographic error: Unable to decrypt MFA secret.'
      });
    }

    const check = verifySync({
      token,
      secret: plaintextSecret,
      epochTolerance: 30
    });

    const isValid = Boolean(check && check.valid);

    if (!isValid) {
      req.session.failedMfaAttempts++;
      recordAudit(req, {
        event_type: 'MFA_VERIFY_FAILURE',
        severity: 'WARNING',
        description: `Invalid TOTP code attempted during login for user '${user.username}' (Attempt ${req.session.failedMfaAttempts}/5)`,
        status: 'FAILURE',
        actor: { id: user.id, username: user.username, role: user.role }
      });

      return res.status(400).json({
        success: false,
        error: 'Invalid or expired authenticator code. Check that your device time is synchronized with network time and try again.'
      });
    }

    // Replay attack prevention: verify that this timestep was not already used
    if (user.last_used_totp_timestep && user.last_used_totp_timestep === check.timeStep) {
      return res.status(400).json({
        success: false,
        error: 'This one-time code has already been used. Please wait for the next 6-digit code on your authenticator app.'
      });
    }

    // Update last used timestep and reset failed login attempts
    db.prepare('UPDATE users SET last_used_totp_timestep = ?, failed_login_attempts = 0, updated_at = ? WHERE id = ?')
      .run(check.timeStep, new Date().toISOString(), user.id);

    // Regenerate session upon successful login to prevent session fixation
    req.session.regenerate((err) => {
      if (err) {
        return res.status(500).json({ success: false, error: 'Session creation error.' });
      }

      const csrfToken = generateCsrfToken();
      req.session.userId = user.id;
      req.session.authenticated = true;
      req.session.csrfToken = csrfToken;
      req.session.failedMfaAttempts = 0;

      recordAudit(req, {
        event_type: 'LOGIN_SUCCESS_MFA',
        severity: 'INFO',
        description: `User '${user.username}' successfully authenticated with password and TOTP MFA.`,
        status: 'SUCCESS',
        actor: { id: user.id, username: user.username, role: user.role }
      });

      res.json({
        success: true,
        message: 'MFA verification successful. Access granted.',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          fullName: user.full_name,
          badgeNumber: user.badge_number,
          totpEnabled: true
        },
        csrfToken
      });
    });
    return;
  }

  // CASE 2: Active authenticated user confirming initial MFA enrollment
  if (req.session?.authenticated && req.session?.userId) {
    const pendingSecret = req.session.pendingMfaSecret;
    const pendingExpires = req.session.pendingMfaExpires || 0;

    if (!pendingSecret || Date.now() > pendingExpires) {
      return res.status(400).json({
        success: false,
        error: 'No active MFA setup session found or setup has expired. Please click "Set Up Authenticator" to generate a fresh QR code.'
      });
    }

    const check = verifySync({
      token,
      secret: pendingSecret,
      epochTolerance: 30
    });

    const isValid = Boolean(check && check.valid);

    if (!isValid) {
      req.session.failedMfaAttempts++;
      recordAudit(req, {
        event_type: 'MFA_ENROLLMENT_VERIFY_FAILURE',
        severity: 'WARNING',
        description: `Invalid TOTP code entered during MFA enrollment for user ID ${req.session.userId}`,
        status: 'FAILURE'
      });

      return res.status(400).json({
        success: false,
        error: 'Invalid authenticator code. Enter the 6-digit code currently displayed in your authenticator app.'
      });
    }

    // Encrypt secret for persistent storage at rest
    const encryptedSecret = encryptTotpSecret(pendingSecret);

    // Persist verified secret and enable MFA in database
    db.prepare(`
      UPDATE users
      SET totp_secret = ?, totp_enabled = 1, last_used_totp_timestep = ?, updated_at = ?
      WHERE id = ?
    `).run(encryptedSecret, check.timeStep, new Date().toISOString(), req.session.userId);

    const user = db.prepare(`
      SELECT id, username, email, role, full_name, badge_number, totp_enabled
      FROM users WHERE id = ?
    `).get(req.session.userId);

    // Clean up pending session state
    delete req.session.pendingMfaSecret;
    delete req.session.pendingMfaExpires;
    req.session.failedMfaAttempts = 0;

    recordAudit(req, {
      event_type: 'MFA_ENROLLMENT_COMPLETED',
      severity: 'INFO',
      description: `User '${user.username}' successfully verified TOTP code and enabled Two-Factor Authentication.`,
      status: 'SUCCESS',
      actor: { id: user.id, username: user.username, role: user.role }
    });

    return res.json({
      success: true,
      message: 'Authenticator enabled successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.full_name,
        badgeNumber: user.badge_number,
        totpEnabled: true
      },
      csrfToken: req.session.csrfToken
    });
  }

  // CASE 3: Neither pre-MFA nor authenticated
  return res.status(401).json({
    success: false,
    error: 'No active session or MFA challenge found. Please log in first.'
  });
});

/**
 * POST /api/auth/mfa/setup
 * Generates a new TOTP secret and QR code for pending enrollment.
 * Keeps secret in session until proven by verification form.
 */
router.post('/mfa/setup', requireAuth, async (req, res) => {
  try {
    const secret = generateSecret();
    const otpAuthUrl = generateURI({
      issuer: 'CyberShield',
      label: req.user.username,
      secret
    });
    const qrCodeDataUrl = await qrcode.toDataURL(otpAuthUrl, {
      errorCorrectionLevel: 'M',
      margin: 2,
      scale: 5,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Store in session as pending enrollment (valid for 10 minutes)
    req.session.pendingMfaSecret = secret;
    req.session.pendingMfaExpires = Date.now() + 10 * 60 * 1000;
    req.session.failedMfaAttempts = 0;

    recordAudit(req, {
      event_type: 'MFA_ENROLLMENT_INITIATED',
      severity: 'INFO',
      description: `User '${req.user.username}' initiated TOTP MFA enrollment setup.`,
      status: 'SUCCESS',
      actor: { id: req.user.id, username: req.user.username, role: req.user.role }
    });

    res.json({
      success: true,
      secret,
      qrCodeDataUrl,
      otpAuthUrl,
      issuer: 'CyberShield',
      account: req.user.username,
      instructions: 'Scan this code using Google Authenticator or Microsoft Authenticator. Then enter the 6-digit code shown in your mobile app below.'
    });
  } catch (err) {
    console.error('[MFA_SETUP_ERROR]', err);
    res.status(500).json({ success: false, error: 'Failed to generate MFA credentials.' });
  }
});

/**
 * POST /api/auth/mfa/cancel
 * Cleans up pending MFA setup session without altering user account.
 */
router.post('/mfa/cancel', requireAuth, (req, res) => {
  delete req.session.pendingMfaSecret;
  delete req.session.pendingMfaExpires;
  res.json({ success: true, message: 'MFA enrollment cancelled.' });
});

/**
 * POST /api/auth/mfa/disable
 * Disables MFA for the user after password confirmation.
 */
router.post('/mfa/disable', requireAuth, async (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ success: false, error: 'Password confirmation required to disable MFA.' });
  }

  const db = getDatabase();
  const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    recordAudit(req, {
      event_type: 'MFA_DISABLE_FAILED',
      severity: 'WARNING',
      description: `Failed attempt to disable MFA for '${req.user.username}' (Incorrect password)`,
      status: 'FAILURE',
      actor: { id: req.user.id, username: req.user.username, role: req.user.role }
    });
    return res.status(401).json({ success: false, error: 'Incorrect password.' });
  }

  db.prepare(`
    UPDATE users
    SET totp_secret = NULL, totp_enabled = 0, last_used_totp_timestep = NULL, updated_at = ?
    WHERE id = ?
  `).run(new Date().toISOString(), req.user.id);

  delete req.session.pendingMfaSecret;
  delete req.session.pendingMfaExpires;

  recordAudit(req, {
    event_type: 'MFA_DISABLED',
    severity: 'WARNING',
    description: `User '${req.user.username}' disabled Two-Factor Authentication.`,
    status: 'SUCCESS',
    actor: { id: req.user.id, username: req.user.username, role: req.user.role }
  });

  res.json({
    success: true,
    message: 'Multi-factor authentication has been disabled.',
    user: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role,
      fullName: req.user.full_name,
      badgeNumber: req.user.badge_number,
      totpEnabled: false
    }
  });
});

/**
 * POST /api/auth/register
 * Public registration for Reporters. Roles 'admin' and 'investigator' cannot be registered publicly.
 */
router.post('/register', async (req, res) => {
  const parseResult = registerUserSchema.safeParse(req.body);
  if (!parseResult.success) {
    const issues = parseResult.error.issues || parseResult.error.errors || [];
    const errorMsg = issues.map(e => e.message).join('. ');
    return res.status(400).json({ success: false, error: errorMsg });
  }

  const { username, email, password, full_name, badge_number } = parseResult.data;
  const db = getDatabase();

  // Enforce uniqueness
  const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
  if (existing) {
    return res.status(409).json({ success: false, error: 'Username or email is already registered.' });
  }

  const id = `USR-${crypto.randomUUID()}`;
  const passwordHash = await bcrypt.hash(password, 12);
  const now = new Date().toISOString();

  // Force role to 'reporter' for public signups to prevent privilege escalation
  const assignedRole = 'reporter';

  db.prepare(`
    INSERT INTO users (
      id, username, email, password_hash, role,
      full_name, badge_number, totp_secret, totp_enabled,
      failed_login_attempts, lockout_until, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, 0, 0, NULL, ?, ?)
  `).run(id, username, email, passwordHash, assignedRole, full_name, badge_number || null, now, now);

  recordAudit(req, {
    event_type: 'USER_REGISTRATION',
    severity: 'INFO',
    description: `New user account created: '${username}' with role '${assignedRole}'`,
    status: 'SUCCESS',
    actor: { id, username, role: assignedRole }
  });

  res.status(201).json({
    success: true,
    message: 'Account registered successfully. You may now log in.'
  });
});

/**
 * POST /api/auth/change-password
 * Enforces current password verification and password policy compliance.
 */
router.post('/change-password', requireAuth, async (req, res) => {
  const parseResult = updatePasswordSchema.safeParse(req.body);
  if (!parseResult.success) {
    const issues = parseResult.error.issues || parseResult.error.errors || [];
    const errorMsg = issues.map(e => e.message).join('. ');
    return res.status(400).json({ success: false, error: errorMsg });
  }

  const { currentPassword, newPassword } = parseResult.data;
  const db = getDatabase();

  const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
  const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({ success: false, error: 'Current password does not match.' });
  }

  const newHash = await bcrypt.hash(newPassword, 12);
  db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?')
    .run(newHash, new Date().toISOString(), req.user.id);

  recordAudit(req, {
    event_type: 'PASSWORD_CHANGED',
    severity: 'INFO',
    description: `Password updated for user '${req.user.username}'`,
    status: 'SUCCESS'
  });

  res.json({ success: true, message: 'Password changed successfully.' });
});

/**
 * POST /api/auth/logout
 * Destroys session on server and clears cookie on client.
 */
router.post('/logout', (req, res) => {
  if (req.user) {
    recordAudit(req, {
      event_type: 'LOGOUT',
      severity: 'INFO',
      description: `User '${req.user.username}' logged out.`,
      status: 'SUCCESS'
    });
  }

  if (req.session) {
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({ success: true, message: 'Logged out successfully.' });
    });
  } else {
    res.json({ success: true, message: 'Already logged out.' });
  }
});

module.exports = router;
