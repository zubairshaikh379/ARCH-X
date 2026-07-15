// ─────────────────────────────────────────────────────────────────────────────
// SOC ANALYST — DEEP GUIDEBOOK (pilot template for ARCH-X textbook-grade courses)
//
// Content is authored as SEMANTIC HTML and rendered inside `.md-content`
// (see src/index.css) — h2/h3/p/ul/ol/li/pre/code/table/blockquote/strong are
// all styled there, so lessons render correctly without relying on Tailwind
// class scanning.
//
// Structure mirrors a real syllabus: Intro → Foundations → Core → Sub-topics →
// Tooling → Detection → Response → Hardening → ATT&CK → Evasion → Pitfalls →
// Interview/Capstone. Each lesson ends with an 8-question knowledge check.
// ─────────────────────────────────────────────────────────────────────────────

import type { Course } from "../courses";

type Lesson = Course["lessons"][number];

// New optional Overview fields (spread into the soc-analyst course object).
export const SOC_ANALYST_META: Pick<
  Course,
  "prerequisites" | "learningOutcomes" | "mustKnow" | "commonGaps" | "prosCons" | "careerNotes"
> = {
  prerequisites: [
    "Comfort with a Linux shell (cd, ls, cat, less) — you don't need to be an expert.",
    "A mental model of TCP/IP: ports, IP addresses, and the client→server handshake.",
    "Basic text-processing instinct (you've used Ctrl-F; grep is the same idea, supercharged).",
    "No prior security experience required — every concept is built up from zero.",
  ],
  learningOutcomes: [
    "Read raw SSH authentication logs and reconstruct exactly what an attacker did.",
    "Tell a brute-force campaign apart from a forgetful employee — with evidence, not vibes.",
    "Write grep/awk one-liners that turn 100,000 noisy log lines into a 3-line verdict.",
    "Correlate events across hosts into a single incident timeline the way a SIEM does.",
    "Contain an active attacker with the correct firewall action — and know why DROP ≠ REJECT.",
    "Harden SSH so the same attack can't succeed twice, and map every step to MITRE ATT&CK.",
  ],
  mustKnow: [
    "/var/log/auth.log", "/var/log/secure", "sshd", "PAM", "syslog format", "journald",
    "T1110 Brute Force", "Password Spraying", "Credential Stuffing", "Log Correlation",
    "SIEM", "Sliding Window", "GeoIP / ASN", "iptables / nftables", "fail2ban",
    "DROP vs REJECT", "Key-based auth", "MTTD / MTTR", "True/False Positive",
  ],
  commonGaps: [
    "Timezones. Most beginners never check whether logs are in UTC or local time — and then build a timeline that's silently 5 hours wrong.",
    "Baselines. You can't spot 'abnormal' until you know what 'normal' noise looks like for THIS server. Courses skip this; real SOCs live by it.",
    "False positives. Real analysts spend more time tuning out benign alerts than catching attackers. Detection without tuning just produces alert fatigue.",
    "What success looks like. A failed-then-succeeded login from one IP is the moment that matters — many learners stop at 'lots of failures' and miss the breach.",
    "Encrypted-traffic blind spots. SSH payloads are encrypted; you analyse metadata (who/when/how often), not contents. Knowing the limit keeps you honest.",
    "Documentation. An undocumented investigation is an unrepeatable one. Write-ups are a core skill, not an afterthought.",
  ],
  prosCons: {
    pros: [
      "Log-based detection is cheap, universal, and works on every Linux host out of the box.",
      "Authentication telemetry is high-signal: failed logins map almost 1:1 to intent.",
      "Skills transfer directly to SIEM roles, threat hunting, and incident response.",
    ],
    cons: [
      "Logs can be tampered with or deleted by an attacker who gains root — they are evidence, not ground truth.",
      "Threshold-based detection is trivially evaded by low-and-slow and distributed attacks.",
      "You see metadata only; encrypted session contents remain opaque to log analysis.",
    ],
  },
  careerNotes:
    "SSH/auth log auditing is the bread-and-butter of a Tier-1 SOC Analyst — usually the first security job after help-desk or a CS/IT background. It feeds directly into Tier-2 triage, Threat Hunting, Incident Response, and Detection Engineering. Common certs that map to this material: CompTIA Security+, Blue Team Level 1 (BTL1), and the practical TryHackMe SOC Level 1 / HackTheBox paths. In most markets a junior SOC role is a realistic 0–2 year target; the analysts who advance fastest are the ones who learn to tune detections and write clear incident reports, not just read alerts.",
};

