import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import {
  Globe,
  Shield,
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Info,
  ExternalLink,
  FolderPlus,
  Lock,
  ArrowRight
} from 'lucide-react';

export function WebsitePhishingCheckView() {
  const [url, setUrl] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusInfo, setStatusInfo] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  
  // Save to case state
  const [incidents, setIncidents] = useState([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState('');
  const [investigatorNote, setInvestigatorNote] = useState('');
  const [savingCase, setSavingCase] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [savedEvidenceId, setSavedEvidenceId] = useState('');

  // Fetch service configuration status and active incidents on mount
  useEffect(() => {
    fetchStatus();
    fetchIncidents();
  }, []);

  async function fetchStatus() {
    try {
      const data = await apiRequest('/api/forensics/url/status');
      if (data && data.services) {
        setStatusInfo(data.services);
      }
    } catch (err) {
      console.warn('Could not fetch URL reputation service status:', err.message);
    }
  }

  async function fetchIncidents() {
    try {
      const data = await apiRequest('/api/incidents');
      if (data && data.incidents) {
        setIncidents(data.incidents);
        if (data.incidents.length > 0) {
          setSelectedIncidentId(data.incidents[0].id);
        }
      }
    } catch (err) {
      console.warn('Could not fetch incidents list:', err.message);
    }
  }

  async function handleCheck(e) {
    if (e) e.preventDefault();
    if (!url.trim()) {
      setError('Please enter a website URL.');
      return;
    }
    if (!consentGiven) {
      setError('You must confirm consent before querying external threat intelligence databases.');
      return;
    }

    setError('');
    setResult(null);
    setSaveSuccessMsg('');
    setSavedEvidenceId('');
    setLoading(true);

    try {
      const data = await apiRequest('/api/forensics/url/check', {
        method: 'POST',
        body: JSON.stringify({
          url: url.trim(),
          consentGiven: true
        })
      });

      setResult(data);
    } catch (err) {
      setError(err.message || 'Failed to check website reputation.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveToCase() {
    if (!result || !result.checkId) return;
    if (!selectedIncidentId) {
      setError('Please select an investigation case to attach this check to.');
      return;
    }

    setSavingCase(true);
    setError('');

    try {
      const data = await apiRequest('/api/forensics/url/save-to-case', {
        method: 'POST',
        body: JSON.stringify({
          checkId: result.checkId,
          incidentId: selectedIncidentId,
          notes: investigatorNote.trim()
        })
      });

      setSaveSuccessMsg(`Successfully saved to case ${selectedIncidentId}! An official investigation note and a verified forensic evidence artifact have been recorded in the case.`);
      if (data.evidenceId) {
        setSavedEvidenceId(data.evidenceId);
      }
    } catch (err) {
      setError(err.message || 'Failed to save check to case.');
    } finally {
      setSavingCase(false);
    }
  }

  function handlePreset(testUrl) {
    setUrl(testUrl);
    setConsentGiven(true);
    setError('');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Introduction Card */}
      <div className="cyber-card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <Globe size={20} color="var(--accent-cyan)" />
              <span>Real Website Phishing & Reputation Check</span>
            </h2>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', maxWidth: '750px', lineHeight: 1.5 }}>
              Check website addresses (URLs) against real threat intelligence feeds from <strong>Google Safe Browsing</strong> and <strong>VirusTotal</strong> to determine if a domain has been flagged for phishing, malware, or credential harvesting.
            </p>
          </div>

          {/* Configured Status Badges */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div style={{
              fontSize: '0.75rem',
              padding: '0.35rem 0.65rem',
              borderRadius: 'var(--radius-sm)',
              background: statusInfo?.googleSafeBrowsing?.configured ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.1)',
              border: `1px solid ${statusInfo?.googleSafeBrowsing?.configured ? 'rgba(16, 185, 129, 0.4)' : 'rgba(148, 163, 184, 0.2)'}`,
              color: statusInfo?.googleSafeBrowsing?.configured ? 'var(--status-success)' : 'var(--text-muted)'
            }}>
              Google Safe Browsing: {statusInfo?.googleSafeBrowsing?.configured ? 'Configured' : 'Not Set in .env'}
            </div>

            <div style={{
              fontSize: '0.75rem',
              padding: '0.35rem 0.65rem',
              borderRadius: 'var(--radius-sm)',
              background: statusInfo?.virusTotal?.configured ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.1)',
              border: `1px solid ${statusInfo?.virusTotal?.configured ? 'rgba(16, 185, 129, 0.4)' : 'rgba(148, 163, 184, 0.2)'}`,
              color: statusInfo?.virusTotal?.configured ? 'var(--status-success)' : 'var(--text-muted)'
            }}>
              VirusTotal: {statusInfo?.virusTotal?.configured ? 'Configured' : 'Not Set in .env'}
            </div>
          </div>
        </div>

        {/* Security & Privacy Notice */}
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem 1rem',
          background: 'rgba(234, 179, 8, 0.08)',
          border: '1px solid rgba(234, 179, 8, 0.3)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.8rem',
          color: '#F8FAFC',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'flex-start'
        }}>
          <Lock size={18} color="var(--status-warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ color: 'var(--status-warning)' }}>Privacy & Investigation Notice:</strong>
            <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              This tool only queries reputation databases using the URL string. It <strong>never opens or visits the website</strong> and never sends API keys to your browser. External threat intelligence providers (Google / VirusTotal) may log and retain queried URLs. If you are investigating confidential or internal corporate networks, do not submit private URLs without appropriate authorization.
            </p>
          </div>
        </div>
      </div>

      {/* Input Form & Test Presets */}
      <div className="cyber-card" style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#F8FAFC', marginBottom: '0.75rem' }}>
          Enter Website URL to Check
        </h3>

        {/* Presets */}
        <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>Try Safe Sample URLs:</span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
            onClick={() => handlePreset('http://malware.testing.google.test/testing/malware/')}
          >
            Google Test Threat (Malware)
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
            onClick={() => handlePreset('https://www.google.com')}
          >
            Clean Baseline (Google.com)
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
            onClick={() => handlePreset('http://198.51.100.45:8080/secure/bank-login/verify-credentials.php')}
          >
            Suspicious URL Structure Example
          </button>
        </div>

        <form onSubmit={handleCheck}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <input
              type="text"
              className="input-cyber"
              style={{ flex: 1, minWidth: '280px' }}
              placeholder="e.g. https://secure-login-portal.phishing-example.com/verify"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !url.trim() || !consentGiven}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Globe size={16} />
              <span>{loading ? 'Checking Reputation...' : 'Check Website'}</span>
            </button>
          </div>

          {/* Consent Checkbox */}
          <div style={{ marginTop: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              id="reputation-consent"
              checked={consentGiven}
              onChange={(e) => setConsentGiven(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
            />
            <label htmlFor="reputation-consent" style={{ fontSize: '0.8rem', color: '#F8FAFC', cursor: 'pointer' }}>
              I understand and consent to checking this URL against external reputation databases (Google Safe Browsing & VirusTotal).
            </label>
          </div>
        </form>

        {error && (
          <div className="cyber-alert cyber-alert-error" style={{ marginTop: '1rem', fontSize: '0.825rem' }}>
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Results Section */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Main Assessment Header Card */}
          <div className="cyber-card" style={{
            padding: '1.25rem',
            borderLeft: `4px solid ${
              result.overallStatus === 'Known Threat Found'
                ? 'var(--status-danger)'
                : result.overallStatus === 'No Match Found'
                ? 'var(--status-warning)'
                : 'var(--border-subtle)'
            }`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                  Overall Threat Assessment
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginTop: '0.25rem' }}>
                  {result.overallStatus === 'Known Threat Found' && (
                    <span className="badge badge-danger" style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <AlertTriangle size={16} />
                      <span>Known Threat Found</span>
                    </span>
                  )}
                  {result.overallStatus === 'No Match Found' && (
                    <span className="badge badge-warning" style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <ShieldAlert size={16} />
                      <span>No Match Found</span>
                    </span>
                  )}
                  {result.overallStatus === 'Could Not Check' && (
                    <span className="badge badge-neutral" style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Info size={16} />
                      <span>Could Not Check</span>
                    </span>
                  )}
                </div>
              </div>

              <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                <div>Checked at: {new Date(result.checkedAt).toLocaleString()}</div>
                <div>Record ID: <code>{result.checkId}</code></div>
              </div>
            </div>

            {/* Crucial Educational Disclaimer */}
            <div style={{
              marginTop: '1rem',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              background: '#0B1322',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.775rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.45
            }}>
              <strong>Important Digital Forensics Rule:</strong> {result.disclaimer}
            </div>

            {/* Submitted URL Details Table */}
            <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.8rem' }}>
              <div style={{ background: '#0F172A', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.725rem' }}>Submitted Domain:</span>
                <strong style={{ color: '#F8FAFC', wordBreak: 'break-all' }}>{result.domain}</strong>
              </div>
              <div style={{ background: '#0F172A', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.725rem' }}>Full Normalized URL:</span>
                <span style={{ color: '#F8FAFC', wordBreak: 'break-all', fontFamily: 'monospace' }}>{result.normalizedUrl}</span>
              </div>
              <div style={{ background: '#0F172A', padding: '0.6rem 0.8rem', borderRadius: 'var(--radius-sm)' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.725rem' }}>Protocol & Port:</span>
                <span style={{ color: '#F8FAFC' }}>{result.protocol} (Port {result.port})</span>
              </div>
            </div>
          </div>

          {/* Reputation Sources Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {/* Source 1: Google Safe Browsing */}
            <div className="cyber-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4 style={{ fontSize: '0.925rem', fontWeight: 600, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Shield size={16} color="var(--accent-cyan)" />
                  <span>Google Safe Browsing</span>
                </h4>
                <span className={`badge ${
                  result.reputationSources.googleSafeBrowsing.status === 'Known Threat Found'
                    ? 'badge-danger'
                    : result.reputationSources.googleSafeBrowsing.status === 'No Match Found'
                    ? 'badge-success'
                    : 'badge-neutral'
                }`}>
                  {result.reputationSources.googleSafeBrowsing.status}
                </span>
              </div>

              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '0.75rem' }}>
                {result.reputationSources.googleSafeBrowsing.message}
              </p>

              {result.reputationSources.googleSafeBrowsing.threatTypes && result.reputationSources.googleSafeBrowsing.threatTypes.length > 0 && (
                <div style={{ marginTop: '0.5rem', background: '#0B1322', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', display: 'block' }}>Threat Categories:</span>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                    {result.reputationSources.googleSafeBrowsing.threatTypes.map((t, idx) => (
                      <span key={idx} className="badge badge-danger" style={{ fontSize: '0.725rem' }}>{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Source 2: VirusTotal */}
            <div className="cyber-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4 style={{ fontSize: '0.925rem', fontWeight: 600, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Shield size={16} color="var(--accent-purple)" />
                  <span>VirusTotal Threat Intelligence</span>
                </h4>
                <span className={`badge ${
                  result.reputationSources.virusTotal.status === 'Known Threat Found'
                    ? 'badge-danger'
                    : result.reputationSources.virusTotal.status === 'No Match Found'
                    ? 'badge-success'
                    : 'badge-neutral'
                }`}>
                  {result.reputationSources.virusTotal.status}
                </span>
              </div>

              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45, marginBottom: '0.75rem' }}>
                {result.reputationSources.virusTotal.message}
              </p>

              {result.reputationSources.virusTotal.detectionCounts && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem', marginTop: '0.5rem', textAlign: 'center' }}>
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.4rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--status-danger)', display: 'block' }}>Malicious</span>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--status-danger)' }}>{result.reputationSources.virusTotal.detectionCounts.malicious}</strong>
                  </div>
                  <div style={{ background: 'rgba(234, 179, 8, 0.1)', padding: '0.4rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--status-warning)', display: 'block' }}>Suspicious</span>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--status-warning)' }}>{result.reputationSources.virusTotal.detectionCounts.suspicious}</strong>
                  </div>
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.4rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--status-success)', display: 'block' }}>Harmless</span>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--status-success)' }}>{result.reputationSources.virusTotal.detectionCounts.harmless}</strong>
                  </div>
                  <div style={{ background: '#0F172A', padding: '0.4rem', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Undetected</span>
                    <strong style={{ fontSize: '0.95rem', color: '#F8FAFC' }}>{result.reputationSources.virusTotal.detectionCounts.undetected}</strong>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Separate URL Structure & Heuristics Section */}
          <div className="cyber-card" style={{ padding: '1.25rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#F8FAFC', marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={18} color="var(--status-warning)" />
              <span>Heuristic URL Structure Analysis (Offline Pattern Checks)</span>
            </h4>
            <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              These are static structural checks performed locally by CyberShield. They are <strong>separate from live external reputation databases</strong>.
            </p>

            {result.heuristicWarnings && result.heuristicWarnings.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {result.heuristicWarnings.map((w, idx) => (
                  <div key={idx} style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    background: '#0B1322',
                    borderLeft: `3px solid ${w.severity === 'HIGH' ? 'var(--status-danger)' : 'var(--status-warning)'}`,
                    fontSize: '0.8rem'
                  }}>
                    <strong style={{ color: '#F8FAFC' }}>{w.title}:</strong>
                    <span style={{ color: 'var(--text-secondary)', marginLeft: '0.4rem' }}>{w.description}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '0.8rem', color: 'var(--status-success)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle size={16} />
                <span>No anomalous structural patterns detected (standard domain name, standard web port, no IP hostname).</span>
              </div>
            )}
          </div>

          {/* Recommended Next Steps */}
          <div className="cyber-card" style={{ padding: '1.25rem', background: '#080E1A' }}>
            <h4 style={{ fontSize: '0.925rem', fontWeight: 600, color: '#F8FAFC', marginBottom: '0.5rem' }}>
              What should an investigator do next?
            </h4>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {result.overallStatus === 'Known Threat Found' ? (
                <>
                  <li><strong>Isolate and Block:</strong> Flag this domain in firewall/proxy egress filters to prevent other users from visiting it.</li>
                  <li><strong>Attach to Docket:</strong> Save this check to the associated case file below to preserve the threat intelligence finding.</li>
                  <li><strong>Check Email Headers:</strong> Use the Email Forensics tab to check if any incoming emails routed through or linked to this domain.</li>
                </>
              ) : (
                <>
                  <li><strong>Do Not Assume Benign:</strong> If this URL was received in an unsolicited email or SMS, treat it as suspicious even with "No Match Found".</li>
                  <li><strong>Inspect Whois / Registration Date:</strong> Newly registered domains (&lt; 30 days old) have no reputation history and are frequently malicious.</li>
                  <li><strong>Check Credentials:</strong> If a user entered their credentials on this website, initiate immediate password resets and session revocations.</li>
                </>
              )}
            </ul>
          </div>

          {/* Save to Investigation Case Section */}
          <div className="cyber-card" style={{ padding: '1.25rem', border: '1px solid var(--accent-cyan)' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <FolderPlus size={18} color="var(--accent-cyan)" />
              <span>Save Reputation Finding to Investigation Case</span>
            </h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.85rem' }}>
              Preserve this reputation lookup as an investigation note and create a verifiable forensic evidence artifact with a SHA-256 digital fingerprint in <strong>Evidence & Hash Check</strong>.
            </p>

            {saveSuccessMsg ? (
              <div className="cyber-alert cyber-alert-success" style={{ fontSize: '0.825rem' }}>
                <CheckCircle size={18} />
                <div>
                  <strong>{saveSuccessMsg}</strong>
                  {savedEvidenceId && (
                    <div style={{ marginTop: '0.25rem' }}>
                      Evidence Artifact ID: <code>{savedEvidenceId}</code> (Viewable under Evidence & Hash Check)
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.775rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                    Select Associated Case Docket:
                  </label>
                  <select
                    className="input-cyber"
                    value={selectedIncidentId}
                    onChange={(e) => setSelectedIncidentId(e.target.value)}
                    disabled={savingCase}
                    style={{ width: '100%', maxWidth: '450px' }}
                  >
                    {incidents.map((inc) => (
                      <option key={inc.id} value={inc.id}>
                        {inc.id} — {inc.title} ({inc.severity})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.775rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                    Optional Investigator Observation / Case Note:
                  </label>
                  <textarea
                    className="input-cyber"
                    rows={2}
                    placeholder="e.g. Reputation search conducted during initial triage. External feeds flagged URL as phishing portal."
                    value={investigatorNote}
                    onChange={(e) => setInvestigatorNote(e.target.value)}
                    disabled={savingCase}
                    style={{ width: '100%', resize: 'vertical' }}
                  />
                </div>

                <div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSaveToCase}
                    disabled={savingCase}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    <FolderPlus size={16} />
                    <span>{savingCase ? 'Saving to Case & Generating Evidence...' : 'Save to Investigation Case'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
