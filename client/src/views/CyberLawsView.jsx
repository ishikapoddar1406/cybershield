import React, { useState } from 'react';
import {
  BookOpen,
  Scale,
  ShieldAlert,
  Shield,
  FileText,
  Search,
  ExternalLink,
  Info,
  CheckCircle2,
  Lock,
  Wifi,
  Smartphone,
  HardDrive
} from 'lucide-react';

export function CyberLawsView() {
  const [activeTab, setActiveTab] = useState('it-act'); // 'it-act' | 'dpdp' | 'practices' | 'glossary'
  const [glossarySearch, setGlossarySearch] = useState('');

  const itActSections = [
    { sec: 'Section 43', title: 'Penalty and Compensation for Damage to Computer, Computer System, etc.', penalty: 'Civil compensation up to ₹1 Crore for damages', desc: 'Penalizes unauthorized downloading, copying, virus injection, damage, denial of access, or data disruption without owner permission.' },
    { sec: 'Section 65', title: 'Tampering with Computer Source Documents', penalty: 'Imprisonment up to 3 years and/or fine up to ₹2 Lakh', desc: 'Applies when any person knowingly or intentionally conceals, destroys, or alters computer source code required to be maintained by law.' },
    { sec: 'Section 66', title: 'Computer Related Offences (Hacking & Unauthorized Access)', penalty: 'Imprisonment up to 3 years and/or fine up to ₹5 Lakh', desc: 'Criminalizes any act referred to in Section 43 done dishonestly or fraudulently, covering traditional computer intrusions and system disruptions.' },
    { sec: 'Section 66B', title: 'Punishment for Dishonestly Receiving Stolen Computer Resource', penalty: 'Imprisonment up to 3 years and/or fine up to ₹1 Lakh', desc: 'Penalizes retaining or receiving stolen digital devices, laptops, databases, or stolen computer data knowing it to be stolen.' },
    { sec: 'Section 66C', title: 'Punishment for Identity Theft', penalty: 'Imprisonment up to 3 years and/or fine up to ₹1 Lakh', desc: 'Criminalizes fraudulent or dishonest use of electronic signature, password, or any other unique identification feature of another person.' },
    { sec: 'Section 66D', title: 'Cheating by Personation by using Computer Resource', penalty: 'Imprisonment up to 3 years and/or fine up to ₹1 Lakh', desc: 'Direct statutory provision addressing email phishing, social engineering, fraudulent CEO wire scams, and deceptive website impersonation.' },
    { sec: 'Section 66E', title: 'Punishment for Violation of Privacy', penalty: 'Imprisonment up to 3 years and/or fine up to ₹2 Lakh', desc: 'Prohibits capturing, publishing, or transmitting images of private body areas of any person without consent.' },
    { sec: 'Section 66F', title: 'Punishment for Cyber Terrorism', penalty: 'Life Imprisonment', desc: 'Severe penalty for acts committed with intent to threaten unity, integrity, sovereignty, or security of India, or to deny access to critical information infrastructure.' },
    { sec: 'Section 72', title: 'Penalty for Breach of Confidentiality and Privacy', penalty: 'Imprisonment up to 2 years and/or fine up to ₹1 Lakh', desc: 'Penalizes any person who has secured access to electronic records under statutory powers and discloses them without consent.' }
  ];

  const glossaryTerms = [
    { term: 'Chain of Custody', category: 'Evidence', def: 'A chronological, tamper-evident log documenting the collection, custody, transfer, analysis, and disposition of digital evidence to preserve judicial admissibility.' },
    { term: 'Cryptographic Hash (SHA-256)', category: 'Integrity', def: 'A mathematical algorithm producing a unique 256-bit fixed-length output from arbitrary input. A 1-bit alteration completely changes the output (avalanche effect).' },
    { term: 'Bitstream Raw Image', category: 'Acquisition', def: 'A sector-by-sector, exact physical copy of a storage medium, capturing files, metadata, partition tables, deleted space, and slack space.' },
    { term: 'Hardware Write-Blocker', category: 'Preservation', def: 'A physical device connected between evidence drive and forensic workstation that blocks software write commands while allowing read-only access.' },
    { term: 'Order of Volatility', category: 'Preservation', def: 'The sequence in which evidence degrades or is lost upon reboot: CPU cache/registers > RAM / network state > temporary file systems > hard drive > optical backups.' },
    { term: 'Live Memory Forensics', category: 'Analysis', def: 'Acquisition and triage of volatile RAM to recover decrypted keys, active network sockets, injected DLLs, and rootkit modules using tools like Volatility.' },
    { term: 'Slack Space', category: 'Storage', def: 'The unused space between the end of a file and the end of the last assigned cluster on a storage drive, frequently used to conceal or recover deleted data.' },
    { term: 'Unallocated Space', category: 'Storage', def: 'Drive sectors not currently indexed by the filesystem file allocation table, which frequently retain data from previously deleted files.' },
    { term: 'Timestomping', category: 'Anti-Forensics', def: 'The adversarial manipulation of filesystem timestamps (Created, Modified, Accessed, MFT Record Modified) to hide attack timelines.' },
    { term: 'File Carving', category: 'Recovery', def: 'The process of reassembling deleted files directly from raw unallocated disk sectors based on file header/footer magic byte signatures without filesystem tables.' },
    { term: 'IOC (Indicator of Compromise)', category: 'Threat Intel', def: 'Forensic artifacts observed on a network or in an operating system that indicate an unauthorized intrusion (e.g. hash, malicious IP, mutex, registry key).' },
    { term: 'DKIM (DomainKeys Identified Mail)', category: 'Email', def: 'An email authentication standard using public key cryptography to digitally sign email headers and body, verifying sender authenticity and transit integrity.' },
    { term: 'SPF (Sender Policy Framework)', category: 'Email', def: 'A DNS TXT record listing authorized IP addresses permitted to send emails on behalf of a specific domain.' },
    { term: 'DMARC', category: 'Email', def: 'Domain-based Message Authentication, Reporting, and Conformance. Leverages SPF and DKIM to determine handling policy for unaligned emails (none, quarantine, reject).' },
    { term: 'ARP Poisoning (Spoofing)', category: 'Network', def: 'Sending forged Address Resolution Protocol messages over a local network to associate an attacker MAC address with the default gateway IP address (MitM).' },
    { term: 'DNS Tunneling', category: 'Network', def: 'Encoding non-DNS data into DNS queries/responses (often high-entropy subdomains) to bypass network firewalls and exfiltrate data.' }
  ];

  const filteredGlossary = glossaryTerms.filter(t =>
    t.term.toLowerCase().includes(glossarySearch.toLowerCase()) ||
    t.def.toLowerCase().includes(glossarySearch.toLowerCase()) ||
    t.category.toLowerCase().includes(glossarySearch.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#F8FAFC' }}>
          Cybersecurity & Cyber Laws Knowledge Center
        </h1>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          Statutory framework reference (Indian IT Act 2000 & DPDP Act 2023), enterprise defense standards, and digital forensics glossary.
        </p>
      </div>

      {/* Academic Disclaimer */}
      <div className="cyber-alert cyber-alert-info" style={{ fontSize: '0.8rem', lineHeight: 1.5 }}>
        <Info size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong>ACADEMIC & EDUCATIONAL PURPOSE:</strong> This knowledge center provides academic references for computer science and digital forensics engineering coursework. It does not constitute formal legal counsel or certification of statutory compliance.
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button
          onClick={() => setActiveTab('it-act')}
          className={`tab-btn ${activeTab === 'it-act' ? 'active' : ''}`}
        >
          <Scale size={16} />
          <span>Indian IT Act, 2000 & 2008 Amendment</span>
        </button>

        <button
          onClick={() => setActiveTab('dpdp')}
          className={`tab-btn ${activeTab === 'dpdp' ? 'active' : ''}`}
        >
          <ShieldAlert size={16} />
          <span>DPDP Act, 2023 Framework</span>
        </button>

        <button
          onClick={() => setActiveTab('practices')}
          className={`tab-btn ${activeTab === 'practices' ? 'active' : ''}`}
        >
          <Shield size={16} />
          <span>Security Best Practices</span>
        </button>

        <button
          onClick={() => setActiveTab('glossary')}
          className={`tab-btn ${activeTab === 'glossary' ? 'active' : ''}`}
        >
          <BookOpen size={16} />
          <span>Forensics Terminology Glossary</span>
        </button>
      </div>

      {/* TAB 1: IT ACT */}
      {activeTab === 'it-act' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            background: '#0B1322',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '1rem',
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.6
          }}>
            The <strong>Information Technology Act, 2000 (ITA-2000)</strong>, enacted on 9 June 2000 and substantially amended by the <strong>Information Technology (Amendment) Act, 2008 (effective 27 October 2009)</strong>, forms the primary legal foundation for cybercrime prosecution, electronic evidence recognition, and digital commerce in India.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '0.85rem' }}>
            {itActSections.map(sec => (
              <div key={sec.sec} className="cyber-card" style={{ padding: '1.15rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span className="font-mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                    {sec.sec}
                  </span>
                  <span className="badge badge-critical" style={{ fontSize: '0.65rem' }}>
                    Penal Statutory
                  </span>
                </div>

                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#F8FAFC', marginBottom: '0.35rem' }}>
                  {sec.title}
                </h3>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                  {sec.desc}
                </p>

                <div style={{
                  background: 'rgba(244, 63, 94, 0.08)',
                  border: '1px solid rgba(244, 63, 94, 0.25)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.75rem',
                  color: '#FDA4AF'
                }}>
                  <strong>Prescribed Penalty:</strong> {sec.penalty}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: DPDP ACT 2023 */}
      {activeTab === 'dpdp' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="cyber-card">
            <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#F8FAFC', marginBottom: '0.5rem' }}>
              Digital Personal Data Protection Act (DPDP Act, 2023)
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1rem' }}>
              Enacted in August 2023, the DPDP Act establishes a modern data protection regime for India, governing the processing of digital personal data while balancing individual privacy rights with legitimate lawful processing.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.85rem' }}>
              <div style={{ background: '#0B1322', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '0.3rem' }}>
                  1. Data Principal Rights
                </h3>
                <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  The natural person to whom personal data relates. Endowed with statutory rights to access personal data, seek correction/erasure, grievance redressal, and nominate a representative.
                </p>
              </div>

              <div style={{ background: '#0B1322', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#FCD34D', marginBottom: '0.3rem' }}>
                  2. Data Fiduciary Obligations
                </h3>
                <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Entities that determine the purpose and means of data processing. Legally mandated to implement reasonable security safeguards to prevent personal data breaches.
                </p>
              </div>

              <div style={{ background: '#0B1322', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#FDA4AF', marginBottom: '0.3rem' }}>
                  3. Mandatory Breach Notification
                </h3>
                <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  In the event of a personal data breach, Data Fiduciaries must notify both the Data Protection Board of India and affected Data Principals in the prescribed form and timeline.
                </p>
              </div>

              <div style={{ background: '#0B1322', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#6EE7B7', marginBottom: '0.3rem' }}>
                  4. Regulatory Penalties
                </h3>
                <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  Failure to implement reasonable security safeguards leading to a significant data breach attracts financial penalties up to ₹250 Crore per incident under the Act.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CYBERSECURITY BEST PRACTICES */}
      {activeTab === 'practices' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
          <div className="cyber-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Lock size={18} color="var(--accent-cyan)" />
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#F8FAFC' }}>Password & Authentication Policies</h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Enforce minimum 10+ character entropy, prohibit dictionary words, enforce lockout after 5 consecutive invalid attempts, and mandate FIPS-compliant TOTP or hardware FIDO2 MFA for administrative roles.
            </p>
          </div>

          <div className="cyber-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Wifi size={18} color="var(--accent-cyan)" />
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#F8FAFC' }}>Wi-Fi & Perimeter Hardening</h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Migrate to WPA3-Enterprise using 192-bit cryptographic mode. WPA3 replaces legacy WPA2 pre-shared key handshakes with Simultaneous Authentication of Equals (SAE), resisting offline dictionary attacks.
            </p>
          </div>

          <div className="cyber-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Smartphone size={18} color="var(--accent-cyan)" />
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#F8FAFC' }}>Mobile Device Security (MDM)</h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Mandate full-disk hardware encryption (BitLocker / FileVault / Android File-Based Encryption), enforce remote-wipe policies via Mobile Device Management, and disallow sideloading on operational devices.
            </p>
          </div>

          <div className="cyber-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <HardDrive size={18} color="var(--accent-cyan)" />
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#F8FAFC' }}>3-2-1 Data Backup Paradigm</h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Maintain 3 copies of forensic records across 2 different storage media types, with at least 1 immutable copy stored in an air-gapped or off-site cloud repository protected against ransomware encryption.
            </p>
          </div>
        </div>
      )}

      {/* TAB 4: GLOSSARY */}
      {activeTab === 'glossary' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Glossary Search Box */}
          <div className="cyber-card" style={{ padding: '0.85rem' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={glossarySearch}
                onChange={(e) => setGlossarySearch(e.target.value)}
                placeholder="Search digital forensics glossary by keyword or concept..."
                className="form-input"
                style={{ paddingLeft: '2.4rem' }}
              />
              <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '0.85rem' }}>
            {filteredGlossary.map(item => (
              <div key={item.term} className="cyber-card" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#F8FAFC' }}>
                    {item.term}
                  </h3>
                  <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
                    {item.category}
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {item.def}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
