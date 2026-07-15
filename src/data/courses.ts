import { SOC_ANALYST_LESSONS, SOC_ANALYST_META } from "./guidebooks/soc-analyst";
import { META as PENTEST_META, LESSONS as PENTEST_LESSONS } from "./guidebooks/pentest";
import { META as NETWORK_SECURITY_META, LESSONS as NETWORK_SECURITY_LESSONS } from "./guidebooks/network-security";
import { META as DIGITAL_FORENSICS_META, LESSONS as DIGITAL_FORENSICS_LESSONS } from "./guidebooks/digital-forensics";
import { META as DEVSECOPS_META, LESSONS as DEVSECOPS_LESSONS } from "./guidebooks/devsecops";
import { META as THREAT_HUNTER_META, LESSONS as THREAT_HUNTER_LESSONS } from "./guidebooks/threat-hunter";
import { META as REVERSE_ENGINEER_META, LESSONS as REVERSE_ENGINEER_LESSONS } from "./guidebooks/reverse-engineer";
import { META as CLOUD_SECURITY_META, LESSONS as CLOUD_SECURITY_LESSONS } from "./guidebooks/cloud-security";
import { META as IDENTITY_ACCESS_META, LESSONS as IDENTITY_ACCESS_LESSONS } from "./guidebooks/identity-access";
import { META as INCIDENT_RESPONDER_META, LESSONS as INCIDENT_RESPONDER_LESSONS } from "./guidebooks/incident-responder";
import { META as SOCIAL_DEFENDER_META, LESSONS as SOCIAL_DEFENDER_LESSONS } from "./guidebooks/social-defender";
import { META as API_SECURITY_META, LESSONS as API_SECURITY_LESSONS } from "./guidebooks/api-security";
import { META as K8S_SECURITY_META, LESSONS as K8S_SECURITY_LESSONS } from "./guidebooks/k8s-security";
import { META as ACTIVE_DIRECTORY_META, LESSONS as ACTIVE_DIRECTORY_LESSONS } from "./guidebooks/active-directory";
import { META as SCADA_SECURITY_META, LESSONS as SCADA_SECURITY_LESSONS } from "./guidebooks/scada-security";
import { META as MOBILE_SECURITY_META, LESSONS as MOBILE_SECURITY_LESSONS } from "./guidebooks/mobile-security";
import { SANDBOX as PENTEST_SANDBOX } from "./sandboxes/pentest";
import { SANDBOX as DIGITAL_FORENSICS_SANDBOX } from "./sandboxes/digital-forensics";
import { SANDBOX as THREAT_HUNTER_SANDBOX } from "./sandboxes/threat-hunter";
import { SANDBOX as INCIDENT_RESPONDER_SANDBOX } from "./sandboxes/incident-responder";
import { SANDBOX as DEVSECOPS_SANDBOX } from "./sandboxes/devsecops";
import { SANDBOX as REVERSE_ENGINEER_SANDBOX } from "./sandboxes/reverse-engineer";
import { SANDBOX as CLOUD_SECURITY_SANDBOX } from "./sandboxes/cloud-security";
import { SANDBOX as IDENTITY_ACCESS_SANDBOX } from "./sandboxes/identity-access";
import { SANDBOX as SOCIAL_DEFENDER_SANDBOX } from "./sandboxes/social-defender";
import { SANDBOX as API_SECURITY_SANDBOX } from "./sandboxes/api-security";
import { SANDBOX as K8S_SECURITY_SANDBOX } from "./sandboxes/k8s-security";
import { SANDBOX as ACTIVE_DIRECTORY_SANDBOX } from "./sandboxes/active-directory";
import { SANDBOX as SCADA_SECURITY_SANDBOX } from "./sandboxes/scada-security";
import { SANDBOX as MOBILE_SECURITY_SANDBOX } from "./sandboxes/mobile-security";

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface Course {
  id: string;
  title: string;
  shortDesc: string;
  fullDesc: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  estimatedTime: string;
  mitreCoverage: { tactic: string; percentage: number }[];
  sopObjective: string;
  sopAnalogy: string;
  sopSteps: string[];
  interviewTips: { question: string; answer: string }[];
  loopholes: string[];
  // ── Deep-guidebook extensions (optional; legacy courses omit these) ──
  prerequisites?: string[];
  learningOutcomes?: string[];
  mustKnow?: string[];                       // must-know topics for the domain
  commonGaps?: string[];                     // what learners typically under-study / miss
  prosCons?: { pros: string[]; cons: string[] };
  careerNotes?: string;                      // roles, market relevance, salary band
  lessons: {
    title: string;
    summary?: string;                        // one-line lesson abstract (deep guidebooks)
    content: string; // HTML-formatted guide book
    quizzes: QuizQuestion[];
  }[];
  simulation: {
    terminalWelcome: string;
    objective?: string;                       // shown by the `objective` command
    files?: { [name: string]: string };       // virtual filesystem for ls/cat/grep; supports {{FLAG}}
    hints?: string[];                          // progressive, partial hints (never the full answer)
    commands: { [cmd: string]: string };       // course-specific commands; output supports {{FLAG}}
    logs: string[];
    alerts: {
      timestamp: string;
      id: string;
      severity: "High" | "Medium" | "Low";
      technique: string;
      message: string;
    }[];
  };
}

