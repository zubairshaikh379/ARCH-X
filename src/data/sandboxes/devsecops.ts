// ─── DevSecOps Sandbox ────────────────────────────────────────────
// Authorized-education, conceptual lab. No pipelines are built and no real
// credentials exist here — the leaked key is a fabricated demo value and the
// "revoke" verb is simulated by the terminal engine (see App.tsx executeCmd).
// The mission teaches the DevSecOps loop: audit the CI/CD pipeline, IaC and
// dependency manifest → locate the real leaked secret (vs. the already-clean
// finding) → remediate correctly by REVOKING the burned credential at the
// provider, not merely scrubbing git history.
//
// Shape mirrors a course `simulation` block so the same engine drives it:
//   ls / cat / grep  → read `files`
//   objective        → `objective`
//   hint N           → `hints[N-1]`
//   <final command>  → `commands[...]`, with {{FLAG}} swapped for the live flag.

export const SANDBOX = {
  objective:
    "You are the DevSecOps engineer triaging the 'payments-service' repository before its " +
    "production deploy. Two findings are queued: the secret scanner flagged the CI/CD " +
    "pipeline, and a dependency audit ran against the manifest. Read the evidence on disk, " +
    "determine which finding is a REAL leak, and remediate it the correct way — a burned " +
    "static credential must be REVOKED at the provider, not just deleted from git. " +
    "Revoking the exact leaked key reveals the CTF flag; touching a safely-vaulted, in-use " +
    "key does not.",

  hints: [
    // 1 — explore
    "Start by exploring. Run 'ls', then read the pipeline with 'cat ci.yml', the dependency " +
      "manifest with 'cat requirements.txt', and the triage notes with 'cat notes.txt'. " +
      "Everything you need is already on disk.",
    // 2 — narrow the evidence
    "Compare the two findings. One env value in ci.yml is referenced safely from the secret " +
      "store (${{ secrets.* }}); another is a long-lived AWS credential pasted in as " +
      "plaintext. The requirements.txt audit came back clean. Try 'grep AKIA ci.yml' to " +
      "surface the hardcoded access key ID.",
    // 3 — commit to the finding
    "The plaintext AWS access key ID committed inside ci.yml is the real leak — once pushed " +
      "it is already exposed, so deleting the line is not enough; the key is burned and must " +
      "be revoked/rotated at the provider. Note in notes.txt that the vaulted key " +
      "(AKIAVAULTED0KGOOD00) is legitimately in use — revoking THAT breaks every deploy.",
    // 4 — exact command FORM (never the literal answer)
    "Remediate by revoking the leaked credential at the provider. The command form is:  " +
      "revoke-key <access-key-id>  — substitute the exact hardcoded key ID you found in ci.yml.",
  ],

  files: {
    "ci.yml":
      "# .github/workflows/deploy.yml  —  payments-service CI/CD pipeline\n" +
      "name: build-and-deploy\n" +
      "on: [push]\n" +
      "jobs:\n" +
      "  deploy:\n" +
      "    runs-on: ubuntu-latest\n" +
      "    env:\n" +
      "      # GOOD: pulled from the encrypted secret store at runtime\n" +
      "      REGISTRY_TOKEN: ${{ secrets.REGISTRY_TOKEN }}\n" +
      "    steps:\n" +
      "      - uses: actions/checkout@v4\n" +
      "      - name: Configure AWS\n" +
      "        run: |\n" +
      "          # BAD: long-lived credential hardcoded straight into the pipeline\n" +
      "          export AWS_ACCESS_KEY_ID=AKIAZ7LEAK3DC1DEMO0\n" +
      "          export AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENGleakedDEMOkey1\n" +
      "          aws s3 sync ./dist s3://prod-artifacts\n",

    "requirements.txt":
      "# Python dependency manifest (audited)\n" +
      "flask==3.0.3        # current — no known CVEs\n" +
      "requests==2.32.3    # patched — >= 2.32.0 fixes CVE-2024-35195\n" +
      "urllib3==2.2.2      # current — no known CVEs\n" +
      "# Dependency audit ran 2026-06-30: all pins up to date, no action needed.\n",

    "notes.txt":
      "DevSecOps triage — repo: payments-service\n" +
      "Finding queue:\n" +
      " 1. Secret scanner flagged the CI/CD workflow (ci.yml): a long-lived AWS access\n" +
      "    key is committed in PLAINTEXT instead of being referenced from the encrypted\n" +
      "    secret store (the way REGISTRY_TOKEN already is).\n" +
      " 2. Dependency audit of requirements.txt came back CLEAN (audited 2026-06-30).\n" +
      "\n" +
      "Remediation policy: a leaked static credential is already burned the moment it is\n" +
      "pushed. Deleting it from git history is NOT sufficient — you must REVOKE/rotate the\n" +
      "exact leaked access key ID at the provider.\n" +
      "\n" +
      "Do NOT touch the properly-vaulted key AKIAVAULTED0KGOOD00 — it lives only in the\n" +
      "secret store and is in active use; revoking it would break every running deploy.\n",
  },

  commands: {
    // Decoy — the safely-vaulted, in-use key: warns, no flag.
    "revoke-key AKIAVAULTED0KGOOD00":
      "WARNING: AKIAVAULTED0KGOOD00 is the properly-vaulted key stored only in the encrypted " +
      "secret store and actively used by live deploys (see notes.txt).\n" +
      "It was never leaked — revoking it would break every running pipeline and remediates " +
      "nothing.\n" +
      "No flag. Re-read ci.yml to find the credential that was actually committed in plaintext.",

    // Correct — the hardcoded access key ID leaked inside ci.yml.
    "revoke-key AKIAZ7LEAK3DC1DEMO0":
      "[*] Locating credential AKIAZ7LEAK3DC1DEMO0 at the identity provider…\n" +
      "[+] Match found: long-lived access key exposed in payments-service/ci.yml (plaintext).\n" +
      "[+] Access key DEACTIVATED and scheduled for deletion — the burned credential can no " +
      "longer authenticate.\n" +
      "[+] Follow-up queued: purge from git history and migrate the pipeline to " +
      "${{ secrets.* }} references.\n" +
      "FLAG: {{FLAG}}\n" +
      "[+] Leak remediated at the source. Submit the flag above to complete the mission.",
  },
} as const;
