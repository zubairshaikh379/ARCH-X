// ─────────────────────────────────────────────────────────────────────────────
// SCADA / ICS / OT SECURITY — DEEP GUIDEBOOK (textbook-grade ARCH-X course)
//
// Content is authored as SEMANTIC HTML and rendered inside `.md-content`
// (see src/index.css) — h2/h3/p/ul/ol/li/pre/code/table/blockquote/strong are
// all styled there, so lessons render correctly without relying on Tailwind
// class scanning.
//
// Structure mirrors a real syllabus: What is ICS → Field devices → Purdue model
// → IT vs OT priorities → Industrial protocols → IT/OT convergence → Threat
// case studies → Segmentation & the air-gap myth → OT monitoring & SIS →
// Defense frameworks (IEC 62443, ATT&CK for ICS). Each lesson ends with an
// 8-question knowledge check. Authorized-education framing: conceptual, safety-
// focused, defensive.
// ─────────────────────────────────────────────────────────────────────────────

import type { Course } from "../courses";

type Lesson = Course["lessons"][number];

// New optional Overview fields (spread into the scada-security course object).
export const META: Pick<
  Course,
  "prerequisites" | "learningOutcomes" | "mustKnow" | "commonGaps" | "prosCons" | "careerNotes"
> = {
  prerequisites: [
    "A working mental model of TCP/IP: IP addresses, ports, and the client→server request/response idea.",
    "Basic IT security literacy (what a firewall does, what 'authentication' means) — no ICS background required.",
    "Willingness to think about physical processes: pumps, valves, motors, and the sensors that watch them.",
    "No electrical-engineering degree needed — every industrial concept is built up from zero.",
  ],
  learningOutcomes: [
    "Explain what a PLC, RTU, HMI, DCS, and SCADA server each do, and how they fit together to run a physical process.",
    "Place any device onto the Purdue reference model and reason about which zone-crossing traffic is dangerous.",
    "Articulate why OT inverts IT's priorities — safety and availability first, confidentiality last — and what that changes.",
    "Read a Modbus or DNP3 exchange and explain why the protocol trusts any command it receives.",
    "Analyse Stuxnet, Triton, and Industroyer as case studies and map each to MITRE ATT&CK for ICS techniques.",
    "Design layered OT defences — segmentation, the IDMZ, passive monitoring, and safety instrumented systems — against IEC 62443.",
  ],
  mustKnow: [
    "PLC", "RTU", "HMI", "DCS", "SCADA server / historian", "Purdue Model (Levels 0–5)",
    "IDMZ", "Modbus", "DNP3", "OPC / OPC UA", "IT/OT convergence", "Safety Instrumented System (SIS)",
    "SIL", "Stuxnet", "Triton / TRISIS", "Industroyer / CRASHOVERRIDE", "Air-gap myth",
    "Passive network monitoring", "IEC 62443", "Zones & Conduits", "MITRE ATT&CK for ICS",
    "Availability > Integrity > Confidentiality",
  ],
  commonGaps: [
    "Treating OT like IT. Beginners bring IT reflexes — patch now, scan aggressively, reboot to fix — into environments where those exact actions can trip a turbine or void a safety case.",
    "Believing the air gap. Most 'isolated' plants have USB drives, vendor laptops, maintenance modems, and historian links crossing the boundary. The gap is a story people tell, not a wire that's cut.",
    "Confusing the SIS with the control system. The safety instrumented system is a separate last line of defence; when people let it share the control network (as in Triton), the last line becomes a target.",
    "Assuming protocols authenticate. Modbus, DNP3, and classic OPC were built for trusted serial links. On a routed network they will faithfully execute a shutdown command from anyone who can reach them.",
    "Downtime blindness. In IT, isolating a host is cheap. In OT, an unplanned stop can cost millions or endanger people, so 'just pull it off the network' is rarely a free move.",
    "Equipment lifespan. A PLC installed in 1998 may still be running. Detections and hardening must assume decades-old firmware that can never be patched, not this year's stack.",
  ],
  prosCons: {
    pros: [
      "OT defence protects the physical world — water, power, manufacturing — so the mission is unusually tangible and consequential.",
      "Passive monitoring is a natural fit: OT traffic is remarkably repetitive, so a good baseline makes anomalies stand out sharply.",
      "The skill set is scarce and in demand; blending IT security with process knowledge is rare and highly valued.",
    ],
    cons: [
      "You cannot freely test in production — a mistake can injure people or halt critical infrastructure, so labs and change control are mandatory.",
      "Legacy, unpatchable equipment means you often must compensate around a weakness you can never actually fix.",
      "Protocols and vendors are fragmented and proprietary; there is no single 'OT stack' to master once and reuse everywhere.",
    ],
  },
  careerNotes:
    "OT/ICS security sits at the intersection of cybersecurity and industrial engineering, and it is one of the fastest-growing and least-crowded corners of the field. Typical roles: OT Security Analyst, ICS Incident Responder, Control Systems Security Engineer, and OT SOC Analyst — often reached from either an IT-security background (adding process knowledge) or a controls/automation background (adding security). The flagship credential is the GIAC GICSP (Global Industrial Cyber Security Professional); GRID (GIAC Response and Industrial Defense) targets ICS threat hunting and IR, and vendor tracks from Dragos, Nozomi, and Claroty are common. Familiarity with the IEC 62443 family and the ISA standards behind it is expected. Because the work touches safety and critical infrastructure, employers weight judgement, caution, and clear communication with plant engineers as heavily as raw hacking skill.",
};

