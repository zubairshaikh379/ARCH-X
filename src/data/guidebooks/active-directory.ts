// ─────────────────────────────────────────────────────────────────────────────
// ACTIVE DIRECTORY SECURITY — DEEP GUIDEBOOK (ARCH-X textbook-grade course)
//
// Content is authored as SEMANTIC HTML and rendered inside `.md-content`
// (see src/index.css) — h2/h3/p/ul/ol/li/pre/code/table/blockquote/strong are
// all styled there, so lessons render correctly without relying on Tailwind
// class scanning.
//
// Structure mirrors a real syllabus: Intro → Structure → Authentication →
// Enumeration → Credential attacks → Ticket attacks → Movement → Attack paths →
// Detection/logging → Hardening/ATT&CK. Each lesson ends with an 8-question check.
//
// Authorized-education framing: attacks are explained conceptually with the
// emphasis on DETECTION and HARDENING, never as turnkey exploitation.
// ─────────────────────────────────────────────────────────────────────────────

import type { Course } from "../courses";

type Lesson = Course["lessons"][number];

export const META: Pick<
  Course,
  "prerequisites" | "learningOutcomes" | "mustKnow" | "commonGaps" | "prosCons" | "careerNotes"
> = {
  prerequisites: [
    "A working mental model of TCP/IP: ports, DNS, and the client→server request/response pattern.",
    "Basic Windows familiarity — what a user account, a group, and a login are.",
    "Comfort reading command output; you'll see PowerShell and log samples, not write production code.",
    "The defensive mindset from a SOC/logs course helps but isn't required — every AD concept is built from zero.",
  ],
  learningOutcomes: [
    "Explain the AD hierarchy — forest, domain, OU, GPO — and why trust boundaries decide blast radius.",
    "Walk through Kerberos step by step (AS-REQ → TGT → TGS) and contrast it with NTLM.",
    "Recognise the log and telemetry fingerprint of Kerberoasting, AS-REP roasting, and Pass-the-Hash.",
    "Explain Golden and Silver tickets in terms of what is forged, and why krbtgt rotation matters.",
    "Read an attack path the way BloodHound draws one, and identify the choke point to cut.",
    "Apply the tiered administration model and map each AD detection to MITRE ATT&CK.",
  ],
  mustKnow: [
    "Forest / Domain / OU", "Group Policy (GPO)", "Domain Controller (DC)", "krbtgt", "KDC",
    "NTLM", "Kerberos", "TGT / TGS", "SPN", "AS-REP Roasting", "Kerberoasting (T1558.003)",
    "Pass-the-Hash (T1550.002)", "Pass-the-Ticket (T1550.003)", "Golden Ticket (T1558.001)",
    "Silver Ticket (T1558.002)", "DCSync (T1003.006)", "LSASS", "BloodHound / attack paths",
    "Tiered Admin Model", "Event ID 4768/4769/4624/4625", "AES vs RC4", "gMSA", "LAPS",
  ],
  commonGaps: [
    "NTLM vs Kerberos confusion. Beginners treat them as one thing; they are different protocols with different logs, and knowing which fired tells you a lot about the attack.",
    "Where the trust boundary really is. Many learners think the domain is the security boundary — it isn't, the FOREST is. Misjudging this misjudges blast radius.",
    "The offline nature of ticket cracking. Kerberoasting cracking happens off the network, so there are NO failed-logon logs — detection must come from the ticket REQUEST, not the crack.",
    "Encryption downgrade signals. An RC4 (etype 0x17) ticket request when your domain is AES-capable is a screaming indicator most people never look at.",
    "krbtgt is not a normal account. Its hash signs every TGT; understanding that one secret underpins all Kerberos trust explains why a Golden Ticket is so devastating.",
    "Detection over prevention bias. You cannot 'patch' Kerberoasting away — the fix is hardening (strong passwords, gMSA, AES) plus detecting the request pattern. Learners expect a single switch.",
  ],
  prosCons: {
    pros: [
      "AD is the identity backbone of ~90% of enterprises, so these skills are in constant demand.",
      "Kerberos and NTLM telemetry is rich: ticket requests, logon events, and replication calls all leave traces you can hunt.",
      "Skills map directly to identity-security, detection-engineering, threat-hunting, and red/purple-team roles.",
    ],
    cons: [
      "AD is sprawling and legacy-laden; misconfigurations accumulate over decades and attack paths hide in group nesting.",
      "Many powerful attacks abuse legitimate protocol features, so 'malicious' and 'normal' overlap — tuning is hard.",
      "A single compromised Domain Admin or the krbtgt secret can mean total forest compromise; the stakes are unforgiving.",
    ],
  },
  careerNotes:
    "Active Directory security sits at the crossroads of identity, detection engineering, and incident response. It's a core competency for SOC Tier-2/Tier-3 analysts, threat hunters, identity/PAM engineers, and red/purple teamers. Foundational certs that cover this ground include Microsoft SC-300 (Identity & Access Administrator), the practical Altered Security CRTP (Certified Red Team Professional) for the attack side, and detection-focused paths like Blue Team Level 2 (BTL2) and TryHackMe/HackTheBox AD tracks. In most markets AD security is a 2+ year target that builds on general SOC or sysadmin experience; the practitioners who stand out can both explain Kerberos from first principles AND write the detection that catches its abuse.",
};

