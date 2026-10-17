import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { seed } from '../src/db/seed';
import { getDatabase } from '../src/db/database';
import { validateAndNormalizeUrl, analyzeUrlStructureHeuristics } from '../src/utils/reputationChecker';

describe('5. Real Website Phishing & Reputation Check Suite', () => {
  beforeAll(async () => {
    await seed();
  });

  it('SSRF Defense: Validates and normalizes URLs while strictly blocking private/loopback IPs', () => {
    // 1. Valid normalization
    const valid = validateAndNormalizeUrl('google.com/search?q=test');
    expect(valid.normalizedUrl).toBe('http://google.com/search?q=test');
    expect(valid.domain).toBe('google.com');

    // 2. Reject unsupported protocol
    expect(() => validateAndNormalizeUrl('ftp://example.com')).toThrow(/Unsupported protocol/);
    expect(() => validateAndNormalizeUrl('javascript:alert(1)')).toThrow(/Unsupported protocol/);

    // 3. Block loopback / localhost
    expect(() => validateAndNormalizeUrl('http://localhost:5000')).toThrow(/Local and loopback/);
    expect(() => validateAndNormalizeUrl('http://127.0.0.1:8080/admin')).toThrow(/Local and loopback/);

    // 4. Block RFC 1918 private network addresses (SSRF mitigation)
    expect(() => validateAndNormalizeUrl('http://192.168.1.1/router')).toThrow(/Private RFC 1918/);
    expect(() => validateAndNormalizeUrl('http://10.0.0.5/internal')).toThrow(/Private RFC 1918/);
    expect(() => validateAndNormalizeUrl('http://172.16.0.1/corp')).toThrow(/Private RFC 1918/);

    // 5. Block cloud metadata
    expect(() => validateAndNormalizeUrl('http://169.254.169.254/latest/meta-data/')).toThrow(/Link-local and cloud metadata/);
  });

  it('Heuristic Structure Analysis: Flags raw IPs, excessive subdomains, and credential keywords', () => {
    // Test URL with raw IP and sensitive keyword
    const parsed = {
      normalizedUrl: 'http://198.51.100.25/login/verify.php',
      domain: '198.51.100.25',
      port: '80'
    };

    const warnings = analyzeUrlStructureHeuristics(parsed);
    const codes = warnings.map(w => w.code);
    expect(codes).toContain('HEUR_RAW_IP_HOST');
    expect(codes).toContain('HEUR_SENSITIVE_KEYWORDS');

    // Test excessive subdomains
    const subdomainsParsed = {
      normalizedUrl: 'http://secure.account.verify.paypal.com.phishingsite.org/login',
      domain: 'secure.account.verify.paypal.com.phishingsite.org',
      port: '80'
    };
    const subWarnings = analyzeUrlStructureHeuristics(subdomainsParsed);
    const subCodes = subWarnings.map(w => w.code);
    expect(subCodes).toContain('HEUR_EXCESSIVE_SUBDOMAINS');
    expect(subCodes).toContain('HEUR_SENSITIVE_KEYWORDS');
  });

  it('Status Route: Informs frontend of service configuration without leaking API keys', async () => {
    const res = await request(app).get('/api/forensics/url/status');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.services.googleSafeBrowsing).toBeDefined();
    expect(res.body.services.virusTotal).toBeDefined();
    // Verify no secret keys are exposed
    expect(JSON.stringify(res.body)).not.toContain('AIza');
    expect(JSON.stringify(res.body)).not.toContain('key=');
  });

  it('Privacy & Consent Gate: Rejects check requests without affirmative user consent', async () => {
    const agent = request.agent(app);
    const loginRes = await agent
      .post('/api/auth/login')
      .send({ username: 'investigator1', password: 'Investigator@2026!' });
    const csrfToken = loginRes.body.csrfToken;

    const noConsentRes = await agent
      .post('/api/forensics/url/check')
      .set('x-csrf-token', csrfToken)
      .send({
        url: 'https://example.com',
        consentGiven: false
      });

    expect(noConsentRes.status).toBe(403);
    expect(noConsentRes.body.error).toContain('Consent Required');
  });

  it('Reputation Check: Returns structured result and enforces "No Match Found" != "Definitely Safe" disclaimer', async () => {
    const agent = request.agent(app);
    const loginRes = await agent
      .post('/api/auth/login')
      .send({ username: 'investigator1', password: 'Investigator@2026!' });
    const csrfToken = loginRes.body.csrfToken;

    const checkRes = await agent
      .post('/api/forensics/url/check')
      .set('x-csrf-token', csrfToken)
      .send({
        url: 'https://example-academic-test.com',
        consentGiven: true
      });

    expect(checkRes.status).toBe(200);
    expect(checkRes.body.success).toBe(true);
    expect(checkRes.body.domain).toBe('example-academic-test.com');
    expect(['Known Threat Found', 'No Match Found', 'Could Not Check']).toContain(checkRes.body.overallStatus);
    expect(checkRes.body.disclaimer).toContain('DOES NOT guarantee or prove that the website is safe');
    expect(checkRes.body.checkId).toMatch(/^URL-/);
  });

  it('Digital Forensics Case Linking: Saves reputation check to incident, creates note & SHA-256 evidence artifact', async () => {
    const agent = request.agent(app);
    const loginRes = await agent
      .post('/api/auth/login')
      .send({ username: 'investigator1', password: 'Investigator@2026!' });
    const csrfToken = loginRes.body.csrfToken;

    // 1. Perform check
    const checkRes = await agent
      .post('/api/forensics/url/check')
      .set('x-csrf-token', csrfToken)
      .send({
        url: 'https://phishing-portal-test.net/bank/login',
        consentGiven: true
      });

    expect(checkRes.status).toBe(200);
    const checkId = checkRes.body.checkId;

    // 2. Fetch seeded case
    const db = getDatabase();
    const caseRow = db.prepare('SELECT id FROM incidents LIMIT 1').get();
    expect(caseRow).toBeDefined();

    // 3. Save to case
    const saveRes = await agent
      .post('/api/forensics/url/save-to-case')
      .set('x-csrf-token', csrfToken)
      .send({
        checkId,
        incidentId: caseRow.id,
        notes: 'External threat lookup performed during triage. Flagged for containment.'
      });

    expect(saveRes.status).toBe(200);
    expect(saveRes.body.success).toBe(true);
    expect(saveRes.body.noteId).toBeDefined();
    expect(saveRes.body.evidenceId).toBeDefined();

    // 4. Verify evidence record was created with SHA-256 digest in database
    const evidenceRow = db.prepare('SELECT * FROM evidence WHERE id = ?').get(saveRes.body.evidenceId);
    expect(evidenceRow).toBeDefined();
    expect(evidenceRow.sha256_hash).toHaveLength(64);
    expect(evidenceRow.incident_id).toBe(caseRow.id);

    // 5. Verify initial Chain of Custody entry
    const cocRow = db.prepare('SELECT * FROM chain_of_custody WHERE evidence_id = ?').get(saveRes.body.evidenceId);
    expect(cocRow).toBeDefined();
    expect(cocRow.action).toBe('ACQUIRED_URL_REPUTATION_REPORT');

    // 6. Verify case notes
    const noteRow = db.prepare('SELECT * FROM investigation_notes WHERE id = ?').get(saveRes.body.noteId);
    expect(noteRow).toBeDefined();
    expect(noteRow.content).toContain('URL Threat Reputation Analysis');

    // 7. Retrieve case reputation checks via GET /api/forensics/url/case/:incidentId
    const caseChecksRes = await agent.get(`/api/forensics/url/case/${caseRow.id}`);
    expect(caseChecksRes.status).toBe(200);
    expect(caseChecksRes.body.checks.length).toBeGreaterThan(0);
    expect(caseChecksRes.body.checks.some(c => c.id === checkId)).toBe(true);
  });
});
