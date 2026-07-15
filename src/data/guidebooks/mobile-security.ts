// ─────────────────────────────────────────────────────────────────────────────
// MOBILE SECURITY — DEEP GUIDEBOOK (ARCH-X textbook-grade course)
//
// Content is authored as SEMANTIC HTML and rendered inside `.md-content`
// (see src/index.css) — h2/h3/p/ul/ol/li/pre/code/table/blockquote/strong are
// all styled there, so lessons render correctly without relying on Tailwind
// class scanning.
//
// Structure mirrors a real syllabus: Platform Foundations → Threat Model
// (Mobile Top 10 / MASVS) → Lab Setup → Insecure Storage → Insecure Comms &
// Pinning → Auth/Session → Reverse Engineering → Permissions & IPC → Runtime
// Protections & Bypass → Secure Development. Each lesson ends with an
// 8-question knowledge check. Authorised-education framing: test apps you own.
// ─────────────────────────────────────────────────────────────────────────────

import type { Course } from "../courses";

type Lesson = Course["lessons"][number];

export const META: Pick<
  Course,
  "prerequisites" | "learningOutcomes" | "mustKnow" | "commonGaps" | "prosCons" | "careerNotes"
> = {
  prerequisites: [
    "Comfort with a command line (adb, shell navigation, unzip) — you don't need to be an expert.",
    "A working mental model of HTTP(S): requests, responses, headers, and the client→server round trip.",
    "Basic understanding of what an app is: code plus data, running as a process with a user identity.",
    "No prior mobile-security experience required — Android and iOS internals are built up from zero.",
    "Access to a device or emulator you own and are authorised to test — never someone else's app or account.",
  ],
  learningOutcomes: [
    "Explain the Android and iOS security models: app sandboxing, per-app UIDs, code signing, and permission gates.",
    "Map any finding to the OWASP Mobile Top 10 and verify it against the correct MASVS requirement and MASTG test.",
    "Stand up a repeatable test lab — emulator/simulator, an intercepting proxy, and a CA the device trusts.",
    "Locate insecure local storage (SharedPreferences, plists, SQLite, keychains) and judge what belongs where.",
    "Recognise insecure transport and understand — conceptually — why certificate pinning defeats naive proxying and how testers work around it on devices they own.",
    "Unpack an APK or IPA, read its manifest/Info.plist, and reason about exported components, permissions, and IPC surface.",
  ],
  mustKnow: [
    "App sandbox", "UID isolation", "APK", "IPA", "AndroidManifest.xml", "Info.plist",
    "OWASP Mobile Top 10", "MASVS", "MASTG (formerly MSTG)", "SharedPreferences",
    "Keychain / Keystore", "SQLite", "Certificate pinning", "TrustManager / ATS",
    "Frida / Objection", "adb", "Exported components / Intents", "URL schemes / deep links",
    "Root / Jailbreak detection", "Obfuscation (R8/ProGuard)", "Smali / dex", "SQLCipher",
  ],
  commonGaps: [
    "Sandbox vs encryption. Beginners assume the sandbox protects data at rest — it doesn't help once a device is rooted, backed up, or physically seized. Isolation and encryption are different guarantees.",
    "Pinning is not the same as TLS. Many learners conflate 'the app uses HTTPS' with 'the app is pinned'. HTTPS resists network eavesdroppers; pinning additionally resists a proxy whose CA the device trusts.",
    "Testing your own app vs attacking others. Every technique here (proxying, pinning bypass, RE) is only legitimate against apps and accounts you own or are contracted to assess. This is the line that separates research from crime.",
    "Client-side controls are advisory. Root/jailbreak detection and obfuscation raise cost; they never provide a security boundary. The server must never trust the client.",
    "Where secrets actually live. Hardcoded API keys in the binary, tokens in cleartext SQLite, and PII in logs are the bread-and-butter findings — not exotic memory corruption.",
    "iOS ≠ Android. The two platforms differ in storage APIs, IPC, and code signing. A finding on one does not automatically exist on the other; test both explicitly.",
  ],
  prosCons: {
    pros: [
      "Mobile findings are high-impact and common: cleartext tokens and weak transport map almost 1:1 to real account takeover.",
      "The OWASP MASVS/MASTG give a free, standardised, checklist-driven methodology that makes assessments repeatable and defensible.",
      "Skills transfer directly to app security engineering, API testing, and reverse engineering roles.",
    ],
    cons: [
      "The tooling moves fast: OS hardening, new pinning libraries, and detection techniques constantly shift the ground.",
      "Client-side analysis has hard limits — server-side logic you can't see still governs the real security decisions.",
      "Legal and ethical scope is narrow: without authorisation, the same actions are unlawful, so engagement paperwork matters as much as skill.",
    ],
  },
  careerNotes:
    "Mobile application security sits at the intersection of pentesting and application security engineering. Typical roles: Mobile Application Penetration Tester, Application Security Engineer, and Product Security Engineer, often after a general pentest or software-development background. The field's anchor standard is the OWASP Mobile Application Security project — the MASVS (requirements) and MASTG (test procedures) — and practitioners frequently pursue the OffSec and eLearnSecurity mobile paths, GIAC GMOB, and vendor Android/iOS internals training. A realistic entry target is 1–3 years after foundational web or dev experience; the testers who advance fastest are those who can read a binary AND write the secure-coding remediation the developers actually need.",
};

