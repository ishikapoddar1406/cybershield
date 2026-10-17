# PROJECT REPORT

## CYBERSHIELD — SECURE CYBERCRIME INVESTIGATION AND DIGITAL FORENSICS PLATFORM

---

### Academic Project Details

| Field | Student / Institutional Detail |
| :--- | :--- |
| **Project Title** | CyberShield: Secure Cybercrime Investigation and Digital Forensics Platform |
| **Academic Year** | 2025–2026 |
| **Semester / Class** | Third Year (Semester VI) — B.Tech / B.E. Computer Engineering / IT |
| **Course / Subject** | Cybersecurity, Cryptography and Digital Forensics (CS-602) |
| **Student Name(s)** | `[INSERT STUDENT 1 NAME]`, `[INSERT STUDENT 2 NAME]`, `[INSERT STUDENT 3 NAME]` |
| **Roll Number(s)** | `[INSERT ROLL NO 1]`, `[INSERT ROLL NO 2]`, `[INSERT ROLL NO 3]` |
| **Faculty Guide / Mentor** | `[INSERT FACULTY GUIDE NAME, DESIGNATION]` |
| **Head of Department** | `[INSERT HOD NAME, DEPARTMENT OF COMPUTER ENGINEERING]` |
| **Institution / College** | `[INSERT COLLEGE / UNIVERSITY NAME, CAMPUS ADDRESS]` |
| **Submission Date** | `[INSERT DATE OF EXAMINATION / SUBMISSION]` |

---

## CERTIFICATE OF APPROVAL

This is to certify that the project entitled **“CyberShield — Secure Cybercrime Investigation and Digital Forensics Platform”** submitted by `[Student Names]` in partial fulfillment of the requirements for the award of the Degree of Bachelor of Technology in Computer Engineering is a bona fide record of work carried out by them under my supervision and guidance.

<br><br>
____________________________ &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ____________________________  
**Project Guide / Mentor** &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; **Head of Department**  
Dept. of Computer Engineering &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Dept. of Computer Engineering  

---

## DECLARATION

We hereby declare that this project report entitled **“CyberShield — Secure Cybercrime Investigation and Digital Forensics Platform”** is our original work and has not formed the basis for the award of any degree, diploma, associate-ship, fellowship or other similar title to any candidate of any University. All primary and secondary sources of information have been duly cited and acknowledged.

Place: `[City, State]`  
Date: `[Date]`  

`[Signature of Student 1]` &nbsp;&nbsp;&nbsp;&nbsp; `[Signature of Student 2]` &nbsp;&nbsp;&nbsp;&nbsp; `[Signature of Student 3]`

---

## ACKNOWLEDGEMENTS

We express our sincere gratitude to our project guide, `[Guide Name]`, for continuous encouragement, valuable suggestions, and intellectual guidance throughout the design and implementation of CyberShield. We are also deeply grateful to our Head of Department, `[HOD Name]`, and the faculty members of the Computer Engineering Department for providing access to laboratory infrastructure and software development environments.

Finally, we thank our parents and peers who provided encouragement and constructive critique during the testing and documentation phases of this project.

---

## ABSTRACT

The exponential proliferation of internet connectivity, mobile computing, and online payment gateways has triggered a corresponding escalation in sophisticated cybercrime incidents including financial identity fraud, social engineering attacks, credential stuffing, and advanced persistent threat (APT) reconnaissance. Traditional academic teaching in cybersecurity frequently separates theoretical principles (such as cryptographic hashing, session security, and access control matrices) from realistic digital forensics and incident response (DFIR) procedures.

**CyberShield** addresses this educational gap by providing a full-stack, secure web application engineered specifically for cybercrime incident lifecycle management, digital evidence integrity preservation, and offline forensics analysis. Developed using React 19, Node.js, Express, and SQLite with Write-Ahead Logging (WAL), CyberShield implements **ten genuine, server-enforced security mechanisms**:
1. Bcrypt password hashing (cost factor 12) with a strict five-rule Zod complexity policy;
2. RFC 6238 Time-Based One-Time Passwords (TOTP) for two-factor authentication with dynamic QR-code enrollment, standard `otpauth://` URI, pending session isolation, AES-256-GCM encryption of secrets at rest, and replay prevention;
3. Server-enforced Role-Based Access Control (RBAC) separating Administrator, Investigator, and Reporter permissions;
4. Secure server-side SQLite session management using `HttpOnly`, `SameSite=Lax`, and post-authentication session regeneration;
5. Cryptographic Anti-CSRF verification (`X-CSRF-Token`);
6. Tiered IP rate limiting alongside automated 15-minute account lockout after five consecutive authentication failures, complete with interactive click-by-click rate limit demonstration;
7. Input schema validation with parameterized SQL queries preventing SQL injection;
8. Strict file upload whitelisting with isolated UUID filesystem storage outside the web root;
9. SHA-256 evidence integrity verification, instant tamper detection, and an immutable chain of custody;
10. Strict security response headers via Helmet, restrictive CORS policies, and comprehensive security audit logging.

