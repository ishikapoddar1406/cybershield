import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { getDatabase } from '../src/db/database';
import { seed } from '../src/db/seed';
import { generateSync, generateSecret } from 'otplib';

describe('1. Authentication, Password Policy & MFA Security Suite', () => {
  beforeAll(async () => {
    await seed();
  });

  it('Enforces password policy: rejects passwords lacking required complexity', async () => {
    // Too short (< 10)
    const shortRes = await request(app)
      .post('/api/security-lab/test-password-policy')
      .send({ password: 'Short1!' });
    expect(shortRes.body.isValid).toBe(false);
    expect(shortRes.body.checks.minLength).toBe(false);

    // Missing uppercase
    const noUpperRes = await request(app)
      .post('/api/security-lab/test-password-policy')
      .send({ password: 'lowercaseonly123!' });
    expect(noUpperRes.body.isValid).toBe(false);
    expect(noUpperRes.body.checks.hasUppercase).toBe(false);

    // Missing special character
    const noSpecialRes = await request(app)
      .post('/api/security-lab/test-password-policy')
      .send({ password: 'PasswordWithoutSpecial123' });
    expect(noSpecialRes.body.isValid).toBe(false);
    expect(noSpecialRes.body.checks.hasSpecial).toBe(false);

    // Compliant strong password
    const validRes = await request(app)
      .post('/api/security-lab/test-password-policy')
      .send({ password: 'CyberShield@Security2026!' });
    expect(validRes.body.isValid).toBe(true);
    expect(validRes.body.checks.minLength).toBe(true);
    expect(validRes.body.checks.hasUppercase).toBe(true);
    expect(validRes.body.checks.hasLowercase).toBe(true);
    expect(validRes.body.checks.hasNumber).toBe(true);
    expect(validRes.body.checks.hasSpecial).toBe(true);
  });

  it('Rejects invalid login credentials with non-revealing generic response', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'investigator1', password: 'WrongPassword123!' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Invalid credentials');
  });

  it('Logs in successfully and issues session cookie with HttpOnly flag', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'reporter1', password: 'Reporter@2026!' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe('reporter');
    expect(res.body.csrfToken).toBeDefined();

    // Verify session cookie security flags
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const sessionCookie = cookies.find(c => c.includes('cybershield.sid'));
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie.toLowerCase()).toContain('httponly');
    expect(sessionCookie.toLowerCase()).toContain('samesite=lax');
  });

  it('Requires and verifies TOTP code when MFA is configured on account', async () => {
    // Enable MFA on investigator1 account for test
    const db = getDatabase();
    const testSecret = generateSecret();
    db.prepare('UPDATE users SET totp_secret = ?, totp_enabled = 1 WHERE username = ?')
      .run(testSecret, 'investigator1');

    // Step 1: Submit valid username and password
    const agent = request.agent(app);
    const step1Res = await agent
      .post('/api/auth/login')
      .send({ username: 'investigator1', password: 'Investigator@2026!' });

    expect(step1Res.status).toBe(200);
    expect(step1Res.body.mfaRequired).toBe(true);

    // Step 2: Attempt invalid TOTP code
    const badMfaRes = await agent
      .post('/api/auth/verify-mfa')
      .send({ token: '000000' });
    expect(badMfaRes.status).toBe(400);
    expect(badMfaRes.body.success).toBe(false);

    // Step 3: Generate valid RFC 6238 TOTP code and submit
    const validToken = generateSync({ secret: testSecret });
    const goodMfaRes = await agent
      .post('/api/auth/verify-mfa')
      .send({ token: validToken });

    expect(goodMfaRes.status).toBe(200);
    expect(goodMfaRes.body.success).toBe(true);
    expect(goodMfaRes.body.user.role).toBe('investigator');
    expect(goodMfaRes.body.csrfToken).toBeDefined();
  });

  it('Temporarily locks account after repeated failed login attempts', async () => {
    // Attempt 5 incorrect passwords sequentially
    for (let i = 0; i < 4; i++) {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'WrongPassword@123' });
      expect(res.status).toBe(401);
    }

    // 5th failed attempt should trigger lockout
    const fifthRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'WrongPassword@123' });
    expect(fifthRes.status).toBe(401);
    expect(fifthRes.body.error).toContain('locked');

    // 6th attempt is blocked by lockout
    const lockedRes = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testuser', password: 'TestUser@2026!' });
    expect(lockedRes.status).toBe(403);
    expect(lockedRes.body.error).toContain('Security Lockout');
  });
});
