import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import {
  Mail,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  FileText,
  Play,
  RotateCcw,
  Info,
  HelpCircle,
  ArrowDown,
  Layers,
  ExternalLink
} from 'lucide-react';

export function EmailForensicsView() {
  const [samples, setSamples] = useState([]);
  const [selectedSample, setSelectedSample] = useState('');
  const [headerText, setHeaderText] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSamples();
  }, []);

  async function fetchSamples() {
    try {
      const data = await apiRequest('/api/forensics/email/samples');
      if (data.success) {
        setSamples(data.samples);
      }
    } catch (err) {
      console.error('Failed to load email samples:', err);
    }
  }

  async function handleLoadSample(sampleId) {
    setSelectedSample(sampleId);
    setError('');
    try {
      const data = await apiRequest(`/api/forensics/email/samples/${sampleId}`);
      if (data.success) {
        setHeaderText(data.content);
        setResults(null);
      }
    } catch (err) {
      setError(`Failed to load email sample: ${err.message}`);
    }
  }

  async function handleAnalyzeHeaders() {
    if (!headerText.trim()) {
      setError('Please enter or load raw email headers for forensic analysis.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const data = await apiRequest('/api/forensics/email/analyze', {
        method: 'POST',
        body: JSON.stringify({ rawHeaders: headerText })
      });
      if (data.success) {
        setResults(data);
      }
    } catch (err) {
      setError(err.message || 'Header parsing failed.');
    } finally {
      setLoading(false);
    }
  }

  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setHeaderText(event.target.result);
      setSelectedSample('');
      setResults(null);
    };
    reader.readAsText(file);
  }

  const meta = results?.metadata || {};
  const authSummary = meta.authResultsSummary || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#F8FAFC' }}>
          Email Forensics & Header Spoofing Lab
        </h1>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          Disassembles RFC 5322 email headers, extracts Received transmission hops, evaluates SPF/DKIM/DMARC indicators, and detects sender impersonation.
        </p>
      </div>

      {/* Forensic Distinction Notice */}
      <div className="cyber-alert cyber-alert-info" style={{ fontSize: '0.8rem', lineHeight: 1.5 }}>
        <Info size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong>FORENSIC PRINCIPLE:</strong> Parsing header text reveals declared values. The "From" address can be trivially forged in SMTP. Independent DKIM cryptographic verification and SPF DNS policy checks are necessary to prove message authenticity.
        </div>
      </div>

      {/* Preset Fictional Sample Scenarios */}
      <div className="cyber-card" style={{ padding: '1.25rem' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Mail size={16} color="var(--accent-cyan)" />
          <span>Load Preset Educational Email Header Scenarios</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
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
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: isSelected ? 'var(--accent-cyan)' : '#F8FAFC', marginBottom: '0.25rem' }}>
                  {s.title}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {s.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Email Header Input Workspace */}
      <div className="cyber-card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Raw RFC 5322 Email Headers / EML</span>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
              <FileText size={13} />
              <span>Upload .EML / .TXT</span>
              <input
                type="file"
                accept=".eml,.txt"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </label>
            <button
              onClick={() => {
                setHeaderText('');
                setResults(null);
                setSelectedSample('');
              }}
              className="btn btn-secondary btn-sm"
              title="Clear text"
            >
              <RotateCcw size={13} />
              <span>Clear</span>
            </button>
            <button
              onClick={handleAnalyzeHeaders}
              disabled={loading || !headerText.trim()}
              className="btn btn-primary btn-sm"
            >
              <Play size={13} />
              <span>{loading ? 'Parsing Headers...' : 'Parse & Inspect Headers'}</span>
            </button>
          </div>
        </div>

        <textarea
          value={headerText}
          onChange={(e) => setHeaderText(e.target.value)}
          placeholder="Paste raw email header block (From:, Received:, Authentication-Results:, etc.) or load a preset sample above..."
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Detected Anomalies Banner */}
          {results.anomalies?.length > 0 ? (
            <div className="cyber-card" style={{ borderLeft: '4px solid #F43F5E' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#FDA4AF', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={18} />
                <span>Detected Header Anomalies & Deception Indicators ({results.anomalies.length})</span>
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {results.anomalies.map(anom => (
                  <div key={anom.id} style={{
                    background: '#0B1322',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.75rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                      <span style={{ fontWeight: 600, color: '#F8FAFC', fontSize: '0.85rem' }}>{anom.indicator}</span>
                      <span className={`badge ${anom.severity === 'CRITICAL' ? 'badge-critical' : 'badge-high'}`}>
                        {anom.severity}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.3rem' }}>
                      {anom.description}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>
                      <strong>Forensic Significance:</strong> {anom.relevance}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="cyber-alert cyber-alert-success">
              <CheckCircle size={18} />
              <div>No immediate domain mismatch or display-name spoofing anomalies detected in parsed headers.</div>
            </div>
          )}

          {/* Header Metadata Decomposition */}
          <div className="cyber-card">
            <div className="cyber-card-header">
              <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#F8FAFC' }}>
                Extracted Identity & Routing Metadata
              </h2>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <span className={`badge ${authSummary.spf === 'PASS' ? 'badge-success' : 'badge-critical'}`}>
                  SPF: {authSummary.spf}
                </span>
                <span className={`badge ${authSummary.dkim === 'PASS' ? 'badge-success' : 'badge-critical'}`}>
                  DKIM: {authSummary.dkim}
                </span>
                <span className={`badge ${authSummary.dmarc === 'PASS' ? 'badge-success' : 'badge-critical'}`}>
                  DMARC: {authSummary.dmarc}
                </span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              <div style={{ background: '#0B1322', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>From (Display Header)</div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#F8FAFC', marginTop: '0.2rem' }}>
                  {meta.from?.name ? `"${meta.from.name}" ` : ''}&lt;{meta.from?.email || 'N/A'}&gt;
                </div>
                <div className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', marginTop: '0.2rem' }}>
                  Domain: {meta.from?.domain || 'N/A'}
                </div>
              </div>

              <div style={{ background: '#0B1322', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Reply-To (Destination for Responses)</div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#F8FAFC', marginTop: '0.2rem' }}>
                  {meta.replyTo?.email ? `<${meta.replyTo.email}>` : 'Not Specified (Defaults to From)'}
                </div>
                <div className="font-mono" style={{ fontSize: '0.7rem', color: meta.from?.domain !== meta.replyTo?.domain && meta.replyTo?.domain ? '#F43F5E' : 'var(--accent-cyan)', marginTop: '0.2rem' }}>
                  Domain: {meta.replyTo?.domain || 'N/A'} {meta.from?.domain !== meta.replyTo?.domain && meta.replyTo?.domain ? '⚠️ (Mismatch!)' : ''}
                </div>
              </div>

              <div style={{ background: '#0B1322', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Return-Path (Envelope Sender)</div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#F8FAFC', marginTop: '0.2rem' }}>
                  {meta.returnPath?.email ? `<${meta.returnPath.email}>` : 'Not Specified'}
                </div>
                <div className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', marginTop: '0.2rem' }}>
                  Domain: {meta.returnPath?.domain || 'N/A'}
                </div>
              </div>

              <div style={{ background: '#0B1322', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Subject & Message-ID</div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#F8FAFC', marginTop: '0.2rem' }}>
                  {meta.subject}
                </div>
                <div className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {meta.messageId}
                </div>
              </div>
            </div>
          </div>

          {/* Received Hops Traceability Chain */}
          <div className="cyber-card">
            <div className="cyber-card-header">
              <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#F8FAFC' }}>
                Transmission Relay Trace (Received Headers Chain)
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Trace read order: Bottom (Origin) ➔ Top (Recipient Gateway)
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {results.receivedHops?.length > 0 ? (
                results.receivedHops.map((hop, idx) => (
                  <div key={hop.hopNumber} style={{
                    background: '#0B1322',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.3rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
                          Hop #{hop.hopNumber} {idx === results.receivedHops.length - 1 ? '(Earliest Recorded Relay)' : ''}
                        </span>
                        {hop.ip && (
                          <span className="font-mono" style={{ fontSize: '0.8rem', color: '#6EE7B7', fontWeight: 600 }}>
                            IP: {hop.ip}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                        {hop.timestamp || 'No timestamp'}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <strong>From Host:</strong> {hop.fromHost || 'Unknown'} ➔ <strong>By Host:</strong> {hop.byHost || 'Unknown'}
                    </div>

                    <div className="font-mono" style={{ fontSize: '0.68rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>
                      Raw: {hop.raw}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>No Received header hops found in message.</div>
              )}
            </div>
          </div>

          {/* Educational Forensics Guide Accordion */}
          <div className="cyber-card">
            <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#F8FAFC', marginBottom: '0.75rem' }}>
              Academic Reference: Understanding Email Authentication Mechanisms
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
              {results.educationalNotes?.map((item, idx) => (
                <div key={idx} style={{
                  background: '#0B1322',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.85rem'
                }}>
                  <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '0.35rem' }}>
                    {item.field}
                  </h3>
                  <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {item.concept}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
