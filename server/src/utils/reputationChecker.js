const config = require('../config/env');

/**
 * Validates and normalizes user-submitted URLs.
 * Strictly prevents SSRF by rejecting loopback, local, and RFC 1918 private IP ranges.
 */
function validateAndNormalizeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') {
    throw new Error('Please enter a valid website URL.');
  }

  let trimmed = rawUrl.trim();

  // If URL has an explicit scheme (e.g. ftp://, javascript:, file://, data:)
  const schemeMatch = trimmed.match(/^([a-zA-Z][a-zA-Z0-9+.-]*):/);
  if (schemeMatch) {
    const scheme = schemeMatch[1].toLowerCase();
    if (scheme !== 'http' && scheme !== 'https') {
      throw new Error(`Unsupported protocol '${scheme}:'. Only HTTP and HTTPS URLs can be checked.`);
    }
  } else {
    // Scheme missing: default to http://
    trimmed = `http://${trimmed}`;
  }

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch (err) {
    throw new Error('Malformed URL. Please enter a valid HTTP or HTTPS web address.');
  }

  // Reject non-http/https protocols (e.g. javascript:, file:, data:, ftp:)
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Unsupported protocol. Only HTTP and HTTPS URLs can be checked.');
  }

  const hostname = parsed.hostname.toLowerCase();

  // SSRF & Private Network Protection: Reject local and private hostnames
  if (['localhost', '127.0.0.1', '::1', '0.0.0.0'].includes(hostname) || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
    throw new Error('Security Restriction: Local and loopback addresses cannot be checked on public threat feeds.');
  }

  // Check for IPv4 private ranges (RFC 1918), link-local (169.254.x.x), and cloud metadata
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const ipMatch = hostname.match(ipv4Regex);
  if (ipMatch) {
    const octets = ipMatch.slice(1, 5).map(Number);
    const [o1, o2, o3, o4] = octets;

    if (octets.some(o => o > 255)) {
      throw new Error('Invalid IPv4 address format.');
    }

    // 10.0.0.0/8
    if (o1 === 10) {
      throw new Error('Security Restriction: Private RFC 1918 IP addresses (10.0.0.0/8) cannot be queried on public threat feeds.');
    }
    // 172.16.0.0/12
    if (o1 === 172 && o2 >= 16 && o2 <= 31) {
      throw new Error('Security Restriction: Private RFC 1918 IP addresses (172.16.0.0/12) cannot be queried on public threat feeds.');
    }
    // 192.168.0.0/16
    if (o1 === 192 && o2 === 168) {
      throw new Error('Security Restriction: Private RFC 1918 IP addresses (192.168.0.0/16) cannot be queried on public threat feeds.');
    }
    // 127.0.0.0/8 loopback
    if (o1 === 127) {
      throw new Error('Security Restriction: Loopback IP addresses cannot be queried.');
    }
    // 169.254.0.0/16 link-local and cloud metadata (169.254.169.254)
    if (o1 === 169 && o2 === 254) {
      throw new Error('Security Restriction: Link-local and cloud metadata addresses cannot be queried.');
    }
    // 224+ multicast/reserved
    if (o1 >= 224) {
      throw new Error('Security Restriction: Multicast or reserved IP addresses cannot be queried.');
    }
  }

  return {
    normalizedUrl: parsed.href,
    domain: hostname,
    protocol: parsed.protocol,
    pathname: parsed.pathname,
    port: parsed.port || (parsed.protocol === 'https:' ? '443' : '80')
  };
}

/**
 * Separate offline heuristic checks on URL structure.
 * MUST be clearly distinguished from live reputation lookups.
 */