export const COURSES: Course[] = [
  {
    id: "soc-analyst",
    title: "Security Operations: SSH Intrusion Auditing",
    shortDesc: "Monitor security information feeds, perform deep log correlation, and isolate brute-force attackers.",
    fullDesc: "Learn how to spot real-world password stuffing and brute force attempts. Correlate authentication logs with network firewall metrics and drop malicious connection pipelines.",
    difficulty: "Beginner",
    estimatedTime: "2 hours",
    mitreCoverage: [
      { tactic: "Initial Access", percentage: 85 },
      { tactic: "Credential Access", percentage: 70 },
      { tactic: "Defense Evasion", percentage: 40 }
    ],
    sopObjective: "Locate repeated remote authentication failures targeting the root user, correlate the offending IP, and apply a drop-rule firewall policy.",
    sopAnalogy: "Like an apartment security guard noticing a stranger testing 5,000 key combinations on a single resident's door. The system records each error, and the guard triggers a building-wide lockout.",
    sopSteps: [
      "Access the live log stream in the alerts panel to detect high-frequency auth failures.",
      "Isolate the attacking IP address using grep tools in the console.",
      "Execute the fire-block utility to drop subsequent SSH connections from that host.",
      "Verify the state of the active firewall blocklist."
    ],
    interviewTips: [
      {
        question: "How do you distinguish a true brute force attack from a user who forgot their password?",
        answer: "A forgotten password produces a small, localised burst of failures, usually from a known internal subnet, followed by a reset or silence. A brute-force attack is rapid and automated, typically spans many usernames, and often rotates source IPs or proxies. The clincher is breadth and rate: dozens of distinct usernames from one source in seconds is never a forgetful human."
      },
      {
        question: "What is log correlation in a SIEM, and why does it beat reading a single log?",
        answer: "Correlation joins events from independent sources — a firewall connection, an auth.log failure, a threat-intel hit — usually on a shared key like the source IP. No single source is conclusive, but joined together they form a high-confidence incident narrative that a single log can never produce."
      },
      {
        question: "What is the difference between DROP and REJECT on a firewall, and which do you use for an active attacker?",
        answer: "REJECT actively tells the source the connection was refused (sends an RST/ICMP), so the attacker instantly knows you're there and can adapt. DROP silently discards the packet — the attacker just sees a timeout, wasting their time and revealing nothing. For an active hostile source you generally DROP."
      },
      {
        question: "Password spraying didn't trip our '5 failures per account' rule. Why, and how would you detect it?",
        answer: "Spraying tries only one or two passwords per account across many accounts, so no single account reaches the threshold. You detect it by aggregating failures per source IP across all accounts (breadth), not per account (volume)."
      },
      {
        question: "You see repeated SSH failures from an IP, then one success. What do you do first?",
        answer: "Treat it as a probable breach. Contain first (DROP the IP / isolate the host), then preserve evidence, confirm what the account accessed, force a credential reset, and begin the incident timeline. Containment before deeper analysis — you stop the bleeding, then investigate."
      }
    ],
    loopholes: [
      "Low-and-slow: attackers throttle attempts to a handful per hour so they never fill a short sliding window, defeating naive threshold rules.",
      "Distributed sourcing: a botnet spreads guesses across thousands of IPs, so no single source looks abnormal — per-IP thresholds see only a few tries each.",
      "Log tampering: an attacker who reaches root can edit or delete auth.log, so logs are evidence, not ground truth — ship them off-host in real time.",
      "Timestomping & timezone confusion: forged or mismatched timestamps corrupt the timeline an analyst reconstructs.",
      "Living-off-the-land after entry: once in, attackers use legitimate tools (ssh, scp, cron) so their actions blend into normal admin activity."
    ],
    ...SOC_ANALYST_META,
    lessons: SOC_ANALYST_LESSONS,
    simulation: {
      terminalWelcome: "ARCH-X SEC-CORE // LIVE SOC ANALYSER TERMINAL\nType 'objective' to see your mission, 'ls' to explore, 'hint' if you get stuck.",
      objective: "An automated attacker is brute-forcing SSH against this host. Investigate the authentication records, identify the single offending source IP that fails repeatedly and then succeeds, and drop it at the firewall. Blocking the CORRECT attacker reveals the CTF flag.",
      hints: [
        "Start by exploring. Run 'ls' to see the files, then read the auth records with 'cat audit_log.json'.",
        "You're looking for one source IP that fails against SEVERAL different usernames in a very short window — that pattern is a brute-force, not a forgetful user. Try 'grep SSH_FAILED audit_log.json'.",
        "One IP fails several times and then logs in SUCCESSFULLY (SSH_SUCCESS). That failure-to-success pivot is your breach. Confirm the threat-intel view with 'status'.",
        "Drop the attacker at the firewall. The command form is:  block-ip <ip>  — substitute the exact IP you identified from the logs.",
      ],
      files: {
        "audit_log.json": "[\n  {\"time\": \"14:02:11\", \"src\": \"198.51.100.12\", \"evt\": \"SSH_FAILED\",  \"user\": \"root\"},\n  {\"time\": \"14:02:12\", \"src\": \"198.51.100.12\", \"evt\": \"SSH_FAILED\",  \"user\": \"admin\"},\n  {\"time\": \"14:02:13\", \"src\": \"203.0.113.9\",  \"evt\": \"SSH_SUCCESS\", \"user\": \"deploy\"},\n  {\"time\": \"14:02:14\", \"src\": \"198.51.100.12\", \"evt\": \"SSH_FAILED\",  \"user\": \"db_admin\"},\n  {\"time\": \"14:02:15\", \"src\": \"198.51.100.12\", \"evt\": \"SSH_SUCCESS\", \"user\": \"root\"}\n]",
        "README.txt": "Production web host web01. Authorized admin logins originate from 203.0.113.9 (deploy user). Investigate anything else.",
      },
      commands: {
        status: "Firewall: ACTIVE\nBlocked: None\nThreat Intelligence: 198.51.100.12 shows 4 failed SSH auths across 3 usernames then 1 success — recommend immediate block.\n203.0.113.9 is a known-good admin jump host (do NOT block).",
        "block-ip 203.0.113.9": "WARNING: 203.0.113.9 is the authorized admin jump host. Blocking it would lock out operations. No flag — re-check the logs for the real attacker.",
        "block-ip 198.51.100.12": "SUCCESS: Drop rule added — 198.51.100.12 packets are now silently discarded (DROP).\nAttacker contained. Flag decrypted:\nFLAG: {{FLAG}}\nSubmit it above to complete the mission.",
      },
      logs: [
        "14:02:11 [WARN] AUTH_FAILURE SSH from 198.51.100.12 user root",
        "14:02:12 [WARN] AUTH_FAILURE SSH from 198.51.100.12 user admin",
        "14:02:14 [WARN] AUTH_FAILURE SSH from 198.51.100.12 user db_admin",
        "14:02:15 [ALERT] AUTH_SUCCESS SSH from 198.51.100.12 user root (High Risk)"
      ],
      alerts: [
        { timestamp: "14:02:11", id: "AL-1", severity: "High", technique: "T1110 (Brute Force)", message: "High volume login failures targeting administrator profiles" }
      ]
    }
  },
  {
    id: "pentest",
    title: "Offensive Security: Vulnerability Pivoting",
    shortDesc: "Probe target systems, exploit insecure service endpoints, and gain local server privileges.",
    fullDesc: "Learn practical offensive methods. Discover how vulnerable background APIs expose deeper infrastructure, and practice running non-destructive proof-of-concept exploits.",
    difficulty: "Intermediate",
    estimatedTime: "3.5 hours",
    mitreCoverage: [
      { tactic: "Reconnaissance", percentage: 90 },
      { tactic: "Initial Access", percentage: 80 },
      { tactic: "Execution", percentage: 60 }
    ],
    sopObjective: "Scan the environment to detect an open port, find a vulnerable API version, and leverage it to retrieve hidden system files.",
    sopAnalogy: "Like an inspector examining all doors on a vault, finding a lock with a manufacturing defect, and pushing a simple wire to slide the deadbolt open.",
    sopSteps: [
      "Run nmap port scanner to identify ports actively listening on the target network.",
      "Inspect version banners to identify outdated, vulnerable software configurations.",
      "Execute the exploit payload to secure an administrative interactive shell.",
      "Extract the sensitive flag token from the local environment."
    ],
    interviewTips: [
      {
        question: "What is the difference between a vulnerability scan and a penetration test?",
        answer: "A vulnerability scan is an automated tool sweep that identifies potential weaknesses. A penetration test actively exploits those vulnerabilities in a controlled manner to verify if they are truly leverageable and can lead to wider system compromise."
      },
      {
        question: "Explain the concept of privilege escalation.",
        answer: "It is the process of taking a low-privilege system handle (like a normal guest account) and leveraging local misconfigurations to upgrade privileges to an administrator or root user."
      }
    ],
    loopholes: [
      "Often, developers leave testing APIs active on custom ports (like 8080 or 8443) which bypass main corporate web application firewalls."
    ],
    lessons: [
      {
        title: "SOP-2 // Scanning & Service Exploitation",
        content: `
          <div class="space-y-4 font-sans text-sm text-zinc-300 leading-relaxed">
            <h3 class="text-zinc-100 font-bold text-base border-b border-zinc-800 pb-2">Ethical Port Discovery</h3>
            <p>
              Nmap is the gold standard of port exploration. It maps out listening TCP sockets by analyzing returning packets (such as SYN-ACK handshakes).
            </p>
            <div class="p-3 bg-zinc-900 border border-zinc-800 rounded font-mono text-xs text-zinc-300">
              $ nmap -sV -T4 10.10.85.110
            </div>
            <p>
              Once a port is verified as open, analyzing its software version banner allows us to look up existing CVE records (Common Vulnerabilities and Exposures) to see if public exploit code exists.
            </p>
          </div>
        `,
        quizzes: [
          {
            id: "pen-q1",
            question: "Which Nmap scan flag instructs the tool to probe services for application version info?",
            options: ["-sS", "-sV", "-O", "-p-"],
            correctAnswerIndex: 1,
            explanation: "The -sV switch is dedicated to probing open ports to determine service protocol and application version numbers."
          }
        ]
      }
    ],
    simulation: {
      terminalWelcome: "ARCH-X Offensive Laboratory Shell v1.2\nType 'help' to review parameters.",
      commands: {
        help: "Commands:\n  nmap -sV 10.10.1.5 - Scan vulnerable server nodes\n  exploit-api --version v1.02 - Run payload against vulnerable REST endpoint\n  cat root_flag.txt - Read the target database flag",
        "nmap -sV 10.10.1.5": "PORT     STATE SERVICE VERSION\n22/tcp   open  ssh     OpenSSH 8.9\n80/tcp   open  http    Nginx 1.22\n8080/tcp open  http    ARCH-X CoreAPI v1.02 (⚠️ Exploitable Vulnerability)",
        "exploit-api --version v1.02": "Connecting to target database API on 10.10.1.5:8080...\nSending buffer length bypass payload...\nAuthentication structure overwritten successfully.\nInteractive root command shell opened.\nFLAG: ARCHX_API_EXPLOIT_99"
      },
      logs: [
        "10:04:10 [PORT_SCAN] TCP socket probes received on ports 22, 80, 8080",
        "10:04:15 [REST_API] Payload buffer overflow attempt on /api/v1.02/auth"
      ],
      alerts: [
        { timestamp: "10:04:15", id: "AL-2", severity: "High", technique: "T1210 (Exploitation of Remote Service)", message: "High severity exploit buffer overflow successfully deployed on port 8080" }
      ]
    }
  },
  {
    id: "devsecops",
    title: "DevSecOps: Continuous Security Pipelines",
    shortDesc: "Secure continuous integration workflows, catch committed system secrets, and prevent supply chain leaks.",
    fullDesc: "Learn how to build automatic guards that scan code bases before they go live, block exposed credentials from leaking online, and audit open-source libraries.",
    difficulty: "Advanced",
    estimatedTime: "4 hours",
    mitreCoverage: [
      { tactic: "Persistence", percentage: 50 },
      { tactic: "Defense Evasion", percentage: 60 },
      { tactic: "Impact", percentage: 50 }
    ],
    sopObjective: "Scan active git commits to find an exposed AWS Access Key ID, write a rule to catch secret strings, and remove it from system history.",
    sopAnalogy: "Like a high-tech metal detector scanning every cargo crate on a conveyor belt, refusing to let boxes move forward if they contain hazardous chemicals.",
    sopSteps: [
      "Execute the git-scanner to search git commit histories for high-entropy secrets.",
      "Pinpoint the file and branch where the cloud password was mistakenly declared.",
      "Use the vault-rotate tool to immediately invalidate the leaked API credentials.",
      "Confirm the pipeline security checks pass successfully."
    ],
    interviewTips: [
      {
        question: "How do you handle a credential that has already been pushed to a public GitHub repository?",
        answer: "First, assume the secret is compromised immediately and rotate it at the provider level. Second, purging git history using tools like BFG Repo-Cleaner or git-filter-repo is necessary, but rotation is the only guaranteed way to secure the endpoint."
      }
    ],
    loopholes: [
      "Developers often add secrets in testing scripts (.test.js) and configure .gitignore incorrectly, allowing them to escape to public registries."
    ],
    lessons: [
      {
        title: "SOP-3 // Secrets Scanning & Git Best Practices",
        content: `
          <div class="space-y-4 font-sans text-sm text-zinc-300 leading-relaxed">
            <h3 class="text-zinc-100 font-bold text-base border-b border-zinc-800 pb-2">The Danger of Committed Secrets</h3>
            <p>
              Once a secret is committed to a git repository, it is stored in the historic snapshot history forever, even if you delete the line in a later commit. Automated scrapers monitor public repositories constantly to harvest active API keys in under 15 seconds.
            </p>
          </div>
        `,
        quizzes: [
          {
            id: "dev-q1",
            question: "Why does removing a secret line in your latest git commit not fully solve a credential leak?",
            options: [
              "Because the file system is cached on the internet",
              "Because git maintains the complete historical timeline of all commits, preserving the old file states",
              "Because hackers can guess the new password",
              "Because git servers do not allow file deletion"
            ],
            correctAnswerIndex: 1,
            explanation: "Git is a version history system. Simply making a new commit that deletes the secret doesn't remove it from old commits. The historical snapshot containing the key remains fully accessible."
          }
        ]
      }
    ],
    simulation: {
      terminalWelcome: "ARCH-X DevSecOps Audit Engine v2.0\nType 'help' to review.",
      commands: {
        help: "Commands:\n  git-scan - Audit all codebase branches for plaintext passwords\n  invalidate-key <key_id> - Revoke cloud credentials\n  deploy-hook - Set up automatic pre-commit scanning",
        "git-scan": "Scanning branches...\n⚠️ ALERT: Commit 8e22f2 contains raw secret!\n  Path: config/production.yaml\n  Value: AWS_ACCESS_KEY_ID = 'AKIA_LEAKED_SECRET_99'",
        "invalidate-key AKIA_LEAKED_SECRET_99": "Contacting provider interface...\nSuccessfully revoked AKIA_LEAKED_SECRET_99.\nFLAG: ARCHX_SECRETS_SEC_OK_42"
      },
      logs: [
        "12:00:10 [PIPELINE] Running SAST code analyzers",
        "12:00:12 [ALERT] Exposed AWS Access Key detected in YAML configurations"
      ],
      alerts: [
        { timestamp: "12:00:12", id: "AL-3", severity: "High", technique: "T1552 (Unsecured Credentials)", message: "High entropy provider tokens exposed directly in git branch" }
      ]
    }
  },
  {
    id: "network-security",
    title: "Network Security: Traffic Analysis & Isolation",
    shortDesc: "Sniff raw network interfaces, dissect suspicious packets, and block anomalous endpoints.",
    fullDesc: "Gain exposure to the wire level. Understand how data travels in packets, map anomalous DNS redirections, and configure router boundaries.",
    difficulty: "Beginner",
    estimatedTime: "2.5 hours",
    mitreCoverage: [
      { tactic: "Reconnaissance", percentage: 50 },
      { tactic: "Command and Control", percentage: 60 }
    ],
    sopObjective: "Analyze captured PCAP data, identify a malicious DNS spoofing source, and filter it out using router rules.",
    sopAnalogy: "Like a custom customs inspector auditing all mail parcels, verifying that return address tags haven't been forged, and routing packages safely.",
    sopSteps: [
      "Run the packet capture utility to list real-time network frames.",
      "Identify the source of the spoofed protocol broadcasts.",
      "Apply localized drop rules to block the culprit interface."
    ],
    interviewTips: [
      {
        question: "What is ARP spoofing?",
        answer: "It is an attack where an adversary sends forged Address Resolution Protocol messages over a local network, linking their MAC address to a legitimate IP address to intercept local traffic."
      }
    ],
    loopholes: [
      "Local unencrypted protocols like HTTP and DNS are easily captured or modified on public Wi-Fi access points."
    ],
    lessons: [
      {
        title: "SOP-4 // Packet Structure & Interception",
        content: `
          <div class="space-y-4 font-sans text-sm text-zinc-300 leading-relaxed">
            <h3 class="text-zinc-100 font-bold text-base border-b border-zinc-800 pb-2">The Layers of a Packet</h3>
            <p>
              Packets contain headers for each layer (Ethernet, IP, TCP/UDP) before the actual data payload. Understanding header fields is core to filtering out malicious streams.
            </p>
          </div>
        `,
        quizzes: [
          {
            id: "net-q1",
            question: "Which port does traditional unencrypted DNS operate on?",
            options: ["Port 22", "Port 53", "Port 80", "Port 443"],
            correctAnswerIndex: 1,
            explanation: "Domain Name System (DNS) queries traditionally utilize UDP Port 53."
          }
        ]
      }
    ],
    simulation: {
      terminalWelcome: "ARCH-X Network Sniff Terminal v1.1\nType 'objective' to see your mission, 'ls' to explore, 'hint' if you get stuck.",
      objective: "A captured session on the local LAN shows a host poisoning the ARP table and redirecting DNS to man-in-the-middle other machines. Analyze the capture, identify the single rogue host impersonating the gateway, and drop it at the router. Blocking the CORRECT attacker reveals the CTF flag.",
      hints: [
        "Start by exploring. Run 'ls' to see the files, then read the packet capture with 'cat capture.txt'.",
        "The real gateway has ONE fixed MAC address (see README.txt). Look for a second host claiming to be the gateway IP but sending a DIFFERENT MAC in its ARP replies — try 'grep ARP capture.txt'.",
        "That impostor is also forging DNS answers to redirect traffic. Cross-check its source IP against the DNS spoof lines with 'grep DNS capture.txt', then confirm the live view with 'sniff-traffic'.",
        "Drop the attacker at the router. The command form is:  block-host <ip>  — substitute the exact rogue IP you identified from the capture.",
      ],
      files: {
        "capture.txt": "# tcpdump -i eth0 -n  (LAN segment 192.168.1.0/24)\n14:00:01 ARP reply 192.168.1.1 is-at 00:11:22:aa:bb:cc  (from 192.168.1.5)\n14:00:01 ARP reply 192.168.1.1 is-at de:ad:be:ef:00:99  (from 192.168.1.5)\n14:00:02 ARP reply 192.168.1.1 is-at de:ad:be:ef:00:99  (from 192.168.1.5)\n14:00:03 DNS response bank.example.com A 203.0.113.7  (spoofed, src 192.168.1.5)\n14:00:04 DNS response mail.example.com A 203.0.113.7  (spoofed, src 192.168.1.5)\n14:00:05 ARP reply 192.168.1.1 is-at 00:11:22:aa:bb:cc  (from 192.168.1.1, legitimate)\n14:00:06 DNS response bank.example.com A 198.51.100.20 (src 192.168.1.10, normal client query)",
        "README.txt": "LAN segment 192.168.1.0/24. The AUTHORIZED gateway is 192.168.1.1 with MAC 00:11:22:aa:bb:cc. Client 192.168.1.10 is a normal workstation. Any other host answering for the gateway IP with a different MAC is the impostor — investigate and isolate it. Do NOT block the real gateway.",
      },
      commands: {
        help: "Commands:\n  objective        — Show the mission goal\n  sniff-traffic    — Read live packets on network adapter eth0\n  status           — Router / threat-intel summary\n  block-host <ip>  — Drop packets from the specified host at the router",
        "sniff-traffic": "Capturing packets on interface eth0...\n  14:00:01 ARP SPOOFING DETECTED: 192.168.1.5 is broadcasting a fake MAC (de:ad:be:ef:00:99) for gateway 192.168.1.1.\n  14:00:02 UDP DNS redirection probe originating from 192.168.1.5 (answers pointed at 203.0.113.7).",
        status: "Router: ACTIVE\nBlocked: None\nThreat Intelligence: 192.168.1.5 is answering ARP for gateway 192.168.1.1 with a spoofed MAC and forging DNS replies — recommend immediate block.\n192.168.1.1 is the legitimate gateway (do NOT block). 192.168.1.10 is a normal client.",
        "block-host 192.168.1.1": "WARNING: 192.168.1.1 is the authorized gateway. Blocking it would sever the whole LAN. No flag — re-check the ARP/DNS lines for the impostor's real source IP.",
        "block-host 192.168.1.10": "WARNING: 192.168.1.10 is a normal client workstation, not the attacker. No flag — the impostor is the host forging the gateway MAC.",
        "block-host 192.168.1.5": "SUCCESS: Router drop rule added — 192.168.1.5 packets are now discarded, ARP cache restored to the real gateway.\nAttacker contained. Flag decrypted:\nFLAG: {{FLAG}}\nSubmit it above to complete the mission.",
      },
      logs: [
        "14:00:01 [ARP_ALERT] Spoofed route broadcast sent across interface"
      ],
      alerts: [
        { timestamp: "14:00:01", id: "AL-4", severity: "High", technique: "T1557 (Adversary-in-the-Middle)", message: "Local gateway route spoofing originating from local IP 192.168.1.5" }
      ]
    }
  },
  {
    id: "digital-forensics",
    title: "Digital Forensics: Volatile Memory Dissection",
    shortDesc: "Trace active processes, carve volatile memory dumps, and dissect malware paths.",
    fullDesc: "Investigate deep system memories. Map host execution patterns, locate disguised DLL objects, and trace malicious network loops.",
    difficulty: "Advanced",
    estimatedTime: "5 hours",
    mitreCoverage: [
      { tactic: "Exfiltration", percentage: 80 },
      { tactic: "Impact", percentage: 70 }
    ],
    sopObjective: "Dissect a simulated system process list, identify a rogue PID operating under a disguised name, and neutralize it.",
    sopAnalogy: "Like dusting a virtual crime scene for fingerprints, extracting traces left in physical RAM before a computer is rebooted.",
    sopSteps: [
      "Print the list of active running processes from the memory dump file.",
      "Audit executable file paths to find rogue user directories masquerading as system locations.",
      "Quarantine the suspicious process handler using the forensic command module."
    ],
    interviewTips: [
      {
        question: "Why is RAM called 'volatile' memory?",
        answer: "Because RAM requires continuous electric power to retain data. Once a system is powered off or rebooted, all data stored in RAM is permanently lost, making volatile memory capture a high-priority action in live forensics."
      }
    ],
    loopholes: [
      "Advanced malware utilizes process hollowing, hiding malicious payloads inside valid Windows system binaries."
    ],
    lessons: [
      {
        title: "SOP-5 // Volatile Data Extraction",
        content: `
          <div class="space-y-4 font-sans text-sm text-zinc-300 leading-relaxed">
            <h3 class="text-zinc-100 font-bold text-base border-b border-zinc-800 pb-2">Analyzing volatile RAM</h3>
            <p>
              Forensic analysis focuses heavily on tracking process hierarchy (which process spawned what) and identifying executable files running from unusual paths like C:\\Users\\Public\\.
            </p>
          </div>
        `,
        quizzes: [
          {
            id: "for-q1",
            question: "Where do standard critical system binaries like svchost.exe normally execute from in Windows?",
            options: ["C:\\Users\\Public\\", "C:\\Windows\\System32\\", "C:\\Temp\\", "C:\\Program Files\\"],
            correctAnswerIndex: 1,
            explanation: "svchost.exe is a critical system file that must run from the System32 folder. Executing from directories like Temp or Public is a definitive indicator of masquerading malware."
          }
        ]
      }
    ],
    simulation: {
      terminalWelcome: "ARCH-X RAM Forensic Deck v4.2\nType 'help' to review.",
      commands: {
        help: "Commands:\n  ps -list - Print the active process hierarchy tree\n  quarantine-pid <pid> - Freeze process thread and export file signature",
        "ps -list": "PID   Process           Parent   Path\n101   wininit.exe       0        C:\\Windows\\System32\\\n452   svchost.exe       101      C:\\Windows\\System32\\\n1900  svchost.exe       452      C:\\Users\\Public\\Temp\\svchost.exe (⚠️ MALICIOUS PATH)",
        "quarantine-pid 1900": "Process 1900 suspended.\nFile signature extracted: MD5-f3922c011f\nFLAG: ARCHX_FORENSICS_SVCHOST_OK"
      },
      logs: [
        "09:30:10 [SYSTEM] Non-standard svchost thread executing out of C:\\Users\\Public\\"
      ],
      alerts: [
        { timestamp: "09:30:10", id: "AL-5", severity: "High", technique: "T1036 (Masquerading)", message: "System utility masquerading detected. Executable operating outside System32 parameters" }
      ]
    }
  },
  {
    id: "threat-hunter",
    title: "Threat Hunting: Proactive Indicator Correlation",
    shortDesc: "Trace sophisticated network footprints, identify indicators of compromise (IOCs), and write Sigma rules.",
    fullDesc: "Go beyond reactive alerts. Proactively hunt for advanced persistent threat footprints using file signatures, domain lists, and behavioral anomalies.",
    difficulty: "Intermediate",
    estimatedTime: "3 hours",
    mitreCoverage: [
      { tactic: "Collection", percentage: 60 },
      { tactic: "Command and Control", percentage: 80 }
    ],
    sopObjective: "Locate a persistent backdoor footprint using file hashes, and write a detection query to alert on similar processes.",
    sopAnalogy: "Like a detective looking for subtle mud traces and standard footprints around a property, rather than waiting for an active alarm to sound.",
    sopSteps: [
      "Examine active file indicators for anomalous hashes.",
      "Verify the malicious signature against known threat intelligence databases.",
      "Deploy the detection rule signature to find matching systems."
    ],
    interviewTips: [
      {
        question: "What is an Indicator of Compromise (IOC)?",
        answer: "An IOC is physical or digital evidence of a security breach, such as system file hashes, malicious IP addresses, domain names, or registry alterations."
      }
    ],
    loopholes: [
      "Adversaries frequently change their infrastructure IPs and compile unique file hashes to bypass simple blacklist detectors."
    ],
    lessons: [
      {
        title: "SOP-6 // Proactive Threat Intelligence",
        content: `
          <div class="space-y-4 font-sans text-sm text-zinc-300 leading-relaxed">
            <h3 class="text-zinc-100 font-bold text-base border-b border-zinc-800 pb-2">Threat Hunting & Sigma</h3>
            <p>
              Threat hunters assume that breaches have already occurred. They search system environments for abnormal behaviors that automated systems failed to flag.
            </p>
          </div>
        `,
        quizzes: [
          {
            id: "th-q1",
            question: "Which represents the most mutable (easily changed) indicator for an attacker?",
            options: ["System File Hash", "IP Address", "Tactic/Behavior", "Exploit Tool Signature"],
            correctAnswerIndex: 1,
            explanation: "An IP address can be changed in seconds by routing through another proxy. Behaviors and tactics are much more complex for an attacker to re-engineer."
          }
        ]
      }
    ],
    simulation: {
      terminalWelcome: "ARCH-X Advanced threat Hunt Unit v1.0\nType 'help' to review.",
      commands: {
        help: "Commands:\n  file-hash-audit - Scan user folders for known threat Intel file signatures\n  deploy-rule - Save detection logic",
        "file-hash-audit": "Scanning file system records...\n⚠️ ALERT: Malicious executable signature found:\n  Path: C:\\Windows\\Temp\\backdoor.exe\n  MD5: 5e912abcf83204e19030cf8191fe\nFLAG: ARCHX_IOC_HUNTER_99",
        "deploy-rule": "SUCCESS: Detection filter registered globally."
      },
      logs: [
        "11:15:10 [THREAT_HUNT] Hash catalog cross-matching initialized"
      ],
      alerts: [
        { timestamp: "11:15:10", id: "AL-6", severity: "Medium", technique: "T1105 (Ingress Tool Transfer)", message: "Unapproved command backdoor hash flagged on local partition" }
      ]
    }
  },
  {
    id: "reverse-engineer",
    title: "Reverse Engineering: Assembly Dissection",
    shortDesc: "Trace software runtime flows, analyze simple assembly instructions, and find embedded security keys.",
    fullDesc: "Decompile binary payloads. Gain exposure to machine instruction sets (such as x86 assembly), trace variables inside registers, and extract hidden credentials.",
    difficulty: "Advanced",
    estimatedTime: "4.5 hours",
    mitreCoverage: [
      { tactic: "Execution", percentage: 70 },
      { tactic: "Discovery", percentage: 50 }
    ],
    sopObjective: "Dissect decompiled program loops, analyze processor register configurations, and find a hardcoded decryption password.",
    sopAnalogy: "Taking a custom electronic combination lock apart piece by piece, looking at the exact physical shape of the internal tumblers to determine the key combination.",
    sopSteps: [
      "Print decompiled program instructions using the static analysis command.",
      "Trace system registers (e.g. EAX, EBX) to locate critical conditional comparisons.",
      "Extract the plaintext password string verified in the loop comparison."
    ],
    interviewTips: [
      {
        question: "What is the function of the EAX register in x86 architecture?",
        answer: "EAX is the primary accumulator register, frequently utilized for storing arithmetic calculations and program return values from functions."
      }
    ],
    loopholes: [
      "Malicious developers obfuscate strings and use runtime packers (like UPX) to make basic static code analysis impossible."
    ],
    lessons: [
      {
        title: "SOP-7 // Decompilation & Static Code Audit",
        content: `
          <div class="space-y-4 font-sans text-sm text-zinc-300 leading-relaxed">
            <h3 class="text-zinc-100 font-bold text-base border-b border-zinc-800 pb-2">Deconstruction Basics</h3>
            <p>
              Reverse engineering translates compiled computer executables back into human-readable structures like assembly instructions or high-level C code.
            </p>
          </div>
        `,
        quizzes: [
          {
            id: "rev-q1",
            question: "Which assembly instruction is commonly used to compare two values in x86?",
            options: ["MOV", "CMP", "JMP", "ADD"],
            correctAnswerIndex: 1,
            explanation: "CMP is the dedicated compare instruction that subtracts the source from destination and sets processor status flags based on the result."
          }
        ]
      }
    ],
    simulation: {
      terminalWelcome: "ARCH-X Assembly Dissector Shell v0.8b\nType 'help' to review.",
      commands: {
        help: "Commands:\n  decompile-main - Print assembly loops for core binary logic\n  test-key <string> - Submit guessed password key to process loop",
        "decompile-main": "0x00401000: MOV EAX, [0x00405020]\n0x00401005: CMP EAX, 'ARCHX_DECOMP_KEY_99'\n0x0040100A: JE 0x00401015\n0x0040100C: XOR EAX, EAX\n0x0040100E: RET",
        "test-key ARCHX_DECOMP_KEY_99": "ACCESS CONFIRMED. Decryption function returned valid data loop.\nFLAG: ARCHX_REVERSE_SUCCESS_88"
      },
      logs: [
        "13:02:11 [DECOMPILER] Binary main section loaded into analytical register"
      ],
      alerts: [
        { timestamp: "13:02:11", id: "AL-7", severity: "Medium", technique: "T1027 (Obfuscated Files or Information)", message: "Assembly memory buffer inspection initialized for untrusted file target" }
      ]
    }
  },
  {
    id: "cloud-security",
    title: "Cloud Security: IAM & Public S3 Hardening",
    shortDesc: "Audit virtual private networks, find open cloud storage buckets, and secure identity policies.",
    fullDesc: "Learn how modern cloud infrastructures are secured. Identify over-privileged user roles, locate publicly readable file buckets, and trace cross-account access loops.",
    difficulty: "Intermediate",
    estimatedTime: "3.5 hours",
    mitreCoverage: [
      { tactic: "Initial Access", percentage: 70 },
      { tactic: "Exfiltration", percentage: 80 }
    ],
    sopObjective: "Audit a public bucket policy, locate sensitive leaked file lists, and restrict permission structures.",
    sopAnalogy: "Like discovering that an office storage file room was mistakenly built with a window on the public street, allowing anyone passing by to view internal business folders.",
    sopSteps: [
      "Scan public cloud bucket storage metrics to list files.",
      "Locate insecure permissions matching read-all identities.",
      "Deploy restrictive security policies to secure access pipelines."
    ],
    interviewTips: [
      {
        question: "Explain the Principle of Least Privilege.",
        answer: "It dictates that users, processes, and systems must only have the minimum set of permissions necessary to complete their required tasks, and nothing more."
      }
    ],
    loopholes: [
      "Often, default policies on modern cloud buckets are set to public if developers configure custom web hosting and forget to isolate folders."
    ],
    lessons: [
      {
        title: "SOP-8 // Cloud IAM Policies & Buckets",
        content: `
          <div class="space-y-4 font-sans text-sm text-zinc-300 leading-relaxed">
            <h3 class="text-zinc-100 font-bold text-base border-b border-zinc-800 pb-2">The Public Bucket Threat</h3>
            <p>
              Insecure Cloud Storage bucket settings are a major source of corporate data leaks. Securing IAM roles prevents automated bots from finding confidential records.
            </p>
          </div>
        `,
        quizzes: [
          {
            id: "cloud-q1",
            question: "What does IAM stand for in Cloud Operations?",
            options: [
              "Identity and Access Management",
              "Internal Asset Monitor",
              "Integrated Alert Master",
              "Internet Authentication Map"
            ],
            correctAnswerIndex: 0,
            explanation: "IAM stands for Identity and Access Management, controlling user access permissions across cloud resources."
          }
        ]
      }
    ],
    simulation: {
      terminalWelcome: "ARCH-X Cloud Auditor Utility v3.1\nType 'help' to review.",
      commands: {
        help: "Commands:\n  cloud-bucket-audit - Scan active storage targets for public reading scopes\n  secure-bucket-iam <bucket_id> - Apply strict private permission sets",
        "cloud-bucket-audit": "Scanning buckets...\n⚠️ BUCKET FOUND PUBLIC: 'archx-finance-records-01'\n  Files exposed: 42\n  Permissions: AllUsers -> READ",
        "secure-bucket-iam archx-finance-records-01": "Restricting permissions to Private Owner access.\nSuccessfully deployed IAM patch.\nFLAG: ARCHX_CLOUD_IAM_SECURED_77"
      },
      logs: [
        "16:20:10 [IAM_AUDIT] Insecure public read configurations verified on 'archx-finance-records-01'"
      ],
      alerts: [
        { timestamp: "16:20:10", id: "AL-8", severity: "High", technique: "T1530 (Data from Cloud Storage Object)", message: "Confidential financial storage node exposed directly to anonymous internet traffic" }
      ]
    }
  },
  {
    id: "identity-access",
    title: "Identity Architecture: OAuth & JWT Verification",
    shortDesc: "Understand token authentication, audit JWT signatures, and prevent credential replays.",
    fullDesc: "Learn how single-sign-on (SSO) systems function. Detect vulnerable JSON Web Tokens, spot signature bypasses, and secure modern API networks.",
    difficulty: "Advanced",
    estimatedTime: "3 hours",
    mitreCoverage: [
      { tactic: "Credential Access", percentage: 80 },
      { tactic: "Defense Evasion", percentage: 50 }
    ],
    sopObjective: "Audit a JSON Web Token payload, discover an unverified signature vulnerability, and patch system validators.",
    sopAnalogy: "Like checking an identification badge, but discovering the signature stamp was printed with erasable ink, allowing anyone to modify their name.",
    sopSteps: [
      "Extract the JWT authorization token payload.",
      "Check token headers for insecure algorithm declarations like 'none'.",
      "Configure strict cryptographic verification constraints on the API gate."
    ],
    interviewTips: [
      {
        question: "What are the three parts of a JWT?",
        answer: "A JWT consists of three parts separated by periods: Header (specifies metadata and signature algorithm), Payload (contains user claims), and Signature (verifies integrity)."
      }
    ],
    loopholes: [
      "Insecure JWT library implementations mistakenly trust user-specified headers that declare the signature algorithm is 'none'."
    ],
    lessons: [
      {
        title: "SOP-9 // JSON Web Token Deconstruction",
        content: `
          <div class="space-y-4 font-sans text-sm text-zinc-300 leading-relaxed">
            <h3 class="text-zinc-100 font-bold text-base border-b border-zinc-800 pb-2">JWT Security Checklists</h3>
            <p>
              JSON Web Tokens are commonly used for API validation. Ensuring signatures are mathematically checked on every request is paramount to prevent identity theft.
            </p>
          </div>
        `,
        quizzes: [
          {
            id: "jwt-q1",
            question: "Why is the JWT 'none' algorithm extremely dangerous?",
            options: [
              "It slows down system processing",
              "It instructs the validator to accept the token claims without checking any signature signature",
              "It deletes all database records automatically",
              "It prevents users from logging out"
            ],
            correctAnswerIndex: 1,
            explanation: "The 'none' algorithm tells systems to bypass signature verification entirely. This allows attackers to forge any identity payload they want and gain instant admin credentials."
          }
        ]
      }
    ],
    simulation: {
      terminalWelcome: "ARCH-X JWT API Validator Deck v1.0\nType 'help' to review.",
      commands: {
        help: "Commands:\n  view-token - Extract current server authorization header token\n  reconfigure-jwt-verify - Require strict HS256 signature verification policies",
        "view-token": "Active Header Token:\n  eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VyIjoicmVjcnVpdCIsImlzX2FkbWluIjpmYWxzZX0.\n  ⚠️ WARNING: Header declares 'none' algorithm.",
        "reconfigure-jwt-verify": "Updating verification filters...\nJWT 'none' algorithm is now blocked.\nFLAG: ARCHX_JWT_VALIDATOR_OK_99"
      },
      logs: [
        "15:00:10 [AUTH] Request received on /api/admin with signature algorithm set to 'none'"
      ],
      alerts: [
        { timestamp: "15:00:10", id: "AL-9", severity: "High", technique: "T1556 (Modify Authentication Process)", message: "Insecure none-algorithm JWT bypass attempt detected on admin endpoints" }
      ]
    }
  },
  {
    id: "incident-responder",
    title: "Incident Response: Active Ransomware Containment",
    shortDesc: "Contain active ransomware propagation, isolate compromised systems, and recover log streams.",
    fullDesc: "Learn how to react when an intrusion goes active. Mitigate lateral movement, isolate critical datacenters, and perform post-compromise cleanup operations.",
    difficulty: "Intermediate",
    estimatedTime: "4 hours",
    mitreCoverage: [
      { tactic: "Defense Evasion", percentage: 50 },
      { tactic: "Impact", percentage: 90 }
    ],
    sopObjective: "Detect a rapid file encryption signature, locate the origin node, and apply localized container isolation.",
    sopAnalogy: "Like detecting a small leak in a water pipe and closing pressure valves immediately to isolate the damaged segment and prevent building flooding.",
    sopSteps: [
      "Examine rapid file system alteration events to pinpoint the compromised server.",
      "Trigger network-level host isolation on the affected host.",
      "Analyze malicious process handles to recover the containment flag."
    ],
    interviewTips: [
      {
        question: "What is the very first action you should take during an active ransomware attack?",
        answer: "Isolate the infected systems from the local network immediately to prevent lateral spread, while preserving system state and volatile memory if possible."
      }
    ],
    loopholes: [
      "Advanced ransomware scripts attempt to disable logging services (like Syslog or Event Log) before starting encryption."
    ],
    lessons: [
      {
        title: "SOP-10 // Containment Playbooks",
        content: `
          <div class="space-y-4 font-sans text-sm text-zinc-300 leading-relaxed">
            <h3 class="text-zinc-100 font-bold text-base border-b border-zinc-800 pb-2">System Isolation</h3>
            <p>
              When ransomware strikes, seconds matter. Automated containment playbooks isolate endpoints instantly to contain malware spread.
            </p>
          </div>
        `,
        quizzes: [
          {
            id: "ir-q1",
            question: "Why is network isolation preferred over powering off a machine under active ransomware attacks?",
            options: [
              "Powering off destroys the volatile RAM cache which holds decryption keys or process traces",
              "Powering off is too slow",
              "Powering off damages system components permanently",
              "Powering off completes the encryption process faster"
            ],
            correctAnswerIndex: 0,
            explanation: "Powering off a machine wipes volatile memory (RAM). Volatile memory often contains active encryption keys, process logs, and malware handles that are invaluable for recovery and forensic audit."
          }
        ]
      }
    ],
    simulation: {
      terminalWelcome: "ARCH-X Incident Control Center v2.4\nType 'help' to review.",
      commands: {
        help: "Commands:\n  monitor-file-activity - Audit speed of disk write modifications\n  isolate-host <host_id> - Block all host network ports",
        "monitor-file-activity": "System Write Speed: 412 files/sec (Anomalous)\nTarget Node: db-client-99\nFiles being altered: .locked extensions detected",
        "isolate-host db-client-99": "Host db-client-99 network isolation rule successfully applied.\nSpreading vector dropped. System secured.\nFLAG: ARCHX_CONTAINMENT_SUCCESS_55"
      },
      logs: [
        "11:00:10 [ALERT] Excessive file rename operations verified on db-client-99"
      ],
      alerts: [
        { timestamp: "11:00:10", id: "AL-10", severity: "High", technique: "T1486 (Data Encrypted for Impact)", message: "Rapid file system encryption processes running on db-client-99" }
      ]
    }
  },
  {
    id: "social-defender",
    title: "Social Engineering: Email Header Spoofing Audits",
    shortDesc: "Trace forged email headers, verify system authentication records, and identify spoofing signals.",
    fullDesc: "Learn how attackers deceive humans. Audit SPF, DKIM, and DMARC verification records to trace phishing attempts to their actual origin servers.",
    difficulty: "Beginner",
    estimatedTime: "2.5 hours",
    mitreCoverage: [
      { tactic: "Initial Access", percentage: 90 },
      { tactic: "Reconnaissance", percentage: 40 }
    ],
    sopObjective: "Inspect a phishing email header list, spot forged sending routing paths, and submit the authentic origin domain.",
    sopAnalogy: "Like examining the mail envelope stamp and route history markings under a magnifying glass, verifying the post office stamp isn't forged.",
    sopSteps: [
      "Read the simulated email delivery headers.",
      "Check SPF / DKIM verification statuses.",
      "Identify and trace the actual IP of the foreign sending agent."
    ],
    interviewTips: [
      {
        question: "Explain the difference between SPF and DKIM.",
        answer: "SPF (Sender Policy Framework) lists the IP addresses authorized to send emails for a domain. DKIM (DomainKeys Identified Mail) adds a cryptographic signature to verify the message was actually sent by that domain and wasn't altered in transit."
      }
    ],
    loopholes: [
      "Attackers register domains that look almost identical to trusted brands (homograph attacks) to bypass simple visual email client security."
    ],
    lessons: [
      {
        title: "SOP-11 // Domain Email Protection Systems",
        content: `
          <div class="space-y-4 font-sans text-sm text-zinc-300 leading-relaxed">
            <h3 class="text-zinc-100 font-bold text-base border-b border-zinc-800 pb-2">DKIM, SPF, and DMARC</h3>
            <p>
              Email spoofing succeeds because basic mail protocols do not require origin validation. Deploying DKIM, SPF, and DMARC protects domain integrity.
            </p>
          </div>
        `,
        quizzes: [
          {
            id: "se-q1",
            question: "Which record uses public-key cryptography to digitally sign email messages?",
            options: ["SPF Record", "DKIM Record", "DMARC Record", "TXT Record"],
            correctAnswerIndex: 1,
            explanation: "DKIM uses a public-key cryptographic signature placed in email headers to verify that the message wasn't forged or tampered with."
          }
        ]
      }
    ],
    simulation: {
      terminalWelcome: "ARCH-X Mail Routing Inspector v1.2\nType 'help' to review.",
      commands: {
        help: "Commands:\n  view-headers - Dump raw received email envelope metadata\n  quarantine-domain <domain> - Block emails from domain",
        "view-headers": "From: billing@arch-x-portal.co\nReceived: from attacker-server.net (IP: 185.110.12.5)\nSPF: FAIL (185.110.12.5 is not authorized)\nDKIM: FAIL",
        "quarantine-domain attacker-server.net": "Domain attacker-server.net blacklisted globally.\nFLAG: ARCHX_DKIM_PHISH_FAIL"
      },
      logs: [
        "13:00:10 [MAIL] SPF origin failure recorded on inbound connection from 185.110.12.5"
      ],
      alerts: [
        { timestamp: "13:00:10", id: "AL-11", severity: "Medium", technique: "T1566 (Phishing)", message: "Spoofed inbound email failing sender policy verification rules" }
      ]
    }
  },
  {
    id: "api-security",
    title: "API Security: Broken Object Authorization",
    shortDesc: "Analyze REST API endpoints, detect BOLA vulnerabilities, and secure object-level reference mappings.",
    fullDesc: "Inspect web APIs for Broken Object Level Authorization (BOLA) weaknesses. Verify user permissions across parameters and seal endpoint reference mapping exploits.",
    difficulty: "Intermediate",
    estimatedTime: "2.5 hours",
    mitreCoverage: [
      { tactic: "Initial Access", percentage: 70 },
      { tactic: "Privilege Escalation", percentage: 80 }
    ],
    sopObjective: "Fuzz endpoint object parameters, identify cross-account object reference access, and apply custom context-aware access control validation filters.",
    sopAnalogy: "Like checking into a hotel and finding out that changing your room number digit on your key card allows you to open other guests' rooms because the locks only check if the card is valid, not if it belongs to that specific room.",
    sopSteps: [
      "Scan the active API endpoints with a list scanner utility.",
      "Verify parameter parameters for guessable sequential IDs (BOLA vulnerability).",
      "Inject authorization checks to ensure the session context owner matches the requested object identifier.",
      "Execute security regression tests to verify that cross-tenant access attempts are dropped."
    ],
    interviewTips: [
      {
        question: "What is Broken Object Level Authorization (BOLA), and how is it mitigated?",
        answer: "BOLA occurs when an application exposes object references (such as user IDs or account keys) without verifying if the requesting user is authorized to access that object. It is mitigated by validating that the authenticated user context possesses explicit permission for the requested resource identifier on every request."
      }
    ],
    loopholes: [
      "Developers often rely entirely on front-end obfuscation, assuming API parameters won't be modified manually."
    ],
    lessons: [
      {
        title: "SOP-12 // API Security & BOLA",
        content: `
          <div class="space-y-4 font-sans text-sm text-zinc-300 leading-relaxed">
            <h3 class="text-zinc-100 font-bold text-base border-b border-zinc-800 pb-2">Broken Object Level Authorization (BOLA)</h3>
            <p>
              BOLA is the single most common vulnerability found in modern cloud API endpoints. It occurs when a server accepts an object identifier (like an account ID or user ID) in an API call without validating whether the user associated with the active session token actually owns that resource.
            </p>
            <div class="p-3 bg-zinc-900 border border-zinc-800 rounded font-mono text-xs text-zinc-300">
              GET /api/v1/accounts/102 HTTP/1.1
              Authorization: Bearer recruit_token
            </div>
            <p>
              Even though the client is authenticated as a low-level operator, the server blindly returns the sensitive details of administrative account 102 because it failed to perform ownership validation on the requested ID.
            </p>
          </div>
        `,
        quizzes: [
          {
            id: "api-q1",
            question: "Which of the following is the most robust defense against BOLA?",
            options: [
              "Obfuscating resource IDs with Base64",
              "Validating authorization permissions on every server-side request matching user session with object resource",
              "Using a firewall to block all external IP ranges",
              "Adding client-side redirect rules"
            ],
            correctAnswerIndex: 1,
            explanation: "To solve BOLA, you must run an authorization check on every request that maps the requesting session user to the requested resource object. Hiding or encoding IDs is just security through obscurity and can be easily bypassed."
          }
        ]
      }
    ],
    simulation: {
      terminalWelcome: "ARCH-X REST API Security Scanner v1.0\nType 'help' to review simulated commands.",
      commands: {
        help: "Commands:\n  scan-api - Perform HTTP API endpoint enumeration\n  fuzz-params - Intercept requests and fuzz object parameters\n  patch-bola - Enforce request-session context validation filters\n  status - View endpoint protection states",
        "scan-api": "Discovered endpoints:\n  GET /api/v1/users/profile - Active session profile\n  GET /api/v1/accounts/101 - Restricted client account balance",
        "fuzz-params": "INTERCEPTING TRAFFIC...\nRequest: GET /api/v1/accounts/102\nResponse: 200 OK\nPayload: {\"account_id\": 102, \"owner\": \"finance_chief\", \"balance\": \"$4,820,000\"}\nBOLA DETECTED! Unauthorized access to parameter '102' was allowed.",
        "patch-bola": "SUCCESS: Authorization filter deployed. Session user context mapped to requested resources.\nFLAG: ARCHX_API_BOLA_SECURED",
        status: "API Gate: ACTIVE\nAuthorization Checks: Enabled\nBOLA Protection: Active"
      },
      logs: [
        "11:24:05 [API] Discovered object access bypass on GET /api/v1/accounts/102"
      ],
      alerts: [
        { timestamp: "11:24:05", id: "AL-12", severity: "High", technique: "T1595 (API Scanning)", message: "Cross-tenant unauthorized parameter mapping allowed on accounts endpoint" }
      ]
    }
  },
  {
    id: "k8s-security",
    title: "Kubernetes Security: Pod Escape and RBAC Auditing",
    shortDesc: "Identify privileged container contexts, exploit namespace configurations, and audit K8s RBAC bindings.",
    fullDesc: "Investigate how weak Role-Based Access Control (RBAC) maps and highly privileged container configurations allow pod escaping to compromise the host node.",
    difficulty: "Advanced",
    estimatedTime: "4 hours",
    mitreCoverage: [
      { tactic: "Privilege Escalation", percentage: 95 },
      { tactic: "Lateral Movement", percentage: 75 }
    ],
    sopObjective: "Audit pod daemon privileges, locate sensitive hostPath mount bindings, and restrict container capabilities to eliminate namespace breakout vectors.",
    sopAnalogy: "Like renting a secure container box in a massive storage yard, but realizing the host left a master crowbar inside your container, allowing you to easily break through the ceiling and enter the general administration building.",
    sopSteps: [
      "Inspect active pod definitions inside the cluster.",
      "Detect if the container runs with privileged flags or shares the host mount space.",
      "Deploy Pod Security Policies to restrict root permissions.",
      "Audit RBAC ClusterRoles to ensure the principle of Least Privilege is active."
    ],
    interviewTips: [
      {
        question: "What is a 'privileged' container, and why is it dangerous in Kubernetes?",
        answer: "A privileged container has access to all capabilities of the host kernel, bypassing container namespace protections. An attacker in a privileged container can mount host filesystems, access host devices, and escape the container to compromise the entire host node."
      }
    ],
    loopholes: [
      "Default ServiceAccount tokens are automatically mounted inside containers, often granting unneeded cluster access."
    ],
    lessons: [
      {
        title: "SOP-13 // Container Hardening and K8s RBAC",
        content: `
          <div class="space-y-4 font-sans text-sm text-zinc-300 leading-relaxed">
            <h3 class="text-zinc-100 font-bold text-base border-b border-zinc-800 pb-2">Container Isolation & escapes</h3>
            <p>
              Containers are not virtual machines; they share the host kernel. If a container is run with the <code>privileged: true</code> flag or has writable mounts of the host filesystem (such as <code>/var/run/docker.sock</code> or <code>/host</code>), an attacker can easily interact with the underlying host OS.
            </p>
            <p>
              By mounting the host device filesystem inside the container, an attacker can access raw disk nodes and chroot directly into the host namespace, effectively escaping the container entirely.
            </p>
          </div>
        `,
        quizzes: [
          {
            id: "k8s-q1",
            question: "What is the safest way to prevent host path container escapes?",
            options: [
              "Increasing the host server RAM",
              "Disallowing writable hostPath mount configurations in container specifications",
              "Encoding the container image using custom cryptographic keys",
              "Renaming the pod names to random digits"
            ],
            correctAnswerIndex: 1,
            explanation: "Preventing write-access to host filesystems (like blocking hostPath mounts or deploying secure pod controllers) eliminates the ability for attackers to read or alter host kernel processes."
          }
        ]
      }
    ],
    simulation: {
      terminalWelcome: "ARCH-X Kube-Control Cluster Audit Console\nType 'help' to review active commands.",
      commands: {
        help: "Commands:\n  get-pods - List running pods in the current namespace\n  audit-rbac - Check cluster role definitions and permissions\n  patch-k8s - Apply PodSecurityStandards to restrict root breakouts\n  status - View pod protection levels",
        "get-pods": "POD NAME               STATUS      PRIVILEGED   MOUNT_HOST\napp-web-pod-01         Running     true         true",
        "audit-rbac": "CLUSTER ROLE BINDINGS:\n  ServiceAccount: default\n  ClusterRole: cluster-admin (CRITICAL: excessive permissions)",
        "patch-k8s": "SUCCESS: PodSecurityPolicies applied. Container escape mount-points restricted. cluster-admin privilege revoked from default account.\nFLAG: ARCHX_K8S_ESCAPE_SEALED",
        status: "Kubernetes Cluster: SECURE\nPrivileged Pods: Zero\nDefault RBAC Scope: Least Privilege"
      },
      logs: [
        "12:45:10 [K8S] High-privilege container mount discovered on default pod namespace."
      ],
      alerts: [
        { timestamp: "12:45:10", id: "AL-13", severity: "High", technique: "T1611 (Escape to Host)", message: "Privileged container launched with write permissions on hostPath mount" }
      ]
    }
  },
  {
    id: "active-directory",
    title: "Active Directory: Kerberoasting Mitigation",
    shortDesc: "Audit domain service principal names, detect ticket requests, and enforce strong cryptographic password schemes.",
    fullDesc: "Analyze active directory environments for ticket harvesting exploits. Discover how weak SPN credentials expose service hashes, and apply kerberos security policies.",
    difficulty: "Advanced",
    estimatedTime: "4.5 hours",
    mitreCoverage: [
      { tactic: "Credential Access", percentage: 90 },
      { tactic: "Lateral Movement", percentage: 80 }
    ],
    sopObjective: "Audit Service Principal Names (SPNs), spot abnormal Kerberos ticket requests (TGS-REQ), and migrate accounts to Group Managed Service Accounts (gMSA).",
    sopAnalogy: "Like an apartment clerk giving out security voucher tickets to anyone who asks, assuming only the genuine keyholder can decode them. If a rogue resident collects enough vouchers, they can take them home to crack the locks in private.",
    sopSteps: [
      "Query SPN structures inside the active directory environment.",
      "Identify weak user accounts associated with critical services.",
      "Detect offline hash-cracking potential by checking Ticket Granting Service responses.",
      "Deploy Group Managed Service Accounts to enforce automatically rotated 128-character keys."
    ],
    interviewTips: [
      {
        question: "What is Kerberoasting, and how do you protect against it?",
        answer: "Kerberoasting is an attack where any authenticated domain user requests a Kerberos Ticket Granting Service (TGS) ticket for a Service Principal Name (SPN). Since the ticket is encrypted with the service account's password hash, the attacker can take it offline to crack the hash and steal the password. Mitigations include enforcing strong passwords, using AES encryption, and migrating to gMSAs."
      }
    ],
    loopholes: [
      "Service accounts often possess Domain Admin credentials because developers find it simpler than configuring precise ACLs."
    ],
    lessons: [
      {
        title: "SOP-14 // Kerberos Protocol & AD Defense",
        content: `
          <div class="space-y-4 font-sans text-sm text-zinc-300 leading-relaxed">
            <h3 class="text-zinc-100 font-bold text-base border-b border-zinc-800 pb-2">Kerberos and Ticket Request Exploits</h3>
            <p>
              Under Kerberos, when a user wants to access a service, they ask the domain controller (KDC) for a ticket. The KDC generates a ticket encrypted with the password hash of the service account running that service.
            </p>
            <p>
              Because any domain user can request this ticket without alert thresholds, attackers can extract these tickets from RAM or disk and run brute-force wordlists against them offline to find the original password.
            </p>
          </div>
        `,
        quizzes: [
          {
            id: "ad-q1",
            question: "Why is Kerberoasting an attractive attack for adversaries?",
            options: [
              "It requires root access to start",
              "It allows offline password cracking without generating continuous lockouts or network noise",
              "It crashes the active domain controllers immediately",
              "It does not require any domain authentication"
            ],
            correctAnswerIndex: 1,
            explanation: "Because Kerberoasting happens offline, it generates no failed login logs on active directory nodes, making it nearly invisible until the compromised service credential is used."
          }
        ]
      }
    ],
    simulation: {
      terminalWelcome: "ARCH-X Active Directory Domain Controller Auditing Command\nType 'help' to review commands.",
      commands: {
        help: "Commands:\n  query-spn - Enumerate registered Service Principal Names\n  sniff-kerberos - Log recent TGS-REQ Kerberos operations\n  migrate-gmsa - Reconfigure vulnerable SPN accounts to use gMSA\n  status - View Active Directory security level",
        "query-spn": "ServicePrincipalName: MSSQLSvc/sql-prod.archx.local:1433\nAccountName: ad_sql_service (VULNERABLE: Cleartext key encryption)\nServicePrincipalName: HTTP/portal.archx.local\nAccountName: web_srv_acc",
        "sniff-kerberos": "TGS-REQ: Account 'ad_sql_service' requested by low-privilege User 'recruit_test'\nEncryption: RC4 (CRITICAL: Weak cipher hash easily crackable)",
        "migrate-gmsa": "SUCCESS: Service accounts migrated to Group Managed Service Accounts (gMSA) with AES-256 ciphers.\nFLAG: ARCHX_AD_GMSA_MIGRATED",
        status: "Active Directory Domain: COMPLIANT\nWeak Ciphers: Disabled\nService Account Types: Managed (gMSA)"
      },
      logs: [
        "09:12:44 [AD] Kerberos TGS-REQ request with weak RC4 encryption intercepted."
      ],
      alerts: [
        { timestamp: "09:12:44", id: "AL-14", severity: "High", technique: "T1558.003 (Kerberoasting)", message: "Abnormal Service Principal Ticket requested using deprecated weak cipher protocols" }
      ]
    }
  },
  {
    id: "scada-security",
    title: "SCADA & ICS: Industrial Control Network Defense",
    shortDesc: "Inspect industrial network communications, detect Modbus replay attacks, and secure operational technology.",
    fullDesc: "Deep-dive into Operational Technology (OT) and Industrial Control Systems (ICS). Audit unauthenticated Modbus protocols and secure critical physical pipeline operations.",
    difficulty: "Advanced",
    estimatedTime: "5 hours",
    mitreCoverage: [
      { tactic: "Inhibit Response Function", percentage: 90 },
      { tactic: "Impair Process Control", percentage: 85 }
    ],
    sopObjective: "Sniff industrial SCADA registers, identify malicious unauthenticated coil manipulation commands, and configure stateful industrial firewall inspection rules.",
    sopAnalogy: "Like an automated water treatment valve that blindly accepts open megaphone commands from anyone standing in the street. If someone yells 'close valve 5', the pump shuts down immediately because it doesn't verify the speaker's identity.",
    sopSteps: [
      "Monitor the ICS network interface for industrial packet streams.",
      "Identify unauthenticated write-coil requests to physical controllers.",
      "Establish secure OT-to-IT segmentation barriers (Purdue Model).",
      "Implement stateful Deep Packet Inspection (DPI) to drop unverified Modbus frames."
    ],
    interviewTips: [
      {
        question: "What is the Purdue Model in industrial network design?",
        answer: "The Purdue Model is an architectural framework that segregates industrial networks into distinct logical levels. It establishes security boundaries between business IT networks (Level 4/5) and core physical control equipment (Level 0/1/2) using industrial demilitarized zones (IDMZs)."
      }
    ],
    loopholes: [
      "Many industrial control modules remain in operation for 25+ years without receiving firmware security updates."
    ],
    lessons: [
      {
        title: "SOP-15 // Operational Technology & Modbus Security",
        content: `
          <div class="space-y-4 font-sans text-sm text-zinc-300 leading-relaxed">
            <h3 class="text-zinc-100 font-bold text-base border-b border-zinc-800 pb-2">Operational Technology Protocols</h3>
            <p>
              In traditional IT networks, cryptographic validation (SSL/TLS, SSH) is ubiquitous. However, legacy Operational Technology (OT) protocols like Modbus TCP send cleartext packets with absolutely zero authentication built-in.
            </p>
            <p>
              This means if an adversary gains raw network access to Level 1 PLCs (Programmable Logic Controllers), they can issue commands to write data directly to hardware registers, stopping safety loops or disabling turbines.
            </p>
          </div>
        `,
        quizzes: [
          {
            id: "scada-q1",
            question: "Why are classic IT security tools (like rapid automated vulnerability scans) dangerous inside OT environments?",
            options: [
              "They consume too much internet bandwidth",
              "They can crash fragile legacy PLC microprocessors, interrupting critical real-world infrastructure",
              "They do not support Windows systems",
              "They require fiber-optic network connectors"
            ],
            correctAnswerIndex: 1,
            explanation: "Legacy PLCs use extremely small microprocessors with fragile network stacks. Flooding them with standard IT scanning queries can cause them to freeze, leading to critical downtime in physical plants."
          }
        ]
      }
    ],
    simulation: {
      terminalWelcome: "ARCH-X SCADA / ICS Operational Telemetry Console\nType 'help' to review commands.",
      commands: {
        help: "Commands:\n  sniff-modbus - Listen to industrial protocol packet register states\n  audit-purdue - Check network level segmentation mapping\n  apply-dpi-firewall - Deploy Deep Packet Inspection filters on PLCs\n  status - View physical safety registers",
        "sniff-modbus": "Modbus RTU Frame Intercepted:\n  Unit ID: 0x01, Function Code: 0x05 (Write Single Coil)\n  Register: 0x0010 (Emergency Coolant Pump)\n  Data: 0x0000 (SHUT DOWN COMMAND) - UNVERIFIED SOURCE!",
        "audit-purdue": "SEGMENTATION AUDIT:\n  Business IT (Level 4) connected directly to PLC Registers (Level 1) - CRITICAL: No IDMZ boundary!",
        "apply-dpi-firewall": "SUCCESS: Industrial IDMZ established. Deep Packet Inspection (DPI) rules deployed. Unauthenticated Modbus write functions are now rejected.\nFLAG: ARCHX_SCADA_OT_ISOLATED",
        status: "SCADA Network: PROTECTED\nSegment Boundary: IDMZ Active\nModbus Validation: Enforced"
      },
      logs: [
        "15:33:02 [SCADA] Intercepted unauthenticated emergency shut-down signal on register 0x0010."
      ],
      alerts: [
        { timestamp: "15:33:02", id: "AL-15", severity: "High", technique: "T0836 (Impair Process Control)", message: "Unauthorized register manipulation packet detected targeting safety systems" }
      ]
    }
  },
  {
    id: "mobile-security",
    title: "Mobile Pentesting: SSL Pinning and Local Storage Audit",
    shortDesc: "Audit mobile client binaries, locate local storage exposures, and bypass SSL pinning protections.",
    fullDesc: "Inspect Android and iOS applications. Discover how cleartext storage databases expose access tokens, and practice auditing mobile APIs under SSL-pinned security settings.",
    difficulty: "Intermediate",
    estimatedTime: "3 hours",
    mitreCoverage: [
      { tactic: "Credential Access", percentage: 85 },
      { tactic: "Defense Evasion", percentage: 70 }
    ],
    sopObjective: "Audit mobile sandbox directories, find unencrypted SQLite databases, and implement secure keychain cryptographic practices.",
    sopAnalogy: "Like writing your safe vault's master combination on a post-it note and sticking it inside your briefcase. The briefcase is locked, but once someone gets their hands on the briefcase, they can search the pockets and read the combination.",
    sopSteps: [
      "Inspect the mobile sandbox folder directories.",
      "Parse local SQLite databases and SharedPreference binaries.",
      "Identify hardcoded session tokens or sensitive API variables.",
      "Re-architect the application database to utilize encrypted SQLite databases (SQLCipher)."
    ],
    interviewTips: [
      {
        question: "What is SSL Pinning, and how do attackers bypass it during mobile assessments?",
        answer: "SSL Pinning forces a mobile app to trust only specific server certificates, preventing custom proxy interceptions. Attackers bypass SSL pinning on device environments using instrumentation tools like Frida to patch certificate checking functions in memory at runtime."
      }
    ],
    loopholes: [
      "Developers frequently write temporary user logs to public SD card storage, allowing other local apps to read them."
    ],
    lessons: [
      {
        title: "SOP-16 // Mobile Sandbox Audits & Encryption",
        content: `
          <div class="space-y-4 font-sans text-sm text-zinc-300 leading-relaxed">
            <h3 class="text-zinc-100 font-bold text-base border-b border-zinc-800 pb-2">Mobile Sandbox Local Storage</h3>
            <p>
              Mobile OS platforms use strict sandboxing to prevent apps from reading each other's data. However, if a device is rooted/jailbroken, or if an attacker steals a local backup, they can read all files inside the private sandbox directory.
            </p>
            <p>
              Therefore, storing session keys, access cookies, or PII in cleartext XML configuration files or plain SQLite database files is a high-risk security flaw.
            </p>
          </div>
        `,
        quizzes: [
          {
            id: "mob-q1",
            question: "Where should a mobile application store sensitive cryptographic credentials or authentication tokens?",
            options: [
              "In the local SharedPreferences xml files",
              "In a cleartext SQLite database in the temp path",
              "Inside the OS-provided secure storage keychain (iOS Keychain / Android Keystore)",
              "Within the image metadata comments"
            ],
            correctAnswerIndex: 2,
            explanation: "The OS keychain is backed by secure hardware-level encryption (TEE/Secure Enclave) and is the only secure location to save application secrets."
          }
        ]
      }
    ],
    simulation: {
      terminalWelcome: "ARCH-X Mobile Application Forensics & Binary Console\nType 'help' to review commands.",
      commands: {
        help: "Commands:\n  view-sandbox - List private mobile sandbox directory files\n  dump-sqlite - Dump cleartext SQL database files\n  harden-storage - Encrypt local databases using SQLCipher and secure hardware keystore\n  status - View mobile compliance levels",
        "view-sandbox": "Directory: /data/user/0/com.archx.secureapp/databases/\nFiles:\n  - app_cache.db (SQLite database)\n  - user_session.xml",
        "dump-sqlite": "DATABASE DUMP (app_cache.db):\nTable: SESSIONS\n  - session_token: 'ARCHX_MOBILE_BEARER_88190'\n  - username: 'operator_alpha'\nCRITICAL: Session cookies are stored in plaintext!",
        "harden-storage": "SUCCESS: Storage hardened. Local database encrypted with SQLCipher using a key bound to Android Keystore. XML logs purged.\nFLAG: ARCHX_MOBILE_SANDBOX_SECURED",
        status: "Mobile Sandbox: COMPLIANT\nPlaintext DBs: Zero\nHardware Key Storage: Enabled"
      },
      logs: [
        "10:19:55 [MOBILE] Identified cleartext credentials stored on local cache folders."
      ],
      alerts: [
        { timestamp: "10:19:55", id: "AL-16", severity: "Medium", technique: "T1401 (Sandbox Leak)", message: "Sensitive session cookies identified in cleartext inside local SQL database files" }
      ]
    }
  }
];

