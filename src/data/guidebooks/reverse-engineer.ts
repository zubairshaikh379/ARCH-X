// ─────────────────────────────────────────────────────────────────────────────
// REVERSE ENGINEER — DEEP GUIDEBOOK (textbook-grade course, ARCH-X)
//
// Content is authored as SEMANTIC HTML and rendered inside `.md-content`
// (see src/index.css) — h2/h3/p/ul/ol/li/pre/code/table/blockquote/strong are
// all styled there, so lessons render correctly without relying on Tailwind
// class scanning.
//
// Structure mirrors a real syllabus: Intro → Safe Lab → File Formats →
// Assembly/CPU → Static Tooling → Dynamic Debugging → Triage → Packing/Obfuscation
// → Behavioral Analysis/IOCs → ATT&CK Mapping. Each lesson ends with an
// 8-question knowledge check. All work is framed as authorized analysis of
// samples inside a safe, isolated lab — never instructions to build malware.
// ─────────────────────────────────────────────────────────────────────────────

import type { Course } from "../courses";

type Lesson = Course["lessons"][number];

// New optional Overview fields (spread into the reverse-engineer course object).
export const META: Pick<
  Course,
  "prerequisites" | "learningOutcomes" | "mustKnow" | "commonGaps" | "prosCons" | "careerNotes"
> = {
  prerequisites: [
    "Comfort with a command line on Linux or Windows (cd, ls/dir, running a program) — you don't need to be an expert.",
    "Basic programming literacy in any language: what a variable, loop, function, and if-statement are.",
    "A mental model of how a program becomes a file: source code is compiled into a binary the CPU runs.",
    "No prior assembly or malware experience required — registers, opcodes, and PE/ELF are all built up from zero.",
  ],
  learningOutcomes: [
    "Stand up an isolated analysis lab (VM + snapshots + host-only networking) so a live sample can never touch a real network.",
    "Read the header of a PE or ELF file and predict how it will load, what it imports, and where its code begins.",
    "Follow simple x86-64 assembly — MOV/CMP/JE/CALL and the core registers — well enough to find a key comparison.",
    "Drive Ghidra and a debugger (x64dbg / gdb) to move fluidly between static disassembly and live execution.",
    "Triage an unknown binary with strings, imports, and hashing before ever running it — and recognise a packed sample.",
    "Extract behavioural IOCs from a detonation and map the observed behaviours to MITRE ATT&CK techniques.",
  ],
  mustKnow: [
    "Static vs dynamic analysis", "Isolated lab / sandbox", "VM snapshot", "PE header", "ELF header",
    "Sections (.text/.data/.rdata)", "Import Address Table (IAT)", "x86-64 registers (RAX/RIP/RSP)",
    "MOV / CMP / JMP / CALL", "Disassembler vs decompiler", "Ghidra", "IDA", "x64dbg", "gdb",
    "Breakpoints", "strings", "Entropy", "UPX / packing", "Obfuscation", "IOC", "C2",
    "T1027 Obfuscated Files or Information", "T1055 Process Injection", "MITRE ATT&CK",
  ],
  commonGaps: [
    "Lab safety. Beginners run an unknown binary on their real machine 'just to see' — the one mistake that turns a study session into an incident. Isolation and snapshots come first, always.",
    "Static vs dynamic confusion. Many learners treat them as rivals; they are partners. Static shows all possible paths; dynamic shows the one path that actually ran. You need both.",
    "Assembly overwhelm. People try to read every instruction. Experts skim for structure — calls, comparisons, and loops — and only decode the few instructions that matter.",
    "Packing blindness. A tiny binary with almost no strings and high entropy is screaming 'I'm packed', yet novices keep reading the packed stub as if it were the real code.",
    "IOC quality. A single IP or hash is fragile — attackers rotate them hourly. Durable detection targets behaviour (the Pyramid of Pain), not just atomic indicators.",
    "Authorization and provenance. Handling live samples without authorization, or losing track of where a sample came from, is both a legal and an evidentiary failure.",
  ],
  prosCons: {
    pros: [
      "Ground-truth skill: RE reveals exactly what a binary does, even with no source, docs, or vendor cooperation.",
      "High leverage in defence — one analyst's unpacked sample and IOCs can protect an entire fleet.",
      "Transferable far beyond malware: vulnerability research, interoperability, licensing/DRM analysis, and firmware work.",
    ],
    cons: [
      "Steep learning curve — assembly, OS internals, and tooling all at once; progress feels slow at first.",
      "Adversarial by nature: packers, anti-debugging, and anti-VM tricks are built specifically to waste your time.",
      "Time-intensive and easy to rabbit-hole; disciplined scoping (answer the question, then stop) is a skill in itself.",
    ],
  },
  careerNotes:
    "Malware reverse engineering sits at the senior/specialist end of blue-team work — analysts usually arrive from SOC, incident response, or detection-engineering roles rather than starting here. It feeds threat intelligence, detection engineering, and DFIR. The defining certification is GIAC's GREM (GIAC Reverse Engineering Malware); adjacent credentials include OSCP/OSED (offensive/exploit development) and vendor sandbox and YARA training. Foundational free resources are the MITRE ATT&CK framework, the Ghidra and x64dbg communities, and practice ranges like malware-traffic-analysis and safe CTF binaries. Realistic titles: Malware Analyst, Reverse Engineer, Threat Researcher, or Detection Engineer; the analysts who advance fastest pair deep technical unpacking with the ability to write crisp, actionable intelligence reports.",
};

