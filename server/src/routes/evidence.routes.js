const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { getDatabase } = require('../db/database');
const { requireAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { recordAudit } = require('../middleware/audit');
const { calculateFileSha256, calculateSha256 } = require('../utils/hash');

const router = express.Router();

/**
 * Determine high-level evidence type from extension
 */
function inferEvidenceType(ext) {
  const e = ext.toLowerCase();
  if (['.log', '.txt'].includes(e)) return 'log';
  if (['.eml'].includes(e)) return 'email';
  if (['.pcap', '.pcapng'].includes(e)) return 'network_capture';
  if (['.pdf', '.csv'].includes(e)) return 'document';
  if (['.png', '.jpg', '.jpeg'].includes(e)) return 'image';
  return 'text';
}

/**
 * GET /api/evidence/case/:incidentId
 * Lists all evidence files attached to a case.
 */
router.get('/case/:incidentId', requireAuth, (req, res) => {
  const db = getDatabase();
  const incident = db.prepare('SELECT id, reporter_id FROM incidents WHERE id = ?').get(req.params.incidentId);
  if (!incident) {
    return res.status(404).json({ success: false, error: 'Incident not found.' });
  }

  // Reporter boundary
  if (req.user.role === 'reporter' && incident.reporter_id !== req.user.id) {
    return res.status(403).json({ success: false, error: 'Access Denied.' });
  }

  const items = db.prepare(`
    SELECT e.*, u.full_name as uploader_name, u.role as uploader_role
    FROM evidence e
    JOIN users u ON e.uploader_id = u.id
    WHERE e.incident_id = ?
    ORDER BY e.created_at DESC
  `).all(req.params.incidentId);

  res.json({ success: true, count: items.length, evidence: items });
});

/**
 * POST /api/evidence/upload
 * Accepts evidence file, checks allowlist, stores outside web root,
 * computes baseline SHA-256 hash, and logs initial Chain of Custody.
 */
router.post('/upload', requireAuth, (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      recordAudit(req, {
        event_type: 'FILE_UPLOAD_FAILED',
        severity: 'WARNING',
        description: `File upload failed: ${err.message}`,
        status: 'FAILURE'
      });
      return res.status(400).json({ success: false, error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No evidence file was uploaded.' });
    }

    const { incidentId, description } = req.body;
    if (!incidentId) {
      // Remove orphaned file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, error: 'Missing associated incident ID.' });
    }

    const db = getDatabase();
    const incident = db.prepare('SELECT id, reporter_id FROM incidents WHERE id = ?').get(incidentId);
    if (!incident) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, error: 'Associated incident does not exist.' });
    }

    // Reporter boundary
    if (req.user.role === 'reporter' && incident.reporter_id !== req.user.id) {
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ success: false, error: 'Access Denied: You cannot attach evidence to unowned cases.' });
    }

    try {
      // Cryptographically compute baseline SHA-256 hash from disk
      const sha256Hash = await calculateFileSha256(req.file.path);
      const ext = path.extname(req.file.originalname).toLowerCase();
      const evidenceType = inferEvidenceType(ext);
      const evidenceId = `EVD-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      const now = new Date().toISOString();

      // Store evidence metadata
      db.prepare(`
        INSERT INTO evidence (
          id, incident_id, original_filename, safe_stored_filename,
          file_path, file_size, mime_type, file_extension,
          sha256_hash, uploader_id, description, evidence_type,
          status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Verified', ?)
      `).run(
        evidenceId,
        incidentId,
        req.file.originalname,
        req.file.filename,
        req.file.path,
        req.file.size,
        req.file.mimetype,
        ext,
        sha256Hash,
        req.user.id,
        description || 'Forensic evidence item',
        evidenceType,
        now
      );

      // Create initial Chain of Custody entry
      const cocId = `COC-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
      db.prepare(`
        INSERT INTO chain_of_custody (
          id, evidence_id, actor_id, actor_name, actor_role,
          action, timestamp, hash_at_event, integrity_status, notes
        ) VALUES (?, ?, ?, ?, ?, 'COLLECTION_UPLOAD', ?, ?, 'INTACT', ?)
      `).run(
        cocId,
        evidenceId,
        req.user.id,
        req.user.full_name,
        req.user.role,
        now,
        sha256Hash,
        `Evidence file ingested. SHA-256 baseline computed: ${sha256Hash}. Stored securely as ${req.file.filename}.`
      );

      recordAudit(req, {
        event_type: 'EVIDENCE_UPLOAD_SUCCESS',
        severity: 'INFO',
        description: `Evidence '${req.file.originalname}' (${evidenceId}) attached to case '${incidentId}' by '${req.user.username}'`,
        status: 'SUCCESS',
        details: { evidenceId, sha256: sha256Hash, sizeBytes: req.file.size }
      });

      res.status(201).json({
        success: true,
        message: 'Evidence securely ingested and hashed.',
        evidence: {
          id: evidenceId,
          originalFilename: req.file.originalname,
          sha256Hash,
          fileSize: req.file.size,
          evidenceType,
          status: 'Verified'
        }
      });
    } catch (calcErr) {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ success: false, error: `Failed to compute evidence hash: ${calcErr.message}` });
    }
  });
});

