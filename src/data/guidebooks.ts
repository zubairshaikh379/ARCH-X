export interface Guidebook {
  courseId: string;
  title: string;
  prerequisites: string[];
  markdown: string;
}

export const COURSE_GUIDEBOOKS: Record<string, Guidebook> = {
  "soc-analyst": {
    courseId: "soc-analyst",
    title: "Security Operations Center (SOC) Analyst Guidebook",
    prerequisites: ["Basic Linux Commands", "Understanding SSH Logs", "JSON Structure"],
    markdown: `# 🛡️ Security Operations: SSH Intrusion Auditing

## 1. Introduction to the Course: The Role of the Defensive Sentinel
Welcome to the front lines of enterprise defense. In the modern cyber threat landscape, the Security Operations Center (SOC) serves as an organization's central command post. Analysts here are tasked with real-time observation, triage, and threat mitigation. This textbook-level course focuses specifically on **SSH (Secure Shell) Intrusion Auditing**—a cornerstone of network asset defense.

As an analyst, you represent the active shield of the network. When threat actors launch automated probes against server endpoints, they leave subtle trace marks in the system logs. Your responsibility is to sift through millions of ambient transactions, isolate indicators of compromise (IoCs), and execute precise countermeasures before a breach can escalate. You will learn to move beyond passive observation and master reactive engineering to maintain a robust, locked-down server configuration.

## 2. Beginner Stuff: Foundational Setup & Log Mechanics
Every network communication starts with sockets. SSH, operating by default on standard system **Port 22**, is the cryptographic protocol used to manage servers remotely. When an external client attempts to connect to Port 22, the SSH daemon (sshd) coordinates a complex handshake, checking keys or passwords, and logs the outcome.

### Understanding the Authentication Lifecycle
\`\`\`
[Client Request] ----> [Port 22 Listener] ----> [sshd Handshake Engine]
                                                        |
                                                        v
                                             [Local PAM Modules]
                                                        |
                                       +----------------+----------------+
                                       |                                 |
                                       v                                 v
                             (Success: Authorized)            (Failure: Logged)
                                       |                                 |
                        [Create TTY / Alloc Shell]     [Write to auth.log / secure]
\`\`\`

These transaction histories are channeled into standard local filesystem storage pools. On Debian/Ubuntu Linux systems, authentication telemetry is written to \`/var/log/auth.log\`, whereas RedHat/CentOS platforms routing syslog write events to \`/var/log/secure\`. In this lab, we capture and export these records into an easy-to-parse JSON structure (\`audit_log.json\`) which contains crucial properties such as the timestamp, source IP, username requested, and auth status.

## 3. Explanation of Core Concepts: Brute Force & Log Correlation
Defending an enterprise requires understanding the enemy's mechanics. Let's unpack the core analytical principles of intrusion detection:

### Brute-Force Attacks (MITRE ATT&CK T1110)
A brute-force attack is an automated, high-frequency trial-and-error procedure where an attacker attempts to gain access to a system by guessing passwords, passphrases, or keys. Threat actors utilize specialized cracking utilities (such as *Hydra* or *Medusa*) running script loops that test lists of common administrative usernames (like \`root\`, \`admin\`, \`ubuntu\`) combined with millions of generic password hashes.

### Log Correlation
Log correlation is the analytical process of aggregating raw data points across multiple independent logs and aligning them chronologically to map a unified threat narrative. For example, a single failed login is a non-alerting event (often a user typo). However, when correlated over a sliding window—such as **50 failed login attempts targeting 15 different usernames within 30 seconds from a single IP**, it triggers a critical brute-force security alert.

### Firewall Filtering & Kernel Drops
When a brute-force attack is active, you must immediately isolate the attacker. This is done by modifying the host's firewall rules (using \`iptables\`, \`nftables\`, or local security routers). Applying a **Drop Rule** tells the operating system's kernel to silently discard all packets coming from the offending IP address. This stops the attack at the hardware interface and breaks off the handshake before it wastes system CPU resources.

## 4. Interrelating Starting Topics: From Letters to Books
To master the art of security analysis, we employ a progressive conceptual paradigm. We compare raw security events to the structure of language, scaling from characters up to entire reference systems:

*   **Letters (The raw telemetry):** Individual isolated variables in a transaction. An IP address (\`198.51.100.12\`), a state flag (\`SSH_FAILED\`), or a string username (\`root\`). Alone, these variables possess no inherent security meaning or context.
*   **Words (The parsed log line):** Bringing the letters together into a structured sentence-like record. For example:
    \`{"timestamp": "2026-06-25T04:12:05Z", "src_ip": "198.51.100.12", "event": "SSH_FAILED", "user": "root"}\`.
    We now have a complete, readable event detailing exactly who, what, where, and when.
*   **Sentences (Log correlation patterns):** Reading several log lines together to find a specific behavioral pattern. When your syslog SIEM filter captures dozens of consecutive "words" indicating failures from the same source IP, you have formed a "sentence" which reads: *"A malicious brute force attempt is targeting our primary application container."*
*   **Paragraphs (The defensive response):** Translating your compiled sentence into physical action. Once the intrusion is diagnosed, you author an active firewall drop rule using the console—such as running \`block-ip 198.51.100.12\`. This "paragraph" actively reshapes network pathways to safeguard the container's integrity.
*   **Books (The unified security architecture):** Designing a multi-layered defensive framework across the entire ecosystem. This means configuring automated host-based intrusion prevention agents (like *Fail2Ban*), enforcing cryptographic asymmetric key-based authentication with high entropy (RSA 4096-bit or Ed25519), disabling remote root logins entirely, and maintaining detailed immutable offsite audit trails.

## 5. The Final Guide: Standard Operating Procedure (SOP)
Follow this formal, multi-step checklist to systematically investigate and mitigate active SSH brute-force incidents:

1.  **Analyze System Activity:** Check the real-time alert logs and system files to detect patterns. Look for repeated authentication failures coming from unexpected or offshore subnets.
2.  **Correlate the Attacker:** Track the recurring source IP address and note the usernames they are attempting to exploit. Keep track of how many login attempts are recorded and what their failure rate is.
3.  **Execute the Quarantine Rule:** Run your firewall utility to drop all incoming packets from the identified IP address.
4.  **Verify Containment Status:** Run status check commands on your firewall to confirm the drop rule has been actively applied. Monitor the system's log files to make sure the failed attempts have stopped and the system is secure.

## 6. The Quiz Preparatory Guide: Master Defensive Theory
Before taking your comprehension certification quiz, study these core defensive guidelines to ensure an elite passing grade:

*   **Key-Based Authentication:** Understand why SSH key-based authentication is infinitely more secure than password logins. Cryptographic private/public key pairs are virtually impossible to brute-force, bypassing the risk of weak password choices.
*   **Timestamp Synchronization:** Learn why Network Time Protocol (NTP) is critical for SOC logs. Without millisecond-level synchronization, logs from different firewalls and servers cannot be correlated chronologically, making attack reconstructions impossible.
*   **Low-and-Slow Attack Patterns:** Recognise how advanced attackers bypass brute-force sensors by spacing out login attempts (e.g., one attempt every 15 minutes) to avoid triggering simple threshold alarms. Detecting these requires long-term correlation windows.

## 7. The Final CTF Test on the VM
Test your skills on our simulated Container VM to complete this course:
1.  **Boot the Sandbox VM:** Open the simulation deck on the right and boot up your container workspace.
2.  **Check Local Files:** Run the \`ls\` command to explore the server's working directory.
3.  **Inspect System Logs:** Read the system's security login records by running \`cat audit_log.json\` or search for specific errors using \`grep\`.
4.  **Confirm Attacker IP:** Run the \`status\` command to view the system firewall status and active log recommendations. Identify the malicious IP (e.g. \`198.51.100.12\`).
5.  **Ban the Offender:** Run \`block-ip 198.51.100.12\` to instantly block the attacker at the firewall level.
6.  **Retrieve completion Flag:** Once the drop-rule is set, capture the secure cryptographic flag printed in your terminal console and submit it to receive your credit points!
`
  },
  "pentest": {
    courseId: "pentest",
    title: "Penetration Tester Guidebook",
    prerequisites: ["Port Scanning Concepts", "Exploit Payloads", "Web API Vulnerabilities"],
    markdown: `# 💥 Offensive Security: Vulnerability Pivoting

## 1. Introduction to the Course: The Offensive Mindset
Step into the boots of an ethical hacker. This textbook-level course is designed to transition you from a passive observer to an active, structured security auditor. In offensive security, our goal is not to break things maliciously, but rather to perform proactive vulnerability assessments. By identifying system weaknesses and misconfigurations before malicious actors can find them, we can provide developers with the precise intelligence they need to secure their networks.

The offensive methodology is rigorous, scientific, and highly detailed. It begins with comprehensive discovery, moves to service profiling, identifies potential flaws, develops stable proof-of-concept exploits, and ends with extensive mitigation plans. Throughout this track, you will learn to think like an adversary to build a stronger defense.

## 2. Beginner Stuff: Foundational Setup & Network Sockets
Before you can analyze or exploit a system, you must understand how computer networks manage communication endpoints. A **network socket** is defined by a combination of an IP address and a **Port**.

### Common Ports & System Services
* **Port 22 (SSH):** Remote terminal administration. Securely encrypted but highly targeted for password brute-forcing.
* **Port 80 / 443 (HTTP/HTTPS):** Standard web servers. Often host APIs, admin consoles, and complex database applications.
* **Port 8080 (Alternative HTTP):** Commonly used for developer APIs, debugging microservices, and secondary administrative web panels.
* **Service Banners:** When a client initiates a TCP handshake with an open port, the listening service sends back introductory metadata known as a "banner" (e.g., \`Nginx 1.22\` or \`Apache Tomcat 9.0.58\`). These banners are crucial because they reveal the exact software name and version number, giving testers a direct starting point for checking known vulnerabilities.

## 3. Explanation of Core Concepts: Recon & Remote Code Execution
Ethical hacking is built on three fundamental concepts:

### Reconnaissance (MITRE ATT&CK T1046)
Reconnaissance is the systematic discovery of active systems, open ports, and listening services on a network segment. Using tools like *Nmap*, we scan target IPs, sending probe packets to detect which ports respond and grab service banners. Recon is the most critical phase: an incorrect scan can lead you down a dead-end path or trigger automated defense firewalls.

### Remote Code Execution (RCE)
RCE is a class of vulnerability that allows an attacker to execute arbitrary commands of their choice on a target machine. This typically occurs when a program takes user-supplied input and processes it without proper bounds validation. In classic memory-corruption flaws (like buffer overflows), excessive input data overflows a program's temporary memory buffers, overriding execution registers to point to the attacker's shell code.

### Exploit Payloads
An exploit payload is a specific script or compiled bytecode designed to leverage a software vulnerability to open an interactive backdoor command shell. Ethical hackers use stable, non-destructive payloads to prove that an exploit is possible. In our lab, you will run \`exploit-api\`, which leverages an input bypass bug to gain interactive command access.

## 4. Interrelating Starting Topics: From Letters to Books
Offensive security follows a highly structured, step-by-step path. Let's compare this progression to the elements of language:

* **Letters (Target Identifiers):** Isolated data points like a target IP address (\`10.10.1.5\`) or an open network port (\`8080\`). Without further profiling, these are just coordinates in space.
* **Words (Service Profiling):** Actively checking those coordinates to identify the exact service banner: \`ARCH-X CoreAPI v1.02\`. We now know the software name and release version.
* **Sentences (Vulnerability Mapping):** Connecting your service details to a known software vulnerability: *"ARCH-X CoreAPI v1.02 contains an input handling buffer bypass flaw that leads to remote code execution."*
* **Paragraphs (Exploitation & Shell Capture):** Deploying your targeted proof-of-concept payload: \`exploit-api --version v1.02\`. This exploits the memory bug and opens a direct command shell.
* **Books (The Complete Pentest Cycle):** Executing the full lifecycle. This starts with systematic reconnaissance, moves to vulnerability analysis, exploits the system to gain administrative privileges, retrieves system validation flags, cleans up traces of the test, and writes an in-depth security report to help the organization patch the vulnerability.

## 5. The Final Guide: Standard Operating Procedure (SOP)
Follow this standard industry methodology to audit and remediate network vulnerabilities:

1. **Conduct Reconnaissance:** Run a detailed network port scan to discover active servers and locate open ports.
2. **Inspect Service Banners:** Examine service banners to profile the exact software version running on each open port.
3. **Cross-Reference Vulnerabilities:** Check the identified versions against CVE databases to locate known security flaws.
4. **Deploy Safe Exploit Modules:** Run your safe exploit script to verify the vulnerability and secure a command shell.
5. **Extract Flag Token:** Retrieve the secure validation flag from the system configuration to prove a compromise was possible.
6. **Formulate Remediation Steps:** Document your findings and outline the patching steps needed to secure the system.

## 6. The Quiz Preparatory Guide: Master Offensive Theory
Review these critical concepts to prepare for your penetration testing certification quiz:

* **Version Profiling Switches (\`-sV\`):** Understand how Nmap queries service banners. Running \`nmap -sV\` tells Nmap to send specialized probe packets to open ports to capture returning version strings.
* **Input Sanitization:** Learn why robust input validation is the ultimate defense against exploitation. Programs must strictly validate input length, type, and character set before writing data to memory buffers.
* **Privilege Escalation:** Know the transition from initial access to full system control. Attackers often compromise a low-privileged system service first, then exploit local OS vulnerabilities to elevate their permissions to root or administrator.

## 7. The Final CTF Test on the VM
Test your penetration testing skills on our simulated container sandbox:
1. **Deploy the Lab Sandbox:** Boot up your sandbox environment in the right-hand panel.
2. **Audit Version Numbers:** Run \`nmap -sV 10.10.1.5\` in your terminal to scan the target server.
3. **Identify Exploitable Services:** Locate the custom API running on Port 8080. Identify its version number (\`v1.02\`).
4. **Run the Exploit Payload:** Run the exploit script by executing: \`exploit-api --version v1.02\`.
5. **Capture the Validation Flag:** Upon successful execution, read the printed cryptographic flag token and submit it to earn your certification credit!
`
  },
  "devsecops": {
    courseId: "devsecops",
    title: "DevSecOps & Pipeline Security Guidebook",
    prerequisites: ["Git Repositories", "AWS IAM Keys", "Configuration Variables"],
    markdown: `# ⛓️ DevSecOps: Continuous Security Pipelines

## 1. Introduction to the Course: Security at Agile Speed
Welcome to DevSecOps—the discipline of integrating security directly into rapid software development lifecycles. Historically, security was treated as a final, manual check performed right before software went live. This old method created major bottlenecks, delaying release schedules and forcing developers to fix bugs at the last minute.

DevSecOps changes this by shifting security "left"—integrating automated security controls, scanning tools, and policy checks directly into the continuous integration and continuous deployment (CI/CD) pipelines. In this textbook-level course, you will learn how to build automated security gates that inspect code for security flaws, scan git repositories for accidentally committed credentials, and verify third-party libraries for known vulnerabilities before code ever reaches production.

## 2. Beginner Stuff: Foundational Git & Secret Management
To understand pipeline security, you must understand how codebases track changes and manage sensitive credentials.

### How Git Commits Work
Git is a distributed version control system that records changes to a codebase over time as a series of cryptographic snapshots called **Commits**. Each commit references the unique SHA-1 hash of its parent commit, forming an immutable ledger of the project's history.

### The Danger of API Secrets
API keys, database passwords, and cryptographic certificates are the keys to your digital castle. These credentials allow automated servers to connect and deploy cloud infrastructure. 
* **Hardcoded Secrets:** When developers write these keys directly into their configuration files (like \`config/production.yaml\`) for convenience, it is called a "hardcoded secret".
* **The Git Leak Vector:** If a repository containing hardcoded secrets is pushed to a public platform (like GitHub), automated scraper bots will detect the credentials within seconds, often leading to immediate cloud infrastructure hijacking.

## 3. Explanation of Core Concepts: Secrets Exposure & Git Permanence
Let's unpack the core concepts of secure development pipelines:

### Secrets in Code (MITRE ATT&CK T1552)
This is the high-risk practice of committing administrative credentials directly into code repositories. Attackers scan public code registries looking for keywords like \`AWS_ACCESS_KEY_ID\` or \`password=\` to compromise servers, databases, and cloud services.

### Git History Permanence
One of the most common mistakes developers make is trying to delete a leaked credential by simply making a new commit that removes the key. **This does not work.** Git is designed to maintain a permanent history of every modification. The leaked credential remains fully visible in the repository's previous commits and history. To completely remove a secret from Git, you must rewrite the repository's history using specialized tools (like \`git-filter-repo\` or BFG Repo-Cleaner) to purge the data from every single commit.

### Credential Rotation & Secret Vaulting
When a key is exposed, you must assume it is compromised. Decoupling configuration from secrets is a fundamental security practice. You must store credentials in a centralized, secure cloud vault (like AWS Secrets Manager, HashiCorp Vault, or Google Cloud Secret Manager) and rotate them on a regular basis.

## 4. Interrelating Starting Topics: From Letters to Books
Pipeline security scales from basic data points to complete enterprise-level workflows:

*   **Letters (Plaintext Keys):** Individual high-entropy secret string values, such as an AWS access key: \`AKIA_LEAKED_SECRET_99\`.
*   **Words (Config Declarations):** Storing those secret values in application configuration files, such as writing them into \`config/production.yaml\`.
*   **Sentences (Exposed Commits):** Pushing changes containing those config files to your main repository branch, exposing the keys to the entire team (and potentially the public).
*   **Paragraphs (Secrets Scanning):** Running continuous pipeline scanners (like \`git-scan\`, *Gitleaks*, or *TruffleHog*) that automatically parse every single commit in the repository's history to locate and flag exposed credentials.
*   **Books (The Unified DevSecOps Pipeline):** Designing a complete, automated development workflow. This includes running pre-commit hooks to block keys from leaving developer machines, using static application security testing (SAST) to audit code quality, validating open-source packages for known vulnerabilities (SCA), and hosting keys in secure cloud vaults with automated key rotation.

## 5. The Final Guide: Standard Operating Procedure (SOP)
Follow this industry-standard SOP when dealing with exposed secrets in a development pipeline:

1.  **Run Repository Audits:** Use automated secrets scanners to audit your repository's history and locate any exposed credentials.
2.  **Pinpoint the Exposure:** Identify the exact file, line number, and historical commit where the credential was committed.
3.  **Revoke and Rotate Immediately:** Assume the key is compromised. Revoke the token immediately in the provider's administration console and issue a new, secure replacement.
4.  **Rewrite Git History:** Purge the leaked credential from the repository's history to ensure it cannot be found in previous commits.
5.  **Set Up Pre-Commit Rules:** Install pre-commit hooks on developer workstations to inspect code locally and prevent credentials from ever being committed again.

## 6. The Quiz Preparatory Guide: Master DevSecOps Theory
Study these key concepts to prepare for your DevSecOps certification quiz:

*   **The Inadequacy of Reverting:** Remember that a standard "git revert" or simple code deletion does not secure a leaked key. The secret will still exist in the repository's history and can be easily found.
*   **Pre-Commit vs. CI/CD Scanning:** Pre-commit hooks run locally on a developer's machine *before* code is committed, providing immediate feedback. CI/CD scanners run on central build servers to ensure that any code merged into the main branches meets all organization-wide security rules.
*   **Secret Injection:** Learn how applications access secrets safely in production. Rather than putting keys in files, secure pipelines inject credentials as environment variables at runtime, keeping the keys completely separate from the source code.

## 7. The Final CTF Test on the VM
Validate your pipeline security skills on our simulated container sandbox:
1.  **Boot your Sandbox environment:** Deploy your container workspace on the right-hand panel.
2.  **Scan Code History:** Run the repository scanner by executing \`git-scan\` in your terminal.
3.  **Identify Compromised Credentials:** Find the exposed AWS key ID (\`AKIA_LEAKED_SECRET_99\`) located in the \`config/production.yaml\` history.
4.  **Invalidate the Leaked Token:** Revoke the exposed key immediately by executing: \`invalidate-key AKIA_LEAKED_SECRET_99\`.
5.  **Capture your Flag:** Upon successful revocation, read the printed cryptographic flag token and submit it to secure your certification credit!
`
  },
  "network-security": {
    courseId: "network-security",
    title: "Network Security Engineer Guidebook",
    prerequisites: ["ARP Protocol", "Packet Inspection", "Network Routers"],
    markdown: `# 🌐 Network Security: Rogue Gateway Containment

## 1. Introduction to the Course
Welcome to the core of network defense. This course dives deep into layer 2/3 network communications, packet analysis, and transport security. You will learn to identify rogue network broadcasts, detect Man-in-the-Middle (MitM) interceptions, and isolate attacking hosts to secure network boundaries.

## 2. Beginner Stuff (Foundational Setup)
Understanding fundamental local network resolution is key:
* **ARP (Address Resolution Protocol):** The standard protocol that resolves IP addresses to physical MAC addresses on a local network.
* **Network Interfaces:** Local software gateways (like \`eth0\`) that capture and route packet streams.

## 3. Explanation of Core Concepts
* **ARP Spoofing / Poisoning (MITRE T1557):** The ARP protocol has no built-in authentication. Attackers can broadcast spoofed replies claiming their MAC address matches the default gateway IP, redirecting local client traffic.
* **Man-in-the-Middle (MitM):** Once traffic is hijacked, the attacker can silently log cleartext credentials, hijack sessions, and perform DNS redirection.
* **Static ARP Inspection:** Hardcoding IP-to-MAC bindings or enabling network-level switch inspections to filter fraudulent broadcasts.

## 4. Interrelating Starting Topics: From Letters to Books
Network tracking progresses chronologically:
* **Letters (Socket Addresses):** Individual IP (\`192.168.1.5\`) and physical MAC addresses.
* **Words (ARP Packets):** Individual protocol mappings broadcasted over network cables.
* **Sentences (Traffic Flows):** A continuous stream of packets showing a single MAC claiming multiple IP addresses.
* **Paragraphs (Detection and Filtering):** Running a protocol sniffer (\`sniff-traffic\`) to isolate anomalous ARP broadcasts, and applying routing block rules (\`drop-route 192.168.1.5\`).
* **Books (Enterprise Network Hardening):** Deploying complete defense architectures—Dynamic ARP Inspection (DAI), DHCP Snooping, 802.1X secure port authentication, and end-to-end transport layer encryption.

## 5. The Final Guide (Standard Operating Procedure)
1. **Listen**: Sniff active network adapters to log local routing broadcasts.
2. **Analyze**: Compare broadcasting MAC addresses with known gateway registers.
3. **Block**: Drop packet routes originating from verified spoofing hosts.
4. **Secure**: Transition core interfaces to use static, immutable resolution maps.

## 6. The Quiz Preparatory Guide
Focus on these key protocol attributes for your upcoming test:
* Understand why the lack of built-in verification in legacy ARP allows unauthenticated broadcasts.
* Grasp how a MitM attacker redirects traffic.

## 7. The Final CTF Test on the VM
Complete these steps in your terminal to secure the network flag:
1. Boot up the dedicated lab workstation VM.
2. Start sniffing network packets using the interface command: \`sniff-traffic\`.
3. Identify the rogue host IP \`192.168.1.5\` broadcasting fake gateway routes.
4. Drop traffic from the attacker's endpoint using: \`drop-route 192.168.1.5\`.
5. Capture the network isolation flag.
`
  },
  "digital-forensics": {
    courseId: "digital-forensics",
    title: "Digital Forensics & Incident Response Guidebook",
    prerequisites: ["Windows/Linux Processes", "Memory Inspection", "System Binaries"],
    markdown: `# 🔍 Digital Forensics: Volatile Memory Dissection

## 1. Introduction to the Course
Welcome to the digital crime lab. Forensic investigators analyze systems post-compromise to reconstruct attacks, extract malware files, and recover critical evidence. This course covers the live inspection of volatile RAM, process structures, and binary integrity.

## 2. Beginner Stuff (Foundational Setup)
Understanding operating system execution states is crucial:
* **Processes:** Running instances of system programs, each identified by a unique Process ID (PID).
* **System Directories:** Standard, write-protected system folders (like \`System32\`) where authentic system files execute.

## 3. Explanation of Core Concepts
* **Volatile Memory (RAM) Analysis:** Capturing and inspecting RAM, which holds active execution logs, decryption keys, and running malware threads that vanish upon system reboot.
* **Masquerading (MITRE T1036):** Renaming malware to mimic legitimate system tools (e.g., \`svchost.exe\`) while hiding inside writable user folders (like \`C:\\Users\\Public\`).
* **Process Isolation:** Suspicious process threads must be frozen (quarantined) to prevent further system damage while preserving memory states for deep investigation.

## 4. Interrelating Starting Topics: From Letters to Books
Forensic analysis develops from single indicators:
* **Letters (Process Descriptors):** Individual numerical Process IDs (e.g., \`1900\`) and executable names.
* **Words (Process Details):** Audit fields pairing a PID with its parent process, user owner, and disk location paths.
* **Sentences (Process Trees):** Hierarchical views showing parent-child process chains (e.g., finding a shell executing from an image viewer).
* **Paragraphs (Quarantine Action):** Using process listing commands (\`ps -list\`) to isolate malicious processes and running quarantine utilities (\`quarantine-pid 1900\`).
* **Books (Full Incident Autopsy):** Conducting a complete investigation—taking verified disk images, dumping volatile RAM, identifying zero-day threat footprints, mapping lateral movement, and authoring formal forensic briefs.

## 5. The Final Guide (Standard Operating Procedure)
1. **Inspect**: List all running process handles and their source execution paths.
2. **Audit**: Flag standard system names operating out of user-writable directories.
3. **Quarantine**: Suspend the target process thread immediately.
4. **Preserve**: Extract the binary cryptographic signature to prevent future infections.

## 6. The Quiz Preparatory Guide
Review these key forensic concepts for your assessment:
* Understand why critical system tools like \`svchost.exe\` must execute exclusively out of standard folders (like \`C:\\Windows\\System32\\\`).
* Learn the value of retaining volatile RAM during containment.

## 7. The Final CTF Test on the VM
To secure your volatile forensics certification flag:
1. Initialize the sandbox VM.
2. Print the list of active running processes: \`ps -list\`.
3. Locate the malicious path masquerading as a system utility: PID \`1900\` running \`svchost.exe\` from \`C:\\Users\\Public\\Temp\\\`.
4. Quarantine this thread using: \`quarantine-pid 1900\`.
5. Extract the file signature and secure the flag.
`
  },
  "threat-hunter": {
    courseId: "threat-hunter",
    title: "Threat Hunter Guidebook",
    prerequisites: ["YARA & Sigma Rules", "Cryptographic Hashes", "Malware Signatures"],
    markdown: `# 🏹 Threat Hunting: Proactive Indicator Correlation

## 1. Introduction to the Course
Go beyond reactive alerts. Threat hunting is a proactive practice that assumes systems have already been compromised. In this course, you will learn how to search system logs, compile threat intelligence indicators, and write detection rules to uncover hidden persistent threats before automated systems raise flags.

## 2. Beginner Stuff (Foundational Setup)
Understanding digital indicators of compromise (IoCs) is key:
* **Cryptographic Hashes:** Unique mathematical fingerprints representing specific file files (e.g., MD5 or SHA256 hashes).
* **Workstations:** User devices on a corporate network that host various file executions.

## 3. Explanation of Core Concepts
* **Ingress Tool Transfer (MITRE T1105):** The phase where attackers download unauthorized binaries (backdoors, utilities) onto target machines.
* **Threat Intelligence Matching:** Cross-referencing files found in system folders against known threat databases to identify malicious hashes.
* **Sigma Rules:** A standardized format for writing detection rules for SIEM pipelines, enabling rapid sharing of threat detection queries.

## 4. Interrelating Starting Topics: From Letters to Books
Threat discovery builds systematically:
* **Letters (Hashes):** Raw alphanumeric hash characters representing file states.
* **Words (Indicators):** Pairing specific hashes with verified malware profiles.
* **Sentences (File Audits):** Scanning system directories to search for match patterns.
* **Paragraphs (Detection Rules):** Finding a compromise and deploying defensive signatures to prevent future lateral actions.
* **Books (Proactive Hunting Pipeline):** Building continuous, automated threat loops—integrating real-time telemetry, correlating file signatures, and authoring unified Sigma rules to secure an organization against advanced persistent threats (APTs).

## 5. The Final Guide (Standard Operating Procedure)
1. **Audit**: Scan workstation partitions for hidden file hashes.
2. **Correlate**: Cross-reference matching signatures with global threat intelligence logs.
3. **Neutralize**: Remove the identified malicious binaries from the system.
4. **Deploy**: Build and distribute a defense-in-depth detection filter to catch subsequent attempts.

## 6. The Quiz Preparatory Guide
Focus on these core threat-hunting concepts for your review:
* Recognize the "Pyramid of Pain"—why hash signatures and IP addresses are easy for attackers to change, whereas techniques and behaviors are difficult.
* Understand the purpose of standardized SIEM languages like Sigma.

## 7. The Final CTF Test on the VM
To secure your threat-hunting certification flag:
1. Launch the lab sandbox workspace.
2. Scan active workstations using the hashing tool: \`file-hash-audit\`.
3. Locate the backdoor file: \`C:\\Windows\\Temp\\backdoor.exe\` with hash signature \`5e912abcf83204e19030cf8191fe\`.
4. Deploy the unified detection filter rule using: \`deploy-rule\`.
5. Capture your validation flag printed in the terminal response.
`
  },
  "reverse-engineer": {
    courseId: "reverse-engineer",
    title: "Reverse Engineering Guidebook",
    prerequisites: ["Assembly Language", "Decompilers", "CPU Registers"],
    markdown: `# ⚙️ Reverse Engineering: Assembly Dissection

## 1. Introduction to the Course
Deconstruct binary code. Reverse engineering reveals the inner workings of closed-source software and compiled executables. This course introduces you to static binary analysis, x86 assembly instructions, processor registers, and program flow control.

## 2. Beginner Stuff (Foundational Setup)
Understanding how CPUs process logic is foundational:
* **Registers:** Small, fast memory locations inside the CPU (e.g., \`EAX\`, \`EBX\`).
* **Assembly Language:** A low-level programming language that maps directly to machine code instructions.

## 3. Explanation of Core Concepts
* **Decompilation:** Translating compiled machine code back into human-readable assembly instructions.
* **Hardcoded Credentials (MITRE T1027):** The insecure practice of storing credentials, access keys, or licenses inside source code, leaving them vulnerable to static inspection.
* **Control Flow Loops:** Program branches that compare register values and jump depending on the result (e.g., matching input against a secret validation key).

## 4. Interrelating Starting Topics: From Letters to Books
Binary deconstruction follows logical paths:
* **Letters (CPU Instructions):** Isolated operational codes (opcodes) such as \`MOV\` or \`CMP\`.
* **Words (Register States):** Moving specific variables and hexadecimal strings into CPU registers.
* **Sentences (Comparison Blocks):** Sequences of instructions where inputs are checked against hardcoded keys (e.g., \`CMP EAX, 'KEY'\` followed by a conditional jump).
* **Paragraphs (Passphrase Extraction):** Disassembling program structures to locate hardcoded decryption keys and verifying them using testing parameters (\`test-key KEY\`).
* **Books (Advanced Reverse Engineering):** Unpacking packed executables, bypassing anti-debugging hooks, and analyzing compiled malware to map threat patterns.

## 5. The Final Guide (Standard Operating Procedure)
1. **Disassemble**: Load the target binary into the analysis tool.
2. **Trace**: Search for program comparisons using key string parameters.
3. **Extract**: Find hardcoded comparative values verified inside loops.
4. **Test**: Submit the extracted string key to bypass binary authentication guards.

## 6. The Quiz Preparatory Guide
Focus on these assembly basics for your assessment:
* Understand the specific role of the \`CMP\` (compare) instruction in x86 architectures.
* Grasp why string obfuscation is critical to defend binaries against reverse engineering.

## 7. The Final CTF Test on the VM
To secure your reverse engineering flag:
1. Boot up the CPU assembly simulator.
2. Run the program decompiler: \`decompile-main\`.
3. Locate the instruction comparison register check:
   \`0x00401005: CMP EAX, 'ARCHX_DECOMP_KEY_99'\`
4. Test the extracted password key string: \`test-key ARCHX_DECOMP_KEY_99\`.
5. Read your decrypted completion flag in the response.
`
  },
  "cloud-security": {
    courseId: "cloud-security",
    title: "Cloud Infrastructure Security Guidebook",
    prerequisites: ["Cloud Bucket Policies", "IAM Entities", "Anonymous Access Policies"],
    markdown: `# ☁️ Cloud Security: IAM & S3 Hardening

## 1. Introduction to the Course
Welcome to cloud infrastructure defense. This course focuses on securing modern multi-tenant cloud environments, virtual storage nodes, and microservice identities. You will learn how to identify exposed data stores, audit IAM permissions, and apply the principle of Least Privilege.

## 2. Beginner Stuff (Foundational Setup)
Understanding cloud architectures begins with data objects:
* **Cloud Buckets:** Virtual storage containers utilized to store files in the cloud (e.g., AWS S3 buckets).
* **Permissions:** Access lists determining who is authorized to read or write specific object groups.

## 3. Explanation of Core Concepts
* **Unsecured Cloud Storage (MITRE T1530):** The high-risk practice of setting cloud storage buckets to permit unauthenticated public access, exposing corporate databases to scraping bots.
* **Identity and Access Management (IAM):** The security framework that manages digital identities and controls access privileges across cloud applications.
* **Least Privilege:** Enforcing strict policies ensuring users and systems only possess the minimum permissions necessary to complete required operations.

## 4. Interrelating Starting Topics: From Letters to Books
Cloud architecture security scales progressively:
* **Letters (Resource Identifiers):** Unique bucket names and static asset URIs.
* **Words (Access Policies):** Permission parameters containing statements like \`Effect: Allow, Principal: *\` (open to all).
* **Sentences (Exposure Alerts):** A warning state indicating sensitive spreadsheets are hosted inside public-facing buckets.
* **Paragraphs (IAM Policy Correction):** Scanning public buckets (\`cloud-bucket-audit\`) and applying strict private bucket configurations (\`secure-bucket-iam <bucket_name>\`).
* **Books (Cloud Compliance Auditing):** Deploying complete corporate cloud defense stacks—implementing automated policy compliance tracking, default-deny bucket creation rules, and continuous credential monitoring pipelines.

## 5. The Final Guide (Standard Operating Procedure)
1. **Audit**: Run policy scans across active cloud storage buckets.
2. **Analyze**: Identify buckets that grant read access to anonymous internet visitors.
3. **Restrict**: Update resource access structures to enforce Private Owner status.
4. **Validate**: Confirm S3 bucket endpoints require cryptographically signed credentials.

## 6. The Quiz Preparatory Guide
Focus on these key cloud security principles during review:
* Understand the acronym IAM (Identity and Access Management) and its purpose.
* Garcp why loose bucket permissions occur and how to enforce private resource scopes.

## 7. The Final CTF Test on the VM
To secure your cloud compliance flag:
1. Launch the cloud infrastructure terminal.
2. Run the audit command: \`cloud-bucket-audit\`.
3. Locate the public bucket containing sensitive files: \`archx-finance-records-01\`.
4. Secure this container with: \`secure-bucket-iam archx-finance-records-01\`.
5. Capture your target verification flag.
`
  },
  "identity-access": {
    courseId: "identity-access",
    title: "Identity Architecture: OAuth & JWT Verification",
    prerequisites: ["JSON Web Tokens (JWT)", "Cryptographic Signatures", "None-Algorithm Vulnerability"],
    markdown: `# 🔑 Identity Architecture: OAuth & JWT Verification

## 1. Introduction to the Course
Welcome to modern authentication defense. Single Sign-On (SSO) systems, federation networks, and REST APIs rely heavily on cryptographic token-based authorization. This course covers web token anatomy, signature validation, and defensive API configuration.

## 2. Beginner Stuff (Foundational Setup)
Before analyzing tokens, you must understand state tracking:
* **JSON Web Tokens (JWTs):** Compact, URL-safe structures utilized for sharing claims between client browsers and server backends.
* **Web Header Parameters:** Metadata declared at the top of a token specifying the authentication properties.

## 3. Explanation of Core Concepts
* **JWT structure:** Composed of three distinct parts separated by periods (\`.\`): Header (specifies the algorithm), Payload (user profiles and scopes), and Signature (verifies integrity).
* **JWT 'none' Algorithm Vulnerability (MITRE T1556):** A legacy testing algorithm that instructs validators to trust the token payload without checking any signature block. Attackers can leverage this to forge admin credentials.
* **Signature Verification:** Enforcing strict cryptographic checks using secure algorithms (e.g., \`HS256\`) to reject tampered user claims.

## 4. Interrelating Starting Topics: From Letters to Books
Authentication security scales from basic code segments:
* **Letters (JWT Delimiters):** Alphanumeric base64 strings separated by structural dots (\`.\`).
* **Words (Claims and Headers):** Decoded JSON variables detailing user parameters (e.g., \`{"user": "recruit", "is_admin": false}\`).
* **Sentences (Insecure Submissions):** Authentication requests where the client token claims the signature algorithm is \`none\`.
* **Paragraphs (Middleware Mitigation):** Scanning the authorization headers (\`view-token\`) and configuring the application API rules to reject unverified tokens (\`reconfigure-jwt-verify\`).
* **Books (Enterprise IAM Framework):** Implementing modern identity architecture—federated authentication, secure OAuth authorization, dynamic token expiration, and cryptographically sound HMAC keys.

## 5. The Final Guide (Standard Operating Procedure)
1. **Decode**: Extract and read incoming web authorization header tokens.
2. **Audit**: Inspect the header properties for insecure signature algorithms like \`none\`.
3. **Patch**: Reconfigure API gate validators to ignore and drop unsigned tokens.
4. **Enforce**: Implement cryptographic signing protocols (like \`HS256\`) across endpoints.

## 6. The Quiz Preparatory Guide
Focus on these key token-based security parameters:
* Understand why the JWT \`none\` algorithm bypass constitutes a catastrophic system failure.
* Master the structural anatomy of JSON Web Tokens.

## 7. The Final CTF Test on the VM
To secure your identity validation flag:
1. Boot up the JWT validation console.
2. Decode the incoming server session token using: \`view-token\`.
3. Note the security warning highlighting an active \`none\` algorithm.
4. Patch the server validation middleware: \`reconfigure-jwt-verify\`.
5. Grab the authorization completion flag.
`
  },
  "incident-responder": {
    courseId: "incident-responder",
    title: "Incident Response: Active Ransomware Containment",
    prerequisites: ["Ransomware Indicators", "Network Host Quarantine", "Disk Performance Metrics"],
    markdown: `# 🚨 Incident Response: Active Ransomware Containment

## 1. Introduction to the Course
Mitigate active cyberattacks. Incident responders operate in high-pressure environments to contain threats, minimize downtime, and coordinate recovery. This course trains you to handle active ransomware, locate compromised hosts, and deploy network isolation playbooks.

## 2. Beginner Stuff (Foundational Setup)
Before deploying containment plans, understand system baselines:
* **Syslog Alerts:** Operational event monitors that log anomalous processes and file manipulations.
* **Host IDs:** Unique identifiers utilized to target specific machines in a local subnet.

## 3. Explanation of Core Concepts
* **Ransomware Encryption (MITRE T1486):** Malicious software that rapidly encrypts user files, renames them with custom extensions (e.g., \`.locked\`), and drops ransom instructions.
* **Disk Write Spikes:** High-frequency file renaming activities that create massive, abnormal spikes in storage I/O performance.
* **VLAN / Port Isolation:** Network-level quarantine that drops all incoming and outgoing connections of a compromised host, stopping malware spread.

## 4. Interrelating Starting Topics: From Letters to Books
Threat mitigation follows systematic phases:
* **Letters (File Extensions):** Single corrupted files changing status (e.g., \`finance.xlsx.locked\`).
* **Words (Telemetry logs):** Log entries tracking rapid write operations from a specific device.
* **Sentences (Compromise alerts):** SIEM alerts warning of rapid file modifications (e.g., \`412 files/sec\`) originating from a single host.
* **Paragraphs (Active Isolation):** Running diagnostic activity monitors (\`monitor-file-activity\`) and deploying host isolation (\`isolate-host db-client-99\`).
* **Books (Unified Disaster Mitigation):** Designing full incident containment—deploying zero-trust endpoint protection, enforcing routine air-gapped backups, mapping attacker indicators, and conducting forensic autopsies to recover services.

## 5. The Final Guide (Standard Operating Procedure)
1. **Monitor**: Watch active syslog activity and file system modification logs.
2. **Isolate**: Identify infected hosts and immediately apply network quarantine blocks.
3. **Preserve**: Keep the host machine powered on to retain RAM states for decryption keys.
4. **Remediate**: Eliminate malware threads, audit network shares, and restore files from clean backups.

## 6. The Quiz Preparatory Guide
Focus on these incident containment practices for your upcoming test:
* Understand why network-level quarantine is preferred over immediately powering down a machine (to preserve volatile encryption keys inside RAM).
* Grasp the indicator signatures of active ransomware.

## 7. The Final CTF Test on the VM
To secure your incident containment flag:
1. Boot the incident responder console.
2. Analyze active system write activities: \`monitor-file-activity\`.
3. Locate the compromised server: \`db-client-99\` showing rapid \`.locked\` alterations.
4. Quarantine this host immediately using: \`isolate-host db-client-99\`.
5. Capture your containment completion flag.
`
  },
  "social-defender": {
    courseId: "social-defender",
    title: "Social Engineering: Email Header Spoofing Audits",
    prerequisites: ["Email Protocols", "Header Parsing", "Phishing Indicators"],
    markdown: `# ✉️ Social Engineering: Email Header Spoofing Audits

## 1. Introduction to the Course
Welcome to social engineering defense. Attackers frequently bypass digital walls by exploiting human trust. This course details the technical mechanics of email spoofing, phishing header analysis, and domain authentication protocols (SPF, DKIM, and DMARC).

## 2. Beginner Stuff (Foundational Setup)
Understanding the structure of electronic mail is critical:
* **Email Headers:** Metadata blocks containing the routing path, sending server IP, and security validation scores.
* **Phishing:** Deceptive messaging designed to steal credentials or download payloads by masquerading as a trusted brand.

## 3. Explanation of Core Concepts
* **Email Header Spoofing (MITRE T1566):** Forging the "From" display name inside email applications to deceive users about the authentic source.
* **SPF (Sender Policy Framework):** A DNS record specifying which IP addresses are authorized to send email messages on behalf of a domain.
* **DKIM (DomainKeys Identified Mail):** A public-key cryptographic signing standard that verifies email integrity and authenticates the sending domain.

## 4. Interrelating Starting Topics: From Letters to Books
Header auditing develops sequentially:
* **Letters (IP Identifiers):** Alphanumeric characters representing the true sending mail transfer agent (MTA) IP (e.g., \`185.110.12.5\`).
* **Words (Protocol Checks):** Verification tags in email headers (e.g., \`SPF: FAIL\` or \`DKIM: FAIL\`).
* **Sentences (Routing Audits):** Reading raw routing logs to discover that an email from a trusted brand originates from an unauthorized foreign server.
* **Paragraphs (Quarantine Action):** Dumping mail envelope logs (\`view-headers\`) and blacklisting the offending domain (\`quarantine-domain attacker-server.net\`).
* **Books (Unified Email Defense):** Implementing complete email security protocols—configuring strict DMARC rules, deploying automated machine learning mail filters, and conducting routine anti-phishing training.

## 5. The Final Guide (Standard Operating Procedure)
1. **Retrieve**: Inspect raw envelope metadata and email headers.
2. **Verify**: Check SPF, DKIM, and DMARC validation tags.
3. **Trace**: Map incoming hops back to the authentic originating server IP.
4. **Quarantine**: Block the unauthorized domains at the mail gateway level.

## 6. The Quiz Preparatory Guide
Focus on these email authentication mechanisms for your test:
* Understand how DKIM uses public-key cryptography to verify sender integrity.
* Differentiate between SPF and DKIM roles.

## 7. The Final CTF Test on the VM
To locate and secure your social engineering flag:
1. Boot up the mail inspector dashboard.
2. Read the raw routing envelopes: \`view-headers\`.
3. Locate the rogue domain bypass: \`attacker-server.net\` which failed SPF validation.
4. Quarantine the malicious sending domain using: \`quarantine-domain attacker-server.net\`.
5. Record your completed training flag.
`
  },
  "api-security": {
    courseId: "api-security",
    title: "API Security: Broken Object Authorization",
    prerequisites: ["REST API Endpoints", "HTTP Bearer Tokens", "Object Parameters"],
    markdown: `# 🔑 API Security: Broken Object Authorization

## 1. Introduction to the Course
Welcome to API Security. Modern application architectures rely on stateless APIs for backend services. This course teaches you how to identify Broken Object Level Authorization (BOLA), understand parameter fuzzing, and secure server-side validations.

## 2. Beginner Stuff (Foundational Setup)
Understanding RESTful patterns is essential:
* **Endpoints:** Web URIs designed to manipulate resources (e.g., \`/api/accounts/101\`).
* **Session Headers:** Token credentials (like Bearer tokens) certifying client session identities.

## 3. Explanation of Core Concepts
* **Broken Object Level Authorization (BOLA / IDOR):** Occurs when the application exposes references to objects without checking if the active session possesses ownership rights for those items.
* **Sequential IDs:** Using simple incremental integers (e.g., account ID 101, 102, 103) which are trivial for attackers to guess and scrape.
* **Object Ownership Enforcement:** Ensuring every single server-side controller validates that the user's token has access permissions matching the requested resource ID.

## 4. Interrelating Starting Topics: From Letters to Books
API security grows modularly:
* **Letters (IDs):** Sequence digits (e.g., account \`102\`).
* **Words (Requests):** Structured HTTP calls (e.g., \`GET /api/v1/accounts/102\`).
* **Sentences (Fuzzing):** Automating requests over a range of IDs to identify unprotected endpoints.
* **Paragraphs (Validation Filters):** Intercepting API routes and patching them to compare context-owners (\`patch-bola\`).
* **Books (Unified API Defense):** Standardizing access controls with OAuth scopes, UUIDs instead of sequentials, and API Gateway rate limiters.

## 5. The Final Guide (Standard Operating Procedure)
1. **Audit**: Enumerate active API routes and map their comparative access patterns.
2. **Inspect**: Check if simple parameter alterations let you view other users' records.
3. **Validate**: Deploy server-side filters verifying user-to-object mappings on every request.
4. **Encrypt/Mask**: Transition sequential integers to random non-predictable UUID strings.

## 6. The Quiz Preparatory Guide
Keep these critical API audit items in mind:
* Understand why BOLA is the most common vulnerability on the OWASP API Security Top 10.
* Realize why client-side security is never reliable for authentication blocks.

## 7. The Final CTF Test on the VM
To secure your API auditing flag:
1. Fire up the API scan utility.
2. Execute endpoint mapping using \`scan-api\`.
3. Locate the vulnerable sequential endpoint, and fuzz parameter records using \`fuzz-params\`.
4. Apply the security context validation patch: \`patch-bola\`.
5. Capture your completion flag.
`
  },
  "k8s-security": {
    courseId: "k8s-security",
    title: "Kubernetes Security: Pod Escape and RBAC Auditing",
    prerequisites: ["Docker Container Isolation", "Kubernetes Pod Definitions", "Basic Yaml Files"],
    markdown: `# ☸️ Kubernetes Security: Pod Escape and RBAC Auditing

## 1. Introduction to the Course
Dive into microservices security. Kubernetes is the leading container orchestration engine, but default settings often leave pods vulnerable. This course details container escape vectors, host filesystem mounts, and Role-Based Access Control (RBAC) privileges.

## 2. Beginner Stuff (Foundational Setup)
Get familiar with basic cluster orchestration:
* **Pods:** The smallest deployable computing units in Kubernetes hosting active containers.
* **Namespaces:** Logical partition boundaries that isolate workloads within a single cluster.

## 3. Explanation of Core Concepts
* **Container Escape (MITRE T1611):** Gaining unauthorized shell control over the host node from inside a container.
* **Privileged Containers:** Containers granted direct access to host system devices and capabilities, completely bypassing separation bounds.
* **HostPath Mounts:** Direct mappings of host directories into a pod container, which can lead to host modification if misconfigured.

## 4. Interrelating Starting Topics: From Letters to Books
Container security scales systematically:
* **Letters (Pod Specs):** Configuration properties declared inside pod manifests.
* **Words (Mount Points):** Mounting raw host sockets (e.g., \`/var/run/docker.sock\`).
* **Sentences (Breakout Chains):** Exploiting container daemon keys to rewrite system processes on the host.
* **Paragraphs (Pod Security Enforcement):** Deploying policies to restrict root and mount capabilities (\`patch-k8s\`).
* **Books (Enterprise Cluster Defense):** Establishing strict NetworkPolicies, locking down default ServiceAccount tokens, and isolating nodes behind secure virtual boundaries.

## 5. The Final Guide (Standard Operating Procedure)
1. **Enumerate**: Inspect all active pod declarations and namespace bindings.
2. **Assess**: Flag any pods operating with privileged status or mounting host paths.
3. **Restrict**: Remove unneeded privileges and block hostPath volumes.
4. **Audit**: Restrict RBAC ClusterRoles to enforce Least Privilege.

## 6. The Quiz Preparatory Guide
Review these essential Kubernetes defense rules:
* Explain why hostPath mounts can lead to host node escapes.
* Recognize the danger of sharing the host PID namespace with container specs.

## 7. The Final CTF Test on the VM
To secure your Kubernetes security flag:
1. Boot the cluster audit environment.
2. Run \`get-pods\` to list active workloads and discover the privileged container.
3. Check excessive RBAC permissions using \`audit-rbac\`.
4. Deploy pod security standards using: \`patch-k8s\`.
5. Capture your cluster security flag.
`
  },
  "active-directory": {
    courseId: "active-directory",
    title: "Active Directory: Kerberoasting Mitigation",
    prerequisites: ["Active Directory Service Accounts", "Kerberos Protocol", "Password Ciphers"],
    markdown: `# 🔑 Active Directory: Kerberoasting Mitigation

## 1. Introduction to the Course
Master internal enterprise network defense. Active Directory (AD) controls authentication across most corporate networks. This course explains how attackers exploit Kerberos tickets to extract service passwords offline and how to secure these service structures.

## 2. Beginner Stuff (Foundational Setup)
Understand Windows domain basics:
* **Service Principal Names (SPNs):** Identifiers that associate a service instance with a Windows domain login account.
* **KDC (Key Distribution Center):** The central domain service that issues authenticated tickets.

## 3. Explanation of Core Concepts
* **Kerberoasting (MITRE T1558.003):** An attack where a domain user requests a Kerberos service ticket (TGS) for an SPN, then extracts and cracks the ticket offline to steal the service account password.
* **RC4 Encryption:** An older, cryptographically weak cipher that makes offline hash cracking extremely fast and easy.
* **gMSAs (Group Managed Service Accounts):** Special domain accounts with automatically managed, highly complex passwords that completely eliminate cracking threats.

## 4. Interrelating Starting Topics: From Letters to Books
Active Directory hardening follows progressive tracks:
* **Letters (SPN accounts):** Registered services in a domain tree.
* **Words (TGS tickets):** Encrypted tickets returned to any domain request.
* **Sentences (Offline Cracking):** Using cracking rigs (like Hashcat) to extract raw keys from RC4 tickets.
* **Paragraphs (Service Migration):** Upgrading accounts to gMSAs and banning legacy ciphers (\`migrate-gmsa\`).
* **Books (Domain Hardening):** Implementing Tiered Administration models, forcing AES-256 ciphers, and monitoring Active Directory Event Log 4769 for anomalies.

## 5. The Final Guide (Standard Operating Procedure)
1. **Audit**: List all active SPN registers and verify their host accounts.
2. **Detect**: Check for abnormal service ticket requests using deprecated ciphers.
3. **Hard**: Migrate service logons to gMSAs with automatic, long passwords.
4. **Monitor**: Audit domain access logs for frequent, bulk ticket requests.

## 6. The Quiz Preparatory Guide
Focus on these Active Directory parameters:
* Understand why Kerberoasting doesn't trigger account lockout alerts.
* Compare gMSAs to standard domain user accounts.

## 7. The Final CTF Test on the VM
To secure your Domain Security flag:
1. Launch the Domain Controller terminal.
2. Audit active Service Principal Names with \`query-spn\`.
3. Capture Kerberos request telemetry using \`sniff-kerberos\`.
4. Migrate the vulnerable service accounts to secure gMSAs: \`migrate-gmsa\`.
5. Secure your active directory flag.
`
  },
  "scada-security": {
    courseId: "scada-security",
    title: "SCADA & ICS: Industrial Control Network Defense",
    prerequisites: ["Modbus TCP Protocols", "Purdue Model Networks", "Deep Packet Inspection"],
    markdown: `# ⚡ SCADA & ICS: Industrial Control Network Defense

## 1. Introduction to the Course
Secure critical real-world infrastructure. Operational Technology (OT) manages physical pipelines, power stations, and manufacturing grids. This course details industrial network protocols, Purdue segmentation, and defense-in-depth strategies.

## 2. Beginner Stuff (Foundational Setup)
Understanding how physics connects to software is key:
* **PLCs (Programmable Logic Controllers):** Small industrial microprocessors that interact with sensors and control actuators.
* **Modbus TCP:** A legacy, unauthenticated industrial communication protocol used to read/write hardware registers.

## 3. Explanation of Core Concepts
* **Unauthenticated Registers (MITRE T0836):** Since Modbus has no built-in handshake authentication, anyone who can reach a PLC can write values to open coils, manipulating hardware.
* **The Purdue Model:** A six-level logical design framework that segregates business enterprise networks from core physical field machinery.
* **Deep Packet Inspection (DPI):** Industrial firewalls that analyze Modbus function codes, dropping write commands from unapproved subnets.

## 4. Interrelating Starting Topics: From Letters to Books
OT system defense expands strategically:
* **Letters (Registers):** Discrete memory coils managing physical devices.
* **Words (Commands):** Modbus frames (e.g., unit write-coil command).
* **Sentences (Replay Actions):** Injecting fake telemetry signals to mislead operators or safety tools.
* **Paragraphs (DPI Firewall Rules):** Configuring firewalls to block unauthorized write registers (\`apply-dpi-firewall\`).
* **Books (Enterprise SCADA Security):** Isolating industrial subnets via DMZs, locking down physical USB interfaces, and using encrypted protocols like OPC UA.

## 5. The Final Guide (Standard Operating Procedure)
1. **Identify**: Map the entire OT asset structure and protocol types.
2. **Segment**: Group devices logically based on Purdue Level definitions.
3. **Inspect**: Deploy stateful DPI firewalls to block unauthenticated command execution.
4. **Harden**: Encrypt field communications where supported by newer hardware.

## 6. The Quiz Preparatory Guide
Prepare for the SCADA quiz with these tips:
* Know why scanning active industrial grids with normal vulnerability tools can crash legacy equipment.
* Define the role of the Purdue Model IDMZ.

## 7. The Final CTF Test on the VM
To capture your SCADA engineering flag:
1. Open the industrial security console.
2. Run \`sniff-modbus\` to log unauthenticated coil commands.
3. Review the network layout using \`audit-purdue\`.
4. Establish the Purdue IDMZ and activate DPI filters: \`apply-dpi-firewall\`.
5. Secure the SCADA system flag.
`
  },
  "mobile-security": {
    courseId: "mobile-security",
    title: "Mobile Pentesting: SSL Pinning and Local Storage Audit",
    prerequisites: ["Android/iOS Sandbox Files", "SQLite Database Queries", "SSL Certificate Interception"],
    markdown: `# 📱 Mobile Pentesting: SSL Pinning and Local Storage Audit

## 1. Introduction to the Course
Step into mobile auditing. Android and iOS applications process huge volumes of confidential data. This course teaches you how to audit private mobile sandboxes, find cleartext database leaks, and bypass SSL certificate pinning for testing.

## 2. Beginner Stuff (Foundational Setup)
Get to know the basics of mobile filesystems:
* **Sandbox Directory:** Isolated, app-specific paths where other apps on the device cannot read files.
* **SQLite Database:** A small, self-contained relational database file commonly used inside mobile apps.

## 3. Explanation of Core Concepts
* **Sandbox Leaks (MITRE T1401):** Occur when apps write sensitive user sessions, credentials, or PII into private folders in cleartext, leaving them vulnerable on rooted devices.
* **SSL Pinning:** Hardcoding the server's certificate signature into the app code, preventing the client from trusting custom intercepting proxy certificates.
* **SQLCipher:** Adding AES-256 cryptographic encryption to local SQLite database files, protecting all cached tables.

## 4. Interrelating Starting Topics: From Letters to Books
Mobile binary analysis develops incrementally:
* **Letters (App Files):** Local preferences, cache folders, and files.
* **Words (Database files):** Accessing local databases in private folders.
* **Sentences (Cleartext Leaks):** Reading plain text session keys inside unprotected SQL cache.
* **Paragraphs (Storage Hardening):** Deploying database encryption wrappers (\`harden-storage\`).
* **Books (Enterprise Mobile Lifecycle):** Restricting debugging logs, wrapping apps in SSL pinning, storing keys in hardware keystores (Secure Enclave), and running static/dynamic binary assessments.

## 5. The Final Guide (Standard Operating Procedure)
1. **Analyze**: Explore sandbox directories and identify stored settings files.
2. **Dump**: Inspect SQL database files for unencrypted access tokens.
3. **Hard**: Enforce SQLCipher database encryption bound to the system keystore.
4. **Purge**: Ensure sensitive diagnostic logs are automatically removed from release builds.

## 6. The Quiz Preparatory Guide
Key mobile security concepts to remember:
* Explain why storing session tokens in cleartext XML files is insecure.
* Understand where secure, hardware-isolated encryption keys should be generated.

## 7. The Final CTF Test on the VM
To secure your mobile auditing flag:
1. Start the mobile forensics console.
2. Check the private app path with \`view-sandbox\`.
3. Dump the cleartext relational database with \`dump-sqlite\`.
4. Deploy local SQLCipher database encryption: \`harden-storage\`.
5. Capture your mobile sandbox flag.
`
  }
};
