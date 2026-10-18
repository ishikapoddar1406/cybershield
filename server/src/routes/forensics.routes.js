const express = require('express');
const fs = require('fs');
const path = require('path');
const { analyzeNetworkLogs } = require('../utils/networkAnalyzer');
const { parseEmailHeaders } = require('../utils/emailParser');

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
module.exports = router;

