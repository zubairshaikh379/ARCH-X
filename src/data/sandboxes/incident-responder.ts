// Incident Responder sandbox
// Authorized-education, conceptual lab. Learners triage an active intrusion from
// acquired evidence (SIEM alerts, netstat capture, responder notes), identify the
// compromised host beaconing to the attacker's C2, and contain it by isolating the
// correct host. Isolating the CORRECT compromised host reveals the flag.
export const SANDBOX = {
  objective:
    "An intrusion is UNDERWAY. Alerts fired minutes ago on subnet 10.20.0.0/24. Triage the evidence — the SIEM alert feed, the live connection capture, and the on-call responder's notes — to determine which internal host is actively compromised and beaconing to the attacker's command-and-control (C2) server. Then CONTAIN it by isolating that host from the network. Isolating the CORRECT compromised host reveals the flag; isolating a healthy production host does not.",
  hints: [
    "Start by exploring. Run 'ls' to see the acquired evidence, then read the on-call notes with 'cat notes.txt' to understand which subnet and time window matter.",
    "An active compromise usually shows an outbound connection to an unfamiliar external IP. Read the connection capture with 'cat connections.txt' and look for an ESTABLISHED session from an internal 10.20.0.x host to a public IP that is NOT on the allow-list.",
    "Correlate that suspicious session against the alerts. Try 'grep beacon alerts.txt' — a compromised host repeatedly beacons to its C2 on a fixed interval, while a legit host just talks to known update/monitoring endpoints. Confirm which internal host owns the repeated C2 callback.",
    "Once you've confirmed the beaconing host, contain it by its exact internal IP. The command form is:  isolate-host <ip>  — substitute the 10.20.0.x address the alerts and capture attribute to the C2 beacon.",
  ],
  files: {
    "notes.txt":
      "IR TICKET #IR-2043 — Active incident, subnet 10.20.0.0/24 (Corp workstations)\n" +
      "On-call: netflow flagged repeated small outbound bursts to a non-corporate IP,\n" +
      "started ~03:12 local and STILL ongoing. Treat as active — contain before deep analysis.\n" +
      "\n" +
      "Egress allow-list (known-good external destinations):\n" +
      "  - 140.82.112.3    GitHub (dev traffic)\n" +
      "  - 13.107.42.14    Microsoft 365 / updates\n" +
      "  - 8.8.8.8         DNS resolver\n" +
      "Internal hosts on this subnet:\n" +
      "  - 10.20.0.15  build-runner   (CI, talks to GitHub — expect 140.82.112.3)\n" +
      "  - 10.20.0.22  hr-laptop      (should only reach M365 / DNS)\n" +
      "  - 10.20.0.31  file-server    (internal only, no direct internet egress)\n" +
      "Anything beaconing on a fixed interval to an IP NOT on the allow-list is the incident.\n" +
      "Confirm which host owns the callback in connections.txt before you isolate it.",
    "connections.txt":
      "PROTO  LOCAL (internal)      REMOTE (external)       STATE        NOTE\n" +
      "-------------------------------------------------------------------------------\n" +
      "tcp    10.20.0.15:52210     140.82.112.3:443        ESTABLISHED  github (allow-list)\n" +
      "tcp    10.20.0.31:445       10.20.0.22:61002        ESTABLISHED  internal smb (normal)\n" +
      "tcp    10.20.0.22:49771     185.220.101.47:8443     ESTABLISHED  <-- unknown external\n" +
      "tcp    10.20.0.22:49772     185.220.101.47:8443     TIME_WAIT    <-- repeat, same dst\n" +
      "tcp    10.20.0.22:49773     185.220.101.47:8443     ESTABLISHED  <-- repeat, same dst\n" +
      "udp    10.20.0.22:51330     8.8.8.8:53              -            dns (allow-list)\n" +
      "-------------------------------------------------------------------------------\n" +
      "185.220.101.47 is NOT on the egress allow-list. Only 10.20.0.22 (hr-laptop) is\n" +
      "talking to it — repeatedly, same port 8443. build-runner's github traffic is expected.",
    "alerts.txt":
      "SEV   TIME(local)   ALERT_ID   HOST         DETAIL\n" +
      "-------------------------------------------------------------------------------\n" +
      "HIGH  03:12:04      AL-7781    10.20.0.22   beacon: outbound to 185.220.101.47:8443\n" +
      "HIGH  03:13:04      AL-7782    10.20.0.22   beacon: outbound to 185.220.101.47:8443 (60s interval)\n" +
      "HIGH  03:14:04      AL-7783    10.20.0.22   beacon: outbound to 185.220.101.47:8443 (60s interval)\n" +
      "INFO  03:14:22      AL-7784    10.20.0.15   github pull from 140.82.112.3 (expected, CI)\n" +
      "MED   03:15:01      AL-7785    10.20.0.22   process 'svchost32.exe' spawned from %TEMP%\n" +
      "-------------------------------------------------------------------------------\n" +
      "Pattern: 10.20.0.22 (hr-laptop) beacons to C2 185.220.101.47 every 60s and ran a\n" +
      "masquerading process from TEMP. 10.20.0.15's only alert is expected CI traffic.",
  },
  commands: {
    "isolate-host 10.20.0.15":
      "WARNING: 10.20.0.15 is 'build-runner' (CI). Its only external session is to\n" +
      "140.82.112.3 (GitHub) — on the allow-list and matched by an INFO alert, not the\n" +
      "beacon. Isolating it would break the build pipeline and NOT stop the intrusion.\n" +
      "No flag — re-check connections.txt and alerts.txt for the host beaconing to the\n" +
      "off-allow-list C2.",
    "isolate-host 10.20.0.22":
      "SUCCESS: 10.20.0.22 (hr-laptop) quarantined — network access revoked, switch port\n" +
      "shut, session to C2 185.220.101.47:8443 severed. The 60s beacon has stopped.\n" +
      "Compromised host contained; evidence preserved for forensics.\n" +
      "Flag decrypted:\n" +
      "FLAG: {{FLAG}}\n" +
      "Submit it above to close incident IR-2043.",
  },
} as const;
