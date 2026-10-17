import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import {
  Activity,
  Terminal,
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  FileText,
  Play,
  RotateCcw,
  Download,
  Info,
  HelpCircle,
  Zap
} from 'lucide-react';

export function NetworkForensicsView() {
  const [samples, setSamples] = useState([]);
  const [selectedSample, setSelectedSample] = useState('');
  const [logText, setLogText] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSamples();
  }, []);

  async function fetchSamples() {
    try {
      const data = await apiRequest('/api/forensics/network/samples');
      if (data.success) {
        setSamples(data.samples);
      }
    } catch (err) {
      console.error('Failed to load samples:', err);
    }
  }

  async function handleLoadSample(sampleId) {
    setSelectedSample(sampleId);
    setError('');
    try {
      const data = await apiRequest(`/api/forensics/network/samples/${sampleId}`);
      if (data.success) {
        setLogText(data.content);
        setResults(null);
      }
    } catch (err) {
      setError(`Failed to load sample: ${err.message}`);
    }
  }

  async function handleAnalyzeLogs() {
    if (!logText.trim()) {
      setError('Please enter or load raw log content for analysis.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const data = await apiRequest('/api/forensics/network/analyze', {
        method: 'POST',
        body: JSON.stringify({ logContent: logText })
      });
      if (data.success) {
        setResults(data);
      }
    } catch (err) {
      setError(err.message || 'Analysis failed.');
    } finally {
      setLoading(false);
    }
  }

  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setLogText(event.target.result);
      setSelectedSample('');
      setResults(null);
    };
    reader.readAsText(file);
  }

  const severityBadgeClass = {
    CRITICAL: 'badge-critical',
    HIGH: 'badge-high',
    MEDIUM: 'badge-medium',
    LOW: 'badge-low'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#F8FAFC' }}>
          Offline Network Forensics Lab
        </h1>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          Rule-based heuristic log analyzer detecting brute force, port reconnaissance, SYN flood anomalies, DNS tunneling exfiltration, and ARP poisoning.
        </p>
      </div>

      {/* Forensic Disclaimer Box */}
      <div className="cyber-alert cyber-alert-info" style={{ fontSize: '0.8rem', lineHeight: 1.5 }}>
        <Info size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong>INVESTIGATIVE ADVISORY:</strong> Heuristic log detections represent investigative leads and statistical anomalies requiring human corroboration, not automated legal proof of an attack. No active scanning or live penetration testing is performed.
        </div>
      </div>

      {/* Preset Fictional Sample Selector */}
      <div className="cyber-card" style={{ padding: '1.25rem' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Terminal size={16} color="var(--accent-cyan)" />
          <span>Load Built-In Fictional Sample Log Scenarios</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.65rem' }}>
          {samples.map(s => {
            const isSelected = selectedSample === s.id;
            return (
              <button
                key={s.id}
                onClick={() => handleLoadSample(s.id)}
                className="btn btn-secondary"
                style={{
                  padding: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  textAlign: 'left',
                  borderColor: isSelected ? 'var(--accent-cyan)' : 'var(--border-subtle)',
                  background: isSelected ? 'rgba(6, 182, 212, 0.1)' : '#0B1322'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '0.3rem' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: isSelected ? 'var(--accent-cyan)' : '#F8FAFC' }}>
                    {s.title}
                  </span>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {s.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Log Input & Workspace */}
      <div className="cyber-card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Raw Log Stream</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
              ({logText.split('\n').filter(Boolean).length} lines)
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
              <FileText size={13} />
              <span>Upload Custom Log (.log, .txt)</span>
              <input
                type="file"
                accept=".log,.txt"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </label>
            <button
              onClick={() => {
                setLogText('');
                setResults(null);
                setSelectedSample('');
              }}
              className="btn btn-secondary btn-sm"
              title="Clear input"
            >
              <RotateCcw size={13} />
              <span>Clear</span>
            </button>
            <button
              onClick={handleAnalyzeLogs}
              disabled={loading || !logText.trim()}
              className="btn btn-primary btn-sm"
            >
              <Play size={13} />
              <span>{loading ? 'Analyzing Heuristics...' : 'Execute Heuristics'}</span>
            </button>
          </div>
        </div>

        <textarea
          value={logText}
          onChange={(e) => setLogText(e.target.value)}
          placeholder="Paste server authentication logs, firewall drop lines, DNS queries, or ARP responses here, or load a sample scenario above..."
          className="form-textarea font-mono"
          style={{
            minHeight: '180px',
            fontSize: '0.775rem',
            lineHeight: 1.6,
            background: '#070B14'
          }}
        />

        {error && (
          <div className="cyber-alert cyber-alert-danger" style={{ marginTop: '1rem' }}>
            <AlertTriangle size={16} />
            <div>{error}</div>
          </div>
        )}
      </div>

      {/* Analysis Results View */}
      {results && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Summary Strip */}
          <div className="cyber-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Lines Evaluated</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>
                  {results.totalLines}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Heuristic Findings</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: results.findingsCount > 0 ? '#FCD34D' : '#6EE7B7', fontFamily: 'JetBrains Mono, monospace' }}>
                  {results.findingsCount}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Critical Threat Patterns</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#FDA4AF', fontFamily: 'JetBrains Mono, monospace' }}>
                  {results.summary?.criticalCount || 0}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>High Threat Patterns</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#FCD34D', fontFamily: 'JetBrains Mono, monospace' }}>
                  {results.summary?.highCount || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Findings List */}
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#F8FAFC', marginBottom: '0.75rem' }}>
              Detailed Heuristic Findings ({results.findings?.length || 0})
            </h2>

            {results.findings?.length === 0 ? (
              <div className="cyber-alert cyber-alert-success">
                <CheckCircle size={18} />
                <div>No anomalous threat signatures or heuristic thresholds triggered in the supplied log stream.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {results.findings.map(finding => (
                  <div key={finding.id} className="cyber-card" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className={`badge ${severityBadgeClass[finding.severity] || 'badge-low'}`}>
                          {finding.severity}
                        </span>
                        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#F8FAFC' }}>
                          {finding.title}
                        </h3>
                      </div>
                      <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Rule: {finding.rule} (Triggered at Line {finding.lineNum})
                      </span>
                    </div>

                    {/* Matched Log Line */}
                    <div style={{
                      background: '#070B14',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.65rem 0.85rem',
                      fontSize: '0.75rem',
                      color: 'var(--accent-cyan)',
                      fontFamily: 'JetBrains Mono, monospace',
                      overflowX: 'auto',
                      marginBottom: '0.75rem'
                    }}>
                      Line {finding.lineNum}: {finding.lineText}
                    </div>

                    {/* Technical Explanation */}
                    <div style={{ fontSize: '0.825rem', color: 'var(--text-primary)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                      <strong>Forensic Assessment:</strong> {finding.explanation}
                    </div>

                    {/* Recommended Investigative Action */}
                    <div style={{
                      background: 'rgba(6, 182, 212, 0.05)',
                      border: '1px solid rgba(6, 182, 212, 0.2)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.65rem 0.85rem',
                      fontSize: '0.775rem',
                      color: 'var(--text-secondary)'
                    }}>
                      <strong style={{ color: 'var(--accent-cyan)' }}>Recommended Next Steps:</strong> {finding.recommendedAction}
                    </div>

                    {/* Additional Context Metrics */}
                    {finding.additionalContext && (
                      <div style={{
                        marginTop: '0.65rem',
                        padding: '0.5rem 0.75rem',
                        background: '#0B1322',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.725rem',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        gap: '1.25rem',
                        flexWrap: 'wrap'
                      }}>
                        {Object.entries(finding.additionalContext).map(([k, v]) => {
                          if (Array.isArray(v)) return null;
                          return (
                            <div key={k}>
                              <span style={{ textTransform: 'capitalize' }}>{k.replace(/([A-Z])/g, ' $1')}: </span>
                              <strong style={{ color: '#F8FAFC' }}>{String(v)}</strong>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
