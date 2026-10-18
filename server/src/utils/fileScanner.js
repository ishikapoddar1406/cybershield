const crypto = require('crypto');
const path = require('path');

// Strict safe evidence allowlist from CyberShield
const ALLOWED_EXTENSIONS = new Set([
  '.txt', '.log', '.csv', '.eml',
  '.pdf', '.png', '.jpg', '.jpeg',
  '.pcap', '.pcapng'
]);

// Known dangerous executable and script extensions
const DANGEROUS_EXTENSIONS = new Set([
  '.exe', '.dll', '.bat', '.cmd', '.sh', '.bash', '.ps1', '.vbs', '.vbe',
  '.js', '.jse', '.wsf', '.wsh', '.msi', '.scr', '.pif', '.com', '.hta',
  '.cpl', '.jar', '.php', '.php3', '.php4', '.phtml', '.asp', '.aspx',
  '.jsp', '.py', '.rb', '.pl', '.elf', '.bin', '.so', '.dylib', '.apk'
]);

function calculateEntropy(buffer) {
  if (!buffer || buffer.length === 0) return 0;
  const freq = new Array(256).fill(0);
  for (let i = 0; i < buffer.length; i++) {
    freq[buffer[i]]++;
  }
  let entropy = 0;
  for (let i = 0; i < 256; i++) {
    if (freq[i] > 0) {
      const p = freq[i] / buffer.length;
      entropy -= p * Math.log2(p);
    }
  }
  return parseFloat(entropy.toFixed(3));
}

