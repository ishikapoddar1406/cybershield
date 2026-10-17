/**
 * CyberShield Unified Dev Launcher
 * Runs backend (Node/Express :5000) and frontend (Vite/React :5173) concurrently.
 */

const { spawn } = require('child_process');
const path = require('path');

const serverDir = path.join(__dirname, 'server');
const clientDir = path.join(__dirname, 'client');

console.log('\x1b[36m%s\x1b[0m', '=============================================================');
console.log('\x1b[36m%s\x1b[0m', '  CyberShield — Secure Digital Forensics & Incident Platform ');
console.log('\x1b[36m%s\x1b[0m', '=============================================================');
console.log('\x1b[32m%s\x1b[0m', '  -> Backend:  http://localhost:5000');
console.log('\x1b[32m%s\x1b[0m', '  -> Frontend: http://localhost:5173');
console.log('\x1b[33m%s\x1b[0m', '  -> SQLite DB: server/data/cybershield.db');
console.log('\x1b[33m%s\x1b[0m', '  -> Evidence:  server/storage/evidence');
console.log('\x1b[36m%s\x1b[0m', '-------------------------------------------------------------');

// Start backend
const serverProcess = spawn('node', ['src/server.js'], {
  cwd: serverDir,
  shell: true,
  stdio: 'inherit'
});

// Start frontend
const clientProcess = spawn('npx', ['vite'], {
  cwd: clientDir,
  shell: true,
  stdio: 'inherit'
});

function cleanup() {
  console.log('\n\x1b[31m[CyberShield] Shutting down services...\x1b[0m');
  try {
    serverProcess.kill('SIGINT');
  } catch (e) {}
  try {
    clientProcess.kill('SIGINT');
  } catch (e) {}
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
