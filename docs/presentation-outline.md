# CyberShield — Academic Presentation Slide Deck Outline

**Presentation Format:** 10 Slides for Academic Viva / Project Defense  
**Recommended Presentation Time:** 10–12 Minutes (+ 5 Minutes Q&A)

---

### Slide 1: Title & Project Identity
- **Slide Title:** CyberShield: Secure Cybercrime Investigation & Digital Forensics Platform
- **Subtitle:** An Integrated Engineering Capstone Project Bridging Application Security and Digital Forensics
- **Key Details:**
  - **Course:** Cybersecurity and Digital Forensics (Third-Year Engineering)
  - **Student Name(s) & Roll Numbers:** `[Student 1, Student 2, Student 3]`
  - **Faculty Guide / Mentor:** `[Faculty Mentor Name]`
  - **Department & Institution:** Department of Computer Engineering, `[College Name]`
  - **Academic Year:** 2025–2026
- **Speaker Notes:** Introduce team members, college department, and state the core vision: building an operational, hardened digital forensics and cybercrime case platform rather than just a theoretical prototype.

---

### Slide 2: Problem Statement & Motivation
- **Slide Title:** The Gap Between Cyber Forensics & Application Security
- **Bullet Points:**
  - **Evidence Fragility:** Digital evidence is easily spoliated by improper handling or unverified software modifications.
  - **Insecure Forensics Tools:** Many legacy investigation portals lack fundamental web security (vulnerable to SQLi, session hijacking, CSRF, and unrestricted file uploads).
  - **Academic Disconnect:** Students learn hashing and cryptography in isolation without seeing them operationalized in real-world chain of custody.
  - **Legal Admissibility Mandate:** Digital evidence requires strict mathematical integrity proofs to satisfy statutory scrutiny (Indian IT Act Section 65B).
- **Speaker Notes:** Highlight that an evidence platform that is itself vulnerable to compromise is legally useless. CyberShield treats application security as an indispensable forensic requirement.

---

### Slide 3: Project Objectives & Scope
- **Slide Title:** Objectives & Functional Capabilities
- **Bullet Points:**
  - **Full Incident Lifecycle:** Manage cybercrime dockets from submission through review, investigation, resolution, and archival.
  - **Cryptographic Evidence Vault:** Implement SHA-256 stream hashing, on-demand verification, and instant tamper detection.
  - **Offline Forensic Labs:** Provide rule-based heuristics for network intrusion logs and RFC 5322 email header spoof analysis.
  - **Ten Server-Enforced Protections:** Ensure multi-layered defense covering authentication, authorization, session flags, CSRF, and rate limiting.
  - **Educational Statutory Grounding:** Map workflows to the Indian IT Act (2000/2008) and the DPDP Act (2023).
- **Speaker Notes:** Clarify the scope: offline, privacy-safe, non-destructive forensics with zero external dependency risks.

---

### Slide 4: System Architecture & Simplified Navigation
- **Slide Title:** Architectural Blueprint & Six-Section Navigation
- **Bullet Points:**
  - **Six Intuitive Sections (Simplified for Academic Defense):**
    1. *Dashboard:* Overview of incident counts, case status breakdown, and recent platform activity in plain English.
    2. *Incident Reports:* Fictional cybercrime reporting, search, filters, and investigator case notes.
    3. *Evidence & Hash Check:* SHA-256 digital fingerprinting, integrity checking, tamper simulation, and evidence history.
    4. *Forensics Tools:* Tabbed analysis for Network Logs and Email Headers.
    5. *Security Features:* Five core live interactive demonstrations + faculty technical details.
    6. *Learning & Cyber Laws:* Indian IT Act 2000/2008, DPDP Act 2023, forensic checklists, and 30+ term glossary.
  - **Technology Stack:** React 19 + Vite, Node.js + Express 5, SQLite with WAL mode (`node:sqlite`).
  - **Backend Security:** Bcryptjs, RFC 6238 TOTP, Node.js `crypto` SHA-256, Zod schema validation, Vitest testing.
- **Visual Recommendation:** Embed the clean navigation menu and system architectural diagram.
- **Speaker Notes:** Emphasize that the user interface was structured into six clear sections with plain-English labels so that any student or examiner can immediately understand the workflow without technical confusion.

---

### Slide 5: Five Core Security Demonstrations (Defended by Ten Backend Controls)
- **Slide Title:** Core Security Mechanisms & Interactive Demonstrations
- **Bullet Points:**
  - **Five Direct Viva Demonstrations:**
    1. *Password Security:* Server-enforced complexity rules and Bcrypt hashing (cost factor 12).
    2. *Extra Login Verification:* Authenticator app setup (RFC 6238 TOTP) with QR codes and 6-digit codes.
    3. *Role-Based Permissions:* Strict route middleware denying unauthorized role access with clear explanations.
    4. *Protection Against Repeated Login Attempts:* Live test allowing initial requests and cleanly restricting the 4th rapid request.
    5. *Safe Evidence Uploads & Integrity:* Rejection of prohibited file types (`.exe`, `.bat`) and SHA-256 alteration detection.
  - **Retained Backend Protections:** Cryptographic CSRF tokens, secure session cookies (`HttpOnly`, `SameSite=Lax`), SQL parameterization, security headers (Helmet), and audit logging.
