import React, { useState } from 'react';
import { CyberLawsView } from './CyberLawsView';
import { InvestigationGuidesView } from './InvestigationGuidesView';
import {
  BookOpen,
  Scale,
  CheckSquare,
  Search,
  HelpCircle
} from 'lucide-react';

export function LearningView() {
  const [activeTab, setActiveTab] = useState('laws'); // 'laws' | 'guides'
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Page Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={24} color="var(--accent-cyan)" />
              <span>Learning & Cyber Laws</span>
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Educational references on Indian cyber laws, digital forensics procedures, incident response steps, and a glossary of terms.
            </p>
          </div>

          <button
            onClick={() => setShowHelp(!showHelp)}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.8rem' }}
          >
            {showHelp ? 'Hide Help' : 'What is this section for?'}
          </button>
        </div>

        {/* Expandable Help Box */}
        {showHelp && (
          <div className="cyber-alert cyber-alert-info" style={{ marginTop: '1rem', fontSize: '0.825rem', lineHeight: 1.5 }}>
            <div>
              <strong style={{ color: '#F8FAFC', display: 'block', marginBottom: '0.25rem' }}>
                Coursework and Syllabus Alignment:
              </strong>
              This section is designed to help students prepare for practical exams and viva questions.
              It covers legal sections under the Indian Information Technology Act, 2000 (and 2008 Amendment), the Digital Personal Data Protection Act, 2023, standard forensic acquisition checklists, and incident response lifecycles.
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'laws' ? 'active' : ''}`}
          onClick={() => setActiveTab('laws')}
        >
          <Scale size={16} />
          <span>Indian Cyber Laws & Terminology Glossary</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'guides' ? 'active' : ''}`}
          onClick={() => setActiveTab('guides')}
        >
          <CheckSquare size={16} />
          <span>Investigation Checklists & SHA-256 Calculator</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div>
        {activeTab === 'laws' && (
          <div>
            <CyberLawsView />
          </div>
        )}

        {activeTab === 'guides' && (
          <div>
            <InvestigationGuidesView />
          </div>
        )}
      </div>
    </div>
  );
}
