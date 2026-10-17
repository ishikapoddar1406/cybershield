import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import {
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Lock,
  QrCode,
  Copy,
  Check,
  AlertTriangle,
  UserCheck,
  RefreshCw,
  Eye,
  EyeOff,
  Server
} from 'lucide-react';

export function AccountSecurityView() {
  const { user, checkSession, csrfToken } = useAuth();

  // MFA Setup State
  const [mfaSetupData, setMfaSetupData] = useState(null);
  const [mfaToken, setMfaToken] = useState('');
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState('');
  const [mfaSuccess, setMfaSuccess] = useState('');
  const [copiedSecret, setCopiedSecret] = useState(false);

  // MFA Disable State
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableLoading, setDisableLoading] = useState(false);
  const [disableError, setDisableError] = useState('');

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  // Password requirements calculation
  const pwRules = {
    length: newPassword.length >= 10,
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword)
  };
  const pwValid = Object.values(pwRules).every(Boolean) && newPassword === confirmPassword;

  // Handle MFA Setup Initiation
  const handleInitiateMfa = async () => {
    setMfaLoading(true);
    setMfaError('');
    setMfaSuccess('');
    try {
      const res = await apiRequest('/api/auth/mfa/setup', { method: 'POST' });
      setMfaSetupData(res);
    } catch (err) {
      setMfaError(err.message || 'Failed to initiate MFA setup.');
    } finally {
      setMfaLoading(false);
    }
  };

  // Handle MFA Verification
  const handleConfirmMfa = async (e) => {
    e.preventDefault();
    if (!mfaToken || mfaToken.length !== 6) {
      setMfaError('Please enter a 6-digit verification code.');
      return;
    }
    setMfaLoading(true);
    setMfaError('');
    try {
      await apiRequest('/api/auth/verify-mfa', {
        method: 'POST',
        body: JSON.stringify({ token: mfaToken })
      });
      setMfaSuccess('Two-factor authentication successfully enabled!');
      setMfaSetupData(null);
      setMfaToken('');
      await checkSession();
    } catch (err) {
      setMfaError(err.message || 'Verification failed. Code may be invalid or expired.');
    } finally {
      setMfaLoading(false);
    }
  };

  // Handle MFA Disable
  const handleDisableMfa = async (e) => {
    e.preventDefault();
    setDisableLoading(true);
    setDisableError('');
    try {
      await apiRequest('/api/auth/mfa/disable', {
        method: 'POST',
        body: JSON.stringify({ password: disablePassword })
      });
      setShowDisableModal(false);
      setDisablePassword('');
      setMfaSuccess('Two-factor authentication has been disabled.');
      await checkSession();
    } catch (err) {
      setDisableError(err.message || 'Failed to disable MFA. Password may be incorrect.');
    } finally {
      setDisableLoading(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!pwValid) {
      setPwError('Please meet all password requirements and make sure passwords match.');
      return;
    }
    setPwLoading(true);
    setPwError('');
    setPwSuccess('');
    try {
      await apiRequest('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword
        })
      });
      setPwSuccess('Password updated successfully! Next login will require your new credentials.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwError(err.message || 'Failed to update password.');
    } finally {
      setPwLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <KeyRound className="h-7 w-7 text-cyan-400" />
          Account & Authentication Security
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage your credentials, multi-factor authentication (TOTP RFC 6238), and review active session parameters.
        </p>
      </div>

      {/* Account Profile Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-300 font-bold text-xl">
              {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-white">{user?.fullName || user?.username}</h2>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${
                  user?.role === 'admin'
                    ? 'bg-purple-950/60 text-purple-300 border-purple-800'
                    : user?.role === 'investigator'
                    ? 'bg-blue-950/60 text-blue-300 border-blue-800'
                    : 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                }`}>
                  {user?.role?.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-slate-400">@{user?.username} • {user?.email}</p>
              {user?.badgeNumber && (
                <p className="text-xs text-slate-400 mt-0.5">Badge / ID: <span className="font-mono text-cyan-300">{user.badgeNumber}</span></p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-md border font-medium ${
              user?.totpEnabled
                ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
                : 'bg-amber-950/70 border-amber-800 text-amber-300'
            }`}>
              {user?.totpEnabled ? (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  MFA Protected
                </>
              ) : (
                <>
                  <ShieldAlert className="h-4 w-4" />
                  MFA Not Configured
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module 1: TOTP Multifactor Authentication */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-cyan-400" />
                <h2 className="text-base font-semibold text-white">Two-Factor Authentication (TOTP)</h2>
              </div>
              <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">RFC 6238</span>
            </div>

            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              CyberShield enforces standard Time-Based One-Time Passwords (30-second window, HMAC-SHA1). 
              Compatible with Google Authenticator, Microsoft Authenticator, and FreeOTP.
            </p>

            {mfaSuccess && (
              <div className="mb-4 p-3 bg-emerald-950/50 border border-emerald-800 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
                <Check className="h-4 w-4 flex-shrink-0" />
                <span>{mfaSuccess}</span>
              </div>
            )}

            {mfaError && (
              <div className="mb-4 p-3 bg-red-950/50 border border-red-800 rounded-lg text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>{mfaError}</span>
              </div>
            )}

            {/* If MFA is already enabled */}
            {user?.totpEnabled && !mfaSetupData && (
              <div className="p-4 bg-emerald-950/20 border border-emerald-900/60 rounded-lg mb-4 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                  <ShieldCheck className="h-5 w-5" />
                  <span>Two-factor authentication is active on this account.</span>
                </div>
                <p className="text-xs text-slate-400">
                  You are required to submit a 6-digit verification code from your authenticator application on each login session.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setShowDisableModal(true)}
                    className="text-xs text-red-400 hover:text-red-300 hover:underline font-medium transition-colors"
                  >
                    Disable Two-Factor Authentication
                  </button>
                </div>
              </div>
            )}

            {/* If MFA is NOT enabled and NOT currently in setup */}
            {!user?.totpEnabled && !mfaSetupData && (
              <div className="space-y-4">
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-400 space-y-2">
                  <p className="font-semibold text-slate-300">Why enable MFA?</p>
                  <ul className="list-disc list-inside space-y-1 text-slate-400">
                    <li>Blocks unauthorized logins even if your password is compromised.</li>
                    <li>Guarantees cryptographic proof of device possession.</li>
                    <li>Required for sensitive forensic evidence handling.</li>
                  </ul>
                </div>

                <button
                  onClick={handleInitiateMfa}
                  disabled={mfaLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-cyan-950/40 disabled:opacity-50"
                >
                  {mfaLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Generating Key & QR Code...
                    </>
                  ) : (
                    <>
                      <QrCode className="h-4 w-4" />
                      Configure Authenticator App
                    </>
                  )}
                </button>
              </div>
            )}

            {/* MFA Setup Step: QR Code & Verification */}
            {mfaSetupData && (
              <div className="space-y-4 animate-fadeIn">
                <div className="p-4 bg-slate-950 border border-cyan-900/50 rounded-lg space-y-3">
                  <p className="text-xs font-semibold text-cyan-300">Step 1: Scan QR Code with Authenticator</p>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-900 p-3 rounded border border-slate-800">
                    {mfaSetupData.qrCodeDataUrl ? (
                      <img
                        src={mfaSetupData.qrCodeDataUrl}
                        alt="TOTP Enrollment QR Code"
                        className="w-36 h-36 bg-white p-1 rounded shadow"
                      />
                    ) : (
                      <div className="w-36 h-36 bg-slate-800 flex items-center justify-center text-xs text-slate-400">
                        Generating...
                      </div>
                    )}
                    <div className="space-y-2 text-xs text-slate-400 overflow-hidden">
                      <p>If you cannot scan the code, enter this key manually:</p>
                      <div className="flex items-center gap-2 bg-slate-950 p-2 rounded border border-slate-800 font-mono text-cyan-400 break-all select-all">
                        <span>{mfaSetupData.secret}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(mfaSetupData.secret)}
                          className="text-slate-400 hover:text-white p-1"
                          title="Copy secret key"
                        >
                          {copiedSecret ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400">Account: <span className="text-slate-300">{user?.username}</span> | Issuer: <span className="text-slate-300">CyberShield</span></p>
                    </div>
                  </div>

                  <form onSubmit={handleConfirmMfa} className="space-y-3 pt-2">
                    <p className="text-xs font-semibold text-cyan-300">Step 2: Enter 6-digit Code to Confirm</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        pattern="[0-9]*"
                        value={mfaToken}
                        onChange={(e) => setMfaToken(e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-center font-mono tracking-widest text-lg focus:outline-none focus:border-cyan-500"
                        required
                        autoFocus
                      />
                      <button
                        type="submit"
                        disabled={mfaLoading || mfaToken.length !== 6}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                      >
                        {mfaLoading ? 'Verifying...' : 'Activate MFA'}
                      </button>
                    </div>
                  </form>
                </div>

                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => { setMfaSetupData(null); setMfaToken(''); }}
                    className="text-xs text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    Cancel Setup
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Educational Note */}
          <div className="mt-4 pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
            <UserCheck className="h-3.5 w-3.5 text-cyan-400 flex-shrink-0" />
            <span>MFA keys are encrypted and verified server-side without external cloud telemetry.</span>
          </div>
        </div>

        {/* Module 2: Password Change & Policy Enforcement */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-cyan-400" />
                <h2 className="text-base font-semibold text-white">Change Password</h2>
              </div>
              <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">Bcrypt 12 Rounds</span>
            </div>

            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Passwords are salted and hashed using bcrypt (cost factor 12). 
              Changes immediately invalidate existing sessions and require re-authentication.
            </p>

            {pwSuccess && (
              <div className="mb-4 p-3 bg-emerald-950/50 border border-emerald-800 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
                <Check className="h-4 w-4 flex-shrink-0" />
                <span>{pwSuccess}</span>
              </div>
            )}

            {pwError && (
              <div className="mb-4 p-3 bg-red-950/50 border border-red-800 rounded-lg text-red-300 text-xs flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span>{pwError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white pr-9 focus:outline-none focus:border-cyan-500"
                    placeholder="Enter current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white pr-9 focus:outline-none focus:border-cyan-500"
                    placeholder="Enter strong new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Real-time policy requirements */}
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 space-y-1">
                <p className="text-[11px] font-semibold text-slate-400 mb-1">Password Policy Requirements:</p>
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  <span className={pwRules.length ? 'text-emerald-400 flex items-center gap-1' : 'text-slate-400 flex items-center gap-1'}>
                    {pwRules.length ? '✓' : '○'} ≥ 10 characters
                  </span>
                  <span className={pwRules.upper ? 'text-emerald-400 flex items-center gap-1' : 'text-slate-400 flex items-center gap-1'}>
                    {pwRules.upper ? '✓' : '○'} Uppercase (A-Z)
                  </span>
                  <span className={pwRules.lower ? 'text-emerald-400 flex items-center gap-1' : 'text-slate-400 flex items-center gap-1'}>
                    {pwRules.lower ? '✓' : '○'} Lowercase (a-z)
                  </span>
                  <span className={pwRules.number ? 'text-emerald-400 flex items-center gap-1' : 'text-slate-400 flex items-center gap-1'}>
                    {pwRules.number ? '✓' : '○'} Number (0-9)
                  </span>
                  <span className={pwRules.special ? 'text-emerald-400 flex items-center gap-1' : 'text-slate-400 flex items-center gap-1'}>
                    {pwRules.special ? '✓' : '○'} Symbol (!@#$%...)
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                  placeholder="Re-type new password"
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-[11px] text-red-400 mt-1">Passwords do not match.</p>
                )}
              </div>

              <button
                type="submit"
                disabled={pwLoading || !pwValid}
                className="w-full px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50"
              >
                {pwLoading ? 'Hashing & Updating...' : 'Update Password'}
              </button>
            </form>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-cyan-400 flex-shrink-0" />
            <span>5 consecutive failed password attempts triggers automatic 15-minute lockout.</span>
          </div>
        </div>
      </div>

      {/* Module 3: Session & Security Parameters Diagnostic Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <Server className="h-5 w-5 text-cyan-400" />
          <h2 className="text-base font-semibold text-white">Active Session & Security Diagnostics</h2>
        </div>

        <p className="text-xs text-slate-400 mb-4">
          Overview of active security controls governing your current browser connection and session state:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
            <span className="text-[11px] text-slate-400 block mb-1">Session Storage</span>
            <span className="text-xs font-mono text-cyan-300 font-semibold">Server-Side SQLite</span>
            <span className="text-[11px] text-slate-400 block mt-1">HttpOnly • SameSite=Lax</span>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
            <span className="text-[11px] text-slate-400 block mb-1">CSRF Defense</span>
            <span className="text-xs font-mono text-emerald-300 font-semibold">Active (X-CSRF-Token)</span>
            <span className="text-[11px] text-slate-400 block mt-1 font-mono truncate" title={csrfToken}>
              {csrfToken ? `${csrfToken.slice(0, 14)}...` : 'Synchronized'}
            </span>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
            <span className="text-[11px] text-slate-400 block mb-1">Password Hash Alg</span>
            <span className="text-xs font-mono text-cyan-300 font-semibold">Bcrypt (Salt Cost 12)</span>
            <span className="text-[11px] text-slate-400 block mt-1">~250ms work factor</span>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
            <span className="text-[11px] text-slate-400 block mb-1">Lockout Policy</span>
            <span className="text-xs font-mono text-amber-300 font-semibold">5 Attempts / 15m</span>
            <span className="text-[11px] text-slate-400 block mt-1">Rate limited IP + user</span>
          </div>
        </div>
      </div>

      {/* Disable MFA Modal */}
      {showDisableModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl animate-scaleIn">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <ShieldAlert className="h-6 w-6" />
              <h3 className="text-lg font-bold text-white">Disable Two-Factor Authentication</h3>
            </div>

            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Disabling MFA lowers your account security. To authorize this change, please enter your current password.
            </p>

            {disableError && (
              <div className="mb-4 p-2.5 bg-red-950/60 border border-red-800 rounded text-red-300 text-xs">
                {disableError}
              </div>
            )}

            <form onSubmit={handleDisableMfa} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Current Password</label>
                <input
                  type="password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  required
                  autoFocus
                  placeholder="Enter current password to verify"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowDisableModal(false); setDisablePassword(''); setDisableError(''); }}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={disableLoading || !disablePassword}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                >
                  {disableLoading ? 'Verifying...' : 'Disable 2FA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