- **Speaker Notes:** Point out that each demonstration has a one-sentence problem statement, a live test button, an actual server result, and an optional expandable panel with technical implementation details for faculty.

---

### Slide 6: Evidence & Hash Check: Digital Fingerprints & Tamper Detection
- **Slide Title:** Digital Evidence Integrity & History of Evidence Handling
- **Bullet Points:**
  - **SHA-256 Digital Fingerprint:** Calculated upon upload via Node.js stream; detects if even one byte changes.
  - **Storage Isolation:** Evidence files stored outside the web root with randomized UUID filenames to prevent execution.
  - **On-Demand Integrity Check:** Recalculates current file hash and compares with the initial recorded fingerprint.
  - **Educational Tamper Test:** Simulates unauthorized alterations on a test copy and proves immediate alert triggering.
  - **History of Evidence Handling:** Chronological, tamper-evident log recording who uploaded, checked, or restored the file.
- **Visual Recommendation:** Show screenshot of Evidence & Hash Check showing the green `VERIFIED` state and the amber `TAMPER DETECTED` alert.
- **Speaker Notes:** Explain why hashing alone is not enough: it must be combined with an unbroken history of evidence handling to satisfy legal criteria under Section 65B of the Indian Evidence Act.

---

### Slide 7: Forensics Tools: Network Logs & Email Header Analysis
- **Slide Title:** Practical Forensic Analysis Tools
- **Bullet Points:**
  - **Network Log Analysis Tab:**
    - Checks recorded server and firewall logs for suspicious patterns.
    - Detects SSH brute-force attempts, port scans, SYN floods, and DNS anomalies with plain-English findings.
  - **Email Header Analysis Tab:**
    - Inspects RFC 5322 email headers and received hops.
    - Automatically flags phishing indicators where the sender display name masks a different reply-to address.
- **Speaker Notes:** Reiterate that network and email forensic parsers operate offline without generating live hostile network traffic, safe for classroom and viva evaluation.

---

### Slide 8: Indian Cyber Laws & Statutory Alignment
- **Slide Title:** Legal Framework Integration
- **Bullet Points:**
  - **Indian Information Technology Act, 2000 (Amended 2008):**
    - *Section 43 & 66:* Computer damage, hacking, data theft.
    - *Section 65:* Source document tampering (mirrored by our tamper-detection engine).
    - *Section 66C & 66D:* Identity theft and cheating by personation.
    - *Section 72:* Penalty for breach of confidentiality.
  - **Digital Personal Data Protection (DPDP) Act, 2023:**
    - Notice and affirmative consent requirement modeled in our Fingerprinting module.
    - Security safeguards duty imposed on Data Fiduciaries.
  - **Forensics Glossary:** Integrated 30+ term reference guide for legal and engineering terminology.
- **Speaker Notes:** Explain how the platform bridges technical engineering with practical law enforcement and Indian legal compliance.

---

### Slide 9: Automated Testing & Verification
- **Slide Title:** Comprehensive Automated Test Suite (100% Pass Rate)
- **Bullet Points:**
  - **Testing Stack:** Vitest runner + Supertest integration framework.
  - **27 Automated Test Cases Across 5 Specialized Suites:**
    - `auth.test.js` (5 tests): Password policy, bcrypt, lockout, MFA challenge, logout.
    - `rbac.test.js` (6 tests): Route protection, role hierarchy, reporter case isolation.
    - `security-mechanisms.test.js` (5 tests): CSRF validation, upload filtering, SHA-256 verification, tamper detection.
    - `forensics.test.js` (5 tests): Brute force, port scan, SYN flood, Received hops, email spoofing.
    - `url-reputation.test.js` (6 tests): SSRF defense, heuristic analysis, secure config status, consent gating, non-definitive disclaimer, and case evidence vaulting with SHA-256.
  - **Results:** 27 Passed, 0 Failed, executed in < 3 seconds.
- **Visual Recommendation:** Include screenshot of terminal output displaying `✓ 27 passed (27)` across all 5 suites.
- **Speaker Notes:** Confirm that every claimed security control has an automated test verifying its actual server-side rejection behavior.

---

### Slide 10: Conclusion, Limitations & Future Scope
- **Slide Title:** Project Summary, Limitations & Future Scope
- **Bullet Points:**
  - **Summary:** CyberShield provides a complete, hardened, and educational cybercrime reporting and forensics enclave fulfilling third-year capstone requirements.
  - **Academic Limitations:**
    - Heuristics are investigative leads, not mathematical proof of guilt.
    - Email parser does not query live DNS for DKIM/DMARC public keys (offline containment).
    - Single-node SQLite setup (enterprise deployments would scale to PostgreSQL).
  - **Future Roadmap:**
    - Client-side WebAssembly PCAP packet dissection engine.
    - Blockchain-anchored immutable ledger for multi-agency chain of custody.
    - AI-powered incident categorization using localized LLMs.
- **Speaker Notes:** Conclude with a strong closing statement thanking the evaluation committee and opening the floor for technical Q&A.