function scanFileBuffer(file) {
  const { originalname, buffer, mimetype, size } = file;
  const ext = path.extname(originalname).toLowerCase();
  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
  const md5 = crypto.createHash('md5').update(buffer).digest('hex');
  const entropy = calculateEntropy(buffer);

  const hexSignature = buffer.slice(0, 8).toString('hex').toUpperCase();
  const asciiHeader = buffer.slice(0, 16).toString('ascii').replace(/[^\x20-\x7E]/g, '.');

  const findings = [];
  let riskScore = 0; // 0 to 100
  let isMalicious = false;
  let isSuspicious = false;

  // 1. Extension inspection
  if (DANGEROUS_EXTENSIONS.has(ext)) {
    isMalicious = true;
    riskScore = Math.max(riskScore, 90);
    findings.push({
      category: 'Extension Analysis',
      status: 'FAIL',
      severity: 'CRITICAL',
      title: `High-Risk Executable / Script Extension (${ext})`,
      detail: `Files with extension '${ext}' can directly execute unauthorized arbitrary code on host systems or servers.`
    });
  } else if (!ALLOWED_EXTENSIONS.has(ext)) {
    isSuspicious = true;
    riskScore = Math.max(riskScore, 50);
    findings.push({
      category: 'Extension Analysis',
      status: 'WARN',
      severity: 'MEDIUM',
      title: `Non-Approved Evidentiary Format (${ext || 'no extension'})`,
      detail: `Extension '${ext}' is not part of the standard CyberShield forensics allowlist.`
    });
  } else {
    findings.push({
      category: 'Extension Analysis',
      status: 'PASS',
      severity: 'LOW',
      title: `Approved Evidence Extension (${ext})`,
      detail: `File extension '${ext}' is on the permitted non-executable forensic evidence allowlist.`
    });
  }

  // 2. Double extension detection (e.g. sample.pdf.exe, image.png.sh)
  const dotCount = (originalname.match(/\./g) || []).length;
  if (dotCount > 1) {
    const parts = originalname.split('.');
    const penultimate = `.${parts[parts.length - 2].toLowerCase()}`;
    if (ALLOWED_EXTENSIONS.has(penultimate) && DANGEROUS_EXTENSIONS.has(ext)) {
      isMalicious = true;
      riskScore = Math.max(riskScore, 95);
      findings.push({
        category: 'Evasion Detection',
        status: 'FAIL',
        severity: 'CRITICAL',
        title: 'Double Extension Masking Technique',
        detail: `The file disguises a dangerous '${ext}' payload behind a benign '${penultimate}' document label.`
      });
    }
  }

  // 3. Magic Bytes (File Signature) Analysis & Camouflage Detection
  const isPE = buffer.length >= 2 && buffer[0] === 0x4D && buffer[1] === 0x5A; // MZ
  const isELF = buffer.length >= 4 && buffer[0] === 0x7F && buffer[1] === 0x45 && buffer[2] === 0x4C && buffer[3] === 0x46; // .ELF
  const isPDF = buffer.length >= 4 && buffer.slice(0, 4).toString('ascii') === '%PDF';
  const isPNG = buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
  const isJPG = buffer.length >= 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;

  if (isPE) {
    isMalicious = true;
    riskScore = Math.max(riskScore, 95);
    findings.push({
      category: 'Magic Bytes Analysis',
      status: 'FAIL',
      severity: 'CRITICAL',
      title: 'Windows Executable Binary Header (MZ / PE32)',
      detail: ext !== '.exe' && ext !== '.dll'
        ? `SPOOFED FILE WARNING: This file claims to be '${ext}' but internally contains a Windows PE binary executable signature (MZ / 4D 5A)!`
        : 'Confirmed Windows Portable Executable (MZ) binary file header.'
    });
  } else if (isELF) {
    isMalicious = true;
    riskScore = Math.max(riskScore, 95);
    findings.push({
      category: 'Magic Bytes Analysis',
      status: 'FAIL',
      severity: 'CRITICAL',
      title: 'Linux ELF Executable Header',
      detail: 'File contains native Linux ELF compiled binary header (7F 45 4C 46).'
    });
  } else if (isPDF && ext === '.pdf') {
    findings.push({
      category: 'Magic Bytes Analysis',
      status: 'PASS',
      severity: 'LOW',
      title: 'Valid PDF Document Signature',
      detail: 'Header contains valid Adobe PDF specification signature (%PDF).'
    });
  } else if (isPNG && ext === '.png') {
    findings.push({
      category: 'Magic Bytes Analysis',
      status: 'PASS',
      severity: 'LOW',
      title: 'Valid PNG Image Signature',
      detail: 'Header matches authentic Portable Network Graphics 8-byte magic sequence.'
    });
  } else if (isJPG && (ext === '.jpg' || ext === '.jpeg')) {
    findings.push({
      category: 'Magic Bytes Analysis',
      status: 'PASS',
      severity: 'LOW',
      title: 'Valid JPEG Image Signature',
      detail: 'Header matches authentic JPEG SOI marker (FF D8 FF).'
    });
  } else if (['.txt', '.log', '.csv', '.eml'].includes(ext)) {
    let nonPrintableCount = 0;
    const sampleLen = Math.min(buffer.length, 1024);
    for (let i = 0; i < sampleLen; i++) {
      const b = buffer[i];
      if (b !== 9 && b !== 10 && b !== 13 && (b < 32 || b > 126)) {
        nonPrintableCount++;
      }
    }
    if (nonPrintableCount / sampleLen > 0.3) {
      isSuspicious = true;
      riskScore = Math.max(riskScore, 65);
      findings.push({
        category: 'Binary Heuristics',
        status: 'WARN',
        severity: 'MEDIUM',
        title: 'Anomalous Binary Density in Text Evidence',
        detail: 'High concentration of non-printable control characters detected inside a file labeled as plaintext.'
      });
    } else {
      findings.push({
        category: 'Content Structure',
        status: 'PASS',
        severity: 'LOW',
        title: 'Valid Plaintext Evidence Stream',
        detail: 'Character distribution aligns with human-readable text logs.'
      });
    }
  }

  // 4. Content inspection (Heuristic signatures & script keywords)
  const sampleText = buffer.slice(0, 100 * 1024).toString('utf-8');

  // EICAR Antivirus Test Signature
  if (sampleText.includes('EICAR-STANDARD-ANTIVIRUS-TEST-FILE')) {
    isMalicious = true;
    riskScore = 100;
    findings.push({
      category: 'Signature Match',
      status: 'FAIL',
      severity: 'CRITICAL',
      title: 'EICAR Standard Antivirus Test Signature Detected',
      detail: 'Known standard malware detection benchmark sequence (EICAR) verified.'
    });
  }

  // Web shell & Command Injection signatures
  const webShellPatterns = [
    { pattern: /eval\s*\(\s*(base64_decode|gzinflate|\$_POST|\$_GET)/i, label: 'PHP Obfuscated Web Shell Evaluator' },
    { pattern: /passthru|shell_exec|system\s*\(\s*\$_(GET|POST|REQUEST)/i, label: 'Unsanitized Remote Command Execution Function' },
    { pattern: /powershell(\.exe)?\s+(-(enc|encodedcommand)|-w\s+hidden)/i, label: 'Obfuscated PowerShell Execution Trigger' },
    { pattern: /<script[\s\S]*?>[\s\S]*?<\/script>/i, label: 'Embedded Executable Web Script / XSS Payload' },
    { pattern: /\/bin\/sh|\/bin\/bash/i, label: 'Unix Shell Binary Invocation' }
  ];

  for (const { pattern, label } of webShellPatterns) {
    if (pattern.test(sampleText)) {
      if (['.html', '.php', '.sh', '.py', '.js'].includes(ext) || ext === '.txt') {
        isMalicious = true;
        riskScore = Math.max(riskScore, 85);
        findings.push({
          category: 'Heuristic Payload Scan',
          status: 'FAIL',
          severity: 'HIGH',
          title: `Suspicious Pattern: ${label}`,
          detail: 'Found signature indicative of web shells or remote command execution.'
        });
      }
    }
  }

  // 5. Entropy evaluation
  let entropyLevel = 'Normal';
  if (entropy > 7.3 && buffer.length > 512) {
    entropyLevel = 'High (Packed / Encrypted)';
    if (!['.png', '.jpg', '.jpeg', '.pdf', '.pcap'].includes(ext)) {
      isSuspicious = true;
      riskScore = Math.max(riskScore, 60);
      findings.push({
        category: 'Entropy Analysis',
        status: 'WARN',
        severity: 'MEDIUM',
        title: `High Shannon Entropy (${entropy} / 8.0)`,
        detail: 'Entropy above 7.3 indicates packed code, encrypted payloads, or obfuscated malware.'
      });
    }
  } else if (entropy < 1.5) {
    entropyLevel = 'Very Low (Uniform / Padding)';
  }

  // Determine Final Verdict
  let verdict = 'SAFE';
  let verdictLabel = 'Safe & Approved';
  let recommendation = 'This file conforms to CyberShield\'s strict file integrity policies and contains no recognized executable or exploit signatures. It is safe for archival in the digital evidence vault.';

  if (isMalicious || riskScore >= 75) {
    verdict = 'MALICIOUS';
    verdictLabel = 'Malicious / Dangerous File Blocked';
    recommendation = 'DO NOT EXECUTE. This file violates server security rules (executable/script indicators or dangerous payload patterns) and is automatically blocked from server ingestion.';
  } else if (isSuspicious || riskScore >= 40) {
    verdict = 'SUSPICIOUS';
    verdictLabel = 'Suspicious / Format Review Required';
    recommendation = 'Use caution. The file exhibits unusual characteristics (unallowlisted format or high entropy) and requires manual investigator review prior to ingestion.';
  }

  const allowedByServerFilter = ALLOWED_EXTENSIONS.has(ext) && verdict === 'SAFE';

  return {
    filename: originalname,
    fileSize: formatBytes(size),
    fileSizeBytes: size,
    extension: ext || 'none',
    mimetype: mimetype || 'application/octet-stream',
    sha256,
    md5,
    entropy,
    entropyLevel,
    magicBytesHex: hexSignature,
    magicBytesAscii: asciiHeader,
    verdict,
    verdictLabel,
    riskScore,
    allowedByServerFilter,
    findings,
    recommendation
  };
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

module.exports = {
  scanFileBuffer,
  calculateEntropy,
  ALLOWED_EXTENSIONS,
  DANGEROUS_EXTENSIONS
};
