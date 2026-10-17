import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import {
  Lock,
  Shield,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Zap,
  Play,
  RotateCcw,
  FileCode,
  Key,
  Globe,
  Database,
  Activity,
  Layers,
  Info
} from 'lucide-react';

export function SecurityLabView() {
  const { user, csrfToken } = useAuth();

  // Test 1: Password Policy
  const [testPassword, setTestPassword] = useState('WeakPass1');
  const [passResult, setPassResult] = useState(null);
  const [passLoading, setPassLoading] = useState(false);

  // Test 2: Rate Limiting
  const [rateLimitLogs, setRateLimitLogs] = useState([]);
  const [rateLimitLoading, setRateLimitLoading] = useState(false);

  // Test 3: RBAC
  const [rbacResult, setRbacResult] = useState(null);
  const [rbacLoading, setRbacLoading] = useState(false);

  // Test 4: CSRF
  const [csrfValidResult, setCsrfValidResult] = useState(null);
  const [csrfBypassResult, setCsrfBypassResult] = useState(null);
  const [csrfLoading, setCsrfLoading] = useState(false);

  // Test 5: File Defense
  const [fileDefenseResult, setFileDefenseResult] = useState(null);
  const [fileDefenseLoading, setFileDefenseLoading] = useState(false);

  // Test 7: Security Headers
  const [headersData, setHeadersData] = useState(null);

  // Test 8: Live Audit Log Stream
  const [auditStream, setAuditStream] = useState([]);

  useEffect(() => {
    fetchSecurityHeaders();
    fetchLiveAuditStream();
  }, []);

  async function fetchSecurityHeaders() {
    try {
      const data = await apiRequest('/api/security-lab/inspect-headers');
      if (data.success) {
        setHeadersData(data);
      }
    } catch (e) {
      // Ignore
    }
  }

  async function fetchLiveAuditStream() {
    try {
      const data = await apiRequest('/api/security-lab/recent-audit-events');
      if (data.success) {
        setAuditStream(data.events);
      }
    } catch (e) {
      // Ignore
    }
  }

  // 1. Password Policy Test
  async function handleTestPassword() {
    setPassLoading(true);
    setPassResult(null);
    try {
      const res = await apiRequest('/api/security-lab/test-password-policy', {
        method: 'POST',
        body: JSON.stringify({ password: testPassword })
      });
      setPassResult(res);
      fetchLiveAuditStream();
    } catch (err) {
      setPassResult({ success: false, error: err.message });
    } finally {
      setPassLoading(false);
    }
  }

  // 2. Rate Limiting Test (Fires 4 rapid requests to trigger 429)
  async function handleTestRateLimit() {
    setRateLimitLoading(true);
    setRateLimitLogs([]);
    const logs = [];

    for (let i = 1; i <= 4; i++) {
      try {
        const res = await fetch('/api/security-lab/test-rate-limit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        const data = await res.json();
        logs.push({
          attempt: i,
          status: res.status,
          success: res.ok,
          message: data.message || data.error
        });
      } catch (err) {
        logs.push({ attempt: i, status: 'Network Error', success: false, message: err.message });
      }
      // Small pause between rapid requests
      await new Promise(r => setTimeout(r, 200));
    }

    setRateLimitLogs(logs);
    setRateLimitLoading(false);
    fetchLiveAuditStream();
  }

  // 3. RBAC Test
  async function handleTestRbac() {
    setRbacLoading(true);
    setRbacResult(null);
    try {
      const res = await apiRequest('/api/security-lab/test-admin-only-rbac');
      setRbacResult({ status: 200, success: true, message: res.message });
    } catch (err) {
      setRbacResult({ status: err.status || 403, success: false, message: err.message });
    } finally {
      setRbacLoading(false);
      fetchLiveAuditStream();
    }
  }

  // 4. CSRF Test
  async function handleTestCsrf(bypassToken) {
    setCsrfLoading(true);
    try {
      if (bypassToken) {
        // Deliberately omit X-CSRF-Token
        const res = await fetch('/api/security-lab/test-csrf-protected', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include'
        });
        const data = await res.json();
        setCsrfBypassResult({
          status: res.status,
          success: res.ok,
          message: data.message || data.error
        });
      } else {
        // Send with valid synchronized token
        const res = await apiRequest('/api/security-lab/test-csrf-protected', {
          method: 'POST',
          body: JSON.stringify({ action: 'valid_test' })
        });
        setCsrfValidResult({ status: 200, success: true, message: res.message });
      }
    } catch (err) {
      if (bypassToken) {
        setCsrfBypassResult({ status: err.status || 403, success: false, message: err.message });
      } else {
        setCsrfValidResult({ status: err.status || 403, success: false, message: err.message });
      }
    } finally {
      setCsrfLoading(false);
      fetchLiveAuditStream();
    }
  }

  // 5. Malicious File Defense Test
  async function handleTestFileDefense() {
    setFileDefenseLoading(true);
    setFileDefenseResult(null);

    try {
      const fakeExeContent = new Blob(['MZ_FAKE_EXECUTABLE_TEST_PAYLOAD'], { type: 'application/x-msdownload' });
      const formData = new FormData();
      formData.append('testFile', fakeExeContent, 'payload_mimic.exe');

      const res = await fetch('/api/security-lab/test-file-upload-defense', {
        method: 'POST',
        body: formData,
        headers: { 'X-CSRF-Token': csrfToken },
        credentials: 'include'
      });
      const data = await res.json();

      setFileDefenseResult({
        status: res.status,
        rejected: data.rejected,
        reason: data.reason || data.error,
        explanation: data.explanation
      });
    } catch (err) {
      setFileDefenseResult({ status: 'Error', rejected: true, reason: err.message });
    } finally {
      setFileDefenseLoading(false);
      fetchLiveAuditStream();
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#F8FAFC' }}>
            Interactive Security Controls Laboratory
          </h1>
          <span className="badge badge-high">Live Test Suite</span>
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          Execute working demonstration tests against the platform's independent security layers. Observe live HTTP status codes, defensive rejections, and real-time audit logging.
        </p>
      </div>

      {/* Grid of Security Demonstration Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
        
        {/* CONTROL 1: PASSWORD POLICY */}
        <div className="cyber-card">
          <div className="cyber-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock size={17} color="var(--accent-cyan)" />
              <h2 style={{ fontSize: '0.925rem', fontWeight: 600 }}>1. Password Policy Enforcement</h2>
            </div>
            <span className="badge badge-low" style={{ fontSize: '0.65rem' }}>Zod Validation</span>
          </div>

          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.85rem', lineHeight: 1.5 }}>
            Validates server-side password complexity rules: minimum 10 characters, uppercase, lowercase, numeric digit, and special character.
          </p>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <input
              type="text"
              value={testPassword}
              onChange={(e) => setTestPassword(e.target.value)}
              placeholder="Test password string..."
              className="form-input font-mono"
              style={{ fontSize: '0.8125rem' }}
            />
            <button
              onClick={handleTestPassword}
              disabled={passLoading}
              className="btn btn-primary btn-sm"
            >
              Test
            </button>
          </div>

          {passResult && (
            <div style={{
              background: '#0B1322',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem',
              fontSize: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.4rem' }}>
                {passResult.isValid ? (
                  <CheckCircle2 size={15} color="#10B981" />
                ) : (
                  <XCircle size={15} color="#F43F5E" />
                )}
                <strong style={{ color: passResult.isValid ? '#6EE7B7' : '#FDA4AF' }}>
                  {passResult.message}
                </strong>
              </div>

              {passResult.checks && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem', color: 'var(--text-muted)' }}>
                  <span style={{ color: passResult.checks.minLength ? '#10B981' : '#F43F5E' }}>
                    {passResult.checks.minLength ? '✓' : '✗'} 10+ Chars
                  </span>
                  <span style={{ color: passResult.checks.hasUppercase ? '#10B981' : '#F43F5E' }}>
                    {passResult.checks.hasUppercase ? '✓' : '✗'} Uppercase
                  </span>
                  <span style={{ color: passResult.checks.hasLowercase ? '#10B981' : '#F43F5E' }}>
                    {passResult.checks.hasLowercase ? '✓' : '✗'} Lowercase
                  </span>
                  <span style={{ color: passResult.checks.hasNumber ? '#10B981' : '#F43F5E' }}>
                    {passResult.checks.hasNumber ? '✓' : '✗'} Number
                  </span>
                  <span style={{ color: passResult.checks.hasSpecial ? '#10B981' : '#F43F5E', gridColumn: 'span 2' }}>
                    {passResult.checks.hasSpecial ? '✓' : '✗'} Special Character
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* CONTROL 2: RATE LIMITING */}
        <div className="cyber-card">
          <div className="cyber-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Zap size={17} color="var(--accent-amber)" />
              <h2 style={{ fontSize: '0.925rem', fontWeight: 600 }}>2. Authentication Rate Limiter</h2>
            </div>
            <span className="badge badge-high" style={{ fontSize: '0.65rem' }}>HTTP 429</span>
          </div>

          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.85rem', lineHeight: 1.5 }}>
            Fires rapid simulated authentication requests to trigger the sliding window threshold. The 4th rapid request triggers <code>HTTP 429 Too Many Requests</code>.
          </p>

          <button
            onClick={handleTestRateLimit}
            disabled={rateLimitLoading}
            className="btn btn-secondary btn-sm"
            style={{ marginBottom: '0.75rem', color: '#FCD34D' }}
          >
            <Play size={13} />
            <span>{rateLimitLoading ? 'Firing Requests...' : 'Trigger Rate Limit Test (4 Rapid Requests)'}</span>
          </button>

          {rateLimitLogs.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {rateLimitLogs.map(log => (
                <div key={log.attempt} style={{
                  background: '#0B1322',
                  border: `1px solid ${log.status === 429 ? 'rgba(244, 63, 94, 0.4)' : 'var(--border-subtle)'}`,
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.4rem 0.65rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.725rem'
                }}>
                  <span className="font-mono">Request #{log.attempt}</span>
                  <span className={`badge ${log.status === 429 ? 'badge-critical' : 'badge-success'}`}>
                    HTTP {log.status} {log.status === 429 ? 'RATE LIMITED' : 'ALLOWED'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CONTROL 3: RBAC AUTHORIZATION */}
        <div className="cyber-card">
          <div className="cyber-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={17} color="var(--accent-rose)" />
              <h2 style={{ fontSize: '0.925rem', fontWeight: 600 }}>3. Role-Based Access Control (RBAC)</h2>
            </div>
            <span className="badge badge-critical" style={{ fontSize: '0.65rem' }}>HTTP 403</span>
          </div>

          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.85rem', lineHeight: 1.5 }}>
            Tests server-side authorization enforcement. Calls an Admin-only API endpoint with current session role (<strong>{user?.role?.toUpperCase()}</strong>).
          </p>

          <button
            onClick={handleTestRbac}
            disabled={rbacLoading}
            className="btn btn-secondary btn-sm"
            style={{ marginBottom: '0.75rem' }}
          >
            <Play size={13} />
            <span>Call Protected Endpoint /api/security-lab/test-admin-only-rbac</span>
          </button>

          {rbacResult && (
            <div style={{
              background: '#0B1322',
              border: `1px solid ${rbacResult.success ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)'}`,
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem',
              fontSize: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                <span className={`badge ${rbacResult.success ? 'badge-success' : 'badge-critical'}`}>
                  HTTP {rbacResult.status}
                </span>
                <strong style={{ color: rbacResult.success ? '#6EE7B7' : '#FDA4AF' }}>
                  {rbacResult.success ? 'Access Authorized' : 'Access Denied: RBAC Boundary Enforced'}
                </strong>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.725rem' }}>
                {rbacResult.message}
              </div>
            </div>
          )}
        </div>

        {/* CONTROL 4: CSRF DEFENSE */}
        <div className="cyber-card">
          <div className="cyber-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Key size={17} color="var(--accent-emerald)" />
              <h2 style={{ fontSize: '0.925rem', fontWeight: 600 }}>4. Anti-CSRF Token Defense</h2>
            </div>
            <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>Synchronized Token</span>
          </div>

          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.85rem', lineHeight: 1.5 }}>
            State-changing requests must present an <code>X-CSRF-Token</code> matching server session secret. Compare legitimate submission vs simulated cross-site forgery attack.
          </p>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleTestCsrf(false)}
              disabled={csrfLoading}
              className="btn btn-secondary btn-sm"
              style={{ color: '#6EE7B7' }}
            >
              Test with Valid Token
            </button>
            <button
              onClick={() => handleTestCsrf(true)}
              disabled={csrfLoading}
              className="btn btn-danger btn-sm"
            >
              Simulate CSRF Attack (Omit Token)
            </button>
          </div>

          {csrfValidResult && (
            <div style={{ background: '#0B1322', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.4rem', fontSize: '0.725rem' }}>
              <span className="badge badge-success" style={{ marginRight: '0.4rem' }}>HTTP {csrfValidResult.status}</span>
              <span style={{ color: '#6EE7B7' }}>{csrfValidResult.message}</span>
            </div>
          )}

          {csrfBypassResult && (
            <div style={{ background: '#0B1322', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.725rem', border: '1px solid rgba(244, 63, 94, 0.4)' }}>
              <span className="badge badge-critical" style={{ marginRight: '0.4rem' }}>HTTP {csrfBypassResult.status} FORBIDDEN</span>
              <span style={{ color: '#FDA4AF' }}>{csrfBypassResult.message}</span>
            </div>
          )}
        </div>

        {/* CONTROL 5: MALICIOUS FILE UPLOAD REJECTION */}
        <div className="cyber-card">
          <div className="cyber-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileCode size={17} color="var(--accent-rose)" />
              <h2 style={{ fontSize: '0.925rem', fontWeight: 600 }}>5. File Upload Extension Defense</h2>
            </div>
            <span className="badge badge-critical" style={{ fontSize: '0.65rem' }}>Strict Allowlist</span>
          </div>

          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.85rem', lineHeight: 1.5 }}>
            Tests that executable or active script files (e.g. <code>.exe</code>, <code>.sh</code>, <code>.bat</code>) are strictly rejected before hitting the disk.
          </p>

          <button
            onClick={handleTestFileDefense}
            disabled={fileDefenseLoading}
            className="btn btn-secondary btn-sm"
            style={{ marginBottom: '0.75rem', color: '#FDA4AF' }}
          >
            <Play size={13} />
            <span>Test Uploading Prohibited .exe File</span>
          </button>

          {fileDefenseResult && (
            <div style={{
              background: '#0B1322',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem',
              fontSize: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                <span className="badge badge-critical">HTTP {fileDefenseResult.status} REJECTED</span>
                <strong style={{ color: '#FDA4AF' }}>Malicious Extension Neutralized</strong>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.725rem', marginTop: '0.2rem' }}>
                {fileDefenseResult.reason}
              </div>
            </div>
          )}
        </div>

        {/* CONTROL 7: SECURITY HEADERS & COOKIE FLAGS */}
        <div className="cyber-card">
          <div className="cyber-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Globe size={17} color="var(--accent-cyan)" />
              <h2 style={{ fontSize: '0.925rem', fontWeight: 600 }}>6. Security Headers & Cookie Flags</h2>
            </div>
            <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>Helmet.js</span>
          </div>

          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.85rem', lineHeight: 1.5 }}>
            Active HTTP response headers enforced by Helmet middleware and server-side session cookie protection flags.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '160px', overflowY: 'auto' }}>
            {headersData?.activeSecurityHeaders?.map(h => (
              <div key={h.header} style={{ background: '#0B1322', padding: '0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.725rem' }}>
                <div style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>{h.header}</div>
                <div style={{ color: 'var(--text-muted)' }}>{h.threatMitigated}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* CONTROL 8: REAL-TIME AUDIT LOG TRAIL */}
      <div className="cyber-card">
        <div className="cyber-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={17} color="var(--accent-cyan)" />
            <h2 style={{ fontSize: '0.95rem', fontWeight: 600 }}>
              7. Real-Time Security Audit Log Stream (Live Telemetry)
            </h2>
          </div>
          <button
            onClick={fetchLiveAuditStream}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.7rem' }}
          >
            <RotateCcw size={12} />
            <span>Refresh Audit Feed</span>
          </button>
        </div>

        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
          Every security event above (failed logins, rate limit triggers, RBAC denials, CSRF violations, file rejections) is immutably recorded into the SQLite <code>audit_logs</code> table.
        </p>

        <div className="cyber-table-container">
          <table className="cyber-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Event Type</th>
                <th>Actor</th>
                <th>IP Address</th>
                <th>Severity</th>
                <th>Outcome</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {auditStream.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                    No recent audit events in feed.
                  </td>
                </tr>
              ) : (
                auditStream.map(evt => (
                  <tr key={evt.id}>
                    <td className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </td>
                    <td>
                      <span className="badge badge-low" style={{ fontSize: '0.65rem' }}>
                        {evt.event_type}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.75rem' }}>
                      {evt.actor_username || 'anonymous'}
                    </td>
                    <td className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {evt.ip_address}
                    </td>
                    <td>
                      <span className={`badge ${evt.severity === 'CRITICAL' ? 'badge-critical' : (evt.severity === 'WARNING' || evt.severity === 'SECURITY_ALERT' ? 'badge-high' : 'badge-low')}`}>
                        {evt.severity}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${evt.status === 'SUCCESS' ? 'badge-success' : 'badge-critical'}`}>
                        {evt.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {evt.description}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
