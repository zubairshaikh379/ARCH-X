// ─────────────────────────────────────────────────────────────────────────────
// NETWORK SECURITY — DEEP GUIDEBOOK (ARCH-X textbook-grade course)
//
// Content is authored as SEMANTIC HTML and rendered inside `.md-content`
// (see src/index.css) — h2/h3/p/ul/ol/li/pre/code/table/blockquote/strong are
// all styled there, so lessons render correctly without relying on Tailwind
// class scanning.
//
// Structure mirrors a real syllabus: Intro & the defensive role → OSI/TCP-IP &
// packets → reading traffic (Wireshark/tcpdump) → protocols & weaknesses →
// network attacks → firewalls & segmentation → IDS/IPS & signatures →
// detection in practice → MITRE ATT&CK → pitfalls + interview/capstone.
// Each lesson ends with an 8-question knowledge check.
//
// Educational, defence-oriented content for AUTHORISED training only. Attacks
// are explained conceptually so you can detect and defend against them.
// ─────────────────────────────────────────────────────────────────────────────

import type { Course } from "../courses";

type Lesson = Course["lessons"][number];

export const META: Pick<
  Course,
  "prerequisites" | "learningOutcomes" | "mustKnow" | "commonGaps" | "prosCons" | "careerNotes"
> = {
  prerequisites: [
    "Basic IT literacy: you know what an IP address and a web browser are — that's enough to start.",
    "Comfort opening a terminal and running simple commands (we build everything else from zero).",
    "A rough idea that data travels over networks in 'chunks' — we'll turn that into a precise model.",
    "No prior security or networking certification required; the OSI model is taught here, not assumed.",
  ],
  learningOutcomes: [
    "Explain how data moves through the OSI and TCP/IP layers, and read a packet header field-by-field.",
    "Capture and dissect live traffic with tcpdump and Wireshark, and apply display/capture filters with intent.",
    "Recognise the weaknesses of ARP, DNS, HTTP, and TLS — and what each leaks or trusts.",
    "Identify the network signatures of sniffing, ARP spoofing/MITM, port scanning, and DoS attacks.",
    "Design segmentation and firewall rules that contain an attacker, and choose stateful vs stateless filtering correctly.",
    "Write and reason about IDS/IPS signatures (Snort/Suricata) and Zeek logs, and map detections to MITRE ATT&CK.",
  ],
  mustKnow: [
    "OSI 7 layers", "TCP/IP model", "Ethernet frame", "IP header", "TCP 3-way handshake",
    "UDP", "ARP", "DNS / port 53", "HTTP vs HTTPS", "TLS handshake", "SNI",
    "pcap", "tcpdump / BPF", "Wireshark display filters", "ARP spoofing", "MITM",
    "SYN scan", "SYN flood / DoS / DDoS", "Stateful firewall", "VLAN segmentation",
    "IDS vs IPS", "Snort / Suricata", "Zeek", "NetFlow", "T1040 / T1557 / T1595 / T1071",
  ],
  commonGaps: [
    "Encryption blind spots. Beginners expect to 'read everything' on the wire, then hit TLS and panic. You analyse metadata (who/when/how much/SNI), not plaintext payloads.",
    "Capture point matters. A sniffer on a switched network only sees its own traffic unless there's a SPAN/mirror port or an active attack — many learners capture nothing and assume the tool is broken.",
    "Stateful vs stateless. People write 'allow port 80 in' rules without realising return traffic and connection state are the hard part. Misunderstanding state creates either holes or broken apps.",
    "Baselines. You can't call traffic 'anomalous' without knowing this network's normal beaconing, DNS volume, and talkers. Courses skip baselines; real analysts live by them.",
    "False positives. IDS signatures fire constantly on benign traffic. Tuning rules and suppressing noise is the real job, not just turning Snort on.",
    "Defence in depth vs single chokepoint. Many assume one perimeter firewall is enough; modern attacks move laterally inside the 'trusted' network where there's no inspection.",
  ],
  prosCons: {
    pros: [
      "Network telemetry is hard for an attacker to fully erase — packets crossing the wire are observed by infrastructure the attacker doesn't control.",
      "One sensor at a chokepoint can give visibility into many hosts at once, including devices you can't install an agent on (IoT, printers, OT).",
      "Skills transfer directly to NOC, SOC, threat hunting, and network/cloud security engineering roles.",
    ],
    cons: [
      "Encryption (TLS, QUIC, VPNs) hides payloads; you increasingly reason from metadata and behaviour, not content.",
      "Full packet capture is expensive in storage and bandwidth at scale, forcing trade-offs (flow data, sampling, retention windows).",
      "Switched and segmented networks limit what a single sensor sees; visibility requires deliberate SPAN/TAP placement.",
    ],
  },
  careerNotes:
    "Traffic analysis and network defence are core to the NOC→SOC career path and to Network Security Analyst / Detection Engineer roles. It pairs naturally with incident response and threat hunting. Certifications that map to this material: CompTIA Network+ (the networking foundations), CompTIA Security+ (defensive concepts), Cisco CCNA (routing/switching/segmentation), and more advanced tracks like Cisco CyberOps, GIAC GCIA (intrusion analyst), and the practical TryHackMe/HackTheBox network paths. Market relevance stays high: even as traffic encrypts, demand for analysts who can interpret flow data, IDS/IPS alerts, and network telemetry grows alongside zero-trust and segmentation projects. A NOC or junior network-security role is a realistic 0–2 year target; the people who advance learn to baseline a network and tune detections, not just read alerts.",
};

