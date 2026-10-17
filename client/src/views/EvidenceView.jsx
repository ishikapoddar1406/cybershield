import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import {
  ShieldCheck,
  ShieldAlert,
  FileCheck,
  Upload,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle,
  Copy,
  Clock,
  History,
  X,
  FileCode,
  Zap,
  RotateCcw
} from 'lucide-react';

export function EvidenceView() {
  const { user } = useAuth();
  const [evidenceList, setEvidenceList] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);

  // Chain of Custody Modal
  const [selectedCoc, setSelectedCoc] = useState(null);
  const [cocLoading, setCocLoading] = useState(false);

  // Upload Evidence Modal
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    fetchEvidenceAndCases();
  }, []);

  async function fetchEvidenceAndCases() {
    try {
      setLoading(true);
      // Fetch incidents to link cases and extract evidence
      const casesData = await apiRequest('/api/incidents');
      if (casesData.success) {
        setIncidents(casesData.incidents);
        if (casesData.incidents.length > 0 && !selectedCaseId) {
          setSelectedCaseId(casesData.incidents[0].id);
        }

        // Fetch evidence for all accessible cases
        const allEvidence = [];
        for (const inc of casesData.incidents) {
          try {
            const evdData = await apiRequest(`/api/evidence/case/${inc.id}`);
            if (evdData.success && evdData.evidence) {
              evdData.evidence.forEach(e => {
                allEvidence.push({ ...e, caseTitle: inc.title });
              });
            }
          } catch (e) {
            // Ignore individual fetch errors
          }
        }
        setEvidenceList(allEvidence);
      }
    } catch (err) {
      console.error('Failed to fetch evidence:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyIntegrity(evd) {
    setVerifyingId(evd.id);
    setVerificationResult(null);

    try {
      const res = await apiRequest(`/api/evidence/${evd.id}/verify`, { method: 'POST' });
      setVerificationResult({
        evidenceId: evd.id,
        filename: evd.original_filename,
        ...res
      });

      // Refresh list to update status pill
      fetchEvidenceAndCases();
    } catch (err) {
      alert(`Integrity verification failed: ${err.message}`);
    } finally {
      setVerifyingId(null);
    }
  }

  async function handleSimulateTampering(evd) {
    if (!window.confirm(`Simulate Tampering on '${evd.original_filename}'?\n\nThis will inject 1 modified byte into the file on disk. You can then immediately click "Verify Integrity" to witness SHA-256 tamper detection in action.`)) {
      return;
    }

    try {
      const res = await apiRequest(`/api/evidence/${evd.id}/simulate-tampering`, { method: 'POST' });
      alert(res.message);
      fetchEvidenceAndCases();
    } catch (err) {
      alert(`Simulation failed: ${err.message}`);
    }
  }

  async function handleRestoreOriginal(evd) {
    try {
      const res = await apiRequest(`/api/evidence/${evd.id}/restore-original`, { method: 'POST' });
      alert(res.message);
      fetchEvidenceAndCases();
      setVerificationResult(null);
    } catch (err) {
      alert(`Restore failed: ${err.message}`);
    }
  }

  async function handleViewChainOfCustody(evd) {
    setSelectedCoc({ evidence: evd, history: [] });
    setCocLoading(true);

    try {
      const data = await apiRequest(`/api/evidence/${evd.id}/chain-of-custody`);
      if (data.success) {
        setSelectedCoc({ evidence: evd, history: data.chainOfCustody });
      }
    } catch (err) {
      alert(`Failed to load chain of custody: ${err.message}`);
    } finally {
      setCocLoading(false);
    }
  }

  async function handleUploadSubmit(e) {
    e.preventDefault();
    if (!uploadFile || !selectedCaseId) {
      setUploadError('Please select both an incident case and a file.');
      return;
    }

    setUploadError('');
    setUploadLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('incidentId', selectedCaseId);
      formData.append('description', uploadDescription);

      await apiRequest('/api/evidence/upload', {
        method: 'POST',
        body: formData
      });

      setIsUploadModalOpen(false);
      setUploadFile(null);
      setUploadDescription('');
      fetchEvidenceAndCases();
      alert('Evidence securely uploaded, SHA-256 digest computed, and chain of custody initiated.');
    } catch (err) {
      setUploadError(err.message || 'File upload failed.');
    } finally {
      setUploadLoading(false);
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    alert('SHA-256 hash copied to clipboard.');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#F8FAFC' }}>
            Evidence & Hash Check
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Store digital evidence safely, calculate digital fingerprints (SHA-256), and verify files have not been changed.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="btn btn-primary"
          >
            <Upload size={16} />
            <span>Upload Evidence File</span>
          </button>
          <button
            onClick={fetchEvidenceAndCases}
            className="btn btn-secondary"
            title="Refresh evidence list"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Beginner-friendly explanation box */}
      <div style={{ background: '#0B1322', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        <strong style={{ color: '#F8FAFC' }}>How Digital Fingerprint Checking Works:</strong> When an evidence file is uploaded, CyberShield calculates its <strong>SHA-256 digital fingerprint</strong> (a unique 64-character code). If even a single character inside the file is modified, its fingerprint changes completely. By clicking <strong>Verify Integrity</strong>, the system recalculates the fingerprint from disk and proves whether the file remains 100% unaltered.
      </div>

      {/* Verification Result Alert Banner */}
      {verificationResult && (
        <div className={`cyber-alert ${verificationResult.verified ? 'cyber-alert-success' : 'cyber-alert-danger'}`}>
          {verificationResult.verified ? (
            <CheckCircle size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
          ) : (
            <AlertTriangle size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
          )}
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem' }}>
              {verificationResult.verified
                ? `Cryptographic Integrity Verified: ${verificationResult.filename}`
                : `TAMPER ALERT: Evidence Compromised: ${verificationResult.filename}`}
            </div>
            <div style={{ fontSize: '0.8125rem', marginBottom: '0.5rem' }}>
              {verificationResult.message || verificationResult.warning}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace' }}>
              <div>Baseline Hash: <span style={{ color: '#F8FAFC' }}>{verificationResult.baselineHash}</span></div>
              <div>Current Digest: <span style={{ color: verificationResult.verified ? '#10B981' : '#F43F5E' }}>{verificationResult.currentHash}</span></div>
            </div>
          </div>
          <button
            onClick={() => setVerificationResult(null)}
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.2rem 0.5rem' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Evidence Table */}
      <div className="cyber-table-container">
        <table className="cyber-table">
          <thead>
            <tr>
              <th>Evidence ID</th>
              <th>Case ID</th>
              <th>Original File</th>
              <th>Type</th>
              <th>Size</th>
              <th>SHA-256 Digest</th>
              <th>Integrity Status</th>
              <th>Forensic Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
                  Loading evidence metadata and cryptographic digests...
                </td>
              </tr>
            ) : evidenceList.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
                  No digital evidence items currently registered.
                </td>
              </tr>
            ) : (
              evidenceList.map(evd => {
                const isCompromised = evd.status === 'Integrity Compromised';
                return (
                  <tr key={evd.id}>
                    <td className="font-mono" style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>
                      {evd.id}
                    </td>
                    <td className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {evd.incident_id}
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>{evd.original_filename}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{evd.description}</div>
                    </td>
                    <td>
                      <span className="badge badge-low" style={{ fontSize: '0.65rem' }}>
                        {evd.evidence_type?.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace' }}>
                      {(evd.file_size / 1024).toFixed(1)} KB
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {evd.sha256_hash.slice(0, 16)}...{evd.sha256_hash.slice(-8)}
                        </span>
                        <button
                          onClick={() => copyToClipboard(evd.sha256_hash)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.15rem 0.35rem', fontSize: '0.65rem' }}
                          title="Copy Full SHA-256 Hash"
                        >
                          <Copy size={11} />
                        </button>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${isCompromised ? 'badge-critical pulse-indicator' : 'badge-success'}`}>
                        {isCompromised ? '⚠️ COMPROMISED' : '✓ VERIFIED'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {/* Verify Button */}
                        <button
                          onClick={() => handleVerifyIntegrity(evd)}
                          disabled={verifyingId === evd.id}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.7rem', padding: '0.25rem 0.55rem' }}
                          title="Recalculate SHA-256 and verify against baseline"
                        >
                          <RefreshCw size={12} className={verifyingId === evd.id ? 'pulse-indicator' : ''} />
                          <span>{verifyingId === evd.id ? 'Checking...' : 'Check Integrity'}</span>
                        </button>

                        {/* History of Evidence Handling */}
                        <button
                          onClick={() => handleViewChainOfCustody(evd)}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.7rem', padding: '0.25rem 0.55rem' }}
                          title="View log of who uploaded or checked this evidence file"
                        >
                          <History size={12} />
                          <span>Handling History</span>
                        </button>

                        {/* Download Safe Stream */}
                        <a
                          href={`/api/evidence/${evd.id}/download`}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.7rem', padding: '0.25rem 0.55rem', textDecoration: 'none' }}
                          download
                          title="Download evidence file"
                        >
                          <Download size={12} />
                        </a>

                        {/* Educational Tamper Simulation Buttons (Investigators/Admins) */}
                        {['admin', 'investigator'].includes(user?.role) && (
                          <>
                            {isCompromised ? (
                              <button
                                onClick={() => handleRestoreOriginal(evd)}
                                className="btn btn-success btn-sm"
                                style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                                title="Revert to original verified copy"
                              >
                                <RotateCcw size={12} />
                                <span>Restore Original</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSimulateTampering(evd)}
                                className="btn btn-danger btn-sm"
                                style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                                title="Modifies a test copy to prove that the integrity check detects any changes"
                              >
                                <Zap size={12} />
                                <span>Test Tamper Check</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* HISTORY OF EVIDENCE HANDLING MODAL */}
      {selectedCoc && (
        <div className="modal-overlay">
          <div className="modal-dialog" style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 600 }}>
                  History of Evidence Handling
                </h2>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  File: <span className="font-mono" style={{ color: 'var(--accent-cyan)' }}>{selectedCoc.evidence?.original_filename}</span> • Unbroken record of all actions performed on this evidence
                </div>
              </div>
              <button
                onClick={() => setSelectedCoc(null)}
                className="btn btn-secondary btn-sm"
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
              {cocLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>Loading custody timeline...</div>
              ) : selectedCoc.history?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No chain of custody logs found.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {selectedCoc.history.map((entry, index) => (
                    <div key={entry.id} style={{
                      background: '#0B1322',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.85rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.35rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span className="badge badge-low" style={{ fontSize: '0.65rem' }}>
                            #{index + 1}
                          </span>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--accent-cyan)' }}>
                            {entry.action}
                          </span>
                          <span className={`badge ${entry.integrity_status === 'INTACT' ? 'badge-success' : 'badge-critical'}`} style={{ fontSize: '0.6rem' }}>
                            {entry.integrity_status}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                      </div>

                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <strong>Actor:</strong> {entry.actor_name} ({entry.actor_role?.toUpperCase()})
                      </div>

                      <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.5, marginTop: '0.2rem' }}>
                        {entry.notes}
                      </div>

                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', marginTop: '0.2rem' }}>
                        Digest at Event: {entry.hash_at_event}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setSelectedCoc(null)}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD EVIDENCE MODAL */}
      {isUploadModalOpen && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-header">
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600 }}>
                Upload Forensic Evidence
              </h2>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="btn btn-secondary btn-sm"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {uploadError && (
                  <div className="cyber-alert cyber-alert-danger">
                    <AlertTriangle size={18} />
                    <div>{uploadError}</div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Link to Incident Case</label>
                  <select
                    value={selectedCaseId}
                    onChange={(e) => setSelectedCaseId(e.target.value)}
                    className="form-select"
                    required
                  >
                    {incidents.map(inc => (
                      <option key={inc.id} value={inc.id}>
                        {inc.id} — {inc.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Evidence File</label>
                  <input
                    type="file"
                    onChange={(e) => setUploadFile(e.target.files[0])}
                    className="form-input"
                    accept=".txt,.log,.csv,.eml,.pdf,.png,.jpg,.jpeg,.pcap,.pcapng"
                    required
                  />
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                    Permitted formats: TXT, LOG, CSV, EML, PDF, PNG, JPG, PCAP/PCAPNG. Strict 10 MB maximum limit.
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Evidence Description</label>
                  <textarea
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    placeholder="Describe source of file, acquisition method, device location, or forensic context..."
                    className="form-textarea"
                    rows={3}
                  />
                </div>

                <div style={{
                  background: '#0B1322',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)'
                }}>
                  🔒 <strong>Enclave Security Notice:</strong> Upon ingestion, the server will compute an authentic SHA-256 hash, assign a UUID safe storage identifier outside the web root, and create an unalterable initial chain-of-custody record.
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadLoading || !uploadFile}
                  className="btn btn-primary"
                >
                  {uploadLoading ? 'Hashing & Ingesting...' : 'Upload & Compute Digest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
