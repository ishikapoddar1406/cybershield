# CyberShield — Security Controls & Hardening Specification

This document provides a technical audit of the **ten primary security mechanisms** engineered into **CyberShield**. Each entry details the architectural mechanism, codebase location, targeted threat vector (with OWASP/CWE mappings), automated test procedure, actual test outcome, and operational limitations.

---

## Control Matrix Summary

| ID | Control Name | Primary Codebase Location | Threat Addressed / OWASP | Actual Test Outcome |
|:---|:---|:---|:---|:---|
| **SC-01** | **Password Complexity & Bcrypt Hashing** | `server/src/utils/validators.js`, `server/src/routes/auth.routes.js` | CWE-521 (Weak Passwords), CWE-916 (Weak Hash) / OWASP A07 | **VERIFIED** (Cost 12, rejected weak passwords) |
| **SC-02** | **TOTP Multifactor Authentication** | `server/src/routes/auth.routes.js`, `server/src/utils/mfaCrypto.js`, `client/src/views/SecurityFeaturesView.jsx` | CWE-308 (Lack of MFA), CWE-287 (Improper Authentication), CWE-311 (Plaintext Secret) | **VERIFIED** (RFC 6238 TOTP, AES-256-GCM, 4-step UI, replay defense) |
| **SC-03** | **Server-Enforced Role-Based Access Control** | `server/src/middleware/auth.js`, `server/src/routes/*.js` | CWE-285 (Improper Authorization), CWE-639 (IDOR) / OWASP A01 | **VERIFIED** (401/403 enforced on all protected APIs) |
| **SC-04** | **Secure Session Management & Cookie Flags** | `server/src/middleware/auth.js`, `server/src/app.js` | CWE-384 (Session Fixation), CWE-1004 (Sensitive Cookie Without HttpOnly) | **VERIFIED** (SQLite session store, session regen) |
| **SC-05** | **Cryptographic Anti-CSRF Protection** | `server/src/middleware/security.js`, `client/src/services/api.js` | CWE-352 (Cross-Site Request Forgery) / OWASP A01 | **VERIFIED** (State-changing requests fail without token) |
| **SC-06** | **Authentication Rate Limiting & Account Lockout**| `server/src/middleware/rateLimiter.js`, `server/src/routes/security-lab.routes.js` | CWE-307 (Improper Restriction of Excessive Auth Attempts) | **VERIFIED** (3 allowed, 4th blocked with 429; 15-min lockout at 5th failure) |
| **SC-07** | **Schema Validation & Parameterized SQL Queries**| `server/src/utils/validators.js`, `server/src/db/database.js` | CWE-89 (SQL Injection), CWE-20 (Improper Input Validation) / OWASP A03 | **VERIFIED** (Prepared statements, zero concatenation) |
| **SC-08** | **Strict Upload Filtering & Isolation** | `server/src/middleware/upload.js`, `server/src/routes/evidence.routes.js` | CWE-434 (Unrestricted Upload), CWE-73 (External File Inclusion) | **VERIFIED** (Allowlist enforced, UUID renamed outside web root) |
| **SC-09** | **SHA-256 Evidence Hashing & Tamper Detection**| `server/src/utils/hash.js`, `server/src/routes/evidence.routes.js` | CWE-354 (Improper Validation of Integrity Check) | **VERIFIED** (Real-time discrepancy alert on byte alteration) |
| **SC-10** | **Security Headers, CORS & Tamper-Evident Audits**| `server/src/middleware/security.js`, `server/src/middleware/audit.js` | CWE-1021 (Clickjacking), CWE-778 (Insufficient Logging) | **VERIFIED** (Helmet headers active, all actions logged) |

---

## Detailed Control Specifications

### SC-01: Password Complexity Enforcement & Bcrypt Hashing