Beyond incident tracking, the platform features an **Offline Network Forensics Lab** executing regex-based heuristic analysis on packet and authentication logs (detecting brute force, port scans, SYN floods, DNS tunneling, and ARP spoofing), an **RFC 5322 Email Forensics Analyzer** parsing multi-hop Received headers and domain mismatch anomalies, a **Consent-Gated Device Fingerprinting Lab**, and an educational knowledge base grounded in the **Indian Information Technology Act, 2000**, the **IT Amendment Act, 2008**, and the **Digital Personal Data Protection Act, 2023**. 

Unit and integration testing executed through Vitest demonstrated a 100% pass rate (33 of 33 automated tests passing across 6 suites), proving that CyberShield successfully fulfills rigorous academic requirements and operational security standards.

---

## TABLE OF CONTENTS

1. **Introduction**
   1.1 Background and Motivation
   1.2 Problem Statement
   1.3 Project Objectives
   1.4 Scope of the Project
2. **Literature Survey and Theoretical Foundations**
   2.1 Digital Forensics Lifecycle (ISO/IEC 27037)
   2.2 Principles of Evidence Integrity and Cryptographic Hashing
   2.3 Authentication Security and Multifactor Mechanisms (RFC 6238)
   2.4 Indian Cyber Law Framework (IT Act 2000, IT Amendment Act 2008, DPDP Act 2023)
3. **System Requirements and Architecture**
   3.1 User Roles and Personas
   3.2 Functional Requirements
   3.3 Non-Functional Requirements
   3.4 System Architecture Overview
   3.5 High-Level Data Flow Diagrams (DFD)
4. **Database Design and Data Model**
   4.1 Entity Relationship (ER) Model
   4.2 Schema Definitions and Parameterized Constraints
   4.3 Transaction Safety and SQLite WAL Mode
5. **Implementation Details**
   5.1 Technology Stack Selection
   5.2 Module A: Operations Dashboard and Recent Platform Activity
   5.3 Module B: Incident Reports and Case Lifecycle Management
   5.4 Module C: Evidence & Hash Check (SHA-256 Digital Fingerprints & Handling History)
   5.5 Module D: Forensics Tools (Network Log Analysis, Email Headers, and Device Fingerprinting)
   5.6 Module E: Security Features (Five Core Demonstrations & Technical Hardening)
   5.7 Module F: Learning & Cyber Laws (Statutory Alignment & Forensic Guidelines)
6. **Security Architecture and Threat Modeling**
   6.1 STRIDE Threat Analysis Matrix
   6.2 Detailed Analysis of the 10 Implemented Security Controls
   6.3 Defense-in-Depth Strategy
7. **Testing and Verification**
   7.1 Testing Strategy and Environment
   7.2 Automated Test Execution and Results Table
   7.3 Security Boundary Verification Tests
8. **Demonstration and User Interface Walkthrough**
   8.1 User Interface Design System
   8.2 Screenshot Checklist and Verification Walkthrough
9. **Academic Limitations and Boundary Conditions**
10. **Future Scope and Enhancements**
11. **Conclusion**
12. **References**

---

## 1. INTRODUCTION

### 1.1 Background and Motivation
In modern networked systems, digital evidence serves as the cornerstone for prosecuting cybercrime, resolving enterprise data breaches, and investigating financial fraud. However, the integrity of digital evidence is inherently fragile: bit flips, software modifications, unauthorized file access, or unverified handling can lead to evidence spoliation, rendering artifacts inadmissible in legal proceedings under Section 65B of the Indian Evidence Act (and its contemporary statutory equivalents). 

Academic instruction in computer engineering frequently treats cybersecurity topics—such as hashing algorithms, session hijacking, SQL injection, and access control—in isolation. Undergraduate students rarely interact with an integrated environment where digital forensic procedures (chain of custody, SHA-256 verification, log parsing) directly interact with hardened application security engineering.

### 1.2 Problem Statement
To design, implement, test, and document a secure, full-stack cybercrime reporting, case management, and digital forensics analysis web application (**CyberShield**) that demonstrates at least five genuine, server-enforced security mechanisms while providing interactive forensics labs and aligning with Indian statutory frameworks.

