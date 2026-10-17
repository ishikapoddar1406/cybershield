import React, { useState } from 'react';
import { apiRequest } from '../services/api';
import {
  CheckSquare,
  Shield,
  FileCheck,
  Calculator,
  AlertTriangle,
  CheckCircle2,
  HardDrive,
  Copy,
  Info,
  Clock,
  Layers,
  ArrowRight
} from 'lucide-react';

export function InvestigationGuidesView() {
  const [activeTab, setActiveTab] = useState('forensics'); // 'forensics' | 'ir' | 'hasher' | 'anti-forensics'

  // Forensic Checklist state
  const [forensicSteps, setForensicSteps] = useState([
    { id: 1, phase: '1. Identification', title: 'Scope & Volatility Assessment', desc: 'Identify suspect digital assets, network boundaries, and assess order of volatility (CPU cache, RAM, network sockets, disk, optical media).', checked: true },
    { id: 2, phase: '2. Preservation', title: 'Hardware Isolation & Write Blocking', desc: 'Isolate compromised host from network. Attach hardware write-blocker to disks before imaging to prevent OS modification of MACB timestamps.', checked: true },
    { id: 3, phase: '3. Collection', title: 'Bitstream Raw Imaging & Memory Capture', desc: 'Acquire complete forensic bit-stream image (dd / raw / E01 format). Compute initial SHA-256 hash immediately upon capture and record in Chain of Custody.', checked: true },
    { id: 4, phase: '4. Examination', title: 'Evidence Ingestion & Integrity Check', desc: 'Work exclusively on forensic read-only working copies, never original media. Re-verify SHA-256 hash to prove 100% bit-for-bit parity with original baseline.', checked: false },
    { id: 5, phase: '5. Analysis', title: 'Artifact Recovery & Timeline Reconstruction', desc: 'Recover deleted records, inspect prefetch, shimcache, event logs (EVTX), browser databases, and correlate IOCs to establish root cause.', checked: false },
    { id: 6, phase: '6. Documentation', title: 'Contemporaneous Forensic Notes', desc: 'Record every tool, version, command-line argument, and observation contemporaneously. Maintain rigorous unbroken chain of custody records.', checked: false },
    { id: 7, phase: '7. Reporting', title: 'Court-Admissible Technical Report', desc: 'Deliver objective, transparent expert findings without speculation. Distinguish corroborated digital evidence from preliminary investigative hypotheses.', checked: false }
  ]);

  // NIST IR Checklist state
  const [irSteps, setIrSteps] = useState([
    { id: 1, phase: 'Phase 1: Preparation', title: 'Tooling, Hardening & Enclave Readiness', desc: 'Establish incident response plan, configure centralized immutable logging, train team, and maintain jump-kits with write blockers and memory capture tools.', checked: true },
    { id: 2, phase: 'Phase 2: Detection & Analysis', title: 'IOC Triage & Severity Scoping', desc: 'Detect anomalies via SIEM/IDS alerts, evaluate false positive rates, triage severity level (Critical/High), and declare formal incident case.', checked: true },
    { id: 3, phase: 'Phase 3: Containment', title: 'Network Segmentation & Credential Revocation', desc: 'Execute short-term containment (VLAN isolation, perimeter firewall block, revoke active sessions) to stop lateral propagation without destroying volatile forensic memory.', checked: false },
    { id: 4, phase: 'Phase 4: Eradication', title: 'Malware Removal & Vulnerability Patching', desc: 'Identify root-cause vulnerability, eliminate malicious payloads/persistence mechanisms (scheduled tasks, registry run keys), and patch vulnerable services.', checked: false },
    { id: 5, phase: 'Phase 5: Recovery', title: 'Validated Restoration to Production', desc: 'Restore sanitized systems from trusted offline backups, test system integrity, rotate all privileged credentials, and monitor with enhanced telemetry.', checked: false },
    { id: 6, phase: 'Phase 6: Post-Incident Lessons', title: 'Root Cause Post-Mortem & Defense Tuning', desc: 'Conduct formal review meeting within 14 days. Document timeline, identify detection gaps, update defensive playbooks, and report to regulatory authorities (e.g. CERT-In).', checked: false }
  ]);

  // Standalone SHA-256 Tool
  const [hashInput, setHashInput] = useState('');
  const [hashResult, setHashResult] = useState('');
  const [verifyBaseline, setVerifyBaseline] = useState('');
  const [hashMatchStatus, setHashMatchStatus] = useState(null); // true | false | null

  function toggleForensicStep(id) {
    setForensicSteps(prev => prev.map(s => s.id === id ? { ...s, checked: !s.checked } : s));
  }

  function toggleIrStep(id) {
    setIrSteps(prev => prev.map(s => s.id === id ? { ...s, checked: !s.checked } : s));
  }

  async function handleComputeHash() {
    if (!hashInput) return;
    try {
      const res = await apiRequest('/api/evidence/hash-tool', {
        method: 'POST',
        body: JSON.stringify({ text: hashInput })
      });
      if (res.success) {
        setHashResult(res.hash);
        if (verifyBaseline.trim()) {
          setHashMatchStatus(res.hash.toLowerCase() === verifyBaseline.trim().toLowerCase());
        } else {
          setHashMatchStatus(null);
        }
      }
    } catch (e) {
      alert(`Hash error: ${e.message}`);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#F8FAFC' }}>
          Forensic Integrity & Incident Response Hub
        </h1>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          Standardized forensic operational workflows, NIST SP 800-61 lifecycle, cryptographic calculator, and anti-forensics awareness.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="tabs-container">
        <button
          onClick={() => setActiveTab('forensics')}
          className={`tab-btn ${activeTab === 'forensics' ? 'active' : ''}`}
        >
          <FileCheck size={16} />
          <span>Forensic Investigation (7 Phases)</span>
        </button>

        <button
          onClick={() => setActiveTab('ir')}
          className={`tab-btn ${activeTab === 'ir' ? 'active' : ''}`}
        >
          <Shield size={16} />
          <span>Incident Response (NIST 6 Phases)</span>
        </button>

        <button
          onClick={() => setActiveTab('hasher')}
          className={`tab-btn ${activeTab === 'hasher' ? 'active' : ''}`}
        >
          <Calculator size={16} />
          <span>SHA-256 Integrity Calculator</span>
        </button>

        <button
          onClick={() => setActiveTab('anti-forensics')}
          className={`tab-btn ${activeTab === 'anti-forensics' ? 'active' : ''}`}
        >
          <AlertTriangle size={16} />
          <span>Anti-Forensics Awareness</span>
        </button>
      </div>

      {/* TAB 1: 7-PHASE FORENSIC CHECKLIST */}
      {activeTab === 'forensics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="cyber-alert cyber-alert-info" style={{ fontSize: '0.8125rem' }}>
            <Info size={18} style={{ flexShrink: 0 }} />
            <div>
              <strong>NIST SP 800-86 Methodological Alignment:</strong> Digital forensic investigations require strict methodological consistency to ensure technical findings withstand judicial and regulatory scrutiny.
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {forensicSteps.map(step => (
              <div
                key={step.id}
                onClick={() => toggleForensicStep(step.id)}
                className="cyber-card"
                style={{
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  cursor: 'pointer',
                  borderColor: step.checked ? 'rgba(16, 185, 129, 0.35)' : 'var(--border-subtle)',
                  background: step.checked ? 'rgba(16, 185, 129, 0.04)' : '#0B1322'
                }}
              >
                <div style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '6px',
                  border: step.checked ? '2px solid #10B981' : '2px solid var(--border-active)',
                  background: step.checked ? '#10B981' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#04101A',
                  marginTop: '2px',
                  flexShrink: 0
                }}>
                  {step.checked && <CheckCircle2 size={16} strokeWidth={3} />}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
                      {step.phase}
                    </span>
                    <span className={`badge ${step.checked ? 'badge-success' : 'badge-low'}`} style={{ fontSize: '0.65rem' }}>
                      {step.checked ? 'COMPLETED' : 'PENDING'}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '0.925rem', fontWeight: 600, color: '#F8FAFC', marginBottom: '0.35rem' }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: NIST 6-PHASE INCIDENT RESPONSE */}
      {activeTab === 'ir' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="cyber-alert cyber-alert-info" style={{ fontSize: '0.8125rem' }}>
            <Info size={18} style={{ flexShrink: 0 }} />
            <div>
              <strong>NIST SP 800-61 Rev. 2 Framework:</strong> Incident Handling lifecycle for containing cyber attacks, mitigating damage, and preserving forensic evidence for root-cause analysis.
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {irSteps.map(step => (
              <div
                key={step.id}
                onClick={() => toggleIrStep(step.id)}
                className="cyber-card"
                style={{
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  cursor: 'pointer',
                  borderColor: step.checked ? 'rgba(6, 182, 212, 0.35)' : 'var(--border-subtle)',
                  background: step.checked ? 'rgba(6, 182, 212, 0.04)' : '#0B1322'
                }}
              >
                <div style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '6px',
                  border: step.checked ? '2px solid var(--accent-cyan)' : '2px solid var(--border-active)',
                  background: step.checked ? 'var(--accent-cyan)' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#04101A',
                  marginTop: '2px',
                  flexShrink: 0
                }}>
                  {step.checked && <CheckCircle2 size={16} strokeWidth={3} />}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-cyan)', textTransform: 'uppercase' }}>
                      {step.phase}
                    </span>
                    <span className={`badge ${step.checked ? 'badge-cyan' : 'badge-low'}`} style={{ fontSize: '0.65rem' }}>
                      {step.checked ? 'EXECUTED' : 'PENDING'}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '0.925rem', fontWeight: 600, color: '#F8FAFC', marginBottom: '0.35rem' }}>
                    {step.title}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: STANDALONE SHA-256 CALCULATOR */}
      {activeTab === 'hasher' && (
        <div className="cyber-card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#F8FAFC', marginBottom: '0.5rem' }}>
            Cryptographic SHA-256 Digest Calculator
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
            Compute or verify a 256-bit cryptographic message digest (FIPS 180-4 compliant) for text payloads, IOC lists, or artifact strings.
          </p>

          <div className="form-group">
            <label className="form-label">Input Text Payload / Data Stream</label>
            <textarea
              value={hashInput}
              onChange={(e) => setHashInput(e.target.value)}
              placeholder="Paste text, log line, or raw string to compute its SHA-256 cryptographic digest..."
              className="form-textarea font-mono"
              rows={4}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Expected Baseline Hash (Optional Verification Target)</label>
            <input
              type="text"
              value={verifyBaseline}
              onChange={(e) => setVerifyBaseline(e.target.value)}
              placeholder="Paste expected 64-character hexadecimal SHA-256 hash to test for exact match..."
              className="form-input font-mono"
            />
          </div>

          <button
            onClick={handleComputeHash}
            disabled={!hashInput.trim()}
            className="btn btn-primary"
            style={{ marginBottom: '1.5rem' }}
          >
            <Calculator size={15} />
            <span>Compute Cryptographic Digest</span>
          </button>

          {hashResult && (
            <div style={{
              background: '#0B1322',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem'
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Computed SHA-256 Hash:</span>
                <div className="font-mono" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-cyan)', wordBreak: 'break-all', marginTop: '0.2rem' }}>
                  {hashResult}
                </div>
              </div>

              {hashMatchStatus !== null && (
                <div style={{
                  padding: '0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: hashMatchStatus ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                  color: hashMatchStatus ? '#6EE7B7' : '#FDA4AF',
                  border: `1px solid ${hashMatchStatus ? 'rgba(16, 185, 129, 0.35)' : 'rgba(244, 63, 94, 0.35)'}`
                }}>
                  {hashMatchStatus ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  <span>
                    {hashMatchStatus
                      ? 'INTEGRITY VERIFIED: Computed digest matches expected baseline perfectly.'
                      : 'HASH MISMATCH: Computed digest does NOT match the expected baseline! Data has been modified.'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ANTI-FORENSICS AWARENESS */}
      {activeTab === 'anti-forensics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="cyber-alert cyber-alert-warning" style={{ fontSize: '0.8125rem' }}>
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <div>
              <strong>ETHICAL ACADEMIC STATEMENT:</strong> This section discusses anti-forensics methodologies from a defensive and forensic detection perspective. Understanding adversary evasion tactics allows investigators to detect timestamp tampering, recover concealed artifacts, and defeat log scrubbing.
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
            {/* 1. Timestomping */}
            <div className="cyber-card">
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#FDA4AF', marginBottom: '0.4rem' }}>
                1. Timestomping (MACB Manipulation)
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.65rem' }}>
                Adversaries modify standard NTFS <code>$STANDARD_INFORMATION</code> timestamps (Modified, Accessed, Created, Born) to match legitimate system files (e.g. spoofing creation date to 2018).
              </p>
              <div style={{ fontSize: '0.75rem', background: '#0B1322', padding: '0.65rem', borderRadius: 'var(--radius-sm)', color: 'var(--accent-cyan)' }}>
                <strong>Forensic Countermeasure:</strong> Examine <code>$FILE_NAME</code> attributes in NTFS Master File Table (MFT), which are not updated by standard user-mode API calls, exposing discrepancy with <code>$STANDARD_INFORMATION</code>.
              </div>
            </div>

            {/* 2. Log Tampering */}
            <div className="cyber-card">
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#FCD34D', marginBottom: '0.4rem' }}>
                2. Log Scrubbing & Selective Erasure
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.65rem' }}>
                Attackers execute commands such as <code>wevtutil cl Security</code> or selectively zero-out targeted event records in Windows EVTX logs to erase authentication trails.
              </p>
              <div style={{ fontSize: '0.75rem', background: '#0B1322', padding: '0.65rem', borderRadius: 'var(--radius-sm)', color: 'var(--accent-cyan)' }}>
                <strong>Forensic Countermeasure:</strong> Event ID 1102 ("Audit log cleared") is recorded when logs are purged. Forward logs in real-time to an out-of-band immutable SIEM/WORM repository.
              </div>
            </div>

            {/* 3. Steganography */}
            <div className="cyber-card">
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#93C5FD', marginBottom: '0.4rem' }}>
                3. Steganography & Slack Space Hiding
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.65rem' }}>
                Concealing payload bytes inside benign carrier media (images, audio) via Least Significant Bit (LSB) substitution, or storing data in sector slack space outside OS visibility.
              </p>
              <div style={{ fontSize: '0.75rem', background: '#0B1322', padding: '0.65rem', borderRadius: 'var(--radius-sm)', color: 'var(--accent-cyan)' }}>
                <strong>Forensic Countermeasure:</strong> Perform statistical chi-square entropy tests on media files and extract unallocated clusters and slack space using bit-stream forensics suites.
              </div>
            </div>

            {/* 4. Secure Wiping vs Deletion */}
            <div className="cyber-card">
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#6EE7B7', marginBottom: '0.4rem' }}>
                4. Data Deletion vs Overwriting
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.65rem' }}>
                Standard OS deletion only removes index entries from the file allocation table; physical data clusters remain intact until overwritten by subsequent operations.
              </p>
              <div style={{ fontSize: '0.75rem', background: '#0B1322', padding: '0.65rem', borderRadius: 'var(--radius-sm)', color: 'var(--accent-cyan)' }}>
                <strong>Forensic Countermeasure:</strong> File carving (magic byte header/footer signature matching) can reconstruct deleted documents, images, and logs from unallocated space.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
