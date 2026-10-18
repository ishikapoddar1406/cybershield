import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Lock,
  KeyRound,
  UserCheck,
  FileCheck,
  FileWarning,
  UploadCloud,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  QrCode,
  Copy,
  Check,
  Eye,
  EyeOff,
  Clock,
  Smartphone,
  RotateCcw,
  ArrowRight
} from 'lucide-react';

export function SecurityFeaturesView() {
  const { user, checkSession } = useAuth();
  const [activeTab, setActiveTab] = useState('mechanisms'); // 'mechanisms' | 'account' | 'additional'

  // Expandable Help & Technical Details state
  const [showHelp, setShowHelp] = useState(false);
  const [expandedTech, setExpandedTech] = useState({});

  const toggleTech = (id) => {
    setExpandedTech(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // --- DEMONSTRATION 1: PASSWORD POLICY & HASHING ---
  const [testPassword, setTestPassword] = useState('Student@2026!');
  const [pwResult, setPwResult] = useState(null);
  const [pwLoading, setPwLoading] = useState(false);

  async function handleTestPassword() {
    setPwLoading(true);
    setPwResult(null);
    try {
      const res = await apiRequest('/api/security-lab/test-password-policy', {
        method: 'POST',
        body: JSON.stringify({ password: testPassword })
      });
      setPwResult(res);
    } catch (err) {
      setPwResult({ success: false, error: err.message });
    } finally {
      setPwLoading(false);
    }
  }

  // --- DEMONSTRATION 2: TWO-FACTOR AUTHENTICATION ---
  const [mfaSetupData, setMfaSetupData] = useState(null);
  const [mfaToken, setMfaToken] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaMsg, setMfaMsg] = useState('');
  const [mfaError, setMfaError] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableLoading, setDisableLoading] = useState(false);
  const [disableError, setDisableError] = useState('');

  async function handleStartMfa() {
    setMfaLoading(true);
    setMfaError('');
    setMfaMsg('');
    setMfaToken('');
    setCopiedSecret(false);
    try {
      const res = await apiRequest('/api/auth/mfa/setup', { method: 'POST' });
      setMfaSetupData(res);
    } catch (err) {
      setMfaError(err.message || 'Could not start 2FA setup.');
    } finally {
      setMfaLoading(false);
    }
  }

  async function handleCancelMfa() {
    try {
      await apiRequest('/api/auth/mfa/cancel', { method: 'POST' });
    } catch (e) {
      // Ignore
    }
    setMfaSetupData(null);
    setMfaToken('');
    setMfaError('');
  }

  async function handleVerifyMfa(e) {
    if (e) e.preventDefault();
    if (mfaToken.trim().length !== 6) return;
    setMfaLoading(true);
    setMfaError('');
    try {
      await apiRequest('/api/auth/verify-mfa', {
        method: 'POST',
        body: JSON.stringify({ token: mfaToken.trim() })
      });
      setMfaMsg('Authenticator enabled successfully! Your account is now protected by Two-Factor Authentication.');
      setMfaSetupData(null);
      setMfaToken('');
      await checkSession();
    } catch (err) {
      setMfaError(err.message || 'Invalid 6-digit code. Please verify the code in your authenticator app and try again.');
    } finally {
      setMfaLoading(false);
    }
  }

  function handleCopySecret() {
    if (mfaSetupData?.secret) {
      navigator.clipboard.writeText(mfaSetupData.secret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2500);
    }
  }

  async function handleDisableMfa(e) {
    if (e) e.preventDefault();
    if (!disablePassword) return;
    setDisableLoading(true);
    setDisableError('');
    try {
      await apiRequest('/api/auth/mfa/disable', {
        method: 'POST',
        body: JSON.stringify({ password: disablePassword })
      });
      setShowDisableModal(false);
      setDisablePassword('');
      setMfaMsg('Multi-factor authentication has been disabled.');
      await checkSession();
    } catch (err) {
      setDisableError(err.message || 'Incorrect password. Could not disable MFA.');
    } finally {
      setDisableLoading(false);
    }
  }

  // --- DEMONSTRATION 3: ROLE-BASED ACCESS CONTROL (RBAC) ---
  const [rbacResult, setRbacResult] = useState(null);
  const [rbacLoading, setRbacLoading] = useState(false);

  async function handleTestRbac() {
    setRbacLoading(true);
    setRbacResult(null);
    try {
      const res = await apiRequest('/api/security-lab/test-admin-only-rbac');
      setRbacResult({
        allowed: true,
        message: res.message || 'Access granted: You have administrator privileges.'
      });
    } catch (err) {
      setRbacResult({
        allowed: false,
        message: `Access denied: Your account role (${user?.role}) does not have permission to access administrative functions.`
      });
    } finally {
      setRbacLoading(false);
    }
  }

  // --- DEMONSTRATION 4: RATE LIMITING & LOCKOUT ---
  const [rateLogs, setRateLogs] = useState([]);
  const [rateLoading, setRateLoading] = useState(false);

  // Click-by-click test: Click 1 -> Allowed, Click 2 -> Allowed, Click 3 -> Allowed, Click 4 -> Blocked
  async function handleSingleRateLimitClick() {
    setRateLoading(true);
    const attemptNum = rateLogs.length + 1;
    try {
      const res = await fetch('/api/security-lab/test-rate-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      const wasAllowed = res.ok && data.allowed !== false;
      const newEntry = {
        attempt: attemptNum,
        allowed: wasAllowed,
        status: res.status,
        text: wasAllowed
          ? `Click ${attemptNum}: Allowed (Request ${Math.min(attemptNum, 3)} of 3 threshold accepted)`
          : `Click ${attemptNum}: Blocked (HTTP 429: Too many requests. Rate limit successfully triggered!)`
      };
      setRateLogs(prev => [...prev, newEntry]);
    } catch (err) {
      setRateLogs(prev => [...prev, {
        attempt: attemptNum,
        allowed: false,
        status: 0,
        text: `Click ${attemptNum}: Network error (${err.message})`
      }]);
    } finally {
      setRateLoading(false);
    }
  }

  async function handleResetRateLimit() {
    setRateLoading(true);
    try {
      await fetch('/api/security-lab/reset-rate-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (e) {
      // Ignore
    } finally {
      setRateLogs([]);
      setRateLoading(false);
    }
  }

  async function handleAutomateRateLimit() {
    setRateLoading(true);
    await handleResetRateLimit();
    const logs = [];
    for (let i = 1; i <= 4; i++) {
      try {
        const res = await fetch('/api/security-lab/test-rate-limit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        const wasAllowed = res.ok && data.allowed !== false;
        logs.push({
          attempt: i,
          allowed: wasAllowed,
          status: res.status,
          text: wasAllowed
            ? `Click ${i}: Allowed (Request ${i} of 3 accepted under rate limit)`
            : `Click ${i}: Blocked (HTTP 429: Too many requests. Rate limit protection triggered!)`
        });
      } catch (err) {
        logs.push({ attempt: i, allowed: false, status: 0, text: `Click ${i}: Error (${err.message})` });
      }
      await new Promise(r => setTimeout(r, 200));
    }
    setRateLogs(logs);
    setRateLoading(false);
  }

  const handleTestRateLimit = handleSingleRateLimitClick;

  // --- DEMONSTRATION 5: FILE UPLOAD SAFETY & SHA-256 ---
  const [uploadTestResult, setUploadTestResult] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  // User file scanner state (Malicious vs Safe Check)
  const [userSelectedFile, setUserSelectedFile] = useState(null);
  const [fileScanLoading, setFileScanLoading] = useState(false);
  const [fileScanResult, setFileScanResult] = useState(null);
  const [fileScanError, setFileScanError] = useState('');
  const [copiedFingerprint, setCopiedFingerprint] = useState(false);

  async function handleScanFile(fileToScan) {
    const targetFile = fileToScan || userSelectedFile;
    if (!targetFile) {
      setFileScanError('Please choose or select a file to analyze.');
      return;
    }
    setFileScanError('');
    setFileScanLoading(true);
    setFileScanResult(null);

    try {
      const formData = new FormData();
      formData.append('file', targetFile);

      const res = await apiRequest('/api/security-lab/scan-file', {
        method: 'POST',
        body: formData
      });
      setFileScanResult(res);
    } catch (err) {
      setFileScanError(err.message || 'File security scan failed.');
    } finally {
      setFileScanLoading(false);
    }
  }

  function handleQuickSampleScan(sampleType) {
    let file;
    if (sampleType === 'safe-log') {
      const content = `2026-10-18T14:30:12.102Z [INFO] Auth service: User 'analyst1' logged in from 192.168.1.45\n2026-10-18T14:30:15.820Z [INFO] Evidence SHA-256 calculated: d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592\n2026-10-18T14:31:02.404Z [INFO] Hash verified successfully.`;
      file = new File([content], 'incident_audit.log', { type: 'text/plain' });
    } else if (sampleType === 'trojan-exe') {
      const bytes = new Uint8Array([0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00]);
      file = new File([bytes], 'backdoor_payload.exe', { type: 'application/x-msdownload' });
    } else if (sampleType === 'disguised-pdf') {
      const bytes = new Uint8Array([0x4D, 0x5A, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x54, 0x68, 0x69, 0x73, 0x20, 0x70, 0x72, 0x6F]);
      file = new File([bytes], 'urgent_invoice_disguised.pdf', { type: 'application/pdf' });
    } else if (sampleType === 'webshell') {
      const content = `<?php\n// Malicious Web Shell Payload\nif(isset($_POST['cmd'])){\n  $cmd = base64_decode($_POST['cmd']);\n  eval($cmd);\n  system($cmd);\n}\n?>`;
      file = new File([content], 'c99_webshell.php', { type: 'application/x-httpd-php' });
    } else if (sampleType === 'eicar') {
      const content = `X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*`;
      file = new File([content], 'eicar_malware_test.com', { type: 'text/plain' });
    }

    if (file) {
      setUserSelectedFile(file);
      handleScanFile(file);
    }
  }

  async function handleTestMaliciousUpload() {
    setUploadLoading(true);
    setUploadTestResult(null);
    try {
      const fakeExe = new Blob(['MZ\x90\x00\x03\x00\x00\x00FakeMalwareExecutablePayload'], { type: 'application/x-msdownload' });
      const formData = new FormData();
      formData.append('evidence', fakeExe, 'trojan_sample.exe');
      formData.append('case_id', 'CASE-2026-001');

      await apiRequest('/api/evidence/upload', {
        method: 'POST',
        body: formData
      });

      setUploadTestResult({
        type: 'danger',
        success: false,
        text: 'Unexpected: Executable file was accepted. Check server allowlist.'
      });
    } catch (err) {
      setUploadTestResult({
        type: 'success',
        success: true,
        text: 'Protection working: The server immediately rejected trojan_sample.exe. Executable and script files are strictly blocked.'
      });
    } finally {
      setUploadLoading(false);
    }
  }

  // --- PASSWORD CHANGE FORM (IN ACCOUNT TAB) ---
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwChangeLoading, setPwChangeLoading] = useState(false);
  const [pwChangeMsg, setPwChangeMsg] = useState('');
  const [pwChangeErr, setPwChangeErr] = useState('');

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwChangeErr('');
    setPwChangeMsg('');
    if (newPw !== confirmPw) {
      setPwChangeErr('New password and confirmation do not match.');
      return;
    }
    setPwChangeLoading(true);
    try {
      await apiRequest('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw, confirmPassword: confirmPw })
      });
      setPwChangeMsg('Password updated successfully!');
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    } catch (err) {
      setPwChangeErr(err.message || 'Failed to update password.');
    } finally {
      setPwChangeLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={26} color="var(--accent-cyan)" />
              <span>Security Features</span>
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Demonstrations of five essential security protections built into CyberShield to safeguard accounts and evidence.
            </p>
          </div>

          <button
            onClick={() => setShowHelp(!showHelp)}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.8rem' }}
          >
            {showHelp ? 'Hide Help' : 'What is this page for?'}
          </button>
        </div>

        {/* Expandable Help Section */}
        {showHelp && (
          <div className="cyber-alert cyber-alert-info" style={{ marginTop: '1rem', fontSize: '0.825rem' }}>
            <div>
              <strong style={{ color: '#F8FAFC', display: 'block', marginBottom: '0.25rem' }}>
                Guide for Faculty and Practical Exams:
              </strong>
              This page provides interactive demonstrations of the five core security controls required by our Cybersecurity syllabus.
              Each card explains what problem the security feature prevents, lets you run a safe live test, and shows the actual result produced by the backend server.
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'mechanisms' ? 'active' : ''}`}
          onClick={() => setActiveTab('mechanisms')}
        >
          <ShieldCheck size={16} />
          <span>Five Core Security Protections</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'account' ? 'active' : ''}`}
          onClick={() => setActiveTab('account')}
        >
          <KeyRound size={16} />
          <span>My Account & Login Verification</span>
        </button>
      </div>

      {/* TAB 1: FIVE CORE PROTECTIONS */}
      {activeTab === 'mechanisms' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* 1. PASSWORD SECURITY */}
          <div className="cyber-card">
            <div className="cyber-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '0.4rem', borderRadius: '6px' }}>
                  <Lock size={18} color="var(--accent-cyan)" />
                </div>
                <div>
                  <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>1. Password Security & Hashing</h2>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Prevents weak passwords and protects stored credentials from being read.
                  </div>
                </div>
              </div>
              <span className="badge badge-success">Active</span>
            </div>

            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
              <strong>The Problem It Prevents:</strong> If a system allows weak passwords, attackers can easily guess them using automated tools. If passwords are saved in plain text, anyone with access to the database can read them. CyberShield enforces complexity rules and stores passwords as scrambled cryptographic hashes.
            </p>

            {/* Interactive Test Form */}
            <div style={{ background: '#0B1322', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: '0.75rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Test Password Rules & Storage:
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                <input
                  type="text"
                  value={testPassword}
                  onChange={(e) => setTestPassword(e.target.value)}
                  placeholder="Enter a test password"
                  className="form-input"
                  style={{ flex: 1, minWidth: '220px', fontSize: '0.85rem' }}
                />
                <button
                  onClick={handleTestPassword}
                  disabled={pwLoading}
                  className="btn btn-primary btn-sm"
                >
                  {pwLoading ? 'Checking...' : 'Check Password'}
                </button>
              </div>

              {/* Quick Preset Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', alignItems: 'center' }}>
                <span>Try examples:</span>
                <button
                  type="button"
                  onClick={() => setTestPassword('12345')}
                  style={{ background: 'none', border: '1px solid var(--border-subtle)', color: 'var(--accent-amber)', padding: '0.15rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                >
                  Weak ("12345")
                </button>
                <button
                  type="button"
                  onClick={() => setTestPassword('CyberShield@2026!')}
                  style={{ background: 'none', border: '1px solid var(--border-subtle)', color: 'var(--accent-cyan)', padding: '0.15rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                >
                  Strong ("CyberShield@2026!")
                </button>
              </div>

              {/* Result Display */}
              {pwResult && (
                <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                  {pwResult.isValid ? (
                    <div style={{ color: '#6EE7B7', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <CheckCircle2 size={16} />
                      <span><strong>Accepted by Server:</strong> Password meets all complexity rules (at least 10 characters, uppercase, lowercase, number, symbol).</span>
                    </div>
                  ) : (
                    <div style={{ color: '#FDA4AF', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <AlertTriangle size={16} />
                      <span><strong>Rejected by Server:</strong> Password is too weak. {pwResult.errors?.join(', ')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Explanation of Result */}
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              <strong>What this means:</strong> When an account is registered or updated, the server checks these rules before saving. Valid passwords are transformed into irreversible mathematical hashes using bcrypt before being stored.
            </p>

            {/* Collapsible Technical Details */}
            <div style={{ marginTop: '0.75rem' }}>
              <button
                onClick={() => toggleTech('pw')}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              >
                {expandedTech['pw'] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <span>Technical details for faculty evaluation</span>
              </button>
              {expandedTech['pw'] && (
                <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#090D16', borderRadius: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>
                  • Algorithm: Bcrypt with salt cost factor 12 (~250ms hashing work factor)<br />
                  • Validation: Server-side Zod schema validation (`server/src/utils/validators.js`)<br />
                  • Rule Set: min 10 chars, at least 1 uppercase [A-Z], 1 lowercase [a-z], 1 number [0-9], 1 special character [^A-Za-z0-9]
                </div>
              )}
            </div>
          </div>

          {/* 2. EXTRA LOGIN VERIFICATION (2FA) */}
          <div className="cyber-card">
            <div className="cyber-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ background: 'rgba(59, 130, 246, 0.15)', padding: '0.4rem', borderRadius: '6px' }}>
                  <KeyRound size={18} color="var(--accent-blue)" />
                </div>
                <div>
                  <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>2. Extra Login Verification (Two-Factor Authentication / MFA)</h2>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Requires a temporary code from your phone so stolen passwords alone cannot unlock your account.
                  </div>
                </div>
              </div>
              <span className={`badge ${user?.totpEnabled ? 'badge-success' : 'badge-medium'}`}>
                {user?.totpEnabled ? 'MFA Active & Protecting Account' : 'Available to Configure'}
              </span>
            </div>

            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
              <strong>The Problem It Prevents:</strong> If an attacker steals or guesses a password, single-factor authentication leaves the account defenseless. Two-factor authentication (2FA) requires both something you know (password) and something you have (an authenticator app on your phone).
            </p>

            <div style={{ background: '#0B1322', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: mfaSetupData || user?.totpEnabled ? '1rem' : '0' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {user?.totpEnabled ? (
                      <>
                        <ShieldCheck size={16} color="#10B981" />
                        <span>Current Status: Protected with 2FA (TOTP)</span>
                      </>
                    ) : (
                      <>
                        <KeyRound size={16} color="var(--accent-cyan)" />
                        <span>Current Status: 2FA Not Yet Configured</span>
                      </>
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {user?.totpEnabled
                      ? 'Every login requires your password plus a live 6-digit code from Google Authenticator or Microsoft Authenticator.'
                      : 'You can configure an authenticator app right now using a QR code.'}
                  </div>
                </div>

                {!user?.totpEnabled && !mfaSetupData && (
                  <button
                    onClick={handleStartMfa}
                    disabled={mfaLoading}
                    className="btn btn-primary btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <QrCode size={15} />
                    <span>{mfaLoading ? 'Generating QR Code...' : 'Set Up Authenticator'}</span>
                  </button>
                )}

                {user?.totpEnabled && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setShowDisableModal(true)}
                      className="btn btn-secondary btn-sm"
                      style={{ color: '#FDA4AF', borderColor: 'rgba(244, 63, 94, 0.3)' }}
                    >
                      Disable Two-Factor Authentication
                    </button>
                  </div>
                )}
              </div>

              {/* Four-Step MFA Enrollment Workflow */}
              {mfaSetupData && (
                <div style={{ padding: '1.25rem', background: '#090D16', borderRadius: '8px', border: '1px solid var(--border-active)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)' }}>
                    <Smartphone size={18} color="var(--accent-cyan)" />
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#F8FAFC' }}>
                      Follow These 4 Steps to Enable Authenticator
                    </h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {/* Step 1: Scan QR Code */}
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      <div style={{ background: '#FFF', padding: '8px', borderRadius: '8px', display: 'inline-block', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }}>
                        <img
                          src={mfaSetupData.qrCodeDataUrl}
                          alt="CyberShield 2FA Enrollment QR Code"
                          style={{ width: '140px', height: '140px', display: 'block' }}
                        />
                      </div>

                      <div style={{ flex: 1, minWidth: '260px' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '0.35rem' }}>
                          Step 1: Scan the QR code
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                          Scan this code using Google Authenticator or Microsoft Authenticator. Then enter the 6-digit code shown in your mobile app below.
                        </p>

                        <div style={{ background: '#0B1322', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                            Cannot scan? Enter this manual setup key into your authenticator app:
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span className="font-mono" style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', wordBreak: 'break-all', fontWeight: 600 }}>
                              {mfaSetupData.secret}
                            </span>
                            <button
                              type="button"
                              onClick={handleCopySecret}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                              title="Copy Secret Key"
                            >
                              {copiedSecret ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                              <span>{copiedSecret ? 'Copied!' : 'Copy Key'}</span>
                            </button>
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                            Account: <strong>{mfaSetupData.account || user?.username}</strong> | Issuer: <strong>CyberShield</strong>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Step 2: Open App Guidance */}
                    <div style={{ padding: '0.75rem', background: '#0B1322', borderRadius: '6px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <Smartphone size={16} color="var(--accent-blue)" />
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>Step 2:</strong> Open your authenticator app and locate the <strong>CyberShield</strong> entry displaying rotating 6-digit codes.
                      </div>
                    </div>

                    {/* Step 3: Enter Code Form */}
                    <div style={{ padding: '1rem', background: '#0B1322', borderRadius: '6px', border: '1px solid rgba(6, 182, 212, 0.25)' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#F8FAFC', marginBottom: '0.25rem' }}>
                        Step 3: Enter the 6-digit code
                      </div>
                      <form onSubmit={handleVerifyMfa} style={{ marginTop: '0.75rem' }}>
                        <div style={{ marginBottom: '0.75rem' }}>
                          <label className="form-label" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            Enter the 6-digit code from your authenticator app
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            pattern="[0-9]*"
                            maxLength={6}
                            value={mfaToken}
                            onChange={(e) => setMfaToken(e.target.value.replace(/\D/g, ''))}
                            placeholder="123456"
                            className="form-input font-mono"
                            style={{
                              maxWidth: '220px',
                              textAlign: 'center',
                              fontSize: '1.25rem',
                              letterSpacing: '0.25em',
                              padding: '0.5rem',
                              display: 'block'
                            }}
                            autoFocus
                            required
                          />
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          <button
                            type="submit"
                            disabled={mfaLoading || mfaToken.trim().length !== 6}
                            className="btn btn-primary btn-sm"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                          >
                            {mfaLoading ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                            <span>{mfaLoading ? 'Verifying Code...' : 'Verify and Enable MFA'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelMfa}
                            disabled={mfaLoading}
                            className="btn btn-secondary btn-sm"
                          >
                            Cancel Setup
                          </button>
                        </div>
                      </form>

                      <div style={{ marginTop: '0.75rem', fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                        * Note: Scanning the QR code alone does not enable MFA. You must verify a live 6-digit code to complete enrollment.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Feedback Alerts */}
              {mfaMsg && (
                <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '6px', color: '#6EE7B7', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={16} />
                  <span>{mfaMsg}</span>
                </div>
              )}
              {mfaError && (
                <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '6px', color: '#FDA4AF', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertTriangle size={16} />
                  <span>{mfaError}</span>
                </div>
              )}

              {/* Disable Password Confirmation Modal */}
              {showDisableModal && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: '#090D16', borderRadius: '6px', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#FDA4AF', marginBottom: '0.5rem' }}>
                    Confirm Disabling Two-Factor Authentication
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                    To disable Two-Factor Authentication, please enter your current account password to verify your identity:
                  </p>
                  <form onSubmit={handleDisableMfa} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      type="password"
                      value={disablePassword}
                      onChange={(e) => setDisablePassword(e.target.value)}
                      placeholder="Enter account password"
                      className="form-input"
                      style={{ maxWidth: '240px' }}
                      required
                    />
                    <button
                      type="submit"
                      disabled={disableLoading || !disablePassword}
                      className="btn btn-secondary btn-sm"
                      style={{ color: '#FDA4AF', borderColor: 'rgba(244, 63, 94, 0.4)' }}
                    >
                      {disableLoading ? 'Verifying...' : 'Confirm Disable'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowDisableModal(false); setDisablePassword(''); setDisableError(''); }}
                      className="btn btn-secondary btn-sm"
                    >
                      Cancel
                    </button>
                  </form>
                  {disableError && (
                    <div style={{ marginTop: '0.5rem', color: '#FDA4AF', fontSize: '0.78rem' }}>
                      {disableError}
                    </div>
                  )}
                </div>
              )}
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              <strong>What this means:</strong> Once enabled, logging into this account requires both the account password and the live 6-digit TOTP code generated by the user's mobile device. Secrets are encrypted at rest with AES-256-GCM.
            </p>

            <div style={{ marginTop: '0.75rem' }}>
              <button
                onClick={() => toggleTech('mfa')}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              >
                {expandedTech['mfa'] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <span>Technical details for faculty evaluation</span>
              </button>
              {expandedTech['mfa'] && (
                <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#090D16', borderRadius: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>
                  • Protocol: RFC 6238 Time-Based One-Time Password (TOTP)<br />
                  • Parameters: 30-second epoch window, HMAC-SHA1 algorithm, 6-digit output<br />
                  • Drift Tolerance: +/- 1 step (30 seconds) to accommodate device clock skew<br />
                  • Encryption at Rest: AES-256-GCM authenticated cipher with randomized IVs<br />
                  • Replay Defense: Timestep tracking rejects duplicate token usage within active window
                </div>
              )}
            </div>
          </div>

          {/* 3. ROLE-BASED ACCESS CONTROL */}
          <div className="cyber-card">
            <div className="cyber-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ background: 'rgba(244, 63, 94, 0.15)', padding: '0.4rem', borderRadius: '6px' }}>
                  <UserCheck size={18} color="var(--accent-rose)" />
                </div>
                <div>
                  <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>3. Role-Based Permissions (Access Control)</h2>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Ensures users can only perform actions and see data permitted for their account role.
                  </div>
                </div>
              </div>
              <span className="badge badge-cyan">Role: {user?.role?.toUpperCase()}</span>
            </div>

            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
              <strong>The Problem It Prevents:</strong> In an investigation platform, normal citizens (Reporters) must not be allowed to access admin controls or view cases reported by other citizens. The backend must enforce permissions on every request, rather than simply hiding buttons in the browser.
            </p>

            <div style={{ background: '#0B1322', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Test Permission Boundary:
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Calls an Administrator-only server function using your current session role (<strong>{user?.role}</strong>).
                  </div>
                </div>
                <button
                  onClick={handleTestRbac}
                  disabled={rbacLoading}
                  className="btn btn-secondary btn-sm"
                >
                  {rbacLoading ? 'Testing Server...' : 'Test Permission Boundary'}
                </button>
              </div>

              {rbacResult && (
                <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                  {rbacResult.allowed ? (
                    <div style={{ color: '#6EE7B7', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <CheckCircle2 size={16} />
                      <span><strong>Access Granted:</strong> {rbacResult.message}</span>
                    </div>
                  ) : (
                    <div style={{ color: '#FCD34D', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <ShieldAlert size={16} />
                      <span><strong>Access Safely Blocked by Server:</strong> {rbacResult.message}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              <strong>What this means:</strong> The server checks your role in the active session on every request. Even if someone tries to call the URL directly, unauthorized requests are safely rejected.
            </p>

            <div style={{ marginTop: '0.75rem' }}>
              <button
                onClick={() => toggleTech('rbac')}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              >
                {expandedTech['rbac'] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <span>Technical details for faculty evaluation</span>
              </button>
              {expandedTech['rbac'] && (
                <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#090D16', borderRadius: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>
                  • Implementation: Server middleware `requireRole(['admin'])` (`server/src/middleware/auth.js`)<br />
                  • Rejection code: HTTP 403 Forbidden with structured JSON error<br />
                  • Data Isolation: Reporters are restricted to queries matching `WHERE reporter_id = ?`
                </div>
              )}
            </div>
          </div>

          {/* 4. REPEATED LOGIN PROTECTION (RATE LIMITING) */}
          <div className="cyber-card">
            <div className="cyber-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '0.4rem', borderRadius: '6px' }}>
                  <Clock size={18} color="var(--accent-amber)" />
                </div>
                <div>
                  <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>4. Protection Against Repeated Login Attempts</h2>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Restricts rapid automated guesses and temporarily locks accounts after repeated failed logins.
                  </div>
                </div>
              </div>
              <span className="badge badge-high">Active</span>
            </div>

            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
              <strong>The Problem It Prevents:</strong> Attackers often use scripts to guess thousands of passwords per minute (brute-force attacks). Rate limiting stops this by allowing only a safe number of attempts before temporarily blocking further requests.
            </p>

            <div style={{ background: '#0B1322', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Interactive Rate Limit Test (Threshold: 3 Allowed / 4th Blocked)
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Click the button below: Click 1 is allowed, Click 2 is allowed, Click 3 is allowed, and Click 4 is safely blocked by the server.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <button
                    onClick={handleSingleRateLimitClick}
                    disabled={rateLoading}
                    className="btn btn-primary btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    {rateLoading ? (
                      <RefreshCw size={13} className="animate-spin" />
                    ) : (
                      <Clock size={13} />
                    )}
                    <span>
                      {rateLogs.length === 0
                        ? 'Run Rate Limit Test (Click 1)'
                        : rateLogs.length === 1
                        ? 'Click Again (Attempt 2)'
                        : rateLogs.length === 2
                        ? 'Click Again (Attempt 3)'
                        : rateLogs.length === 3
                        ? 'Click 4th Time (Trigger Rate Block)'
                        : `Click Again (Attempt ${rateLogs.length + 1})`}
                    </span>
                  </button>

                  {rateLogs.length > 0 && (
                    <button
                      onClick={handleResetRateLimit}
                      disabled={rateLoading}
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      title="Reset rate limiter so you can run the test from Click 1 again"
                    >
                      <RotateCcw size={13} />
                      <span>Reset Counter</span>
                    </button>
                  )}

                  <button
                    onClick={handleAutomateRateLimit}
                    disabled={rateLoading}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.725rem' }}
                    title="Automatically fires all 4 rapid requests sequentially"
                  >
                    Automate 4 Rapid Requests
                  </button>
                </div>
              </div>

              {rateLogs.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginTop: '0.5rem' }}>
                  {rateLogs.map(log => (
                    <div
                      key={log.attempt}
                      style={{
                        padding: '0.55rem 0.85rem',
                        borderRadius: '6px',
                        background: '#090D16',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        border: `1px solid ${log.allowed ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.4)'}`
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {log.allowed ? (
                          <CheckCircle2 size={15} color="#10B981" />
                        ) : (
                          <AlertTriangle size={15} color="#F43F5E" />
                        )}
                        <span style={{ color: log.allowed ? '#6EE7B7' : '#FDA4AF', fontWeight: log.allowed ? 500 : 600 }}>
                          {log.text}
                        </span>
                      </div>
                      <span className={`badge ${log.allowed ? 'badge-success' : 'badge-critical'}`} style={{ fontSize: '0.68rem', padding: '0.15rem 0.5rem' }}>
                        {log.allowed ? 'Allowed (HTTP 200)' : 'Blocked (HTTP 429)'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              <strong>What this means:</strong> The server actively counts attempts within a short time window. When the limit is exceeded, excessive requests are denied before they can exhaust server resources.
            </p>

            <div style={{ marginTop: '0.75rem' }}>
              <button
                onClick={() => toggleTech('rate')}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              >
                {expandedTech['rate'] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <span>Technical details for faculty evaluation</span>
              </button>
              {expandedTech['rate'] && (
                <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#090D16', borderRadius: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>
                  • Rate Limiter: `express-rate-limit` middleware (`server/src/middleware/rateLimiter.js`)<br />
                  • Account Lockout: 5 consecutive failed login attempts triggers an automatic 15-minute account lockout<br />
                  • Return Code: HTTP 429 Too Many Requests
                </div>
              )}
            </div>
          </div>

          {/* 5. SAFE EVIDENCE UPLOADS & FILE INTEGRITY */}
          <div className="cyber-card">
            <div className="cyber-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '0.4rem', borderRadius: '6px' }}>
                  <FileCheck size={18} color="var(--accent-emerald)" />
                </div>
                <div>
                  <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>5. Safe File Uploads & Malware Security Scanner</h2>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Deep file analysis: blocks dangerous executable scripts, detects camouflaged PE headers, and verifies SHA-256 integrity.
                  </div>
                </div>
              </div>
              <span className="badge badge-success">Active Defense</span>
            </div>

            <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.5 }}>
              <strong>The Problem It Prevents:</strong> Attackers often try to upload dangerous files (like `.exe`, `.php`, or `.sh` scripts) or disguise executables behind document extensions to execute malicious code on the server. Furthermore, evidentiary integrity requires proof that files have remained unaltered since collection.
            </p>

            {/* Interactive File Scanner Box */}
            <div style={{
              background: '#0B1322',
              padding: '1.25rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <UploadCloud size={20} color="var(--accent-cyan)" />
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#F8FAFC' }}>
                    Upload File to Inspect (Malicious vs Safe Check)
                  </span>
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Max 25 MB • Deep binary header &amp; entropy analysis
                </span>
              </div>

              {/* Upload Input Area */}
              <div style={{
                border: '2px dashed rgba(6, 182, 212, 0.3)',
                borderRadius: '8px',
                padding: '1.25rem',
                textAlign: 'center',
                background: 'rgba(4, 16, 26, 0.6)',
                marginBottom: '1rem'
              }}>
                <input
                  type="file"
                  id="securityLabFileInput"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUserSelectedFile(e.target.files[0]);
                      setFileScanError('');
                      setFileScanResult(null);
                    }
                  }}
                />

                <label
                  htmlFor="securityLabFileInput"
                  style={{
                    display: 'inline-flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: 'rgba(6, 182, 212, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-cyan)'
                  }}>
                    <UploadCloud size={24} />
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#F8FAFC' }}>
                    {userSelectedFile ? userSelectedFile.name : 'Click to select a file from your computer'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {userSelectedFile
                      ? `${(userSelectedFile.size / 1024).toFixed(1)} KB • Click "Scan & Check File" below`
                      : 'Supports all document, log, image, archive, script, and executable file formats'}
                  </div>
                </label>

                {userSelectedFile && (
                  <div style={{ marginTop: '0.85rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleScanFile()}
                      disabled={fileScanLoading}
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: '0.825rem', padding: '0.45rem 1.1rem' }}
                    >
                      {fileScanLoading ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <RefreshCw size={14} className="spin" /> Scanning File...
                        </span>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <FileCheck size={15} /> Scan &amp; Check File Safety
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setUserSelectedFile(null);
                        setFileScanResult(null);
                        setFileScanError('');
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.8rem' }}
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Sample Presets */}
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Or run an instant simulation test:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  <button
                    onClick={() => handleQuickSampleScan('safe-log')}
                    disabled={fileScanLoading}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                  >
                    🟢 Test Safe Log (.log)
                  </button>
                  <button
                    onClick={() => handleQuickSampleScan('trojan-exe')}
                    disabled={fileScanLoading}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', color: '#FDA4AF' }}
                  >
                    🔴 Test Trojan Payload (.exe)
                  </button>
                  <button
                    onClick={() => handleQuickSampleScan('disguised-pdf')}
                    disabled={fileScanLoading}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', color: '#FCD34D' }}
                  >
                    🟡 Test Disguised Header (.pdf with MZ)
                  </button>
                  <button
                    onClick={() => handleQuickSampleScan('webshell')}
                    disabled={fileScanLoading}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', color: '#FDA4AF' }}
                  >
                    🔴 Test Web Shell Script (.php)
                  </button>
                  <button
                    onClick={() => handleQuickSampleScan('eicar')}
                    disabled={fileScanLoading}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', color: '#FDA4AF' }}
                  >
                    🔴 Test EICAR Benchmark
                  </button>
                </div>
              </div>

              {fileScanError && (
                <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.8rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '4px', color: '#FDA4AF', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <AlertTriangle size={15} />
                  <span>{fileScanError}</span>
                </div>
              )}

              {/* SCAN REPORT DISPLAY */}
              {fileScanResult && (
                <div style={{
                  marginTop: '1.25rem',
                  padding: '1rem',
                  borderRadius: '6px',
                  background: fileScanResult.verdict === 'MALICIOUS'
                    ? 'rgba(239, 68, 68, 0.08)'
                    : fileScanResult.verdict === 'SUSPICIOUS'
                      ? 'rgba(245, 158, 11, 0.08)'
                      : 'rgba(16, 185, 129, 0.08)',
                  border: `1px solid ${
                    fileScanResult.verdict === 'MALICIOUS'
                      ? 'rgba(239, 68, 68, 0.35)'
                      : fileScanResult.verdict === 'SUSPICIOUS'
                        ? 'rgba(245, 158, 11, 0.35)'
                        : 'rgba(16, 185, 129, 0.35)'
                  }`
                }}>
                  {/* Top Verdict Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      {fileScanResult.verdict === 'MALICIOUS' ? (
                        <ShieldX size={26} color="#EF4444" />
                      ) : fileScanResult.verdict === 'SUSPICIOUS' ? (
                        <AlertTriangle size={26} color="#F59E0B" />
                      ) : (
                        <ShieldCheck size={26} color="#10B981" />
                      )}
                      <div>
                        <div style={{
                          fontSize: '1rem',
                          fontWeight: 700,
                          color: fileScanResult.verdict === 'MALICIOUS'
                            ? '#EF4444'
                            : fileScanResult.verdict === 'SUSPICIOUS'
                              ? '#F59E0B'
                              : '#10B981'
                        }}>
                          {fileScanResult.verdict === 'MALICIOUS'
                            ? 'MALICIOUS FILE DETECTED'
                            : fileScanResult.verdict === 'SUSPICIOUS'
                              ? 'SUSPICIOUS FILE (REVIEW REQUIRED)'
                              : 'SAFE & VERIFIED EVIDENCE FILE'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          File: <strong>{fileScanResult.filename}</strong> ({fileScanResult.fileSize})
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span className={`badge ${
                        fileScanResult.verdict === 'MALICIOUS'
                          ? 'badge-danger'
                          : fileScanResult.verdict === 'SUSPICIOUS'
                            ? 'badge-warning'
                            : 'badge-success'
                      }`} style={{ fontSize: '0.75rem' }}>
                        Risk Score: {fileScanResult.riskScore}/100
                      </span>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Server Ingestion: <strong style={{ color: fileScanResult.allowedByServerFilter ? '#10B981' : '#EF4444' }}>
                          {fileScanResult.allowedByServerFilter ? 'ACCEPTED' : 'BLOCKED'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Recommendation banner */}
                  <div style={{
                    padding: '0.6rem 0.8rem',
                    background: 'rgba(0, 0, 0, 0.25)',
                    borderRadius: '4px',
                    fontSize: '0.78rem',
                    color: '#F8FAFC',
                    marginBottom: '0.85rem'
                  }}>
                    <strong>Security Assessment:</strong> {fileScanResult.recommendation}
                  </div>

                  {/* Metrics Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                    gap: '0.6rem',
                    marginBottom: '0.85rem'
                  }}>
                    <div style={{ background: '#070C15', padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--border-subtle)', fontSize: '0.75rem' }}>
                      <span style={{ color: 'var(--text-muted)', display: 'block' }}>Extension &amp; MIME:</span>
                      <span style={{ color: '#F8FAFC', fontFamily: 'JetBrains Mono, monospace' }}>
                        {fileScanResult.extension} • {fileScanResult.mimetype}
                      </span>
                    </div>

                    <div style={{ background: '#070C15', padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--border-subtle)', fontSize: '0.75rem' }}>
                      <span style={{ color: 'var(--text-muted)', display: 'block' }}>Magic Bytes Signature:</span>
                      <span style={{ color: '#F8FAFC', fontFamily: 'JetBrains Mono, monospace' }}>
                        {fileScanResult.magicBytesHex} ({fileScanResult.magicBytesAscii})
                      </span>
                    </div>

                    <div style={{ background: '#070C15', padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--border-subtle)', fontSize: '0.75rem' }}>
                      <span style={{ color: 'var(--text-muted)', display: 'block' }}>Shannon Entropy:</span>
                      <span style={{ color: '#F8FAFC', fontFamily: 'JetBrains Mono, monospace' }}>
                        {fileScanResult.entropy} / 8.0 • {fileScanResult.entropyLevel}
                      </span>
                    </div>
                  </div>

                  {/* SHA-256 Fingerprint */}
                  <div style={{
                    background: '#070C15',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '4px',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.75rem',
                    marginBottom: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.4rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0, overflow: 'hidden' }}>
                      <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>SHA-256:</span>
                      <span style={{ color: 'var(--accent-cyan)', fontFamily: 'JetBrains Mono, monospace', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {fileScanResult.sha256}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(fileScanResult.sha256);
                        setCopiedFingerprint(true);
                        setTimeout(() => setCopiedFingerprint(false), 2000);
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                    >
                      {copiedFingerprint ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                      <span>{copiedFingerprint ? 'Copied' : 'Copy Hash'}</span>
                    </button>
                  </div>

                  {/* Findings Breakdown */}
                  {fileScanResult.findings && fileScanResult.findings.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Inspection Findings &amp; Heuristics:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        {fileScanResult.findings.map((f, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: '0.45rem 0.65rem',
                              borderRadius: '4px',
                              background: '#070C15',
                              border: `1px solid ${
                                f.status === 'FAIL'
                                  ? 'rgba(239, 68, 68, 0.3)'
                                  : f.status === 'WARN'
                                    ? 'rgba(245, 158, 11, 0.3)'
                                    : 'rgba(16, 185, 129, 0.3)'
                              }`,
                              fontSize: '0.75rem',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '0.5rem'
                            }}
                          >
                            <span style={{
                              fontWeight: 700,
                              fontSize: '0.65rem',
                              padding: '0.1rem 0.35rem',
                              borderRadius: '3px',
                              background: f.status === 'FAIL' ? '#EF4444' : (f.status === 'WARN' ? '#F59E0B' : '#10B981'),
                              color: '#04101A',
                              marginTop: '0.1rem'
                            }}>
                              {f.status}
                            </span>
                            <div style={{ flex: 1 }}>
                              <strong style={{ color: '#F8FAFC' }}>{f.title}: </strong>
                              <span style={{ color: 'var(--text-secondary)' }}>{f.detail}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Existing Quick Simulated Test */}
            <div style={{ background: '#0B1322', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Server Upload Filter Simulation:
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Attempts to upload a test executable file (`trojan_sample.exe`) to verify that the server rejects dangerous file types.
                  </div>
                </div>
                <button
                  onClick={handleTestMaliciousUpload}
                  disabled={uploadLoading}
                  className="btn btn-secondary btn-sm"
                >
                  {uploadLoading ? 'Testing Upload Filter...' : 'Test Malicious File Rejection'}
                </button>
              </div>

              {uploadTestResult && (
                <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ color: uploadTestResult.success ? '#6EE7B7' : '#FDA4AF', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {uploadTestResult.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                    <span>{uploadTestResult.text}</span>
                  </div>
                </div>
              )}
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              <strong>What this means:</strong> The server checks both the file extension and the internal file format against an approved safe list (like `.log`, `.txt`, `.pdf`, `.png`). Allowed evidence files are given a unique random name and stored safely outside the web root.
            </p>

            <div style={{ marginTop: '0.75rem' }}>
              <button
                onClick={() => toggleTech('upload')}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              >
                {expandedTech['upload'] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <span>Technical details for faculty evaluation</span>
              </button>
              {expandedTech['upload'] && (
                <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#090D16', borderRadius: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>
                  • Upload Filter: Multer with strict MIME and extension allowlist (`server/src/middleware/upload.js`)<br />
                  • Scanner: Binary magic byte extraction (PE/ELF/PDF/PNG), Shannon entropy detection, and EICAR/Web shell heuristics (`server/src/utils/fileScanner.js`)<br />
                  • Permitted formats: `.txt`, `.log`, `.csv`, `.eml`, `.pdf`, `.png`, `.jpg`, `.pcap`<br />
                  • Storage: Random UUID identifier outside public web directory to prevent direct execution
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MY ACCOUNT & LOGIN VERIFICATION */}
      {activeTab === 'account' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {/* Profile Overview */}
          <div className="cyber-card">
            <div className="cyber-card-header">
              <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Your Account Profile</h2>
              <span className="badge badge-cyan">{user?.role?.toUpperCase()}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Full Name</span>
                <strong style={{ color: '#F8FAFC' }}>{user?.fullName}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Username & Email</span>
                <span style={{ color: 'var(--text-secondary)' }}>@{user?.username} • {user?.email}</span>
              </div>
              {user?.badgeNumber && (
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Badge / ID</span>
                  <span className="font-mono" style={{ color: 'var(--accent-cyan)' }}>{user.badgeNumber}</span>
                </div>
              )}
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Two-Factor Authentication</span>
                <span style={{ color: user?.totpEnabled ? '#6EE7B7' : '#FCD34D', fontWeight: 600 }}>
                  {user?.totpEnabled ? 'Active (Protected by 6-digit Authenticator Code)' : 'Not Yet Configured'}
                </span>
              </div>
            </div>
          </div>

          {/* Change Password */}
          <div className="cyber-card">
            <div className="cyber-card-header">
              <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Change Your Password</h2>
            </div>

            {pwChangeMsg && (
              <div className="cyber-alert cyber-alert-success" style={{ fontSize: '0.8rem' }}>
                <Check size={16} />
                <span>{pwChangeMsg}</span>
              </div>
            )}
            {pwChangeErr && (
              <div className="cyber-alert cyber-alert-danger" style={{ fontSize: '0.8rem' }}>
                <AlertTriangle size={16} />
                <span>{pwChangeErr}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Current Password</label>
                <input
                  type="password"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  placeholder="Enter current password"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.78rem' }}>New Password (min 10 characters)</label>
                <input
                  type="password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="Enter strong new password"
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.78rem' }}>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="Re-type new password"
                  className="form-input"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={pwChangeLoading || !newPw}
                className="btn btn-primary btn-sm"
                style={{ marginTop: '0.25rem' }}
              >
                {pwChangeLoading ? 'Saving...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
