const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const config = require('../config/env');

// Ensure database and storage directories exist
const dbDir = path.dirname(config.DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
if (!fs.existsSync(config.STORAGE_DIR)) {
  fs.mkdirSync(config.STORAGE_DIR, { recursive: true });
}

let dbInstance = null;

function getDatabase(dbFilePath = config.DB_PATH) {
  if (dbInstance && dbFilePath === config.DB_PATH) {
    return dbInstance;
  }

  const db = new DatabaseSync(dbFilePath);
  
  // Pragmas for performance, durability, and referential integrity
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA synchronous = NORMAL;');

  initSchema(db);

  if (dbFilePath === config.DB_PATH) {
    dbInstance = db;
  }
  return db;
}

function initSchema(db) {
  db.exec(`
    -- Users table with role-based access, MFA status, and lockout tracking
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'investigator', 'reporter')),
      full_name TEXT NOT NULL,
      badge_number TEXT,
      totp_secret TEXT,
      totp_enabled INTEGER NOT NULL DEFAULT 0,
      last_used_totp_timestep INTEGER,
      failed_login_attempts INTEGER NOT NULL DEFAULT 0,
      lockout_until TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- Server-side session store
    CREATE TABLE IF NOT EXISTS sessions (
      sid TEXT PRIMARY KEY,
      user_id TEXT,
      csrf_token TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      data TEXT,
      created_at TEXT NOT NULL
    );

    -- Cybercrime Incidents table
    CREATE TABLE IF NOT EXISTS incidents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN (
        'phishing',
        'social_media_impersonation',
        'account_compromise',
        'payment_fraud',
        'identity_theft',
        'suspicious_network_activity',
        'malware_incident',
        'other'
      )),
      severity TEXT NOT NULL CHECK(severity IN ('low', 'medium', 'high', 'critical')),
      status TEXT NOT NULL CHECK(status IN ('Submitted', 'Under Review', 'Investigating', 'Resolved', 'Closed')),
      reporter_id TEXT NOT NULL,
      assigned_investigator_id TEXT,
      reported_ip TEXT,
      incident_date TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (reporter_id) REFERENCES users(id),
      FOREIGN KEY (assigned_investigator_id) REFERENCES users(id)
    );

    -- Formal Investigation Notes
    CREATE TABLE IF NOT EXISTS investigation_notes (
      id TEXT PRIMARY KEY,
      incident_id TEXT NOT NULL,
      author_id TEXT NOT NULL,
      note_type TEXT NOT NULL CHECK(note_type IN ('observation', 'lead', 'action_taken', 'hypothesis', 'conclusion')),
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE,
      FOREIGN KEY (author_id) REFERENCES users(id)
    );

    -- Digital Evidence Metadata
    CREATE TABLE IF NOT EXISTS evidence (
      id TEXT PRIMARY KEY,
      incident_id TEXT NOT NULL,
      original_filename TEXT NOT NULL,
      safe_stored_filename TEXT NOT NULL UNIQUE,
      file_path TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      mime_type TEXT NOT NULL,
      file_extension TEXT NOT NULL,
      sha256_hash TEXT NOT NULL,
      uploader_id TEXT NOT NULL,
      description TEXT,
      evidence_type TEXT NOT NULL CHECK(evidence_type IN ('log', 'email', 'network_capture', 'document', 'image', 'text')),
      status TEXT NOT NULL DEFAULT 'Verified' CHECK(status IN ('Verified', 'Integrity Compromised')),
      created_at TEXT NOT NULL,
      FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE,
      FOREIGN KEY (uploader_id) REFERENCES users(id)
    );

    -- Chain of Custody chronological tamper-evident log
    CREATE TABLE IF NOT EXISTS chain_of_custody (
      id TEXT PRIMARY KEY,
      evidence_id TEXT NOT NULL,
      actor_id TEXT NOT NULL,
      actor_name TEXT NOT NULL,
      actor_role TEXT NOT NULL,
      action TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      hash_at_event TEXT NOT NULL,
      integrity_status TEXT NOT NULL,
      notes TEXT,
      FOREIGN KEY (evidence_id) REFERENCES evidence(id) ON DELETE CASCADE,
      FOREIGN KEY (actor_id) REFERENCES users(id)
    );

    -- Security Audit Trail
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      actor_id TEXT,
      actor_username TEXT,
      actor_role TEXT,
      ip_address TEXT NOT NULL,
      user_agent TEXT NOT NULL,
      event_type TEXT NOT NULL,
      severity TEXT NOT NULL CHECK(severity IN ('INFO', 'WARNING', 'SECURITY_ALERT', 'CRITICAL')),
      description TEXT NOT NULL,
      details TEXT,
      status TEXT NOT NULL CHECK(status IN ('SUCCESS', 'DENIED', 'FAILURE'))
    );

    -- Real Website Phishing & Reputation Checks
    CREATE TABLE IF NOT EXISTS url_reputation_checks (
      id TEXT PRIMARY KEY,
      incident_id TEXT,
      url TEXT NOT NULL,
      domain TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('Known Threat Found', 'No Match Found', 'Could Not Check')),
      google_result TEXT,
      virustotal_result TEXT,
      heuristic_warnings TEXT,
      checked_by_id TEXT NOT NULL,
      checked_by_username TEXT NOT NULL,
      checked_at TEXT NOT NULL,
      saved_to_case INTEGER NOT NULL DEFAULT 0,
      disclaimer TEXT NOT NULL,
      FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE SET NULL,
      FOREIGN KEY (checked_by_id) REFERENCES users(id)
    );

    -- Optimized Indexes
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_incidents_reporter ON incidents(reporter_id);
    CREATE INDEX IF NOT EXISTS idx_incidents_assigned ON incidents(assigned_investigator_id);
    CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
    CREATE INDEX IF NOT EXISTS idx_evidence_incident ON evidence(incident_id);
    CREATE INDEX IF NOT EXISTS idx_chain_evidence ON chain_of_custody(evidence_id);
    CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_url_checks_incident ON url_reputation_checks(incident_id);
    CREATE INDEX IF NOT EXISTS idx_url_checks_checked_at ON url_reputation_checks(checked_at);
  `);

  // Safe migration for existing SQLite databases
  try {
    db.exec('ALTER TABLE users ADD COLUMN last_used_totp_timestep INTEGER;');
  } catch (err) {
    // Column already exists, safe to ignore
  }
}

module.exports = {
  getDatabase,
  initSchema
};
