# CyberShield — Video Demonstration & Screen Recording Script

**Target Duration:** 5 to 7 Minutes  
**Audience:** Academic Project Evaluators, External Examiners, Cybersecurity Faculty  
**Presenter Roles:** Lead Developer / Presenter (Voiceover & Navigation)

---

## Technical Setup Before Starting Recording

1. **Terminal 1:** Ensure database is seeded: `npm run seed` in root.
2. **Terminal 2:** Launch unified dev servers: `npm run dev` in root.
3. **Browser:** Open Google Chrome or Brave to `http://localhost:5173` in an Incognito / Fresh Session.
4. **Window Resolution:** 1920x1080 (1080p), Full Screen, Zoom at 100%.
5. **Mobile Device or Authenticator App:** Have Google Authenticator or Microsoft Authenticator ready on hand.

---

## Phase-by-Phase Demonstration Script

### Scene 1: Introduction & Simple Dashboard Overview (0:00 – 0:45)

- **On-Screen Action:**
  - Browser displays `http://localhost:5173`. The CyberShield Login Portal is centered on screen.
  - Quick-fill buttons for demonstration accounts are visible: Administrator, Investigator, Reporter, and Test User.
  - Click the **"Investigator"** button (`investigator1` / `Investigator@2026!`) and sign in.
  - The browser loads the clean **Dashboard**. Point out the 6 clear sidebar sections:
    1. Dashboard
    2. Incident Reports
    3. Evidence & Hash Check
    4. Forensics Tools
    5. Security Features
    6. Learning & Cyber Laws
  - Show the clean statistics cards and the **"Recent Platform Activity"** stream in plain English (e.g. who logged in, verified evidence, or reported an incident).
- **Presenter Spoken Narration:**
  > *"Good morning, respected examiners. Today I am presenting **CyberShield**, a secure cybercrime reporting and digital forensics platform designed for our third-year engineering project.*  
  > *In cyber forensics, the integrity of evidence is critical. A court must know that evidence has never been altered, and the investigation software itself must be secure.*  
  > *We have organized the platform into six simple, beginner-friendly sections: Dashboard, Incident Reports, Evidence & Hash Check, Forensics Tools, Security Features, and Learning & Cyber Laws. Let's walk through the investigation workflow."*

---

### Scene 2: Submitting a Cybercrime Report & Role Access (0:45 – 1:45)

- **On-Screen Action:**
  - On the Dashboard, click the green **"Submit New Incident"** button.
  - A simple modal opens. Fill in:
    - Title: `"Phishing Email Impersonating University Portal"`
    - Category: `Phishing & Social Engineering`
    - Severity: `MEDIUM`
    - Description: `"Students received an email requesting urgent portal login with suspicious external links."`
  - Click **"Submit Incident Report"**. The modal closes and navigates to **"Incident Reports"**.
  - Click on the new report to view its details.
  - Add an investigation note: `"Initial review confirms suspicious sender. Requesting email headers for analysis."` Click **"Save Note"**.
- **Presenter Spoken Narration:**
  > *"First, any citizen or student can submit an incident. The system assigns a unique case number and records the timestamp.*  
  > *Investigators can review the docket, update the investigation status, and log chronological notes.*  
  > *Importantly, our backend enforces role-based access: reporters can only see reports they submitted, while investigators can view all assigned cases. This ensures privacy and confidentiality."*

---

### Scene 3: Evidence & Hash Check — Digital Fingerprints & Tamper Detection (1:45 – 2:50)

