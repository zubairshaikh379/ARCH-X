// ─────────────────────────────────────────────────────────────────────────────
// IDENTITY & ACCESS MANAGEMENT — DEEP GUIDEBOOK (ARCH-X textbook-grade course)
//
// Content is authored as SEMANTIC HTML and rendered inside `.md-content`
// (see src/index.css) — h2/h3/p/ul/ol/li/pre/code/table/blockquote/strong are
// all styled there, so lessons render correctly without relying on Tailwind
// class scanning.
//
// Structure mirrors a real syllabus: Intro → AuthN vs AuthZ → Credentials →
// MFA → Sessions → SSO → OAuth/OIDC → SAML → JWT → Authorization Models →
// Attacks & Defenses. Each lesson ends with an 8-question knowledge check.
// ─────────────────────────────────────────────────────────────────────────────

import type { Course } from "../courses";

type Lesson = Course["lessons"][number];

// New optional Overview fields (spread into the identity-access course object).
export const META: Pick<
  Course,
  "prerequisites" | "learningOutcomes" | "mustKnow" | "commonGaps" | "prosCons" | "careerNotes"
> = {
  prerequisites: [
    "Comfort with the basics of how the web works: HTTP requests, headers, and the client→server round trip.",
    "A mental model of a request/response cycle — you've seen a browser send a request and get a page back.",
    "Rough familiarity with what a cookie is (a small value the browser stores and sends back).",
    "No prior identity or cryptography experience required — every concept is built from zero.",
  ],
  learningOutcomes: [
    "Explain the difference between authentication and authorization and place any control on the right side of that line.",
    "Read a JSON Web Token by decoding its three parts and reason about what its signature does and does not prove.",
    "Trace an OAuth 2.0 Authorization Code flow end to end and name what each redirect and token is for.",
    "Identify the classic identity flaws — alg:none, session fixation, token theft, IDOR — and state the concrete defense for each.",
    "Choose between RBAC and ABAC for a given access problem and apply least privilege deliberately.",
    "Map identity attacks to MITRE ATT&CK techniques so your findings are communicable across a SOC.",
  ],
  mustKnow: [
    "Authentication vs Authorization", "Credentials & Password Hashing (bcrypt/argon2)", "Salt & Pepper",
    "MFA / Factors (know/have/are)", "TOTP", "FIDO2 / WebAuthn", "Session ID", "Cookie flags (HttpOnly/Secure/SameSite)",
    "Session Fixation", "SSO", "OAuth 2.0", "OpenID Connect", "SAML", "JWT (header.payload.signature)",
    "alg:none", "RS256 vs HS256 confusion", "Least Privilege", "RBAC", "ABAC",
    "T1110 Brute Force", "T1078 Valid Accounts", "T1539 Steal Web Session Cookie", "T1556 Modify Authentication Process",
  ],
  commonGaps: [
    "Confusing authentication with authorization. Beginners say 'the token is valid' and stop — but a valid token can still lack permission for the action. Who you are and what you may do are separate checks.",
    "Believing a JWT is encrypted. It is signed, not encrypted — anyone can read the payload by base64-decoding it. Never put secrets in a JWT and never trust it without verifying the signature.",
    "Trusting the token's own algorithm header. The alg:none and RS256→HS256 confusion attacks exist precisely because libraries trusted attacker-controlled headers. The server must pin the expected algorithm.",
    "Ignoring session lifecycle. Logging in is easy to reason about; logout, expiry, rotation, and revocation are where real systems leak. A session that never dies is a credential that never dies.",
    "Treating MFA as unbreakable. SMS OTP is phishable and SIM-swappable; push fatigue defeats naive prompts. Phishing-resistant MFA (FIDO2) is a category, not a checkbox.",
    "Over-granting scope and roles. 'It works' with admin rights is not 'it's correct.' Least privilege is a discipline that is almost never applied retroactively unless it was designed in.",
  ],
  prosCons: {
    pros: [
      "Identity is the new perimeter: in a cloud/zero-trust world, controlling who-can-do-what is the highest-leverage security work there is.",
      "The standards are open and universal — OAuth, OIDC, SAML, and JWT skills transfer across every SaaS, cloud, and API you'll ever touch.",
      "Identity flaws are high-impact and interview-favourite: understanding them deeply sets you apart in AppSec, cloud, and SOC roles.",
    ],
    cons: [
      "The specs are dense and easy to misread; small misunderstandings (e.g. what a signature proves) become critical vulnerabilities.",
      "The ecosystem is a maze of overlapping standards and extensions — OAuth alone has many grant types, and misuse is common.",
      "Defenses depend on correct library configuration; a perfectly-designed protocol is still broken by one trusting default.",
    ],
  },
  careerNotes:
    "Identity & Access Management underpins Application Security, Cloud Security, and IAM Engineering roles, and it is core knowledge for SOC analysts triaging credential-access alerts. It is often the difference between a generalist and a specialist: engineers who truly understand OAuth/OIDC, SAML, and JWT are in constant demand as companies migrate to SaaS and zero-trust architectures. Certifications that map well to this material include CompTIA Security+, the (ISC)² CISSP domain on Identity and Access Management, Okta/Auth0 certifications for the applied SSO/OAuth side, and cloud-specific IAM tracks (AWS/Azure/GCP). Practical paths include PortSwigger Web Security Academy (authentication, JWT, OAuth labs) and TryHackMe/HackTheBox web modules. A realistic entry point is a security or platform engineering role touching authentication; specialists who can both attack and defend token systems advance quickly into AppSec and cloud security leadership.",
};

