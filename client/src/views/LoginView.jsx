import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, User, Key, CheckCircle2, AlertCircle, ArrowRight, UserPlus, Sparkles } from 'lucide-react';

export function LoginView() {
  const { login, verifyMfa, register, mfaPending, setMfaPending } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');

  // Registration fields
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regBadge, setRegBadge] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Password criteria check for registration
  const passChecks = {
    length: regPassword.length >= 10,
    upper: /[A-Z]/.test(regPassword),
    lower: /[a-z]/.test(regPassword),
    number: /[0-9]/.test(regPassword),
    special: /[^A-Za-z0-9]/.test(regPassword)
  };

  const isRegPasswordValid = Object.values(passChecks).every(Boolean);

  function fillDemoAccount(u, p) {
    setUsername(u);
    setPassword(p);
    setError('');
  }

  async function handleLoginSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(username, password);
      if (res.mfaRequired) {
        // MFA challenge mode activated
        setSuccessMsg('Primary authentication successful. Please enter your 6-digit TOTP code.');
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials or account locked.');
    } finally {
      setLoading(false);
    }
  }

  async function handleMfaSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await verifyMfa(totpCode.trim());
    } catch (err) {
      setError(err.message || 'Invalid multi-factor authentication code.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegisterSubmit(e) {
    e.preventDefault();
    if (!isRegPasswordValid) {
      setError('Password does not meet enterprise complexity requirements.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await register({
        username: regUsername,
        email: regEmail,
        password: regPassword,
        full_name: regFullName,
        badge_number: regBadge || null,
        role: 'reporter'
      });
      setSuccessMsg('Account registered successfully! You may now sign in.');
      setMode('login');
      setUsername(regUsername);
      setPassword('');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      background: 'radial-gradient(ellipse at 50% 20%, #131E36 0%, #090D16 70%)',
      position: 'relative'
    }} className="bg-tactical-grid">
      <div style={{
        width: '100%',
        maxWidth: '480px',
        background: 'rgba(19, 29, 49, 0.95)',
        border: '1px solid var(--border-active)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(6, 182, 212, 0.1)',
        backdropFilter: 'blur(12px)',
        padding: '2.25rem'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '54px',
            height: '54px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #06B6D4, #3B82F6)',
            boxShadow: '0 0 25px rgba(6, 182, 212, 0.45)',
            marginBottom: '1rem'
          }}>
            <Shield size={32} color="#04101A" strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: '1.45rem', fontWeight: 700, color: '#F8FAFC', letterSpacing: '0.02em' }}>
            CyberShield Forensics
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Secure Cybercrime Investigation & Digital Forensics Platform
          </p>
        </div>

        {/* Quick Demo Accounts Banner */}
        {!mfaPending && (
          <div style={{
            background: '#0B1322',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.85rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--accent-cyan)',
              marginBottom: '0.5rem'
            }}>
              <Sparkles size={14} />
              <span>ACADEMIC REVIEWER QUICK LOGIN (PRE-CONFIGURED)</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
              <button
                type="button"
                onClick={() => fillDemoAccount('admin', 'Admin@CyberShield2026!')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.7rem', padding: '0.3rem 0.5rem', justifyContent: 'flex-start' }}
              >
                <span className="badge badge-critical" style={{ fontSize: '0.6rem' }}>Admin</span>
                <span>Elena Vance</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('investigator1', 'Investigator@2026!')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.7rem', padding: '0.3rem 0.5rem', justifyContent: 'flex-start' }}
              >
                <span className="badge badge-cyan" style={{ fontSize: '0.6rem' }}>Investigator</span>
                <span>Marcus Reid</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('reporter1', 'Reporter@2026!')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.7rem', padding: '0.3rem 0.5rem', justifyContent: 'flex-start' }}
              >
                <span className="badge badge-medium" style={{ fontSize: '0.6rem' }}>Reporter</span>
                <span>Priya Sharma</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('testuser', 'TestUser@2026!')}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.7rem', padding: '0.3rem 0.5rem', justifyContent: 'flex-start' }}
              >
                <span className="badge badge-low" style={{ fontSize: '0.6rem' }}>Test Account</span>
                <span>Lockout Test</span>
              </button>
            </div>
          </div>
        )}

        {/* Feedback Messages */}
        {error && (
          <div className="cyber-alert cyber-alert-danger" style={{ marginBottom: '1.25rem' }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>{error}</div>
          </div>
        )}

        {successMsg && (
          <div className="cyber-alert cyber-alert-success" style={{ marginBottom: '1.25rem' }}>
            <CheckCircle2 size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>{successMsg}</div>
          </div>
        )}

        {/* STEP 2: TOTP MFA Verification Screen */}
        {mfaPending ? (
          <form onSubmit={handleMfaSubmit}>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{
                display: 'inline-flex',
                padding: '0.75rem',
                borderRadius: '50%',
                background: 'rgba(6, 182, 212, 0.1)',
                color: 'var(--accent-cyan)',
                marginBottom: '0.5rem'
              }}>
                <Key size={28} />
              </div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600 }}>Two-Factor Authentication</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: 1.4 }}>
                Enter the live 6-digit code currently shown in your Google Authenticator or Microsoft Authenticator app for account <strong>{username}</strong>.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ textAlign: 'center', fontSize: '0.825rem' }}>
                Enter 6-Digit Authenticator Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="form-input font-mono"
                style={{
                  fontSize: '1.6rem',
                  letterSpacing: '0.35em',
                  textAlign: 'center',
                  padding: '0.75rem'
                }}
                autoFocus
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || totpCode.length !== 6}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem' }}
            >
              {loading ? 'Verifying Code...' : 'Verify Authenticator Code & Sign In'}
            </button>

            <button
              type="button"
              onClick={() => {
                setMfaPending(false);
                setTotpCode('');
                setError('');
              }}
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: '0.75rem' }}
            >
              Back to Login
            </button>
          </form>
        ) : mode === 'login' ? (
          /* STEP 1: Standard Username/Password Login */
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label className="form-label">Username or Email</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username or email"
                  className="form-input"
                  style={{ paddingLeft: '2.4rem' }}
                  required
                />
                <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="form-input"
                  style={{ paddingLeft: '2.4rem' }}
                  required
                />
                <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
            >
              {loading ? 'Authenticating...' : 'Sign In to CyberShield'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              Don't have an incident reporting account?{' '}
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-cyan)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  textDecoration: 'underline'
                }}
              >
                Register as Reporter
              </button>
            </div>
          </form>
        ) : (
          /* REGISTRATION SCREEN */
          <form onSubmit={handleRegisterSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Reporter Account Registration</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Citizen or enterprise reporter access for incident submission.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
                placeholder="e.g. Officer or Citizen Name"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="name@organization.com"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Desired Username</label>
              <input
                type="text"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                placeholder="alphanumeric, no spaces"
                className="form-input font-mono"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="Strong enterprise password"
                className="form-input"
                required
              />
              {/* Live Password Policy Checklist */}
              <div style={{
                marginTop: '0.5rem',
                fontSize: '0.7rem',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.3rem',
                background: '#0B1322',
                padding: '0.5rem',
                borderRadius: 'var(--radius-sm)'
              }}>
                <span style={{ color: passChecks.length ? '#10B981' : 'var(--text-muted)' }}>
                  {passChecks.length ? '✓' : '○'} Min 10 characters
                </span>
                <span style={{ color: passChecks.upper ? '#10B981' : 'var(--text-muted)' }}>
                  {passChecks.upper ? '✓' : '○'} Uppercase (A-Z)
                </span>
                <span style={{ color: passChecks.lower ? '#10B981' : 'var(--text-muted)' }}>
                  {passChecks.lower ? '✓' : '○'} Lowercase (a-z)
                </span>
                <span style={{ color: passChecks.number ? '#10B981' : 'var(--text-muted)' }}>
                  {passChecks.number ? '✓' : '○'} Number (0-9)
                </span>
                <span style={{ color: passChecks.special ? '#10B981' : 'var(--text-muted)', gridColumn: 'span 2' }}>
                  {passChecks.special ? '✓' : '○'} Special character (!@#$%^&* etc.)
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isRegPasswordValid}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }}
            >
              {loading ? 'Creating Account...' : 'Complete Registration'}
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: '0.75rem' }}
            >
              Back to Login
            </button>
          </form>
        )}

        {/* Security Footer Notice */}
        <div style={{
          marginTop: '1.75rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--border-subtle)',
          textAlign: 'center',
          fontSize: '0.7rem',
          color: 'var(--text-muted)'
        }}>
          Protected by Rate Limiting • Anti-CSRF Guard • SHA-256 Chain of Custody
        </div>
      </div>
    </div>
  );
}
