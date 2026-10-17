import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { seed } from '../src/db/seed';

describe('2. Role-Based Access Control (RBAC) & Authorization Boundaries Suite', () => {
  beforeAll(async () => {
    await seed();
  });

  it('Denies unauthenticated access to protected endpoints with 401 Unauthorized', async () => {
    const res = await request(app).get('/api/incidents');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('Enforces RBAC: Reporter is strictly rejected from Admin-only endpoints (403 Forbidden)', async () => {
    const reporterAgent = request.agent(app);

    // Login as reporter
    await reporterAgent
      .post('/api/auth/login')
      .send({ username: 'reporter1', password: 'Reporter@2026!' });

    // Attempt to access admin audit logs
    const auditRes = await reporterAgent.get('/api/audit');
    expect(auditRes.status).toBe(403);
    expect(auditRes.body.error).toContain('Access Denied');

    // Attempt to access user management
    const usersRes = await reporterAgent.get('/api/users');
    expect(usersRes.status).toBe(403);

    // Attempt to access admin-only security lab test endpoint
    const labRbacRes = await reporterAgent.get('/api/security-lab/test-admin-only-rbac');
    expect(labRbacRes.status).toBe(403);
  });

  it('Enforces Case Ownership Isolation: Reporter cannot access another reporter cases', async () => {
    const reporterAgent = request.agent(app);
    await reporterAgent
      .post('/api/auth/login')
      .send({ username: 'reporter1', password: 'Reporter@2026!' });

    // In seed, reporter1 owns cases CASE-2026-001 through CASE-2026-005.
    // Let's create an unowned case with a different reporter directly in DB:
    const { getDatabase } = await import('../src/db/database');
    const db = getDatabase();
    const otherUser = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
    db.prepare(`
      INSERT INTO incidents (
        id, title, description, category, severity, status,
        reporter_id, assigned_investigator_id, incident_date, created_at, updated_at
      ) VALUES ('CASE-2026-999', 'Confidential Other Reporter Case', 'Private report', 'phishing', 'low', 'Submitted', ?, NULL, '2026-10-17', '2026-10-17T00:00:00Z', '2026-10-17T00:00:00Z')
    `).run(otherUser.id);

    // reporter1 attempts to inspect CASE-2026-999
    const forbiddenRes = await reporterAgent.get('/api/incidents/CASE-2026-999');
    expect(forbiddenRes.status).toBe(403);
    expect(forbiddenRes.body.error).toContain('Access Denied');
  });

  it('Prevents Reporter from modifying case workflow status or reassigning investigators', async () => {
    const reporterAgent = request.agent(app);
    const loginRes = await reporterAgent
      .post('/api/auth/login')
      .send({ username: 'reporter1', password: 'Reporter@2026!' });
    const csrfToken = loginRes.body.csrfToken;

    // Reporter attempts to transition CASE-2026-001 to 'Closed'
    const statusUpdateRes = await reporterAgent
      .patch('/api/incidents/CASE-2026-001')
      .set('x-csrf-token', csrfToken)
      .send({ status: 'Closed' });

    expect(statusUpdateRes.status).toBe(403);
    expect(statusUpdateRes.body.error).toContain('Reporters cannot change workflow status');
  });

  it('Allows Investigator to update incident status and add investigation notes', async () => {
    const investigatorAgent = request.agent(app);
    const loginRes = await investigatorAgent
      .post('/api/auth/login')
      .send({ username: 'investigator1', password: 'Investigator@2026!' });
    const csrfToken = loginRes.body.csrfToken;

    // Investigator updates status of CASE-2026-001 to 'Resolved'
    const patchRes = await investigatorAgent
      .patch('/api/incidents/CASE-2026-001')
      .set('x-csrf-token', csrfToken)
      .send({ status: 'Resolved' });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.success).toBe(true);

    // Investigator adds a note
    const noteRes = await investigatorAgent
      .post('/api/incidents/CASE-2026-001/notes')
      .set('x-csrf-token', csrfToken)
      .send({
        note_type: 'conclusion',
        content: 'All malicious domains sinkholed and compromised credentials rotated. Incident successfully mitigated.'
      });
    expect(noteRes.status).toBe(201);
    expect(noteRes.body.success).toBe(true);
  });

  it('Grants Administrator full access to audit trails and system statistics', async () => {
    const adminAgent = request.agent(app);
    await adminAgent
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'Admin@CyberShield2026!' });

    const auditRes = await adminAgent.get('/api/audit');
    expect(auditRes.status).toBe(200);
    expect(auditRes.body.success).toBe(true);
    expect(auditRes.body.logs.length).toBeGreaterThan(0);
  });
});
