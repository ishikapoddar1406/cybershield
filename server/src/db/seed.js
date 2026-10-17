const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { getDatabase } = require('./database');
const config = require('../config/env');
const { calculateFileSha256 } = require('../utils/hash');

async function seed() {
  console.log('[SEED] Initializing CyberShield platform database with fictional demo data...');
  const db = getDatabase();

  // Clear existing data for pristine test environment
  db.exec('DELETE FROM chain_of_custody;');
  db.exec('DELETE FROM evidence;');
  db.exec('DELETE FROM investigation_notes;');
  db.exec('DELETE FROM url_reputation_checks;');
  db.exec('DELETE FROM incidents;');
  db.exec('DELETE FROM sessions;');
  db.exec('DELETE FROM audit_logs;');
  db.exec('DELETE FROM users;');

  const now = new Date().toISOString();

  // 1. Seed Accounts
  // Passwords meet strict policy: >= 10 chars, upper, lower, number, special char
  const adminHash = await bcrypt.hash('Admin@CyberShield2026!', 12);
  const investigatorHash = await bcrypt.hash('Investigator@2026!', 12);
  const reporterHash = await bcrypt.hash('Reporter@2026!', 12);
  const testUserHash = await bcrypt.hash('TestUser@2026!', 12);

  const adminId = 'USR-ADM-001';
  const investigatorId = 'USR-INV-101';
  const reporterId = 'USR-REP-201';
  const testUserId = 'USR-TST-301';

  const userStmt = db.prepare(`
    INSERT INTO users (
      id, username, email, password_hash, role,
      full_name, badge_number, totp_secret, totp_enabled,
      failed_login_attempts, lockout_until, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, ?, ?)
  `);

  // Admin Account (MFA ready)
  userStmt.run(adminId, 'admin', 'admin@cybershield.org', adminHash, 'admin', 'Chief Investigator Dr. Elena Vance', 'CS-ADM-001', 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP', 0, now, now);
  
  // Investigator Account
  userStmt.run(investigatorId, 'investigator1', 'investigator1@cybershield.org', investigatorHash, 'investigator', 'Forensic Inspector Marcus Reid', 'CS-INV-101', 'JBSWY3DPEHPK3PXQJBSWY3DPEHPK3PXQ', 0, now, now);
  
  // Reporter Account
  userStmt.run(reporterId, 'reporter1', 'reporter1@enterprise.org', reporterHash, 'reporter', 'Priya Sharma (Security Analyst)', 'CS-REP-201', null, 0, now, now);
  
  // Test Account (for lockout and rate-limiting tests)
  userStmt.run(testUserId, 'testuser', 'testuser@cybershield.test', testUserHash, 'reporter', 'Automated Lab Tester', 'CS-TST-000', null, 0, now, now);

  console.log('[SEED] Demo accounts created:');
  console.log('   - admin / Admin@CyberShield2026! (Role: Administrator)');
  console.log('   - investigator1 / Investigator@2026! (Role: Forensic Investigator)');
  console.log('   - reporter1 / Reporter@2026! (Role: Incident Reporter)');
  console.log('   - testuser / TestUser@2026! (Role: Lab Test Account)');

  // 2. Seed Fictional Incidents
  const incStmt = db.prepare(`
    INSERT INTO incidents (
      id, title, description, category, severity, status,
      reporter_id, assigned_investigator_id, reported_ip,
      incident_date, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  incStmt.run(
    'CASE-2026-001',
    'Financial Phishing & Credential Harvester Campaign',
    'Multiple employees in Finance received deceptive emails claiming urgent account lockouts with spoofed bank domains. At least two victims submitted enterprise SSO credentials on an external credential harvesting landing page.',
    'phishing',
    'high',
    'Investigating',
    reporterId,
    investigatorId,
    '198.51.100.99',
    '2026-10-15',
    '2026-10-15T09:30:00Z',
    now
  );

  incStmt.run(
    'CASE-2026-002',
    'Executive Impersonation on Professional Social Network',
    'An unauthorized profile impersonating our Chief Operations Officer was established on LinkedIn. The actor reached out to junior procurement staff requesting emergency direct wire authorization.',
    'social_media_impersonation',
    'medium',
    'Under Review',
    reporterId,
    null,
    '203.0.113.44',
    '2026-10-16',
    '2026-10-16T14:15:00Z',
    now
  );

  incStmt.run(
    'CASE-2026-003',
    'Core Switch Multi-Port Reconnaissance & DNS Exfiltration',
    'Perimeter firewall dropped rapid sequential probes targeting ports 21-8080 from an external IP. Correlated DNS recursive resolver logs demonstrated high-entropy TXT lookups against unauthorized subdomains.',
    'suspicious_network_activity',
    'critical',
    'Investigating',
    reporterId,
    investigatorId,
    '203.0.113.88',
    '2026-10-16',
    '2026-10-16T18:40:00Z',
    now
  );

  incStmt.run(
    'CASE-2026-004',
    'Staged Ransomware EML Attachment Neutralized',
    'Malicious macro-enabled payload intercepted by mail quarantine. File contained stage-1 droppers targeting Volume Shadow Copies. Host was isolated before lateral propagation.',
    'malware_incident',
    'critical',
    'Resolved',
    reporterId,
    investigatorId,
    '198.51.100.12',
    '2026-10-14',
    '2026-10-14T11:00:00Z',
    now
  );

  incStmt.run(
    'CASE-2026-005',
    'Unauthorized UPI Payment QR Redirection Attempt',
    'Retail POS payment terminal exhibited substituted static QR sticker routing customer UPI settlements to an unverified private VPA. Cashier noticed payee discrepancy.',
    'payment_fraud',
    'high',
    'Submitted',
    reporterId,
    null,
    null,
    '2026-10-17',
    '2026-10-17T08:00:00Z',
    now
  );

  // 3. Seed Investigation Notes
  const noteStmt = db.prepare(`
    INSERT INTO investigation_notes (id, incident_id, author_id, note_type, content, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  noteStmt.run(
    'NOTE-001',
    'CASE-2026-001',
    investigatorId,
    'action_taken',
    'Quarantined all inbound messages matching Subject pattern. Revoked session tokens for affected finance employees and initiated forced password rotation with hardware key re-binding.',
    '2026-10-15T11:00:00Z'
  );

  noteStmt.run(
    'NOTE-002',
    'CASE-2026-001',
    investigatorId,
    'lead',
    'Credential harvest domain resolved to hosting infrastructure in ASN 4134. Submitted takedown request to registrar abuse contact.',
    '2026-10-15T14:30:00Z'
  );

  noteStmt.run(
    'NOTE-003',
    'CASE-2026-003',
    investigatorId,
    'hypothesis',
    'Pattern indicates automated reconnaissance followed by DNS tunneling beaconing. Query entropy calculation is 4.15, typical of Base32-encoded chunk exfiltration.',
    '2026-10-16T20:00:00Z'
  );

  // 4. Seed Evidence Files into Storage and Database
  const samplesDir = path.resolve(__dirname, '../samples');
  const evidenceSeeds = [
    {
      caseId: 'CASE-2026-001',
      sampleFile: 'phishing-bank.eml',
      originalName: 'phishing_sample_case_001.eml',
      type: 'email',
      description: 'Raw email headers and body of fraudulent bank alert email containing forged From and Russian Return-Path.'
    },
    {
      caseId: 'CASE-2026-003',
      sampleFile: 'port-scan.log',
      originalName: 'firewall_drop_portscan.log',
      type: 'log',
      description: 'Firewall drop logs demonstrating sequential TCP SYN probes targeting ports 21 through 8080.'
    },
    {
      caseId: 'CASE-2026-003',
      sampleFile: 'dns-tunnel.log',
      originalName: 'dns_named_query_exfil.log',
      type: 'network_capture',
      description: 'BIND DNS query log capturing high-entropy subdomain lookups indicating data tunneling.'
    }
  ];

  for (const item of evidenceSeeds) {
    const srcPath = path.join(samplesDir, item.sampleFile);
    if (fs.existsSync(srcPath)) {
      const ext = path.extname(item.originalName);
      const safeFilename = `${crypto.randomUUID()}${ext}`;
      const destPath = path.join(config.STORAGE_DIR, safeFilename);

      fs.copyFileSync(srcPath, destPath);
      const stat = fs.statSync(destPath);
      const sha256 = await calculateFileSha256(destPath);
      const evdId = `EVD-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

      db.prepare(`
        INSERT INTO evidence (
          id, incident_id, original_filename, safe_stored_filename,
          file_path, file_size, mime_type, file_extension,
          sha256_hash, uploader_id, description, evidence_type,
          status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'text/plain', ?, ?, ?, ?, ?, 'Verified', ?)
      `).run(
        evdId,
        item.caseId,
        item.originalName,
        safeFilename,
        destPath,
        stat.size,
        ext,
        sha256,
        investigatorId,
        item.description,
        item.type,
        now
      );

      // Initial Chain of Custody
      db.prepare(`
        INSERT INTO chain_of_custody (
          id, evidence_id, actor_id, actor_name, actor_role,
          action, timestamp, hash_at_event, integrity_status, notes
        ) VALUES (?, ?, ?, ?, ?, 'COLLECTION_UPLOAD', ?, ?, 'INTACT', ?)
      `).run(
        `COC-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
        evdId,
        investigatorId,
        'Inspector Marcus Reid',
        'investigator',
        now,
        sha256,
        `Initial evidence intake. SHA-256 cryptographic digest verified: ${sha256}`
      );
    }
  }

  // 5. Seed Security Audit Logs
  const auditStmt = db.prepare(`
    INSERT INTO audit_logs (
      id, timestamp, actor_id, actor_username, actor_role,
      ip_address, user_agent, event_type, severity,
      description, details, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  auditStmt.run(
    'AUD-INIT-001',
    '2026-10-15T09:00:00Z',
    adminId,
    'admin',
    'admin',
    '127.0.0.1',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'SYSTEM_INITIALIZATION',
    'INFO',
    'CyberShield platform database initialized with security audit policy.',
    '{"mode": "secure", "sqlite": "WAL"}',
    'SUCCESS'
  );

  auditStmt.run(
    'AUD-INIT-002',
    '2026-10-15T09:10:00Z',
    investigatorId,
    'investigator1',
    'investigator',
    '192.168.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    'LOGIN_SUCCESS',
    'INFO',
    'Investigator marcus.reid authenticated successfully.',
    null,
    'SUCCESS'
  );

  auditStmt.run(
    'AUD-INIT-003',
    '2026-10-16T18:45:00Z',
    null,
    'unknown',
    null,
    '203.0.113.88',
    'Mozilla/5.0 (compatible; Nmap Scripting Engine)',
    'RATE_LIMIT_TRIGGERED',
    'WARNING',
    'Authentication endpoint rate limit reached from external reconnaissance IP 203.0.113.88',
    '{"attempts": 5, "window": "300s"}',
    'DENIED'
  );

  console.log('[SEED] Database seeding complete! 5 incidents, 3 evidence files, notes, and audit logs populated.');
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[SEED_ERROR]', err);
      process.exit(1);
    });
}

module.exports = { seed };