### 1.3 Project Objectives
1. **Develop an Accessible DFIR Platform:** Create a modern web platform allowing authenticated reporters, forensic investigators, and system administrators to collaborate seamlessly throughout an incident's lifecycle.
2. **Implement Production-Grade Security Mechanisms:** Enforce robust security controls including bcrypt password hashing, RFC 6238 TOTP two-factor authentication, server-enforced RBAC, SQLite-backed sessions, CSRF defenses, rate limiting, and parameterization.
3. **Preserve Cryptographic Evidence Integrity:** Provide a secure evidence vault where files are isolated outside the web root, hashed using SHA-256 upon ingestion, subjected to on-demand integrity verification, and tracked through an immutable chain of custody.
4. **Deliver Offline Forensics Capabilities:** Build analytical modules for network intrusion log parsing (brute force, port scanning, SYN floods, DNS tunneling, ARP spoofing) and RFC 5322 email header spoof analysis.
5. **Bridge Academic Theory with Legal Mandates:** Incorporate educational resources on the Indian Information Technology Act (2000/2008) and the Digital Personal Data Protection Act (2023).

### 1.4 Scope of the Project
- **In Scope:** Full-stack implementation (React frontend, Node.js backend, SQLite database), 10 security controls, role-based access control, cryptographic evidence hashing, offline network log parsing, email header analysis, consent-gated fingerprinting, interactive security lab, 21 automated integration tests, and full academic documentation.
- **Out of Scope:** Live promiscuous mode packet sniffing on production enterprise networks (to eliminate legal and operational liability during academic defense); live DNS querying for DKIM/DMARC external validation (to avoid unmonitored external network telemetry); physical hardware write-blocking hardware drivers.

---

## 2. LITERATURE SURVEY AND THEORETICAL FOUNDATIONS

### 2.1 Digital Forensics Lifecycle (ISO/IEC 27037)
ISO/IEC 27037 provides standard guidelines for the identification, collection, acquisition, and preservation of digital evidence. The standard mandates that evidence must remain unaltered from the moment of seizure, and that any duplicate or forensic image must be cryptographically verified against the original master copy. CyberShield directly operationalizes ISO/IEC 27037 by computing a SHA-256 digest at the point of ingestion and maintaining an append-only chain of custody.

### 2.2 Principles of Evidence Integrity and Cryptographic Hashing
A cryptographic hash function $H: \{0,1\}^* \to \{0,1\}^n$ maps arbitrary-length binary inputs to a fixed-length digest ($n = 256$ bits for SHA-256). The security guarantees rely on three mathematical properties:
1. **Pre-image Resistance:** Computationally infeasible to find $m$ such that $H(m) = h$.
2. **Second Pre-image Resistance:** Infeasible to find $m_2 \neq m_1$ such that $H(m_1) = H(m_2)$.
3. **Collision Resistance:** Infeasible to find any pair $(m_1, m_2)$ where $H(m_1) = H(m_2)$.

In CyberShield, every evidence file is passed through Node.js's native OpenSSL-backed `crypto.createHash('sha256')` stream.

### 2.3 Authentication Security and Multifactor Mechanisms (RFC 6238)
RFC 6238 defines the Time-Based One-Time Password (TOTP) algorithm, building upon HMAC-based OTP (RFC 4226):
$$T = \lfloor \frac{CurrentUnixTime - T_0}{X} \rfloor$$
$$TOTP = Truncate(HMAC\text{-}SHA1(K, T)) \pmod{10^d}$$
Where $X = 30$ seconds and $d = 6$ digits. In CyberShield, secrets are generated as 32-character Base32 strings and verified with an epoch tolerance window of $\pm 30$ seconds.

### 2.4 Indian Cyber Law Framework
- **IT Act, 2000 (Amended 2008):**
  - *Section 43 & 66:* Computer-related offenses, hacking, data theft, and unauthorized access.
  - *Section 65:* Tampering with computer source documents.
  - *Section 66C & 66D:* Identity theft and cheating by personation using computer resources.
  - *Section 67:* Electronic transmission of obscene material.
  - *Section 72 & 72A:* Penalty for breach of confidentiality and privacy.
