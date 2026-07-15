// ─────────────────────────────────────────────────────────────────────────────
// DEVSECOPS — DEEP GUIDEBOOK (textbook-grade course, ARCH-X platform)
//
// Content is authored as SEMANTIC HTML and rendered inside `.md-content`
// (see src/index.css) — h2/h3/p/ul/ol/li/pre/code/table/blockquote/strong are
// all styled there, so lessons render correctly without relying on Tailwind
// class scanning.
//
// Structure mirrors a real syllabus: Intro → Secure SDLC → Threat Modeling →
// SAST/DAST/IAST → SCA & Supply Chain → Secrets → IaC Scanning → Container
// Hardening → CI/CD Pipeline Security → Policy-as-Code & Gates. Each lesson
// ends with an 8-question knowledge check.
// ─────────────────────────────────────────────────────────────────────────────

import type { Course } from "../courses";

type Lesson = Course["lessons"][number];

// New optional Overview fields (spread into the devsecops course object).
export const META: Pick<
  Course,
  "prerequisites" | "learningOutcomes" | "mustKnow" | "commonGaps" | "prosCons" | "careerNotes"
> = {
  prerequisites: [
    "Comfort with Git basics: commit, branch, push, and the idea that history is permanent.",
    "A working mental model of a CI/CD pipeline — code is built, tested, and deployed automatically.",
    "Some exposure to the command line and reading YAML/JSON config files.",
    "No prior security experience required — every security concept is built up from zero.",
  ],
  learningOutcomes: [
    "Explain what 'shifting security left' means and why finding a bug in code is 100x cheaper than in production.",
    "Run a lightweight threat model on a feature using STRIDE and turn it into concrete requirements.",
    "Choose correctly between SAST, DAST, IAST, and SCA for a given problem — and know each one's blind spots.",
    "Trace a supply-chain risk from a transitive dependency to a build artifact and reason about SBOMs.",
    "Detect a committed secret, rotate it correctly, and stop the next one with a pre-commit gate.",
    "Scan Infrastructure-as-Code and container images, then wire a policy-as-code gate that blocks a risky deploy.",
  ],
  mustKnow: [
    "Shift Left", "Secure SDLC", "Threat Modeling", "STRIDE", "SAST", "DAST", "IAST",
    "SCA", "SBOM", "CVE / CVSS", "Transitive Dependency", "Dependency Confusion",
    "Secrets Scanning", "Entropy Detection", "Secret Rotation", "IaC Scanning",
    "Container Image Scanning", "Distroless", "CI/CD Pipeline", "Policy-as-Code",
    "OPA / Rego", "Security Gate", "T1195 Supply Chain Compromise", "SolarWinds",
  ],
  commonGaps: [
    "Rotation vs removal. Beginners scrub a secret from git history and think they're done — but a leaked key is compromised the instant it's pushed; only rotation actually secures it.",
    "Transitive dependencies. Most learners audit the libraries they imported directly and never realise that 80%+ of their code is dependencies-of-dependencies they never chose.",
    "False positives kill adoption. A scanner that cries wolf on every build gets disabled by developers. Tuning and triage matter more than raw detection count.",
    "Gates vs friction. Blocking every build on any finding stops shipping and breeds workarounds. Knowing what to fail vs warn on is a core, under-taught judgement call.",
    "SAST can't see runtime; DAST can't see code. Learners treat one tool as a silver bullet and miss whole vulnerability classes each tool is structurally blind to.",
    "Container image ≠ container runtime. Scanning an image at build proves nothing about drift, privileged flags, or secrets injected at deploy — the pipeline is only half the story.",
  ],
  prosCons: {
    pros: [
      "Automated pipeline security scales: one gate protects every commit from every developer, forever.",
      "Catching flaws at commit/build time is dramatically cheaper and faster than incident response in production.",
      "Skills map directly to high-demand roles — DevSecOps, Application Security, and Cloud Security engineering.",
    ],
    cons: [
      "Tools produce noise; without tuning and ownership, alert fatigue makes teams ignore or disable them.",
      "Security gates create friction with delivery teams — success depends on culture, not just tooling.",
      "Supply-chain and IaC coverage is never complete; new dependencies and misconfigurations appear faster than any scanner's rules.",
    ],
  },
  careerNotes:
    "DevSecOps sits at the intersection of software engineering, operations, and security, and it is one of the fastest-growing specialisations in the field. It is rarely a first job — most practitioners arrive from software development, DevOps/SRE, or a Tier-1/2 security background. It leads into Application Security Engineer, Cloud Security Engineer, Security Architect, and Platform Security roles. Certs that map to this material: CompTIA Security+ (foundations), the Certified DevSecOps Professional (CDP) from Practical DevSecOps, GIAC Cloud Security Automation (GCSA), and cloud-vendor security certs (AWS/Azure/GCP). The engineers who advance fastest are those who can write the automation AND talk developers into adopting it — the human 'Sec' between 'Dev' and 'Ops' is the hard part.",
};

