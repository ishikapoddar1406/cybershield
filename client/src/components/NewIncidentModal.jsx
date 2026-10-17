import React, { useState } from 'react';
import { apiRequest } from '../services/api';
import { X, AlertTriangle, ShieldCheck, PlusCircle } from 'lucide-react';

export function NewIncidentModal({ isOpen, onClose, onIncidentCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('phishing');
  const [severity, setSeverity] = useState('medium');
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().slice(0, 10));
  const [reportedIp, setReportedIp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (title.trim().length < 5) {
      setError('Incident title must be at least 5 characters long.');
      return;
    }

    if (description.trim().length < 10) {
      setError('Description must be at least 10 characters long.');
      return;
    }

    setLoading(true);

    try {
      const res = await apiRequest('/api/incidents', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category,
          severity,
          incident_date: incidentDate,
          reported_ip: reportedIp.trim() || null
        })
      });

      setSuccessMsg('Incident report successfully registered in enclave!');
      
      // Reset form
      setTitle('');
      setDescription('');
      setReportedIp('');
      setCategory('phishing');
      setSeverity('medium');

      setTimeout(() => {
        setSuccessMsg('');
        if (onIncidentCreated) {
          onIncidentCreated(res.data);
        }
        onClose();
      }, 700);
    } catch (err) {
      setError(err.message || 'Failed to submit incident report. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-dialog" style={{ maxWidth: '650px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              background: 'rgba(6, 182, 212, 0.15)',
              padding: '0.35rem',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <PlusCircle size={18} color="var(--accent-cyan)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#F8FAFC' }}>
                Register Cybercrime Incident Report
              </h2>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Official Enclave Intake • Tamper-evident Audit Logged
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            type="button"
            title="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {error && (
              <div className="cyber-alert cyber-alert-danger">
                <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '0.8125rem' }}>{error}</div>
              </div>
            )}

            {successMsg && (
              <div className="cyber-alert cyber-alert-success">
                <ShieldCheck size={18} style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '0.8125rem' }}>{successMsg}</div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Incident Title *</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Min 5 characters</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Credential harvesting phishing email targeting campus faculty"
                className="form-input"
                required
                autoFocus
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="form-select"
                  required
                >
                  <option value="phishing">Phishing Campaign</option>
                  <option value="social_media_impersonation">Social Media Impersonation</option>
                  <option value="account_compromise">Account Compromise</option>
                  <option value="payment_fraud">Digital Payment / UPI Fraud</option>
                  <option value="identity_theft">Identity Theft</option>
                  <option value="suspicious_network_activity">Suspicious Network Activity</option>
                  <option value="malware_incident">Malware / Ransomware Incident</option>
                  <option value="other">Other Cybercrime</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Initial Severity *</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="form-select"
                  required
                >
                  <option value="low">Low (Advisory)</option>
                  <option value="medium">Medium (Standard Investigation)</option>
                  <option value="high">High (Active Threat / Loss)</option>
                  <option value="critical">Critical (Critical Asset Breach)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Incident Date *</label>
                <input
                  type="date"
                  value={incidentDate}
                  onChange={(e) => setIncidentDate(e.target.value)}
                  className="form-input font-mono"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Reported IP / Source Host (Optional)</label>
                <input
                  type="text"
                  value={reportedIp}
                  onChange={(e) => setReportedIp(e.target.value)}
                  placeholder="e.g. 198.51.100.25 or unknown"
                  className="form-input font-mono"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Incident Narrative & Observations *</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Min 10 characters</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide a detailed chronological narrative of the cybercrime incident, targeted credentials or systems, affected users, financial loss (if any), and technical observations..."
                className="form-textarea"
                rows={4}
                required
              />
            </div>

            <div style={{
              background: '#0B1322',
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <ShieldCheck size={16} color="var(--accent-cyan)" style={{ flexShrink: 0 }} />
              <span>
                Report will be cryptographically timestamped and assigned a tracking Case ID in the enclave.
              </span>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Submitting to Enclave...' : 'Submit Incident Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
