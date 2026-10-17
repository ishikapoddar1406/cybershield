import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { getDatabase } from '../src/db/database';
import { seed } from '../src/db/seed';
import { generateSync, verifySync } from 'otplib';
import { decryptTotpSecret } from '../src/utils/mfaCrypto';

describe('6. Genuine TOTP Authenticator Enrollment & Rate Limit Testing Suite', () => {
  beforeAll(async () => {
    await seed();
  });

  it('MFA Setup: Generates valid QR code and keeps enrollment pending in session', async () => {
    const agent = request.agent(app);

    // Step 1: Sign in as reporter1
    const loginRes = await agent
      .post('/api/auth/login')
      .send({ username: 'reporter1', password: 'Reporter@2026!' });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.user.totpEnabled).toBe(false);

    // Step 2: Request MFA setup credentials
    const setupRes = await agent
      .post('/api/auth/mfa/setup')
      .set('X-CSRF-Token', loginRes.body.csrfToken);

    expect(setupRes.status).toBe(200);
    expect(setupRes.body.success).toBe(true);
    expect(setupRes.body.secret).toMatch(/^[A-Z2-7]{16,32}$/);
    expect(setupRes.body.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);
    expect(setupRes.body.otpAuthUrl).toContain('otpauth://totp/CyberShield:reporter1');
    expect(setupRes.body.instructions).toContain('Scan this code using Google Authenticator');

    // Step 3: Crucial check — Verify MFA is NOT yet enabled in database (pending state)
    const db = getDatabase();
    const userInDb = db.prepare('SELECT totp_enabled FROM users WHERE username = ?').get('reporter1');
    expect(userInDb.totp_enabled).toBe(0);
  });

  it('MFA Setup: Rejects unauthenticated setup requests', async () => {
    const unauthRes = await request(app)
      .post('/api/auth/mfa/setup');
    expect(unauthRes.status).toBe(401);
  });

  it('MFA Verification Form: Rejects invalid, incomplete, or wrong codes', async () => {
    const agent = request.agent(app);

    // Log in and initiate setup
    const loginRes = await agent
      .post('/api/auth/login')
      .send({ username: 'reporter1', password: 'Reporter@2026!' });
    const setupRes = await agent
      .post('/api/auth/mfa/setup')
      .set('X-CSRF-Token', loginRes.body.csrfToken);

    // Incomplete code (< 6 digits)
    const shortRes = await agent
      .post('/api/auth/verify-mfa')
      .set('X-CSRF-Token', loginRes.body.csrfToken)
      .send({ token: '123' });
    expect(shortRes.status).toBe(400);
    expect(shortRes.body.error).toContain('6 numeric digits');

    // Non-numeric code
    const nonNumericRes = await agent
      .post('/api/auth/verify-mfa')
      .set('X-CSRF-Token', loginRes.body.csrfToken)
      .send({ token: 'ABCDEF' });
    expect(nonNumericRes.status).toBe(400);

    // Incorrect 6-digit code
    const wrongCodeRes = await agent
      .post('/api/auth/verify-mfa')
      .set('X-CSRF-Token', loginRes.body.csrfToken)
      .send({ token: '999999' });
    expect(wrongCodeRes.status).toBe(400);
    expect(wrongCodeRes.body.error).toContain('Invalid authenticator code');

    // Ensure MFA remains disabled in DB
    const db = getDatabase();
    const userInDb = db.prepare('SELECT totp_enabled FROM users WHERE username = ?').get('reporter1');
    expect(userInDb.totp_enabled).toBe(0);
  });

  it('MFA Enrollment: Valid code enables MFA, encrypts secret at rest, and allows login', async () => {
    const agent = request.agent(app);

    // Log in
    const loginRes = await agent
      .post('/api/auth/login')
      .send({ username: 'reporter1', password: 'Reporter@2026!' });

    // Initiate setup
    const setupRes = await agent
      .post('/api/auth/mfa/setup')
      .set('X-CSRF-Token', loginRes.body.csrfToken);

    const pendingSecret = setupRes.body.secret;

    // Generate valid TOTP token matching the pending secret
    const validToken = generateSync({ secret: pendingSecret });

    // Submit verification form
    const verifyRes = await agent
      .post('/api/auth/verify-mfa')
      .set('X-CSRF-Token', loginRes.body.csrfToken)
      .send({ token: validToken });

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.success).toBe(true);
    expect(verifyRes.body.message).toContain('Authenticator enabled successfully');
    expect(verifyRes.body.user.totpEnabled).toBe(true);

    // Check DB: secret is encrypted with AES-256-GCM and totp_enabled is 1
    const db = getDatabase();
    const userInDb = db.prepare('SELECT totp_secret, totp_enabled FROM users WHERE username = ?').get('reporter1');
    expect(userInDb.totp_enabled).toBe(1);
    expect(userInDb.totp_secret).toMatch(/^enc:/);

    // Decrypt and verify matching plaintext
    const decryptedSecret = decryptTotpSecret(userInDb.totp_secret);
    expect(decryptedSecret).toBe(pendingSecret);

    // Replay attack prevention: Submitting the same code again in same timestep is rejected
    const replayRes = await agent
      .post('/api/auth/verify-mfa')
      .set('X-CSRF-Token', verifyRes.body.csrfToken)
      .send({ token: validToken });
    expect(replayRes.status).toBe(400);

    // Logout
    await agent.post('/api/auth/logout');

    // Now test login with MFA active
    const loginAttempt = await agent
      .post('/api/auth/login')
      .send({ username: 'reporter1', password: 'Reporter@2026!' });

    expect(loginAttempt.status).toBe(200);
    expect(loginAttempt.body.mfaRequired).toBe(true);

    // Verify code on login using next timestep to adhere to replay protection
    const loginTotp = generateSync({
      secret: pendingSecret,
      epoch: Math.floor(Date.now() / 1000) + 30
    });
    const loginMfaRes = await agent
      .post('/api/auth/verify-mfa')
      .send({ token: loginTotp });

    expect(loginMfaRes.status).toBe(200);
    expect(loginMfaRes.body.success).toBe(true);
    expect(loginMfaRes.body.user.username).toBe('reporter1');
  });

  it('MFA Disable: Requires password confirmation and successfully turns off 2FA', async () => {
    const agent = request.agent(app);

    // Sign in as investigator1
    const loginRes = await agent
      .post('/api/auth/login')
      .send({ username: 'investigator1', password: 'Investigator@2026!' });

    // Enable MFA first
    const setupRes = await agent
      .post('/api/auth/mfa/setup')
      .set('X-CSRF-Token', loginRes.body.csrfToken);
    const validToken = generateSync({ secret: setupRes.body.secret });
    await agent
      .post('/api/auth/verify-mfa')
      .set('X-CSRF-Token', loginRes.body.csrfToken)
      .send({ token: validToken });

    // Wrong password should fail to disable
    const badPwRes = await agent
      .post('/api/auth/mfa/disable')
      .set('X-CSRF-Token', loginRes.body.csrfToken)
      .send({ password: 'WrongPassword123' });
    expect(badPwRes.status).toBe(401);

    // Correct password disables MFA
    const goodDisableRes = await agent
      .post('/api/auth/mfa/disable')
      .set('X-CSRF-Token', loginRes.body.csrfToken)
      .send({ password: 'Investigator@2026!' });
    expect(goodDisableRes.status).toBe(200);
    expect(goodDisableRes.body.success).toBe(true);
    expect(goodDisableRes.body.user.totpEnabled).toBe(false);

    // Check DB
    const db = getDatabase();
    const userInDb = db.prepare('SELECT totp_enabled, totp_secret FROM users WHERE username = ?').get('investigator1');
    expect(userInDb.totp_enabled).toBe(0);
    expect(userInDb.totp_secret).toBeNull();
  });

  it('Rate Limiting Test: Clicks 1-3 allowed, Click 4 blocked with 429, Reset clears limit', async () => {
    // Reset any previous state first
    await request(app).post('/api/security-lab/reset-rate-limit');

    // Click 1 -> Allowed (200)
    const click1 = await request(app).post('/api/security-lab/test-rate-limit');
    expect(click1.status).toBe(200);
    expect(click1.body.allowed).toBe(true);

    // Click 2 -> Allowed (200)
    const click2 = await request(app).post('/api/security-lab/test-rate-limit');
    expect(click2.status).toBe(200);
    expect(click2.body.allowed).toBe(true);

    // Click 3 -> Allowed (200)
    const click3 = await request(app).post('/api/security-lab/test-rate-limit');
    expect(click3.status).toBe(200);
    expect(click3.body.allowed).toBe(true);

    // Click 4 -> Blocked (429)
    const click4 = await request(app).post('/api/security-lab/test-rate-limit');
    expect(click4.status).toBe(429);
    expect(click4.body.allowed).toBe(false);
    expect(click4.body.message).toContain('Rate limit successfully triggered');

    // Reset rate limiter
    const resetRes = await request(app).post('/api/security-lab/reset-rate-limit');
    expect(resetRes.status).toBe(200);

    // After reset, click 1 is immediately allowed again!
    const postReset = await request(app).post('/api/security-lab/test-rate-limit');
    expect(postReset.status).toBe(200);
    expect(postReset.body.allowed).toBe(true);
  });
});
