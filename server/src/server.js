const app = require('./app');
const config = require('./config/env');

const server = app.listen(config.PORT, () => {
  console.log(`=======================================================`);
  console.log(`🛡️  CyberShield Forensics Platform Backend Active`);
  console.log(`📡 Listening on: http://localhost:${config.PORT}`);
  console.log(`🔒 Security Profiles: Helmet CSP, CSRF, Rate Limiting, RBAC`);
  console.log(`💾 SQLite Database: ${config.DB_PATH}`);
  console.log(`=======================================================`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Closing HTTP server gracefully.');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received. Closing HTTP server gracefully.');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});
