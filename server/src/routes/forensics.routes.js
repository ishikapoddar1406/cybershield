const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const config = require('../config/env');
const { getDatabase } = require('../db/database');
const { requireAuth } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { recordAudit } = require('../middleware/audit');
const { analyzeNetworkLogs } = require('../utils/networkAnalyzer');
const { parseEmailHeaders } = require('../utils/emailParser');
const { calculateSha256, calculateFileSha256 } = require('../utils/hash');
const { checkUrlReputation } = require('../utils/reputationChecker');

const router = express.Router();
const SAMPLES_DIR = path.resolve(__dirname, '../samples');

/* =========================================================================
   1. OFFLINE NETWORK FORENSICS LAB
   ========================================================================= */

/**
 * GET /api/forensics/network/samples
 * Returns list of built-in network log samples.
 */
router.get('/network/samples', (req, res) => {
  const samples = [
    {
      id: 'auth-bruteforce',
      filename: 'auth-bruteforce.log',
      title: 'SSH Authentication Brute-Force Log',
      description: 'Ten consecutive failed authentication attempts from IP 198.51.100.45 targeting administrative usernames.',
      category: 'Authentication Attack'
    },
    {
      id: 'port-scan',
      filename: 'port-scan.log',
      title: 'Multi-Port TCP SYN Reconnaissance Scan',
      description: 'Sequential probe from 203.0.113.88 targeting services across 10 distinct TCP ports.',
      category: 'Reconnaissance'
    },
    {
      id: 'syn-flood',
      filename: 'syn-flood.log',
      title: 'TCP SYN Flood Asymmetry Spike',
      description: 'High volume of SYN packets without ACK completion, indicating half-open resource exhaustion attack.',
      category: 'Denial of Service'
    },
    {
      id: 'dns-tunnel',
      filename: 'dns-tunnel.log',
      title: 'High-Entropy DNS Exfiltration / Tunneling Queries',
      description: 'Suspicious long, high-entropy subdomain requests indicative of data exfiltration or C2 beaconing.',
      category: 'Exfiltration'
    },
    {
      id: 'arp-spoof',
      filename: 'arp-spoof.log',
      title: 'ARP Cache Poisoning / Duplicate IP Binding',
      description: 'Multiple conflicting hardware MAC addresses claiming the same gateway IP address 192.168.1.1.',
      category: 'Man-in-the-Middle'
    }
  ];

  res.json({ success: true, samples });
});

/**
 * GET /api/forensics/network/samples/:id
 * Retrieves raw content of a specific sample log.
 */
router.get('/network/samples/:id', (req, res) => {
  const allowed = ['auth-bruteforce', 'port-scan', 'syn-flood', 'dns-tunnel', 'arp-spoof'];
  const sampleId = req.params.id;

  if (!allowed.includes(sampleId)) {
    return res.status(404).json({ success: false, error: 'Sample not found.' });
  }

  const filePath = path.join(SAMPLES_DIR, `${sampleId}.log`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, error: 'Sample file missing.' });
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  res.json({ success: true, sampleId, content });
});

/**
 * POST /api/forensics/network/analyze
 * Analyzes network log text supplied via JSON body or uploaded file.
 */
router.post('/network/analyze', (req, res) => {
  const { logContent } = req.body;
  if (!logContent || typeof logContent !== 'string') {
    return res.status(400).json({ success: false, error: 'Please supply raw log content for analysis.' });
  }

  const results = analyzeNetworkLogs(logContent);
  res.json({ success: true, ...results });
});

/* =========================================================================
   2. EMAIL FORENSICS LAB
   ========================================================================= */

/**
 * GET /api/forensics/email/samples
 * Returns list of built-in sample email headers.
 */
router.get('/email/samples', (req, res) => {
  const samples = [
    {
      id: 'phishing-bank',
      filename: 'phishing-bank.eml',
      title: 'Financial Phishing with Mismatched Reply-To & Failed SPF/DKIM',
      description: 'Forged bank security alert with display domain spoofing, suspicious Russian return path, and failed authentication.',
      category: 'Credential Phishing'
    },
    {
      id: 'ceo-fraud',
      filename: 'ceo-fraud.eml',
      title: 'Executive Wire Transfer Impersonation (CEO Fraud / BEC)',
      description: 'Deceptive display name using a personal freemail account requesting urgent confidential wire transfer.',
      category: 'Business Email Compromise'
    },
    {
      id: 'legitimate-company',
      filename: 'legitimate-company.eml',
      title: 'Legitimate Corporate Notification with Verified SPF/DKIM/DMARC',
      description: 'Properly signed notification with aligned From, Return-Path, DKIM-Signature, and passing DMARC policy.',
      category: 'Legitimate Baseline'
    }
  ];

  res.json({ success: true, samples });
});

