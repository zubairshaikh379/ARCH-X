// ─── Active Directory Security Sandbox ────────────────────────────
// Authorized-education, conceptual lab. No real domain controller runs here —
// the SPN export, ACL report and analyst notes are fabricated demo values, and
// the "hardening" action is simulated by the terminal engine (see App.tsx
// executeCmd). The mission teaches the AD attack-path review loop: read an SPN
// export and an ACL report → spot the kerberoastable service account whose weak
// password + admin group membership forms a privilege-escalation path → take the
// correct defensive action (rotate its credential to a long random gMSA-style
// secret so it can no longer be cracked offline).
//
// Shape mirrors a course `simulation` block so the same engine drives it:
//   ls / cat / grep  → read `files`
//   objective        → `objective`
//   hint N           → `hints[N-1]`
//   <final command>  → `commands[...]`, with {{FLAG}} swapped for the live flag.

export const SANDBOX = {
  objective:
    "You are the Active Directory security engineer hardening the CORP.LOCAL domain " +
    "before an audit. An export of service-principal-name (SPN) accounts (spn_accounts.txt), " +
    "an ACL delegation report (acl_report.txt) and the previous analyst's notes (notes.txt) " +
    "are on disk. Review them together and find the single dangerous attack path: a " +
    "kerberoastable service account that (a) has an SPN so any domain user can request its " +
    "Kerberos ticket and crack it offline, (b) still uses a weak, crackable password, and " +
    "(c) is a member of a high-privilege group — turning a stolen ticket into Domain Admin. " +
    "Take the correct defensive action by rotating that account's credential to a long, " +
    "random, machine-managed secret so the offline crack is defeated. Hardening the CORRECT " +
    "account reveals the CTF flag; touching a benign account or applying the wrong control " +
    "does not.",

  hints: [
    // 1 — explore
    "Start by exploring. Run 'ls', then read the SPN export with 'cat spn_accounts.txt', the " +
      "delegation report with 'cat acl_report.txt', and the analyst notes with 'cat notes.txt'. " +
      "Everything you need to identify the attack path is already on disk.",
    // 2 — narrow the evidence
    "Kerberoasting only works against accounts that HAVE a service principal name (SPN). Any " +
      "authenticated user can request a service ticket for such an account and crack it offline. " +
      "List the candidates with 'grep SPN spn_accounts.txt' and note which of them have a weak " +
      "password flag — those are the crackable ones.",
    // 3 — commit to the flaw
    "Cross-reference the two files. One SPN account is both KERBEROASTABLE with a WEAK password " +
      "AND appears in acl_report.txt as a member of a high-privilege group (Domain Admins). That " +
      "combination is the real escalation path: crack the ticket offline, then use the recovered " +
      "password to act as Domain Admin. The other SPN account uses a strong gMSA-managed secret " +
      "(a decoy), and the ACL entries on benign accounts are not the crackable path. Run " +
      "'grep -i admins acl_report.txt' to confirm which account is privileged.",
    // 4 — exact command FORM (never the literal answer)
    "Defend the account by removing the offline-crack risk: rotate its password to a long, " +
      "random, machine-managed secret. The command form is:  rotate-cred <account> <mode>  — " +
      "substitute the exact kerberoastable, privileged account you identified and the managed " +
      "rotation mode (not a manual/short reset).",
  ],

  files: {
    "spn_accounts.txt":
      "# CORP.LOCAL — service accounts with a registered SPN (setspn -Q output)\n" +
      "# Columns: sAMAccountName | SPN | pwd_last_set | pwd_strength | notes\n" +
      "svc_sql        MSSQLSvc/db01.corp.local:1433   2019-03-14   WEAK    " +
      "# password unchanged >5y, dictionary-based — KERBEROASTABLE\n" +
      "svc_web        HTTP/web01.corp.local           2025-11-02   STRONG  " +
      "# gMSA-managed 120-char random secret, auto-rotated\n" +
      "svc_backup     CIFS/backup01.corp.local        2026-06-30   STRONG  " +
      "# gMSA-managed, auto-rotated\n" +
      "\n" +
      "# Reminder: an SPN means ANY authenticated user can request this account's Kerberos\n" +
      "# service ticket (TGS) and crack it OFFLINE. A WEAK password here is directly cracka" +
      "ble.\n",

    "acl_report.txt":
      "# CORP.LOCAL — privileged group membership & ACL delegation report\n" +
      "GROUP: Domain Admins\n" +
      "  member: CORP\\Administrator        (built-in, expected)\n" +
      "  member: CORP\\svc_sql              <-- service account in Domain Admins (DANGEROUS)\n" +
      "\n" +
      "GROUP: Backup Operators\n" +
      "  member: CORP\\svc_backup           (expected for backup role)\n" +
      "\n" +
      "ACL delegation:\n" +
      "  svc_web  : no privileged group membership; GenericRead on its own OU only (benign)\n" +
      "  svc_sql  : Domain Admins member (see above) — a cracked svc_sql password = Domain Admin\n",

    "notes.txt":
      "AD hardening review — domain: CORP.LOCAL\n" +
      "Findings queue:\n" +
      " 1. svc_sql is KERBEROASTABLE (has SPN MSSQLSvc/…), password is WEAK and >5 years old,\n" +
      "    AND svc_sql is a member of Domain Admins. This is the critical, directly-exploitable\n" +
      "    attack path: request svc_sql's TGS, crack it offline, then act as Domain Admin.\n" +
      " 2. svc_web / svc_backup also have SPNs — BUT they use gMSA-managed 120-char random\n" +
      "    secrets that auto-rotate, so their tickets are not crackable. They are decoys here.\n" +
      " 3. The benign OU-scoped ACL on svc_web is real hygiene noise but NOT the escalation path.\n" +
      "\n" +
      "Remediation policy (authorized hardening): defeat the offline crack on the dangerous\n" +
      "account by rotating its credential to a long, random, MACHINE-MANAGED (gMSA-style) secret\n" +
      "so a captured ticket can no longer be brute-forced. A short/manual password reset is NOT\n" +
      "sufficient — it can be cracked again. (Removing svc_sql from Domain Admins is also correct\n" +
      "long-term, but this exercise scores the credential-rotation control.)\n",
  },

  commands: {
    // Decoy — right account, wrong control: a manual short reset is still crackable. Warns, no flag.
    "rotate-cred svc_sql manual":
      "WARNING: a manual password reset on svc_sql leaves it a short, human-chosen secret — " +
      "still KERBEROASTABLE and crackable offline the next time its ticket is requested.\n" +
      "The finding under test is offline-crackable credentials; a manual reset does not remove " +
      "that risk.\n" +
      "No flag. Re-read notes.txt and rotate this account to the MACHINE-MANAGED mode instead.",

    // Decoy — right control, wrong (benign) account: no attack path here. Warns, no flag.
    "rotate-cred svc_web gmsa":
      "WARNING: svc_web already uses a gMSA-managed 120-char auto-rotated secret — it is NOT " +
      "kerberoastable and is not in any privileged group.\n" +
      "You spent the control on a benign account and left the real Domain Admins escalation " +
      "path open.\n" +
      "No flag. Cross-reference spn_accounts.txt with acl_report.txt and harden the WEAK, " +
      "privileged SPN account.",

    // Correct — machine-managed rotation of the kerberoastable, Domain-Admin service account.
    "rotate-cred svc_sql gmsa":
      "[*] Target  account=svc_sql  SPN=MSSQLSvc/db01.corp.local:1433  groups=[Domain Admins]\n" +
      "[*] Converting svc_sql to a Group Managed Service Account (gMSA)…\n" +
      "[*] Provisioning 120-char random secret, 30-day automatic rotation, no manual password.\n" +
      "[+] Kerberoasting neutralized: any captured TGS is now computationally infeasible to " +
      "crack offline.\n" +
      "[+] Escalation path (crack svc_sql → Domain Admin) closed for this control.\n" +
      "FLAG: {{FLAG}}\n" +
      "[+] Hardening confirmed. Follow-up: also remove service accounts from Domain Admins and " +
      "audit SPNs regularly. Submit the flag above to complete the mission.",
  },
} as const;
