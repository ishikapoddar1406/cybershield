import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { seed } from '../src/db/seed';
import { getDatabase } from '../src/db/database';
import { analyzeNetworkLogs } from '../src/utils/networkAnalyzer';
import { parseEmailHeaders } from '../src/utils/emailParser';

describe('4. Digital Forensics Lab & Evidence Integrity Verification Suite', () => {
  beforeAll(async () => {
    await seed();
  });

  it('Verifies intact evidence integrity via SHA-256 cryptographic recalculation', async () => {
    const agent = request.agent(app);
    const loginRes = await agent
      .post('/api/auth/login')
      .send({ username: 'investigator1', password: 'Investigator@2026!' });
    const csrfToken = loginRes.body.csrfToken;

    // Fetch pre-seeded evidence from database
    const db = getDatabase();
    const evidenceItem = db.prepare('SELECT id FROM evidence LIMIT 1').get();
    expect(evidenceItem).toBeDefined();

    // Verify evidence
    const verifyRes = await agent
      .post(`/api/evidence/${evidenceItem.id}/verify`)
      .set('x-csrf-token', csrfToken);

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.verified).toBe(true);
    expect(verifyRes.body.status).toBe('Verified');
    expect(verifyRes.body.currentHash).toBe(verifyRes.body.baselineHash);
  });

  it('Detects evidence tampering immediately when disk bytes are altered', async () => {
    const agent = request.agent(app);
    const loginRes = await agent
      .post('/api/auth/login')
      .send({ username: 'investigator1', password: 'Investigator@2026!' });
    const csrfToken = loginRes.body.csrfToken;

    const db = getDatabase();
    const evidenceItem = db.prepare('SELECT id FROM evidence LIMIT 1').get();

    // Simulate tampering (modifies file on disk)
    const tamperRes = await agent
      .post(`/api/evidence/${evidenceItem.id}/simulate-tampering`)
      .set('x-csrf-token', csrfToken);
    expect(tamperRes.status).toBe(200);

    // Verify integrity should now FAIL
    const verifyRes = await agent
      .post(`/api/evidence/${evidenceItem.id}/verify`)
      .set('x-csrf-token', csrfToken);

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.verified).toBe(false);
    expect(verifyRes.body.status).toBe('Integrity Compromised');
    expect(verifyRes.body.warning).toContain('CRITICAL FORENSIC WARNING');

    // Restore original file
    const restoreRes = await agent
      .post(`/api/evidence/${evidenceItem.id}/restore-original`)
      .set('x-csrf-token', csrfToken);
    expect(restoreRes.status).toBe(200);

    // Re-verify after restore should PASS
    const reVerifyRes = await agent
      .post(`/api/evidence/${evidenceItem.id}/verify`)
      .set('x-csrf-token', csrfToken);
    expect(reVerifyRes.body.verified).toBe(true);
  });

  it('Network Forensics Analyzer: Identifies multi-pattern cyber threats', () => {
    // 1. Brute Force
    const authLog = `
      Oct 17 01:00:01 srv sshd[1]: Failed password for invalid user admin from 198.51.100.45 port 50001 ssh2
      Oct 17 01:00:03 srv sshd[2]: Failed password for invalid user root from 198.51.100.45 port 50002 ssh2
      Oct 17 01:00:05 srv sshd[3]: Failed password for invalid user test from 198.51.100.45 port 50003 ssh2
      Oct 17 01:00:07 srv sshd[4]: Failed password for invalid user backup from 198.51.100.45 port 50004 ssh2
    `;
    const authResults = analyzeNetworkLogs(authLog);
    expect(authResults.findingsCount).toBeGreaterThan(0);
    expect(authResults.summary.rulesTriggered).toContain('AUTH_BRUTE_FORCE');

    // 2. Port Scan
    const scanLog = `
      Oct 17 02:00:01 fw kernel: [DROP] IN=eth0 SRC=203.0.113.88 DST=10.0.0.1 SPT=50001 DPT=21 [SYN]
      Oct 17 02:00:01 fw kernel: [DROP] IN=eth0 SRC=203.0.113.88 DST=10.0.0.1 SPT=50002 DPT=22 [SYN]
      Oct 17 02:00:01 fw kernel: [DROP] IN=eth0 SRC=203.0.113.88 DST=10.0.0.1 SPT=50003 DPT=80 [SYN]
      Oct 17 02:00:01 fw kernel: [DROP] IN=eth0 SRC=203.0.113.88 DST=10.0.0.1 SPT=50004 DPT=443 [SYN]
    `;
    const scanResults = analyzeNetworkLogs(scanLog);
    expect(scanResults.summary.rulesTriggered).toContain('TCP_PORT_SCAN');

    // 3. DNS Tunneling
    const dnsLog = `Oct 17 03:00:01 named[1]: query: 9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1.exfil.suspicious.xyz IN TXT +`;
    const dnsResults = analyzeNetworkLogs(dnsLog);
    expect(dnsResults.summary.rulesTriggered).toContain('DNS_TUNNELING_OR_EXFILTRATION');

    // 4. ARP Spoofing
    const arpLog = `
      Oct 17 04:00:01 arp: ARP, Reply 192.168.1.1 is-at 00:11:22:33:44:55
      Oct 17 04:00:03 arp: ARP, Reply 192.168.1.1 is-at aa:bb:cc:dd:ee:ff
    `;
    const arpResults = analyzeNetworkLogs(arpLog);
    expect(arpResults.summary.rulesTriggered).toContain('ARP_SPOOFING_DETECTED');
  });

  it('Email Forensics Parser: Detects header anomalies and domain deception', () => {
    const rawEmail = `From: "IT Support Security Desk" <support@free-mail-provider.com>
Reply-To: phisher-collector@evil-server.net
Return-Path: <bounce@unrelated-spammer.ru>
Subject: Account Password Expiring
Date: Fri, 16 Oct 2026 12:00:00 +0000
Authentication-Results: mx.corp.com; dkim=fail; spf=fail; dmarc=fail

Please reset your password immediately.`;

    const parsed = parseEmailHeaders(rawEmail);
    expect(parsed.isValid).toBe(true);
    expect(parsed.metadata.from.email).toBe('support@free-mail-provider.com');
    expect(parsed.metadata.replyTo.email).toBe('phisher-collector@evil-server.net');

    // Check detected anomalies
    const anomalyIds = parsed.anomalies.map(a => a.id);
    expect(anomalyIds).toContain('ANOMALY-REPLY-TO');
    expect(anomalyIds).toContain('ANOMALY-RETURN-PATH');
    expect(anomalyIds).toContain('ANOMALY-AUTH-FAILURE');
  });
});