/**
 * GET /api/forensics/email/samples/:id
 * Retrieves raw email header content of a specific sample.
 */
router.get('/email/samples/:id', (req, res) => {
  const allowed = ['phishing-bank', 'ceo-fraud', 'legitimate-company'];
  const sampleId = req.params.id;

  if (!allowed.includes(sampleId)) {
    return res.status(404).json({ success: false, error: 'Sample email not found.' });
  }

  const filePath = path.join(SAMPLES_DIR, `${sampleId}.eml`);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, error: 'Sample file missing.' });
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  res.json({ success: true, sampleId, content });
});

/**
 * POST /api/forensics/email/analyze
 * Parses and inspects raw email header text or uploaded EML.
 */
router.post('/email/analyze', (req, res) => {
  const { rawHeaders } = req.body;
  if (!rawHeaders || typeof rawHeaders !== 'string') {
    return res.status(400).json({ success: false, error: 'Please supply raw email headers for forensic analysis.' });
  }

  const results = parseEmailHeaders(rawHeaders);
  res.json({ success: true, ...results });
});

/* =========================================================================
   3. DIGITAL FINGERPRINTING LAB (TRANSPARENT & CONSENT-BASED)
   ========================================================================= */

/**
 * POST /api/forensics/fingerprint/generate
 * Educational demonstration of device/browser fingerprinting.
 * Strictly requires explicit user consent before processing.
 */
router.post('/fingerprint/generate', (req, res) => {
  const { consentGiven, clientData } = req.body;

  if (!consentGiven) {
    return res.status(403).json({
      success: false,
      error: 'Consent Required: Educational device fingerprinting cannot run without explicit user consent.'
    });
  }

  if (!clientData || typeof clientData !== 'object') {
    return res.status(400).json({
      success: false,
      error: 'Client parameters object is required.'
    });
  }

  // Canonicalize inputs for deterministic demonstration hash
  const canonicalString = [
    clientData.userAgent || '',
    clientData.language || '',
    clientData.platform || '',
    clientData.screenResolution || '',
    clientData.colorDepth || '',
    clientData.timezone || '',
    clientData.hardwareConcurrency || '',
    clientData.canvasHash || ''
  ].join('|');

  const demonstrationHash = calculateSha256(canonicalString);

  res.json({
    success: true,
    demonstrationHash,
    algorithm: 'SHA-256 over client-reported entropy vector',
    attributesAnalyzed: {
      userAgent: clientData.userAgent,
      platform: clientData.platform,
      language: clientData.language,
      screenResolution: clientData.screenResolution,
      colorDepth: `${clientData.colorDepth}-bit`,
      timezone: clientData.timezone,
      hardwareConcurrency: `${clientData.hardwareConcurrency} logical cores`,
      canvasHash: clientData.canvasHash || 'N/A'
    },
    educationalInsights: {
      entropyConcept: 'Browser fingerprinting aggregates disparate minor system attributes (screen resolution, installed fonts, canvas rendering quirks) to construct a high-entropy identifier without relying on cookies.',
      inaccuraciesAndSpoofability: 'User-Agent and screen properties are easily spoofed using browser extensions, proxy profiles, or automated headless drivers. A fingerprint does not reliably authenticate a natural person.',
      privacyCountermeasures: 'Modern browsers implement anti-fingerprinting defenses such as canvas noise injection (Brave, Firefox resistFingerprinting), User-Agent Client Hints standardization, and viewport quantization.',
      consentPrinciple: 'Under DPDP Act 2023 and GDPR, device fingerprinting constitutes personal data processing when used for tracking and requires clear lawful basis and transparent consent.'
    }
  });
});

/* =========================================================================
   4. REAL WEBSITE PHISHING & REPUTATION CHECK (GOOGLE & VIRUSTOTAL)
   ========================================================================= */

/**
 * GET /api/forensics/url/status
 * Informs the frontend which threat intelligence services are configured
 * without exposing raw API keys.
 */
router.get('/url/status', (req, res) => {
  const googleConfigured = Boolean(config.GOOGLE_SAFE_BROWSING_API_KEY && config.GOOGLE_SAFE_BROWSING_API_KEY.trim());
  const vtConfigured = Boolean(config.VIRUSTOTAL_API_KEY && config.VIRUSTOTAL_API_KEY.trim());

  res.json({
    success: true,
    services: {
      googleSafeBrowsing: {
        name: 'Google Safe Browsing Lookup API (v4)',
        configured: googleConfigured,
        description: 'Checks submitted URLs against Google known phishing, malware, and social engineering threat lists.'
      },
      virusTotal: {
        name: 'VirusTotal Threat Intelligence (v3)',
        configured: vtConfigured,
        description: 'Retrieves multi-vendor threat analysis reports and detection statistics for submitted URLs.'
      }
    }
  });
});

