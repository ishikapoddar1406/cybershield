const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const config = require('../config/env');
const { recordAudit } = require('./audit');

// Strict extension allowlist
const ALLOWED_EXTENSIONS = new Set([
  '.txt', '.log', '.csv', '.eml',
  '.pdf', '.png', '.jpg', '.jpeg',
  '.pcap', '.pcapng'
]);

// Map extensions to permissible MIME types
const ALLOWED_MIME_TYPES = new Set([
  'text/plain',
  'text/csv',
  'application/vnd.ms-excel',
  'message/rfc822',
  'application/pdf',
  'image/png',
  'image/jpeg',
  'application/vnd.tcpdump.pcap',
  'application/octet-stream'
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.STORAGE_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeStoredName = `${crypto.randomUUID()}${ext}`;
    cb(null, safeStoredName);
  }
});

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_EXTENSIONS.has(ext)) {
    recordAudit(req, {
      event_type: 'FILE_UPLOAD_REJECTED',
      severity: 'WARNING',
      description: `Disallowed file extension '${ext}' rejected for file '${file.originalname}'`,
      status: 'DENIED',
      details: { originalname: file.originalname, extension: ext }
    });

    const error = new Error(`File upload rejected: Extension '${ext}' is not permitted. Permitted types: TXT, LOG, CSV, EML, PDF, PNG, JPG, PCAP/PCAPNG.`);
    error.code = 'INVALID_FILE_EXTENSION';
    return cb(error, false);
  }

  // Validate declared MIME type
  if (file.mimetype && !ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase()) && file.mimetype !== 'application/octet-stream') {
    recordAudit(req, {
      event_type: 'FILE_UPLOAD_REJECTED',
      severity: 'WARNING',
      description: `Disallowed MIME type '${file.mimetype}' rejected for file '${file.originalname}'`,
      status: 'DENIED',
      details: { originalname: file.originalname, mimetype: file.mimetype }
    });

    const error = new Error(`File upload rejected: MIME type '${file.mimetype}' is not permitted.`);
    error.code = 'INVALID_MIME_TYPE';
    return cb(error, false);
  }

  cb(null, true);
}

// 10 MB maximum upload limit
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter
});

module.exports = {
  upload,
  ALLOWED_EXTENSIONS
};