/**
 * POST /api/evidence/:id/verify
 * Recalculates current SHA-256 hash on disk and compares with the baseline.
 * Detects tampering or file alteration immediately.
 */
router.post('/:id/verify', requireAuth, async (req, res) => {
  const db = getDatabase();
  const evidence = db.prepare('SELECT * FROM evidence WHERE id = ?').get(req.params.id);
  if (!evidence) {
    return res.status(404).json({ success: false, error: 'Evidence record not found.' });
  }

  // Reporter boundary
  const incident = db.prepare('SELECT reporter_id FROM incidents WHERE id = ?').get(evidence.incident_id);
  if (req.user.role === 'reporter' && incident?.reporter_id !== req.user.id) {
    return res.status(403).json({ success: false, error: 'Access Denied.' });
  }

  if (!fs.existsSync(evidence.file_path)) {
    return res.status(500).json({
      success: false,
      error: 'Evidence file is missing from secure storage volume.'
    });
  }

  try {
    const currentHash = await calculateFileSha256(evidence.file_path);
    const baselineHash = evidence.sha256_hash;
    const isIntact = (currentHash.toLowerCase() === baselineHash.toLowerCase());
    const now = new Date().toISOString();
    const cocId = `COC-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

    if (isIntact) {
      // Update status to Verified if previously compromised
      db.prepare("UPDATE evidence SET status = 'Verified' WHERE id = ?").run(evidence.id);

      db.prepare(`
        INSERT INTO chain_of_custody (
          id, evidence_id, actor_id, actor_name, actor_role,
          action, timestamp, hash_at_event, integrity_status, notes
        ) VALUES (?, ?, ?, ?, ?, 'HASH_VERIFICATION_SUCCESS', ?, ?, 'INTACT', ?)
      `).run(
        cocId,
        evidence.id,
        req.user.id,
        req.user.full_name,
        req.user.role,
        now,
        currentHash,
        `Integrity verification passed. Recalculated hash matches recorded baseline (${currentHash}).`
      );

      recordAudit(req, {
        event_type: 'EVIDENCE_INTEGRITY_VERIFIED',
        severity: 'INFO',
        description: `Evidence integrity verified for '${evidence.original_filename}' (${evidence.id}) by '${req.user.username}'`,
        status: 'SUCCESS',
        details: { evidenceId: evidence.id, hash: currentHash }
      });

      return res.json({
        success: true,
        verified: true,
        status: 'Verified',
        baselineHash,
        currentHash,
        message: 'Integrity Verification PASSED: Recalculated SHA-256 matches baseline perfectly.'
      });
    } else {
      // TAMPER DETECTED!
      db.prepare("UPDATE evidence SET status = 'Integrity Compromised' WHERE id = ?").run(evidence.id);

      db.prepare(`
        INSERT INTO chain_of_custody (
          id, evidence_id, actor_id, actor_name, actor_role,
          action, timestamp, hash_at_event, integrity_status, notes
        ) VALUES (?, ?, ?, ?, ?, 'TAMPER_DETECTED', ?, ?, 'COMPROMISED', ?)
      `).run(
        cocId,
        evidence.id,
        req.user.id,
        req.user.full_name,
        req.user.role,
        now,
        currentHash,
        `CRITICAL INTEGRITY BREACH: Disk file hash (${currentHash}) does NOT match original baseline (${baselineHash}). File has been modified or corrupted!`
      );

      recordAudit(req, {
        event_type: 'EVIDENCE_INTEGRITY_FAILED',
        severity: 'CRITICAL',
        description: `EVIDENCE TAMPERING DETECTED: '${evidence.original_filename}' (${evidence.id}) failed hash check!`,
        status: 'FAILURE',
        details: { evidenceId: evidence.id, expectedHash: baselineHash, actualHash: currentHash }
      });

      return res.status(200).json({
        success: true,
        verified: false,
        status: 'Integrity Compromised',
        baselineHash,
        currentHash,
        warning: 'CRITICAL FORENSIC WARNING: Cryptographic hash mismatch detected! Evidence file content does not match the baseline digest recorded during ingestion.'
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: `Verification failed: ${err.message}` });
  }
});

/**
 * POST /api/evidence/:id/simulate-tampering
 * Educational feature for lab demonstration: Modifies 1 bit of evidence on disk
 * so reviewers can test and observe immediate tamper detection.
 */
router.post('/:id/simulate-tampering', requireAuth, (req, res) => {
  // Only Investigators and Admins can trigger educational simulation
  if (!['admin', 'investigator'].includes(req.user.role)) {
    return res.status(403).json({ success: false, error: 'Forbidden: Insufficient privileges.' });
  }

  const db = getDatabase();
  const evidence = db.prepare('SELECT * FROM evidence WHERE id = ?').get(req.params.id);
  if (!evidence) {
    return res.status(404).json({ success: false, error: 'Evidence record not found.' });
  }

  if (!fs.existsSync(evidence.file_path)) {
    return res.status(500).json({ success: false, error: 'File not found on disk.' });
  }

  // Backup original content if not already backed up
  const backupPath = `${evidence.file_path}.original_backup`;
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(evidence.file_path, backupPath);
  }

  // Alter 1 byte / append a simulated tampering marker
  fs.appendFileSync(evidence.file_path, '\n[FORENSIC_ACADEMIC_TAMPER_SIMULATION_INJECTED]');

  const now = new Date().toISOString();
  const cocId = `COC-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;

  db.prepare(`
    INSERT INTO chain_of_custody (
      id, evidence_id, actor_id, actor_name, actor_role,
      action, timestamp, hash_at_event, integrity_status, notes
    ) VALUES (?, ?, ?, ?, ?, 'SIMULATED_TAMPER_INJECTION', ?, 'UNVERIFIED', 'MODIFIED_IN_LAB', ?)
  `).run(
    cocId,
    evidence.id,
    req.user.id,
    req.user.full_name,
    req.user.role,
    now,
    `Academic simulation triggered: single byte alteration injected to demonstrate SHA-256 failure detection.`
  );

  recordAudit(req, {
    event_type: 'TAMPER_SIMULATION_TRIGGERED',
    severity: 'WARNING',
    description: `Tamper simulation initiated for evidence '${evidence.id}' by '${req.user.username}'`,
    status: 'SUCCESS'
  });

  res.json({
    success: true,
    message: 'Tampering simulated: file on disk was modified. Click "Verify Integrity" to observe cryptographic detection.'
  });
});

/**
 * POST /api/evidence/:id/restore-original
 * Restores file from backup after simulation.
 */
router.post('/:id/restore-original', requireAuth, (req, res) => {
  if (!['admin', 'investigator'].includes(req.user.role)) {
    return res.status(403).json({ success: false, error: 'Forbidden.' });
  }

  const db = getDatabase();
  const evidence = db.prepare('SELECT * FROM evidence WHERE id = ?').get(req.params.id);
  if (!evidence) {
    return res.status(404).json({ success: false, error: 'Evidence not found.' });
  }

  const backupPath = `${evidence.file_path}.original_backup`;
  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, evidence.file_path);
  }

  db.prepare("UPDATE evidence SET status = 'Verified' WHERE id = ?").run(evidence.id);

  const now = new Date().toISOString();
  const cocId = `COC-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  db.prepare(`
    INSERT INTO chain_of_custody (
      id, evidence_id, actor_id, actor_name, actor_role,
      action, timestamp, hash_at_event, integrity_status, notes
    ) VALUES (?, ?, ?, ?, ?, 'RESTORE_ORIGINAL', ?, ?, 'INTACT', ?)
  `).run(
    cocId,
    evidence.id,
    req.user.id,
    req.user.full_name,
    req.user.role,
    now,
    evidence.sha256_hash,
    'Original pristine evidence file restored from secure lab backup.'
  );

  res.json({
    success: true,
    message: 'Original evidence file content restored. Baseline integrity re-established.'
  });
});

/**
 * GET /api/evidence/:id/chain-of-custody
 * Fetches complete chronological chain of custody for an evidence item.
 */
router.get('/:id/chain-of-custody', requireAuth, (req, res) => {
  const db = getDatabase();
  const evidence = db.prepare('SELECT id, incident_id, original_filename FROM evidence WHERE id = ?').get(req.params.id);
  if (!evidence) {
    return res.status(404).json({ success: false, error: 'Evidence not found.' });
  }

  const history = db.prepare(`
    SELECT * FROM chain_of_custody
    WHERE evidence_id = ?
    ORDER BY timestamp ASC
  `).all(evidence.id);

  res.json({
    success: true,
    evidenceId: evidence.id,
    originalFilename: evidence.original_filename,
    chainOfCustody: history
  });
});

/**
 * GET /api/evidence/:id/download
 * Secure download with Content-Disposition: attachment and X-Content-Type-Options: nosniff
 * Never executes files or serves as active scripts.
 */
router.get('/:id/download', requireAuth, (req, res) => {
  const db = getDatabase();
  const evidence = db.prepare('SELECT * FROM evidence WHERE id = ?').get(req.params.id);
  if (!evidence) {
    return res.status(404).json({ success: false, error: 'Evidence not found.' });
  }

  if (!fs.existsSync(evidence.file_path)) {
    return res.status(404).json({ success: false, error: 'File missing from storage repository.' });
  }

  // Record export / access in Chain of Custody
  const cocId = `COC-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO chain_of_custody (
      id, evidence_id, actor_id, actor_name, actor_role,
      action, timestamp, hash_at_event, integrity_status, notes
    ) VALUES (?, ?, ?, ?, ?, 'EVIDENCE_ACCESS_EXPORT', ?, ?, 'INTACT', ?)
  `).run(
    cocId,
    evidence.id,
    req.user.id,
    req.user.full_name,
    req.user.role,
    now,
    evidence.sha256_hash,
    `Evidence exported/downloaded for examination by '${req.user.username}' (${req.user.role}).`
  );

  recordAudit(req, {
    event_type: 'EVIDENCE_DOWNLOAD',
    severity: 'INFO',
    description: `Evidence '${evidence.original_filename}' (${evidence.id}) downloaded by '${req.user.username}'`,
    status: 'SUCCESS'
  });

  // Safe headers to prevent browser execution
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(evidence.original_filename)}"`);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Type', 'application/octet-stream');

  const fileStream = fs.createReadStream(evidence.file_path);
  fileStream.pipe(res);
});

/**
 * POST /api/evidence/hash-tool
 * Standalone cryptographic utility to compute SHA-256 for text or test files.
 */
router.post('/hash-tool', (req, res) => {
  const { text } = req.body;
  if (typeof text !== 'string') {
    return res.status(400).json({ success: false, error: 'Text string is required.' });
  }

  const hash = calculateSha256(text);
  res.json({
    success: true,
    inputLength: text.length,
    algorithm: 'SHA-256',
    hash
  });
});

module.exports = router;
