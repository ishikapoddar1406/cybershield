const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

module.exports = {
  PORT: parseInt(process.env.PORT, 10) || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  SESSION_SECRET: process.env.SESSION_SECRET || 'cybershield_default_dev_secret_academic_use_only',
  CSRF_SECRET: process.env.CSRF_SECRET || 'cybershield_csrf_salt_secret_dev_only',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  STORAGE_DIR: path.resolve(__dirname, '../../', process.env.STORAGE_DIR || './storage/evidence'),
  DB_PATH: path.resolve(__dirname, '../../', process.env.DB_PATH || './data/cybershield.db'),
  IS_PROD: process.env.NODE_ENV === 'production'
};
