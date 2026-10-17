import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, User, LogOut, CheckCircle2, Menu } from 'lucide-react';

export function Navbar({ onToggleMobileMenu }) {
  const { user, logout, csrfToken } = useAuth();

  const roleBadgeClass = {
    admin: 'badge-critical',
    investigator: 'badge-cyan',
    reporter: 'badge-medium'
  }[user?.role] || 'badge-low';

  return (
    <header style={{
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '0.75rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={onToggleMobileMenu}
          className="btn btn-secondary btn-sm mobile-menu-btn"
          style={{ display: 'flex', alignItems: 'center' }}
          title="Toggle Navigation Menu"
        >
          <Menu size={18} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, #06B6D4, #3B82F6)',
            width: '34px',
            height: '34px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(6, 182, 212, 0.4)'
          }}>
            <Shield size={20} color="#04101A" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '0.02em', color: '#F8FAFC' }}>
                CYBERSHIELD
              </span>
              <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
                ACTIVE
              </span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Cybercrime Investigation &amp; Digital Forensics
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* CSRF Status Indicator */}
        <div style={{
          display: 'none',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: '0.75rem',
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          padding: '0.3rem 0.65rem',
          borderRadius: 'var(--radius-sm)',
          color: '#6EE7B7'
        }} className="md-flex">
          <CheckCircle2 size={13} />
          <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>CSRF ACTIVE</span>
        </div>

        {/* User Profile Pill */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {user.fullName || user.username}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                <span className={`badge ${roleBadgeClass}`} style={{ fontSize: '0.65rem', padding: '0.05rem 0.4rem' }}>
                  {user.role}
                </span>
                {user.badgeNumber && (
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                    #{user.badgeNumber}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={logout}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#FDA4AF' }}
              title="Sign out of current secure session"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
