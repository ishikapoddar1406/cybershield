const rateLimit = require('express-rate-limit');
const { recordAudit } = require('./audit');

/**
 * Strict rate limiter for authentication endpoints to prevent brute-force attacks.
 * Limit: 5 requests per 5 minutes per IP.
 */
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  handler: (req, res) => {
    recordAudit(req, {
      event_type: 'RATE_LIMIT_TRIGGERED',
      severity: 'WARNING',
      description: `Authentication rate limit exceeded for IP: ${req.ip}`,
      status: 'DENIED',
      details: { windowMs: 5 * 60 * 1000, max: 5 }
    });

    res.status(429).json({
      success: false,
      error: 'Too many authentication attempts from this IP address. Please wait 5 minutes before trying again.'
    });
  }
});

/**
 * General API rate limiter to protect against automated scraping and DoS.
 * Limit: 200 requests per minute per IP.
 */
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many requests. Please slow down.'
    });
  }
});

module.exports = {
  loginLimiter,
  generalLimiter
};