export const SOC_ANALYST_LESSONS: Lesson[] = [
  // ── LESSON 1 ───────────────────────────────────────────────────────────────
  {
    title: "01 // The SOC and the Defensive Mission",
    summary: "What a Security Operations Center actually does, how the analyst tiers work, and where SSH intrusion auditing fits in.",
    content: `
      <h2>Welcome to the blue team</h2>
      <p>A <strong>Security Operations Center (SOC)</strong> is the room — physical or virtual — where an organisation watches its own systems for signs of attack and responds when something is wrong. If a company is a castle, the SOC is the watch: people on the walls, reading the signals, deciding when to ring the bell. This course puts you on that wall, focused on one of the most common real-world attacks: people trying to break in over <strong>SSH</strong>.</p>

      <p>You are <em>defensive</em>. You are not attacking anyone. Your job is observation, judgement, and timely action — turning a flood of ordinary events into a small number of correct decisions.</p>

      <h3>The three tiers of a SOC</h3>
      <p>Most SOCs are organised in tiers, and almost everyone starts at Tier 1:</p>
      <table>
        <thead><tr><th>Tier</th><th>Role</th><th>What they do</th></tr></thead>
        <tbody>
          <tr><td><strong>Tier 1</strong></td><td>Triage Analyst</td><td>Monitors alert queues, separates real threats from noise, escalates what matters. This is where SSH auditing lives.</td></tr>
          <tr><td><strong>Tier 2</strong></td><td>Incident Responder</td><td>Takes escalations, investigates deeply, contains and remediates incidents.</td></tr>
          <tr><td><strong>Tier 3</strong></td><td>Threat Hunter / Engineer</td><td>Proactively hunts for threats no alert fired on, and builds/﻿tunes the detections themselves.</td></tr>
        </tbody>
      </table>

      <h3>The analyst mindset</h3>
      <p>Good analysts share three habits:</p>
      <ul>
        <li><strong>Curiosity with discipline</strong> — chase the anomaly, but prove it with evidence before you act.</li>
        <li><strong>Comfort with "normal"</strong> — you can only see the unusual if you know the usual. A noisy server isn't automatically a compromised one.</li>
        <li><strong>Bias to document</strong> — if you didn't write it down, it didn't happen. Your timeline is the deliverable.</li>
      </ul>

      <h3>Why SSH?</h3>
      <p><strong>SSH (Secure Shell)</strong> is how administrators remotely control Linux servers. Because it is a direct door to a machine, it is one of the most attacked services on the internet. A server with a public SSH port will typically see <em>thousands</em> of automated login attempts per day from bots scanning the whole internet. Learning to read those attempts — and tell the dangerous ones from the background noise — is the perfect first lesson in defensive security.</p>

      <blockquote>The single moment this entire course trains you to catch: a source that fails to log in many times and then <strong>succeeds</strong>. Failures alone are noise. A failure-to-success transition from a hostile source is a breach.</blockquote>

      <h3>What you will build toward</h3>
      <p>By the capstone you will take a raw <code>auth.log</code>, identify an attacker's IP, prove the attack with a command-line query, contain it with a firewall rule, and harden the host so it can't happen again — and you'll be able to explain each step in an interview.</p>
    `,
    quizzes: [
      { id: "soc-l1-q1", question: "What is the primary purpose of a SOC?", options: ["To build new product features", "To monitor an organisation's systems for attacks and respond to them", "To manage employee payroll", "To design marketing campaigns"], correctAnswerIndex: 1, explanation: "A SOC is the team/function responsible for continuous monitoring, detection, and response to security threats." },
      { id: "soc-l1-q2", question: "Which tier typically handles initial alert triage?", options: ["Tier 3", "Tier 2", "Tier 1", "There are no tiers"], correctAnswerIndex: 2, explanation: "Tier 1 analysts monitor the alert queue, separate signal from noise, and escalate genuine threats." },
      { id: "soc-l1-q3", question: "In this course, are you acting offensively or defensively?", options: ["Offensively — attacking targets", "Defensively — detecting and responding", "Neither", "Both equally"], correctAnswerIndex: 1, explanation: "SOC work is blue-team / defensive: observe, judge, and respond to attacks against your own systems." },
      { id: "soc-l1-q4", question: "Why is a public SSH port heavily targeted?", options: ["It is rarely used so attackers get curious", "It is a direct remote-control door to a server, so bots constantly probe it", "It only works on weekends", "SSH cannot be encrypted"], correctAnswerIndex: 1, explanation: "SSH grants remote shell access to a host, making it a high-value, constantly-scanned target." },
      { id: "soc-l1-q5", question: "Which single event best signals an actual breach?", options: ["Many failed logins from one IP", "A failure-to-success login transition from a hostile source", "A successful login during business hours", "A server rebooting"], correctAnswerIndex: 1, explanation: "Failures are noise; a hostile source that fails repeatedly and then succeeds has likely guessed valid credentials." },
      { id: "soc-l1-q6", question: "Why does the course stress knowing what 'normal' looks like?", options: ["Normal traffic is illegal", "You can only recognise anomalies against an established baseline", "Normal logs are deleted automatically", "It has no real value"], correctAnswerIndex: 1, explanation: "Without a baseline of normal activity, you cannot reliably distinguish benign noise from a real attack." },
      { id: "soc-l1-q7", question: "Which habit makes an investigation repeatable and defensible?", options: ["Working only from memory", "Documenting the timeline and evidence", "Acting before gathering evidence", "Ignoring false positives"], correctAnswerIndex: 1, explanation: "Documentation turns a one-off hunch into a repeatable, auditable investigation others can verify." },
      { id: "soc-l1-q8", question: "Which role proactively hunts for threats that no alert fired on?", options: ["Tier 1 Triage Analyst", "Tier 3 Threat Hunter / Detection Engineer", "Help desk", "End users"], correctAnswerIndex: 1, explanation: "Tier 3 hunts undetected threats and builds/tunes the detections themselves." },
    ],
  },

  // ── LESSON 2 ───────────────────────────────────────────────────────────────
  {
    title: "02 // Foundations: SSH, sshd, and the Authentication Lifecycle",
    summary: "How an SSH login actually works under the hood, the role of the sshd daemon and PAM, and exactly where the evidence gets written.",
    content: `
      <h2>From keystroke to log line</h2>
      <p>To audit SSH logins you must first understand what happens when someone connects. SSH listens, by default, on <strong>TCP port 22</strong>. A background program called the <strong>SSH daemon (<code>sshd</code>)</strong> owns that port and handles every incoming connection.</p>

      <h3>The authentication lifecycle</h3>
      <ol>
        <li><strong>Connection</strong> — a client opens a TCP connection to port 22.</li>
        <li><strong>Handshake</strong> — client and server negotiate encryption and exchange keys. From this point the channel is encrypted.</li>
        <li><strong>Authentication</strong> — the client proves who it is, usually with a password or a cryptographic key. <code>sshd</code> hands this check to <strong>PAM</strong>.</li>
        <li><strong>Outcome</strong> — success allocates a shell (a <code>pty</code>); failure is rejected. <em>Either way, the event is logged.</em></li>
      </ol>

      <h3>What is PAM?</h3>
      <p><strong>PAM (Pluggable Authentication Modules)</strong> is the Linux subsystem that actually decides whether a credential is valid. <code>sshd</code> doesn't check passwords itself — it asks PAM. PAM is also what writes the familiar <code>Failed password</code> and <code>Accepted password</code> messages you will spend this course reading.</p>

      <h3>Where the evidence lives</h3>
      <p>This is the most important practical fact in the lesson — memorise it:</p>
      <table>
        <thead><tr><th>System family</th><th>Auth log location</th></tr></thead>
        <tbody>
          <tr><td>Debian / Ubuntu</td><td><code>/var/log/auth.log</code></td></tr>
          <tr><td>RHEL / CentOS / Fedora</td><td><code>/var/log/secure</code></td></tr>
          <tr><td>systemd (any modern distro)</td><td><code>journalctl -u ssh</code> (binary journal)</td></tr>
        </tbody>
      </table>

      <p>A typical successful line looks like this:</p>
      <pre><code>Jun 25 14:02:15 web01 sshd[2841]: Accepted password for root from 198.51.100.12 port 53122 ssh2</code></pre>

      <p>And a failure:</p>
      <pre><code>Jun 25 14:02:11 web01 sshd[2839]: Failed password for root from 198.51.100.12 port 53110 ssh2</code></pre>

      <p>Notice how much is in each line: the time, the host (<code>web01</code>), the process and PID (<code>sshd[2841]</code>), the outcome, the target username, and the source IP and port. Every one of those fields is a lever you'll pull when hunting.</p>

      <blockquote>Because the SSH channel is encrypted, you will never see the <em>password that was tried</em> or the <em>commands run</em> in these logs. You see <strong>metadata</strong>: who tried, as whom, from where, when, and whether it worked. Effective auditing is the art of drawing strong conclusions from metadata alone.</blockquote>

      <h3>"Invalid user" — a free gift</h3>
      <p>When an attacker guesses a username that doesn't exist, you'll see <code>Failed password for invalid user oracle from ...</code>. A flood of <code>invalid user</code> lines is a near-certain sign of automated username guessing — real users rarely fat-finger usernames that don't exist on the box.</p>
    `,
    quizzes: [
      { id: "soc-l2-q1", question: "Which daemon handles incoming SSH connections?", options: ["httpd", "sshd", "crond", "systemd-resolved"], correctAnswerIndex: 1, explanation: "sshd is the SSH server daemon that listens on port 22 and processes connections." },
      { id: "soc-l2-q2", question: "What is the default TCP port for SSH?", options: ["21", "22", "80", "443"], correctAnswerIndex: 1, explanation: "SSH listens on TCP port 22 by default." },
      { id: "soc-l2-q3", question: "On a Debian/Ubuntu system, where are SSH auth events written?", options: ["/var/log/secure", "/var/log/auth.log", "/etc/ssh/sshd_config", "/var/log/httpd/access.log"], correctAnswerIndex: 1, explanation: "Debian/Ubuntu write authentication events to /var/log/auth.log; RHEL/CentOS use /var/log/secure." },
      { id: "soc-l2-q4", question: "What does PAM do in the login flow?", options: ["Encrypts the network packets", "Decides whether a credential is valid and logs the outcome", "Assigns IP addresses", "Compresses log files"], correctAnswerIndex: 1, explanation: "PAM (Pluggable Authentication Modules) performs the actual credential check and emits the success/failure messages." },
      { id: "soc-l2-q5", question: "Why can't you see the actual password an attacker tried in the logs?", options: ["Passwords are too long to log", "The SSH channel is encrypted, so only metadata is recorded", "Logs only store images", "The attacker disabled logging"], correctAnswerIndex: 1, explanation: "SSH encrypts the session, so logs capture metadata (who/when/where/outcome), not the secret itself." },
      { id: "soc-l2-q6", question: "A flood of 'Failed password for invalid user ...' lines most likely indicates what?", options: ["A misconfigured printer", "Automated username guessing by a bot", "Normal user behaviour", "A successful login"], correctAnswerIndex: 1, explanation: "'Invalid user' means the username doesn't exist; many such lines indicate automated guessing." },
      { id: "soc-l2-q7", question: "In the line 'sshd[2841]: Accepted password for root from 198.51.100.12', what is 198.51.100.12?", options: ["The server's hostname", "The source IP of the client", "The username", "The port number"], correctAnswerIndex: 1, explanation: "That field is the source IP address the connection originated from." },
      { id: "soc-l2-q8", question: "Which command reads SSH events from the systemd journal?", options: ["cat /var/log/journal", "journalctl -u ssh", "tail -f /etc/passwd", "grep ssh /proc"], correctAnswerIndex: 1, explanation: "journalctl -u ssh queries the systemd journal for the SSH unit's logs." },
    ],
  },

  // ── LESSON 3 ───────────────────────────────────────────────────────────────
  {
    title: "03 // Anatomy of a Log Entry",
    summary: "Dissecting syslog and JSON log formats field-by-field, and why timestamps (and timezones) are the backbone of every investigation.",
    content: `
      <h2>A log line is a sentence — learn to parse it</h2>
      <p>Raw logs look intimidating until you realise each line follows a fixed grammar. The classic <strong>syslog</strong> format is:</p>
      <pre><code>&lt;timestamp&gt; &lt;hostname&gt; &lt;process&gt;[&lt;pid&gt;]: &lt;message&gt;</code></pre>

      <p>Mapped onto a real line:</p>
      <table>
        <thead><tr><th>Field</th><th>Example</th><th>Why you care</th></tr></thead>
        <tbody>
          <tr><td>Timestamp</td><td><code>Jun 25 14:02:11</code></td><td>Orders events; the spine of correlation.</td></tr>
          <tr><td>Hostname</td><td><code>web01</code></td><td>Which machine — vital when many hosts ship to one place.</td></tr>
          <tr><td>Process[PID]</td><td><code>sshd[2839]</code></td><td>Which program, and which exact instance, produced it.</td></tr>
          <tr><td>Message</td><td><code>Failed password for root from 198.51.100.12</code></td><td>The actual event content you analyse.</td></tr>
        </tbody>
      </table>

      <h3>Structured vs unstructured logs</h3>
      <p>Traditional syslog is <strong>unstructured</strong> — a human-readable string you must parse with patterns. Modern pipelines often emit <strong>structured</strong> logs (JSON), where every field is labelled:</p>
      <pre><code>{
  "timestamp": "2026-06-25T14:02:11Z",
  "host": "web01",
  "process": "sshd",
  "event": "SSH_FAILED",
  "user": "root",
  "src_ip": "198.51.100.12",
  "src_port": 53110
}</code></pre>
      <p>Structured logs are far easier for machines to query and correlate — no fragile regex needed. Much of a SIEM's job is <strong>normalising</strong> messy unstructured logs into clean structured fields.</p>

      <h3>Timestamps: the field everyone underestimates</h3>
      <p>Correlation is impossible without trustworthy time. Three rules:</p>
      <ul>
        <li><strong>Prefer UTC.</strong> Servers around the world should log in UTC so events line up. The <code>Z</code> in <code>14:02:11Z</code> means UTC.</li>
        <li><strong>Beware local time.</strong> A log in local time without an offset is a trap — your timeline can be silently hours off.</li>
        <li><strong>Mind clock drift.</strong> If hosts aren't synced with NTP, their timestamps disagree and correlation breaks. Trustworthy time comes from synchronised clocks.</li>
      </ul>

      <blockquote>The most common rookie mistake in this whole discipline: building an incident timeline from logs in two different timezones and never noticing. Always confirm the timezone before you trust the order of events.</blockquote>

      <h3>Sequence tells the story</h3>
      <p>Individually, these are four boring lines. In order, they are a breach:</p>
      <pre><code>14:02:11 Failed password for root from 198.51.100.12
14:02:12 Failed password for admin from 198.51.100.12
14:02:14 Failed password for db_admin from 198.51.100.12
14:02:15 Accepted password for root from 198.51.100.12</code></pre>
      <p>Same source, rapid failures across several usernames, then success. Reading sequence — not just individual lines — is the core analytical skill.</p>
    `,
    quizzes: [
      { id: "soc-l3-q1", question: "In classic syslog, which part comes first on the line?", options: ["The message", "The timestamp", "The PID", "The source IP"], correctAnswerIndex: 1, explanation: "Syslog lines begin with the timestamp, followed by hostname, process[pid], then the message." },
      { id: "soc-l3-q2", question: "What does the 'Z' in 2026-06-25T14:02:11Z indicate?", options: ["The log is compressed", "The time is in UTC", "The event failed", "The timezone is unknown"], correctAnswerIndex: 1, explanation: "'Z' (Zulu) denotes UTC, the recommended timezone for server logs." },
      { id: "soc-l3-q3", question: "Why are structured (JSON) logs easier to correlate than plain syslog?", options: ["They are shorter", "Every value is labelled with a named field, removing fragile parsing", "They cannot be tampered with", "They store no timestamps"], correctAnswerIndex: 1, explanation: "Named fields let machines query and join logs reliably without brittle regex." },
      { id: "soc-l3-q4", question: "A SIEM's normalisation step does what?", options: ["Deletes old logs", "Converts messy unstructured logs into clean, consistent fields", "Encrypts the network", "Blocks IP addresses"], correctAnswerIndex: 1, explanation: "Normalisation maps varied raw log formats into a common structured schema for analysis." },
      { id: "soc-l3-q5", question: "What breaks correlation when hosts aren't synced with NTP?", options: ["Disk space runs out", "Clock drift makes timestamps disagree", "Logs become encrypted", "Usernames change"], correctAnswerIndex: 1, explanation: "Without synchronised clocks, timestamps across hosts conflict and event ordering becomes unreliable." },
      { id: "soc-l3-q6", question: "In 'sshd[2839]', what does 2839 represent?", options: ["The source port", "The process ID (PID)", "The user ID", "The number of failures"], correctAnswerIndex: 1, explanation: "The bracketed number is the PID — the specific process instance that logged the line." },
      { id: "soc-l3-q7", question: "Which is the single most underestimated field in log analysis?", options: ["The hostname", "The timestamp / timezone", "The PID", "The process name"], correctAnswerIndex: 1, explanation: "Timezone and timestamp accuracy underpin every timeline; getting them wrong corrupts the whole investigation." },
      { id: "soc-l3-q8", question: "What turns four ordinary log lines into evidence of a breach?", options: ["Their colour in the terminal", "Reading them in sequence: failures from one source, then success", "The number of bytes", "The font used"], correctAnswerIndex: 1, explanation: "Sequence reveals the failure→success pattern from a single hostile source — the breach signature." },
    ],
  },

  // ── LESSON 4 ───────────────────────────────────────────────────────────────
  {
    title: "04 // Brute Force & Credential Attacks (MITRE T1110)",
    summary: "The family of password-guessing attacks you'll defend against — brute force, dictionary, password spraying, and credential stuffing — and the tools attackers use.",
    content: `
      <h2>How attackers guess their way in</h2>
      <p>The attacks you'll detect in this course all live under MITRE ATT&CK technique <strong>T1110: Brute Force</strong>. They differ in <em>how</em> they guess, and each leaves a different fingerprint in the logs.</p>

      <h3>The four variants</h3>
      <table>
        <thead><tr><th>Attack</th><th>How it works</th><th>Log fingerprint</th></tr></thead>
        <tbody>
          <tr><td><strong>Brute force</strong></td><td>Tries every possible password against one account.</td><td>Huge volume of failures, one username, one source.</td></tr>
          <tr><td><strong>Dictionary attack</strong></td><td>Tries a wordlist of common/leaked passwords.</td><td>Like brute force but fewer, smarter guesses.</td></tr>
          <tr><td><strong>Password spraying</strong></td><td>Tries ONE common password against MANY accounts.</td><td>Few failures <em>per account</em>, spread across many users — sneaky.</td></tr>
          <tr><td><strong>Credential stuffing</strong></td><td>Replays username:password pairs leaked from other breaches.</td><td>High success rate; often distributed across many IPs.</td></tr>
        </tbody>
      </table>

      <h3>Why spraying defeats naive detection</h3>
      <p>A common rule is "alert on 5+ failures for one account in a minute." Password spraying <em>walks right past it</em>: it only tries one or two passwords per account, so no single account trips the threshold — yet thousands of accounts are under attack at once. The right lens is failures <em>per source IP across all accounts</em>, not per account.</p>

      <h3>The attacker's toolbox</h3>
      <p>You don't need to run these, but recognising the names helps you talk to peers and understand what you're seeing:</p>
      <ul>
        <li><strong>Hydra</strong> — the classic fast network login cracker, supports SSH, FTP, HTTP and more.</li>
        <li><strong>Medusa</strong> — similar, designed for speed and parallelism.</li>
        <li><strong>Patator</strong> — flexible, scriptable brute-forcer favoured for tricky targets.</li>
        <li><strong>Hashcat / John the Ripper</strong> — crack password <em>hashes offline</em> once stolen (different stage, but related).</li>
      </ul>

      <h3>Wordlists and the human factor</h3>
      <p>Attackers rarely guess randomly. They use curated wordlists — the famous <code>rockyou.txt</code> (millions of real leaked passwords) being the archetype. This is why weak, reused passwords fall in seconds: they're already on the list. Defence and offence both revolve around the predictability of human-chosen passwords.</p>

      <blockquote>Detection takeaway: <strong>volume</strong> catches brute force, but <strong>breadth</strong> (one IP touching many accounts) catches spraying, and <strong>success-rate anomalies</strong> catch stuffing. A mature SOC watches all three angles.</blockquote>
    `,
    quizzes: [
      { id: "soc-l4-q1", question: "Which MITRE ATT&CK technique covers these password-guessing attacks?", options: ["T1059 Command Execution", "T1110 Brute Force", "T1486 Data Encrypted for Impact", "T1566 Phishing"], correctAnswerIndex: 1, explanation: "T1110 Brute Force is the ATT&CK technique covering brute force, spraying, and credential stuffing." },
      { id: "soc-l4-q2", question: "How does password spraying differ from classic brute force?", options: ["It tries many passwords against one account", "It tries one common password against many accounts", "It only works over HTTP", "It requires physical access"], correctAnswerIndex: 1, explanation: "Spraying flips the ratio: one (or few) passwords across many accounts to stay under per-account thresholds." },
      { id: "soc-l4-q3", question: "Why does a '5 failures per account per minute' rule miss password spraying?", options: ["The rule is disabled by default", "Spraying makes only 1–2 attempts per account, never tripping the per-account threshold", "Spraying uses no passwords", "The rule only watches successes"], correctAnswerIndex: 1, explanation: "Because spraying spreads attempts thinly across accounts, no single account hits the threshold." },
      { id: "soc-l4-q4", question: "What is credential stuffing?", options: ["Guessing random passwords", "Replaying username:password pairs leaked from other breaches", "Filling forms with junk data", "Encrypting credentials"], correctAnswerIndex: 1, explanation: "Stuffing reuses real leaked credential pairs, exploiting password reuse across services." },
      { id: "soc-l4-q5", question: "Which tool is a classic fast SSH login cracker?", options: ["Wireshark", "Hydra", "nmap", "Photoshop"], correctAnswerIndex: 1, explanation: "Hydra is a well-known network login brute-forcer supporting SSH and many other protocols." },
      { id: "soc-l4-q6", question: "What is rockyou.txt?", options: ["A Linux kernel module", "A famous wordlist of real leaked passwords", "An SSH configuration file", "A firewall ruleset"], correctAnswerIndex: 1, explanation: "rockyou.txt is a widely-used wordlist of millions of leaked passwords, ideal for dictionary attacks." },
      { id: "soc-l4-q7", question: "To catch password spraying, you should measure failures primarily by what?", options: ["Per account", "Per source IP across all accounts", "Per log file size", "Per CPU core"], correctAnswerIndex: 1, explanation: "Spraying is visible when you aggregate failures by source IP across many accounts, not per single account." },
      { id: "soc-l4-q8", question: "What do Hashcat and John the Ripper primarily do?", options: ["Encrypt network traffic", "Crack stolen password hashes offline", "Scan open ports", "Send phishing emails"], correctAnswerIndex: 1, explanation: "They crack hashes offline after the hashes have been stolen — a related but distinct stage from online guessing." },
    ],
  },

  // ── LESSON 5 ───────────────────────────────────────────────────────────────
  {
    title: "05 // Log Correlation & SIEM Fundamentals",
    summary: "How individual events become a single threat narrative, the role of the SIEM, and the sliding-window logic behind real detections.",
    content: `
      <h2>From events to incidents</h2>
      <p>A single failed login means nothing. The skill of correlation is connecting many small events — across time and across machines — into one coherent story. That story is an <strong>incident</strong>.</p>

      <h3>What a SIEM actually is</h3>
      <p>A <strong>SIEM (Security Information and Event Management)</strong> platform is the central brain of a SOC. It does four things:</p>
      <ol>
        <li><strong>Collect</strong> logs from everywhere (servers, firewalls, cloud, apps) into one place.</li>
        <li><strong>Normalise</strong> them into consistent fields (Lesson 3).</li>
        <li><strong>Correlate</strong> them with rules to detect patterns no single log reveals.</li>
        <li><strong>Alert</strong> analysts when a rule fires, with the supporting evidence attached.</li>
      </ol>
      <p>Names you'll meet on the job: <strong>Splunk</strong>, the <strong>Elastic (ELK) Stack</strong>, <strong>Microsoft Sentinel</strong>, <strong>IBM QRadar</strong>, and the open-source <strong>Wazuh</strong>. They differ in price and polish, but all follow the collect→normalise→correlate→alert loop.</p>

      <h3>The sliding window</h3>
      <p>Most brute-force detections use a <strong>sliding time window</strong>: "if X events match within Y seconds, fire." For example:</p>
      <blockquote>IF <strong>10 or more</strong> SSH failures from the <strong>same source IP</strong> occur within a <strong>60-second</strong> window → raise a <em>brute force</em> alert.</blockquote>
      <p>The window "slides" forward continuously, always looking at the most recent Y seconds. Tuning X and Y is a balancing act: too tight and you flood analysts with false positives; too loose and slow attacks slip through.</p>

      <h3>Correlation across sources — the real power</h3>
      <p>The reason a SIEM beats reading one log file is cross-source correlation. Consider three separate systems:</p>
      <table>
        <thead><tr><th>Source</th><th>Event</th></tr></thead>
        <tbody>
          <tr><td>Firewall</td><td>Many connections from 198.51.100.12 to port 22</td></tr>
          <tr><td>Server auth.log</td><td>Repeated SSH failures, then a success, for 198.51.100.12</td></tr>
          <tr><td>Threat intel feed</td><td>198.51.100.12 is on a known-malicious blocklist</td></tr>
        </tbody>
      </table>
      <p>No single source is conclusive. Joined together by the shared IP, they form a high-confidence incident: a known-bad host brute-forced SSH and got in. That join is correlation, and it's what turns raw telemetry into a decision.</p>

      <h3>Use cases and detection rules</h3>
      <p>A packaged detection — its logic, thresholds, and response guidance — is often called a <strong>use case</strong> or <strong>detection rule</strong>. Building and tuning these is the heart of detection engineering (Tier 3), but every analyst must understand them to know <em>why</em> an alert fired and whether to trust it.</p>
    `,
    quizzes: [
      { id: "soc-l5-q1", question: "What does SIEM stand for?", options: ["Secure Internet Email Management", "Security Information and Event Management", "System Integrity and Encryption Module", "Server Internal Event Monitor"], correctAnswerIndex: 1, explanation: "SIEM = Security Information and Event Management — the central log collection, correlation, and alerting platform." },
      { id: "soc-l5-q2", question: "Which is NOT one of the four core SIEM functions?", options: ["Collect logs", "Normalise logs", "Manufacture hardware", "Correlate and alert"], correctAnswerIndex: 2, explanation: "A SIEM collects, normalises, correlates, and alerts — it does not manufacture hardware." },
      { id: "soc-l5-q3", question: "What is a sliding window in detection logic?", options: ["A GUI element", "A continuously-moving time span over which events are counted", "A type of firewall", "An encryption key"], correctAnswerIndex: 1, explanation: "A sliding window counts matching events within the most recent Y seconds, advancing continuously." },
      { id: "soc-l5-q4", question: "If a brute-force window threshold is set too tight (too sensitive), what happens?", options: ["Slow attacks are caught perfectly", "Analysts are flooded with false positives", "Logs stop being collected", "The SIEM shuts down"], correctAnswerIndex: 1, explanation: "Overly sensitive thresholds generate excessive false positives and alert fatigue." },
      { id: "soc-l5-q5", question: "Why is cross-source correlation more powerful than reading one log?", options: ["It uses less disk", "Weak signals from several sources combine into a high-confidence incident", "It deletes false positives", "It encrypts the logs"], correctAnswerIndex: 1, explanation: "Joining firewall, auth, and threat-intel data on a shared key produces conclusions no single source supports." },
      { id: "soc-l5-q6", question: "Which of these is a SIEM platform?", options: ["Splunk", "Photoshop", "MySQL", "nginx"], correctAnswerIndex: 0, explanation: "Splunk is a leading SIEM platform; others include Elastic/ELK, Sentinel, QRadar, and Wazuh." },
      { id: "soc-l5-q7", question: "A packaged detection with its logic, thresholds, and response guidance is called a…", options: ["Screensaver", "Use case / detection rule", "Backup job", "Kernel patch"], correctAnswerIndex: 1, explanation: "Such packaged detections are called use cases or detection rules." },
      { id: "soc-l5-q8", question: "Three sources share the IP 198.51.100.12. What does correlating them yield?", options: ["Nothing useful", "A high-confidence incident: a known-bad host brute-forced SSH and succeeded", "A hardware failure report", "A new user account"], correctAnswerIndex: 1, explanation: "The shared IP links firewall, auth, and threat-intel evidence into one high-confidence incident." },
    ],
  },

  // ── LESSON 6 ───────────────────────────────────────────────────────────────
  {
    title: "06 // Hunting in the Logs: grep, awk & Detection Queries",
    summary: "The command-line skills that turn a 100,000-line log into a three-line verdict — grep, pipes, sort/uniq, and awk.",
    content: `
      <h2>Your hands-on toolkit</h2>
      <p>A SIEM is wonderful, but every analyst must be able to interrogate a raw log file by hand — in an interview, on a box with no SIEM, or to verify what the SIEM claims. The Unix command line is the universal tool. Four commands do 90% of the work: <code>grep</code>, <code>sort</code>, <code>uniq</code>, and <code>awk</code>, glued together with the pipe <code>|</code>.</p>

      <h3>grep — find the lines that matter</h3>
      <p><code>grep</code> prints only the lines matching a pattern. To see every failed login:</p>
      <pre><code>grep "Failed password" /var/log/auth.log</code></pre>
      <p>Count them instead of printing with <code>-c</code>, and combine patterns. To see failures from one suspect IP:</p>
      <pre><code>grep "Failed password" /var/log/auth.log | grep "198.51.100.12"</code></pre>

      <h3>The pipe — build a pipeline</h3>
      <p>The pipe <code>|</code> feeds one command's output into the next. This is the heart of log hunting: each stage narrows the data. The classic "top attacking IPs" pipeline:</p>
      <pre><code>grep "Failed password" /var/log/auth.log \\
  | awk '{print $(NF-3)}' \\
  | sort | uniq -c | sort -nr | head</code></pre>
      <p>Read it left to right: find failures → pull the IP field → sort so identical IPs are adjacent → <code>uniq -c</code> counts each group → <code>sort -nr</code> ranks by count descending → <code>head</code> shows the worst offenders. The output is a ranked table of who is attacking you most. That one line is a real detection.</p>

      <h3>awk — extract and compute on fields</h3>
      <p><code>awk</code> splits each line into fields (<code>$1</code>, <code>$2</code>, …) and lets you print or test them. <code>$(NF-3)</code> means "the 4th-from-last field" — a robust way to grab the IP even when the message length varies. awk can also filter:</p>
      <pre><code># Only successful root logins
awk '/Accepted/ && /root/ {print $1, $2, $3, $(NF-3)}' /var/log/auth.log</code></pre>

      <h3>Finding the failure→success pivot</h3>
      <p>The breach signature — an IP that failed a lot and then succeeded — can be hunted directly. First list IPs with many failures, then check whether any of those same IPs later appear in an <code>Accepted</code> line. When a top-failing IP shows up as accepted, you've found the moment of compromise.</p>

      <blockquote>Mindset: each pipeline stage should make the data smaller and the meaning clearer. If a stage doesn't reduce or sharpen, drop it. The goal is to go from raw noise to a defensible one-line conclusion.</blockquote>

      <h3>Regular expressions, briefly</h3>
      <p><code>grep -E</code> enables extended regex for flexible matching — e.g. <code>grep -E "Failed|Invalid"</code> catches both failures and invalid-user lines at once. You don't need to master regex today; you need to know it exists and turns rigid searches into flexible ones.</p>
    `,
    quizzes: [
      { id: "soc-l6-q1", question: "What does `grep \"Failed password\" /var/log/auth.log` do?", options: ["Deletes failed logins", "Prints only the lines containing 'Failed password'", "Blocks the attacker", "Restarts sshd"], correctAnswerIndex: 1, explanation: "grep filters output to lines matching the pattern." },
      { id: "soc-l6-q2", question: "What is the purpose of the pipe `|`?", options: ["It encrypts output", "It feeds one command's output into the next command", "It deletes a file", "It comments out a line"], correctAnswerIndex: 1, explanation: "The pipe chains commands, sending stdout of one into stdin of the next to build pipelines." },
      { id: "soc-l6-q3", question: "In the pipeline, what does `uniq -c` contribute?", options: ["Encrypts duplicates", "Collapses adjacent identical lines and prefixes each with its count", "Sorts numerically", "Removes the header"], correctAnswerIndex: 1, explanation: "uniq -c counts consecutive duplicate lines, which is why the data is sorted first." },
      { id: "soc-l6-q4", question: "Why is the data sorted before `uniq -c`?", options: ["To make it look nicer", "uniq only collapses ADJACENT duplicates, so identical entries must be grouped first", "Sorting encrypts it", "uniq requires numbers"], correctAnswerIndex: 1, explanation: "uniq compares neighbouring lines only; sorting brings identical values together so counts are correct." },
      { id: "soc-l6-q5", question: "What does `sort -nr` do at the end of the pipeline?", options: ["Sorts alphabetically ascending", "Sorts numerically in reverse (highest count first)", "Removes numbers", "Reverses the file"], correctAnswerIndex: 1, explanation: "-n sorts numerically and -r reverses it, ranking the highest counts (worst offenders) first." },
      { id: "soc-l6-q6", question: "What is awk best at?", options: ["Encrypting traffic", "Splitting lines into fields and printing/testing specific columns", "Managing firewalls", "Compiling code"], correctAnswerIndex: 1, explanation: "awk is a field processor: it tokenises each line and lets you extract or compute on columns." },
      { id: "soc-l6-q7", question: "Why use `$(NF-3)` instead of a fixed field number like `$11`?", options: ["It is shorter to type", "It robustly targets a field relative to the line's end, surviving variable-length messages", "It encrypts the field", "It is required by grep"], correctAnswerIndex: 1, explanation: "Counting from the end (NF = number of fields) stays correct even when earlier message text varies in length." },
      { id: "soc-l6-q8", question: "Which finding from these pipelines indicates an actual compromise?", options: ["An IP with many failures", "A top-failing IP that later appears in an 'Accepted' line", "A log file larger than 1MB", "Any use of sudo"], correctAnswerIndex: 1, explanation: "A heavily-failing IP that subsequently succeeds marks the failure→success pivot — the moment of breach." },
    ],
  },

  // ── LESSON 7 ───────────────────────────────────────────────────────────────
  {
    title: "07 // Triage & Severity: Turning Alerts into Decisions",
    summary: "How to judge an alert quickly and correctly — true vs false positive, enrichment with GeoIP/ASN and threat intel, and severity scoring.",
    content: `
      <h2>The analyst's real job</h2>
      <p>You will not chase every alert to the ground. You will make fast, defensible <em>judgement calls</em> on a queue of them. That process is <strong>triage</strong>, and doing it well is what separates a good Tier-1 analyst from a burnt-out one.</p>

      <h3>The four outcomes of an alert</h3>
      <table>
        <thead><tr><th>Term</th><th>Meaning</th></tr></thead>
        <tbody>
          <tr><td><strong>True Positive</strong></td><td>Alert fired and it IS a real threat. Escalate / respond.</td></tr>
          <tr><td><strong>False Positive</strong></td><td>Alert fired but it's benign (e.g., a backup job logging in). Tune it out.</td></tr>
          <tr><td><strong>True Negative</strong></td><td>No alert and nothing was wrong. The quiet, correct default.</td></tr>
          <tr><td><strong>False Negative</strong></td><td>No alert but there WAS a threat. The dangerous one — a missed attack.</td></tr>
        </tbody>
      </table>
      <p>Tier-1 life is dominated by separating true positives from false positives at speed. False negatives are why threat hunting (Tier 3) exists.</p>

      <h3>Alert fatigue is a real adversary</h3>
      <p>If 95% of alerts are false positives, analysts start rubber-stamping them — and the one real attack slips through. Reducing false positives by <strong>tuning</strong> detections isn't busywork; it's how you stay sharp enough to catch the real thing. Many courses never mention this; every real SOC is obsessed with it.</p>

      <h3>Enrichment: add context before you judge</h3>
      <p>An IP alone is meaningless. <strong>Enrichment</strong> attaches context that makes the verdict obvious:</p>
      <ul>
        <li><strong>GeoIP</strong> — where is this IP physically? A 3am root login from a country you don't operate in is a strong signal.</li>
        <li><strong>ASN</strong> — which network owns it? Traffic from a residential ISP vs a known bulletproof hosting provider tells very different stories.</li>
        <li><strong>Threat intelligence</strong> — is this IP on a reputation blocklist (AbuseIPDB, Spamhaus, internal feeds)? A prior-bad IP raises severity immediately.</li>
        <li><strong>Asset context</strong> — what is the target? A failed login against a public web box is routine; the same against the domain controller is an emergency.</li>
      </ul>

      <h3>Severity scoring</h3>
      <p>Severity blends two questions: <strong>how likely is this real?</strong> (confidence) and <strong>how bad if it is?</strong> (impact). A high-confidence, high-impact event — a known-bad IP succeeding against an admin account — is critical and pages someone. A low-confidence, low-impact event — one failure against a test box — is logged and forgotten. Most of the skill is placing events correctly between those poles.</p>

      <blockquote>Golden rule of triage: <strong>context changes everything.</strong> The exact same log line can be background noise on one asset and a five-alarm fire on another. Always ask "what is the target, and who is the source?" before you decide.</blockquote>
    `,
    quizzes: [
      { id: "soc-l7-q1", question: "What is a false positive?", options: ["A real attack that was missed", "An alert that fired but is actually benign", "A correctly ignored non-event", "A successful block"], correctAnswerIndex: 1, explanation: "A false positive is a benign event that triggered an alert — it wastes analyst time and must be tuned out." },
      { id: "soc-l7-q2", question: "Which alert outcome is the most dangerous?", options: ["True positive", "False positive", "True negative", "False negative (a missed real attack)"], correctAnswerIndex: 3, explanation: "A false negative means a genuine threat produced no alert and went undetected." },
      { id: "soc-l7-q3", question: "Why is reducing false positives important?", options: ["It saves disk space", "It prevents alert fatigue so analysts don't rubber-stamp the one real attack", "It encrypts the SIEM", "It is not important"], correctAnswerIndex: 1, explanation: "High false-positive rates desensitise analysts, increasing the chance a true positive is missed." },
      { id: "soc-l7-q4", question: "What does GeoIP enrichment tell you?", options: ["The password used", "The approximate physical location of an IP", "The CPU usage", "The file contents"], correctAnswerIndex: 1, explanation: "GeoIP maps an IP to a geographic location, useful for spotting logins from unexpected regions." },
      { id: "soc-l7-q5", question: "What is an ASN useful for in enrichment?", options: ["Identifying which network/provider owns an IP", "Decrypting SSH", "Counting failed logins", "Setting the timezone"], correctAnswerIndex: 0, explanation: "The ASN reveals the owning network (e.g., residential ISP vs bulletproof host), shaping how you weigh the source." },
      { id: "soc-l7-q6", question: "An IP appears on AbuseIPDB with many reports. How does this affect severity?", options: ["It lowers severity", "It raises severity — prior-bad reputation increases confidence it's malicious", "It has no effect", "It deletes the alert"], correctAnswerIndex: 1, explanation: "Threat-intel reputation hits raise confidence the source is hostile, increasing severity." },
      { id: "soc-l7-q7", question: "Severity is best understood as a blend of which two factors?", options: ["Disk and RAM", "Confidence (is it real?) and impact (how bad if it is?)", "Colour and font", "Username length and port number"], correctAnswerIndex: 1, explanation: "Severity combines how likely the event is real with how damaging it would be." },
      { id: "soc-l7-q8", question: "The same failed-login line is trivial on a test box but critical on the domain controller. This illustrates…", options: ["A bug in the SIEM", "That asset context changes the verdict", "That logs are unreliable", "That severity is random"], correctAnswerIndex: 1, explanation: "Context — especially what the target asset is — fundamentally changes an event's severity." },
    ],
  },

  // ── LESSON 8 ───────────────────────────────────────────────────────────────
  {
    title: "08 // Containment & Response: Firewalls and Kernel Drops",
    summary: "Stopping an active attacker correctly — iptables/nftables, the crucial DROP vs REJECT choice, fail2ban automation, and the first steps of incident response.",
    content: `
      <h2>Stop the bleeding first</h2>
      <p>You've confirmed a hostile IP. Now you act. The first phase of incident response is <strong>containment</strong>: cut the attacker off before doing deep forensics. The primary tool on a Linux host is the <strong>firewall</strong>.</p>

      <h3>iptables and nftables</h3>
      <p>The Linux kernel filters packets according to firewall rules. The classic interface is <strong>iptables</strong>; the modern replacement is <strong>nftables</strong> (<code>nft</code>). Both let you add a rule that handles packets from a specific source. To block our attacker with iptables:</p>
      <pre><code>iptables -A INPUT -s 198.51.100.12 -j DROP</code></pre>
      <p>Read it: append (<code>-A</code>) to the INPUT chain a rule matching source (<code>-s</code>) <code>198.51.100.12</code> and jump (<code>-j</code>) to the DROP target. From that instant the kernel silently discards every packet from that IP.</p>

      <h3>DROP vs REJECT — a question you WILL be asked</h3>
      <table>
        <thead><tr><th></th><th>DROP</th><th>REJECT</th></tr></thead>
        <tbody>
          <tr><td>Attacker sees</td><td>Nothing — a timeout</td><td>An explicit "connection refused" (RST/ICMP)</td></tr>
          <tr><td>Reveals the firewall?</td><td>No — looks like a dead host</td><td>Yes — confirms something is filtering</td></tr>
          <tr><td>Best for</td><td>Hostile sources (waste their time, reveal nothing)</td><td>Internal misconfigurations (fast, polite failure)</td></tr>
        </tbody>
      </table>
      <p>For an active attacker you almost always <strong>DROP</strong>: it wastes their time waiting for timeouts and gives them no information about your defences.</p>

      <h3>fail2ban — automate the obvious</h3>
      <p>Manually blocking IPs doesn't scale. <strong>fail2ban</strong> watches log files (like auth.log), and when a source crosses a threshold of failures it automatically inserts a temporary firewall ban. It is the canonical "detect brute force → auto-contain" tool, and it embodies everything in this course: parse logs, apply a sliding-window threshold, take a firewall action. Its trade-off is that it's still threshold-based, so low-and-slow attacks evade it.</p>

      <h3>The incident response lifecycle</h3>
      <p>Containment is one phase of a standard process. A common model (NIST-style) is:</p>
      <ol>
        <li><strong>Preparation</strong> — tooling, playbooks, and access ready <em>before</em> an incident.</li>
        <li><strong>Detection &amp; Analysis</strong> — what you've been learning: spot it, confirm it, scope it.</li>
        <li><strong>Containment</strong> — stop spread (DROP the IP, isolate the host).</li>
        <li><strong>Eradication</strong> — remove the foothold (kill sessions, reset credentials, remove backdoors).</li>
        <li><strong>Recovery</strong> — restore to known-good and verify.</li>
        <li><strong>Lessons Learned</strong> — write it up; feed fixes back into detection and hardening.</li>
      </ol>

      <blockquote>Order matters: <strong>contain before you eradicate</strong>, and <strong>preserve evidence before you wipe</strong>. An attacker cut off but documented is far more useful than one hastily deleted with no record of what they did.</blockquote>
    `,
    quizzes: [
      { id: "soc-l8-q1", question: "What is the goal of the containment phase?", options: ["To rebuild the server immediately", "To cut the attacker off and stop the spread before deep forensics", "To write the final report", "To patch every system globally"], correctAnswerIndex: 1, explanation: "Containment stops the active threat from spreading, buying time for analysis and eradication." },
      { id: "soc-l8-q2", question: "What does `iptables -A INPUT -s 198.51.100.12 -j DROP` do?", options: ["Allows the IP", "Appends a rule that silently discards all packets from that source IP", "Logs the IP only", "Reboots the firewall"], correctAnswerIndex: 1, explanation: "It adds an INPUT rule matching that source IP with the DROP target, discarding its packets." },
      { id: "soc-l8-q3", question: "How does DROP differ from REJECT?", options: ["DROP sends a refusal; REJECT stays silent", "DROP silently discards (attacker sees a timeout); REJECT explicitly refuses (attacker sees connection refused)", "They are identical", "REJECT allows the packet"], correctAnswerIndex: 1, explanation: "DROP gives no response (timeout); REJECT actively signals refusal, revealing a filter is present." },
      { id: "soc-l8-q4", question: "For an active hostile source, which is generally preferred?", options: ["REJECT, to be polite", "DROP, to waste their time and reveal nothing", "ACCEPT, to monitor", "Disable the firewall"], correctAnswerIndex: 1, explanation: "DROP wastes the attacker's time on timeouts and hides the existence of your filtering." },
      { id: "soc-l8-q5", question: "What does fail2ban do?", options: ["Encrypts logs", "Watches logs and auto-bans IPs that cross a failure threshold", "Manually reviews each alert", "Replaces the SIEM entirely"], correctAnswerIndex: 1, explanation: "fail2ban monitors logs and inserts temporary firewall bans when thresholds are exceeded." },
      { id: "soc-l8-q6", question: "What is fail2ban's main weakness?", options: ["It cannot read logs", "Being threshold-based, it is evaded by low-and-slow attacks", "It deletes the firewall", "It only works on Windows"], correctAnswerIndex: 1, explanation: "Like any threshold detection, slow attacks that stay under the limit bypass fail2ban." },
      { id: "soc-l8-q7", question: "In the IR lifecycle, which comes immediately AFTER containment?", options: ["Preparation", "Eradication", "Detection", "Doing nothing"], correctAnswerIndex: 1, explanation: "After containment comes eradication — removing the attacker's foothold (sessions, creds, backdoors)." },
      { id: "soc-l8-q8", question: "Which principle should guide the order of response actions?", options: ["Wipe first, ask questions later", "Contain before eradicating, and preserve evidence before wiping", "Always reboot first", "Ignore documentation"], correctAnswerIndex: 1, explanation: "Containing and preserving evidence before eradication keeps the response controlled and auditable." },
    ],
  },

  // ── LESSON 9 ───────────────────────────────────────────────────────────────
  {
    title: "09 // Hardening SSH the Right Way",
    summary: "Preventing the next attack — key-based authentication, disabling root login, MFA, allowlists, and defence in depth via CIS benchmarks.",
    content: `
      <h2>Detection is reactive; hardening is proactive</h2>
      <p>Catching an attacker is good. Making the attack impossible is better. <strong>Hardening</strong> reduces the attack surface so the brute-force you just blocked could never have worked. Most SSH hardening lives in one file: <code>/etc/ssh/sshd_config</code>.</p>

      <h3>The single biggest win: key-based authentication</h3>
      <p>Passwords can be guessed. <strong>SSH key pairs</strong> cannot — a 2048-bit+ key has an astronomically large space no brute-force will ever traverse. You hold a private key; the server holds your public key; the maths proves your identity without a secret crossing the wire. Then you turn passwords off entirely:</p>
      <pre><code>PasswordAuthentication no
PubkeyAuthentication yes</code></pre>
      <p>With passwords disabled, the entire class of attack this course studies simply stops working against your host.</p>

      <h3>Stop logging in as root</h3>
      <p><code>root</code> is every attacker's first guess because it exists on every Linux box and has total power. Disable direct root SSH and make admins log in as themselves, then escalate with <code>sudo</code> (which is auditable):</p>
      <pre><code>PermitRootLogin no</code></pre>

      <h3>Layer on more controls</h3>
      <ul>
        <li><strong>MFA</strong> — require a second factor (TOTP/hardware key) so a stolen credential alone is useless.</li>
        <li><strong>Allowlisting</strong> — <code>AllowUsers</code>/<code>AllowGroups</code> restrict who may even attempt SSH.</li>
        <li><strong>Network controls</strong> — firewall SSH to known admin IPs/VPN only; an attacker who can't reach port 22 can't attack it.</li>
        <li><strong>Changing the port</strong> — moving off 22 cuts background bot noise. Note: this is <em>obscurity, not security</em> — it hides from mass scanners but stops no determined attacker. Useful for noise reduction, never as your only defence.</li>
        <li><strong>Rate limiting / fail2ban</strong> — slow down whatever still gets through.</li>
      </ul>

      <h3>Defence in depth</h3>
      <p>No single control is perfect, so you <strong>layer</strong> them: keys + no-root + MFA + network restriction + rate limiting. An attacker must defeat every layer; you only need one to hold. That layered philosophy is called <strong>defence in depth</strong>, and it's the organising principle of all good security architecture.</p>

      <h3>Benchmarks: don't reinvent the wheel</h3>
      <p>You don't have to invent a secure config from scratch. The <strong>CIS Benchmarks</strong> are community-agreed, audited hardening standards for SSH (and most software). Following a benchmark gives you a defensible, recognised baseline — and "we're CIS-aligned" is a sentence auditors and interviewers both like to hear.</p>

      <blockquote>Reframe: every detection you built in earlier lessons exists because some hardening was missing or imperfect. Detection and hardening are two halves of the same job — catch what gets through, and shrink what can get through.</blockquote>
    `,
    quizzes: [
      { id: "soc-l9-q1", question: "Which file holds most SSH server hardening settings?", options: ["/etc/passwd", "/etc/ssh/sshd_config", "/var/log/auth.log", "/etc/hosts"], correctAnswerIndex: 1, explanation: "sshd_config is the SSH daemon's configuration file where hardening directives live." },
      { id: "soc-l9-q2", question: "Why does key-based auth defeat brute force?", options: ["Keys are shorter than passwords", "A large key's space is astronomically too big to guess, and no secret crosses the wire", "Keys disable logging", "Keys change the port"], correctAnswerIndex: 1, explanation: "Cryptographic keys have an unguessable space and prove identity without transmitting a guessable secret." },
      { id: "soc-l9-q3", question: "What does `PasswordAuthentication no` achieve?", options: ["Disables SSH entirely", "Turns off password logins, stopping password-guessing attacks", "Requires root login", "Enables Telnet"], correctAnswerIndex: 1, explanation: "Disabling password auth removes the very mechanism brute force relies on." },
      { id: "soc-l9-q4", question: "Why disable direct root SSH login (PermitRootLogin no)?", options: ["root logins are slow", "root is a universal, all-powerful target; forcing named users + sudo adds accountability", "It frees disk space", "root cannot use keys"], correctAnswerIndex: 1, explanation: "Removing direct root access eliminates the most-guessed account and makes admin actions auditable via sudo." },
      { id: "soc-l9-q5", question: "Changing SSH off port 22 is best described as…", options: ["Strong cryptographic protection", "Security through obscurity — reduces bot noise but stops no determined attacker", "A replacement for keys", "Illegal"], correctAnswerIndex: 1, explanation: "A non-standard port hides from mass scanners (less noise) but is not real security on its own." },
      { id: "soc-l9-q6", question: "What is defence in depth?", options: ["Relying on one strong control", "Layering multiple controls so an attacker must defeat them all", "Encrypting logs twice", "Hiding the server"], correctAnswerIndex: 1, explanation: "Defence in depth stacks independent controls; the attacker must beat every layer, you need only one to hold." },
      { id: "soc-l9-q7", question: "What are CIS Benchmarks?", options: ["A brand of firewall hardware", "Community-agreed, audited hardening standards/configs", "A type of malware", "A logging format"], correctAnswerIndex: 1, explanation: "CIS Benchmarks are recognised, audited configuration baselines for hardening systems and software." },
      { id: "soc-l9-q8", question: "How do detection and hardening relate?", options: ["They are unrelated", "Two halves of one job: hardening shrinks what can get through, detection catches what still does", "Hardening replaces detection entirely", "Detection makes hardening pointless"], correctAnswerIndex: 1, explanation: "They are complementary: reduce the attack surface and detect whatever penetrates the remaining surface." },
    ],
  },

  // ── LESSON 10 ──────────────────────────────────────────────────────────────
  {
    title: "10 // Mapping SSH Intrusions to MITRE ATT&CK",
    summary: "Speaking the industry's shared language — mapping each stage of an SSH attack to ATT&CK tactics and techniques so your detections are organised and communicable.",
    content: `
      <h2>A shared map of attacker behaviour</h2>
      <p><strong>MITRE ATT&CK</strong> is a free, globally-used knowledge base that catalogues real attacker behaviours. It is organised as <strong>tactics</strong> (the attacker's goal — the "why") containing <strong>techniques</strong> (how they achieve it — the "how"), each with an ID like <code>T1110</code>. When every analyst maps detections to ATT&CK, the whole industry speaks one language.</p>

      <h3>Tactics vs techniques</h3>
      <ul>
        <li><strong>Tactic</strong> = the objective, e.g. <em>Credential Access</em>. Columns across the ATT&CK matrix.</li>
        <li><strong>Technique</strong> = a specific method to reach it, e.g. <em>T1110 Brute Force</em>. Sub-techniques refine further (T1110.001 Password Guessing, T1110.003 Password Spraying, T1110.004 Credential Stuffing).</li>
      </ul>

      <h3>Mapping our SSH attack end to end</h3>
      <table>
        <thead><tr><th>Stage of the attack</th><th>ATT&CK Tactic</th><th>Technique</th></tr></thead>
        <tbody>
          <tr><td>Scanning for open port 22</td><td>Reconnaissance</td><td>T1595 Active Scanning</td></tr>
          <tr><td>Guessing passwords over SSH</td><td>Credential Access</td><td>T1110 Brute Force</td></tr>
          <tr><td>Logging in with valid creds</td><td>Initial Access</td><td>T1078 Valid Accounts</td></tr>
          <tr><td>Adding an SSH key / new user to stay in</td><td>Persistence</td><td>T1098 Account Manipulation</td></tr>
          <tr><td>Deleting auth.log to hide</td><td>Defense Evasion</td><td>T1070 Indicator Removal</td></tr>
        </tbody>
      </table>
      <p>Notice how the same incident touches several tactics. A mature detection program has coverage across the chain, not just one box — because stopping the attacker at <em>any</em> stage defeats them.</p>

      <h3>Why this matters in practice</h3>
      <ul>
        <li><strong>Communication</strong> — "we detected T1110 leading to T1078" is instantly understood by any analyst anywhere.</li>
        <li><strong>Coverage analysis</strong> — mapping your detections onto the matrix reveals blind spots (techniques you can't see).</li>
        <li><strong>Threat-informed defence</strong> — you can prioritise the techniques real adversaries targeting your industry actually use.</li>
        <li><strong>Reporting</strong> — leadership and auditors increasingly expect ATT&CK-mapped detection coverage.</li>
      </ul>

      <h3>Valid Accounts: the quiet danger (T1078)</h3>
      <p>Once brute force succeeds, the attacker pivots to <strong>T1078 Valid Accounts</strong> — they now use <em>legitimate</em> credentials, so their actions look like a normal user. This is exactly why the failure→success pivot is the alert that matters: after it, the attacker stops looking like an attacker. Catch them at T1110, or you may not get another clear shot.</p>

      <blockquote>Takeaway: don't think of an attack as one event but as a <strong>chain of tactics</strong>. ATT&CK gives you the map; your detections are the tripwires you place along it.</blockquote>
    `,
    quizzes: [
      { id: "soc-l10-q1", question: "What is MITRE ATT&CK?", options: ["A firewall product", "A free knowledge base cataloguing real attacker tactics and techniques", "An encryption algorithm", "A Linux distribution"], correctAnswerIndex: 1, explanation: "ATT&CK is a globally-used, free knowledge base of adversary behaviours organised as tactics and techniques." },
      { id: "soc-l10-q2", question: "What is the difference between a tactic and a technique?", options: ["They are synonyms", "A tactic is the attacker's goal; a technique is a specific method to achieve it", "A technique is the goal; a tactic is the method", "Tactics are tools, techniques are people"], correctAnswerIndex: 1, explanation: "Tactic = the 'why' (objective); technique = the 'how' (specific method), e.g. T1110." },
      { id: "soc-l10-q3", question: "Which technique ID covers brute force?", options: ["T1078", "T1110", "T1595", "T1070"], correctAnswerIndex: 1, explanation: "T1110 Brute Force covers password guessing, spraying, and credential stuffing." },
      { id: "soc-l10-q4", question: "After brute force succeeds, the attacker using the valid login maps to which technique?", options: ["T1110 Brute Force", "T1078 Valid Accounts", "T1595 Active Scanning", "T1070 Indicator Removal"], correctAnswerIndex: 1, explanation: "Using legitimate credentials is T1078 Valid Accounts — actions then resemble a normal user." },
      { id: "soc-l10-q5", question: "Deleting auth.log to hide activity maps to which tactic?", options: ["Reconnaissance", "Defense Evasion (T1070 Indicator Removal)", "Initial Access", "Persistence"], correctAnswerIndex: 1, explanation: "Removing log evidence is Defense Evasion, specifically T1070 Indicator Removal." },
      { id: "soc-l10-q6", question: "Why map detections onto the ATT&CK matrix?", options: ["To make pretty charts only", "To reveal coverage blind spots and communicate in a shared language", "To slow down the SIEM", "It is legally required everywhere"], correctAnswerIndex: 1, explanation: "Mapping shows which techniques you can/can't detect and lets analysts communicate precisely." },
      { id: "soc-l10-q7", question: "Why is catching the attacker at T1110 (brute force) so important?", options: ["It's the only detectable stage", "Afterward they pivot to Valid Accounts (T1078) and blend in as a normal user", "T1110 causes hardware damage", "It has no special importance"], correctAnswerIndex: 1, explanation: "Once they hold valid credentials, the attacker looks legitimate — the brute-force stage is your clearest opportunity." },
      { id: "soc-l10-q8", question: "What does it mean that one incident 'touches several tactics'?", options: ["The logs are corrupted", "The attack is a chain (recon → credential access → initial access → persistence → evasion), so you can detect/stop it at multiple points", "The SIEM double-counted", "Each tactic is a separate attacker"], correctAnswerIndex: 1, explanation: "An intrusion progresses through multiple tactics; detection coverage across the chain gives several chances to stop it." },
    ],
  },
];
