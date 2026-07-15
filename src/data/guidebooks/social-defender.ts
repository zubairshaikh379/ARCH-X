// ─────────────────────────────────────────────────────────────────────────────
// SOCIAL ENGINEERING DEFENSE — DEEP GUIDEBOOK (ARCH-X textbook-grade course)
//
// Content is authored as SEMANTIC HTML and rendered inside `.md-content`
// (see src/index.css) — h2/h3/p/ul/ol/li/pre/code/table/blockquote/strong are
// all styled there, so lessons render correctly without relying on Tailwind
// class scanning.
//
// Structure mirrors a real syllabus: Intro → Psychology → Phishing family →
// Voice/SMS → Pretexting → BEC → Email forensics → Awareness culture →
// Technical controls → Simulation programs → Incident handling. Each lesson
// ends with an 8-question knowledge check.
//
// Framing is strictly DEFENSIVE: recognise and defend against social
// engineering. No persuasive attack scripts are provided.
// ─────────────────────────────────────────────────────────────────────────────

import type { Course } from "../courses";

type Lesson = Course["lessons"][number];

// New optional Overview fields (spread into the social-defender course object).
export const META: Pick<
  Course,
  "prerequisites" | "learningOutcomes" | "mustKnow" | "commonGaps" | "prosCons" | "careerNotes"
> = {
  prerequisites: [
    "Everyday familiarity with email and a phone — you've received a suspicious message before, and that instinct is the seed we grow.",
    "A rough mental model of how email travels: someone sends, a server relays, you receive. No protocol expertise required.",
    "Comfort reading plain text carefully — most of this discipline is noticing small details others skim past.",
    "No prior security experience needed — every concept, from SPF to Cialdini, is built up from zero.",
  ],
  learningOutcomes: [
    "Name the psychological levers (authority, urgency, scarcity, reciprocity) an attacker pulls, and feel them being pulled on you.",
    "Tell phishing, spear phishing, and whaling apart by their targeting, effort, and lure — with evidence, not vibes.",
    "Read a raw email header top-to-bottom and reconstruct the true path a message took to your inbox.",
    "Interpret SPF, DKIM, and DMARC results and explain exactly what each does and does NOT prove.",
    "Recognise vishing, smishing, pretexting, and Business Email Compromise before the money leaves the building.",
    "Run a healthy reporting culture and a phishing-simulation program that teaches rather than punishes.",
    "Execute the first hour of response to a successful phish — contain, reset, and preserve evidence in the right order.",
  ],
  mustKnow: [
    "Cialdini's principles", "Pretext", "Phishing", "Spear phishing", "Whaling",
    "Vishing", "Smishing", "BEC", "T1566 Phishing", "T1566.001 Spearphishing Attachment",
    "T1566.002 Spearphishing Link", "T1598 Phishing for Information", "SPF", "DKIM", "DMARC",
    "Return-Path vs From", "Display-name spoofing", "Lookalike / homograph domains",
    "Report button", "Human firewall", "Click-rate vs report-rate", "MFA fatigue",
  ],
  commonGaps: [
    "Treating the 'From' line as truth. Beginners judge a sender by the friendly display name; attackers know that and forge it freely. The envelope, not the label, tells the story.",
    "Thinking a green 'SPF pass' means 'safe'. Authentication proves a domain sent the mail, not that the mail is honest — attackers pass SPF on domains they legitimately own.",
    "Blaming the clicker. Cultures that punish victims drive incidents underground; the report that comes 30 seconds after a click is worth more than the click never happening.",
    "Focusing only on email. Vishing and smishing bypass every email control you built, and the same person who'd never click a link will read a code aloud to a confident 'IT' caller.",
    "Chasing click-rate as the only metric. A simulation program that optimises clicks while ignoring report-rate trains people to stay silent, which is the opposite of resilience.",
    "Stopping at 'don't click'. The mission is a fast, blameless reporting reflex and layered technical controls — awareness alone, without a report button and mail filtering behind it, is a poster on a wall.",
  ],
  prosCons: {
    pros: [
      "Human-layer defence stops attacks that sail straight past firewalls and endpoint tools — social engineering targets people, not ports.",
      "The core skills (header reading, lure recognition, healthy reporting) are cheap, universal, and pay off on the very first real phish.",
      "A trained, reporting workforce becomes a distributed sensor network — thousands of eyes that no automated filter can match.",
    ],
    cons: [
      "Humans are variable: the same person who reports a phish on Monday clicks one on a stressful Friday. You manage risk, you never eliminate it.",
      "Attackers iterate faster than training cycles; a lure that worked yesterday is rewritten today, so awareness needs constant refresh.",
      "Authentication and filtering reduce spoofing but cannot judge intent — a perfectly authenticated email from a compromised partner is still hostile.",
    ],
  },
  careerNotes:
    "Social-engineering defence sits at the crossroads of the SOC, the awareness/security-culture function, and incident response — and it is one of the most accessible on-ramps into security. Tier-1 SOC analysts triage reported phish daily; Security Awareness Managers run the training and simulation programs; email-security and detection engineers tune the technical controls; and IR teams handle the successful compromises. Certs that map well to this material: CompTIA Security+, SANS SEC450/FOR500 for the analysis side, and vendor awareness credentials (KnowBe4, Proofpoint). In most markets an analyst who can confidently read a header and run a phishing report queue is employable within 0–2 years; the ones who advance fastest pair technical email forensics with the softer skill of building a blameless reporting culture.",
};

