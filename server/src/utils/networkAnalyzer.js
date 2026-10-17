/**
 * Offline Network Forensics Analyzer
 * Evaluates raw network and system logs against explainable cybersecurity heuristics.
 */

function calculateShannonEntropy(str) {
  const map = {};
  for (let i = 0; i < str.length; i++) {
    const c = str[i];
    map[c] = (map[c] || 0) + 1;
  }
  let entropy = 0;
  for (const c in map) {
    const p = map[c] / str.length;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

function analyzeNetworkLogs(logContent) {
  if (!logContent || typeof logContent !== 'string') {
    return {
      totalLines: 0,
      findingsCount: 0,
      findings: [],
      summary: {},
      disclaimer: 'No log content provided.'
    };
  }

  const lines = logContent.split(/\r?\n/).filter(line => line.trim().length > 0);
  const findings = [];

  // Track state for multi-line heuristics
  const failedLoginsByIp = {}; // ip -> [{ lineNum, line, user, time }]
  const portsByIp = {}; // ip -> Set(ports)
  let synPacketsCount = 0;
  let ackPacketsCount = 0;
  const synSampleLines = [];

  const ipToMacMap = {}; // ip -> Set(mac)
  const arpSampleLines = [];

  // Heuristic regex patterns
  const failedAuthRegex = /(?:Failed password for (?:invalid user )?([a-zA-Z0-9._-]+) from|authentication failure.*rhost=([a-zA-Z0-9._-]+)|login failed for user ([a-zA-Z0-9._-]+) from ([0-9.]+)|AUTH_FAIL.*client=([0-9.]+))/i;
  const ipExtractRegex = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g;
  const portScanRegex = /(?:(?:SRC|src)=([0-9.]+).*(?:DPT|dst_port|port)=([0-9]+)|([0-9.]+):[0-9]+ -> [0-9.]+:([0-9]+) \[SYN\])/i;
  const dnsRegex = /(?:query(?:\[[A-Z]+\])?: ([a-zA-Z0-9._-]+) IN|DNS query: ([a-zA-Z0-9._-]+))/i;
  const arpRegex = /arp,?\s+reply\s+([0-9.]+)\s+is-at\s+([0-9a-fA-F:]{17})/i;

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // 1. Detect Failed Authentication
    const authMatch = line.match(failedAuthRegex);
    if (authMatch) {
      const ips = line.match(ipExtractRegex);
      const ip = ips ? ips[0] : 'unknown';
      const user = authMatch[1] || authMatch[2] || authMatch[3] || 'unknown';

      if (!failedLoginsByIp[ip]) failedLoginsByIp[ip] = [];
      failedLoginsByIp[ip].push({ lineNum, line, user });
    }

    // 2. Detect Port Scans
    const portMatch = line.match(portScanRegex);
    if (portMatch) {
      const ip = portMatch[1] || (line.match(ipExtractRegex) || [])[0];
      const port = portMatch[2] || portMatch[4];
      if (ip && port) {
        if (!portsByIp[ip]) portsByIp[ip] = { ports: new Set(), samples: [] };
        portsByIp[ip].ports.add(port);
        if (portsByIp[ip].samples.length < 5) {
          portsByIp[ip].samples.push({ lineNum, line, port });
        }
      }
    }

    // 3. SYN Flood Detection
    if (line.includes('[SYN]') || line.includes('flags [S]') || line.includes('SYN_RECV')) {
      synPacketsCount++;
      if (synSampleLines.length < 5) {
        synSampleLines.push({ lineNum, line });
      }
    } else if (line.includes('[ACK]') || line.includes('flags [.]')) {
      ackPacketsCount++;
    }

    // 4. DNS Tunneling & Suspicious Queries
    const dnsMatch = line.match(dnsRegex);
    if (dnsMatch) {
      const query = dnsMatch[1] || dnsMatch[2];
      if (query) {
        const parts = query.split('.');
        const subdomain = parts[0] || '';
        const entropy = calculateShannonEntropy(subdomain);

        const isLong = subdomain.length > 32;
        const isHighEntropy = entropy > 3.8 && subdomain.length > 16;
        const isSuspiciousTld = /\.(xyz|top|pw|tk|cf|onion|ru)$/i.test(query);

        if (isLong || isHighEntropy || isSuspiciousTld) {
          findings.push({
            id: `FIND-DNS-${lineNum}`,
            rule: 'DNS_TUNNELING_OR_EXFILTRATION',
            severity: isHighEntropy ? 'HIGH' : 'MEDIUM',
            title: 'Suspicious High-Entropy DNS Query Detected',
            lineNum,
            lineText: line,
            explanation: `Observed DNS query '${query}' with subdomain length ${subdomain.length} and Shannon entropy score of ${entropy.toFixed(2)}. This high level of randomness is characteristic of DNS tunneling protocols (e.g., iodine, dnscat2) or algorithmic command-and-control (C2) domains.`,
            recommendedAction: 'Inspect authoritative nameserver for this domain, isolate querying host, and cross-reference with DNS sinkhole logs.'
          });
        }
      }
    }

    // 5. ARP Poisoning / Spoofing
    const arpMatch = line.match(arpRegex);
    if (arpMatch && arpMatch[1] && arpMatch[2]) {
      const ip = arpMatch[1];
      const mac = arpMatch[2].toLowerCase();
      if (!ipToMacMap[ip]) ipToMacMap[ip] = new Map();
      
      const currentMacMap = ipToMacMap[ip];
      if (currentMacMap.has(mac)) {
        currentMacMap.get(mac).count++;
      } else {
        currentMacMap.set(mac, { firstSeenLine: lineNum, line, count: 1 });
      }

      if (currentMacMap.size > 1) {
        findings.push({
          id: `FIND-ARP-${lineNum}`,
          rule: 'ARP_SPOOFING_DETECTED',
          severity: 'CRITICAL',
          title: 'Duplicate MAC Address Claiming Identical IP (ARP Poisoning)',
          lineNum,
          lineText: line,
          explanation: `IP address ${ip} was mapped to multiple distinct MAC addresses (${Array.from(currentMacMap.keys()).join(' vs ')}). This strongly indicates an ARP spoofing attack designed to divert network traffic through an attacker-controlled host (Man-in-the-Middle).`,
          recommendedAction: 'Enable Dynamic ARP Inspection (DAI) on the switch, inspect CAM tables, and verify the legitimate gateway MAC address.'
        });
      }
    }
  });

  // Evaluate aggregated failed logins
  for (const [ip, occurrences] of Object.entries(failedLoginsByIp)) {
    if (occurrences.length >= 4) {
      const usersTargeted = Array.from(new Set(occurrences.map(o => o.user))).join(', ');
      findings.push({
        id: `FIND-AUTH-${occurrences[0].lineNum}`,
        rule: 'AUTH_BRUTE_FORCE',
        severity: occurrences.length > 8 ? 'CRITICAL' : 'HIGH',
        title: 'Repeated Authentication Failures (Brute Force / Credential Stuffing)',
        lineNum: occurrences[0].lineNum,
        lineText: occurrences[0].line,
        explanation: `Host ${ip} generated ${occurrences.length} failed login attempts targeting account(s): [${usersTargeted}]. Pattern matches automated brute-force password guessing.`,
        recommendedAction: 'Implement host-level IP block (fail2ban), enforce account lockout, and verify if any subsequent attempt succeeded from this source.',
        additionalContext: {
          totalFailures: occurrences.length,
          sourceIp: ip,
          sampleLines: occurrences.slice(0, 4).map(o => `Line ${o.lineNum}: ${o.line}`)
        }
      });
    }
  }

  // Evaluate aggregated port scans
  for (const [ip, data] of Object.entries(portsByIp)) {
    if (data.ports.size >= 4) {
      const scannedPorts = Array.from(data.ports).sort((a, b) => Number(a) - Number(b)).join(', ');
      findings.push({
        id: `FIND-SCAN-${data.samples[0].lineNum}`,
        rule: 'TCP_PORT_SCAN',
        severity: 'HIGH',
        title: 'Multi-Port Reconnaissance Scan Detected',
        lineNum: data.samples[0].lineNum,
        lineText: data.samples[0].line,
        explanation: `Host ${ip} probed ${data.ports.size} distinct destination ports (${scannedPorts}). This sequential probe matches reconnaissance activities such as Nmap port discovery.`,
        recommendedAction: 'Check firewall drop logs for source host ${ip}, verify whether any targeted ports were open, and review honeypot triggers.',
        additionalContext: {
          scannedPortCount: data.ports.size,
          ports: scannedPorts
        }
      });
    }
  }

  // Evaluate SYN flood ratio
  if (synPacketsCount >= 10) {
    const ackRatio = ackPacketsCount / (synPacketsCount || 1);
    if (ackRatio < 0.2) {
      findings.push({
        id: `FIND-SYN-${synSampleLines[0].lineNum}`,
        rule: 'SYN_FLOOD_ANOMALY',
        severity: 'CRITICAL',
        title: 'TCP SYN Flood / Asymmetric Half-Open Connection Spike',
        lineNum: synSampleLines[0].lineNum,
        lineText: synSampleLines[0].line,
        explanation: `Recorded ${synPacketsCount} TCP SYN packets with only ${ackPacketsCount} accompanying ACK completions (completion ratio ${(ackRatio * 100).toFixed(1)}%). High asymmetry indicates TCP half-open resource starvation attack.`,
        recommendedAction: 'Enable SYN cookies on kernel (net.ipv4.tcp_syncookies=1), reduce SYN-RECEIVED timeout, and engage upstream DDoS mitigation.',
        additionalContext: {
          synCount: synPacketsCount,
          ackCount: ackPacketsCount,
          handshakeCompletionRatio: `${(ackRatio * 100).toFixed(1)}%`
        }
      });
    }
  }

  const summary = {
    totalLines: lines.length,
    findingsCount: findings.length,
    criticalCount: findings.filter(f => f.severity === 'CRITICAL').length,
    highCount: findings.filter(f => f.severity === 'HIGH').length,
    mediumCount: findings.filter(f => f.severity === 'MEDIUM').length,
    rulesTriggered: Array.from(new Set(findings.map(f => f.rule)))
  };

  return {
    totalLines: lines.length,
    findingsCount: findings.length,
    summary,
    findings,
    disclaimer: 'LEGAL & FORENSIC ADVISORY: Automated pattern matching represents investigative leads and heuristic anomalies requiring expert manual verification. Detections do not constitute legal proof of malicious intent or unauthorized access.'
  };
}

module.exports = {
  analyzeNetworkLogs
};
