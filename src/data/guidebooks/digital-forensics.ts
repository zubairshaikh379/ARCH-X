// ─────────────────────────────────────────────────────────────────────────────
// DIGITAL FORENSICS — DEEP GUIDEBOOK (textbook-grade ARCH-X course)
//
// Content is authored as SEMANTIC HTML and rendered inside `.md-content`
// (see src/index.css) — h2/h3/p/ul/ol/li/pre/code/table/blockquote/strong are
// all styled there, so lessons render correctly without relying on Tailwind
// class scanning.
//
// Structure mirrors a real DFIR syllabus: Intro & mindset → forensic process,
// chain of custody, order of volatility → acquisition & imaging → disk/filesystem
// artifacts → memory forensics → OS/user artifacts → timeline analysis →
// anti-forensics → MITRE ATT&CK mapping → pitfalls + interview/capstone.
// Each lesson ends with an 8-question knowledge check.
// ─────────────────────────────────────────────────────────────────────────────

import type { Course } from "../courses";

type Lesson = Course["lessons"][number];

// New optional Overview fields (spread into the digital-forensics course object).
export const META: Pick<
  Course,
  "prerequisites" | "learningOutcomes" | "mustKnow" | "commonGaps" | "prosCons" | "careerNotes"
> = {
  prerequisites: [
    "Comfort with both a Windows command prompt and a Linux shell (cd, ls/dir, cat, less).",
    "A basic mental model of how computers store data: files, folders, RAM vs disk.",
    "Familiarity with hexadecimal and bytes helps, but every concept is built up from zero.",
    "No prior forensics experience required — the forensic process is taught from first principles.",
  ],
  learningOutcomes: [
    "Acquire a forensically sound disk and memory image without altering the original evidence.",
    "Prove image integrity with cryptographic hashing and maintain an unbroken chain of custody.",
    "Recover deleted files and read NTFS/ext4 artifacts (MFT, journals, slack space) for evidence.",
    "Dissect a RAM capture with Volatility to find hidden processes, injected code, and network loops.",
    "Reconstruct attacker activity from registry, prefetch, browser, and log artifacts into one timeline.",
    "Recognise anti-forensic tradecraft and map each investigative finding to MITRE ATT&CK.",
  ],
  mustKnow: [
    "Order of Volatility", "Chain of Custody", "Write Blocker", "Bit-for-bit Image", "E01 / raw dd",
    "MD5 / SHA-256", "NTFS / MFT", "ext4 / inode", "File Slack", "File Carving",
    "Volatility", "Process Hollowing", "Prefetch", "Windows Registry", "$MFT / $LogFile",
    "Super Timeline", "Plaso / log2timeline", "T1070 Indicator Removal", "Timestomping", "Locard's Principle",
  ],
  commonGaps: [
    "Evidence integrity. Beginners open the original drive directly and silently alter timestamps — destroying the very evidence they came to collect. You work on a verified copy, never the original.",
    "Order of volatility. Many rush to image the disk and lose RAM forever. The most fragile evidence (memory, network state) must be captured first, before powering down.",
    "Timestamps and timezones. The same file can show four MAC(B) times in three timezones. A timeline built without confirming the source timezone is silently, dangerously wrong.",
    "Deleted does not mean gone. Learners assume a deleted file is unrecoverable. Until the blocks are overwritten, the data — and its metadata — usually survives.",
    "Memory is not the disk. A process can run entirely in RAM and leave almost nothing on disk. Skipping memory forensics means missing fileless and injected malware entirely.",
    "Documentation and defensibility. An undocumented acquisition is inadmissible. Court-grade rigor (hashes, custody forms, notes) is a core skill, not paperwork to skip.",
  ],
  prosCons: {
    pros: [
      "Forensic evidence is concrete and reproducible: a verified image plus a hash is ground truth anyone can re-check.",
      "Memory and disk artifacts reveal what logs alone cannot — fileless malware, injected code, and deleted activity.",
      "Skills transfer directly to incident response, malware analysis, e-discovery, and threat hunting roles.",
    ],
    cons: [
      "Acquisition is fragile and one-shot: a single wrong step (mounting read-write, rebooting) can corrupt evidence permanently.",
      "Volatile memory vanishes the instant power is lost, and full-disk encryption can make a powered-down disk unreadable.",
      "Sophisticated anti-forensics (timestomping, log wiping, in-memory-only payloads) can erode or fake the evidence you rely on.",
    ],
  },
  careerNotes:
    "Digital forensics is the core of the DFIR (Digital Forensics & Incident Response) discipline. Typical roles include Forensic Analyst, Incident Responder, Malware Analyst, and e-Discovery / litigation-support specialist, in corporate IR teams, MSSPs, consultancies, and law enforcement. Recognised certifications that map to this material: SANS GCFA (Forensic Analyst) and GCFE (Forensic Examiner), the EC-Council CHFI, and practical paths like TryHackMe/HackTheBox DFIR tracks; tool vendors also offer EnCE (EnCase) and AccessData certs. Demand is strong and steady because every breach eventually needs someone to answer 'what happened, what was taken, and can we prove it?' — and the analysts who advance fastest are the ones who pair tool fluency with disciplined evidence handling and clear, defensible reporting.",
};

