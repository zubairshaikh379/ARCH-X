// ─────────────────────────────────────────────────────────────────────────────
// INCIDENT RESPONDER — DEEP GUIDEBOOK (textbook-grade ARCH-X course)
//
// Content is authored as SEMANTIC HTML and rendered inside `.md-content`
// (see src/index.css) — h2/h3/p/ul/ol/li/pre/code/table/blockquote/strong are
// all styled there, so lessons render correctly without relying on Tailwind
// class scanning.
//
// Structure mirrors a real syllabus: Intro → Lifecycle → Preparation → Team &
// Plan → Detection/Scoping → Containment → Eradication/Recovery → Evidence →
// Communication → Playbooks → Incident Types → Post-Incident Metrics.
// Each lesson ends with an 8-question knowledge check.
// ─────────────────────────────────────────────────────────────────────────────

import type { Course } from "../courses";

type Lesson = Course["lessons"][number];

// New optional Overview fields (spread into the incident-responder course object).
export const META: Pick<
  Course,
  "prerequisites" | "learningOutcomes" | "mustKnow" | "commonGaps" | "prosCons" | "careerNotes"
> = {
  prerequisites: [
    "Familiarity with basic security operations — you can read a log line and recognise an alert (a SOC Analyst background is ideal).",
    "A working mental model of TCP/IP, DNS, and how hosts talk on a network.",
    "Comfort with a command line on both Linux and Windows (the shell, processes, services).",
    "No formal IR experience required — the whole lifecycle is built up from first principles.",
  ],
  learningOutcomes: [
    "Run an incident end-to-end through the NIST 800-61 / SANS PICERL lifecycle without skipping a phase.",
    "Build an incident response plan, staff an IR team with clear roles, and define severity tiers before an incident hits.",
    "Detect and scope an incident — determine what is affected, how far it spread, and when it began.",
    "Choose correctly between short-term and long-term containment, and eradicate a foothold without tipping off the adversary prematurely.",
    "Preserve volatile and disk evidence with a defensible chain of custody that survives legal scrutiny.",
    "Communicate with executives, legal, and regulators under pressure, and run a blameless post-incident review that lowers MTTD and MTTR.",
  ],
  mustKnow: [
    "NIST SP 800-61", "PICERL", "Preparation", "Identification", "Containment", "Eradication",
    "Recovery", "Lessons Learned", "IR Plan", "IR Team / CSIRT", "Severity Tiers", "Scoping",
    "Order of Volatility", "Chain of Custody", "Forensic Imaging", "IOC / IOA", "Playbook vs Runbook",
    "Ransomware", "BEC", "Lateral Movement", "Golden Image", "MTTD / MTTR / MTTC", "Tabletop Exercise",
  ],
  commonGaps: [
    "Skipping Preparation. Learners obsess over containment tactics but forget that 80% of a good response is decided before the incident — plans, access, backups, and drills.",
    "Containing before scoping. Pulling one machine offline while the attacker is on ten others tips them off and destroys your chance to contain them all at once.",
    "Order of volatility. Beginners image the disk first and lose RAM, network connections, and running processes — the evidence that vanishes the moment you pull the plug.",
    "Chain of custody. An investigation with no documented handling record is worthless in court and often in an insurance claim. This is a discipline, not paperwork.",
    "Eradicate vs recover confusion. Restoring a backup that still contains the attacker's backdoor just re-infects you. Eradication must complete before recovery begins.",
    "Blameful post-mortems. If the review hunts for someone to fire, people hide facts, and the same incident recurs. Blameless review is what actually reduces MTTR.",
  ],
  prosCons: {
    pros: [
      "IR is one of the highest-leverage, highest-paid blue-team disciplines — every breach needs someone who can run the response calmly.",
      "The lifecycle is universal: the same PICERL model applies to ransomware, BEC, insider threat, and cloud compromise alike.",
      "Skills transfer directly into digital forensics, threat hunting, detection engineering, and CISO-track leadership.",
    ],
    cons: [
      "The work is high-pressure and often on-call — incidents don't respect business hours, and the clock is always running.",
      "Decisions are made with incomplete information; you must act decisively while knowing you may be wrong.",
      "Legal, regulatory, and reputational stakes mean a technical mistake can have outsized consequences — process discipline is non-negotiable.",
    ],
  },
  careerNotes:
    "Incident Response is the natural Tier-2/Tier-3 step up from a SOC Analyst role, and a direct feeder into Digital Forensics & Incident Response (DFIR), threat hunting, and detection engineering. The defining certifications are the GIAC GCIH (Certified Incident Handler) and GCFA (Forensic Analyst), with GNFA, GREM (malware reverse engineering), and vendor tracks (e.g. EnCase, Cellebrite) for specialists; CISSP and the CISM/blameless-leadership skills matter as you move toward IR management or CISO tracks. Many responders start in a SOC, join an internal CSIRT or a consultancy's IR retainer team, and progress to incident commander. The responders who advance fastest are the ones who can stay calm, document relentlessly, and translate technical findings into decisions executives and lawyers can act on.",
};

