import React, { useState } from 'react';
import { NetworkForensicsView } from './NetworkForensicsView';
import { EmailForensicsView } from './EmailForensicsView';
import { FingerprintingView } from './FingerprintingView';
import { WebsitePhishingCheckView } from './WebsitePhishingCheckView';
import {
  Activity,
  Mail,
  Fingerprint,
  Globe,
  Search,
  HelpCircle
} from 'lucide-react';

export function ForensicsToolsView() {
  const [activeTab, setActiveTab] = useState('network'); // 'network' | 'email' | 'url-check' | 'fingerprinting'
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Page Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Search size={24} color="var(--accent-cyan)" />
              <span>Digital Forensics Tools</span>
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Interactive tools to analyze server logs, inspect email headers, verify website reputation, and understand device fingerprinting.
            </p>
          </div>

          <button
            onClick={() => setShowHelp(!showHelp)}
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.8rem' }}
          >
            {showHelp ? 'Hide Help' : 'What do these tools do?'}
          </button>
        </div>

        {/* Expandable Help Box */}
        {showHelp && (
          <div className="cyber-alert cyber-alert-info" style={{ marginTop: '1rem', fontSize: '0.825rem', lineHeight: 1.5 }}>
            <div>
              <strong style={{ color: '#F8FAFC', display: 'block', marginBottom: '0.25rem' }}>
                Guide to the Forensics Tools:
              </strong>
              • <strong>Network Log Analysis:</strong> Examines recorded server logs line-by-line to find clues of suspicious activity like repeated password guessing or port scans.<br />
              • <strong>Email Header Analysis:</strong> Reads raw email routing information to check where an email really came from and detect fake sender addresses.<br />
              • <strong>Real Website Phishing Check:</strong> Queries real threat intelligence databases (Google Safe Browsing & VirusTotal) to check if a website URL is flagged as unsafe.<br />
              • <strong>Device Fingerprinting:</strong> Demonstrates what basic configuration details your browser shares with web servers (requires explicit user consent).
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'network' ? 'active' : ''}`}
          onClick={() => setActiveTab('network')}
        >
          <Activity size={16} />
          <span>Network Log Analysis</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'email' ? 'active' : ''}`}
          onClick={() => setActiveTab('email')}
        >
          <Mail size={16} />
          <span>Email Header Analysis</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'url-check' ? 'active' : ''}`}
          onClick={() => setActiveTab('url-check')}
        >
          <Globe size={16} />
          <span>Real Website Phishing Check</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'fingerprinting' ? 'active' : ''}`}
          onClick={() => setActiveTab('fingerprinting')}
        >
          <Fingerprint size={16} />
          <span>Device Fingerprinting</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div>
        {activeTab === 'network' && (
          <div>
            <div style={{ background: '#0B1322', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <strong>How it works:</strong> Choose one of the sample network logs below or paste your own log lines. Click <strong>Run Analysis</strong> to search for suspicious patterns such as multiple failed logins (brute force) or scanning across multiple server ports.
            </div>
            <NetworkForensicsView />
          </div>
        )}

        {activeTab === 'email' && (
          <div>
            <div style={{ background: '#0B1322', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <strong>How it works:</strong> Load a sample email header or paste your own raw headers. Click <strong>Inspect Email Headers</strong> to trace the path the email took across mail servers and check if the display name matches the real sender address.
            </div>
            <EmailForensicsView />
          </div>
        )}

        {activeTab === 'url-check' && (
          <div>
            <div style={{ background: '#0B1322', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <strong>How it works:</strong> Enter any website address (URL) and grant consent to query external threat intelligence databases (Google Safe Browsing & VirusTotal). You can optionally save verified reputation reports directly to an investigation case.
            </div>
            <WebsitePhishingCheckView />
          </div>
        )}

        {activeTab === 'fingerprinting' && (
          <div>
            <div style={{ background: '#0B1322', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <strong>Educational Demonstration:</strong> Web servers can identify returning visitors by combining reported browser details (screen size, language, timezone). This tool only inspects your browser information after you click the consent button.
            </div>
            <FingerprintingView />
          </div>
        )}
      </div>
    </div>
  );
}