function analyzeUrlStructureHeuristics(parsedUrl) {
  const warnings = [];
  const { normalizedUrl, domain, port } = parsedUrl;

  // 1. Host is a raw IP address
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(domain)) {
    warnings.push({
      code: 'HEUR_RAW_IP_HOST',
      title: 'Host is a Raw IP Address',
      severity: 'HIGH',
      description: 'The URL uses a numerical IP address instead of a domain name. Attackers frequently use raw IPs to bypass newly-registered domain reputations.'
    });
  }

  // 2. Excessive Subdomains
  const domainParts = domain.split('.');
  if (domainParts.length >= 4 && !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(domain)) {
    warnings.push({
      code: 'HEUR_EXCESSIVE_SUBDOMAINS',
      title: 'Excessive Subdomain Segments',
      severity: 'MEDIUM',
      description: `Domain contains ${domainParts.length} levels (${domain}). Phishing sites frequently stack brand names into subdomains (e.g. paypal.com.verify.attacker.com).`
    });
  }

  // 3. Punycode / IDN Homograph
  if (domain.includes('xn--')) {
    warnings.push({
      code: 'HEUR_PUNYCODE_IDN',
      title: 'Internationalized Domain Name (Punycode)',
      severity: 'HIGH',
      description: 'Domain contains "xn--" punycode prefix. Attackers use lookalike Cyrillic or Greek characters to impersonate legitimate brands.'
    });
  }

  // 4. Non-Standard Port
  if (!['80', '443'].includes(port)) {
    warnings.push({
      code: 'HEUR_NON_STANDARD_PORT',
      title: `Non-Standard Web Port (Port ${port})`,
      severity: 'LOW',
      description: `Web traffic is directed to port ${port} instead of standard 80/443, commonly seen on development proxies or malicious redirectors.`
    });
  }

  // 5. Sensitive Brand Keywords in Subdomains or Path
  const sensitiveKeywords = ['login', 'signin', 'verify', 'update', 'banking', 'secure', 'password', 'paypal', 'appleid', 'microsoft', 'google'];
  const matchedKeywords = sensitiveKeywords.filter(k => 
    (domainParts.length > 2 && domainParts.slice(0, -2).some(p => p.includes(k))) ||
    normalizedUrl.toLowerCase().includes(`/${k}`)
  );

  if (matchedKeywords.length > 0 && !domain.endsWith('paypal.com') && !domain.endsWith('google.com') && !domain.endsWith('microsoft.com') && !domain.endsWith('apple.com')) {
    warnings.push({
      code: 'HEUR_SENSITIVE_KEYWORDS',
      title: 'Credential/Authentication Keywords Detected',
      severity: 'MEDIUM',
      description: `URL contains authentication keywords (${matchedKeywords.join(', ')}) on an external domain (${domain}).`
    });
  }

  return warnings;
}

/**
 * Query Google Safe Browsing Lookup API (v4 threatMatches:find)
 * Official doc: https://developers.google.com/safe-browsing/reference/rest/v4/threatMatches/find
 */
async function queryGoogleSafeBrowsing(normalizedUrl) {
  const apiKey = config.GOOGLE_SAFE_BROWSING_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return {
      provider: 'Google Safe Browsing',
      queried: false,
      status: 'Could Not Check',
      configured: false,
      threatFound: false,
      matches: [],
      threatTypes: [],
      message: 'Google Safe Browsing API key is not configured in backend environment variables (GOOGLE_SAFE_BROWSING_API_KEY). Live query was not performed.',
      checkedAt: new Date().toISOString()
    };
  }

  const endpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${encodeURIComponent(apiKey)}`;
  const payload = {
    client: {
      clientId: 'cybershield-forensics-platform',
      clientVersion: '1.0.0'
    },
    threatInfo: {
      threatTypes: [
        'MALWARE',
        'SOCIAL_ENGINEERING',
        'UNWANTED_SOFTWARE',
        'POTENTIALLY_HARMFUL_APPLICATION'
      ],
      platformTypes: ['ANY_PLATFORM'],
      threatEntryTypes: ['URL'],
      threatEntries: [
        { url: normalizedUrl }
      ]
    }
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      let errorText = '';
      try {
        const errorJson = await response.json();
        errorText = errorJson.error ? errorJson.error.message : JSON.stringify(errorJson);
      } catch (e) {
        errorText = await response.text();
      }

      return {
        provider: 'Google Safe Browsing',
        queried: true,
        status: 'Could Not Check',
        configured: true,
        threatFound: false,
        matches: [],
        threatTypes: [],
        message: `Google Safe Browsing API returned HTTP ${response.status}: ${errorText || response.statusText}`,
        checkedAt: new Date().toISOString()
      };
    }

    const data = await response.json();
    const matches = data.matches || [];
    const threatTypes = matches.map(m => m.threatType);

    if (matches.length > 0) {
      return {
        provider: 'Google Safe Browsing',
        queried: true,
        status: 'Known Threat Found',
        configured: true,
        threatFound: true,
        matches,
        threatTypes,
        message: `Google Safe Browsing identified this URL on threat lists: ${threatTypes.join(', ')}.`,
        checkedAt: new Date().toISOString()
      };
    }

    return {
      provider: 'Google Safe Browsing',
      queried: true,
      status: 'No Match Found',
      configured: true,
      threatFound: false,
      matches: [],
      threatTypes: [],
      message: 'No match found in Google Safe Browsing database (not currently listed as a known threat).',
      checkedAt: new Date().toISOString()
    };
  } catch (err) {
    return {
      provider: 'Google Safe Browsing',
      queried: true,
      status: 'Could Not Check',
      configured: true,
      threatFound: false,
      matches: [],
      threatTypes: [],
      message: `Network/Timeout error communicating with Google Safe Browsing: ${err.message}`,
      checkedAt: new Date().toISOString()
    };
  }
}

/**
 * Query VirusTotal API (v3 URL report)
 * Official doc: https://docs.virustotal.com/reference/url-info
 */
async function queryVirusTotal(normalizedUrl) {
  const apiKey = config.VIRUSTOTAL_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return {
      provider: 'VirusTotal',
      queried: false,
      status: 'Could Not Check',
      configured: false,
      threatFound: false,
      detectionCounts: null,
      message: 'VirusTotal API key is not configured in backend environment variables (VIRUSTOTAL_API_KEY). Live query was not performed.',
      checkedAt: new Date().toISOString()
    };
  }

  // Base64URL encoding without padding as required by VirusTotal v3
  const urlId = Buffer.from(normalizedUrl).toString('base64url');
  const endpoint = `https://www.virustotal.com/api/v3/urls/${urlId}`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'x-apikey': apiKey,
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(10000)
    });

    if (response.status === 404) {
      return {
        provider: 'VirusTotal',
        queried: true,
        status: 'No Match Found',
        configured: true,
        threatFound: false,
        detectionCounts: null,
        message: 'No existing analysis report in VirusTotal dataset for this URL.',
        checkedAt: new Date().toISOString()
      };
    }

    if (!response.ok) {
      let errorText = '';
      try {
        const errorJson = await response.json();
        errorText = errorJson.error ? errorJson.error.message : JSON.stringify(errorJson);
      } catch (e) {
        errorText = await response.text();
      }

      return {
        provider: 'VirusTotal',
        queried: true,
        status: 'Could Not Check',
        configured: true,
        threatFound: false,
        detectionCounts: null,
        message: `VirusTotal API returned HTTP ${response.status}: ${errorText || response.statusText}`,
        checkedAt: new Date().toISOString()
      };
    }

    const data = await response.json();
    const stats = (data.data && data.data.attributes && data.data.attributes.last_analysis_stats) || {};
    const malicious = stats.malicious || 0;
    const suspicious = stats.suspicious || 0;
    const harmless = stats.harmless || 0;
    const undetected = stats.undetected || 0;

    const threatFound = (malicious > 0 || suspicious > 0);

    return {
      provider: 'VirusTotal',
      queried: true,
      status: threatFound ? 'Known Threat Found' : 'No Match Found',
      configured: true,
      threatFound,
      detectionCounts: {
        malicious,
        suspicious,
        harmless,
        undetected,
        totalEngines: malicious + suspicious + harmless + undetected
      },
      categories: (data.data && data.data.attributes && data.data.attributes.categories) || {},
      reputationScore: (data.data && data.data.attributes && data.data.attributes.reputation) ?? null,
      message: threatFound
        ? `VirusTotal report: Flagged by ${malicious} engine(s) as malicious and ${suspicious} engine(s) as suspicious.`
        : `VirusTotal report: 0 engines flagged this URL as malicious (harmless: ${harmless}, undetected: ${undetected}).`,
      checkedAt: new Date().toISOString()
    };
  } catch (err) {
    return {
      provider: 'VirusTotal',
      queried: true,
      status: 'Could Not Check',
      configured: true,
      threatFound: false,
      detectionCounts: null,
      message: `Network/Timeout error communicating with VirusTotal: ${err.message}`,
      checkedAt: new Date().toISOString()
    };
  }
}