- **On-Screen Action:**
  - From the sidebar, click **"Evidence & Hash Check"**.
  - Point to the clear subtitle: *"Upload digital evidence files, calculate SHA-256 digital fingerprints, and verify that files have not been changed."*
  - Click **"Upload Evidence File"**. Choose a permitted sample log file (e.g., `samples/auth-bruteforce.log`) and select the incident.
  - Click **"Upload File & Compute Hash"**.
  - Show the uploaded file in the table with its authentic 64-character SHA-256 digital fingerprint and a green `VERIFIED` status badge.
  - Click **"Check Integrity"** &rarr; a green dialog confirms: *"File is authentic. The SHA-256 digital fingerprint matches the original recorded value."*
  - Now demonstrate the educational tamper test: click **"Test Tamper Check"**.
  - The badge immediately updates to an amber alert **"Tamper Detected"**.
  - Click **"Check Integrity"** again &rarr; an alert banner explains clearly that the current fingerprint does not match the original fingerprint because the file content was modified.
  - Click **"Restore Original File"** to restore the pristine file.
  - Click **"History of Evidence Handling"** to show who uploaded and checked the file.
- **Presenter Spoken Narration:**
  > *"In digital forensics, a SHA-256 hash acts as a unique digital fingerprint. If even a single letter in a file is changed, the entire fingerprint changes.*  
  > *When a file is uploaded, CyberShield stores it securely outside the public web folder and calculates its digital fingerprint.*  
  > *To demonstrate integrity checking for our practical exam, we built a safe tamper test. When we simulate an alteration, the system instantly detects the mismatch, alerts the investigator, and records the event in the history of evidence handling."*

---

### Scene 4: Forensics Tools — Network & Email Header Analysis (2:50 – 3:45)

- **On-Screen Action:**
  - Click **"Forensics Tools"** in the sidebar. Show the 2 intuitive tabs:
    1. **Network Log Analysis**
    2. **Email Header Analysis**
  - In **Network Log Analysis**:
    - Select the preset **"SSH & Login Repeated Attempts (Brute Force)"**.
    - Click **"Analyze Network Log"**.
    - Point out the plain-English finding: the tool identified repeated failed login attempts from IP `192.168.1.105` trying common administrative usernames.
  - Switch to the **Email Header Analysis** tab:
    - Select the preset **"Bank Impersonation Phishing Email"**.
    - Click **"Analyze Email Headers"**.
    - Point out the clear phishing warning: the sender display name claims to be `accounts@hdfcbank.com`, but the actual `Reply-To` address goes to an untrusted domain `support@secure-update-verify.com`.
- **Presenter Spoken Narration:**
  > *"Under Forensics Tools, we provide two practical analytical capabilities.*  
  > *First, Network Log Analysis checks recorded server activity for suspicious patterns like brute force logins or port scans without running dangerous live traffic.*  
  > *Second, Email Header Analysis checks email routing and highlights deceptive sender addresses, which is the primary indicator in phishing investigations."*

---

### Scene 5: Security Features — Five Core Protections (4:15 – 5:45)

- **On-Screen Action:**
  - Click **"Security Features"** in the sidebar.
  - Point to the subtitle: *"Demonstrations of five essential security mechanisms protecting user accounts and digital evidence."*
  - Walk through each of the 5 core protection cards:
    1. **Password Security:** Click **"Test Password Strength"** with a weak password, then with a strong password. Show the rules and explanation of bcrypt hashing.
    2. **Extra Login Verification (MFA / Authenticator):**
       - Click **"Set Up Authenticator"**.
       - Show the 4-step guided enrollment interface:
         - **Step 1:** QR code encoding `otpauth://totp/CyberShield:{username}` and fallback Manual Setup Key with one-click **"Copy Key"**.
         - **Step 2:** Open Google Authenticator or Microsoft Authenticator and find the entry.
         - **Step 3:** Enter the 6-digit numeric code into the verification input and click **"Verify and Enable MFA"**.
         - **Step 4:** Observe the success confirmation *"Authenticator enabled successfully"*. Show the active status badge.
       - Explain that secrets are encrypted with **AES-256-GCM** at rest, enrollment remains pending in the session until proven, and replay attacks are blocked.
       - *(Optional live test)* Log out and log back in to show the secondary MFA authenticator code challenge modal!
    3. **Role-Based Permissions:** Click **"Test Role Permissions"** &rarr; shows clear message: *"Access denied: your account does not have permission to do this."*
    4. **Protection Against Repeated Login Attempts (Rate Limiting):**
       - Click the sequential button:
         - **Click 1:** Button says *"Send Request (Click 1 of 4)"* &rarr; Result: **Request 1 Allowed (200 OK)**.
         - **Click 2:** Button says *"Send Request (Click 2 of 4)"* &rarr; Result: **Request 2 Allowed (200 OK)**.
         - **Click 3:** Button says *"Send Request (Click 3 of 4)"* &rarr; Result: **Request 3 Allowed (200 OK)**.
         - **Click 4:** Button says *"Send Request (Click 4 of 4)"* &rarr; Result: **Request 4 Blocked! (HTTP 429 Too Many Requests)** with message: *"Rate Limit Exceeded: Maximum allowed demo requests reached. Access is blocked."*
       - Click **"Reset Counter"** &rarr; shows notification that the rate limit bucket has been reset, allowing the examiner to re-test anytime.
    5. **Safe Evidence Uploads & Integrity Checking:** Click **"Test Dangerous File Block"** &rarr; shows that dangerous file types like `.exe` or `.bat` are safely rejected.
  - Expand one of the optional **"Technical details for faculty"** panels to show the underlying implementation (Bcrypt work factor 12, RFC 6238 TOTP, AES-256-GCM encryption, SQLite sessions, Zod validation).
