import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import {
  FileText,
  Search,
  Filter,
  PlusCircle,
  Clock,
  User,
  Shield,
  Eye,
  CheckCircle,
  AlertTriangle,
  X,
  FileCheck,
  Send,
  Download
} from 'lucide-react';

export function IncidentsView({ onOpenNewCaseModal, isNewCaseModalOpen, onCloseNewCaseModal }) {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Selected Case Detail Modal
  const [selectedCase, setSelectedCase] = useState(null);
  const [caseDetails, setCaseDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Note addition in detail modal
  const [noteType, setNoteType] = useState('observation');
  const [noteContent, setNoteContent] = useState('');
  const [noteSubmitting, setNoteSubmitting] = useState(false);

  // Status/Assignee updates
  const [updateStatus, setUpdateStatus] = useState('');
  const [updateAssignee, setUpdateAssignee] = useState('');
  const [availableInvestigators, setAvailableInvestigators] = useState([]);

  // Create Case Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('phishing');
  const [newSeverity, setNewSeverity] = useState('medium');
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));
  const [newIp, setNewIp] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    fetchIncidents();
    if (['admin', 'investigator'].includes(user?.role)) {
      fetchInvestigators();
    }
  }, [statusFilter, severityFilter, categoryFilter]);

  async function fetchIncidents() {
    try {
      setLoading(true);
      let query = '/api/incidents?';
      if (statusFilter) query += `status=${encodeURIComponent(statusFilter)}&`;
      if (severityFilter) query += `severity=${encodeURIComponent(severityFilter)}&`;
      if (categoryFilter) query += `category=${encodeURIComponent(categoryFilter)}&`;
      if (search) query += `search=${encodeURIComponent(search)}&`;

      const data = await apiRequest(query);
      if (data.success) {
        setIncidents(data.incidents);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch incident cases.');
    } finally {
      setLoading(false);
    }
  }

  async function fetchInvestigators() {
    try {
      const data = await apiRequest('/api/users');
      if (data.success) {
        setAvailableInvestigators(data.users.filter(u => ['investigator', 'admin'].includes(u.role)));
      }
    } catch (err) {
      // Ignore
    }
  }

  async function handleOpenCaseDetails(incident) {
    setSelectedCase(incident);
    setDetailsLoading(true);
    setUpdateStatus(incident.status);
    setUpdateAssignee(incident.assigned_investigator_id || '');

    try {
      const data = await apiRequest(`/api/incidents/${incident.id}`);
      if (data.success) {
        setCaseDetails(data);
      }
    } catch (err) {
      alert(`Error loading case details: ${err.message}`);
    } finally {
      setDetailsLoading(false);
    }
  }

  async function handleUpdateCaseWorkflow() {
    if (!selectedCase) return;
    try {
      const payload = {};
      if (updateStatus && updateStatus !== selectedCase.status) {
        payload.status = updateStatus;
      }
      if (updateAssignee !== (selectedCase.assigned_investigator_id || '')) {
        payload.assigned_investigator_id = updateAssignee || null;
      }

      if (Object.keys(payload).length === 0) return;

      await apiRequest(`/api/incidents/${selectedCase.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });

      // Refresh
      fetchIncidents();
      handleOpenCaseDetails(selectedCase);
      alert('Case workflow parameters updated successfully.');
    } catch (err) {
      alert(`Failed to update case: ${err.message}`);
    }
  }

  async function handleAddNote(e) {
    e.preventDefault();
    if (!noteContent.trim() || !selectedCase) return;

    setNoteSubmitting(true);
    try {
      await apiRequest(`/api/incidents/${selectedCase.id}/notes`, {
        method: 'POST',
        body: JSON.stringify({
          note_type: noteType,
          content: noteContent.trim()
        })
      });
      setNoteContent('');
      handleOpenCaseDetails(selectedCase);
    } catch (err) {
      alert(`Failed to add note: ${err.message}`);
    } finally {
      setNoteSubmitting(false);
    }
  }

  async function handleCreateCase(e) {
    e.preventDefault();
    setCreateError('');
    setCreateLoading(true);

    try {
      await apiRequest('/api/incidents', {
        method: 'POST',
        body: JSON.stringify({
          title: newTitle,
          description: newDescription,
          category: newCategory,
          severity: newSeverity,
          incident_date: newDate,
          reported_ip: newIp || null
        })
      });

      // Reset form and close
      setNewTitle('');
      setNewDescription('');
      setNewIp('');
      onCloseNewCaseModal();
      fetchIncidents();
      alert('Incident report successfully registered in enclave.');
    } catch (err) {
      setCreateError(err.message || 'Failed to submit incident report.');
    } finally {
      setCreateLoading(false);
    }
  }

  const severityBadgeClass = {
    critical: 'badge-critical',
    high: 'badge-high',
    medium: 'badge-medium',
    low: 'badge-low'
  };

  const statusBadgeClass = {
    'Submitted': 'badge-low',
    'Under Review': 'badge-high',
    'Investigating': 'badge-cyan',
    'Resolved': 'badge-success',
    'Closed': 'badge-low'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header & Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#F8FAFC' }}>
            Incident Case Repository
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            {user?.role === 'reporter'
              ? 'Displaying your submitted cybercrime incidents and evidence attachments.'
              : 'Enterprise investigation queue with chain of custody logging and forensic notes.'}
          </p>
        </div>

        <button
          onClick={onOpenNewCaseModal}
          className="btn btn-primary"
        >
          <PlusCircle size={16} />
          <span>New Incident Report</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="cyber-card" style={{ padding: '1rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '0.75rem',
          alignItems: 'center'
        }}>
          {/* Search Box */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchIncidents()}
              placeholder="Search case title or ID..."
              className="form-input"
              style={{ paddingLeft: '2.2rem', fontSize: '0.8125rem' }}
            />
            <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-select"
            style={{ fontSize: '0.8125rem' }}
          >
            <option value="">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Under Review">Under Review</option>
            <option value="Investigating">Investigating</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="form-select"
            style={{ fontSize: '0.8125rem' }}
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="form-select"
            style={{ fontSize: '0.8125rem' }}
          >
            <option value="">All Categories</option>
            <option value="phishing">Phishing</option>
            <option value="social_media_impersonation">Social Media Impersonation</option>
            <option value="account_compromise">Account Compromise</option>
            <option value="payment_fraud">Payment Fraud</option>
            <option value="identity_theft">Identity Theft</option>
            <option value="suspicious_network_activity">Network Suspicion</option>
            <option value="malware_incident">Malware Incident</option>
            <option value="other">Other Cybercrime</option>
          </select>

          <button
            onClick={fetchIncidents}
            className="btn btn-secondary btn-sm"
            style={{ height: '36px' }}
          >
            <Filter size={14} />
            <span>Apply Filters</span>
          </button>
        </div>
      </div>

      {/* Incidents Data Table */}
      <div className="cyber-table-container">
        <table className="cyber-table">
          <thead>
            <tr>
              <th>Case ID</th>
              <th>Incident Title</th>
              <th>Category</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Investigator</th>
              <th>Date</th>
              <th>Evidence</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  Loading cases from SQLite enclave...
                </td>
              </tr>
            ) : incidents.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
                  No matching incident cases found.
                </td>
              </tr>
            ) : (
              incidents.map(inc => (
                <tr key={inc.id}>
                  <td className="font-mono" style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>
                    {inc.id}
                  </td>
                  <td style={{ fontWeight: 500, maxWidth: '240px' }}>
                    <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {inc.title}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.75rem', textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
                      {inc.category.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${severityBadgeClass[inc.severity] || 'badge-low'}`}>
                      {inc.severity}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${statusBadgeClass[inc.status] || 'badge-low'}`}>
                      {inc.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8125rem' }}>
                    {inc.investigator_name ? (
                      <span style={{ color: '#F8FAFC' }}>{inc.investigator_name}</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                    {inc.incident_date}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="badge badge-low" style={{ fontSize: '0.7rem' }}>
                      {inc.evidence_count || 0}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => handleOpenCaseDetails(inc)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                    >
                      <Eye size={13} />
                      <span>Inspect</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CASE DETAIL & INVESTIGATION MODAL */}
      {selectedCase && (
        <div className="modal-overlay">
          <div className="modal-dialog" style={{ maxWidth: '850px' }}>
            <div className="modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="font-mono" style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>
                    {selectedCase.id}
                  </span>
                  <span className={`badge ${severityBadgeClass[selectedCase.severity]}`}>
                    {selectedCase.severity}
                  </span>
                  <span className={`badge ${statusBadgeClass[selectedCase.status]}`}>
                    {selectedCase.status}
                  </span>
                </div>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginTop: '0.25rem' }}>
                  {selectedCase.title}
                </h2>
              </div>
              <button
                onClick={() => setSelectedCase(null)}
                className="btn btn-secondary btn-sm"
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {detailsLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  Loading case investigation records...
                </div>
              ) : (
                <>
                  {/* Case Info Panel */}
                  <div style={{
                    background: '#0B1322',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1rem',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '0.75rem',
                    fontSize: '0.8125rem'
                  }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Reporter: </span>
                      <strong style={{ color: '#F8FAFC' }}>{caseDetails?.incident?.reporter_name || 'Anonymous'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Incident Date: </span>
                      <span className="font-mono">{caseDetails?.incident?.incident_date}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Reported IP / Source: </span>
                      <span className="font-mono">{caseDetails?.incident?.reported_ip || 'Not Specified'}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Category: </span>
                      <span style={{ textTransform: 'capitalize' }}>{caseDetails?.incident?.category?.replace(/_/g, ' ')}</span>
                    </div>
                  </div>

                  {/* Incident Narrative */}
                  <div>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                      Incident Description & Summary
                    </h3>
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.25)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.85rem',
                      fontSize: '0.85rem',
                      lineHeight: 1.6,
                      color: 'var(--text-primary)',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {caseDetails?.incident?.description}
                    </div>
                  </div>

                  {/* Workflow Transitions (Admin & Investigator Only) */}
                  {['admin', 'investigator'].includes(user?.role) && (
                    <div style={{
                      background: 'rgba(6, 182, 212, 0.05)',
                      border: '1px solid rgba(6, 182, 212, 0.2)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '1rem'
                    }}>
                      <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '0.75rem' }}>
                        Investigator Workflow & Assignment Controls
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '0.75rem', alignItems: 'flex-end' }}>
                        <div>
                          <label className="form-label">Workflow Status</label>
                          <select
                            value={updateStatus}
                            onChange={(e) => setUpdateStatus(e.target.value)}
                            className="form-select"
                            style={{ fontSize: '0.8125rem' }}
                          >
                            <option value="Submitted">Submitted</option>
                            <option value="Under Review">Under Review</option>
                            <option value="Investigating">Investigating</option>
                            <option value="Resolved">Resolved</option>
                            <option value="Closed">Closed</option>
                          </select>
                        </div>

                        <div>
                          <label className="form-label">Assigned Investigator</label>
                          <select
                            value={updateAssignee}
                            onChange={(e) => setUpdateAssignee(e.target.value)}
                            className="form-select"
                            style={{ fontSize: '0.8125rem' }}
                          >
                            <option value="">Unassigned</option>
                            {availableInvestigators.map(inv => (
                              <option key={inv.id} value={inv.id}>
                                {inv.full_name} ({inv.role})
                              </option>
                            ))}
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={handleUpdateCaseWorkflow}
                          className="btn btn-primary btn-sm"
                          style={{ height: '38px' }}
                        >
                          Update Status
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Associated Evidence Items */}
                  <div>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                      Associated Digital Evidence ({caseDetails?.evidence?.length || 0})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {caseDetails?.evidence?.length > 0 ? (
                        caseDetails.evidence.map(evd => (
                          <div key={evd.id} style={{
                            background: '#0B1322',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '0.65rem 0.85rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '0.5rem'
                          }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <FileCheck size={15} color="var(--accent-cyan)" />
                                <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{evd.original_filename}</span>
                                <span className={`badge ${evd.status === 'Verified' ? 'badge-success' : 'badge-critical'}`} style={{ fontSize: '0.65rem' }}>
                                  {evd.status}
                                </span>
                              </div>
                              <div className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                SHA-256: {evd.sha256_hash.slice(0, 32)}...
                              </div>
                            </div>

                            <a
                              href={`/api/evidence/${evd.id}/download`}
                              className="btn btn-secondary btn-sm"
                              style={{ fontSize: '0.75rem', textDecoration: 'none' }}
                              download
                            >
                              <Download size={13} />
                              <span>Download</span>
                            </a>
                          </div>
                        ))
                      ) : (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                          No evidence files attached to this case.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Investigation Notes Feed */}
                  <div>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                      Investigation Notes & Actions Log ({caseDetails?.notes?.length || 0})
                    </h3>

                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.6rem',
                      maxHeight: '220px',
                      overflowY: 'auto',
                      marginBottom: '1rem'
                    }}>
                      {caseDetails?.notes?.length > 0 ? (
                        caseDetails.notes.map(note => (
                          <div key={note.id} style={{
                            background: '#0B1322',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '0.75rem'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.75rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <strong style={{ color: 'var(--accent-cyan)' }}>{note.author_name}</strong>
                                <span className="badge badge-low" style={{ fontSize: '0.6rem' }}>
                                  {note.note_type?.toUpperCase()}
                                </span>
                              </div>
                              <span style={{ color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                                {new Date(note.created_at).toLocaleString()}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                              {note.content}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                          No formal investigation notes added yet.
                        </div>
                      )}
                    </div>

                    {/* Add Note Input Form */}
                    <form onSubmit={handleAddNote} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <select
                          value={noteType}
                          onChange={(e) => setNoteType(e.target.value)}
                          className="form-select"
                          style={{ width: '160px', fontSize: '0.8125rem' }}
                        >
                          <option value="observation">Observation</option>
                          <option value="lead">Lead</option>
                          <option value="action_taken">Action Taken</option>
                          <option value="hypothesis">Hypothesis</option>
                          <option value="conclusion">Conclusion</option>
                        </select>
                        <input
                          type="text"
                          value={noteContent}
                          onChange={(e) => setNoteContent(e.target.value)}
                          placeholder="Record investigative finding or action taken..."
                          className="form-input"
                          style={{ fontSize: '0.8125rem' }}
                          required
                        />
                        <button
                          type="submit"
                          disabled={noteSubmitting || !noteContent.trim()}
                          className="btn btn-primary btn-sm"
                        >
                          <Send size={14} />
                          <span>Add</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