export const LESSONS: Lesson[] = [
  // ── LESSON 1 ───────────────────────────────────────────────────────────────
  {
    title: "01 // What Active Directory Is and Why Attackers Love It",
    summary: "The role AD plays as the identity backbone of the enterprise, why it is the single most valuable target, and the defender's mission.",
    content: `
      <h2>The keyring for the whole building</h2>
      <p><strong>Active Directory (AD)</strong> is Microsoft's directory service — the central system that answers the question "who are you, and what are you allowed to do?" for almost every enterprise. When you log into a corporate laptop, open a file share, print, or open your email, AD is quietly deciding whether to let you. If a company is a building, AD is the master keyring plus the guest list plus the rulebook, all in one.</p>

      <p>That centralisation is exactly why attackers prize it. Compromise one laptop and you have one laptop. Compromise Active Directory and you can potentially become <em>anyone</em>, reach <em>everything</em>, and do it while looking like a legitimate employee. This is why AD is often called the "keys to the kingdom."</p>

      <h3>What AD actually stores and does</h3>
      <ul>
        <li><strong>Identities</strong> — user accounts, computer accounts, and service accounts.</li>
        <li><strong>Groups</strong> — collections of identities (e.g. "Domain Admins") that grant shared permissions.</li>
        <li><strong>Authentication</strong> — it proves who you are, via the Kerberos and NTLM protocols (Lessons 3–6).</li>
        <li><strong>Authorization</strong> — it decides what you may access, via permissions and Group Policy.</li>
        <li><strong>Policy</strong> — it pushes configuration and security settings to machines at scale.</li>
      </ul>

      <h3>The Domain Controller</h3>
      <p>The server that runs Active Directory is the <strong>Domain Controller (DC)</strong>. It holds the directory database (<code>NTDS.dit</code>), authenticates logins, and enforces policy. A DC is the crown jewel of the network: anyone who fully controls a DC effectively controls the domain. Much of this course is about protecting DCs and detecting attacks that target them.</p>

      <h3>Your mission as a defender</h3>
      <p>This is an <em>authorized-education</em> course written from the blue-team chair. We will study how real attacks against AD work — because you cannot detect what you don't understand — but the goal is always the same three things:</p>
      <ol>
        <li><strong>Detect</strong> — recognise the telemetry an attack produces before it succeeds.</li>
        <li><strong>Defend</strong> — harden AD so common attacks simply don't work.</li>
        <li><strong>Respond</strong> — contain and remediate when something does get through.</li>
      </ol>

      <blockquote>The mental frame for this whole course: AD attacks rarely "break in" through a software exploit. They <strong>abuse legitimate features</strong> — tickets, trusts, group memberships — that were designed to make the enterprise work. That is what makes them so hard to catch, and so important to understand.</blockquote>

      <h3>Why "assume breach"</h3>
      <p>Mature AD defence assumes an attacker will eventually get a foothold on some ordinary workstation. The real question is not "can we keep everyone out?" but "once someone is inside as a low-privilege user, how far can they get, and will we see them move?" Everything from here builds toward answering that.</p>
    `,
    quizzes: [
      { id: "ad-l1-q1", question: "What is the primary role of Active Directory in an enterprise?", options: ["Hosting the company website", "Centralised identity, authentication, and authorization — deciding who you are and what you can access", "Backing up user files", "Filtering spam email"], correctAnswerIndex: 1, explanation: "AD is the directory service that centrally manages identities, authenticates logins, and authorizes access across the enterprise." },
      { id: "ad-l1-q2", question: "Which server runs Active Directory and holds the directory database?", options: ["The web server", "The Domain Controller (DC)", "The DHCP server", "The print server"], correctAnswerIndex: 1, explanation: "The Domain Controller runs AD, stores NTDS.dit, authenticates logins, and enforces policy — making it the crown jewel." },
      { id: "ad-l1-q3", question: "Why is AD called the 'keys to the kingdom'?", options: ["It is expensive to license", "Controlling it can let an attacker become anyone and reach everything while looking legitimate", "It only runs on weekends", "It stores encryption keys for the internet"], correctAnswerIndex: 1, explanation: "Because AD governs identity for the whole environment, compromising it grants sweeping access that blends in with normal activity." },
      { id: "ad-l1-q4", question: "What is the file NTDS.dit?", options: ["A log file of failed logins", "The Active Directory database stored on a Domain Controller", "A firewall ruleset", "A Kerberos ticket"], correctAnswerIndex: 1, explanation: "NTDS.dit is the AD directory database on the DC, containing accounts and their password hashes." },
      { id: "ad-l1-q5", question: "What is the defining characteristic of most AD attacks?", options: ["They exploit unpatched software bugs", "They abuse legitimate features (tickets, trusts, group memberships) rather than breaking protocols", "They require physical access to the DC", "They only work over the public internet"], correctAnswerIndex: 1, explanation: "AD attacks typically abuse features designed to make the enterprise work, which is why they blend in and are hard to detect." },
      { id: "ad-l1-q6", question: "What does the 'assume breach' philosophy hold?", options: ["That perfect prevention is achievable", "That an attacker will eventually gain a foothold, so the focus shifts to limiting and detecting their movement", "That logs are unnecessary", "That AD cannot be secured"], correctAnswerIndex: 1, explanation: "Assume-breach accepts that some foothold is inevitable and prioritises detecting lateral movement and limiting blast radius." },
      { id: "ad-l1-q7", question: "Which of these is NOT something AD manages?", options: ["User and computer accounts", "Group memberships and permissions", "The physical wiring of the network", "Authentication via Kerberos and NTLM"], correctAnswerIndex: 2, explanation: "AD manages identities, groups, policy, and authentication — not the physical network cabling." },
      { id: "ad-l1-q8", question: "This course studies attacks primarily in order to…", options: ["Provide turnkey exploitation steps", "Detect, defend against, and respond to them from a defensive posture", "Attack other organisations", "Replace the SOC"], correctAnswerIndex: 1, explanation: "The framing is authorized education: understand attacks so you can detect, harden against, and respond to them." },
    ],
  },

  // ── LESSON 2 ───────────────────────────────────────────────────────────────
  {
    title: "02 // AD Structure: Forests, Domains, OUs, and GPOs",
    summary: "The logical hierarchy of Active Directory, where the true security boundary lives, and how Group Policy pushes configuration at scale.",
    content: `
      <h2>The shape of the directory</h2>
      <p>Active Directory is organised as a hierarchy, and understanding that hierarchy is the difference between guessing at blast radius and knowing it. From largest container to smallest:</p>

      <table>
        <thead><tr><th>Object</th><th>What it is</th><th>Defender's note</th></tr></thead>
        <tbody>
          <tr><td><strong>Forest</strong></td><td>The top-level container; one or more domains that share a schema and global config.</td><td>This is the TRUE security boundary. Everything inside a forest implicitly trusts everything else.</td></tr>
          <tr><td><strong>Domain</strong></td><td>An administrative partition of identities and policy (e.g. <code>corp.example.com</code>).</td><td>Feels like a boundary, but is NOT the security boundary — see below.</td></tr>
          <tr><td><strong>Tree</strong></td><td>A group of domains sharing a contiguous DNS namespace.</td><td>Mostly a naming/organisational concept.</td></tr>
          <tr><td><strong>OU (Organizational Unit)</strong></td><td>A folder-like container inside a domain for grouping objects.</td><td>The unit you attach Group Policy and delegate admin rights to.</td></tr>
        </tbody>
      </table>

      <h3>The forest is the security boundary — memorise this</h3>
      <p>A very common misconception is that the <em>domain</em> is the security boundary. It is not. The <strong>forest</strong> is. Domains within a forest trust each other by default, and certain highly-privileged groups (like <strong>Enterprise Admins</strong>) span the whole forest. This means that compromising one domain in a forest can often be leveraged toward the entire forest. When you scope an incident, ask "what forest is this in?" before you relax.</p>

      <h3>Trusts</h3>
      <p>A <strong>trust</strong> is a configured relationship that lets identities in one domain/forest be authenticated by another. Trusts can be one-way or two-way, and transitive or not. They are convenient for mergers and partnerships — and they are attack surface: a poorly-scoped trust can let a compromise in a low-security domain reach a high-security one.</p>

      <h3>Organizational Units and delegation</h3>
      <p><strong>OUs</strong> let admins organise objects and, crucially, <em>delegate</em> control. You might give the helpdesk the right to reset passwords only for users in the "Staff" OU. Delegation is powerful and often over-granted; misconfigured OU permissions are a frequent privilege-escalation path (Lesson 8).</p>

      <h3>Group Policy (GPOs)</h3>
      <p><strong>Group Policy Objects (GPOs)</strong> are how AD pushes configuration and security settings to many machines at once — password policies, firewall rules, software installs, login scripts. A GPO is <em>linked</em> to a site, domain, or OU, and applies to everything beneath it.</p>
      <p>From a defender's view GPOs cut both ways:</p>
      <ul>
        <li><strong>As defence</strong> — GPOs enforce hardening consistently across thousands of machines.</li>
        <li><strong>As attack surface</strong> — an attacker who can edit a GPO linked to many machines can push a malicious setting or script to all of them at once. GPO write permissions are a prized escalation target.</li>
      </ul>

      <blockquote>Blast-radius rule of thumb: the higher up the hierarchy an object or permission sits — forest &gt; domain &gt; OU &gt; single object — the more damage its compromise causes. When triaging AD alerts, always locate the affected object in this hierarchy first.</blockquote>
    `,
    quizzes: [
      { id: "ad-l2-q1", question: "In Active Directory, what is the true security boundary?", options: ["The Organizational Unit", "The domain", "The forest", "The individual computer"], correctAnswerIndex: 2, explanation: "The forest is the security boundary; domains within a forest trust each other by default." },
      { id: "ad-l2-q2", question: "Why is it dangerous to think the domain is the security boundary?", options: ["Domains don't exist", "Domains in a forest trust each other and some groups span the whole forest, so single-domain compromise can spread", "Domains cannot hold users", "It makes logins slower"], correctAnswerIndex: 1, explanation: "Because forest-wide trust and groups like Enterprise Admins exist, compromising one domain can be leveraged toward the whole forest." },
      { id: "ad-l2-q3", question: "What is an Organizational Unit (OU) primarily used for?", options: ["Encrypting network traffic", "Grouping objects for organisation, GPO application, and delegated administration", "Storing password hashes", "Running the KDC"], correctAnswerIndex: 1, explanation: "OUs are folder-like containers used to organise objects, attach Group Policy, and delegate administrative rights." },
      { id: "ad-l2-q4", question: "What does a Group Policy Object (GPO) do?", options: ["Encrypts Kerberos tickets", "Pushes configuration and security settings to machines linked below it in the hierarchy", "Replaces the Domain Controller", "Assigns IP addresses"], correctAnswerIndex: 1, explanation: "GPOs deliver configuration (password policy, scripts, settings) to sites, domains, or OUs they are linked to." },
      { id: "ad-l2-q5", question: "Why are GPO write permissions a prized attack target?", options: ["They are hard to obtain and useless", "An attacker who can edit a widely-linked GPO can push malicious settings/scripts to many machines at once", "GPOs store no data", "They only affect one user"], correctAnswerIndex: 1, explanation: "Editing a GPO linked to many systems lets an attacker deploy a malicious change broadly in one move." },
      { id: "ad-l2-q6", question: "What is an AD trust?", options: ["A backup schedule", "A configured relationship letting identities in one domain/forest be authenticated by another", "A type of firewall rule", "A password policy"], correctAnswerIndex: 1, explanation: "Trusts allow cross-domain/forest authentication; poorly-scoped trusts extend attack surface between environments." },
      { id: "ad-l2-q7", question: "Which group's privileges span the entire forest?", options: ["Domain Users", "Enterprise Admins", "Guests", "Local Administrators"], correctAnswerIndex: 1, explanation: "Enterprise Admins is a forest-wide privileged group, which is part of why the forest is the security boundary." },
      { id: "ad-l2-q8", question: "When triaging an AD alert, why locate the affected object in the hierarchy first?", options: ["To count the letters in its name", "Because position in the hierarchy (forest > domain > OU > object) determines blast radius", "Because higher objects log less", "It has no analytical value"], correctAnswerIndex: 1, explanation: "The higher an object sits, the larger the impact of its compromise — hierarchy position drives severity." },
    ],
  },

  // ── LESSON 3 ───────────────────────────────────────────────────────────────
  {
    title: "03 // Authentication I: NTLM vs Kerberos",
    summary: "The two authentication protocols AD speaks, how each proves identity, and why the older NTLM is both still present and dangerous.",
    content: `
      <h2>Two ways to prove who you are</h2>
      <p>When a user or computer authenticates in AD, one of two protocols does the work: the modern <strong>Kerberos</strong> or the legacy <strong>NTLM</strong>. Knowing which one fired — and what each looks like in the logs — is a core AD-analyst skill, because different attacks target different protocols.</p>

      <h3>NTLM: challenge and response</h3>
      <p><strong>NTLM (NT LAN Manager)</strong> is the older protocol. It works as a challenge-response:</p>
      <ol>
        <li>The client says "I want to authenticate."</li>
        <li>The server sends a random <strong>challenge</strong> (a nonce).</li>
        <li>The client encrypts the challenge using a value derived from its <strong>NT hash</strong> (the hash of the password) and sends the response.</li>
        <li>The server (or the DC on its behalf) verifies the response.</li>
      </ol>
      <p>The critical fact for defenders: <strong>NTLM authenticates using the NT hash, not the plaintext password.</strong> The hash <em>is</em> the credential. That single design fact is what makes Pass-the-Hash possible (Lesson 5) — an attacker who steals the hash never needs the password.</p>

      <h3>Kerberos: tickets instead of hashes on the wire</h3>
      <p><strong>Kerberos</strong> is the default and preferred protocol in modern AD. Instead of sending a hash-derived response to each server, the client gets time-limited <strong>tickets</strong> from the Domain Controller and presents those to services. Lesson 4 dissects the ticket flow in detail; the headline is that Kerberos is designed so the user's long-term secret is used sparingly and services never see it.</p>

      <h3>Why NTLM is still around — and still dangerous</h3>
      <p>NTLM persists for backward compatibility: legacy apps, connecting by IP address instead of hostname, and workgroup scenarios all fall back to it. But it has serious weaknesses:</p>
      <ul>
        <li>The hash is a password-equivalent that can be replayed (Pass-the-Hash).</li>
        <li>It lacks mutual authentication in its basic form, enabling relay attacks.</li>
        <li>It has no ticket concept, so it can't offer Kerberos-style constraints.</li>
      </ul>
      <p>A strong hardening goal is to <em>monitor and reduce</em> NTLM usage — and a spike of NTLM authentication where you'd expect Kerberos is itself a hunt-worthy signal.</p>

      <table>
        <thead><tr><th></th><th>NTLM</th><th>Kerberos</th></tr></thead>
        <tbody>
          <tr><td>Age</td><td>Legacy</td><td>Modern default</td></tr>
          <tr><td>Mechanism</td><td>Challenge-response using NT hash</td><td>Time-limited tickets from a KDC</td></tr>
          <tr><td>Mutual auth</td><td>No (basic form)</td><td>Yes</td></tr>
          <tr><td>Key logon event</td><td>4776 (credential validation), 4624 type 3</td><td>4768 / 4769 (ticket events)</td></tr>
          <tr><td>Signature attack</td><td>Pass-the-Hash, NTLM relay</td><td>Kerberoasting, Golden/Silver tickets</td></tr>
        </tbody>
      </table>

      <blockquote>Analyst reflex: when you see an authentication event, first ask "NTLM or Kerberos?" The answer narrows the set of attacks in play and tells you which log fields (hashes vs tickets/etypes) to inspect next.</blockquote>
    `,
    quizzes: [
      { id: "ad-l3-q1", question: "Which two protocols does AD use to authenticate identities?", options: ["HTTP and FTP", "NTLM and Kerberos", "SSH and TLS", "DNS and DHCP"], correctAnswerIndex: 1, explanation: "AD authentication is handled by the legacy NTLM protocol and the modern default, Kerberos." },
      { id: "ad-l3-q2", question: "In NTLM, what does the client use to prove its identity?", options: ["The plaintext password sent directly", "A response derived from the account's NT hash", "A Kerberos TGT", "Its IP address"], correctAnswerIndex: 1, explanation: "NTLM is a challenge-response where the client proves knowledge of the NT hash — the hash itself is the credential." },
      { id: "ad-l3-q3", question: "Why does NTLM's design make Pass-the-Hash possible?", options: ["Because it sends the password in cleartext", "Because the NT hash is a password-equivalent that can be replayed without knowing the plaintext", "Because it uses tickets", "Because it requires no authentication"], correctAnswerIndex: 1, explanation: "Since NTLM authenticates with the hash rather than the plaintext, stealing the hash is enough to authenticate." },
      { id: "ad-l3-q4", question: "How does Kerberos differ fundamentally from NTLM?", options: ["It sends passwords in the clear", "It uses time-limited tickets issued by the KDC rather than per-server hash responses", "It has no encryption", "It is older than NTLM"], correctAnswerIndex: 1, explanation: "Kerberos issues time-limited tickets from the Domain Controller, so services never handle the user's long-term secret directly." },
      { id: "ad-l3-q5", question: "Why does NTLM still exist in modern environments?", options: ["It is more secure than Kerberos", "Backward compatibility: legacy apps, connecting by IP, and workgroup scenarios fall back to it", "It is required by DNS", "Microsoft mandates it"], correctAnswerIndex: 1, explanation: "NTLM lingers for compatibility with legacy applications and situations (like IP-based connections) where Kerberos isn't used." },
      { id: "ad-l3-q6", question: "A sudden spike of NTLM authentication where Kerberos is expected is…", options: ["Always benign", "A hunt-worthy signal that may indicate relay or fallback abuse", "Proof of a hardware failure", "A DNS problem only"], correctAnswerIndex: 1, explanation: "Unexpected NTLM usage can indicate attack activity or downgrade, making it worth investigating." },
      { id: "ad-l3-q7", question: "Which weakness of NTLM enables relay attacks?", options: ["It uses tickets", "Its basic form lacks mutual authentication", "It runs only on Linux", "It has no logging"], correctAnswerIndex: 1, explanation: "Without mutual authentication, an attacker can relay NTLM authentication to another service." },
      { id: "ad-l3-q8", question: "Why should an analyst first ask 'NTLM or Kerberos?' for an auth event?", options: ["To pick a random field", "Because the protocol narrows which attacks are in play and which log fields to inspect", "Because NTLM events are always malicious", "It changes the timezone"], correctAnswerIndex: 1, explanation: "Identifying the protocol focuses the investigation on the relevant attack set and telemetry (hashes vs tickets/etypes)." },
    ],
  },

  // ── LESSON 4 ───────────────────────────────────────────────────────────────
  {
    title: "04 // Authentication II: Kerberos Tickets, TGT and TGS",
    summary: "The step-by-step Kerberos ticket flow — AS-REQ, TGT, TGS — the role of the KDC and krbtgt, and why this design is both elegant and exploitable.",
    content: `
      <h2>Tickets, not passwords, on the wire</h2>
      <p>Kerberos is the beating heart of AD authentication, and nearly every advanced AD attack targets some part of its ticket flow. Understanding it precisely is the most valuable thirty minutes in this course. The mental model: a theme park where you show ID once at the gate to get a wristband, then flash the wristband — not your ID — at each ride.</p>

      <h3>The cast</h3>
      <ul>
        <li><strong>KDC (Key Distribution Center)</strong> — runs on the Domain Controller; issues tickets. It has two halves: the <strong>Authentication Service (AS)</strong> and the <strong>Ticket Granting Service (TGS)</strong>.</li>
        <li><strong>TGT (Ticket Granting Ticket)</strong> — the "wristband": proof you authenticated, used to request further tickets.</li>
        <li><strong>TGS (Service Ticket)</strong> — a per-service ticket that grants access to one specific service.</li>
        <li><strong>krbtgt</strong> — a special hidden account whose password hash the KDC uses to encrypt/sign every TGT. Remember this account; it is the linchpin of Golden Tickets (Lesson 6).</li>
        <li><strong>SPN (Service Principal Name)</strong> — a unique name identifying a service instance (e.g. <code>MSSQLSvc/sql01.corp.local:1433</code>), tied to the service account that runs it.</li>
      </ul>

      <h3>The flow, step by step</h3>
      <ol>
        <li><strong>AS-REQ / AS-REP (get a TGT).</strong> The client sends an authentication request to the AS. On success the KDC returns a <strong>TGT</strong>, encrypted with the <em>krbtgt</em> hash so only the KDC can later read it. This is logged as <strong>Event ID 4768</strong> (a TGT was requested).</li>
        <li><strong>TGS-REQ / TGS-REP (get a service ticket).</strong> When the client wants a specific service, it presents its TGT and names the target <strong>SPN</strong>. The KDC returns a <strong>TGS</strong> encrypted with the <em>service account's</em> hash. This is logged as <strong>Event ID 4769</strong> (a service ticket was requested).</li>
        <li><strong>AP-REQ (use the ticket).</strong> The client presents the TGS to the service itself. The service decrypts it with its own key and grants access. The user's password never travelled to the service.</li>
      </ol>

      <pre><code>Client → AS:   "I'm alice"                         (AS-REQ)
AS    → Client: TGT  [encrypted with krbtgt hash]    (AS-REP)   → Event 4768
Client → TGS:  "TGT + I want MSSQLSvc/sql01"         (TGS-REQ)
TGS   → Client: TGS  [encrypted with service hash]   (TGS-REP)  → Event 4769
Client → SQL:  "here's my TGS"                        (AP-REQ)</code></pre>

      <h3>Why this design gets attacked</h3>
      <p>Two facts from the flow become attack roots you'll meet later:</p>
      <ul>
        <li><strong>The TGS is encrypted with the service account's password hash.</strong> Anyone with a valid TGT can request a TGS for any SPN — and then try to crack that ticket offline to recover the service password. That is <strong>Kerberoasting</strong> (Lesson 6). Crucially, the request (4769) is logged, but the offline cracking is invisible.</li>
        <li><strong>Every TGT is signed with the krbtgt hash.</strong> An attacker who steals the krbtgt hash can forge arbitrary, fully-trusted TGTs for anyone — a <strong>Golden Ticket</strong>. This is why krbtgt is the most sensitive secret in the domain.</li>
      </ul>

      <h3>Encryption types matter</h3>
      <p>Kerberos tickets can be encrypted with different ciphers, identified by an <strong>etype</strong>. Legacy <strong>RC4 (etype 0x17)</strong> is far easier to crack than modern <strong>AES (etype 0x11/0x12)</strong>. A TGS-REQ that specifically asks for RC4 in an AES-capable domain is a classic Kerberoasting indicator — the attacker is downgrading to make offline cracking faster.</p>

      <blockquote>Anchor these three: <strong>4768</strong> = "asked for a TGT," <strong>4769</strong> = "asked for a service ticket," and <strong>krbtgt</strong> = "the secret that makes all TGTs trustworthy." Almost every Kerberos attack is a twist on one of these.</blockquote>
    `,
    quizzes: [
      { id: "ad-l4-q1", question: "What does a TGT (Ticket Granting Ticket) represent?", options: ["Access to one specific service", "Proof the user authenticated, used to request further service tickets", "The user's password in plaintext", "A firewall rule"], correctAnswerIndex: 1, explanation: "The TGT is the 'wristband' proving authentication; it is presented to request per-service TGS tickets." },
      { id: "ad-l4-q2", question: "The krbtgt account's hash is used to do what?", options: ["Encrypt the AD database", "Encrypt/sign every TGT so only the KDC can validate it", "Store user photos", "Route network packets"], correctAnswerIndex: 1, explanation: "The KDC encrypts and signs TGTs with the krbtgt hash, making krbtgt the linchpin of Kerberos trust." },
      { id: "ad-l4-q3", question: "A TGS (service ticket) is encrypted with whose secret?", options: ["The krbtgt hash", "The requesting user's password", "The target service account's password hash", "The DC's BIOS key"], correctAnswerIndex: 2, explanation: "The service ticket is encrypted with the service account's hash — which is exactly what makes Kerberoasting possible." },
      { id: "ad-l4-q4", question: "Which Event ID corresponds to a TGT request (AS-REQ)?", options: ["4624", "4768", "4769", "4776"], correctAnswerIndex: 1, explanation: "Event ID 4768 records that a Kerberos authentication (TGT) ticket was requested." },
      { id: "ad-l4-q5", question: "Which Event ID corresponds to a service ticket request (TGS-REQ)?", options: ["4768", "4769", "4625", "5140"], correctAnswerIndex: 1, explanation: "Event ID 4769 records that a Kerberos service (TGS) ticket was requested — central to Kerberoasting detection." },
      { id: "ad-l4-q6", question: "What is an SPN (Service Principal Name)?", options: ["A password policy", "A unique name identifying a service instance, tied to the account that runs it", "A type of firewall", "The name of the KDC"], correctAnswerIndex: 1, explanation: "An SPN uniquely identifies a service (e.g. MSSQLSvc/host:1433) and links it to its service account." },
      { id: "ad-l4-q7", question: "Why is a TGS-REQ asking for RC4 (etype 0x17) in an AES-capable domain suspicious?", options: ["RC4 is faster for legitimate users", "It suggests an attacker downgrading encryption to make the ticket easier to crack offline (Kerberoasting)", "RC4 disables logging", "It is required by all services"], correctAnswerIndex: 1, explanation: "Requesting weak RC4 when AES is available is a classic Kerberoasting indicator of encryption downgrade for faster cracking." },
      { id: "ad-l4-q8", question: "Why can Kerberoasting's cracking stage go undetected?", options: ["Because the TGS request isn't logged", "Because the offline cracking of the ticket happens off the network, producing no auth logs", "Because Kerberos has no logs at all", "Because it crashes the DC"], correctAnswerIndex: 1, explanation: "The 4769 request is logged, but cracking the ticket happens offline on the attacker's own machine, generating no domain telemetry." },
    ],
  },

  // ── LESSON 5 ───────────────────────────────────────────────────────────────
  {
    title: "05 // Enumeration and Credential Theft Concepts",
    summary: "How attackers map a domain after gaining a foothold, where credentials live in memory, and the conceptual basis of Pass-the-Hash and Pass-the-Ticket.",
    content: `
      <h2>The quiet phase before the loud one</h2>
      <p>Once an attacker has any authenticated foothold — even a single low-privilege user — their next move is almost never noisy. It is <strong>enumeration</strong>: quietly asking the domain legitimate questions to build a map. Understanding this phase is vital because it is often your <em>earliest</em> detection opportunity.</p>

      <h3>What enumeration looks like</h3>
      <p>AD is, by design, readable by authenticated users — that's how the enterprise functions. An attacker abuses this openness to learn:</p>
      <ul>
        <li><strong>Users and groups</strong> — who exists, and who is in privileged groups like Domain Admins.</li>
        <li><strong>Computers</strong> — what servers and workstations are joined to the domain.</li>
        <li><strong>SPNs</strong> — which accounts run services (targets for Kerberoasting).</li>
        <li><strong>ACLs and delegations</strong> — who can modify whom (the raw material of attack paths, Lesson 8).</li>
        <li><strong>GPOs and trusts</strong> — configuration and cross-domain relationships.</li>
      </ul>
      <p>Because these queries use normal LDAP and directory calls, individually they look benign. The <em>volume and breadth</em> of queries from one host in a short window is the tell — a workstation suddenly enumerating the entire directory is behaving like a tool, not a person.</p>

      <h3>Where credentials live: LSASS</h3>
      <p>On a Windows host, the <strong>LSASS (Local Security Authority Subsystem Service)</strong> process holds authentication secrets in memory — NTLM hashes and Kerberos tickets for accounts that have logged on. An attacker with local admin on a machine can read LSASS memory to harvest those secrets. This single step — <strong>credential dumping (MITRE T1003)</strong> — is the hinge between "I have one box" and "I can move".</p>
      <blockquote>Defensive levers here are concrete: Credential Guard isolates LSASS secrets in a protected container; restricting local-admin rights limits who can dump at all; and Event ID <strong>4688</strong> plus EDR telemetry on processes opening a handle to lsass.exe is a high-signal detection.</blockquote>

      <h3>Pass-the-Hash (T1550.002) — conceptually</h3>
      <p>Recall from Lesson 3 that NTLM authenticates with the hash, not the plaintext. So an attacker who dumps an NT hash can authenticate to other systems <em>as that user without ever cracking the password</em> — they simply present the hash. That is <strong>Pass-the-Hash (PtH)</strong>. It is not a software bug; it is a direct consequence of how NTLM works.</p>

      <h3>Pass-the-Ticket (T1550.003) — conceptually</h3>
      <p>The Kerberos analogue: instead of a hash, the attacker steals a valid <strong>Kerberos ticket</strong> (a TGT or TGS) from LSASS and injects it into their own session to impersonate the user for as long as the ticket is valid. That is <strong>Pass-the-Ticket (PtT)</strong>.</p>

      <table>
        <thead><tr><th></th><th>Pass-the-Hash</th><th>Pass-the-Ticket</th></tr></thead>
        <tbody>
          <tr><td>Protocol</td><td>NTLM</td><td>Kerberos</td></tr>
          <tr><td>Stolen secret</td><td>NT hash</td><td>TGT or TGS ticket</td></tr>
          <tr><td>ATT&CK ID</td><td>T1550.002</td><td>T1550.003</td></tr>
          <tr><td>Lifetime of abuse</td><td>Until password changes</td><td>Until ticket expires</td></tr>
        </tbody>
      </table>

      <h3>Why detection is hard — and where the seams are</h3>
      <p>Both techniques reuse <em>legitimate</em> credentials, so the resulting logons can look normal. The detectable seams are the <strong>context</strong>, not the credential: a logon from an unexpected source host, at an unusual time, using a logon type that doesn't match the user's habits, or a ticket appearing on a machine that never requested it from the KDC. You catch these by knowing normal — the same baseline discipline that underpins all detection.</p>
    `,
    quizzes: [
      { id: "ad-l5-q1", question: "What is enumeration in the AD attack context?", options: ["Encrypting the domain", "Quietly querying the directory to map users, groups, computers, SPNs, and permissions", "Deleting log files", "Rebooting the Domain Controller"], correctAnswerIndex: 1, explanation: "Enumeration is the reconnaissance phase where an attacker uses legitimate directory queries to map the environment." },
      { id: "ad-l5-q2", question: "Why is enumeration hard to spot on any single query?", options: ["Queries are encrypted end-to-end", "AD is designed to be readable by authenticated users, so individual queries look benign", "Enumeration is never logged", "It only happens offline"], correctAnswerIndex: 1, explanation: "Because AD must be queryable to function, single lookups appear normal; the volume and breadth from one host is the tell." },
      { id: "ad-l5-q3", question: "What is LSASS and why does it matter to attackers?", options: ["A logging service", "The Windows process holding auth secrets (hashes, tickets) in memory, which can be dumped for credentials", "A firewall component", "The Kerberos KDC"], correctAnswerIndex: 1, explanation: "LSASS stores NTLM hashes and Kerberos tickets in memory; dumping it (T1003) yields credentials for lateral movement." },
      { id: "ad-l5-q4", question: "Pass-the-Hash is possible because…", options: ["NTLM authenticates using the hash itself, so the plaintext is never needed", "Kerberos tickets are unencrypted", "Passwords are stored in cleartext", "It exploits a buffer overflow"], correctAnswerIndex: 0, explanation: "Since NTLM proves identity with the NT hash, a stolen hash can be replayed without cracking the password." },
      { id: "ad-l5-q5", question: "What does Pass-the-Ticket steal and reuse?", options: ["An NT hash", "A valid Kerberos ticket (TGT or TGS) injected into the attacker's session", "A GPO", "A DNS record"], correctAnswerIndex: 1, explanation: "PtT steals a Kerberos ticket from LSASS and injects it to impersonate the user until the ticket expires." },
      { id: "ad-l5-q6", question: "Which is a concrete defensive lever against LSASS credential dumping?", options: ["Disabling DNS", "Credential Guard, restricting local-admin rights, and monitoring handles opened to lsass.exe", "Deleting all tickets nightly", "Turning off Kerberos"], correctAnswerIndex: 1, explanation: "Credential Guard isolates LSASS secrets, least-privilege limits who can dump, and process telemetry on lsass access detects attempts." },
      { id: "ad-l5-q7", question: "Why are Pass-the-Hash and Pass-the-Ticket hard to detect?", options: ["They generate no logs of any kind", "They reuse legitimate credentials, so resulting logons can look normal", "They only work on Linux", "They crash the network"], correctAnswerIndex: 1, explanation: "Because they abuse valid credentials, the logons blend in; detection relies on contextual anomalies rather than the credential itself." },
      { id: "ad-l5-q8", question: "What is the detectable 'seam' for these credential-reuse attacks?", options: ["The credential value itself", "Context: unexpected source host, unusual time, mismatched logon type, or a ticket on a machine that never requested it", "The size of the log file", "The colour of the alert"], correctAnswerIndex: 1, explanation: "You catch reuse via contextual anomalies against a known baseline, not by inspecting the (legitimate) credential." },
    ],
  },

  // ── LESSON 6 ───────────────────────────────────────────────────────────────
  {
    title: "06 // Kerberos Attacks: Roasting and Forged Tickets",
    summary: "Kerberoasting, AS-REP roasting, and Golden/Silver tickets explained by what they abuse — plus the concrete detections and hardening for each.",
    content: `
      <h2>Turning ticket features into attacks</h2>
      <p>Lesson 4 gave you the Kerberos flow. This lesson shows the four canonical attacks that abuse it. For each, focus on <em>what is abused</em> and <em>how you detect and harden</em> — not on execution.</p>

      <h3>Kerberoasting (T1558.003)</h3>
      <p><strong>What's abused:</strong> any authenticated user can request a TGS for any SPN, and that ticket is encrypted with the service account's password hash. The attacker requests service tickets, extracts them, and cracks them offline to recover service-account passwords.</p>
      <ul>
        <li><strong>Detect:</strong> Event ID <strong>4769</strong> anomalies — one account requesting many distinct SPNs in a short window, and especially requests specifying weak <strong>RC4 (0x17)</strong> encryption in an AES-capable domain. Honeypot ("decoy") service accounts with an SPN and no real use are a superb tripwire: any TGS request for them is malicious by definition.</li>
        <li><strong>Harden:</strong> long/complex (25+ char) service-account passwords, enforce <strong>AES</strong> and disable RC4, and migrate service accounts to <strong>gMSA</strong> (Group Managed Service Accounts) whose 120-character passwords rotate automatically and are effectively uncrackable.</li>
      </ul>

      <h3>AS-REP Roasting (T1558.004)</h3>
      <p><strong>What's abused:</strong> accounts configured with <em>"Do not require Kerberos pre-authentication"</em> will have the AS-REP returned with a portion encrypted under the user's own password hash — <em>without</em> the account first proving it knows the password. An attacker can request that AS-REP for any such user and crack it offline.</p>
      <ul>
        <li><strong>Detect:</strong> Event ID <strong>4768</strong> where pre-authentication is not required; enumeration of accounts with the <code>DONT_REQ_PREAUTH</code> flag set.</li>
        <li><strong>Harden:</strong> ensure pre-authentication is required on all accounts (it is by default); audit for and remove the flag where it was set for legacy reasons; use strong passwords.</li>
      </ul>

      <h3>Silver Ticket (T1558.002)</h3>
      <p><strong>What's abused:</strong> a TGS is encrypted with the <em>service account's</em> hash. An attacker who has stolen that specific service hash can forge a TGS for that one service directly — <em>without contacting the KDC at all</em>. It is scoped to a single service but stealthy, because no 4769 is generated on the DC.</p>
      <ul>
        <li><strong>Detect:</strong> service access with no corresponding 4769 on the DC; anomalies between logon events on the target and the absence of KDC ticket requests. This is why correlating service-side logons with DC ticket logs matters.</li>
        <li><strong>Harden:</strong> protect service-account credentials (gMSA), rotate them, and enforce AES.</li>
      </ul>

      <h3>Golden Ticket (T1558.001)</h3>
      <p><strong>What's abused:</strong> the <strong>krbtgt</strong> hash signs every TGT. An attacker who has stolen the krbtgt hash — typically after full domain compromise — can forge arbitrary, fully-trusted TGTs for <em>any</em> user (including a fabricated Domain Admin) with an arbitrary lifetime. This is near-total, durable domain control.</p>
      <ul>
        <li><strong>Detect:</strong> TGTs with anomalous lifetimes or properties; TGS requests (4769) that have no preceding TGT request (4768) on the DC; RC4 where AES is expected. This is genuinely hard to catch, which is why prevention dominates.</li>
        <li><strong>Harden:</strong> protect DCs and krbtgt above all else; <strong>rotate the krbtgt password TWICE</strong> (the double reset invalidates existing Golden Tickets) as part of recovery; enforce tiered admin so krbtgt is virtually unreachable.</li>
      </ul>

      <table>
        <thead><tr><th>Attack</th><th>Secret abused</th><th>Contacts KDC?</th><th>Key detection</th></tr></thead>
        <tbody>
          <tr><td>Kerberoasting</td><td>Service acct hash (via TGS)</td><td>Yes (4769)</td><td>Many SPN requests / RC4 downgrade</td></tr>
          <tr><td>AS-REP Roasting</td><td>User hash (via AS-REP)</td><td>Yes (4768)</td><td>No-preauth accounts / 4768 anomalies</td></tr>
          <tr><td>Silver Ticket</td><td>Service acct hash (forged TGS)</td><td>No</td><td>Service logon with no matching 4769</td></tr>
          <tr><td>Golden Ticket</td><td>krbtgt hash (forged TGT)</td><td>No (for TGT)</td><td>Anomalous TGT / 4769 without 4768</td></tr>
        </tbody>
      </table>

      <blockquote>The through-line: "roasting" attacks <strong>request</strong> real tickets to crack a password offline (loud-ish, logged), while "ticket" attacks <strong>forge</strong> tickets from a stolen key (stealthy, may bypass the KDC). Roasting is a credential-access problem; forged tickets are a domain-compromise problem.</blockquote>
    `,
    quizzes: [
      { id: "ad-l6-q1", question: "In Kerberoasting, what secret is ultimately targeted?", options: ["The krbtgt hash", "The service account's password (recovered by cracking the TGS offline)", "The DC's disk encryption key", "The user's smart card PIN"], correctAnswerIndex: 1, explanation: "The TGS is encrypted with the service account's hash, so cracking it offline recovers that account's password." },
      { id: "ad-l6-q2", question: "Which is the strongest hardening against Kerberoasting?", options: ["Blocking port 22", "Migrating service accounts to gMSA with long auto-rotating passwords and enforcing AES", "Disabling all logging", "Deleting the KDC"], correctAnswerIndex: 1, explanation: "gMSA passwords are ~120 chars and auto-rotate, making offline cracking infeasible; AES removes weak-cipher downgrade." },
      { id: "ad-l6-q3", question: "What condition enables AS-REP roasting on an account?", options: ["The account is a Domain Admin", "'Do not require Kerberos pre-authentication' is set, so the AS-REP is returned without proving the password first", "The account has no SPN", "The account is disabled"], correctAnswerIndex: 1, explanation: "Without pre-authentication required, anyone can request the AS-REP and crack the portion encrypted with the user's hash offline." },
      { id: "ad-l6-q4", question: "What distinguishes a Silver Ticket from a Golden Ticket?", options: ["Silver forges a TGS for one service using its hash; Golden forges TGTs for any user using the krbtgt hash", "They are identical", "Silver requires the krbtgt hash; Golden does not", "Golden works only on Linux"], correctAnswerIndex: 0, explanation: "A Silver Ticket is a forged service ticket scoped to one service; a Golden Ticket is a forged TGT granting broad, durable access." },
      { id: "ad-l6-q5", question: "Why can a Silver Ticket be especially stealthy?", options: ["It deletes all logs", "It is forged with the service hash and never contacts the KDC, so no 4769 is generated", "It requires no credentials", "It runs on the firewall"], correctAnswerIndex: 1, explanation: "Because the attacker forges the TGS locally, the DC sees no ticket request — detection relies on correlating service logons with missing 4769s." },
      { id: "ad-l6-q6", question: "Why is rotating the krbtgt password TWICE important during recovery?", options: ["It speeds up logins", "The double reset invalidates existing (forged) Golden Tickets", "It changes the domain name", "It disables NTLM"], correctAnswerIndex: 1, explanation: "krbtgt keeps a current and previous key; resetting twice ensures previously issued/forged TGTs are no longer valid." },
      { id: "ad-l6-q7", question: "Which detection is a strong Kerberoasting tripwire?", options: ["Blocking ICMP", "Decoy (honeypot) service accounts with SPNs — any TGS request for them is malicious by definition", "Disabling Event ID 4769", "Deleting all service accounts"], correctAnswerIndex: 1, explanation: "A honeypot SPN has no legitimate use, so any 4769 requesting its ticket is inherently suspicious." },
      { id: "ad-l6-q8", question: "What is the conceptual difference between 'roasting' and 'ticket' attacks?", options: ["Roasting forges tickets; ticket attacks request them", "Roasting requests real tickets to crack offline; ticket attacks forge tickets from a stolen key", "They are the same", "Only ticket attacks are logged"], correctAnswerIndex: 1, explanation: "Roasting requests legitimate tickets (logged) for offline cracking; forged-ticket attacks fabricate tickets from a stolen key and may bypass the KDC." },
    ],
  },

  // ── LESSON 7 ───────────────────────────────────────────────────────────────
  {
    title: "07 // Lateral Movement and Privilege Escalation",
    summary: "How an attacker turns one foothold into domain dominance — the movement techniques, escalation paths, and the detections that catch each.",
    content: `
      <h2>From one box to the whole domain</h2>
      <p>An attacker rarely lands where they want to end up. <strong>Lateral movement</strong> is spreading from the initial foothold to other hosts; <strong>privilege escalation</strong> is climbing from a low-privilege account to a high-privilege one. Chained together, they turn a phished intern's laptop into Domain Admin. This lesson maps the common moves and their tells.</p>

      <h3>Lateral movement techniques</h3>
      <table>
        <thead><tr><th>Technique</th><th>How it moves</th><th>Detection focus</th></tr></thead>
        <tbody>
          <tr><td><strong>Pass-the-Hash / Pass-the-Ticket</strong></td><td>Reuse stolen NTLM hash or Kerberos ticket to auth elsewhere.</td><td>Logon type/source anomalies (Lesson 5); tickets on hosts that never requested them.</td></tr>
          <tr><td><strong>Remote services (T1021)</strong></td><td>SMB admin shares, RDP, WMI, WinRM/PowerShell Remoting to run code on a remote host.</td><td>Event 4624 type 3 (network) and type 10 (RemoteInteractive/RDP); 5140 share access; remote process creation (4688).</td></tr>
          <tr><td><strong>Remote service creation (PsExec-style)</strong></td><td>Create/start a service on a remote host to execute as SYSTEM.</td><td>Event 7045 (service installed); anomalous service names.</td></tr>
          <tr><td><strong>Overpass-the-Hash</strong></td><td>Use a stolen NT hash to request a real Kerberos TGT (hash → ticket).</td><td>4768 requesting RC4 shortly after credential theft; NTLM→Kerberos transitions.</td></tr>
        </tbody>
      </table>

      <h3>Privilege escalation in AD</h3>
      <p>Escalation in AD is frequently not a memory-corruption exploit but the <strong>abuse of excessive rights and misconfigurations</strong>:</p>
      <ul>
        <li><strong>Dangerous ACLs</strong> — if a low-priv account has rights like <code>GenericAll</code>, <code>WriteDACL</code>, or <code>ForceChangePassword</code> over a privileged object, it can grant itself control. These are the edges BloodHound (Lesson 8) maps.</li>
        <li><strong>Kerberos delegation abuse</strong> — unconstrained or constrained delegation misconfigurations can let a compromised host impersonate other users to services.</li>
        <li><strong>DCSync (T1003.006)</strong> — an account with directory-replication rights (<em>Replicating Directory Changes</em>) can ask a DC to hand over password hashes <em>as if it were another DC</em> — including the krbtgt hash. This is the classic bridge to a Golden Ticket. Detect via Event <strong>4662</strong> for replication rights from a non-DC source, and via <strong>4769</strong>/replication traffic from unexpected hosts.</li>
        <li><strong>Group nesting surprises</strong> — a user may be Domain Admin through several layers of nested group membership nobody remembers granting.</li>
      </ul>

      <h3>The privilege ladder to watch</h3>
      <ol>
        <li>Foothold as a standard user.</li>
        <li>Local admin on one machine (via local exploit, credential reuse, or dumping).</li>
        <li>Harvest credentials of a more privileged account that logged into that machine.</li>
        <li>Move to a host where a Domain Admin session or hash exists.</li>
        <li>Dump domain secrets (DCSync / DC compromise) → forge tickets → own the domain.</li>
      </ol>

      <blockquote>Detection insight: the single most valuable pattern to catch is a <strong>privileged account authenticating to a machine it has no business being on</strong>. Domain Admins should log on only to hardened, tiered admin systems — a DA credential appearing on an ordinary workstation is a five-alarm event, and the tiered model (Lesson 9) exists specifically to make that pattern rare and therefore detectable.</blockquote>
    `,
    quizzes: [
      { id: "ad-l7-q1", question: "What is the difference between lateral movement and privilege escalation?", options: ["They are the same thing", "Lateral movement spreads to other hosts; privilege escalation climbs to a higher-privilege account", "Escalation moves between hosts; lateral movement raises privileges", "Both only occur on the DC"], correctAnswerIndex: 1, explanation: "Lateral movement is spreading across machines; escalation is gaining higher privileges — attackers chain both." },
      { id: "ad-l7-q2", question: "What does DCSync abuse?", options: ["A buffer overflow in the KDC", "Directory-replication rights, letting an account request password hashes from a DC as if it were another DC", "Weak RDP passwords", "DNS caching"], correctAnswerIndex: 1, explanation: "DCSync (T1003.006) uses replication rights to pull hashes — including krbtgt — impersonating a DC, bridging to a Golden Ticket." },
      { id: "ad-l7-q3", question: "In AD, privilege escalation is frequently achieved by…", options: ["Zero-day kernel exploits only", "Abusing excessive rights and misconfigurations such as dangerous ACLs and delegation", "Rebooting the DC", "Changing the wallpaper"], correctAnswerIndex: 1, explanation: "AD escalation commonly abuses over-granted ACLs (GenericAll, WriteDACL), delegation, and nested group membership." },
      { id: "ad-l7-q4", question: "Which Event ID indicates a service was installed (a PsExec-style move)?", options: ["4768", "7045", "4625", "4104"], correctAnswerIndex: 1, explanation: "Event ID 7045 logs a new service installation, a common lateral-movement and code-execution artifact." },
      { id: "ad-l7-q5", question: "What is Overpass-the-Hash?", options: ["Cracking a hash offline", "Using a stolen NT hash to request a legitimate Kerberos TGT (hash → ticket)", "Deleting the krbtgt account", "A GPO edit"], correctAnswerIndex: 1, explanation: "Overpass-the-Hash converts a stolen NTLM hash into a real Kerberos ticket, blending NTLM theft with Kerberos access." },
      { id: "ad-l7-q6", question: "Why is DCSync often detected via Event ID 4662?", options: ["4662 logs disk usage", "4662 can record directory-replication rights being exercised, flagging replication from a non-DC source", "4662 is a Kerberos ticket event", "4662 logs failed passwords"], correctAnswerIndex: 1, explanation: "4662 records access to directory objects/rights; replication rights invoked from a non-DC host is a strong DCSync signal." },
      { id: "ad-l7-q7", question: "Which single pattern is most valuable to catch for lateral movement?", options: ["Any successful login", "A privileged account (e.g. Domain Admin) authenticating to a machine it has no business being on", "A user changing their wallpaper", "A server rebooting"], correctAnswerIndex: 1, explanation: "A high-privilege credential appearing on an ordinary workstation strongly indicates credential theft and movement." },
      { id: "ad-l7-q8", question: "Why does the tiered admin model make such patterns detectable?", options: ["It deletes logs", "By restricting where privileged accounts may log on, any appearance outside those systems becomes a rare, high-signal anomaly", "It disables Kerberos", "It hides the DC"], correctAnswerIndex: 1, explanation: "If DAs only ever log on to tiered admin systems, a DA credential elsewhere is immediately anomalous and worth alerting on." },
    ],
  },

  // ── LESSON 8 ───────────────────────────────────────────────────────────────
  {
    title: "08 // Attack-Path Mapping: Thinking in Graphs (BloodHound)",
    summary: "Why attackers see AD as a graph of relationships, how tools like BloodHound reveal hidden paths to Domain Admin, and how defenders cut the choke points.",
    content: `
      <h2>AD is a graph, and attackers know it</h2>
      <p>Defenders often picture AD as a list — a big directory of users and groups. Attackers picture it as a <strong>graph</strong>: nodes (users, computers, groups, GPOs) connected by edges (relationships and permissions). The question they ask is not "who is a Domain Admin?" but "what is the <em>shortest path</em> from the account I already control to Domain Admin?" Reframing your own environment as a graph is the single biggest perspective shift in AD defence.</p>

      <h3>What BloodHound does (conceptually)</h3>
      <p><strong>BloodHound</strong> is the well-known tool — used by both red and blue teams — that collects AD relationship data and renders it as a graph you can query. A collector ("SharpHound") gathers node and edge data (group memberships, sessions, ACLs, delegations, admin rights), and BloodHound then answers questions like "show me every path from Domain Users to Domain Admins."</p>
      <p>The edges it maps are exactly the escalation primitives from Lesson 7:</p>
      <ul>
        <li><strong>MemberOf</strong> — group membership, including deep nesting.</li>
        <li><strong>AdminTo</strong> — this principal is local admin on that machine.</li>
        <li><strong>HasSession</strong> — this user currently has a session on that machine (so their credentials are harvestable there).</li>
        <li><strong>GenericAll / WriteDACL / ForceChangePassword / Owns</strong> — dangerous control relationships over another object.</li>
        <li><strong>CanRDP / ExecuteDCOM</strong> — remote execution rights.</li>
      </ul>

      <h3>Why paths hide</h3>
      <p>No one designs a path from an intern to Domain Admin. It emerges from years of accumulated grants: a helpdesk group nested inside another group that was once given ACL rights over a server where an admin happens to keep a session. Each link is individually reasonable; the <em>chain</em> is catastrophic. Humans cannot see these chains by reading the directory — a graph can.</p>

      <h3>Defensive use: same tool, opposite goal</h3>
      <p>Blue teams run BloodHound proactively to <strong>find and cut paths before attackers walk them</strong>. The workflow:</p>
      <ol>
        <li><strong>Map</strong> the graph of your own domain.</li>
        <li><strong>Identify choke points</strong> — edges that many paths pass through. Cutting one high-traffic edge can eliminate hundreds of paths at once.</li>
        <li><strong>Remediate</strong> — remove the unnecessary ACL, un-nest the group, remove the stale local-admin right, or end the risky session pattern.</li>
        <li><strong>Re-map</strong> to confirm the paths are gone.</li>
      </ol>

      <blockquote>The choke-point insight is the payoff: you don't need to fix every misconfiguration to dramatically reduce risk. Find the few edges that the most attack paths depend on and cut those first. This is risk reduction by leverage, not by exhaustion.</blockquote>

      <h3>Detecting the collection itself</h3>
      <p>Because collectors query the directory broadly, their activity can be detected: a single host performing extensive LDAP enumeration, large numbers of session/ACL queries, or SharpHound-like access patterns in a short window. This ties back to Lesson 5 — the enumeration phase is your early-warning system, and heavy graph collection is one of its loudest forms.</p>
    `,
    quizzes: [
      { id: "ad-l8-q1", question: "How do attackers conceptually view Active Directory?", options: ["As a flat list of users", "As a graph of nodes (users, computers, groups) connected by permission edges", "As a single encrypted file", "As a firewall"], correctAnswerIndex: 1, explanation: "Attackers see AD as a graph and look for the shortest path from a controlled account to Domain Admin." },
      { id: "ad-l8-q2", question: "What does BloodHound do?", options: ["Encrypts the domain", "Collects AD relationship data and renders it as a queryable graph of attack paths", "Resets passwords", "Blocks IP addresses"], correctAnswerIndex: 1, explanation: "BloodHound maps nodes and edges so you can query paths like 'Domain Users → Domain Admins'." },
      { id: "ad-l8-q3", question: "The 'HasSession' edge indicates what?", options: ["A user is a Domain Admin", "A user currently has a session on a machine, so their credentials are harvestable there", "A machine is offline", "A GPO is linked"], correctAnswerIndex: 1, explanation: "HasSession means the user's credentials are present on that machine, making it a target for credential theft." },
      { id: "ad-l8-q4", question: "Why do dangerous attack paths tend to hide?", options: ["They are deliberately designed", "They emerge from years of individually-reasonable grants (nested groups, stale ACLs) that chain into a catastrophic path", "AD deletes them", "They only exist in test environments"], correctAnswerIndex: 1, explanation: "Each grant seems reasonable alone; the accumulated chain is invisible to list-reading humans but obvious to a graph." },
      { id: "ad-l8-q5", question: "What is a 'choke point' in attack-path analysis?", options: ["A network bottleneck", "An edge that many attack paths pass through, so cutting it eliminates many paths at once", "A slow login", "A full disk"], correctAnswerIndex: 1, explanation: "Choke points are high-leverage edges; removing one can eliminate hundreds of paths, enabling risk reduction by leverage." },
      { id: "ad-l8-q6", question: "Which edge represents a dangerous control relationship over another object?", options: ["MemberOf", "GenericAll / WriteDACL", "CanPrint", "HasMailbox"], correctAnswerIndex: 1, explanation: "GenericAll, WriteDACL, ForceChangePassword, and Owns are control edges that allow escalation over the target object." },
      { id: "ad-l8-q7", question: "How should blue teams use BloodHound?", options: ["To attack partner companies", "Proactively to find and cut attack paths before attackers walk them, then re-map to verify", "To store passwords", "To replace the SIEM"], correctAnswerIndex: 1, explanation: "Defenders map their own domain, cut choke-point edges, remediate, and re-map to confirm paths are gone." },
      { id: "ad-l8-q8", question: "Why can graph-collection activity itself be detected?", options: ["It is silent", "Collectors query the directory broadly, so a host doing heavy LDAP/session/ACL enumeration in a short window stands out", "It never touches the network", "It only runs on the DC console"], correctAnswerIndex: 1, explanation: "Broad, rapid enumeration from one host (SharpHound-like patterns) is a loud form of the reconnaissance phase and detectable." },
    ],
  },

  // ── LESSON 9 ───────────────────────────────────────────────────────────────
  {
    title: "09 // Hardening AD: Tiered Admin and Defence in Depth",
    summary: "The architectural defences that shrink AD's attack surface — the tiered administration model, privileged access practices, LAPS, gMSA, and protected accounts.",
    content: `
      <h2>Design the environment so attacks can't chain</h2>
      <p>Detection catches attacks in progress; <strong>hardening</strong> removes the conditions that let them succeed. The most important AD hardening ideas are architectural — they change the shape of the environment so that the lateral-movement and escalation chains from Lessons 7–8 have nowhere to go.</p>

      <h3>The tiered administration model — the big one</h3>
      <p>The core insight: <strong>credential exposure follows logon.</strong> Every time a privileged account logs on to a machine, its credentials can be stolen from that machine. So the fix is to strictly control <em>where</em> privileged accounts are allowed to log on. Microsoft's tiered model divides assets into levels:</p>
      <table>
        <thead><tr><th>Tier</th><th>Contains</th><th>Rule</th></tr></thead>
        <tbody>
          <tr><td><strong>Tier 0</strong></td><td>Domain Controllers, AD itself, identity systems (the crown jewels)</td><td>Tier 0 accounts may log on ONLY to Tier 0 assets.</td></tr>
          <tr><td><strong>Tier 1</strong></td><td>Servers and applications</td><td>Tier 1 admins manage servers, never touch Tier 0.</td></tr>
          <tr><td><strong>Tier 2</strong></td><td>Workstations and end-user devices</td><td>Tier 2 admins manage workstations only.</td></tr>
        </tbody>
      </table>
      <p>The unbreakable rule is <strong>no downward credential exposure</strong>: a Tier 0 (Domain Admin) credential must never be typed into a Tier 1 or Tier 2 machine, because those lower tiers are more exposed and more likely to be compromised. Enforced properly, this makes the classic path — steal a DA hash off an ordinary workstation — impossible, because a DA never logs on there.</p>

      <h3>Privileged Access Workstations (PAWs)</h3>
      <p>Tier 0 admins do their work from hardened, dedicated <strong>Privileged Access Workstations</strong> that are locked down, isolated from the internet and email, and used for nothing else. The PAW is the only place high-tier credentials appear, drastically shrinking where they can be stolen.</p>

      <h3>Managing the accounts themselves</h3>
      <ul>
        <li><strong>LAPS (Local Administrator Password Solution)</strong> — gives every machine a <em>unique, randomised, rotating</em> local admin password stored in AD. This kills lateral movement via a shared local-admin password (the "one password to rule them all" problem).</li>
        <li><strong>gMSA</strong> — Group Managed Service Accounts with long auto-rotating passwords; the primary structural fix for Kerberoasting (Lesson 6).</li>
        <li><strong>Protected Users group</strong> — members get stronger protections: no NTLM, no RC4, no delegation, no long-lived credential caching — directly blunting PtH and roasting.</li>
        <li><strong>Least privilege &amp; ACL hygiene</strong> — regularly audit and remove the excessive rights and nested memberships that create attack paths.</li>
        <li><strong>Disable/monitor NTLM and RC4</strong> — reduce legacy protocol attack surface; enforce AES for Kerberos.</li>
      </ul>

      <h3>Protecting the crown jewels</h3>
      <p>Because krbtgt and the DCs underpin all trust: restrict and monitor DC logons, protect the krbtgt account, rotate krbtgt periodically (and twice during incident recovery), and treat any change to Tier 0 objects as a high-severity event.</p>

      <blockquote>Defence in depth for AD: keys/gMSA, tiering, PAWs, LAPS, Protected Users, least privilege, and NTLM/RC4 reduction are layers. An attacker must defeat all of them; you only need one to hold. No single control is sufficient, and no single control is optional.</blockquote>
    `,
    quizzes: [
      { id: "ad-l9-q1", question: "What core insight motivates the tiered administration model?", options: ["Passwords are unbreakable", "Credential exposure follows logon — every logon risks that credential being stolen from the machine", "Kerberos is insecure", "Logs are unnecessary"], correctAnswerIndex: 1, explanation: "Because a privileged credential can be stolen from any machine it logs on to, tiering controls WHERE such accounts may log on." },
      { id: "ad-l9-q2", question: "What lives in Tier 0?", options: ["End-user workstations", "Domain Controllers, AD, and core identity systems — the crown jewels", "Printers", "Guest Wi-Fi"], correctAnswerIndex: 1, explanation: "Tier 0 contains the most sensitive identity infrastructure; Tier 0 accounts may only log on to Tier 0 assets." },
      { id: "ad-l9-q3", question: "What is the unbreakable rule of the tiered model?", options: ["Admins share one password", "No downward credential exposure — a higher-tier credential must never be used on a lower-tier machine", "All accounts are Domain Admins", "Tier 0 logs on everywhere"], correctAnswerIndex: 1, explanation: "Higher-tier credentials must never touch more-exposed lower tiers, preventing theft off ordinary machines." },
      { id: "ad-l9-q4", question: "What problem does LAPS solve?", options: ["Slow logins", "Shared/identical local admin passwords across machines that enable easy lateral movement", "DNS resolution", "Kerberos ticket expiry"], correctAnswerIndex: 1, explanation: "LAPS gives each machine a unique, rotating local admin password, killing lateral movement via a shared local-admin credential." },
      { id: "ad-l9-q5", question: "What is a Privileged Access Workstation (PAW)?", options: ["A shared kiosk", "A hardened, isolated, single-purpose workstation from which Tier 0 admins work", "A backup server", "A VPN gateway"], correctAnswerIndex: 1, explanation: "PAWs are locked-down dedicated machines that confine where high-tier credentials appear, shrinking theft opportunities." },
      { id: "ad-l9-q6", question: "What protections do members of the Protected Users group receive?", options: ["Faster network speeds", "No NTLM, no RC4, no delegation, and no long-lived credential caching — blunting PtH and roasting", "Unlimited storage", "Automatic Domain Admin"], correctAnswerIndex: 1, explanation: "Protected Users enforces stronger credential handling that directly weakens Pass-the-Hash and roasting attacks." },
      { id: "ad-l9-q7", question: "Which is the primary structural fix for Kerberoasting mentioned here?", options: ["Disabling logging", "Group Managed Service Accounts (gMSA) with long auto-rotating passwords", "Enabling RC4", "Deleting all SPNs"], correctAnswerIndex: 1, explanation: "gMSA passwords are long and auto-rotated, making the offline cracking that Kerberoasting depends on infeasible." },
      { id: "ad-l9-q8", question: "What does 'defence in depth' mean for AD hardening?", options: ["Relying on one perfect control", "Layering many controls (tiering, PAWs, LAPS, gMSA, least privilege) so an attacker must defeat them all", "Encrypting logs twice", "Hiding the domain name"], correctAnswerIndex: 1, explanation: "Defence in depth stacks independent controls; the attacker must beat every layer while you need only one to hold." },
    ],
  },

  // ── LESSON 10 ──────────────────────────────────────────────────────────────
  {
    title: "10 // Detection, Logging, and Mapping AD Attacks to MITRE ATT&CK",
    summary: "The Event IDs and telemetry that reveal AD attacks, how to build detections that survive tuning, and the ATT&CK map that ties the whole course together.",
    content: `
      <h2>Turning the whole course into detections</h2>
      <p>You now understand how AD works and how it is attacked. The final skill is operational: knowing <em>exactly which telemetry</em> reveals each attack, and mapping it all to <strong>MITRE ATT&CK</strong> so your detection program is organised, communicable, and complete.</p>

      <h3>The Event IDs every AD analyst memorises</h3>
      <table>
        <thead><tr><th>Event ID</th><th>Meaning</th><th>Why it matters</th></tr></thead>
        <tbody>
          <tr><td><strong>4624</strong></td><td>Successful logon (note the <em>logon type</em>: 3=network, 10=RDP)</td><td>Baseline of who logs on where; anomalies reveal lateral movement.</td></tr>
          <tr><td><strong>4625</strong></td><td>Failed logon</td><td>Brute force / spraying against AD accounts.</td></tr>
          <tr><td><strong>4768</strong></td><td>Kerberos TGT requested (AS-REQ)</td><td>AS-REP roasting and Golden Ticket anomalies; watch etype.</td></tr>
          <tr><td><strong>4769</strong></td><td>Kerberos service ticket requested (TGS-REQ)</td><td>The keystone Kerberoasting signal; RC4/many-SPN anomalies.</td></tr>
          <tr><td><strong>4776</strong></td><td>NTLM credential validation</td><td>NTLM usage tracking; unexpected NTLM is hunt-worthy.</td></tr>
          <tr><td><strong>4662</strong></td><td>Operation on a directory object (incl. replication rights)</td><td>DCSync detection when replication is invoked from a non-DC.</td></tr>
          <tr><td><strong>4670 / 5136</strong></td><td>Permissions/object attribute changed</td><td>ACL abuse and privilege-escalation edge creation.</td></tr>
          <tr><td><strong>7045</strong></td><td>Service installed</td><td>PsExec-style remote execution / lateral movement.</td></tr>
          <tr><td><strong>4688 / 4104</strong></td><td>Process creation / PowerShell script block</td><td>Tooling execution, enumeration, credential dumping.</td></tr>
        </tbody>
      </table>

      <h3>Detections that survive tuning</h3>
      <p>Because AD attacks abuse legitimate features, naive detections drown in false positives. The mature approach blends signals:</p>
      <ul>
        <li><strong>Kerberoasting:</strong> not just "a 4769 happened" (millions do) — alert on <em>one account requesting many distinct SPNs</em>, or <em>any RC4 request in an AES domain</em>, or <em>any request for a honeypot SPN</em>.</li>
        <li><strong>Golden/Silver ticket:</strong> 4769 with no preceding 4768; tickets with anomalous lifetimes; service access with no matching KDC request.</li>
        <li><strong>DCSync:</strong> replication rights (4662) exercised from a host that is not a Domain Controller.</li>
        <li><strong>Lateral movement:</strong> a privileged account's 4624 on a machine outside its tier; new services (7045) with random names.</li>
      </ul>
      <blockquote>The discipline is identical to the SOC fundamentals: know normal, blend signals, and tune out false positives so the real thing stands out. A honeypot object — a decoy SPN or a canary admin account — is the highest-fidelity AD detection you can deploy, because it has no legitimate use.</blockquote>

      <h3>The full ATT&CK map for this course</h3>
      <table>
        <thead><tr><th>Attack</th><th>ATT&CK Tactic</th><th>Technique ID</th></tr></thead>
        <tbody>
          <tr><td>Domain / directory enumeration</td><td>Discovery</td><td>T1087 Account Discovery, T1069 Group Discovery</td></tr>
          <tr><td>LSASS credential dumping</td><td>Credential Access</td><td>T1003 OS Credential Dumping</td></tr>
          <tr><td>Kerberoasting</td><td>Credential Access</td><td>T1558.003</td></tr>
          <tr><td>AS-REP roasting</td><td>Credential Access</td><td>T1558.004</td></tr>
          <tr><td>DCSync</td><td>Credential Access</td><td>T1003.006</td></tr>
          <tr><td>Pass-the-Hash</td><td>Lateral Movement / Defense Evasion</td><td>T1550.002</td></tr>
          <tr><td>Pass-the-Ticket</td><td>Lateral Movement / Defense Evasion</td><td>T1550.003</td></tr>
          <tr><td>Silver Ticket</td><td>Persistence / Priv. Esc.</td><td>T1558.002</td></tr>
          <tr><td>Golden Ticket</td><td>Persistence / Priv. Esc.</td><td>T1558.001</td></tr>
          <tr><td>Remote services (RDP/SMB/WMI)</td><td>Lateral Movement</td><td>T1021</td></tr>
          <tr><td>Valid accounts (post-compromise)</td><td>Defense Evasion / Persistence</td><td>T1078</td></tr>
        </tbody>
      </table>

      <h3>The chain, one last time</h3>
      <p>A full AD intrusion is a chain: <em>Discovery</em> (enumerate) → <em>Credential Access</em> (dump/roast) → <em>Lateral Movement</em> (PtH/PtT/remote services) → <em>Privilege Escalation</em> (ACL abuse/DCSync) → <em>Persistence</em> (Golden Ticket). Every link is a chance to detect and cut. You don't need to catch them at every stage — catching them at <strong>any</strong> stage defeats the intrusion.</p>

      <blockquote>Capstone mindset: hardening shrinks what can happen, tiering shapes what's normal, telemetry reveals what's abnormal, and ATT&CK organises it all into a map of tripwires. An AD defender who can explain Kerberos from first principles AND write the 4769 detection that catches its abuse is exactly who every SOC wants to hire.</blockquote>
    `,
    quizzes: [
      { id: "ad-l10-q1", question: "Which Event ID is the keystone signal for Kerberoasting detection?", options: ["4625", "4769", "7045", "4624"], correctAnswerIndex: 1, explanation: "4769 (Kerberos service ticket requested) is central; anomalies like RC4 or many distinct SPNs indicate Kerberoasting." },
      { id: "ad-l10-q2", question: "Event ID 4662 helps detect which attack when invoked from a non-DC host?", options: ["Kerberoasting", "DCSync (replication rights abuse)", "Password spraying", "RDP brute force"], correctAnswerIndex: 1, explanation: "Replication rights (visible via 4662) exercised from a non-Domain-Controller strongly indicate DCSync." },
      { id: "ad-l10-q3", question: "Why is 'a 4769 happened' a poor Kerberoasting detection by itself?", options: ["4769 is never logged", "Millions of legitimate 4769s occur; you must blend signals like many-SPN or RC4-in-AES to avoid false positives", "4769 only logs failures", "It applies only to NTLM"], correctAnswerIndex: 1, explanation: "Service ticket requests are normal and constant; useful detection requires anomaly context, not the bare event." },
      { id: "ad-l10-q4", question: "Which ATT&CK technique ID covers a Golden Ticket?", options: ["T1558.001", "T1558.003", "T1003.006", "T1021"], correctAnswerIndex: 0, explanation: "Golden Ticket is T1558.001 (Forge Kerberos Tickets: Golden Ticket)." },
      { id: "ad-l10-q5", question: "What makes a honeypot (decoy) SPN or canary admin account such a high-fidelity detection?", options: ["It processes real work", "It has no legitimate use, so any access or ticket request for it is inherently malicious", "It disables logging", "It speeds up the DC"], correctAnswerIndex: 1, explanation: "Decoy objects have zero legitimate use, so any interaction is malicious by definition — near-zero false positives." },
      { id: "ad-l10-q6", question: "A 4769 with no preceding 4768 on the DC can indicate what?", options: ["Normal operation", "A forged ticket (Golden/Silver) where the TGT was never legitimately requested from the KDC", "A DNS failure", "A printer error"], correctAnswerIndex: 1, explanation: "A service ticket use without a corresponding legitimate TGT request suggests a forged ticket bypassing the normal flow." },
      { id: "ad-l10-q7", question: "Pass-the-Ticket maps to which ATT&CK technique?", options: ["T1550.003", "T1558.003", "T1087", "T1078"], correctAnswerIndex: 0, explanation: "Pass-the-Ticket is T1550.003 (Use Alternate Authentication Material: Pass the Ticket)." },
      { id: "ad-l10-q8", question: "What is the key takeaway about the AD attack chain?", options: ["You must detect every stage or fail", "It is a chain (Discovery → Credential Access → Lateral Movement → Priv Esc → Persistence), and catching it at ANY stage defeats the intrusion", "Only the final stage matters", "The chain has no detectable points"], correctAnswerIndex: 1, explanation: "Because the intrusion progresses through linked stages, detection at any single stage can break the whole chain." },
    ],
  },
];
