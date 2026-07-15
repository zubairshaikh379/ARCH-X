// ─────────────────────────────────────────────────────────────────────────────
// THREAT HUNTER — DEEP GUIDEBOOK (textbook-grade course for ARCH-X)
//
// Content is authored as SEMANTIC HTML and rendered inside `.md-content`
// (see src/index.css) — h2/h3/p/ul/ol/li/pre/code/table/blockquote/strong are
// all styled there, so lessons render correctly without relying on Tailwind
// class scanning.
//
// Structure mirrors a real syllabus: Intro → The Hunt Loop → IOCs vs TTPs →
// ATT&CK-driven hunts → Data & Telemetry → Baselining → Hunt Techniques →
// Enrichment & Intel → Documentation & Detections → Capstone / Maturity.
// Each lesson ends with an 8-question knowledge check.
// ─────────────────────────────────────────────────────────────────────────────

import type { Course } from "../courses";

type Lesson = Course["lessons"][number];

// Optional Overview fields (spread into the threat-hunter course object).
export const META: Pick<
  Course,
  "prerequisites" | "learningOutcomes" | "mustKnow" | "commonGaps" | "prosCons" | "careerNotes"
> = {
  prerequisites: [
    "Comfort reading logs and alerts — ideally some Tier-1 SOC or SIEM exposure (the SOC Analyst course is a natural feeder).",
    "A working mental model of how attacks progress: initial access, execution, persistence, command-and-control, exfiltration.",
    "Familiarity with at least one query interface (SIEM search, KQL, SPL, or SQL) — you'll be writing queries, not just reading alerts.",
    "Basic networking and endpoint literacy: DNS, HTTP(S), processes, parent/child process trees, and the Windows/Linux event logs.",
  ],
  learningOutcomes: [
    "Frame a testable hunting hypothesis grounded in adversary behaviour, not a vague hunch.",
    "Run the full hunt loop — hypothesis → data → analysis → findings → feedback — and know when to stop.",
    "Explain the Pyramid of Pain and deliberately hunt for TTPs, not just brittle atomic IOCs.",
    "Turn a MITRE ATT&CK technique into a concrete, data-backed hunt with a query you can run.",
    "Choose the right telemetry (EDR, endpoint logs, network, DNS, proxy) for a given hypothesis and recognise its blind spots.",
    "Baseline 'normal' for an environment and use stacking, clustering, and grouping to surface the rare and the anomalous.",
    "Enrich findings with threat intelligence and convert a successful hunt into a durable, tuned detection (e.g. a Sigma rule).",
  ],
  mustKnow: [
    "Hypothesis-driven hunting", "The hunt loop", "IOC vs TTP", "Pyramid of Pain",
    "MITRE ATT&CK", "TTP", "Atomic / Computed / Behavioural indicators", "EDR telemetry",
    "Sysmon", "DNS / proxy logs", "Beaconing / C2", "Baselining", "Long-tail analysis",
    "Stack counting (frequency analysis)", "Clustering", "Grouping", "Enrichment",
    "Threat intelligence", "Sigma rules", "Detection engineering", "Assume breach",
    "Diamond Model", "Hunt maturity model (HMM)",
  ],
  commonGaps: [
    "Hunting for IOCs only. Beginners chase hashes and IPs — the bottom of the Pyramid of Pain — which attackers swap in seconds. Durable hunting targets behaviour.",
    "No hypothesis. A hunt without a testable question is just aimless log-scrolling; you can neither prove a negative nor know when you're done.",
    "Ignoring the 'null result'. A hunt that finds nothing is still a success if it validates a hypothesis and produces a coverage or detection improvement — most learners treat it as failure.",
    "Baseline blindness. You cannot call something anomalous without knowing what normal looks like for THIS environment; rare is not the same as malicious.",
    "Data blind spots. Every hunt is only as good as its telemetry. Hunting for process injection with only firewall logs is hunting in the dark.",
    "Findings that die in a doc. A hunt that isn't turned into a detection, a tuning change, or a documented negative is a hunt you'll have to run manually forever.",
  ],
  prosCons: {
    pros: [
      "Proactive: finds the dwell-time adversary that never tripped an alert, shrinking the time between breach and discovery.",
      "Behaviour-focused hunting (TTPs) is resilient — it survives the attacker rotating infrastructure and recompiling tooling.",
      "Every hunt matures the whole program: new detections, better baselines, and documented coverage gaps feed back into the SOC.",
    ],
    cons: [
      "Expensive in skilled analyst time and demands broad, well-retained telemetry — you can't hunt data you never collected.",
      "Hard to measure: success is often a documented negative or an incremental detection, not a dramatic 'catch'.",
      "Prone to bias and rabbit-holes; without discipline a hunter over-fits to a favourite theory or drowns in false leads.",
    ],
  },
  careerNotes:
    "Threat hunting is typically a Tier-3 / senior blue-team role — analysts usually arrive via SOC triage (Tier 1/2), detection engineering, or incident response rather than starting here. It pairs closely with Detection Engineering and Cyber Threat Intelligence (CTI). Certifications and paths that map well: GIAC GCTI and GCFA, eLearnSecurity/INE eCTHP (Certified Threat Hunting Professional), the MITRE ATT&CK Defender (MAD) series, and practical labs on TryHackMe/HackTheBox and the free 'Hunt Evil' / OTRF (Open Threat Research) material. Expect a 2–5 year runway from a junior SOC role; the hunters who stand out write clear hypotheses, turn findings into Sigma/analytics, and speak fluent ATT&CK.",
};