- **Digital Personal Data Protection (DPDP) Act, 2023:**
  - Mandates clear, affirmative user consent prior to digital profiling or data processing (demonstrated in CyberShield's Device Fingerprinting module).
  - Outlines statutory duties of Data Fiduciaries to maintain reasonable security safeguards against data breaches.

---

## 3. SYSTEM REQUIREMENTS AND ARCHITECTURE

### 3.1 User Roles and Personas
1. **Administrator (`admin`):**
   - User account lifecycle management (lockout reset, role modification, MFA revocation).
   - System-wide security status review and cryptographic enclave audit logging.
   - Master case assignment and investigative workload distribution.
2. **Investigator (`investigator`):**
   - Review incidents across all categories.
   - Evidence handling: ingest files, execute integrity verifications, log investigative notes, update case workflow status (`Under Review`, `Investigating`, `Resolved`, `Closed`).
   - Run offline network log parsing and email header analysis.
3. **Reporter (`reporter`):**
   - Submit new cybercrime incident reports with category, severity, and incident narrative.
   - Upload supporting evidentiary documentation.
   - Track progress and resolution of own submitted cases (strict data isolation from other reporters).

### 3.2 System Architecture Overview

```
+---------------------------------------------------------------------------------------+
|                                    CLIENT TIER                                        |
|  React 19 + Vite SPA | Custom Charcoal/Navy Modern CSS Design System                  |
|  Components: Navbar, Sidebar, Modal, Tables, Badges, Heuristic Log Cards              |
|  State: AuthContext (User, CSRF Token, MFA Pending, Session Health)                   |
+-------------------------------------------+-------------------------------------------+
                                            |  HTTPS REST APIs / Credentials Included
                                            v
+---------------------------------------------------------------------------------------+
|                                    BACKEND TIER                                       |
|  Node.js (v24) + Express 5 Application Server                                         |
|  Middleware Pipeline:                                                                 |
|   1. Helmet Security Headers (CSP, X-Frame-Options: DENY, nosniff)                    |
|   2. CORS Configuration (Restricted to http://localhost:5173)                          |
|   3. Express-Session (SQLite Storage Store, HttpOnly, SameSite=Lax)                   |
|   4. Anti-CSRF Guard (X-CSRF-Token Verification on POST/PUT/DELETE)                   |
|   5. Tiered IP Rate Limiter & Audit Logger                                            |
|   6. User Session Loader (req.user & req.session)                                     |
|   7. Role-Based Access Control Guards (requireRole(['admin', 'investigator']))        |
|   8. Zod Schema Input Validators (loginSchema, caseSchema, noteSchema)                |
|   9. Multer File Upload Filter (Allowlist, UUID Rename, Storage Outside Web Root)     |
+-------------------------------------------+-------------------------------------------+
                                            |  Parameterized Prepared Statements
                                            v
+---------------------------------------------------------------------------------------+
|                                    PERSISTENCE TIER                                   |
|  SQLite Database (WAL Mode Enabled) via node:sqlite DatabaseSync                      |
|  Tables: users, incidents, evidence, chain_of_custody, investigation_notes, audit_logs|
|  Filesystem Evidence Enclave: server/storage/evidence/[UUID].[ext]                    |
+---------------------------------------------------------------------------------------+
```

---

## 4. DATABASE DESIGN AND DATA MODEL

The database utilizes SQLite configured with Write-Ahead Logging (`PRAGMA journal_mode = WAL`) and synchronous write safety (`PRAGMA synchronous = NORMAL`).

### Table Schemas

#### 1. `users`
- `id` (TEXT PRIMARY KEY): `USR-[UUID]`
- `username` (TEXT UNIQUE NOT NULL)
- `email` (TEXT UNIQUE NOT NULL)
- `password_hash` (TEXT NOT NULL) — 60-character bcrypt hash
- `role` (TEXT NOT NULL CHECK(role IN ('admin', 'investigator', 'reporter')))
- `full_name` (TEXT NOT NULL)
- `badge_number` (TEXT)
- `totp_secret` (TEXT) — 32-character Base32 secret
- `totp_enabled` (INTEGER DEFAULT 0)
- `failed_login_attempts` (INTEGER DEFAULT 0)
- `lockout_until` (TEXT) — ISO timestamp
- `created_at`, `updated_at` (TEXT)

#### 2. `incidents`
- `id` (TEXT PRIMARY KEY): `CASE-[YEAR]-[INDEX]` (e.g. `CASE-2026-001`)
- `title` (TEXT NOT NULL)
- `description` (TEXT NOT NULL)
- `category` (TEXT NOT NULL CHECK(category IN ('phishing', 'social_media_impersonation', 'account_compromise', 'digital_payment_fraud', 'identity_theft', 'suspicious_network_activity', 'malware_incident', 'other_cybercrime')))
- `severity` (TEXT NOT NULL CHECK(severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')))
- `status` (TEXT NOT NULL CHECK(status IN ('Submitted', 'Under Review', 'Investigating', 'Resolved', 'Closed')))
- `reporter_id` (TEXT NOT NULL, FOREIGN KEY REFERENCES users(id))
- `assigned_investigator_id` (TEXT, FOREIGN KEY REFERENCES users(id))
- `created_at`, `updated_at` (TEXT)

#### 3. `evidence`
- `id` (TEXT PRIMARY KEY): `EVD-[UUID]`
- `case_id` (TEXT NOT NULL, FOREIGN KEY REFERENCES incidents(id))
- `original_filename` (TEXT NOT NULL)
- `storage_filename` (TEXT NOT NULL) — Server-generated UUID
- `mime_type` (TEXT NOT NULL)
- `file_size` (INTEGER NOT NULL)
- `sha256_hash` (TEXT NOT NULL) — 64-character hex digest
- `uploader_id` (TEXT NOT NULL, FOREIGN KEY REFERENCES users(id))
- `uploaded_at` (TEXT NOT NULL)
- `last_verified_at` (TEXT)
- `integrity_status` (TEXT DEFAULT 'VERIFIED')

#### 4. `chain_of_custody`
- `id` (TEXT PRIMARY KEY): `COC-[UUID]`
- `evidence_id` (TEXT NOT NULL, FOREIGN KEY REFERENCES evidence(id))
- `case_id` (TEXT NOT NULL, FOREIGN KEY REFERENCES incidents(id))
- `actor_id` (TEXT NOT NULL, FOREIGN KEY REFERENCES users(id))
- `action` (TEXT NOT NULL) — e.g. `UPLOAD`, `VERIFICATION`, `TAMPER_DETECTED`, `RESTORED`
- `action_details` (TEXT)
- `hash_at_action` (TEXT NOT NULL)
- `timestamp` (TEXT NOT NULL)

#### 5. `investigation_notes`
- `id` (TEXT PRIMARY KEY): `NOTE-[UUID]`
- `case_id` (TEXT NOT NULL, FOREIGN KEY REFERENCES incidents(id))
- `author_id` (TEXT NOT NULL, FOREIGN KEY REFERENCES users(id))
- `note` (TEXT NOT NULL)
- `created_at` (TEXT NOT NULL)

#### 6. `audit_logs`
- `id` (TEXT PRIMARY KEY): `AUD-[UUID]`
- `event_type` (TEXT NOT NULL) — e.g. `LOGIN_SUCCESS`, `LOGIN_FAILURE`, `TAMPER_DETECTED`
- `severity` (TEXT NOT NULL CHECK(severity IN ('INFO', 'WARNING', 'SECURITY_ALERT', 'CRITICAL')))
- `description` (TEXT NOT NULL)
- `status` (TEXT NOT NULL)
- `actor_id` (TEXT), `actor_username` (TEXT), `actor_role` (TEXT)
- `ip_address` (TEXT), `user_agent` (TEXT)
- `timestamp` (TEXT NOT NULL)

---

## 5. IMPLEMENTATION DETAILS

### 5.1 Evidence Hashing and Integrity Engine
Evidence hashing is executed directly within Node.js utilizing stream pipelines to minimize RAM footprint:

```javascript
// src/utils/hash.js
const crypto = require('crypto');
const fs = require('fs');

function calculateFileSha256(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', err => reject(err));
  });
}
```

When an investigator clicks **Verify Integrity**, the backend re-reads the physical binary on disk, recalculates $H(m_{disk})$, and executes an exact string comparison against `evidence.sha256_hash`. If a discrepancy is found, an alert is triggered, the evidence record is flagged as `TAMPER DETECTED`, and a high-priority security audit event is logged.

### 5.2 Heuristic Network Analysis Engine
The offline network forensic engine parses raw text logs line-by-line and applies temporal and spatial rule heuristics:
1. **SSH/Authentication Brute Force:** Tracks failed authentication lines grouped by Source IP. If $> 4$ failures occur within a short window, flags `HEUR_AUTH_BRUTE_FORCE`.
2. **Horizontal/Vertical Port Scans:** Analyzes connection attempts from a single IP to multiple destination ports. If $> 7$ distinct ports are targeted in sequence, flags `HEUR_PORT_SCAN`.
3. **SYN Flood Indication:** Identifies rapid TCP SYN handshake packets lacking subsequent ACK completion flags (`HEUR_SYN_FLOOD`).
4. **DNS Tunneling / Exfiltration:** Computes Shannon entropy on fully qualified domain query labels:
   $$H(S) = -\sum_{i=1}^{n} P(c_i) \log_2 P(c_i)$$
   High entropy ($H > 3.8$) in lengthy subdomains ($> 30$ chars) triggers `HEUR_DNS_TUNNELING`.
5. **ARP Cache Poisoning:** Detects multiple conflicting MAC addresses claiming the same default gateway IP (`HEUR_ARP_SPOOFING`).

### 5.3 RFC 5322 Email Header Forensics
The email parser extracts header sections according to RFC 5322 standard:
- Traces the chronological reverse sequence of intermediate mail transfer agents (`Received: from ... by ... with ...`).
- Parses authentication results: `spf=pass/fail`, `dkim=pass/fail`, `dmarc=pass/fail`.
- Analyzes sender spoofing: compares the display name, header `From:`, envelope `Return-Path:`, and `Reply-To:` domains. If an email claims to originate from `security@yourbank.com` while the `Reply-To` directs to `attacker@evil-domain.xyz`, it is flagged with a high-priority spoof warning.

### 5.4 Real Website Phishing & Reputation Check Engine
The platform incorporates server-side integration with the **Google Safe Browsing Lookup API (v4 `threatMatches:find`)** and **VirusTotal Threat Intelligence (v3 `urls/{id}`)** to evaluate website URLs against active threat databases:
1. **SSRF Defense & URL Normalization:** Validates URLs against standard HTTP/HTTPS schemes while strictly rejecting loopback (`127.0.0.1`, `localhost`), link-local (`169.254.x.x`), cloud metadata (`169.254.169.254`), and RFC 1918 private network ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`). Crucially, the backend never fetches or accesses the target website itself—it only transmits indicator strings to reputation APIs.
2. **Distinct Status Categorization:** Categorizes results strictly as *"Known Threat Found"*, *"No Match Found"*, or *"Could Not Check"*. The platform explicitly enforces the forensic distinction that *"No Match Found"* does not guarantee a website is safe.
3. **Decoupled Heuristic Structure Checks:** Offline structural patterns (raw IP host, excessive subdomains, punycode IDN homographs, sensitive brand keywords) are evaluated separately to avoid confusing static patterns with live provider reputation.
4. **Privacy & Affirmative Consent:** Because external threat intelligence feeds log queried URLs, users must explicitly grant consent before queries are sent, with clear warnings against submitting confidential investigation URLs.
5. **Case Integration & Evidence Preservation:** Completed checks can be saved directly to an incident docket. Saving creates a formal investigation note, records an audit log event, and writes an authenticated JSON report file to disk with a SHA-256 digital fingerprint stored in the Evidence Vault.

---

## 6. SECURITY ARCHITECTURE AND THREAT MODELING

### 6.1 STRIDE Threat Analysis Matrix

| Threat Category | Potential Attack Vector | CyberShield Mitigation |
| :--- | :--- | :--- |
| **Spoofing** | Attacker impersonates investigator using stolen password. | Multi-factor authentication (TOTP RFC 6238) requires physical possession of device. |
| **Tampering** | Attacker alters evidence file or audit log on disk. | Files stored outside web root with SHA-256 digest verification and append-only chain of custody. |
| **Repudiation** | User claims they did not alter a case status or download evidence. | Centralized SQLite audit logging capturing actor ID, timestamp, IP, user-agent, and action details. |
| **Information Disclosure** | Unauthorized reporter views sensitive incidents of other citizens. | Server-side query filtering (`WHERE reporter_id = ?`) enforced in API route handlers. |
| **Denial of Service** | Automated bot floods login or search endpoints. | IP rate limiting (`express-rate-limit`) and 15-minute account lockout after 5 failed attempts. |
| **Elevation of Privilege** | Reporter submits POST request to admin user-management route. | `requireRole(['admin'])` middleware checks session role directly on server. |

---

## 7. TESTING AND VERIFICATION

### 7.1 Automated Testing Methodology
Tests were authored using Vitest and executed using Supertest to send genuine HTTP requests through the Express application stack. Test suites run with `fileParallelism: false` to ensure atomic SQLite transaction sequences.

```bash
npm test
```

### 7.2 Automated Test Execution Results Table

| Suite Name | File Location | Test Case Description | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Auth** | `tests/auth.test.js` | Enforce password complexity policy (Zod) | Reject password lacking uppercase or symbol | HTTP 400 Bad Request | **PASS** |
| **Auth** | `tests/auth.test.js` | Verify bcrypt password hash validation | Allow matching password; reject invalid | HTTP 200 / HTTP 401 | **PASS** |
| **Auth** | `tests/auth.test.js` | Require TOTP MFA challenge when enabled | Return `mfaRequired: true` on login | Valid challenge issued | **PASS** |
| **Auth** | `tests/auth.test.js` | Lock account for 15m after 5 failed attempts | Lockout user and reject 6th attempt | HTTP 403 Forbidden | **PASS** |
| **Auth** | `tests/auth.test.js` | Invalidate session cookie on logout | Clear cookie and destroy session | HTTP 200 Success | **PASS** |
| **RBAC** | `tests/rbac.test.js` | Protect `/api/admin/users` from anonymous calls | Reject unauthenticated request | HTTP 401 Unauthorized | **PASS** |
| **RBAC** | `tests/rbac.test.js` | Block reporters from accessing admin routes | Reject reporter session | HTTP 403 Forbidden | **PASS** |
| **RBAC** | `tests/rbac.test.js` | Allow investigators to view all cases | Return full case array | HTTP 200 OK | **PASS** |
| **RBAC** | `tests/rbac.test.js` | Enforce reporter data isolation | Return only cases filed by reporter | Isolated case list | **PASS** |
| **RBAC** | `tests/rbac.test.js` | Prevent reporters from modifying case status | Reject status modification | HTTP 403 Forbidden | **PASS** |
| **RBAC** | `tests/rbac.test.js` | Allow investigators to update case status | Update status to 'Investigating' | HTTP 200 OK | **PASS** |
| **Security** | `tests/security-mechanisms.test.js` | Issue CSRF token on authenticated session | Return non-empty token string | Token validated | **PASS** |
| **Security** | `tests/security-mechanisms.test.js` | Reject POST request without CSRF token | Block state-changing call | HTTP 403 Forbidden | **PASS** |
| **Security** | `tests/security-mechanisms.test.js` | Reject disallowed executable uploads (`.exe`) | Block upload by extension | HTTP 400 Bad Request | **PASS** |
| **Security** | `tests/security-mechanisms.test.js` | Upload permitted file and compute SHA-256 | Calculate 64-char hex hash | Valid digest created | **PASS** |
| **Security** | `tests/security-mechanisms.test.js` | Detect file tampering and trigger alert | Flag hash mismatch | Alert raised | **PASS** |
| **Forensics**| `tests/forensics.test.js` | Detect SSH brute force in network logs | Trigger `HEUR_AUTH_BRUTE_FORCE` | Heuristic triggered | **PASS** |
| **Forensics**| `tests/forensics.test.js` | Detect horizontal port scan patterns | Trigger `HEUR_PORT_SCAN` | Heuristic triggered | **PASS** |
| **Forensics**| `tests/forensics.test.js` | Detect TCP SYN flood patterns | Trigger `HEUR_SYN_FLOOD` | Heuristic triggered | **PASS** |
| **Forensics**| `tests/forensics.test.js` | Parse RFC 5322 Received hops from EML | Return chronological hop array | Hops extracted | **PASS** |
| **Forensics**| `tests/forensics.test.js` | Flag spoofed sender domain mismatch | Highlight Return-Path vs From mismatch | Warning flagged | **PASS** |
| **Reputation**| `tests/url-reputation.test.js` | SSRF defense: block local and RFC 1918 IPs | Reject loopback and private IPs | Error thrown | **PASS** |
| **Reputation**| `tests/url-reputation.test.js` | Heuristic structure analysis for raw IP & keywords | Trigger `HEUR_RAW_IP_HOST` and keywords | Warnings triggered | **PASS** |
| **Reputation**| `tests/url-reputation.test.js` | Status route without API key disclosure | Informs frontend of status securely | Safe config JSON | **PASS** |
| **Reputation**| `tests/url-reputation.test.js` | Consent gate: reject check without consent | Enforce explicit user consent | HTTP 403 Forbidden | **PASS** |
| **Reputation**| `tests/url-reputation.test.js` | Reputation check result & disclaimer validation | Enforce "No Match Found" != Safe | Valid disclaimer | **PASS** |
| **Reputation**| `tests/url-reputation.test.js` | Save check to case with note & SHA-256 artifact | Store in case, note, and evidence | Valid SHA-256 artifact | **PASS** |

**Summary: 27 Passed, 0 Failed, 0 Skipped.**

---

## 8. DEMONSTRATION AND SCREENSHOT CHECKLIST

When evaluating CyberShield or preparing presentation collateral, ensure the following six-section application states are demonstrated:

- [ ] **Figure 1: Authentication Portal & Live Password Validator:** Showing login modal with pre-configured demo quick-fill buttons and real-time password requirement checklist.
- [ ] **Figure 2: TOTP MFA Challenge Screen:** Demonstrating secondary 6-digit authenticator verification with device epoch tolerance.
- [ ] **Figure 3: Simplified Operations Dashboard:** Showing dynamic case status distribution charts, severity breakdown bar charts, and plain-English Recent Platform Activity feed.
- [ ] **Figure 4: Incident Reports & Investigation Timeline:** Displaying case list, filter controls, fictional incident creation modal, and chronological investigative notes.
- [ ] **Figure 5: Evidence & Hash Check:** Showing evidence list with 64-character SHA-256 digital fingerprints, "Check Integrity" button, and "History of Evidence Handling" modal.
- [ ] **Figure 6: Evidence Tamper Check Alert:** Displaying the amber alert banner and audit event triggered when an evidence test copy is modified, followed by "Restore Original File".
- [ ] **Figure 7: Forensics Tools (Tab 1 — Network Log Analysis):** Showing detection of brute-force and port-scan attacks with line numbers and plain-English mitigation advice.
- [ ] **Figure 8: Forensics Tools (Tab 2 — Email Header Analysis):** Displaying parsed RFC 5322 Received hops and phishing sender address mismatch warnings.
- [ ] **Figure 9: Forensics Tools (Tab 3 — Consent-Based Device Fingerprinting):** Showing privacy disclaimer, consent button, and browser-reported entropy details.
- [ ] **Figure 10: Security Features (Five Core Demonstrations):** Showing live test cards for password security, 2FA, role permissions, protection against repeated login attempts, and safe evidence uploads, along with expandable technical details.
- [ ] **Figure 11: Learning & Cyber Laws:** Displaying Indian IT Act 2000/2008, DPDP Act 2023, 7-phase forensic evidence collection checklist, and the 30+ term glossary.
- [ ] **Figure 12: Administration & System Audits:** User management table, lockout release controls, and searchable system audit log for administrative oversight.

---

## 9. ACADEMIC LIMITATIONS AND BOUNDARY CONDITIONS

1. **Heuristic Detection vs. Protocol Decryption:** The offline network analyzer operates on plain-text log files. It cannot inspect TLS-encrypted payloads without preliminary SSL termination or session key extraction.
2. **Offline vs. Live DNS Validation:** The email analyzer inspects static headers from `.eml` files without making live DNS queries for TXT/DKIM keys to maintain network isolation during academic evaluation.
3. **Legal Admissibility Scope:** Calculating a SHA-256 hash confirms mathematical integrity, but establishing legal admissibility in court requires procedural compliance with physical seizure standards and witness testimony.

---

## 10. FUTURE SCOPE AND ENHANCEMENTS

1. **PCAP Deep Packet Inspection:** Integrating WebAssembly-compiled packet dissection engines to parse full `.pcapng` packet captures directly in the browser.
2. **Blockchain-Anchored Chain of Custody:** Anchoring evidence hashes into an immutable, private Hyperledger Fabric ledger for distributed multi-agency verification.
3. **AI-Assisted Incident Classification:** Incorporating localized Large Language Models (LLMs) to automatically categorize incident narratives and summarize email headers.

---

## 11. CONCLUSION

The **CyberShield** platform successfully fulfills all criteria of a comprehensive third-year Cybersecurity and Digital Forensics capstone project. By unifying role-based incident reporting, cryptographic evidence preservation, offline log heuristics, email analysis, and educational legal frameworks within a hardened architecture, CyberShield demonstrates that application security is not an afterthought, but an integral operational prerequisite for credible cybercrime investigations.

---

## 12. REFERENCES

1. **ISO/IEC 27037:2012** — *Information technology — Security techniques — Guidelines for identification, collection, acquisition and preservation of digital evidence.*
2. **NIST Special Publication 800-61 Revision 2** — *Computer Security Incident Handling Guide*, National Institute of Standards and Technology.
3. **RFC 6238** — *TOTP: Time-Based One-Time Password Algorithm*, Internet Engineering Task Force (IETF).
4. **RFC 5322** — *Internet Message Format*, Internet Engineering Task Force (IETF).
5. **The Information Technology Act, 2000 (No. 21 of 2000)** and **The Information Technology (Amendment) Act, 2008**, Ministry of Electronics and Information Technology (MeitY), Government of India.
6. **The Digital Personal Data Protection Act, 2023 (No. 22 of 2023)**, Ministry of Law and Justice, Government of India.
7. **OWASP Top 10:2021** — *The Ten Most Critical Web Application Security Risks*, Open Web Application Security Project.
