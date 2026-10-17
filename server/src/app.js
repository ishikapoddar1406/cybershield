const express = require('express');
const session = require('express-session');
const path = require('path');
const config = require('./config/env');
const { getDatabase } = require('./db/database');
const { SqliteSessionStore, loadUser } = require('./middleware/auth');
const { securityHeaders, corsMiddleware, verifyCsrf } = require('./middleware/security');
const { generalLimiter } = require('./middleware/rateLimiter');
const { recordAudit } = require('./middleware/audit');

// Route Handlers
const authRoutes = require('./routes/auth.routes');
const incidentRoutes = require('./routes/incident.routes');
const evidenceRoutes = require('./routes/evidence.routes');
const forensicsRoutes = require('./routes/forensics.routes');
const securityLabRoutes = require('./routes/security-lab.routes');
const auditRoutes = require('./routes/audit.routes');
const userRoutes = require('./routes/user.routes');
const statsRoutes = require('./routes/stats.routes');

const app = express();

// Initialize database schema
getDatabase();

// Security Middleware Stack
app.use(securityHeaders);
app.use(corsMiddleware);
app.use(generalLimiter);

// Safe Body Parsing with tight bounds
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Persistent Session Management
const sessionStore = new SqliteSessionStore();
app.use(session({
  store: sessionStore,
  secret: config.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  name: 'cybershield.sid',
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.IS_PROD,
    maxAge: 2 * 60 * 60 * 1000 // 2 hours
  }
}));

// Load User Profile & CSRF Protection
app.use(loadUser);
app.use(verifyCsrf);

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    platform: 'CyberShield Digital Forensics & Cybercrime Investigation Platform',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Mount Feature Routers
app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/forensics', forensicsRoutes);
app.use('/api/security-lab', securityLabRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stats', statsRoutes);

// Serve static frontend assets if built (production deployment support)
const fs = require('fs');
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Global 404 Handler for undefined API routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `API route '${req.method} ${req.originalUrl}' does not exist.`
  });
});

// Centralized Error Handling Middleware
// Prevents stack trace disclosure and logs security anomalies
app.use((err, req, res, next) => {
  console.error('[SERVER_ERROR]', err);

  // Multer File Upload Errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: 'File size limit exceeded: Maximum allowed upload size is 10 MB.'
    });
  }

  if (err.code === 'INVALID_FILE_EXTENSION' || err.code === 'INVALID_MIME_TYPE') {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }

  // JSON Body Syntax Error
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'Malformed JSON payload.'
    });
  }

  // Generic Secure Internal Error (stack traces are kept in server logs only)
  res.status(err.status || 500).json({
    success: false,
    error: config.IS_PROD
      ? 'An unexpected internal error occurred. Please contact the security administrator.'
      : (err.message || 'Internal Server Error')
  });
});

module.exports = app;
