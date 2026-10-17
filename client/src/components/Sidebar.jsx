import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  ShieldCheck,
  Search,
  Lock,
  BookOpen,
  Users,
  ChevronRight
} from 'lucide-react';

export function Sidebar({ activeTab, setActiveTab, isOpen, onClose }) {
  const { user } = useAuth();

  // Simplified 6 core sections + admin options
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'investigator', 'reporter'] },
    { id: 'incidents', label: 'Incident Reports', icon: FileText, roles: ['admin', 'investigator', 'reporter'] },
    { id: 'evidence', label: 'Evidence & Hash Check', icon: ShieldCheck, roles: ['admin', 'investigator', 'reporter'] },
    { id: 'forensics', label: 'Forensics Tools', icon: Search, roles: ['admin', 'investigator', 'reporter'] },
    { id: 'security', label: 'Security Features', icon: Lock, roles: ['admin', 'investigator', 'reporter'] },
    { id: 'learning', label: 'Learning & Cyber Laws', icon: BookOpen, roles: ['admin', 'investigator', 'reporter'] },
    // Admin management only visible to Administrators
    { id: 'admin', label: 'User Management & Logs', icon: Users, roles: ['admin'] }
  ];

  const visibleItems = navItems.filter(item => item.roles.includes(user?.role));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(3px)',
            zIndex: 90
          }}
          className="mobile-backdrop"
        />
      )}

      <aside style={{
        width: '260px',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 61px)',
        position: 'sticky',
        top: '61px',
        zIndex: 95,
        transition: 'transform 0.25s ease',
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
      }} className="sidebar-container">
        <div style={{ padding: '1rem', flex: 1, overflowY: 'auto' }}>
          <div style={{
            fontSize: '0.6875rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--text-muted)',
            marginBottom: '0.75rem',
            paddingLeft: '0.5rem'
          }}>
            Main Navigation
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            {visibleItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    onClose();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#06B6D4' : 'var(--text-secondary)',
                    background: isActive ? 'rgba(6, 182, 212, 0.1)' : 'transparent',
                    border: isActive ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                      e.currentTarget.style.color = '#F8FAFC';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight size={14} color="#06B6D4" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Clean, Simple Student Footer */}
        <div style={{
          padding: '0.85rem 1rem',
          borderTop: '1px solid var(--border-subtle)',
          background: '#0B1322',
          margin: '0.75rem',
          borderRadius: 'var(--radius-sm)'
        }}>
          <div style={{ fontSize: '0.75rem', color: '#6EE7B7', display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 600 }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
            <span>Platform Active &amp; Protected</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Cybersecurity Academic Capstone
          </div>
        </div>
      </aside>
    </>
  );
}