export const LESSONS: Lesson[] = [
  // ── LESSON 1 ───────────────────────────────────────────────────────────────
  {
    title: "01 // Identity Is the New Perimeter",
    summary: "Why access control moved to the center of security, and the vocabulary of identity: subjects, credentials, principals, and trust.",
    content: `
      <h2>The wall moved</h2>
      <p>For decades, security meant a <strong>network perimeter</strong>: a firewall around the office, and everything inside was trusted. That model is gone. Employees work from anywhere, applications live in the cloud, and services talk to services across the open internet. There is no inside anymore. What remains — the thing every request must prove — is <strong>identity</strong>. In modern security we say <em>identity is the new perimeter</em>.</p>

      <p>This course is about <strong>Identity and Access Management (IAM)</strong>: the discipline of proving <em>who</em> is making a request and deciding <em>what</em> they are allowed to do. Get it right and an attacker with your network still can't act. Get it wrong and an attacker with nothing but a stolen token owns everything.</p>

      <h3>The core vocabulary</h3>
      <p>Precise words prevent expensive mistakes. Learn these now; the whole course leans on them:</p>
      <table>
        <thead><tr><th>Term</th><th>Meaning</th></tr></thead>
        <tbody>
          <tr><td><strong>Subject / Principal</strong></td><td>The entity making a request — a user, a service, or a device.</td></tr>
          <tr><td><strong>Identity</strong></td><td>The set of attributes that describe a subject (username, email, employee ID).</td></tr>
          <tr><td><strong>Credential</strong></td><td>The secret or token a subject uses to prove its identity (password, key, token).</td></tr>
          <tr><td><strong>Authentication (AuthN)</strong></td><td>Proving the subject is who it claims to be.</td></tr>
          <tr><td><strong>Authorization (AuthZ)</strong></td><td>Deciding what an authenticated subject is permitted to do.</td></tr>
          <tr><td><strong>Identity Provider (IdP)</strong></td><td>The system that authenticates subjects and vouches for them.</td></tr>
        </tbody>
      </table>

      <h3>Why this is the highest-leverage security work</h3>
      <p>Almost every major breach involves identity somewhere: a phished password, a stolen session cookie, an over-privileged service account, a forged token. The MITRE ATT&CK tactic <strong>Credential Access</strong> exists precisely because credentials are the master key. Controlling identity doesn't just add a layer — it governs whether every other layer even applies to a given request.</p>

      <h3>Zero trust in one sentence</h3>
      <p>The modern architecture built on this idea is <strong>zero trust</strong>: <em>never trust, always verify.</em> No request is trusted because of where it came from; every request must present and prove identity, every time. The rest of this course is, in effect, the machinery that makes zero trust possible.</p>

      <blockquote>The single distinction this course returns to again and again: <strong>authentication is not authorization.</strong> "I know who you are" and "you're allowed to do that" are two separate questions, and confusing them is the root of an enormous share of real-world access vulnerabilities.</blockquote>

      <h3>What you will build toward</h3>
      <p>By the final lesson you will be able to take a token or a login flow, decode it, reason about what it proves, spot the classic flaws — <code>alg:none</code>, session fixation, over-broad scopes, missing authorization checks — and describe the correct fix, all in the shared language of MITRE ATT&CK.</p>
    `,
    quizzes: [
      { id: "iam-l1-q1", question: "What does the phrase 'identity is the new perimeter' mean?", options: ["Firewalls are now more important than ever", "With no trusted network boundary, every request must prove identity", "Passwords should be longer", "Networks no longer exist"], correctAnswerIndex: 1, explanation: "In cloud/remote/zero-trust environments there is no trusted inside; identity is what each request must prove." },
      { id: "iam-l1-q2", question: "What is a 'principal' (subject) in IAM terms?", options: ["The main firewall rule", "The entity making a request — a user, service, or device", "The database schema", "The encryption key"], correctAnswerIndex: 1, explanation: "A subject or principal is whoever/whatever is making the request and whose identity must be established." },
      { id: "iam-l1-q3", question: "How do authentication and authorization differ?", options: ["They are the same thing", "Authentication proves who you are; authorization decides what you may do", "Authentication is for admins only", "Authorization happens before authentication"], correctAnswerIndex: 1, explanation: "AuthN establishes identity; AuthZ governs permitted actions. They are distinct checks." },
      { id: "iam-l1-q4", question: "What is a credential?", options: ["A user's job title", "The secret or token used to prove identity", "A network port", "A log file"], correctAnswerIndex: 1, explanation: "A credential (password, key, token) is the evidence a subject presents to prove its claimed identity." },
      { id: "iam-l1-q5", question: "What does an Identity Provider (IdP) do?", options: ["Stores backups", "Authenticates subjects and vouches for their identity to other systems", "Blocks IP addresses", "Compiles code"], correctAnswerIndex: 1, explanation: "An IdP authenticates users and issues assertions/tokens that relying services trust." },
      { id: "iam-l1-q6", question: "Which MITRE ATT&CK tactic centers on stealing and abusing credentials?", options: ["Impact", "Credential Access", "Exfiltration", "Collection"], correctAnswerIndex: 1, explanation: "The Credential Access tactic covers techniques for obtaining account names and secrets." },
      { id: "iam-l1-q7", question: "What is the core principle of zero trust?", options: ["Trust the internal network fully", "Never trust, always verify — every request must prove identity", "Trust anyone with a VPN", "Disable authentication for speed"], correctAnswerIndex: 1, explanation: "Zero trust removes location-based trust; every request is verified regardless of origin." },
      { id: "iam-l1-q8", question: "Why is confusing AuthN with AuthZ dangerous?", options: ["It slows the server", "A valid identity can still be wrongly allowed actions it shouldn't perform", "It corrupts logs", "It has no real effect"], correctAnswerIndex: 1, explanation: "Treating 'authenticated' as 'authorized' leads to users performing actions they were never permitted to do." },
    ],
  },

  // ── LESSON 2 ───────────────────────────────────────────────────────────────
  {
    title: "02 // Authentication vs Authorization",
    summary: "The two questions every access decision answers, why they must be separate checks, and how confusing them creates real vulnerabilities.",
    content: `
      <h2>Two questions, never one</h2>
      <p>Every protected action answers two questions in order:</p>
      <ol>
        <li><strong>Authentication (AuthN):</strong> <em>Who are you?</em> — verifying the subject's claimed identity against a credential.</li>
        <li><strong>Authorization (AuthZ):</strong> <em>What are you allowed to do?</em> — checking the authenticated subject's permissions against the requested action.</li>
      </ol>
      <p>A useful analogy: at an airport, showing your passport is <strong>authentication</strong> (you prove you are who you say). Your boarding pass is <strong>authorization</strong> (it says which flight and seat you may board). A valid passport does not let you onto any plane you like — and that is the whole point.</p>

      <h3>Order matters</h3>
      <p>Authentication comes first: you cannot decide what an <em>anonymous</em> subject may do beyond "nothing sensitive." But — and this is the trap — authentication is <strong>not sufficient</strong>. After you know who someone is, you must <em>still</em> check whether this specific action is permitted for them. Skipping the second check is one of the most common web vulnerabilities in existence.</p>

      <h3>The classic failure: broken access control</h3>
      <p>Consider an API endpoint:</p>
      <pre><code>GET /api/invoices/1043
Authorization: Bearer &lt;valid token for user Alice&gt;</code></pre>
      <p>The token is valid — Alice is authenticated. But invoice 1043 belongs to <strong>Bob</strong>. If the server returns it simply because the token is valid, it authenticated but never <em>authorized</em>. This is <strong>Insecure Direct Object Reference (IDOR)</strong>, a form of <strong>broken access control</strong> — consistently at or near the top of the OWASP Top 10.</p>

      <blockquote>The bug is not that the token was fake. The token was perfectly real. The bug is that the server checked <em>who</em> Alice is and forgot to check <em>whether Alice may see this object</em>. AuthN passed; AuthZ was missing.</blockquote>

      <h3>Where each check lives</h3>
      <table>
        <thead><tr><th></th><th>Authentication</th><th>Authorization</th></tr></thead>
        <tbody>
          <tr><td>Question</td><td>Who are you?</td><td>What may you do?</td></tr>
          <tr><td>Mechanism</td><td>Passwords, MFA, tokens, certificates</td><td>Roles, permissions, policies, scopes</td></tr>
          <tr><td>Result</td><td>An authenticated identity</td><td>Allow or deny for a specific action</td></tr>
          <tr><td>Typical failure</td><td>Weak/stolen credentials</td><td>Missing checks, IDOR, privilege escalation</td></tr>
        </tbody>
      </table>

      <h3>A note on accountability</h3>
      <p>A third "A" often joins these two: <strong>accounting</strong> (or auditing) — recording what an identity actually did. Together they form <strong>AAA</strong>: Authentication, Authorization, Accounting. Detection and incident response depend on that third A; without a reliable audit trail, you can authenticate and authorize perfectly and still be unable to prove what happened after a breach.</p>
    `,
    quizzes: [
      { id: "iam-l2-q1", question: "In the airport analogy, what does the boarding pass represent?", options: ["Authentication", "Authorization", "Encryption", "A credential store"], correctAnswerIndex: 1, explanation: "The boarding pass grants access to a specific flight/seat — that's authorization, distinct from proving identity." },
      { id: "iam-l2-q2", question: "Which check must come first?", options: ["Authorization", "Authentication", "They are simultaneous and interchangeable", "Neither is required"], correctAnswerIndex: 1, explanation: "You must establish who the subject is before you can meaningfully decide what they may do." },
      { id: "iam-l2-q3", question: "What is an IDOR vulnerability?", options: ["A weak password", "Accessing another user's object because the server authenticated but never authorized the request", "An expired token", "A DNS misconfiguration"], correctAnswerIndex: 1, explanation: "Insecure Direct Object Reference lets a valid user reach objects they shouldn't, because the authorization check is missing." },
      { id: "iam-l2-q4", question: "A valid token requests invoice 1043, which belongs to another user, and the server returns it. What failed?", options: ["Authentication", "Authorization", "Encryption", "The network"], correctAnswerIndex: 1, explanation: "The identity was verified (AuthN passed); the missing per-object permission check is an authorization failure." },
      { id: "iam-l2-q5", question: "Which OWASP category does IDOR fall under?", options: ["Broken access control", "Cryptographic failures", "SQL injection", "Denial of service"], correctAnswerIndex: 0, explanation: "IDOR is a form of broken access control, consistently ranked at the top of the OWASP Top 10." },
      { id: "iam-l2-q6", question: "Which mechanisms typically implement authorization?", options: ["Passwords and MFA", "Roles, permissions, policies, and scopes", "TLS certificates only", "DNS records"], correctAnswerIndex: 1, explanation: "Authorization is expressed through roles, permissions, policies, and scopes applied to an authenticated identity." },
      { id: "iam-l2-q7", question: "What is the third 'A' in the AAA model?", options: ["Automation", "Accounting (auditing)", "Availability", "Anonymization"], correctAnswerIndex: 1, explanation: "AAA = Authentication, Authorization, Accounting; the last records what an identity actually did." },
      { id: "iam-l2-q8", question: "Why is 'the token is valid' an incomplete security statement?", options: ["Tokens are never valid", "Validity proves identity but not permission for the specific action", "Valid tokens can't be decoded", "It always means the user is an admin"], correctAnswerIndex: 1, explanation: "A valid token authenticates the subject but says nothing about whether the requested action is authorized." },
    ],
  },

  // ── LESSON 3 ───────────────────────────────────────────────────────────────
  {
    title: "03 // Credentials & Password Security",
    summary: "How passwords are (and aren't) stored, why hashing beats encryption, and what salting, peppering, and slow hashes actually defend against.",
    content: `
      <h2>The secret you should never store</h2>
      <p>A password is a shared secret. The cardinal rule of handling it: <strong>never store the password itself.</strong> If your database is stolen and it contains plaintext passwords, every account is instantly compromised — and because people reuse passwords, so are their accounts elsewhere. Instead, servers store a <strong>hash</strong>.</p>

      <h3>Hashing vs encryption — a critical distinction</h3>
      <p>These are not the same thing, and confusing them is a classic error:</p>
      <table>
        <thead><tr><th></th><th>Encryption</th><th>Hashing</th></tr></thead>
        <tbody>
          <tr><td>Reversible?</td><td>Yes, with the key</td><td>No — one-way by design</td></tr>
          <tr><td>Purpose</td><td>Keep data confidential but recoverable</td><td>Verify a value without storing it</td></tr>
          <tr><td>Used for passwords?</td><td>No — a stolen key exposes everything</td><td>Yes — you compare hashes, never recover the password</td></tr>
        </tbody>
      </table>
      <p>To verify a login, the server hashes what the user typed and compares it to the stored hash. It never needs — and must never keep — the original.</p>

      <h3>Why plain hashing isn't enough</h3>
      <p>Attackers precompute the hashes of billions of common passwords into lookup tables (including <strong>rainbow tables</strong>). If everyone's "password123" hashes to the same value, one lookup cracks them all. The defenses:</p>
      <ul>
        <li><strong>Salt</strong> — a unique random value added to each password before hashing. Because every user's salt differs, identical passwords produce different hashes, and precomputed tables become useless. Salts are stored alongside the hash; they are not secret, they are <em>unique</em>.</li>
        <li><strong>Pepper</strong> — an additional secret value (kept outside the database, e.g. in app config/HSM) mixed into the hash. If only the database leaks, the pepper still protects it.</li>
        <li><strong>Slow / adaptive hashes</strong> — algorithms deliberately expensive to compute, so that guessing billions of candidates becomes infeasible.</li>
      </ul>

      <h3>Use the right algorithm</h3>
      <p>Fast hashes like <strong>MD5</strong> and <strong>SHA-1</strong> are wrong for passwords precisely because they're fast — an attacker can try billions per second on a GPU. Use purpose-built <strong>slow, salted, adaptive</strong> password hashes:</p>
      <ul>
        <li><strong>bcrypt</strong> — battle-tested, tunable work factor.</li>
        <li><strong>scrypt</strong> — memory-hard, resisting GPU/ASIC attacks.</li>
        <li><strong>Argon2</strong> — modern winner of the Password Hashing Competition; the current default recommendation.</li>
        <li><strong>PBKDF2</strong> — older but still acceptable when configured with high iteration counts.</li>
      </ul>
      <pre><code>// Conceptual, not runnable
stored = argon2( salt + password + pepper, workFactor = high )
// login: recompute with the same salt/pepper and compare</code></pre>

      <h3>Credential stuffing and password policy</h3>
      <p>Because people reuse passwords, breaches feed <strong>credential stuffing</strong>: attackers replay leaked <code>email:password</code> pairs against other sites. Modern guidance (NIST SP 800-63B) favours <em>long passphrases</em>, checking new passwords against known-breached lists, and <strong>not</strong> forcing arbitrary periodic rotation — which just pushes users toward weak, predictable variations.</p>

      <blockquote>If you remember one thing: passwords are <strong>hashed, never encrypted</strong>; each hash is <strong>salted uniquely</strong>; and the hash function is deliberately <strong>slow</strong>. Fast, unsalted, or reversible password storage is a finding, not a design.</blockquote>
    `,
    quizzes: [
      { id: "iam-l3-q1", question: "How should passwords be stored on a server?", options: ["In plaintext for speed", "Encrypted with a shared key", "As salted, slow, one-way hashes", "Not stored but emailed to users"], correctAnswerIndex: 2, explanation: "Passwords are stored as salted hashes from a slow, one-way algorithm — never plaintext or reversible encryption." },
      { id: "iam-l3-q2", question: "What is the key difference between hashing and encryption?", options: ["Hashing is faster to reverse", "Encryption is reversible with a key; hashing is one-way", "They are identical", "Encryption cannot use keys"], correctAnswerIndex: 1, explanation: "Encryption can be decrypted with the key; a hash is a one-way function that cannot be reversed." },
      { id: "iam-l3-q3", question: "What does a salt accomplish?", options: ["It encrypts the database", "A unique per-user value makes identical passwords hash differently, defeating precomputed tables", "It speeds up hashing", "It stores the password in reverse"], correctAnswerIndex: 1, explanation: "A unique salt per user ensures identical passwords produce different hashes, neutralising rainbow tables." },
      { id: "iam-l3-q4", question: "How does a pepper differ from a salt?", options: ["A pepper is unique per user and stored with the hash", "A pepper is a secret kept outside the database, protecting hashes even if the DB leaks", "They are the same", "A pepper makes hashing reversible"], correctAnswerIndex: 1, explanation: "A pepper is a secret stored separately (not in the DB), so a database-only leak still can't be brute-forced easily." },
      { id: "iam-l3-q5", question: "Why are MD5 and SHA-1 poor choices for password hashing?", options: ["They are too slow", "They are fast, letting attackers try billions of guesses per second", "They cannot be salted", "They are encryption, not hashing"], correctAnswerIndex: 1, explanation: "Their speed is the problem: password hashes should be deliberately slow to resist mass guessing." },
      { id: "iam-l3-q6", question: "Which algorithm won the Password Hashing Competition and is the modern default?", options: ["MD5", "SHA-256", "Argon2", "Base64"], correctAnswerIndex: 2, explanation: "Argon2 is the modern, recommended memory-hard password hashing algorithm." },
      { id: "iam-l3-q7", question: "What is a rainbow table?", options: ["A colourful log format", "A precomputed lookup of hashes used to reverse unsalted password hashes quickly", "A firewall ruleset", "An encryption key store"], correctAnswerIndex: 1, explanation: "Rainbow tables precompute hash→password mappings; unique salts render them ineffective." },
      { id: "iam-l3-q8", question: "What does current NIST guidance recommend about forced periodic password rotation?", options: ["Force it every 30 days", "Avoid arbitrary rotation; prefer long passphrases and breach-list checks", "Never allow password changes", "Rotate only admin accounts hourly"], correctAnswerIndex: 1, explanation: "NIST SP 800-63B advises against arbitrary rotation, which drives weak variations; favour length and breach checking." },
    ],
  },

  // ── LESSON 4 ───────────────────────────────────────────────────────────────
  {
    title: "04 // Multi-Factor Authentication & the Factors of Proof",
    summary: "The three factor categories, why combining them matters, and how phishing-resistant MFA (FIDO2/WebAuthn) beats OTP and push.",
    content: `
      <h2>One secret is one point of failure</h2>
      <p>A password is a single secret. If it's phished, guessed, or leaked, the account falls. <strong>Multi-Factor Authentication (MFA)</strong> requires proof from more than one <em>independent category</em>, so a single compromise isn't enough.</p>

      <h3>The three factor categories</h3>
      <table>
        <thead><tr><th>Factor</th><th>Definition</th><th>Examples</th></tr></thead>
        <tbody>
          <tr><td><strong>Something you know</strong></td><td>A secret in your head</td><td>Password, PIN, security question</td></tr>
          <tr><td><strong>Something you have</strong></td><td>A physical object you possess</td><td>Phone (authenticator app), hardware key, smart card</td></tr>
          <tr><td><strong>Something you are</strong></td><td>A biometric trait</td><td>Fingerprint, face, iris</td></tr>
        </tbody>
      </table>
      <p>Real MFA combines <em>different categories</em>. A password plus a security question is <strong>not</strong> MFA — both are "something you know." A password (know) plus a hardware key (have) is. Location and behaviour are sometimes cited as extra factors ("somewhere you are," "something you do") but the classic three are what matter.</p>

      <h3>The common second factors, ranked by strength</h3>
      <ul>
        <li><strong>SMS one-time codes</strong> — better than nothing, but <em>weak</em>: vulnerable to SIM-swapping, SS7 interception, and phishing. Avoid where possible.</li>
        <li><strong>TOTP (authenticator apps)</strong> — a Time-based One-Time Password: a 6-digit code derived from a shared secret and the current time, refreshing every ~30 seconds (RFC 6238). No network needed; far better than SMS. Still <em>phishable</em> — a fake site can relay the code in real time.</li>
        <li><strong>Push notifications</strong> — convenient, but vulnerable to <strong>MFA fatigue / push bombing</strong>, where attackers spam approvals hoping the user taps "yes." Number-matching mitigates this.</li>
        <li><strong>FIDO2 / WebAuthn (passkeys, hardware keys)</strong> — the gold standard. Uses public-key cryptography bound to the site's origin, so a phishing site literally cannot obtain a usable response. This is <strong>phishing-resistant MFA</strong>.</li>
      </ul>

      <h3>How TOTP works, conceptually</h3>
      <pre><code>code = HOTP( sharedSecret, floor(currentUnixTime / 30) )
// same secret + same time window on both sides → same 6-digit code</code></pre>
      <p>The server and the app share a secret at enrolment (often via a QR code). Both compute the same code from the current time window, so no code travels the network in advance. But because the user can be tricked into typing the code into a fake page, TOTP is phishable in real time.</p>

      <h3>Why FIDO2 is different</h3>
      <p>With WebAuthn, the authenticator signs a challenge with a private key that <strong>never leaves the device</strong>, and the signature is <em>bound to the real origin</em> (e.g. <code>https://bank.com</code>). If the user is on <code>bank-login.evil.com</code>, the origin doesn't match and the authenticator won't produce a valid signature. Phishing the second factor becomes impossible, not just harder.</p>

      <blockquote>MFA is a category, not a checkbox. "We have MFA" via SMS is weak against a determined attacker; "we have phishing-resistant MFA" via FIDO2 changes the threat model. Know the difference and say which one you mean.</blockquote>

      <h3>Where MFA maps in ATT&CK</h3>
      <p>Attacks that defeat or bypass MFA — MFA fatigue, real-time phishing proxies, session-cookie theft that sidesteps re-authentication — relate to <strong>T1621 (Multi-Factor Authentication Request Generation)</strong> and to session/token techniques covered later. MFA raises the bar; it does not end the game.</p>
    `,
    quizzes: [
      { id: "iam-l4-q1", question: "What are the three classic authentication factor categories?", options: ["Know, have, are", "Read, write, execute", "Local, remote, cloud", "Low, medium, high"], correctAnswerIndex: 0, explanation: "The factors are something you know, something you have, and something you are." },
      { id: "iam-l4-q2", question: "Is 'password + security question' true MFA?", options: ["Yes, always", "No — both are 'something you know,' the same category", "Yes, if the question is hard", "Only for admins"], correctAnswerIndex: 1, explanation: "True MFA combines different categories; two 'know' factors is single-category, not multi-factor." },
      { id: "iam-l4-q3", question: "Why is SMS-based OTP considered a weak second factor?", options: ["It is too slow", "It is vulnerable to SIM-swapping, SS7 interception, and phishing", "It requires a hardware key", "It cannot be used on phones"], correctAnswerIndex: 1, explanation: "SMS can be intercepted or redirected via SIM-swap/SS7 and is phishable, making it the weakest common factor." },
      { id: "iam-l4-q4", question: "What does TOTP stand for and rely on?", options: ["Token-Only Transfer Protocol; relies on IP", "Time-based One-Time Password; relies on a shared secret and current time", "Two-Object Transfer Protocol; relies on cookies", "Total Password; relies on length"], correctAnswerIndex: 1, explanation: "TOTP (RFC 6238) derives a short-lived code from a shared secret and the current time window." },
      { id: "iam-l4-q5", question: "What is MFA fatigue (push bombing)?", options: ["A worn-out hardware key", "Spamming push approvals hoping the user eventually taps 'approve'", "A slow TOTP refresh", "A biometric error"], correctAnswerIndex: 1, explanation: "Attackers flood the victim with push prompts, betting they'll approve one out of annoyance or confusion." },
      { id: "iam-l4-q6", question: "Why is FIDO2/WebAuthn called phishing-resistant?", options: ["It uses a longer password", "Its signature is bound to the real site origin, so a phishing site can't get a valid response", "It hides the login page", "It uses SMS as backup"], correctAnswerIndex: 1, explanation: "WebAuthn binds the cryptographic response to the legitimate origin, so a fake domain cannot obtain a usable signature." },
      { id: "iam-l4-q7", question: "In WebAuthn, where does the private key live?", options: ["On the server", "In the URL", "On the authenticator device — it never leaves", "In the TOTP code"], correctAnswerIndex: 2, explanation: "The private key stays on the authenticator; only signatures are sent, never the key itself." },
      { id: "iam-l4-q8", question: "Which statement about MFA is most accurate?", options: ["All MFA is equally strong", "MFA is a category — SMS is weak, FIDO2 is phishing-resistant", "MFA makes accounts unbreakable", "MFA replaces the need for passwords entirely"], correctAnswerIndex: 1, explanation: "MFA strength varies widely; distinguishing weak (SMS) from phishing-resistant (FIDO2) is essential." },
    ],
  },

  // ── LESSON 5 ───────────────────────────────────────────────────────────────
  {
    title: "05 // Session Management & Cookies",
    summary: "How a stateless web remembers who you are after login, the anatomy of session cookies, and the flags and lifecycle that keep them safe.",
    content: `
      <h2>HTTP forgets — sessions remember</h2>
      <p>HTTP is <strong>stateless</strong>: each request stands alone, and the server doesn't inherently remember you logged in a moment ago. To avoid asking for your password on every click, the server issues a <strong>session</strong> after login and hands the browser a token that says "this is the user I just authenticated." That token is usually a <strong>session cookie</strong>.</p>

      <h3>The session lifecycle</h3>
      <ol>
        <li><strong>Login</strong> — user authenticates once.</li>
        <li><strong>Session creation</strong> — server generates a long, random <strong>session ID</strong> and stores the associated identity server-side (or in a signed token).</li>
        <li><strong>Cookie set</strong> — server returns <code>Set-Cookie: session=...</code>; the browser stores it.</li>
        <li><strong>Subsequent requests</strong> — the browser automatically sends the cookie; the server looks up the session and knows who you are.</li>
        <li><strong>Termination</strong> — the session ends on logout, expiry, or revocation.</li>
      </ol>

      <h3>Anatomy of a secure session cookie</h3>
      <pre><code>Set-Cookie: session=9f8b3c...a1; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=3600</code></pre>
      <p>Each attribute is a defense:</p>
      <table>
        <thead><tr><th>Flag</th><th>What it does</th><th>Attack it blunts</th></tr></thead>
        <tbody>
          <tr><td><strong>HttpOnly</strong></td><td>Hides the cookie from JavaScript (<code>document.cookie</code>)</td><td>Cookie theft via XSS</td></tr>
          <tr><td><strong>Secure</strong></td><td>Sends the cookie only over HTTPS</td><td>Interception on the wire</td></tr>
          <tr><td><strong>SameSite</strong></td><td>Restricts sending the cookie on cross-site requests (Lax/Strict)</td><td>Cross-Site Request Forgery (CSRF)</td></tr>
          <tr><td><strong>Max-Age / Expires</strong></td><td>Bounds how long the session lives</td><td>Indefinite reuse of a stolen cookie</td></tr>
        </tbody>
      </table>

      <h3>Session IDs must be unguessable</h3>
      <p>A session ID is a bearer credential: whoever holds it <em>is</em> the user, as far as the server is concerned. So it must be:</p>
      <ul>
        <li><strong>Long and random</strong> — generated by a cryptographically secure RNG, so it can't be guessed or brute-forced.</li>
        <li><strong>Rotated on privilege change</strong> — a new ID should be issued at login (this defeats session fixation, covered in Lesson 10).</li>
        <li><strong>Revocable</strong> — the server must be able to invalidate it on logout or compromise.</li>
      </ul>

      <h3>Timeouts: two kinds</h3>
      <ul>
        <li><strong>Idle timeout</strong> — ends the session after a period of inactivity (protects walk-away/abandoned sessions).</li>
        <li><strong>Absolute timeout</strong> — ends the session after a fixed maximum lifetime regardless of activity (bounds the value of a stolen session).</li>
      </ul>

      <h3>Server-side sessions vs stateless tokens</h3>
      <p>There are two broad models. In a <strong>server-side session</strong>, the cookie holds only a random ID and the real state lives on the server — easy to revoke, but requires server storage. In a <strong>stateless token</strong> model (e.g. a JWT, Lesson 9), the identity data travels inside the token itself — no server lookup, but revocation is harder. Each has trade-offs you'll weigh throughout this course.</p>

      <blockquote>A session that never expires and cannot be revoked is a password that can't be changed. Lifecycle — creation, rotation, timeout, revocation — is where session security is won or lost, not just at login.</blockquote>
    `,
    quizzes: [
      { id: "iam-l5-q1", question: "Why are sessions needed on the web?", options: ["To encrypt DNS", "Because HTTP is stateless and the server otherwise forgets you between requests", "To speed up images", "To store passwords in the browser"], correctAnswerIndex: 1, explanation: "HTTP doesn't retain state, so a session token lets the server recognise an already-authenticated user across requests." },
      { id: "iam-l5-q2", question: "What does the HttpOnly cookie flag prevent?", options: ["Sending the cookie over HTTP", "JavaScript from reading the cookie, blunting XSS-based theft", "The cookie from expiring", "Cross-site requests"], correctAnswerIndex: 1, explanation: "HttpOnly hides the cookie from document.cookie, so XSS scripts can't exfiltrate it." },
      { id: "iam-l5-q3", question: "What does the Secure flag ensure?", options: ["The cookie is encrypted at rest", "The cookie is only sent over HTTPS", "The cookie can't be deleted", "The session never expires"], correctAnswerIndex: 1, explanation: "Secure restricts transmission of the cookie to HTTPS, preventing plaintext interception." },
      { id: "iam-l5-q4", question: "Which cookie attribute primarily mitigates CSRF?", options: ["HttpOnly", "Secure", "SameSite", "Max-Age"], correctAnswerIndex: 2, explanation: "SameSite limits when cookies are sent on cross-site requests, reducing CSRF exposure." },
      { id: "iam-l5-q5", question: "Why must a session ID be long and randomly generated?", options: ["To look impressive", "It is a bearer credential; a guessable ID lets attackers impersonate users", "To save storage", "To match the username"], correctAnswerIndex: 1, explanation: "Anyone holding the session ID is treated as the user, so it must be unguessable/un-brute-forceable." },
      { id: "iam-l5-q6", question: "What is the difference between idle and absolute timeout?", options: ["They are the same", "Idle ends after inactivity; absolute ends after a fixed maximum lifetime regardless of activity", "Idle is for admins only", "Absolute never expires"], correctAnswerIndex: 1, explanation: "Idle timeout tracks inactivity; absolute timeout caps total session lifetime no matter how active the user is." },
      { id: "iam-l5-q7", question: "A key advantage of server-side sessions over stateless tokens is…", options: ["They never need storage", "They are easy to revoke instantly", "They can't be stolen", "They require no cookie"], correctAnswerIndex: 1, explanation: "Because state lives on the server, a server-side session can be invalidated immediately; stateless tokens are harder to revoke." },
      { id: "iam-l5-q8", question: "Why should the session ID be rotated at login?", options: ["To confuse users", "To defeat session fixation, where an attacker pre-sets a victim's session ID", "To reduce cookie size", "It should never be rotated"], correctAnswerIndex: 1, explanation: "Issuing a fresh ID upon authentication invalidates any attacker-planted ID, defeating session fixation." },
    ],
  },

  // ── LESSON 6 ───────────────────────────────────────────────────────────────
  {
    title: "06 // Single Sign-On: One Login, Many Apps",
    summary: "How SSO lets one authentication serve many applications, the trust relationships behind it, and the security trade-offs it creates.",
    content: `
      <h2>Log in once, use everything</h2>
      <p><strong>Single Sign-On (SSO)</strong> lets a user authenticate <em>once</em> with a central <strong>Identity Provider (IdP)</strong> and then access many separate applications without logging in again to each. If you've clicked "Sign in with Google" or logged into your work email and found every internal tool already unlocked, you've used SSO.</p>

      <h3>The three players</h3>
      <table>
        <thead><tr><th>Role</th><th>Who it is</th></tr></thead>
        <tbody>
          <tr><td><strong>Subject / User</strong></td><td>The person trying to access an application.</td></tr>
          <tr><td><strong>Identity Provider (IdP)</strong></td><td>The central authority that authenticates the user and vouches for them (e.g. Okta, Azure AD/Entra ID, Google).</td></tr>
          <tr><td><strong>Service Provider (SP) / Relying Party (RP)</strong></td><td>The application the user wants to use, which trusts the IdP's word.</td></tr>
        </tbody>
      </table>

      <h3>The core idea: delegated trust</h3>
      <p>The application no longer checks your password itself. Instead it <strong>delegates authentication</strong> to the IdP. After you authenticate, the IdP issues a signed <strong>assertion</strong> or <strong>token</strong> — a cryptographically signed statement saying "I, the IdP, have authenticated this user." The application verifies the signature and trusts it. The heavy lifting of authentication happens once, in one trusted place.</p>

      <h3>Why organisations love SSO</h3>
      <ul>
        <li><strong>Fewer passwords</strong> — users manage one strong credential, not dozens of weak reused ones.</li>
        <li><strong>Central control</strong> — disabling one IdP account instantly cuts access to every connected app (crucial for offboarding).</li>
        <li><strong>Consistent policy</strong> — MFA, password rules, and conditional access are enforced in one place.</li>
        <li><strong>Better audit</strong> — a single authentication log across the estate.</li>
      </ul>

      <h3>The trade-off: a concentrated target</h3>
      <p>SSO's strength is also its risk. The IdP becomes the <strong>keys to the kingdom</strong>: compromise the user's IdP session or the IdP itself, and the attacker reaches every connected application at once. This is why IdP accounts demand the strongest protection — phishing-resistant MFA, tight session controls, and heavy monitoring. A stolen IdP session cookie is far more valuable than any single app's.</p>

      <blockquote>SSO trades many small risks (dozens of separate logins) for one big, well-defended one (the IdP). That's usually a good trade — but only if the IdP is defended like the crown jewels it is.</blockquote>

      <h3>How SSO is actually implemented</h3>
      <p>SSO is a <em>pattern</em>; the protocols that implement it are what the next lessons cover:</p>
      <ul>
        <li><strong>SAML</strong> — XML-based assertions, dominant in enterprise/workforce SSO.</li>
        <li><strong>OpenID Connect (OIDC)</strong> — a modern identity layer on top of OAuth 2.0, dominant in consumer and modern app SSO ("Sign in with…").</li>
      </ul>
      <p>Both achieve the same goal — the IdP authenticates and issues a signed token the SP trusts — using different formats and flows.</p>
    `,
    quizzes: [
      { id: "iam-l6-q1", question: "What does Single Sign-On (SSO) provide?", options: ["One password per application", "One authentication that grants access to many applications", "Automatic encryption of all traffic", "A faster network"], correctAnswerIndex: 1, explanation: "SSO lets a user authenticate once with a central IdP and access many apps without re-logging in." },
      { id: "iam-l6-q2", question: "In SSO, what is the Identity Provider (IdP)?", options: ["The application the user wants to use", "The central authority that authenticates the user and vouches for them", "The user's browser", "A firewall"], correctAnswerIndex: 1, explanation: "The IdP authenticates the user and issues signed assertions/tokens that applications trust." },
      { id: "iam-l6-q3", question: "What is the Service Provider (Relying Party)?", options: ["The IdP", "The application that trusts the IdP's authentication", "The password database", "The DNS server"], correctAnswerIndex: 1, explanation: "The SP/RP is the application that delegates authentication to, and trusts, the IdP." },
      { id: "iam-l6-q4", question: "What does 'delegated trust' mean in SSO?", options: ["The app checks passwords itself", "The app relies on the IdP's signed assertion instead of checking credentials directly", "The user shares their password with every app", "The IdP is never trusted"], correctAnswerIndex: 1, explanation: "The application delegates authentication to the IdP and trusts its signed statement about the user." },
      { id: "iam-l6-q5", question: "Which is a major security BENEFIT of SSO?", options: ["More passwords to remember", "Instant central offboarding — disabling one account cuts access everywhere", "Weaker password policies", "No audit logs"], correctAnswerIndex: 1, explanation: "Central control means disabling the IdP account immediately revokes access to all connected apps." },
      { id: "iam-l6-q6", question: "What is the main RISK introduced by SSO?", options: ["Slower logins", "The IdP becomes a concentrated 'keys to the kingdom' target", "Too many passwords", "No single sign-out"], correctAnswerIndex: 1, explanation: "Compromising the IdP or its session grants access to every connected application at once." },
      { id: "iam-l6-q7", question: "Which two protocols most commonly implement SSO?", options: ["FTP and Telnet", "SAML and OpenID Connect (OIDC)", "SMTP and POP3", "TCP and UDP"], correctAnswerIndex: 1, explanation: "SAML dominates enterprise SSO; OIDC (atop OAuth 2.0) dominates modern/consumer SSO." },
      { id: "iam-l6-q8", question: "Because the IdP is so valuable, its accounts should be protected with…", options: ["A shorter password", "The strongest controls, e.g. phishing-resistant MFA and heavy monitoring", "No MFA to speed logins", "Shared credentials"], correctAnswerIndex: 1, explanation: "The IdP is the crown jewels; it warrants the strongest MFA, session controls, and monitoring." },
    ],
  },

  // ── LESSON 7 ───────────────────────────────────────────────────────────────
  {
    title: "07 // OAuth 2.0 & OpenID Connect",
    summary: "The difference between delegated authorization (OAuth) and authentication (OIDC), the Authorization Code flow, and the tokens involved.",
    content: `
      <h2>Authorization for the connected web</h2>
      <p><strong>OAuth 2.0</strong> is the framework that lets you grant one application limited access to your data in <em>another</em> — without giving it your password. When an app asks "can this app access your Google Drive files?", that's OAuth. Crucially, OAuth is about <strong>delegated authorization</strong> (access to resources), not authentication.</p>

      <h3>The four roles</h3>
      <table>
        <thead><tr><th>Role</th><th>Meaning</th></tr></thead>
        <tbody>
          <tr><td><strong>Resource Owner</strong></td><td>The user who owns the data.</td></tr>
          <tr><td><strong>Client</strong></td><td>The application requesting access on the user's behalf.</td></tr>
          <tr><td><strong>Authorization Server</strong></td><td>Authenticates the user and issues tokens (often the IdP).</td></tr>
          <tr><td><strong>Resource Server</strong></td><td>The API holding the protected data, which accepts the token.</td></tr>
        </tbody>
      </table>

      <h3>The Authorization Code flow (the important one)</h3>
      <p>This is the most secure and common flow for web/mobile apps:</p>
      <ol>
        <li>The client redirects the user to the authorization server with its <code>client_id</code>, requested <strong>scopes</strong>, a <code>redirect_uri</code>, and a <code>state</code> value.</li>
        <li>The user authenticates and <strong>consents</strong> to the requested scopes.</li>
        <li>The authorization server redirects back to the <code>redirect_uri</code> with a short-lived <strong>authorization code</strong>.</li>
        <li>The client exchanges that code — <em>server-to-server, with its client secret</em> — for an <strong>access token</strong> (and often a refresh token).</li>
        <li>The client calls the resource server API, presenting the access token.</li>
      </ol>
      <p>Why the extra code step? So the powerful access token is never exposed in the browser/URL — only the short-lived, single-use code is. Public clients (mobile/SPA) add <strong>PKCE</strong> (Proof Key for Code Exchange) to bind the code to the requester and stop code interception.</p>

      <h3>The tokens</h3>
      <ul>
        <li><strong>Access token</strong> — presented to the API to access resources; short-lived; scoped.</li>
        <li><strong>Refresh token</strong> — long-lived; used to obtain new access tokens without re-prompting the user; must be stored very carefully.</li>
        <li><strong>Scopes</strong> — the granular permissions requested (e.g. <code>read:files</code>), the OAuth expression of least privilege.</li>
        <li><strong>state</strong> — a random value echoed back to prevent CSRF on the callback.</li>
      </ul>

      <h3>OAuth is not authentication — OIDC fixes that</h3>
      <p>Here's the trap that caused countless real bugs: an access token says "the bearer may access this resource." It does <strong>not</strong> reliably say <em>who the user is</em>. Apps that used OAuth access tokens as proof of login ("this token works, so you must be logged in") were exploitable. <strong>OpenID Connect (OIDC)</strong> is a thin identity layer on top of OAuth 2.0 that adds a proper authentication answer: the <strong>ID token</strong>, a JWT containing verified claims about the user (subject <code>sub</code>, issuer <code>iss</code>, audience <code>aud</code>, expiry <code>exp</code>).</p>

      <table>
        <thead><tr><th></th><th>OAuth 2.0</th><th>OpenID Connect</th></tr></thead>
        <tbody>
          <tr><td>Answers</td><td>What may this app access? (authorization)</td><td>Who is this user? (authentication)</td></tr>
          <tr><td>Key token</td><td>Access token</td><td>ID token (a JWT)</td></tr>
          <tr><td>Use it for</td><td>Calling APIs on the user's behalf</td><td>Logging the user in ("Sign in with…")</td></tr>
        </tbody>
      </table>

      <blockquote>Remember the one-liner: <strong>OAuth is for authorization; OIDC is for authentication.</strong> Using a raw OAuth access token as proof of identity is a classic, dangerous mistake — use the OIDC ID token for that.</blockquote>
    `,
    quizzes: [
      { id: "iam-l7-q1", question: "What problem does OAuth 2.0 primarily solve?", options: ["Encrypting email", "Granting an app limited access to your data elsewhere without sharing your password", "Speeding up DNS", "Storing passwords"], correctAnswerIndex: 1, explanation: "OAuth enables delegated authorization: an app gets scoped access to resources without receiving your credentials." },
      { id: "iam-l7-q2", question: "In OAuth, who is the 'resource owner'?", options: ["The API server", "The user who owns the data", "The authorization server", "The client app"], correctAnswerIndex: 1, explanation: "The resource owner is the user who owns the protected data and grants access to it." },
      { id: "iam-l7-q3", question: "In the Authorization Code flow, why exchange a code instead of returning the token directly?", options: ["To make it slower", "So the powerful access token isn't exposed in the browser/URL — only a short-lived code is", "Because tokens are illegal in URLs", "To avoid using HTTPS"], correctAnswerIndex: 1, explanation: "The code step keeps the access token off the front channel; it's exchanged server-to-server for the token." },
      { id: "iam-l7-q4", question: "What is PKCE used for?", options: ["Encrypting the database", "Binding the authorization code to the requester to prevent code interception, especially for public clients", "Storing refresh tokens", "Replacing HTTPS"], correctAnswerIndex: 1, explanation: "PKCE (Proof Key for Code Exchange) protects public clients (SPA/mobile) from authorization code interception." },
      { id: "iam-l7-q5", question: "What are OAuth scopes?", options: ["Encryption algorithms", "Granular permissions the client requests — OAuth's expression of least privilege", "Log file locations", "Session timeouts"], correctAnswerIndex: 1, explanation: "Scopes define the specific, limited permissions granted, embodying least privilege in OAuth." },
      { id: "iam-l7-q6", question: "What is the purpose of the 'state' parameter?", options: ["To store the password", "A random value echoed back to prevent CSRF on the OAuth callback", "To set the timezone", "To choose the algorithm"], correctAnswerIndex: 1, explanation: "The state value ties the callback to the original request, mitigating CSRF on the redirect." },
      { id: "iam-l7-q7", question: "What does OpenID Connect add on top of OAuth 2.0?", options: ["Faster networking", "An identity layer with an ID token that answers 'who is the user?'", "A new firewall", "Password storage"], correctAnswerIndex: 1, explanation: "OIDC adds authentication via the ID token (a JWT with verified user claims) atop OAuth's authorization." },
      { id: "iam-l7-q8", question: "Why is using an OAuth access token as proof of login dangerous?", options: ["Access tokens expire too fast", "An access token grants resource access but doesn't reliably prove who the user is — use the OIDC ID token", "Access tokens can't be signed", "It always causes a crash"], correctAnswerIndex: 1, explanation: "OAuth access tokens are about authorization, not identity; authentication should use the OIDC ID token." },
    ],
  },

  // ── LESSON 8 ───────────────────────────────────────────────────────────────
  {
    title: "08 // SAML: Enterprise SSO in XML",
    summary: "How SAML assertions carry signed identity between IdP and SP, the SP-initiated flow, and why XML signatures are both its strength and its weak point.",
    content: `
      <h2>The enterprise workhorse</h2>
      <p><strong>SAML (Security Assertion Markup Language)</strong> is the XML-based standard that has powered enterprise/workforce SSO for years. When you log into a corporate SaaS app (Salesforce, Workday) and it bounces you to your company's login page and back, that's usually SAML 2.0 at work.</p>

      <h3>The building block: the assertion</h3>
      <p>The heart of SAML is the <strong>assertion</strong> — a signed XML document in which the IdP states facts about the authenticated user. A typical assertion contains:</p>
      <ul>
        <li><strong>Subject</strong> — who the user is (a NameID, e.g. their email).</li>
        <li><strong>Conditions</strong> — validity window (<code>NotBefore</code>/<code>NotOnOrAfter</code>) and the intended <strong>audience</strong> (which SP it's for).</li>
        <li><strong>Authentication statement</strong> — when and how the user authenticated.</li>
        <li><strong>Attributes</strong> — extra claims like group memberships or roles.</li>
        <li><strong>Signature</strong> — an XML digital signature over the assertion, proving the IdP issued it and it wasn't altered.</li>
      </ul>

      <h3>The SP-initiated flow</h3>
      <ol>
        <li>The user visits the SP (the application) and is unauthenticated.</li>
        <li>The SP generates a <strong>SAML AuthnRequest</strong> and redirects the user's browser to the IdP.</li>
        <li>The IdP authenticates the user (password, MFA, etc.).</li>
        <li>The IdP returns a signed <strong>SAML Response</strong> containing the assertion, POSTed back to the SP's Assertion Consumer Service (ACS) URL via the browser.</li>
        <li>The SP <strong>validates the signature</strong>, checks conditions/audience, and logs the user in.</li>
      </ol>
      <p>Note the browser is the messenger: SAML rides the <em>front channel</em>, so the assertion passes through the user's browser — which is exactly why the signature is essential.</p>

      <h3>Why the signature is everything</h3>
      <p>Because the assertion travels through the untrusted browser, the SP can only trust it if the IdP's signature verifies. The signature is SAML's entire security model. And that is also its historic weak point:</p>
      <ul>
        <li><strong>Missing signature validation</strong> — SPs that accepted assertions without properly verifying the signature could be fed forged ones.</li>
        <li><strong>XML Signature Wrapping (XSW)</strong> — attackers restructure the XML so the signature validates against one element while the SP reads attacker-controlled data from another. A notorious class of SAML bugs.</li>
        <li><strong>Audience/expiry not checked</strong> — replaying a valid assertion meant for another SP, or reusing an expired one.</li>
      </ul>

      <h3>SAML vs OIDC</h3>
      <table>
        <thead><tr><th></th><th>SAML 2.0</th><th>OpenID Connect</th></tr></thead>
        <tbody>
          <tr><td>Format</td><td>XML</td><td>JSON / JWT</td></tr>
          <tr><td>Era / niche</td><td>Enterprise / workforce SSO</td><td>Modern web, mobile, consumer</td></tr>
          <tr><td>Token</td><td>SAML assertion</td><td>ID token (JWT)</td></tr>
          <tr><td>Transport</td><td>Browser POST/redirect (front channel)</td><td>HTTP redirects + token endpoint</td></tr>
        </tbody>
      </table>
      <p>Both deliver signed identity from an IdP to an SP; SAML does it in XML for legacy enterprise ecosystems, OIDC in JSON/JWT for modern ones. Many organisations run both.</p>

      <blockquote>SAML's security lives and dies by <strong>signature validation</strong> plus checking <strong>audience and time conditions</strong>. Most SAML vulnerabilities are not flaws in the standard but in SPs that verified signatures loosely — or not at all.</blockquote>
    `,
    quizzes: [
      { id: "iam-l8-q1", question: "What format does SAML use?", options: ["JSON", "XML", "YAML", "Binary"], correctAnswerIndex: 1, explanation: "SAML is an XML-based standard; assertions and messages are XML documents." },
      { id: "iam-l8-q2", question: "What is a SAML assertion?", options: ["A firewall rule", "A signed XML document in which the IdP states facts about the authenticated user", "An encryption key", "A cookie flag"], correctAnswerIndex: 1, explanation: "The assertion is the signed XML statement carrying subject, conditions, and attributes from the IdP." },
      { id: "iam-l8-q3", question: "In SP-initiated SAML, what does the SP send to start the flow?", options: ["A password", "A SAML AuthnRequest redirecting the browser to the IdP", "An access token", "A refresh token"], correctAnswerIndex: 1, explanation: "The SP generates an AuthnRequest and redirects the user to the IdP to authenticate." },
      { id: "iam-l8-q4", question: "Why is the signature critical in SAML?", options: ["It compresses the XML", "The assertion travels through the untrusted browser, so only its signature lets the SP trust it", "It encrypts the network", "It sets the session timeout"], correctAnswerIndex: 1, explanation: "Because the front-channel assertion passes through the browser, the SP must verify the IdP's signature to trust it." },
      { id: "iam-l8-q5", question: "What is XML Signature Wrapping (XSW)?", options: ["A compression method", "Restructuring the XML so the signature validates on one element while the SP reads attacker data from another", "A logging format", "A password hashing scheme"], correctAnswerIndex: 1, explanation: "XSW tricks the SP into validating a legitimate signature while processing attacker-controlled elements." },
      { id: "iam-l8-q6", question: "Which assertion condition prevents replaying it to a different application?", options: ["The subject", "The audience restriction", "The signature algorithm", "The attribute list"], correctAnswerIndex: 1, explanation: "The audience condition binds an assertion to a specific SP, so it can't be replayed elsewhere." },
      { id: "iam-l8-q7", question: "Compared to OIDC, SAML is most associated with…", options: ["Consumer mobile apps", "Enterprise/workforce SSO", "IoT devices", "Cryptocurrency"], correctAnswerIndex: 1, explanation: "SAML dominates enterprise/workforce SSO, while OIDC dominates modern/consumer scenarios." },
      { id: "iam-l8-q8", question: "Most SAML vulnerabilities stem from what?", options: ["Weaknesses in XML itself", "Service providers validating signatures loosely or not checking audience/expiry", "Too-strong encryption", "Using HTTPS"], correctAnswerIndex: 1, explanation: "The common root cause is improper signature validation and unchecked conditions at the SP, not the spec itself." },
    ],
  },

  // ── LESSON 9 ───────────────────────────────────────────────────────────────
  {
    title: "09 // JSON Web Tokens: Structure, Signing & Fatal Flaws",
    summary: "Decoding a JWT's three parts, how signatures prove integrity, and the notorious alg:none and RS256→HS256 confusion attacks.",
    content: `
      <h2>The token you'll meet everywhere</h2>
      <p>A <strong>JSON Web Token (JWT)</strong> is a compact, self-contained way to carry claims between parties. It's the ID token in OIDC, a common API access token, and a frequent session replacement. Learning to read one — and to spot its classic flaws — is a core identity skill.</p>

      <h3>Three parts, two dots</h3>
      <p>A JWT is three Base64URL-encoded segments joined by dots: <code>header.payload.signature</code>.</p>
      <pre><code>eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJuYW1lIjoiQWxpY2UiLCJyb2xlIjoidXNlciIsImV4cCI6MTcyMDAwMDAwMH0.dQw4w9WgXcQ_signature_bytes</code></pre>
      <p>Decoding the first two parts (they are <em>not</em> encrypted — just encoded):</p>
      <pre><code>// Header — metadata, including the signing algorithm
{
  "alg": "HS256",
  "typ": "JWT"
}

// Payload — the claims
{
  "sub": "123",       // subject (the user)
  "name": "Alice",
  "role": "user",
  "iss": "https://idp.example.com",
  "aud": "api.example.com",
  "exp": 1720000000   // expiry (Unix time)
}</code></pre>

      <h3>The signature is the whole point</h3>
      <p>The third part is a cryptographic signature over the header and payload. It proves two things: the token was issued by someone holding the signing key (<strong>authenticity</strong>) and it hasn't been altered since (<strong>integrity</strong>). Two signing families:</p>
      <ul>
        <li><strong>HS256 (symmetric)</strong> — one shared secret both signs and verifies. Anyone who can verify can also forge, so the secret must stay server-side.</li>
        <li><strong>RS256 (asymmetric)</strong> — a private key signs, a public key verifies. Verifiers only need the public key and cannot forge tokens.</li>
      </ul>

      <blockquote><strong>A JWT is signed, not encrypted.</strong> Anyone can base64-decode the payload and read every claim. Never put secrets (passwords, full PII) in a JWT, and never trust a claim like <code>"role":"admin"</code> unless the signature verifies.</blockquote>

      <h3>Fatal flaw #1: alg:none</h3>
      <p>The JWT spec includes an <code>alg</code> value of <code>"none"</code> — meaning "unsigned." A dangerously naive verifier reads the algorithm <em>from the token itself</em> and, seeing <code>none</code>, skips signature verification entirely. An attacker simply crafts a token with a forged payload and <code>"alg":"none"</code>, and the server accepts it:</p>
      <pre><code>// Attacker-forged header and payload, empty signature
{ "alg": "none", "typ": "JWT" }
{ "sub": "123", "role": "admin" }   // self-promoted to admin
// → eyJhbGciOiJub25lIn0.eyJzdWIiOiIxMjMiLCJyb2xlIjoiYWRtaW4ifQ.</code></pre>
      <p>The fix: the server must <strong>pin the expected algorithm</strong> and reject <code>none</code> outright. Never let the token dictate whether it gets verified. This maps to MITRE <strong>T1556 (Modify Authentication Process)</strong>.</p>

      <h3>Fatal flaw #2: RS256 → HS256 key confusion</h3>
      <p>A subtler attack: a server expects RS256 (verify with the RSA <em>public</em> key). The attacker changes the header to <code>HS256</code> and signs the forged token using the <em>public key as the HMAC secret</em>. If the library naively uses the same key material for whichever algorithm the token names, HS256 verification with the public key succeeds — and since the public key is, well, public, the attacker could forge freely. Same root cause: <strong>trusting the token's algorithm field.</strong></p>

      <h3>Other JWT pitfalls</h3>
      <ul>
        <li><strong>No expiry check</strong> — ignoring <code>exp</code> lets stolen tokens live forever.</li>
        <li><strong>Wrong/absent audience check</strong> — accepting tokens minted for another service.</li>
        <li><strong>Weak HS256 secret</strong> — a guessable shared secret can be brute-forced offline, then used to forge tokens.</li>
        <li><strong>Hard revocation</strong> — stateless JWTs can't be easily invalidated before expiry; keep lifetimes short and use refresh tokens or a denylist.</li>
      </ul>
    `,
    quizzes: [
      { id: "iam-l9-q1", question: "What are the three parts of a JWT, in order?", options: ["Header, payload, signature", "Signature, header, payload", "Payload, key, hash", "Subject, scope, secret"], correctAnswerIndex: 0, explanation: "A JWT is header.payload.signature — three Base64URL segments joined by dots." },
      { id: "iam-l9-q2", question: "Is a standard JWT encrypted?", options: ["Yes, fully encrypted", "No — it is signed, and the payload is only base64-encoded and readable", "Only the header is encrypted", "Only if it's RS256"], correctAnswerIndex: 1, explanation: "A JWT is signed for integrity, not encrypted; anyone can base64-decode and read the payload." },
      { id: "iam-l9-q3", question: "What does the JWT signature prove?", options: ["The user's password", "Authenticity (issued by the key holder) and integrity (not altered)", "The server's IP", "The token's colour"], correctAnswerIndex: 1, explanation: "The signature proves the token came from the signing-key holder and hasn't been tampered with." },
      { id: "iam-l9-q4", question: "How do HS256 and RS256 differ?", options: ["HS256 is encryption; RS256 is hashing", "HS256 uses one shared secret; RS256 uses a private key to sign and a public key to verify", "They are identical", "RS256 has no signature"], correctAnswerIndex: 1, explanation: "HS256 is symmetric (shared secret); RS256 is asymmetric (private signs, public verifies)." },
      { id: "iam-l9-q5", question: "Why is 'alg':'none' dangerous?", options: ["It slows the server", "A naive verifier reads the algorithm from the token and skips signature verification, accepting forged tokens", "It deletes the database", "It encrypts the payload twice"], correctAnswerIndex: 1, explanation: "If the server trusts the token's own alg field and sees 'none', it verifies nothing and accepts attacker-forged claims." },
      { id: "iam-l9-q6", question: "What is the correct defense against alg:none?", options: ["Use a longer payload", "Pin the expected algorithm server-side and reject 'none'", "Encrypt the header", "Remove the signature"], correctAnswerIndex: 1, explanation: "The server must enforce the expected algorithm and never let the token decide whether it's verified." },
      { id: "iam-l9-q7", question: "In the RS256→HS256 confusion attack, what secret does the attacker use to sign?", options: ["The user's password", "The RSA public key, treated as the HMAC secret", "A random number", "The session cookie"], correctAnswerIndex: 1, explanation: "The attacker switches to HS256 and signs with the public key; a naive library then verifies with that same public key." },
      { id: "iam-l9-q8", question: "Why should JWT lifetimes be kept short?", options: ["To save bandwidth", "Because stateless JWTs are hard to revoke, so a stolen token stays valid until it expires", "To make them look better", "JWTs cannot expire"], correctAnswerIndex: 1, explanation: "Stateless tokens can't be easily invalidated early, so short expiry limits the window a stolen token is usable." },
    ],
  },

  // ── LESSON 10 ──────────────────────────────────────────────────────────────
  {
    title: "10 // Least Privilege, Access Models & Identity Attacks",
    summary: "Applying least privilege through RBAC and ABAC, and mapping the major identity attacks — token theft, session fixation, privilege escalation — to their defenses and MITRE ATT&CK.",
    content: `
      <h2>Deciding what an identity may do</h2>
      <p>Authentication answered <em>who</em>. This final lesson is about <em>what</em> — authorization done well — and the attacks that target the whole identity stack. The organising principle is <strong>least privilege</strong>: every identity should have the <em>minimum</em> access needed to do its job, and no more.</p>

      <h3>Least privilege in practice</h3>
      <p>Over-granting is the default failure. "It works with admin" is not "it's correct." Least privilege means:</p>
      <ul>
        <li>Grant only the permissions a task actually requires.</li>
        <li>Prefer <strong>deny by default</strong> — everything is forbidden unless explicitly allowed.</li>
        <li>Remove access when it's no longer needed (offboarding, role changes, temporary grants).</li>
        <li>Contain blast radius: if an identity is compromised, minimal privilege limits the damage.</li>
      </ul>

      <h3>Two ways to model access</h3>
      <table>
        <thead><tr><th></th><th>RBAC</th><th>ABAC</th></tr></thead>
        <tbody>
          <tr><td>Full name</td><td>Role-Based Access Control</td><td>Attribute-Based Access Control</td></tr>
          <tr><td>Decision basis</td><td>The user's assigned role(s)</td><td>Attributes of user, resource, action, and environment</td></tr>
          <tr><td>Example</td><td>"Editors may publish articles."</td><td>"Allow if user.dept == resource.dept AND time is business hours."</td></tr>
          <tr><td>Strength</td><td>Simple, auditable, easy to reason about</td><td>Fine-grained, context-aware, flexible</td></tr>
          <tr><td>Weakness</td><td>Role explosion; coarse for edge cases</td><td>Complex to author and audit</td></tr>
        </tbody>
      </table>
      <p>RBAC groups permissions into roles and assigns roles to users — clean and common. ABAC evaluates policies over attributes, enabling rules RBAC can't express. Many mature systems combine them: roles for the baseline, attributes for context.</p>

      <h3>The major identity attacks — and their defenses</h3>
      <table>
        <thead><tr><th>Attack</th><th>What happens</th><th>Primary defense</th><th>ATT&CK</th></tr></thead>
        <tbody>
          <tr><td><strong>Credential brute force / spraying</strong></td><td>Guessing passwords online</td><td>MFA, rate limiting, lockouts, strong hashing</td><td>T1110</td></tr>
          <tr><td><strong>Token / session-cookie theft</strong></td><td>Stealing a valid token (via XSS, malware) to impersonate the user</td><td>HttpOnly/Secure cookies, short lifetimes, token binding</td><td>T1539 / T1528</td></tr>
          <tr><td><strong>Session fixation</strong></td><td>Attacker sets a known session ID, then rides it after the victim logs in</td><td>Regenerate the session ID at login</td><td>—</td></tr>
          <tr><td><strong>Session hijacking (MITM)</strong></td><td>Sniffing a session over an insecure channel</td><td>TLS everywhere, Secure cookies</td><td>T1557</td></tr>
          <tr><td><strong>JWT forgery (alg:none, key confusion)</strong></td><td>Bypassing signature verification</td><td>Pin algorithm, verify signature, check exp/aud</td><td>T1556</td></tr>
          <tr><td><strong>Privilege escalation</strong></td><td>Gaining rights beyond one's own (IDOR, tampered role claim)</td><td>Server-side authorization on every action; least privilege</td><td>T1078 / T1068</td></tr>
        </tbody>
      </table>

      <h3>Session fixation, in detail</h3>
      <p>The attacker plants a session identifier the victim will use (e.g. via a crafted link), waits for the victim to authenticate <em>under that same ID</em>, then uses the now-authenticated ID themselves. The one-line fix restates Lesson 5: <strong>always issue a fresh session ID upon successful login</strong>, discarding any pre-existing one.</p>

      <h3>Why the failure→success and 'valid accounts' problem returns</h3>
      <p>The most dangerous identity attacks end with the attacker holding <em>legitimate</em> credentials or a <em>valid</em> token — MITRE <strong>T1078 Valid Accounts</strong>. From that point their actions look normal. This is why prevention (MFA, least privilege, phishing-resistant factors) and early detection (impossible-travel logins, new-device alerts, anomalous token use) matter more than trying to spot a "malicious" login after the fact.</p>

      <blockquote>The through-line of this whole course: verify identity strongly (AuthN), check permission on every action (AuthZ), grant the least privilege necessary, protect the tokens that represent identity, and never trust a token without verifying it. Do those five things and the overwhelming majority of identity attacks simply fail.</blockquote>
    `,
    quizzes: [
      { id: "iam-l10-q1", question: "What is the principle of least privilege?", options: ["Give every user admin to avoid errors", "Grant each identity only the minimum access needed, and no more", "Deny all access to everyone", "Grant access based on seniority"], correctAnswerIndex: 1, explanation: "Least privilege means the minimum permissions required for the task, limiting blast radius if compromised." },
      { id: "iam-l10-q2", question: "How does RBAC make access decisions?", options: ["Based on the user's assigned role(s)", "Based on the weather", "Based on IP address only", "Randomly"], correctAnswerIndex: 0, explanation: "Role-Based Access Control assigns permissions to roles and roles to users; decisions follow the role." },
      { id: "iam-l10-q3", question: "What distinguishes ABAC from RBAC?", options: ["ABAC ignores the user", "ABAC decides using attributes of user, resource, action, and environment — more fine-grained and context-aware", "ABAC has no policies", "They are identical"], correctAnswerIndex: 1, explanation: "Attribute-Based Access Control evaluates contextual attributes, enabling rules RBAC's roles can't express." },
      { id: "iam-l10-q4", question: "What is session fixation?", options: ["Repairing a broken session", "An attacker pre-sets a session ID and hijacks it after the victim logs in under it", "Encrypting the session", "Extending session lifetime"], correctAnswerIndex: 1, explanation: "The attacker plants a known session ID and rides it once the victim authenticates under that same ID." },
      { id: "iam-l10-q5", question: "What is the primary defense against session fixation?", options: ["Longer passwords", "Regenerate (rotate) the session ID upon successful login", "Disable cookies", "Use SMS OTP"], correctAnswerIndex: 1, explanation: "Issuing a fresh session ID at login invalidates any attacker-planted ID." },
      { id: "iam-l10-q6", question: "Which defense most directly addresses session-cookie theft via XSS?", options: ["Longer session IDs", "The HttpOnly flag, which hides the cookie from JavaScript", "Changing the port", "Using RBAC"], correctAnswerIndex: 1, explanation: "HttpOnly prevents JavaScript from reading the cookie, blocking XSS-based exfiltration." },
      { id: "iam-l10-q7", question: "Using stolen legitimate credentials or a valid token maps to which MITRE technique?", options: ["T1110 Brute Force", "T1078 Valid Accounts", "T1595 Active Scanning", "T1046 Network Service Discovery"], correctAnswerIndex: 1, explanation: "T1078 Valid Accounts covers abusing legitimate credentials/tokens so activity blends in as normal." },
      { id: "iam-l10-q8", question: "Which combination best summarises defending the identity stack?", options: ["Just use a firewall", "Strong AuthN, per-action AuthZ, least privilege, protect tokens, and always verify tokens", "Disable MFA for speed", "Trust any valid-looking token"], correctAnswerIndex: 1, explanation: "Strong authentication, authorization on every action, least privilege, token protection, and always verifying tokens defeat most identity attacks." },
    ],
  },
];
