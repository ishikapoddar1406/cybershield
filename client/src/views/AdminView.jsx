import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import {
  Users,
  Shield,
  Activity,
  Unlock,
  KeyRound,
  Download,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

export function AdminView() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'audits'

  // User Management State
  const [userList, setUserList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);

  // Audit Log State
  const [auditLogs, setAuditLogs] = useState([]);
  const [totalAudits, setTotalAudits] = useState(0);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditSeverity, setAuditSeverity] = useState('');
  const [auditStatus, setAuditStatus] = useState('');
  const [auditsLoading, setAuditsLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchAudits();
  }, []);

  async function fetchUsers() {
    try {
      setUsersLoading(true);
      const data = await apiRequest('/api/users');
      if (data.success) {
        setUserList(data.users);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setUsersLoading(false);
    }
  }

  async function fetchAudits() {
    try {
      setAuditsLoading(true);
      let query = '/api/audit?limit=50&';
      if (auditSeverity) query += `severity=${encodeURIComponent(auditSeverity)}&`;
      if (auditStatus) query += `status=${encodeURIComponent(auditStatus)}&`;
      if (auditSearch) query += `search=${encodeURIComponent(auditSearch)}&`;

      const data = await apiRequest(query);
      if (data.success) {
        setAuditLogs(data.logs);
        setTotalAudits(data.total);
      }
    } catch (err) {
      console.error('Failed to load audits:', err);
    } finally {
      setAuditsLoading(false);
    }
  }

  async function handleRoleChange(userId, newRole) {
    try {
      await apiRequest(`/api/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole })
      });
      fetchUsers();
      alert(`User role successfully changed to '${newRole}'.`);
    } catch (err) {
      alert(`Failed to update role: ${err.message}`);
    }
  }

  async function handleUnlockAccount(userId, username) {
    try {
      const res = await apiRequest(`/api/users/${userId}/unlock`, { method: 'POST' });
      fetchUsers();
      alert(res.message);
    } catch (err) {
      alert(`Unlock failed: ${err.message}`);
    }
  }

  async function handleResetMfa(userId, username) {
    if (!window.confirm(`Reset Multi-Factor Authentication for '${username}'?\n\nThey will be required to configure a new TOTP authenticator device upon next login.`)) {
      return;
    }
    try {
      const res = await apiRequest(`/api/users/${userId}/reset-mfa`, { method: 'POST' });
      fetchUsers();
      alert(res.message);
    } catch (err) {
      alert(`MFA Reset failed: ${err.message}`);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#F8FAFC' }}>
              Platform Administration & Governance
            </h1>
            <span className="badge badge-critical">ADMIN ACCESS ONLY</span>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Manage platform users, modify authorization roles, unlock accounts, and inspect complete security audit trails.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <a
            href="/api/audit/export"
            download="cybershield_audit_trail.json"
            className="btn btn-secondary btn-sm"
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Download size={14} />
            <span>Export Audit Trail (JSON)</span>
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button
          onClick={() => setActiveTab('users')}
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
        >
          <Users size={16} />
          <span>User Management ({userList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audits')}
          className={`tab-btn ${activeTab === 'audits' ? 'active' : ''}`}
        >
          <Activity size={16} />
          <span>Security Audit Trail ({totalAudits})</span>
        </button>
      </div>

      {/* TAB 1: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="cyber-table-container">
          <table className="cyber-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>MFA Status</th>
                <th>Account Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersLoading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Loading user registry...</td>
                </tr>
              ) : (
                userList.map(u => (
                  <tr key={u.id}>
                    <td className="font-mono" style={{ fontWeight: 600, color: '#F8FAFC' }}>
                      {u.username}
                    </td>
                    <td>{u.full_name}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{u.email}</td>
                    <td>
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="form-select"
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', width: '130px' }}
                        disabled={u.id === user?.id} // Don't allow self-demotion
                      >
                        <option value="admin">Administrator</option>
                        <option value="investigator">Investigator</option>
                        <option value="reporter">Reporter</option>
                      </select>
                    </td>
                    <td>
                      <span className={`badge ${u.totp_enabled ? 'badge-success' : 'badge-low'}`}>
                        {u.totp_enabled ? '✓ TOTP ACTIVE' : 'DISABLED'}
                      </span>
                    </td>
                    <td>
                      {u.isLocked ? (
                        <span className="badge badge-critical pulse-indicator">
                          🔒 TEMPORARILY LOCKED
                        </span>
                      ) : (
                        <span className="badge badge-success">ACTIVE</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {u.isLocked && (
                          <button
                            onClick={() => handleUnlockAccount(u.id, u.username)}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', color: '#6EE7B7' }}
                            title="Unlock account"
                          >
                            <Unlock size={12} />
                            <span>Unlock</span>
                          </button>
                        )}
                        {u.totp_enabled && (
                          <button
                            onClick={() => handleResetMfa(u.id, u.username)}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', color: '#FCD34D' }}
                            title="Reset MFA if authenticator is lost"
                          >
                            <KeyRound size={12} />
                            <span>Reset MFA</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: AUDIT LOGS */}
      {activeTab === 'audits' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Filter Bar */}
          <div className="cyber-card" style={{ padding: '0.85rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchAudits()}
                  placeholder="Search description, actor, or IP..."
                  className="form-input"
                  style={{ paddingLeft: '2.2rem', fontSize: '0.8125rem' }}
                />
                <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
              </div>

              <select
                value={auditSeverity}
                onChange={(e) => setAuditSeverity(e.target.value)}
                className="form-select"
                style={{ fontSize: '0.8125rem' }}
              >
                <option value="">All Severities</option>
                <option value="INFO">INFO</option>
                <option value="WARNING">WARNING</option>
                <option value="SECURITY_ALERT">SECURITY_ALERT</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>

              <select
                value={auditStatus}
                onChange={(e) => setAuditStatus(e.target.value)}
                className="form-select"
                style={{ fontSize: '0.8125rem' }}
              >
                <option value="">All Outcomes</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="DENIED">DENIED</option>
                <option value="FAILURE">FAILURE</option>
              </select>

              <button
                onClick={fetchAudits}
                className="btn btn-secondary btn-sm"
              >
                <Filter size={13} />
                <span>Filter Records</span>
              </button>
            </div>
          </div>

          {/* Audit Logs Table */}
          <div className="cyber-table-container">
            <table className="cyber-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Event Type</th>
                  <th>Severity</th>
                  <th>Outcome</th>
                  <th>Actor</th>
                  <th>IP Address</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {auditsLoading ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Loading audit records...</td>
                  </tr>
                ) : auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No audit events found.</td>
                  </tr>
                ) : (
                  auditLogs.map(log => (
                    <tr key={log.id}>
                      <td className="font-mono" style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td>
                        <span className="badge badge-low" style={{ fontSize: '0.65rem' }}>
                          {log.event_type}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${log.severity === 'CRITICAL' ? 'badge-critical' : (log.severity === 'WARNING' || log.severity === 'SECURITY_ALERT' ? 'badge-high' : 'badge-low')}`}>
                          {log.severity}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${log.status === 'SUCCESS' ? 'badge-success' : 'badge-critical'}`}>
                          {log.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.75rem' }}>
                        {log.actor_username ? (
                          <span>{log.actor_username} ({log.actor_role})</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>unauthenticated</span>
                        )}
                      </td>
                      <td className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {log.ip_address}
                      </td>
                      <td style={{ fontSize: '0.775rem', color: 'var(--text-primary)', maxWidth: '300px' }}>
                        {log.description}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