// ─── Deep guidebook registry ─────────────────────────────────────────────────
// Each generated guidebook file (src/data/guidebooks/<id>.ts) exports META +
// LESSONS. Wiring them here overrides the placeholder inline lessons and adds
// the rich Overview fields — one line per course, no inline-array surgery.
const DEEP_GUIDEBOOKS: Record<string, { meta: Partial<Course>; lessons: Course["lessons"] }> = {
  "pentest":            { meta: PENTEST_META,            lessons: PENTEST_LESSONS },
  "network-security":   { meta: NETWORK_SECURITY_META,   lessons: NETWORK_SECURITY_LESSONS },
  "digital-forensics":  { meta: DIGITAL_FORENSICS_META,  lessons: DIGITAL_FORENSICS_LESSONS },
  "devsecops":          { meta: DEVSECOPS_META,          lessons: DEVSECOPS_LESSONS },
  "threat-hunter":      { meta: THREAT_HUNTER_META,      lessons: THREAT_HUNTER_LESSONS },
  "reverse-engineer":   { meta: REVERSE_ENGINEER_META,   lessons: REVERSE_ENGINEER_LESSONS },
  "cloud-security":     { meta: CLOUD_SECURITY_META,     lessons: CLOUD_SECURITY_LESSONS },
  "identity-access":    { meta: IDENTITY_ACCESS_META,    lessons: IDENTITY_ACCESS_LESSONS },
  "incident-responder": { meta: INCIDENT_RESPONDER_META, lessons: INCIDENT_RESPONDER_LESSONS },
  "social-defender":    { meta: SOCIAL_DEFENDER_META,    lessons: SOCIAL_DEFENDER_LESSONS },
  "api-security":       { meta: API_SECURITY_META,       lessons: API_SECURITY_LESSONS },
  "k8s-security":       { meta: K8S_SECURITY_META,       lessons: K8S_SECURITY_LESSONS },
  "active-directory":   { meta: ACTIVE_DIRECTORY_META,   lessons: ACTIVE_DIRECTORY_LESSONS },
  "scada-security":     { meta: SCADA_SECURITY_META,     lessons: SCADA_SECURITY_LESSONS },
  "mobile-security":    { meta: MOBILE_SECURITY_META,    lessons: MOBILE_SECURITY_LESSONS },
};
for (const course of COURSES) {
  const g = DEEP_GUIDEBOOKS[course.id];
  if (g) Object.assign(course, g.meta, { lessons: g.lessons });
}