/**
 * Main Reputation Checker Orchestrator
 */
async function checkUrlReputation(rawUrl) {
  const parsed = validateAndNormalizeUrl(rawUrl);
  const heuristics = analyzeUrlStructureHeuristics(parsed);

  // Query both reputation providers in parallel
  const [googleResult, vtResult] = await Promise.all([
    queryGoogleSafeBrowsing(parsed.normalizedUrl),
    queryVirusTotal(parsed.normalizedUrl)
  ]);

  // Overall status calculation
  let overallStatus = 'Could Not Check';

  if (googleResult.status === 'Known Threat Found' || vtResult.status === 'Known Threat Found') {
    overallStatus = 'Known Threat Found';
  } else if (googleResult.status === 'No Match Found' || vtResult.status === 'No Match Found') {
    overallStatus = 'No Match Found';
  } else {
    overallStatus = 'Could Not Check';
  }

  const disclaimer = "Important Legal & Forensic Disclaimer: Reputation results are sourced from external third-party threat intelligence databases (Google Safe Browsing / VirusTotal). A 'No Match Found' result indicates this URL is not currently listed in those databases, but DOES NOT guarantee or prove that the website is safe or benign. Phishing websites frequently appear and operate before threat feeds index them. Do not treat external reputation checks as conclusive digital evidence.";

  return {
    submittedUrl: rawUrl,
    normalizedUrl: parsed.normalizedUrl,
    domain: parsed.domain,
    protocol: parsed.protocol,
    port: parsed.port,
    overallStatus, // 'Known Threat Found' | 'No Match Found' | 'Could Not Check'
    checkedAt: new Date().toISOString(),
    reputationSources: {
      googleSafeBrowsing: googleResult,
      virusTotal: vtResult
    },
    heuristicWarnings: heuristics,
    disclaimer
  };
}

module.exports = {
  validateAndNormalizeUrl,
  analyzeUrlStructureHeuristics,
  queryGoogleSafeBrowsing,
  queryVirusTotal,
  checkUrlReputation
};
