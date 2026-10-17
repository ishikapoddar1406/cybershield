import React, { useState } from 'react';
import { apiRequest } from '../services/api';
import {
  Fingerprint,
  Shield,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Cpu,
  Monitor,
  Globe,
  Clock,
  RotateCcw,
  Info,
  Lock,
  Layers
} from 'lucide-react';

export function FingerprintingView() {
  const [hasConsented, setHasConsented] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [fingerprintData, setFingerprintData] = useState(null);
  const [error, setError] = useState('');

  // Generates offline 2D canvas signature for educational inspection
  function generateCanvasHash() {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 50;
      const ctx = canvas.getContext('2d');
      if (!ctx) return 'canvas-unsupported';

      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#06B6D4';
      ctx.fillText('CyberShield-Forensics-2026', 2, 2);
      ctx.fillStyle = '#10B981';
      ctx.fillRect(100, 5, 50, 20);

      const dataUrl = canvas.toDataURL();
      // Simple hash of data URL
      let hash = 0;
      for (let i = 0; i < dataUrl.length; i++) {
        hash = (hash << 5) - hash + dataUrl.charCodeAt(i);
        hash |= 0;
      }
      return `canvas_${Math.abs(hash).toString(16)}`;
    } catch (e) {
      return 'canvas-blocked';
    }
  }

  async function handleStartFingerprinting() {
    setHasConsented(true);
    setAnalyzing(true);
    setError('');

    try {
      // Gather transparent client-reported browser telemetry
      const clientData = {
        userAgent: navigator.userAgent || 'Unknown',
        platform: navigator.platform || 'Unknown',
        language: navigator.language || 'en',
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        colorDepth: window.screen.colorDepth || 24,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        hardwareConcurrency: navigator.hardwareConcurrency || 4,
        canvasHash: generateCanvasHash()
      };

      const res = await apiRequest('/api/forensics/fingerprint/generate', {
        method: 'POST',
        body: JSON.stringify({
          consentGiven: true,
          clientData
        })
      });

      if (res.success) {
        setFingerprintData(res);
      }
    } catch (err) {
      setError(err.message || 'Fingerprint calculation failed.');
    } finally {
      setAnalyzing(false);
    }
  }

  function handleReset() {
    setHasConsented(false);
    setFingerprintData(null);
    setError('');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#F8FAFC' }}>
          Transparent Digital Fingerprinting Lab
        </h1>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          Educational demonstration of browser entropy, client-reported hardware attributes, and device tracking mechanics.
        </p>
      </div>

      {/* Mandatory Consent Gateway */}
      {!hasConsented && (
        <div className="cyber-card" style={{ border: '1px solid rgba(6, 182, 212, 0.4)', background: 'linear-gradient(135deg, rgba(19, 29, 49, 0.95), rgba(11, 19, 34, 0.95))' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{
              background: 'rgba(6, 182, 212, 0.15)',
              padding: '0.75rem',
              borderRadius: '12px',
              color: 'var(--accent-cyan)'
            }}>
              <Lock size={26} />
            </div>

            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '0.4rem' }}>
                Explicit Academic Consent Gateway
              </h2>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>
                This educational lab demonstrates how web servers construct pseudo-unique device identifiers by collecting client-reported browser and hardware characteristics.
                In accordance with ethical academic cybersecurity guidelines and the <strong>Digital Personal Data Protection Act, 2023</strong>, this demonstration will <strong>only execute with your explicit, informed consent</strong>.
                No data is permanently stored or sold.
              </p>

              <button
                onClick={handleStartFingerprinting}
                className="btn btn-primary"
                style={{ padding: '0.65rem 1.35rem' }}
              >
                <Fingerprint size={16} />
                <span>I Understand & Consent: Execute Fingerprint Analysis</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Results View */}
      {hasConsented && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Controls Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge badge-success">CONSENT VERIFIED</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Demonstration running in isolated session</span>
            </div>

            <button
              onClick={handleReset}
              className="btn btn-secondary btn-sm"
              style={{ color: '#FDA4AF' }}
            >
              <RotateCcw size={13} />
              <span>Stop & Erase Demonstration Data</span>
            </button>
          </div>

          {analyzing ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <div className="pulse-indicator" style={{ display: 'inline-block', marginBottom: '1rem' }}>
                <Fingerprint size={36} color="var(--accent-cyan)" />
              </div>
              <div>Extracting client entropy parameters...</div>
            </div>
          ) : fingerprintData ? (
            <>
              {/* Demonstration Hash Card */}
              <div className="cyber-card" style={{ border: '1px solid var(--accent-cyan)', background: 'rgba(6, 182, 212, 0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Computed Demonstration Fingerprint Hash
                  </span>
                  <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>SHA-256</span>
                </div>
                <div className="font-mono" style={{ fontSize: '1.05rem', fontWeight: 700, color: '#F8FAFC', wordBreak: 'break-all' }}>
                  {fingerprintData.demonstrationHash}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                  Constructed by digesting the normalized vector of client-reported entropy fields.
                </div>
              </div>

              {/* Attributes Decomposition Grid */}
              <div className="cyber-card">
                <div className="cyber-card-header">
                  <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#F8FAFC' }}>
                    Client-Reported Entropy Parameters
                  </h2>
                  <span className="badge badge-low" style={{ fontSize: '0.65rem' }}>Active Navigator APIs</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem' }}>
                  <div style={{ background: '#0B1322', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.3rem' }}>
                      <Globe size={14} />
                      <span>User-Agent String</span>
                    </div>
                    <div className="font-mono" style={{ fontSize: '0.75rem', color: '#F8FAFC', wordBreak: 'break-all' }}>
                      {fingerprintData.attributesAnalyzed?.userAgent}
                    </div>
                  </div>

                  <div style={{ background: '#0B1322', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.3rem' }}>
                      <Monitor size={14} />
                      <span>Screen Resolution & Color Depth</span>
                    </div>
                    <div className="font-mono" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#F8FAFC' }}>
                      {fingerprintData.attributesAnalyzed?.screenResolution} ({fingerprintData.attributesAnalyzed?.colorDepth})
                    </div>
                  </div>

                  <div style={{ background: '#0B1322', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.3rem' }}>
                      <Clock size={14} />
                      <span>Timezone & Locale</span>
                    </div>
                    <div className="font-mono" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#F8FAFC' }}>
                      {fingerprintData.attributesAnalyzed?.timezone} ({fingerprintData.attributesAnalyzed?.language})
                    </div>
                  </div>

                  <div style={{ background: '#0B1322', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.3rem' }}>
                      <Cpu size={14} />
                      <span>Hardware Cores & Platform</span>
                    </div>
                    <div className="font-mono" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#F8FAFC' }}>
                      {fingerprintData.attributesAnalyzed?.hardwareConcurrency} • {fingerprintData.attributesAnalyzed?.platform}
                    </div>
                  </div>

                  <div style={{ background: '#0B1322', padding: '0.85rem', borderRadius: 'var(--radius-sm)', gridColumn: '1 / -1' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.3rem' }}>
                      <Layers size={14} />
                      <span>Canvas 2D Rendering Signature</span>
                    </div>
                    <div className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>
                      {fingerprintData.attributesAnalyzed?.canvasHash}
                    </div>
                  </div>
                </div>
              </div>

              {/* Forensic & Privacy Insights */}
              <div className="cyber-card">
                <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#F8FAFC', marginBottom: '0.85rem' }}>
                  Educational Insights: Forensics, Spoofability & Privacy Defenses
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
                  <div style={{ background: '#0B1322', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                    <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '0.3rem' }}>
                      1. What is Browser Entropy?
                    </h3>
                    <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {fingerprintData.educationalInsights?.entropyConcept}
                    </p>
                  </div>

                  <div style={{ background: '#0B1322', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                    <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#FCD34D', marginBottom: '0.3rem' }}>
                      2. Inaccuracy & Spoofability
                    </h3>
                    <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {fingerprintData.educationalInsights?.inaccuraciesAndSpoofability}
                    </p>
                  </div>

                  <div style={{ background: '#0B1322', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                    <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#6EE7B7', marginBottom: '0.3rem' }}>
                      3. Privacy Countermeasures
                    </h3>
                    <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {fingerprintData.educationalInsights?.privacyCountermeasures}
                    </p>
                  </div>

                  <div style={{ background: '#0B1322', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                    <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#C084FC', marginBottom: '0.3rem' }}>
                      4. Legal Consent & DPDP Act 2023
                    </h3>
                    <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {fingerprintData.educationalInsights?.consentPrinciple}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
