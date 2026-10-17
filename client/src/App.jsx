import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Shield, Lock } from 'lucide-react';

// Simplified Views
import { LoginView } from './views/LoginView';
import { DashboardView } from './views/DashboardView';
import { IncidentsView } from './views/IncidentsView';
import { EvidenceView } from './views/EvidenceView';
import { ForensicsToolsView } from './views/ForensicsToolsView';
import { SecurityFeaturesView } from './views/SecurityFeaturesView';
import { LearningView } from './views/LearningView';
import { AdminView } from './views/AdminView';

// Modals
import { NewIncidentModal } from './components/NewIncidentModal';

export default function App() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleIncidentCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  // If session is still verifying
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem'
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, #06B6D4, #3B82F6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 35px rgba(6, 182, 212, 0.4)',
          animation: 'pulseGlow 2s infinite ease-in-out'
        }}>
          <Shield size={32} color="#04101A" strokeWidth={2.5} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '0.05em', color: '#F8FAFC' }}>
            CYBERSHIELD
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Checking secure session...
          </div>
        </div>
      </div>
    );
  }

  // If user is not authenticated, render Login & MFA View
  if (!user) {
    return <LoginView />;
  }

  // Map any legacy or sub-tabs to the simplified 6 core sections
  let resolvedTab = activeTab;
  if (['security-lab', 'account-security'].includes(activeTab)) {
    resolvedTab = 'security';
  } else if (['network-lab', 'email-lab', 'fingerprinting'].includes(activeTab)) {
    resolvedTab = 'forensics';
  } else if (['cyber-laws', 'investigation-hub'].includes(activeTab)) {
    resolvedTab = 'learning';
  }

  // Admin access protection
  if (resolvedTab === 'admin' && user.role !== 'admin') {
    resolvedTab = 'dashboard';
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      {/* Top Application Navbar */}
      <Navbar onToggleMobileMenu={() => setMobileMenuOpen(prev => !prev)} />

      {/* Main App Workspace */}
      <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 61px)' }}>
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={resolvedTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            setMobileMenuOpen(false);
          }}
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />

        {/* Dynamic Viewport */}
        <main style={{
          flex: 1,
          padding: '1.75rem 2rem',
          overflowY: 'auto',
          maxWidth: '1600px',
          margin: '0 auto',
          width: '100%'
        }}>
          {resolvedTab === 'dashboard' && (
            <DashboardView
              key={`dashboard-${refreshKey}`}
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenNewCaseModal={() => setIsNewCaseModalOpen(true)}
            />
          )}

          {resolvedTab === 'incidents' && (
            <IncidentsView
              key={`incidents-${refreshKey}`}
              onOpenNewCaseModal={() => setIsNewCaseModalOpen(true)}
            />
          )}

          {resolvedTab === 'evidence' && <EvidenceView />}

          {resolvedTab === 'forensics' && <ForensicsToolsView />}

          {resolvedTab === 'security' && <SecurityFeaturesView />}

          {resolvedTab === 'learning' && <LearningView />}

          {resolvedTab === 'admin' && user.role === 'admin' && <AdminView />}

          {/* Global New Incident Intake Modal */}
          <NewIncidentModal
            isOpen={isNewCaseModalOpen}
            onClose={() => setIsNewCaseModalOpen(false)}
            onIncidentCreated={handleIncidentCreated}
          />

          {/* Academic Project Platform Footer */}
          <footer style={{
            marginTop: '3.5rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            fontSize: '0.75rem',
            color: 'var(--text-muted)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock size={13} color="#06B6D4" />
              <span>CyberShield v1.0 • Third-Year Engineering Cybersecurity &amp; Forensics Project</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <span>Role: <strong style={{ color: 'var(--text-secondary)' }}>{user.role.toUpperCase()}</strong></span>
              <span>SHA-256 Hash Verification: <strong style={{ color: '#10B981' }}>Active</strong></span>
              <span>Indian IT Act &amp; DPDP Act Aligned</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