export const LESSONS: Lesson[] = [
  // ── LESSON 1 ───────────────────────────────────────────────────────────────
  {
    title: "01 // The Mobile Battlefield: OS Architecture & App Sandboxing",
    summary: "How Android and iOS isolate apps — per-app identities, the sandbox, code signing, and why 'private' data is only private under specific conditions.",
    content: `
      <h2>Why mobile is its own discipline</h2>
      <p>A phone is not a small laptop. It is a tightly controlled computer where every app is treated as potentially hostile to every other app, and where the operating system — not the app — owns most of the security decisions. To test mobile apps you must first understand the platform that contains them. This lesson builds that mental model for both <strong>Android</strong> and <strong>iOS</strong>.</p>

      <p>You are working <em>defensively and legally</em>: everything in this course assumes you are assessing an app you own, built, or have written authorisation to test. The techniques are the same as an attacker's; the authorisation is what makes them legitimate.</p>

      <h3>The app sandbox</h3>
      <p>The central idea on both platforms is the <strong>sandbox</strong>: each installed app runs isolated from the others, with its own private directory the OS refuses to let neighbours read. The two platforms enforce this differently:</p>
      <table>
        <thead><tr><th>Platform</th><th>Isolation mechanism</th></tr></thead>
        <tbody>
          <tr><td><strong>Android</strong></td><td>Each app is assigned a unique Linux <strong>UID</strong> at install; the kernel's normal user-permission model keeps one app's files unreadable by another. Built on the Linux kernel with SELinux mandatory access control on top.</td></tr>
          <tr><td><strong>iOS</strong></td><td>Apps run inside a mandatory sandbox enforced by the kernel (Seatbelt/App Sandbox profiles). Each app gets a private container directory; system frameworks mediate access to anything outside it.</td></tr>
        </tbody>
      </table>

      <h3>Code signing and the chain of trust</h3>
      <p>Neither platform will run arbitrary code by default. On <strong>iOS</strong>, every binary must be signed by a certificate Apple's chain trusts, and the kernel refuses to execute unsigned pages — this is why installing outside the App Store is hard. On <strong>Android</strong>, every APK is signed by the developer's key; the system verifies the signature and uses it to gate updates (an update must be signed by the same key). Code signing answers "who made this, and has it been tampered with?"</p>

      <h3>The critical nuance: sandbox ≠ encryption</h3>
      <p>Beginners assume the sandbox keeps their data secret. It does — <em>from other apps on a healthy device</em>. It does <strong>not</strong> protect data when:</p>
      <ul>
        <li>The device is <strong>rooted (Android)</strong> or <strong>jailbroken (iOS)</strong>, removing the isolation boundary.</li>
        <li>An attacker obtains a <strong>device backup</strong> that includes app data.</li>
        <li>The device is <strong>physically seized</strong> and its storage imaged.</li>
      </ul>
      <p>In every one of those cases the sandbox is gone but the files remain. This is the single most important idea in mobile storage security, and the whole of Lesson 4 rests on it.</p>

      <blockquote>Isolation and confidentiality are different guarantees. The sandbox provides isolation between apps. Only encryption — with keys held in secure hardware — provides confidentiality against someone who already holds the files.</blockquote>

      <h3>Where the OS draws the line</h3>
      <p>On both platforms, sensitive resources (camera, contacts, location, secure storage) sit behind OS-mediated APIs and user-granted <strong>permissions</strong>. The app can only reach them by asking, and the OS logs and gates the request. Much of mobile testing is simply cataloguing what an app asks for, what it stores, and how it talks to its server — then judging whether each choice is safe.</p>
    `,
    quizzes: [
      { id: "mob-l1-q1", question: "What does the app sandbox primarily provide?", options: ["Encryption of all app data at rest", "Isolation so one app cannot read another app's private files", "Faster network performance", "Automatic malware removal"], correctAnswerIndex: 1, explanation: "The sandbox isolates apps from each other; it is an isolation boundary, not an encryption mechanism." },
      { id: "mob-l1-q2", question: "How does Android enforce app isolation at the kernel level?", options: ["By encrypting each app with a unique password", "By assigning each app a unique Linux UID and relying on user-permission separation", "By running every app as root", "By disabling the file system"], correctAnswerIndex: 1, explanation: "Android assigns each app a distinct Linux UID; standard Unix permissions (reinforced by SELinux) keep apps apart." },
      { id: "mob-l1-q3", question: "Why can't you normally run unsigned code on iOS?", options: ["The screen is too small", "The kernel refuses to execute code not signed by a trusted certificate chain", "iOS has no file system", "Apps must be written in Swift"], correctAnswerIndex: 1, explanation: "iOS mandatory code signing means the kernel will not execute unsigned pages, blocking arbitrary/untrusted binaries." },
      { id: "mob-l1-q4", question: "In which situation does the sandbox NOT protect an app's stored data?", options: ["When another healthy app tries to read it", "When the device is rooted/jailbroken or its storage is imaged", "When the app is in the foreground", "When the screen is locked"], correctAnswerIndex: 1, explanation: "Rooting/jailbreaking, backups, or physical imaging remove the isolation boundary, leaving the raw files exposed." },
      { id: "mob-l1-q5", question: "What does code signing on Android verify?", options: ["The user's password", "Who produced the APK and that it hasn't been tampered with (and gates updates to the same key)", "The device's battery level", "The server's TLS certificate"], correctAnswerIndex: 1, explanation: "The developer signature proves origin and integrity, and updates must be signed by the same key." },
      { id: "mob-l1-q6", question: "Isolation and confidentiality differ how?", options: ["They are identical guarantees", "Isolation keeps apps apart; confidentiality (via encryption with protected keys) protects data from someone who already holds the files", "Confidentiality is weaker than isolation", "Only iOS provides confidentiality"], correctAnswerIndex: 1, explanation: "The sandbox isolates; only encryption with securely stored keys protects data once the isolation is bypassed." },
      { id: "mob-l1-q7", question: "How do apps reach sensitive resources like contacts or location?", options: ["Directly, with no restriction", "Through OS-mediated APIs gated by user-granted permissions", "By editing the kernel", "Only when rooted"], correctAnswerIndex: 1, explanation: "Sensitive resources sit behind permission-gated, OS-mediated APIs that the user must approve." },
      { id: "mob-l1-q8", question: "What makes the testing techniques in this course legitimate rather than criminal?", options: ["Using a fast computer", "Having authorisation to test apps and accounts you own or are contracted to assess", "Using open-source tools only", "Testing at night"], correctAnswerIndex: 1, explanation: "The methods mirror an attacker's; authorisation and scope are what make the work lawful and ethical." },
    ],
  },

  // ── LESSON 2 ───────────────────────────────────────────────────────────────
  {
    title: "02 // The Threat Model: OWASP Mobile Top 10 & MASVS",
    summary: "The industry's shared map of mobile risk — the Mobile Top 10 as awareness, and MASVS/MASTG as the requirements and test procedures that make assessments repeatable.",
    content: `
      <h2>You need a map before you explore</h2>
      <p>Without a framework, mobile testing degenerates into poking at random. The OWASP <strong>Mobile Application Security</strong> project gives the whole industry a shared map, in three parts you must not confuse:</p>
      <table>
        <thead><tr><th>Artifact</th><th>What it is</th><th>Use it for</th></tr></thead>
        <tbody>
          <tr><td><strong>Mobile Top 10</strong></td><td>An awareness list of the ten most impactful risk categories.</td><td>Framing risk, talking to stakeholders, prioritising.</td></tr>
          <tr><td><strong>MASVS</strong></td><td>Mobile Application Security Verification Standard — the <em>requirements</em> (what "secure" means), grouped into control families.</td><td>Defining the bar an app must clear.</td></tr>
          <tr><td><strong>MASTG</strong></td><td>Mobile Application Security Testing Guide (formerly the MSTG) — the <em>procedures</em> (how to test each requirement).</td><td>Actually performing and documenting each test.</td></tr>
        </tbody>
      </table>

      <h3>The OWASP Mobile Top 10 (2024 categories)</h3>
      <p>Learn these as vocabulary — every finding you make will slot into one:</p>
      <ol>
        <li><strong>M1 Improper Credential Usage</strong> — hardcoded or mishandled credentials and keys.</li>
        <li><strong>M2 Inadequate Supply Chain Security</strong> — vulnerable/backdoored SDKs and build pipelines.</li>
        <li><strong>M3 Insecure Authentication/Authorization</strong> — weak login, session, or access-control logic.</li>
        <li><strong>M4 Insufficient Input/Output Validation</strong> — injection and unsafe handling of untrusted data.</li>
        <li><strong>M5 Insecure Communication</strong> — weak or missing transport protection (the focus of Lesson 5).</li>
        <li><strong>M6 Inadequate Privacy Controls</strong> — mishandling of PII and personal data.</li>
        <li><strong>M7 Insufficient Binary Protections</strong> — no obfuscation/anti-tamper where the threat model needs it.</li>
        <li><strong>M8 Security Misconfiguration</strong> — insecure defaults, debug flags, exported components.</li>
        <li><strong>M9 Insecure Data Storage</strong> — sensitive data stored unprotected (the focus of Lesson 4).</li>
        <li><strong>M10 Insufficient Cryptography</strong> — weak algorithms, hardcoded keys, or misuse of crypto.</li>
      </ol>

      <h3>MASVS: requirements, not a checklist of attacks</h3>
      <p>MASVS is organised into control groups such as <strong>STORAGE, CRYPTO, AUTH, NETWORK, PLATFORM, CODE,</strong> and <strong>RESILIENCE</strong>. It defines <em>verification levels</em>:</p>
      <ul>
        <li><strong>MASVS-L1</strong> — baseline security appropriate for most apps.</li>
        <li><strong>MASVS-L2</strong> — defence-in-depth for apps handling sensitive data (finance, health).</li>
        <li><strong>MASVS-R (Resilience)</strong> — anti-tampering/obfuscation controls for apps that must resist reverse engineering (e.g., DRM, anti-fraud). Crucially, R is <em>additive</em> — it never substitutes for L1/L2.</li>
      </ul>

      <h3>How the three fit together in a real assessment</h3>
      <p>The workflow is: the <strong>Top 10</strong> frames the conversation, the <strong>MASVS</strong> requirement defines what must be true, and the matching <strong>MASTG</strong> test tells you how to prove it — pass or fail — with reproducible evidence. Reporting a finding as "MASVS-STORAGE-1 fails, verified via the MASTG storage test" is instantly understood and defensible, exactly the way a SOC analyst maps to MITRE ATT&CK.</p>

      <blockquote>Don't memorise attacks; internalise requirements. An attack you've never seen still maps to a MASVS control, and the MASTG will tell you how to test it. The framework turns "I poked around" into "I verified 30 requirements with evidence."</blockquote>
    `,
    quizzes: [
      { id: "mob-l2-q1", question: "What is the OWASP Mobile Top 10 best used for?", options: ["As a step-by-step testing procedure", "As an awareness list of the most impactful risk categories for framing and prioritisation", "As a compiler for mobile apps", "As a replacement for the operating system"], correctAnswerIndex: 1, explanation: "The Top 10 is an awareness/prioritisation list of risk categories, not a test procedure." },
      { id: "mob-l2-q2", question: "What does MASVS define?", options: ["The exact keystrokes for an attack", "The security requirements — what 'secure' means — grouped into control families", "The price of a pentest", "The device's hardware specs"], correctAnswerIndex: 1, explanation: "MASVS is the Mobile Application Security Verification Standard: the requirements an app must satisfy." },
      { id: "mob-l2-q3", question: "What is the MASTG (formerly MSTG)?", options: ["A mobile antivirus", "The testing guide with procedures for how to verify each MASVS requirement", "A brand of phone", "An encryption algorithm"], correctAnswerIndex: 1, explanation: "The MASTG provides the concrete test procedures used to verify MASVS requirements." },
      { id: "mob-l2-q4", question: "Which Mobile Top 10 category covers sensitive data stored unprotected on the device?", options: ["M5 Insecure Communication", "M9 Insecure Data Storage", "M2 Inadequate Supply Chain Security", "M4 Insufficient Input/Output Validation"], correctAnswerIndex: 1, explanation: "M9 Insecure Data Storage covers sensitive data persisted without adequate protection." },
      { id: "mob-l2-q5", question: "Which category covers weak or missing transport protection?", options: ["M5 Insecure Communication", "M7 Insufficient Binary Protections", "M6 Inadequate Privacy Controls", "M1 Improper Credential Usage"], correctAnswerIndex: 0, explanation: "M5 Insecure Communication addresses transport-layer weaknesses such as missing or weak TLS." },
      { id: "mob-l2-q6", question: "What does MASVS-L2 add over L1?", options: ["Nothing, they are identical", "Defence-in-depth controls for apps handling sensitive data", "Removal of encryption", "A faster UI"], correctAnswerIndex: 1, explanation: "L2 layers additional defence-in-depth requirements for higher-sensitivity apps like finance or health." },
      { id: "mob-l2-q7", question: "What is true about the MASVS-R (Resilience) profile?", options: ["It replaces L1/L2 entirely", "It is additive anti-tampering/obfuscation and never substitutes for L1/L2 security", "It only applies to iOS", "It disables all other controls"], correctAnswerIndex: 1, explanation: "Resilience controls are additive; they raise attacker cost but do not replace foundational L1/L2 security." },
      { id: "mob-l2-q8", question: "In a real assessment, how do the three artifacts fit together?", options: ["They are interchangeable", "Top 10 frames risk, MASVS defines the requirement, MASTG provides the test to prove pass/fail", "You only ever use the Top 10", "MASTG defines requirements and MASVS runs tests"], correctAnswerIndex: 1, explanation: "The Top 10 frames, MASVS specifies the requirement, and the MASTG procedure verifies it with reproducible evidence." },
    ],
  },

  // ── LESSON 3 ───────────────────────────────────────────────────────────────
  {
    title: "03 // Building the Lab: Emulators, Devices & Intercepting Proxies",
    summary: "Standing up a repeatable, legal test environment — emulator vs real device, adb, and routing app traffic through an intercepting proxy with a trusted CA.",
    content: `
      <h2>You can't test what you can't observe</h2>
      <p>Mobile testing needs a controlled environment where you can install a target build, watch its files, and see its network traffic. This lesson builds that lab. Everything here targets apps you own or are authorised to assess, on devices you control.</p>

      <h3>Emulator/simulator vs real device</h3>
      <table>
        <thead><tr><th></th><th>Emulator / Simulator</th><th>Real device</th></tr></thead>
        <tbody>
          <tr><td>Setup</td><td>Fast, disposable, snapshot-able</td><td>More effort; needs a spare, wiped device</td></tr>
          <tr><td>Root/JB access</td><td>Easy (Android emulator images, rootable)</td><td>Harder, may void warranty; iOS needs a jailbreak</td></tr>
          <tr><td>Fidelity</td><td>Some hardware/DRM/attestation features absent</td><td>True hardware: Secure Enclave, biometrics, real sensors</td></tr>
          <tr><td>Best for</td><td>Fast iteration, storage & traffic analysis</td><td>Hardware-backed crypto, attestation, performance</td></tr>
        </tbody>
      </table>
      <p>The Android SDK's <strong>emulator</strong> and Apple's <strong>Simulator</strong> (part of Xcode) cover most day-to-day work; reach for a real device when hardware-backed features matter.</p>

      <h3>adb — your Android remote control</h3>
      <p>The <strong>Android Debug Bridge (adb)</strong> is the primary Android tooling interface. A handful of commands do most of the work:</p>
      <pre><code>adb devices                      # list connected devices/emulators
adb install app.apk              # install a build
adb shell                        # open a shell on the device
adb pull /data/local/tmp/x.db .  # copy a file off the device
adb logcat                       # stream the device logs</code></pre>
      <p>On iOS the equivalent workflow uses Xcode tooling, <code>ios-deploy</code>, and (on jailbroken devices) an SSH session into the device.</p>

      <h3>The intercepting proxy — the heart of the lab</h3>
      <p>To read an app's API traffic you route it through an <strong>intercepting proxy</strong> — <strong>Burp Suite</strong>, <strong>OWASP ZAP</strong>, or <strong>mitmproxy</strong>. The proxy sits between the app and the internet as a deliberate man-in-the-middle <em>that you control</em>. But there's a catch: the traffic is HTTPS, and the app won't trust your proxy's certificate. So you must:</p>
      <ol>
        <li>Point the device's Wi-Fi proxy setting at your machine's IP and the proxy port.</li>
        <li>Install the proxy's <strong>CA certificate</strong> onto the device so the OS trusts certificates the proxy generates on the fly.</li>
        <li>On Android 7+, place the CA in the <strong>system trust store</strong> (root needed) or add a debug <code>network_security_config</code> to your own build, because user-added CAs are no longer trusted by apps by default.</li>
      </ol>

      <blockquote>That Android 7 change — apps ignoring user-installed CAs unless they opt in — is a deliberate security improvement. It's also the first wall you'll hit as a tester, and understanding <em>why</em> it exists is the foundation for the pinning discussion in Lesson 5.</blockquote>

      <h3>Snapshots and hygiene</h3>
      <p>Take an emulator <strong>snapshot</strong> of a clean, proxied, CA-installed state so every test starts identically. Keep the lab offline from production data, use test accounts, and never point these tools at traffic or apps you aren't authorised to inspect.</p>
    `,
    quizzes: [
      { id: "mob-l3-q1", question: "What does an intercepting proxy do in a mobile lab?", options: ["Speeds up the app", "Sits as a controlled man-in-the-middle so you can read and modify the app's HTTP(S) traffic", "Encrypts the device storage", "Roots the device automatically"], correctAnswerIndex: 1, explanation: "Tools like Burp/ZAP/mitmproxy proxy the app's traffic so you can observe and tamper with requests you're authorised to test." },
      { id: "mob-l3-q2", question: "Why must you install the proxy's CA certificate on the device?", options: ["To speed up TLS", "So the OS trusts the certificates the proxy generates for HTTPS interception", "To root the device", "To disable the sandbox"], correctAnswerIndex: 1, explanation: "Without trusting the proxy's CA, the device rejects the proxy's on-the-fly certificates and HTTPS interception fails." },
      { id: "mob-l3-q3", question: "What is adb?", options: ["An Apple debugging tool", "The Android Debug Bridge — the primary CLI for interacting with Android devices/emulators", "An intercepting proxy", "A jailbreak utility"], correctAnswerIndex: 1, explanation: "adb (Android Debug Bridge) installs apps, opens shells, pulls files, and streams logs on Android." },
      { id: "mob-l3-q4", question: "When do you prefer a real device over an emulator?", options: ["Never", "When you need hardware-backed features like the Secure Enclave, biometrics, or attestation", "Only for screenshots", "When testing the UI colour"], correctAnswerIndex: 1, explanation: "Emulators lack some hardware/DRM/attestation features, so real devices are needed for hardware-backed crypto and attestation." },
      { id: "mob-l3-q5", question: "What changed for user-installed CAs starting with Android 7?", options: ["They are trusted everywhere", "Apps no longer trust user-added CAs by default unless they opt in via network security config", "CAs were removed entirely", "All HTTPS was disabled"], correctAnswerIndex: 1, explanation: "Android 7+ apps ignore user-added CAs by default, so testers use the system store (root) or a debug network security config." },
      { id: "mob-l3-q6", question: "Which command copies a file off an Android device?", options: ["adb push", "adb pull", "adb logcat", "adb reboot"], correctAnswerIndex: 1, explanation: "adb pull copies a file from the device to your machine; adb push does the reverse." },
      { id: "mob-l3-q7", question: "Why take an emulator snapshot of a clean, proxied state?", options: ["To save battery", "So every test starts from an identical, repeatable baseline", "To bypass code signing", "To increase RAM"], correctAnswerIndex: 1, explanation: "Snapshots make tests reproducible by restoring a known clean, instrumented state each time." },
      { id: "mob-l3-q8", question: "Which is an intercepting proxy commonly used in mobile testing?", options: ["Burp Suite", "SQLite", "logcat", "SELinux"], correctAnswerIndex: 0, explanation: "Burp Suite (alongside OWASP ZAP and mitmproxy) is a standard intercepting proxy for HTTP(S) testing." },
    ],
  },

  // ── LESSON 4 ───────────────────────────────────────────────────────────────
  {
    title: "04 // Insecure Data Storage: Files, Preferences, Databases & Keychains",
    summary: "The most common finding class — where apps stash data, what belongs in secure hardware storage, and how to audit SharedPreferences, plists, SQLite, and keychains.",
    content: `
      <h2>The number-one place secrets leak</h2>
      <p>Insecure data storage (Mobile Top 10 <strong>M9</strong>, MASVS <strong>STORAGE</strong>) is the bread-and-butter of mobile assessments. Recall Lesson 1: the sandbox does not protect files once a device is rooted, backed up, or imaged. So the question for every piece of data is simple — <em>if an attacker held this file, would it hurt?</em></p>

      <h3>The Android storage landscape</h3>
      <table>
        <thead><tr><th>Store</th><th>Path (private sandbox)</th><th>Typical misuse</th></tr></thead>
        <tbody>
          <tr><td><strong>SharedPreferences</strong></td><td><code>/data/data/&lt;pkg&gt;/shared_prefs/*.xml</code></td><td>Auth tokens, PII, flags stored in cleartext XML.</td></tr>
          <tr><td><strong>SQLite databases</strong></td><td><code>/data/data/&lt;pkg&gt;/databases/*.db</code></td><td>Session tokens, messages, cached PII in plaintext tables.</td></tr>
          <tr><td><strong>Internal files</strong></td><td><code>/data/data/&lt;pkg&gt;/files/</code></td><td>Serialized objects, caches, secrets on disk.</td></tr>
          <tr><td><strong>External storage</strong></td><td><code>/sdcard/</code></td><td>World-readable historically — never put secrets here.</td></tr>
        </tbody>
      </table>

      <h3>The iOS storage landscape</h3>
      <ul>
        <li><strong>NSUserDefaults</strong> → a <code>.plist</code> in the app container — the iOS analogue of SharedPreferences, equally wrong for secrets.</li>
        <li><strong>plist and Core Data / SQLite</strong> files inside the app's <code>Documents</code>/<code>Library</code> directories.</li>
        <li><strong>Caches</strong> — screenshots the OS takes when backgrounding an app can leak sensitive screens; snapshots of web views and clipboards also leak.</li>
      </ul>

      <h3>Where secrets actually belong: the secure hardware store</h3>
      <p>Both platforms provide OS-managed secure storage backed by hardware:</p>
      <ul>
        <li><strong>iOS Keychain</strong> — encrypted credential storage with per-item accessibility classes (e.g., "only when unlocked"), keys protected by the <strong>Secure Enclave</strong>.</li>
        <li><strong>Android Keystore</strong> — cryptographic keys generated and held in the <strong>TEE</strong> (Trusted Execution Environment) or a dedicated security chip, so the key material never enters app memory in cleartext.</li>
      </ul>
      <p>The rule: store <em>keys and credentials</em> in the keychain/Keystore, and if you must persist a whole database of sensitive data, encrypt it with a key from that secure store — e.g., <strong>SQLCipher</strong> for encrypted SQLite.</p>

      <h3>Auditing it, step by step</h3>
      <ol>
        <li>Exercise the app (log in, view data) so it writes real state.</li>
        <li>Pull the sandbox: <code>adb pull /data/data/&lt;pkg&gt;/</code> (root/backup on Android) or inspect the container on a jailbroken iOS device.</li>
        <li>Open XML/plist files in a text editor; open <code>.db</code> files with a SQLite browser.</li>
        <li>Grep for the obvious: <code>token</code>, <code>password</code>, <code>session</code>, <code>auth</code>, email addresses.</li>
        <li>Check logs too — <code>adb logcat</code> often reveals secrets developers printed during debugging.</li>
      </ol>

      <blockquote>Also watch the invisible leaks: Android <strong>auto-backup</strong> can ship app data to the cloud unless excluded, and both OSes take screenshots for the app switcher. Data you never chose to persist can still escape the sandbox.</blockquote>
    `,
    quizzes: [
      { id: "mob-l4-q1", question: "Which Mobile Top 10 category is insecure data storage?", options: ["M5", "M9", "M2", "M7"], correctAnswerIndex: 1, explanation: "M9 Insecure Data Storage; it maps to the MASVS STORAGE control group." },
      { id: "mob-l4-q2", question: "Where do Android SharedPreferences persist by default?", options: ["In the Android Keystore", "In cleartext XML under /data/data/<pkg>/shared_prefs/", "Encrypted in the TEE", "On a remote server"], correctAnswerIndex: 1, explanation: "SharedPreferences are plain XML files in the app's sandbox — unsuitable for secrets without extra protection." },
      { id: "mob-l4-q3", question: "What is the correct place to store cryptographic keys/credentials on iOS?", options: ["NSUserDefaults", "A plist in Documents", "The iOS Keychain (keys protected by the Secure Enclave)", "The clipboard"], correctAnswerIndex: 2, explanation: "The Keychain provides encrypted, hardware-backed credential storage with accessibility controls." },
      { id: "mob-l4-q4", question: "What does the Android Keystore provide?", options: ["A faster UI", "Cryptographic keys generated/held in the TEE or security chip so key material never appears in cleartext in app memory", "A cloud backup service", "A proxy for network traffic"], correctAnswerIndex: 1, explanation: "The Keystore keeps key material in hardware-backed secure storage, isolated from app memory." },
      { id: "mob-l4-q5", question: "How can you persist a whole sensitive database more securely?", options: ["Store it on /sdcard", "Encrypt it with a key from the secure store, e.g. using SQLCipher", "Base64-encode it", "Rename the file"], correctAnswerIndex: 1, explanation: "SQLCipher encrypts the SQLite database with a key that should come from the Keychain/Keystore." },
      { id: "mob-l4-q6", question: "Why is NSUserDefaults the wrong place for secrets?", options: ["It's encrypted too strongly", "It writes to a plaintext plist in the app container, readable once the sandbox is bypassed", "It only stores images", "It requires root"], correctAnswerIndex: 1, explanation: "NSUserDefaults persists to a cleartext plist — the iOS analogue of misusing SharedPreferences." },
      { id: "mob-l4-q7", question: "During a storage audit, why also inspect logcat / device logs?", options: ["Logs speed up the app", "Developers often print tokens/PII to logs during debugging, leaking secrets", "Logs are encrypted keychains", "Logs replace the database"], correctAnswerIndex: 1, explanation: "Debug logging frequently exposes sensitive values that should never be written out." },
      { id: "mob-l4-q8", question: "Which is an 'invisible' way sensitive data can leave the sandbox?", options: ["The app being uninstalled", "Cloud auto-backup or app-switcher screenshots capturing sensitive screens", "Turning the screen off", "Changing the wallpaper"], correctAnswerIndex: 1, explanation: "Auto-backup and OS-generated screenshots can persist/exfiltrate data the developer never explicitly stored." },
    ],
  },

  // ── LESSON 5 ───────────────────────────────────────────────────────────────
  {
    title: "05 // Insecure Communication, TLS & Certificate Pinning",
    summary: "Protecting data in transit — why HTTPS isn't automatic, what certificate pinning adds, and the concepts behind why proxying a pinned app fails (and how testers work around it on their own apps).",
    content: `
      <h2>Data in motion is data at risk</h2>
      <p>Insecure communication (Mobile Top 10 <strong>M5</strong>, MASVS <strong>NETWORK</strong>) is about protecting data while it travels between app and server. The baseline is <strong>TLS</strong> (HTTPS), but there are several ways apps get it wrong and one important extra layer — pinning.</p>

      <h3>The failure modes</h3>
      <ul>
        <li><strong>Cleartext HTTP</strong> — any data over <code>http://</code> is readable on the wire. Both platforms now discourage this: iOS <strong>App Transport Security (ATS)</strong> blocks cleartext by default, and Android blocks cleartext unless explicitly allowed.</li>
        <li><strong>Accepting invalid certificates</strong> — a custom <code>TrustManager</code>/<code>HostnameVerifier</code> that returns "trusted" for everything defeats TLS entirely. A tester's first check.</li>
        <li><strong>Weak configuration</strong> — obsolete protocol versions or cipher suites.</li>
        <li><strong>Mixed content</strong> — a secure app that fetches some resources insecurely.</li>
      </ul>

      <h3>TLS vs pinning — the distinction beginners miss</h3>
      <p>Standard TLS trusts <em>any</em> certificate chaining to a CA in the device's trust store. That's why installing your proxy's CA (Lesson 3) lets you read traffic: the app trusts your CA like any other. <strong>Certificate pinning</strong> narrows that trust — the app ships with a copy (or hash) of the <em>specific</em> certificate or public key it expects, and rejects anything else, <em>even a valid CA-signed cert</em>.</p>
      <table>
        <thead><tr><th></th><th>Plain TLS</th><th>Pinned TLS</th></tr></thead>
        <tbody>
          <tr><td>Trusts</td><td>Any cert from a trusted CA</td><td>Only the specific pinned cert/key</td></tr>
          <tr><td>Proxy with trusted CA works?</td><td>Yes</td><td>No — proxy cert isn't the pinned one</td></tr>
          <tr><td>Defends against</td><td>Passive eavesdroppers</td><td>Also a malicious/compromised CA or a trusted-CA proxy</td></tr>
        </tbody>
      </table>

      <h3>Why your proxy suddenly stops working</h3>
      <p>You install your CA, traffic flows, and then one app shows only TLS errors and no requests. That's pinning doing its job: the app compared the server certificate to its pin, saw your proxy's cert instead, and refused to connect. This is a <em>feature</em>, not a bug — it is exactly the protection you'd want against a real man-in-the-middle.</p>

      <h3>Assessing a pinned app you own</h3>
      <p>When you are authorised to test the app, pinning is an obstacle to <em>your own analysis</em>, and testers legitimately work around it to inspect the API beneath. Conceptually the approaches are:</p>
      <ul>
        <li><strong>Runtime instrumentation</strong> — tools like <strong>Frida</strong>/<strong>Objection</strong> hook the certificate-check function in memory and neutralise it, so on <em>your</em> test device the app talks to your proxy. (Deep-dived in Lesson 9.)</li>
        <li><strong>Patching the app</strong> — modify the pinning logic in the decompiled app and repackage (Lesson 7), for your own build.</li>
        <li><strong>Adding your CA to the app's own config</strong> — for a debug build you control.</li>
      </ul>

      <blockquote>The ethics line is bright: bypassing pinning is legitimate to test an app you own or are contracted to assess. Using the same techniques to intercept someone else's traffic or another person's account is unlawful. The technique is neutral; the authorisation is everything.</blockquote>

      <h3>Getting pinning right as a developer</h3>
      <p>Pin to the <strong>public key</strong> (not the leaf certificate) so routine cert rotation doesn't break the app, ship a <strong>backup pin</strong>, and prefer platform mechanisms — Android <code>network_security_config</code> pinning or well-maintained libraries — over hand-rolled checks.</p>
    `,
    quizzes: [
      { id: "mob-l5-q1", question: "Which Mobile Top 10 category is insecure communication?", options: ["M9", "M5", "M1", "M8"], correctAnswerIndex: 1, explanation: "M5 Insecure Communication, mapping to the MASVS NETWORK controls." },
      { id: "mob-l5-q2", question: "What does iOS App Transport Security (ATS) do by default?", options: ["Enables cleartext HTTP everywhere", "Blocks cleartext HTTP, requiring secure TLS connections unless explicitly exempted", "Disables TLS", "Pins every certificate automatically"], correctAnswerIndex: 1, explanation: "ATS enforces secure connections by default, blocking arbitrary cleartext HTTP." },
      { id: "mob-l5-q3", question: "How does certificate pinning differ from plain TLS?", options: ["It disables encryption", "It trusts only a specific expected certificate/public key, not any CA-signed cert", "It uses HTTP instead of HTTPS", "It only works on Android"], correctAnswerIndex: 1, explanation: "Pinning restricts trust to a specific cert/key, rejecting even otherwise-valid CA-signed certificates." },
      { id: "mob-l5-q4", question: "Why does installing your proxy CA let you read normal TLS traffic but not pinned traffic?", options: ["Pinned apps use HTTP", "Plain TLS trusts any CA (including yours), but a pinned app compares against its specific pin and rejects your cert", "The proxy is broken", "Pinning disables the network"], correctAnswerIndex: 1, explanation: "Standard TLS accepts your trusted CA; pinning checks the actual cert/key against a stored pin, so the proxy cert fails." },
      { id: "mob-l5-q5", question: "A custom TrustManager that accepts all certificates is a problem because…", options: ["It speeds up TLS too much", "It defeats TLS validation entirely, allowing man-in-the-middle attacks", "It enables pinning", "It encrypts twice"], correctAnswerIndex: 1, explanation: "Accepting all certificates removes authentication, letting any MITM impersonate the server." },
      { id: "mob-l5-q6", question: "On a pinned app you are authorised to test, what does Frida/Objection do?", options: ["Rewrites the server", "Hooks the certificate-check function in memory to neutralise pinning on your own test device", "Installs a new CA on the server", "Encrypts the traffic further"], correctAnswerIndex: 1, explanation: "Runtime instrumentation patches the pinning check in the running process so the app talks to your proxy." },
      { id: "mob-l5-q7", question: "What makes bypassing pinning legitimate rather than criminal?", options: ["Doing it quickly", "Only doing it against an app/account you own or are contracted to assess", "Using open-source tools", "Doing it on a jailbroken device"], correctAnswerIndex: 1, explanation: "The technique is neutral; authorisation and scope determine legality — intercepting others' traffic is unlawful." },
      { id: "mob-l5-q8", question: "What is a recommended developer practice for robust pinning?", options: ["Pin the leaf certificate only and never rotate", "Pin to the public key with a backup pin so cert rotation doesn't brick the app", "Disable TLS validation", "Pin to the CA root of every provider"], correctAnswerIndex: 1, explanation: "Public-key pinning plus a backup pin survives routine certificate rotation without breaking connectivity." },
    ],
  },

  // ── LESSON 6 ───────────────────────────────────────────────────────────────
  {
    title: "06 // Authentication, Sessions & the Mobile API",
    summary: "Where identity really lives — tokens over sessions, secure token storage and lifecycle, biometric myths, and why the server must never trust the client.",
    content: `
      <h2>The client is a lie; the server is the truth</h2>
      <p>The most important principle in mobile auth (Mobile Top 10 <strong>M3</strong>, MASVS <strong>AUTH</strong>): the mobile app runs on a device the attacker fully controls, so <strong>every security decision must be enforced on the server</strong>. The app is a convenient UI over an API; that API is the real attack surface.</p>

      <h3>Tokens, not sticky sessions</h3>
      <p>Mobile apps are typically stateless clients that authenticate once and then present a <strong>token</strong> — commonly a <strong>JWT</strong> or an OAuth 2.0 <strong>access token</strong> — on every API call. Key concepts:</p>
      <ul>
        <li><strong>Access token</strong> — short-lived credential proving the caller is authenticated. Sent (usually) as <code>Authorization: Bearer &lt;token&gt;</code>.</li>
        <li><strong>Refresh token</strong> — longer-lived credential used to obtain new access tokens without re-login. Higher value, so guard it harder.</li>
        <li><strong>Scopes/claims</strong> — what the token is allowed to do. The server must enforce these on every request.</li>
      </ul>

      <h3>Storing tokens: connect it back to Lesson 4</h3>
      <p>A token is a credential. It must live in the <strong>Keychain/Keystore</strong>, not in SharedPreferences, NSUserDefaults, or a plaintext SQLite table. A tester's classic finding is a valid session token sitting in cleartext storage — steal the file, replay the token, become the user. Tokens should also be <strong>invalidated server-side</strong> on logout; if the server keeps honouring a token after the user "logs out," logout is cosmetic.</p>

      <h3>Common authentication and session flaws</h3>
      <table>
        <thead><tr><th>Flaw</th><th>Why it matters</th></tr></thead>
        <tbody>
          <tr><td>Tokens stored in cleartext</td><td>Theft → account takeover with no password needed.</td></tr>
          <tr><td>No token expiry / no server-side logout</td><td>Stolen tokens work indefinitely.</td></tr>
          <tr><td>Client-side-only authorization</td><td>Hiding a button doesn't stop a crafted API call — the server must check.</td></tr>
          <tr><td>Weak or bypassable OTP/2FA flows</td><td>The step-up can be skipped by calling the API directly.</td></tr>
          <tr><td>Predictable/guessable tokens</td><td>Session hijacking without theft.</td></tr>
        </tbody>
      </table>

      <h3>Biometrics: authentication vs authorization</h3>
      <p>Face ID / fingerprint feels like strong login, but understand what it actually does: on-device biometrics <strong>unlock a locally stored secret</strong> (or a Keystore key) — they gate <em>access</em> on the device. They do <strong>not</strong> by themselves authenticate the user to the server. If an app "passes" a biometric check purely with a client-side boolean, an attacker who controls the client can flip it. Done right, a successful biometric releases a Keystore key that performs a cryptographic operation the server can verify.</p>

      <blockquote>Test the API, not just the app. Capture the requests (Lesson 3), then replay and modify them: change an ID in the path, drop the token, call an admin endpoint. If the server enforces identity and authorization correctly, all of that fails. If it trusts the client, you've found the real vulnerability.</blockquote>
    `,
    quizzes: [
      { id: "mob-l6-q1", question: "What is the foundational principle of mobile authentication?", options: ["The client should enforce all security", "Every security decision must be enforced on the server because the client is attacker-controlled", "Biometrics replace server checks", "Tokens are unnecessary"], correctAnswerIndex: 1, explanation: "The device is under attacker control, so the server must enforce all authentication and authorization." },
      { id: "mob-l6-q2", question: "How do mobile apps typically prove identity on each API call?", options: ["By resending the password every time", "By presenting a token (e.g. JWT / OAuth access token), often as a Bearer header", "By the device serial number alone", "By IP address"], correctAnswerIndex: 1, explanation: "Apps authenticate once, then present a token such as a JWT or OAuth access token on subsequent calls." },
      { id: "mob-l6-q3", question: "Where should an access/refresh token be stored?", options: ["SharedPreferences", "NSUserDefaults", "The Keychain / Keystore", "A plaintext SQLite table"], correctAnswerIndex: 2, explanation: "Tokens are credentials and belong in hardware-backed secure storage, not cleartext stores." },
      { id: "mob-l6-q4", question: "Why is a refresh token guarded more carefully than an access token?", options: ["It is shorter", "It is longer-lived and can mint new access tokens, so its theft is higher impact", "It is not sensitive", "It is stored on the server only"], correctAnswerIndex: 1, explanation: "Refresh tokens live longer and issue new access tokens, making them a higher-value target." },
      { id: "mob-l6-q5", question: "Why is hiding an admin button in the UI insufficient authorization?", options: ["Buttons can't be hidden", "An attacker can craft the API call directly, so the server must enforce authorization", "Hidden buttons still render", "It's actually sufficient"], correctAnswerIndex: 1, explanation: "Client-side-only controls are advisory; a crafted request bypasses the UI, so the server must check." },
      { id: "mob-l6-q6", question: "What does on-device biometric authentication actually do?", options: ["Authenticates the user to the server directly", "Unlocks a locally stored secret / Keystore key, gating local access — not a server auth by itself", "Encrypts all network traffic", "Replaces TLS"], correctAnswerIndex: 1, explanation: "Biometrics gate access to a local secret/key; done right they release a Keystore key the server can verify." },
      { id: "mob-l6-q7", question: "Why must logout invalidate the token server-side?", options: ["To free device memory", "Otherwise a stolen or cached token keeps working and logout is only cosmetic", "To change the UI colour", "It doesn't need to"], correctAnswerIndex: 1, explanation: "If the server keeps honouring the token, client-side logout provides no real security." },
      { id: "mob-l6-q8", question: "A biometric check implemented as a client-side boolean is weak because…", options: ["Booleans are slow", "An attacker controlling the client can flip it to bypass the check", "It uses too much battery", "It requires the internet"], correctAnswerIndex: 1, explanation: "A purely client-side result can be tampered with; the check must tie to a server-verifiable cryptographic operation." },
    ],
  },

  // ── LESSON 7 ───────────────────────────────────────────────────────────────
  {
    title: "07 // Reverse Engineering: APK & IPA Structure",
    summary: "Opening the box — the anatomy of an APK and IPA, decompiling to smali/Java, reading the manifest, and finding hardcoded secrets in the binary.",
    content: `
      <h2>An app is just a zip file with rules</h2>
      <p>Reverse engineering sounds arcane, but the first step is mundane: both APKs and IPAs are ZIP archives. Unzipping one reveals a predictable structure you can read. This underpins Mobile Top 10 <strong>M1</strong> (finding hardcoded credentials) and <strong>M8</strong> (misconfiguration). Only ever do this to apps you own or are authorised to assess.</p>

      <h3>Anatomy of an Android APK</h3>
      <table>
        <thead><tr><th>Component</th><th>What it is</th></tr></thead>
        <tbody>
          <tr><td><code>AndroidManifest.xml</code></td><td>The app's blueprint: package name, permissions, and declared components (activities, services, receivers, providers) with their <code>exported</code> flags.</td></tr>
          <tr><td><code>classes.dex</code></td><td>The compiled app code in Dalvik Executable format (there can be several).</td></tr>
          <tr><td><code>resources.arsc</code> / <code>res/</code></td><td>Compiled and raw resources — layouts, strings, images.</td></tr>
          <tr><td><code>lib/</code></td><td>Native <code>.so</code> libraries per CPU architecture.</td></tr>
          <tr><td><code>assets/</code></td><td>Bundled raw files — a favourite hiding place for API keys and config.</td></tr>
          <tr><td><code>META-INF/</code></td><td>The signing information.</td></tr>
        </tbody>
      </table>

      <h3>From DEX to readable code</h3>
      <p>The <code>.dex</code> is compiled, but the toolchain reverses it well:</p>
      <ul>
        <li><strong>apktool</strong> — decodes the manifest and disassembles DEX into <strong>smali</strong> (human-readable Dalvik assembly); also repackages, which matters in Lesson 9.</li>
        <li><strong>jadx</strong> — decompiles DEX back into near-original <strong>Java/Kotlin</strong> source you can read directly (GUI and CLI).</li>
        <li><strong>dex2jar + a Java decompiler</strong> — the older route to the same end.</li>
      </ul>
      <pre><code>apktool d target.apk -o target_src     # disassemble to smali + decoded manifest
jadx -d out target.apk                  # decompile to Java/Kotlin source
strings target.apk | grep -i "api"      # quick hunt for embedded keys/URLs</code></pre>

      <h3>Anatomy of an iOS IPA</h3>
      <p>An IPA unzips to a <code>Payload/&lt;App&gt;.app/</code> bundle containing the <strong>Mach-O</strong> executable, the <code>Info.plist</code> (the iOS manifest — bundle ID, permissions/usage strings, URL schemes), and resources. App Store binaries are additionally <strong>encrypted (FairPlay)</strong>, so static analysis usually requires a decrypted binary dumped from a jailbroken device before tools like <strong>Hopper</strong>, <strong>Ghidra</strong>, or <strong>class-dump</strong> can read the Objective-C/Swift structure.</p>

      <h3>What you're hunting for</h3>
      <ul>
        <li><strong>Hardcoded secrets</strong> — API keys, cloud credentials, encryption keys baked into the binary or <code>assets/</code>. They are <em>not</em> secret: anyone can extract them.</li>
        <li><strong>Endpoints and hidden features</strong> — backend URLs, debug/staging hosts, feature flags.</li>
        <li><strong>Security logic</strong> — the pinning code, root/JB detection, and license checks you may need to understand (Lesson 9).</li>
        <li><strong>Manifest/Info.plist misconfig</strong> — exported components, debuggable flags, over-broad permissions (Lesson 8).</li>
      </ul>

      <blockquote>The core lesson of reverse engineering: <strong>nothing shipped to the client is secret.</strong> If a key is in the app, it's in the attacker's hands. Secrets belong on the server; the binary should contain only what it's safe for everyone to read.</blockquote>
    `,
    quizzes: [
      { id: "mob-l7-q1", question: "At the file-format level, what is an APK (or IPA)?", options: ["A proprietary encrypted blob", "A ZIP archive with a defined internal structure", "A single executable with no structure", "A database file"], correctAnswerIndex: 1, explanation: "Both APKs and IPAs are ZIP archives; unzipping reveals their internal structure." },
      { id: "mob-l7-q2", question: "What does AndroidManifest.xml declare?", options: ["Only the app icon", "Package name, permissions, and components with their exported flags", "The server's database schema", "The user's password"], correctAnswerIndex: 1, explanation: "The manifest is the app blueprint: permissions and declared components (with exported flags)." },
      { id: "mob-l7-q3", question: "What does jadx produce from an APK?", options: ["Encrypted bytecode", "Near-original Java/Kotlin source decompiled from the DEX", "A network capture", "A jailbreak"], correctAnswerIndex: 1, explanation: "jadx decompiles DEX to readable Java/Kotlin source." },
      { id: "mob-l7-q4", question: "What is smali?", options: ["A programming language for servers", "Human-readable Dalvik assembly produced by disassembling DEX (e.g. with apktool)", "An encryption cipher", "A type of certificate"], correctAnswerIndex: 1, explanation: "smali is the human-readable representation of Dalvik bytecode used by apktool." },
      { id: "mob-l7-q5", question: "What is the iOS equivalent manifest inside an IPA?", options: ["AndroidManifest.xml", "Info.plist", "classes.dex", "resources.arsc"], correctAnswerIndex: 1, explanation: "Info.plist holds the bundle ID, permission usage strings, and URL schemes for an iOS app." },
      { id: "mob-l7-q6", question: "Why does App Store IPA static analysis often require a jailbroken device first?", options: ["IPAs are too large", "App Store binaries are FairPlay-encrypted and must be decrypted from a running device", "iOS has no executables", "jadx only works on iOS"], correctAnswerIndex: 1, explanation: "FairPlay encryption means you typically dump a decrypted Mach-O from a device before static analysis." },
      { id: "mob-l7-q7", question: "What is the key takeaway about hardcoded API keys in an app?", options: ["They are perfectly safe if obfuscated", "Nothing shipped to the client is truly secret — anyone can extract them", "They cannot be found by tools", "They only exist on iOS"], correctAnswerIndex: 1, explanation: "Client-side secrets are extractable; real secrets must stay server-side." },
      { id: "mob-l7-q8", question: "Which directory in an APK is a common hiding place for bundled keys/config?", options: ["META-INF/", "assets/", "lib/ (only native code)", "res/values (only strings)"], correctAnswerIndex: 1, explanation: "The assets/ directory often contains raw config and API keys developers assumed were hidden." },
    ],
  },

  // ── LESSON 8 ───────────────────────────────────────────────────────────────
  {
    title: "08 // Platform Permissions, IPC & the Exported Attack Surface",
    summary: "How apps talk to the OS and to each other — permissions, Android components and Intents, deep links/URL schemes, and the classic exported-component vulnerabilities.",
    content: `
      <h2>Apps don't live alone</h2>
      <p>An app constantly interacts with the OS (for permissions) and with other apps (via inter-process communication). Each interaction is attack surface. This lesson covers Mobile Top 10 <strong>M8</strong> (misconfiguration) and the PLATFORM controls in MASVS.</p>

      <h3>The permission model</h3>
      <p>Sensitive capabilities — camera, location, contacts, microphone — require declared <strong>permissions</strong> the user grants at runtime. Two tester lenses:</p>
      <ul>
        <li><strong>Over-privilege</strong> — an app requesting far more than it needs (a flashlight asking for contacts) is a red flag and a privacy risk (Mobile Top 10 M6).</li>
        <li><strong>Custom permissions</strong> — apps can define their own permissions to protect their components; a weak <code>protectionLevel</code> can let other apps access them.</li>
      </ul>

      <h3>Android IPC: components and Intents</h3>
      <p>Android apps are built from four component types, and they communicate via <strong>Intents</strong> — messages that can stay within an app or cross app boundaries:</p>
      <table>
        <thead><tr><th>Component</th><th>Role</th><th>Risk if wrongly exported</th></tr></thead>
        <tbody>
          <tr><td><strong>Activity</strong></td><td>A screen/UI entry point.</td><td>Another app launches internal screens, skipping auth.</td></tr>
          <tr><td><strong>Service</strong></td><td>Background work.</td><td>External apps trigger privileged background actions.</td></tr>
          <tr><td><strong>Broadcast Receiver</strong></td><td>Listens for system/app events.</td><td>Spoofed broadcasts drive unintended behaviour.</td></tr>
          <tr><td><strong>Content Provider</strong></td><td>Shares structured data.</td><td>Data leak or SQL injection into the app's database.</td></tr>
        </tbody>
      </table>

      <h3>The word that matters: <code>exported</code></h3>
      <p>A component with <code>android:exported="true"</code> (or an implicit intent filter) can be invoked by <em>other apps</em>. If it performs a sensitive action or returns sensitive data without checking the caller, any installed app can abuse it. Reading the manifest for exported components with no permission guard is one of the highest-value, lowest-effort checks in Android testing.</p>
      <pre><code># In the decoded AndroidManifest.xml, look for:
&lt;activity android:name=".AdminActivity" android:exported="true"/&gt;
&lt;provider  android:name=".DataProvider"  android:exported="true"/&gt;
# Then try to invoke it, e.g. from adb:
adb shell am start -n com.target/.AdminActivity</code></pre>

      <h3>Deep links and iOS URL schemes</h3>
      <p>Both platforms let apps register to handle URLs — Android <strong>deep links</strong>/App Links and iOS <strong>custom URL schemes</strong>/Universal Links. A tap on <code>myapp://resetpassword?token=...</code> hands attacker-influenced data straight into the app. If the app trusts that input blindly, deep links become an injection and auth-bypass vector. iOS custom schemes are especially weak because multiple apps can claim the same scheme — Universal Links (verified by the domain) are the safer design.</p>

      <h3>iOS IPC, briefly</h3>
      <p>iOS is more locked down: the main cross-app channels are URL schemes/Universal Links, share/extension points, and pasteboard. The testing instinct is the same — enumerate every place external input enters the app and ask whether it's validated and authorised.</p>

      <blockquote>The unifying question for this whole lesson: <strong>"What can another app, or a crafted link, make this app do — and does the app check who's asking?"</strong> Exported components and unvalidated deep links are where that goes wrong.</blockquote>
    `,
    quizzes: [
      { id: "mob-l8-q1", question: "What does android:exported=\"true\" mean for a component?", options: ["It is encrypted", "It can be invoked by other apps on the device", "It runs only at boot", "It cannot be launched at all"], correctAnswerIndex: 1, explanation: "An exported component is reachable by other apps; without a caller check it can be abused." },
      { id: "mob-l8-q2", question: "How do Android components communicate?", options: ["Only via files", "Via Intents — messages that can stay in-app or cross app boundaries", "Via the camera", "They cannot communicate"], correctAnswerIndex: 1, explanation: "Intents are the messaging mechanism for Android IPC between and within apps." },
      { id: "mob-l8-q3", question: "Which component type shares structured data and can be vulnerable to SQL injection if exported?", options: ["Activity", "Broadcast Receiver", "Content Provider", "Service"], correctAnswerIndex: 2, explanation: "Content Providers expose structured data and can leak data or suffer SQL injection when improperly exported." },
      { id: "mob-l8-q4", question: "Why is an over-privileged app (e.g., a flashlight requesting contacts) a concern?", options: ["It runs slower", "It's a privacy risk and a red flag that the app collects more than it needs", "It improves security", "Permissions have no security relevance"], correctAnswerIndex: 1, explanation: "Requesting unnecessary permissions expands the privacy/attack surface with no legitimate need." },
      { id: "mob-l8-q5", question: "What is a deep link / custom URL scheme risk?", options: ["It encrypts the app", "Attacker-influenced URL data enters the app and, if trusted blindly, enables injection or auth bypass", "It speeds up navigation only", "It disables the sandbox"], correctAnswerIndex: 1, explanation: "Deep links feed external input into the app; unvalidated handling creates injection and bypass vectors." },
      { id: "mob-l8-q6", question: "Why are iOS custom URL schemes weaker than Universal Links?", options: ["They are slower", "Multiple apps can claim the same scheme, whereas Universal Links are verified by the domain", "They only work offline", "They require a jailbreak"], correctAnswerIndex: 1, explanation: "Custom schemes can be hijacked by another app claiming the same scheme; Universal Links are domain-verified." },
      { id: "mob-l8-q7", question: "What is the highest-value, low-effort Android manifest check?", options: ["Counting the number of images", "Looking for exported components with no permission guard", "Checking the app version string", "Measuring the APK size"], correctAnswerIndex: 1, explanation: "Enumerating unguarded exported components quickly reveals a common, high-impact attack surface." },
      { id: "mob-l8-q8", question: "What is the unifying testing question for permissions and IPC?", options: ["How fast is the app?", "What can another app or a crafted link make this app do, and does it check who's asking?", "What colour is the UI?", "How many activities exist?"], correctAnswerIndex: 1, explanation: "The core question is whether external callers/input are validated and authorised before the app acts." },
    ],
  },

  // ── LESSON 9 ───────────────────────────────────────────────────────────────
  {
    title: "09 // Runtime Protections: Root/Jailbreak Detection, Obfuscation & Instrumentation",
    summary: "The RESILIENCE layer — what root/JB detection and obfuscation buy you, dynamic instrumentation with Frida/Objection, and why client-side defences only raise cost.",
    content: `
      <h2>Making the attacker's life harder — but never impossible</h2>
      <p>This lesson covers Mobile Top 10 <strong>M7</strong> (insufficient binary protections) and the MASVS <strong>RESILIENCE</strong> profile. The framing from Lesson 2 is essential: these controls are <em>additive</em>. They raise the cost and time of an attack; they never create a real security boundary, because the attacker owns the device.</p>

      <h3>Root / jailbreak detection</h3>
      <p>Apps handling sensitive data often try to detect a compromised device, because rooting/jailbreaking removes the protections the app relies on. Common signals:</p>
      <ul>
        <li>Presence of <code>su</code> binaries, root-management apps, or Cydia/Sileo (iOS).</li>
        <li>Writable system partitions or unexpected mount points.</li>
        <li>Failed integrity/attestation checks (Play Integrity API, iOS attestation).</li>
      </ul>
      <p>The limitation: all of these checks <em>run on the very device the attacker controls</em>. A determined tester can hook or patch the detection function so it always returns "clean." That's why detection is a speed bump, not a wall — and why server-side attestation (which the client can't simply lie about) is stronger than local checks.</p>

      <h3>Obfuscation</h3>
      <p><strong>Obfuscation</strong> makes decompiled code hard to read — renaming classes/methods to meaningless names, encrypting strings, inserting junk control flow. On Android, <strong>R8/ProGuard</strong> provide shrinking and name obfuscation; commercial tools go further. Obfuscation does not encrypt logic or prevent analysis; it slows a reverse engineer down. Against the RE workflow in Lesson 7, it turns a 10-minute read into a multi-hour one — valuable for anti-fraud/DRM, useless as your only defence.</p>

      <h3>Dynamic instrumentation: Frida and Objection</h3>
      <p><strong>Frida</strong> is a dynamic instrumentation toolkit that injects a JavaScript engine into a running process, letting you <strong>hook</strong> functions — inspect arguments, change return values, call methods — at runtime. <strong>Objection</strong> is a Frida-powered toolkit that packages common mobile tasks into ready commands. On a device/app you're authorised to test, this is how you:</p>
      <ul>
        <li>Bypass root/JB detection by forcing the check to return "not rooted."</li>
        <li>Defeat SSL pinning by hooking the certificate-validation routine (Lesson 5).</li>
        <li>Dump secrets/keys from memory or observe crypto calls in flight.</li>
      </ul>
      <pre><code># Conceptual Frida hook: force a detection method to return false
Java.perform(function () {
  var Sec = Java.use("com.target.security.RootCheck");
  Sec.isDeviceRooted.implementation = function () {
    return false;   // pretend the device is clean
  };
});</code></pre>
      <pre><code># Objection shortcuts (authorised targets only)
objection -g com.target explore
android sslpinning disable
android root disable</code></pre>

      <h3>Static vs dynamic analysis</h3>
      <table>
        <thead><tr><th></th><th>Static</th><th>Dynamic</th></tr></thead>
        <tbody>
          <tr><td>What</td><td>Reading the app without running it (Lesson 7)</td><td>Observing/modifying the app while it runs (this lesson)</td></tr>
          <tr><td>Sees</td><td>Code, strings, manifest, resources</td><td>Runtime values, memory, live network, decrypted data</td></tr>
          <tr><td>Beats obfuscation?</td><td>Slowed by it</td><td>Often sidesteps it — behaviour is visible at runtime</td></tr>
        </tbody>
      </table>

      <blockquote>The developer's honest position: assume a motivated attacker will defeat every client-side protection eventually. Use resilience controls to raise cost and deter casual attackers, but never move a real security decision onto the client. The server, and hardware-backed attestation, are where trust actually lives.</blockquote>
    `,
    quizzes: [
      { id: "mob-l9-q1", question: "Which MASVS profile and Top 10 category cover runtime/binary protections?", options: ["STORAGE / M9", "RESILIENCE / M7", "NETWORK / M5", "AUTH / M3"], correctAnswerIndex: 1, explanation: "The RESILIENCE profile and M7 Insufficient Binary Protections cover anti-tamper/obfuscation/detection controls." },
      { id: "mob-l9-q2", question: "What is the fundamental limitation of root/jailbreak detection?", options: ["It is illegal", "It runs on the attacker-controlled device, so it can be hooked or patched to lie", "It requires the internet", "It only works on iOS"], correctAnswerIndex: 1, explanation: "Client-side detection executes on the device the attacker controls and can be neutralised at runtime." },
      { id: "mob-l9-q3", question: "What does obfuscation (e.g., R8/ProGuard) achieve?", options: ["It encrypts all logic so it can never be read", "It makes decompiled code harder/slower to understand — raising cost, not a real boundary", "It prevents the app from running when rooted", "It replaces TLS"], correctAnswerIndex: 1, explanation: "Obfuscation slows reverse engineering but does not prevent analysis or provide a security boundary." },
      { id: "mob-l9-q4", question: "What is Frida?", options: ["An intercepting proxy", "A dynamic instrumentation toolkit that injects into a running process to hook functions", "A decompiler", "An Android permission"], correctAnswerIndex: 1, explanation: "Frida injects a scripting engine into a live process to inspect and modify function behaviour at runtime." },
      { id: "mob-l9-q5", question: "How does Frida typically defeat SSL pinning on an authorised test app?", options: ["By buying a new certificate", "By hooking the certificate-validation routine at runtime so it always passes", "By disabling the network", "By recompiling the OS"], correctAnswerIndex: 1, explanation: "It hooks the pinning/validation function in memory so the app accepts the proxy's certificate." },
      { id: "mob-l9-q6", question: "What is Objection?", options: ["A static decompiler", "A Frida-powered toolkit packaging common mobile tasks (e.g., disabling pinning/root checks) into ready commands", "A jailbreak", "A SIEM"], correctAnswerIndex: 1, explanation: "Objection wraps Frida with convenient commands for common runtime mobile-testing tasks." },
      { id: "mob-l9-q7", question: "How does dynamic analysis relate to obfuscation?", options: ["Obfuscation fully defeats it", "It often sidesteps obfuscation because runtime behaviour and values are observable regardless of naming", "They are unrelated", "Dynamic analysis requires deobfuscated code first"], correctAnswerIndex: 1, explanation: "Runtime observation reveals actual behaviour/values, so obfuscated names matter far less than in static analysis." },
      { id: "mob-l9-q8", question: "What is the honest developer takeaway about client-side protections?", options: ["They are a complete security boundary", "Assume a motivated attacker defeats them; use them to raise cost, but keep real decisions on the server", "They replace server-side checks", "They only matter on emulators"], correctAnswerIndex: 1, explanation: "Client-side controls deter and delay but must never hold a real security decision — trust lives on the server." },
    ],
  },

  // ── LESSON 10 ──────────────────────────────────────────────────────────────
  {
    title: "10 // Secure Development & Reporting: Closing the Loop",
    summary: "Turning findings into fixes — secure-by-default storage and transport, a defence-in-depth checklist mapped to MASVS, and how to write a finding developers can act on.",
    content: `
      <h2>From breaking to building</h2>
      <p>A tester who only finds problems is half a professional. The other half is delivering remediation developers can implement and writing findings that survive scrutiny. This capstone gathers the course into secure-development guidance and a reporting method, all anchored to MASVS.</p>

      <h3>The secure defaults, by control family</h3>
      <table>
        <thead><tr><th>MASVS family</th><th>Do this</th><th>Never do this</th></tr></thead>
        <tbody>
          <tr><td><strong>STORAGE</strong></td><td>Keys/tokens in Keychain/Keystore; encrypt sensitive DBs (SQLCipher); exclude data from backups.</td><td>Secrets in SharedPreferences, NSUserDefaults, cleartext SQLite, or /sdcard.</td></tr>
          <tr><td><strong>CRYPTO</strong></td><td>Strong, current algorithms; keys from the secure store; platform crypto APIs.</td><td>Hardcoded keys, home-rolled crypto, ECB mode, MD5/SHA-1 for security.</td></tr>
          <tr><td><strong>NETWORK</strong></td><td>TLS everywhere; ATS/cleartext blocking on; public-key pinning with backup pin.</td><td>Cleartext HTTP; accept-all TrustManagers; disabling hostname verification.</td></tr>
          <tr><td><strong>AUTH</strong></td><td>Server-side enforcement; short-lived tokens; server-side logout; least-privilege scopes.</td><td>Client-side authorization; non-expiring tokens; trusting the client.</td></tr>
          <tr><td><strong>PLATFORM</strong></td><td>Export nothing unnecessarily; guard components with permissions; validate all deep-link input.</td><td>Debuggable release builds; unguarded exported components; over-broad permissions.</td></tr>
          <tr><td><strong>CODE / RESILIENCE</strong></td><td>Keep dependencies patched; obfuscate + attest for high-risk apps (additive).</td><td>Relying on obfuscation/root detection as the only defence.</td></tr>
        </tbody>
      </table>

      <h3>The three principles that generate all the rest</h3>
      <ol>
        <li><strong>Never trust the client.</strong> The device is attacker-controlled; enforce every real decision server-side (Lesson 6).</li>
        <li><strong>Nothing shipped is secret.</strong> Keep secrets off the binary; store credentials in hardware-backed storage (Lessons 4 &amp; 7).</li>
        <li><strong>Defence in depth.</strong> Layer transport, storage, auth, platform, and resilience controls so one failure isn't fatal (Lesson 9).</li>
      </ol>

      <h3>Writing a finding developers will fix</h3>
      <p>A good finding is reproducible and actionable. Structure each one:</p>
      <ul>
        <li><strong>Title &amp; severity</strong> — plain-language impact and a risk rating.</li>
        <li><strong>MASVS/MASTG mapping</strong> — e.g. "Fails MASVS-STORAGE-1; verified via the MASTG data-storage test." Instantly credible and standardised.</li>
        <li><strong>Evidence</strong> — the exact file path, the query, the intercepted request, a screenshot — enough for the developer to reproduce it.</li>
        <li><strong>Impact</strong> — what an attacker gains (e.g., "any local malware or anyone with a device backup can read the session token and take over the account").</li>
        <li><strong>Remediation</strong> — the specific fix, in the developer's terms ("move the token to the Keystore and invalidate it server-side on logout").</li>
      </ul>

      <blockquote>The measure of a mobile security professional is not how many findings they produce but how many get fixed. Map to the standard, prove it with evidence, and hand back a remediation the team can ship. That is closing the loop — and it's the difference between an auditor and a partner.</blockquote>

      <h3>Where to go next</h3>
      <p>Deepen with the full <strong>MASTG</strong> test cases, practise on intentionally vulnerable apps you own (e.g., OWASP MASTG crackmes and DIVA/InsecureBankv2-style training apps), and study platform release notes — mobile security shifts with every OS version. Keep the ethics line bright: test only what you own or are contracted to assess.</p>
    `,
    quizzes: [
      { id: "mob-l10-q1", question: "What are the correct storage choices for secrets on mobile?", options: ["SharedPreferences and NSUserDefaults", "Keychain/Keystore, plus encrypted DBs (e.g. SQLCipher) with keys from the secure store", "Cleartext SQLite for speed", "External /sdcard storage"], correctAnswerIndex: 1, explanation: "Credentials belong in hardware-backed secure storage; sensitive databases should be encrypted with keys from that store." },
      { id: "mob-l10-q2", question: "Which is a correct NETWORK secure default?", options: ["Accept-all TrustManager", "Cleartext HTTP", "TLS everywhere with public-key pinning and a backup pin", "Disabling hostname verification"], correctAnswerIndex: 2, explanation: "Enforce TLS, block cleartext, and pin to the public key with a backup pin for resilience." },
      { id: "mob-l10-q3", question: "What is the first of the three generating principles?", options: ["Obfuscate everything", "Never trust the client — enforce real decisions server-side", "Store secrets in the binary", "Disable TLS for speed"], correctAnswerIndex: 1, explanation: "Because the device is attacker-controlled, all real security decisions must be enforced on the server." },
      { id: "mob-l10-q4", question: "Why include a MASVS/MASTG mapping in each finding?", options: ["To make the report longer", "It gives a standardised, credible, verifiable reference for the requirement and how it was tested", "It hides the evidence", "It is legally mandatory everywhere"], correctAnswerIndex: 1, explanation: "Mapping to MASVS/MASTG makes findings standardised, credible, and reproducible." },
      { id: "mob-l10-q5", question: "What makes a remediation genuinely useful to developers?", options: ["A vague warning to 'be more secure'", "A specific fix in the developer's terms (e.g., move the token to the Keystore, invalidate server-side on logout)", "Only the severity rating", "Just a screenshot"], correctAnswerIndex: 1, explanation: "Actionable, specific fixes phrased for the developer are far more likely to be implemented." },
      { id: "mob-l10-q6", question: "Which principle explains why hardcoded keys are always a finding?", options: ["Never trust the client", "Nothing shipped to the client is secret", "Defence in depth", "Least privilege"], correctAnswerIndex: 1, explanation: "Anything in the shipped binary can be extracted, so client-side secrets are never truly secret." },
      { id: "mob-l10-q7", question: "What is the true measure of a mobile security professional's impact?", options: ["The number of findings produced", "How many findings actually get fixed", "The size of the report", "The number of tools used"], correctAnswerIndex: 1, explanation: "Value comes from closing the loop — findings that developers can and do remediate." },
      { id: "mob-l10-q8", question: "What is the correct ethical scope for practising these skills?", options: ["Any app on the store", "Only apps you own or are contracted/authorised to assess (plus intentionally vulnerable training apps)", "A friend's banking app", "Any device you can reach on Wi-Fi"], correctAnswerIndex: 1, explanation: "Testing must be limited to apps/accounts you own or are authorised to assess, or purpose-built vulnerable training apps." },
    ],
  },
];