export const LESSONS: Lesson[] = [
  // ── LESSON 1 ───────────────────────────────────────────────────────────────
  {
    title: "01 // Network Defence and the Analyst on the Wire",
    summary: "What network security defends, where the analyst sits, and why watching traffic is one of the highest-value defensive skills.",
    content: `
      <h2>Guarding the roads, not just the buildings</h2>
      <p><strong>Network security</strong> is the practice of protecting data <em>while it moves</em> — between machines, across the office LAN, and out to the internet. If host security guards each building, network security guards the roads between them: who is allowed to travel, what they carry, and whether anyone is tampering with the mail in transit.</p>
      <p>You are <strong>defensive</strong>. Your job is to observe traffic, understand what normal looks like, spot the abnormal, and act — block a host, raise an alert, or hand an incident up the chain. You are not attacking anyone; you are the customs inspector auditing parcels and verifying that return addresses haven't been forged.</p>

      <h3>Where the network analyst sits</h3>
      <p>Network defence work appears across several teams. Most people enter through one of these:</p>
      <table>
        <thead><tr><th>Role</th><th>Focus</th></tr></thead>
        <tbody>
          <tr><td><strong>NOC (Network Operations)</strong></td><td>Keeps the network running and healthy; first to notice odd traffic, outages, and saturation.</td></tr>
          <tr><td><strong>SOC Analyst (Tier 1/2)</strong></td><td>Triages IDS/IPS and firewall alerts, investigates suspicious connections, escalates incidents.</td></tr>
          <tr><td><strong>Threat Hunter</strong></td><td>Proactively searches traffic for command-and-control and lateral movement no alert fired on.</td></tr>
          <tr><td><strong>Network Security Engineer</strong></td><td>Designs segmentation, firewall policy, and sensor placement so the above teams can see and stop threats.</td></tr>
        </tbody>
      </table>

      <h3>Why the wire is such high-value ground</h3>
      <p>An attacker can delete logs on a host they control, but they cannot easily un-send a packet that already crossed a switch you monitor. Network telemetry is observed by infrastructure the attacker doesn't own, which makes it powerful, and often stubbornly honest, evidence.</p>
      <ul>
        <li><strong>Breadth</strong> — one sensor at a chokepoint can watch many hosts at once, including devices you can't put an agent on (printers, IoT, OT).</li>
        <li><strong>Independence</strong> — it corroborates host logs; when both agree, your confidence soars.</li>
        <li><strong>Early warning</strong> — scanning and beaconing show up on the network before damage is done on a host.</li>
      </ul>

      <h3>The honest limit, stated up front</h3>
      <blockquote>Most traffic today is <strong>encrypted</strong>. You will rarely read the contents of a connection. The modern analyst reasons from <em>metadata</em> — who talked to whom, when, how often, how much, and to what name — not from plaintext. Knowing this limit from day one keeps you accurate.</blockquote>

      <h3>What you will build toward</h3>
      <p>By the capstone you will take a packet capture (pcap), identify a malicious source — for example a host spoofing the gateway and redirecting DNS — prove it with a filter, and contain it with a router/firewall rule, mapping every step to MITRE ATT&CK and explaining it in an interview.</p>
    `,
    quizzes: [
      { id: "net-l1-q1", question: "What does network security primarily protect?", options: ["Only physical server rooms", "Data while it moves between systems and across networks", "Employee payroll records only", "Printer toner levels"], correctAnswerIndex: 1, explanation: "Network security focuses on data in transit — protecting traffic as it travels between hosts and across networks." },
      { id: "net-l1-q2", question: "In this course, the analyst's role is best described as…", options: ["Offensive — attacking other networks", "Defensive — observing traffic and responding to threats", "Purely administrative paperwork", "Writing marketing copy"], correctAnswerIndex: 1, explanation: "Network defence is a blue-team discipline: observe, judge, and respond to threats against your own network." },
      { id: "net-l1-q3", question: "Which role is typically the first to notice odd traffic, outages, or saturation?", options: ["Threat Hunter", "NOC (Network Operations)", "Marketing", "End users"], correctAnswerIndex: 1, explanation: "The NOC keeps the network healthy and is usually first to see anomalies, outages, and link saturation." },
      { id: "net-l1-q4", question: "Why is network telemetry considered stubbornly honest evidence?", options: ["It cannot be encrypted", "Packets are observed by infrastructure the attacker doesn't control, so they're hard to fully erase", "It is stored forever by law", "Attackers never use the network"], correctAnswerIndex: 1, explanation: "Unlike host logs an attacker can delete, packets crossing monitored infrastructure are recorded outside the attacker's control." },
      { id: "net-l1-q5", question: "What is a major advantage of a single sensor at a network chokepoint?", options: ["It encrypts all traffic", "It can observe many hosts at once, including agentless devices", "It replaces the need for firewalls", "It speeds up the internet connection"], correctAnswerIndex: 1, explanation: "One well-placed sensor gives breadth — visibility into many hosts, even IoT/OT devices you can't install agents on." },
      { id: "net-l1-q6", question: "Because most modern traffic is encrypted, the analyst mostly reasons from…", options: ["Plaintext payload contents", "Metadata: who/when/how often/how much/what name", "The colour of the cables", "The attacker's confession"], correctAnswerIndex: 1, explanation: "Encryption hides payloads, so analysts rely on metadata and behaviour rather than reading message contents." },
      { id: "net-l1-q7", question: "Which role proactively searches traffic for threats that no alert fired on?", options: ["Threat Hunter", "Help desk", "Payroll", "NOC paging system"], correctAnswerIndex: 0, explanation: "Threat hunters proactively look for command-and-control and lateral movement that detections missed." },
      { id: "net-l1-q8", question: "What is the capstone goal of this course?", options: ["Build a web app", "Identify a malicious source in a pcap, prove it with a filter, and contain it with a firewall rule", "Memorise every RFC", "Disable all networking"], correctAnswerIndex: 1, explanation: "The capstone has you analyse a capture, identify (e.g.) a DNS-spoofing host, prove it, and block it — mapped to ATT&CK." },
    ],
  },

  // ── LESSON 2 ───────────────────────────────────────────────────────────────
  {
    title: "02 // Foundations: The OSI & TCP/IP Models and the Anatomy of a Packet",
    summary: "The layered models that explain how data travels, and how a packet is built from nested headers around a payload.",
    content: `
      <h2>Data travels in layers</h2>
      <p>To analyse traffic you must first understand how it's structured. Networking is organised into <strong>layers</strong>, where each layer does one job and hands its work to the next. Two models describe this: the 7-layer <strong>OSI model</strong> (the teaching reference) and the practical 4-layer <strong>TCP/IP model</strong> (what the internet actually runs).</p>

      <h3>The OSI model, mapped to TCP/IP</h3>
      <table>
        <thead><tr><th>OSI layer</th><th>Job</th><th>Example</th><th>TCP/IP layer</th></tr></thead>
        <tbody>
          <tr><td>7 Application</td><td>What the app speaks</td><td>HTTP, DNS, SSH</td><td>Application</td></tr>
          <tr><td>6 Presentation</td><td>Format / encryption</td><td>TLS</td><td>Application</td></tr>
          <tr><td>5 Session</td><td>Conversations</td><td>session setup</td><td>Application</td></tr>
          <tr><td>4 Transport</td><td>End-to-end delivery, ports</td><td>TCP, UDP</td><td>Transport</td></tr>
          <tr><td>3 Network</td><td>Addressing & routing</td><td>IP, ICMP</td><td>Internet</td></tr>
          <tr><td>2 Data Link</td><td>Local delivery, MAC</td><td>Ethernet, ARP</td><td>Link</td></tr>
          <tr><td>1 Physical</td><td>Bits on the medium</td><td>cables, Wi-Fi</td><td>Link</td></tr>
        </tbody>
      </table>
      <p>The classic memory aid: <em>"All People Seem To Need Data Processing"</em> (layers 7→1). You don't memorise it for trivia — you use it to <strong>locate a problem</strong>. "Is this a layer 2 (MAC/ARP) issue or a layer 3 (IP routing) issue?" is a question you'll ask daily.</p>

      <h3>Encapsulation: how a packet is built</h3>
      <p>As your data goes <em>down</em> the stack to be sent, each layer wraps it in its own header — like nested envelopes. This is <strong>encapsulation</strong>:</p>
      <pre><code>[ Ethernet header | IP header | TCP header | ...payload (e.g. HTTP)... ]
   layer 2          layer 3      layer 4      layer 7</code></pre>
      <p>The receiver reverses this (<strong>decapsulation</strong>), peeling one header per layer. A packet sniffer shows you these layers stacked exactly like this.</p>

      <h3>Three headers you must recognise</h3>
      <ul>
        <li><strong>Ethernet (L2)</strong> — carries <strong>MAC addresses</strong> (source and destination hardware addresses) for delivery on the <em>local</em> network only.</li>
        <li><strong>IP (L3)</strong> — carries <strong>source and destination IP addresses</strong>, plus a <code>TTL</code> (time-to-live, hop counter) and a protocol field saying what's inside (TCP=6, UDP=17, ICMP=1).</li>
        <li><strong>TCP/UDP (L4)</strong> — carries <strong>source and destination ports</strong> (which application), and for TCP, flags and sequence numbers that track the conversation.</li>
      </ul>

      <h3>The TCP three-way handshake</h3>
      <p>TCP is connection-oriented and reliable. Every TCP conversation starts with a three-step handshake — memorise it, because attacks and scans abuse it:</p>
      <pre><code>Client → Server :  SYN          (let's talk; here's my sequence number)
Server → Client :  SYN, ACK     (ok; here's mine, and I got yours)
Client → Server :  ACK          (great, connected)</code></pre>
      <p><strong>UDP</strong>, by contrast, is connectionless and fire-and-forget: no handshake, no guaranteed delivery. DNS queries, video, and many fast protocols use it.</p>

      <blockquote>Frame the whole course this way: an attack is almost always a <em>misuse of one of these layers</em> — forging a MAC at L2 (ARP spoofing), flooding half-open handshakes at L4 (SYN flood), or abusing an L7 protocol (DNS, HTTP). Know the layer, and you know where to look.</blockquote>
    `,
    quizzes: [
      { id: "net-l2-q1", question: "How many layers does the OSI model have?", options: ["4", "5", "7", "12"], correctAnswerIndex: 2, explanation: "The OSI model has 7 layers; the practical TCP/IP model collapses them into 4." },
      { id: "net-l2-q2", question: "At which layer do MAC addresses operate?", options: ["Layer 2 (Data Link)", "Layer 3 (Network)", "Layer 4 (Transport)", "Layer 7 (Application)"], correctAnswerIndex: 0, explanation: "MAC addresses live at the Data Link layer (L2) and deliver frames on the local network." },
      { id: "net-l2-q3", question: "What does encapsulation describe?", options: ["Deleting headers to save space", "Each layer wrapping the data in its own header, like nested envelopes", "Encrypting the whole disk", "Assigning IP addresses"], correctAnswerIndex: 1, explanation: "Encapsulation is the process where each layer adds its header as data moves down the stack before transmission." },
      { id: "net-l2-q4", question: "Which header carries source and destination IP addresses and the TTL?", options: ["Ethernet (L2)", "IP (L3)", "TCP (L4)", "HTTP (L7)"], correctAnswerIndex: 1, explanation: "The IP (Network layer) header carries source/destination IPs, the TTL hop counter, and the inner-protocol field." },
      { id: "net-l2-q5", question: "What are the three steps of the TCP handshake, in order?", options: ["ACK, SYN, FIN", "SYN, SYN-ACK, ACK", "PUSH, PULL, CLOSE", "GET, POST, ACK"], correctAnswerIndex: 1, explanation: "TCP connections begin with SYN → SYN-ACK → ACK before any data flows." },
      { id: "net-l2-q6", question: "How does UDP differ from TCP?", options: ["UDP is connectionless with no handshake or guaranteed delivery", "UDP encrypts everything by default", "UDP uses MAC addresses, TCP does not", "UDP has more handshake steps than TCP"], correctAnswerIndex: 0, explanation: "UDP is connectionless and fire-and-forget — no handshake and no delivery guarantee, used by DNS, video, etc." },
      { id: "net-l2-q7", question: "Ports (e.g. 80, 443) are found in which header?", options: ["Ethernet (L2)", "IP (L3)", "TCP/UDP (L4 Transport)", "ARP"], correctAnswerIndex: 2, explanation: "Source and destination ports identify the application and live in the Transport-layer (TCP/UDP) header." },
      { id: "net-l2-q8", question: "Why is the layer model useful to an analyst?", options: ["It is required by law", "It helps locate a problem — e.g. distinguishing an L2 (ARP/MAC) issue from an L3 (IP routing) issue", "It encrypts traffic", "It makes the network faster"], correctAnswerIndex: 1, explanation: "Layers let you pinpoint where a problem or attack lives, guiding where to look and what to capture." },
    ],
  },

  // ── LESSON 3 ───────────────────────────────────────────────────────────────
  {
    title: "03 // Reading Traffic: tcpdump, Wireshark, and the pcap File",
    summary: "How to capture packets, where capture works (and silently doesn't), and how to filter a million packets down to the one that matters.",
    content: `
      <h2>The analyst's microscope</h2>
      <p>To see traffic you put a network interface into <strong>promiscuous (or monitor) mode</strong> and record what crosses it. The recording is saved as a <strong>pcap</strong> ("packet capture") file — the universal, tool-independent format you'll be handed in investigations. Two tools dominate: <strong>tcpdump</strong> (command line, lightweight, perfect for servers) and <strong>Wireshark</strong> (graphical, deep protocol dissection).</p>

      <h3>Capturing with tcpdump</h3>
      <p>tcpdump prints and/or saves packets matching a filter. A few foundational commands:</p>
      <pre><code># List capture interfaces
tcpdump -D

# Capture on eth0 and write a pcap for later analysis
tcpdump -i eth0 -w capture.pcap

# Read a saved pcap back
tcpdump -r capture.pcap

# Only DNS traffic (UDP port 53), don't resolve names (-n keeps it fast/clear)
tcpdump -n -i eth0 udp port 53</code></pre>
      <p>Those filter words (<code>udp</code>, <code>port 53</code>, <code>host 192.168.1.5</code>) are <strong>BPF (Berkeley Packet Filter)</strong> <em>capture filters</em> — applied at capture time so you record only what you want and save disk and CPU.</p>

      <h3>The detail beginners miss: where can you even capture?</h3>
      <blockquote>On an old <em>hub</em>, every port saw all traffic. On a modern <strong>switch</strong>, the switch sends each frame only to the destination port. So a sniffer plugged into a switch sees its <em>own</em> traffic plus broadcasts — and almost nothing else. To monitor others you need a deliberate <strong>SPAN/mirror port</strong> or a network <strong>TAP</strong>… or an attacker is actively spoofing to redirect traffic to themselves (Lesson 5). If your capture is empty, this is usually why.</blockquote>

      <h3>Wireshark: capture vs display filters</h3>
      <p>Wireshark distinguishes two filter types, and confusing them is a classic mistake:</p>
      <table>
        <thead><tr><th></th><th>Capture filter</th><th>Display filter</th></tr></thead>
        <tbody>
          <tr><td>Syntax</td><td>BPF (<code>tcp port 80</code>)</td><td>Wireshark (<code>http</code>, <code>ip.addr == 192.168.1.5</code>)</td></tr>
          <tr><td>When applied</td><td>At capture — discards non-matching packets forever</td><td>After capture — just hides them from view</td></tr>
          <tr><td>Use when</td><td>You want a small, focused capture</td><td>You captured everything and now want to drill in</td></tr>
        </tbody>
      </table>
      <p>Useful display filters you'll reach for constantly:</p>
      <pre><code>ip.addr == 192.168.1.5          # any traffic to/from this host
tcp.port == 443                 # HTTPS
dns                             # all DNS
http.request.method == "GET"    # only HTTP GETs
tcp.flags.syn == 1 && tcp.flags.ack == 0   # bare SYNs (scan/handshake start)
arp                             # ARP chatter (watch for spoofing)</code></pre>

      <h3>Follow the stream</h3>
      <p>Wireshark's <em>Follow TCP/UDP Stream</em> reassembles a whole conversation from its scattered packets into one readable view — invaluable for unencrypted protocols. For encrypted streams you'll see only the handshake metadata and ciphertext, which is the honest reality of modern capture.</p>

      <blockquote>Workflow discipline: <strong>capture broad, filter narrow.</strong> Record with a sensible BPF filter, then use display filters to iterate toward the one conversation that explains the incident. Each filter should shrink the data and sharpen the meaning.</blockquote>
    `,
    quizzes: [
      { id: "net-l3-q1", question: "What is a pcap file?", options: ["A firewall rule set", "A saved packet capture in a universal, tool-independent format", "An encryption key", "A type of cable"], correctAnswerIndex: 1, explanation: "A pcap is the standard packet-capture file format used by tcpdump, Wireshark, and most analysis tools." },
      { id: "net-l3-q2", question: "Which command captures on eth0 and writes packets to a file?", options: ["tcpdump -r capture.pcap", "tcpdump -i eth0 -w capture.pcap", "tcpdump -D", "tcpdump --delete eth0"], correctAnswerIndex: 1, explanation: "-i eth0 selects the interface and -w writes the captured packets to a pcap file." },
      { id: "net-l3-q3", question: "On a modern switched network, what does a passive sniffer normally see?", options: ["All traffic from every host automatically", "Mostly its own traffic plus broadcasts, unless a SPAN/TAP or attack is present", "Only encrypted packets", "Nothing, ever"], correctAnswerIndex: 1, explanation: "Switches forward frames only to the destination port, so a sniffer needs a mirror/SPAN port or TAP to see others' traffic." },
      { id: "net-l3-q4", question: "What is a BPF expression like 'udp port 53' used for?", options: ["Encrypting DNS", "A capture filter applied at capture time to record only matching packets", "Blocking an IP at the firewall", "Renaming an interface"], correctAnswerIndex: 1, explanation: "Berkeley Packet Filter expressions are capture filters that limit what tcpdump/Wireshark record." },
      { id: "net-l3-q5", question: "How does a Wireshark display filter differ from a capture filter?", options: ["They are identical", "A display filter only hides packets after capture; a capture filter discards them at capture time", "Display filters encrypt traffic", "Capture filters run only on Windows"], correctAnswerIndex: 1, explanation: "Capture filters permanently drop non-matching packets; display filters merely hide already-captured packets from view." },
      { id: "net-l3-q6", question: "Which Wireshark display filter shows all DNS traffic?", options: ["dns", "port 53 only", "udp.delete", "ip.dns == true"], correctAnswerIndex: 0, explanation: "The display filter 'dns' shows all DNS packets regardless of transport." },
      { id: "net-l3-q7", question: "What does Wireshark's 'Follow TCP Stream' do?", options: ["Deletes a conversation", "Reassembles a whole conversation's packets into one readable view", "Encrypts the stream", "Blocks the source IP"], correctAnswerIndex: 1, explanation: "Follow Stream stitches scattered packets of one conversation together — very useful for unencrypted protocols." },
      { id: "net-l3-q8", question: "What is the recommended capture workflow discipline?", options: ["Capture nothing, guess", "Capture broad with a sensible filter, then narrow with display filters", "Always capture every packet on the internet", "Only use display filters at capture time"], correctAnswerIndex: 1, explanation: "Capture broad then filter narrow: record sensibly, then iterate with display filters toward the key conversation." },
    ],
  },

  // ── LESSON 4 ───────────────────────────────────────────────────────────────
  {
    title: "04 // Core Protocols and Where They're Weak: ARP, DNS, HTTP, TLS",
    summary: "The everyday protocols that make networks work — and the trust assumptions that attackers exploit in each.",
    content: `
      <h2>Trust is the vulnerability</h2>
      <p>Most network attacks don't break cryptography — they abuse a protocol that <em>trusts too much</em>. Learn what each core protocol assumes, and its weakness becomes obvious.</p>

      <h3>ARP — trusts any answer (Layer 2)</h3>
      <p><strong>ARP (Address Resolution Protocol)</strong> maps an IP address to a MAC address on the local network. A host shouts "who has 192.168.1.1?" and whoever replies "me, here's my MAC" is believed — <em>with no authentication whatsoever</em>. There is no proof, no signature. That single design choice enables <strong>ARP spoofing</strong> (Lesson 5): an attacker simply answers for the gateway and traffic flows through them.</p>

      <h3>DNS — trusts the first reply (Layer 7, usually UDP/53)</h3>
      <p><strong>DNS</strong> turns names (<code>example.com</code>) into IP addresses. Classic DNS is unencrypted UDP on <strong>port 53</strong>, and clients generally accept the first valid-looking response. Weaknesses you'll see in traffic:</p>
      <ul>
        <li><strong>Spoofing / cache poisoning</strong> — a forged reply pointing a name at an attacker's IP.</li>
        <li><strong>DNS tunnelling</strong> — smuggling data in and out inside DNS queries/answers, abused for command-and-control and exfiltration (suspiciously long, high-entropy subdomains).</li>
        <li><strong>Visibility</strong> — even with encryption elsewhere, DNS is often plaintext, making it a goldmine for detecting what hosts are <em>trying</em> to reach.</li>
      </ul>
      <p>Encrypted variants exist: <strong>DoH (DNS over HTTPS, 443)</strong> and <strong>DoT (DNS over TLS, 853)</strong> protect privacy — but also blind defenders who relied on reading port-53 DNS.</p>

      <h3>HTTP vs HTTPS — plaintext vs protected (Layer 7)</h3>
      <table>
        <thead><tr><th></th><th>HTTP (port 80)</th><th>HTTPS (port 443)</th></tr></thead>
        <tbody>
          <tr><td>Confidentiality</td><td>None — fully readable on the wire</td><td>Encrypted by TLS</td></tr>
          <tr><td>Integrity</td><td>None — can be modified in transit</td><td>Protected — tampering detected</td></tr>
          <tr><td>Sniffer sees</td><td>URLs, headers, cookies, bodies</td><td>Mostly metadata (SNI, sizes, timing)</td></tr>
        </tbody>
      </table>
      <p>On public Wi-Fi, plain HTTP and DNS are trivially captured or modified — which is exactly why "always use HTTPS" became the rule.</p>

      <h3>TLS — what it protects, and what still leaks</h3>
      <p><strong>TLS (Transport Layer Security)</strong> wraps a protocol (giving you HTTPS, DoT, etc.) with encryption, integrity, and server authentication via <strong>certificates</strong>. The TLS handshake negotiates keys before any application data flows. But even TLS leaks <em>metadata</em> the analyst can use:</p>
      <ul>
        <li><strong>SNI (Server Name Indication)</strong> — historically sent in cleartext during the handshake, revealing the destination hostname even though the content is encrypted.</li>
        <li><strong>Certificate details</strong> — issuer, validity, subject (visible in older TLS versions / inspectable at proxies).</li>
        <li><strong>Sizes & timing</strong> — beaconing malware betrays itself by regular, fixed-size callouts even when encrypted.</li>
      </ul>

      <blockquote>The throughline: ARP trusts any answer, DNS trusts the first answer, HTTP trusts the network, and even TLS reveals <em>where</em> you're going if not <em>what</em> you say. Knowing each trust assumption tells you both how the attack works and where the detection lives.</blockquote>
    `,
    quizzes: [
      { id: "net-l4-q1", question: "What does ARP map, and what's its core weakness?", options: ["Names to IPs; it's encrypted", "IP addresses to MAC addresses; replies are unauthenticated and simply believed", "Ports to processes; it requires a password", "MACs to certificates; it uses TLS"], correctAnswerIndex: 1, explanation: "ARP resolves IP→MAC on the LAN and accepts any reply without authentication, enabling spoofing." },
      { id: "net-l4-q2", question: "Traditional unencrypted DNS uses which port?", options: ["Port 22", "Port 53", "Port 80", "Port 443"], correctAnswerIndex: 1, explanation: "Classic DNS queries use UDP port 53." },
      { id: "net-l4-q3", question: "What is DNS tunnelling typically abused for?", options: ["Speeding up browsing", "Smuggling data for command-and-control or exfiltration inside DNS queries", "Encrypting the LAN", "Assigning IP addresses"], correctAnswerIndex: 1, explanation: "DNS tunnelling hides data in queries/answers (often long, high-entropy subdomains) for C2 and exfiltration." },
      { id: "net-l4-q4", question: "What do DoH and DoT provide?", options: ["Faster ARP", "Encrypted DNS (over HTTPS/TLS), improving privacy but reducing port-53 visibility for defenders", "A new firewall", "Plaintext logging"], correctAnswerIndex: 1, explanation: "DoH (443) and DoT (853) encrypt DNS, protecting users but blinding defenders who read plaintext DNS." },
      { id: "net-l4-q5", question: "On the wire, what can a sniffer read from plain HTTP that it cannot read from HTTPS?", options: ["Nothing differs", "URLs, headers, cookies, and bodies (HTTP is plaintext; HTTPS is encrypted)", "Only the IP address", "The cable type"], correctAnswerIndex: 1, explanation: "HTTP is fully readable (URLs, headers, cookies, bodies); HTTPS encrypts the content, leaving mostly metadata." },
      { id: "net-l4-q6", question: "What does TLS provide?", options: ["Encryption, integrity, and server authentication via certificates", "Faster ARP resolution", "Plaintext transport", "IP address assignment"], correctAnswerIndex: 0, explanation: "TLS wraps a protocol with confidentiality, integrity, and certificate-based server authentication." },
      { id: "net-l4-q7", question: "Even with TLS, which metadata has historically revealed the destination hostname?", options: ["The TTL", "SNI (Server Name Indication) in the handshake", "The MAC address", "The HTTP body"], correctAnswerIndex: 1, explanation: "SNI was historically sent in cleartext during the handshake, exposing the destination hostname." },
      { id: "net-l4-q8", question: "What is the unifying theme of these protocol weaknesses?", options: ["They all use port 22", "Each trusts too much — ARP any answer, DNS the first answer, HTTP the network — and metadata can still leak", "They are all encrypted by default", "None of them can be sniffed"], correctAnswerIndex: 1, explanation: "Attacks exploit excessive trust in each protocol, and even encrypted protocols leak useful metadata." },
    ],
  },

  // ── LESSON 5 ───────────────────────────────────────────────────────────────
  {
    title: "05 // Network Attacks: Sniffing, ARP Spoofing/MITM, Scanning, and DoS",
    summary: "How the major network attacks work conceptually, and the exact traffic fingerprint each one leaves for you to detect.",
    content: `
      <h2>Know the attack to see the attack</h2>
      <p>This lesson is about <em>recognition</em>, not execution. For each attack you'll learn the mechanism and, crucially, the <strong>signature in the traffic</strong> that gives it away.</p>

      <h3>Sniffing / eavesdropping (T1040)</h3>
      <p><strong>Passive sniffing</strong> is simply capturing traffic that isn't yours. On a switch this normally fails (Lesson 3), which is why attackers escalate to an <em>active</em> technique to redirect traffic to themselves. Passive sniffing leaves almost no trace by design — defence is mostly <strong>encryption</strong> (so captured traffic is useless) and physical/port security.</p>

      <h3>ARP spoofing → Man-in-the-Middle (T1557)</h3>
      <p>Because ARP believes any reply (Lesson 4), an attacker on the LAN sends <strong>forged ARP replies</strong> claiming "the gateway's IP is at my MAC." Victims update their ARP tables and send the attacker traffic meant for the gateway. The attacker forwards it on (so nothing visibly breaks) while reading or modifying it in the middle — a <strong>Man-in-the-Middle (MITM)</strong> position. Detection fingerprint:</p>
      <ul>
        <li>A flood of unsolicited/<strong>gratuitous ARP</strong> replies on the LAN.</li>
        <li><strong>Two IPs mapping to one MAC</strong>, or one IP's MAC suddenly changing — the classic tell.</li>
        <li>Sudden appearance of plaintext that "shouldn't" be reaching one host.</li>
      </ul>
      <blockquote>This is the course's headline scenario: a host broadcasting fake gateway routes and redirecting DNS. The fix is to identify the spoofing source and drop it. Defences include <strong>Dynamic ARP Inspection (DAI)</strong> and static ARP entries for critical gateways.</blockquote>

      <h3>Port & network scanning (T1595 / T1046)</h3>
      <p>Before attacking, adversaries <strong>map</strong> the network — which hosts are alive, which ports are open. Common conceptual types and their fingerprints:</p>
      <table>
        <thead><tr><th>Scan type</th><th>Idea</th><th>Traffic fingerprint</th></tr></thead>
        <tbody>
          <tr><td>TCP connect</td><td>Completes the full handshake</td><td>Full SYN→SYN-ACK→ACK to many ports</td></tr>
          <tr><td>SYN ("half-open")</td><td>Sends SYN, never finishes</td><td>Many SYNs, no completing ACK; RSTs back from closed ports</td></tr>
          <tr><td>Sweep</td><td>One port across many hosts</td><td>Same port probed across a whole subnet</td></tr>
        </tbody>
      </table>
      <p>The universal signature of scanning is <strong>one source touching many destinations/ports in a short time</strong> — fan-out. Tools like <code>nmap</code> are the canonical scanners; you recognise their pattern, you don't need to run them to defend.</p>

      <h3>Denial of Service (DoS / DDoS) (T1498 / T1499)</h3>
      <p>A <strong>DoS</strong> attack aims to make a service unavailable by exhausting a resource. A <strong>SYN flood</strong> sends a torrent of SYNs and never completes the handshake, filling the server's connection table with half-open connections. A <strong>DDoS</strong> uses many sources at once, often a botnet. Fingerprints:</p>
      <ul>
        <li>Sudden spike in traffic volume or connection rate far above baseline.</li>
        <li>Huge numbers of half-open TCP connections (SYN flood) or floods of UDP/ICMP.</li>
        <li>Often spoofed source IPs, so you can't simply block one address.</li>
      </ul>
      <p>Defences: rate limiting, <strong>SYN cookies</strong> (so the server doesn't hold state for half-open connections), upstream scrubbing, and provider-level DDoS protection.</p>

      <blockquote>Pattern to internalise: <strong>sniffing</strong> hides, <strong>spoofing</strong> redirects, <strong>scanning</strong> fans out, <strong>DoS</strong> floods. Each maps to a distinct traffic shape — recognising the shape is detection.</blockquote>
    `,
    quizzes: [
      { id: "net-l5-q1", question: "Why does passive sniffing usually fail on a switched network?", options: ["Switches encrypt all traffic", "Switches forward frames only to the destination port, so the sniffer sees little else", "Sniffers are illegal on switches", "Switches have no ports"], correctAnswerIndex: 1, explanation: "A switch sends each frame only to its destination port, so a passive sniffer sees mainly its own traffic and broadcasts." },
      { id: "net-l5-q2", question: "How does ARP spoofing enable a Man-in-the-Middle position?", options: ["By cracking TLS", "By sending forged ARP replies so victims send the attacker traffic meant for the gateway", "By flooding port 443", "By disabling DNS"], correctAnswerIndex: 1, explanation: "Forged ARP replies poison victims' ARP tables, routing their traffic through the attacker, who relays it while reading/altering it." },
      { id: "net-l5-q3", question: "Which is a classic detection tell for ARP spoofing?", options: ["Two different IPs mapping to the same MAC address", "A single failed DNS query", "High CPU on the web server", "An expired TLS certificate"], correctAnswerIndex: 0, explanation: "Two IPs sharing one MAC (or an IP's MAC suddenly changing) is the hallmark of ARP cache poisoning." },
      { id: "net-l5-q4", question: "What is the universal traffic signature of port/network scanning?", options: ["One source touching many destinations or ports in a short time (fan-out)", "A single long-lived TLS session", "No traffic at all", "Only ARP replies"], correctAnswerIndex: 0, explanation: "Scanning produces fan-out: one source probing many hosts/ports rapidly." },
      { id: "net-l5-q5", question: "What characterises a SYN ('half-open') scan in the capture?", options: ["Completed handshakes to one port", "Many SYNs that never complete, with RSTs returned from closed ports", "Only UDP packets", "Encrypted payloads"], correctAnswerIndex: 1, explanation: "A SYN scan sends SYNs without finishing the handshake; closed ports reply with RST, open ports with SYN-ACK." },
      { id: "net-l5-q6", question: "How does a SYN flood cause denial of service?", options: ["By guessing passwords", "By sending many SYNs that never complete, exhausting the server's half-open connection table", "By encrypting the server's disk", "By spoofing DNS only"], correctAnswerIndex: 1, explanation: "A SYN flood fills the connection table with half-open connections, exhausting resources so legitimate clients can't connect." },
      { id: "net-l5-q7", question: "What defence lets a server avoid holding state for half-open connections during a SYN flood?", options: ["ARP spoofing", "SYN cookies", "Disabling TCP entirely", "Port 53 filtering"], correctAnswerIndex: 1, explanation: "SYN cookies let the server validate the handshake without allocating state, blunting SYN floods." },
      { id: "net-l5-q8", question: "Which mapping of attack to behaviour is correct?", options: ["Sniffing floods, DoS hides", "Sniffing hides, spoofing redirects, scanning fans out, DoS floods", "Scanning encrypts, spoofing scans", "All four flood the network identically"], correctAnswerIndex: 1, explanation: "Each attack has a distinct traffic shape: sniffing hides, spoofing redirects, scanning fans out, DoS floods." },
    ],
  },

  // ── LESSON 6 ───────────────────────────────────────────────────────────────
  {
    title: "06 // Firewalls and Network Segmentation",
    summary: "How firewalls decide what passes, the stateful-vs-stateless distinction, DROP vs REJECT, and why segmentation contains attackers.",
    content: `
      <h2>Deciding what is allowed to travel</h2>
      <p>A <strong>firewall</strong> enforces policy on traffic crossing a boundary: it inspects packets against rules and permits or blocks them. It is the primary tool for both <em>preventing</em> unwanted connections and <em>containing</em> an attacker you've discovered.</p>

      <h3>Stateless vs stateful — the key distinction</h3>
      <table>
        <thead><tr><th></th><th>Stateless (packet filter)</th><th>Stateful</th></tr></thead>
        <tbody>
          <tr><td>What it sees</td><td>Each packet in isolation</td><td>The whole connection / conversation</td></tr>
          <tr><td>Return traffic</td><td>You must allow it explicitly</td><td>Allowed automatically if part of an established connection</td></tr>
          <tr><td>Strength</td><td>Fast, simple</td><td>Smarter, prevents many spoofed/out-of-state packets</td></tr>
        </tbody>
      </table>
      <p>A <strong>stateful</strong> firewall remembers "this client opened a connection to the web server," so the server's replies are allowed without a second rule. This is why "allow port 80 inbound" alone often breaks things on a stateless filter — the <em>return</em> traffic is the hard part. Modern firewalls track connection state by default.</p>

      <h3>Rules, order, and default-deny</h3>
      <p>Rules are evaluated top-to-bottom; the first match wins. The single most important policy principle:</p>
      <blockquote><strong>Default deny.</strong> Block everything, then explicitly allow only what's needed. An allowlist (deny-by-default) is vastly safer than a blocklist (allow-by-default), because you can't enumerate every bad thing — but you <em>can</em> enumerate the few good things.</blockquote>

      <h3>DROP vs REJECT — a question you'll be asked</h3>
      <table>
        <thead><tr><th></th><th>DROP</th><th>REJECT</th></tr></thead>
        <tbody>
          <tr><td>Attacker sees</td><td>Nothing — a timeout</td><td>An explicit "connection refused" (RST/ICMP)</td></tr>
          <tr><td>Reveals the firewall?</td><td>No — looks like a dead host</td><td>Yes — confirms something is filtering</td></tr>
          <tr><td>Best for</td><td>Hostile/external sources (waste their time, reveal nothing)</td><td>Internal misconfigurations (fast, polite failure)</td></tr>
        </tbody>
      </table>
      <p>Conceptually, blocking our spoofing host means a rule that <em>drops</em> traffic from its address/interface — silently discarding its packets so it gets no feedback about your defences.</p>

      <h3>Segmentation: don't make the inside flat</h3>
      <p>A flat network — where every device can reach every other — lets an attacker who lands on one host move freely to all the rest (<strong>lateral movement</strong>). <strong>Segmentation</strong> divides the network into zones with controlled boundaries:</p>
      <ul>
        <li><strong>VLANs</strong> — logically separate groups (e.g. guest Wi-Fi vs finance) so they can't directly talk without crossing a controlled point.</li>
        <li><strong>DMZ</strong> — a buffer zone for internet-facing servers, isolated from the internal network so a compromised web server can't reach the database directly.</li>
        <li><strong>Micro-segmentation / zero trust</strong> — even internal traffic is filtered and verified; nothing is trusted just for being "inside."</li>
      </ul>
      <p>Segmentation turns one big blast radius into many small, contained ones. It is one of the highest-impact defensive designs precisely because it limits how far an intrusion can spread.</p>

      <blockquote>Two halves of firewalling: at the <strong>perimeter</strong>, decide what enters; <strong>internally</strong>, segment so a single compromise can't become a network-wide one. The best networks assume something will get in and limit what it can reach.</blockquote>
    `,
    quizzes: [
      { id: "net-l6-q1", question: "What does a firewall fundamentally do?", options: ["Encrypts all disks", "Inspects traffic against rules and permits or blocks it at a boundary", "Assigns MAC addresses", "Speeds up DNS"], correctAnswerIndex: 1, explanation: "A firewall enforces policy on traffic crossing a boundary, allowing or denying packets per its rules." },
      { id: "net-l6-q2", question: "How does a stateful firewall differ from a stateless one?", options: ["It is slower and dumber", "It tracks whole connections, so return traffic of an established connection is allowed automatically", "It only works on UDP", "It cannot block anything"], correctAnswerIndex: 1, explanation: "Stateful firewalls remember connection state and allow return traffic for established connections without extra rules." },
      { id: "net-l6-q3", question: "On a stateless filter, why does 'allow port 80 inbound' alone often break things?", options: ["Port 80 is illegal", "The return traffic isn't automatically allowed and must be permitted explicitly", "Stateless filters encrypt traffic", "Port 80 requires TLS"], correctAnswerIndex: 1, explanation: "Stateless filters see each packet alone, so the connection's return traffic needs its own explicit rule." },
      { id: "net-l6-q4", question: "What is the 'default deny' principle?", options: ["Allow everything, block known-bad", "Block everything, then explicitly allow only what's needed", "Deny all traffic permanently", "Let the attacker choose the rules"], correctAnswerIndex: 1, explanation: "Default deny (allowlisting) blocks all traffic and permits only the small set that is required — far safer than blocklisting." },
      { id: "net-l6-q5", question: "For an external hostile source, which action is generally preferred and why?", options: ["REJECT, to be polite", "DROP, to waste their time on timeouts and reveal nothing about your defences", "ACCEPT, to monitor them", "Disable the firewall"], correctAnswerIndex: 1, explanation: "DROP silently discards packets, giving the attacker no feedback and consuming their time on timeouts." },
      { id: "net-l6-q6", question: "What does network segmentation primarily limit?", options: ["Internet speed", "Lateral movement — how far an attacker can spread after compromising one host", "The number of users", "DNS queries"], correctAnswerIndex: 1, explanation: "Segmentation divides the network into zones, containing an intrusion so it can't spread freely across all hosts." },
      { id: "net-l6-q7", question: "What is a DMZ used for?", options: ["Storing backups only", "A buffer zone isolating internet-facing servers from the internal network", "Encrypting ARP", "Replacing the firewall"], correctAnswerIndex: 1, explanation: "A DMZ isolates public-facing servers so a compromised one can't directly reach internal systems like the database." },
      { id: "net-l6-q8", question: "What is the core idea of zero trust / micro-segmentation?", options: ["Trust everything inside the perimeter", "Filter and verify even internal traffic; nothing is trusted just for being 'inside'", "Remove all firewalls", "Use only stateless filtering"], correctAnswerIndex: 1, explanation: "Zero trust verifies and filters internal traffic too, abandoning the assumption that 'inside' equals safe." },
    ],
  },

  // ── LESSON 7 ───────────────────────────────────────────────────────────────
  {
    title: "07 // IDS, IPS, and Signatures: Snort, Suricata, and Zeek",
    summary: "Detection vs prevention, signature vs anomaly approaches, and how to read and reason about a real network rule.",
    content: `
      <h2>Automating the watch</h2>
      <p>You can't read every packet by hand. A <strong>network IDS/IPS</strong> watches traffic automatically and alerts (or blocks) when it matches known-bad patterns. Two letters change everything:</p>
      <table>
        <thead><tr><th></th><th>IDS (Detection)</th><th>IPS (Prevention)</th></tr></thead>
        <tbody>
          <tr><td>Placement</td><td>Out-of-band, watches a copy (SPAN/TAP)</td><td>In-line, traffic flows through it</td></tr>
          <tr><td>Action</td><td>Alerts only — passive</td><td>Can drop/block the traffic in real time</td></tr>
          <tr><td>Risk</td><td>Sees an attack after it passes</td><td>A false positive can break legitimate traffic; it's a single point in the path</td></tr>
        </tbody>
      </table>
      <p>An <strong>IPS is just an IDS placed in-line with the power to block.</strong> The trade-off is real: prevention is stronger, but a bad rule on an IPS can take down production.</p>

      <h3>Two detection philosophies</h3>
      <ul>
        <li><strong>Signature-based</strong> — match traffic against known patterns ("this byte sequence is malware X"). Precise, low false positives, but blind to anything novel (zero-days).</li>
        <li><strong>Anomaly-based</strong> — learn a baseline of "normal" and flag deviations. Can catch unknown attacks, but generates more false positives and needs a good baseline.</li>
      </ul>

      <h3>The major tools</h3>
      <table>
        <thead><tr><th>Tool</th><th>What it is</th></tr></thead>
        <tbody>
          <tr><td><strong>Snort</strong></td><td>The classic open-source signature IDS/IPS; its rule language is an industry reference.</td></tr>
          <tr><td><strong>Suricata</strong></td><td>Modern, multi-threaded, Snort-rule compatible; also extracts files and protocol metadata.</td></tr>
          <tr><td><strong>Zeek (formerly Bro)</strong></td><td>Not signature-first — it turns traffic into rich connection/protocol <em>logs</em> (conn.log, dns.log, http.log) for analysis and hunting.</td></tr>
        </tbody>
      </table>

      <h3>Reading a Snort/Suricata rule</h3>
      <p>You should be able to read a rule even before you can write one. Anatomy:</p>
      <pre><code>alert tcp any any -> $HOME_NET 22 (msg:"SSH connection attempt"; \\
  flow:to_server; sid:1000001; rev:1;)</code></pre>
      <ul>
        <li><strong>alert</strong> — the action (could be drop/reject on an IPS).</li>
        <li><strong>tcp any any -&gt; $HOME_NET 22</strong> — protocol, then source IP/port → destination IP/port (here, anything to our network on port 22).</li>
        <li><strong>msg</strong> — the human-readable alert text.</li>
        <li><strong>sid / rev</strong> — a unique signature ID and its revision.</li>
      </ul>
      <p>A more behavioural example detects a port-scan-like fan-out by counting events:</p>
      <pre><code>alert tcp any any -> $HOME_NET any (msg:"Possible SYN scan"; \\
  flags:S; threshold:type both, track by_src, count 20, seconds 5; \\
  sid:1000002; rev:1;)</code></pre>
      <p>This fires when one source sends 20+ bare-SYN packets in 5 seconds — encoding the "fan-out" idea from Lesson 5 as a rule.</p>

      <h3>Beyond packets: NetFlow and metadata</h3>
      <p>At large scale, storing every packet is impractical. <strong>NetFlow / IPFIX</strong> records connection <em>summaries</em> (who talked to whom, ports, bytes, duration) instead of full payloads. It's cheaper, encryption-proof (it's metadata), and excellent for spotting beaconing and exfiltration by volume and rhythm.</p>

      <blockquote>The discipline here is the same as everywhere in detection: signatures are precise but blind to the new; anomaly detection is broad but noisy. Real defence layers both, and the analyst's daily work is <strong>tuning</strong> rules to cut false positives without going blind.</blockquote>
    `,
    quizzes: [
      { id: "net-l7-q1", question: "What is the key difference between an IDS and an IPS?", options: ["An IDS blocks traffic; an IPS only logs", "An IDS detects and alerts (passive); an IPS sits in-line and can block in real time", "They are identical", "An IPS works only on UDP"], correctAnswerIndex: 1, explanation: "An IDS alerts out-of-band; an IPS is in-line and can actively drop/block traffic." },
      { id: "net-l7-q2", question: "What is a risk specific to an IPS that an IDS doesn't share?", options: ["It can never block attacks", "Being in-line, a false positive can break legitimate traffic", "It cannot read packets", "It only runs on Windows"], correctAnswerIndex: 1, explanation: "Because the IPS is in the traffic path, a bad rule or false positive can drop legitimate traffic and cause outages." },
      { id: "net-l7-q3", question: "How does signature-based detection differ from anomaly-based?", options: ["Signature matches known patterns (precise, blind to novel); anomaly flags deviations from baseline (catches unknowns, noisier)", "They are the same", "Anomaly detection only matches exact byte strings", "Signature detection needs no rules"], correctAnswerIndex: 0, explanation: "Signatures match known-bad patterns precisely; anomaly detection flags deviations from a learned baseline, catching novel attacks but with more noise." },
      { id: "net-l7-q4", question: "Which tool turns traffic into rich connection/protocol logs rather than being signature-first?", options: ["Snort", "Suricata", "Zeek (formerly Bro)", "tcpdump"], correctAnswerIndex: 2, explanation: "Zeek generates structured logs (conn.log, dns.log, http.log) for analysis and hunting, rather than matching signatures first." },
      { id: "net-l7-q5", question: "In the rule 'alert tcp any any -> $HOME_NET 22', what does '22' specify?", options: ["The source port", "The destination port (SSH)", "The signature ID", "The number of packets"], correctAnswerIndex: 1, explanation: "The format is src -> dst; 22 is the destination port (SSH) on the protected network." },
      { id: "net-l7-q6", question: "What does the 'sid' field in a Snort/Suricata rule represent?", options: ["The source IP", "A unique signature ID for the rule", "The session duration", "The severity in dollars"], correctAnswerIndex: 1, explanation: "sid is the unique signature identifier; rev tracks its revision." },
      { id: "net-l7-q7", question: "What does NetFlow/IPFIX record?", options: ["Full packet payloads", "Connection summaries (who/whom, ports, bytes, duration) — metadata, not contents", "Encryption keys", "Firewall passwords"], correctAnswerIndex: 1, explanation: "Flow data summarises connections (metadata) cheaply and is unaffected by payload encryption, ideal for beaconing/exfil detection." },
      { id: "net-l7-q8", question: "What is the analyst's main day-to-day work with IDS/IPS rules?", options: ["Turning them all off", "Tuning rules to reduce false positives without going blind", "Writing malware", "Encrypting the alerts"], correctAnswerIndex: 1, explanation: "Tuning — cutting false positives while preserving real detections — is the core ongoing work of running an IDS/IPS." },
    ],
  },

  // ── LESSON 8 ───────────────────────────────────────────────────────────────
  {
    title: "08 // Detection in Practice: Baselines, Beaconing, and Investigating a Capture",
    summary: "Putting it together — establishing normal, spotting C2 beaconing and exfiltration, and walking a capture from alert to verdict.",
    content: `
      <h2>From tools to judgement</h2>
      <p>Capturing and rule-writing are mechanics. The skill is turning telemetry into a defensible verdict. That always starts with one question many beginners skip: <em>what is normal here?</em></p>

      <h3>Baselining: you can't spot abnormal without normal</h3>
      <p>Before you can call traffic suspicious, you must know this network's <strong>baseline</strong>:</p>
      <ul>
        <li><strong>Top talkers</strong> — which hosts normally send/receive the most.</li>
        <li><strong>Normal ports/protocols</strong> — what services legitimately run.</li>
        <li><strong>DNS volume and destinations</strong> — typical query rate and the names usually resolved.</li>
        <li><strong>Periodicity</strong> — backups and update checks are regular and benign; learning them stops false alarms.</li>
      </ul>
      <blockquote>A spike of traffic at 3am isn't automatically an attack — it might be the nightly backup. The same spike to an unknown host in another country, every 60 seconds, almost certainly is not. Baseline turns raw events into meaning.</blockquote>

      <h3>Beaconing: the heartbeat of command-and-control</h3>
      <p>Compromised hosts "phone home" to a command-and-control (C2) server. Even over HTTPS where you can't read content, <strong>beaconing</strong> betrays itself through <em>rhythm</em>:</p>
      <ul>
        <li>Connections to the same destination at <strong>regular intervals</strong> (e.g. every 30 or 60 seconds, sometimes with jitter).</li>
        <li><strong>Small, similar-sized</strong> requests — a check-in, not a download.</li>
        <li>Destinations that are newly-registered domains, odd TLDs, or raw IPs with no DNS.</li>
      </ul>
      <p>This is exactly why flow/metadata analysis matters: regularity and size survive encryption.</p>

      <h3>Exfiltration: data leaving in the wrong direction</h3>
      <p>Normal web browsing is <em>download-heavy</em>. A host suddenly <strong>uploading</strong> large volumes — especially to an unusual destination, or trickled out inside DNS queries (tunnelling, Lesson 4) — is a classic data-theft fingerprint. Watch the <em>direction and volume</em>, not just the destination.</p>

      <h3>Walking a capture: a repeatable method</h3>
      <ol>
        <li><strong>Scope</strong> — what's the time window, and which hosts/IPs are involved? Confirm timestamps and timezone first.</li>
        <li><strong>Triage the protocols</strong> — Wireshark's <em>Statistics → Protocol Hierarchy</em> and <em>Conversations</em> show what's there and who's talking.</li>
        <li><strong>Filter to the anomaly</strong> — drill in with display filters (e.g. <code>arp</code> for spoofing, <code>dns</code> for redirection, bare SYNs for scans).</li>
        <li><strong>Follow the stream</strong> — reconstruct the conversation if it's unencrypted; read metadata if it's not.</li>
        <li><strong>Enrich</strong> — GeoIP and reputation on the suspect IP/domain; is it known-bad?</li>
        <li><strong>Conclude and document</strong> — state the finding, the evidence (the exact filter and packets), and the recommended action.</li>
      </ol>

      <h3>The course scenario, the practitioner's way</h3>
      <p>Faced with a capture where a host floods gratuitous ARP and probes DNS redirection: filter <code>arp</code>, see one MAC claiming the gateway's IP, confirm the same source sending UDP/53 redirection probes, identify the source IP, and recommend a drop rule on that interface. That is the whole arc — capture, filter, identify, contain — done with judgement, not guesswork.</p>

      <blockquote>The mindset: <strong>context changes everything.</strong> The same connection can be a benign backup or a beacon depending on the host, the destination, and the rhythm. Always establish normal, then explain the deviation with evidence.</blockquote>
    `,
    quizzes: [
      { id: "net-l8-q1", question: "Why is establishing a baseline essential before calling traffic suspicious?", options: ["It encrypts the traffic", "You can only recognise abnormal against a known 'normal' for this network", "It blocks all attackers automatically", "Baselines are legally required"], correctAnswerIndex: 1, explanation: "Without knowing normal top talkers, ports, and rhythms, you can't reliably judge what's anomalous." },
      { id: "net-l8-q2", question: "A traffic spike at 3am to a known internal backup server most likely is…", options: ["Definitely an attack", "Likely benign — the nightly backup, explainable by baseline", "Proof of ARP spoofing", "A SYN flood"], correctAnswerIndex: 1, explanation: "Baseline context (a scheduled backup) explains the spike; not every off-hours spike is malicious." },
      { id: "net-l8-q3", question: "What is beaconing in the context of C2?", options: ["A lighthouse protocol", "Regular, similar-sized connections to a destination — a compromised host phoning home", "Encrypting the LAN", "A type of firewall rule"], correctAnswerIndex: 1, explanation: "Beaconing is the regular check-in rhythm of a compromised host to its command-and-control server." },
      { id: "net-l8-q4", question: "Why can beaconing be detected even over HTTPS?", options: ["HTTPS is actually plaintext", "Regular timing and consistent small sizes (metadata) survive encryption", "The attacker disables encryption", "Beaconing only uses HTTP"], correctAnswerIndex: 1, explanation: "Even when content is encrypted, the rhythm and size of connections (metadata) reveal beaconing." },
      { id: "net-l8-q5", question: "Which traffic pattern is a classic exfiltration fingerprint?", options: ["A host downloading a web page", "A host suddenly uploading large volumes to an unusual destination", "A successful DNS lookup", "An idle connection"], correctAnswerIndex: 1, explanation: "Browsing is download-heavy; large outbound uploads to odd destinations suggest data theft — watch direction and volume." },
      { id: "net-l8-q6", question: "What should you confirm first when scoping a capture?", options: ["The cable colour", "The time window and timestamps/timezone of the events", "The attacker's name", "The firewall vendor"], correctAnswerIndex: 1, explanation: "Confirming the time window and timezone keeps your timeline and conclusions accurate from the start." },
      { id: "net-l8-q7", question: "Which Wireshark feature quickly shows what protocols and conversations exist in a capture?", options: ["Statistics → Protocol Hierarchy / Conversations", "File → Quit", "Edit → Find Packet only", "View → Colorize once"], correctAnswerIndex: 0, explanation: "Protocol Hierarchy and Conversations summarise what's present and who's talking, guiding where to drill in." },
      { id: "net-l8-q8", question: "In the course scenario, which filter best confirms gateway ARP spoofing?", options: ["http.request", "arp (then look for one MAC claiming the gateway's IP)", "tcp.port == 443", "icmp only"], correctAnswerIndex: 1, explanation: "Filtering 'arp' reveals a single MAC asserting the gateway's IP — the spoofing tell — to then identify and block the source." },
    ],
  },

  // ── LESSON 9 ───────────────────────────────────────────────────────────────
  {
    title: "09 // Mapping Network Attacks to MITRE ATT&CK",
    summary: "Speaking the industry's shared language — mapping each stage of a network intrusion to ATT&CK tactics and techniques.",
    content: `
      <h2>A shared map of attacker behaviour</h2>
      <p><strong>MITRE ATT&CK</strong> is a free, globally-used knowledge base cataloguing real attacker behaviours. It's organised as <strong>tactics</strong> (the attacker's goal — the "why") containing <strong>techniques</strong> (how they achieve it — the "how"), each with an ID like <code>T1557</code>. When every analyst maps detections to ATT&CK, the whole industry speaks one language.</p>

      <h3>Tactics vs techniques</h3>
      <ul>
        <li><strong>Tactic</strong> = the objective, e.g. <em>Reconnaissance</em> or <em>Command and Control</em>. The columns of the matrix.</li>
        <li><strong>Technique</strong> = a specific method, e.g. <em>T1557 Adversary-in-the-Middle</em>, with sub-techniques refining further (T1557.002 ARP Cache Poisoning).</li>
      </ul>

      <h3>Mapping a network intrusion end to end</h3>
      <table>
        <thead><tr><th>Stage of the attack</th><th>ATT&CK Tactic</th><th>Technique</th></tr></thead>
        <tbody>
          <tr><td>Scanning for live hosts and open ports</td><td>Reconnaissance</td><td>T1595 Active Scanning</td></tr>
          <tr><td>Mapping internal services after access</td><td>Discovery</td><td>T1046 Network Service Discovery</td></tr>
          <tr><td>Capturing traffic on the wire</td><td>Collection / Credential Access</td><td>T1040 Network Sniffing</td></tr>
          <tr><td>ARP spoofing to intercept LAN traffic</td><td>Collection / Credential Access</td><td>T1557 Adversary-in-the-Middle</td></tr>
          <tr><td>Beaconing / data tunnelled over a protocol</td><td>Command and Control</td><td>T1071 Application Layer Protocol (e.g. T1071.004 DNS)</td></tr>
          <tr><td>Flooding to take a service offline</td><td>Impact</td><td>T1498/T1499 Network/Endpoint DoS</td></tr>
        </tbody>
      </table>
      <p>This course's coverage centres on <strong>Reconnaissance</strong> (scanning) and <strong>Command and Control</strong> (the spoofing/redirection scenario sits in the AiTM and C2 space) — exactly the early and persistent stages where network telemetry shines.</p>

      <h3>Why this matters in practice</h3>
      <ul>
        <li><strong>Communication</strong> — "we saw T1595 then T1557 on the LAN" is instantly understood by any analyst anywhere.</li>
        <li><strong>Coverage analysis</strong> — mapping your IDS/firewall/flow detections onto the matrix reveals blind spots.</li>
        <li><strong>Threat-informed defence</strong> — prioritise the techniques real adversaries targeting your sector actually use.</li>
        <li><strong>Reporting</strong> — leadership and auditors increasingly expect ATT&CK-mapped detection coverage.</li>
      </ul>

      <h3>Adversary-in-the-Middle: the quiet danger (T1557)</h3>
      <p>Once an attacker holds the MITM position via ARP spoofing, their traffic <em>looks like normal forwarding</em> — the victim still reaches the internet, so nothing obviously breaks. This is why the ARP-layer tells (one MAC for two IPs, gratuitous ARP floods) are your clearest signal: after interception is established, the attack hides inside ordinary-looking traffic.</p>

      <blockquote>Takeaway: think of an intrusion as a <strong>chain of tactics</strong> — recon → discovery → collection → C2 → impact. ATT&CK is the map; your packet captures, IDS rules, and flow data are the tripwires you place along it. Stopping the attacker at <em>any</em> stage defeats the chain.</blockquote>
    `,
    quizzes: [
      { id: "net-l9-q1", question: "What is MITRE ATT&CK?", options: ["A firewall product", "A free knowledge base cataloguing real attacker tactics and techniques", "An encryption algorithm", "A packet capture format"], correctAnswerIndex: 1, explanation: "ATT&CK is a globally-used, free knowledge base of adversary behaviours organised as tactics and techniques." },
      { id: "net-l9-q2", question: "Which ATT&CK technique covers ARP spoofing / Man-in-the-Middle?", options: ["T1595 Active Scanning", "T1557 Adversary-in-the-Middle", "T1071 Application Layer Protocol", "T1498 Network DoS"], correctAnswerIndex: 1, explanation: "T1557 Adversary-in-the-Middle covers interception techniques like ARP cache poisoning (T1557.002)." },
      { id: "net-l9-q3", question: "Scanning a network for live hosts and open ports maps to which technique?", options: ["T1040 Network Sniffing", "T1595 Active Scanning", "T1557 AiTM", "T1071 C2"], correctAnswerIndex: 1, explanation: "T1595 Active Scanning, under the Reconnaissance tactic, covers probing for hosts and open ports." },
      { id: "net-l9-q4", question: "Capturing traffic on the wire maps most directly to which technique?", options: ["T1040 Network Sniffing", "T1498 Network DoS", "T1046 Network Service Discovery", "T1595 Active Scanning"], correctAnswerIndex: 0, explanation: "T1040 Network Sniffing covers capturing traffic to harvest information or credentials." },
      { id: "net-l9-q5", question: "Beaconing or tunnelling data over DNS maps to which tactic/technique family?", options: ["Reconnaissance / T1595", "Command and Control / T1071 Application Layer Protocol", "Impact / T1499", "Discovery / T1046"], correctAnswerIndex: 1, explanation: "C2 over an application protocol (e.g. DNS, T1071.004) falls under Command and Control / T1071." },
      { id: "net-l9-q6", question: "What is the difference between a tactic and a technique?", options: ["They are synonyms", "A tactic is the attacker's goal (the why); a technique is a specific method (the how)", "A technique is the goal; a tactic is the method", "Tactics are tools, techniques are people"], correctAnswerIndex: 1, explanation: "Tactic = the objective; technique = the specific method to achieve it, e.g. T1557." },
      { id: "net-l9-q7", question: "Why map your detections onto the ATT&CK matrix?", options: ["To make pretty charts only", "To reveal coverage blind spots and communicate in a shared language", "To slow down the IDS", "It is legally required everywhere"], correctAnswerIndex: 1, explanation: "Mapping shows which techniques you can/can't detect and lets analysts communicate precisely about coverage." },
      { id: "net-l9-q8", question: "Why is catching ARP spoofing at the ARP-layer tells so important?", options: ["ARP is the only protocol", "Once the MITM position is established, the attacker's traffic looks like normal forwarding and hides", "ARP spoofing damages hardware", "It has no special importance"], correctAnswerIndex: 1, explanation: "After interception is set up, traffic still flows normally for the victim, so the early ARP anomalies are your clearest detection chance." },
    ],
  },

  // ── LESSON 10 ──────────────────────────────────────────────────────────────
  {
    title: "10 // Pitfalls, Interview Prep, and the Capstone",
    summary: "What learners get wrong, the questions you'll be asked, and a full walkthrough of the capture-to-containment capstone.",
    content: `
      <h2>The traps that catch beginners</h2>
      <p>You know the mechanics now. These are the mistakes that separate a shaky analyst from a trusted one — internalise them and you'll avoid most rookie errors.</p>
      <ul>
        <li><strong>Capturing the wrong place.</strong> Plugging a sniffer into a switch and seeing "no traffic," then blaming the tool. You need a SPAN/mirror port, a TAP, or to understand why an active attack is what's redirecting traffic in the first place.</li>
        <li><strong>Expecting plaintext.</strong> Assuming you'll read every payload. Most is TLS-encrypted; you analyse metadata (SNI, sizes, timing, DNS), not contents.</li>
        <li><strong>Timezones and clock drift.</strong> Building a timeline from captures whose timestamps disagree. Confirm time sync (NTP) and timezone before trusting event order.</li>
        <li><strong>No baseline.</strong> Calling normal beaconing (updates, backups) an attack, and missing the real beacon hiding in the noise. Learn normal first.</li>
        <li><strong>Confusing capture vs display filters.</strong> Setting a display filter and wondering why the capture is still "full," or capture-filtering away the very packets you needed.</li>
        <li><strong>Blocklist thinking.</strong> Trying to enumerate every bad host instead of default-deny allowlisting; and blocking a single spoofed IP during a DDoS that uses thousands.</li>
        <li><strong>One flat network.</strong> Assuming a perimeter firewall is enough while the inside is wide open to lateral movement.</li>
      </ul>

      <h3>Interview questions you should be able to answer</h3>
      <table>
        <thead><tr><th>Question</th><th>What a strong answer hits</th></tr></thead>
        <tbody>
          <tr><td>What is ARP spoofing?</td><td>Forged ARP replies map the attacker's MAC to a legitimate IP (e.g. the gateway), so LAN traffic flows through them for interception/MITM.</td></tr>
          <tr><td>DROP vs REJECT?</td><td>DROP silently discards (timeout, reveals nothing) — best for hostile sources; REJECT actively refuses — fine for internal misconfig.</td></tr>
          <tr><td>Stateful vs stateless firewall?</td><td>Stateful tracks connections so return traffic is auto-allowed; stateless judges each packet alone.</td></tr>
          <tr><td>IDS vs IPS?</td><td>IDS detects/alerts out-of-band; IPS sits in-line and can block — at the risk of breaking traffic on a false positive.</td></tr>
          <tr><td>How do you detect C2 if traffic is encrypted?</td><td>By metadata: regular beacon timing, consistent small sizes, odd destinations, DNS patterns — content isn't needed.</td></tr>
          <tr><td>Walk me through the TCP handshake.</td><td>SYN → SYN-ACK → ACK; explain how SYN scans and SYN floods abuse it.</td></tr>
        </tbody>
      </table>

      <h3>The capstone: capture → identify → contain</h3>
      <p>You're handed a pcap from a LAN where users report intermittent oddities. Work it methodically:</p>
      <ol>
        <li><strong>Scope.</strong> Note the time window; confirm timestamps and timezone.</li>
        <li><strong>Survey.</strong> <em>Statistics → Protocol Hierarchy</em> and <em>Conversations</em> to see what's present and who talks most.</li>
        <li><strong>Spot the anomaly.</strong> Filter <code>arp</code> — you find a host sending <strong>gratuitous ARP</strong> claiming the gateway's IP; its MAC now shadows the real gateway. Cross-check: the same source is emitting <strong>UDP/53 DNS redirection</strong> probes.</li>
        <li><strong>Confirm impact.</strong> Victims' DNS answers point a legitimate name at an attacker-controlled IP — a redirection, mapping to Adversary-in-the-Middle (T1557) and the DNS/C2 angle.</li>
        <li><strong>Identify the source.</strong> Pin the offending source IP (and its MAC) from the ARP and DNS frames.</li>
        <li><strong>Contain.</strong> Apply a localised <strong>drop rule</strong> on the router/switch for that source/interface — silently discarding its packets — and, longer term, enable Dynamic ARP Inspection and static gateway ARP entries.</li>
        <li><strong>Document.</strong> Write the finding, the exact filters used as evidence, the ATT&CK mapping, and the action taken. An undocumented investigation is an unrepeatable one.</li>
      </ol>

      <blockquote>Final reframe: every detection in this course exists because some protocol trusts too much or some segment is too flat. <strong>Detection and architecture are two halves of one job</strong> — see what crosses the wire, and shrink what is allowed to cross it. Master both and you're no longer reading packets; you're defending a network.</blockquote>
    `,
    quizzes: [
      { id: "net-l10-q1", question: "A sniffer on a switch shows almost no traffic. What's the most likely cause?", options: ["The tool is broken", "Switched networks need a SPAN/mirror port or TAP to see other hosts' traffic", "The network is offline", "The cable is too long"], correctAnswerIndex: 1, explanation: "Switches forward frames only to the destination port; visibility requires a SPAN/mirror port or TAP." },
      { id: "net-l10-q2", question: "Why is 'I'll just read all the payloads' a flawed plan today?", options: ["Payloads are illegal to read", "Most traffic is TLS-encrypted, so you analyse metadata, not contents", "Wireshark can't open pcaps", "Payloads don't exist"], correctAnswerIndex: 1, explanation: "Pervasive encryption means analysts rely on metadata (SNI, sizes, timing, DNS) rather than plaintext payloads." },
      { id: "net-l10-q3", question: "How do you concisely define ARP spoofing in an interview?", options: ["Cracking TLS certificates", "Sending forged ARP replies mapping the attacker's MAC to a legitimate IP (e.g. the gateway) to intercept LAN traffic", "Flooding port 443", "Scanning open ports"], correctAnswerIndex: 1, explanation: "Forged ARP replies bind the attacker's MAC to a real IP like the gateway, routing victims' traffic through them for MITM." },
      { id: "net-l10-q4", question: "Best one-line answer for 'DROP vs REJECT'?", options: ["They're identical", "DROP silently discards (timeout, reveals nothing) — good for hostile sources; REJECT actively refuses — fine for internal misconfig", "REJECT allows the packet", "DROP sends a refusal message"], correctAnswerIndex: 1, explanation: "DROP gives no feedback (timeout); REJECT explicitly refuses. DROP suits hostile sources; REJECT suits internal cases." },
      { id: "net-l10-q5", question: "How can you detect command-and-control even when traffic is encrypted?", options: ["You cannot at all", "By metadata: regular beacon timing, consistent small sizes, and odd destinations", "By decrypting TLS without keys", "By reading the HTTP body"], correctAnswerIndex: 1, explanation: "Beaconing reveals itself through rhythm and size — metadata that survives encryption." },
      { id: "net-l10-q6", question: "In the capstone, which display filter first exposes the gateway impersonation?", options: ["http", "arp", "tcp.port == 22", "icmp"], correctAnswerIndex: 1, explanation: "Filtering 'arp' surfaces the gratuitous ARP where one MAC claims the gateway's IP — the spoofing tell." },
      { id: "net-l10-q7", question: "After identifying the spoofing source, what is the correct containment step?", options: ["Reboot every host on the LAN", "Apply a localised drop rule for that source/interface, then enable DAI and static gateway ARP", "Email the attacker", "Disable the entire network permanently"], correctAnswerIndex: 1, explanation: "Drop the offending source's traffic to contain it, then harden with Dynamic ARP Inspection and static gateway entries." },
      { id: "net-l10-q8", question: "What is the final relationship between detection and architecture?", options: ["They are unrelated", "Two halves of one job: see what crosses the wire, and shrink what is allowed to cross it", "Architecture makes detection pointless", "Detection replaces all firewalls"], correctAnswerIndex: 1, explanation: "Good defence both observes traffic (detection) and limits what may traverse the network (architecture/segmentation)." },
    ],
  },
];