export const LESSONS: Lesson[] = [
  // ── LESSON 1 ───────────────────────────────────────────────────────────────
  {
    title: "01 // Shifting Security Left: Why DevSecOps Exists",
    summary: "The economics of finding bugs early, the culture shift from gatekeeper security to shared ownership, and where security lives in a modern pipeline.",
    content: `
      <h2>Security used to be the last gate — and that was the problem</h2>
      <p>For decades, security was a checkpoint at the very end of software delivery: build the whole product, then hand it to a security team for a "pen test" the week before launch. When they found problems — and they always did — the team faced an ugly choice: delay the release, or ship known holes. Security became the department of "no," and developers learned to route around it.</p>

      <p><strong>DevSecOps</strong> is the response to that failure. The core idea is <strong>shifting security left</strong>: moving security activities <em>earlier</em> in the timeline — into design, coding, and the build pipeline — instead of bolting them on at the end. "Left" refers to the left side of a left-to-right diagram of the software lifecycle: plan → code → build → test → release → deploy → operate.</p>

      <h3>The economics: why "left" is cheaper</h3>
      <p>The single most important number in this field is the <strong>cost-of-defect curve</strong>. A flaw caught while a developer is typing costs almost nothing to fix. The same flaw discovered in production can cost 30–100x more — because now it involves an incident, a rollback, customer impact, and possibly a breach.</p>
      <table>
        <thead><tr><th>Where the flaw is caught</th><th>Relative cost to fix</th><th>Who fixes it</th></tr></thead>
        <tbody>
          <tr><td>In the developer's editor / commit</td><td>1x</td><td>The author, in minutes</td></tr>
          <tr><td>In the build / CI pipeline</td><td>~5x</td><td>The author, same day</td></tr>
          <tr><td>In QA / staging</td><td>~15x</td><td>A team, over days</td></tr>
          <tr><td>In production</td><td>30–100x+</td><td>Incident response, under pressure</td></tr>
        </tbody>
      </table>

      <h3>DevSecOps is a culture, not a tool</h3>
      <p>The biggest misconception is that DevSecOps is a product you buy. It is primarily a <strong>cultural</strong> change with three pillars:</p>
      <ul>
        <li><strong>Shared ownership</strong> — security is everyone's job, not a separate team's veto. Developers own the security of the code they write.</li>
        <li><strong>Automation</strong> — humans don't scale to review every commit, so security checks are baked into the automated pipeline and run on every change.</li>
        <li><strong>Fast feedback</strong> — a finding is only useful if it reaches the author quickly, in context, with a clear fix. Security must be as fast as the pipeline it lives in.</li>
      </ul>

      <blockquote>The goal is not to make developers into security experts. It is to give them guardrails — automated checks that catch the common, dangerous mistakes early, so the human security experts can focus on the hard problems machines can't see.</blockquote>

      <h3>The "paved road" philosophy</h3>
      <p>Mature DevSecOps teams build a <strong>paved road</strong> (also called a "golden path"): the secure way to do something is also the <em>easiest</em> way. If using the approved, hardened base image and the pre-wired secrets vault is less work than doing it insecurely, developers choose security by default — no nagging required. Friction is the enemy of adoption, and adoption is the whole game.</p>

      <h3>What you'll build toward</h3>
      <p>Across this course you will assemble a mental model of a secure pipeline: threat-model a feature, wire in SAST/DAST/IAST scanning, audit your dependencies and supply chain, keep secrets out of code, scan your infrastructure and containers, and finally gate deployments with policy-as-code — all mapped to how real attacks (like the SolarWinds supply-chain compromise) actually happen.</p>
    `,
    quizzes: [
      { id: "dev-l1-q1", question: "What does 'shifting security left' mean?", options: ["Moving the security team to a different office", "Moving security activities earlier in the software lifecycle (design, code, build)", "Deleting security checks to ship faster", "Only scanning left-hand branches of code"], correctAnswerIndex: 1, explanation: "'Left' is the early side of a left-to-right lifecycle diagram; shifting left moves security into design, coding, and the build pipeline." },
      { id: "dev-l1-q2", question: "Why is catching a flaw early so much cheaper than catching it in production?", options: ["Early bugs are always smaller", "A production flaw involves incidents, rollbacks, and customer impact, while an early one is a quick edit", "Developers are paid less than testers", "Production servers cost more electricity"], correctAnswerIndex: 1, explanation: "The cost-of-defect curve rises steeply; a production issue triggers costly incident response, whereas an early fix is a minutes-long edit by the author." },
      { id: "dev-l1-q3", question: "DevSecOps is best described as…", options: ["A single product you install", "Primarily a cultural change built on shared ownership, automation, and fast feedback", "A replacement for all developers", "A type of firewall"], correctAnswerIndex: 1, explanation: "DevSecOps is a culture of shared ownership and automation, not a product you can simply buy." },
      { id: "dev-l1-q4", question: "What is the traditional problem DevSecOps was created to solve?", options: ["Servers were too fast", "Security was a final gate that found problems too late, forcing a choice between delay and shipping holes", "There were too many developers", "Code was written in the wrong language"], correctAnswerIndex: 1, explanation: "End-of-line security testing surfaced issues right before launch, making security the department of 'no' and encouraging teams to route around it." },
      { id: "dev-l1-q5", question: "What is a 'paved road' (golden path) in DevSecOps?", options: ["A physical network cable", "Making the secure way to do something also the easiest way, so developers choose it by default", "A road only security staff may use", "A type of encryption"], correctAnswerIndex: 1, explanation: "A paved road removes friction by making the hardened, approved approach the path of least resistance." },
      { id: "dev-l1-q6", question: "Why is automation a core pillar of DevSecOps?", options: ["Automation is cheaper than good code", "Humans cannot manually review every commit, so checks must run automatically on every change", "It eliminates the need for any security staff", "It makes the pipeline slower on purpose"], correctAnswerIndex: 1, explanation: "The volume of changes exceeds human review capacity, so security checks are baked into the automated pipeline." },
      { id: "dev-l1-q7", question: "Under shared ownership, who is responsible for the security of code a developer writes?", options: ["Only the dedicated security team", "The developer who wrote it", "Only the operations team", "Nobody until an audit"], correctAnswerIndex: 1, explanation: "Shared ownership means developers own the security of their own code, supported by guardrails rather than a separate veto team." },
      { id: "dev-l1-q8", question: "Why must security feedback be fast?", options: ["To use up CI credits", "A finding is only useful if it reaches the author quickly, in context, with a clear fix", "Because slow feedback is illegal", "Fast feedback reduces disk usage"], correctAnswerIndex: 1, explanation: "Slow feedback arrives after the developer has moved on; fast, in-context feedback is what actually gets flaws fixed." },
    ],
  },

  // ── LESSON 2 ───────────────────────────────────────────────────────────────
  {
    title: "02 // The Secure SDLC: Security at Every Phase",
    summary: "Mapping concrete security activities onto each phase of the software development lifecycle, and the frameworks that organise them.",
    content: `
      <h2>Every phase has a security job</h2>
      <p>The <strong>Software Development Lifecycle (SDLC)</strong> is the sequence of phases software passes through, from idea to retirement. A <strong>Secure SDLC (SSDLC)</strong> simply attaches a security activity to each phase, so security is continuous rather than a single event. This is the operational skeleton of everything else in this course.</p>

      <h3>The phases and their security activities</h3>
      <table>
        <thead><tr><th>SDLC Phase</th><th>Security activity</th><th>Example tool/practice</th></tr></thead>
        <tbody>
          <tr><td>Plan / Requirements</td><td>Define security requirements; abuse cases</td><td>Security stories, compliance mapping</td></tr>
          <tr><td>Design</td><td>Threat modeling</td><td>STRIDE, data-flow diagrams</td></tr>
          <tr><td>Code</td><td>Secure coding, IDE linting, secrets prevention</td><td>SAST in-editor, pre-commit hooks</td></tr>
          <tr><td>Build</td><td>SCA, SAST, IaC & image scanning</td><td>Dependency scanners, Trivy, Semgrep</td></tr>
          <tr><td>Test</td><td>DAST, IAST, security regression tests</td><td>OWASP ZAP, fuzzing</td></tr>
          <tr><td>Release / Deploy</td><td>Policy gates, signing, artifact provenance</td><td>OPA, Sigstore/cosign</td></tr>
          <tr><td>Operate</td><td>Runtime monitoring, patching, WAF</td><td>Falco, cloud posture management</td></tr>
        </tbody>
      </table>

      <h3>Waterfall vs Agile vs continuous</h3>
      <p>The classic SSDLC was drawn as a linear <strong>waterfall</strong>: finish one phase, then the next. Modern delivery is iterative and continuous — code is built and deployed many times a day. This is exactly why security had to be <em>automated</em> and embedded in the pipeline: you cannot run a two-week manual review between commits that happen every ten minutes.</p>

      <h3>The frameworks that organise this</h3>
      <ul>
        <li><strong>OWASP SAMM</strong> (Software Assurance Maturity Model) — a model to measure and improve how mature your software-security practices are, across governance, design, implementation, verification, and operations.</li>
        <li><strong>BSIMM</strong> (Building Security In Maturity Model) — a descriptive study of what real organisations actually do, used for benchmarking against peers.</li>
        <li><strong>NIST SSDF</strong> (Secure Software Development Framework, SP 800-218) — a government-backed set of practices; increasingly referenced in compliance and procurement.</li>
        <li><strong>Microsoft SDL</strong> — one of the earliest and most influential secure development lifecycles.</li>
      </ul>

      <h3>Security requirements and abuse cases</h3>
      <p>Security starts before any code is written. Where a normal requirement says "a user can reset their password," a <strong>security requirement</strong> adds "…and an attacker cannot use the reset flow to enumerate valid accounts or hijack another user." The technique of writing <strong>abuse cases</strong> — user stories from the attacker's perspective ("As an attacker, I want to…") — turns fuzzy security concerns into concrete, testable requirements the team can build and verify against.</p>

      <blockquote>The Secure SDLC is not a separate track that runs alongside development. It is the same lifecycle with a security lens applied at every step. If you can name the phase, you can name the security activity that belongs to it — that mapping is the heart of a DevSecOps engineer's mental model.</blockquote>
    `,
    quizzes: [
      { id: "dev-l2-q1", question: "What is a Secure SDLC (SSDLC)?", options: ["A separate security-only project", "The normal software lifecycle with a security activity attached to each phase", "A type of encryption key", "A brand of scanner"], correctAnswerIndex: 1, explanation: "An SSDLC embeds a security activity into every phase of the standard development lifecycle so security is continuous." },
      { id: "dev-l2-q2", question: "Which security activity belongs to the Design phase?", options: ["DAST scanning", "Threat modeling", "Runtime monitoring", "Dependency signing"], correctAnswerIndex: 1, explanation: "Threat modeling is a design-phase activity that anticipates how a system could be attacked before code exists." },
      { id: "dev-l2-q3", question: "Why did continuous delivery force security to become automated?", options: ["Manual reviews are illegal", "You cannot run a two-week manual review between commits that happen minutes apart", "Automation is always cheaper than people", "Servers demand it"], correctAnswerIndex: 1, explanation: "With code shipping many times a day, only automated, pipeline-embedded checks can keep pace." },
      { id: "dev-l2-q4", question: "What is OWASP SAMM?", options: ["A password cracker", "A maturity model for measuring and improving software-security practices", "A container runtime", "A CVE database"], correctAnswerIndex: 1, explanation: "SAMM (Software Assurance Maturity Model) helps organisations assess and improve the maturity of their security practices." },
      { id: "dev-l2-q5", question: "What is an 'abuse case'?", options: ["A bug report from a customer", "A user story written from the attacker's perspective to surface security requirements", "A legal complaint", "A crashed container"], correctAnswerIndex: 1, explanation: "Abuse cases ('As an attacker, I want to…') turn vague security worries into concrete, testable requirements." },
      { id: "dev-l2-q6", question: "Which framework is a US government-backed set of secure development practices?", options: ["NIST SSDF (SP 800-218)", "rockyou.txt", "OWASP Top 10", "Docker Hub"], correctAnswerIndex: 0, explanation: "The NIST Secure Software Development Framework (SP 800-218) is a government-backed practice set, increasingly cited in compliance." },
      { id: "dev-l2-q7", question: "DAST and IAST are most associated with which phase?", options: ["Plan", "Test", "Retire", "Requirements"], correctAnswerIndex: 1, explanation: "Dynamic and interactive testing exercise a running application, which happens in the Test phase." },
      { id: "dev-l2-q8", question: "How does a security requirement differ from a normal requirement?", options: ["It is written in a different language", "It adds the attacker's constraints — what must NOT be possible — to the feature", "It is optional", "It only applies to the operate phase"], correctAnswerIndex: 1, explanation: "A security requirement layers 'and an attacker cannot…' onto the functional behaviour, making the negative case explicit and testable." },
    ],
  },

  // ── LESSON 3 ───────────────────────────────────────────────────────────────
  {
    title: "03 // Threat Modeling with STRIDE",
    summary: "How to systematically anticipate attacks during design using data-flow diagrams and the STRIDE mnemonic, before a line of code is written.",
    content: `
      <h2>Think like an attacker before you build</h2>
      <p><strong>Threat modeling</strong> is the structured practice of asking, during design, "how could this be attacked, and what will we do about it?" It is the highest-leverage security activity there is, because a design flaw found on a whiteboard costs nothing to fix, while the same flaw found after launch may require re-architecting the product.</p>

      <h3>The four questions</h3>
      <p>Every threat model, no matter the methodology, answers four questions (Adam Shostack's framing):</p>
      <ol>
        <li><strong>What are we building?</strong> — Draw the system: components, data stores, and how data flows between them.</li>
        <li><strong>What can go wrong?</strong> — Enumerate threats against each part.</li>
        <li><strong>What are we going to do about it?</strong> — Decide mitigations for the threats that matter.</li>
        <li><strong>Did we do a good job?</strong> — Review and validate the model.</li>
      </ol>

      <h3>Data-flow diagrams and trust boundaries</h3>
      <p>The classic starting artifact is a <strong>data-flow diagram (DFD)</strong>: boxes for processes, cylinders for data stores, arrows for data movement. The critical addition is <strong>trust boundaries</strong> — dotted lines where data crosses from a less-trusted zone to a more-trusted one (e.g., the internet crossing into your API). <em>Threats concentrate at trust boundaries.</em> Every arrow that crosses one is a place an attacker can inject, tamper, or spoof.</p>

      <h3>STRIDE: a checklist for "what can go wrong"</h3>
      <p><strong>STRIDE</strong> is a mnemonic (from Microsoft) that ensures you consider six categories of threat, each the inverse of a security property:</p>
      <table>
        <thead><tr><th>Letter</th><th>Threat</th><th>Violates</th><th>Example</th></tr></thead>
        <tbody>
          <tr><td>S</td><td><strong>Spoofing</strong></td><td>Authentication</td><td>Pretending to be another user or service</td></tr>
          <tr><td>T</td><td><strong>Tampering</strong></td><td>Integrity</td><td>Modifying data in transit or at rest</td></tr>
          <tr><td>R</td><td><strong>Repudiation</strong></td><td>Non-repudiation</td><td>Denying an action with no log to prove it</td></tr>
          <tr><td>I</td><td><strong>Information Disclosure</strong></td><td>Confidentiality</td><td>Leaking data to unauthorised parties</td></tr>
          <tr><td>D</td><td><strong>Denial of Service</strong></td><td>Availability</td><td>Overwhelming a service so it can't respond</td></tr>
          <tr><td>E</td><td><strong>Elevation of Privilege</strong></td><td>Authorisation</td><td>A normal user gaining admin rights</td></tr>
        </tbody>
      </table>

      <h3>Worked mini-example: a login API</h3>
      <p>Apply STRIDE to a single arrow — a user submitting credentials to a login endpoint across the internet trust boundary:</p>
      <ul>
        <li><strong>Spoofing</strong> → brute force / credential stuffing → mitigate with MFA and rate limiting.</li>
        <li><strong>Tampering</strong> → request modified in transit → mitigate with TLS.</li>
        <li><strong>Information Disclosure</strong> → error messages reveal which usernames exist → return a generic failure message.</li>
        <li><strong>Denial of Service</strong> → automated login floods → rate-limit and use CAPTCHA on anomalies.</li>
      </ul>
      <p>Each identified threat becomes a concrete requirement or test — this is how a design-phase whiteboard exercise turns into the SAST rules, DAST tests, and gates you'll build later in the course.</p>

      <blockquote>You do not need to threat-model the entire universe. Focus effort where the risk is: the arrows crossing trust boundaries, the components handling sensitive data, and anything exposed to the internet. A quick, focused model that ships beats a perfect one that never finishes.</blockquote>

      <h3>Other methodologies to recognise</h3>
      <p>STRIDE is the most common, but you'll hear of <strong>PASTA</strong> (Process for Attack Simulation and Threat Analysis — risk-centric), <strong>DREAD</strong> (a rating scheme for prioritising threats), and <strong>attack trees</strong> (goal-oriented graphs of how an attacker could reach an objective). They are different lenses on the same four questions.</p>
    `,
    quizzes: [
      { id: "dev-l3-q1", question: "When in the lifecycle is threat modeling most valuable?", options: ["After a breach", "During design, before code is written", "Only at retirement", "During payroll processing"], correctAnswerIndex: 1, explanation: "Threat modeling is a design activity; a flaw caught on the whiteboard is far cheaper to fix than one baked into shipped code." },
      { id: "dev-l3-q2", question: "What does the 'S' in STRIDE stand for?", options: ["Scanning", "Spoofing", "Signing", "Sandboxing"], correctAnswerIndex: 1, explanation: "S is Spoofing — impersonating another user or system, which violates authentication." },
      { id: "dev-l3-q3", question: "What is a trust boundary in a data-flow diagram?", options: ["The edge of the screen", "A line where data crosses from a less-trusted zone to a more-trusted one", "The maximum file size", "A firewall brand"], correctAnswerIndex: 1, explanation: "Trust boundaries mark transitions in trust level (e.g., internet to internal API) and are where threats concentrate." },
      { id: "dev-l3-q4", question: "Which STRIDE category corresponds to a normal user gaining admin rights?", options: ["Tampering", "Repudiation", "Elevation of Privilege", "Denial of Service"], correctAnswerIndex: 2, explanation: "Elevation of Privilege is unauthorised gain of higher permissions, violating authorisation." },
      { id: "dev-l3-q5", question: "Which security property does 'Information Disclosure' violate?", options: ["Availability", "Confidentiality", "Non-repudiation", "Authentication"], correctAnswerIndex: 1, explanation: "Information Disclosure is the leaking of data to unauthorised parties, violating confidentiality." },
      { id: "dev-l3-q6", question: "What are the four questions every threat model answers?", options: ["Who, what, when, where", "What are we building? What can go wrong? What will we do? Did we do a good job?", "Cost, time, scope, quality", "Read, write, execute, delete"], correctAnswerIndex: 1, explanation: "Shostack's four-question frame structures any threat model regardless of methodology." },
      { id: "dev-l3-q7", question: "Repudiation threats are best mitigated by…", options: ["Faster CPUs", "Reliable logging/audit trails so actions can't be denied", "Deleting logs", "Bigger disks"], correctAnswerIndex: 1, explanation: "Non-repudiation depends on trustworthy audit logs that prove who did what, defeating denial of an action." },
      { id: "dev-l3-q8", question: "Where should you focus threat-modeling effort first?", options: ["On code that never changes", "On arrows crossing trust boundaries and internet-exposed, sensitive components", "On the company logo", "On unit test naming"], correctAnswerIndex: 1, explanation: "Risk concentrates at trust boundaries and exposed, sensitive components — focus limited effort there." },
    ],
  },

  // ── LESSON 4 ───────────────────────────────────────────────────────────────
  {
    title: "04 // SAST, DAST & IAST: The Testing Triad",
    summary: "The three complementary application security testing techniques — what each sees, what each is blind to, and when to use them together.",
    content: `
      <h2>Three ways to find vulnerabilities in your own app</h2>
      <p>Once code exists, you test it for flaws. There are three foundational automated techniques, and the key insight is that they are <strong>complementary, not competing</strong> — each sees what the others cannot.</p>

      <h3>SAST — Static Application Security Testing</h3>
      <p><strong>SAST</strong> analyses source code (or bytecode) <em>without running it</em> — "white-box" testing. It reads the code the way a very pedantic reviewer would, tracing how untrusted data flows from an <strong>source</strong> (user input) to a dangerous <strong>sink</strong> (a SQL query, a shell command) without proper sanitisation.</p>
      <ul>
        <li><strong>Strengths:</strong> runs very early (even in the IDE), sees the whole codebase, points to the exact vulnerable line, catches SQL injection and hardcoded secrets.</li>
        <li><strong>Blind spots:</strong> no runtime context, so it produces <strong>false positives</strong> (flagging code that's actually safe) and cannot find configuration or environment issues.</li>
        <li><strong>Tools:</strong> Semgrep, SonarQube, Checkmarx, CodeQL, Bandit (Python), gosec (Go).</li>
      </ul>

      <h3>DAST — Dynamic Application Security Testing</h3>
      <p><strong>DAST</strong> tests a <em>running</em> application from the outside, with no knowledge of the source — "black-box" testing. It behaves like an attacker: sending malicious inputs to the live app and observing responses.</p>
      <ul>
        <li><strong>Strengths:</strong> finds issues that only appear at runtime (misconfigurations, authentication flaws, server headers), and because it observes real behaviour it produces fewer false positives.</li>
        <li><strong>Blind spots:</strong> runs late (needs a deployed app), can't point to the vulnerable line of code, and only tests the paths it manages to reach — coverage gaps mean <strong>false negatives</strong>.</li>
        <li><strong>Tools:</strong> OWASP ZAP, Burp Suite, Nikto.</li>
      </ul>

      <h3>IAST — Interactive Application Security Testing</h3>
      <p><strong>IAST</strong> is the hybrid. An agent (instrumentation) runs <em>inside</em> the application while it executes — typically during your existing automated functional tests. It watches data flow from the inside as the app runs, combining SAST's code-level visibility with DAST's runtime accuracy.</p>
      <ul>
        <li><strong>Strengths:</strong> low false positives AND pinpoints the vulnerable line, because it sees both the code path and the live request.</li>
        <li><strong>Blind spots:</strong> requires instrumenting the app and good test coverage to exercise code paths; more complex to set up and language-dependent.</li>
      </ul>

      <h3>Side-by-side</h3>
      <table>
        <thead><tr><th></th><th>SAST</th><th>DAST</th><th>IAST</th></tr></thead>
        <tbody>
          <tr><td>Perspective</td><td>White-box (inside)</td><td>Black-box (outside)</td><td>Grey-box (instrumented)</td></tr>
          <tr><td>App running?</td><td>No</td><td>Yes</td><td>Yes</td></tr>
          <tr><td>Pipeline stage</td><td>Very early (code/build)</td><td>Late (test/staging)</td><td>Test</td></tr>
          <tr><td>Points to code line?</td><td>Yes</td><td>No</td><td>Yes</td></tr>
          <tr><td>False positives</td><td>Higher</td><td>Lower</td><td>Low</td></tr>
          <tr><td>Finds config/runtime issues?</td><td>No</td><td>Yes</td><td>Partly</td></tr>
        </tbody>
      </table>

      <h3>A concrete example: SQL injection</h3>
      <pre><code>// Vulnerable: user input concatenated directly into a query
const q = "SELECT * FROM users WHERE name = '" + req.query.name + "'";
db.execute(q);</code></pre>
      <p>SAST catches this by tracing <code>req.query.name</code> (source) into <code>db.execute</code> (sink) with no sanitisation. DAST catches it by sending <code>' OR '1'='1</code> to the live endpoint and detecting the anomalous response. IAST catches it by watching the tainted input reach the database call during a functional test. Three tools, one bug, three routes to the same finding — which is exactly why defense-in-depth applies to testing too.</p>

      <blockquote>Rule of thumb: SAST early and often (fast feedback on every commit), DAST before release (validate the running system), IAST if you have the test coverage to feed it. No single one is complete; a mature program runs the triad.</blockquote>
    `,
    quizzes: [
      { id: "dev-l4-q1", question: "What does SAST analyse?", options: ["A running application from outside", "Source code without executing it", "Network packets", "Container registries"], correctAnswerIndex: 1, explanation: "SAST (Static Application Security Testing) is white-box analysis of source/bytecode without running the app." },
      { id: "dev-l4-q2", question: "Why does SAST tend to produce more false positives than DAST?", options: ["It runs too slowly", "It lacks runtime context, so it can flag code paths that are actually safe", "It only reads comments", "It cannot see the code"], correctAnswerIndex: 1, explanation: "Without observing real execution, SAST can't always tell whether a suspicious pattern is actually exploitable." },
      { id: "dev-l4-q3", question: "DAST is best described as…", options: ["White-box source analysis", "Black-box testing of a running application from the outside", "A dependency scanner", "A secrets vault"], correctAnswerIndex: 1, explanation: "DAST sends malicious inputs to a live app with no source knowledge, mimicking an external attacker." },
      { id: "dev-l4-q4", question: "What is a key limitation of DAST?", options: ["It can't run at all", "It runs late, can't point to the vulnerable code line, and only tests paths it reaches", "It reveals the source code", "It only works on databases"], correctAnswerIndex: 1, explanation: "DAST needs a deployed app, gives no code location, and misses code paths it doesn't exercise (false negatives)." },
      { id: "dev-l4-q5", question: "How does IAST work?", options: ["By reading Git history", "An agent runs inside the app during execution, watching data flow as tests run", "By scanning container images", "By blocking network ports"], correctAnswerIndex: 1, explanation: "IAST instruments the running application, combining code-level visibility with runtime accuracy." },
      { id: "dev-l4-q6", question: "In data-flow terms, SAST traces untrusted data from a ___ to a ___.", options: ["server to client", "source (user input) to sink (dangerous operation)", "commit to branch", "log to alert"], correctAnswerIndex: 1, explanation: "SAST follows tainted input from sources to sinks, flagging paths lacking sanitisation." },
      { id: "dev-l4-q7", question: "Which technique typically runs earliest, even in the developer's IDE?", options: ["DAST", "IAST", "SAST", "Penetration testing"], correctAnswerIndex: 2, explanation: "SAST needs no running app, so it can run in-editor and on every commit for fast feedback." },
      { id: "dev-l4-q8", question: "What is the main takeaway about SAST, DAST, and IAST?", options: ["Pick one and ignore the rest", "They are complementary — each sees what the others cannot, so mature programs use the triad", "They all find identical bugs", "Only DAST matters"], correctAnswerIndex: 1, explanation: "Each technique has structural blind spots; combining them provides broader coverage than any single tool." },
    ],
  },

  // ── LESSON 5 ───────────────────────────────────────────────────────────────
  {
    title: "05 // Software Composition Analysis & the Supply Chain",
    summary: "Why most of your code is other people's code, how transitive dependencies and supply-chain attacks work, and how SCA and SBOMs manage the risk.",
    content: `
      <h2>You didn't write most of your application</h2>
      <p>A modern application is mostly <strong>open-source dependencies</strong>. It is common for 80–90% of a codebase (by lines) to be third-party libraries you pulled from npm, PyPI, Maven, or similar. You are responsible for the security of <em>all</em> of it — including the parts you never read.</p>

      <h3>Direct vs transitive dependencies</h3>
      <p>You explicitly install a handful of <strong>direct dependencies</strong>. But each of those pulls in <em>its</em> dependencies, which pull in theirs — the <strong>transitive dependencies</strong>. A project with 10 direct dependencies routinely ends up with 1,000+ total. The infamous vulnerability is almost never in the library you chose; it's five levels deep in something you've never heard of.</p>

      <h3>SCA — Software Composition Analysis</h3>
      <p><strong>SCA</strong> tools inventory every dependency (direct and transitive) and cross-reference them against vulnerability databases. Two concepts you must know:</p>
      <ul>
        <li><strong>CVE (Common Vulnerabilities and Exposures)</strong> — a unique public ID for a known vulnerability, e.g. <code>CVE-2021-44228</code> (Log4Shell).</li>
        <li><strong>CVSS (Common Vulnerability Scoring System)</strong> — a 0.0–10.0 severity score. 9.0+ is Critical. SCA uses these to prioritise which of your hundreds of vulnerable dependencies to fix first.</li>
      </ul>
      <p>Tools: <strong>Dependabot</strong> (GitHub), <strong>Snyk</strong>, <strong>OWASP Dependency-Check</strong>, <strong>Trivy</strong>, <strong>npm audit</strong>.</p>

      <h3>Supply-chain attacks (MITRE T1195)</h3>
      <p>Attackers realised it's easier to poison a widely-used dependency than to attack thousands of targets directly. Key attack patterns:</p>
      <table>
        <thead><tr><th>Attack</th><th>How it works</th></tr></thead>
        <tbody>
          <tr><td>Typosquatting</td><td>Publish a malicious package with a name close to a popular one (<code>reqeusts</code> vs <code>requests</code>).</td></tr>
          <tr><td>Dependency confusion</td><td>Publish a public package with the same name as a company's private internal package, hoping the build grabs the public one.</td></tr>
          <tr><td>Account/maintainer takeover</td><td>Compromise a maintainer's account and push a malicious version of a legit, trusted package.</td></tr>
          <tr><td>Build-system compromise</td><td>Inject malicious code into the vendor's build pipeline so signed, "trusted" releases are backdoored (SolarWinds).</td></tr>
        </tbody>
      </table>

      <h3>Case study: SolarWinds and Log4Shell</h3>
      <p>The <strong>SolarWinds</strong> attack (2020) compromised the vendor's build system, so ~18,000 organisations installed a legitimately-signed but backdoored update — the defining example of a build-pipeline supply-chain compromise. <strong>Log4Shell</strong> (CVE-2021-44228, 2021) was a critical flaw in Log4j, a logging library buried transitively in a staggering fraction of Java applications worldwide — the defining example of transitive-dependency risk. Both taught the industry the same lesson: <em>you must know what's in your software</em>.</p>

      <h3>SBOM — the ingredient label</h3>
      <p>An <strong>SBOM (Software Bill of Materials)</strong> is a complete, machine-readable inventory of every component in your software, like a nutrition label for code. Standard formats are <strong>SPDX</strong> and <strong>CycloneDX</strong>. Its killer use case: when the next Log4Shell drops, an organisation with SBOMs can answer "are we affected, and where?" in minutes instead of weeks. SBOMs are increasingly mandated (e.g., US Executive Order 14028).</p>

      <blockquote>Two disciplines here. Managing <strong>known</strong> vulnerabilities in your dependencies is SCA — a solvable, ongoing hygiene task. Defending against <strong>deliberately malicious</strong> supply-chain attacks is harder and needs pinning, integrity verification, provenance, and SBOMs. Don't conflate them.</blockquote>
    `,
    quizzes: [
      { id: "dev-l5-q1", question: "What does SCA (Software Composition Analysis) do?", options: ["Runs the application to find runtime bugs", "Inventories dependencies and checks them against known-vulnerability databases", "Encrypts source code", "Scans network ports"], correctAnswerIndex: 1, explanation: "SCA identifies all direct and transitive dependencies and flags those with known vulnerabilities." },
      { id: "dev-l5-q2", question: "What is a transitive dependency?", options: ["A dependency you explicitly installed", "A dependency pulled in by one of your dependencies, not chosen directly", "A dependency that changes daily", "A dependency written in another language"], correctAnswerIndex: 1, explanation: "Transitive dependencies are the dependencies-of-your-dependencies, which usually vastly outnumber the direct ones." },
      { id: "dev-l5-q3", question: "What is a CVE?", options: ["A container image format", "A unique public identifier for a known vulnerability", "A firewall rule", "A CI/CD tool"], correctAnswerIndex: 1, explanation: "CVE (Common Vulnerabilities and Exposures) assigns a unique ID to a publicly known vulnerability, e.g. CVE-2021-44228." },
      { id: "dev-l5-q4", question: "What does a CVSS score represent?", options: ["The size of a file", "A 0.0–10.0 severity rating used to prioritise vulnerabilities", "The number of dependencies", "The build duration"], correctAnswerIndex: 1, explanation: "CVSS scores severity from 0.0 to 10.0 (9.0+ Critical), helping teams prioritise which flaws to fix first." },
      { id: "dev-l5-q5", question: "What is dependency confusion?", options: ["Forgetting a library name", "Publishing a public package with the same name as a private internal one, hoping the build grabs the public one", "Two developers using different versions", "A typo in a comment"], correctAnswerIndex: 1, explanation: "Dependency confusion abuses resolver precedence to trick builds into pulling a malicious public package over the intended private one." },
      { id: "dev-l5-q6", question: "The SolarWinds attack is the defining example of which supply-chain pattern?", options: ["Typosquatting", "Build-system compromise producing signed-but-backdoored updates", "Password spraying", "SQL injection"], correctAnswerIndex: 1, explanation: "Attackers poisoned SolarWinds' build pipeline, so ~18,000 orgs installed a legitimately-signed but backdoored update." },
      { id: "dev-l5-q7", question: "What is an SBOM?", options: ["A backup format", "A machine-readable inventory of every component in your software", "A brute-force tool", "A container runtime"], correctAnswerIndex: 1, explanation: "A Software Bill of Materials lists all components (like an ingredient label), enabling fast 'are we affected?' answers." },
      { id: "dev-l5-q8", question: "Why was Log4Shell (CVE-2021-44228) so widespread?", options: ["It targeted a single company", "Log4j was a transitive dependency buried in a huge fraction of Java applications", "It only affected printers", "It required physical access"], correctAnswerIndex: 1, explanation: "Log4j was deeply embedded as a transitive dependency across countless Java apps, so a single flaw had massive reach." },
    ],
  },

  // ── LESSON 6 ───────────────────────────────────────────────────────────────
  {
    title: "06 // Secrets Management: Keeping Credentials Out of Code",
    summary: "Why committed secrets are permanent and dangerous, how to detect them with entropy and pattern rules, and the rotate-first response that actually works.",
    content: `
      <h2>The most common — and most avoidable — leak</h2>
      <p>A <strong>secret</strong> is any credential: an API key, a database password, a private key, a token. Hardcoding secrets into source code is one of the most frequent and damaging mistakes in software, and it is entirely preventable. This lesson is the heart of the ARCH-X DevSecOps mission: catch a committed secret, and stop the next one.</p>

      <h3>Why git makes this so dangerous</h3>
      <p>Git is a <em>version history</em> system. When you commit a secret, it is stored in the repository's permanent history. Deleting the line in a later commit does <strong>not</strong> remove it — the old commit still contains it, fully accessible to anyone with the repo. And automated scrapers monitor public platforms like GitHub constantly, harvesting exposed keys within seconds of a push.</p>

      <blockquote>The moment a secret hits a remote repository, treat it as compromised. Not "might be" — <strong>is</strong>. Bots find keys faster than humans can react, and cloud credentials are used to spin up crypto-mining fleets within minutes.</blockquote>

      <h3>Detecting secrets: patterns + entropy</h3>
      <p>Secret scanners use two complementary strategies:</p>
      <ul>
        <li><strong>Pattern matching</strong> — regexes for known credential formats. An AWS Access Key ID always starts with <code>AKIA</code> followed by 16 characters; a GitHub token starts with <code>ghp_</code>. High precision for known providers.</li>
        <li><strong>Entropy detection</strong> — measuring the randomness of a string. Real secrets look like random noise (high Shannon entropy); ordinary code and prose do not. A high-entropy string like <code>x7Kp2mQ9vL4nR8s</code> is probably a secret even if it matches no known pattern. High recall, but more false positives (hashes, UUIDs, minified code).</li>
      </ul>
      <p>Tools: <strong>gitleaks</strong>, <strong>truffleHog</strong>, <strong>detect-secrets</strong>, and GitHub's built-in secret scanning / push protection.</p>

      <h3>Prevention: the pre-commit gate</h3>
      <p>The cheapest place to stop a secret is <em>before</em> it ever enters history. A <strong>pre-commit hook</strong> runs a scanner on the developer's machine and rejects the commit if a secret is found:</p>
      <pre><code># .pre-commit-config.yaml
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.0
    hooks:
      - id: gitleaks</code></pre>
      <p>Because hooks can be bypassed locally, you back this up with a <strong>server-side scan in CI</strong> that fails the build, and platform push protection — defense in depth again.</p>

      <h3>Response: rotate first, always</h3>
      <p>When a secret leaks, the order of operations is non-negotiable:</p>
      <ol>
        <li><strong>Rotate/revoke immediately</strong> at the provider (invalidate the AWS key, regenerate the token). This is the ONLY step that actually secures you, because the old value is already out.</li>
        <li><strong>Purge history</strong> with <code>git filter-repo</code> or <strong>BFG Repo-Cleaner</strong> to remove the value from old commits.</li>
        <li><strong>Investigate</strong> whether the leaked secret was used before you revoked it.</li>
      </ol>
      <p>Learners consistently get this backwards, scrubbing history first. But scrubbing a key an attacker copied ten minutes ago protects nothing — <strong>rotation is the fix, purging is cleanup.</strong></p>

      <h3>The right home for secrets</h3>
      <p>Secrets belong in a <strong>secrets manager / vault</strong>, not in code or even in plain environment files committed to the repo. Tools like <strong>HashiCorp Vault</strong>, <strong>AWS Secrets Manager</strong>, <strong>Azure Key Vault</strong>, and Kubernetes Secrets store credentials centrally, inject them at runtime, control access, audit every read, and support automatic rotation. The application receives the secret when it runs; the secret is never written into the artifact.</p>
    `,
    quizzes: [
      { id: "dev-l6-q1", question: "Why does deleting a secret in a new commit fail to fully fix a leak?", options: ["Git caches files on the internet", "Git preserves the full history, so old commits still contain the secret", "Hackers guess the new value", "Git servers forbid deletion"], correctAnswerIndex: 1, explanation: "Git is a version-history system; the secret remains in earlier commits even after you delete the line later." },
      { id: "dev-l6-q2", question: "What is the FIRST action when a secret is exposed in a public repo?", options: ["Purge git history", "Rotate/revoke the credential at the provider immediately", "Email the team", "Rename the file"], correctAnswerIndex: 1, explanation: "Rotation is the only guaranteed fix because the old value is already compromised; history purging is cleanup that comes after." },
      { id: "dev-l6-q3", question: "How does entropy-based secret detection work?", options: ["It checks file size", "It measures string randomness — real secrets look like high-entropy noise unlike normal code", "It counts commits", "It scans for the word 'password' only"], correctAnswerIndex: 1, explanation: "High Shannon entropy flags random-looking strings likely to be secrets, even when no known pattern matches." },
      { id: "dev-l6-q4", question: "An AWS Access Key ID beginning with 'AKIA' would most directly be caught by…", options: ["Entropy detection only", "Pattern/regex matching for known credential formats", "A DAST scan", "A container scan"], correctAnswerIndex: 1, explanation: "Known prefixes like AKIA are ideal for high-precision regex pattern matching." },
      { id: "dev-l6-q5", question: "What does a pre-commit hook accomplish for secrets?", options: ["It rotates keys automatically", "It scans and rejects the commit before a secret enters history", "It deploys the app", "It writes the SBOM"], correctAnswerIndex: 1, explanation: "A pre-commit hook blocks the secret at the earliest, cheapest point — before it is ever committed." },
      { id: "dev-l6-q6", question: "Why also scan for secrets server-side in CI, not just pre-commit?", options: ["CI scans are decorative", "Local pre-commit hooks can be bypassed, so a server-side gate provides defense in depth", "It saves disk space", "Pre-commit hooks leak secrets"], correctAnswerIndex: 1, explanation: "Developers can skip local hooks, so a CI-side scan (and push protection) backstops them." },
      { id: "dev-l6-q7", question: "Which tool purges a secret from old git commits?", options: ["nmap", "BFG Repo-Cleaner or git filter-repo", "OWASP ZAP", "Semgrep"], correctAnswerIndex: 1, explanation: "BFG Repo-Cleaner and git filter-repo rewrite history to remove the secret's value from prior commits." },
      { id: "dev-l6-q8", question: "Where should application secrets actually live?", options: ["Hardcoded in source", "In a secrets manager/vault that injects them at runtime with access control and auditing", "In a public README", "In the commit message"], correctAnswerIndex: 1, explanation: "Vaults like HashiCorp Vault or AWS Secrets Manager centralise, audit, and rotate secrets, injecting them at runtime instead of baking them into artifacts." },
    ],
  },

  // ── LESSON 7 ───────────────────────────────────────────────────────────────
  {
    title: "07 // Infrastructure-as-Code Security",
    summary: "How defining infrastructure in code creates a new, scalable class of misconfiguration risk — and how IaC scanning catches it before deploy.",
    content: `
      <h2>Your infrastructure is now code — and code has bugs</h2>
      <p><strong>Infrastructure-as-Code (IaC)</strong> means defining servers, networks, storage, and permissions in declarative files instead of clicking through a console. Tools like <strong>Terraform</strong>, <strong>CloudFormation</strong>, <strong>Kubernetes manifests</strong>, <strong>Ansible</strong>, and <strong>Helm</strong> turn infrastructure into version-controlled, repeatable text.</p>

      <p>This is a huge security <em>win</em> — infrastructure becomes reviewable, testable, and consistent. But it introduces a matching risk: a single misconfigured template, applied automatically, can deploy the same mistake to <em>thousands</em> of resources instantly. IaC scales your good decisions and your bad ones equally.</p>

      <h3>The classic IaC misconfigurations</h3>
      <table>
        <thead><tr><th>Misconfiguration</th><th>Why it's dangerous</th></tr></thead>
        <tbody>
          <tr><td>Public S3 bucket / storage</td><td>Data exposed to the entire internet — a top cause of real-world breaches.</td></tr>
          <tr><td>Security group open to 0.0.0.0/0</td><td>A port (e.g., SSH/22 or a database) reachable from anywhere.</td></tr>
          <tr><td>Unencrypted storage or databases</td><td>Data at rest readable if the underlying media is accessed.</td></tr>
          <tr><td>Overly permissive IAM (<code>Action: "*"</code>)</td><td>Violates least privilege; one compromised identity gets everything.</td></tr>
          <tr><td>Disabled logging / audit trails</td><td>An incident with no evidence to investigate.</td></tr>
        </tbody>
      </table>

      <h3>A worked example</h3>
      <p>Here is a Terraform snippet with a dangerous rule — a scanner flags this instantly:</p>
      <pre><code>resource "aws_security_group_rule" "ssh" {
  type        = "ingress"
  from_port   = 22
  to_port     = 22
  protocol    = "tcp"
  cidr_blocks = ["0.0.0.0/0"]   # ⚠ SSH open to the entire internet
}</code></pre>
      <p>The fix is to restrict <code>cidr_blocks</code> to a corporate IP range or VPN. This exact class of finding is what IaC scanning automates across every template in the repo.</p>

      <h3>IaC scanning tools</h3>
      <p>These tools parse IaC files and check them against libraries of security rules <em>before</em> anything is deployed — the ultimate shift-left, catching cloud misconfigurations at commit time rather than in a post-breach audit:</p>
      <ul>
        <li><strong>Checkov</strong> — broad multi-framework scanner (Terraform, CloudFormation, K8s, Helm).</li>
        <li><strong>tfsec</strong> / <strong>Trivy config</strong> — Terraform-focused static analysis.</li>
        <li><strong>KICS</strong> — Keeping Infrastructure as Code Secure, by Checkmarx.</li>
        <li><strong>Terrascan</strong> — policy-based IaC scanning.</li>
      </ul>

      <h3>Drift: the code-vs-reality gap</h3>
      <p>A subtle but critical concept: <strong>configuration drift</strong>. Your IaC says one thing, but someone made a manual change in the console "just this once." Now the live infrastructure no longer matches the reviewed, scanned code — and your scans are validating a fiction. Mature teams detect drift and enforce that <em>all</em> changes go through the IaC pipeline, so the code remains the single source of truth.</p>

      <blockquote>IaC security is where DevSecOps meets cloud security. The same principles from earlier lessons apply: scan early (shift left), fail the build on critical findings (gates, next lesson), and remember that scanning the template proves nothing if the running environment has drifted away from it.</blockquote>
    `,
    quizzes: [
      { id: "dev-l7-q1", question: "What is Infrastructure-as-Code (IaC)?", options: ["Writing application business logic", "Defining infrastructure (servers, networks, permissions) in declarative, version-controlled files", "A type of firewall", "Encrypting hard drives"], correctAnswerIndex: 1, explanation: "IaC defines infrastructure as code using tools like Terraform, making it reviewable, repeatable, and testable." },
      { id: "dev-l7-q2", question: "Why does IaC amplify the impact of a misconfiguration?", options: ["Code runs slower", "A single flawed template applied automatically can deploy the same mistake to thousands of resources", "It disables all logging", "It encrypts everything"], correctAnswerIndex: 1, explanation: "IaC scales decisions; one bad template propagates the error everywhere it is applied." },
      { id: "dev-l7-q3", question: "A security group rule with cidr_blocks = ['0.0.0.0/0'] on port 22 means…", options: ["SSH is disabled", "SSH is reachable from anywhere on the internet", "Only internal traffic is allowed", "The port is encrypted"], correctAnswerIndex: 1, explanation: "0.0.0.0/0 means 'any IP address', exposing SSH to the entire internet — a classic dangerous misconfiguration." },
      { id: "dev-l7-q4", question: "Which is a common IaC misconfiguration?", options: ["A private, encrypted database", "A publicly readable storage bucket", "A least-privilege IAM policy", "Enabled audit logging"], correctAnswerIndex: 1, explanation: "Publicly exposed storage buckets are a top real-world breach cause and a classic IaC scanner finding." },
      { id: "dev-l7-q5", question: "What does an IaC scanner like Checkov do?", options: ["Runs the live application", "Parses IaC files and checks them against security rules before deployment", "Rotates secrets", "Sends phishing tests"], correctAnswerIndex: 1, explanation: "IaC scanners statically analyse templates against security policies pre-deploy, catching misconfigurations early." },
      { id: "dev-l7-q6", question: "What is configuration drift?", options: ["When code compiles slowly", "When live infrastructure no longer matches the reviewed/scanned IaC due to manual changes", "When a container restarts", "When a CVE is published"], correctAnswerIndex: 1, explanation: "Drift is the gap between what the IaC declares and the actual running state after out-of-band manual changes." },
      { id: "dev-l7-q7", question: "An IAM policy with Action: '*' most directly violates which principle?", options: ["Encryption at rest", "Least privilege", "High availability", "Non-repudiation"], correctAnswerIndex: 1, explanation: "Granting all actions violates least privilege — a compromised identity would then have unlimited power." },
      { id: "dev-l7-q8", question: "Why is IaC scanning considered a strong 'shift left' practice?", options: ["It runs after a breach", "It catches cloud misconfigurations at commit/build time instead of in a post-incident audit", "It replaces developers", "It only works in production"], correctAnswerIndex: 1, explanation: "Scanning templates before deploy moves cloud-security checks to the earliest possible point in the lifecycle." },
    ],
  },

  // ── LESSON 8 ───────────────────────────────────────────────────────────────
  {
    title: "08 // Container Image Scanning & Hardening",
    summary: "What's really inside a container image, how to scan it for vulnerable OS packages and misconfigurations, and how to harden images down to a minimal attack surface.",
    content: `
      <h2>A container is only as secure as its image</h2>
      <p>Containers package an application with everything it needs to run. That "everything" — a base OS, system libraries, language runtimes, and your dependencies — is defined by a <strong>container image</strong>, built from a <strong>Dockerfile</strong>. Every one of those layers can carry vulnerabilities, so the image is a prime security target.</p>

      <h3>What image scanning finds</h3>
      <p>Container image scanners inspect each layer and report:</p>
      <ul>
        <li><strong>Vulnerable OS packages</strong> — e.g., an outdated <code>openssl</code> or <code>glibc</code> in the base image with known CVEs.</li>
        <li><strong>Vulnerable application dependencies</strong> — overlapping with SCA (Lesson 5).</li>
        <li><strong>Embedded secrets</strong> — keys accidentally baked into a layer (Lesson 6).</li>
        <li><strong>Dockerfile misconfigurations</strong> — running as root, no pinned versions, unnecessary packages.</li>
      </ul>
      <p>Tools: <strong>Trivy</strong> (the popular open-source default), <strong>Grype</strong>, <strong>Clair</strong>, <strong>Docker Scout</strong>, and registry-integrated scanners.</p>

      <h3>The layer trap</h3>
      <p>A crucial subtlety: image layers are additive and immutable. If you <code>COPY</code> a secret in one layer and <code>rm</code> it in a later one, the secret <strong>still exists in the earlier layer</strong> and can be extracted — exactly analogous to git history from Lesson 6. Deleting in a later step does not undo an earlier one.</p>

      <h3>Hardening: shrink the attack surface</h3>
      <p>The best defence is to have less to attack. Container hardening principles:</p>
      <table>
        <thead><tr><th>Principle</th><th>Why</th></tr></thead>
        <tbody>
          <tr><td>Use minimal base images</td><td><code>alpine</code>, <code>slim</code>, or <strong>distroless</strong> images contain far fewer packages, so far fewer CVEs and no shell for an attacker to use.</td></tr>
          <tr><td>Don't run as root</td><td>Add a <code>USER</code> directive; a container breakout as root is catastrophic, as non-root far less so.</td></tr>
          <tr><td>Pin versions / use digests</td><td><code>FROM node:20.11.1</code> or a SHA digest, never <code>:latest</code> — reproducible and reviewable.</td></tr>
          <tr><td>Multi-stage builds</td><td>Compile in a fat builder image, copy only the artifact into a tiny runtime image — build tools never ship.</td></tr>
          <tr><td>Read-only filesystem</td><td>Prevents an attacker from writing tools or persistence into the container.</td></tr>
        </tbody>
      </table>

      <h3>Distroless — the extreme of minimalism</h3>
      <p>A <strong>distroless</strong> image contains only your application and its runtime dependencies — no package manager, no shell, no <code>/bin/sh</code>. This dramatically reduces both the CVE count and the attacker's options: many post-exploitation techniques rely on a shell that simply isn't there. The trade-off is harder debugging (you can't <code>exec</code> in for a look), which mature teams solve with proper observability.</p>

      <h3>Image scanning vs runtime security</h3>
      <p>Scanning an image at build time is necessary but not sufficient. It says nothing about how the container is <em>run</em>: was it launched <code>--privileged</code>? Are secrets injected as environment variables visible in <code>docker inspect</code>? Did it drift from the scanned image? <strong>Runtime security</strong> tools like <strong>Falco</strong> watch container behaviour in production. Build-time scanning and runtime monitoring are two halves of container security.</p>

      <blockquote>Signing matters too: tools like <strong>cosign</strong> (Sigstore) cryptographically sign images so the deploy pipeline can verify an image is the exact, unmodified artifact your build produced — a direct defence against the supply-chain tampering from Lesson 5.</blockquote>
    `,
    quizzes: [
      { id: "dev-l8-q1", question: "What does a container image scanner primarily look for?", options: ["Only application logic bugs", "Vulnerable OS packages, vulnerable dependencies, embedded secrets, and Dockerfile misconfigurations", "Network latency", "User interface issues"], correctAnswerIndex: 1, explanation: "Image scanners inspect each layer for known-vulnerable packages, secrets, and insecure Dockerfile practices." },
      { id: "dev-l8-q2", question: "If you COPY a secret in one layer and delete it in a later layer, what happens?", options: ["The secret is gone", "The secret still exists in the earlier layer and can be extracted", "The image won't build", "It is automatically encrypted"], correctAnswerIndex: 1, explanation: "Layers are additive and immutable — like git history, a later deletion does not remove data from an earlier layer." },
      { id: "dev-l8-q3", question: "Why prefer a minimal or distroless base image?", options: ["It looks more professional", "Fewer packages mean fewer CVEs and no shell for attackers to use", "It runs faster only", "It is required by law"], correctAnswerIndex: 1, explanation: "Minimal images shrink the attack surface: fewer components to be vulnerable and fewer tools for an attacker post-breach." },
      { id: "dev-l8-q4", question: "Why avoid running a container as root?", options: ["Root is slower", "A container breakout as root is catastrophic; a non-root user limits the damage", "Root cannot use networking", "It saves disk"], correctAnswerIndex: 1, explanation: "Least privilege applies to containers: a non-root process greatly reduces the impact of a compromise or breakout." },
      { id: "dev-l8-q5", question: "What is the benefit of a multi-stage build?", options: ["It runs tests twice", "Build tools stay in the builder image; only the final artifact ships in a small runtime image", "It doubles the image size", "It disables scanning"], correctAnswerIndex: 1, explanation: "Multi-stage builds keep compilers and build tooling out of the shipped image, reducing size and attack surface." },
      { id: "dev-l8-q6", question: "Why is using the ':latest' tag discouraged?", options: ["It is always malware", "It isn't reproducible or reviewable; pin a specific version or digest instead", "It costs more money", "It disables logging"], correctAnswerIndex: 1, explanation: "':latest' can change unpredictably; pinning a version or SHA digest makes builds reproducible and auditable." },
      { id: "dev-l8-q7", question: "What does a distroless image lack that reduces attacker options?", options: ["The application code", "A package manager and shell (no /bin/sh)", "Network access", "The CPU"], correctAnswerIndex: 1, explanation: "Distroless images ship no shell or package manager, breaking many post-exploitation techniques that rely on them." },
      { id: "dev-l8-q8", question: "Why is build-time image scanning insufficient on its own?", options: ["It is too fast", "It says nothing about how the container is run (privileged flags, injected secrets, drift) — runtime security is also needed", "It only works on Windows", "Scanning corrupts the image"], correctAnswerIndex: 1, explanation: "A clean image can still be run insecurely; runtime tools like Falco watch actual container behaviour in production." },
    ],
  },

  // ── LESSON 9 ───────────────────────────────────────────────────────────────
  {
    title: "09 // Securing the CI/CD Pipeline Itself",
    summary: "The pipeline that builds everything is a top attack target — how to protect runners, credentials, and build integrity so the security tooling can't be turned against you.",
    content: `
      <h2>The pipeline is the crown jewels</h2>
      <p>So far you've used the CI/CD pipeline as the place to <em>run</em> security checks. Now flip the perspective: the pipeline itself is one of the most valuable targets in the entire organisation. It has credentials to your cloud, permission to deploy to production, and the trust of everyone downstream. If an attacker owns your pipeline, all the scanning in the world is moot — they can disable it and ship whatever they like. This is precisely the lesson of SolarWinds (Lesson 5).</p>

      <h3>What CI/CD is</h3>
      <p><strong>CI (Continuous Integration)</strong> automatically builds and tests every change. <strong>CD (Continuous Delivery/Deployment)</strong> automatically releases it. Platforms: <strong>GitHub Actions</strong>, <strong>GitLab CI</strong>, <strong>Jenkins</strong>, <strong>CircleCI</strong>, <strong>Argo CD</strong>. The pipeline is defined in code (e.g., a <code>.github/workflows/*.yml</code> file) — which means it's subject to all the same code risks, plus its own.</p>

      <h3>How pipelines get attacked</h3>
      <table>
        <thead><tr><th>Attack</th><th>Description</th></tr></thead>
        <tbody>
          <tr><td>Poisoned pipeline execution (PPE)</td><td>An attacker modifies the pipeline definition (or a script it runs) to execute malicious code with the pipeline's privileges.</td></tr>
          <tr><td>Credential/secret theft</td><td>Pipelines hold cloud keys and deploy tokens; a compromised job can exfiltrate them.</td></tr>
          <tr><td>Malicious dependencies / actions</td><td>A third-party CI plugin or GitHub Action, pulled by tag, is updated to malicious code (supply chain again).</td></tr>
          <tr><td>Compromised runner</td><td>A self-hosted runner reused across jobs can leak one job's data into another, or persist malware.</td></tr>
        </tbody>
      </table>

      <h3>Hardening the pipeline</h3>
      <ul>
        <li><strong>Least privilege for the pipeline</strong> — the build's cloud role should have only the permissions it needs, scoped to the specific resources it touches. Not admin.</li>
        <li><strong>Short-lived credentials via OIDC</strong> — instead of long-lived static keys stored as secrets, use <strong>OIDC federation</strong> so the pipeline gets a temporary, automatically-expiring token per run. Nothing durable to steal.</li>
        <li><strong>Pin third-party actions to a full commit SHA</strong> — <code>uses: actions/checkout@&lt;sha&gt;</code>, not <code>@v4</code>. A tag can be moved to point at malicious code; a SHA cannot.</li>
        <li><strong>Isolated, ephemeral runners</strong> — each job runs in a fresh, throwaway environment so nothing leaks between jobs or persists.</li>
        <li><strong>Protect the pipeline definition</strong> — require review for changes to workflow files; treat them as security-sensitive code.</li>
        <li><strong>Branch protection & signed commits</strong> — require reviews and verified authorship before code can trigger a privileged deploy.</li>
      </ul>

      <h3>Build integrity and provenance (SLSA)</h3>
      <p>The industry framework for this is <strong>SLSA</strong> (Supply-chain Levels for Software Artifacts, pronounced "salsa"). It defines increasing levels of assurance that a build was produced by a trusted, tamper-resistant process and can prove its own <strong>provenance</strong> — a verifiable record of how and from what an artifact was built. Combined with signing (cosign) and SBOMs, provenance lets a deploy step <em>verify</em> that what it's about to release is exactly what the trusted pipeline built.</p>

      <blockquote>The uncomfortable truth: a security pipeline an attacker can edit is not a security control — it's theatre. Securing the pipeline is what makes every other check in this course trustworthy. Protect the thing that protects everything else.</blockquote>
    `,
    quizzes: [
      { id: "dev-l9-q1", question: "Why is the CI/CD pipeline itself a high-value attack target?", options: ["It uses a lot of CPU", "It holds cloud credentials and can deploy to production, so owning it bypasses all other controls", "It is written in YAML", "It stores customer emails"], correctAnswerIndex: 1, explanation: "The pipeline has privileged access and downstream trust; compromising it lets an attacker disable checks and ship anything." },
      { id: "dev-l9-q2", question: "What is poisoned pipeline execution (PPE)?", options: ["A slow build", "An attacker modifying the pipeline definition or its scripts to run malicious code with the pipeline's privileges", "A failing unit test", "A container restart"], correctAnswerIndex: 1, explanation: "PPE abuses the pipeline's ability to execute code, running attacker payloads with the build's elevated permissions." },
      { id: "dev-l9-q3", question: "Why pin a third-party GitHub Action to a full commit SHA instead of a tag like @v4?", options: ["SHAs are shorter", "A tag can be moved to point at malicious code, but a specific SHA cannot change", "Tags cost money", "SHAs run faster"], correctAnswerIndex: 1, explanation: "Tags are mutable; pinning to an immutable commit SHA prevents a silent malicious update of the action." },
      { id: "dev-l9-q4", question: "What is the benefit of OIDC federation for pipeline credentials?", options: ["It removes the need for any authentication", "The pipeline gets short-lived, auto-expiring tokens per run instead of long-lived static keys to steal", "It makes builds slower", "It encrypts the source code"], correctAnswerIndex: 1, explanation: "OIDC issues temporary per-run credentials, so there's no durable secret sitting in the pipeline to exfiltrate." },
      { id: "dev-l9-q5", question: "Why use ephemeral, isolated runners?", options: ["They are cheaper only", "A fresh throwaway environment per job prevents data leaking between jobs or malware persisting", "They run more jobs at once", "They disable scanning"], correctAnswerIndex: 1, explanation: "Ephemeral runners are destroyed after use, so one job can't contaminate or persist into another." },
      { id: "dev-l9-q6", question: "What principle should govern the pipeline's cloud permissions?", options: ["Give it admin to be safe", "Least privilege — only the permissions it needs, scoped to what it touches", "No permissions at all", "Share one key across all pipelines"], correctAnswerIndex: 1, explanation: "Least privilege limits the blast radius if the pipeline is compromised." },
      { id: "dev-l9-q7", question: "What does SLSA provide?", options: ["A password wordlist", "A framework of assurance levels and provenance proving an artifact came from a trusted, tamper-resistant build", "A container runtime", "A DAST scanner"], correctAnswerIndex: 1, explanation: "SLSA defines build-integrity levels and provenance so you can verify how and from what an artifact was built." },
      { id: "dev-l9-q8", question: "Why should changes to the pipeline definition (workflow files) require review?", options: ["They are hard to read", "The pipeline definition is security-sensitive code; an unreviewed change can inject a PPE attack", "YAML is deprecated", "To slow down developers"], correctAnswerIndex: 1, explanation: "Workflow files execute with pipeline privileges, so they must be treated and reviewed as security-critical code." },
    ],
  },

  // ── LESSON 10 ──────────────────────────────────────────────────────────────
  {
    title: "10 // Security Gates & Policy-as-Code",
    summary: "Turning scan findings into automated decisions — how to codify security policy, choose what to block vs warn, and enforce it without grinding delivery to a halt.",
    content: `
      <h2>Findings are useless until they change a decision</h2>
      <p>You've now got SAST, SCA, secrets, IaC, and image scanners all producing findings. The final DevSecOps skill is turning that flood of information into <strong>automated decisions</strong>: should this build proceed, or stop? That decision point is a <strong>security gate</strong>, and the rules behind it are <strong>policy-as-code</strong>.</p>

      <h3>What a security gate is</h3>
      <p>A gate is a checkpoint in the pipeline that evaluates findings against a policy and either <strong>passes</strong>, <strong>warns</strong>, or <strong>fails (blocks)</strong> the build. The ARCH-X mission ends with exactly this: "confirm the pipeline security checks pass." A build that fails the gate cannot be deployed.</p>

      <h3>Policy-as-code: rules you can version and test</h3>
      <p>Rather than a policy living in a wiki page nobody reads, <strong>policy-as-code</strong> expresses security rules as machine-executable code — versioned, reviewed, and tested like any other code. The dominant engine is <strong>Open Policy Agent (OPA)</strong>, which uses a language called <strong>Rego</strong>. A conceptual policy might read:</p>
      <pre><code># Conceptual policy (Rego-style pseudocode)
deny[msg] {
  input.vulnerability.severity == "CRITICAL"
  msg := "Build blocked: a CRITICAL vulnerability was found."
}

deny[msg] {
  input.secret_detected == true
  msg := "Build blocked: a hardcoded secret was detected."
}</code></pre>
      <p>Related tools: <strong>Conftest</strong> (OPA for config files), <strong>Kyverno</strong> and <strong>OPA Gatekeeper</strong> (policy enforcement inside Kubernetes admission control).</p>

      <h3>The hard part: what to block vs what to warn</h3>
      <p>This is the judgement call that separates a working DevSecOps program from a hated one. Block on everything, and developers drown in false-positive failures, lose trust, and route around the gate — the exact failure mode DevSecOps was invented to fix. Block on nothing, and the gate is decorative. A pragmatic policy:</p>
      <table>
        <thead><tr><th>Finding</th><th>Gate action</th><th>Rationale</th></tr></thead>
        <tbody>
          <tr><td>Hardcoded secret detected</td><td><strong>Fail</strong></td><td>Near-zero false positives; catastrophic if shipped.</td></tr>
          <tr><td>Critical CVE with a fix available</td><td><strong>Fail</strong></td><td>High risk and the team can act on it.</td></tr>
          <tr><td>Medium/low CVE, no fix yet</td><td><strong>Warn</strong></td><td>Track it, but blocking helps no one if no patch exists.</td></tr>
          <tr><td>New SAST style finding</td><td><strong>Warn → Fail later</strong></td><td>Introduce as a warning, tune out noise, then enforce.</td></tr>
        </tbody>
      </table>

      <h3>Baselining and exceptions</h3>
      <p>You rarely start clean. A mature rollout <strong>baselines</strong> existing findings (grandfather them, block only <em>new</em> ones so the backlog doesn't halt all work) and provides a documented, auditable <strong>exception process</strong> for accepted risks — with an owner and an expiry date, never a silent permanent bypass. Security is risk management, not absolutism.</p>

      <h3>Metrics that matter</h3>
      <ul>
        <li><strong>Mean time to remediate (MTTR)</strong> — how fast findings get fixed, the real measure of program health.</li>
        <li><strong>Escape rate</strong> — how many issues reach production despite the gates (your false-negative reality check).</li>
        <li><strong>False-positive rate</strong> — high values predict developers disabling the tooling.</li>
        <li><strong>Coverage</strong> — what fraction of repos/pipelines the gates actually protect.</li>
      </ul>

      <blockquote>The whole course lands here. Threat modeling told you what to worry about; SAST/DAST/IAST, SCA, secrets, IaC, and image scanning found the problems; a secured pipeline made the findings trustworthy; and policy-as-code gates turn them into enforced, automated decisions — at the speed of delivery, without becoming the department of 'no' all over again.</blockquote>
    `,
    quizzes: [
      { id: "dev-l10-q1", question: "What is a security gate in a pipeline?", options: ["A physical door", "A checkpoint that evaluates findings against policy and passes, warns, or blocks the build", "A type of firewall", "A logging format"], correctAnswerIndex: 1, explanation: "A security gate is a pipeline decision point that can stop a build that violates policy from being deployed." },
      { id: "dev-l10-q2", question: "What is policy-as-code?", options: ["Writing laws for a country", "Expressing security rules as versioned, testable, machine-executable code", "Deleting all policies", "A container base image"], correctAnswerIndex: 1, explanation: "Policy-as-code turns security rules into code that is versioned, reviewed, and executed automatically." },
      { id: "dev-l10-q3", question: "Which engine and language are most associated with policy-as-code?", options: ["Docker and YAML", "Open Policy Agent (OPA) and Rego", "Terraform and HCL", "Git and Bash"], correctAnswerIndex: 1, explanation: "OPA is the dominant policy engine and uses the Rego language to express policies." },
      { id: "dev-l10-q4", question: "Why is blocking the build on EVERY finding a bad strategy?", options: ["It is too fast", "Developers drown in false positives, lose trust, and route around the gate", "It saves too much money", "It improves morale"], correctAnswerIndex: 1, explanation: "Over-blocking recreates the 'department of no'; developers bypass gates they don't trust, defeating the purpose." },
      { id: "dev-l10-q5", question: "A hardcoded secret detection should typically trigger which gate action?", options: ["Warn only", "Fail the build — near-zero false positives and catastrophic if shipped", "Ignore it", "Auto-approve"], correctAnswerIndex: 1, explanation: "Secret findings are high-confidence and high-impact, so failing the build is the appropriate hard gate." },
      { id: "dev-l10-q6", question: "Why 'baseline' existing findings when rolling out gates?", options: ["To delete them all", "To block only new findings so the existing backlog doesn't halt all delivery", "To hide them from auditors", "To increase false positives"], correctAnswerIndex: 1, explanation: "Baselining grandfathers current issues and enforces on new ones, enabling progress without a total work stoppage." },
      { id: "dev-l10-q7", question: "A good security exception should always have…", options: ["A permanent silent bypass", "An owner and an expiry date, documented and auditable", "No documentation", "Admin credentials attached"], correctAnswerIndex: 1, explanation: "Accepted risks need an owner and expiry so exceptions are revisited, not forgotten as permanent holes." },
      { id: "dev-l10-q8", question: "Which metric best measures the ongoing health of a DevSecOps program?", options: ["Number of tools purchased", "Mean time to remediate (MTTR) — how fast findings actually get fixed", "Lines of policy code", "Number of Slack channels"], correctAnswerIndex: 1, explanation: "MTTR captures whether findings translate into timely fixes, the real indicator of a functioning program." },
    ],
  },
];
