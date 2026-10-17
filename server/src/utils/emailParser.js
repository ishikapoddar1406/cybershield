/**
 * Offline Email Forensics Header Parser
 * Extracts standard RFC 5322 header fields, analyzes spoofing indicators, and provides educational context.
 */

function extractEmailAndDomain(headerValue) {
  if (!headerValue) return { raw: '', email: '', domain: '', name: '' };
  
  const raw = headerValue.trim();
  let email = '';
  let name = '';

  const angleMatch = raw.match(/^(?:(?:"?([^"]*)"?\s*)?<)?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})>?$/);
  if (angleMatch) {
    name = (angleMatch[1] || '').trim();
    email = angleMatch[2].toLowerCase();
  } else {
    const fallbackMatch = raw.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (fallbackMatch) {
      email = fallbackMatch[1].toLowerCase();
    }
  }

  const domain = email.includes('@') ? email.split('@')[1] : '';
  return { raw, email, domain, name };
}

function parseEmailHeaders(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return {
      isValid: false,
      error: 'No header content supplied.'
    };
  }

  // Normalize line endings and unfold RFC 5322 continuation lines (lines beginning with space or tab)
  const normalized = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const unfolded = normalized.replace(/\n([ \t]+)/g, ' ');
  const lines = unfolded.split('\n');

  const headers = {};
  const receivedHops = [];

  for (const line of lines) {
    // Empty line separates header block from body in standard email
    if (line.trim() === '') break;

    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim().toLowerCase();
      const val = line.slice(colonIndex + 1).trim();

      if (key === 'received') {
        receivedHops.push(val);
      } else if (!headers[key]) {
        headers[key] = val;
      }
    }
  }

  // Extract core fields
  const fromInfo = extractEmailAndDomain(headers['from']);
  const replyToInfo = extractEmailAndDomain(headers['reply-to']);
  const returnPathInfo = extractEmailAndDomain(headers['return-path']);
  const subject = headers['subject'] || '(No Subject)';
  const date = headers['date'] || 'Not specified';
  const messageId = headers['message-id'] || 'Missing Message-ID';
  const authResults = headers['authentication-results'] || '';
  const dkimSignature = headers['dkim-signature'] || null;

  // Analyze hops
  const parsedHops = receivedHops.map((hop, index) => {
    const ipMatch = hop.match(/\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/);
    const byMatch = hop.match(/by\s+([a-zA-Z0-9.-]+)/i);
    const fromMatch = hop.match(/from\s+([a-zA-Z0-9.-]+)/i);
    const dateMatch = hop.match(/;\s*(.+)$/);

    return {
      hopNumber: index + 1,
      raw: hop,
      ip: ipMatch ? ipMatch[0] : null,
      fromHost: fromMatch ? fromMatch[1] : null,
      byHost: byMatch ? byMatch[1] : null,
      timestamp: dateMatch ? dateMatch[1].trim() : null
    };
  });

  // Evaluate spoofing and anomaly indicators
  const anomalies = [];

  // 1. Reply-To Domain Mismatch
  if (fromInfo.domain && replyToInfo.domain && fromInfo.domain !== replyToInfo.domain) {
    anomalies.push({
      id: 'ANOMALY-REPLY-TO',
      severity: 'HIGH',
      indicator: 'Reply-To / From Domain Mismatch',
      description: `The 'From' domain (${fromInfo.domain}) differs from the 'Reply-To' domain (${replyToInfo.domain}). In phishing campaigns, attackers spoof a legitimate sender domain in 'From', but redirect victim replies to an attacker-controlled mailbox via 'Reply-To'.`,
      relevance: 'High risk of email impersonation / BEC (Business Email Compromise).'
    });
  }

  // 2. Return-Path (Envelope Sender) Mismatch
  if (fromInfo.domain && returnPathInfo.domain && fromInfo.domain !== returnPathInfo.domain) {
    anomalies.push({
      id: 'ANOMALY-RETURN-PATH',
      severity: 'MEDIUM',
      indicator: 'Return-Path (Envelope Sender) Inconsistency',
      description: `The Return-Path domain (${returnPathInfo.domain}) does not match the header 'From' domain (${fromInfo.domain}). While third-party marketing services legitimately use separate bounce domains, this is also a frequent hallmark of header spoofing.`,
      relevance: 'SPF checks validate Return-Path, not necessarily the display From header.'
    });
  }

  // 3. Display Name Deception
  if (fromInfo.name) {
    const deceptiveKeywords = ['support', 'security', 'it desk', 'helpdesk', 'bank', 'paypal', 'apple', 'google', 'admin'];
    const hasBrandWord = deceptiveKeywords.some(kw => fromInfo.name.toLowerCase().includes(kw));
    const isPublicEmail = fromInfo.domain.includes('gmail') || fromInfo.domain.includes('yahoo') || fromInfo.domain.includes('hotmail');

    if (hasBrandWord && isPublicEmail) {
      anomalies.push({
        id: 'ANOMALY-DISPLAY-NAME-SPOOF',
        severity: 'HIGH',
        indicator: 'Display Name Brand Impersonation via Freemail Domain',
        description: `The sender name claims an authoritative organization ('${fromInfo.name}'), but the actual sender address belongs to a free email provider (${fromInfo.email}).`,
        relevance: 'Classic spear-phishing deception tactic designed to fool casual recipients.'
      });
    }
  }

  // 4. Missing Message-ID or Invalid Format
  if (!headers['message-id']) {
    anomalies.push({
      id: 'ANOMALY-NO-MSGID',
      severity: 'MEDIUM',
      indicator: 'Missing Message-ID Header',
      description: 'Standard RFC 5322 compliance requires an authoritative Message-ID. Absence often indicates custom mail generation scripts or spam engines.',
      relevance: 'Low reputation / potential automated spam payload.'
    });
  }

  // 5. SPF / DKIM Authentication Indicators
  let spfStatus = 'Not Evaluated';
  let dkimStatus = 'Not Evaluated';
  let dmarcStatus = 'Not Evaluated';

  if (authResults) {
    if (/spf=pass/i.test(authResults)) spfStatus = 'PASS';
    else if (/spf=fail/i.test(authResults)) spfStatus = 'FAIL';
    else if (/spf=softfail/i.test(authResults)) spfStatus = 'SOFTFAIL';

    if (/dkim=pass/i.test(authResults)) dkimStatus = 'PASS';
    else if (/dkim=fail/i.test(authResults)) dkimStatus = 'FAIL';

    if (/dmarc=pass/i.test(authResults)) dmarcStatus = 'PASS';
    else if (/dmarc=fail/i.test(authResults)) dmarcStatus = 'FAIL';
  }

  if (spfStatus === 'FAIL' || dkimStatus === 'FAIL' || dmarcStatus === 'FAIL') {
    anomalies.push({
      id: 'ANOMALY-AUTH-FAILURE',
      severity: 'CRITICAL',
      indicator: 'Cryptographic Authentication Failure in Header Record',
      description: `Authentication-Results reports SPF: ${spfStatus}, DKIM: ${dkimStatus}, DMARC: ${dmarcStatus}. A failure here indicates the sending IP was not authorized by the domain owner or cryptographic digital signatures failed verification.`,
      relevance: 'Strong indication of forged sender identity.'
    });
  }

  return {
    isValid: true,
    metadata: {
      from: fromInfo,
      replyTo: replyToInfo,
      returnPath: returnPathInfo,
      subject,
      date,
      messageId,
      hasDkimSignature: Boolean(dkimSignature),
      authResultsSummary: {
        spf: spfStatus,
        dkim: dkimStatus,
        dmarc: dmarcStatus
      }
    },
    rawHeaders: headers,
    receivedHops: parsedHops,
    anomalies,
    educationalNotes: [
      {
        field: 'From vs Return-Path',
        concept: 'The "From" header is displayed to the user in mail clients, while "Return-Path" is the envelope sender where bounce notifications are routed. Attackers frequently forge "From" while their actual server is recorded in Return-Path.'
      },
      {
        field: 'Received Chain',
        concept: 'Each mail server that relays a message prepends a new "Received" header at the very top. To trace the originating host, read the Received headers in reverse order (bottom to top). Note that the bottom-most Received header can be forged by the initial sender, but intermediate relays cannot forge headers added by subsequent servers.'
      },
      {
        field: 'DKIM (DomainKeys Identified Mail)',
        concept: 'DKIM embeds a cryptographic digital signature using the sender domain private key. Mail receivers verify the signature using public keys published in DNS TXT records. Parsing a header only shows the claimed signature; live validation recomputes the hash of headers and body.'
      },
      {
        field: 'DMARC Domain Alignment',
        concept: 'DMARC requires that the domain in the visible "From" header aligns with the authenticated domain validated by either SPF (Return-Path) or DKIM.'
      }
    ],
    disclaimer: 'FORENSIC DISTINCTION: Header parsing extracts and structures the plaintext fields declared in the email. Text inside headers can be forged by the sending party. Complete authentication verification requires independent SPF DNS evaluation, DKIM cryptographic hash checking, and trusted mail transfer agent (MTA) log validation.'
  };
}

module.exports = {
  parseEmailHeaders,
  extractEmailAndDomain
};