export const LESSONS: Lesson[] = [
  // ── LESSON 1 ───────────────────────────────────────────────────────────────
  {
    title: "01 // The Forensic Mindset and the DFIR Mission",
    summary: "What digital forensics actually is, why evidence integrity is everything, and the investigative mindset that separates a forensic examiner from a curious user.",
    content: `
      <h2>You are a digital detective</h2>
      <p><strong>Digital forensics</strong> is the disciplined recovery, preservation, and analysis of electronic evidence so that you can answer one question with confidence: <em>what happened on this system, and can you prove it?</em> If a SOC analyst is the watch on the castle wall, the forensic examiner is the detective who arrives after the break-in — reconstructing exactly who entered, what they touched, and what they took, in a way that holds up under scrutiny.</p>

      <p>This course puts you in that role within <strong>DFIR (Digital Forensics &amp; Incident Response)</strong>. You investigate; you do not attack. Your output is not an exploit — it is a defensible, evidence-backed account of events.</p>

      <h3>The two faces of forensics</h3>
      <p>Forensics shows up in two related contexts, and the rigor required is highest in the first:</p>
      <table>
        <thead><tr><th>Context</th><th>Goal</th><th>Standard</th></tr></thead>
        <tbody>
          <tr><td><strong>Legal / court</strong></td><td>Produce evidence admissible in a legal proceeding.</td><td>Court-grade: unbroken chain of custody, verified integrity, repeatable.</td></tr>
          <tr><td><strong>Incident response</strong></td><td>Understand a breach fast enough to contain and remediate it.</td><td>Speed-focused but still defensible — today's IR finding can become tomorrow's evidence.</td></tr>
        </tbody>
      </table>
      <p>Treat every investigation as if it might end up in court. You rarely know in advance which one will.</p>

      <h3>The cardinal rule: do not alter the evidence</h3>
      <p>The single most important habit in this entire discipline: <strong>you never work on the original.</strong> The act of opening a file, browsing a folder, or simply booting a suspect machine changes timestamps, writes to disk, and can overwrite the very data you came to recover. A forensic examiner works on a verified <em>copy</em> and proves, with cryptographic hashing, that the copy is identical to the source.</p>

      <blockquote><strong>Locard's Exchange Principle:</strong> "every contact leaves a trace." It cuts both ways — the attacker left traces you can find, and <em>you</em> leave traces too. Minimise and document your own footprint so it can never be confused with the suspect's.</blockquote>

      <h3>The examiner's mindset</h3>
      <ul>
        <li><strong>Preserve first, analyse later</strong> — capture evidence in a sound state before you start poking at it.</li>
        <li><strong>Assume nothing, prove everything</strong> — a hunch is not a finding until an artifact supports it.</li>
        <li><strong>Stay neutral</strong> — you follow the evidence wherever it leads, including toward "nothing happened."</li>
        <li><strong>Document obsessively</strong> — if it isn't in your notes with a timestamp and a hash, it didn't happen.</li>
      </ul>

      <h3>What you will build toward</h3>
      <p>By the capstone you will take a frozen scene — a disk image and a RAM capture — acquire and verify them, recover deleted artifacts, find a process masquerading as a system service, reconstruct the attacker's timeline, and present a finding you can defend line by line. This first lesson installs the mindset every later step depends on.</p>
    `,
    quizzes: [
      { id: "for-l1-q1", question: "What core question does digital forensics aim to answer?", options: ["How to build a faster computer", "What happened on a system, provably", "How to encrypt a hard drive", "How to write malware"], correctAnswerIndex: 1, explanation: "Forensics reconstructs and proves what happened on a system using preserved, verifiable evidence." },
      { id: "for-l1-q2", question: "Why must an examiner avoid working on the original drive?", options: ["Originals are slower to read", "Any access can alter timestamps and overwrite data, destroying evidence", "Originals cannot be hashed", "It is only a stylistic preference"], correctAnswerIndex: 1, explanation: "Booting, opening, or browsing the original changes data; you work on a verified copy to preserve evidence." },
      { id: "for-l1-q3", question: "What does Locard's Exchange Principle state?", options: ["Data is never deleted", "Every contact leaves a trace", "RAM is volatile", "Hashes are always unique"], correctAnswerIndex: 1, explanation: "Locard's principle — every contact leaves a trace — underpins forensics and reminds you to minimise your own footprint." },
      { id: "for-l1-q4", question: "Which standard should you assume applies to every investigation?", options: ["No standard — speed is all that matters", "Court-grade defensibility, since any case may end up legal", "Only internal IR speed", "Whatever is easiest"], correctAnswerIndex: 1, explanation: "You rarely know in advance which case becomes legal, so treat every investigation as if it could go to court." },
      { id: "for-l1-q5", question: "In DFIR, are you acting offensively or investigatively?", options: ["Offensively — exploiting targets", "Investigatively — preserving and analysing evidence", "Neither", "Both equally"], correctAnswerIndex: 1, explanation: "Forensics is investigative/defensive: your deliverable is a defensible account of events, not an exploit." },
      { id: "for-l1-q6", question: "Which mindset rule best prevents premature conclusions?", options: ["Trust the first theory", "Assume nothing, prove everything with artifacts", "Skip documentation to save time", "Work only from memory"], correctAnswerIndex: 1, explanation: "A finding is only valid once a concrete artifact supports it; hunches alone are not evidence." },
      { id: "for-l1-q7", question: "How does legal forensics differ from incident-response forensics?", options: ["Legal is sloppier", "Legal demands court-grade rigor; IR prioritises speed but should stay defensible", "They are identical", "IR never touches evidence"], correctAnswerIndex: 1, explanation: "Legal work is court-grade; IR is speed-focused but its findings can still become evidence, so it stays defensible." },
      { id: "for-l1-q8", question: "Why is obsessive documentation a core forensic skill?", options: ["It looks professional", "An undocumented finding is not defensible or repeatable", "It replaces the need for hashing", "Courts ignore notes"], correctAnswerIndex: 1, explanation: "Documentation makes findings repeatable and defensible; without it, your analysis cannot be trusted or reproduced." },
    ],
  },

  // ── LESSON 2 ───────────────────────────────────────────────────────────────
  {
    title: "02 // The Forensic Process, Chain of Custody & Order of Volatility",
    summary: "The formal stages of an investigation, how chain of custody keeps evidence admissible, and why you capture the most fragile data first.",
    content: `
      <h2>A process, not a scramble</h2>
      <p>Good forensics follows a repeatable process. A widely used model breaks an investigation into four stages: <strong>Identification → Preservation → Analysis → Reporting</strong>. Skipping or reordering them is how evidence gets lost or thrown out.</p>
      <ol>
        <li><strong>Identification</strong> — find what is relevant: which machines, accounts, files, and data sources matter.</li>
        <li><strong>Preservation</strong> — capture and protect that evidence in a sound, unaltered state (imaging, hashing, custody).</li>
        <li><strong>Analysis</strong> — examine the preserved copies to reconstruct what happened.</li>
        <li><strong>Reporting</strong> — present findings clearly and defensibly, for technical and non-technical audiences.</li>
      </ol>

      <h3>Chain of custody: the evidence's paper trail</h3>
      <p>The <strong>chain of custody</strong> is the unbroken, documented record of who handled a piece of evidence, when, why, and what they did to it — from seizure to courtroom. Every transfer is logged. A single unexplained gap lets the other side argue the evidence was tampered with, and it can be excluded entirely.</p>
      <p>A custody record answers, for every item:</p>
      <ul>
        <li><strong>What</strong> it is (make, model, serial, capacity) and a unique evidence ID.</li>
        <li><strong>Who</strong> collected it and who has held it since.</li>
        <li><strong>When</strong> each transfer happened (with timezone).</li>
        <li><strong>Where</strong> it has been stored (e.g., a sealed, access-controlled evidence locker).</li>
        <li><strong>Why / how</strong> it was accessed, and the hash proving it didn't change.</li>
      </ul>

      <h3>Order of volatility: capture the fragile first</h3>
      <p>Not all evidence lasts equally long. Some vanishes the instant power is lost; some survives for years. The <strong>order of volatility</strong> (formalised in RFC 3227) tells you to collect the most fragile data first, before it disappears:</p>
      <table>
        <thead><tr><th>Priority</th><th>Evidence</th><th>Lifetime</th></tr></thead>
        <tbody>
          <tr><td>1 (most volatile)</td><td>CPU registers, cache</td><td>Nanoseconds</td></tr>
          <tr><td>2</td><td>RAM, running processes, network connections, ARP cache</td><td>Until power loss / reboot</td></tr>
          <tr><td>3</td><td>Temporary files, swap / pagefile</td><td>Until overwritten</td></tr>
          <tr><td>4</td><td>Disk (files, filesystem metadata)</td><td>Until overwritten or wiped</td></tr>
          <tr><td>5 (least volatile)</td><td>Remote logs, archived backups, physical printouts</td><td>Long-lived</td></tr>
        </tbody>
      </table>

      <blockquote>The classic rookie disaster: pulling the plug on a live machine to "preserve the disk" — and instantly destroying every byte of RAM, every running process, and every live network connection. If the machine is on and you can capture memory safely, <strong>capture memory first.</strong></blockquote>

      <h3>To pull the plug or to shut down gracefully?</h3>
      <p>Once volatile data is captured, how you power off a suspect machine is itself a decision. A graceful shutdown lets the OS write files and tidy logs (changing evidence); pulling the plug freezes the disk but can corrupt open files and triggers encryption lockouts on some systems. There is no universal right answer — you weigh the trade-offs, decide, and <strong>document the decision and your reasoning.</strong></p>
    `,
    quizzes: [
      { id: "for-l2-q1", question: "What is the correct order of the four forensic process stages?", options: ["Analysis → Reporting → Identification → Preservation", "Identification → Preservation → Analysis → Reporting", "Preservation → Reporting → Analysis → Identification", "Reporting → Analysis → Preservation → Identification"], correctAnswerIndex: 1, explanation: "The process runs Identification → Preservation → Analysis → Reporting; preserving before analysing protects the evidence." },
      { id: "for-l2-q2", question: "What is the chain of custody?", options: ["A type of encryption", "The documented, unbroken record of who handled evidence, when, and how", "A list of suspects", "A disk imaging tool"], correctAnswerIndex: 1, explanation: "Chain of custody is the continuous documented trail proving evidence was handled and stored without tampering." },
      { id: "for-l2-q3", question: "What can a single unexplained gap in the chain of custody cause?", options: ["Faster analysis", "The evidence may be challenged as tampered and excluded", "Nothing — gaps are fine", "Automatic conviction"], correctAnswerIndex: 1, explanation: "A custody gap lets the opposing side argue tampering, which can render the evidence inadmissible." },
      { id: "for-l2-q4", question: "According to the order of volatility, which should you capture FIRST?", options: ["Archived backups", "Disk files", "RAM and running processes", "Printouts"], correctAnswerIndex: 2, explanation: "RAM and live state are highly volatile and vanish at power loss, so they are captured before less-volatile disk data." },
      { id: "for-l2-q5", question: "Which evidence is the LEAST volatile?", options: ["CPU registers", "RAM", "Remote/archived logs and backups", "Network connections"], correctAnswerIndex: 2, explanation: "Archived logs and backups are long-lived, the least volatile end of the spectrum." },
      { id: "for-l2-q6", question: "Why is pulling the plug on a live machine often a mistake?", options: ["It is too slow", "It instantly destroys RAM, running processes, and live network state", "It improves the image", "It updates the OS"], correctAnswerIndex: 1, explanation: "Cutting power erases all volatile memory and live state before it can be captured." },
      { id: "for-l2-q7", question: "Which RFC formalises the order of volatility for evidence collection?", options: ["RFC 1918", "RFC 3227", "RFC 2616", "RFC 791"], correctAnswerIndex: 1, explanation: "RFC 3227 ('Guidelines for Evidence Collection and Archiving') describes the order of volatility." },
      { id: "for-l2-q8", question: "When the powering-off decision is genuinely a trade-off, what must you always do?", options: ["Pick randomly", "Document the decision and your reasoning", "Skip the step", "Reboot twice"], correctAnswerIndex: 1, explanation: "When there is no universal right answer, you decide deliberately and document the rationale for defensibility." },
    ],
  },

  // ── LESSON 3 ───────────────────────────────────────────────────────────────
  {
    title: "03 // Evidence Acquisition & Imaging",
    summary: "Making a forensically sound, bit-for-bit copy — write blockers, dd vs E01, and proving integrity with cryptographic hashing.",
    content: `
      <h2>Cloning the scene without disturbing it</h2>
      <p>Acquisition is the act of producing a <strong>forensic image</strong>: a perfect, bit-for-bit copy of the source media that you analyse instead of the original. "Bit-for-bit" matters — you copy <em>every</em> sector, including unallocated space, slack, and deleted-but-not-overwritten data, not just the visible files.</p>

      <h3>The write blocker: read without writing</h3>
      <p>The moment you connect a suspect drive to your workstation, the OS may try to write to it — mounting it, updating timestamps, even creating recovery files. A <strong>write blocker</strong> sits between the drive and your machine and physically (or in software) permits reads while denying every write. It is the hardware embodiment of "do not alter the original." Hardware write blockers are preferred for legal work because they cannot be bypassed by a misbehaving OS.</p>

      <h3>Imaging formats</h3>
      <table>
        <thead><tr><th>Format</th><th>What it is</th><th>Notes</th></tr></thead>
        <tbody>
          <tr><td><strong>Raw / dd</strong></td><td>A plain, exact byte stream of the source.</td><td>Universal, simple; no built-in metadata or compression.</td></tr>
          <tr><td><strong>E01 (EnCase)</strong></td><td>An "Expert Witness" forensic container.</td><td>Stores case metadata, compresses, and embeds checksums for integrity.</td></tr>
          <tr><td><strong>AFF4</strong></td><td>An open advanced forensic format.</td><td>Supports large/sparse images and rich metadata.</td></tr>
        </tbody>
      </table>
      <p>A classic raw acquisition on Linux uses <code>dd</code> or the forensic-aware <code>dcfldd</code> / <code>dc3dd</code> (which add hashing and progress):</p>
      <pre><code>dc3dd if=/dev/sdb of=evidence.dd hash=sha256 log=acquire.log</code></pre>
      <p>Here <code>if</code> is the input (the suspect device, behind a write blocker), <code>of</code> is the output image file, and the tool hashes as it reads.</p>

      <h3>Hashing: the integrity fingerprint</h3>
      <p>A <strong>cryptographic hash</strong> (MD5, SHA-1, SHA-256) reduces an entire image to a short fixed-length fingerprint. Change a single bit and the hash changes completely. The acquisition workflow is:</p>
      <ol>
        <li>Hash the <strong>source</strong> before imaging.</li>
        <li>Image it through a write blocker.</li>
        <li>Hash the <strong>resulting image</strong>.</li>
        <li>Confirm the two hashes <strong>match</strong> — proof the copy is identical to the original.</li>
      </ol>
      <pre><code>sha256sum /dev/sdb      # source
sha256sum evidence.dd   # image  → must be identical</code></pre>
      <p>From then on, anyone can re-hash the image and confirm it has not changed since acquisition. That is what makes the copy trustworthy in court.</p>

      <blockquote>MD5 and SHA-1 are cryptographically broken for <em>collision resistance</em>, but they remain useful for <strong>integrity verification</strong> in forensics — accidentally producing two different images with the same hash effectively never happens. Many examiners record multiple hashes (e.g., MD5 + SHA-256) to remove any doubt.</blockquote>

      <h3>Live vs dead acquisition</h3>
      <p><strong>Dead (static) acquisition</strong> images a powered-off disk — the cleanest, most reproducible method. <strong>Live acquisition</strong> captures data from a running system (mandatory for RAM, and sometimes the only option for full-disk-encrypted machines that would be unreadable once powered down). Live acquisition unavoidably touches the system, so you document exactly what you ran and why.</p>
    `,
    quizzes: [
      { id: "for-l3-q1", question: "What does 'bit-for-bit' forensic image mean?", options: ["Only the visible files are copied", "Every sector is copied, including unallocated, slack, and deleted data", "A compressed summary of the disk", "A screenshot of the desktop"], correctAnswerIndex: 1, explanation: "A bit-for-bit image copies every sector, capturing deleted and unallocated data the live OS hides." },
      { id: "for-l3-q2", question: "What is the purpose of a write blocker?", options: ["To speed up copying", "To allow reads from the source while preventing any writes to it", "To encrypt the image", "To delete temporary files"], correctAnswerIndex: 1, explanation: "A write blocker permits reads but blocks writes, preventing the OS from altering the original evidence." },
      { id: "for-l3-q3", question: "Which imaging format embeds case metadata and integrity checksums?", options: ["Raw dd", "E01 (EnCase Expert Witness)", "A plain ZIP", "JPEG"], correctAnswerIndex: 1, explanation: "E01 is a forensic container that stores metadata, compression, and embedded checksums; raw dd is just a byte stream." },
      { id: "for-l3-q4", question: "How do you prove a forensic image is identical to the source?", options: ["Compare file counts", "Hash the source and the image and confirm the hashes match", "Open both and eyeball them", "Trust the imaging tool blindly"], correctAnswerIndex: 1, explanation: "Matching cryptographic hashes of source and image prove the copy is a faithful, unaltered duplicate." },
      { id: "for-l3-q5", question: "What happens to a hash if a single bit of the image changes?", options: ["Nothing", "The hash changes completely", "Only the last digit changes", "The file size changes but not the hash"], correctAnswerIndex: 1, explanation: "Cryptographic hashes exhibit the avalanche effect — one changed bit produces a totally different hash." },
      { id: "for-l3-q6", question: "Why are MD5/SHA-1 still acceptable for forensic integrity checks?", options: ["They are collision-proof", "Accidental hash collisions effectively never occur, so they verify integrity well", "They are faster than reading the disk", "Courts require only MD5"], correctAnswerIndex: 1, explanation: "Though weak against deliberate collisions, accidental collisions are practically impossible, so they reliably detect change." },
      { id: "for-l3-q7", question: "When is LIVE acquisition necessary rather than dead acquisition?", options: ["Never", "For RAM capture and for full-disk-encrypted systems unreadable when powered down", "Only for printers", "Only on weekends"], correctAnswerIndex: 1, explanation: "RAM must be captured live, and encrypted disks may be unreadable once powered off, forcing live acquisition." },
      { id: "for-l3-q8", question: "In `dc3dd if=/dev/sdb of=evidence.dd`, what is /dev/sdb?", options: ["The output image", "The input source device being imaged", "A log file", "The hash value"], correctAnswerIndex: 1, explanation: "'if' is the input file/device — here the suspect drive (read through a write blocker)." },
    ],
  },

  // ── LESSON 4 ───────────────────────────────────────────────────────────────
  {
    title: "04 // Disk & Filesystem Artifacts",
    summary: "How NTFS and ext4 store data, why deleted files survive, and reading the MFT, slack space, and carving the unallocated regions.",
    content: `
      <h2>The filesystem is a map — learn to read it</h2>
      <p>A disk is just sectors of bytes; the <strong>filesystem</strong> is the bookkeeping layer that turns those sectors into files and folders. Forensically, the bookkeeping is often more revealing than the files themselves, because it records timestamps, sizes, and the locations of data that the user thinks is gone.</p>

      <h3>NTFS and the Master File Table</h3>
      <p>Windows uses <strong>NTFS</strong>. Its heart is the <strong>Master File Table (<code>$MFT</code>)</strong> — a record for every file and directory on the volume. Each MFT record stores the file's name, size, and crucially its <strong>MAC(b) timestamps</strong>:</p>
      <table>
        <thead><tr><th>Timestamp</th><th>Meaning</th></tr></thead>
        <tbody>
          <tr><td><strong>M</strong> — Modified</td><td>When the file's content last changed.</td></tr>
          <tr><td><strong>A</strong> — Accessed</td><td>When it was last read (often disabled for performance).</td></tr>
          <tr><td><strong>C</strong> — Changed (MFT)</td><td>When the MFT metadata record itself changed.</td></tr>
          <tr><td><strong>B</strong> — Born</td><td>When the file was created.</td></tr>
        </tbody>
      </table>
      <p>NTFS also keeps the <code>$LogFile</code> and <code>$UsnJrnl</code> (the USN change journal), which record filesystem changes — a goldmine for proving a file existed, was renamed, or was deleted even after the file is gone.</p>

      <h3>ext4 and inodes</h3>
      <p>Linux commonly uses <strong>ext4</strong>. Here the metadata lives in <strong>inodes</strong> — each inode stores ownership, permissions, size, block pointers, and timestamps (atime/mtime/ctime, plus crtime on ext4). The journal records pending changes. Different structure, same investigative idea: the metadata tells the story.</p>

      <h3>Why "deleted" rarely means "gone"</h3>
      <p>When you delete a file, the OS usually just marks its blocks as <strong>unallocated</strong> (free for reuse) and unlinks its directory entry. The actual bytes stay on disk until something else overwrites them. This is why deleted files are so often recoverable — and why a write blocker matters, since careless access can be the very thing that overwrites them.</p>
      <ul>
        <li><strong>Unallocated space</strong> — blocks not currently assigned to a file; full of deleted-file remnants.</li>
        <li><strong>File slack</strong> — the leftover space between the end of a file's real data and the end of its last cluster. It can contain fragments of whatever was there before.</li>
      </ul>

      <h3>File carving: recovering data without metadata</h3>
      <p>When the filesystem metadata is gone, you <strong>carve</strong>: scan the raw bytes for known file <strong>signatures</strong> (magic numbers) — e.g. <code>FF D8 FF</code> begins a JPEG, <code>%PDF</code> begins a PDF — and reconstruct files from their headers/footers regardless of the filesystem. Tools like Sleuth Kit (<code>fls</code>, <code>icat</code>), Autopsy, <code>foremost</code>, and <code>scalpel</code> do this routinely:</p>
      <pre><code># List files (including deleted, marked *) from an NTFS image
fls -r -p evidence.dd

# Recover the data behind a specific inode/MFT entry
icat evidence.dd 12345 > recovered.docx</code></pre>

      <blockquote>The metadata can outlive the file and the file can outlive its metadata. A complete examiner checks both: the MFT/inode records <em>and</em> the raw unallocated bytes. Stopping at the visible file system means missing most of the evidence.</blockquote>
    `,
    quizzes: [
      { id: "for-l4-q1", question: "What is the Master File Table ($MFT) in NTFS?", options: ["A list of installed programs", "A record for every file and directory, holding names, sizes, and timestamps", "The Windows registry", "A network log"], correctAnswerIndex: 1, explanation: "The $MFT stores a metadata record for every file/directory on an NTFS volume, including MAC(b) timestamps." },
      { id: "for-l4-q2", question: "What do the NTFS MAC(b) timestamps represent?", options: ["MAC addresses", "Modified, Accessed, Changed (MFT), Born (created) times", "Memory addresses", "Mount points"], correctAnswerIndex: 1, explanation: "MAC(b) = Modified, Accessed, Changed-MFT, and Born/creation timestamps for a file." },
      { id: "for-l4-q3", question: "When a file is deleted, what typically happens to its data?", options: ["It is immediately overwritten with zeros", "Its blocks are marked unallocated but the bytes remain until overwritten", "It is encrypted", "It moves to the MFT permanently"], correctAnswerIndex: 1, explanation: "Deletion usually just frees the blocks and unlinks the entry; the data persists until reused, enabling recovery." },
      { id: "for-l4-q4", question: "What is file slack?", options: ["Free RAM", "The leftover space between a file's real data end and the end of its last cluster", "A backup copy", "A network buffer"], correctAnswerIndex: 1, explanation: "Slack is unused space in a file's final cluster that can hold fragments of previously stored data." },
      { id: "for-l4-q5", question: "What is file carving?", options: ["Splitting a disk into partitions", "Recovering files by scanning raw bytes for known signatures, ignoring filesystem metadata", "Deleting files securely", "Compressing an image"], correctAnswerIndex: 1, explanation: "Carving reconstructs files from header/footer signatures in the raw data even when metadata is missing." },
      { id: "for-l4-q6", question: "On Linux ext4, where does a file's metadata (owner, permissions, timestamps) live?", options: ["In the registry", "In its inode", "In the pagefile", "In the MFT"], correctAnswerIndex: 1, explanation: "ext4 stores per-file metadata in inodes; NTFS uses MFT records — different structures, same investigative value." },
      { id: "for-l4-q7", question: "Which byte signature marks the start of a JPEG file?", options: ["%PDF", "FF D8 FF", "PK", "MZ"], correctAnswerIndex: 1, explanation: "JPEGs begin with FF D8 FF; carving tools match such magic numbers to reconstruct files." },
      { id: "for-l4-q8", question: "Why should an examiner inspect BOTH metadata and unallocated bytes?", options: ["To waste time", "Because metadata can outlive a file and a file can outlive its metadata", "Metadata is always enough", "Unallocated space is always empty"], correctAnswerIndex: 1, explanation: "Evidence hides in both places; checking only the visible filesystem misses deleted data and orphaned metadata." },
    ],
  },

  // ── LESSON 5 ───────────────────────────────────────────────────────────────
  {
    title: "05 // Memory Forensics with Volatility",
    summary: "Why RAM is a treasure trove, capturing it before it vanishes, and using Volatility to find hidden processes, injected code, and rogue network loops.",
    content: `
      <h2>The evidence that disappears at the speed of light</h2>
      <p><strong>RAM (random-access memory)</strong> holds the live state of a running system: every active process, open network connection, decrypted data, command history, injected code, and often encryption keys and passwords in cleartext. It is also <strong>volatile</strong> — lose power and it is gone forever. That combination makes a memory image one of the highest-value, most fragile pieces of evidence you will ever collect.</p>

      <h3>Why memory matters more than ever</h3>
      <p>Modern malware increasingly runs <strong>fileless</strong> — living only in memory, never writing a payload to disk — precisely to evade disk forensics and antivirus. Process injection and process hollowing hide malicious code inside legitimate processes. None of that shows up cleanly on the disk. If you skip memory, you miss it entirely.</p>

      <h3>Capturing memory</h3>
      <p>Memory capture is a <em>live</em> acquisition (Lesson 3) and must respect the order of volatility — do it early. Common tools:</p>
      <ul>
        <li><strong>WinPmem / DumpIt / FTK Imager / Magnet RAM Capture</strong> — Windows memory acquisition.</li>
        <li><strong>LiME (Linux Memory Extractor) / AVML</strong> — Linux memory acquisition.</li>
      </ul>
      <p>The result is a raw memory image (e.g. <code>memdump.raw</code>) you analyse offline — never on the suspect host.</p>

      <h3>Volatility: the memory microscope</h3>
      <p><strong>Volatility</strong> is the standard open-source memory-forensics framework. It parses a raw dump and reconstructs the OS structures so you can interrogate the system as it was at capture. Core analyses:</p>
      <table>
        <thead><tr><th>What you want</th><th>Volatility 3 plugin</th><th>Why it matters</th></tr></thead>
        <tbody>
          <tr><td>Running processes</td><td><code>windows.pslist</code></td><td>Lists processes from the active linked list.</td></tr>
          <tr><td>Hidden / unlinked processes</td><td><code>windows.psscan</code></td><td>Scans memory for process structures even if unlinked to hide them.</td></tr>
          <tr><td>Parent/child hierarchy</td><td><code>windows.pstree</code></td><td>Reveals suspicious parentage (e.g. Word spawning PowerShell).</td></tr>
          <tr><td>Network connections</td><td><code>windows.netscan</code></td><td>Finds live and recent C2 connections / rogue loops.</td></tr>
          <tr><td>Injected code</td><td><code>windows.malfind</code></td><td>Flags executable memory regions with no backing file — classic injection.</td></tr>
          <tr><td>Loaded DLLs / handles</td><td><code>windows.dlllist</code></td><td>Spots disguised or unusual modules.</td></tr>
        </tbody>
      </table>
      <pre><code># List processes, then hunt for unlinked/hidden ones, then injected code
vol.py -f memdump.raw windows.pslist
vol.py -f memdump.raw windows.psscan
vol.py -f memdump.raw windows.malfind</code></pre>

      <h3>Hunting the rogue process</h3>
      <p>The investigative core (and this course's lab) is spotting a process that does not belong. Tell-tales:</p>
      <ul>
        <li><strong>Wrong path</strong> — a system binary like <code>svchost.exe</code> running from <code>C:\\Users\\Public\\</code> instead of <code>C:\\Windows\\System32\\</code> is masquerading.</li>
        <li><strong>Wrong parent</strong> — <code>svchost.exe</code> not spawned by <code>services.exe</code>, or Office apps spawning shells.</li>
        <li><strong>Hidden from pslist but visible in psscan</strong> — a process actively unlinking itself to hide.</li>
        <li><strong>Executable+writable memory with no file backing</strong> — the fingerprint of <strong>process hollowing</strong>: a legitimate process is started suspended and its memory replaced with malicious code.</li>
      </ul>

      <blockquote>Compare <code>pslist</code> (the OS's own list) against <code>psscan</code> (a brute-force scan of memory). A process that appears in one but not the other is hiding. That discrepancy is one of the most reliable signals in all of memory forensics.</blockquote>
    `,
    quizzes: [
      { id: "for-l5-q1", question: "Why is RAM described as 'volatile' evidence?", options: ["It is encrypted", "It is lost when the system loses power or reboots", "It is stored on disk", "It cannot be copied"], correctAnswerIndex: 1, explanation: "RAM needs continuous power; when the machine powers down, its contents are permanently lost." },
      { id: "for-l5-q2", question: "Why is memory forensics essential against modern malware?", options: ["Malware is always on disk", "Fileless and injected malware can run only in RAM, leaving little on disk", "RAM is easier to image than disk", "Antivirus already covers it"], correctAnswerIndex: 1, explanation: "Fileless/in-memory malware evades disk forensics; only a memory image reveals it." },
      { id: "for-l5-q3", question: "What is the standard open-source framework for memory analysis?", options: ["Wireshark", "Volatility", "Nmap", "Photoshop"], correctAnswerIndex: 1, explanation: "Volatility is the de facto open-source framework for parsing and analysing memory images." },
      { id: "for-l5-q4", question: "What does comparing pslist with psscan help you find?", options: ["Disk slack", "Hidden/unlinked processes that appear in one list but not the other", "Open ports only", "Registry keys"], correctAnswerIndex: 1, explanation: "pslist reads the OS list; psscan brute-force scans memory — a discrepancy reveals a process hiding itself." },
      { id: "for-l5-q5", question: "Which Volatility plugin flags injected code in executable memory with no file backing?", options: ["pslist", "malfind", "dlllist", "netscan"], correctAnswerIndex: 1, explanation: "malfind locates executable memory regions lacking a backing file — a hallmark of code injection." },
      { id: "for-l5-q6", question: "A svchost.exe running from C:\\Users\\Public\\ instead of System32 indicates what?", options: ["A normal update", "Masquerading — a process disguised as a legitimate system binary", "A faster disk", "A printer driver"], correctAnswerIndex: 1, explanation: "Critical binaries must run from System32; an unusual path signals masquerading malware." },
      { id: "for-l5-q7", question: "Process hollowing is best described as…", options: ["Deleting a process", "Starting a legitimate process suspended and replacing its memory with malicious code", "Renaming a file", "Encrypting RAM"], correctAnswerIndex: 1, explanation: "Hollowing launches a benign process suspended, then swaps its in-memory image for malicious code." },
      { id: "for-l5-q8", question: "When should memory be captured relative to other evidence?", options: ["Last, after imaging the disk", "Early/first, because it is highly volatile", "It does not matter", "Only after rebooting"], correctAnswerIndex: 1, explanation: "Per the order of volatility, capture RAM early — before power loss or reboot destroys it." },
    ],
  },

  // ── LESSON 6 ───────────────────────────────────────────────────────────────
  {
    title: "06 // OS & User Artifacts: Registry, Prefetch, Browser & Logs",
    summary: "The footprints users and programs leave behind — Windows registry hives, prefetch, browser history, and event logs that reveal what ran and when.",
    content: `
      <h2>Every action leaves a footprint</h2>
      <p>Beyond raw files, operating systems constantly record <strong>user and execution artifacts</strong>: traces of what programs ran, what devices were plugged in, what sites were visited, and who logged on. These artifacts are where you reconstruct <em>behaviour</em>, not just file contents. On Windows they are especially rich.</p>

      <h3>The Windows Registry: a database of everything</h3>
      <p>The <strong>registry</strong> is a hierarchical configuration database stored in <strong>hive</strong> files (<code>SYSTEM</code>, <code>SOFTWARE</code>, <code>SECURITY</code>, <code>SAM</code>, and per-user <code>NTUSER.DAT</code>). It is dense with forensic gold:</p>
      <table>
        <thead><tr><th>Artifact</th><th>Where</th><th>What it reveals</th></tr></thead>
        <tbody>
          <tr><td>Run / RunOnce keys</td><td>SOFTWARE / NTUSER.DAT</td><td>Programs set to auto-start — a classic persistence spot.</td></tr>
          <tr><td>UserAssist</td><td>NTUSER.DAT</td><td>GUI programs the user launched, with run counts and times.</td></tr>
          <tr><td>ShimCache / AppCompatCache &amp; Amcache</td><td>SYSTEM / Amcache.hve</td><td>Evidence a program existed/executed, even if since deleted.</td></tr>
          <tr><td>USBSTOR</td><td>SYSTEM</td><td>History of USB devices ever connected.</td></tr>
          <tr><td>Recent/typed paths (MRU)</td><td>NTUSER.DAT</td><td>Recently opened files and typed locations.</td></tr>
        </tbody>
      </table>

      <h3>Prefetch: proof a program ran</h3>
      <p>Windows writes a <code>.pf</code> file in <code>C:\\Windows\\Prefetch\\</code> the first time an executable runs, to speed future launches. To a forensic examiner it is a confession: the prefetch file records the executable's name, <strong>how many times it ran</strong>, and the <strong>last run time(s)</strong>. Even if the malware is deleted, its prefetch entry can prove it executed.</p>

      <h3>Browser artifacts</h3>
      <p>Browsers store history, downloads, cookies, cache, and autofill — usually in <strong>SQLite</strong> databases (e.g. Chrome's <code>History</code> file). These reveal visited sites, search terms, downloaded payloads, and timestamps. Forensic suites and simple SQLite queries extract them. "Deleted" history often persists in the database's free pages or in unallocated space.</p>

      <h3>Windows Event Logs</h3>
      <p>The <code>.evtx</code> event logs record system, security, and application events. The ones examiners reach for first:</p>
      <ul>
        <li><strong>Security log</strong> — Event ID <code>4624</code> (successful logon), <code>4625</code> (failed logon), <code>4634</code> (logoff), <code>4672</code> (special/admin privileges assigned).</li>
        <li><strong>System log</strong> — service installs, driver loads, time changes.</li>
        <li><strong>Sysmon (if deployed)</strong> — high-fidelity process creation (Event ID 1), network connections, and image loads.</li>
      </ul>

      <h3>Linux equivalents</h3>
      <p>The same questions have Linux answers: <code>~/.bash_history</code> for commands, <code>/var/log/auth.log</code> and <code>wtmp/btmp/lastlog</code> for logons, <code>/var/log/syslog</code> for system events, and cron/systemd unit files for persistence.</p>

      <blockquote>No single artifact is proof on its own — but together they corroborate. Prefetch says <em>malware.exe ran twice</em>; a Run key says <em>it was set to persist</em>; the Security log says <em>who was logged on at the time</em>; the browser history says <em>where it was downloaded from</em>. Corroboration across artifacts is what makes a finding bulletproof.</blockquote>
    `,
    quizzes: [
      { id: "for-l6-q1", question: "What is the Windows Registry?", options: ["A network protocol", "A hierarchical configuration database stored in hive files", "A type of malware", "A disk partition"], correctAnswerIndex: 1, explanation: "The registry is a hierarchical config database (SYSTEM, SOFTWARE, SAM, NTUSER.DAT, etc.) rich in forensic artifacts." },
      { id: "for-l6-q2", question: "What does a Prefetch (.pf) file prove?", options: ["A file was deleted", "That an executable ran, how many times, and when last", "The disk is full", "A user changed their password"], correctAnswerIndex: 1, explanation: "Prefetch records execution evidence — name, run count, and last run time — even if the program is later deleted." },
      { id: "for-l6-q3", question: "Which registry artifact is a classic auto-start persistence location?", options: ["Run / RunOnce keys", "The pagefile", "File slack", "The MFT"], correctAnswerIndex: 0, explanation: "Run/RunOnce keys launch programs at startup/login and are a common persistence mechanism." },
      { id: "for-l6-q4", question: "Where is most browser history typically stored?", options: ["In the registry SAM hive", "In SQLite databases", "In the pagefile only", "In prefetch files"], correctAnswerIndex: 1, explanation: "Modern browsers store history, downloads, and cookies in SQLite databases that examiners can query." },
      { id: "for-l6-q5", question: "Which Windows Security event ID indicates a successful logon?", options: ["4625", "4624", "1102", "7045"], correctAnswerIndex: 1, explanation: "Event ID 4624 is a successful logon; 4625 is a failed logon." },
      { id: "for-l6-q6", question: "What does the USBSTOR registry key reveal?", options: ["Installed fonts", "History of USB devices connected to the system", "Browser passwords", "Open network ports"], correctAnswerIndex: 1, explanation: "USBSTOR records USB storage devices ever attached — useful for data-exfiltration cases." },
      { id: "for-l6-q7", question: "On Linux, where would you look for a user's command history?", options: ["NTUSER.DAT", "~/.bash_history", "C:\\Windows\\Prefetch", "The MFT"], correctAnswerIndex: 1, explanation: "~/.bash_history records shell commands run by a user — the Linux analogue of execution artifacts." },
      { id: "for-l6-q8", question: "Why combine multiple artifacts instead of relying on one?", options: ["To make the report longer", "Because corroboration across artifacts makes a finding far more defensible", "One artifact is illegal to use", "Artifacts contradict each other by design"], correctAnswerIndex: 1, explanation: "Independent artifacts that agree (ran / persisted / who / from where) build a bulletproof, corroborated conclusion." },
    ],
  },

  // ── LESSON 7 ───────────────────────────────────────────────────────────────
  {
    title: "07 // Timeline Analysis & Correlation",
    summary: "Turning scattered artifacts into one chronological story — MAC(b) times, super timelines with Plaso, and correlating events into a narrative.",
    content: `
      <h2>The story is in the order</h2>
      <p>Individually, artifacts are fragments. Arranged on a <strong>timeline</strong>, they become a narrative: the attacker arrived <em>here</em>, downloaded <em>this</em>, ran <em>that</em>, and left <em>then</em>. Timeline analysis is the discipline of placing every dated artifact on a single chronological axis and reading the sequence.</p>

      <h3>Time is the universal key</h3>
      <p>Almost every artifact carries timestamps: file MAC(b) times, registry key last-write times, prefetch last-run, event-log times, browser visit times. Because time is common to all of them, it is the natural axis on which to <strong>correlate</strong> evidence from different sources into one view.</p>

      <h3>The super timeline</h3>
      <p>A <strong>super timeline</strong> merges every timestamped artifact from a system (and even multiple systems) into one massive, sorted chronology. The standard tool is <strong>Plaso</strong> and its engine <code>log2timeline</code>, which extracts timestamps from dozens of artifact types and outputs a unified timeline you analyse in <code>psort</code>, Timeline Explorer, or Timesketch:</p>
      <pre><code># Extract every timestamped artifact into a Plaso storage file
log2timeline.py timeline.plaso evidence.dd

# Sort and filter into a reviewable CSV
psort.py -o l2tcsv -w timeline.csv timeline.plaso</code></pre>
      <p>The power is also the peril: a super timeline can contain millions of lines, so you filter to a time window of interest and pivot around a known event (a "pivot point") rather than reading it top to bottom.</p>

      <h3>Timezones and clock skew — the silent killers</h3>
      <p>This is the single most common way a timeline goes wrong. Different artifacts may be stored in <strong>UTC</strong> (NTFS records file times in UTC) or in <strong>local time</strong> (some logs), and multiple machines may have <strong>skewed clocks</strong>. Mixing them silently produces an order that is hours off:</p>
      <ul>
        <li><strong>Normalise to one timezone</strong> — convert everything to UTC before comparing.</li>
        <li><strong>Record the system's timezone</strong> — read it from the registry (<code>SYSTEM\\CurrentControlSet\\Control\\TimeZoneInformation</code>) and note it.</li>
        <li><strong>Check for clock changes</strong> — a system-clock change is itself an artifact (and a possible anti-forensic act).</li>
      </ul>

      <h3>Building the narrative</h3>
      <p>Reading a timeline, you look for the causal chain. For example:</p>
      <pre><code>08:14:02Z  Browser visit to malicious-download[.]example
08:14:55Z  invoice.exe created in C:\\Users\\alice\\Downloads\\
08:15:09Z  Prefetch shows invoice.exe executed (run count 1)
08:15:10Z  svchost.exe (rogue) created in C:\\Users\\Public\\
08:16:30Z  netscan: outbound connection to attacker C2 IP</code></pre>
      <p>No single line is the whole story; the <em>sequence</em> — download → execute → spawn rogue process → call home — is the story. That is the deliverable.</p>

      <blockquote>The most dangerous timeline is one built from artifacts in two different timezones without anyone noticing. Always confirm and normalise time before you trust the order — a timeline that is silently five hours off can frame the innocent and exonerate the guilty.</blockquote>
    `,
    quizzes: [
      { id: "for-l7-q1", question: "What is the goal of timeline analysis?", options: ["To delete old artifacts", "To place dated artifacts on one chronological axis and read the sequence", "To encrypt evidence", "To count files"], correctAnswerIndex: 1, explanation: "Timeline analysis orders timestamped artifacts chronologically to reconstruct what happened and in what sequence." },
      { id: "for-l7-q2", question: "Why is time the natural key for correlating artifacts?", options: ["Time is encrypted", "Nearly every artifact carries timestamps, giving a common axis to merge sources", "Only files have timestamps", "Time is irrelevant"], correctAnswerIndex: 1, explanation: "Because files, registry, logs, prefetch, and browsers all record times, time unifies disparate evidence." },
      { id: "for-l7-q3", question: "What is a super timeline?", options: ["A single log file", "A merged, sorted chronology of every timestamped artifact from a system", "A list of users", "A disk partition map"], correctAnswerIndex: 1, explanation: "A super timeline combines all timestamped artifacts into one unified, sorted chronology." },
      { id: "for-l7-q4", question: "Which tool/engine is standard for building super timelines?", options: ["Volatility", "Plaso / log2timeline", "Wireshark", "Nmap"], correctAnswerIndex: 1, explanation: "Plaso (with log2timeline and psort) extracts and merges timestamps into a unified timeline." },
      { id: "for-l7-q5", question: "What is the most common cause of a wrong timeline?", options: ["Too few artifacts", "Mixing artifacts in different timezones / skewed clocks without noticing", "Using UTC", "Sorting the data"], correctAnswerIndex: 1, explanation: "Combining UTC and local-time artifacts, or skewed clocks, silently produces an order that is hours off." },
      { id: "for-l7-q6", question: "How should you handle timestamps from multiple sources before comparing?", options: ["Leave them as-is", "Normalise everything to a single timezone (e.g. UTC)", "Delete the timestamps", "Round to the nearest hour"], correctAnswerIndex: 1, explanation: "Normalising all times to one timezone (commonly UTC) is essential for an accurate, comparable timeline." },
      { id: "for-l7-q7", question: "In a huge super timeline, what is the practical analysis strategy?", options: ["Read it top to bottom", "Filter to a window of interest and pivot around a known event", "Print all of it", "Ignore timestamps"], correctAnswerIndex: 1, explanation: "Super timelines can hold millions of lines; you filter to a time window and pivot around a known event." },
      { id: "for-l7-q8", question: "What turns a list of artifacts into evidence of an attack?", options: ["Their file sizes", "The causal sequence they reveal (e.g. download → execute → C2)", "Their colour", "The number of them"], correctAnswerIndex: 1, explanation: "The chronological sequence — not any single line — reconstructs the attacker's actions into a narrative." },
    ],
  },

  // ── LESSON 8 ───────────────────────────────────────────────────────────────
  {
    title: "08 // Anti-Forensics: How Attackers Hide",
    summary: "The tradecraft adversaries use to destroy, falsify, or hide evidence — log wiping, timestomping, secure deletion, encryption, and how examiners fight back.",
    content: `
      <h2>The evidence fights back</h2>
      <p>Skilled attackers know they may be investigated, so they actively work to <strong>destroy, hide, or falsify</strong> the evidence you depend on. This is <strong>anti-forensics</strong>. Understanding it is essential: it tells you what to look for, and reminds you that absence of evidence is not evidence of absence.</p>

      <h3>The four families of anti-forensics</h3>
      <table>
        <thead><tr><th>Family</th><th>Technique</th><th>Examiner's counter</th></tr></thead>
        <tbody>
          <tr><td><strong>Destruction</strong></td><td>Wiping/deleting logs, secure-erasing files, disk wiping.</td><td>Recover from journals, backups, slack, and remote/forwarded logs.</td></tr>
          <tr><td><strong>Hiding</strong></td><td>Steganography, alternate data streams (NTFS ADS), hidden partitions/volumes.</td><td>Scan for ADS, entropy analysis, full-disk carving.</td></tr>
          <tr><td><strong>Falsification</strong></td><td>Timestomping (faking file times), planting false artifacts.</td><td>Cross-check independent time sources; $MFT vs $STANDARD_INFORMATION.</td></tr>
          <tr><td><strong>Obfuscation / denial</strong></td><td>Encryption, fileless/in-memory execution, packing.</td><td>Live memory capture before shutdown; key recovery from RAM.</td></tr>
        </tbody>
      </table>

      <h3>Log clearing (T1070)</h3>
      <p>Clearing the Windows Security log or deleting <code>/var/log/auth.log</code> is among the most common moves — it maps directly to MITRE <strong>T1070 Indicator Removal</strong>. But it is rarely clean: clearing the Security log <em>itself</em> generates Event ID <code>1102</code>, journals and the USN change journal may retain traces, and centrally-forwarded logs (SIEM, syslog server) sit safely out of the attacker's reach. The act of hiding is itself an artifact.</p>

      <h3>Timestomping</h3>
      <p><strong>Timestomping</strong> alters a file's timestamps to make malware look old and innocuous or to break your timeline. NTFS helps you catch it: each file has timestamps in <em>two</em> attributes — <code>$STANDARD_INFORMATION</code> (easily modified by tools) and <code>$FILE_NAME</code> (harder to forge). A mismatch between them is a strong timestomping indicator. Sub-second precision oddities (e.g. zeroed milliseconds) are another tell.</p>

      <h3>Secure deletion and disk wiping</h3>
      <p>Tools that overwrite data (and the new world of <strong>SSD TRIM</strong>, which proactively erases freed blocks) can genuinely destroy recoverable data — unlike a normal delete. Even so, fragments often survive in slack, the pagefile, hibernation files, backups, or volume shadow copies.</p>

      <h3>Encryption and the memory lifeline</h3>
      <p>Full-disk encryption (BitLocker, LUKS, FileVault) can make a powered-down disk unreadable — which is exactly why <strong>capturing RAM while the machine is live</strong> matters: decryption keys and decrypted data frequently reside in memory. This closes the loop with Lesson 5: order of volatility is not academic; it is sometimes your only path past encryption.</p>

      <blockquote>The investigative reframing: anti-forensics doesn't make evidence vanish so much as <em>move</em> it. Wiped local logs live on a syslog server; an encrypted disk's keys live in RAM; a timestomped file betrays itself in <code>$FILE_NAME</code>. Know where the evidence relocates to, and the attacker's hiding becomes its own trail.</blockquote>
    `,
    quizzes: [
      { id: "for-l8-q1", question: "What is anti-forensics?", options: ["A backup strategy", "Techniques attackers use to destroy, hide, or falsify evidence", "A type of firewall", "A hashing algorithm"], correctAnswerIndex: 1, explanation: "Anti-forensics is the adversary's effort to defeat investigation by destroying, hiding, or faking evidence." },
      { id: "for-l8-q2", question: "Clearing the Windows Security log maps to which MITRE technique?", options: ["T1110 Brute Force", "T1070 Indicator Removal", "T1078 Valid Accounts", "T1595 Active Scanning"], correctAnswerIndex: 1, explanation: "Wiping or clearing logs to hide activity is T1070 Indicator Removal." },
      { id: "for-l8-q3", question: "What artifact is generated when the Windows Security log is cleared?", options: ["Nothing — it is silent", "Event ID 1102", "A new user account", "A prefetch file"], correctAnswerIndex: 1, explanation: "Clearing the Security log itself logs Event ID 1102 — the act of hiding leaves its own trace." },
      { id: "for-l8-q4", question: "What is timestomping?", options: ["Deleting a disk", "Falsifying a file's timestamps to deceive or break the timeline", "Encrypting RAM", "Renaming a process"], correctAnswerIndex: 1, explanation: "Timestomping alters file timestamps so malware looks old/benign or to corrupt the investigator's timeline." },
      { id: "for-l8-q5", question: "How can NTFS help detect timestomping?", options: ["It cannot", "Compare $STANDARD_INFORMATION times against the harder-to-forge $FILE_NAME times", "Check the file size", "Look at the icon"], correctAnswerIndex: 1, explanation: "A mismatch between $STANDARD_INFORMATION and $FILE_NAME timestamps is a strong timestomping indicator." },
      { id: "for-l8-q6", question: "Why does full-disk encryption make capturing RAM so important?", options: ["RAM is encrypted too", "Decryption keys and decrypted data often live in memory while the system is running", "Encryption disables logging", "It does not matter"], correctAnswerIndex: 1, explanation: "A powered-down encrypted disk may be unreadable, but keys/decrypted data in RAM can be recovered if captured live." },
      { id: "for-l8-q7", question: "When local logs are wiped, where might the evidence still exist?", options: ["Nowhere", "Centrally-forwarded logs on a SIEM/syslog server, journals, slack, and backups", "Only in the deleted log", "In the CPU cache forever"], correctAnswerIndex: 1, explanation: "Forwarded logs, journals, slack space, and backups often retain evidence beyond the attacker's reach." },
      { id: "for-l8-q8", question: "What is the key investigative takeaway about anti-forensics?", options: ["Evidence truly vanishes", "Anti-forensics often relocates evidence rather than erasing it, and hiding leaves its own traces", "Investigation is pointless", "Encryption defeats all forensics"], correctAnswerIndex: 1, explanation: "Hidden/destroyed evidence frequently moves elsewhere (RAM, forwarded logs, $FILE_NAME), and the act of hiding is itself an artifact." },
    ],
  },

  // ── LESSON 9 ───────────────────────────────────────────────────────────────
  {
    title: "09 // Mapping Forensic Findings to MITRE ATT&CK",
    summary: "Speaking the industry's shared language — turning artifacts into ATT&CK techniques, with a focus on Defense Evasion and T1070 Indicator Removal.",
    content: `
      <h2>From artifacts to a shared language</h2>
      <p><strong>MITRE ATT&CK</strong> is a free, globally-used knowledge base of real adversary behaviours, organised as <strong>tactics</strong> (the goal — the "why") containing <strong>techniques</strong> (the method — the "how"), each with an ID like <code>T1070</code>. In forensics, ATT&CK is how you translate raw artifacts into behaviours every analyst, report reader, and auditor understands instantly.</p>

      <h3>Each artifact tells you a technique</h3>
      <p>Forensic analysis is, in large part, recognising which ATT&CK technique an artifact evidences. Mapping our investigation end to end:</p>
      <table>
        <thead><tr><th>Artifact you found</th><th>ATT&CK Tactic</th><th>Technique</th></tr></thead>
        <tbody>
          <tr><td>Malicious download in browser history + new exe</td><td>Initial Access</td><td>T1566 Phishing / T1189 Drive-by</td></tr>
          <tr><td>Prefetch shows a dropped binary executed</td><td>Execution</td><td>T1204 User Execution</td></tr>
          <tr><td>Run key / scheduled task created</td><td>Persistence</td><td>T1547 / T1053 Scheduled Task</td></tr>
          <tr><td>svchost.exe running from C:\\Users\\Public\\</td><td>Defense Evasion</td><td>T1036 Masquerading</td></tr>
          <tr><td>Injected code in a hollowed process (malfind)</td><td>Defense Evasion</td><td>T1055 Process Injection</td></tr>
          <tr><td>Cleared Security log / deleted auth.log</td><td>Defense Evasion</td><td>T1070 Indicator Removal</td></tr>
          <tr><td>Outbound C2 connection (netscan)</td><td>Command &amp; Control</td><td>T1071 Application Layer Protocol</td></tr>
          <tr><td>Large data archive copied to USB</td><td>Exfiltration</td><td>T1052 Exfiltration over Physical Medium</td></tr>
        </tbody>
      </table>

      <h3>Defense Evasion — the forensic examiner's nemesis</h3>
      <p>An entire ATT&CK tactic, <strong>Defense Evasion</strong>, is dedicated to defeating detection and investigation — which is precisely your battleground. Its techniques are the anti-forensics of Lesson 8 in ATT&CK's vocabulary:</p>
      <ul>
        <li><strong>T1070 Indicator Removal</strong> — clearing event logs (T1070.001), deleting files (.004), timestomping (.006). The flagship anti-forensic technique.</li>
        <li><strong>T1036 Masquerading</strong> — renaming/relocating malware to look like a legitimate system process (the rogue <code>svchost.exe</code>).</li>
        <li><strong>T1055 Process Injection</strong> — running code inside another process to hide it (what <code>malfind</code> catches).</li>
        <li><strong>T1027 Obfuscated/Compressed Files</strong> — packing or encrypting payloads to resist analysis.</li>
      </ul>

      <h3>Why this matters in practice</h3>
      <ul>
        <li><strong>Communication</strong> — "we found T1036 leading to T1055 and T1070" is instantly understood anywhere.</li>
        <li><strong>Coverage &amp; gaps</strong> — mapping findings onto the matrix shows which adversary behaviours your visibility can and cannot reconstruct.</li>
        <li><strong>Reporting</strong> — leadership, auditors, and legal increasingly expect ATT&CK-mapped findings.</li>
        <li><strong>Threat-informed defence</strong> — what you find in forensics feeds back into the detections that catch the next intrusion earlier.</li>
      </ul>

      <blockquote>Takeaway: an intrusion is a <strong>chain of techniques</strong>, and forensics reconstructs that chain artifact by artifact. ATT&CK gives you the map; your evidence places the adversary on it — and the Defense Evasion column is where their effort to erase that placement, paradoxically, leaves its own marks.</blockquote>
    `,
    quizzes: [
      { id: "for-l9-q1", question: "What is MITRE ATT&CK?", options: ["A forensic imaging tool", "A free knowledge base of real adversary tactics and techniques", "A type of encryption", "A Linux distribution"], correctAnswerIndex: 1, explanation: "ATT&CK is a globally-used, free catalogue of adversary behaviours organised as tactics and techniques." },
      { id: "for-l9-q2", question: "Clearing event logs and timestomping fall under which tactic and technique?", options: ["Initial Access / T1566", "Defense Evasion / T1070 Indicator Removal", "Execution / T1204", "Exfiltration / T1052"], correctAnswerIndex: 1, explanation: "Removing or falsifying evidence is Defense Evasion, specifically T1070 Indicator Removal." },
      { id: "for-l9-q3", question: "A svchost.exe disguised in a non-standard path maps to which technique?", options: ["T1070 Indicator Removal", "T1036 Masquerading", "T1071 Application Layer Protocol", "T1110 Brute Force"], correctAnswerIndex: 1, explanation: "Disguising malware as a legitimate system process is T1036 Masquerading." },
      { id: "for-l9-q4", question: "Injected code found by Volatility's malfind corresponds to which technique?", options: ["T1055 Process Injection", "T1547 Boot/Logon Autostart", "T1052 Exfiltration over Physical Medium", "T1189 Drive-by Compromise"], correctAnswerIndex: 0, explanation: "Code running inside another process to hide is T1055 Process Injection — exactly what malfind detects." },
      { id: "for-l9-q5", question: "Why is the Defense Evasion tactic especially relevant to forensic examiners?", options: ["It is unrelated to forensics", "Its techniques are designed to defeat detection and investigation — the examiner's battleground", "It only affects networks", "It is purely theoretical"], correctAnswerIndex: 1, explanation: "Defense Evasion techniques aim to erase, hide, or fake evidence — directly opposing the forensic examiner." },
      { id: "for-l9-q6", question: "Prefetch evidence that a dropped binary executed best maps to which tactic?", options: ["Execution (T1204 User Execution)", "Reconnaissance", "Impact", "Collection"], correctAnswerIndex: 0, explanation: "Proof that a delivered binary ran is Execution; T1204 User Execution fits a user-launched payload." },
      { id: "for-l9-q7", question: "Why map forensic findings to ATT&CK at all?", options: ["To make the report longer", "For shared communication, coverage analysis, and reporting expectations", "It is legally required everywhere", "To slow the investigation"], correctAnswerIndex: 1, explanation: "ATT&CK mapping standardises communication, reveals visibility gaps, and meets reporting expectations." },
      { id: "for-l9-q8", question: "What does it mean that an intrusion is a 'chain of techniques'?", options: ["One technique is used in isolation", "The attack progresses through multiple tactics/techniques that forensics reconstructs artifact by artifact", "Techniques are random noise", "Only one artifact ever matters"], correctAnswerIndex: 1, explanation: "Intrusions move through linked techniques; forensics rebuilds that chain from the artifacts each stage leaves." },
    ],
  },

  // ── LESSON 10 ──────────────────────────────────────────────────────────────
  {
    title: "10 // Pitfalls, Interview Prep & Capstone",
    summary: "What learners miss, the questions you'll be asked, and a full end-to-end investigation tying every lesson together.",
    content: `
      <h2>From knowing the steps to being trusted with the evidence</h2>
      <p>You now have the full arc: mindset, process, acquisition, disk and memory artifacts, OS/user traces, timelines, anti-forensics, and ATT&CK. This final lesson hardens that knowledge into the judgement and vocabulary a real examiner needs.</p>

      <h3>The pitfalls that sink beginners</h3>
      <ul>
        <li><strong>Touching the original.</strong> Booting or mounting the suspect drive read-write alters it. Always image through a write blocker and work on the verified copy.</li>
        <li><strong>Losing volatile data.</strong> Pulling the plug "to be safe" destroys RAM, live connections, and decryption keys. Respect the order of volatility — capture memory first.</li>
        <li><strong>Trusting one timezone.</strong> Mixing UTC and local-time artifacts builds a timeline that is silently hours wrong. Normalise and document the timezone.</li>
        <li><strong>Assuming deleted means gone.</strong> Until blocks are overwritten, deleted files and their metadata usually survive — check unallocated space and slack.</li>
        <li><strong>Trusting a single artifact.</strong> Timestamps can be stomped and logs wiped. Corroborate across independent artifacts before you conclude.</li>
        <li><strong>Skipping documentation and hashing.</strong> An undocumented, unhashed acquisition is inadmissible. The notes and hashes <em>are</em> the work, not overhead.</li>
        <li><strong>Confusing absence of evidence with evidence of absence.</strong> Anti-forensics exists; not finding something may mean it was hidden, not that it never happened.</li>
      </ul>

      <h3>Interview questions you should be able to answer</h3>
      <ol>
        <li><strong>Why is RAM called volatile, and why capture it first?</strong> Because RAM needs continuous power and is lost on shutdown/reboot; per the order of volatility, the most fragile evidence (memory, live connections, keys) is captured before anything that survives power loss.</li>
        <li><strong>How do you prove an image wasn't altered?</strong> Hash the source and the image (e.g. SHA-256) and show they match; anyone can re-hash later to confirm no change.</li>
        <li><strong>What's the difference between pslist and psscan?</strong> pslist reads the OS's active process list; psscan brute-force scans memory for process structures. A process in psscan but not pslist is hiding (unlinked).</li>
        <li><strong>How would you detect timestomping?</strong> Compare $STANDARD_INFORMATION vs $FILE_NAME timestamps in the MFT; mismatches (or zeroed sub-second values) indicate tampering.</li>
        <li><strong>Why does a cleared log not fully cover an attacker's tracks?</strong> Clearing logs itself logs Event ID 1102, journals/USN may retain traces, and forwarded logs sit on a server out of the attacker's reach (T1070).</li>
        <li><strong>What's the chain of custody and why does it matter?</strong> The documented, unbroken record of who handled evidence when and how; gaps let evidence be challenged as tampered and excluded.</li>
      </ol>

      <h3>Capstone: a full investigation</h3>
      <p>Tie it all together on a frozen scene — a disk image and a RAM capture from a suspected compromise:</p>
      <ol>
        <li><strong>Preserve &amp; verify.</strong> Confirm the images' SHA-256 hashes match the acquisition record; note the chain of custody and the system timezone.</li>
        <li><strong>Triage memory.</strong> Run <code>pslist</code>, then <code>psscan</code> and <code>pstree</code>; spot a <code>svchost.exe</code> with the wrong parent running from <code>C:\\Users\\Public\\</code>. Confirm injection with <code>malfind</code> and find its C2 with <code>netscan</code>.</li>
        <li><strong>Corroborate on disk.</strong> In the MFT, locate the rogue binary; check prefetch for its run count and last-run time; find the Run key or scheduled task that persists it; pull the browser history showing where it was downloaded.</li>
        <li><strong>Build the timeline.</strong> Run Plaso, normalise to UTC, and assemble the sequence: download → execute → persist → inject → call home. Check $FILE_NAME vs $STANDARD_INFORMATION for timestomping and the Security log for a 1102 clear.</li>
        <li><strong>Map &amp; report.</strong> Tag each finding to ATT&CK (T1204, T1547, T1036, T1055, T1071, T1070) and write a clear, defensible report: what happened, what was taken, and the evidence proving it.</li>
      </ol>

      <blockquote>The capstone is the whole discipline in miniature: preserve before you analyse, corroborate across memory and disk, anchor everything to a verified timeline, and present a conclusion you can defend line by line. Master that loop and you are no longer a learner — you are an examiner.</blockquote>
    `,
    quizzes: [
      { id: "for-l10-q1", question: "Which is the single most damaging beginner mistake in forensics?", options: ["Taking too many notes", "Working on the original evidence instead of a verified copy", "Hashing twice", "Using UTC"], correctAnswerIndex: 1, explanation: "Touching the original alters it and can destroy evidence; you always work on a write-blocked, verified copy." },
      { id: "for-l10-q2", question: "How do you prove a forensic image was not altered after acquisition?", options: ["Trust the tool", "Compare its hash to the recorded acquisition hash and show they match", "Count the files", "Open it in Notepad"], correctAnswerIndex: 1, explanation: "Matching the image's current hash to the acquisition-time hash proves it is unchanged." },
      { id: "for-l10-q3", question: "What does a process appearing in psscan but NOT pslist suggest?", options: ["A normal system process", "A process actively hiding by unlinking itself", "A disk error", "A registry key"], correctAnswerIndex: 1, explanation: "psscan finds process structures the OS list (pslist) omits — a hallmark of a process hiding itself." },
      { id: "for-l10-q4", question: "Which comparison reveals timestomping on NTFS?", options: ["File size vs cluster size", "$STANDARD_INFORMATION vs $FILE_NAME timestamps", "MD5 vs SHA-256", "pslist vs psscan"], correctAnswerIndex: 1, explanation: "A mismatch between the easily-forged $STANDARD_INFORMATION and the harder-to-forge $FILE_NAME times indicates timestomping." },
      { id: "for-l10-q5", question: "Why does clearing logs fail to fully hide an attacker?", options: ["It is impossible to clear logs", "Clearing logs itself logs Event ID 1102 and forwarded logs persist elsewhere", "Logs are encrypted", "Attackers never clear logs"], correctAnswerIndex: 1, explanation: "The clear generates Event ID 1102, and centrally-forwarded logs remain beyond the attacker's reach." },
      { id: "for-l10-q6", question: "In the capstone, what should you verify BEFORE any analysis?", options: ["The C2 IP", "That image hashes match the acquisition record and note custody/timezone", "The malware's author", "The disk's brand"], correctAnswerIndex: 1, explanation: "Preservation/verification comes first: confirm integrity hashes and record chain of custody and timezone." },
      { id: "for-l10-q7", question: "Why must you corroborate findings across multiple artifacts?", options: ["To pad the report", "Because single artifacts can be faked/wiped; agreement across independent sources is defensible", "Artifacts are decorative", "One artifact is always wrong"], correctAnswerIndex: 1, explanation: "Timestamps stomp and logs wipe; corroboration across independent artifacts makes a conclusion bulletproof." },
      { id: "for-l10-q8", question: "What does 'absence of evidence is not evidence of absence' mean in forensics?", options: ["Always assume nothing happened", "Not finding something may mean it was hidden by anti-forensics, not that it never occurred", "Evidence is always present", "Logs never lie"], correctAnswerIndex: 1, explanation: "Anti-forensics can hide or destroy traces, so a missing artifact may reflect concealment rather than innocence." },
    ],
  },
];
