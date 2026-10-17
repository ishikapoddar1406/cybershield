# CyberShield — Secure Cybercrime Investigation & Digital Forensics Platform

[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-339933?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v19-61DAFB?logo=react)](https://react.dev/)
[![SQLite](https://img.shields.io/badge/SQLite-WAL--Mode-003B57?logo=sqlite)](https://www.sqlite.org/)
[![Security](https://img.shields.io/badge/MFA-TOTP%20RFC%206238-06B6D4)](#multifactor-authentication-totp)
[![Tests](https://img.shields.io/badge/Tests-33%2F33%20Passing-10B981)](#automated-testing)
[![Cyber Laws](https://img.shields.io/badge/Compliance-IT%20Act%202000%20%7C%20DPDP%202023-F59E0B)](#cyber-laws--regulatory-context)

> **Third-Year Engineering Academic Capstone Project**  
> **Course:** Cybersecurity and Digital Forensics  
> **Platform Version:** 1.0.0 (Production-Grade Academic Build)

---

## 1. Project Overview

**CyberShield** is an end-to-end, full-stack cybercrime reporting, case management, and digital forensics investigation platform designed to bridge theoretical cybersecurity coursework with authentic operational workflows. The platform demonstrates **ten genuine, server-enforced security mechanisms** while adhering strictly to digital evidence preservation standards (ISO/IEC 27037) and Indian statutory frameworks (**Information Technology Act, 2000**, **IT Amendment Act, 2008**, and the **Digital Personal Data Protection Act, 2023**).

### Six Core Sections (Simplified Navigation)

1. **Dashboard:** Visual case statistics, investigation lifecycle progress, and recent platform activity.
2. **Incident Reports:** Submit, search, filter, and update cybercrime reports with investigation notes.
3. **Evidence & Hash Check:** Upload safe evidence, compute SHA-256 digital fingerprints, test tamper detection, and review handling history.
4. **Forensics Tools (Merged Tabs):**
   - *Network Log Analysis:* Searches server logs for brute-force attacks, port scans, and high-volume floods.
   - *Email Header Analysis:* Traces email server hops and flags misleading sender display names.
   - *Real Website Phishing Check:* Queries real threat intelligence feeds (Google Safe Browsing & VirusTotal) to check if a website address is flagged for phishing or malware, performs offline structural heuristics, and saves verified reputation reports directly into investigation cases with SHA-256 evidence digests.
   - *Device Fingerprinting:* Educational demonstration of browser-reported details (requires explicit consent).
5. **Security Features (Five Core Demonstrations):**
   - *1. Password Security:* Password complexity rules and Bcrypt cryptographic hashing.
   - *2. Extra Login Verification:* Genuine Time-Based One-Time Password (TOTP) two-factor authentication (Google/Microsoft Authenticator) with 4-step guided enrollment, AES-256-GCM secret encryption at rest, and replay attack prevention.
   - *3. Role-Based Permissions:* Server-side access control separating Reporters, Investigators, and Admins.
   - *4. Repeated Login Protection:* Rate limiting with click-by-click demonstration (Click 1 allowed, Click 2 allowed, Click 3 allowed, Click 4 blocked) and automatic 15-minute account lockout after 5 failures.
   - *5. Safe Evidence Uploads:* Rejection of dangerous files (.exe) and SHA-256 alteration detection.
6. **Learning & Cyber Laws:** Study Indian cyber laws (IT Act 2000/2008, DPDP Act 2023), 7-phase forensic checklist, NIST incident response phases, and an interactive 30+ term glossary.

---

## 2. Mandatory Security Mechanisms Implemented

| # | Security Control | Technical Implementation | Threat Addressed |
|---|------------------|--------------------------|------------------|
| **1** | **Password Policy & Hashing** | Bcrypt (cost factor 12) + Zod policy (min 10 chars, uppercase, lowercase, number, symbol) | Credential stuffing, dictionary attacks, rainbow table cracking |
| **2** | **TOTP MFA** | RFC 6238 Time-Based One-Time Passwords (`otplib`), standard `otpauth://totp/` URI, AES-256-GCM encrypted secrets at rest, replay protection (`last_used_totp_timestep`), 4-step enrollment | Credential theft, unauthorized session hijacking |
| **3** | **Server-Enforced RBAC** | Strict Express middleware (`requireRole`) verifying authenticated session state on every REST route | Vertical and horizontal privilege escalation, IDOR |
| **4** | **Secure Session Management** | SQLite-backed server session store (`express-session`), `HttpOnly`, `SameSite=Lax`, session regeneration | XSS session theft, session fixation, state tampering |
| **5** | **Anti-CSRF Protection** | Cryptographic token generation (`crypto.randomBytes(32)`), `X-CSRF-Token` header verification | Cross-Site Request Forgery on state-changing API operations |
| **6** | **Rate Limiting & Lockout** | `express-rate-limit` (10 requests/15 min) + account lockout (5 consecutive failed attempts = 15-min lockout) + interactive click-by-click test | Distributed and single-IP brute-force authentication attacks |
| **7** | **Input Validation & SQL Safety** | Zod schema validation on all inputs + parameterized SQLite prepared statements | SQL Injection (SQLi), malformed payload crashes, buffer abuse |
| **8** | **Strict Upload Filtering** | Extension & MIME-type allowlists, 10MB file limit, UUID renaming stored outside web root | Remote Code Execution (RCE), arbitrary file upload, web shell injection |
| **9** | **SHA-256 Evidence Integrity** | Node.js `crypto` SHA-256 digest on upload, re-calculation on demand, tamper alert banners | Evidence spoliation, accidental modification, chain-of-custody dispute |
| **10** | **Security Headers & Audit Log** | Helmet CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, CORS whitelist, SQLite audit trail | Clickjacking, MIME confusion, unauthorized cross-origin requests, repudiation |

---

## 3. Technology Stack

- **Frontend:** React 19, Vite, Lucide React, Modern CSS Design System (Custom Charcoal/Navy Cyber Theme, No Tailwind dependencies).
- **Backend:** Node.js (v18.0.0+ / v20+ / v24+), Express 5.
- **Database:** SQLite with WAL Mode (`node:sqlite` DatabaseSync / Zero native C++ compile requirement).
- **Security & Crypto:** `bcryptjs`, `otplib` (RFC 6238 TOTP), `qrcode`, Node.js `crypto` (AES-256-GCM, SHA-256).
- **Validation:** Zod v4 schema enforcement.
- **Testing:** Vitest, Supertest for full HTTP API integration testing.

---

## 4. Quick Start & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) v18.0.0 or higher
- `npm` v9.0.0 or higher

### Step 1: Clone or Navigate to Project
```bash
cd cybershield
```

### Step 2: Install Dependencies
Install dependencies for both backend and frontend in a single command:
```bash
npm run install:all
```
*(Or install individually: `cd server && npm install`, then `cd ../client && npm install`)*

### Step 3: Seed the Database
Populate the database with pre-configured demo users, realistic fictional incidents, authentic forensic sample evidence, and initial audit logs:
```bash
npm run seed
```
*Database output is saved at `server/data/cybershield.db`.*

### Step 4: Launch the Unified Development Server
Launch both the backend API (`:5000`) and the Vite React frontend (`:5173`) concurrently:
```bash
npm run dev
```

Open your browser to:
```
http://localhost:5173
```

---

## 5. Seeded Demo Accounts

The database comes pre-populated with accounts for each role:

| Username | Password | Role | MFA Status | Primary Privileges |
|----------|----------|------|------------|---------------------|
| `admin` | `Admin@CyberShield2026!` | Administrator | Configurable | User management, audit logs, case reassignment, system status |
| `investigator1` | `Investigator@2026!` | Investigator | Configurable | Review incidents, upload/verify evidence, update case status, add notes |
| `reporter1` | `Reporter@2026!` | Reporter | Configurable | Submit cybercrime reports, upload initial evidence, track own reports |
| `testuser` | `TestUser@2026!` | Reporter | Disabled | Dedicated safe test account for evaluating lockout & rate limits |

> **Security Note:** New users registering via the public portal are automatically assigned the `reporter` role to prevent privilege escalation. Role promotions to `investigator` or `admin` can only be performed by an existing Administrator.

---

## 6. Multifactor Authentication (TOTP) Workflow

CyberShield implements standard **RFC 6238 Time-Based One-Time Password (TOTP)** authentication compatible with Google Authenticator, Microsoft Authenticator, Authy, and FreeOTP.

### 4-Step Student-Friendly Enrollment Process
1. **Navigate to Security Features:** In the **Demonstration 2 (Two-Factor Authentication)** section, click **"Set Up Authenticator"**.
2. **Step 1 — Scan QR Code:** A high-contrast QR code is rendered on screen encoding the standard URI:
   ```
   otpauth://totp/CyberShield:{username}?secret={BASE32_SECRET}&issuer=CyberShield&algorithm=SHA1&digits=6&period=30
   ```
   If camera scanning is unavailable, use the fallback **Manual Setup Key** with the convenient **"Copy Key"** button.
3. **Step 2 — Open Authenticator App:** Launch Google Authenticator or Microsoft Authenticator and locate the `CyberShield` entry with the active 6-digit rolling code.
4. **Step 3 — Enter 6-Digit Code:** Enter the current 6-digit numeric code into the verification input below the QR code and click **"Verify and Enable MFA"** (or click **"Cancel Setup"** to cleanly abort).
5. **Step 4 — Confirmation & Session Isolation:** The backend cryptographically validates the TOTP token against the pending secret stored in session (`req.session.pendingMfaSecret`). Upon validation, the secret is encrypted with **AES-256-GCM** at rest and saved to the database. The banner confirms **"Authenticator enabled successfully"**.

### Enforced MFA Login Flow
- On subsequent logins, after submitting username and password, CyberShield detects `totp_enabled === 1`.
- Access is withheld in a partial-authentication state (`preMfaUserId`), and a clear modal prompts for the 6-digit authenticator code.
- Entering the current rolling code completes verification, regenerates the session, and grants access. Replayed codes within the same 30-second window are strictly rejected.

---

## 7. Automated Testing

CyberShield includes comprehensive automated tests covering authentication, MFA enrollment, RBAC, evidence hashing, tamper detection, rate limiting, and forensics parsing:

```bash
# Run all automated test suites
npm test
```

### Test Suite Summary (33 Passed across 6 Suites)
- **`auth.test.js`** (5 tests): Password policy verification, bcrypt hashing, login rate limiting, 15-minute account lockout after 5 failures, session destruction on logout.
- **`mfa-enrollment.test.js`** (6 tests): RFC 6238 QR enrollment, session pending isolation, rejection of invalid/incomplete codes, AES-256-GCM encrypted persistence, replay attack prevention, password-verified MFA disable, and the 4-click sequential rate limit demonstration.
- **`rbac.test.js`** (6 tests): Role separation matrix, reporter case isolation, unauthorized route rejection (`401` and `403`).
- **`security-mechanisms.test.js`** (5 tests): CSRF token generation & rejection on missing/invalid token, file upload allowlist enforcement, oversized file rejection, SHA-256 evidence verification & tamper simulation.
- **`forensics.test.js`** (5 tests): Heuristic log analysis (brute force, port scan, SYN flood, DNS tunneling, ARP spoof), RFC 5322 email parsing (Received hops, SPF/DKIM/DMARC status, spoof detection), consent-gated device fingerprinting.
- **`url-reputation.test.js`** (6 tests): SSRF defense (blocking loopback/RFC 1918 IPs), offline URL structural heuristics, privacy/consent gate, Google Safe Browsing / VirusTotal result handling, and case evidence artifact generation with SHA-256 digest.

---

## 8. Guided Demonstration Workflow for Examiners & Practical Exam

Follow this straightforward 10-step walkthrough to demonstrate the complete student project:

1. **Open the Dashboard:**
   - Log in with any demo account (e.g., `investigator1` / `Investigator@2026!`).
   - Observe the clean overview showing active cases, investigation progress, and recent platform activity in plain English.
2. **Submit a Fictional Cybercrime Incident:**
   - Click the green **"Submit New Incident"** button.
   - Enter a fictional case (e.g., Title: *"Campus Wi-Fi Phishing Incident"*, Category: `Phishing`, Severity: `MEDIUM`, Description: *"Fictional phishing email pretending to be university portal."*).
   - Click **"Submit Incident Report"** and confirm it appears in the case list.
3. **Open the Incident and Upload Permitted Sample Evidence:**
   - Navigate to **"Evidence & Hash Check"**.
   - Click **"Upload Evidence File"**.
   - Select a safe permitted file (e.g., `samples/auth-bruteforce.log`) and select your case.
   - Click **"Upload File & Compute Hash"**. The server checks that the file is safe, saves it securely, and calculates its digital fingerprint.
4. **Calculate SHA-256 Hash & Verify Evidence Integrity:**
   - On the newly uploaded file, click **"Check Integrity"**.
   - Observe the green confirmation explaining that the file's SHA-256 digital fingerprint matches its original recorded value, proving the file is unchanged.
5. **Demonstrate How the Integrity Check Detects a Changed File:**
   - Click **"Test Tamper Check"** on the test evidence file.
   - The system modifies a copy to simulate unauthorized alterations.
   - Click **"Check Integrity"** again &rarr; observe the clear amber alert warning that the current fingerprint does not match the original fingerprint.
   - Click **"Restore Original File"** to safely restore the authentic file.
   - Click **"History of Evidence Handling"** to show the complete chronological log of who uploaded or checked the file.
6. **Load a Sample Network Log & Explain Suspicious Patterns:**
   - Navigate to **"Forensics Tools"** &rarr; select the **"Network Log Analysis"** tab.
   - Select the preset **"SSH & Login Repeated Attempts (Brute Force)"** or **"Port Scan Activity"**.
   - Click **"Analyze Network Log"**.
   - Explain the plain-English finding: multiple repeated failed attempts detected from IP `192.168.1.105` trying common usernames.
7. **Examine a Sample Email Header & Explain Phishing Indicators:**
   - In **"Forensics Tools"**, switch to the **"Email Header Analysis"** tab.
   - Select the preset **"Bank Impersonation Phishing Email"**.
   - Click **"Analyze Email Headers"**.
   - Point out the clear phishing warning: the sender display name claims to be a trusted bank (`accounts@hdfcbank.com`), but the actual `Reply-To` address goes to an untrusted domain (`support@secure-update-verify.com`).
8. **Check Real Website Phishing & Reputation:**
   - In **"Forensics Tools"**, switch to the **"Real Website Phishing Check"** tab.
   - Read the privacy & consent notice, check the consent box, and test a URL (e.g. click preset *Google Test Threat (Malware)* or *Suspicious URL Structure Example*).
   - Click **"Check Website"**. Observe the distinct status (*Known Threat Found*, *No Match Found*, or *Could Not Check* if keys are not set in `.env`), the detection breakdown, and the separate offline heuristic pattern warnings.
   - Click **"Save to Investigation Case"** to link the finding to your incident docket. This automatically creates a formal case note and generates a verifiable forensic evidence artifact with a SHA-256 fingerprint in **Evidence & Hash Check**.
9. **Demonstrate Five Core Security Mechanisms:**
   - Navigate to **"Security Features"**.
   - Walk through the five cards with live interactive tests:
     - **Mechanism 1 (Password Security):** Click "Test Password Strength" to show rules and bcrypt hashing.
     - **Mechanism 2 (Extra Login Verification / 2FA):** Click "Set Up Authenticator" &rarr; scan QR code with Google Authenticator (or copy fallback manual key) &rarr; enter 6-digit code &rarr; click "Verify and Enable MFA". Shows "Authenticator enabled successfully" with AES-256-GCM encryption and replay prevention. Then test logging out and logging in to show the secondary authenticator code requirement.
     - **Mechanism 3 (Role-Based Permissions):** Click "Test Role Permissions" to show that standard users cannot perform admin actions.
     - **Mechanism 4 (Protection Against Repeated Login Attempts):** Click the sequential button **"Send Request (Click 1 of 4)"** &rarr; allowed (200 OK), click **"Send Request (Click 2 of 4)"** &rarr; allowed (200 OK), click **"Send Request (Click 3 of 4)"** &rarr; allowed (200 OK). On the 4th click, the system blocks the request with HTTP 429 and displays a clear red alert *"Rate Limit Exceeded: Maximum allowed demo requests reached. Access is blocked."* Click **"Reset Counter"** to instantly reset the rate limiter for re-testing.
     - **Mechanism 5 (Safe Evidence Uploads & Integrity Check):** Click "Test Dangerous File Block" to demonstrate rejection of `.exe` files.
   - Note the optional *Technical Details for Faculty* expander on each card.
10. **Open Learning & Cyber Laws:**
   - Navigate to **"Learning & Cyber Laws"**.
   - Review relevant provisions of the **Indian Information Technology Act, 2000** (Section 43, 65, 66, 66C, 66D), the **2008 Amendment**, and the **DPDP Act, 2023**.
   - Browse the 7-phase forensic evidence collection checklist and the 30+ term glossary.

---

## 9. Academic Deliverables & Documentation

Complete documentation is located in the `docs/` directory:

- [Project Report (`docs/project-report.md`)](file:///C:/Users/ishika%20poddar/.gemini/antigravity-ide/scratch/cybershield/docs/project-report.md): 30+ page formal academic engineering report with editable student details, abstract, literature review, architecture, threat model, test results, screenshot checklist, and future scope.
- [Security Controls Specification (`docs/security-controls.md`)](file:///C:/Users/ishika%20poddar/.gemini/antigravity-ide/scratch/cybershield/docs/security-controls.md): Deep-dive technical breakdown of all 10 security mechanisms, implementation file paths, threats mitigated, test procedures, and known limitations.
- [Demonstration Script (`docs/demo-script.md`)](file:///C:/Users/ishika%20poddar/.gemini/antigravity-ide/scratch/cybershield/docs/demo-script.md): 5–7 minute video recording walkthrough script with exact mouse clicks, inputs, and spoken narration.
- [Presentation Outline (`docs/presentation-outline.md`)](file:///C:/Users/ishika%20poddar/.gemini/antigravity-ide/scratch/cybershield/docs/presentation-outline.md): 10-slide academic viva defense slide deck outline.
- [Test Plan & Test Matrix (`docs/test-plan.md`)](file:///C:/Users/ishika%20poddar/.gemini/antigravity-ide/scratch/cybershield/docs/test-plan.md): Comprehensive positive, negative, and boundary test cases.

---

## 10. Known Academic Limitations & Boundary Conditions

1. **Pattern Heuristics vs. Live Traffic:** The network log analyzer operates on uploaded text logs using regex patterns; it is not a kernel-level packet inspection engine (e.g. Zeek/Snort) or live wire tap.
2. **Offline Header Inspection:** Email forensics inspects parsed RFC 5322 header strings from `.eml` files; it does not issue live DNS queries (TXT/DKIM records) to prevent accidental external reconnaissance during academic evaluations.
3. **Hash Authenticity Boundary:** SHA-256 cryptographic digests guarantee data integrity (detecting unintentional or malicious alteration), but do not independently establish origin authenticity or chain of custody without procedural and physical verification.
4. **Single-Node Deployment:** SQLite WAL mode is ideal for local evaluation, academic defense, and single-instance deployments; enterprise multi-region scale would utilize PostgreSQL with Citus clustering.

---

## 11. License & Academic Integrity

This project is authored exclusively for educational coursework in Computer Engineering and Cyber Forensics. Fictional names, IP addresses (`192.168.1.x`, `10.0.0.x`), and sample logs are utilized throughout to prevent privacy violations.
