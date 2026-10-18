const crypto = require('crypto');
const helmet = require('helmet');
const cors = require('cors');
const config = require('../config/env');
const { recordAudit } = require('./audit');

/**
 * Generates a cryptographically strong 32-byte anti-CSRF token.
 */
function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Helmet middleware configured for forensics application security.
 */
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  xFrameOptions: { action: 'deny' },
  xContentTypeOptions: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
});

/**
 * Restrictive CORS configuration.
 */
const corsMiddleware = cors({
  origin: config.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-CSRF-Token', 'Authorization']
});

/**
 * CSRF Protection Middleware for state-changing HTTP requests.
 * Evaluates authenticity of incoming requests using synchronized tokens.
 */
function verifyCsrf(req, res, next) {
  // Safe read-only HTTP methods are exempt from CSRF checks
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Endpoints that authenticate/initiate sessions are exempt
  const exemptPaths = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/verify-mfa',
    '/api/security-lab/test-rate-limit',
    '/api/security-lab/scan-file',
    '/api/security-lab/test-file-upload-defense'
  ];

  if (exemptPaths.includes(req.path)) {
    return next();
  }

  // Only authenticated sessions require CSRF token
  if (!req.session || !req.session.authenticated) {
    return next();
  }

  const clientToken = req.headers['x-csrf-token'];
  const sessionToken = req.session.csrfToken;

  if (!clientToken || !sessionToken || clientToken !== sessionToken) {
    recordAudit(req, {
      event_type: 'CSRF_VIOLATION',
      severity: 'CRITICAL',
      description: `CSRF validation failed on ${req.method} ${req.originalUrl}. Provided token: ${clientToken ? 'invalid' : 'missing'}`,
      status: 'DENIED',
      details: {
        method: req.method,
        path: req.originalUrl,
        hasProvidedToken: Boolean(clientToken),
        hasSessionToken: Boolean(sessionToken)
      }
    });

    return res.status(403).json({
      success: false,
      error: 'Security Alert: CSRF token validation failed. State-changing requests must include a valid X-CSRF-Token header.'
    });
  }

  next();
}

module.exports = {
  generateCsrfToken,
  securityHeaders,
  corsMiddleware,
  verifyCsrf
};