export const LESSONS: Lesson[] = [
  // ── LESSON 1 ───────────────────────────────────────────────────────────────
  {
    title: "01 // The Human Attack Surface",
    summary: "Why attackers target people instead of software, what social engineering really is, and the defensive mission of this course.",
    content: `
      <h2>The door that firewalls can't lock</h2>
      <p>You can patch a server, encrypt a database, and buy the best firewall on the market — and an attacker can still walk straight in by convincing a human to open the door. That is <strong>social engineering</strong>: the manipulation of people into performing actions or revealing information that benefits an attacker. It is not a technical exploit against a machine; it is a psychological exploit against a person.</p>

      <p>This course puts you on the defensive side of that fight. You are not learning to deceive people — you are learning to <em>recognise</em> deception, defend against it, and help an entire organisation build resilience. Every technique here is framed the way a defender needs it: what does the attack look like from the inside of the target's inbox, and how do you catch it?</p>

      <h3>Why humans, not code?</h3>
      <p>Attackers are economically rational. They take the cheapest path to their goal, and for most organisations that path runs through people:</p>
      <ul>
        <li><strong>Technical defences have improved.</strong> Modern operating systems and browsers are hard to exploit directly. Humans have not been "patched".</li>
        <li><strong>People are reachable.</strong> Every employee has an email address and a phone. That is a direct channel into the organisation that no firewall fully blocks.</li>
        <li><strong>One success is enough.</strong> A defender must protect thousands of people every day; an attacker needs just one of them to click once.</li>
        <li><strong>Trust is the default.</strong> Human society runs on trust and helpfulness. Attackers weaponise exactly the instincts that make us good colleagues.</li>
      </ul>

      <blockquote>Industry incident reports consistently find that the large majority of breaches involve a human element — a click, a credential handed over, a payment approved. The human layer isn't a footnote to security; it is the front line.</blockquote>

      <h3>The vocabulary you'll master</h3>
      <p>Social engineering has a family of named techniques. You'll meet each in depth, but here's the map:</p>
      <table>
        <thead><tr><th>Term</th><th>One-line meaning</th></tr></thead>
        <tbody>
          <tr><td><strong>Phishing</strong></td><td>Mass deceptive email casting a wide net.</td></tr>
          <tr><td><strong>Spear phishing</strong></td><td>Targeted phishing tailored to a specific person.</td></tr>
          <tr><td><strong>Whaling</strong></td><td>Spear phishing aimed at senior executives.</td></tr>
          <tr><td><strong>Vishing</strong></td><td>Voice phishing — the attack arrives by phone call.</td></tr>
          <tr><td><strong>Smishing</strong></td><td>SMS/text phishing.</td></tr>
          <tr><td><strong>Pretexting</strong></td><td>Inventing a believable false scenario to justify the request.</td></tr>
          <tr><td><strong>BEC</strong></td><td>Business Email Compromise — impersonating a trusted party to redirect money.</td></tr>
        </tbody>
      </table>

      <h3>The defensive mission</h3>
      <p>Defence against social engineering has two halves, and you need both:</p>
      <ol>
        <li><strong>The human firewall</strong> — people trained to notice manipulation and, crucially, to <em>report</em> it quickly and without fear.</li>
        <li><strong>Technical controls</strong> — email authentication (SPF/DKIM/DMARC), filtering, MFA, and process safeguards that catch what people miss.</li>
      </ol>

      <p>By the capstone you will read a phishing email like a forensic analyst, explain why it slipped through or got caught, and run the response when someone falls for one. This first lesson just sets the frame: the attack surface you are defending is made of people, and defending it is a legitimate, learnable craft.</p>
    `,
    quizzes: [
      { id: "se-l1-q1", question: "What is social engineering?", options: ["A technical exploit against server software", "The manipulation of people into actions or disclosures that benefit an attacker", "A type of encryption", "A network scanning technique"], correctAnswerIndex: 1, explanation: "Social engineering targets humans psychologically rather than exploiting machines technically." },
      { id: "se-l1-q2", question: "Why do attackers often target people instead of software?", options: ["People are cheaper to exploit and can't be 'patched' like software", "Software is always unbreakable", "People have no access to systems", "It is illegal to attack software"], correctAnswerIndex: 0, explanation: "Hardened software pushes attackers toward the human layer, which remains reachable and un-patchable." },
      { id: "se-l1-q3", question: "In this course, are you learning to deceive people or to defend against deception?", options: ["To deceive people", "To defend — recognise and counter social engineering", "Neither", "To sell software"], correctAnswerIndex: 1, explanation: "The course is strictly defensive: recognise manipulation and build organisational resilience." },
      { id: "se-l1-q4", question: "What is the asymmetry between attacker and defender?", options: ["Both must succeed every time", "The defender must protect everyone always; the attacker needs one success", "The attacker must protect everyone", "There is no asymmetry"], correctAnswerIndex: 1, explanation: "Defenders must be right constantly across the whole workforce; an attacker needs a single click." },
      { id: "se-l1-q5", question: "Which term describes phishing aimed specifically at senior executives?", options: ["Smishing", "Whaling", "Vishing", "Pretexting"], correctAnswerIndex: 1, explanation: "Whaling is spear phishing that targets high-value executives ('big fish')." },
      { id: "se-l1-q6", question: "What does 'human firewall' refer to?", options: ["A hardware appliance", "People trained to notice and report manipulation", "A type of antivirus", "A password manager"], correctAnswerIndex: 1, explanation: "The human firewall is a workforce trained to detect and quickly report social-engineering attempts." },
      { id: "se-l1-q7", question: "Effective defence against social engineering requires which combination?", options: ["Only technical controls", "Only awareness training", "Both a trained, reporting workforce and technical controls", "Neither — it's unstoppable"], correctAnswerIndex: 2, explanation: "The human firewall and technical controls (auth, filtering, MFA) reinforce each other." },
      { id: "se-l1-q8", question: "Why is human trust exploited so effectively by attackers?", options: ["Trust is illegal", "Society and workplaces run on trust and helpfulness, which attackers weaponise", "Nobody trusts anyone", "Trust only exists online"], correctAnswerIndex: 1, explanation: "Attackers exploit the very cooperative instincts that make people good colleagues." },
    ],
  },

  // ── LESSON 2 ───────────────────────────────────────────────────────────────
  {
    title: "02 // The Psychology of Influence",
    summary: "Cialdini's six principles of influence and the emotional triggers that attackers pull — and how naming them defuses them.",
    content: `
      <h2>Why smart people fall for it</h2>
      <p>The most important thing to understand about social engineering is that victims are not stupid. They are <em>human</em>. Attackers exploit deep, universal mental shortcuts that normally serve us well. The best defence is to know these shortcuts by name — because a lever you can see being pulled loses much of its power.</p>

      <h3>Cialdini's six principles of influence</h3>
      <p>Psychologist Robert Cialdini catalogued six principles of persuasion. Legitimate marketers use them; so do attackers. Learn them as a defender's checklist:</p>
      <table>
        <thead><tr><th>Principle</th><th>How it works</th><th>Attacker's use</th></tr></thead>
        <tbody>
          <tr><td><strong>Authority</strong></td><td>We defer to figures of power/expertise.</td><td>"This is the CEO." / "IT Support here."</td></tr>
          <tr><td><strong>Urgency / Scarcity</strong></td><td>Limited time or supply short-circuits careful thought.</td><td>"Your account will be closed in 24 hours."</td></tr>
          <tr><td><strong>Social proof</strong></td><td>We copy what others appear to be doing.</td><td>"All staff have already updated their password."</td></tr>
          <tr><td><strong>Liking</strong></td><td>We say yes to people we like or find similar.</td><td>Friendly, flattering, or familiar-seeming senders.</td></tr>
          <tr><td><strong>Reciprocity</strong></td><td>We feel obliged to return favours.</td><td>"I fixed your ticket — just confirm your login for me."</td></tr>
          <tr><td><strong>Commitment / Consistency</strong></td><td>We act consistently with prior small commitments.</td><td>Small first request, then a bigger one.</td></tr>
        </tbody>
      </table>

      <h3>The emotional triggers</h3>
      <p>Underneath the principles, attackers aim at raw emotions that suppress the slow, careful part of your brain:</p>
      <ul>
        <li><strong>Fear</strong> — "Your account has been hacked." A frightened person acts before thinking.</li>
        <li><strong>Greed / curiosity</strong> — "You've won a prize" or "Confidential — see attached."</li>
        <li><strong>Urgency</strong> — the single most common trigger; it exists purely to stop you pausing.</li>
        <li><strong>Helpfulness</strong> — most people <em>want</em> to assist a colleague in a bind; attackers manufacture the bind.</li>
      </ul>

      <blockquote>Defensive heartbeat of this whole course: <strong>urgency plus a request equals suspicion.</strong> When a message pressures you to act <em>right now</em> and also asks for money, credentials, or data, that combination is itself the red flag — regardless of how legitimate it looks.</blockquote>

      <h3>System 1 vs System 2</h3>
      <p>Psychologists describe two modes of thinking. <strong>System 1</strong> is fast, automatic, emotional. <strong>System 2</strong> is slow, deliberate, analytical. Social engineering is engineered to keep you in System 1 — reacting — and away from System 2, where you'd notice the misspelled domain. Every urgency cue, every scary subject line, is a nudge to stay reactive.</p>

      <h3>The defender's counter-move: name it and slow it</h3>
      <p>The practical defence is almost embarrassingly simple:</p>
      <ol>
        <li><strong>Notice the emotion.</strong> Feeling a jolt of fear or urgency from a message is itself a signal to slow down.</li>
        <li><strong>Name the principle.</strong> "This is using authority and urgency." Naming it re-engages System 2.</li>
        <li><strong>Verify through a second channel.</strong> If "the CEO" emails an urgent wire request, call the CEO on a known number. Never verify a suspicious message using contact details <em>inside</em> that same message.</li>
      </ol>
    `,
    quizzes: [
      { id: "se-l2-q1", question: "Who catalogued the six principles of influence used in this lesson?", options: ["Bruce Schneier", "Robert Cialdini", "Kevin Mitnick", "Alan Turing"], correctAnswerIndex: 1, explanation: "Robert Cialdini's principles of persuasion (authority, scarcity, social proof, liking, reciprocity, commitment) are foundational here." },
      { id: "se-l2-q2", question: "An email claiming to be from the CEO exploits which principle?", options: ["Scarcity", "Authority", "Reciprocity", "Liking"], correctAnswerIndex: 1, explanation: "Impersonating a powerful figure exploits the Authority principle — we defer to perceived power." },
      { id: "se-l2-q3", question: "Why is urgency such a common ingredient in phishing?", options: ["It makes emails shorter", "It pressures the target to act before thinking carefully", "It is required by email standards", "It improves deliverability"], correctAnswerIndex: 1, explanation: "Urgency suppresses deliberate (System 2) thinking, pushing the target to react impulsively." },
      { id: "se-l2-q4", question: "'All your colleagues have already done this' leverages which principle?", options: ["Social proof", "Authority", "Scarcity", "Commitment"], correctAnswerIndex: 0, explanation: "Social proof exploits our tendency to copy what others appear to be doing." },
      { id: "se-l2-q5", question: "In dual-process theory, which mode does social engineering try to keep you in?", options: ["System 2 (slow, analytical)", "System 1 (fast, emotional, reactive)", "Neither", "Both equally"], correctAnswerIndex: 1, explanation: "Attacks keep you reacting in System 1 and away from the analytical System 2 that would spot the trick." },
      { id: "se-l2-q6", question: "What is the safest way to verify a suspicious urgent request from 'your CEO'?", options: ["Reply to the email", "Call the number listed in the email", "Contact the CEO via a known, independent channel", "Just comply to be safe"], correctAnswerIndex: 2, explanation: "Verify out-of-band using trusted contact details — never those provided inside the suspicious message." },
      { id: "se-l2-q7", question: "Which combination is described as the course's core red flag?", options: ["A long email with images", "Urgency combined with a request for money, credentials, or data", "Any email from outside the company", "An email sent after hours"], correctAnswerIndex: 1, explanation: "Pressure to act immediately plus a sensitive request is itself the warning sign." },
      { id: "se-l2-q8", question: "Why does naming the principle help you defend?", options: ["It reports the attacker automatically", "It re-engages deliberate thinking (System 2), defusing the manipulation", "It encrypts the email", "It blocks the sender"], correctAnswerIndex: 1, explanation: "Consciously naming the lever being pulled shifts you back into analytical thinking." },
    ],
  },

  // ── LESSON 3 ───────────────────────────────────────────────────────────────
  {
    title: "03 // The Phishing Family: Mass, Spear, and Whale",
    summary: "How phishing scales from indiscriminate bulk email to hand-crafted attacks on named executives — and the log/ATT&CK fingerprints of each.",
    content: `
      <h2>One technique, many scales</h2>
      <p>Phishing is deceptive communication that lures a target into clicking a link, opening an attachment, or handing over information. It is the single most common initial-access vector, mapped in MITRE ATT&CK as <strong>T1566 Phishing</strong>. What changes across the family is <em>targeting and effort</em> — and that changes how you detect and defend.</p>

      <h3>The spectrum</h3>
      <table>
        <thead><tr><th>Type</th><th>Targeting</th><th>Effort per target</th><th>Typical lure</th></tr></thead>
        <tbody>
          <tr><td><strong>Bulk phishing</strong></td><td>Anyone — millions of addresses</td><td>Almost none</td><td>Generic "your account is locked", fake parcel delivery.</td></tr>
          <tr><td><strong>Spear phishing</strong></td><td>A specific person or small group</td><td>High — researched</td><td>References your real projects, boss, or vendors.</td></tr>
          <tr><td><strong>Whaling</strong></td><td>Senior executives (CEO, CFO)</td><td>Very high</td><td>Board matters, confidential deals, wire transfers.</td></tr>
        </tbody>
      </table>

      <h3>Bulk phishing: the wide net</h3>
      <p>Bulk campaigns blast the same message to huge lists. Quality is low — generic greetings ("Dear Customer"), obvious errors, mismatched branding. The economics work because even a 0.1% click rate across millions of recipients is a large payday. As a defender, these are mostly caught by filters and are the easy end of the spectrum.</p>

      <h3>Spear phishing: the aimed spear</h3>
      <p>Here the attacker does <strong>reconnaissance</strong> first — LinkedIn, the company website, social media, past breaches — to learn your name, role, colleagues, and current projects. The email then references real details, which is exactly what makes it convincing. In ATT&CK, the delivery sub-techniques are:</p>
      <ul>
        <li><strong>T1566.001 Spearphishing Attachment</strong> — a malicious file (a fake invoice, a booby-trapped document).</li>
        <li><strong>T1566.002 Spearphishing Link</strong> — a link to a credential-harvesting or malware page.</li>
        <li><strong>T1566.003 Spearphishing via Service</strong> — delivered over social media / third-party messaging rather than corporate email.</li>
      </ul>
      <p>A related technique, <strong>T1598 Phishing for Information</strong>, doesn't deliver a payload at all — it simply tricks the target into revealing information (org charts, schedules, credentials) that fuels a later attack.</p>

      <h3>Whaling: hunting the big fish</h3>
      <p>Whaling is spear phishing tuned for executives. Executives are attractive because they have authority (their instructions get obeyed), access (to money and sensitive data), and often less patience for security friction. A whaling email is typically quiet, professional, and free of the crude errors of bulk phishing — which is precisely why it's dangerous.</p>

      <blockquote>Defender's inversion: the <strong>better written and more relevant</strong> a suspicious email is, the <em>more</em> effort someone spent targeting you — which can mean higher, not lower, risk. Polish is not proof of legitimacy.</blockquote>

      <h3>What defence looks like at each scale</h3>
      <ul>
        <li><strong>Bulk</strong> — technical filtering does most of the work; user reporting mops up stragglers.</li>
        <li><strong>Spear</strong> — filters help less because volume is tiny and content is tailored; trained, suspicious humans matter most.</li>
        <li><strong>Whaling</strong> — add process controls (dual approval for payments) and executive-specific coaching, because the target may be your least reachable trainee.</li>
      </ul>
    `,
    quizzes: [
      { id: "se-l3-q1", question: "Which MITRE ATT&CK technique covers phishing broadly?", options: ["T1110 Brute Force", "T1566 Phishing", "T1486 Data Encrypted for Impact", "T1078 Valid Accounts"], correctAnswerIndex: 1, explanation: "T1566 Phishing is the ATT&CK technique for deceptive delivery via message." },
      { id: "se-l3-q2", question: "What primarily distinguishes spear phishing from bulk phishing?", options: ["It uses no links", "It is targeted and researched for a specific person or group", "It is always sent by SMS", "It is legal"], correctAnswerIndex: 1, explanation: "Spear phishing tailors the message to a specific target using reconnaissance." },
      { id: "se-l3-q3", question: "Whaling specifically targets whom?", options: ["Random members of the public", "Senior executives", "IT interns only", "Automated systems"], correctAnswerIndex: 1, explanation: "Whaling aims at high-value executives who hold authority and access." },
      { id: "se-l3-q4", question: "A malicious file attached to a targeted email maps to which sub-technique?", options: ["T1566.001 Spearphishing Attachment", "T1566.002 Spearphishing Link", "T1598 Phishing for Information", "T1110 Brute Force"], correctAnswerIndex: 0, explanation: "T1566.001 covers delivery via a malicious attachment." },
      { id: "se-l3-q5", question: "What is T1598 Phishing for Information?", options: ["Delivering ransomware", "Tricking a target into revealing information without delivering a payload", "Scanning ports", "Encrypting email"], correctAnswerIndex: 1, explanation: "T1598 elicits useful information (credentials, org data) rather than delivering malware directly." },
      { id: "se-l3-q6", question: "Why is a highly polished, relevant suspicious email potentially MORE dangerous?", options: ["Polish guarantees legitimacy", "High polish signals high targeting effort, which can mean higher risk", "It is always a false alarm", "Polished emails can't contain links"], correctAnswerIndex: 1, explanation: "Effort and relevance indicate targeting; polish is not evidence of legitimacy." },
      { id: "se-l3-q7", question: "Why do bulk phishing campaigns work despite low quality?", options: ["Filters never catch them", "Even a tiny click rate across millions of recipients yields many victims", "They are personally researched", "They only target executives"], correctAnswerIndex: 1, explanation: "Massive volume makes even a 0.1% success rate profitable." },
      { id: "se-l3-q8", question: "Which control matters MOST against a well-crafted spear-phishing email?", options: ["Bulk spam filters alone", "Trained, suspicious humans who verify before acting", "Ignoring all outside email", "Faster internet"], correctAnswerIndex: 1, explanation: "Low-volume, tailored emails evade filters, so human vigilance is the key defence." },
    ],
  },

  // ── LESSON 4 ───────────────────────────────────────────────────────────────
  {
    title: "04 // Beyond the Inbox: Vishing and Smishing",
    summary: "How phishing jumps to phone calls and text messages, why these channels bypass email controls, and how to defend the voice and SMS surface.",
    content: `
      <h2>The attack that rings your phone</h2>
      <p>Email is the classic channel, but attackers follow their targets everywhere. Two channels deserve their own lesson because they defeat every email control you'll build later: <strong>vishing</strong> (voice) and <strong>smishing</strong> (SMS). If your entire defence lives in the mail gateway, these walk around it.</p>

      <h3>Vishing — voice phishing</h3>
      <p>Vishing is social engineering by phone. A live human voice adds pressure, real-time improvisation, and authority that text can't match. Common defensive-awareness scenarios:</p>
      <ul>
        <li><strong>Fake IT support</strong> — "We've detected a virus on your machine; I need to walk you through a fix." The goal is remote access or your password.</li>
        <li><strong>Fake bank/fraud desk</strong> — "We've blocked a suspicious charge; confirm the code we just texted you." That code is a live MFA or transfer approval.</li>
        <li><strong>Callback phishing</strong> — an email tells you to phone a number about a "charge"; the number is the attacker's call centre. This hybrid dodges link-scanning entirely.</li>
      </ul>

      <h3>Caller ID is not identity</h3>
      <p>Attackers <strong>spoof caller ID</strong> so the incoming number displays as your bank, your company, or a local area code. The name on your screen is a claim, not proof — exactly like the display name in an email. Treat an inbound call asking for anything sensitive as unverified until <em>you</em> call back on a number you looked up independently.</p>

      <h3>Smishing — SMS phishing</h3>
      <p>Smishing uses text messages, and it's potent for specific reasons:</p>
      <ul>
        <li>Phones show <strong>truncated, unpreviewable links</strong> — you can't hover to inspect a URL as you would in a desktop mail client.</li>
        <li>Texts feel <strong>personal and urgent</strong>; people read them within minutes.</li>
        <li>Classic lures: "Your parcel couldn't be delivered — reschedule here", "Bank alert: verify this transaction", "Toll unpaid — pay now to avoid a fine".</li>
      </ul>
      <p>A typical smishing message reads like this:</p>
      <pre><code>USPS: Your package is on hold due to an unpaid fee ($1.99).
Update here: http://usps-redelivery-track.help/xz9

To defend, don't tap. Verify via the carrier's official app or a URL you type yourself.</code></pre>

      <h3>The MFA-fatigue and code-relay trap</h3>
      <p>A rising pattern combines channels: the attacker already has your password (from a leak or earlier phish) and needs only the second factor. They call, pose as IT, and either (a) spam you with push prompts hoping you approve one to make it stop — <strong>MFA fatigue</strong> — or (b) smoothly ask you to "read back the code we sent for verification." Handing over a one-time code by voice or text is the modern equivalent of giving away your password.</p>

      <blockquote>Iron rule for both channels: <strong>a legitimate organisation will never need you to read back a one-time code, password, or full card number to an inbound caller or text.</strong> The request itself is the attack.</blockquote>

      <h3>Defending the voice/SMS surface</h3>
      <ol>
        <li><strong>Verify by callback</strong> to an independently sourced number — never the one that contacted you.</li>
        <li><strong>Never read codes aloud.</strong> One-time codes are secrets; treat them like passwords.</li>
        <li><strong>Slow the call down.</strong> Attackers rely on momentum; "I'll call you back through the official line" ends most vishing instantly.</li>
        <li><strong>Report it.</strong> Vishing/smishing belong in the same reporting queue as email phishing so the SOC sees the full picture.</li>
      </ol>
    `,
    quizzes: [
      { id: "se-l4-q1", question: "What is vishing?", options: ["Phishing over video only", "Voice phishing — social engineering conducted by phone call", "A type of malware", "Phishing via fax"], correctAnswerIndex: 1, explanation: "Vishing is voice phishing, using phone calls to manipulate targets." },
      { id: "se-l4-q2", question: "What is smishing?", options: ["Phishing via SMS/text messages", "Phishing via printed mail", "A password-cracking tool", "A firewall rule"], correctAnswerIndex: 0, explanation: "Smishing is phishing delivered through SMS text messages." },
      { id: "se-l4-q3", question: "Why can't caller ID be trusted as proof of identity?", options: ["It is always blank", "Attackers can spoof the displayed number", "Phones don't show numbers", "It is encrypted"], correctAnswerIndex: 1, explanation: "Caller ID is spoofable, so the displayed number/name is a claim, not verification." },
      { id: "se-l4-q4", question: "Why is smishing especially effective on mobile devices?", options: ["Texts can't contain links", "Links are truncated/unpreviewable and texts feel urgent and personal", "Phones block all phishing", "SMS is encrypted end to end"], correctAnswerIndex: 1, explanation: "You can't easily inspect truncated links on a phone, and texts create urgency." },
      { id: "se-l4-q5", question: "What is 'MFA fatigue'?", options: ["A hardware failure in MFA tokens", "Spamming a user with push prompts until they approve one to stop the noise", "Forgetting your password", "A type of encryption"], correctAnswerIndex: 1, explanation: "Attackers flood approval prompts hoping the annoyed user accepts one." },
      { id: "se-l4-q6", question: "A caller claiming to be IT asks you to read back a one-time code. What should you do?", options: ["Read it back to be helpful", "Refuse — legitimate orgs never need you to read back OTP codes", "Ask them to hold and read it later", "Text it instead of speaking it"], correctAnswerIndex: 1, explanation: "One-time codes are secrets; a request to read one back is itself the attack." },
      { id: "se-l4-q7", question: "What is 'callback phishing'?", options: ["An email/text that lures you to phone an attacker-controlled number", "A phone that calls itself", "A returned voicemail", "A missed-call feature"], correctAnswerIndex: 0, explanation: "Callback phishing prompts the victim to call a fraudulent number, dodging link scanners." },
      { id: "se-l4-q8", question: "What is the safest way to handle an inbound call requesting sensitive action?", options: ["Comply immediately", "Hang up and call back on an independently sourced official number", "Give partial information only", "Ask for their employee ID and trust it"], correctAnswerIndex: 1, explanation: "Verify out-of-band by calling a number you looked up yourself, never the one that called you." },
    ],
  },

  // ── LESSON 5 ───────────────────────────────────────────────────────────────
  {
    title: "05 // Pretexting and Impersonation",
    summary: "The invented backstory that makes a request believable, common impersonation roles, and how to defend with verification and least privilege.",
    content: `
      <h2>The story is the weapon</h2>
      <p>Most social engineering rests on a <strong>pretext</strong>: a fabricated but believable scenario that justifies the attacker's request. Where phishing is a lure, pretexting is the <em>screenplay</em> around it. "I'm from IT and we're doing an emergency password reset" is a pretext. The stronger and more plausible the story, the more the target's guard drops.</p>

      <h3>Anatomy of a pretext</h3>
      <p>A convincing pretext usually combines four ingredients:</p>
      <table>
        <thead><tr><th>Ingredient</th><th>Purpose</th><th>Example</th></tr></thead>
        <tbody>
          <tr><td><strong>A role</strong></td><td>Borrowed authority or trust</td><td>"I'm the new auditor / from the help desk / your bank's fraud team."</td></tr>
          <tr><td><strong>A situation</strong></td><td>A reason the request makes sense</td><td>"We're migrating servers this weekend."</td></tr>
          <tr><td><strong>A request</strong></td><td>The actual goal</td><td>"I just need you to confirm your login."</td></tr>
          <tr><td><strong>Pressure</strong></td><td>Discourage verification</td><td>"The maintenance window closes in ten minutes."</td></tr>
        </tbody>
      </table>

      <h3>Common impersonation roles</h3>
      <ul>
        <li><strong>IT / help desk</strong> — the classic. People expect IT to ask about their computer, so requests for passwords or remote access feel normal.</li>
        <li><strong>Authority figures</strong> — executives, HR, legal, or "the auditor". Authority discourages pushback.</li>
        <li><strong>Trusted third parties</strong> — a vendor, a delivery company, a bank, a well-known SaaS provider.</li>
        <li><strong>New employee / colleague in a bind</strong> — "I just started and can't get into the system, can you help?" This flips helpfulness into a weapon.</li>
      </ul>

      <h3>Reconnaissance fuels the pretext</h3>
      <p>Good pretexts are built on real details harvested beforehand — names of managers, project code-names, office locations, the phone system's hold music, even the tone of internal emails. Public sources (company website, LinkedIn, social media, press releases) and data from prior breaches all feed this. Every true detail an attacker drops ("Is Priya still leading the Atlas migration?") buys credibility.</p>

      <h3>Physical pretexting: tailgating and props</h3>
      <p>Pretexting isn't only remote. In person, an attacker in a hi-vis vest carrying boxes ("delivery for the third floor") relies on the same borrowed role. <strong>Tailgating</strong> — following an authorised person through a secure door before it closes — exploits our reluctance to challenge a confident-looking stranger. A clipboard and a purposeful walk are, unfortunately, effective props.</p>

      <blockquote>Defensive core: <strong>verify the person, not the story.</strong> A pretext is designed to be plausible; plausibility is not proof. Confirm identity through an independent, trusted channel before acting on any sensitive request — no matter how reasonable the backstory sounds.</blockquote>

      <h3>Structural defences</h3>
      <ol>
        <li><strong>Verification procedures</strong> — a known, easy way to confirm that a caller/visitor is who they claim (callback lines, ticket numbers, escort policies).</li>
        <li><strong>Least privilege</strong> — if a tricked employee can't access much, a successful pretext yields little. Limiting access limits blast radius.</li>
        <li><strong>A culture where challenging is normal</strong> — "Can I verify who you are first?" should be praised, never treated as rude. Attackers rely on politeness; remove that lever.</li>
        <li><strong>No-exceptions rules</strong> — "IT will never ask for your password" is powerful precisely because it needs no judgement in the moment.</li>
      </ol>
    `,
    quizzes: [
      { id: "se-l5-q1", question: "What is a pretext in social engineering?", options: ["An email attachment", "A fabricated but believable scenario that justifies the attacker's request", "A firewall rule", "A password hash"], correctAnswerIndex: 1, explanation: "A pretext is the invented backstory that makes a malicious request seem legitimate." },
      { id: "se-l5-q2", question: "Which role is the classic impersonation for extracting passwords or remote access?", options: ["The office cleaner", "IT / help desk", "A random customer", "A journalist"], correctAnswerIndex: 1, explanation: "Impersonating IT support is classic because users expect IT to ask about their systems." },
      { id: "se-l5-q3", question: "Why do attackers perform reconnaissance before pretexting?", options: ["To fill time", "Real details (names, projects) make the pretext credible", "It is legally required", "To slow themselves down"], correctAnswerIndex: 1, explanation: "Accurate specifics harvested beforehand lend the story believability." },
      { id: "se-l5-q4", question: "What is tailgating?", options: ["Sending too many emails", "Following an authorised person through a secure door", "A brute-force attack", "A type of malware"], correctAnswerIndex: 1, explanation: "Tailgating is physically following someone through access control before the door closes." },
      { id: "se-l5-q5", question: "The core defensive principle against pretexting is to verify what?", options: ["The story's plausibility", "The person's identity through an independent channel", "The email's font", "The time of day"], correctAnswerIndex: 1, explanation: "Verify the person independently — plausibility of the story is not proof of identity." },
      { id: "se-l5-q6", question: "How does 'least privilege' limit pretexting damage?", options: ["It blocks all email", "A tricked employee with minimal access yields little to the attacker", "It encrypts passwords", "It speeds up logins"], correctAnswerIndex: 1, explanation: "Restricting access shrinks the blast radius when someone is successfully deceived." },
      { id: "se-l5-q7", question: "Why is a 'culture where challenging is normal' a defence?", options: ["It makes people rude", "It removes the politeness attackers rely on to avoid verification", "It slows down all work permanently", "It has no effect"], correctAnswerIndex: 1, explanation: "Attackers exploit our reluctance to challenge; normalising verification removes that lever." },
      { id: "se-l5-q8", question: "Why is the rule 'IT will never ask for your password' effective?", options: ["It is a legal requirement", "It gives a clear, no-judgement answer in the pressured moment", "It encrypts the password", "It blocks the attacker's IP"], correctAnswerIndex: 1, explanation: "Absolute, simple rules remove the need for in-the-moment judgement that pressure erodes." },
    ],
  },

  // ── LESSON 6 ───────────────────────────────────────────────────────────────
  {
    title: "06 // Business Email Compromise (BEC)",
    summary: "The high-value fraud that skips malware entirely — impersonating trusted parties to redirect payments — and the process controls that stop it.",
    content: `
      <h2>The scam that costs the most</h2>
      <p><strong>Business Email Compromise (BEC)</strong> is social engineering aimed at money and sensitive data, carried out by impersonating a trusted party in email. It rarely uses malware or malicious links — which is exactly why it slips past technical filters. Dollar for dollar, BEC is consistently among the most costly categories of cybercrime, causing losses measured in billions annually.</p>

      <h3>Why BEC is so dangerous</h3>
      <ul>
        <li><strong>No payload to detect.</strong> A plain-text email asking for a wire transfer contains nothing for antivirus or link-scanners to flag.</li>
        <li><strong>It abuses trust and process.</strong> The attack targets a normal business workflow (paying invoices, sending payroll) that employees are supposed to complete.</li>
        <li><strong>The amounts are large.</strong> A single successful wire redirect can move six or seven figures in one transaction.</li>
      </ul>

      <h3>Common BEC scenarios</h3>
      <table>
        <thead><tr><th>Scenario</th><th>How it plays out</th></tr></thead>
        <tbody>
          <tr><td><strong>CEO fraud</strong></td><td>Impersonating an executive to order an "urgent, confidential" wire transfer, pressuring finance to skip normal checks.</td></tr>
          <tr><td><strong>Vendor/invoice fraud</strong></td><td>Impersonating a supplier to send a "new bank account" for an outstanding invoice — future payments flow to the attacker.</td></tr>
          <tr><td><strong>Payroll diversion</strong></td><td>Posing as an employee asking HR to update direct-deposit details to the attacker's account.</td></tr>
          <tr><td><strong>Attorney/deal fraud</strong></td><td>Posing as legal counsel on a "confidential, time-sensitive" acquisition to justify secrecy and speed.</td></tr>
        </tbody>
      </table>

      <h3>Spoofing vs account takeover</h3>
      <p>BEC arrives two ways, and telling them apart matters:</p>
      <ul>
        <li><strong>Spoofing / lookalike domains</strong> — the email only <em>looks</em> like it's from the trusted party. The display name says "CEO Jane Doe" but the address is <code>jane.doe@arch-x-corp.co</code> (note <code>.co</code>, not <code>.com</code>), or a near-twin like <code>arcln-x.com</code>. The real account was never touched.</li>
        <li><strong>Account takeover (ATO)</strong> — the attacker has actually compromised a real mailbox (via an earlier phish) and sends from the genuine address. This is far harder to spot: authentication passes, the thread history is real, and colleagues are replied to in context.</li>
      </ul>
      <p>A spoofed lookalike header might read:</p>
      <pre><code>From: "Jane Doe, CEO" &lt;j.doe@arch-x-corp.co&gt;
Reply-To: j.doe.finance@gmail.com
Subject: Urgent — confidential wire needed before 3pm

Display name looks right; the domain (.co) and the Gmail Reply-To are the tells.</code></pre>

      <h3>The tells of a BEC email</h3>
      <ul>
        <li>Urgency and secrecy combined ("don't discuss this with anyone, handle it now").</li>
        <li>A change to payment details — new bank account, new routing number.</li>
        <li>A <strong>Reply-To</strong> that differs from the <strong>From</strong>, quietly routing replies to the attacker.</li>
        <li>Slightly-off domains, or a request that bypasses the normal approval path.</li>
        <li>Requests to switch channels ("just text me on this number").</li>
      </ul>

      <blockquote>The one control that defeats most BEC: <strong>out-of-band verification of any payment or bank-detail change.</strong> A phone call to a known number confirming "did you really send this?" costs sixty seconds and stops six-figure losses. Technology can't judge intent — process can.</blockquote>

      <h3>Process defences that actually work</h3>
      <ol>
        <li><strong>Dual authorisation</strong> for wire transfers above a threshold — two people, two approvals.</li>
        <li><strong>Mandatory callback verification</strong> for any change to payment details, using previously-known contact info.</li>
        <li><strong>External-sender banners</strong> so a lookalike domain visibly flags as outside the organisation.</li>
        <li><strong>DMARC enforcement</strong> (next lessons) to stop attackers spoofing your <em>own</em> domain.</li>
        <li><strong>A no-blame escalation path</strong> so finance staff feel safe pausing a "CEO" request to verify it.</li>
      </ol>
    `,
    quizzes: [
      { id: "se-l6-q1", question: "What is Business Email Compromise (BEC)?", options: ["A malware family", "Fraud impersonating a trusted party by email to redirect money or data", "A firewall misconfiguration", "A password-cracking method"], correctAnswerIndex: 1, explanation: "BEC uses impersonation in email to trick victims into payments or disclosures, usually without malware." },
      { id: "se-l6-q2", question: "Why does BEC often evade technical email filters?", options: ["It uses strong encryption", "It typically contains no malware or malicious links to detect", "Filters are always off", "It is sent by SMS"], correctAnswerIndex: 1, explanation: "Plain-text impersonation requests give antivirus and link-scanners nothing to flag." },
      { id: "se-l6-q3", question: "In 'CEO fraud', what is the attacker usually after?", options: ["Free software", "An urgent, confidential wire transfer approved without normal checks", "A new laptop", "A meeting invite"], correctAnswerIndex: 1, explanation: "CEO fraud pressures finance to push through an urgent transfer, bypassing controls." },
      { id: "se-l6-q4", question: "What is the difference between spoofing and account takeover in BEC?", options: ["They are identical", "Spoofing only mimics the sender; account takeover uses a genuinely compromised mailbox", "Spoofing needs malware; takeover doesn't", "Takeover is always harmless"], correctAnswerIndex: 1, explanation: "Spoofing/lookalikes fake the sender externally; ATO sends from the real, compromised account and is harder to detect." },
      { id: "se-l6-q5", question: "A 'Reply-To' address that differs from 'From' can indicate what?", options: ["A normal newsletter", "Replies being quietly routed to an attacker", "Stronger encryption", "A faster mail server"], correctAnswerIndex: 1, explanation: "A mismatched Reply-To can silently divert responses to the attacker." },
      { id: "se-l6-q6", question: "Which single control defeats most BEC payment fraud?", options: ["A better antivirus", "Out-of-band verification of payment or bank-detail changes", "Longer passwords", "Blocking all external email"], correctAnswerIndex: 1, explanation: "A callback to a known number confirming the request stops most fraudulent transfers." },
      { id: "se-l6-q7", question: "Why is vendor/invoice fraud dangerous over time?", options: ["It only works once", "Redirecting a supplier's bank details sends future payments to the attacker", "It deletes invoices", "It is easy for filters to catch"], correctAnswerIndex: 1, explanation: "Changing a trusted vendor's payment details can quietly divert ongoing payments." },
      { id: "se-l6-q8", question: "What does dual authorisation for wire transfers achieve?", options: ["It speeds up payments", "It requires two people to approve, so a single tricked employee can't complete fraud", "It encrypts the money", "It removes the need for verification"], correctAnswerIndex: 1, explanation: "Two-person approval means one deceived individual cannot single-handedly release funds." },
    ],
  },

  // ── LESSON 7 ───────────────────────────────────────────────────────────────
  {
    title: "07 // Reading an Email: Headers, SPF, DKIM, and DMARC",
    summary: "The forensic core — dissecting raw email headers, understanding the three authentication checks, and what each does and does NOT prove.",
    content: `
      <h2>The envelope tells the truth</h2>
      <p>This is the technical heart of the course. When you view an email normally you see a friendly display name and a subject. The <strong>raw headers</strong> underneath record the message's real journey and identity — and they are much harder to fake completely. Learning to read them turns you from a guesser into an analyst.</p>

      <h3>The two "From" addresses</h3>
      <p>Every email actually has two sender addresses, and confusing them is the classic mistake:</p>
      <ul>
        <li><strong>Header From</strong> (<code>From:</code>) — what you see in your mail client. Fully attacker-controlled. Includes a display name that can say anything.</li>
        <li><strong>Envelope From / Return-Path</strong> — the address used during actual delivery (the "bounce" address). SPF checks against this.</li>
      </ul>
      <p>An attacker can put <code>"IT Support" &lt;support@yourcompany.com&gt;</code> in the visible From while the real envelope sender is something else entirely. Always find the underlying address, not the display name.</p>

      <h3>Reading Received headers</h3>
      <p>The <code>Received:</code> lines are a stack: each mail server that handled the message adds one to the <em>top</em> as it passes through. So you read them <strong>bottom-to-top</strong> to follow the message forward in time — the bottom-most Received is the origin, the top-most is your own server. A sample:</p>
      <pre><code>Received: from mx.yourcompany.com by inbox.yourcompany.com; Tue, 30 Jun 2026 09:15:03 +0000
Received: from suspicious-relay.xyz (185.220.101.7) by mx.yourcompany.com; Tue, 30 Jun 2026 09:15:01 +0000
Return-Path: &lt;bounce@suspicious-relay.xyz&gt;
From: "IT Support" &lt;support@yourcompany.com&gt;
Reply-To: reset@yourcompany-helpdesk.co
Subject: Action required: verify your account</code></pre>
      <p>Read bottom-up: the message originated at <code>suspicious-relay.xyz</code> (185.220.101.7), the Return-Path points there too, yet the visible From claims to be internal IT — and the Reply-To routes to a lookalike domain. Three independent tells, all in the header.</p>

      <h3>The three authentication checks</h3>
      <table>
        <thead><tr><th>Check</th><th>What it verifies</th><th>Mechanism</th></tr></thead>
        <tbody>
          <tr><td><strong>SPF</strong></td><td>Was this server authorised to send for the envelope domain?</td><td>A DNS list of allowed sending IPs.</td></tr>
          <tr><td><strong>DKIM</strong></td><td>Was the message signed by the domain and unaltered in transit?</td><td>A cryptographic signature checked against a DNS public key.</td></tr>
          <tr><td><strong>DMARC</strong></td><td>Do SPF/DKIM align with the visible From, and what to do if not?</td><td>A DNS policy tying the checks to the From domain.</td></tr>
        </tbody>
      </table>

      <h3>SPF — Sender Policy Framework</h3>
      <p>The domain owner publishes, in DNS, a list of IP addresses allowed to send its mail. The receiving server checks whether the connecting IP is on that list for the <strong>envelope-from</strong> domain. Pass means "an authorised server sent this"; fail means "this IP isn't allowed to send for that domain."</p>

      <h3>DKIM — DomainKeys Identified Mail</h3>
      <p>The sending domain cryptographically <strong>signs</strong> the message. The receiver fetches the domain's public key from DNS and verifies the signature. A valid DKIM signature proves two things: the message really came from that domain, and it wasn't altered in transit.</p>

      <h3>DMARC — the alignment referee</h3>
      <p>SPF and DKIM each check a domain — but not necessarily the one you <em>see</em>. DMARC closes that gap by requiring <strong>alignment</strong>: the domain that passed SPF/DKIM must match the visible <code>From</code> domain. It also lets the owner publish a <strong>policy</strong> — <code>none</code> (monitor), <code>quarantine</code> (spam folder), or <code>reject</code> (block) — telling receivers what to do with mail that fails.</p>

      <blockquote>The subtle, career-defining point: <strong>SPF/DKIM pass does NOT mean the email is safe.</strong> It means a domain was authenticated. An attacker who sends from <code>account-alerts-security.com</code> — a domain they legitimately own — will pass SPF, DKIM, and DMARC for <em>that</em> domain. Authentication proves origin, never honesty. Read the domain, not just the green checkmark.</blockquote>

      <h3>The analyst's header checklist</h3>
      <ol>
        <li>Find the real <strong>From</strong> address, ignoring the display name.</li>
        <li>Compare <strong>From</strong>, <strong>Return-Path</strong>, and <strong>Reply-To</strong> — do they agree, or diverge?</li>
        <li>Read <strong>Received</strong> lines bottom-up to find the true origin IP.</li>
        <li>Check <strong>SPF / DKIM / DMARC</strong> results — and remember pass ≠ safe.</li>
        <li>Ask the human question: is this domain <em>plausibly</em> who it claims to be?</li>
      </ol>
    `,
    quizzes: [
      { id: "se-l7-q1", question: "Which sender address is fully attacker-controlled and shown in your mail client?", options: ["The Return-Path only", "The header 'From' (including display name)", "The Received IP", "The DKIM key"], correctAnswerIndex: 1, explanation: "The visible header From, including the display name, can be set to anything by the sender." },
      { id: "se-l7-q2", question: "In what order should you read 'Received:' header lines to trace a message forward?", options: ["Top to bottom", "Bottom to top", "Alphabetically", "Order doesn't matter"], correctAnswerIndex: 1, explanation: "Each server prepends its Received line, so the bottom is the origin — read bottom-to-top." },
      { id: "se-l7-q3", question: "What does SPF verify?", options: ["That the message content is safe", "Whether the sending server's IP is authorised to send for the envelope domain", "The user's password", "The email's language"], correctAnswerIndex: 1, explanation: "SPF checks the connecting IP against a DNS list of authorised senders for the envelope-from domain." },
      { id: "se-l7-q4", question: "What does a valid DKIM signature prove?", options: ["The email is not spam", "The message came from the signing domain and wasn't altered in transit", "The sender is trustworthy", "The link is safe to click"], correctAnswerIndex: 1, explanation: "DKIM's cryptographic signature proves domain origin and message integrity, not honesty." },
      { id: "se-l7-q5", question: "What key concept does DMARC add on top of SPF and DKIM?", options: ["Encryption of the body", "Alignment with the visible From domain, plus a policy for failures", "Faster delivery", "Attachment scanning"], correctAnswerIndex: 1, explanation: "DMARC requires SPF/DKIM to align with the From domain and defines none/quarantine/reject policy." },
      { id: "se-l7-q6", question: "Which DMARC policy tells receivers to block failing mail outright?", options: ["none", "quarantine", "reject", "monitor"], correctAnswerIndex: 2, explanation: "p=reject instructs receivers to reject messages that fail DMARC." },
      { id: "se-l7-q7", question: "Why does 'SPF/DKIM/DMARC pass' NOT mean an email is safe?", options: ["The checks are usually broken", "An attacker passing auth on a domain THEY own still sends malicious mail — auth proves origin, not honesty", "Passing means it's encrypted", "It means the link is verified"], correctAnswerIndex: 1, explanation: "Authentication confirms which domain sent the mail, not whether the mail is legitimate." },
      { id: "se-l7-q8", question: "A message where From says 'support@yourcompany.com' but Return-Path is 'bounce@suspicious-relay.xyz' suggests what?", options: ["Normal, trustworthy email", "Possible spoofing — the visible sender disagrees with the delivery origin", "A hardware fault", "Strong DKIM alignment"], correctAnswerIndex: 1, explanation: "A mismatch between the visible From and the Return-Path/origin is a classic spoofing tell." },
    ],
  },

  // ── LESSON 8 ───────────────────────────────────────────────────────────────
  {
    title: "08 // Spotting the Lure: Links, Domains, and Attachments",
    summary: "The practical body-of-the-email checks — inspecting links, recognising lookalike and homograph domains, and handling dangerous attachments.",
    content: `
      <h2>Below the headers, inside the message</h2>
      <p>Headers reveal identity; the body reveals the <strong>lure</strong> — the specific thing the attacker wants you to click, open, or type into. This lesson is the hands-on checklist you and your users apply to every suspicious email.</p>

      <h3>Inspecting links without clicking</h3>
      <p>The visible text of a link and its actual destination are independent. <code>&lt;a href="http://evil.example/login"&gt;www.yourbank.com&lt;/a&gt;</code> displays as your bank but goes somewhere else. On a desktop client, <strong>hover</strong> over the link to reveal the true URL in the status bar. Then read the domain carefully — and read it right to left from the <em>real</em> domain:</p>
      <ul>
        <li>The real domain is the part just before the first single slash: in <code>https://accounts.google.com.verify-login.ru/x</code>, the true domain is <code>verify-login.ru</code>, not <code>google.com</code>.</li>
        <li>Beware <strong>subdomain trickery</strong>: <code>yourbank.com.secure-login.net</code> is owned by <code>secure-login.net</code>.</li>
        <li>Beware <strong>URL shorteners</strong> that hide the destination, and links inside PDFs or QR codes ("quishing").</li>
      </ul>

      <h3>Lookalike and homograph domains</h3>
      <p>Attackers register domains that read like a trusted brand at a glance:</p>
      <table>
        <thead><tr><th>Trick</th><th>Example</th><th>What's wrong</th></tr></thead>
        <tbody>
          <tr><td>Typosquatting</td><td><code>arch-x-portaI.com</code></td><td>Capital "I" replaces lowercase "l".</td></tr>
          <tr><td>Wrong TLD</td><td><code>arch-x.co</code> vs <code>arch-x.com</code></td><td>Different top-level domain.</td></tr>
          <tr><td>Extra words</td><td><code>arch-x-security-team.com</code></td><td>Plausible-sounding but unowned domain.</td></tr>
          <tr><td>Homograph / IDN</td><td><code>аrch-x.com</code></td><td>Cyrillic "а" (U+0430) looks identical to Latin "a".</td></tr>
        </tbody>
      </table>
      <p><strong>Homograph attacks</strong> exploit Unicode: characters from other alphabets that render identically to Latin letters. The domain looks perfect to the eye but resolves somewhere entirely different. Modern browsers often display such domains in <em>Punycode</em> (e.g. <code>xn--rch-x-...</code>) as a defence — a name starting with <code>xn--</code> is a red flag worth investigating.</p>

      <h3>Dangerous attachments</h3>
      <p>Attachments deliver malware (ATT&CK T1566.001). Treat these with particular caution:</p>
      <ul>
        <li><strong>Office documents prompting "Enable Macros/Content"</strong> — macros are code; enabling them can run the attacker's payload.</li>
        <li><strong>Archives (.zip, .iso, .img)</strong> — used to smuggle executables past filters.</li>
        <li><strong>Double extensions</strong> — <code>invoice.pdf.exe</code> hopes you only read "invoice.pdf".</li>
        <li><strong>Unexpected files from known contacts</strong> — a compromised colleague's account sends real-looking attachments.</li>
      </ul>

      <h3>Content red flags — the quick scan</h3>
      <ul>
        <li>Generic greetings ("Dear Valued Customer") where a real sender would know your name.</li>
        <li>Urgency, threats, or too-good-to-be-true offers.</li>
        <li>Requests for credentials, codes, payments, or personal data.</li>
        <li>Spelling/grammar oddities — though modern (and AI-assisted) phishing is increasingly clean, so <em>clean text is not safe text</em>.</li>
        <li>Mismatch between what the email claims and where the link/sender actually goes.</li>
      </ul>

      <blockquote>The one habit that prevents most credential phishing: <strong>never log in via a link in an email.</strong> If a message says your account needs attention, open a new browser tab and navigate to the site yourself using a bookmark or typed address. This defeats even a flawless lookalike page.</blockquote>
    `,
    quizzes: [
      { id: "se-l8-q1", question: "How can you inspect a link's true destination on a desktop mail client without clicking?", options: ["Delete the email", "Hover over it to reveal the actual URL", "Forward it to yourself", "Reply to the sender"], correctAnswerIndex: 1, explanation: "Hovering shows the real target URL, which may differ from the visible link text." },
      { id: "se-l8-q2", question: "In 'https://accounts.google.com.verify-login.ru/x', what is the true domain?", options: ["accounts.google.com", "google.com", "verify-login.ru", "accounts.google"], correctAnswerIndex: 2, explanation: "The real domain is the part just before the first single slash: verify-login.ru." },
      { id: "se-l8-q3", question: "What is a homograph (IDN) attack?", options: ["Using a very long password", "Registering a domain with look-alike Unicode characters that appear identical to Latin letters", "Sending too many emails", "Encrypting a link"], correctAnswerIndex: 1, explanation: "Homograph attacks use characters (e.g. Cyrillic 'а') that render like Latin letters to forge a domain." },
      { id: "se-l8-q4", question: "A domain shown as 'xn--...' in the browser indicates what?", options: ["A secure site", "A Punycode-encoded (possibly homograph) internationalised domain worth scrutiny", "A broken link", "An email attachment"], correctAnswerIndex: 1, explanation: "Browsers show Punycode (xn--) for IDNs; it's a red flag prompting closer inspection." },
      { id: "se-l8-q5", question: "Why is an Office document prompting 'Enable Macros' dangerous?", options: ["Macros make it print faster", "Macros are code that can execute the attacker's payload", "It improves formatting", "It is always harmless"], correctAnswerIndex: 1, explanation: "Enabling macros can run embedded malicious code — a common malware delivery method." },
      { id: "se-l8-q6", question: "What is the risk of a file named 'invoice.pdf.exe'?", options: ["It is a valid PDF", "The real extension is .exe (executable); the .pdf is a disguise", "It cannot be opened", "It is compressed"], correctAnswerIndex: 1, explanation: "Double extensions hide the true executable type, tricking users who only see 'invoice.pdf'." },
      { id: "se-l8-q7", question: "Why is clean spelling and grammar NOT proof an email is safe?", options: ["Real emails always have typos", "Modern and AI-assisted phishing is increasingly well-written", "Grammar checkers block phishing", "Clean text can't contain links"], correctAnswerIndex: 1, explanation: "Attackers now produce polished text, so poor grammar is a weak signal and clean text is not reassurance." },
      { id: "se-l8-q8", question: "What is the safest way to respond to an email saying your account needs attention?", options: ["Click the link and log in", "Open the site yourself via a bookmark or typed address, not the email link", "Reply with your password", "Ignore it forever and never verify"], correctAnswerIndex: 1, explanation: "Navigating to the site independently defeats even a perfect lookalike phishing page." },
    ],
  },

  // ── LESSON 9 ───────────────────────────────────────────────────────────────
  {
    title: "09 // Building a Human Firewall: Awareness, Reporting, and Simulations",
    summary: "Turning employees into sensors — blameless reporting culture, meaningful metrics, and how to run phishing simulations that teach instead of punish.",
    content: `
      <h2>From weakest link to sensor network</h2>
      <p>The cliché says humans are the weakest link. A better program flips that: a trained, reporting workforce becomes a distributed sensor network that no filter can match. The goal of security awareness is not zero clicks (impossible) — it's a fast, fearless <strong>reporting reflex</strong> and layered technical backup.</p>

      <h3>The report button is the whole game</h3>
      <p>The most valuable outcome of awareness training is not "the user didn't click." It's "the user clicked and then <em>reported it within 60 seconds</em>." That report lets the SOC pull the same email from every other inbox, reset the exposed credential, and contain the incident before it spreads. A single report can protect thousands. Make reporting a one-click action (a "Report Phish" button) and reporting rate becomes your most important metric.</p>

      <h3>Blameless culture: the load-bearing principle</h3>
      <p>The fastest way to destroy a reporting culture is to punish or shame people who fall for a phish. Punishment teaches one lesson: <em>hide it</em>. An employee who clicked and is afraid will stay silent — and silence is exactly what the attacker needs. Instead:</p>
      <ul>
        <li><strong>Praise reporting</strong>, even (especially) when someone reports after clicking.</li>
        <li>Treat clicks as <strong>learning moments</strong>, not disciplinary events.</li>
        <li>Make it psychologically safe to say "I think I messed up" immediately.</li>
      </ul>

      <blockquote>The single most damaging management mistake in this field is blaming the victim. It drives incidents underground, delays response, and guarantees the next person hides their mistake too. A blameless response is not soft — it is operationally superior.</blockquote>

      <h3>Metrics that matter (and traps that don't)</h3>
      <table>
        <thead><tr><th>Metric</th><th>What it tells you</th><th>Watch out for</th></tr></thead>
        <tbody>
          <tr><td><strong>Report rate</strong></td><td>How many recipients reported the phish — your true resilience signal.</td><td>Optimise this above all.</td></tr>
          <tr><td><strong>Click rate</strong></td><td>How many fell for it.</td><td>Useful, but obsessing over it alone can train silence.</td></tr>
          <tr><td><strong>Time-to-report</strong></td><td>How fast the first report arrived.</td><td>Speed determines containment window.</td></tr>
          <tr><td><strong>Repeat clickers</strong></td><td>Who needs targeted coaching.</td><td>For support, not punishment.</td></tr>
        </tbody>
      </table>
      <p>A program that drives click-rate to zero but has a dismal report-rate has trained people to stay quiet — the worst outcome. Report-rate is the number that predicts how you'll handle a real attack.</p>

      <h3>Running phishing simulations well</h3>
      <p>Simulated phishing — sending safe, fake phishing to your own staff — is powerful when done ethically:</p>
      <ol>
        <li><strong>Educate, don't entrap.</strong> Difficulty should rise gradually; the aim is teaching, not maximising the "gotcha".</li>
        <li><strong>Just-in-time training.</strong> When someone clicks a simulation, show a short, friendly teaching page immediately — the teachable moment is now.</li>
        <li><strong>Avoid cruel lures.</strong> Faking bonuses, layoffs, or bereavement destroys trust and morale. The internal backlash outweighs any lesson.</li>
        <li><strong>Measure trends, not individuals-for-blame.</strong> Use results to target coaching and improve controls.</li>
        <li><strong>Reward reporters.</strong> Recognise people who report the simulation — reinforce the behaviour you actually want.</li>
      </ol>

      <h3>Effective training content</h3>
      <ul>
        <li><strong>Short and frequent</strong> beats annual marathons — micro-lessons stick.</li>
        <li><strong>Role-relevant</strong> — finance learns BEC, executives learn whaling, everyone learns the report button.</li>
        <li><strong>Concrete and current</strong> — show real examples the organisation has actually received.</li>
        <li><strong>Positive framing</strong> — "here's how you protect us" outperforms fear and blame.</li>
      </ul>
    `,
    quizzes: [
      { id: "se-l9-q1", question: "What is the primary goal of security awareness training?", options: ["Achieving literally zero clicks", "A fast, fearless reporting reflex backed by technical controls", "Punishing mistakes", "Eliminating all email"], correctAnswerIndex: 1, explanation: "Zero clicks is unrealistic; the aim is quick, blameless reporting plus layered defences." },
      { id: "se-l9-q2", question: "Why is the 'Report Phish' button so valuable?", options: ["It deletes the attacker", "A fast report lets the SOC pull the email from all inboxes and contain the incident", "It encrypts the inbox", "It replaces the SIEM"], correctAnswerIndex: 1, explanation: "Rapid reporting enables containment across the whole organisation before spread." },
      { id: "se-l9-q3", question: "What happens to reporting culture when you punish people who click?", options: ["It improves dramatically", "People hide their mistakes, driving incidents underground", "Nothing changes", "Clicks become impossible"], correctAnswerIndex: 1, explanation: "Punishment teaches concealment, delaying response and harming security." },
      { id: "se-l9-q4", question: "Which metric best signals real organisational resilience?", options: ["Click rate alone", "Report rate", "Number of emails sent", "Server uptime"], correctAnswerIndex: 1, explanation: "Report rate reflects how well the human sensor network will perform against a real attack." },
      { id: "se-l9-q5", question: "A program with near-zero click rate but very low report rate has likely trained what?", options: ["Excellent resilience", "Silence — people avoid clicks but don't report, the worst outcome", "Perfect security", "Faster reporting"], correctAnswerIndex: 1, explanation: "Optimising clicks while ignoring reporting can teach people to stay quiet." },
      { id: "se-l9-q6", question: "Why should phishing simulations avoid lures about bonuses, layoffs, or bereavement?", options: ["They are too easy", "They destroy trust and morale, outweighing any lesson", "They are illegal everywhere", "They can't be sent by email"], correctAnswerIndex: 1, explanation: "Cruel lures damage employee trust and provoke backlash that undermines the program." },
      { id: "se-l9-q7", question: "What is 'just-in-time' training in simulations?", options: ["Annual training in December", "Showing a short teaching page immediately when someone clicks a simulation", "Training only new hires", "Training after a real breach only"], correctAnswerIndex: 1, explanation: "Delivering the lesson at the moment of the click captures the teachable moment." },
      { id: "se-l9-q8", question: "Which approach to training content is most effective?", options: ["One long annual session", "Short, frequent, role-relevant, positively framed micro-lessons", "Fear-based lectures", "No training at all"], correctAnswerIndex: 1, explanation: "Frequent, relevant, positive micro-training retains better than annual fear-based marathons." },
    ],
  },

  // ── LESSON 10 ──────────────────────────────────────────────────────────────
  {
    title: "10 // When the Phish Lands: Incident Handling and ATT&CK Mapping",
    summary: "The first hour after a successful phish — triage, containment, eradication, recovery, and mapping the whole attack chain to MITRE ATT&CK.",
    content: `
      <h2>Assume one gets through</h2>
      <p>No matter how good your training and filters, eventually someone clicks, enters a password, or approves a transfer. A mature program plans for that day. This capstone lesson walks the response, ties the course together, and gives you the shared ATT&CK language to communicate it.</p>

      <h3>Triage: what actually happened?</h3>
      <p>When a phish is reported (or detected), first scope the exposure — the questions drive everything after:</p>
      <ul>
        <li>Did the user only <strong>click a link</strong>, or did they <strong>enter credentials</strong>? Credentials entered = assume compromised.</li>
        <li>Was an <strong>attachment opened</strong> / macro enabled? Then assume possible malware execution.</li>
        <li>Was a <strong>payment or data</strong> sent (BEC)? Then involve finance/legal immediately.</li>
        <li><strong>Who else received it?</strong> Search all mailboxes for the same sender/subject/URL.</li>
      </ul>

      <h3>The response lifecycle applied to phishing</h3>
      <p>Following the standard NIST-style phases:</p>
      <ol>
        <li><strong>Preparation</strong> — report button, playbook, and SOC access ready <em>before</em> the incident.</li>
        <li><strong>Detection &amp; Analysis</strong> — the report arrives; confirm it's real and scope who's affected.</li>
        <li><strong>Containment</strong> — reset the exposed credentials and <strong>revoke active sessions/tokens</strong>, block the sender/domain, and pull the message from all inboxes. Note: a password reset alone is not enough if the attacker holds a live session token.</li>
        <li><strong>Eradication</strong> — remove any malware, delete attacker-created inbox rules/forwarders (a favourite persistence trick), and close footholds.</li>
        <li><strong>Recovery</strong> — restore normal access, confirm the account is clean, watch for re-entry.</li>
        <li><strong>Lessons Learned</strong> — feed findings back into filters, training, and process (e.g. add a payment callback rule after a BEC).</li>
      </ol>

      <blockquote>Two phishing-specific containment reflexes worth memorising: <strong>revoke sessions, not just passwords</strong> (an active token survives a password change), and <strong>hunt for malicious mailbox rules</strong> (attackers auto-forward or auto-delete to hide and persist). Miss these and the "contained" attacker is still inside.</blockquote>

      <h3>Order still matters</h3>
      <p>As in any IR: <strong>contain before you eradicate</strong>, and <strong>preserve evidence before you wipe</strong>. Keep the original phishing email (headers intact) — it's both evidence and threat intelligence for blocking the next wave. In a BEC involving money, speed of the bank/authorities notification can determine whether funds are recoverable.</p>

      <h3>Mapping the attack to MITRE ATT&CK</h3>
      <p>Speaking the shared language organises your detections and reports:</p>
      <table>
        <thead><tr><th>Stage of the attack</th><th>ATT&CK Tactic</th><th>Technique</th></tr></thead>
        <tbody>
          <tr><td>Researching the target (LinkedIn, site)</td><td>Reconnaissance</td><td>T1598 Phishing for Information</td></tr>
          <tr><td>Sending the phishing email</td><td>Initial Access</td><td>T1566 Phishing (.001 attachment / .002 link)</td></tr>
          <tr><td>Harvested password reused to log in</td><td>Initial Access / Persistence</td><td>T1078 Valid Accounts</td></tr>
          <tr><td>Malicious inbox forwarding rule</td><td>Persistence / Collection</td><td>T1114 Email Collection / T1137 rules</td></tr>
          <tr><td>Deleting evidence of the intrusion</td><td>Defense Evasion</td><td>T1070 Indicator Removal</td></tr>
        </tbody>
      </table>

      <h3>Why the failure→success moment mirrors SSH auditing</h3>
      <p>Just as a brute-force breach turns on the failure-to-success login, a phishing breach turns on the moment stolen credentials become a <strong>valid login (T1078)</strong>. After that pivot the attacker looks like a legitimate user, and detection gets much harder. That is why catching phishing at delivery (T1566) — filters plus a fast report — is your clearest, cheapest shot.</p>

      <h3>The whole course in one sentence</h3>
      <p>Understand the psychology, recognise the lures across every channel, read the technical truth in the headers, build a blameless reporting culture backed by layered controls, and rehearse the response — so that when a phish lands, it's contained in minutes, not months.</p>
    `,
    quizzes: [
      { id: "se-l10-q1", question: "When triaging a reported phish, why does it matter whether the user entered credentials?", options: ["It doesn't matter", "Credentials entered means you must assume the account is compromised and act", "It only affects the font", "It changes the email's timezone"], correctAnswerIndex: 1, explanation: "Entered credentials imply likely compromise, driving password reset and session revocation." },
      { id: "se-l10-q2", question: "Why is resetting a password alone sometimes insufficient during containment?", options: ["Passwords never help", "An attacker's active session/token can survive a password change", "Resets take too long", "It deletes the mailbox"], correctAnswerIndex: 1, explanation: "You must also revoke active sessions/tokens, which persist after a password reset." },
      { id: "se-l10-q3", question: "Why hunt for malicious mailbox rules after a phishing compromise?", options: ["They speed up email", "Attackers create auto-forward/auto-delete rules to persist and hide", "They improve spam filtering", "They are required by DMARC"], correctAnswerIndex: 1, explanation: "Malicious inbox rules are a common persistence and concealment technique." },
      { id: "se-l10-q4", question: "In the IR lifecycle, what immediately follows Containment?", options: ["Preparation", "Eradication", "Detection", "Nothing"], correctAnswerIndex: 1, explanation: "Eradication (removing malware, footholds, and malicious rules) follows containment." },
      { id: "se-l10-q5", question: "Why should you preserve the original phishing email?", options: ["To reply to the attacker", "It's evidence and threat intel for blocking future waves", "To forward it to colleagues for fun", "There's no reason to keep it"], correctAnswerIndex: 1, explanation: "The intact email (with headers) is both forensic evidence and intelligence for blocking similar attacks." },
      { id: "se-l10-q6", question: "Sending the phishing email itself maps to which ATT&CK technique?", options: ["T1078 Valid Accounts", "T1566 Phishing", "T1070 Indicator Removal", "T1114 Email Collection"], correctAnswerIndex: 1, explanation: "Delivering the phishing message is T1566 Phishing (Initial Access)." },
      { id: "se-l10-q7", question: "After stolen credentials are used to log in, which technique applies?", options: ["T1566 Phishing", "T1078 Valid Accounts", "T1598 Phishing for Information", "T1070 Indicator Removal"], correctAnswerIndex: 1, explanation: "Using harvested legitimate credentials is T1078 Valid Accounts — the attacker now blends in." },
      { id: "se-l10-q8", question: "Why is catching phishing at delivery (T1566) your clearest opportunity?", options: ["It's the only detectable stage", "After credentials become a valid login (T1078), the attacker looks legitimate and is harder to catch", "Delivery causes hardware damage", "It has no particular importance"], correctAnswerIndex: 1, explanation: "Once the attacker holds valid credentials they resemble a normal user, so the delivery stage is the best chance to stop them." },
    ],
  },
];
