// Threat Hunting sandbox
// Authorized-education, conceptual lab. Learners hunt across EDR process events,
// DNS resolver logs, and proxy notes to distinguish routine traffic from
// C2 beaconing / LOLBin abuse, confirm the single compromised host, and
// extract the malicious beacon domain that unlocks the flag.
export const SANDBOX = {
  objective:
    "Netflow shows one workstation on the FIN subnet reaching out on a suspiciously regular heartbeat. You have three artifacts to hunt through: the DNS resolver log, the EDR process-event feed, and the responder's notes. Distinguish normal periodic traffic (NTP, telemetry) from malware beaconing to a command-and-control server, spot the living-off-the-land binary that launches it, and identify the malicious C2 domain. Confirming the CORRECT beacon domain reveals the flag.",
  hints: [
    "Start by exploring. Run 'ls' to see the artifacts, then read the responder's notes with 'cat notes.txt' to learn the baseline and what 'normal' looks like on this subnet.",
    "Beacons phone home on a fixed interval. Read the resolver log with 'cat dns_log.txt' and look for one domain queried at an almost perfectly regular cadence — real user browsing is bursty and irregular, a beacon is metronomic.",
    "A regular domain alone isn't proof — telemetry beacons too. Pivot to the endpoint: 'grep beacon proc_events.txt' and find which process is doing the DNS lookups. A signed browser resolving a CDN is fine; a LOLBin (rundll32 / mshta / regsvr32) reaching the internet from a user path is not.",
    "Once you've matched the metronomic domain to the LOLBin that resolves it, confirm it by its exact indicator. The command form is:  confirm <c2-domain>  — substitute the beacon domain the notes and process feed tie to the rundll32 activity.",
  ],
  files: {
    "notes.txt":
      "THREAT HUNT #TH-2043 — Host FIN-WS12 (Finance subnet 10.20.30.0/24)\n" +
      "Trigger: netflow flagged a ~60s periodic outbound heartbeat from 10.20.30.42.\n" +
      "Artifacts: DNS resolver log (dns_log.txt), EDR process events (proc_events.txt).\n" +
      "\n" +
      "Known-good periodic traffic on this subnet (do NOT chase these):\n" +
      "  - time.windows.com     -> NTP sync, ~every 15 min, by svchost (signed)\n" +
      "  - telemetry.msedge.net -> browser telemetry, by msedge.exe (signed)\n" +
      "A beacon is different: a FIXED short interval (~60s), same domain every time,\n" +
      "and — the giveaway — the DNS lookup is issued by a scripting/LOLBin host, not by\n" +
      "a browser or svchost. Two candidate domains look 'regular' in the logs; one is\n" +
      "benign telemetry, one is C2. Confirm which is launched by a LOLBin before you act.",
    "dns_log.txt":
      "TIME(local)   CLIENT         QUERY                          RESULT\n" +
      "----------------------------------------------------------------------------\n" +
      "10:00:03      10.20.30.42    time.windows.com               13.86.101.20\n" +
      "10:00:12      10.20.30.42    cdn.jsdelivr.net               104.16.85.20  (user browsing)\n" +
      "10:00:31      10.20.30.42    telemetry.msedge.net           204.79.197.219\n" +
      "10:01:01      10.20.30.42    sync-api-cdn.net               45.61.137.9\n" +
      "10:02:02      10.20.30.42    sync-api-cdn.net               45.61.137.9\n" +
      "10:03:01      10.20.30.42    sync-api-cdn.net               45.61.137.9\n" +
      "10:03:44      10.20.30.42    www.reuters.com                159.180.14.7  (user browsing)\n" +
      "10:04:02      10.20.30.42    sync-api-cdn.net               45.61.137.9\n" +
      "10:05:01      10.20.30.42    sync-api-cdn.net               45.61.137.9\n" +
      "10:15:07      10.20.30.42    time.windows.com               13.86.101.20\n" +
      "----------------------------------------------------------------------------\n" +
      "OBS: 'sync-api-cdn.net' resolves to 45.61.137.9 every ~60s, no jitter. NTP is\n" +
      "every 15 min (benign). telemetry.msedge.net appears once (benign). The 60s\n" +
      "metronome is the candidate beacon — pivot to proc_events.txt to attribute it.",
    "proc_events.txt":
      "TIME(local)   HOST         PID    PROCESS / EDR EVENT\n" +
      "-------------------------------------------------------------------------------\n" +
      "10:00:12      FIN-WS12     4120   msedge.exe -> DNS cdn.jsdelivr.net (signed, browser)\n" +
      "10:00:31      FIN-WS12     4120   msedge.exe -> DNS telemetry.msedge.net (signed telemetry)\n" +
      "10:01:01      FIN-WS12     6644   rundll32.exe C:\\Users\\amalik\\AppData\\Local\\Temp\\upd.dll,Start\n" +
      "10:01:01      FIN-WS12     6644   rundll32.exe -> DNS sync-api-cdn.net  [beacon] outbound 443\n" +
      "10:02:02      FIN-WS12     6644   rundll32.exe -> DNS sync-api-cdn.net  [beacon] outbound 443\n" +
      "10:03:01      FIN-WS12     6644   rundll32.exe -> DNS sync-api-cdn.net  [beacon] outbound 443\n" +
      "10:15:07      FIN-WS12     1008   svchost.exe -> DNS time.windows.com (signed, NTP)\n" +
      "-------------------------------------------------------------------------------\n" +
      "ATTRIB: the ~60s DNS lookups for 'sync-api-cdn.net' are issued by rundll32.exe\n" +
      "loading upd.dll from a user Temp path — classic LOLBin C2. 'telemetry.msedge.net'\n" +
      "is issued by signed msedge.exe (benign). C2 domain = sync-api-cdn.net.",
  },
  commands: {
    "confirm telemetry.msedge.net":
      "WARNING: telemetry.msedge.net is resolved by signed msedge.exe — routine browser\n" +
      "telemetry, not a beacon. It appears once and is not driven by a LOLBin. This is\n" +
      "not the C2. No flag — re-read proc_events.txt and match the metronomic ~60s\n" +
      "domain to the rundll32 LOLBin activity.",
    "confirm sync-api-cdn.net":
      "MATCH: sync-api-cdn.net (45.61.137.9) is queried every ~60s with zero jitter and\n" +
      "is resolved by rundll32.exe loading upd.dll from a user Temp path — LOLBin C2\n" +
      "beaconing from FIN-WS12 (10.20.30.42). Compromised host and C2 domain confirmed.\n" +
      "Flag decrypted:\n" +
      "FLAG: {{FLAG}}\n" +
      "Submit it above to close hunt TH-2043.",
  },
} as const;