// ─── Sandbox lab registry ────────────────────────────────────────────────────
// Each src/data/sandboxes/<id>.ts exports SANDBOX { objective, hints, files,
// commands }. Merge into the course's simulation so the lab is solvable with
// guided hints (soc-analyst + network-security are already inline).
type SandboxData = { objective: string; hints: readonly string[]; files: Readonly<Record<string, string>>; commands: Readonly<Record<string, string>> };
const SANDBOXES: Record<string, SandboxData> = {
  "pentest":            PENTEST_SANDBOX,
  "digital-forensics":  DIGITAL_FORENSICS_SANDBOX,
  "threat-hunter":      THREAT_HUNTER_SANDBOX,
  "incident-responder": INCIDENT_RESPONDER_SANDBOX,
  "devsecops":          DEVSECOPS_SANDBOX,
  "reverse-engineer":   REVERSE_ENGINEER_SANDBOX,
  "cloud-security":     CLOUD_SECURITY_SANDBOX,
  "identity-access":    IDENTITY_ACCESS_SANDBOX,
  "social-defender":    SOCIAL_DEFENDER_SANDBOX,
  "api-security":       API_SECURITY_SANDBOX,
  "k8s-security":       K8S_SECURITY_SANDBOX,
  "active-directory":   ACTIVE_DIRECTORY_SANDBOX,
  "scada-security":     SCADA_SECURITY_SANDBOX,
  "mobile-security":    MOBILE_SECURITY_SANDBOX,
};
for (const course of COURSES) {
  const s = SANDBOXES[course.id];
  if (s) course.simulation = {
    ...course.simulation,
    objective: s.objective,
    hints: [...s.hints],
    files: { ...s.files },
    commands: { ...course.simulation.commands, ...s.commands },
  };
}

