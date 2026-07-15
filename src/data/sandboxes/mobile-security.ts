// Mobile Application Security sandbox
// Authorized-education, conceptual lab. A production Android app is NEVER built
// or executed here — learners statically triage its DECOMPILED artifacts from an
// isolated review workstation: the resource strings, the local shared-prefs dump,
// and the pentester's scoping notes. Several config values look sensitive; only
// ONE is a genuine hardcoded secret stored insecurely on-device. Identify that
// exact secret and submit it. Reporting the CORRECT finding unlocks the flag.
export const SANDBOX = {
  objective:
    "The decompiled build of 'com.arch.wallet' has been dropped into this isolated review workstation. DO NOT build or run it — triage it statically. Inspect the resource strings (strings.xml), the on-device local storage dump (shared_prefs.txt), and the tester's scoping notes (notes.txt). Multiple config-looking values appear across the artifacts, but only ONE is a genuine hardcoded production secret persisted in insecure cleartext local storage (the kind that lets anyone with the APK impersonate the backend). Identify that exact secret value and submit it. Reporting the CORRECT insecure-storage finding reveals the flag.",
  hints: [
    "Start by exploring. Run 'ls' to see the decompiled artifacts, then read the tester's scope with 'cat notes.txt' and dump the resources with 'cat strings.xml'.",
    "Not every value is a real secret. Public API base URLs, Google Maps browser keys (restricted, meant to ship client-side), and app version labels are fine to embed. Narrow it down — try 'grep -i key strings.xml' and 'grep -i secret shared_prefs.txt' and ignore the values the notes flag as intentionally public.",
    "Correlate the two stores. A value that is BOTH hardcoded in the build AND written to plaintext shared_prefs (no Keystore, no encryption) with an admin/backend-signing purpose is the real insecure-storage finding. Try 'grep -i prod shared_prefs.txt' — look for the production backend signing secret, not the restricted maps key or the public base URL.",
    "Once you've confirmed the single production secret, report it by its exact value. The command form is:  report <secret> — substitute the full production backend signing secret string that appears in BOTH strings.xml and shared_prefs.txt, not the public maps key or the base URL.",
  ],
  files: {
    "notes.txt":
      "MOBILE APP ASSESSMENT #MOB-1187 — target: com.arch.wallet (Android, decompiled).\n" +
      "Environment: offline review box. Source is the apktool/jadx output only —\n" +
      "the app is NEVER installed or executed on this workstation.\n" +
      "SCOPE: find hardcoded secrets / insecure local storage / disabled TLS pinning.\n" +
      "\n" +
      "Triage findings so far:\n" +
      "  - strings.xml ships a Google Maps API key. Per dev team it is BROWSER-\n" +
      "    RESTRICTED and intended to ship client-side. Low risk / EXPECTED — not the finding.\n" +
      "  - The public API base URL (https://api.arch-wallet.example) is fine to embed.\n" +
      "  - shared_prefs shows SSL/certificate pinning is DISABLED (pinning_enabled=false)\n" +
      "    — a real weakness, note it, but it is not a submittable SECRET value.\n" +
      "  - CRITICAL: a PRODUCTION backend signing secret is hardcoded in the build AND\n" +
      "    persisted to plaintext shared_prefs (no Android Keystore, no encryption).\n" +
      "    Anyone unzipping the APK recovers it and can sign backend requests. THIS is\n" +
      "    the insecure-storage finding to report — confirm it in BOTH files first.",
    "strings.xml":
      "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n" +
      "<!-- decompiled res/values/strings.xml from com.arch.wallet -->\n" +
      "<resources>\n" +
      "    <string name=\"app_name\">ARCH Wallet</string>\n" +
      "    <string name=\"app_version\">4.2.0</string>\n" +
      "    <string name=\"api_base_url\">https://api.arch-wallet.example</string>\n" +
      "    <string name=\"google_maps_key\">AIzaSyD-PUBLIC-MAPS-browser-restricted-9x</string>\n" +
      "    <!-- flagged in review: production backend request-signing secret, hardcoded -->\n" +
      "    <string name=\"prod_backend_signing_secret\">sk_live_9f3ARCHwallet7c2b1e884a</string>\n" +
      "    <string name=\"support_email\">support@arch-wallet.example</string>\n" +
      "</resources>",
    "shared_prefs.txt":
      "-- on-device dump: /data/data/com.arch.wallet/shared_prefs/settings.xml (plaintext) --\n" +
      "onboarding_complete=true\n" +
      "theme=dark\n" +
      "api_base_url=https://api.arch-wallet.example\n" +
      "pinning_enabled=false                # SSL/cert pinning DISABLED (weakness, not a secret)\n" +
      "google_maps_key=AIzaSyD-PUBLIC-MAPS-browser-restricted-9x   # public/restricted, expected\n" +
      "# stored in CLEARTEXT shared_prefs (no Keystore) — recoverable from any device backup:\n" +
      "prod_backend_signing_secret=sk_live_9f3ARCHwallet7c2b1e884a\n" +
      "last_sync=2026-07-05T09:14:00Z\n" +
      "NOTE: the maps key and base URL are meant to be public. The 'sk_live_' production\n" +
      "signing secret persisted here in plaintext is the insecure-storage finding.",
  },
  commands: {
    "report https://api.arch-wallet.example":
      "WARNING: https://api.arch-wallet.example is the public API base URL. It is\n" +
      "designed to be embedded and reachable client-side. Not a secret. No flag —\n" +
      "re-read notes.txt for the production signing secret stored in plaintext.",
    "report AIzaSyD-PUBLIC-MAPS-browser-restricted-9x":
      "WARNING: this is the browser-RESTRICTED Google Maps key, intended to ship in the\n" +
      "client per the dev team. Shipping it is expected, low risk. Not the finding. No flag —\n" +
      "look for the 'sk_live_' backend signing secret in BOTH strings.xml and shared_prefs.txt.",
    "report pinning_enabled=false":
      "WARNING: disabled SSL/certificate pinning is a real weakness worth noting, but it is\n" +
      "a configuration flag, not a submittable SECRET value. No flag — report the exact\n" +
      "production signing secret string that was hardcoded and stored in cleartext.",
    "report sk_live_9f3ARCHwallet7c2b1e884a":
      "MATCH: sk_live_9f3ARCHwallet7c2b1e884a is the production backend request-signing\n" +
      "secret. Corroboration: hardcoded in strings.xml AND persisted to plaintext\n" +
      "shared_prefs with NO Android Keystore/encryption — fully recoverable from the APK\n" +
      "or a device backup, allowing backend request forgery. This is the insecure-storage\n" +
      "finding. App was triaged statically — never built or executed. Finding confirmed.\n" +
      "Flag decrypted:\n" +
      "FLAG: {{FLAG}}\n" +
      "Submit it above to close assessment MOB-1187.",
  },
} as const;