/**
 * POST /api/forensics/url/check
 * Validates, normalizes, and queries real reputation databases.
 * Strictly requires explicit user consent and prevents SSRF.
 */
router.post('/url/check', requireAuth, async (req, res) => {
  const { url, consentGiven } = req.body;

  if (!consentGiven) {
    return res.status(403).json({
      success: false,
      error: 'Consent Required: Checking external threat intelligence transmits indicator URLs to third-party databases (Google / VirusTotal). You must acknowledge and consent before submitting.'
    });
  }

  if (!url || typeof url !== 'string' || !url.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Please enter a valid website URL to check.'
    });
  }

  try {
    const result = await checkUrlReputation(url);
    const db = getDatabase();

    const checkId = `URL-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const now = new Date().toISOString();

    const insertStmt = db.prepare(`
      INSERT INTO url_reputation_checks (
        id, incident_id, url, domain, status, google_result, virustotal_result,
        heuristic_warnings, checked_by_id, checked_by_username, checked_at, saved_to_case, disclaimer
      ) VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    `);

    insertStmt.run(
      checkId,
      result.normalizedUrl,
      result.domain,
      result.overallStatus,
      JSON.stringify(result.reputationSources.googleSafeBrowsing),
      JSON.stringify(result.reputationSources.virusTotal),
      JSON.stringify(result.heuristicWarnings),
      req.user.id,
      req.user.username,
      now,
      result.disclaimer
    );

    recordAudit(req, {
      event_type: 'URL_REPUTATION_CHECK',
      severity: result.overallStatus === 'Known Threat Found' ? 'SECURITY_ALERT' : 'INFO',
      description: `URL reputation check on '${result.domain}': Result=${result.overallStatus}`,
      status: 'SUCCESS',
      details: {
        checkId,
        url: result.normalizedUrl,
        domain: result.domain,
        overallStatus: result.overallStatus,
        googleStatus: result.reputationSources.googleSafeBrowsing.status,
        vtStatus: result.reputationSources.virusTotal.status
      }
    });

    res.json({
      success: true,
      checkId,
      ...result
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * POST /api/forensics/url/save-to-case
 * Saves a completed check to an investigation case.
 * Attaches an investigation note and generates a verifiable evidence artifact with SHA-256 digest.
 */
router.post('/url/save-to-case', requireAuth, async (req, res) => {
  const { checkId, incidentId, notes } = req.body;

  if (!checkId || !incidentId) {
    return res.status(400).json({
      success: false,
      error: 'Both checkId and incidentId are required to associate reputation record with a case.'
    });
  }

  const db = getDatabase();

  const incident = db.prepare('SELECT id, title, reporter_id FROM incidents WHERE id = ?').get(incidentId);
  if (!incident) {
    return res.status(404).json({ success: false, error: 'Target incident case not found.' });
  }

  // Reporter authorization boundary check
  if (req.user.role === 'reporter' && incident.reporter_id !== req.user.id) {
    return res.status(403).json({ success: false, error: 'Access Denied: You cannot attach reputation reports to unowned cases.' });
  }

  const check = db.prepare('SELECT * FROM url_reputation_checks WHERE id = ?').get(checkId);
  if (!check) {
    return res.status(404).json({ success: false, error: 'Reputation check record not found.' });
  }

  const now = new Date().toISOString();

  // 1. Update url_reputation_checks record
  db.prepare(`
    UPDATE url_reputation_checks 
    SET incident_id = ?, saved_to_case = 1 
    WHERE id = ?
  `).run(incidentId, checkId);

  // 2. Insert formal investigation note
  const noteId = `NOTE-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const googleData = JSON.parse(check.google_result || '{}');
  const vtData = JSON.parse(check.virustotal_result || '{}');

  const noteContent = `[URL Threat Reputation Analysis - External Provider Report]\n` +
    `Checked URL: ${check.url}\n` +
    `Domain: ${check.domain}\n` +
    `Overall Assessment: ${check.status}\n` +
    `Google Safe Browsing: ${googleData.status || 'N/A'} - ${googleData.message || 'No details'}\n` +
    `VirusTotal: ${vtData.status || 'N/A'} - ${vtData.message || 'No details'}\n` +
    (notes ? `Investigator Note: ${notes}\n` : '') +
    `Checked By: ${req.user.full_name} (@${req.user.username}) at ${now}\n\n` +
    `DISCLAIMER: External reputation data represents third-party threat listings at query time. It does not constitute conclusive digital evidence.`;

  db.prepare(`
    INSERT INTO investigation_notes (id, incident_id, author_id, note_type, content, created_at)
    VALUES (?, ?, ?, 'observation', ?, ?)
  `).run(noteId, incidentId, req.user.id, noteContent, now);

  // 3. Generate verifiable digital evidence artifact file with SHA-256 digest
  let evidenceId = null;
  try {
    const artifactData = {
      recordType: 'URL_REPUTATION_FORENSIC_REPORT',
      checkId: check.id,
      incidentId,
      url: check.url,
      domain: check.domain,
      status: check.status,
      checkedAt: check.checked_at,
      recordedAt: now,
      investigator: {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role
      },
      sources: {
        googleSafeBrowsing: googleData,
        virusTotal: vtData
      },
      heuristicWarnings: JSON.parse(check.heuristic_warnings || '[]'),
      disclaimer: check.disclaimer
    };

    const evidenceFilename = `reputation-${check.domain.replace(/[^a-zA-Z0-9.-]/g, '_')}-${check.id}.json`;
    const safeStoredFilename = `${crypto.randomUUID()}.json`;
    const artifactPath = path.join(config.STORAGE_DIR, safeStoredFilename);

    fs.writeFileSync(artifactPath, JSON.stringify(artifactData, null, 2), 'utf-8');
    const sha256 = await calculateFileSha256(artifactPath);
    const stat = fs.statSync(artifactPath);

    evidenceId = `EVD-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    db.prepare(`
      INSERT INTO evidence (
        id, incident_id, original_filename, safe_stored_filename, file_path,
        file_size, mime_type, file_extension, sha256_hash, uploader_id,
        description, evidence_type, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'application/json', '.json', ?, ?, ?, 'text', 'Verified', ?)
    `).run(
      evidenceId,
      incidentId,
      evidenceFilename,
      safeStoredFilename,
      artifactPath,
      stat.size,
      sha256,
      req.user.id,
      `URL Reputation Report for ${check.domain} (${check.status})`,
      now
    );

    // 4. Log initial Chain of Custody for the evidence artifact
    const cocId = `COC-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    db.prepare(`
      INSERT INTO chain_of_custody (
        id, evidence_id, actor_id, actor_name, actor_role, action, timestamp,
        hash_at_event, integrity_status, notes
      ) VALUES (?, ?, ?, ?, ?, 'ACQUIRED_URL_REPUTATION_REPORT', ?, ?, 'Verified', ?)
    `).run(
      cocId,
      evidenceId,
      req.user.id,
      req.user.full_name,
      req.user.role,
      now,
      sha256,
      `Acquired external threat reputation report for ${check.domain} and registered SHA-256 fingerprint.`
    );
  } catch (artifactErr) {
    console.error('[URL_ARTIFACT_ERROR]', artifactErr.message);
  }

  recordAudit(req, {
    event_type: 'URL_REPUTATION_SAVED_TO_CASE',
    severity: 'INFO',
    description: `Saved URL reputation check '${checkId}' for '${check.domain}' to case '${incidentId}'`,
    status: 'SUCCESS',
    details: { checkId, incidentId, noteId, evidenceId }
  });

  res.json({
    success: true,
    message: `Reputation check successfully saved to case ${incidentId}. An investigation note and a verified forensic evidence artifact have been recorded.`,
    checkId,
    incidentId,
    noteId,
    evidenceId
  });
});

/**
 * GET /api/forensics/url/case/:incidentId
 * Retrieves URL reputation checks linked to an incident case.
 */
router.get('/url/case/:incidentId', requireAuth, (req, res) => {
  const db = getDatabase();
  const incident = db.prepare('SELECT id, reporter_id FROM incidents WHERE id = ?').get(req.params.incidentId);

  if (!incident) {
    return res.status(404).json({ success: false, error: 'Incident case not found.' });
  }

  if (req.user.role === 'reporter' && incident.reporter_id !== req.user.id) {
    return res.status(403).json({ success: false, error: 'Access Denied.' });
  }

  const checks = db.prepare(`
    SELECT * FROM url_reputation_checks
    WHERE incident_id = ?
    ORDER BY checked_at DESC
  `).all(req.params.incidentId);

  res.json({
    success: true,
    count: checks.length,
    checks: checks.map(c => ({
      ...c,
      google_result: JSON.parse(c.google_result || '{}'),
      virustotal_result: JSON.parse(c.virustotal_result || '{}'),
      heuristic_warnings: JSON.parse(c.heuristic_warnings || '[]')
    }))
  });
});

module.exports = router;