export interface OSINTChallenge {
  id: string;
  title: string;
  category: "Geolocation" | "Infrastructure" | "Metadata" | "Social Media";
  description: string;
  objectives?: string[]; // Investigative questionnaire — non-graded sub-tasks that guide the analyst
  imageUrl: string;
  points: number;
  correctAnswer: string; // Fuzzy match targets
  hints: string[];
  explanation: string;
  tools?: string[];
}

export const OSINT_CHALLENGES: OSINTChallenge[] = [
  {
    id: "osint-1",
    title: "OPERATION 001",
    category: "Geolocation",
    description: "INTERCEPT — A field operative transmitted a single photograph of a harbour entrance moments before going dark. Command needs the navigational landmark in frame identified by name to anchor the operative's last known position. Work only from the image; the brief deliberately withholds the location. Determine the name of this lighthouse.",
    objectives: [
      "Establish the country from architectural, signage and environmental cues.",
      "Narrow down the specific body of water this harbour opens onto.",
      "Identify the lighthouse by its proper name."
    ],
    imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80",
    points: 100,
    correctAnswer: "lindau lighthouse",
    hints: [
      "Reverse-image search rarely nails landmarks straight away — crop tightly to the structure alone and run it through Google Lens and Yandex, which are strongest on European geography.",
      "The surrounding architecture reads as Central European, and the water is unusually calm — this is a large inland lake, not open sea.",
      "It is the only lighthouse on this particular lake, and it shares its name with the town beside it.",
      "The town sits on the Bavarian shore of Lake Constance (Bodensee) and its name begins with 'L'."
    ],
    explanation: "This is the Lindau Lighthouse (Lindauer Leuchtturm) on Lake Constance, Germany — the southernmost lighthouse in the country. It is a textbook geolocation anchor: distinctive structure, constrained water body, and town-name overlap.",
    tools: ["Google Lens", "Yandex Reverse Image", "Overpass Turbo", "EXIF Metadata Viewer"]
  },
  {
    id: "osint-2",
    title: "OPERATION 002",
    category: "Infrastructure",
    description: "An adversary is rumoured to run an off-grid data cache inside a hardened alpine bunker. Signals intelligence places the entrance beside a high mountain pass with a long military history. Identify the pass by name.",
    objectives: [
      "Determine the mountain range and country from the terrain.",
      "Identify the transport corridor (road and/or rail) that crosses here.",
      "Name the pass."
    ],
    imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
    points: 120,
    correctAnswer: "gotthard pass",
    hints: [
      "The terrain is the Central Alps. Bilingual (German/Italian) signage in the region is a strong locator tell.",
      "One of the world's longest base tunnels runs beneath this point and carries the same name.",
      "It links the cantons of Uri and Ticino in Switzerland.",
      "The name begins with 'G' and is tied to a legendary 'Devil's Bridge'."
    ],
    explanation: "This is the Gotthard Pass in Switzerland, long associated with deep granite fortifications and bunkers. Multilingual regional signage plus the namesake base tunnel make it identifiable without any location label.",
    tools: ["Shodan", "WHOIS", "Peakfinder / topographic maps", "Censys"]
  },
  {
    id: "osint-3",
    title: "OPERATION 003",
    category: "Geolocation",
    description: "A target's traffic was last seen egressing through a routing hub in a dense waterfront entertainment district. The only visual is a large illuminated observation wheel. Identify the host city.",
    objectives: [
      "Identify the country from the writing system on nearby signage.",
      "Determine the waterfront district from the skyline and layout.",
      "Name the host city."
    ],
    imageUrl: "https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&w=800&q=80",
    points: 80,
    correctAnswer: "tokyo",
    hints: [
      "Start with the script on the signs and storefronts — writing system narrows the country in seconds.",
      "The characters are Japanese (a mix of kanji and kana).",
      "The waterfront district featuring a giant Ferris wheel and a replica statue sits on a reclaimed bay island.",
      "That district is Odaiba — now name the capital city it belongs to."
    ],
    explanation: "This is Tokyo, Japan — the Odaiba waterfront. Script identification is the fastest first move in geolocation: it collapses the search space to a single country before you ever touch the skyline.",
    tools: ["Google Maps Street View", "Yandex Reverse Image", "Exiftool", "OpenStreetMap"]
  },
  {
    id: "osint-4",
    title: "OPERATION 004",
    category: "Infrastructure",
    description: "A green-energy datacentre draws heat-exchange from a mineral-rich geothermal pool nearby. Identify the well-known thermal site shown in the image.",
    objectives: [
      "Identify the country from the volcanic, treeless landscape.",
      "Determine the power station that feeds the pool.",
      "Name the geothermal site."
    ],
    imageUrl: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
    points: 100,
    correctAnswer: "blue lagoon",
    hints: [
      "Black basaltic rock, milky pale-blue water, and a complete absence of trees — think mid-Atlantic volcanic island.",
      "The country is Iceland; the site is on the Reykjanes peninsula in the southwest.",
      "The pool is warmed by mineral runoff from the adjacent Svartsengi geothermal plant.",
      "Its English name pairs a colour with a 'lagoon'."
    ],
    explanation: "This is the Blue Lagoon in Iceland, fed by the Svartsengi plant. Iceland's cheap geothermal power and cold ambient air make it a real-world favourite for sustainable datacentres.",
    tools: ["Sentinel/landscape imagery", "Power-grid WHOIS", "DNSDumpster", "Censys"]
  },
  {
    id: "osint-5",
    title: "OPERATION 005",
    category: "Geolocation",
    description: "Surveillance recovered an image of a large twin-towered cathedral dominating a southern-German skyline. Identify the cathedral by name.",
    objectives: [
      "Confirm the country and city from the skyline and rooflines.",
      "Note the distinctive twin domed (welsche Haube) towers.",
      "Name the cathedral."
    ],
    imageUrl: "https://images.unsplash.com/photo-1595853035070-59a39fe84de3?auto=format&fit=crop&w=800&q=80",
    points: 130,
    correctAnswer: "frauenkirche",
    hints: [
      "The two towers are capped with green onion-shaped 'welsch' domes — a Bavarian architectural signature.",
      "The host city is a major southern-German tech hub, also world-famous for an autumn beer festival.",
      "The city is Munich; this is the most iconic church silhouette on its skyline.",
      "Its German name means 'Church of Our Lady' and begins with 'F'."
    ],
    explanation: "This is the Frauenkirche in Munich. The twin welsche-Haube domes are a near-unique tell — once you recognise the dome style, the city follows immediately.",
    tools: ["Google Lens", "Wikimapia", "SunCalc (shadow analysis)", "OpenStreetMap"]
  },
  {
    id: "osint-6",
    title: "OPERATION 006",
    category: "Infrastructure",
    description: "A historic microwave-relay tower — once deliberately omitted from official maps — anchors a capital city's legacy communications grid. Identify the tower.",
    objectives: [
      "Identify the city from surrounding architecture and street level.",
      "Recognise the cylindrical mid-century communications-tower form.",
      "Name the tower."
    ],
    imageUrl: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80",
    points: 110,
    correctAnswer: "bt tower",
    hints: [
      "A slender cylindrical glass shaft ringed with lattice microwave galleries near the top — classic 1960s comms design.",
      "It stands in the Fitzrovia district of a major Western-European capital and was once an official state secret.",
      "The capital is London; the tower was historically called the Post Office Tower.",
      "Its current name is a two-letter British telecom brand."
    ],
    explanation: "This is the BT Tower in London (formerly the Post Office Tower). For decades it was the backbone microwave relay for UK telecoms — and, absurdly, an 'official secret' despite being one of the city's tallest structures.",
    tools: ["Shodan", "Censys", "Wayback Machine", "OpenStreetMap"]
  },
  {
    id: "osint-7",
    title: "OPERATION 007",
    category: "Metadata",
    description: "A dead-drop device was photographed at the base of a famous bascule bridge spanning a major capital river. Identify the bridge — and be careful not to name its more famous neighbour by mistake.",
    objectives: [
      "Identify the river and the city.",
      "Distinguish true bascule towers from a plain river span.",
      "Name the bridge correctly."
    ],
    imageUrl: "https://images.unsplash.com/photo-1508333706533-1ab43ecb1606?auto=format&fit=crop&w=800&q=80",
    points: 90,
    correctAnswer: "tower bridge",
    hints: [
      "Two Gothic-revival towers linked by high-level walkways, with a road deck that splits and lifts for ships.",
      "It crosses the River Thames in London.",
      "It is constantly misnamed after a much plainer bridge just upstream — don't fall for it.",
      "Its name comes from the medieval fortress standing right beside it."
    ],
    explanation: "This is Tower Bridge in London, named for the adjacent Tower of London. The classic trap is calling it 'London Bridge' — a verification discipline lesson as much as a geolocation one.",
    tools: ["Exiftool", "Google Lens", "Wayback Machine (historical maps)", "OpenStreetMap"]
  },
  {
    id: "osint-8",
    title: "OPERATION 008",
    category: "Geolocation",
    description: "A packet router was sited inside a building overlooking a world-famous harbour performing-arts venue. Identify the venue by name.",
    objectives: [
      "Identify the country and city from the harbour setting.",
      "Recognise the shell-vaulted 'sail' roof design.",
      "Name the venue."
    ],
    imageUrl: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80",
    points: 80,
    correctAnswer: "sydney opera house",
    hints: [
      "The roof is a series of white interlocking 'sail' shells set on a low peninsula.",
      "It sits on a point in a large Southern-Hemisphere harbour city.",
      "The city is Sydney, Australia; the venue is on Bennelong Point.",
      "It was designed by Danish architect Jørn Utzon — name the building itself."
    ],
    explanation: "This is the Sydney Opera House on Bennelong Point. Its shell roof is one of the most recognisable rooflines on earth — a single architectural feature that fully geolocates the shot.",
    tools: ["Yandex Reverse Image", "Google Maps Street View", "RIPE/APNIC WHOIS", "OpenStreetMap"]
  },
  {
    id: "osint-9",
    title: "OPERATION 009",
    category: "Infrastructure",
    description: "An unknown device is beaconing from the observation deck of a flying-saucer-shaped tower in a Pacific-coast US city. Identify the tower.",
    objectives: [
      "Identify the US region from the skyline and surroundings.",
      "Recognise the World's-Fair-era 'saucer-on-legs' form.",
      "Name the tower."
    ],
    imageUrl: "https://images.unsplash.com/photo-1542223175-7582dd7ee9f8?auto=format&fit=crop&w=800&q=80",
    points: 100,
    correctAnswer: "space needle",
    hints: [
      "A disc-shaped observation deck perched on tapering tripod legs — futuristic mid-century styling.",
      "It was built for the 1962 World's Fair in a major Washington-State tech city.",
      "The city is Seattle.",
      "Its name pairs the word 'Space' with a sewing tool."
    ],
    explanation: "This is the Space Needle in Seattle, built for the 1962 World's Fair. Its silhouette is unmistakable and its elevation makes it a natural reference point for radio direction-finding exercises.",
    tools: ["WiGLE WiFi database", "FCC antenna search", "Google Lens", "Censys"]
  },
  {
    id: "osint-10",
    title: "OPERATION 010",
    category: "Geolocation",
    description: "Shadow analysis points to a monumental single triumphal arch standing at the convergence of twelve radiating avenues. Identify the monument.",
    objectives: [
      "Identify the country and city from the boulevards and architecture.",
      "Recognise the single-arch triumphal form at a star-shaped junction.",
      "Name the monument."
    ],
    imageUrl: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80",
    points: 90,
    correctAnswer: "arc de triomphe",
    hints: [
      "A single massive arch sits at the centre of a roundabout from which twelve avenues radiate like a star.",
      "It crowns the western end of one of the world's most famous shopping avenues.",
      "The city is Paris; the junction is the Place Charles de Gaulle (Étoile).",
      "Its French name translates literally to 'Arch of Triumph'."
    ],
    explanation: "This is the Arc de Triomphe in Paris, at the Étoile. The twelve-avenue star junction is a unique street-grid fingerprint — even without the arch, the road pattern alone geolocates it.",
    tools: ["SunCalc (shadow/solar geolocation)", "Google Maps", "Yandex Reverse Image", "OpenStreetMap"]
  },
  {
    id: "osint-11",
    title: "OPERATION 011",
    category: "Metadata",
    description: "AIS vessel data tied a dark-net relay to a container ship passing beneath a long suspension bridge at the mouth of a major bay. Identify the bridge.",
    objectives: [
      "Identify the strait/bay and the city.",
      "Note the distinctive paint colour and Art-Deco tower styling.",
      "Name the bridge."
    ],
    imageUrl: "https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?auto=format&fit=crop&w=800&q=80",
    points: 90,
    correctAnswer: "golden gate bridge",
    hints: [
      "The towers are Art-Deco and painted a vivid orange-red, frequently wrapped in low fog.",
      "It spans the strait at the entrance to a major Northern-California bay.",
      "The city is San Francisco.",
      "Its name pairs a precious metal with a 'gate'."
    ],
    explanation: "This is the Golden Gate Bridge at the mouth of San Francisco Bay. Pairing AIS/MarineTraffic data with a fixed visual landmark is a realistic way to correlate a moving vessel to a precise chokepoint.",
    tools: ["MarineTraffic (AIS)", "Exiftool", "Google Lens", "WHOIS"]
  },
  {
    id: "osint-12",
    title: "OPERATION 012",
    category: "Geolocation",
    description: "A phishing operator was photographed working on a laptop canal-side, among rows of narrow gabled townhouses in a European capital. Identify the city.",
    objectives: [
      "Identify the country from architecture and street-level details.",
      "Recognise the concentric canal-ring urban form.",
      "Name the city."
    ],
    imageUrl: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80",
    points: 100,
    correctAnswer: "amsterdam",
    hints: [
      "Tall, narrow brick houses with ornate gables and rooftop hoist-beams line the water's edge.",
      "Bicycles everywhere plus a ring of concentric canals — a distinctly Dutch hallmark.",
      "It is the capital of the Netherlands.",
      "The name begins with 'A' and its canal ring is UNESCO-listed."
    ],
    explanation: "This is Amsterdam. The combination of gabled hoist-beam houses, ubiquitous bicycles, and a concentric canal ring is a layered fingerprint — no single clue is conclusive, but together they pinpoint the city.",
    tools: ["Yandex Reverse Image", "Google Street View", "Wayback Machine", "OpenStreetMap"]
  }
];

export const MOCK_LEADERBOARD = [
  { rank: 1, name: "Zubair", track: "Security Architect", xp: 4850, completedCount: 8, badge: "Grandmaster" },
  { rank: 2, name: "NexusPrime", track: "SOC Analyst", xp: 3900, completedCount: 6, badge: "Threat Hunter" },
  { rank: 3, name: "CryptoWrecker", track: "Penetration Tester", xp: 3450, completedCount: 5, badge: "Red Teamer" },
  { rank: 4, name: "Alice_Forensics", track: "Digital Forensics", xp: 3100, completedCount: 5, badge: "Incident Responder" },
  { rank: 5, name: "PipelineSlayer", track: "DevSecOps", xp: 2850, completedCount: 4, badge: "Secure Coder" }
];