- **Presenter Spoken Narration:**
  > *"Our syllabus requires demonstrating at least five core security mechanisms. On this page, each mechanism has a plain-English name, the problem it prevents, a live test button, and a clear explanation of what the result means.*  
  > *First, for Extra Login Verification, we have implemented genuine RFC 6238 Time-Based One-Time Passwords compatible with Google Authenticator and Microsoft Authenticator. The system guides the user through four steps: scanning the QR code or copying the fallback key, entering the 6-digit code, verifying on the backend, and encrypting the secret with AES-256-GCM. The enrollment stays isolated in the session until verified, preventing unverified or accidental MFA lockouts.*  
  > *Second, for Protection Against Repeated Requests, examiners can test the rate limit click-by-click. As you see: Click 1 is allowed, Click 2 is allowed, Click 3 is allowed, but on the 4th click, the server returns HTTP 429 and blocks further requests. We also provide a Reset Counter button so the examiner can re-test immediately.*  
  > *All five tests reflect actual server-side checks. For faculty evaluation, technical details like bcrypt work factors and SQLite prepared statements can be expanded with one click."*

---

### Scene 6: Learning & Cyber Laws (5:45 – 6:45)

- **On-Screen Action:**
  - Click **"Learning & Cyber Laws"** in the sidebar.
  - Browse through the tabs:
    - **Indian Cyber Laws:** Point out Section 43 (Damage to computer systems), Section 65 (Source code and evidence tampering), Section 66 (Hacking), Section 66C/66D (Identity theft and cheating), and the **Digital Personal Data Protection (DPDP) Act, 2023**.
    - **Forensic & IR Guides:** Show the 7-phase evidence collection procedure (Identification, Preservation, Collection, Examination, Analysis, Presentation, Review) and NIST Incident Response steps.
    - **Cybersecurity Glossary:** Search for a term like `"Hash"` or `"Chain of Custody"` to show the plain-English explanation.
- **Presenter Spoken Narration:**
  > *"Finally, our Learning & Cyber Laws section links technical investigation directly to Indian statutory frameworks.*  
  > *We cover the Information Technology Act of 2000, its 2008 Amendment, and the recent DPDP Act of 2023.*  
  > *It also includes standard forensic guidelines for handling digital evidence and an interactive 30-term glossary designed for engineering students."*

---

### Scene 7: Conclusion & Summary (6:45 – 7:15)

- **On-Screen Action:**
  - Return to the **Dashboard**.
  - Show the overall clean state of the system.
- **Presenter Spoken Narration:**
  > *"In conclusion, CyberShield provides a complete, easy-to-understand cybercrime investigation and forensics platform. It simplifies complex cybersecurity workflows into six intuitive sections while retaining ten authentic server-enforced security protections, real reputation threat intelligence integrations, and 27 automated integration tests with 100% pass rate.*  
  > *Thank you, and I look forward to your questions."*
