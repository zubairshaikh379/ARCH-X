// Reverse Engineering & Malware Analysis sandbox
// Authorized-education, conceptual lab. The suspect binary is NEVER executed —
// learners triage it statically from an isolated analysis workstation using
// pre-captured artifacts (strings dump, import table, sandbox behavior report),
// identify the malicious command-and-control indicator, and extract the IOC
// that unlocks the flag.
export const SANDBOX = {
  objective:
    "A suspicious binary 'invoice_viewer.exe' was pulled from a quarantined email and dropped into this isolated analysis VM. DO NOT run it — triage it statically. Review the extracted strings, the import table, and the sandbox behavior report to determine what the sample does and where it phones home. Several URLs and hosts appear across the artifacts; only ONE is the true command-and-control (C2) endpoint the malware beacons to. Identify that C2 indicator and submit it for analysis. Analysing the CORRECT IOC reveals the flag.",
  hints: [
    "Start by exploring. Run 'ls' to see the captured artifacts, then read the analyst's scope with 'cat behavior.txt' and dump readable text with 'cat strings.txt'.",
    "Not every string is an indicator. Legitimate software links to Microsoft, certificate, and CDN hosts. Narrow it down — try 'grep http strings.txt' and ignore the benign telemetry/update domains an installer would normally contact.",
    "Correlate the imports with the behavior. The presence of WinHTTP/WinINet networking APIs plus a scheduled-task/registry Run persistence call means the URL it actually beacons to is the C2. Try 'grep beacon behavior.txt' and 'cat imports.txt' to see which host the resolved network call targets at a fixed interval.",
    "Once you've confirmed the single beaconing host, analyse it by its exact indicator. The command form is:  analyze <url>  — substitute the full C2 URL (scheme + host + path) that behavior.txt attributes to the 60-second beacon, not the benign update/CDN domains.",
  ],
  files: {
    "behavior.txt":
      "MALWARE ANALYSIS CASE #RE-2043 — sample: invoice_viewer.exe\n" +
      "Environment: air-gapped detonation VM (no real internet — DNS/HTTP sinkholed).\n" +
      "SHA256: 9f1c...a77b   Size: 214 KB   Packer: none (statically triageable).\n" +
      "SAFETY: sample is inert here. Do NOT copy it off the analysis host.\n" +
      "\n" +
      "Observed behavior (from sinkhole + API monitor):\n" +
      "  - On launch, decodes a config blob and resolves three hostnames.\n" +
      "  - Contacts https://update.microsoft.com/redist  -> benign OS component check.\n" +
      "  - Contacts https://cdn.jsdelivr.net/npm/chart   -> benign CDN asset (decoy).\n" +
      "  - BEACON: every 60s issues POST to https://cdn-analytics-sync.top/gate.php\n" +
      "           carrying a base64 host survey. THIS is the C2 channel.\n" +
      "  - Writes HKCU\\...\\Run value 'InvoiceViewer' for reboot persistence.\n" +
      "\n" +
      "Two of the three URLs are legitimate cover traffic. The 60s-interval POST to\n" +
      "the '.top' host is the real command-and-control. Confirm it against strings.txt\n" +
      "and imports.txt before you analyze the indicator.",
    "strings.txt":
      "-- printable strings extracted from invoice_viewer.exe --\n" +
      "MZ......This program cannot be run in DOS mode.\n" +
      "InvoiceViewer\n" +
      "Software\\Microsoft\\Windows\\CurrentVersion\\Run\n" +
      "https://update.microsoft.com/redist\n" +
      "https://cdn.jsdelivr.net/npm/chart\n" +
      "https://cdn-analytics-sync.top/gate.php\n" +
      "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)\n" +
      "beacon_interval=60\n" +
      "cmd=/c \n" +
      "base64: c3VydmV5\n" +
      "NOTE: the 'update.microsoft.com' and 'jsdelivr.net' strings are cover traffic;\n" +
      "the analytics-sync '.top' domain paired with gate.php is atypical for an invoice\n" +
      "viewer and matches the 60s beacon in behavior.txt.",
    "imports.txt":
      "-- import address table (selected) --\n" +
      "KERNEL32.dll : CreateProcessA, WriteFile, Sleep\n" +
      "ADVAPI32.dll : RegSetValueExA, RegCreateKeyExA        (persistence: Run key)\n" +
      "WININET.dll  : InternetOpenA, InternetConnectA,\n" +
      "               HttpOpenRequestA, HttpSendRequestA     (HTTP beacon capability)\n" +
      "CRYPT32.dll  : CryptStringToBinaryA                   (base64 decode of config)\n" +
      "\n" +
      "Interpretation: networking (WININET) + registry persistence (ADVAPI32) + base64\n" +
      "config (CRYPT32) is a classic beaconing trojan profile — consistent with the\n" +
      "60s POST to cdn-analytics-sync.top/gate.php, NOT with a passive document viewer.",
  },
  commands: {
    "analyze https://update.microsoft.com/redist":
      "WARNING: https://update.microsoft.com/redist is a legitimate Microsoft component\n" +
      "endpoint used here as cover traffic. It is NOT the C2. No flag — re-read\n" +
      "behavior.txt and match the URL tied to the 60-second beacon.",
    "analyze https://cdn.jsdelivr.net/npm/chart":
      "WARNING: https://cdn.jsdelivr.net/npm/chart is a benign public CDN asset (decoy).\n" +
      "No beacon interval, no persistence tie-in. This is not the C2. No flag —\n" +
      "look for the host paired with gate.php and the 60s POST.",
    "analyze https://cdn-analytics-sync.top/gate.php":
      "MATCH: https://cdn-analytics-sync.top/gate.php is the command-and-control channel.\n" +
      "Corroboration: WININET HTTP imports + base64 host survey + HKCU Run persistence\n" +
      "('InvoiceViewer') + 60s POST beacon. This '.top/gate.php' endpoint is the true IOC.\n" +
      "Sample triaged statically — never executed outside the isolated VM. IOC confirmed.\n" +
      "Flag decrypted:\n" +
      "FLAG: {{FLAG}}\n" +
      "Submit it above to close case RE-2043.",
  },
} as const;