export const LESSONS: Lesson[] = [
  // ── LESSON 1 ───────────────────────────────────────────────────────────────
  {
    title: "01 // What Reverse Engineering Is (and the Analyst's Mission)",
    summary: "Why we take software apart, the two great approaches — static vs dynamic — and the ethical, authorized framing every analyst works within.",
    content: `
      <h2>Taking software apart to understand it</h2>
      <p><strong>Reverse engineering (RE)</strong> is the practice of working backwards from a finished thing to understand how it was built and what it does. In software, the finished thing is a <strong>binary</strong> — a compiled executable the CPU runs — and the source code that produced it is gone. RE recovers meaning from that binary: its logic, its data, and its intent.</p>
      <p>Malware analysis is RE with a specific question: <em>what does this suspicious program do, and how do we detect and stop it?</em> You are on the <strong>defensive</strong> side. You analyse a sample so your organisation can write detections, scope an incident, and harden systems. You are not building malware; you are dissecting it in a controlled setting to blunt it.</p>

      <h3>Why bother, when we could just run antivirus?</h3>
      <p>Antivirus tells you <em>whether</em> something is bad. Reverse engineering tells you <em>why, how, and what to do about it</em>. Only by understanding a sample can you answer the questions that matter in an incident:</p>
      <ul>
        <li>What does it do to the machine — what files, keys, and processes does it touch?</li>
        <li>How does it persist across reboots, and how does it spread?</li>
        <li>Where does it call home (its command-and-control), and what can we block?</li>
        <li>What durable signature or behaviour can we detect it by across the whole fleet?</li>
      </ul>

      <h3>The two great approaches</h3>
      <p>Every technique in this course is a form of one of two complementary methods. You will learn both and, crucially, learn to combine them.</p>
      <table>
        <thead><tr><th>Approach</th><th>What it means</th><th>Strength / limit</th></tr></thead>
        <tbody>
          <tr><td><strong>Static analysis</strong></td><td>Examining the file <em>without running it</em> — reading its headers, strings, imports, and disassembly.</td><td>Safe and complete (sees all code paths), but code may be packed/obfuscated and hard to read.</td></tr>
          <tr><td><strong>Dynamic analysis</strong></td><td>Running the sample in a controlled lab and <em>watching what it does</em> — files, registry, network, memory.</td><td>Shows real behaviour and defeats packing, but only reveals the path that actually executed.</td></tr>
        </tbody>
      </table>
      <blockquote>The core insight of the whole discipline: static analysis shows every path the code <em>could</em> take; dynamic analysis shows the one path it <em>did</em> take. Neither alone is enough. Skilled analysts pivot between them constantly.</blockquote>

      <h3>Authorization, ethics, and provenance</h3>
      <p>RE of malware is powerful and, done carelessly, dangerous. Three non-negotiables frame everything that follows:</p>
      <ul>
        <li><strong>Authorization</strong> — analyse only samples you are permitted to handle, for a legitimate purpose (an incident, research, or authorized training).</li>
        <li><strong>Isolation</strong> — live samples are handled only in a contained lab that cannot harm production or the internet (Lesson 2).</li>
        <li><strong>Provenance</strong> — record where a sample came from, its hashes, and your chain of custody, so your findings are trustworthy evidence.</li>
      </ul>

      <h3>What you'll build toward</h3>
      <p>By the final lesson you'll take an unknown binary, triage it safely, recognise and reason about packing, follow the assembly to a key comparison, detonate it to observe behaviour, extract indicators, and present the whole thing as an ATT&CK-mapped analysis — the exact workflow of a professional malware analyst.</p>
    `,
    quizzes: [
      { id: "rev-l1-q1", question: "What is reverse engineering of software?", options: ["Writing new source code from a specification", "Working backwards from a compiled binary to understand its logic and behaviour", "Compiling source into an executable", "Encrypting a program so it cannot be read"], correctAnswerIndex: 1, explanation: "RE recovers understanding — logic, data, and intent — from a finished binary whose source is unavailable." },
      { id: "rev-l1-q2", question: "In this course, are you acting offensively or defensively?", options: ["Offensively — writing malware", "Defensively — analysing samples to detect and stop them", "Neither", "Both, by deploying malware to test defences"], correctAnswerIndex: 1, explanation: "Malware analysis here is defensive: dissect a sample in a controlled setting to build detections and harden systems." },
      { id: "rev-l1-q3", question: "Which best describes static analysis?", options: ["Running the sample and watching its behaviour", "Examining the file without executing it — headers, strings, imports, disassembly", "Deleting the file safely", "Blocking the file at the firewall"], correctAnswerIndex: 1, explanation: "Static analysis inspects the binary at rest without running it." },
      { id: "rev-l1-q4", question: "Which best describes dynamic analysis?", options: ["Reading the disassembly line by line", "Running the sample in a controlled lab and observing what it actually does", "Computing the file's hash", "Renaming the file's sections"], correctAnswerIndex: 1, explanation: "Dynamic analysis executes the sample in isolation to observe its real runtime behaviour." },
      { id: "rev-l1-q5", question: "What is the key trade-off between the two approaches?", options: ["Static is always faster than dynamic", "Static shows all possible code paths; dynamic shows only the path that actually ran", "Dynamic sees all code; static only sees one path", "There is no meaningful difference"], correctAnswerIndex: 1, explanation: "Static reveals every potential path but can be obscured; dynamic reveals only the executed path but defeats packing." },
      { id: "rev-l1-q6", question: "Why does dynamic analysis often defeat packing where static struggles?", options: ["Packing only affects file names", "The sample must unpack itself in memory to run, exposing the real code at runtime", "Dynamic analysis decrypts files on disk", "Packers disable dynamic analysis"], correctAnswerIndex: 1, explanation: "A packed sample unpacks its real code into memory to execute, so running it reveals what static reading of the packed file cannot." },
      { id: "rev-l1-q7", question: "What does 'provenance' mean in malware handling?", options: ["The country a malware family originates from", "Recording where a sample came from, its hashes, and chain of custody", "The programming language used", "The antivirus vendor that flagged it"], correctAnswerIndex: 1, explanation: "Provenance is the documented origin, hashing, and custody of a sample, which makes findings trustworthy evidence." },
      { id: "rev-l1-q8", question: "Which is a non-negotiable rule before analysing a live sample?", options: ["Post it publicly for others to help", "Run it once on your normal workstation to confirm it's malicious", "Handle it only in an isolated lab and only when authorized", "Disable your antivirus everywhere first"], correctAnswerIndex: 2, explanation: "Live samples are handled only with authorization and inside a contained lab that cannot harm real systems." },
    ],
  },

  // ── LESSON 2 ───────────────────────────────────────────────────────────────
  {
    title: "02 // Building a Safe Analysis Lab",
    summary: "The isolated environment that makes malware analysis safe — virtual machines, snapshots, network containment, and the sandbox pipeline.",
    content: `
      <h2>Safety is the first skill, not an afterthought</h2>
      <p>Before you touch a live sample you build a place where it can do no harm. This is the single most important habit in the discipline: <strong>the sample runs in a box you control, never on a machine you care about.</strong> Everything else in this course assumes you are working inside such a lab.</p>

      <h3>The virtual machine: your disposable computer</h3>
      <p>A <strong>virtual machine (VM)</strong> is a full computer simulated in software (via a <strong>hypervisor</strong> such as VMware, VirtualBox, Hyper-V, or KVM). The malware runs inside the VM's simulated hardware and operating system, isolated from your real <strong>host</strong>. You typically run separate VMs — a Windows VM to detonate Windows samples, and often a Linux VM (e.g. REMnux) to act as a fake internet and analysis workstation.</p>

      <h3>Snapshots: the undo button for an infection</h3>
      <p>A <strong>snapshot</strong> freezes the VM's entire state — disk, memory, everything — at a point in time. You take a clean snapshot <em>before</em> detonating a sample, do your analysis, and then <strong>revert</strong> to the clean snapshot to instantly erase the infection and reset for the next sample. Snapshots turn a one-way, destructive action into a repeatable experiment.</p>
      <blockquote>The golden loop: snapshot clean → detonate → observe → revert. If you ever find yourself analysing without a clean snapshot to fall back to, stop and take one first.</blockquote>

      <h3>Containing the network</h3>
      <p>Many samples try to reach the internet — to download a payload, or to contact command-and-control (C2). You must not let a live sample touch the real internet from your lab. Options, from most to least contained:</p>
      <table>
        <thead><tr><th>Mode</th><th>What it does</th><th>Use when</th></tr></thead>
        <tbody>
          <tr><td><strong>Host-only / isolated</strong></td><td>VM can talk only to other lab VMs, never the internet.</td><td>Default for detonation.</td></tr>
          <tr><td><strong>Simulated internet</strong></td><td>A tool like <code>INetSim</code> or <code>FakeNet-NG</code> impersonates DNS/HTTP/etc. so the sample <em>thinks</em> it reached its server.</td><td>To observe C2 behaviour safely.</td></tr>
          <tr><td><strong>NAT / bridged</strong></td><td>Real internet access.</td><td>Almost never for live malware — a serious risk.</td></tr>
        </tbody>
      </table>

      <h3>Automated sandboxes</h3>
      <p>An <strong>automated sandbox</strong> (e.g. Cuckoo/CAPE, or commercial services like Any.Run, Joe Sandbox, Hybrid Analysis) is a lab-in-a-box: it detonates a sample in an instrumented VM and produces a report of files, registry, and network activity automatically. Sandboxes are a superb <em>first pass</em> — fast, safe, and consistent — but sophisticated malware may detect the sandbox and behave innocently, so a human analyst still confirms and digs deeper.</p>

      <h3>Anti-analysis awareness</h3>
      <p>Adversaries know about your lab. Malware may include <strong>anti-VM</strong> and <strong>anti-sandbox</strong> checks (looking for VM artifacts, low core counts, or telltale usernames) and simply refuse to run when watched. Knowing these tricks exist is half the battle; hardening the VM to look like a real machine is the other half. This tension — you hide the lab, they detect it — recurs throughout the course.</p>
    `,
    quizzes: [
      { id: "rev-l2-q1", question: "Why analyse malware inside a virtual machine?", options: ["VMs run faster than real hardware", "The malware is isolated from your real host and can be discarded", "VMs make malware run automatically", "It is the only way to see strings"], correctAnswerIndex: 1, explanation: "A VM isolates the sample from your real machine, and can be reset, keeping the analysis contained." },
      { id: "rev-l2-q2", question: "What does a VM snapshot let you do?", options: ["Compile the sample", "Freeze the VM's full state so you can revert to a clean point after detonation", "Encrypt the malware", "Connect the VM to the internet"], correctAnswerIndex: 1, explanation: "A snapshot captures disk and memory state; reverting instantly erases the infection and resets for the next run." },
      { id: "rev-l2-q3", question: "What is the correct analysis loop?", options: ["Detonate → observe → snapshot", "Snapshot clean → detonate → observe → revert", "Revert → detonate → snapshot", "Detonate → delete VM → rebuild"], correctAnswerIndex: 1, explanation: "You snapshot a clean state first, detonate, observe, then revert to that clean snapshot." },
      { id: "rev-l2-q4", question: "Which network mode is the default for detonating live malware?", options: ["Bridged to the real LAN", "NAT with full internet", "Host-only / isolated", "Public Wi-Fi"], correctAnswerIndex: 2, explanation: "Host-only/isolated networking prevents the sample from reaching the real internet while still allowing lab VMs to interact." },
      { id: "rev-l2-q5", question: "What do tools like INetSim or FakeNet-NG provide?", options: ["Real internet access for the sample", "A simulated internet so the sample thinks it reached its server, safely", "Automatic unpacking", "A faster CPU"], correctAnswerIndex: 1, explanation: "They impersonate services like DNS and HTTP so C2 behaviour can be observed without real connectivity." },
      { id: "rev-l2-q6", question: "What is the main strength of an automated sandbox?", options: ["It always fully defeats obfuscation", "A fast, safe, consistent first-pass behavioural report", "It replaces the need for any human analyst", "It compiles the malware's source"], correctAnswerIndex: 1, explanation: "Sandboxes give a quick, repeatable behaviour report; they are an excellent first pass but not a complete substitute for an analyst." },
      { id: "rev-l2-q7", question: "Why might sophisticated malware behave innocently in a sandbox?", options: ["Sandboxes are always offline", "It uses anti-VM/anti-sandbox checks to detect analysis and hide its behaviour", "Sandboxes cannot run executables", "It only runs on Fridays"], correctAnswerIndex: 1, explanation: "Anti-analysis checks look for VM/sandbox artifacts and suppress malicious behaviour when they detect being watched." },
      { id: "rev-l2-q8", question: "Which hypervisor-hosted setup is typical for malware analysis?", options: ["A single VM connected directly to the internet", "A Windows detonation VM plus a Linux analysis VM on an isolated network", "Only the bare-metal host, no VMs", "A phone emulator only"], correctAnswerIndex: 1, explanation: "A common lab pairs a Windows VM to run samples with a Linux analysis VM (e.g. REMnux) on an isolated network." },
    ],
  },

  // ── LESSON 3 ───────────────────────────────────────────────────────────────
  {
    title: "03 // File Formats: PE and ELF Anatomy",
    summary: "How executables are structured on disk — the PE (Windows) and ELF (Linux) formats, their headers, sections, and imports — so you know where to look.",
    content: `
      <h2>A binary is not a blob — it has a floor plan</h2>
      <p>An executable file looks like random bytes, but it follows a strict structure the operating system's <strong>loader</strong> reads to place code and data into memory and start execution. Learning that structure tells you exactly where the interesting parts are before you read a single instruction.</p>
      <p>Two formats dominate: <strong>PE (Portable Executable)</strong> on Windows (<code>.exe</code>, <code>.dll</code>) and <strong>ELF (Executable and Linkable Format)</strong> on Linux. They differ in detail but share the same big ideas: a header describing the file, and sections holding code and data.</p>

      <h3>Headers: the file's identity card</h3>
      <p>Every PE begins with the two ASCII bytes <code>MZ</code> (a nod to DOS pioneer Mark Zbikowski), followed later by the <code>PE\\0\\0</code> signature. Every ELF begins with the magic bytes <code>0x7F 'E' 'L' 'F'</code>. These <strong>magic numbers</strong> are how tools recognise a file's type regardless of its extension. The header also records the target architecture (x86 vs x64), whether it's an EXE or DLL/shared object, and — critically — the <strong>entry point</strong>: the address where execution begins.</p>
      <pre><code># Identify a file by its real structure, not its name
$ file sample.bin
sample.bin: PE32+ executable (console) x86-64, for MS Windows

$ file libdemo.so
libdemo.so: ELF 64-bit LSB shared object, x86-64, dynamically linked</code></pre>

      <h3>Sections: where code and data live</h3>
      <p>The body of the file is divided into <strong>sections</strong>, each with a name and a purpose. The names are conventions, and unusual names are themselves a clue.</p>
      <table>
        <thead><tr><th>Section</th><th>Holds</th><th>Typical permissions</th></tr></thead>
        <tbody>
          <tr><td><code>.text</code> (PE &amp; ELF)</td><td>Executable machine code — the instructions.</td><td>Read + Execute</td></tr>
          <tr><td><code>.data</code></td><td>Initialised, writable global variables.</td><td>Read + Write</td></tr>
          <tr><td><code>.rdata</code> / <code>.rodata</code></td><td>Read-only data: constants, strings.</td><td>Read only</td></tr>
          <tr><td><code>.rsrc</code> (PE)</td><td>Resources — icons, embedded files, config.</td><td>Read only</td></tr>
        </tbody>
      </table>
      <blockquote>Red flags in the section table: a section that is both writable <em>and</em> executable, a suspiciously named section (like <code>UPX0</code>/<code>UPX1</code>), or a section whose size on disk is tiny but whose size in memory is huge — all hint at packing or self-modifying code.</blockquote>

      <h3>Imports: what the program borrows from the OS</h3>
      <p>Programs rarely do everything themselves; they call operating-system libraries. On Windows those functions come from DLLs (<code>kernel32.dll</code>, <code>ws2_32.dll</code>, …) and are listed in the <strong>Import Address Table (IAT)</strong>. On Linux they come from shared objects like <code>libc</code>. The import list is a cheat-sheet for intent: a binary importing <code>CreateProcess</code>, <code>InternetOpen</code>, and <code>RegSetValue</code> is telling you it can spawn processes, talk to the network, and modify the registry — before you read any code.</p>

      <h3>Virtual addresses and the loader</h3>
      <p>Addresses inside the file are expressed relative to where the module will be loaded (its <strong>image base</strong>) as <strong>relative virtual addresses (RVAs)</strong>. The loader maps sections into memory, resolves imports, applies relocations if the preferred base is taken, and jumps to the entry point. You don't need to memorise the mechanics yet — just hold the mental model: <em>file layout → loader → memory layout → execution starts at the entry point.</em></p>
    `,
    quizzes: [
      { id: "rev-l3-q1", question: "Which format is used for Windows executables and DLLs?", options: ["ELF", "PE (Portable Executable)", "Mach-O", "PDF"], correctAnswerIndex: 1, explanation: "PE (Portable Executable) is the Windows format for .exe and .dll files; ELF is the Linux format." },
      { id: "rev-l3-q2", question: "What are the first two bytes of a PE file?", options: ["ELF", "MZ", "PK", "PE"], correctAnswerIndex: 1, explanation: "A PE begins with the ASCII bytes 'MZ' (the DOS header), with the 'PE\\0\\0' signature appearing later." },
      { id: "rev-l3-q3", question: "Which magic bytes start an ELF file?", options: ["0x7F 'E' 'L' 'F'", "'M' 'Z'", "0x50 0x4B", "0xFF 0xD8"], correctAnswerIndex: 0, explanation: "ELF files begin with 0x7F followed by 'ELF'; this magic identifies the format." },
      { id: "rev-l3-q4", question: "What does the entry point in a header specify?", options: ["The file's author", "The address where execution begins", "The compression ratio", "The number of imports"], correctAnswerIndex: 1, explanation: "The entry point is the address the loader jumps to when execution starts." },
      { id: "rev-l3-q5", question: "Which section normally holds executable machine code?", options: [".data", ".rdata", ".text", ".rsrc"], correctAnswerIndex: 2, explanation: "The .text section contains the program's executable instructions and is marked read+execute." },
      { id: "rev-l3-q6", question: "The Import Address Table (IAT) tells you what?", options: ["The file's size on disk", "Which OS library functions the program calls, hinting at its capabilities", "The user who ran the file", "The encryption key"], correctAnswerIndex: 1, explanation: "Imports reveal borrowed OS functions (e.g. CreateProcess, InternetOpen), a strong hint of intent." },
      { id: "rev-l3-q7", question: "Which section characteristic is a red flag for packing or self-modifying code?", options: ["A read-only .rdata section", "A section that is both writable and executable", "A section named .text", "Having any imports at all"], correctAnswerIndex: 1, explanation: "Writable+executable sections (and oddly named sections like UPX0/UPX1) suggest packing or self-modifying code." },
      { id: "rev-l3-q8", question: "Why is running `file sample.bin` useful before anything else?", options: ["It runs the sample safely", "It identifies the true file type from its structure, regardless of extension", "It removes the malware", "It decompiles the binary"], correctAnswerIndex: 1, explanation: "The `file` command reads magic bytes/structure to report the real format, not the possibly-misleading extension." },
    ],
  },

  // ── LESSON 4 ───────────────────────────────────────────────────────────────
  {
    title: "04 // CPU Registers & Assembly Fundamentals",
    summary: "The language the CPU actually speaks — registers, the instruction pointer and stack, and the handful of x86-64 instructions you must recognise.",
    content: `
      <h2>Down to the metal</h2>
      <p>When a binary runs, the CPU executes tiny instructions one after another. <strong>Assembly language</strong> is the human-readable form of those instructions. You will not memorise the whole instruction set — nobody does. You learn to recognise the <em>structure</em>: where values are moved, compared, and where the program decides to branch.</p>

      <h3>Registers: the CPU's hands</h3>
      <p><strong>Registers</strong> are a tiny number of ultra-fast storage slots inside the CPU. On 64-bit x86 (x86-64) the general-purpose registers are named with an <code>R</code> prefix (<code>RAX</code>, <code>RBX</code>, …); their 32-bit halves drop to <code>E</code> (<code>EAX</code>, <code>EBX</code>). A few have conventional jobs worth knowing:</p>
      <table>
        <thead><tr><th>Register</th><th>Conventional role</th></tr></thead>
        <tbody>
          <tr><td><code>RAX / EAX</code></td><td>Accumulator — arithmetic results and, by convention, a function's return value.</td></tr>
          <tr><td><code>RCX, RDX, R8, R9</code></td><td>Commonly hold the first arguments passed to a function (Windows x64 calling convention).</td></tr>
          <tr><td><code>RSP</code></td><td>Stack pointer — points at the top of the stack.</td></tr>
          <tr><td><code>RBP</code></td><td>Base/frame pointer — anchors the current function's stack frame.</td></tr>
          <tr><td><code>RIP</code></td><td>Instruction pointer — the address of the <em>next</em> instruction to execute.</td></tr>
        </tbody>
      </table>
      <p>Flowing alongside is the <strong>flags register</strong> (EFLAGS/RFLAGS). It holds status bits — notably the <strong>Zero Flag (ZF)</strong> — set as a side effect of instructions like <code>CMP</code>, and later tested by conditional jumps. This little dance of "compare, set flag, jump on flag" is how nearly every decision in a program is made.</p>

      <h3>The instructions you must recognise</h3>
      <p>Perhaps a dozen instructions cover most of what you'll read. The essential handful:</p>
      <table>
        <thead><tr><th>Instruction</th><th>Meaning</th></tr></thead>
        <tbody>
          <tr><td><code>MOV dst, src</code></td><td>Copy a value from src into dst.</td></tr>
          <tr><td><code>LEA dst, [addr]</code></td><td>Load the <em>address</em> (not the value) — often used to point at strings/buffers.</td></tr>
          <tr><td><code>CMP a, b</code></td><td>Compare (computes a − b) and sets flags; used before conditional jumps.</td></tr>
          <tr><td><code>TEST a, b</code></td><td>Bitwise AND that sets flags without storing; often <code>TEST reg,reg</code> to check for zero.</td></tr>
          <tr><td><code>JMP / JE / JNE / JZ</code></td><td>Jump — unconditional, or conditional on flags (JE=equal, JNE=not equal).</td></tr>
          <tr><td><code>CALL / RET</code></td><td>Call a function (push return address) / return from it.</td></tr>
          <tr><td><code>PUSH / POP</code></td><td>Put a value on / take a value off the stack.</td></tr>
          <tr><td><code>XOR a, a</code></td><td>Fast way to set a register to zero (a XOR a = 0).</td></tr>
        </tbody>
      </table>

      <h3>Reading a comparison — the pattern that unlocks passwords</h3>
      <p>Consider a classic "check the key" sequence. Read it as prose:</p>
      <pre><code>lea   rcx, [secret_key]     ; point RCX at the correct key string
call  strcmp                ; compare user input to the key
test  eax, eax              ; strcmp returns 0 when strings match
jne   access_denied         ; if result != 0 (not equal) -> reject
; ...fall through to the success path when they matched...</code></pre>
      <p>You don't need every detail. You need the shape: <em>a value is loaded, a comparison is made, and a conditional jump decides success or failure.</em> Find that shape and you've found the decision that matters. This is exactly the skill the ARCH-X assembly-dissection simulation exercises when you trace a <code>CMP</code> against a key and follow the <code>JE</code>.</p>

      <h3>The stack, briefly</h3>
      <p>The <strong>stack</strong> is a region of memory that grows and shrinks as functions are called. It stores return addresses, saved registers, and local variables. <code>CALL</code> pushes a return address; <code>RET</code> pops it back into <code>RIP</code>. Understanding this call/return rhythm is enough to follow program flow across functions.</p>
    `,
    quizzes: [
      { id: "rev-l4-q1", question: "What are CPU registers?", options: ["Files on disk", "A tiny set of ultra-fast storage slots inside the CPU", "Network sockets", "Sections of a PE file"], correctAnswerIndex: 1, explanation: "Registers are the CPU's small, extremely fast internal storage locations used during execution." },
      { id: "rev-l4-q2", question: "Which register conventionally holds a function's return value on x86?", options: ["RSP", "RIP", "RAX / EAX", "RBP"], correctAnswerIndex: 2, explanation: "RAX/EAX is the accumulator and, by convention, holds function return values." },
      { id: "rev-l4-q3", question: "What does the RIP (instruction pointer) hold?", options: ["The stack top", "The address of the next instruction to execute", "The return value", "The number of CPU cores"], correctAnswerIndex: 1, explanation: "RIP points at the next instruction; changing it changes what executes next." },
      { id: "rev-l4-q4", question: "What does the CMP instruction do?", options: ["Copies a value", "Compares two values and sets processor flags (e.g. the Zero Flag)", "Calls a function", "Allocates memory"], correctAnswerIndex: 1, explanation: "CMP subtracts the operands and sets flags; those flags drive subsequent conditional jumps." },
      { id: "rev-l4-q5", question: "After a CMP, which instruction branches only when the values were equal?", options: ["JNE", "JE / JZ", "JMP", "CALL"], correctAnswerIndex: 1, explanation: "JE/JZ jumps when the Zero Flag is set — i.e. when the compared values were equal." },
      { id: "rev-l4-q6", question: "What does `XOR eax, eax` commonly accomplish?", options: ["Adds two numbers", "Sets EAX to zero quickly", "Compares EAX to itself and jumps", "Loads a string address"], correctAnswerIndex: 1, explanation: "A register XORed with itself is zero, so XOR reg,reg is a compact way to zero a register." },
      { id: "rev-l4-q7", question: "What is the role of RSP?", options: ["Instruction pointer", "Stack pointer — points at the top of the stack", "Accumulator", "Flags register"], correctAnswerIndex: 1, explanation: "RSP is the stack pointer, tracking the current top of the stack." },
      { id: "rev-l4-q8", question: "Which recurring pattern reveals a program's key decision points?", options: ["MOV followed by PUSH", "A value loaded, a CMP/TEST, then a conditional jump to success or failure", "RET followed by NOP", "Two consecutive CALLs"], correctAnswerIndex: 1, explanation: "Load → compare/test → conditional jump is the shape of a decision, such as validating a key." },
    ],
  },

  // ── LESSON 5 ───────────────────────────────────────────────────────────────
  {
    title: "05 // Disassemblers & Decompilers: Ghidra and IDA",
    summary: "The tools that turn raw bytes into readable code — the difference between disassembly and decompilation, and how to navigate Ghidra and IDA.",
    content: `
      <h2>From bytes to something a human can read</h2>
      <p>You will not read machine code as raw hex. Two classes of tool translate a binary into something legible, and understanding the difference between them is essential.</p>
      <table>
        <thead><tr><th>Tool type</th><th>Output</th><th>Fidelity</th></tr></thead>
        <tbody>
          <tr><td><strong>Disassembler</strong></td><td>Assembly instructions (the CPU's real language).</td><td>Exact — this is literally what runs.</td></tr>
          <tr><td><strong>Decompiler</strong></td><td>Reconstructed pseudo-C, higher-level and easier to read.</td><td>An approximation — a best-effort reconstruction, not the original source.</td></tr>
        </tbody>
      </table>
      <blockquote>Golden rule: the disassembly is ground truth; the decompiler output is a helpful hypothesis. When they seem to disagree, trust the assembly and treat the decompilation as a reading aid — variable names, loop shapes, and control flow that speed up comprehension.</blockquote>

      <h3>Ghidra — the free powerhouse</h3>
      <p><strong>Ghidra</strong> is a free, open-source reverse-engineering suite released by the NSA. It disassembles and, crucially, <em>decompiles</em> many architectures, and it is the tool most beginners start with because it costs nothing and is genuinely excellent. Core Ghidra concepts:</p>
      <ul>
        <li><strong>Project &amp; CodeBrowser</strong> — you import a binary into a project, then analyse it in the CodeBrowser window.</li>
        <li><strong>Auto-analysis</strong> — on import, Ghidra finds functions, strings, and cross-references automatically.</li>
        <li><strong>Listing vs Decompiler panes</strong> — assembly on one side, reconstructed C on the other, kept in sync as you click.</li>
        <li><strong>Symbol Tree &amp; cross-references (XREFs)</strong> — jump to functions, and see everywhere a function or string is used. XREFs are how you navigate.</li>
        <li><strong>Renaming &amp; commenting</strong> — as you understand a function, rename it from <code>FUN_00401000</code> to something meaningful; your annotations accumulate into understanding.</li>
      </ul>

      <h3>IDA — the industry veteran</h3>
      <p><strong>IDA (Interactive Disassembler)</strong> from Hex-Rays is the long-standing commercial standard, renowned for its analysis engine and its polished graph view; its Hex-Rays Decompiler is a paid add-on. A free/community edition exists with limitations. In practice IDA and Ghidra cover the same ground — pick the one available to you; the concepts transfer directly.</p>

      <h3>The workflow that actually works</h3>
      <ol>
        <li><strong>Start at the strings and imports</strong> — they orient you before you read code (Lesson 7).</li>
        <li><strong>Follow XREFs from an interesting string</strong> — e.g. an error message leads you straight to the code that checks a condition.</li>
        <li><strong>Read the decompiler for the gist, the disassembly for the truth.</strong></li>
        <li><strong>Rename and comment relentlessly</strong> — turn machine gibberish into a labelled map. Future-you will thank present-you.</li>
        <li><strong>Recognise library code and skip it</strong> — don't waste hours reversing <code>strcmp</code>; focus on the author's own logic.</li>
      </ol>

      <h3>Graph view: seeing control flow</h3>
      <p>Both tools can display a function as a <strong>control-flow graph</strong> — boxes of instructions (basic blocks) connected by arrows for jumps. This visual makes loops and if/else branches obvious at a glance and is often the fastest way to understand a function's shape before reading any individual instruction.</p>
    `,
    quizzes: [
      { id: "rev-l5-q1", question: "What does a disassembler produce?", options: ["Original source code", "Assembly instructions — the CPU's real language", "A network capture", "An encrypted file"], correctAnswerIndex: 1, explanation: "A disassembler translates machine code into assembly, which is exactly what the CPU executes." },
      { id: "rev-l5-q2", question: "What does a decompiler produce?", options: ["Exact original source", "Reconstructed higher-level pseudo-C that approximates the logic", "Raw hex bytes", "A firewall rule"], correctAnswerIndex: 1, explanation: "A decompiler reconstructs approximate high-level code (often pseudo-C) — a helpful, imperfect reading aid." },
      { id: "rev-l5-q3", question: "When disassembly and decompiler output seem to disagree, which do you trust?", options: ["The decompiler, it's higher level", "The disassembly — it is ground truth", "Neither", "Whichever is shorter"], correctAnswerIndex: 1, explanation: "Disassembly reflects what actually runs; decompilation is a best-effort reconstruction and can be imperfect." },
      { id: "rev-l5-q4", question: "What is Ghidra?", options: ["A commercial-only debugger", "A free, open-source RE suite (from the NSA) that disassembles and decompiles", "A packer", "A sandbox service"], correctAnswerIndex: 1, explanation: "Ghidra is a free, open-source reverse-engineering framework with both disassembly and decompilation." },
      { id: "rev-l5-q5", question: "What are cross-references (XREFs) used for?", options: ["Encrypting the binary", "Finding everywhere a function or string is used, to navigate the code", "Compiling the program", "Measuring entropy"], correctAnswerIndex: 1, explanation: "XREFs let you jump between definitions and all their usages, the backbone of navigation." },
      { id: "rev-l5-q6", question: "Why rename functions like FUN_00401000 as you analyse?", options: ["It changes the binary on disk", "Meaningful names accumulate understanding and make the code a readable map", "It speeds up the CPU", "It is required to run the tool"], correctAnswerIndex: 1, explanation: "Renaming and commenting turn opaque auto-generated labels into a comprehensible, annotated map." },
      { id: "rev-l5-q7", question: "What is IDA best known as?", options: ["A free Linux distro", "A long-standing commercial interactive disassembler with a decompiler add-on", "An antivirus engine", "A wordlist"], correctAnswerIndex: 1, explanation: "IDA (Interactive Disassembler) is the veteran commercial tool; its Hex-Rays Decompiler is a paid add-on." },
      { id: "rev-l5-q8", question: "What does a control-flow graph view show?", options: ["Network connections", "Basic blocks connected by arrows, making loops and branches visible at a glance", "The file's hash tree", "Registry keys"], correctAnswerIndex: 1, explanation: "A CFG displays basic blocks and the jumps between them, quickly revealing a function's structure." },
    ],
  },

  // ── LESSON 6 ───────────────────────────────────────────────────────────────
  {
    title: "06 // Debuggers: Watching Code Run with x64dbg and gdb",
    summary: "Dynamic analysis at the instruction level — breakpoints, single-stepping, inspecting registers and memory, and pivoting from static to live.",
    content: `
      <h2>Stop guessing — watch it happen</h2>
      <p>A disassembler shows you the code at rest. A <strong>debugger</strong> lets you run the program under your control — pausing it, stepping one instruction at a time, and inspecting the exact contents of registers and memory as execution unfolds. This is dynamic analysis at its most precise, and it resolves questions static analysis can only guess at.</p>

      <h3>The two you'll meet</h3>
      <table>
        <thead><tr><th>Debugger</th><th>Platform</th><th>Notes</th></tr></thead>
        <tbody>
          <tr><td><strong>x64dbg</strong></td><td>Windows</td><td>Free, open-source, GUI; the de-facto choice for Windows malware. (OllyDbg is its older 32-bit ancestor.)</td></tr>
          <tr><td><strong>gdb</strong></td><td>Linux</td><td>The GNU debugger; command-line, ubiquitous. Enhancers like GEF/pwndbg make it far friendlier.</td></tr>
          <tr><td><strong>WinDbg</strong></td><td>Windows</td><td>Microsoft's powerful debugger, especially for kernel-level work.</td></tr>
        </tbody>
      </table>

      <h3>Breakpoints: pause where it matters</h3>
      <p>A <strong>breakpoint</strong> tells the debugger "stop execution when you reach here." Instead of watching millions of instructions, you break at the one function you care about — a suspicious call, or the key comparison you found statically — and inspect the world at that instant. Types you should know:</p>
      <ul>
        <li><strong>Software breakpoint</strong> — the debugger temporarily replaces an instruction byte with <code>0xCC</code> (INT3) to trigger a pause.</li>
        <li><strong>Hardware breakpoint</strong> — uses CPU debug registers; limited in number but doesn't modify code (useful against anti-debug checks).</li>
        <li><strong>Memory breakpoint</strong> — pauses when a specific memory address is read or written — invaluable for catching when a buffer is decrypted.</li>
      </ul>

      <h3>Stepping through execution</h3>
      <p>Once paused, you advance deliberately:</p>
      <table>
        <thead><tr><th>Action</th><th>gdb</th><th>Effect</th></tr></thead>
        <tbody>
          <tr><td>Step Into</td><td><code>stepi</code></td><td>Execute one instruction; descend into a CALL.</td></tr>
          <tr><td>Step Over</td><td><code>nexti</code></td><td>Execute the next instruction but run a CALL to completion without descending.</td></tr>
          <tr><td>Continue</td><td><code>continue</code></td><td>Run until the next breakpoint.</td></tr>
          <tr><td>Inspect registers</td><td><code>info registers</code></td><td>Show current register values.</td></tr>
          <tr><td>Examine memory</td><td><code>x/16xb &amp;addr</code></td><td>Dump bytes at an address (e.g. to read a decrypted string).</td></tr>
        </tbody>
      </table>
      <blockquote>Step <em>Into</em> descends into a called function; step <em>Over</em> runs the call to completion and stops after it. Choosing correctly — over the library calls you don't care about, into the author's own functions you do — is the difference between an efficient session and a lost afternoon.</blockquote>

      <h3>The killer move: reading decrypted data at runtime</h3>
      <p>Malware often stores strings — C2 domains, keys, commands — encrypted on disk, so static <code>strings</code> shows nothing useful. But to <em>use</em> them, the program must decrypt them into memory. Set a breakpoint just <em>after</em> the decryption routine, run to it, and read the now-plaintext buffer straight out of memory. This static-to-dynamic pivot — find the routine statically, then dump the result dynamically — is one of the most powerful techniques in the discipline.</p>

      <h3>Anti-debugging, in brief</h3>
      <p>Malware fights back. It may call <code>IsDebuggerPresent</code>, time its own execution (a debugger makes things slow), or scan for INT3 bytes. Analysts respond with hardware breakpoints, plugins that hide the debugger, and patience. You don't need to defeat these yet — just know that when a sample behaves differently under a debugger, anti-debugging is a likely cause.</p>
    `,
    quizzes: [
      { id: "rev-l6-q1", question: "What does a debugger let you do that a disassembler alone cannot?", options: ["Read the file's name", "Run the program under your control, pausing and inspecting registers/memory live", "Compress the binary", "Change the file extension"], correctAnswerIndex: 1, explanation: "A debugger executes the program interactively, letting you pause and inspect live state." },
      { id: "rev-l6-q2", question: "Which debugger is the de-facto choice for Windows malware analysis?", options: ["gdb", "x64dbg", "Ghidra", "INetSim"], correctAnswerIndex: 1, explanation: "x64dbg is a free, open-source Windows debugger widely used for malware; gdb is the Linux counterpart." },
      { id: "rev-l6-q3", question: "What is a breakpoint?", options: ["A crash", "An instruction to pause execution when a chosen location is reached", "A packed section", "A network port"], correctAnswerIndex: 1, explanation: "A breakpoint halts execution at a chosen address so you can inspect state at that moment." },
      { id: "rev-l6-q4", question: "A software breakpoint typically works by inserting which byte?", options: ["0x90 (NOP)", "0xCC (INT3)", "0xFF", "0x00"], correctAnswerIndex: 1, explanation: "Software breakpoints replace an instruction byte with 0xCC (INT3), which traps to the debugger." },
      { id: "rev-l6-q5", question: "What is the difference between Step Into and Step Over?", options: ["They are identical", "Step Into descends into a CALL; Step Over runs the CALL to completion and stops after it", "Step Over descends into a CALL", "Step Into ends the program"], correctAnswerIndex: 1, explanation: "Step Into follows a call; Step Over executes the call fully without descending into it." },
      { id: "rev-l6-q6", question: "How can a debugger recover strings that `strings` on disk cannot show?", options: ["By decompiling the file", "By breaking after the decryption routine and reading the plaintext from memory", "By renaming sections", "By computing the hash"], correctAnswerIndex: 1, explanation: "Encrypted-on-disk strings become plaintext in memory when used; breaking after decryption exposes them." },
      { id: "rev-l6-q7", question: "Which is a common anti-debugging technique?", options: ["Calling IsDebuggerPresent to detect a debugger", "Adding more strings", "Increasing file size", "Using the .text section"], correctAnswerIndex: 0, explanation: "IsDebuggerPresent (and timing checks, INT3 scans) let malware detect and react to being debugged." },
      { id: "rev-l6-q8", question: "In gdb, which command shows current register values?", options: ["stepi", "info registers", "continue", "break main"], correctAnswerIndex: 1, explanation: "`info registers` displays the current contents of the CPU registers in gdb." },
    ],
  },

  // ── LESSON 7 ───────────────────────────────────────────────────────────────
  {
    title: "07 // Triage: Strings, Imports & Hashing an Unknown Binary",
    summary: "The fast, safe first pass on any sample — hashing for identity and intel, extracting strings, and reading imports to form an early hypothesis.",
    content: `
      <h2>First contact: what to do before you run anything</h2>
      <p>When an unknown binary lands on your desk you do <em>not</em> immediately run it or open it in a decompiler for hours. You <strong>triage</strong>: a quick, safe, static first pass that identifies the file, harvests obvious clues, and forms a hypothesis — often in minutes. Good triage tells you whether a sample is worth deep analysis and points you at where to look.</p>

      <h3>Step 1 — Hash it for identity and intel</h3>
      <p>A <strong>cryptographic hash</strong> (MD5, SHA-1, SHA-256) is a fixed-length fingerprint of the file's bytes. Change one byte and the hash changes completely. Hashing gives you two things: a stable name to refer to the sample, and a lookup key for threat intelligence.</p>
      <pre><code>$ sha256sum sample.bin
9f2c...e41a  sample.bin</code></pre>
      <p>Submit the <em>hash</em> (never the live file, unless policy allows) to a service like <strong>VirusTotal</strong> to see if it's already known, what engines call it, and related samples. A known hash can save hours; an unknown hash means you may be first.</p>
      <blockquote>Caveat: a hash is fragile as a detection indicator. Attackers change a single byte to produce a brand-new hash, evading hash blocklists trivially. Hashes identify a <em>specific</em> file, not a family — which is why we later prefer behavioural detection (Lesson 9).</blockquote>

      <h3>Step 2 — Pull the strings</h3>
      <p>The <code>strings</code> utility extracts human-readable text from a binary. It is astonishingly high-yield for the effort:</p>
      <pre><code>$ strings -n 8 sample.bin | less
http://update-cdn[.]example/panel/gate.php
SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run
CreateProcessA
%s\\svc_helper.exe
KERNEL32.dll</code></pre>
      <p>In seconds this hints at a C2 URL, a registry <code>Run</code> key (persistence), process creation, and a dropped filename. Modern <code>strings</code> should be run for both ASCII and wide (UTF-16) encodings, since Windows uses wide strings heavily. Remember the limit: a <strong>packed</strong> sample yields almost no meaningful strings — which is itself a finding.</p>

      <h3>Step 3 — Read the imports</h3>
      <p>As covered in Lesson 3, the import table reveals borrowed OS capabilities. During triage you skim it for capability clusters:</p>
      <table>
        <thead><tr><th>Imports seen</th><th>Suggests</th></tr></thead>
        <tbody>
          <tr><td><code>InternetOpen</code>, <code>WinHttpConnect</code>, <code>socket</code></td><td>Network / C2 communication</td></tr>
          <tr><td><code>RegSetValueEx</code>, <code>CreateService</code></td><td>Persistence</td></tr>
          <tr><td><code>CreateProcess</code>, <code>ShellExecute</code></td><td>Executing other programs</td></tr>
          <tr><td><code>VirtualAlloc</code>, <code>WriteProcessMemory</code>, <code>CreateRemoteThread</code></td><td>Process injection (T1055)</td></tr>
          <tr><td><code>CryptEncrypt</code>, <code>CryptAcquireContext</code></td><td>Encryption — possibly ransomware</td></tr>
        </tbody>
      </table>

      <h3>Other quick signals</h3>
      <ul>
        <li><strong>File size &amp; type</strong> — a 12 KB EXE that imports almost nothing but has high entropy screams "packed stub".</li>
        <li><strong>Compilation timestamp</strong> — present in the PE header (though easily faked).</li>
        <li><strong>Digital signature</strong> — is it signed, and by whom? Malware sometimes abuses stolen or fake certificates.</li>
        <li><strong>Embedded resources</strong> — the <code>.rsrc</code> section may hide a second executable to be dropped.</li>
      </ul>
      <p>At the end of triage you should be able to write two or three sentences: what the file appears to be, its likely capabilities, whether it's packed, and whether it's already known. That hypothesis directs everything that follows.</p>
    `,
    quizzes: [
      { id: "rev-l7-q1", question: "What is the purpose of triage on an unknown binary?", options: ["To immediately run it on production", "A fast, safe first pass to identify the file and form an early hypothesis", "To delete it", "To recompile it"], correctAnswerIndex: 1, explanation: "Triage quickly and safely gathers identity and clues to decide where deeper analysis should focus." },
      { id: "rev-l7-q2", question: "Why hash a sample early?", options: ["It decrypts the file", "It gives a stable fingerprint for reference and a lookup key for threat intel", "It removes packing", "It changes the file's behaviour"], correctAnswerIndex: 1, explanation: "A hash uniquely identifies the file's bytes and can be looked up (e.g. VirusTotal) to see if it's known." },
      { id: "rev-l7-q3", question: "Why is a file hash a fragile detection indicator?", options: ["Hashes are too long", "Changing a single byte produces a completely new hash, evading hash blocklists", "Hashes cannot be computed on malware", "Hashes reveal the source code"], correctAnswerIndex: 1, explanation: "Hashes identify one exact file; a one-byte change defeats hash-based blocking, so behaviour is more durable." },
      { id: "rev-l7-q4", question: "What does the `strings` utility do?", options: ["Runs the binary", "Extracts human-readable text embedded in the binary", "Encrypts the binary", "Lists open network ports"], correctAnswerIndex: 1, explanation: "`strings` pulls readable ASCII/Unicode text, often revealing URLs, paths, and API names." },
      { id: "rev-l7-q5", question: "Finding a `...\\CurrentVersion\\Run` string most likely suggests what?", options: ["Encryption", "A persistence mechanism via the registry Run key", "A network scan", "A compiler version"], correctAnswerIndex: 1, explanation: "The Run key launches programs at logon; its presence hints at persistence." },
      { id: "rev-l7-q6", question: "Imports like VirtualAlloc + WriteProcessMemory + CreateRemoteThread suggest what?", options: ["Simple file copying", "Process injection (T1055)", "Printing a document", "Reading the clock"], correctAnswerIndex: 1, explanation: "That trio is a classic process-injection pattern, mapping to MITRE T1055." },
      { id: "rev-l7-q7", question: "A tiny EXE with almost no strings and high entropy most likely indicates what?", options: ["A clean system utility", "A packed sample", "A text file", "A corrupted header"], correctAnswerIndex: 1, explanation: "Few strings plus high entropy in a small binary strongly suggests packing/compression." },
      { id: "rev-l7-q8", question: "Why run `strings` for both ASCII and wide (UTF-16) encodings on Windows samples?", options: ["ASCII is illegal on Windows", "Windows uses wide (UTF-16) strings heavily, so ASCII-only extraction misses many", "Wide strings are faster", "UTF-16 disables packing"], correctAnswerIndex: 1, explanation: "Windows APIs frequently use UTF-16, so wide-string extraction reveals text ASCII-only mode would miss." },
    ],
  },

  // ── LESSON 8 ───────────────────────────────────────────────────────────────
  {
    title: "08 // Obfuscation & Packing: Seeing Through UPX and Beyond",
    summary: "Why malware hides its code, how to detect packing with entropy and section clues, and the unpack-in-memory technique that defeats it.",
    content: `
      <h2>The code you're reading might not be the real code</h2>
      <p>Malware authors don't want to be analysed, so they wrap their real payload in layers designed to frustrate you. Two related ideas dominate: <strong>packing</strong> (compressing/encrypting the executable so its true code is hidden until runtime) and <strong>obfuscation</strong> (transforming code and data so that, even visible, it's hard to understand). This is why a first look at a sample so often shows gibberish — and why recognising it saves you from analysing the wrong thing.</p>

      <h3>What a packer actually does</h3>
      <p>A <strong>packer</strong> takes a finished executable and produces a new, smaller one containing two parts: the original code as a compressed/encrypted blob, and a small <strong>stub</strong>. When you run the packed file, the stub executes first, <em>unpacks</em> the real code into memory, and then transfers control to it (jumps to the <strong>Original Entry Point, OEP</strong>). The disassembly of a packed file is the disassembly of the stub — not the malware.</p>
      <p><strong>UPX</strong> (the Ultimate Packer for eXecutables) is the classic, legitimate open-source packer. It's used by benign software too, but malware uses it constantly for compression and casual evasion. UPX is unusual in being trivially reversible with its own tool:</p>
      <pre><code># Detect UPX by its telltale section names, then unpack
$ upx -d sample_packed.exe -o sample_unpacked.exe
Unpacked 1 file.</code></pre>
      <blockquote>UPX is the friendly case: it advertises itself (sections named <code>UPX0</code>/<code>UPX1</code>) and unpacks with <code>upx -d</code>. Most real-world packers are custom and hostile — they will not hand you an unpacker. The general technique below is what matters.</blockquote>

      <h3>Detecting packing — the tell-tale signs</h3>
      <table>
        <thead><tr><th>Signal</th><th>Why it indicates packing</th></tr></thead>
        <tbody>
          <tr><td><strong>High entropy</strong></td><td>Compressed/encrypted data looks random; entropy near 8.0 bits/byte in a code section is a strong tell.</td></tr>
          <tr><td><strong>Very few imports</strong></td><td>The real imports are hidden; the stub often imports only <code>LoadLibrary</code>/<code>GetProcAddress</code> to rebuild them at runtime.</td></tr>
          <tr><td><strong>Almost no strings</strong></td><td>Meaningful text is inside the compressed blob, invisible statically.</td></tr>
          <tr><td><strong>Odd sections</strong></td><td>Names like <code>UPX0</code>, or a section whose raw size is ~0 but virtual size is large (unpacked into it at runtime).</td></tr>
          <tr><td><strong>Writable+executable section</strong></td><td>The stub needs to write the unpacked code somewhere it can then execute.</td></tr>
        </tbody>
      </table>
      <p>Tools like <strong>Detect It Easy (DIE)</strong>, PEiD, or a quick entropy graph will flag most packers immediately.</p>

      <h3>The universal unpacking technique</h3>
      <p>You can't always find a magic <code>-d</code> switch, but you can use the fact that <em>the sample must unpack itself to run</em>. The general recipe (performed in your safe lab, in a debugger):</p>
      <ol>
        <li>Load the packed sample in a debugger and let the stub run.</li>
        <li>Find the moment the stub jumps to the OEP — often a distinctive far jump into a freshly-written region (a "tail jump").</li>
        <li>At that instant the real code is decompressed in memory. <strong>Dump</strong> the process memory to disk.</li>
        <li><strong>Rebuild the imports</strong> (tools like Scylla/ImpREC fix the IAT) so the dumped file is analysable.</li>
      </ol>
      <p>The result is an unpacked binary you can now feed to Ghidra as if it were never packed. This "run it until it reveals itself, then capture memory" idea is the reason dynamic analysis is indispensable.</p>

      <h3>Obfuscation beyond packing</h3>
      <ul>
        <li><strong>String encryption</strong> — strings are XORed/encrypted and decoded only when used (recover them by breaking after the decode routine, Lesson 6).</li>
        <li><strong>Control-flow flattening &amp; opaque predicates</strong> — the logic is rearranged and junk branches added to confuse decompilers.</li>
        <li><strong>API hashing</strong> — instead of importing functions by name, the malware looks them up by a hash, hiding intent from the import table.</li>
        <li><strong>Dead code / junk instructions</strong> — meaningless instructions inserted to bloat and mislead.</li>
      </ul>
      <p>All of these map to MITRE ATT&CK <strong>T1027 Obfuscated Files or Information</strong> — the same technique ID the ARCH-X assembly-dissection module flags when it inspects an untrusted, obfuscated target.</p>
    `,
    quizzes: [
      { id: "rev-l8-q1", question: "What does a packer do to an executable?", options: ["Deletes its code", "Compresses/encrypts the real code and adds a stub that unpacks it at runtime", "Signs it with a certificate", "Converts it to a PDF"], correctAnswerIndex: 1, explanation: "A packer hides the real code as a compressed/encrypted blob and prepends a stub that unpacks it in memory." },
      { id: "rev-l8-q2", question: "When you disassemble a packed file, what are you actually looking at?", options: ["The real malware code", "The unpacking stub, not the payload", "The operating system kernel", "Nothing runs"], correctAnswerIndex: 1, explanation: "The visible disassembly is the stub; the real payload only appears after the stub unpacks it at runtime." },
      { id: "rev-l8-q3", question: "What is UPX?", options: ["A debugger", "A common open-source packer that can also unpack with `upx -d`", "A disassembler", "A sandbox"], correctAnswerIndex: 1, explanation: "UPX is a widely used open-source packer; unusually, it unpacks its own files via `upx -d`." },
      { id: "rev-l8-q4", question: "Which measurement is a strong indicator of packing?", options: ["Low entropy in the code section", "High entropy (near 8.0 bits/byte) in a code section", "A large number of strings", "A long file name"], correctAnswerIndex: 1, explanation: "Compressed/encrypted data appears random, so high entropy in a code section strongly suggests packing." },
      { id: "rev-l8-q5", question: "Why do packed samples often show very few imports?", options: ["They need no OS functions", "The real imports are hidden and rebuilt at runtime, so only the stub's minimal imports show", "Imports are illegal when packed", "The compiler removed them"], correctAnswerIndex: 1, explanation: "The stub commonly imports only LoadLibrary/GetProcAddress and reconstructs the true IAT after unpacking." },
      { id: "rev-l8-q6", question: "In the general unpacking technique, when is the real code available to capture?", options: ["Before the sample runs at all", "Once the stub has unpacked it into memory and is about to jump to the OEP", "Only after rebooting", "Never"], correctAnswerIndex: 1, explanation: "The payload is decompressed in memory just before the tail jump to the Original Entry Point; that's when you dump it." },
      { id: "rev-l8-q7", question: "What does 'rebuilding the imports' (e.g. with Scylla) accomplish after a memory dump?", options: ["It re-packs the file", "It fixes the IAT so the dumped, unpacked binary is analysable", "It deletes the stub's code", "It encrypts the payload again"], correctAnswerIndex: 1, explanation: "A raw dump has a broken import table; rebuilding the IAT makes the unpacked binary usable in tools like Ghidra." },
      { id: "rev-l8-q8", question: "Obfuscation techniques like string encryption and API hashing map to which MITRE technique?", options: ["T1110 Brute Force", "T1027 Obfuscated Files or Information", "T1078 Valid Accounts", "T1595 Active Scanning"], correctAnswerIndex: 1, explanation: "Hiding code and data via packing, encryption, or API hashing is captured by T1027 Obfuscated Files or Information." },
    ],
  },

  // ── LESSON 9 ───────────────────────────────────────────────────────────────
  {
    title: "09 // Behavioral Analysis & Extracting IOCs",
    summary: "Detonating safely to observe real behaviour, capturing host and network artifacts, and turning them into durable indicators of compromise.",
    content: `
      <h2>Watching the malware live its life</h2>
      <p>Static analysis tells you what a sample <em>can</em> do; a controlled detonation tells you what it <em>does</em>. In your isolated lab (Lesson 2), you run the sample with instrumentation recording every host and network action, then read the story off the recordings. The goal is twofold: understand the behaviour, and extract <strong>indicators of compromise (IOCs)</strong> that let the rest of the organisation find and block the threat.</p>

      <h3>Instrumenting the detonation</h3>
      <p>You watch four channels, each with classic tools:</p>
      <table>
        <thead><tr><th>Channel</th><th>Tools</th><th>What you learn</th></tr></thead>
        <tbody>
          <tr><td><strong>Processes</strong></td><td>Process Monitor (Procmon), Process Hacker/Explorer</td><td>What it spawns, injects into, and how it's parented.</td></tr>
          <tr><td><strong>Filesystem</strong></td><td>Procmon, before/after disk diff</td><td>Files dropped, modified, or encrypted (ransomware).</td></tr>
          <tr><td><strong>Registry</strong> (Windows)</td><td>Procmon, Regshot</td><td>Persistence keys, configuration written.</td></tr>
          <tr><td><strong>Network</strong></td><td>Wireshark, tcpdump, plus INetSim/FakeNet to answer the sample</td><td>C2 domains/IPs, ports, protocols, beacon patterns.</td></tr>
        </tbody>
      </table>
      <p>A common technique is the <strong>before/after snapshot diff</strong>: tools like Regshot record the clean system, you detonate, then compare — every changed file and key pops out as a precise list of modifications.</p>

      <h3>Reading behaviour into TTPs</h3>
      <p>Raw events become meaning when you group them into behaviours: <em>it copied itself to <code>%APPDATA%</code>, wrote a Run key pointing at that copy (persistence), then resolved a domain and beaconed to it every 60 seconds over HTTPS (C2), and enumerated running processes (discovery)</em>. That narrative is the deliverable — and it maps directly onto MITRE ATT&CK, the subject of Lesson 10.</p>

      <h3>Indicators of compromise</h3>
      <p>An <strong>IOC</strong> is a concrete, detectable artifact of the threat. IOCs come in tiers of usefulness — the <strong>Pyramid of Pain</strong> ranks them by how much it hurts the attacker when you block them:</p>
      <table>
        <thead><tr><th>Indicator</th><th>Examples</th><th>Pain to attacker</th></tr></thead>
        <tbody>
          <tr><td>Hash values</td><td>SHA-256 of the sample</td><td>Trivial — change one byte</td></tr>
          <tr><td>IP addresses</td><td>C2 server IP</td><td>Easy — rotate infrastructure</td></tr>
          <tr><td>Domain names</td><td>C2 domain</td><td>Some effort — re-register</td></tr>
          <tr><td>Host/network artifacts</td><td>Registry key, mutex name, URI pattern, User-Agent</td><td>Annoying — must change tooling</td></tr>
          <tr><td>Tools</td><td>The specific packer/loader used</td><td>Hard — retool</td></tr>
          <tr><td><strong>TTPs</strong></td><td>The behaviours themselves (e.g. Run-key persistence + injection)</td><td><strong>Hardest</strong> — change how they operate</td></tr>
        </tbody>
      </table>
      <blockquote>The lesson of the pyramid: blocking a hash inconveniences the attacker for minutes; detecting a behaviour forces them to rebuild their playbook. Aim your best detections high up the pyramid — at behaviour, not just atomic indicators.</blockquote>

      <h3>Writing detections: YARA and Sigma</h3>
      <ul>
        <li><strong>YARA</strong> — rules that match <em>files/memory</em> by byte patterns and strings; the standard way to describe a malware family so you can hunt for it across systems.</li>
        <li><strong>Sigma</strong> — a generic, SIEM-agnostic rule format for matching <em>log events</em> (behaviours), which converts to your platform's query language.</li>
      </ul>
      <p>A good analysis ends not with "it's malicious" but with sharable artifacts: a YARA rule for the family, a Sigma rule for the behaviour, and a clean IOC list — so one person's analysis protects everyone.</p>
    `,
    quizzes: [
      { id: "rev-l9-q1", question: "What does behavioural (dynamic) analysis primarily reveal?", options: ["The source code comments", "What the sample actually does when run — its real behaviour", "The compiler version", "The author's name"], correctAnswerIndex: 1, explanation: "Detonating the sample in a controlled lab shows its real runtime behaviour, complementing static analysis." },
      { id: "rev-l9-q2", question: "Which tool captures network traffic during a detonation?", options: ["Regshot", "Wireshark", "Ghidra", "upx"], correctAnswerIndex: 1, explanation: "Wireshark (and tcpdump) capture the sample's network activity, revealing C2 destinations and protocols." },
      { id: "rev-l9-q3", question: "What does a before/after tool like Regshot provide?", options: ["A disassembly listing", "A precise diff of files and registry keys changed by the sample", "A packed version of the file", "A firewall rule"], correctAnswerIndex: 1, explanation: "Regshot snapshots the clean system and compares after detonation, listing exactly what changed." },
      { id: "rev-l9-q4", question: "What is an IOC?", options: ["A CPU register", "A concrete, detectable artifact of a threat (e.g. hash, domain, registry key)", "A debugger command", "A section of a PE file"], correctAnswerIndex: 1, explanation: "An Indicator of Compromise is a detectable artifact used to find and block the threat." },
      { id: "rev-l9-q5", question: "According to the Pyramid of Pain, which indicator hurts the attacker most when blocked?", options: ["A file hash", "An IP address", "TTPs — the attacker's behaviours", "A domain name"], correctAnswerIndex: 2, explanation: "Detecting behaviours (TTPs) forces attackers to change how they operate — far harder than rotating a hash or IP." },
      { id: "rev-l9-q6", question: "Why is a C2 IP address only a moderately useful indicator?", options: ["IPs cannot be logged", "Attackers can rotate infrastructure and change the IP easily", "IPs are encrypted", "It never appears in traffic"], correctAnswerIndex: 1, explanation: "IP addresses sit low on the Pyramid of Pain because attackers rotate them with little effort." },
      { id: "rev-l9-q7", question: "What are YARA rules used to match?", options: ["Log events in a SIEM", "Files and memory by byte patterns and strings, to identify malware families", "Network routes", "Registry backups"], correctAnswerIndex: 1, explanation: "YARA describes files/memory via strings and byte patterns, enabling family-level hunting across systems." },
      { id: "rev-l9-q8", question: "What is Sigma designed for?", options: ["Packing executables", "A generic, SIEM-agnostic rule format for detecting behaviours in log events", "Decompiling binaries", "Hashing files"], correctAnswerIndex: 1, explanation: "Sigma is a portable detection-rule format for log/behaviour matching that converts to various SIEM query languages." },
    ],
  },

  // ── LESSON 10 ──────────────────────────────────────────────────────────────
  {
    title: "10 // Mapping Malware Behaviour to MITRE ATT&CK",
    summary: "Turning your analysis into shared intelligence — mapping observed behaviours to ATT&CK tactics and techniques for detection, reporting, and defence.",
    content: `
      <h2>From a single sample to shared knowledge</h2>
      <p>You've triaged, unpacked, disassembled, debugged, and detonated a sample. The final step turns that work into intelligence the whole industry can use, by expressing the behaviours in a common language: <strong>MITRE ATT&CK</strong>, a free, globally-used knowledge base of real adversary behaviour organised as <strong>tactics</strong> (the attacker's goal — the "why") containing <strong>techniques</strong> (how they achieve it — the "how"), each with an ID like <code>T1055</code>.</p>

      <h3>Tactics vs techniques</h3>
      <ul>
        <li><strong>Tactic</strong> = the objective, e.g. <em>Defense Evasion</em> or <em>Command and Control</em>. These are the columns of the ATT&CK matrix.</li>
        <li><strong>Technique</strong> = a specific method to reach it, e.g. <em>T1055 Process Injection</em>. Sub-techniques refine further (T1055.001 DLL Injection, T1055.002 PE Injection, …).</li>
      </ul>
      <p>Because malware analysis focuses on execution and post-compromise behaviour, the tactics you'll map most often are Execution, Persistence, Defense Evasion, Discovery, Collection, Command and Control, and Impact — which is exactly why the ARCH-X reverse-engineering course weights Execution and Discovery in its coverage.</p>

      <h3>Mapping a representative sample end to end</h3>
      <p>Take the behaviours observed in Lesson 9 and place each on the matrix:</p>
      <table>
        <thead><tr><th>Observed behaviour</th><th>ATT&CK Tactic</th><th>Technique</th></tr></thead>
        <tbody>
          <tr><td>Runs its payload / spawns a child process</td><td>Execution</td><td>T1059 Command and Scripting Interpreter</td></tr>
          <tr><td>Payload is UPX-packed / strings XOR-encrypted</td><td>Defense Evasion</td><td>T1027 Obfuscated Files or Information</td></tr>
          <tr><td>Injects code into another process</td><td>Defense Evasion / Privilege Escalation</td><td>T1055 Process Injection</td></tr>
          <tr><td>Writes a <code>...\\CurrentVersion\\Run</code> registry value</td><td>Persistence</td><td>T1547.001 Registry Run Keys / Startup Folder</td></tr>
          <tr><td>Enumerates running processes and system info</td><td>Discovery</td><td>T1057 Process Discovery</td></tr>
          <tr><td>Beacons to a C2 domain over HTTPS</td><td>Command and Control</td><td>T1071.001 Web Protocols</td></tr>
          <tr><td>Encrypts user files and drops a ransom note</td><td>Impact</td><td>T1486 Data Encrypted for Impact</td></tr>
        </tbody>
      </table>
      <p>Notice how one sample lights up multiple tactics across the chain. A mature detection program aims for coverage along the whole chain, because catching the adversary at <em>any</em> stage disrupts them.</p>

      <h3>Why mapping matters in practice</h3>
      <ul>
        <li><strong>Communication</strong> — "T1055 into T1071.001, persisting via T1547.001" is understood instantly by any analyst anywhere, with no ambiguity.</li>
        <li><strong>Coverage analysis</strong> — plotting your detections on the matrix (e.g. with the ATT&CK Navigator) exposes blind spots — techniques you can't currently see.</li>
        <li><strong>Threat-informed defence</strong> — you can prioritise the techniques the adversaries actually targeting your sector use, rather than defending everything equally.</li>
        <li><strong>Reporting</strong> — threat-intel reports and leadership increasingly expect ATT&CK-mapped findings as the standard format.</li>
      </ul>

      <h3>Closing the loop</h3>
      <p>Your ATT&CK-mapped analysis feeds straight back into detection: each technique suggests where to place a tripwire — a Sigma rule for the Run-key write, a network detection for the C2 pattern, a YARA rule for the family. This is the entire arc of the course in one sentence: <em>take an unknown binary apart safely, understand what it does, and turn that understanding into durable defence.</em></p>
      <blockquote>Takeaway: don't think of malware as one event but as a <strong>chain of tactics</strong>. Reverse engineering reveals the chain; ATT&CK gives you the map; your detections are the tripwires you place along it.</blockquote>
    `,
    quizzes: [
      { id: "rev-l10-q1", question: "What is MITRE ATT&CK?", options: ["A disassembler", "A free knowledge base cataloguing real adversary tactics and techniques", "A packer", "An antivirus engine"], correctAnswerIndex: 1, explanation: "ATT&CK is a globally-used, free knowledge base of adversary behaviours organised as tactics and techniques." },
      { id: "rev-l10-q2", question: "What is the difference between a tactic and a technique?", options: ["They are synonyms", "A tactic is the attacker's goal; a technique is a specific method to achieve it", "A technique is the goal; a tactic is the method", "Tactics are tools, techniques are people"], correctAnswerIndex: 1, explanation: "Tactic = the 'why' (objective); technique = the 'how' (specific method), each with an ID like T1055." },
      { id: "rev-l10-q3", question: "Injecting code into another process maps to which technique?", options: ["T1486 Data Encrypted for Impact", "T1055 Process Injection", "T1071 Application Layer Protocol", "T1057 Process Discovery"], correctAnswerIndex: 1, explanation: "Running code inside another process is T1055 Process Injection, often used for evasion and privilege escalation." },
      { id: "rev-l10-q4", question: "Writing a `...\\CurrentVersion\\Run` value for auto-start maps to which technique?", options: ["T1547.001 Registry Run Keys / Startup Folder", "T1059 Command and Scripting Interpreter", "T1027 Obfuscated Files or Information", "T1486 Data Encrypted for Impact"], correctAnswerIndex: 0, explanation: "Run-key persistence is T1547.001, under the Persistence tactic." },
      { id: "rev-l10-q5", question: "A sample that encrypts user files and drops a ransom note maps to which technique?", options: ["T1057 Process Discovery", "T1071.001 Web Protocols", "T1486 Data Encrypted for Impact", "T1055 Process Injection"], correctAnswerIndex: 2, explanation: "Encrypting data to extort the victim is T1486 Data Encrypted for Impact, under the Impact tactic." },
      { id: "rev-l10-q6", question: "Beaconing to a C2 server over HTTPS is an example of which tactic?", options: ["Persistence", "Command and Control", "Reconnaissance", "Collection"], correctAnswerIndex: 1, explanation: "Communicating with an external controller is the Command and Control tactic (e.g. T1071.001 Web Protocols)." },
      { id: "rev-l10-q7", question: "Why plot your detections on the ATT&CK matrix (e.g. with Navigator)?", options: ["To slow the SIEM", "To reveal coverage blind spots and communicate in a shared language", "It is legally required everywhere", "To pack the binary"], correctAnswerIndex: 1, explanation: "Mapping detections shows which techniques you can and cannot see, and standardises communication." },
      { id: "rev-l10-q8", question: "What does it mean that one sample 'touches several tactics'?", options: ["The analysis was wrong", "The attack is a chain (execution → persistence → evasion → C2 → impact), giving multiple chances to detect and stop it", "The sample is corrupted", "Each tactic is a different malware"], correctAnswerIndex: 1, explanation: "Malware progresses through multiple tactics; coverage across the chain provides several opportunities to disrupt it." },
    ],
  },
];