export const LESSONS: Lesson[] = [
  // ── LESSON 1 ───────────────────────────────────────────────────────────────
  {
    title: "01 // What Is ICS/SCADA/OT? The World That Runs the Physical World",
    summary: "The vocabulary and the mission: operational technology, industrial control systems, and why defending them is different from defending a data centre.",
    content: `
      <h2>Security for things that move</h2>
      <p>Most cybersecurity protects <em>information</em> — files, emails, databases. This course protects <em>physical processes</em>: the pumps that move drinking water, the breakers that route electricity, the reactors that make chemicals, the lines that assemble cars. The computers that run those processes are called <strong>Operational Technology (OT)</strong>, and the specialised systems inside OT are <strong>Industrial Control Systems (ICS)</strong>. When they fail, water stops flowing, lights go out, or something catches fire. The stakes are physical.</p>

      <p>You are <em>defensive</em> and <em>safety-focused</em>. Nothing in this course is about attacking real plants; it is about understanding how these systems work so you can protect them. In OT, a careless defender can cause the very outage they were hired to prevent — so caution is a core skill, not an afterthought.</p>

      <h3>Untangling the acronyms</h3>
      <table>
        <thead><tr><th>Term</th><th>What it means</th></tr></thead>
        <tbody>
          <tr><td><strong>OT</strong> (Operational Technology)</td><td>The broad category: any hardware/software that monitors or controls physical equipment. The counterpart to IT.</td></tr>
          <tr><td><strong>ICS</strong> (Industrial Control System)</td><td>The umbrella term for the control systems inside OT — the sensors, controllers, and interfaces that run a process.</td></tr>
          <tr><td><strong>SCADA</strong> (Supervisory Control and Data Acquisition)</td><td>A <em>type</em> of ICS built to supervise processes spread over a wide area (a pipeline, a power grid) from a central control room.</td></tr>
          <tr><td><strong>DCS</strong> (Distributed Control System)</td><td>A type of ICS for a single, dense site (a refinery, a paper mill) where control is distributed across the plant but contained locally.</td></tr>
        </tbody>
      </table>
      <p>A useful rule of thumb: <strong>SCADA supervises the wide and remote; DCS controls the local and dense.</strong> Both are ICS; both are OT. People use the terms loosely — the important thing is the shared idea of computers commanding physical equipment.</p>

      <h3>The control loop — the heartbeat of all of this</h3>
      <p>Every industrial process runs a <strong>control loop</strong>, repeated thousands of times a second:</p>
      <ol>
        <li><strong>Sense</strong> — a sensor measures the real world (a tank is 80% full).</li>
        <li><strong>Decide</strong> — a controller compares that reading to a target (setpoint: 70%).</li>
        <li><strong>Act</strong> — the controller drives an actuator (close the inlet valve).</li>
        <li><strong>Repeat</strong> — measure again, adjust, forever.</li>
      </ol>
      <p>Almost every attack in this course is ultimately an attempt to corrupt that loop: lie to the sensor, hijack the decision, or forge the command to the actuator. Defence is about protecting the integrity of the loop.</p>

      <h3>Why this is a distinct discipline</h3>
      <p>You cannot simply apply IT security here. OT devices may run for 25 years without a reboot, speak protocols invented before the internet, and value <em>never stopping</em> above all else. A patch that is routine on a laptop can void a safety certification on a controller. The rest of this course builds the specialised mindset OT demands.</p>

      <blockquote>The one sentence to carry through the whole course: in OT, cyber and physical are the same thing. A bad packet can move a valve, and a moved valve can hurt someone. We defend information in order to defend the physical world.</blockquote>
    `,
    quizzes: [
      { id: "scada-l1-q1", question: "What does OT (Operational Technology) primarily protect or control?", options: ["Email and file servers", "Physical processes and equipment", "Website traffic", "Employee payroll records"], correctAnswerIndex: 1, explanation: "OT is the hardware and software that monitors and controls physical equipment — the counterpart to information-focused IT." },
      { id: "scada-l1-q2", question: "How is SCADA best distinguished from a DCS?", options: ["SCADA is for wide, remote/geographically distributed processes; DCS is for a single dense site", "SCADA is wireless and DCS is wired", "SCADA is newer and DCS is obsolete", "They are the same thing"], correctAnswerIndex: 0, explanation: "SCADA supervises processes spread over wide areas (pipelines, grids); a DCS controls a local, dense facility like a refinery." },
      { id: "scada-l1-q3", question: "Which term is the broad umbrella for control systems inside OT?", options: ["DCS", "ICS (Industrial Control System)", "HMI", "TCP/IP"], correctAnswerIndex: 1, explanation: "ICS is the umbrella term for the sensors, controllers, and interfaces that run an industrial process; SCADA and DCS are types of ICS." },
      { id: "scada-l1-q4", question: "What are the four repeating stages of an industrial control loop?", options: ["Encrypt, send, decrypt, log", "Sense, decide, act, repeat", "Boot, patch, scan, reboot", "Login, query, backup, logout"], correctAnswerIndex: 1, explanation: "A control loop continuously senses the process, decides against a setpoint, acts via an actuator, and repeats." },
      { id: "scada-l1-q5", question: "Why can't standard IT security practices be applied directly to OT?", options: ["OT has no computers", "OT devices are often decades old, run pre-internet protocols, and prioritise never stopping", "IT security is illegal in factories", "OT never connects to networks"], correctAnswerIndex: 1, explanation: "Long-lived equipment, legacy protocols, and an overriding availability requirement mean routine IT actions can be harmful in OT." },
      { id: "scada-l1-q6", question: "In OT security, what does 'cyber and physical are the same thing' mean?", options: ["All physical devices are virtual", "A malicious packet can move real equipment and cause physical harm", "Cybersecurity does not apply to OT", "Physical security replaces cybersecurity"], correctAnswerIndex: 1, explanation: "Because controllers command physical actuators, a network attack can produce a real-world physical effect, blurring the cyber/physical line." },
      { id: "scada-l1-q7", question: "What is the ultimate target of most attacks against an industrial process?", options: ["The building's paint", "The integrity of the control loop (sensor readings, decisions, or actuator commands)", "The company logo", "The coffee machine"], correctAnswerIndex: 1, explanation: "Attacks aim to corrupt the loop — lying to sensors, hijacking decisions, or forging actuator commands." },
      { id: "scada-l1-q8", question: "Why is caution emphasised as a core skill for OT defenders?", options: ["OT is boring", "A careless defensive action can itself cause the outage it was meant to prevent", "Attackers are always polite", "Caution slows down promotions"], correctAnswerIndex: 1, explanation: "In OT, actions like aggressive scanning or unplanned reboots can disrupt fragile live processes, so defenders must act carefully." },
    ],
  },

  // ── LESSON 2 ───────────────────────────────────────────────────────────────
  {
    title: "02 // The Field: PLCs, RTUs, HMIs, Sensors & Actuators",
    summary: "A guided tour of the physical devices that make up a control system, from the sensor in the tank to the screen in the control room.",
    content: `
      <h2>Meet the equipment</h2>
      <p>Before you can defend a control system you must know its parts and what each one trusts. We'll walk from the physical process outward to the operator's screen.</p>

      <h3>Sensors and actuators — the hands and eyes</h3>
      <p>At the very bottom, touching the physical world, are two kinds of device:</p>
      <ul>
        <li><strong>Sensors</strong> measure reality and report it: temperature, pressure, flow, level, voltage. They are the system's <em>eyes</em>.</li>
        <li><strong>Actuators</strong> change reality on command: valves that open, motors that spin, breakers that trip, pumps that start. They are the system's <em>hands</em>.</li>
      </ul>
      <p>An attacker who can forge sensor data blinds the system; one who can forge actuator commands seizes control of the process. Both matter.</p>

      <h3>The PLC — the workhorse controller</h3>
      <p>A <strong>Programmable Logic Controller (PLC)</strong> is a ruggedised industrial computer that runs the control loop. It reads its sensors, runs a small program (often written in <em>ladder logic</em>, a language that looks like an electrical relay diagram), and drives its actuators — reliably, for years, in heat, dust, and vibration. PLCs are the single most important devices you will defend: they sit closest to the physical process and, critically, they were designed to <em>trust</em> the commands they receive.</p>

      <h3>The RTU — the PLC's remote cousin</h3>
      <p>A <strong>Remote Terminal Unit (RTU)</strong> does a similar job but is built for remote, unstaffed, often harsh locations — a pipeline valve station in the desert, a substation on a mountain. RTUs emphasise wide-area communication (radio, cellular, leased lines) and low power. In modern systems the line between PLC and RTU has blurred; think of an RTU as a PLC optimised for distance and isolation.</p>

      <h3>The HMI — the window for humans</h3>
      <p>The <strong>Human-Machine Interface (HMI)</strong> is the graphical screen an operator watches: a schematic of the plant with live numbers, gauges, and buttons. It lets a human see the process and issue commands. Because the HMI is where the operator's <em>trust</em> lives, an attacker who tampers with an HMI can hide an attack in plain sight — showing "all normal" while the process is being sabotaged. (Stuxnet did exactly this; you'll meet it in Lesson 7.)</p>

      <h3>The SCADA server and historian — the memory and brain</h3>
      <p>Above the controllers sits supervisory software: the <strong>SCADA server</strong> (also called the master or supervisory station) that gathers data from many PLCs/RTUs and presents the big picture, and the <strong>historian</strong>, a database that records every measurement over time for analysis, reporting, and compliance. The historian is a frequent bridge between OT and IT because business users want that data — which makes it a common attack path.</p>

      <table>
        <thead><tr><th>Device</th><th>Role</th><th>One-line security concern</th></tr></thead>
        <tbody>
          <tr><td>Sensor</td><td>Measures the process</td><td>Forged readings blind the system.</td></tr>
          <tr><td>Actuator</td><td>Changes the process</td><td>Forged commands seize the process.</td></tr>
          <tr><td>PLC</td><td>Runs the control loop</td><td>Trusts commands; closest to physical harm.</td></tr>
          <tr><td>RTU</td><td>Remote controller</td><td>Wide-area links are exposed and hard to monitor.</td></tr>
          <tr><td>HMI</td><td>Operator's screen</td><td>Tampering hides the attack from humans.</td></tr>
          <tr><td>Historian</td><td>Records all data</td><td>A bridge between OT and IT — a pivot point.</td></tr>
        </tbody>
      </table>

      <blockquote>Design flaw to remember: nearly every one of these devices was built for a private, trusted network. None of them expected a hostile packet. That inherited trust is the vulnerability you will spend this course working around.</blockquote>
    `,
    quizzes: [
      { id: "scada-l2-q1", question: "What is the role of a sensor in a control system?", options: ["It changes the physical process", "It measures the physical world and reports readings", "It displays graphics to operators", "It stores historical data"], correctAnswerIndex: 1, explanation: "Sensors are the system's eyes — they measure conditions like temperature, pressure, and level and report them to controllers." },
      { id: "scada-l2-q2", question: "What does a PLC (Programmable Logic Controller) do?", options: ["Runs the control loop: reads sensors, runs logic, drives actuators", "Only stores data long-term", "Provides the operator's graphical screen", "Routes internet traffic"], correctAnswerIndex: 0, explanation: "A PLC is a ruggedised controller that executes the control loop — reading inputs, running its program, and commanding outputs." },
      { id: "scada-l2-q3", question: "How does an RTU typically differ from a PLC?", options: ["An RTU cannot control anything", "An RTU is optimised for remote, unstaffed locations and wide-area communication", "An RTU only works indoors", "An RTU is a type of sensor"], correctAnswerIndex: 1, explanation: "RTUs emphasise remote, harsh-location deployment and long-distance links; the PLC/RTU distinction has blurred over time." },
      { id: "scada-l2-q4", question: "Why is tampering with an HMI especially dangerous?", options: ["It deletes the internet", "It can hide an attack from operators by showing 'all normal' while the process is sabotaged", "It speeds up the PLC", "It has no security impact"], correctAnswerIndex: 1, explanation: "The HMI is where operator trust lives; falsifying it lets an attacker mask ongoing sabotage, as Stuxnet did." },
      { id: "scada-l2-q5", question: "What is a historian in a SCADA system?", options: ["A person who writes company history", "A database that records process measurements over time", "A type of actuator", "A firewall"], correctAnswerIndex: 1, explanation: "The historian stores time-series process data for analysis, reporting, and compliance — and often bridges OT and IT." },
      { id: "scada-l2-q6", question: "An attacker who forges actuator commands achieves what?", options: ["Nothing, actuators ignore commands", "Direct control over the physical process (opening valves, stopping pumps)", "Only slower email", "A software license upgrade"], correctAnswerIndex: 1, explanation: "Actuators change the physical world on command; forging their commands hands the attacker control of the process." },
      { id: "scada-l2-q7", question: "What programming style is classically used to write PLC logic?", options: ["Ladder logic (resembling relay diagrams)", "HTML", "Assembly for x86 servers", "SQL"], correctAnswerIndex: 0, explanation: "PLCs are commonly programmed in ladder logic, a graphical language that mirrors electrical relay wiring diagrams." },
      { id: "scada-l2-q8", question: "What underlying design assumption makes most field devices vulnerable?", options: ["They were built expecting hostile networks", "They were built for private, trusted networks and never expected a hostile packet", "They encrypt everything by default", "They require passwords for every action"], correctAnswerIndex: 1, explanation: "Field devices inherited an assumption of a trusted network, so they generally accept commands without authentication." },
    ],
  },

  // ── LESSON 3 ───────────────────────────────────────────────────────────────
  {
    title: "03 // The Purdue Model: Zones, Levels & the Reference Map",
    summary: "The layered reference architecture every OT defender uses to reason about where devices live and which traffic between them is dangerous.",
    content: `
      <h2>A map you will use every single day</h2>
      <p>The <strong>Purdue Enterprise Reference Architecture</strong> — usually just "the Purdue Model" — is the standard way to draw an industrial network as a stack of levels, from the physical process at the bottom to the corporate business network at the top. It is the shared map OT defenders use to place any device and reason about risk. Memorising it pays off constantly.</p>

      <h3>The levels, bottom to top</h3>
      <table>
        <thead><tr><th>Level</th><th>Name</th><th>What lives here</th></tr></thead>
        <tbody>
          <tr><td><strong>Level 0</strong></td><td>Physical Process</td><td>Sensors and actuators — the actual valves, motors, and gauges touching reality.</td></tr>
          <tr><td><strong>Level 1</strong></td><td>Basic Control</td><td>PLCs and RTUs running the control loop.</td></tr>
          <tr><td><strong>Level 2</strong></td><td>Area Supervisory Control</td><td>HMIs and SCADA/DCS software supervising a process area.</td></tr>
          <tr><td><strong>Level 3</strong></td><td>Site Operations</td><td>Historians, plant-wide MES, engineering workstations, production management.</td></tr>
          <tr><td><strong>IDMZ</strong></td><td>Industrial DMZ</td><td>The buffer zone between OT (below) and IT (above). No direct OT↔IT traffic crosses it.</td></tr>
          <tr><td><strong>Level 4</strong></td><td>Site Business / Logistics</td><td>Local IT: email, file servers, business apps for the site.</td></tr>
          <tr><td><strong>Level 5</strong></td><td>Enterprise</td><td>The corporate network, cloud, and internet.</td></tr>
        </tbody>
      </table>
      <p>Levels 0–3 are <strong>OT</strong>. Levels 4–5 are <strong>IT</strong>. Between them sits the <strong>IDMZ (Industrial Demilitarised Zone)</strong> — the single most important architectural control in the whole model.</p>

      <h3>Why the direction of trust matters</h3>
      <p>The golden principle is that <strong>the lower you go, the more you protect, and traffic should not leap levels.</strong> A packet from the corporate network (Level 5) has no business speaking directly to a PLC (Level 1). Instead, requests are brokered through intermediate levels and, crucially, through the IDMZ. When you see traffic that jumps levels — an internet host talking straight to a controller — that is a five-alarm anomaly.</p>

      <h3>The IDMZ: a broker, not a hole</h3>
      <p>The IDMZ works like the airlock on a spacecraft. IT systems that need OT data don't reach into the plant; they talk to a <em>replica</em> or a <em>proxy</em> living in the IDMZ (a mirrored historian, a patch server, a jump host). OT systems likewise never reach directly into IT. Nothing passes through in one hop. If the IDMZ is compromised, the attacker has reached a buffer — not the process. Done well, breaking into IT does not equal breaking into OT.</p>

      <h3>Zones and conduits — the same idea, formalised</h3>
      <p>The security standard IEC 62443 (Lesson 10) reframes Purdue in terms of <strong>zones</strong> (groups of assets with the same security requirements) and <strong>conduits</strong> (the controlled, monitored pathways between zones). Purdue tells you the natural layers; zones-and-conduits let you draw boundaries that match your real risk, then guard every crossing. Every conduit is a place to inspect, filter, and log.</p>

      <blockquote>Practical takeaway: to triage any OT event, first ask "what Purdue level is the source, and what level is the destination?" Traffic that respects the layers is probably fine. Traffic that skips layers — especially anything reaching down toward Level 1/0 from above — is where you look first.</blockquote>
    `,
    quizzes: [
      { id: "scada-l3-q1", question: "What is the Purdue Model?", options: ["A brand of PLC", "A layered reference architecture organising an industrial network into levels", "A type of Modbus packet", "An encryption algorithm"], correctAnswerIndex: 1, explanation: "The Purdue Model is the standard reference architecture that stacks an industrial network into levels from physical process to enterprise." },
      { id: "scada-l3-q2", question: "Which Purdue level contains the PLCs and RTUs running the control loop?", options: ["Level 0", "Level 1", "Level 4", "Level 5"], correctAnswerIndex: 1, explanation: "Level 1 (Basic Control) is where PLCs and RTUs live; Level 0 is the physical sensors and actuators." },
      { id: "scada-l3-q3", question: "Which levels are considered OT versus IT?", options: ["0–3 are OT; 4–5 are IT", "0–5 are all IT", "Only Level 0 is OT", "4–5 are OT; 0–3 are IT"], correctAnswerIndex: 0, explanation: "Levels 0–3 are the OT domain; Levels 4–5 are the IT/enterprise domain, with the IDMZ between them." },
      { id: "scada-l3-q4", question: "What is the primary purpose of the IDMZ?", options: ["To speed up PLCs", "To act as a buffer so no direct OT↔IT traffic crosses in a single hop", "To store historical data", "To replace the corporate firewall"], correctAnswerIndex: 1, explanation: "The Industrial DMZ brokers OT/IT communication through replicas and proxies so neither side reaches the other directly." },
      { id: "scada-l3-q5", question: "Why is traffic that 'jumps levels' a strong anomaly?", options: ["It uses more bandwidth", "Well-designed OT routes requests through intermediate levels; a direct enterprise-to-PLC packet bypasses every safeguard", "It is always encrypted", "Jumping levels is normal and safe"], correctAnswerIndex: 1, explanation: "Level-skipping traffic, especially from IT down toward controllers, bypasses the layered protections and signals a likely attack." },
      { id: "scada-l3-q6", question: "In IEC 62443 terminology, what is a 'conduit'?", options: ["A physical pipe carrying water", "A controlled, monitored communication pathway between zones", "A type of sensor", "A brand of firewall"], correctAnswerIndex: 1, explanation: "A conduit is the guarded pathway connecting zones; every conduit is a place to inspect, filter, and log traffic." },
      { id: "scada-l3-q7", question: "If an attacker compromises a well-designed IDMZ, what have they reached?", options: ["Direct control of the PLCs", "A buffer zone, not the process itself", "The corporate CEO's email", "Nothing at all"], correctAnswerIndex: 1, explanation: "A properly built IDMZ contains only replicas/proxies, so compromising it lands the attacker in a buffer rather than in the OT process." },
      { id: "scada-l3-q8", question: "What is the first question to ask when triaging an OT network event?", options: ["What colour is the cable?", "What Purdue level is the source, and what level is the destination?", "Who is the vendor's CEO?", "How old is the building?"], correctAnswerIndex: 1, explanation: "Placing source and destination on the Purdue model immediately reveals whether the traffic respects or violates the layered design." },
    ],
  },

  // ── LESSON 4 ───────────────────────────────────────────────────────────────
  {
    title: "04 // IT vs OT: Why Safety and Availability Come First",
    summary: "The inverted priorities that define OT security — the CIA triad flipped, plus the safety, uptime, and lifespan constraints that reshape every decision.",
    content: `
      <h2>The same word, opposite priorities</h2>
      <p>An IT security professional and an OT security professional can both say "we protect systems" and mean nearly opposite things. Understanding this inversion is the conceptual key to the whole field. Get it wrong and you'll propose fixes that horrify the plant engineers; get it right and you'll earn their trust.</p>

      <h3>The CIA triad, turned upside down</h3>
      <p>Classic IT security ranks its goals as <strong>Confidentiality → Integrity → Availability (CIA)</strong>. Keeping secrets secret usually comes first. OT flips this to <strong>Availability → Integrity → Confidentiality (AIC)</strong>, and adds a goal that outranks them all: <strong>Safety</strong>.</p>
      <table>
        <thead><tr><th>Priority</th><th>IT ranking</th><th>OT ranking</th></tr></thead>
        <tbody>
          <tr><td>1st</td><td>Confidentiality</td><td><strong>Safety</strong> (then Availability)</td></tr>
          <tr><td>2nd</td><td>Integrity</td><td>Integrity</td></tr>
          <tr><td>3rd</td><td>Availability</td><td>Confidentiality</td></tr>
        </tbody>
      </table>
      <p>Why? A leaked spreadsheet is bad; a stopped cooling pump can cause an explosion. In OT, the process must keep running correctly and safely. The secrecy of a temperature reading matters far less than the pump that reading controls never stopping unexpectedly.</p>

      <h3>Safety is not the same as security</h3>
      <p>This is subtle and important. <strong>Security</strong> protects against a malicious human. <strong>Safety</strong> protects against physical harm to people and the environment, whatever the cause. A safety system exists to prevent a boiler from exploding whether the cause is a software bug, a stuck valve, or a hacker. In OT, safety always wins — which is why (as you'll see in Lesson 9) safety systems are kept deliberately separate and simple. When the two ever conflict, human life comes first.</p>

      <h3>The constraints that reshape everything</h3>
      <ul>
        <li><strong>Uptime is sacred.</strong> A refinery might run for years between planned shutdowns ("turnarounds"). You cannot reboot a controller to apply a patch on a Tuesday afternoon. Change happens in rare, carefully planned windows.</li>
        <li><strong>Equipment lives for decades.</strong> A 20–30 year lifespan is normal. Much OT runs on hardware and operating systems long past vendor support, which can never be patched. You must defend the unpatchable.</li>
        <li><strong>Determinism matters.</strong> Control loops must respond in predictable milliseconds. Security controls that add latency or jitter — heavy encryption, inline scanning — can break the process itself.</li>
        <li><strong>Physical consequences.</strong> A crash isn't a spinning cursor; it's a physical event. This is why aggressive vulnerability scanning, routine in IT, can be reckless in OT — fragile devices have frozen and halted plants from a simple port scan.</li>
      </ul>

      <h3>What this means for your toolkit</h3>
      <p>OT security leans heavily toward <strong>passive</strong> and <strong>preventive</strong> controls: watch quietly rather than probe, segment rather than patch, and compensate around weaknesses you cannot remove. When you must touch a live system, you do it through change control, in a window, with the plant's blessing — never on a hunch.</p>

      <blockquote>The mantra: In IT, we protect data and can reboot to recover. In OT, we protect a physical process and people, cannot simply reboot, and a wrong move has weight. Availability and safety come first — always.</blockquote>
    `,
    quizzes: [
      { id: "scada-l4-q1", question: "How does the priority ordering of the CIA triad differ in OT?", options: ["OT keeps the same order as IT", "OT flips it to Availability → Integrity → Confidentiality, with Safety above all", "OT only cares about Confidentiality", "OT ignores integrity entirely"], correctAnswerIndex: 1, explanation: "OT inverts IT's CIA ordering to AIC and elevates Safety above everything, because a stopped or unsafe process can cause physical harm." },
      { id: "scada-l4-q2", question: "In OT, what generally takes precedence over even availability?", options: ["Confidentiality", "Safety of people and the environment", "Software licensing", "Network speed"], correctAnswerIndex: 1, explanation: "Safety — preventing physical harm to people and the environment — is the top priority in OT, above availability and everything else." },
      { id: "scada-l4-q3", question: "What is the difference between safety and security?", options: ["They are identical", "Security defends against malicious humans; safety prevents physical harm from any cause", "Safety is only about passwords", "Security is only for factories"], correctAnswerIndex: 1, explanation: "Security addresses malicious actors, while safety prevents physical harm regardless of cause — bug, failure, or attacker." },
      { id: "scada-l4-q4", question: "Why is patching so difficult in OT environments?", options: ["Patches are illegal", "Uptime is sacred and controllers often can't be rebooted outside rare planned windows", "OT has no software", "Patches always improve performance"], correctAnswerIndex: 1, explanation: "Continuous-operation requirements mean systems can rarely be taken down, so patching waits for carefully planned turnaround windows." },
      { id: "scada-l4-q5", question: "Why can aggressive vulnerability scanning be reckless in OT?", options: ["It costs too much money", "Fragile legacy devices can freeze or crash from the scan traffic, halting the physical process", "Scanning is against the law", "It improves determinism"], correctAnswerIndex: 1, explanation: "Legacy OT devices have delicate network stacks; standard IT scans can crash them, causing physical downtime." },
      { id: "scada-l4-q6", question: "Roughly how long can industrial equipment remain in service?", options: ["A few months", "20–30 years, often past vendor support", "Exactly one year", "It is replaced weekly"], correctAnswerIndex: 1, explanation: "Industrial equipment commonly runs for decades, so defenders must protect unpatchable, out-of-support systems." },
      { id: "scada-l4-q7", question: "Why does determinism (predictable timing) constrain OT security controls?", options: ["It doesn't", "Control loops need predictable millisecond responses, so latency-adding controls can break the process", "Determinism only affects email", "It makes encryption free"], correctAnswerIndex: 1, explanation: "Real-time control demands predictable timing; security measures that add latency or jitter can disrupt the control loop itself." },
      { id: "scada-l4-q8", question: "Which style of security control does OT tend to favour?", options: ["Aggressive active probing and forced reboots", "Passive monitoring, segmentation, and compensating controls", "Deleting all logs", "Randomly rebooting PLCs"], correctAnswerIndex: 1, explanation: "OT prefers passive, preventive, and compensating controls that avoid disturbing fragile, always-on processes." },
    ],
  },

  // ── LESSON 5 ───────────────────────────────────────────────────────────────
  {
    title: "05 // Industrial Protocols: Modbus, DNP3 & OPC",
    summary: "How industrial devices talk — and why the protocols that run the physical world were built with no authentication at all.",
    content: `
      <h2>The languages of the plant floor</h2>
      <p>Industrial devices communicate using specialised protocols, most designed decades ago for private, trusted serial links. The defining security fact about nearly all of them: <strong>they have no built-in authentication, integrity, or encryption.</strong> They were built for a world with no attackers on the wire. Understanding a few of these protocols — and their shared blind spot — is central to OT defence.</p>

      <h3>Modbus — the plain-spoken workhorse</h3>
      <p>Created in 1979, <strong>Modbus</strong> is the simplest and most widespread industrial protocol. A <em>master</em> (e.g. an HMI) sends requests; a <em>slave</em> (e.g. a PLC) responds. Data lives in four simple tables:</p>
      <ul>
        <li><strong>Coils</strong> — single read/write bits (e.g. a relay: on/off).</li>
        <li><strong>Discrete inputs</strong> — single read-only bits (e.g. a limit switch).</li>
        <li><strong>Holding registers</strong> — 16-bit read/write values (e.g. a setpoint).</li>
        <li><strong>Input registers</strong> — 16-bit read-only values (e.g. a sensor reading).</li>
      </ul>
      <p>Commands are just <em>function codes</em>. A simplified Modbus/TCP "Write Single Coil" that turns a pump off might look like:</p>
      <pre><code>Unit ID:       0x01        (target device address)
Function code: 0x05        (Write Single Coil)
Coil address:  0x0010      (e.g. Emergency Coolant Pump)
Value:         0x0000      (0 = OFF, 0xFF00 = ON)</code></pre>
      <p>There is no username, no password, no signature, no checksum that proves <em>who</em> sent it. If a frame reaches the PLC, the PLC does it. Anyone with network access to that device can forge a shutdown command — this is the single most important vulnerability class in the course.</p>

      <h3>DNP3 — the utility's protocol</h3>
      <p><strong>DNP3 (Distributed Network Protocol 3)</strong> is common in electric and water utilities, especially SCADA over wide areas. It is more sophisticated than Modbus: it handles unreliable links gracefully, supports time-stamped events, and can report changes only when they happen ("report by exception"). But in its original form it, too, shipped <em>without authentication</em>. A later extension, <strong>DNP3 Secure Authentication (SAv5)</strong>, adds a way for devices to verify commands — but adoption is patchy, and much of the installed base still runs the unauthenticated version.</p>

      <h3>OPC — the translator</h3>
      <p>Plants are full of devices from different vendors speaking different protocols. <strong>OPC (originally OLE for Process Control)</strong> is the universal translator that lets them share data through a common interface, typically between Levels 2 and 3. The classic version, <strong>OPC Classic</strong>, was built on Windows <em>DCOM</em> — notoriously hard to firewall (it uses wide, dynamic port ranges) and tied to aging Windows security. Its modern successor, <strong>OPC UA (Unified Architecture)</strong>, is the good-news story of this lesson: it is platform-independent, firewall-friendly, and — importantly — was designed <em>with</em> authentication, signing, and encryption available. OPC UA is what a security-conscious modern plant moves toward.</p>

      <table>
        <thead><tr><th>Protocol</th><th>Typical use</th><th>Built-in security?</th></tr></thead>
        <tbody>
          <tr><td>Modbus</td><td>Simple device I/O, very widespread</td><td>None — no auth, no encryption.</td></tr>
          <tr><td>DNP3</td><td>Electric/water utility SCADA</td><td>None originally; optional SAv5 authentication, patchily adopted.</td></tr>
          <tr><td>OPC Classic</td><td>Vendor-neutral data exchange (Windows/DCOM)</td><td>Weak; DCOM is hard to secure and firewall.</td></tr>
          <tr><td>OPC UA</td><td>Modern vendor-neutral exchange</td><td>Yes — designed with auth, signing, and encryption.</td></tr>
        </tbody>
      </table>

      <blockquote>The through-line: most protocols running physical infrastructure trust any command they can receive. Since you usually cannot add authentication to a 20-year-old PLC, you defend these protocols from the <em>outside</em> — with segmentation (Lesson 8) and monitoring (Lesson 9) — controlling and watching who can reach the wire.</blockquote>
    `,
    quizzes: [
      { id: "scada-l5-q1", question: "What is the defining security weakness shared by classic industrial protocols?", options: ["They are too fast", "They generally have no built-in authentication, integrity, or encryption", "They only work over the internet", "They require passwords for every packet"], correctAnswerIndex: 1, explanation: "Protocols like Modbus and original DNP3 were designed for trusted links and lack authentication, integrity, and encryption." },
      { id: "scada-l5-q2", question: "In Modbus, what is a 'coil'?", options: ["A physical spring", "A single read/write bit, such as an on/off relay", "A 32-bit encrypted value", "A username field"], correctAnswerIndex: 1, explanation: "Coils are single read/write bits in Modbus, often representing binary outputs like a relay being on or off." },
      { id: "scada-l5-q3", question: "In a Modbus write-command frame, what proves the sender's identity?", options: ["A digital signature", "A password field", "Nothing — there is no authentication of the sender", "A TLS certificate"], correctAnswerIndex: 2, explanation: "Modbus frames carry no sender authentication; if the frame reaches the device, it is executed." },
      { id: "scada-l5-q4", question: "DNP3 is most commonly associated with which sector?", options: ["Video game servers", "Electric and water utilities", "Social media", "Retail point-of-sale"], correctAnswerIndex: 1, explanation: "DNP3 is widely used in electric and water utility SCADA, especially over wide-area links." },
      { id: "scada-l5-q5", question: "What does DNP3 Secure Authentication (SAv5) add?", options: ["Faster packets", "A way for devices to verify the authenticity of commands", "Colourful HMIs", "Automatic patching"], correctAnswerIndex: 1, explanation: "SAv5 is an extension that lets DNP3 devices authenticate commands, though adoption remains patchy." },
      { id: "scada-l5-q6", question: "What is the primary purpose of OPC?", options: ["To encrypt all internet traffic", "To let devices from different vendors and protocols share data through a common interface", "To replace PLCs", "To store passwords"], correctAnswerIndex: 1, explanation: "OPC acts as a universal translator so heterogeneous vendor devices can exchange data via a shared interface." },
      { id: "scada-l5-q7", question: "Why is OPC Classic difficult to secure and firewall?", options: ["It uses no network at all", "It is built on Windows DCOM, which uses wide dynamic port ranges and aging security", "It is fully encrypted and blocks firewalls", "It only runs on Linux"], correctAnswerIndex: 1, explanation: "OPC Classic relies on DCOM, whose dynamic wide port ranges and legacy Windows security make it hard to firewall." },
      { id: "scada-l5-q8", question: "How is OPC UA a security improvement over OPC Classic?", options: ["It removes all networking", "It is platform-independent, firewall-friendly, and designed with authentication, signing, and encryption", "It is slower and simpler", "It has no security features"], correctAnswerIndex: 1, explanation: "OPC UA was designed with modern security (auth, signing, encryption) and is platform-independent and firewall-friendly." },
    ],
  },

  // ── LESSON 6 ───────────────────────────────────────────────────────────────
  {
    title: "06 // IT/OT Convergence: The Collapse of the Air Gap",
    summary: "How business demands connected once-isolated plants to the enterprise and the internet, and the new attack surface that convergence created.",
    content: `
      <h2>The walls came down</h2>
      <p>For decades, control systems were genuinely isolated — proprietary equipment on private wiring, physically separate from business computing and the internet. That isolation was much of their security. Over the last twenty years, business pressure has steadily dissolved it. This trend is called <strong>IT/OT convergence</strong>, and it is the reason OT security exploded into a discipline: the systems that were "safe because nobody could reach them" are now, increasingly, reachable.</p>

      <h3>Why the walls came down</h3>
      <ul>
        <li><strong>Data has value.</strong> Executives want real-time production numbers, efficiency dashboards, and predictive-maintenance analytics — which means pulling data out of the plant and up into IT and the cloud.</li>
        <li><strong>Remote operations save money.</strong> Vendors and engineers want to diagnose and adjust equipment without flying to a remote site, so remote-access paths get added.</li>
        <li><strong>Commodity tech is cheaper.</strong> Plants replaced proprietary boxes with standard Windows PCs, Ethernet, and TCP/IP — inheriting all of IT's well-known vulnerabilities in the bargain.</li>
        <li><strong>Cloud and IIoT.</strong> The Industrial Internet of Things puts sensors and gateways that talk directly to cloud services right onto the plant floor.</li>
      </ul>

      <h3>The new attack surface</h3>
      <p>Each convenience is also a doorway. Convergence created paths that never existed before:</p>
      <table>
        <thead><tr><th>Convergence driver</th><th>New risk it introduces</th></tr></thead>
        <tbody>
          <tr><td>Historian data shared with IT</td><td>The historian becomes a bridge an attacker can pivot across from IT into OT.</td></tr>
          <tr><td>Remote vendor access</td><td>Modems, VPNs, and jump hosts are inviting, often weakly-secured entry points.</td></tr>
          <tr><td>Windows/Ethernet in OT</td><td>Standard malware and exploits now work against plant machines.</td></tr>
          <tr><td>IIoT gateways to cloud</td><td>Devices deep in the process now have an outbound path to the internet.</td></tr>
        </tbody>
      </table>

      <h3>The uncomfortable truth: IT compromise can become OT compromise</h3>
      <p>The classic modern attack chain does not start in the plant. It starts with an ordinary IT intrusion — a phishing email to an office worker (Level 4/5). From that foothold the attacker moves laterally, looking for the bridge into OT: the shared historian, the dual-homed engineering workstation, the flat network where a business VLAN can somehow reach a controller. Convergence is precisely what makes "we breached the office" flow into "we can reach the turbine." This is why the IDMZ from Lesson 3 exists — to break that flow.</p>

      <h3>Convergence is not the enemy — unmanaged convergence is</h3>
      <p>The answer is not to unplug everything (business needs the data, and true isolation is rarely achievable anyway — the next lesson dismantles that myth). The answer is <strong>managed</strong> convergence: allow the connections the business genuinely needs, but force every one of them through controlled, monitored chokepoints — the IDMZ, brokered data flows, tightly governed remote access — and watch them constantly.</p>

      <blockquote>Reframe: convergence didn't make OT insecure; it removed the accidental security that isolation used to provide for free. Now that protection has to be engineered deliberately, connection by connection.</blockquote>
    `,
    quizzes: [
      { id: "scada-l6-q1", question: "What is IT/OT convergence?", options: ["Replacing all OT with IT", "The growing interconnection of once-isolated control systems with business IT, cloud, and the internet", "A type of Modbus command", "Disconnecting the plant from everything"], correctAnswerIndex: 1, explanation: "Convergence is the trend of connecting formerly isolated OT to enterprise IT and the internet, driven by business demands." },
      { id: "scada-l6-q2", question: "Which business driver pulls plant data up into IT and the cloud?", options: ["A desire to slow production", "Demand for real-time dashboards, analytics, and predictive maintenance", "A legal ban on isolation", "Reducing the value of data"], correctAnswerIndex: 1, explanation: "Executives want production and efficiency data, which requires extracting it from the plant into IT/cloud systems." },
      { id: "scada-l6-q3", question: "Why does adopting standard Windows and Ethernet in OT increase risk?", options: ["It makes devices immune to malware", "OT inherits all of IT's well-known vulnerabilities and standard malware now works against plant machines", "It removes all networking", "It has no effect on security"], correctAnswerIndex: 1, explanation: "Commodity IT technology brings commodity IT vulnerabilities, so ordinary malware and exploits can now target OT." },
      { id: "scada-l6-q4", question: "Why is a shared historian a notable convergence risk?", options: ["It cannot store data", "It bridges OT and IT, giving attackers a pivot point between the two", "It only runs offline", "It encrypts everything perfectly"], correctAnswerIndex: 1, explanation: "Because the historian connects to both OT and IT, it can serve as a bridge an attacker pivots across into the control network." },
      { id: "scada-l6-q5", question: "Where does the classic modern OT attack chain typically begin?", options: ["Directly at the PLC via physical access", "With an ordinary IT intrusion (e.g. phishing) that then moves laterally toward OT", "Inside the historian only", "At a random sensor"], correctAnswerIndex: 1, explanation: "Attackers commonly start in IT via phishing and move laterally to find a bridge into the OT environment." },
      { id: "scada-l6-q6", question: "What is an IIoT gateway's added risk?", options: ["It disables the plant", "It can give devices deep in the process an outbound path to the internet/cloud", "It removes all sensors", "It only works on paper"], correctAnswerIndex: 1, explanation: "Industrial IoT gateways create new outbound cloud connectivity from deep inside the process, expanding the attack surface." },
      { id: "scada-l6-q7", question: "What is the recommended response to convergence?", options: ["Unplug everything permanently", "Managed convergence: allow needed connections but force them through controlled, monitored chokepoints", "Ignore it entirely", "Connect every device directly to the internet"], correctAnswerIndex: 1, explanation: "The goal is managed convergence — permitting necessary connections while routing and monitoring them through controlled chokepoints like the IDMZ." },
      { id: "scada-l6-q8", question: "In what sense did convergence 'remove accidental security'?", options: ["It added new firewalls automatically", "Isolation used to provide protection for free; now that protection must be deliberately engineered", "It made OT permanently secure", "It deleted all the data"], correctAnswerIndex: 1, explanation: "Isolation once secured OT by default; convergence removed that free protection, so security must now be engineered per connection." },
    ],
  },

  // ── LESSON 7 ───────────────────────────────────────────────────────────────
  {
    title: "07 // Case Studies: Stuxnet, Industroyer & Triton",
    summary: "The three landmark ICS attacks every OT defender must know — what each did, how it worked, and the lasting lesson from each.",
    content: `
      <h2>Learning from the real thing</h2>
      <p>OT security is not theoretical. A handful of real attacks reshaped the field, and every serious defender knows them cold. We study them not to copy but to internalise how these intrusions actually reach the physical world — and what defence each one teaches.</p>

      <h3>Stuxnet (discovered 2010) — the one that proved it was possible</h3>
      <p><strong>Target:</strong> Uranium-enrichment centrifuges at Natanz, Iran. <strong>Significance:</strong> the first widely-known malware built to cause <em>physical</em> destruction, and the moment the world realised code could break machines.</p>
      <p><strong>How it worked, conceptually:</strong> Stuxnet crossed a supposed air gap via infected <strong>USB drives</strong>, spread through Windows, and hunted for a very specific Siemens PLC configuration controlling centrifuges. When it found its target, it subtly manipulated the centrifuge speeds to damage them over time — while <em>simultaneously replaying earlier "everything is normal" data to the HMIs</em>, so operators saw healthy readings as the machines tore themselves apart. It was a precise, patient, targeted physical-sabotage weapon.</p>
      <blockquote>Lesson from Stuxnet: the air gap is not a guarantee — a USB stick walks across it. And an attacker who controls what operators <em>see</em> can hide sabotage in plain sight. Monitor the process itself, not just the operator's screen.</blockquote>

      <h3>Industroyer / CRASHOVERRIDE (2016) — the grid-killer</h3>
      <p><strong>Target:</strong> an electrical transmission substation in Ukraine, causing a real power outage in Kyiv. <strong>Significance:</strong> the first malware framework built specifically and modularly to attack <em>electric grid</em> operations.</p>
      <p><strong>How it worked, conceptually:</strong> Unlike Stuxnet's single custom target, Industroyer was a flexible framework with interchangeable <em>payload modules</em>, each speaking a native grid protocol — including <strong>IEC 61850, IEC 60870-5-101/104, and OPC</strong>. Because it spoke the grid's own languages, it could directly command breakers to open and cut power, using the protocols' lack of authentication against them. It even included a wiper to hamper recovery.</p>
      <blockquote>Lesson from Industroyer: attackers now build reusable, protocol-aware tooling. Because the protocols themselves trust any command, defence must live at the network and access layer — controlling and monitoring who can speak those protocols at all.</blockquote>

      <h3>Triton / TRISIS / HatMan (2017) — the line that must never be crossed</h3>
      <p><strong>Target:</strong> the <strong>Safety Instrumented System (SIS)</strong> — specifically Schneider Electric Triconex controllers — at a petrochemical plant in Saudi Arabia. <strong>Significance:</strong> the first known malware to deliberately target a <em>safety</em> system, the last-resort protection that prevents disasters.</p>
      <p><strong>How it worked, conceptually:</strong> The attackers reached the SIS engineering workstation and used it to reprogram the safety controllers. Their apparent goal was to disable the safety system so a later attack on the process could proceed without the SIS triggering a safe shutdown — a setup for potential physical catastrophe. Fortunately a flaw in their code tripped the controllers into a safe fail-state, which caused a plant shutdown and exposed the attack before disaster struck.</p>
      <blockquote>Lesson from Triton: targeting the safety system crosses a red line — it aims to remove the barrier that protects human life. This is exactly why the SIS must be kept rigorously separate from the control network (Lesson 9). The attack succeeded in reaching the SIS partly because that separation had eroded.</blockquote>

      <h3>The common thread</h3>
      <table>
        <thead><tr><th>Attack</th><th>Year</th><th>Target</th><th>Core lesson</th></tr></thead>
        <tbody>
          <tr><td>Stuxnet</td><td>2010</td><td>Centrifuge PLCs (Iran)</td><td>Air gaps leak; operator views can be faked.</td></tr>
          <tr><td>Industroyer</td><td>2016</td><td>Electric grid (Ukraine)</td><td>Reusable, protocol-aware grid malware.</td></tr>
          <tr><td>Triton</td><td>2017</td><td>Safety system / SIS (Saudi Arabia)</td><td>Even safety systems are now targeted.</td></tr>
        </tbody>
      </table>
      <p>Together they trace an escalating arc: from proving physical sabotage is possible, to industrialising grid attacks, to assaulting the very systems that keep people alive. Each reinforces the same defensive priorities — segmentation, monitoring the process, and protecting safety above all.</p>
    `,
    quizzes: [
      { id: "scada-l7-q1", question: "What made Stuxnet historically significant?", options: ["It stole credit card numbers", "It was the first widely-known malware built to cause physical destruction", "It was the first email virus", "It only affected phones"], correctAnswerIndex: 1, explanation: "Stuxnet proved that malware could cause real physical damage, sabotaging Iranian enrichment centrifuges." },
      { id: "scada-l7-q2", question: "How did Stuxnet cross the supposed air gap?", options: ["Via satellite", "Via infected USB drives", "Through the electrical grid", "It didn't cross any gap"], correctAnswerIndex: 1, explanation: "Stuxnet spread across the air gap using infected USB drives, demonstrating that physical isolation is not a guarantee." },
      { id: "scada-l7-q3", question: "How did Stuxnet hide its sabotage from operators?", options: ["It turned off all screens", "It replayed earlier 'normal' data to the HMIs while damaging the centrifuges", "It deleted the operators' accounts", "It emailed a warning"], correctAnswerIndex: 1, explanation: "Stuxnet fed operators recorded 'everything normal' readings so they saw healthy values while the centrifuges were being damaged." },
      { id: "scada-l7-q4", question: "What was distinctive about Industroyer/CRASHOVERRIDE?", options: ["It only infected home routers", "It was a modular framework with payloads speaking native grid protocols to command breakers directly", "It was harmless", "It targeted smartphones"], correctAnswerIndex: 1, explanation: "Industroyer used interchangeable modules speaking grid protocols (IEC 61850, 60870-5-101/104, OPC) to directly manipulate substation equipment." },
      { id: "scada-l7-q5", question: "Which system did Triton/TRISIS specifically target?", options: ["The email server", "The Safety Instrumented System (SIS), e.g. Triconex controllers", "The company website", "The HVAC thermostat only"], correctAnswerIndex: 1, explanation: "Triton was the first known malware to deliberately target a safety instrumented system, the last-resort protection against disaster." },
      { id: "scada-l7-q6", question: "What was the apparent goal of the Triton attackers?", options: ["To steal data quietly", "To disable the safety system so a later attack could proceed without triggering a safe shutdown", "To improve plant efficiency", "To advertise a product"], correctAnswerIndex: 1, explanation: "By reprogramming the SIS, the attackers sought to remove the safety barrier, setting up potential physical catastrophe." },
      { id: "scada-l7-q7", question: "What ultimately exposed the Triton attack before catastrophe?", options: ["An operator's guess", "A flaw in the attackers' code tripped the controllers into a safe fail-state, causing a shutdown", "A power outage", "Nothing — it succeeded fully"], correctAnswerIndex: 1, explanation: "A bug in the malware caused the Triconex controllers to fail safe and shut the plant down, revealing the intrusion." },
      { id: "scada-l7-q8", question: "What common defensive theme do all three case studies reinforce?", options: ["Delete all logs", "Segmentation, monitoring the physical process, and protecting safety systems above all", "Connect everything to the internet", "Ignore USB drives"], correctAnswerIndex: 1, explanation: "Each attack underscores the need for segmentation, process-level monitoring, and rigorous protection of safety systems." },
    ],
  },

  // ── LESSON 8 ───────────────────────────────────────────────────────────────
  {
    title: "08 // Segmentation, the IDMZ & the Air-Gap Myth",
    summary: "The primary OT defence — dividing the network into defensible zones — and why the comforting belief in a total air gap is usually false.",
    content: `
      <h2>If you can't patch it, isolate it</h2>
      <p>Because most OT devices cannot be secured individually — no authentication, no patches, decades-old firmware — the dominant strategy is to control the <em>network around them</em>. This is <strong>segmentation</strong>: dividing the network into zones so that a compromise in one place cannot freely spread to another. It is the single most impactful control in OT security, and the practical expression of the Purdue Model from Lesson 3.</p>

      <h3>The air-gap myth</h3>
      <p>Many plants believe they are protected by an <strong>air gap</strong> — a complete physical disconnection between OT and every other network. It is one of the most dangerous beliefs in the field, because it is almost always <em>false</em>. Real "air-gapped" plants routinely have:</p>
      <ul>
        <li><strong>USB drives and portable media</strong> carried in by staff and contractors (this is how Stuxnet crossed).</li>
        <li><strong>Vendor and maintenance laptops</strong> that plug into OT for servicing and IT for email — a walking bridge.</li>
        <li><strong>Forgotten modems and remote-access links</strong> installed years ago for convenience.</li>
        <li><strong>Historian and data connections</strong> deliberately built to feed business systems.</li>
        <li><strong>Temporary "just for this project" links</strong> that quietly become permanent.</li>
      </ul>
      <p>The lesson is not that air gaps are useless, but that a <em>claimed</em> air gap is a hypothesis to verify, not a fact to trust. Assume there is a path until you have proven, connection by connection, that there is not — and even then, keep watching.</p>

      <h3>Segmentation done right</h3>
      <p>Instead of one flat network where any device can reach any other (the worst case, and sadly common), you build defensible zones:</p>
      <table>
        <thead><tr><th>Technique</th><th>What it does</th></tr></thead>
        <tbody>
          <tr><td><strong>The IDMZ</strong></td><td>The buffer between OT and IT — no traffic crosses in one hop (Lesson 3). The keystone of OT segmentation.</td></tr>
          <tr><td><strong>Zone firewalls</strong></td><td>Enforce which zones may talk, in which direction, using which protocols. A rule might permit only the historian replica to pull data, and only outbound.</td></tr>
          <tr><td><strong>Data diodes</strong></td><td>Hardware that physically permits data to flow only one way — data can leave OT for monitoring, but nothing can flow back in. Ideal for exporting the historian safely.</td></tr>
          <tr><td><strong>Micro-segmentation</strong></td><td>Finer zones even within OT — e.g. separating each process cell — so a compromise is boxed into the smallest possible area.</td></tr>
          <tr><td><strong>Jump hosts</strong></td><td>A single hardened, monitored gateway that all remote/administrative access must pass through, rather than direct connections.</td></tr>
        </tbody>
      </table>

      <h3>The data diode: one-way security</h3>
      <p>The <strong>data diode</strong> deserves special mention because it enforces its guarantee in <em>hardware</em>, not software. Physically, light or current can travel in only one direction, so it is impossible — not merely disallowed — for traffic to flow back toward the process. This lets a plant reap the benefits of convergence (send data up for analytics and monitoring) while making the return path a physical impossibility. It is the closest thing to a real, usable air gap that still lets data out.</p>

      <h3>Assume breach, contain blast radius</h3>
      <p>Modern OT segmentation assumes an attacker <em>will</em> eventually get a foothold somewhere. The design goal shifts from "keep everyone out" (impossible) to "when someone gets in, ensure they land in a small, contained zone with no easy path to the controllers or the safety system." Segmentation is what turns a breach into an incident instead of a catastrophe.</p>

      <blockquote>Two sentences to remember: A flat OT network means one compromised laptop can reach every controller. Good segmentation — anchored by the IDMZ and, where justified, data diodes — means a breach is boxed in, buying the defender time and limiting the physical consequences.</blockquote>
    `,
    quizzes: [
      { id: "scada-l8-q1", question: "What is network segmentation in OT?", options: ["Deleting the network", "Dividing the network into zones so a compromise can't freely spread", "Connecting all devices together", "Encrypting every packet"], correctAnswerIndex: 1, explanation: "Segmentation splits the network into defensible zones, limiting how far an attacker can move after a compromise." },
      { id: "scada-l8-q2", question: "Why is a claimed 'air gap' often a dangerous belief?", options: ["Air gaps are illegal", "Real 'isolated' plants usually still have USB drives, vendor laptops, modems, and data links crossing the boundary", "Air gaps slow the network", "It is never claimed"], correctAnswerIndex: 1, explanation: "Supposed air gaps are frequently bridged by removable media, maintenance laptops, forgotten links, and historian connections." },
      { id: "scada-l8-q3", question: "How should a defender treat a claimed air gap?", options: ["As a proven fact to trust completely", "As a hypothesis to verify connection by connection, while continuing to monitor", "As irrelevant", "As a reason to skip all other controls"], correctAnswerIndex: 1, explanation: "An air gap should be assumed breached until proven otherwise, and monitoring should continue even then." },
      { id: "scada-l8-q4", question: "What is the keystone of OT segmentation between IT and OT?", options: ["The IDMZ", "A single shared switch", "The internet router", "A USB drive"], correctAnswerIndex: 0, explanation: "The Industrial DMZ is the central buffer zone that brokers all OT/IT traffic without direct single-hop crossing." },
      { id: "scada-l8-q5", question: "What does a data diode enforce, and how?", options: ["Two-way encryption via software", "One-way data flow, enforced physically in hardware", "Faster PLC scanning", "Password rotation"], correctAnswerIndex: 1, explanation: "A data diode physically permits data to travel in only one direction, making a return path a hardware impossibility." },
      { id: "scada-l8-q6", question: "Why is a data diode ideal for exporting historian data?", options: ["It blocks all data", "Data can leave OT for monitoring while nothing can flow back into the process", "It speeds up the historian", "It authenticates Modbus"], correctAnswerIndex: 1, explanation: "The diode lets process data flow out for analytics while physically preventing any inbound traffic toward the controllers." },
      { id: "scada-l8-q7", question: "What is the danger of a flat OT network?", options: ["It is too secure", "One compromised device (e.g. a laptop) can reach every controller", "It cannot carry Modbus", "It has no HMIs"], correctAnswerIndex: 1, explanation: "In a flat network any device can reach any other, so a single compromise can spread to all controllers." },
      { id: "scada-l8-q8", question: "What is the 'assume breach' design goal in OT segmentation?", options: ["Guarantee no one ever gets in", "Ensure that when someone gets in, they land in a small contained zone far from controllers and safety systems", "Give up on defence", "Connect the SIS to the internet"], correctAnswerIndex: 1, explanation: "Assuming an eventual foothold, segmentation aims to contain the blast radius so a breach can't easily reach critical systems." },
    ],
  },

  // ── LESSON 9 ───────────────────────────────────────────────────────────────
  {
    title: "09 // Monitoring OT Networks & Safety Instrumented Systems",
    summary: "Watching an OT network without disturbing it — passive monitoring and baselining — and the special role of the safety system as the last line of defence.",
    content: `
      <h2>Watch quietly, protect fiercely</h2>
      <p>Two ideas dominate the detection side of OT defence. First, because you must not disturb fragile live systems, you monitor <strong>passively</strong>. Second, above the entire control system sits a separate protective layer — the <strong>Safety Instrumented System</strong> — whose independence you must preserve at all costs. This lesson covers both.</p>

      <h3>Passive monitoring: the OT-safe way to see</h3>
      <p>In IT you might actively scan and probe. In OT that can crash devices (Lesson 4), so the preferred approach is <strong>passive network monitoring</strong>: you tap a copy of the traffic and analyse it off to the side, touching nothing on the wire. Common mechanisms:</p>
      <ul>
        <li><strong>SPAN / mirror ports</strong> on a switch copy traffic to a monitoring sensor.</li>
        <li><strong>Network TAPs</strong> — dedicated hardware that copies traffic, often paired with data diodes so the monitoring path is provably one-way.</li>
      </ul>
      <p>The sensor sees everything but sends nothing to the control devices — zero risk of disturbing the process. Specialist OT monitoring platforms (for example Dragos, Nozomi Networks, and Claroty) are built exactly around this passive, protocol-aware model.</p>

      <h3>Why OT is a monitoring dream: baselining</h3>
      <p>Here is the great advantage of OT over IT. Business networks are chaotic — users browse random sites, install apps, behave unpredictably. OT traffic is the opposite: <strong>remarkably static and repetitive.</strong> The same HMI polls the same PLC for the same registers on the same schedule, day after day. That predictability makes <strong>baselining</strong> — learning exactly what "normal" looks like — unusually powerful. Once you know the normal conversation, anomalies leap out:</p>
      <ul>
        <li>A <em>new device</em> appearing on the network that was never there before.</li>
        <li>A <em>new protocol or command</em> — e.g. someone issuing PLC <em>programming</em> commands during production, not a maintenance window.</li>
        <li>A <em>new conversation</em> — a device suddenly talking to a controller it has never contacted.</li>
        <li>A change in <em>timing or volume</em> — polling that suddenly speeds up or floods.</li>
      </ul>
      <p>In IT, anomaly detection drowns in false positives. In OT, a deviation from a tight baseline is genuinely suspicious — which is why baselining is the heart of OT detection.</p>

      <h3>The Safety Instrumented System (SIS)</h3>
      <p>The <strong>SIS</strong> is a dedicated, independent system with exactly one job: bring the process to a safe state if it heads toward a dangerous condition — regardless of what the control system is doing. If pressure exceeds a hard limit, the SIS trips: it opens a relief valve or shuts the unit down. It is the last line of defence against physical catastrophe, and it is deliberately kept <strong>separate and simple</strong> so it will work even when everything else has failed or been compromised.</p>
      <p>Safety systems are rated by <strong>Safety Integrity Level (SIL 1–4)</strong> under standards like IEC 61508 — a higher SIL means a more reliable, more rigorously verified safety function. The key security principle, underscored by the Triton attack (Lesson 7), is <strong>independence</strong>: the SIS must not share a network, workstation, or trust boundary with the ordinary control system. The moment the SIS becomes reachable from the control network, the last line of defence becomes a target — which is exactly what Triton exploited.</p>

      <table>
        <thead><tr><th>Layer</th><th>Job</th><th>Security principle</th></tr></thead>
        <tbody>
          <tr><td>Basic Process Control System (BPCS)</td><td>Run the process day-to-day</td><td>Segment and monitor it.</td></tr>
          <tr><td>Safety Instrumented System (SIS)</td><td>Force a safe state in an emergency</td><td>Keep it independent and separate — always.</td></tr>
        </tbody>
      </table>

      <blockquote>Two commandments of this lesson: (1) Monitor passively — tap the traffic, touch nothing, and let OT's beautiful predictability make your baseline razor-sharp. (2) Never let the safety system share fate with the control system; its independence is what stands between an incident and a disaster.</blockquote>
    `,
    quizzes: [
      { id: "scada-l9-q1", question: "Why is passive monitoring preferred in OT?", options: ["It is cheaper only", "Active scanning can crash fragile OT devices, so passive monitoring observes traffic without touching the wire", "It encrypts the process", "It speeds up PLCs"], correctAnswerIndex: 1, explanation: "Passive monitoring analyses a copy of the traffic, avoiding the active probing that can disrupt or crash delicate OT devices." },
      { id: "scada-l9-q2", question: "Which mechanism copies switch traffic to a monitoring sensor?", options: ["A SPAN/mirror port", "A power supply", "A ladder-logic block", "A relief valve"], correctAnswerIndex: 0, explanation: "SPAN (mirror) ports and network TAPs copy traffic to a passive monitoring sensor without affecting the control devices." },
      { id: "scada-l9-q3", question: "Why is baselining unusually powerful in OT compared to IT?", options: ["OT traffic is random and chaotic", "OT traffic is static and repetitive, so deviations from normal stand out clearly", "OT has no traffic", "IT cannot be baselined at all"], correctAnswerIndex: 1, explanation: "OT's predictable, repetitive communication makes a tight baseline effective, so anomalies are genuinely suspicious rather than noise." },
      { id: "scada-l9-q4", question: "Which of these would be a suspicious anomaly against an OT baseline?", options: ["The same HMI polling the same PLC on schedule", "PLC programming commands issued during production instead of a maintenance window", "Normal sensor readings", "The historian recording data as usual"], correctAnswerIndex: 1, explanation: "Programming/engineering commands outside a maintenance window deviate from the baseline and warrant investigation." },
      { id: "scada-l9-q5", question: "What is the single job of a Safety Instrumented System (SIS)?", options: ["To run the process efficiently", "To bring the process to a safe state if it heads toward a dangerous condition", "To display graphics", "To store historical data"], correctAnswerIndex: 1, explanation: "The SIS independently forces the process into a safe state during a hazardous condition — the last line of defence." },
      { id: "scada-l9-q6", question: "What does a Safety Integrity Level (SIL) indicate?", options: ["Network speed", "The reliability/rigour of a safety function (higher SIL = more reliable)", "The number of PLCs", "The encryption strength"], correctAnswerIndex: 1, explanation: "SIL (1–4) rates how reliable and rigorously verified a safety function is; a higher SIL means greater required reliability." },
      { id: "scada-l9-q7", question: "What is the key security principle for the SIS, reinforced by Triton?", options: ["It should share the control network for convenience", "It must remain independent and separate from the ordinary control system", "It should be connected to the internet", "It should be patched daily during production"], correctAnswerIndex: 1, explanation: "The SIS must stay independent; once reachable from the control network it becomes a target, as the Triton attack demonstrated." },
      { id: "scada-l9-q8", question: "Why are specialist OT monitoring platforms (Dragos, Nozomi, Claroty) designed to be passive and protocol-aware?", options: ["To actively reboot PLCs", "To safely observe OT traffic and understand industrial protocols without disturbing the process", "To replace the SIS", "To encrypt Modbus"], correctAnswerIndex: 1, explanation: "These platforms passively watch traffic and parse industrial protocols, giving deep visibility without the risk of active interaction." },
    ],
  },

  // ── LESSON 10 ──────────────────────────────────────────────────────────────
  {
    title: "10 // Defense Frameworks: IEC 62443 & MITRE ATT&CK for ICS",
    summary: "The two frameworks that organise professional OT defence — the IEC 62443 standard for building secure systems and ATT&CK for ICS for understanding attackers.",
    content: `
      <h2>From ad-hoc to professional</h2>
      <p>Everything you've learned — Purdue zones, inverted priorities, unauthenticated protocols, segmentation, monitoring, safety — comes together in two industry frameworks. One tells you <em>how to build and manage</em> a secure OT program (IEC 62443); the other gives you a shared language for <em>how attackers behave</em> in ICS (MITRE ATT&CK for ICS). A professional defender speaks both.</p>

      <h3>IEC 62443 — the standard for securing industrial systems</h3>
      <p><strong>IEC 62443</strong> (evolved from the ISA-99 work) is the leading international family of standards for the security of Industrial Automation and Control Systems. Rather than a checklist, it's a comprehensive framework covering the whole lifecycle and every party involved. A few of its core ideas you should recognise:</p>
      <ul>
        <li><strong>Zones and conduits</strong> — the formal model (met in Lesson 3): group assets into zones by security need, and control every conduit between them. This is segmentation raised to a design principle.</li>
        <li><strong>Security Levels (SL 1–4)</strong> — each zone is assigned a target Security Level based on the threat it must resist, from casual/accidental (SL 1) up to a sophisticated, well-resourced attacker (SL 4). You then implement controls sufficient to meet that level.</li>
        <li><strong>Shared responsibility</strong> — the standard addresses <em>asset owners</em> (the plant), <em>system integrators</em> (who build it), and <em>product suppliers</em> (who make the devices). Security is everyone's job, not a bolt-on.</li>
        <li><strong>Foundational Requirements</strong> — seven pillars such as identification/authentication control, use control, system integrity, data confidentiality, restricted data flow, timely response to events, and resource availability.</li>
      </ul>
      <p>When someone says a plant is "aligned to 62443," they mean it has zones and conduits, assigned security levels, and a managed program — not just a firewall someone installed once.</p>

      <h3>MITRE ATT&CK for ICS — the map of attacker behaviour</h3>
      <p>You met MITRE ATT&CK for enterprise elsewhere; there is a dedicated <strong>ATT&CK for ICS</strong> matrix built for control systems. Like its sibling, it organises real adversary behaviour into <strong>tactics</strong> (the attacker's goal) and <strong>techniques</strong> (how they achieve it), but with tactics unique to the industrial world. Two ICS-specific tactics matter most and headline this course's threat model:</p>
      <table>
        <thead><tr><th>ICS Tactic</th><th>Attacker's goal</th><th>Example technique</th></tr></thead>
        <tbody>
          <tr><td><strong>Impair Process Control</strong></td><td>Manipulate, disable, or damage the physical process</td><td>T0836 Modify Parameter; unauthorized command messages to a PLC.</td></tr>
          <tr><td><strong>Inhibit Response Function</strong></td><td>Prevent safety/protection systems from responding</td><td>T0880 Loss of Safety; blocking or disabling the SIS (cf. Triton).</td></tr>
          <tr><td>Initial Access</td><td>Get into the OT environment</td><td>T0847 Replication Through Removable Media (cf. Stuxnet's USB).</td></tr>
          <tr><td>Collection</td><td>Gather process data to plan the attack</td><td>Reading points/registers, capturing HMI screens.</td></tr>
        </tbody>
      </table>
      <p>Mapping detections to ATT&CK for ICS does the same work it does in IT: it reveals coverage blind spots, lets defenders communicate precisely ("we detected an <em>Impair Process Control</em> attempt"), and ties your defences to what real ICS adversaries actually do.</p>

      <h3>How the two frameworks fit together</h3>
      <p>Think of them as blueprint and threat map. <strong>IEC 62443 is the blueprint</strong>: it structures how you build zones, assign security levels, and run a defensible program. <strong>ATT&CK for ICS is the threat map</strong>: it catalogues the adversary moves your program must withstand. You use 62443 to design the defence and ATT&CK to pressure-test it — asking, for each attacker technique, "which zone, conduit, and control stops or detects this?"</p>

      <h3>Bringing the course home</h3>
      <p>Every lesson now connects. Field devices (L2) trust unauthenticated protocols (L5); you place them in Purdue levels (L3) and honour OT's safety-first priorities (L4); convergence (L6) exposed them, as the case studies showed (L7); so you defend with segmentation and the IDMZ (L8), passive monitoring and an independent SIS (L9), all organised by IEC 62443 and validated against MITRE ATT&CK for ICS (L10). That integrated picture — cyber defending the physical, from the sensor to the standard — is what an OT security professional carries to the job.</p>

      <blockquote>Final takeaway: OT security is not IT security with different acronyms. It is the discipline of keeping a physical process running safely while adversaries try to reach the machinery. Build to IEC 62443, think in MITRE ATT&CK for ICS, and never forget that on the other end of the packet is something that moves.</blockquote>
    `,
    quizzes: [
      { id: "scada-l10-q1", question: "What is IEC 62443?", options: ["A single firewall product", "The leading family of standards for securing Industrial Automation and Control Systems", "A type of PLC", "A Modbus function code"], correctAnswerIndex: 1, explanation: "IEC 62443 (evolved from ISA-99) is the international standards family for ICS security across the whole lifecycle." },
      { id: "scada-l10-q2", question: "In IEC 62443, what does a Security Level (SL 1–4) express?", options: ["The physical height of a device", "The strength of threat a zone's controls must resist, from casual/accidental up to a sophisticated attacker", "The number of PLCs allowed", "The encryption speed"], correctAnswerIndex: 1, explanation: "Security Levels rate the sophistication of threat a zone must withstand, guiding how strong its controls need to be." },
      { id: "scada-l10-q3", question: "IEC 62443 assigns responsibility to which parties?", options: ["Only the plant owner", "Asset owners, system integrators, and product suppliers", "Only device manufacturers", "Only the government"], correctAnswerIndex: 1, explanation: "62443 treats security as shared across asset owners, integrators, and suppliers rather than any single party's job." },
      { id: "scada-l10-q4", question: "What does 'zones and conduits' formalise in IEC 62443?", options: ["Physical plumbing", "Grouping assets into zones by security need and controlling every pathway (conduit) between them", "A backup schedule", "A password policy"], correctAnswerIndex: 1, explanation: "Zones and conduits raise segmentation to a design principle: group by security requirement and guard every crossing." },
      { id: "scada-l10-q5", question: "What is MITRE ATT&CK for ICS?", options: ["A firewall brand", "A knowledge base of adversary tactics and techniques specific to control systems", "A type of SIS", "An encryption standard"], correctAnswerIndex: 1, explanation: "ATT&CK for ICS is a dedicated matrix cataloguing real adversary behaviour in industrial control environments." },
      { id: "scada-l10-q6", question: "Which ICS tactic describes an attacker preventing the safety system from responding?", options: ["Collection", "Inhibit Response Function", "Initial Access", "Reconnaissance"], correctAnswerIndex: 1, explanation: "Inhibit Response Function covers blocking or disabling protective/safety systems, as seen with the Triton attack." },
      { id: "scada-l10-q7", question: "Stuxnet's spread via infected USB drives best maps to which ATT&CK for ICS idea?", options: ["Impair Process Control only", "Initial Access via Replication Through Removable Media", "Data confidentiality", "Resource availability"], correctAnswerIndex: 1, explanation: "Crossing into the environment through USB media is an Initial Access technique (Replication Through Removable Media)." },
      { id: "scada-l10-q8", question: "How do IEC 62443 and ATT&CK for ICS complement each other?", options: ["They are identical", "62443 is the blueprint for building the defence; ATT&CK for ICS is the threat map used to pressure-test it", "Both are firewalls", "Neither applies to OT"], correctAnswerIndex: 1, explanation: "62443 structures how you build and manage secure OT, while ATT&CK for ICS catalogues the attacker moves your design must withstand." },
    ],
  },
];
