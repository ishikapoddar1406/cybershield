import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import {
  ShieldAlert,
  ShieldCheck,
  FileText,
  Clock,
  Search,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Activity,
  PlusCircle,
  Database,
  Lock,
  Layers
} from 'lucide-react';

export function DashboardView({ onNavigate, onOpenNewCaseModal }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  async function fetchDashboardStats() {
    try {
      setLoading(true);
      const data = await apiRequest('/api/stats/dashboard');
      if (data.success) {
        setStats(data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <div style={{ display: 'inline-block', marginBottom: '1rem' }} className="pulse-indicator">
          <Database size={36} color="var(--accent-cyan)" />
        </div>
        <div>Querying forensic enclave telemetry...</div>
      </div>
    );
  }

  const metrics = stats?.metrics || {};
  const statusBreakdown = stats?.statusBreakdown || {};
  const severityBreakdown = stats?.severityBreakdown || {};
  const categoryBreakdown = stats?.categoryBreakdown || [];
  const recentActivity = stats?.recentActivity || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Welcome & Security Posture Hero */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(19, 29, 49, 0.95), rgba(15, 23, 42, 0.95))',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '1.5rem 1.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 700, color: '#F8FAFC' }}>
              Cybercrime & Forensics Dashboard
            </h1>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            Welcome back, <strong style={{ color: '#F8FAFC' }}>{user?.fullName}</strong> ({user?.role?.toUpperCase()}). Track reported incidents, verify digital evidence, and review investigation progress.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={onOpenNewCaseModal}
            className="btn btn-primary"
            style={{ fontSize: '0.8125rem' }}
          >
            <PlusCircle size={15} />
            <span>Submit New Incident</span>
          </button>
          <button
            onClick={() => onNavigate('security')}
            className="btn btn-secondary"
            style={{ fontSize: '0.8125rem' }}
          >
            <ShieldCheck size={15} color="var(--accent-cyan)" />
            <span>Security Features</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem'
      }}>
        {/* Total Incidents */}
        <div className="cyber-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Incidents</span>
            <FileText size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#F8FAFC', fontFamily: 'JetBrains Mono, monospace' }}>
            {metrics.totalCases || 0}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Across all reporting channels
          </div>
        </div>

        {/* Pending Review */}
        <div className="cyber-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Review</span>
            <Clock size={18} color="var(--accent-amber)" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#FCD34D', fontFamily: 'JetBrains Mono, monospace' }}>
            {metrics.pendingReviewCount || 0}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Awaiting triage / assignment
          </div>
        </div>

        {/* Active Investigations */}
        <div className="cyber-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Inquiries</span>
            <Search size={18} color="var(--accent-blue)" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#93C5FD', fontFamily: 'JetBrains Mono, monospace' }}>
            {metrics.activeInvestigationsCount || 0}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Under active forensic analysis
          </div>
        </div>

        {/* Total Evidence Vault Items */}
        <div className="cyber-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Evidence Items</span>
            <Database size={18} color="var(--accent-purple)" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 700, color: '#C084FC', fontFamily: 'JetBrains Mono, monospace' }}>
            {metrics.totalEvidence || 0}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Stored in secure volume
          </div>
        </div>

        {/* Cryptographic Integrity Score */}
        <div className="cyber-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Integrity Score</span>
            <CheckCircle size={18} color="var(--accent-emerald)" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 700, color: metrics.integrityPercentage === 100 ? '#6EE7B7' : '#FDA4AF', fontFamily: 'JetBrains Mono, monospace' }}>
            {metrics.integrityPercentage}%
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {metrics.compromisedEvidence > 0
              ? `⚠️ ${metrics.compromisedEvidence} file(s) compromised`
              : 'All digests matching baseline'}
          </div>
        </div>
      </div>

      {/* Analytical Visualizations Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.5rem'
      }}>
        {/* Severity Distribution Chart */}
        <div className="cyber-card">
          <div className="cyber-card-header">
            <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#F8FAFC' }}>
              Threat Severity Breakdown
            </h2>
            <span className="badge badge-low" style={{ fontSize: '0.65rem' }}>Live Database</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {/* Critical */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.3rem' }}>
                <span style={{ color: '#FDA4AF', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F43F5E', display: 'inline-block' }}></span>
                  Critical Threat
                </span>
                <span className="font-mono">{severityBreakdown.critical || 0} ({metrics.totalCases ? Math.round(((severityBreakdown.critical || 0) / metrics.totalCases) * 100) : 0}%)</span>
              </div>
              <div style={{ background: '#0B1322', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                <div style={{
                  background: '#F43F5E',
                  height: '100%',
                  width: `${metrics.totalCases ? ((severityBreakdown.critical || 0) / metrics.totalCases) * 100 : 0}%`,
                  transition: 'width 0.5s ease'
                }} />
              </div>
            </div>

            {/* High */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.3rem' }}>
                <span style={{ color: '#FCD34D', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B', display: 'inline-block' }}></span>
                  High Severity
                </span>
                <span className="font-mono">{severityBreakdown.high || 0} ({metrics.totalCases ? Math.round(((severityBreakdown.high || 0) / metrics.totalCases) * 100) : 0}%)</span>
              </div>
              <div style={{ background: '#0B1322', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                <div style={{
                  background: '#F59E0B',
                  height: '100%',
                  width: `${metrics.totalCases ? ((severityBreakdown.high || 0) / metrics.totalCases) * 100 : 0}%`,
                  transition: 'width 0.5s ease'
                }} />
              </div>
            </div>

            {/* Medium */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.3rem' }}>
                <span style={{ color: '#93C5FD', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3B82F6', display: 'inline-block' }}></span>
                  Medium Severity
                </span>
                <span className="font-mono">{severityBreakdown.medium || 0} ({metrics.totalCases ? Math.round(((severityBreakdown.medium || 0) / metrics.totalCases) * 100) : 0}%)</span>
              </div>
              <div style={{ background: '#0B1322', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                <div style={{
                  background: '#3B82F6',
                  height: '100%',
                  width: `${metrics.totalCases ? ((severityBreakdown.medium || 0) / metrics.totalCases) * 100 : 0}%`,
                  transition: 'width 0.5s ease'
                }} />
              </div>
            </div>

            {/* Low */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.3rem' }}>
                <span style={{ color: '#CBD5E1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94A3B8', display: 'inline-block' }}></span>
                  Low Severity
                </span>
                <span className="font-mono">{severityBreakdown.low || 0} ({metrics.totalCases ? Math.round(((severityBreakdown.low || 0) / metrics.totalCases) * 100) : 0}%)</span>
              </div>
              <div style={{ background: '#0B1322', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
                <div style={{
                  background: '#94A3B8',
                  height: '100%',
                  width: `${metrics.totalCases ? ((severityBreakdown.low || 0) / metrics.totalCases) * 100 : 0}%`,
                  transition: 'width 0.5s ease'
                }} />
              </div>
            </div>
          </div>
        </div>

        {/* Workflow Lifecycle Funnel */}
        <div className="cyber-card">
          <div className="cyber-card-header">
            <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#F8FAFC' }}>
              Incident Lifecycle Pipeline
            </h2>
            <button
              onClick={() => onNavigate('incidents')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.7rem' }}
            >
              <span>View Cases</span>
              <ArrowRight size={12} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { status: 'Submitted', count: statusBreakdown['Submitted'] || 0, color: '#94A3B8' },
              { status: 'Under Review', count: statusBreakdown['Under Review'] || 0, color: '#F59E0B' },
              { status: 'Investigating', count: statusBreakdown['Investigating'] || 0, color: '#06B6D4' },
              { status: 'Resolved', count: statusBreakdown['Resolved'] || 0, color: '#10B981' },
              { status: 'Closed', count: statusBreakdown['Closed'] || 0, color: '#64748B' }
            ].map((stage, idx) => (
              <div key={stage.status} style={{
                background: '#0B1322',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.65rem 0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: `${stage.color}25`,
                    color: stage.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}>
                    {idx + 1}
                  </span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#F8FAFC' }}>{stage.status}</span>
                </div>
                <span className="badge" style={{ background: `${stage.color}20`, color: stage.color, border: `1px solid ${stage.color}40` }}>
                  {stage.count} Cases
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cybercrime Categories Breakdown & Real-time Audit Trail */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.5rem'
      }}>
        {/* Category distribution */}
        <div className="cyber-card">
          <div className="cyber-card-header">
            <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#F8FAFC' }}>
              Incident Categories
            </h2>
            <span className="badge badge-low" style={{ fontSize: '0.65rem' }}>Categorization</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.65rem' }}>
            {categoryBreakdown.length > 0 ? (
              categoryBreakdown.map(cat => (
                <div key={cat.category} style={{
                  background: '#0B1322',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem'
                }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {cat.category.replace(/_/g, ' ')}
                  </span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F8FAFC', fontFamily: 'JetBrains Mono, monospace' }}>
                    {cat.count}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No categorized incidents recorded.</div>
            )}
          </div>
        </div>

        {/* Real-time Security Activity Stream */}
        <div className="cyber-card">
          <div className="cyber-card-header">
            <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#F8FAFC' }}>
              Recent Platform Activity
            </h2>
            <button
              onClick={() => onNavigate('admin')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.7rem' }}
            >
              Full Trail
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {recentActivity.length > 0 ? (
              recentActivity.map(event => (
                <div key={event.id} style={{
                  background: '#0B1322',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.6rem 0.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.2rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className="badge badge-low" style={{ fontSize: '0.65rem' }}>
                      {event.event_type}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {event.description}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No recent activity records.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