export const LESSONS: Lesson[] = [
  // ── LESSON 1 ───────────────────────────────────────────────────────────────
  {
    title: "01 // What Incident Response Is — and the Lifecycle That Governs It",
    summary: "What counts as an incident, why a repeatable lifecycle matters, and the two dominant models (NIST 800-61 and SANS PICERL).",
    content: `
      <h2>From alert to incident to resolution</h2>
      <p>A SOC analyst catches a signal. An <strong>incident responder</strong> is the person who takes over when that signal turns out to be real, and drives it to a controlled conclusion. Incident Response (IR) is the disciplined process of preparing for, detecting, containing, and recovering from security incidents — and then learning from them so the next one is smaller.</p>

      <p>The single most important idea in this course: <strong>IR is a process, not a panic.</strong> Under pressure, humans improvise badly. A repeatable lifecycle turns a chaotic emergency into a checklist you can execute even at 3am with an executive shouting in your ear.</p>

      <h3>Event vs alert vs incident</h3>
      <table>
        <thead><tr><th>Term</th><th>Meaning</th></tr></thead>
        <tbody>
          <tr><td><strong>Event</strong></td><td>Any observable occurrence — a login, a file write, a packet. Most events are benign.</td></tr>
          <tr><td><strong>Alert</strong></td><td>An event (or pattern) a detection flagged as worth a human look.</td></tr>
          <tr><td><strong>Incident</strong></td><td>A confirmed adverse event that violates security policy or threatens confidentiality, integrity, or availability. This is what IR responds to.</td></tr>
        </tbody>
      </table>
      <p>Declaring an incident is a decision, not an accident. Someone with authority says "this is an incident" — and that declaration unlocks the plan, the team, and the budget to respond.</p>

      <h3>The two lifecycle models you must know</h3>
      <p>Nearly every IR program is built on one of two closely-related models. They map almost perfectly onto each other:</p>
      <table>
        <thead><tr><th>NIST SP 800-61</th><th>SANS (PICERL)</th></tr></thead>
        <tbody>
          <tr><td>1. Preparation</td><td>P — Preparation</td></tr>
          <tr><td rowspan="2">2. Detection &amp; Analysis</td><td>I — Identification</td></tr>
          <tr><td>C — Containment</td></tr>
          <tr><td rowspan="2">3. Containment, Eradication &amp; Recovery</td><td>E — Eradication</td></tr>
          <tr><td>R — Recovery</td></tr>
          <tr><td>4. Post-Incident Activity</td><td>L — Lessons Learned</td></tr>
        </tbody>
      </table>
      <p><strong>PICERL</strong> is the memorable acronym: <em>Preparation, Identification, Containment, Eradication, Recovery, Lessons Learned.</em> NIST groups containment/eradication/recovery into one phase but the steps are the same. Learn PICERL as your spine; cite NIST 800-61 when you need the authoritative reference.</p>

      <h3>The lifecycle is a loop, not a line</h3>
      <p>The arrow from "Lessons Learned" bends back to "Preparation." Every incident should make you better prepared for the next one — new detections, patched gaps, updated playbooks. An IR program that never feeds lessons back is doomed to relive the same breach.</p>

      <blockquote>The single most under-appreciated truth in IR: the outcome of an incident is mostly decided in the <strong>Preparation</strong> phase, long before the attacker arrives. The teams that respond well are the ones who drilled when nothing was on fire.</blockquote>
    `,
    quizzes: [
      { id: "ir-l1-q1", question: "What best distinguishes an 'incident' from an 'alert'?", options: ["An incident is always caused by malware", "An incident is a confirmed adverse event violating security policy or threatening CIA", "An alert is more serious than an incident", "They are the same thing"], correctAnswerIndex: 1, explanation: "An alert is a flagged event worth review; an incident is a confirmed adverse event that must be responded to." },
      { id: "ir-l1-q2", question: "What does the acronym PICERL stand for?", options: ["Prepare, Isolate, Contain, Erase, Restore, Log", "Preparation, Identification, Containment, Eradication, Recovery, Lessons Learned", "Plan, Investigate, Correlate, Escalate, Report, Learn", "Protect, Identify, Control, Eliminate, Rebuild, List"], correctAnswerIndex: 1, explanation: "PICERL = Preparation, Identification, Containment, Eradication, Recovery, Lessons Learned — the SANS lifecycle." },
      { id: "ir-l1-q3", question: "Which authoritative document defines the four-phase IR lifecycle used across the industry?", options: ["NIST SP 800-53", "NIST SP 800-61", "ISO 9001", "PCI-DSS 4.0"], correctAnswerIndex: 1, explanation: "NIST SP 800-61 (Computer Security Incident Handling Guide) defines the canonical IR lifecycle." },
      { id: "ir-l1-q4", question: "In NIST's model, containment, eradication, and recovery are grouped into which phase?", options: ["Preparation", "Detection & Analysis", "Containment, Eradication & Recovery", "Post-Incident Activity"], correctAnswerIndex: 2, explanation: "NIST 800-61 folds containment, eradication, and recovery into a single combined phase." },
      { id: "ir-l1-q5", question: "Why is the IR lifecycle described as a loop rather than a line?", options: ["Because incidents never actually end", "Because Lessons Learned feeds improvements back into Preparation", "Because containment repeats forever", "Because the SIEM restarts it automatically"], correctAnswerIndex: 1, explanation: "Post-incident lessons feed back into Preparation, improving readiness for the next incident." },
      { id: "ir-l1-q6", question: "Declaring an incident is best described as…", options: ["An automatic system action", "A deliberate decision by someone with authority that unlocks the plan and team", "The same as closing a ticket", "Something only regulators can do"], correctAnswerIndex: 1, explanation: "Someone with authority formally declares an incident, activating the plan, team, and resources." },
      { id: "ir-l1-q7", question: "Which phase most determines whether an incident is handled well?", options: ["Recovery", "Preparation", "Eradication", "Lessons Learned"], correctAnswerIndex: 1, explanation: "Preparation — plans, access, backups, and drills — largely decides how well the later phases go." },
      { id: "ir-l1-q8", question: "What is the core philosophy the lifecycle is meant to enforce?", options: ["Improvise quickly under pressure", "IR is a repeatable process, not a panic", "Always power off first", "Never involve management"], correctAnswerIndex: 1, explanation: "A repeatable lifecycle turns a chaotic emergency into an executable checklist, reducing improvisation errors." },
    ],
  },

  // ── LESSON 2 ───────────────────────────────────────────────────────────────
  {
    title: "02 // Preparation: Building the Plan, the Team, and the Toolkit",
    summary: "The 'P' in PICERL — the IR plan, staffing a CSIRT with clear roles, tooling, access, and the drills that make it all work.",
    content: `
      <h2>You cannot improvise readiness</h2>
      <p><strong>Preparation</strong> is everything you do <em>before</em> an incident so that when one hits, you execute instead of scramble. It is the least glamorous phase and by far the most important. This lesson is your blueprint for it.</p>

      <h3>The Incident Response Plan</h3>
      <p>The <strong>IR Plan</strong> is the governing document. A good one answers, in advance:</p>
      <ul>
        <li><strong>What is an incident here?</strong> A clear definition and classification/severity scheme so people agree on when to activate.</li>
        <li><strong>Who does what?</strong> Named roles, responsibilities, and an escalation path — no ambiguity mid-crisis.</li>
        <li><strong>How do we communicate?</strong> Contact trees, out-of-band channels (email may be compromised), and who talks to executives, legal, and the press.</li>
        <li><strong>What are our legal/regulatory duties?</strong> Breach-notification timelines (e.g. GDPR's 72 hours), evidence rules, and when to call law enforcement.</li>
      </ul>
      <p>The plan is supported by <strong>playbooks</strong> (per incident type) and <strong>runbooks</strong> (per task) — covered in depth in Lesson 8.</p>

      <h3>The team: CSIRT roles</h3>
      <p>An incident is run by a <strong>CSIRT</strong> (Computer Security Incident Response Team). Even a small org should pre-assign these roles:</p>
      <table>
        <thead><tr><th>Role</th><th>Responsibility</th></tr></thead>
        <tbody>
          <tr><td><strong>Incident Commander (IC)</strong></td><td>Owns the response, makes decisions, keeps the team coordinated. One person, always.</td></tr>
          <tr><td><strong>Technical Lead / Investigators</strong></td><td>Do the hands-on analysis, containment, and eradication.</td></tr>
          <tr><td><strong>Communications Lead</strong></td><td>Manages internal and external messaging; shields technicians from the noise.</td></tr>
          <tr><td><strong>Legal / Compliance</strong></td><td>Advises on regulatory duties, evidence handling, and liability.</td></tr>
          <tr><td><strong>Scribe</strong></td><td>Maintains the incident timeline and log — the deliverable everything else depends on.</td></tr>
        </tbody>
      </table>
      <p>In a crisis, roles matter more than titles. The IC might be a senior analyst, not the CISO. The point is that everyone knows who is deciding.</p>

      <h3>Tooling and access — ready in advance</h3>
      <ul>
        <li><strong>Detection & telemetry:</strong> SIEM, EDR/XDR on endpoints, network flow logs, retained log history.</li>
        <li><strong>Forensics:</strong> imaging tools, memory-capture utilities, a clean analysis workstation, write-blockers.</li>
        <li><strong>Response:</strong> ability to isolate hosts, disable accounts, and block IPs — with the access provisioned <em>before</em> you need it.</li>
        <li><strong>A jump-bag:</strong> credentials, contact lists, and tools stored offline in case the network itself is compromised.</li>
        <li><strong>Known-good backups:</strong> tested, offline/immutable, and restorable — the single most valuable ransomware defence.</li>
      </ul>

      <h3>Drills: the part everyone skips</h3>
      <p>A plan you've never rehearsed is a hypothesis. <strong>Tabletop exercises</strong> (talk-through scenarios) and <strong>simulations</strong> expose the gaps — the phone number that changed, the backup that never restored, the role nobody actually owns — while the stakes are zero. Mature teams drill regularly.</p>

      <blockquote>Rule of preparation: provision your response <em>capabilities and access before the incident</em>. Requesting emergency admin rights while ransomware is spreading is a preparation failure you feel at the worst possible moment.</blockquote>
    `,
    quizzes: [
      { id: "ir-l2-q1", question: "What does CSIRT stand for?", options: ["Cyber Security Internal Review Team", "Computer Security Incident Response Team", "Central System Isolation & Recovery Task-force", "Critical Server Intrusion Reporting Tool"], correctAnswerIndex: 1, explanation: "CSIRT = Computer Security Incident Response Team, the group that runs an incident." },
      { id: "ir-l2-q2", question: "How many Incident Commanders should a single incident have at one time?", options: ["As many as are available", "Exactly one", "One per affected host", "Zero — the team decides collectively"], correctAnswerIndex: 1, explanation: "There is always a single Incident Commander who owns decisions and coordination to avoid confusion." },
      { id: "ir-l2-q3", question: "Why maintain out-of-band communication channels in the IR plan?", options: ["They are cheaper", "Primary channels like corporate email may themselves be compromised", "Regulators forbid using email", "They are faster in all cases"], correctAnswerIndex: 1, explanation: "If the network/email is compromised, you need pre-arranged out-of-band channels to coordinate safely." },
      { id: "ir-l2-q4", question: "What is the primary purpose of a tabletop exercise?", options: ["To fix production systems", "To rehearse the plan and expose gaps while stakes are zero", "To satisfy the SIEM licence", "To replace the IR plan"], correctAnswerIndex: 1, explanation: "Tabletops are talk-through drills that reveal weaknesses in the plan before a real incident." },
      { id: "ir-l2-q5", question: "Which role's main deliverable is the incident timeline/log?", options: ["Communications Lead", "Scribe", "Legal", "Incident Commander"], correctAnswerIndex: 1, explanation: "The Scribe maintains the running timeline and log that the whole response depends on." },
      { id: "ir-l2-q6", question: "Why should backups be offline or immutable?", options: ["To save cloud costs", "So ransomware or an attacker cannot encrypt/delete them too", "To make them faster", "Regulators require exactly three copies"], correctAnswerIndex: 1, explanation: "Offline/immutable backups can't be reached by the attacker, making recovery possible after ransomware." },
      { id: "ir-l2-q7", question: "When should emergency admin access for responders be provisioned?", options: ["During the incident, as needed", "In advance, during Preparation", "Only after Lessons Learned", "Never — it's a security risk"], correctAnswerIndex: 1, explanation: "Access must be arranged during Preparation; scrambling for rights mid-incident is a costly failure." },
      { id: "ir-l2-q8", question: "What distinguishes a plan from a hypothesis, per this lesson?", options: ["A signature from the CISO", "Having been rehearsed through drills", "Being stored in the SIEM", "Its page count"], correctAnswerIndex: 1, explanation: "An unrehearsed plan is just a hypothesis; drills validate that it actually works." },
    ],
  },

  // ── LESSON 3 ───────────────────────────────────────────────────────────────
  {
    title: "03 // Identification: Detecting and Declaring an Incident",
    summary: "The 'I' in PICERL — recognising an incident from detection sources, initial triage, and the formal declaration that starts the clock.",
    content: `
      <h2>Knowing you've been hit</h2>
      <p><strong>Identification</strong> (NIST calls it Detection & Analysis) is the moment the process actually begins. You can't respond to what you don't know about, and the dangerous truth is that many organisations are breached for weeks or months before they notice. This lesson is about shortening that gap and making a confident declaration.</p>

      <h3>Where detections come from</h3>
      <ul>
        <li><strong>Automated detections:</strong> SIEM correlation rules, EDR/XDR alerts, IDS/IPS signatures, anomaly detection.</li>
        <li><strong>Human reports:</strong> a user reports a strange email or a locked file — often the earliest signal for phishing and ransomware.</li>
        <li><strong>Third parties:</strong> a bank, a customer, law enforcement, or a researcher tells you. Uncomfortable, but common.</li>
        <li><strong>Threat hunting:</strong> proactively searching for adversaries no alert fired on.</li>
      </ul>

      <h3>Indicators: IOC vs IOA</h3>
      <table>
        <thead><tr><th></th><th>Indicator of Compromise (IOC)</th><th>Indicator of Attack (IOA)</th></tr></thead>
        <tbody>
          <tr><td>What it is</td><td>Forensic artefact showing a breach happened — a malicious hash, IP, domain, file path.</td><td>Behaviour showing an attack in progress — e.g. a process spawning encryption across shares.</td></tr>
          <tr><td>Tense</td><td>Often past/backward-looking</td><td>Present/behavioural</td></tr>
          <tr><td>Strength</td><td>Precise but brittle (attackers change hashes/IPs easily)</td><td>Resilient (behaviour is harder to change)</td></tr>
        </tbody>
      </table>
      <p>Mature detection leans on IOAs (behaviour) because IOCs are trivially rotated by the adversary.</p>

      <h3>Initial triage: is it real, and how bad?</h3>
      <p>Before declaring, the responder validates the signal and answers the first questions:</p>
      <ol>
        <li><strong>Is it a true positive?</strong> Confirm the alert reflects real malicious activity, not a benign anomaly.</li>
        <li><strong>What is the initial scope?</strong> One host or many? What kind of activity?</li>
        <li><strong>What is the severity?</strong> Map it to the plan's tiers so the right people are pulled in.</li>
      </ol>

      <h3>Severity classification</h3>
      <p>Most plans use tiers so the response is proportional. A common scheme:</p>
      <table>
        <thead><tr><th>Severity</th><th>Rough meaning</th></tr></thead>
        <tbody>
          <tr><td><strong>SEV-1 / Critical</strong></td><td>Business-threatening — active ransomware, major data theft, critical systems down.</td></tr>
          <tr><td><strong>SEV-2 / High</strong></td><td>Serious but contained — confirmed intrusion on non-critical systems.</td></tr>
          <tr><td><strong>SEV-3 / Medium</strong></td><td>Limited impact — single-host malware, isolated policy violation.</td></tr>
          <tr><td><strong>SEV-4 / Low</strong></td><td>Minimal — blocked attempt, minor policy issue.</td></tr>
        </tbody>
      </table>

      <h3>The declaration starts the clock</h3>
      <p>When the responder (or IC) formally <strong>declares an incident</strong>, the plan activates: team assembles, timeline opens, communications begin. This is also when <strong>MTTD</strong> — Mean Time To Detect, the gap from initial compromise to detection — is effectively measured against.</p>

      <blockquote>Discipline check: do not begin containment during triage without a moment's thought about scope. Acting on the first host you see, before understanding the whole picture, is the classic identification-phase mistake that tips off the attacker (Lesson 5 explains why).</blockquote>
    `,
    quizzes: [
      { id: "ir-l3-q1", question: "In NIST 800-61 terms, the Identification phase is called…", options: ["Preparation", "Detection & Analysis", "Recovery", "Post-Incident Activity"], correctAnswerIndex: 1, explanation: "NIST labels the identification phase 'Detection & Analysis'." },
      { id: "ir-l3-q2", question: "What is an Indicator of Compromise (IOC)?", options: ["A behaviour showing an attack in progress", "A forensic artefact (hash, IP, domain) showing a breach occurred", "A type of firewall rule", "A severity tier"], correctAnswerIndex: 1, explanation: "An IOC is a concrete artefact evidencing compromise, such as a malicious hash, IP, or domain." },
      { id: "ir-l3-q3", question: "Why do mature detection programs favour IOAs over IOCs?", options: ["IOAs are cheaper to store", "Behaviour (IOA) is harder for attackers to change than hashes/IPs (IOC)", "IOCs are illegal to use", "IOAs require no tooling"], correctAnswerIndex: 1, explanation: "IOCs are trivially rotated; IOAs describe behaviour, which is more resilient to change." },
      { id: "ir-l3-q4", question: "Which is often the earliest signal of a phishing or ransomware incident?", options: ["A regulator's letter", "A user report of a strange email or locked file", "A quarterly audit", "A firmware update"], correctAnswerIndex: 1, explanation: "End-user reports frequently surface phishing and ransomware before automated tools do." },
      { id: "ir-l3-q5", question: "What must initial triage confirm before declaring an incident?", options: ["The attacker's real name", "That the alert is a true positive and its rough scope/severity", "The exact financial loss", "The press release wording"], correctAnswerIndex: 1, explanation: "Triage validates the alert is real and establishes initial scope and severity." },
      { id: "ir-l3-q6", question: "A SEV-1 / Critical incident typically means…", options: ["A blocked login attempt", "Business-threatening impact like active ransomware or major data theft", "A single low-risk policy violation", "An informational log entry"], correctAnswerIndex: 1, explanation: "SEV-1 denotes business-threatening incidents demanding the fullest response." },
      { id: "ir-l3-q7", question: "What does the formal declaration of an incident do?", options: ["Nothing procedural", "Activates the plan: assembles the team, opens the timeline, starts communications", "Automatically eradicates the threat", "Closes the ticket"], correctAnswerIndex: 1, explanation: "Declaration activates the IR plan, mobilising the team and formal processes." },
      { id: "ir-l3-q8", question: "MTTD measures the time from…", options: ["Detection to full recovery", "Initial compromise to detection", "Containment to eradication", "Alert to ticket closure"], correctAnswerIndex: 1, explanation: "Mean Time To Detect is the gap between the initial compromise and when it is detected." },
    ],
  },

  // ── LESSON 4 ───────────────────────────────────────────────────────────────
  {
    title: "04 // Scoping the Incident: How Deep Does It Go?",
    summary: "Before you contain, you must understand the blast radius — determining what is affected, how far the attacker spread, and when it began.",
    content: `
      <h2>The question that shapes everything: how big is this?</h2>
      <p>Scoping is the analytical heart of the response. A single confirmed compromised host tells you almost nothing about the real size of the problem. Before you can contain effectively, you need to know the <strong>blast radius</strong>: which systems, which accounts, which data, and how far back in time.</p>

      <h3>The three scoping questions</h3>
      <ol>
        <li><strong>Breadth</strong> — how many hosts, accounts, and services are involved? Where has the attacker moved?</li>
        <li><strong>Depth</strong> — what level of access do they have? User? Local admin? Domain admin? Cloud root?</li>
        <li><strong>Time</strong> — when did it start? The "patient zero" and the initial access vector anchor the entire timeline.</li>
      </ol>

      <h3>Following the attacker: lateral movement</h3>
      <p>Attackers rarely stop at the first host. <strong>Lateral movement</strong> is how they spread — stolen credentials, remote services (RDP, SMB, WMI, SSH), pass-the-hash. Scoping means tracing that movement across the environment:</p>
      <ul>
        <li><strong>Authentication logs</strong> — where has the compromised account logged in? Unusual logon patterns reveal spread.</li>
        <li><strong>EDR process/network telemetry</strong> — remote-execution tools, new services, suspicious child processes.</li>
        <li><strong>Network flows</strong> — internal host-to-host connections that shouldn't exist.</li>
        <li><strong>Persistence artefacts</strong> — scheduled tasks, new accounts, run keys, cron jobs the attacker left to survive a reboot.</li>
      </ul>

      <h3>Pivoting on indicators</h3>
      <p>Scoping is iterative. You find one IOC (a malicious hash, a C2 IP, a rogue account) and <strong>pivot</strong>: search the whole estate for that indicator. Each hit reveals more affected systems and often new indicators, which you pivot on again. You repeat until searches stop finding anything new — that convergence is how you gain confidence you've found the whole footprint.</p>

      <pre><code># Conceptual pivot loop
1. Confirmed compromise on HOST-A  ->  extract IOCs (hash H1, IP C2-1, account SVC-X)
2. Search estate for H1, C2-1, SVC-X
3. Hits on HOST-B and HOST-C  ->  extract NEW IOCs from them
4. Search again for the new IOCs
5. Repeat until a full sweep yields nothing new  ->  scope is (tentatively) bounded</code></pre>

      <h3>Finding patient zero and the initial vector</h3>
      <p>Working <em>backward</em> to the first compromised system and the entry point (phishing email, exploited VPN, exposed RDP) matters for two reasons: you can't eradicate what you don't understand, and if you miss the initial vector, the attacker simply walks back in after you've cleaned up.</p>

      <blockquote>The cardinal rule that connects this lesson to the next: <strong>scope before you contain — at least enough to contain everything at once.</strong> Yank one host offline while the attacker holds nine others, and you've announced your presence and lost the element of surprise. Coordinated containment beats piecemeal containment.</blockquote>

      <h3>Scoping is never perfectly "done"</h3>
      <p>You act on the best picture you have while continuing to refine it. Good responders hold two ideas at once: decisive action now, and humility that the scope may still grow.</p>
    `,
    quizzes: [
      { id: "ir-l4-q1", question: "What is the 'blast radius' of an incident?", options: ["The physical distance to the server room", "The full extent of affected systems, accounts, data, and timeframe", "The size of the log file", "The number of alerts generated"], correctAnswerIndex: 1, explanation: "Blast radius is the total scope: which systems/accounts/data are affected and over what time." },
      { id: "ir-l4-q2", question: "What is lateral movement?", options: ["Moving servers between racks", "How an attacker spreads from one host to others within the environment", "Restoring from backup", "Rotating log files"], correctAnswerIndex: 1, explanation: "Lateral movement is the attacker spreading across internal systems, often via stolen creds and remote services." },
      { id: "ir-l4-q3", question: "The three core scoping questions are breadth, depth, and…", options: ["Cost", "Time", "Colour", "Vendor"], correctAnswerIndex: 1, explanation: "Scoping asks breadth (how many), depth (what access), and time (when did it start)." },
      { id: "ir-l4-q4", question: "What does 'pivoting' on an indicator mean during scoping?", options: ["Rotating the server", "Searching the whole estate for a found IOC to reveal more affected systems and new indicators", "Deleting the indicator", "Changing the incident commander"], correctAnswerIndex: 1, explanation: "You take an indicator, sweep the environment for it, uncover more hosts/IOCs, and repeat." },
      { id: "ir-l4-q5", question: "Why is finding the initial access vector (patient zero) critical?", options: ["It's legally required to name it", "If you miss it, the attacker can simply re-enter after cleanup", "It determines the log format", "It sets the backup schedule"], correctAnswerIndex: 1, explanation: "Miss the entry point and you'll clean the symptoms while the attacker walks back in the same door." },
      { id: "ir-l4-q6", question: "Which data source is most directly useful for tracing where a compromised account has spread?", options: ["Printer logs", "Authentication/logon logs", "The company org chart", "Backup catalogs"], correctAnswerIndex: 1, explanation: "Authentication logs show where an account logged in, revealing lateral movement." },
      { id: "ir-l4-q7", question: "Why is coordinated (all-at-once) containment preferred over piecemeal containment?", options: ["It's cheaper", "Yanking one host tips off the attacker who holds the others, losing the element of surprise", "Piecemeal is illegal", "It uses less bandwidth"], correctAnswerIndex: 1, explanation: "Containing one host at a time alerts the attacker on remaining hosts; coordinated action denies them warning." },
      { id: "ir-l4-q8", question: "What mindset should a responder hold about scope?", options: ["Scope is fixed once set", "Act decisively on the best current picture while staying humble that scope may grow", "Never contain until scope is 100% certain", "Scope doesn't matter"], correctAnswerIndex: 1, explanation: "Scoping is iterative; you act on the best picture while continuing to refine it." },
    ],
  },

  // ── LESSON 5 ───────────────────────────────────────────────────────────────
  {
    title: "05 // Containment: Short-Term and Long-Term",
    summary: "The 'C' in PICERL — stopping the bleeding without destroying evidence, and the crucial difference between short-term and long-term containment.",
    content: `
      <h2>Stop the spread — carefully</h2>
      <p><strong>Containment</strong> is the phase where you stop the incident from getting worse. It is a balancing act: act fast enough to limit damage, but not so recklessly that you destroy evidence or tip off the attacker before you're ready to remove them everywhere at once.</p>

      <h3>Short-term vs long-term containment</h3>
      <table>
        <thead><tr><th></th><th>Short-term containment</th><th>Long-term containment</th></tr></thead>
        <tbody>
          <tr><td>Goal</td><td>Immediately halt active damage/spread</td><td>Keep systems safely operating until full eradication</td></tr>
          <tr><td>Examples</td><td>Isolate a host from the network, disable a compromised account, block a C2 IP</td><td>Apply temporary patches, tighten firewall rules, rebuild an isolated segment, add monitoring</td></tr>
          <tr><td>Timeframe</td><td>Minutes — buy time</td><td>Hours to days — sustainable bridge to eradication</td></tr>
          <tr><td>Reversibility</td><td>Often quick/temporary</td><td>More durable, still not the final fix</td></tr>
        </tbody>
      </table>
      <p>Think of short-term containment as the tourniquet and long-term containment as the stable bridge that keeps the business running while you prepare to eradicate cleanly.</p>

      <h3>Isolate — don't power off</h3>
      <p>The instinct to "turn it off" is usually wrong. Powering a machine off destroys <strong>volatile evidence</strong> — RAM contents, running processes, network connections, and (critically in ransomware) encryption keys that may live only in memory. Instead you <strong>isolate</strong>: cut the host's network access (EDR network-containment, a switch-port disable, or a firewall rule) while leaving it running for forensic capture.</p>
      <pre><code># Common short-term containment actions
- EDR: "network-contain HOST-A"        # host can talk only to the EDR console
- Disable compromised identity          # AD account disabled / sessions revoked
- Block C2 at the egress firewall        # DROP known command-and-control IPs/domains
- Revoke/rotate exposed credentials & tokens</code></pre>

      <h3>Containment vs evidence — the tension</h3>
      <p>Every containment action risks altering evidence. The professional approach is to <strong>preserve before you disrupt</strong> where feasible: capture volatile memory and key artefacts, then contain. When speed and evidence conflict on a business-critical, actively-encrypting system, stopping the damage usually wins — but that is a conscious, documented decision, not a reflex.</p>

      <h3>The stealth consideration</h3>
      <p>If you contain loudly and incompletely, a sophisticated attacker notices and may accelerate — deploying ransomware early, deleting logs, or burning their remaining access. This is why Lesson 4's scoping matters: ideally you contain <strong>everything at once</strong> in a coordinated action, denying the adversary time to react.</p>

      <blockquote>Golden sequence: <strong>preserve evidence → contain (short-term) → stabilise (long-term) → then eradicate.</strong> Containment buys you the time and safety to do eradication properly; it is never the final fix by itself.</blockquote>

      <h3>Special case: account and identity containment</h3>
      <p>In credential-driven intrusions and cloud incidents, the fastest containment is often at the <em>identity</em> layer — disabling accounts, revoking active sessions/tokens, and resetting credentials — because the attacker's power lives in the identity, not any single host.</p>
    `,
    quizzes: [
      { id: "ir-l5-q1", question: "What is the primary goal of the containment phase?", options: ["To rebuild all systems immediately", "To stop the incident from spreading or worsening while preserving the ability to eradicate", "To write the final report", "To identify the attacker's name"], correctAnswerIndex: 1, explanation: "Containment halts active damage/spread and creates the safe conditions needed for eradication." },
      { id: "ir-l5-q2", question: "Why is isolating a host usually preferred over powering it off during an active attack?", options: ["Power-off is slower to type", "Power-off destroys volatile evidence like RAM, live processes, and encryption keys", "Isolation is illegal", "Power-off spreads the malware"], correctAnswerIndex: 1, explanation: "Powering off wipes volatile memory that may hold keys and forensic traces; isolation preserves it." },
      { id: "ir-l5-q3", question: "Which is an example of SHORT-term containment?", options: ["Rebuilding a datacenter segment over several days", "Immediately isolating a host from the network", "Rolling out a permanent architecture change", "Conducting the post-incident review"], correctAnswerIndex: 1, explanation: "Short-term containment is the immediate 'tourniquet' — e.g. isolating a host or disabling an account." },
      { id: "ir-l5-q4", question: "Long-term containment is best described as…", options: ["The final eradication step", "A sustainable bridge that keeps systems safely operating until eradication completes", "Powering everything off", "The same as recovery"], correctAnswerIndex: 1, explanation: "Long-term containment stabilises the environment (temporary patches, tighter rules) until eradication." },
      { id: "ir-l5-q5", question: "What is the recommended sequence around containment?", options: ["Eradicate, then contain, then preserve", "Preserve evidence, contain, stabilise, then eradicate", "Recover first, then contain", "Contain and eradicate simultaneously without evidence"], correctAnswerIndex: 1, explanation: "Preserve → contain (short-term) → stabilise (long-term) → eradicate is the disciplined order." },
      { id: "ir-l5-q6", question: "Why can loud, incomplete containment backfire against a sophisticated attacker?", options: ["It uses too much bandwidth", "The attacker notices and may accelerate — deploying ransomware or destroying logs", "It voids the software warranty", "It always fails technically"], correctAnswerIndex: 1, explanation: "Alerted attackers may burn access, wipe logs, or trigger destructive payloads early." },
      { id: "ir-l5-q7", question: "In a credential-driven or cloud incident, the fastest containment is often at which layer?", options: ["The physical cabling", "The identity layer — disable accounts, revoke sessions/tokens, reset credentials", "The DNS layer", "The backup layer"], correctAnswerIndex: 1, explanation: "When power lives in the identity, containing the account/session is faster than chasing hosts." },
      { id: "ir-l5-q8", question: "Is containment the final fix for an incident?", options: ["Yes, once contained the incident is over", "No — it buys time and safety so eradication can be done properly", "Yes, if the host is powered off", "Only for ransomware"], correctAnswerIndex: 1, explanation: "Containment is a bridge, not a cure; eradication and recovery still follow." },
    ],
  },

  // ── LESSON 6 ───────────────────────────────────────────────────────────────
  {
    title: "06 // Eradication and Recovery: Removing the Threat and Restoring Trust",
    summary: "The 'E' and 'R' in PICERL — fully removing the attacker's foothold, then safely returning systems to production with confidence.",
    content: `
      <h2>Get them out, and keep them out</h2>
      <p>Containment stopped the bleeding. <strong>Eradication</strong> removes the attacker and their tools entirely, and <strong>Recovery</strong> returns systems to normal operation. These two phases are separate for a critical reason: recovering before you've fully eradicated just re-infects you.</p>

      <h3>Eradication: remove every foothold</h3>
      <p>Eradication means finding and eliminating everything the attacker introduced or altered:</p>
      <ul>
        <li><strong>Malware and tools</strong> — remove implants, webshells, and dropped binaries.</li>
        <li><strong>Persistence mechanisms</strong> — scheduled tasks, services, run keys, cron jobs, malicious accounts, rogue SSH keys, OAuth grants.</li>
        <li><strong>The initial vector</strong> — patch the exploited vulnerability, close the exposed service, fix the phished-credential path. If you don't, they return.</li>
        <li><strong>Compromised credentials</strong> — reset affected passwords, rotate keys/secrets, and (for domain-wide compromise) consider resetting the <code>krbtgt</code> account to invalidate forged Kerberos tickets.</li>
      </ul>

      <h3>Clean rebuild beats clean-in-place</h3>
      <p>For a seriously compromised host — especially with root/admin-level or kernel implants — you can rarely trust that you found <em>everything</em>. The safe default is to <strong>rebuild from a known-good golden image</strong> rather than surgically clean the live system. Reimaging guarantees no leftover backdoor; hand-cleaning leaves doubt.</p>
      <pre><code># Eradication decision heuristic
IF host had admin/root/kernel-level compromise  -> REBUILD from golden image
IF backdoor complexity is uncertain             -> REBUILD (don't gamble)
IF isolated, low-privilege, well-understood     -> targeted clean MAY be acceptable
ALWAYS: patch the initial vector + rotate exposed credentials before restore</code></pre>

      <h3>Recovery: restore and verify</h3>
      <p>Recovery brings systems back into production carefully:</p>
      <ol>
        <li><strong>Restore from clean backups</strong> — and confirm the backup predates the compromise or has been verified clean. Restoring an infected backup is a classic self-inflicted wound.</li>
        <li><strong>Rebuild on hardened images</strong> — patched, reconfigured, credentials rotated.</li>
        <li><strong>Validate</strong> — confirm systems function correctly and are actually clean before reconnecting.</li>
        <li><strong>Reconnect in phases</strong> — bring systems back gradually, watching closely.</li>
        <li><strong>Heightened monitoring</strong> — attackers often try to return; watch restored systems intensely for a period.</li>
      </ol>

      <h3>The re-infection trap</h3>
      <p>Two mistakes cause most re-infections: restoring a backup that already contains the attacker's foothold, and recovering without having patched the initial vector. Both come from treating eradication and recovery as one rushed step instead of two disciplined ones.</p>

      <blockquote>The defining principle: <strong>eradicate completely, then recover — and never restore from a backup you haven't verified predates or excludes the compromise.</strong> Monitor restored systems as if the attacker will try again, because they often do.</blockquote>

      <h3>When is it truly over?</h3>
      <p>The incident isn't resolved when systems are back — it's resolved when systems are back <em>and</em> you have evidence they're clean, the entry vector is closed, and heightened monitoring shows no attacker return. Only then do you transition to Lessons Learned.</p>
    `,
    quizzes: [
      { id: "ir-l6-q1", question: "Why must eradication be completed before recovery?", options: ["To satisfy the SIEM licence", "Recovering before fully eradicating simply re-infects the environment", "Recovery is cheaper first", "Eradication is optional"], correctAnswerIndex: 1, explanation: "If you restore systems while the attacker's foothold remains, you reintroduce the compromise." },
      { id: "ir-l6-q2", question: "For a host with admin/kernel-level compromise, the safe default is to…", options: ["Hand-clean the live system", "Rebuild from a known-good golden image", "Just reboot it", "Ignore it and monitor"], correctAnswerIndex: 1, explanation: "Deep compromise can hide implants; reimaging from a golden image guarantees a clean slate." },
      { id: "ir-l6-q3", question: "Which of these is a persistence mechanism eradication must remove?", options: ["A user's desktop wallpaper", "Malicious scheduled tasks, services, run keys, or rogue accounts", "The corporate VPN", "The SIEM dashboard"], correctAnswerIndex: 1, explanation: "Persistence lives in scheduled tasks, services, run keys, cron jobs, rogue accounts, and keys." },
      { id: "ir-l6-q4", question: "Why must the initial access vector be fixed during eradication?", options: ["It's a compliance checkbox only", "Otherwise the attacker simply re-enters through the same path", "It changes the log format", "It speeds up backups"], correctAnswerIndex: 1, explanation: "Failing to close the entry point lets the attacker walk right back in after cleanup." },
      { id: "ir-l6-q5", question: "What is the risk of restoring from a backup without verifying it?", options: ["It's always fine", "The backup may already contain the attacker's foothold, re-infecting you", "Backups can't hold malware", "It only wastes time"], correctAnswerIndex: 1, explanation: "An infected backup reintroduces the compromise — a classic self-inflicted re-infection." },
      { id: "ir-l6-q6", question: "Why maintain heightened monitoring on recovered systems?", options: ["To test disk speed", "Because attackers frequently attempt to return after recovery", "Regulators require 30 days of it", "To justify the SOC budget"], correctAnswerIndex: 1, explanation: "Adversaries often try to re-establish access; intense monitoring catches a return quickly." },
      { id: "ir-l6-q7", question: "In a domain-wide compromise, resetting the krbtgt account helps by…", options: ["Speeding up logins", "Invalidating forged Kerberos tickets the attacker may hold", "Encrypting all backups", "Disabling the firewall"], correctAnswerIndex: 1, explanation: "Rotating krbtgt invalidates golden/forged Kerberos tickets, removing that persistence avenue." },
      { id: "ir-l6-q8", question: "When is an incident truly resolved?", options: ["When systems are back online", "When systems are clean, the entry vector is closed, and heightened monitoring shows no return", "When the ticket is assigned", "When the attacker's IP is blocked"], correctAnswerIndex: 1, explanation: "Resolution requires verified-clean systems, a closed vector, and confirmation the attacker hasn't returned." },
    ],
  },

  // ── LESSON 7 ───────────────────────────────────────────────────────────────
  {
    title: "07 // Evidence Preservation and Chain of Custody",
    summary: "Handling forensic evidence so it holds up legally — order of volatility, forensic imaging, hashing, and an unbroken chain of custody.",
    content: `
      <h2>Evidence you can defend</h2>
      <p>An incident's evidence may end up in a courtroom, an insurance claim, or a regulator's inquiry. Even when it doesn't, treating it rigorously keeps your investigation honest. This lesson covers how to collect and handle evidence so it remains <strong>trustworthy and admissible</strong>.</p>

      <h3>Order of volatility — collect the fleeting stuff first</h3>
      <p>Different evidence disappears at different speeds. The <strong>order of volatility</strong> tells you to capture the most ephemeral evidence first:</p>
      <table>
        <thead><tr><th>Priority</th><th>Evidence</th><th>Volatility</th></tr></thead>
        <tbody>
          <tr><td>1</td><td>CPU registers, cache</td><td>Gone in nanoseconds</td></tr>
          <tr><td>2</td><td>RAM, running processes, network connections</td><td>Lost on power-off</td></tr>
          <tr><td>3</td><td>Temporary files, swap</td><td>Lost on reboot/overwrite</td></tr>
          <tr><td>4</td><td>Disk contents (drives)</td><td>Persistent</td></tr>
          <tr><td>5</td><td>Logs on remote/backup media, archived data</td><td>Most durable</td></tr>
        </tbody>
      </table>
      <p>This is exactly why "just power it off" destroys the best evidence — RAM and live connections (priority 2) evaporate. Capture memory before you pull the plug.</p>

      <h3>Forensic imaging and write-blockers</h3>
      <p>You never investigate on the original evidence. You create a <strong>forensic image</strong> — a bit-for-bit copy — and work on that. When acquiring from a disk, a <strong>write-blocker</strong> (hardware or software) prevents any accidental modification of the source, preserving its integrity.</p>

      <h3>Hashing proves integrity</h3>
      <p>Immediately after imaging, you compute a cryptographic hash (e.g. SHA-256) of both the source and the copy. Matching hashes prove the copy is identical. Re-hashing later and getting the same value proves the evidence <em>hasn't changed since collection</em> — the mathematical backbone of integrity.</p>
      <pre><code># Conceptual imaging + verification
1. Attach source via WRITE-BLOCKER
2. Acquire bit-for-bit image  ->  evidence.img
3. sha256sum source  ==  sha256sum evidence.img   # must match
4. Store the hash in the case record
5. Work only on a COPY of evidence.img; original is sealed</code></pre>

      <h3>Chain of custody — the unbroken record</h3>
      <p><strong>Chain of custody</strong> is the documented, unbroken history of every piece of evidence: who collected it, when, from where, and everyone who handled or accessed it since. A single undocumented gap can render evidence inadmissible, because you can no longer prove it wasn't tampered with. Each record answers:</p>
      <ul>
        <li><strong>What</strong> is the item (with a unique identifier)?</li>
        <li><strong>Who</strong> collected it and who has held it?</li>
        <li><strong>When and where</strong> did each transfer happen?</li>
        <li><strong>Why/how</strong> was it accessed?</li>
      </ul>
      <p>Evidence is stored securely (sealed, access-controlled) so the chain cannot be silently broken.</p>

      <blockquote>The mantra: <strong>collect in order of volatility, image don't touch, hash to prove integrity, and document every hand-off.</strong> An investigation without chain of custody may be technically correct and legally worthless.</blockquote>

      <h3>Balancing forensics with business urgency</h3>
      <p>Full forensic rigor takes time the business may not have during an active SEV-1. Responders make risk-based calls — sometimes capturing a memory image and key logs is enough before containment must proceed. What matters is that these trade-offs are <em>deliberate and documented</em>, not accidental.</p>
    `,
    quizzes: [
      { id: "ir-l7-q1", question: "What does the 'order of volatility' instruct you to do?", options: ["Collect disk images before anything else", "Collect the most ephemeral evidence (like RAM) first", "Delete logs oldest-first", "Power off before imaging"], correctAnswerIndex: 1, explanation: "Volatile evidence (registers, RAM, connections) vanishes fastest, so it is collected first." },
      { id: "ir-l7-q2", question: "Which evidence is lost the moment a machine is powered off?", options: ["Disk contents", "RAM, running processes, and network connections", "Archived backups", "Firmware"], correctAnswerIndex: 1, explanation: "Volatile memory and live process/network state are lost on power-off." },
      { id: "ir-l7-q3", question: "What is a forensic image?", options: ["A screenshot of the desktop", "A bit-for-bit copy of the media that you investigate instead of the original", "A photo of the server", "A compressed log archive"], correctAnswerIndex: 1, explanation: "A forensic image is an exact bit-for-bit copy; analysis is done on it, never the original." },
      { id: "ir-l7-q4", question: "What is the purpose of a write-blocker?", options: ["To speed up imaging", "To prevent any modification of the source media during acquisition", "To encrypt the disk", "To delete malware"], correctAnswerIndex: 1, explanation: "A write-blocker ensures the source cannot be altered, preserving its evidentiary integrity." },
      { id: "ir-l7-q5", question: "How does hashing (e.g. SHA-256) support evidence integrity?", options: ["It compresses the evidence", "Matching hashes prove the copy is identical and unchanged since collection", "It hides the evidence", "It speeds up the court case"], correctAnswerIndex: 1, explanation: "A matching hash proves the image equals the source and remains unaltered over time." },
      { id: "ir-l7-q6", question: "What is chain of custody?", options: ["A network topology", "The documented, unbroken record of who handled evidence, when, and how", "A type of firewall rule", "A backup rotation scheme"], correctAnswerIndex: 1, explanation: "Chain of custody is the continuous documented history of evidence handling and access." },
      { id: "ir-l7-q7", question: "What can a single undocumented gap in the chain of custody cause?", options: ["Faster analysis", "The evidence becoming inadmissible because tampering can't be ruled out", "Improved hashing", "Nothing at all"], correctAnswerIndex: 1, explanation: "A gap breaks the ability to prove integrity, potentially rendering evidence inadmissible." },
      { id: "ir-l7-q8", question: "When business urgency forces forensic shortcuts, what makes them acceptable?", options: ["They are never acceptable", "They are deliberate, risk-based, and documented rather than accidental", "Only the CISO can approve them", "They must be hidden from the report"], correctAnswerIndex: 1, explanation: "Trade-offs are legitimate when made consciously and recorded, preserving investigative honesty." },
    ],
  },

  // ── LESSON 8 ───────────────────────────────────────────────────────────────
  {
    title: "08 // Playbooks, Runbooks, and Communication Under Pressure",
    summary: "Codifying response into repeatable playbooks and runbooks, and managing stakeholders — executives, legal, regulators — during a crisis.",
    content: `
      <h2>Repeatability and clear communication win incidents</h2>
      <p>Two things separate a smooth response from a chaotic one: <strong>documented procedures</strong> so people don't improvise, and <strong>disciplined communication</strong> so the right information reaches the right people. This lesson covers both.</p>

      <h3>Playbook vs runbook</h3>
      <table>
        <thead><tr><th></th><th>Playbook</th><th>Runbook</th></tr></thead>
        <tbody>
          <tr><td>Scope</td><td>Strategic — a whole incident <em>type</em> (e.g. ransomware, BEC, data theft)</td><td>Tactical — a single specific <em>task</em> (e.g. "isolate a Windows host with EDR")</td></tr>
          <tr><td>Audience</td><td>The response team / IC — the overall flow</td><td>The technician performing the step</td></tr>
          <tr><td>Contents</td><td>Decision points, escalation, roles, phase-by-phase actions</td><td>Exact commands/clicks to complete one procedure</td></tr>
        </tbody>
      </table>
      <p>A playbook orchestrates the response; runbooks are the precise step-by-step recipes it calls. Together they let a stressed team act correctly without reinventing the process.</p>

      <h3>Anatomy of a good playbook</h3>
      <ol>
        <li><strong>Trigger/scope</strong> — when this playbook applies.</li>
        <li><strong>Roles</strong> — who does what (mapped to the CSIRT).</li>
        <li><strong>Phase-by-phase actions</strong> — aligned to PICERL, with decision branches.</li>
        <li><strong>Communication requirements</strong> — who must be notified, and when.</li>
        <li><strong>References</strong> — the runbooks, contacts, and tools to use.</li>
      </ol>

      <h3>Communication: the underrated skill</h3>
      <p>Technical excellence fails if communication is poor. Key principles:</p>
      <ul>
        <li><strong>Single source of truth.</strong> The Scribe's timeline and the IC's status updates keep everyone aligned; rumours cause bad decisions.</li>
        <li><strong>Translate for the audience.</strong> Executives need business impact and decisions required, not packet captures. Legal needs facts and obligations. Technicians need precise tasks.</li>
        <li><strong>Cadence.</strong> Regular status updates (even "no change") prevent anxious stakeholders from interrupting responders.</li>
        <li><strong>Out-of-band.</strong> If corporate systems may be compromised, coordinate on separate channels the attacker can't read.</li>
        <li><strong>Careful wording.</strong> In writing, stick to facts. Speculation ("we think it was nation-state") can create legal and PR problems later.</li>
      </ul>

      <h3>Stakeholders and legal/regulatory duties</h3>
      <table>
        <thead><tr><th>Stakeholder</th><th>What they need</th></tr></thead>
        <tbody>
          <tr><td>Executives / Board</td><td>Business impact, risk, decisions required, cost/reputation exposure.</td></tr>
          <tr><td>Legal &amp; Compliance</td><td>Facts for obligations; guidance on notification, privilege, and evidence.</td></tr>
          <tr><td>Regulators</td><td>Breach notifications within legal deadlines (e.g. GDPR: 72 hours from awareness).</td></tr>
          <tr><td>Affected customers/partners</td><td>Honest, timely notice of impact and remediation — often legally required.</td></tr>
          <tr><td>Law enforcement / PR</td><td>Coordinated involvement when warranted; consistent public messaging.</td></tr>
        </tbody>
      </table>

      <h3>SOAR: automating the playbook</h3>
      <p><strong>SOAR</strong> (Security Orchestration, Automation and Response) platforms encode playbooks so routine steps — enrich an IOC, isolate a host, open a ticket, notify a channel — run automatically. Automation speeds response and reduces human error, but a human (the IC) still owns the consequential decisions.</p>

      <blockquote>Rule of the room: <strong>one Incident Commander, one source of truth, and messages tailored to each audience.</strong> The best technical response can still fail if leadership, legal, and customers are left in the dark or misled.</blockquote>
    `,
    quizzes: [
      { id: "ir-l8-q1", question: "What is the difference between a playbook and a runbook?", options: ["They are identical", "A playbook is strategic (a whole incident type); a runbook is tactical (a single task)", "A runbook covers incident types; a playbook covers single tasks", "A playbook is only for legal teams"], correctAnswerIndex: 1, explanation: "Playbooks orchestrate an incident type; runbooks are step-by-step recipes for individual tasks." },
      { id: "ir-l8-q2", question: "What does a SOAR platform do?", options: ["Stores backups only", "Orchestrates and automates response actions defined in playbooks", "Replaces the incident commander entirely", "Encrypts all endpoints"], correctAnswerIndex: 1, explanation: "SOAR automates and orchestrates playbook steps; humans still own consequential decisions." },
      { id: "ir-l8-q3", question: "Under GDPR, personal-data breaches must generally be reported to regulators within…", options: ["24 hours", "72 hours of becoming aware", "30 days", "One year"], correctAnswerIndex: 1, explanation: "GDPR requires notification to the supervisory authority within 72 hours of awareness." },
      { id: "ir-l8-q4", question: "What do executives primarily need during an incident?", options: ["Raw packet captures", "Business impact, risk, and the decisions required of them", "Exact shell commands", "The malware's source code"], correctAnswerIndex: 1, explanation: "Leadership needs impact and decisions, not technical minutiae — translate for the audience." },
      { id: "ir-l8-q5", question: "Why prefer out-of-band communication channels during a major incident?", options: ["They're cheaper", "Corporate systems may be compromised and monitored by the attacker", "They're required by GDPR", "They're faster in every case"], correctAnswerIndex: 1, explanation: "If the attacker is in your systems, in-band channels can leak your response plans." },
      { id: "ir-l8-q6", question: "Why should written incident communications avoid speculation?", options: ["It looks unprofessional only", "Speculation can create legal and PR exposure later", "It slows down typing", "Regulators ban all writing"], correctAnswerIndex: 1, explanation: "Unverified claims in writing can be used against the organisation legally and reputationally." },
      { id: "ir-l8-q7", question: "What is the value of a regular status-update cadence?", options: ["It fills time", "It keeps stakeholders informed so they don't interrupt responders", "It replaces the timeline", "It is only for auditors"], correctAnswerIndex: 1, explanation: "Predictable updates reduce anxious interruptions and keep everyone aligned." },
      { id: "ir-l8-q8", question: "What are the five typical sections of a good playbook?", options: ["Only commands to run", "Trigger/scope, roles, phase-by-phase actions, communication requirements, references", "Budget, headcount, vendors, SLAs, KPIs", "Just an escalation phone number"], correctAnswerIndex: 1, explanation: "A solid playbook defines trigger/scope, roles, PICERL-aligned actions, comms, and references." },
    ],
  },

  // ── LESSON 9 ───────────────────────────────────────────────────────────────
  {
    title: "09 // Common Incident Types: Ransomware, BEC, and Intrusions",
    summary: "Applying the lifecycle to the three incidents you'll see most — ransomware, business email compromise, and network intrusion.",
    content: `
      <h2>The lifecycle meets reality</h2>
      <p>PICERL is universal, but each incident type has its own tempo, evidence, and pitfalls. This lesson walks the three most common categories a responder faces, mapped to the phases you've learned and to MITRE ATT&CK.</p>

      <h3>Ransomware — the loud, fast one</h3>
      <p>Ransomware encrypts data for extortion (ATT&CK <strong>T1486 Data Encrypted for Impact</strong>). Modern operators also <em>steal</em> data first for "double extortion." Response priorities:</p>
      <ul>
        <li><strong>Identify & scope fast</strong> — rapid file-rename/encryption signatures pinpoint patient zero; find how far it's spread <em>before</em> containing.</li>
        <li><strong>Isolate, don't power off</strong> — keys may be in RAM; isolate to stop spread while preserving memory.</li>
        <li><strong>Watch for anti-forensics</strong> — ransomware frequently disables logging, deletes shadow copies, and kills backups before encrypting (Defense Evasion, <strong>T1490 Inhibit System Recovery</strong>).</li>
        <li><strong>Recover from offline backups</strong> — the payment decision is a business/legal call; clean backups are the technical lifeline.</li>
      </ul>

      <h3>Business Email Compromise (BEC) — the quiet, expensive one</h3>
      <p>BEC is fraud via compromised or spoofed email — often no malware at all, which makes it slippery. A common pattern: phished credentials → mailbox access → inbox rules hiding replies → a fraudulent wire-transfer request to finance.</p>
      <table>
        <thead><tr><th>Phase</th><th>BEC-specific action</th></tr></thead>
        <tbody>
          <tr><td>Identification</td><td>Spot anomalous logins (impossible travel), suspicious inbox/forwarding rules, unusual OAuth grants.</td></tr>
          <tr><td>Containment</td><td>Reset the account, revoke sessions/tokens, remove malicious inbox rules and app consents.</td></tr>
          <tr><td>Eradication/Recovery</td><td>Enforce MFA, audit all mailbox rules and delegated access, review any transactions made.</td></tr>
          <tr><td>Special step</td><td>If money moved, engage finance/bank IMMEDIATELY — rapid recall may claw funds back.</td></tr>
        </tbody>
      </table>
      <p>BEC's evidence lives in mailbox audit logs, sign-in logs, and message traces — not in EDR. Knowing where to look is half the battle.</p>

      <h3>Network intrusion / APT — the patient one</h3>
      <p>A hands-on-keyboard intruder follows a kill chain: initial access → establish persistence → escalate privilege → move laterally → collect and exfiltrate. These are the incidents where <strong>scoping discipline</strong> matters most, because the attacker is deliberately spreading and hiding.</p>
      <ul>
        <li><strong>Trace lateral movement</strong> across auth logs, EDR, and network flows (Lesson 4).</li>
        <li><strong>Hunt persistence</strong> — new accounts, scheduled tasks, services, rogue keys.</li>
        <li><strong>Coordinated containment</strong> — remove access everywhere at once; a partial cut warns them.</li>
        <li><strong>Assume credential compromise</strong> — expect to rotate credentials broadly, potentially domain-wide.</li>
      </ul>

      <h3>Pattern recognition across types</h3>
      <table>
        <thead><tr><th>Type</th><th>Tempo</th><th>Key evidence</th><th>Signature risk</th></tr></thead>
        <tbody>
          <tr><td>Ransomware</td><td>Minutes — loud</td><td>File-system activity, RAM, backups</td><td>Anti-forensics / recovery inhibition</td></tr>
          <tr><td>BEC</td><td>Days — quiet</td><td>Mailbox &amp; sign-in logs</td><td>Financial loss, often no malware</td></tr>
          <tr><td>Intrusion / APT</td><td>Weeks — patient</td><td>Auth logs, EDR, flows, persistence</td><td>Missed footholds, tipping off the attacker</td></tr>
        </tbody>
      </table>

      <blockquote>Takeaway: the phases never change, but the <em>tempo, evidence sources, and traps</em> do. A great responder recognises the incident type early and reaches for the matching playbook — while trusting PICERL as the constant underneath.</blockquote>
    `,
    quizzes: [
      { id: "ir-l9-q1", question: "Which MITRE technique covers ransomware encrypting files?", options: ["T1566 Phishing", "T1486 Data Encrypted for Impact", "T1078 Valid Accounts", "T1595 Active Scanning"], correctAnswerIndex: 1, explanation: "T1486 Data Encrypted for Impact is ATT&CK's technique for ransomware-style encryption." },
      { id: "ir-l9-q2", question: "What is 'double extortion' in modern ransomware?", options: ["Encrypting the same file twice", "Stealing data before encrypting, then threatening to leak it", "Charging two ransoms per host", "Attacking two companies at once"], correctAnswerIndex: 1, explanation: "Operators exfiltrate data first, adding a leak threat on top of the encryption ransom." },
      { id: "ir-l9-q3", question: "Why is powering off a ransomware host discouraged?", options: ["It voids the warranty", "Encryption keys and traces may live only in RAM, which is lost on power-off", "It spreads the ransomware", "It's always too slow"], correctAnswerIndex: 1, explanation: "Volatile memory may hold keys/evidence; isolating preserves it while stopping spread." },
      { id: "ir-l9-q4", question: "What most characterises Business Email Compromise (BEC)?", options: ["Heavy custom malware", "Email-based fraud, often with no malware, via compromised or spoofed accounts", "Physical device theft", "Encrypting all files"], correctAnswerIndex: 1, explanation: "BEC is email fraud frequently involving no malware, relying on account access and social engineering." },
      { id: "ir-l9-q5", question: "During BEC containment, which action is essential for the compromised mailbox?", options: ["Reboot the mail server", "Reset the account, revoke sessions/tokens, and remove malicious inbox rules and app consents", "Delete all email", "Power off the user's laptop"], correctAnswerIndex: 1, explanation: "BEC containment centres on the identity: reset creds, revoke access, and strip hidden inbox rules/OAuth grants." },
      { id: "ir-l9-q6", question: "If funds were wired during a BEC, what special step matters most?", options: ["Wait until the report is written", "Engage finance/the bank immediately — rapid recall may recover funds", "Reset the SIEM", "Notify the press first"], correctAnswerIndex: 1, explanation: "Speed is critical; immediate bank/finance action can sometimes claw back transferred money." },
      { id: "ir-l9-q7", question: "In which incident type is coordinated all-at-once containment most critical?", options: ["A single-host adware infection", "A hands-on network intrusion/APT with lateral movement", "A blocked phishing email", "A spam wave"], correctAnswerIndex: 1, explanation: "Active intruders spread and hide; partial containment tips them off, so remove access everywhere at once." },
      { id: "ir-l9-q8", question: "Where does BEC evidence primarily live?", options: ["EDR process telemetry", "Mailbox audit logs, sign-in logs, and message traces", "Disk forensic images", "Firewall packet captures"], correctAnswerIndex: 1, explanation: "BEC leaves traces in mailbox/sign-in logs and message traces rather than in endpoint EDR." },
    ],
  },

  // ── LESSON 10 ──────────────────────────────────────────────────────────────
  {
    title: "10 // Post-Incident Review and Metrics: Closing the Loop",
    summary: "The 'L' in PICERL — the blameless post-incident review, the report, and the metrics (MTTD/MTTR) that prove you're improving.",
    content: `
      <h2>The incident isn't over when the fire is out</h2>
      <p>The final phase — <strong>Lessons Learned</strong> (NIST: Post-Incident Activity) — is where an incident pays for itself. Done well, it makes the next incident smaller, faster, and cheaper. Skipped, you are guaranteed to relive the same breach. This lesson closes the loop back to Preparation.</p>

      <h3>The post-incident review (PIR)</h3>
      <p>Held soon after resolution while memories are fresh (typically within one to two weeks), the PIR — also called a post-mortem or hotwash — answers a structured set of questions:</p>
      <ol>
        <li><strong>What happened?</strong> An agreed, factual timeline of the incident and the response.</li>
        <li><strong>What worked?</strong> Reinforce the strengths — the detections and steps that helped.</li>
        <li><strong>What didn't?</strong> Where were the delays, gaps, and confusion?</li>
        <li><strong>Root cause?</strong> Not just the technical vector, but the systemic why (e.g. missing patch process, no MFA).</li>
        <li><strong>What will we change?</strong> Concrete, owned, deadlined action items.</li>
      </ol>

      <h3>Blameless is the whole point</h3>
      <p>A <strong>blameless</strong> review focuses on <em>systems and process</em>, not on punishing individuals. This isn't being soft — it's engineering. When people fear blame, they hide facts, and you lose the truth you need to actually fix things. Psychological safety produces honest timelines, which produce real improvements.</p>

      <blockquote>The blameless principle: assume everyone acted reasonably given what they knew at the time. Ask "what made this failure possible and how do we design it out?" — never "whose fault was it?"</blockquote>

      <h3>The metrics that matter</h3>
      <p>You can't improve what you don't measure. The core IR metrics:</p>
      <table>
        <thead><tr><th>Metric</th><th>Measures</th><th>Goal</th></tr></thead>
        <tbody>
          <tr><td><strong>MTTD</strong> — Mean Time To Detect</td><td>Compromise → detection</td><td>Lower — find them faster</td></tr>
          <tr><td><strong>MTTA</strong> — Mean Time To Acknowledge</td><td>Alert → someone starts work</td><td>Lower — triage responsiveness</td></tr>
          <tr><td><strong>MTTC</strong> — Mean Time To Contain</td><td>Detection → containment</td><td>Lower — limit the damage window</td></tr>
          <tr><td><strong>MTTR</strong> — Mean Time To Respond/Recover</td><td>Detection → full resolution</td><td>Lower — shorten total impact</td></tr>
        </tbody>
      </table>
      <p>Dwell time — how long the attacker was present before detection — is closely related to MTTD and is a headline industry metric. Falling MTTD and MTTR over time are the clearest evidence an IR program is maturing.</p>

      <h3>The report and the feedback loop</h3>
      <p>The PIR produces a written <strong>incident report</strong>: executive summary, timeline, impact, root cause, and recommendations. Its recommendations must then actually flow back into the program:</p>
      <ul>
        <li><strong>New/tuned detections</strong> — so next time it's caught at Identification, not by a customer.</li>
        <li><strong>Hardening</strong> — close the vulnerability class, not just the one hole.</li>
        <li><strong>Updated playbooks</strong> — bake the lessons into the procedures.</li>
        <li><strong>Training/drills</strong> — rehearse the scenario you just lived through.</li>
      </ul>
      <p>That arrow — from Lessons Learned back into Preparation — is what makes the lifecycle a virtuous loop rather than a treadmill.</p>

      <blockquote>Capstone thought: a mature incident responder measures success not by heroics during the fire, but by how rarely the same fire starts twice. The PIR, the metrics, and the feedback loop are how you prove — and cause — that improvement.</blockquote>
    `,
    quizzes: [
      { id: "ir-l10-q1", question: "In PICERL, the final phase is…", options: ["Recovery", "Containment", "Lessons Learned", "Identification"], correctAnswerIndex: 2, explanation: "Lessons Learned (NIST: Post-Incident Activity) is the final phase, feeding back into Preparation." },
      { id: "ir-l10-q2", question: "What does MTTD measure?", options: ["Detection to full recovery", "Time from compromise to detection", "Alert acknowledgement time", "Containment duration"], correctAnswerIndex: 1, explanation: "Mean Time To Detect is the gap from initial compromise to detection." },
      { id: "ir-l10-q3", question: "What does MTTR most commonly measure?", options: ["Compromise to detection", "Detection to full response/recovery (total resolution)", "Alert to acknowledgement", "Backup to restore"], correctAnswerIndex: 1, explanation: "Mean Time To Respond/Recover spans detection to full resolution of the incident." },
      { id: "ir-l10-q4", question: "Why is a post-incident review made 'blameless'?", options: ["To be polite", "Fear of blame makes people hide facts; blamelessness yields honest data to fix systems", "Regulators require the word 'blameless'", "To avoid writing a report"], correctAnswerIndex: 1, explanation: "Blameless review protects the truth; it targets process/system fixes rather than punishing people." },
      { id: "ir-l10-q5", question: "What is 'dwell time'?", options: ["How long a meeting lasts", "How long the attacker was present before being detected", "The backup retention period", "Time spent writing the report"], correctAnswerIndex: 1, explanation: "Dwell time is the attacker's undetected presence duration, closely tied to MTTD." },
      { id: "ir-l10-q6", question: "Which is a proper output of the Lessons Learned phase?", options: ["Deleting all logs", "New/tuned detections, hardening, updated playbooks, and training", "Assigning blame to an individual", "Powering off all systems"], correctAnswerIndex: 1, explanation: "The phase feeds improvements — detections, hardening, playbook updates, and drills — back into Preparation." },
      { id: "ir-l10-q7", question: "When should the post-incident review ideally be held?", options: ["Several years later", "Soon after resolution, while memories are fresh (typically within 1–2 weeks)", "Never, if the incident was contained", "Only if a regulator asks"], correctAnswerIndex: 1, explanation: "A prompt PIR captures accurate detail before memories fade." },
      { id: "ir-l10-q8", question: "By what measure does a mature responder ultimately judge success?", options: ["Heroics during the incident", "How rarely the same type of incident recurs", "Number of alerts closed", "Speed of typing commands"], correctAnswerIndex: 1, explanation: "The feedback loop's aim is prevention of recurrence — the truest sign of a maturing IR program." },
    ],
  },
];
