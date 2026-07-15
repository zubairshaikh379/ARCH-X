// Digital Forensics & Incident Response (DFIR) sandbox
// Authorized-education, conceptual lab. Learners examine host artifacts,
// reconstruct a timeline, spot a persistence mechanism used for exfiltration,
// and extract the IOC that unlocks the flag.
export const SANDBOX = {
  objective:
    "Workstation FIN-WS07 is suspected of nightly data exfiltration. Examine the acquired artifacts — the super-timeline, the registry Run keys, and the responder's notes — to reconstruct what happened. Identify the persistence mechanism the attacker used to survive reboots and drive the exfil, then extract its indicator of compromise. Analysing the CORRECT persistence artifact reveals the flag.",
  hints: [
    "Start by exploring. Run 'ls' to see the acquired artifacts, then read the responder's notes with 'cat notes.txt' to understand the scope.",
    "Persistence usually means something auto-starts. Read the autoruns with 'cat registry_run.txt' and look for a value that is NOT a legitimate signed application.",
    "Correlate the suspicious Run key against the super-timeline. Try 'grep updater timeline.txt' — a legitimate updater would not be spawning a scripting host that then opens an outbound network socket at 02:00.",
    "Once you've confirmed the rogue persistence entry, analyse it by its exact IOC. The command form is:  analyze <sha256-hash>  — substitute the hash the notes and timeline attribute to the malicious 'WinUpdater' value.",
  ],
  files: {
    "notes.txt":
      "IR CASE #DFIR-1187 — Host FIN-WS07 (Finance)\n" +
      "Reporter: nightly egress spikes to 45.77.x.x observed by netflow, ~02:00 local.\n" +
      "Acquired: registry hives (autoruns), plaso super-timeline (timeline.txt).\n" +
      "\n" +
      "Known-good baseline for this host:\n" +
      "  - OneDrive.exe    sha256 aa11bb22... (signed, Microsoft)\n" +
      "  - Teams.exe       sha256 cc33dd44... (signed, Microsoft)\n" +
      "Anything auto-starting a scripting host (wscript/powershell) from a user-writable\n" +
      "path is NOT baseline. Two hashes appear in the artifacts — one benign updater,\n" +
      "one masquerading as an updater. Confirm which one owns the 02:00 egress before\n" +
      "you analyze it.",
    "registry_run.txt":
      "HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\n" +
      "-----------------------------------------------------------\n" +
      "  OneDriveSetup   -> C:\\Program Files\\Microsoft OneDrive\\OneDrive.exe /background\n" +
      "  GoogleUpdate    -> C:\\Program Files (x86)\\Google\\Update\\GoogleUpdate.exe /c\n" +
      "  WinUpdater      -> wscript.exe C:\\Users\\jchen\\AppData\\Roaming\\winupdater.js\n" +
      "\n" +
      "NOTE: 'WinUpdater' runs a .js via wscript from a roaming user profile path.\n" +
      "Legitimate Windows Update does NOT install here and is not named 'WinUpdater'.\n" +
      "sha256 of winupdater.js (per autoruns hash column): d41d8cd98f00b204e9800998ecf8427e",
    "timeline.txt":
      "TIME(local)          SOURCE      EVENT\n" +
      "-------------------------------------------------------------------------\n" +
      "2026-06-30 09:14:02  WEBHIST     user jchen opened invoice_q2.xlsm (macro enabled)\n" +
      "2026-06-30 09:14:37  FILE        created C:\\Users\\jchen\\AppData\\Roaming\\winupdater.js\n" +
      "2026-06-30 09:14:38  REG         Run key 'WinUpdater' set -> wscript winupdater.js\n" +
      "2026-06-30 02:00:11  PROC        wscript.exe spawned by userinit (persistence trigger)\n" +
      "2026-06-30 02:00:12  PROC        winupdater.js -> powershell -enc <base64> (outbound)\n" +
      "2026-06-30 02:00:19  NET         TCP connect 45.77.14.203:443  (bytes_out=41.9MB)\n" +
      "2026-06-30 02:04:55  NET         TCP teardown 45.77.14.203:443\n" +
      "-------------------------------------------------------------------------\n" +
      "IOC map: winupdater.js sha256 = d41d8cd98f00b204e9800998ecf8427e (rogue, 02:00 egress)\n" +
      "         GoogleUpdate.exe sha256 = e99a18c428cb38d5f260853678922e03 (benign, no egress)",
  },
  commands: {
    "analyze e99a18c428cb38d5f260853678922e03":
      "WARNING: e99a18c428cb38d5f260853678922e03 resolves to GoogleUpdate.exe — a\n" +
      "signed, benign updater with NO outbound activity in the timeline. This is not\n" +
      "the persistence used for exfil. No flag — re-read timeline.txt and match the\n" +
      "hash tied to the 02:00 egress.",
    "analyze d41d8cd98f00b204e9800998ecf8427e":
      "MATCH: d41d8cd98f00b204e9800998ecf8427e = winupdater.js (rogue 'WinUpdater' Run key).\n" +
      "Persistence: HKLM Run -> wscript -> winupdater.js -> powershell -enc -> 45.77.14.203:443.\n" +
      "This is the mechanism driving the nightly 41.9MB exfil. IOC confirmed and contained.\n" +
      "Flag decrypted:\n" +
      "FLAG: {{FLAG}}\n" +
      "Submit it above to close case DFIR-1187.",
  },
} as const;
