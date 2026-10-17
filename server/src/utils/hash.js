const crypto = require('crypto');
const fs = require('fs');

/**
 * Recalculates the SHA-256 cryptographic digest of a file on disk.
 * @param {string} filePath - Absolute path to the file
 * @returns {Promise<string>} Hexadecimal SHA-256 hash
 */
function calculateFileSha256(filePath) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      return reject(new Error(`File not found: ${filePath}`));
    }
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('error', (err) => reject(err));
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

/**
 * Calculates SHA-256 digest of arbitrary text or buffer data.
 * @param {string|Buffer} data 
 * @returns {string} Hexadecimal SHA-256 hash
 */
function calculateSha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

module.exports = {
  calculateFileSha256,
  calculateSha256
};