export const LESSONS: Lesson[] = [
  // ── LESSON 1 ───────────────────────────────────────────────────────────────
  {
    title: "01 // What Threat Hunting Really Is",
    summary: "Why proactive, hypothesis-driven hunting exists, how it differs from alerting and IR, and the 'assume breach' mindset behind it.",
    content: `
      <h2>Beyond waiting for the alarm</h2>
      <p><strong>Threat hunting</strong> is the proactive, human-led search for adversaries that have evaded your automated defences. A Security Operations Center reacts to alerts; a hunter goes looking for the attacker <em>no alert fired on</em>. The analogy that grounds this whole course: an alarm system waits for a window to break, but a detective walks the property looking for the faint muddy footprint by the back door before anything is stolen.</p>

      <p>The founding assumption is <strong>"assume breach."</strong> A hunter does not ask "were we attacked?" They ask "an adversary is already inside — where, and how would I see them?" That reframing is the entire discipline in one sentence.</p>

      <h3>Hunting vs alerting vs incident response</h3>
      <table>
        <thead><tr><th>Function</th><th>Trigger</th><th>Question it answers</th></tr></thead>
        <tbody>
          <tr><td><strong>Alerting / monitoring</strong></td><td>A rule fires automatically</td><td>"Did something we already know about happen?"</td></tr>
          <tr><td><strong>Threat hunting</strong></td><td>A human hypothesis</td><td>"Is something we <em>don't</em> have an alert for happening?"</td></tr>
          <tr><td><strong>Incident response</strong></td><td>A confirmed incident</td><td>"It happened — how do we contain, eradicate, and recover?"</td></tr>
        </tbody>
      </table>
      <p>These feed each other. A hunt that finds something becomes an incident (handed to IR). A hunt that finds a repeatable pattern becomes a new alert (handed to detection engineering). Hunting sits in the gap that automation cannot cover.</p>

      <h3>Why proactive hunting matters: dwell time</h3>
      <p>The metric that justifies a hunt program is <strong>dwell time</strong> — how long an attacker operates undetected before discovery. Sophisticated intruders (including advanced persistent threats, or <strong>APTs</strong>) deliberately stay quiet and blend into normal activity. If you only wait for alerts, a patient adversary who never trips one can live in your network for months. Hunting exists to drive that number down.</p>

      <h3>What makes a good hunter</h3>
      <ul>
        <li><strong>Curiosity with rigour</strong> — chase the odd thing, but form a testable question and prove it with data.</li>
        <li><strong>Adversary empathy</strong> — you must think like the attacker to guess where they'd hide.</li>
        <li><strong>Comfort with ambiguity</strong> — most hunts end in "nothing found," and that is a legitimate, valuable result.</li>
        <li><strong>Bias to operationalise</strong> — a finding you can't turn into a detection or a documented negative is a finding you'll re-hunt forever.</li>
      </ul>

      <blockquote>The mental flip that starts every hunt: stop asking "did an alert fire?" and start asking "if a skilled attacker were already here, what trace would they inevitably leave — and do I have the data to see it?"</blockquote>
    `,
    quizzes: [
      { id: "th-l1-q1", question: "What best distinguishes threat hunting from alert monitoring?", options: ["Hunting is fully automated; monitoring is manual", "Hunting is a proactive, human-driven search for threats no alert fired on", "Hunting only happens after an incident is declared", "They are the same activity"], correctAnswerIndex: 1, explanation: "Hunting proactively searches for adversaries that evaded automated detection; monitoring reacts to rules that fire." },
      { id: "th-l1-q2", question: "What is the core assumption behind threat hunting?", options: ["Assume the perimeter is impenetrable", "Assume breach — an adversary may already be inside", "Assume all alerts are false positives", "Assume users never make mistakes"], correctAnswerIndex: 1, explanation: "'Assume breach' reframes the question from 'were we attacked?' to 'where is the attacker already operating?'" },
      { id: "th-l1-q3", question: "What is 'dwell time'?", options: ["How long a query takes to run", "How long an attacker operates undetected before discovery", "The time a SIEM retains logs", "The time between shifts"], correctAnswerIndex: 1, explanation: "Dwell time measures how long an adversary is present before being detected; reducing it is a key goal of hunting." },
      { id: "th-l1-q4", question: "A hunt uncovers an active intrusion. Where does it typically go next?", options: ["It is deleted as a false positive", "It is handed to incident response for containment and eradication", "It is ignored until an alert fires", "It is emailed to the attacker"], correctAnswerIndex: 1, explanation: "A confirmed finding becomes an incident and is handed to IR to contain, eradicate, and recover." },
    ],
  },

  // ── LESSON 2 ───────────────────────────────────────────────────────────────
  {
    title: "02 // The Hunt Loop: A Repeatable Method",
    summary: "The end-to-end cycle every mature hunt follows — hypothesis, data, analysis, findings, and feedback — so hunting is a process, not a vibe.",
    content: `
      <h2>Turning intuition into a process</h2>
      <p>Amateur hunting is scrolling logs until something looks weird. Professional hunting is a <strong>repeatable loop</strong> so results are consistent, reviewable, and improvable. The widely-taught cycle has five stages that feed back on themselves.</p>

      <h3>The five stages</h3>
      <ol>
        <li><strong>Hypothesis</strong> — a specific, testable statement of what you expect to find and why. (Lesson 3 goes deep.)</li>
        <li><strong>Data &amp; scope</strong> — decide what telemetry answers the question, over what time window and which assets. If the data doesn't exist, the hunt stops here (that's itself a finding: a visibility gap).</li>
        <li><strong>Analysis</strong> — query, stack, cluster, and filter the data to test the hypothesis (Lesson 7's techniques).</li>
        <li><strong>Findings</strong> — confirm or reject. Malicious → escalate to IR. Benign-but-noisy → tuning. Nothing → documented negative.</li>
        <li><strong>Feedback</strong> — feed results back: new detections, better baselines, refined hypotheses, and documented coverage. The loop closes and informs the next hunt.</li>
      </ol>

      <h3>Where hypotheses come from</h3>
      <p>You don't invent hunts at random. Good hypotheses have sources:</p>
      <ul>
        <li><strong>Threat intelligence</strong> — a new report on a group targeting your sector suggests specific behaviours to look for.</li>
        <li><strong>MITRE ATT&CK</strong> — pick a technique you have low detection coverage for and hunt it.</li>
        <li><strong>Situational awareness</strong> — a new crown-jewel server, a recent phishing wave, a risky business change.</li>
        <li><strong>Anomalies &amp; curiosity</strong> — something odd in an earlier hunt or an unexplained log pattern.</li>
      </ul>

      <h3>Scoping keeps you honest</h3>
      <p>Before touching data, define the boundaries: which hosts, which time range, which data sources, and — critically — <strong>what would prove the hypothesis true and what would prove it false.</strong> Undefined scope is how hunters burn a week and can't say whether they succeeded. A tight scope is what lets you declare "done."</p>

      <h3>Knowing when to stop</h3>
      <p>A hunt ends when you can answer the hypothesis with the available data — true, false, or "insufficient telemetry." It does <em>not</em> end when you get bored or when you find your first interesting thing (that becomes a new, separate hunt). Discipline here prevents the two classic failures: quitting too early and rabbit-holing forever.</p>

      <blockquote>The loop's secret power is the <strong>feedback</strong> stage. A SOC that only alerts stays flat; a SOC that hunts gets measurably better every cycle, because each hunt deposits a detection, a baseline, or a documented gap back into the program.</blockquote>
    `,
    quizzes: [
      { id: "th-l2-q1", question: "What is the first stage of the hunt loop?", options: ["Containment", "Forming a testable hypothesis", "Deploying a firewall rule", "Writing the final report"], correctAnswerIndex: 1, explanation: "Every disciplined hunt begins with a specific, testable hypothesis about what you expect to find and why." },
      { id: "th-l2-q2", question: "During scoping you discover the needed telemetry was never collected. What does this represent?", options: ["A total failure with no value", "A finding in itself — a visibility/coverage gap", "Proof there is no threat", "A reason to fabricate data"], correctAnswerIndex: 1, explanation: "Discovering a data blind spot is a legitimate and valuable hunt outcome that drives logging improvements." },
      { id: "th-l2-q3", question: "Which is NOT a typical source of a hunting hypothesis?", options: ["Threat intelligence reports", "A MITRE ATT&CK technique with low coverage", "A random guess with no rationale", "A newly deployed crown-jewel asset"], correctAnswerIndex: 2, explanation: "Hypotheses should be grounded in intel, ATT&CK, or situational awareness — not random guessing." },
      { id: "th-l2-q4", question: "Why is defining 'what would prove the hypothesis false' important?", options: ["It is not important", "It lets you know when the hunt is genuinely done and prevents endless searching", "It guarantees you find malware", "It replaces the need for data"], correctAnswerIndex: 1, explanation: "A clear falsification criterion bounds the hunt so you can conclude it rather than rabbit-hole indefinitely." },
      { id: "th-l2-q5", question: "What makes the hunt loop 'closed'?", options: ["It never repeats", "The feedback stage feeds findings back into detections, baselines, and future hypotheses", "It only runs once per year", "It ignores previous results"], correctAnswerIndex: 1, explanation: "The feedback stage recycles results into the program, so each cycle improves the next." },
      { id: "th-l2-q6", question: "A hunt confirms malicious activity. What is the correct next step?", options: ["Close it silently", "Escalate to incident response", "Delete the logs", "Ignore it until an alert fires"], correctAnswerIndex: 1, explanation: "Confirmed malicious findings become incidents and are handed to IR for containment and eradication." },
      { id: "th-l2-q7", question: "When should a hunt properly end?", options: ["When the analyst gets bored", "When the hypothesis can be answered with the available data", "The moment anything interesting appears", "After exactly one hour"], correctAnswerIndex: 1, explanation: "A hunt ends when the hypothesis is answered — true, false, or insufficient data — not on boredom or the first lead." },
      { id: "th-l2-q8", question: "What is the main benefit of treating hunting as a repeatable loop rather than ad-hoc log-scrolling?", options: ["It uses less disk space", "Results become consistent, reviewable, and continuously improvable", "It removes the need for hypotheses", "It makes hunting fully automatic"], correctAnswerIndex: 1, explanation: "A defined process yields consistent, auditable results and lets the program mature over time." },
    ],
  },

  // ── LESSON 3 ───────────────────────────────────────────────────────────────
  {
    title: "03 // Hypothesis-Driven Hunting",
    summary: "How to craft a hunt hypothesis that is specific, testable, and grounded in adversary behaviour — the skill that separates hunting from guessing.",
    content: `
      <h2>The hypothesis is the hunt</h2>
      <p>Everything else is mechanics; the hypothesis is the intellectual core. A <strong>hunting hypothesis</strong> is a concrete, testable statement about adversary activity you believe <em>might</em> be present, phrased so that data can confirm or refute it.</p>

      <h3>Weak vs strong hypotheses</h3>
      <table>
        <thead><tr><th>Weak (untestable)</th><th>Strong (testable)</th></tr></thead>
        <tbody>
          <tr><td>"Maybe there's malware somewhere."</td><td>"An adversary is using scheduled tasks for persistence on our finance servers (T1053)."</td></tr>
          <tr><td>"Attackers might be in the network."</td><td>"A compromised host is beaconing to external C2 over HTTPS at regular intervals (T1071)."</td></tr>
          <tr><td>"Something looks off in DNS."</td><td>"Data is being exfiltrated via anomalously large or high-entropy DNS queries (T1048/T1071.004)."</td></tr>
        </tbody>
      </table>
      <p>Notice the pattern in the strong column: an <strong>actor</strong>, a <strong>behaviour</strong>, an <strong>asset/scope</strong>, and (usefully) an <strong>ATT&CK reference</strong>. That structure is what makes it answerable with a query.</p>

      <h3>A simple template</h3>
      <blockquote>"<strong>[Adversary/threat]</strong> is performing <strong>[specific behaviour / ATT&CK technique]</strong> on <strong>[assets / scope]</strong>, which I can detect by looking for <strong>[observable evidence]</strong> in <strong>[data source]</strong>."</blockquote>
      <p>Filling in every blank forces you to confront the two questions that sink lazy hunts: <em>what would the evidence actually look like?</em> and <em>do I even have the data to see it?</em></p>

      <h3>The three flavours of hypothesis</h3>
      <ul>
        <li><strong>Intelligence-driven</strong> — "Threat group X, per this report, uses technique Y; are we seeing Y?" Anchored to a known adversary.</li>
        <li><strong>Situational / awareness-driven</strong> — "We just exposed a new VPN portal; is anyone abusing it?" Anchored to your environment's changes and crown jewels.</li>
        <li><strong>Analytics / anomaly-driven</strong> — "Statistically rare parent-child process relationships may indicate living-off-the-land abuse." Anchored to baselines and math.</li>
      </ul>

      <h3>Avoiding confirmation bias</h3>
      <p>A hypothesis is a thing to <em>test</em>, not a conclusion to defend. The danger is fitting the data to your favourite theory. Guardrails: predefine what "false" looks like, seek disconfirming evidence as hard as confirming evidence, and be willing to write "hypothesis rejected." A hunter who never rejects a hypothesis isn't hunting — they're confirming.</p>

      <blockquote>Rule of thumb: if you cannot state, before running a single query, exactly what result would make you say "yes" and what would make you say "no," your hypothesis isn't finished yet.</blockquote>
    `,
    quizzes: [
      { id: "th-l3-q1", question: "What is a hunting hypothesis?", options: ["A random search of all logs", "A concrete, testable statement about suspected adversary activity that data can confirm or refute", "A finished conclusion about an incident", "A firewall configuration"], correctAnswerIndex: 1, explanation: "A hypothesis is a specific, testable claim phrased so evidence can prove or disprove it." },
      { id: "th-l3-q2", question: "Which is the strongest hypothesis?", options: ["\"Maybe malware is somewhere on the network.\"", "\"An adversary is using scheduled tasks (T1053) for persistence on the finance servers.\"", "\"Something seems off lately.\"", "\"Attackers probably exist.\""], correctAnswerIndex: 1, explanation: "It names a behaviour, an ATT&CK technique, and a scope, making it testable with data." },
      { id: "th-l3-q3", question: "Which element is characteristic of a strong, testable hypothesis?", options: ["Vagueness so it can't be wrong", "A specific behaviour, a scope, and observable evidence in a named data source", "No reference to any data", "A guarantee that malware will be found"], correctAnswerIndex: 1, explanation: "Specificity about behaviour, scope, evidence, and data source is what makes a hypothesis answerable." },
      { id: "th-l3-q4", question: "An intelligence-driven hypothesis is anchored to what?", options: ["A known adversary's reported techniques", "The color scheme of the SIEM", "Random number generation", "The size of the log files"], correctAnswerIndex: 0, explanation: "Intelligence-driven hypotheses start from a known threat actor and the techniques attributed to them." },
      { id: "th-l3-q5", question: "An analytics/anomaly-driven hypothesis relies primarily on what?", options: ["A vendor sales pitch", "Baselines and statistical rarity (e.g. rare process relationships)", "The attacker confessing", "Physical security cameras"], correctAnswerIndex: 1, explanation: "Anomaly-driven hunting leans on baselines and math to surface statistically unusual behaviour." },
      { id: "th-l3-q6", question: "What is confirmation bias in hunting?", options: ["Testing a hypothesis fairly", "Fitting the data to a favourite theory instead of genuinely testing it", "Rejecting a hypothesis when data disproves it", "Collecting more telemetry"], correctAnswerIndex: 1, explanation: "Confirmation bias is seeking only supporting evidence and ignoring disconfirming data." },
      { id: "th-l3-q7", question: "What is a good guardrail against confirmation bias?", options: ["Never write down the hypothesis", "Predefine what a 'false' result looks like and seek disconfirming evidence", "Only look for evidence that supports the theory", "Avoid using ATT&CK"], correctAnswerIndex: 1, explanation: "Defining falsification criteria and actively seeking disconfirming evidence keeps the test honest." },
      { id: "th-l3-q8", question: "According to the rule of thumb, when is a hypothesis 'finished'?", options: ["When it mentions a threat group", "When you can state in advance exactly what result means 'yes' and what means 'no'", "When it is at least three sentences long", "When it never gets rejected"], correctAnswerIndex: 1, explanation: "A finished hypothesis has clear, pre-stated confirm/refute criteria before any query is run." },
    ],
  },

  // ── LESSON 4 ───────────────────────────────────────────────────────────────
  {
    title: "04 // IOCs, TTPs, and the Pyramid of Pain",
    summary: "Why hunting for behaviour beats hunting for artefacts — the indicator hierarchy and David Bianco's Pyramid of Pain.",
    content: `
      <h2>Not all indicators are created equal</h2>
      <p>An <strong>Indicator of Compromise (IOC)</strong> is any observable evidence of a breach — a file hash, an IP, a domain, a registry key. Beginners hunt almost exclusively for IOCs because they're concrete and easy to search. The problem: the easy ones are the ones attackers change effortlessly.</p>

      <h3>The Pyramid of Pain</h3>
      <p>David Bianco's <strong>Pyramid of Pain</strong> ranks indicator types by how much <em>pain</em> it causes the adversary when you detect and block them. The higher up the pyramid, the harder it is for the attacker to adapt — and the more valuable your detection.</p>
      <table>
        <thead><tr><th>Level (bottom → top)</th><th>Indicator</th><th>Pain to attacker</th></tr></thead>
        <tbody>
          <tr><td>1</td><td>Hash values (MD5/SHA)</td><td><strong>Trivial</strong> — recompile or flip a byte and the hash changes.</td></tr>
          <tr><td>2</td><td>IP addresses</td><td><strong>Easy</strong> — rotate to a new proxy/VPS in seconds.</td></tr>
          <tr><td>3</td><td>Domain names</td><td><strong>Simple</strong> — register a new domain, though it costs a little time/money.</td></tr>
          <tr><td>4</td><td>Network / host artefacts</td><td><strong>Annoying</strong> — user-agents, file paths, named pipes; the attacker must retool.</td></tr>
          <tr><td>5</td><td>Tools</td><td><strong>Challenging</strong> — forces them to find or build new tooling.</td></tr>
          <tr><td>6</td><td><strong>TTPs</strong> (behaviour)</td><td><strong>Tough!</strong> — to evade this they must change how they operate.</td></tr>
        </tbody>
      </table>

      <h3>Atomic, computed, and behavioural indicators</h3>
      <ul>
        <li><strong>Atomic</strong> — indivisible facts: an IP, a domain, an email address.</li>
        <li><strong>Computed</strong> — derived from data: a file hash, a regex match.</li>
        <li><strong>Behavioural (TTPs)</strong> — patterns of activity: "PowerShell spawned by Word, then a network connection." This is the top of the pyramid.</li>
      </ul>

      <h3>What is a TTP?</h3>
      <p><strong>TTP</strong> = <strong>Tactics, Techniques, and Procedures</strong> — the <em>how</em> of an adversary's operations. Tactics are goals (persistence), techniques are methods (scheduled task), procedures are the specific implementation a group habitually uses. Because a TTP describes behaviour rather than an artefact, forcing the attacker to abandon one is genuinely costly — that's the "pain."</p>

      <h3>Why this reframes hunting</h3>
      <p>Blocking a hash stops <em>one file</em>. Detecting the behaviour "Office application spawns a scripting engine that makes an outbound connection" stops an entire <em>class</em> of intrusion regardless of which file, IP, or domain is used this week. Mature hunting deliberately aims high on the pyramid: hunt the behaviour, not just the artefact.</p>

      <blockquote>The lesson the course course object hints at: an IP is the most mutable indicator — changed in seconds via a proxy — while tactics and behaviours are the hardest to re-engineer. Spend your effort where it hurts the adversary most.</blockquote>
    `,
    quizzes: [
      { id: "th-l4-q1", question: "What is an Indicator of Compromise (IOC)?", options: ["A firewall brand", "Observable evidence of a breach, such as a hash, IP, or domain", "A type of encryption key", "A SIEM dashboard"], correctAnswerIndex: 1, explanation: "An IOC is any observable artefact — hash, IP, domain, registry key — that evidences a compromise." },
      { id: "th-l4-q2", question: "In the Pyramid of Pain, which indicator is easiest for an attacker to change?", options: ["TTPs / behaviour", "Tools", "Hash values and IP addresses", "Host artefacts"], correctAnswerIndex: 2, explanation: "Hashes change by recompiling; IPs change by switching proxies — both are at the bottom, causing least pain." },
      { id: "th-l4-q3", question: "Which indicator type sits at the TOP of the Pyramid of Pain?", options: ["IP addresses", "Domain names", "TTPs (behaviours)", "File hashes"], correctAnswerIndex: 2, explanation: "TTPs are hardest to change — evading them forces the adversary to alter how they operate." },
      { id: "th-l4-q4", question: "What does 'TTP' stand for?", options: ["Threat Tracking Protocol", "Tactics, Techniques, and Procedures", "Time To Patch", "Trusted Transport Path"], correctAnswerIndex: 1, explanation: "TTP = Tactics, Techniques, and Procedures — the behavioural 'how' of an adversary." },
      { id: "th-l4-q5", question: "A file hash is an example of which indicator category?", options: ["Atomic", "Computed", "Behavioural", "Physical"], correctAnswerIndex: 1, explanation: "A hash is computed/derived from data, unlike atomic facts (IP, domain) or behavioural patterns." },
      { id: "th-l4-q6", question: "Why does detecting a TTP stop more attacks than blocking a hash?", options: ["Hashes are illegal to block", "A behaviour catches an entire class of intrusion regardless of the specific file/IP used", "TTPs are easier to compute", "Hashes never change"], correctAnswerIndex: 1, explanation: "Behavioural detection generalises across artefacts, so it survives the attacker swapping files, IPs, or domains." },
      { id: "th-l4-q7", question: "'PowerShell spawned by Word, followed by an outbound connection' is best classified as what?", options: ["An atomic indicator", "A computed indicator", "A behavioural indicator (TTP)", "A domain name"], correctAnswerIndex: 2, explanation: "It describes a pattern of activity — a behaviour — placing it at the top of the pyramid." },
      { id: "th-l4-q8", question: "What is the core strategic message of the Pyramid of Pain?", options: ["Only block hashes because they're precise", "Aim detections higher on the pyramid to cause the adversary the most pain", "IP blocking is the best defence", "All indicators are equally valuable"], correctAnswerIndex: 1, explanation: "Focusing on higher-pyramid indicators (tools, TTPs) makes it far costlier for adversaries to adapt." },
    ],
  },

  // ── LESSON 5 ───────────────────────────────────────────────────────────────
  {
    title: "05 // ATT&CK-Driven Hunts",
    summary: "Using the MITRE ATT&CK matrix as a hunting map — turning a technique into a concrete, data-backed hunt with real queries.",
    content: `
      <h2>ATT&CK as the hunter's map</h2>
      <p><strong>MITRE ATT&CK</strong> is a free, globally-used knowledge base of real adversary behaviour, organised as <strong>tactics</strong> (the goal — the "why") containing <strong>techniques</strong> (the method — the "how"), each with an ID like <code>T1071</code>. For a hunter it is a map of where to look and a shared vocabulary for describing what you find.</p>

      <h3>Tactics, techniques, sub-techniques</h3>
      <ul>
        <li><strong>Tactic</strong> — an objective, e.g. <em>Command and Control</em>. These are the matrix columns.</li>
        <li><strong>Technique</strong> — a way to achieve it, e.g. <em>T1071 Application Layer Protocol</em>.</li>
        <li><strong>Sub-technique</strong> — a refinement, e.g. <em>T1071.001 Web Protocols</em> or <em>T1071.004 DNS</em>.</li>
      </ul>

      <h3>From technique to hunt in four moves</h3>
      <ol>
        <li><strong>Pick a technique</strong> — ideally one where your detection coverage is weak (a matrix gap).</li>
        <li><strong>Read the procedure examples</strong> — ATT&CK lists how real groups implement it, which tells you what to look for.</li>
        <li><strong>Map data sources</strong> — ATT&CK names the telemetry each technique touches (process creation, network traffic, DNS, etc.). No data → visibility gap.</li>
        <li><strong>Write the analytic</strong> — express the behaviour as a query against that data.</li>
      </ol>

      <h3>Worked example: hunting T1053.005 (Scheduled Task persistence)</h3>
      <p>Hypothesis: an adversary created a scheduled task for persistence. On Windows, task creation is logged (Security event <code>4698</code>) and via Sysmon process creation. A pseudo-query:</p>
      <pre><code>-- Suspicious scheduled task creation via command line
process.name == "schtasks.exe"
  AND process.command_line CONTAINS "/create"
  AND (
        parent.name IN ("winword.exe","excel.exe","powershell.exe")
     OR process.command_line MATCHES /(AppData|Temp|\\\\Users\\\\Public)/
  )
| stats count BY host, user, process.command_line
| sort count asc   -- rare command lines float to the top</code></pre>
      <p>The logic mirrors the technique: <em>who</em> is creating tasks, <em>from what parent</em>, pointing at <em>what path</em>. Legitimate admin tasks form a big, boring cluster; the attacker's task is a rare outlier.</p>

      <h3>Coverage mapping and ATT&CK Navigator</h3>
      <p>Plotting which techniques you can and can't detect on the matrix — often with the free <strong>ATT&CK Navigator</strong> — turns a wall of techniques into a prioritised backlog. Red cells (no coverage) that overlap with techniques your relevant threat actors actually use are your highest-value hunts. This is <strong>threat-informed defence</strong>: hunt what will really be used against you, not what's easiest.</p>

      <blockquote>ATT&CK gives structure to everything else in this course: hypotheses reference techniques (Lesson 3), findings are reported in technique IDs (Lesson 9), and coverage gaps become the next hypotheses. It's the connective tissue of a hunting program.</blockquote>
    `,
    quizzes: [
      { id: "th-l5-q1", question: "How is MITRE ATT&CK organised?", options: ["Alphabetically by malware name", "As tactics (goals) containing techniques (methods), each with an ID", "By vendor product", "By severity color only"], correctAnswerIndex: 1, explanation: "ATT&CK groups techniques (the 'how') under tactics (the 'why'), each with an ID like T1071." },
      { id: "th-l5-q2", question: "In ATT&CK, what is a tactic?", options: ["A specific malware sample", "The adversary's objective, e.g. Command and Control", "A file hash", "A SIEM query language"], correctAnswerIndex: 1, explanation: "A tactic is the goal or 'why' — the columns of the matrix — such as Command and Control." },
      { id: "th-l5-q3", question: "When choosing a technique to hunt, which is the best candidate?", options: ["One you already have strong detection for", "One where your detection coverage is weak (a gap)", "One that no adversary ever uses", "Whichever has the lowest ID number"], correctAnswerIndex: 1, explanation: "Hunting techniques with weak coverage closes real blind spots rather than duplicating existing detections." },
      { id: "th-l5-q4", question: "Why does ATT&CK list 'data sources' for each technique?", options: ["To sell you products", "To tell you what telemetry the technique touches so you know where to look", "To increase log volume", "They are decorative"], correctAnswerIndex: 1, explanation: "Data sources map a technique to the telemetry needed to detect it; missing data reveals a visibility gap." },
      { id: "th-l5-q5", question: "In the scheduled-task hunt, why sort rare command lines to the top?", options: ["Rare command lines are always benign", "Legitimate admin tasks cluster into common patterns; the attacker's task is a rare outlier", "Sorting is required by Windows", "It reduces disk usage"], correctAnswerIndex: 1, explanation: "Normal activity forms large clusters; malicious activity often appears as the statistically rare long tail." },
      { id: "th-l5-q6", question: "What is the ATT&CK Navigator used for?", options: ["Encrypting logs", "Visualising and prioritising detection coverage across the matrix", "Blocking IP addresses", "Compiling malware"], correctAnswerIndex: 1, explanation: "Navigator lets teams map coverage onto the matrix, turning gaps into a prioritised hunt backlog." },
      { id: "th-l5-q7", question: "What does 'threat-informed defence' mean for hunt prioritisation?", options: ["Hunt whatever is easiest", "Prioritise techniques your relevant adversaries actually use", "Only hunt at night", "Ignore ATT&CK entirely"], correctAnswerIndex: 1, explanation: "Threat-informed defence focuses effort on the techniques real, relevant threat actors employ." },
      { id: "th-l5-q8", question: "What is a sub-technique?", options: ["A refinement of a technique, e.g. T1071.004 (DNS)", "A separate tactic", "A type of firewall rule", "An IOC hash"], correctAnswerIndex: 0, explanation: "Sub-techniques (e.g. T1071.004) refine a parent technique into a more specific method." },
    ],
  },

  // ── LESSON 6 ───────────────────────────────────────────────────────────────
  {
    title: "06 // Data Sources & Telemetry",
    summary: "The raw material of hunting — EDR, endpoint logs, network, DNS, and proxy data — plus what each sees and, crucially, cannot see.",
    content: `
      <h2>You can only hunt what you collect</h2>
      <p>A hunt is only as good as the telemetry behind it. Choosing the right data source for a hypothesis — and knowing its blind spots — is a core hunter skill. There is no single omniscient log; you triangulate across several.</p>

      <h3>The major telemetry families</h3>
      <table>
        <thead><tr><th>Source</th><th>What it sees best</th><th>Blind spot</th></tr></thead>
        <tbody>
          <tr><td><strong>EDR</strong> (Endpoint Detection &amp; Response)</td><td>Process creation, command lines, parent/child trees, file &amp; registry changes, injected code.</td><td>Only on hosts with the agent installed; attacker with kernel access can blind it.</td></tr>
          <tr><td><strong>Endpoint / OS logs</strong> (Sysmon, Windows Event Log, auditd)</td><td>Logons, task/service creation, PowerShell script blocks, authentication.</td><td>Requires proper audit policy; logs can be cleared by an attacker.</td></tr>
          <tr><td><strong>Network flow / firewall</strong> (NetFlow, Zeek)</td><td>Who talked to whom, volume, ports, connection timing (great for beaconing).</td><td>Encrypted payloads are opaque; you see metadata, not content.</td></tr>
          <tr><td><strong>DNS logs</strong></td><td>Domain lookups — often the first observable of C2 and exfil.</td><td>Encrypted DNS (DoH/DoT) can bypass your resolver entirely.</td></tr>
          <tr><td><strong>Proxy / web logs</strong></td><td>URLs, user-agents, HTTP methods, bytes in/out.</td><td>Direct-to-IP or non-proxied traffic slips past.</td></tr>
        </tbody>
      </table>

      <h3>Sysmon: the hunter's best friend on Windows</h3>
      <p><strong>Sysmon</strong> (System Monitor) is a free Sysinternals tool that dramatically enriches Windows logging: process creation with full command line and hashes (Event ID 1), network connections (ID 3), image loads (ID 7), and more. Much endpoint hunting assumes Sysmon-grade visibility, because default Windows logs are too sparse.</p>

      <h3>Matching data to hypothesis</h3>
      <ul>
        <li>Hunting <strong>C2 beaconing</strong>? → network flow + proxy + DNS (timing and destinations).</li>
        <li>Hunting <strong>living-off-the-land / process abuse</strong>? → EDR + Sysmon process creation and parent/child trees.</li>
        <li>Hunting <strong>persistence</strong>? → endpoint logs for services, scheduled tasks, run keys.</li>
        <li>Hunting <strong>DNS tunnelling / exfil</strong>? → DNS logs (query length, entropy, volume).</li>
      </ul>

      <h3>Retention and the silent blind spot</h3>
      <p>The subtlest data problem isn't format — it's <strong>retention</strong>. Adversary dwell time is often measured in months; if you keep DNS logs for only seven days, a hunt for slow beaconing is doomed before it starts. And <strong>encrypted traffic</strong> means you analyse metadata (who/when/how much), never contents — the same honest limit SOC analysts face with SSH. Knowing what your data can't tell you keeps your conclusions defensible.</p>

      <blockquote>Before writing a single query, ask three questions: Do I collect this data? Does it retain far enough back? And what can it NOT see? A hunt built on a false assumption about your telemetry produces a false 'all clear.'</blockquote>
    `,
    quizzes: [
      { id: "th-l6-q1", question: "What does EDR primarily provide visibility into?", options: ["Only email content", "Endpoint activity: processes, command lines, parent/child trees, file and registry changes", "Only network packet payloads", "Physical door access"], correctAnswerIndex: 1, explanation: "EDR (Endpoint Detection & Response) captures rich host-level process and system activity." },
      { id: "th-l6-q2", question: "What is Sysmon?", options: ["A firewall appliance", "A free Sysinternals tool that greatly enriches Windows endpoint logging", "A DNS server", "A cloud SIEM"], correctAnswerIndex: 1, explanation: "Sysmon adds detailed process, network, and image-load logging beyond sparse default Windows logs." },
      { id: "th-l6-q3", question: "Which data source is best for detecting C2 beaconing timing?", options: ["Physical badge logs", "Network flow, proxy, and DNS logs", "Printer logs", "BIOS logs"], correctAnswerIndex: 1, explanation: "Beaconing is about regular connections to destinations over time — network flow, proxy, and DNS reveal it." },
      { id: "th-l6-q4", question: "What is the main blind spot of network flow logs?", options: ["They cannot record timestamps", "Encrypted payloads are opaque — you see metadata, not content", "They only work on weekends", "They delete themselves hourly"], correctAnswerIndex: 1, explanation: "Flow/firewall data shows who talked to whom and how much, but encrypted contents remain hidden." },
      { id: "th-l6-q5", question: "How can encrypted DNS (DoH/DoT) undermine a hunt?", options: ["It makes DNS faster only", "It can bypass your internal resolver, so those lookups never appear in your DNS logs", "It encrypts your firewall", "It has no effect on hunting"], correctAnswerIndex: 1, explanation: "DNS-over-HTTPS/TLS can route around your resolver, removing visibility into those queries." },
      { id: "th-l6-q6", question: "Why is log retention a critical hunting concern?", options: ["Long retention wastes money for no reason", "Adversary dwell time spans months, so short retention makes slow-attack hunts impossible", "Retention only matters for backups", "Retention affects only alert speed"], correctAnswerIndex: 1, explanation: "If data isn't kept far enough back, a hunt for slow, long-dwell activity has no data to examine." },
      { id: "th-l6-q7", question: "You want to hunt process-injection and living-off-the-land abuse. Best source?", options: ["Proxy logs only", "EDR / Sysmon process creation and parent/child trees", "DNS logs only", "Firewall deny logs only"], correctAnswerIndex: 1, explanation: "Process abuse is visible in endpoint telemetry showing process lineage and command lines." },
      { id: "th-l6-q8", question: "What three questions should you ask about telemetry before querying?", options: ["Color, size, and font of the logs", "Do I collect it, does it retain far enough back, and what can it NOT see?", "Who wrote it, when, and why", "Is it encrypted, compressed, and zipped"], correctAnswerIndex: 1, explanation: "Confirming collection, retention, and blind spots prevents a false 'all clear' built on missing data." },
    ],
  },

  // ── LESSON 7 ───────────────────────────────────────────────────────────────
  {
    title: "07 // Baselining Normal vs Anomalous",
    summary: "You cannot spot the abnormal without defining the normal — building environment baselines and reasoning about rarity honestly.",
    content: `
      <h2>The prerequisite skill nobody teaches</h2>
      <p>Every anomaly-driven hunt rests on a hidden foundation: a <strong>baseline</strong> of what normal looks like for <em>this specific environment</em>. Without it, "unusual" is meaningless — and the classic trap is assuming rare equals malicious. It often doesn't.</p>

      <h3>What a baseline captures</h3>
      <ul>
        <li><strong>Normal processes</strong> — which executables run, from which paths, spawned by which parents.</li>
        <li><strong>Normal network</strong> — which hosts talk to which destinations, on which ports, at what volumes.</li>
        <li><strong>Normal users</strong> — login times, source geographies, which systems each role touches.</li>
        <li><strong>Normal admin activity</strong> — the legitimate PowerShell, PsExec, and scheduled-task usage that would otherwise look scary.</li>
      </ul>

      <h3>Rare ≠ malicious (and common ≠ safe)</h3>
      <p>A rarely-seen process might be a quarterly finance batch job. A very common process might be malware that's already everywhere. Rarity is a <em>lead</em>, not a <em>verdict</em>. The hunter's job is to explain the rare thing: benign-and-explained, benign-and-noisy (tune it), or malicious (escalate).</p>

      <h3>Long-tail analysis</h3>
      <p>Plot the frequency of any attribute — command lines, DNS domains, user-agents — and you get a distribution with a fat head (common, usually benign) and a <strong>long tail</strong> of things seen only once or twice. Adversary activity frequently hides in that long tail precisely because it's unique to the intrusion. "Sort ascending by count and investigate the bottom" is one of hunting's most productive habits.</p>

      <pre><code>-- Long-tail hunt over outbound web destinations
index=proxy
| stats count BY dest_domain, user_agent
| sort count asc      -- the rarest combinations rise to the top
| head 50             -- investigate the long tail first</code></pre>

      <h3>Building and maintaining baselines</h3>
      <p>Baselines are built by observing a known-good period and can be as simple as an allowlist of expected values or as rich as statistical profiles per host/user. Crucially they <strong>decay</strong> — environments change as software is deployed and roles shift. A stale baseline generates false positives and erodes trust. Baselining is a maintained practice, not a one-time snapshot.</p>

      <h3>Anomaly types worth hunting</h3>
      <ul>
        <li><strong>Volumetric</strong> — a host suddenly sending far more data than usual (possible exfil).</li>
        <li><strong>Temporal</strong> — activity at 3am from a 9–5 user, or perfectly regular intervals (beaconing).</li>
        <li><strong>Relational</strong> — a parent/child process pair that should never occur (Word → cmd.exe).</li>
        <li><strong>Novel</strong> — a first-ever-seen binary, domain, or service on a host.</li>
      </ul>

      <blockquote>Reframe: a hunter spends as much effort learning what's normal as chasing what's odd. The anomaly is only visible against the backdrop of a well-understood baseline — and the discipline to say "rare, but explained and benign."</blockquote>
    `,
    quizzes: [
      { id: "th-l7-q1", question: "Why is a baseline essential for anomaly hunting?", options: ["It speeds up the SIEM", "You cannot identify the abnormal without knowing what normal looks like for the environment", "It replaces the need for data sources", "It encrypts the logs"], correctAnswerIndex: 1, explanation: "Anomalies are only meaningful relative to an established baseline of normal activity." },
      { id: "th-l7-q2", question: "Which statement is correct about rarity?", options: ["Rare always means malicious", "Rare is a lead to investigate, not an automatic verdict", "Common activity is always safe", "Rarity is irrelevant to hunting"], correctAnswerIndex: 1, explanation: "Rare activity is a lead; it may be benign (e.g. a quarterly job). Rarity must be explained, not assumed malicious." },
      { id: "th-l7-q3", question: "What is long-tail analysis?", options: ["Analysing the longest log line", "Examining the rarely-seen values (the long tail of a frequency distribution) where intrusions often hide", "Measuring network latency", "Sorting logs alphabetically"], correctAnswerIndex: 1, explanation: "Adversary activity often appears among the rarest values; sorting ascending by count surfaces the long tail." },
      { id: "th-l7-q4", question: "Why do baselines decay over time?", options: ["Logs get deleted", "Environments change as software is deployed and roles shift, so 'normal' moves", "The SIEM forgets them", "Attackers edit them"], correctAnswerIndex: 1, explanation: "Because normal itself changes, a stale baseline produces false positives and must be maintained." },
      { id: "th-l7-q5", question: "A 9-to-5 user's account authenticating at 3am is which type of anomaly?", options: ["Volumetric", "Temporal", "Relational", "Novel"], correctAnswerIndex: 1, explanation: "Off-hours activity relative to a user's normal schedule is a temporal anomaly." },
      { id: "th-l7-q6", question: "A parent/child pair like winword.exe spawning cmd.exe is which anomaly type?", options: ["Volumetric", "Temporal", "Relational", "Retention-based"], correctAnswerIndex: 2, explanation: "An improbable process-lineage relationship is a relational anomaly, a strong hunting signal." },
      { id: "th-l7-q7", question: "A host suddenly uploading far more data than its baseline suggests what?", options: ["A temporal anomaly only", "A volumetric anomaly, potentially data exfiltration", "A novel binary", "Nothing worth noting"], correctAnswerIndex: 1, explanation: "A large deviation in data volume is a volumetric anomaly and a classic exfiltration indicator." },
      { id: "th-l7-q8", question: "What is the disciplined outcome when a rare item turns out benign but noisy?", options: ["Escalate it to IR anyway", "Tune it so it stops generating noise, and document why it's benign", "Delete all logs", "Ignore baselines entirely"], correctAnswerIndex: 1, explanation: "Benign-but-noisy findings should be tuned and documented, reducing future false positives." },
    ],
  },

  // ── LESSON 8 ───────────────────────────────────────────────────────────────
  {
    title: "08 // Hunting Techniques: Stacking, Clustering & Grouping",
    summary: "The three workhorse analytic techniques that turn oceans of telemetry into a short list of leads worth a human's attention.",
    content: `
      <h2>Three techniques that do most of the work</h2>
      <p>You've got a hypothesis, the right data, and a baseline. Now you need methods to actually surface leads from millions of events. Three techniques recur constantly in real hunting; master these and you can attack almost any dataset.</p>

      <h3>1. Stacking (frequency analysis)</h3>
      <p><strong>Stack counting</strong> tallies how often each unique value of an attribute occurs, then sorts by frequency. It's the engine behind long-tail analysis. Stack the command lines of a process, the parent processes of PowerShell, the user-agents hitting a domain — anything with a bounded set of values.</p>
      <pre><code>-- Stack the parent processes that spawn powershell.exe
index=sysmon EventID=1 process="powershell.exe"
| stats count BY parent_process
| sort count asc     -- explorer.exe is huge & boring; the rare parent is the lead</code></pre>
      <p>The power move is sorting <em>ascending</em>: the enormous benign clusters sink, and the one-off oddities (the attacker's parent process) float to the top.</p>

      <h3>2. Clustering</h3>
      <p><strong>Clustering</strong> groups events that are <em>similar</em> along one or more dimensions so patterns emerge. Cluster outbound connections by destination + timing to reveal <strong>beaconing</strong> — malware calling home at regular intervals looks like a tight cluster of near-identical, evenly-spaced connections that no human browsing would produce. Clustering is how you find the signal hiding in "normal-looking" volume.</p>

      <h3>3. Grouping</h3>
      <p><strong>Grouping</strong> takes a set of already-interesting items and finds when they appear <em>together</em>. If you have several suspicious indicators (a rare process, an odd domain, a new service) and they repeatedly co-occur on the same hosts within the same window, that co-occurrence is far more significant than any one alone. Grouping is how scattered weak signals combine into a strong one.</p>

      <h3>Choosing the right technique</h3>
      <table>
        <thead><tr><th>You want to…</th><th>Use</th></tr></thead>
        <tbody>
          <tr><td>Find the rare value in a big pile (outliers)</td><td><strong>Stacking</strong></td></tr>
          <tr><td>Reveal a pattern in similar events (e.g. beaconing)</td><td><strong>Clustering</strong></td></tr>
          <tr><td>See which known-suspicious items occur together</td><td><strong>Grouping</strong></td></tr>
        </tbody>
      </table>

      <h3>Enrichment feeds the analysis (preview)</h3>
      <p>These techniques get sharper when each event carries context — GeoIP, ASN, domain age, threat-intel reputation. Stacking domains is useful; stacking domains <em>annotated with "registered 3 days ago"</em> is lethal. That enrichment step is the focus of the next lesson.</p>

      <blockquote>Rule of thumb: <strong>stack to find outliers, cluster to find patterns, group to find correlations.</strong> Most real hunts chain all three — stack to shortlist, cluster to characterise, group to confirm.</blockquote>
    `,
    quizzes: [
      { id: "th-l8-q1", question: "What does stack counting (frequency analysis) do?", options: ["Encrypts events", "Tallies how often each unique value occurs and sorts by frequency", "Deletes duplicate logs", "Blocks IP addresses"], correctAnswerIndex: 1, explanation: "Stacking counts occurrences of each unique value, exposing common clusters and rare outliers." },
      { id: "th-l8-q2", question: "When stacking to find an attacker's outlier, why sort ascending?", options: ["It looks nicer", "The huge benign clusters sink and the rare, suspicious values rise to the top", "Ascending sort is faster", "It is required by the query language"], correctAnswerIndex: 1, explanation: "Sorting ascending surfaces the low-count long tail where unique adversary activity often hides." },
      { id: "th-l8-q3", question: "Which technique is best for detecting C2 beaconing?", options: ["Grouping", "Clustering events by destination and timing", "Stacking usernames alphabetically", "Deleting flow logs"], correctAnswerIndex: 1, explanation: "Beaconing appears as a tight cluster of near-identical, evenly-spaced connections revealed by clustering." },
      { id: "th-l8-q4", question: "What does grouping accomplish?", options: ["It finds when several already-suspicious items co-occur on the same hosts/time", "It encrypts related events", "It sorts logs by size", "It removes all benign data"], correctAnswerIndex: 0, explanation: "Grouping surfaces co-occurrence of suspicious items, turning scattered weak signals into a strong one." },
      { id: "th-l8-q5", question: "You have millions of process command lines and want the rare outliers. Which technique?", options: ["Grouping", "Clustering", "Stacking", "Encryption"], correctAnswerIndex: 2, explanation: "Stacking (frequency analysis) is purpose-built to surface rare outliers in a large set of values." },
      { id: "th-l8-q6", question: "Why is beaconing hard to see without clustering?", options: ["It is always encrypted end to end", "Individually the connections look ordinary; only their regular, similar pattern reveals them", "It never touches the network", "Beacons delete themselves"], correctAnswerIndex: 1, explanation: "Each beacon looks benign in isolation; clustering exposes the machine-like regularity across many events." },
      { id: "th-l8-q7", question: "How does enrichment strengthen these techniques?", options: ["It slows the SIEM down usefully", "Adding context (domain age, reputation, GeoIP) makes outliers and clusters far more meaningful", "It removes the need to stack", "It has no effect"], correctAnswerIndex: 1, explanation: "Context turns a bare value into an interpretable one — e.g. a rare domain that is also newly registered." },
      { id: "th-l8-q8", question: "What is the rule-of-thumb mapping of technique to goal?", options: ["Stack for patterns, cluster for outliers, group for encryption", "Stack for outliers, cluster for patterns, group for correlations", "All three do the same thing", "Group first, never stack"], correctAnswerIndex: 1, explanation: "Stack to find outliers, cluster to find patterns, group to find correlations — often chained together." },
    ],
  },

  // ── LESSON 9 ───────────────────────────────────────────────────────────────
  {
    title: "09 // Enrichment, Threat Intel & Documenting Hunts",
    summary: "Adding context that makes a verdict obvious, using threat intelligence responsibly, and writing hunts up so they're repeatable and defensible.",
    content: `
      <h2>Context turns data into decisions</h2>
      <p>A bare indicator — an IP, a domain, a hash — is rarely a verdict on its own. <strong>Enrichment</strong> attaches context so the meaning becomes clear, and <strong>documentation</strong> ensures the work survives beyond the analyst who did it. This lesson covers both halves of making a hunt <em>count</em>.</p>

      <h3>Enrichment sources</h3>
      <ul>
        <li><strong>GeoIP &amp; ASN</strong> — where an IP is and which network owns it (residential ISP vs bulletproof host tells different stories).</li>
        <li><strong>WHOIS / domain age</strong> — a domain registered three days ago is far more suspicious than one ten years old.</li>
        <li><strong>Reputation feeds</strong> — AbuseIPDB, VirusTotal, Spamhaus, and internal blocklists: has this artefact been seen bad before?</li>
        <li><strong>Asset &amp; identity context</strong> — is the host a domain controller or a test box? Is the user an admin or an intern?</li>
      </ul>

      <h3>Using threat intelligence well</h3>
      <p><strong>Cyber Threat Intelligence (CTI)</strong> is processed knowledge about adversaries — their infrastructure, tools, and TTPs. It seeds hypotheses ("group X uses technique Y — are we seeing it?") and enriches findings ("this hash matches a known loader"). Two cautions define mature use:</p>
      <ul>
        <li><strong>IOCs age fast.</strong> A malicious IP from a six-month-old report may now be a coffee shop's Wi-Fi. Treat low-pyramid indicators as perishable leads, not permanent truth.</li>
        <li><strong>Prefer behaviour over artefacts.</strong> The durable value of intel is the TTPs it describes (top of the Pyramid of Pain), not the swappable hashes and IPs.</li>
      </ul>
      <p>Frameworks help structure intel: the <strong>Diamond Model</strong> (adversary, capability, infrastructure, victim) and ATT&CK give you a consistent way to describe and pivot on what you learn.</p>

      <h3>Documenting a hunt</h3>
      <p>An undocumented hunt is an unrepeatable one — and worse, a hunt whose <em>negative</em> result nobody can trust later. A solid hunt write-up records:</p>
      <ol>
        <li><strong>Hypothesis</strong> — the question, with its ATT&CK reference.</li>
        <li><strong>Scope</strong> — data sources, hosts, and time window examined.</li>
        <li><strong>Method</strong> — the actual queries and techniques used (so it can be re-run).</li>
        <li><strong>Findings</strong> — confirmed / rejected / inconclusive, with the evidence.</li>
        <li><strong>Outcome &amp; actions</strong> — escalations, new detections, tuning, and coverage gaps discovered.</li>
      </ol>

      <h3>Turning findings into detections</h3>
      <p>The highest-value output of a hunt is a <strong>durable detection</strong>. The community-standard, vendor-neutral format for writing detection logic is <strong>Sigma</strong> — a YAML rule that tools convert into Splunk, Elastic, Sentinel, or other backend queries. Codifying a confirmed hunt as a Sigma rule means the behaviour is now caught automatically forever; you never hunt it by hand again.</p>
      <pre><code>title: Office App Spawning PowerShell
logsource:
  product: windows
  category: process_creation
detection:
  selection:
    ParentImage|endswith:
      - '\\winword.exe'
      - '\\excel.exe'
    Image|endswith: '\\powershell.exe'
  condition: selection
level: high
tags:
  - attack.execution
  - attack.t1059.001</code></pre>

      <blockquote>The lifecycle to internalise: a good hunt doesn't end at "found it." It ends when the finding is enriched, documented, and converted into an automated detection — closing the loop from Lesson 2 and permanently upgrading the SOC.</blockquote>
    `,
    quizzes: [
      { id: "th-l9-q1", question: "What is enrichment in the hunting context?", options: ["Deleting old logs", "Attaching context (GeoIP, domain age, reputation, asset role) to make an indicator's meaning clear", "Encrypting the SIEM", "Increasing CPU speed"], correctAnswerIndex: 1, explanation: "Enrichment adds context so a bare indicator becomes an interpretable, decision-ready signal." },
      { id: "th-l9-q2", question: "Why is a newly-registered domain more suspicious than an old one?", options: ["Old domains are always malicious", "Fresh domains are frequently spun up for attacks; age is a useful risk signal", "Domain age has no meaning", "New domains cost more"], correctAnswerIndex: 1, explanation: "Adversaries often use freshly-registered domains; WHOIS/domain age is a valuable enrichment signal." },
      { id: "th-l9-q3", question: "What is Cyber Threat Intelligence (CTI)?", options: ["A firewall product", "Processed knowledge about adversaries — their infrastructure, tools, and TTPs", "A type of log format", "A password manager"], correctAnswerIndex: 1, explanation: "CTI is analysed knowledge of adversaries that seeds hypotheses and enriches findings." },
      { id: "th-l9-q4", question: "Why should low-pyramid IOCs (IPs, hashes) from old intel be treated cautiously?", options: ["They never change", "They age fast — a once-malicious IP may now be benign", "They are always still malicious", "They cannot be searched"], correctAnswerIndex: 1, explanation: "Atomic/computed indicators are perishable; stale IOCs produce false positives and should be treated as perishable leads." },
      { id: "th-l9-q5", question: "What is the durable value of threat intelligence, per the Pyramid of Pain?", options: ["The list of IPs to block forever", "The behaviours/TTPs it describes, which are hard for adversaries to change", "The file hashes", "The report's formatting"], correctAnswerIndex: 1, explanation: "TTPs sit atop the pyramid; behaviour-focused intel outlasts swappable artefacts." },
      { id: "th-l9-q6", question: "Which is NOT a component a good hunt write-up should record?", options: ["The hypothesis and its ATT&CK reference", "The queries and methods used", "The analyst's lunch order", "Findings and resulting actions/gaps"], correctAnswerIndex: 2, explanation: "A write-up records hypothesis, scope, method, findings, and outcomes so the hunt is repeatable and trustworthy." },
      { id: "th-l9-q7", question: "What is Sigma?", options: ["A malware family", "A vendor-neutral, YAML-based format for writing detection rules that convert to many SIEM backends", "A DNS protocol", "A brand of EDR"], correctAnswerIndex: 1, explanation: "Sigma is the community-standard generic detection format, translatable to Splunk, Elastic, Sentinel, etc." },
      { id: "th-l9-q8", question: "What is the highest-value output of a successful hunt?", options: ["A longer log retention bill", "A durable, automated detection (e.g. a Sigma rule) so the behaviour is caught forever", "A screenshot", "A one-time manual block"], correctAnswerIndex: 1, explanation: "Codifying a finding as an automated detection closes the loop and means you never hunt it manually again." },
    ],
  },

  // ── LESSON 10 ──────────────────────────────────────────────────────────────
  {
    title: "10 // Running a Full Hunt: Beaconing C2 End-to-End",
    summary: "A capstone that chains every skill — hypothesis, data, baseline, techniques, enrichment, and detection — to hunt command-and-control, plus how programs mature.",
    content: `
      <h2>Putting it all together</h2>
      <p>This capstone walks a complete, realistic hunt for <strong>command-and-control (C2) beaconing</strong> — a behaviour the ARCH-X threat-hunter track emphasises. It exercises every stage of the loop and every technique from earlier lessons.</p>

      <h3>What beaconing is</h3>
      <p>After gaining a foothold, malware "phones home" to a C2 server for instructions. To stay reliable it does so on a schedule — every 60 seconds, every hour — often with small <strong>jitter</strong> (random timing wobble) to look less robotic. That machine-like regularity, mapped in ATT&CK as <strong>T1071 Application Layer Protocol</strong>, is exactly what humans don't produce and what a hunter can find.</p>

      <h3>Stage 1 — Hypothesis</h3>
      <blockquote>"A compromised internal host is beaconing to an external C2 server over HTTPS at regular intervals (T1071.001). I can detect it by looking for repetitive, evenly-timed outbound connections to rare destinations in proxy and network-flow logs."</blockquote>

      <h3>Stage 2 — Data &amp; scope</h3>
      <p>Sources: proxy logs (URLs, bytes, user-agent), network flow (timing, volume), and DNS (destination domains). Scope: all workstations, last 30 days — long enough to catch slow beacons, which demands the retention discussed in Lesson 6.</p>

      <h3>Stage 3 — Analysis (stack → cluster → group)</h3>
      <ol>
        <li><strong>Stack</strong> destination domains by connection count, sorted ascending — rare destinations rise to the top (long-tail analysis).</li>
        <li><strong>Cluster</strong> connections per source→destination pair by timing. Compute the interval between connections; a low variance (very regular spacing) is the beaconing signature, even with jitter.</li>
        <li><strong>Group</strong> the surviving candidates with other signals — a be:aconing host that also ran a rare process and resolved a 2-day-old domain is a high-confidence lead.</li>
      </ol>
      <pre><code>-- Simplified beacon-timing hunt
index=proxy
| stats count, avg(delta_seconds) AS avg_int, stdev(delta_seconds) AS jitter
        BY src_ip, dest_domain
| where count > 50 AND jitter < 30      -- many hits, very regular timing
| sort jitter asc</code></pre>

      <h3>Stage 4 — Enrichment &amp; findings</h3>
      <p>Enrich the top candidates: domain age (newly registered?), ASN (bulletproof host?), reputation (on any blocklist?). Then reach a verdict against the baseline — is this a known software update-checker (benign, tune it) or an unexplained regular beacon (malicious, escalate to IR as an incident)?</p>

      <h3>Stage 5 — Feedback</h3>
      <p>Whatever the result: document the hunt (hypothesis, queries, verdict), and if malicious, write a Sigma detection for the timing/destination pattern so it's caught automatically next time. If benign, you've still produced a baseline of legitimate beacon-like traffic and possibly a tuning rule. The loop closes and the program improves.</p>

      <h3>How hunting programs mature</h3>
      <p>Teams progress along a <strong>Hunting Maturity Model (HMM)</strong>, roughly:</p>
      <table>
        <thead><tr><th>Level</th><th>Characteristic</th></tr></thead>
        <tbody>
          <tr><td>HMM0 — Initial</td><td>Relies entirely on automated alerts; no real hunting.</td></tr>
          <tr><td>HMM1 — Minimal</td><td>Incorporates threat-intel indicators; some searching.</td></tr>
          <tr><td>HMM2 — Procedural</td><td>Follows others' hunt procedures; consistent data collection.</td></tr>
          <tr><td>HMM3 — Innovative</td><td>Creates its own new hunting procedures and analytics.</td></tr>
          <tr><td>HMM4 — Leading</td><td>Automates the majority of successful hunts into detections.</td></tr>
        </tbody>
      </table>
      <p>Notice the destination: at the highest level, most hunts become automation. Hunting doesn't replace detection engineering — it <em>feeds</em> it. Every hunt you documented and converted to a Sigma rule pushed the whole program up this ladder.</p>

      <blockquote>The through-line of the entire course: a mature hunter assumes breach, forms a testable hypothesis grounded in ATT&CK, hunts behaviour over artefacts, reasons against a baseline, and closes every loop by turning findings into durable detections. That is proactive defence.</blockquote>
    `,
    quizzes: [
      { id: "th-l10-q1", question: "What is C2 beaconing?", options: ["A backup process", "Malware periodically contacting a command-and-control server on a schedule", "A DNS caching feature", "A user browsing the web normally"], correctAnswerIndex: 1, explanation: "Beaconing is compromised hosts regularly 'phoning home' to a C2 server for instructions." },
      { id: "th-l10-q2", question: "What is 'jitter' in the context of beaconing?", options: ["Network packet loss", "Random wobble added to timing so the beacon looks less robotic", "A type of encryption", "A firewall log field"], correctAnswerIndex: 1, explanation: "Jitter randomises beacon intervals slightly to evade simple fixed-interval detection." },
      { id: "th-l10-q3", question: "Which ATT&CK technique maps to C2 over an application-layer protocol?", options: ["T1053 Scheduled Task", "T1071 Application Layer Protocol", "T1110 Brute Force", "T1078 Valid Accounts"], correctAnswerIndex: 1, explanation: "T1071 Application Layer Protocol covers C2 communication over protocols like HTTPS or DNS." },
      { id: "th-l10-q4", question: "In the beacon hunt, why is low timing variance (low jitter/stdev) suspicious?", options: ["Humans browse with highly regular, machine-like timing", "Very regular intervals indicate automated beaconing rather than human activity", "Low variance means the log is corrupt", "It indicates a fast network"], correctAnswerIndex: 1, explanation: "Human traffic is irregular; tight, evenly-spaced intervals betray automated C2 beaconing." },
      { id: "th-l10-q5", question: "Why scope the beacon hunt to 30 days rather than 1 day?", options: ["To use more disk for its own sake", "Slow beacons need a long window to reveal their pattern, which requires sufficient retention", "Shorter windows are illegal", "One day is always enough"], correctAnswerIndex: 1, explanation: "Low-and-slow beacons only reveal regularity over long windows, requiring adequate log retention." },
      { id: "th-l10-q6", question: "In the capstone, in what order are the analytic techniques applied?", options: ["Group, then cluster, then stack", "Stack (find rare destinations) → cluster (find regular timing) → group (combine signals)", "Only stacking is used", "Clustering, then encryption"], correctAnswerIndex: 1, explanation: "The hunt stacks to shortlist rare destinations, clusters on timing, then groups with other signals." },
      { id: "th-l10-q7", question: "At the highest Hunting Maturity Model level (HMM4), what characterises the team?", options: ["It relies entirely on vendor alerts", "It automates the majority of its successful hunts into detections", "It never documents hunts", "It has stopped hunting"], correctAnswerIndex: 1, explanation: "HMM4 'Leading' teams convert most successful hunts into automated detections, feeding detection engineering." },
      { id: "th-l10-q8", question: "What is the course's through-line for a mature hunter?", options: ["Wait for alerts and block IPs", "Assume breach, hypothesise from ATT&CK, hunt behaviour over artefacts, reason against a baseline, and turn findings into durable detections", "Only collect more logs", "Focus solely on file hashes"], correctAnswerIndex: 1, explanation: "The discipline is proactive, hypothesis-driven, behaviour-focused hunting that closes the loop into automated detection." },
    ],
  },
];
