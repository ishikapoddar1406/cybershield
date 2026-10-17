const crypto = require('crypto');
const config = require('../config/env');

// Derive a 32-byte AES-256 key from MFA_ENCRYPTION_KEY or SESSION_SECRET
const keySeed = process.env.MFA_ENCRYPTION_KEY || (config.SESSION_SECRET + '_cybershield_mfa_enc_v1');
const DERIVED_KEY = crypto.createHash('sha256').update(keySeed).digest();

/**
 * Encrypts a Base32 TOTP secret string at rest using AES-256-GCM.
 * Formats output as: enc:<iv_hex>:<auth_tag_hex>:<ciphertext_hex>
 *
 * @param {string} secret Plaintext Base32 TOTP secret
 * @returns {string} Encrypted string format
 */
function encryptTotpSecret(secret) {
  if (!secret || typeof secret !== 'string') {
    return secret;
  }
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', DERIVED_KEY, iv);
  const ciphertext = Buffer.concat([
    cipher.update(secret, 'utf8'),
    cipher.final()
  ]);
  const authTag = cipher.getAuthTag();

  return `enc:${iv.toString('hex')}:${authTag.toString('hex')}:${ciphertext.toString('hex')}`;
}

/**
 * Decrypts an encrypted TOTP secret stored at rest.
 * Supports transparent passthrough for unencrypted legacy/seeded Base32 strings.
 *
 * @param {string} storedValue Database value (encrypted or legacy plaintext)
 * @returns {string|null} Plaintext Base32 TOTP secret, or null on decryption failure
 */
function decryptTotpSecret(storedValue) {
  if (!storedValue || typeof storedValue !== 'string') {
    return null;
  }

  // Backward-compatible passthrough for unencrypted Base32 secrets (e.g. seed data)
  if (!storedValue.startsWith('enc:')) {
    return storedValue;
  }

  try {
    const parts = storedValue.split(':');
    if (parts.length !== 4) {
      return null;
    }
    const [, ivHex, tagHex, dataHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(tagHex, 'hex');
    const encryptedData = Buffer.from(dataHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', DERIVED_KEY, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encryptedData),
      decipher.final()
    ]).toString('utf8');

    return decrypted;
  } catch (err) {
    console.error('[MFA_CRYPTO] Failed to decrypt TOTP secret:', err.message);
    return null;
  }
}

module.exports = {
  encryptTotpSecret,
  decryptTotpSecret
};