- **Implementation Location:**
  - Policy Definition: [`server/src/utils/validators.js`](file:///C:/Users/ishika%20poddar/.gemini/antigravity-ide/scratch/cybershield/server/src/utils/validators.js) (Line 18–35)
  - Hash Application: [`server/src/routes/auth.routes.js`](file:///C:/Users/ishika%20poddar/.gemini/antigravity-ide/scratch/cybershield/server/src/routes/auth.routes.js) (Line 105, 396, 445)
- **Threat Addressed:**
  - Dictionary attacks, rainbow table lookups, credential stuffing (CWE-521, CWE-916).
- **Technical Mechanism:**
  - Passwords submitted during registration or credential update are validated server-side using Zod schemas requiring:
    - Minimum length: 10 characters
    - At least one uppercase character (`[A-Z]`)
    - At least one lowercase character (`[a-z]`)
    - At least one numerical digit (`[0-9]`)
    - At least one special character (`[^A-Za-z0-9]`)
  - Passwords are salted and hashed using `bcryptjs` with a work factor cost of **12** (approximately 250ms computation time per attempt), ensuring resistance against GPU-accelerated hash cracking.
- **Test Procedure:**
  - Automated test: `npm test -- tests/auth.test.js`
  - Sends a payload with a 6-character password (`"weak1"`) to `/api/auth/register`.
- **Actual Test Outcome:**
  - Server returned `HTTP 400 Bad Request` with structured error array: `"Password must be at least 10 characters long"`.
  - Valid password (`"Admin@CyberShield2026!"`) hashed to a 60-character string starting with `$2a$12$`.
- **Limitations:**
  - Does not query external compromised credential databases (e.g., HaveIBeenPwned API) to maintain complete offline execution during academic evaluation.

---

### SC-02: TOTP-Based Multifactor Authentication (MFA)

- **Implementation Location:**
  - Backend Routes: [`server/src/routes/auth.routes.js`](file:///C:/Users/ishika%20poddar/.gemini/antigravity-ide/scratch/cybershield/server/src/routes/auth.routes.js) (`/mfa/setup`, `/verify-mfa`, `/mfa/cancel`, `/mfa/disable`)
  - Cryptography Utility: [`server/src/utils/mfaCrypto.js`](file:///C:/Users/ishika%20poddar/.gemini/antigravity-ide/scratch/cybershield/server/src/utils/mfaCrypto.js) (AES-256-GCM encryption/decryption)
  - Frontend UI: [`client/src/views/SecurityFeaturesView.jsx`](file:///C:/Users/ishika%20poddar/.gemini/antigravity-ide/scratch/cybershield/client/src/views/SecurityFeaturesView.jsx), [`client/src/views/LoginView.jsx`](file:///C:/Users/ishika%20poddar/.gemini/antigravity-ide/scratch/cybershield/client/src/views/LoginView.jsx)
- **Threat Addressed:**
  - Compromised user passwords, phishing attacks, credential replay, secret theft at rest (CWE-308, CWE-287, CWE-311).
- **Technical Mechanism:**
  - Implements the RFC 6238 standard via `otplib`.
  - Generates 32-character Base32 cryptographic secrets and standards-compliant `otpauth://totp/` URIs including CyberShield issuer and username.
  - Generates high-contrast enrollment QR codes using `qrcode` for Google Authenticator, Microsoft Authenticator, and Authy, alongside a fallback manual setup key with one-click copy.
  - Enforces pending enrollment session isolation: provisional secrets reside strictly in `req.session.pendingMfaSecret` and are never written to the user database until proven with a live 6-digit code.
  - Protects secrets at rest using **AES-256-GCM authenticated encryption** (`enc:<iv>:<tag>:<ciphertext>`) derived from a server-side environment master key.
  - Prevents replay attacks by persisting `last_used_totp_timestep` and rejecting reuse of the same token in the same 30-second window.
  - Limits verification failures to 5 attempts per session to mitigate brute-force guessing of the 6-digit token.
  - When MFA is enabled on an account, primary login yields `mfaRequired: true` and temporarily holds user ID in an unauthenticated pre-session state. Authentication is only finalized upon submitting a valid TOTP token.
  - MFA disable operation requires current account password verification to prevent unauthorized removal.
- **Test Procedure:**
  - Automated tests: `npm test -- tests/mfa-enrollment.test.js` and `npm test -- tests/auth.test.js`
- **Actual Test Outcome:**
  - Generating setup returns standard QR data URL and pending Base32 secret without enabling MFA in the database.
  - Submitting invalid or incomplete codes (`"123"`, `"000000"`) returns `HTTP 400 Bad Request` and leaves MFA disabled.
  - Submitting a valid live token enables MFA, encrypts the secret at rest with AES-256-GCM, and clears session pending state.
  - Replaying the same code in the same 30s window returns `HTTP 400 Bad Request: Authenticator code has already been used`.
  - Subsequent login challenges require valid 6-digit TOTP code before granting full authenticated session.
  - Disabling MFA requires password confirmation and cleanly wipes `totp_secret` and `last_used_totp_timestep`.
- **Limitations:**
  - Does not implement hardware FIDO2/WebAuthn security keys (e.g. YubiKey) to preserve zero-hardware accessibility for students.

---

### SC-03: Server-Enforced Role-Based Access Control (RBAC)

- **Implementation Location:**
  - Middleware: [`server/src/middleware/auth.js`](file:///C:/Users/ishika%20poddar/.gemini/antigravity-ide/scratch/cybershield/server/src/middleware/auth.js) (`requireAuth`, `requireRole`)
  - Route Handlers: [`server/src/routes/incident.routes.js`](file:///C:/Users/ishika%20poddar/.gemini/antigravity-ide/scratch/cybershield/server/src/routes/incident.routes.js), [`server/src/routes/user.routes.js`](file:///C:/Users/ishika%20poddar/.gemini/antigravity-ide/scratch/cybershield/server/src/routes/user.routes.js)
- **Threat Addressed:**
  - Vertical privilege escalation (reporters accessing admin functions) and horizontal privilege escalation (reporters accessing other reporters' cases) (CWE-285, CWE-639 / OWASP A01).
- **Technical Mechanism:**
  - Every API route validates the authenticated session.
  - `requireRole(['admin', 'investigator'])` inspects the server-verified role from the database, not client-supplied tokens or UI state.
  - Reporter data isolation: in `incident.routes.js`, when `req.user.role === 'reporter'`, database queries append `WHERE reporter_id = ?` parameterization, preventing IDOR.
- **Test Procedure:**
  - Automated test: `npm test -- tests/rbac.test.js`
- **Actual Test Outcome:**
  - Anonymous request to `/api/admin/users`: `HTTP 401 Unauthorized`.
  - Reporter request to `/api/admin/users`: `HTTP 403 Forbidden`.
  - Reporter fetching `/api/incidents`: only returned their own 1 case, completely omitting 4 other seeded cases.
- **Limitations:**
  - Uses static role hierarchies (`admin` > `investigator` > `reporter`); dynamic attribute-based access control (ABAC) is not implemented.

---

### SC-04: Secure Server-Side Session Management

- **Implementation Location:**
  - Middleware: [`server/src/middleware/auth.js`](file:///C:/Users/ishika%20poddar/.gemini/antigravity-ide/scratch/cybershield/server/src/middleware/auth.js) (`SqliteSessionStore`)
  - Configuration: [`server/src/app.js`](file:///C:/Users/ishika%20poddar/.gemini/antigravity-ide/scratch/cybershield/server/src/app.js)
- **Threat Addressed:**
  - Session hijacking, XSS token theft, session fixation (CWE-384, CWE-1004).
- **Technical Mechanism:**
  - Uses custom `SqliteSessionStore` persisting sessions in SQLite (`sessions` table).
  - Session cookie flags: `httpOnly: true` (prevents JavaScript access via `document.cookie`), `sameSite: 'lax'`, `secure: false` in development (set to `true` in production with HTTPS).
  - Calls `req.session.regenerate()` immediately following successful password and MFA verification, assigning a new random session ID to destroy pre-auth session fixation vectors.
- **Test Procedure:**
  - Automated test: `npm test -- tests/auth.test.js`
- **Actual Test Outcome:**
  - Verified `Set-Cookie` header attributes: `HttpOnly; Path=/; SameSite=Lax`.
  - Logging out immediately destroyed session record in database and cleared cookie.

---

### SC-05: Cryptographic Anti-CSRF Protection

- **Implementation Location:**
  - Generation & Verification: [`server/src/middleware/security.js`](file:///C:/Users/ishika%20poddar/.gemini/antigravity-ide/scratch/cybershield/server/src/middleware/security.js) (`generateCsrfToken`, `verifyCsrf`)
  - Client Attachment: [`client/src/services/api.js`](file:///C:/Users/ishika%20poddar/.gemini/antigravity-ide/scratch/cybershield/client/src/services/api.js)
- **Threat Addressed:**
  - Cross-Site Request Forgery (CWE-352 / OWASP A01).
- **Technical Mechanism:**
  - Uses `crypto.randomBytes(32).toString('hex')` to issue a cryptographically random token per authenticated session.
  - On every state-changing HTTP request (`POST`, `PUT`, `PATCH`, `DELETE`), middleware verifies that the incoming `X-CSRF-Token` header matches `req.session.csrfToken`.
  - Excludes safe idempotent methods (`GET`, `HEAD`, `OPTIONS`) and the public `/api/auth/login` endpoint.
- **Test Procedure:**
  - Automated test: `npm test -- tests/security-mechanisms.test.js`
- **Actual Test Outcome:**
  - POST request with valid `X-CSRF-Token`: `HTTP 200/201`.
  - POST request with omitted or forged `X-CSRF-Token`: `HTTP 403 Forbidden` (`{"success":false,"error":"CSRF token validation failed."}`).

---

### SC-06: Authentication Rate Limiting & Account Lockout

- **Implementation Location:**
  - Rate Limiter: [`server/src/middleware/rateLimiter.js`](file:///C:/Users/ishika%20poddar/.gemini/antigravity-ide/scratch/cybershield/server/src/middleware/rateLimiter.js) (`authRateLimiter`, `labRateLimiter`)
  - Account Lockout: [`server/src/routes/auth.routes.js`](file:///C:/Users/ishika%20poddar/.gemini/antigravity-ide/scratch/cybershield/server/src/routes/auth.routes.js) (Line 88–140)
  - Security Lab Endpoint: [`server/src/routes/security-lab.routes.js`](file:///C:/Users/ishika%20poddar/.gemini/antigravity-ide/scratch/cybershield/server/src/routes/security-lab.routes.js) (`/rate-limit-test`, `/reset-rate-limit`)
- **Threat Addressed:**
  - Brute-force password guessing, automated credential stuffing, resource exhaustion (CWE-307, CWE-799).
- **Technical Mechanism:**
  - **Production Auth Limiter:** IP-based rate limiting via `express-rate-limit`: maximum 10 login requests per 15-minute window per IP.
  - **Interactive Lab Rate Limiter:** Evaluates sequential clicks: allows precisely 3 requests per 60-second window. On the 4th click within the window, blocks access with `HTTP 429 Too Many Requests` and a clear structured response. A reset endpoint (`/reset-rate-limit`) clears the client IP key from the store on demand.
  - **Account-level lockout:** tracks `failed_login_attempts` in the `users` table. Upon 5 consecutive failed password attempts, sets `lockout_until = NOW() + 15 minutes` and logs a high-severity `SECURITY_ALERT` audit event. Any subsequent login attempt during the lockout period is denied immediately before executing bcrypt, saving server CPU resources.
- **Test Procedure:**
  - Automated tests: `npm test -- tests/mfa-enrollment.test.js` and `npm test -- tests/auth.test.js`
- **Actual Test Outcome:**
  - In the lab rate limiter test, sequential requests 1, 2, and 3 returned `HTTP 200 OK`. Request 4 returned `HTTP 429 Too Many Requests` with `{ success: false, error: 'Rate limit exceeded: Maximum 3 test requests allowed per minute.' }`. Calling reset endpoint immediately restored 200 OK responses.
  - 5 consecutive invalid logins resulted in database updating `failed_login_attempts = 5` and populating `lockout_until`. 6th attempt returned `HTTP 403 Forbidden` with exact remaining seconds countdown.

---

### SC-07: Schema Validation & Parameterized SQL Queries

- **Implementation Location:**
  - Schema Definitions: [`server/src/utils/validators.js`](file:///C:/Users/ishika%20poddar/.gemini/antigravity-ide/scratch/cybershield/server/src/utils/validators.js)
  - Database Driver: [`server/src/db/database.js`](file:///C:/Users/ishika%20poddar/.gemini/antigravity-ide/scratch/cybershield/server/src/db/database.js)
- **Threat Addressed:**
  - SQL Injection (SQLi), malformed payload crashes, buffer overflow (CWE-89, CWE-20 / OWASP A03).
- **Technical Mechanism:**
  - All incoming request bodies are validated against strict Zod schemas before hitting business logic.
  - Database operations use parameterized prepared statements (`db.prepare('... WHERE id = ?').get(id)`) exclusively.
  - No user-supplied string concatenation is used anywhere in SQL strings.
- **Test Procedure:**
  - Automated test: `npm test -- tests/security-mechanisms.test.js`
  - Injected classic SQL payload: `' OR '1'='1` as username in login and incident queries.
- **Actual Test Outcome:**
  - Parameter treated purely as string literal; database returned 0 matches, preventing injection bypass.

---

### SC-08: Strict Upload Filtering & Isolated Storage

- **Implementation Location:**
  - Multer Configuration: [`server/src/middleware/upload.js`](file:///C:/Users/ishika%20poddar/.gemini/antigravity-ide/scratch/cybershield/server/src/middleware/upload.js)
  - Storage Controller: [`server/src/routes/evidence.routes.js`](file:///C:/Users/ishika%20poddar/.gemini/antigravity-ide/scratch/cybershield/server/src/routes/evidence.routes.js)
- **Threat Addressed:**
  - Remote Code Execution (RCE), arbitrary file upload, web shell execution (CWE-434, CWE-73).
- **Technical Mechanism:**
  - Strict extension allowlist: `.txt`, `.log`, `.csv`, `.eml`, `.pdf`, `.png`, `.jpg`, `.jpeg`, `.pcap`, `.pcapng`.
  - Strict MIME-type validation matching allowed extensions.
  - File size restricted to a maximum of 10 MB per file.
  - Files are renamed upon disk write to random UUIDs (`EVD-[UUID].[ext]`).
  - Physical storage folder (`server/storage/evidence/`) is situated completely outside the Express static web root, rendering uploaded files inaccessible via direct URL guessing.
- **Test Procedure:**
  - Automated test: `npm test -- tests/security-mechanisms.test.js`
- **Actual Test Outcome:**
  - Attempting to upload `malware.exe`: rejected with `HTTP 400 Bad Request` (`"File type not permitted"`).
  - Attempting to upload a 15 MB file: rejected with `HTTP 400 Bad Request` (`"File size exceeds 10MB limit"`).
  - Valid `.log` file accepted and stored under UUID identifier.

---

### SC-09: SHA-256 Evidence Integrity Verification & Tamper Detection

- **Implementation Location:**
  - Stream Hashing: [`server/src/utils/hash.js`](file:///C:/Users/ishika%20poddar/.gemini/antigravity-ide/scratch/cybershield/server/src/utils/hash.js)
  - Verification & Tampering Routes: [`server/src/routes/evidence.routes.js`](file:///C:/Users/ishika%20poddar/.gemini/antigravity-ide/scratch/cybershield/server/src/routes/evidence.routes.js)
  - UI Verification: [`client/src/views/EvidenceView.jsx`](file:///C:/Users/ishika%20poddar/.gemini/antigravity-ide/scratch/cybershield/client/src/views/EvidenceView.jsx)
- **Threat Addressed:**
  - Evidence spoliation, accidental modification, unauthorized file manipulation (CWE-354).
- **Technical Mechanism:**
  - During evidence upload, the backend computes a SHA-256 cryptographic digest across the file stream and stores the 64-character hex hash in `evidence.sha256_hash`.
  - An append-only record is inserted into `chain_of_custody`.
  - When an investigator triggers verification, the backend reads the binary file from disk, computes a fresh digest, and compares it against the stored original.
  - A built-in educational tamper-simulation route appends malicious payload bytes (`[TAMPERED CONTENT]`) to the physical file. Re-verifying immediately detects the hash mismatch, updates status to `TAMPER DETECTED`, and generates an audit log entry.
- **Test Procedure:**
  - Automated test: `npm test -- tests/security-mechanisms.test.js`
- **Actual Test Outcome:**
  - Unmodified file verified with `match: true`, status `VERIFIED`.
  - After running `/api/evidence/:id/simulate-tamper`, verification returned `match: false`, status `TAMPER DETECTED`, with both expected and current digests displayed.

---

### SC-10: Security Headers, Restrictive CORS & Tamper-Evident Audits

- **Implementation Location:**
  - Helmet & CORS: [`server/src/middleware/security.js`](file:///C:/Users/ishika%20poddar/.gemini/antigravity-ide/scratch/cybershield/server/src/middleware/security.js)
  - Audit Helper: [`server/src/middleware/audit.js`](file:///C:/Users/ishika%20poddar/.gemini/antigravity-ide/scratch/cybershield/server/src/middleware/audit.js)
- **Threat Addressed:**
  - Clickjacking, MIME sniffing, unauthorized cross-origin requests, repudiation (CWE-1021, CWE-778).
- **Technical Mechanism:**
  - Helmet applies HTTP security headers:
    - `X-Frame-Options: DENY`
    - `X-Content-Type-Options: nosniff`
    - `Content-Security-Policy: default-src 'self'`
    - `Strict-Transport-Security` (in production)
  - CORS strictly configured to allow requests only from `http://localhost:5173` with credentials enabled.
  - Comprehensive audit trail records every sensitive event (`LOGIN_SUCCESS`, `LOGIN_FAILURE`, `ACCOUNT_LOCKED`, `EVIDENCE_UPLOAD`, `TAMPER_DETECTED`) into SQLite table `audit_logs` capturing timestamp, actor ID, actor role, IP address, and outcome.
- **Test Procedure:**
  - Inspect response headers using curl or browser DevTools.
- **Actual Test Outcome:**
  - `X-Frame-Options: DENY` present on all responses.
  - Audit logs populated with exact timestamps and user context.
