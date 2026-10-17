import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { seed } from '../src/db/seed';
import { getDatabase } from '../src/db/database';

describe('3. Core Security Mechanisms: CSRF, File Upload Defense & Headers', () => {
  beforeAll(async () => {
    await seed();
  });

  it('Enforces CSRF Protection: Rejects state-changing requests lacking X-CSRF-Token (403 Forbidden)', async () => {
    const agent = request.agent(app);

    // Login to establish authenticated session
    await agent
      .post('/api/auth/login')
      .send({ username: 'investigator1', password: 'Investigator@2026!' });

    // Send state-changing POST without X-CSRF-Token header
    const noTokenRes = await agent
      .post('/api/security-lab/test-csrf-protected')
      .send({ action: 'test-action' });

    expect(noTokenRes.status).toBe(403);
    expect(noTokenRes.body.error).toContain('CSRF token validation failed');

    // Send state-changing POST with bogus X-CSRF-Token
    const badTokenRes = await agent
      .post('/api/security-lab/test-csrf-protected')
      .set('x-csrf-token', 'malicious_forged_token_123')
      .send({ action: 'test-action' });

    expect(badTokenRes.status).toBe(403);
  });

  it('Accepts state-changing requests when synchronized X-CSRF-Token is supplied', async () => {
    const agent = request.agent(app);

    const loginRes = await agent
      .post('/api/auth/login')
      .send({ username: 'investigator1', password: 'Investigator@2026!' });

    const csrfToken = loginRes.body.csrfToken;
    expect(csrfToken).toBeDefined();

    const goodRes = await agent
      .post('/api/security-lab/test-csrf-protected')
      .set('x-csrf-token', csrfToken)
      .send({ action: 'test-action' });

    expect(goodRes.status).toBe(200);
    expect(goodRes.body.success).toBe(true);
    expect(goodRes.body.message).toContain('CSRF Verification Passed');
  });

  it('Rejects disallowed file extensions (.exe, .sh, .php) at the upload boundary', async () => {
    const agent = request.agent(app);
    const loginRes = await agent
      .post('/api/auth/login')
      .send({ username: 'investigator1', password: 'Investigator@2026!' });
    const csrfToken = loginRes.body.csrfToken;

    // Attempt upload of a prohibited executable file (.exe)
    const exeRes = await agent
      .post('/api/security-lab/test-file-upload-defense')
      .set('x-csrf-token', csrfToken)
      .attach('testFile', Buffer.from('MZ_MOCK_WINDOWS_PE_EXECUTABLE_BINARY_DATA'), 'malware.exe');

    expect(exeRes.status).toBe(400);
    expect(exeRes.body.rejected).toBe(true);
    expect(exeRes.body.reason).toContain('is not permitted');

    // Attempt upload of a shell script (.sh)
    const shRes = await agent
      .post('/api/security-lab/test-file-upload-defense')
      .set('x-csrf-token', csrfToken)
      .attach('testFile', Buffer.from('#!/bin/bash\nrm -rf /'), 'exploit.sh');

    expect(shRes.status).toBe(400);
    expect(shRes.body.rejected).toBe(true);
  });

  it('Verifies active Helmet security headers on HTTP responses', async () => {
    const res = await request(app).get('/api/health');

    // Content Security Policy
    expect(res.headers['content-security-policy']).toBeDefined();
    expect(res.headers['content-security-policy']).toContain("frame-ancestors 'none'");

    // Clickjacking defense
    expect(res.headers['x-frame-options']).toBe('DENY');

    // MIME sniffing defense
    expect(res.headers['x-content-type-options']).toBe('nosniff');

    // Referrer policy
    expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });

  it('Records tamper-evident security audit logs for unauthorized attempts', async () => {
    const db = getDatabase();
    const initialCount = db.prepare('SELECT COUNT(*) as count FROM audit_logs').get().count;

    // Trigger unauthorized request
    await request(app).get('/api/incidents');

    const updatedCount = db.prepare('SELECT COUNT(*) as count FROM audit_logs').get().count;
    expect(updatedCount).toBeGreaterThan(initialCount);

    const latest = db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 1').get();
    expect(latest.event_type).toBe('UNAUTHORIZED_ACCESS_ATTEMPT');
    expect(latest.severity).toBe('WARNING');
  });
});
