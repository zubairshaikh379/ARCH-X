// ─── Cloud Security Sandbox ───────────────────────────────────────
// Authorized-education, conceptual lab. Nothing here touches a real cloud
// account — the bucket, ARNs and policy documents are fabricated demo values
// and the "remediate" verbs are simulated by the terminal engine (see
// App.tsx executeCmd). The mission teaches the cloud-config audit loop:
// review the S3 ACL and the IAM policy → distinguish a genuinely
// world-exposed resource / over-permissioned role from the safely-scoped
// ones → remediate the correct finding (lock the public bucket down).
//
// Shape mirrors a course `simulation` block so the same engine drives it:
//   ls / cat / grep  → read `files`
//   objective        → `objective`
//   hint N           → `hints[N-1]`
//   <final command>  → `commands[...]`, with {{FLAG}} swapped for the live flag.

export const SANDBOX = {
  objective:
    "You are the cloud security engineer auditing the 'acme-prod' AWS account before a " +
    "compliance sign-off. Two artifacts are queued for review: an S3 bucket ACL export and " +
    "an IAM role policy document. Read the evidence on disk and find the real exposure — a " +
    "bucket whose ACL grants access to AllUsers (public to the entire internet) versus " +
    "buckets that are correctly private, and an IAM role scoped with least privilege versus " +
    "one that is not. Remediate the genuinely public data by making the offending bucket " +
    "private. Locking down the CORRECT public bucket reveals the CTF flag; touching an " +
    "already-private, in-use bucket does not.",

  hints: [
    // 1 — explore
    "Start by exploring. Run 'ls', then read the ACL export with 'cat s3_acl.txt', the role " +
      "policy with 'cat iam_policy.json', and the auditor notes with 'cat notes.txt'. " +
      "Everything you need is already on disk.",
    // 2 — narrow the evidence
    "Compare the buckets in s3_acl.txt. A private bucket only grants its own account/owner. A " +
      "PUBLIC bucket has a grant to the group " +
      "'http://acs.amazonaws.com/groups/global/AllUsers' — that URI means 'anyone on the " +
      "internet'. Try 'grep AllUsers s3_acl.txt' to surface the world-readable bucket.",
    // 3 — commit to the finding
    "The bucket granting READ to AllUsers is the real exposure — it is serving objects to the " +
      "open internet, not just your account. The other buckets grant only the owner and are " +
      "fine. In iam_policy.json note that the deploy role is already scoped to a single " +
      "bucket (least privilege), so the IAM finding is clean — the S3 ACL is your target.",
    // 4 — exact command FORM (never the literal answer)
    "Remediate by removing the public grant so the bucket is private again. The command form " +
      "is:  make-private <bucket-name>  — substitute the exact bucket name that grants " +
      "AllUsers in s3_acl.txt.",
  ],

  files: {
    "s3_acl.txt":
      "# aws s3api get-bucket-acl export  —  account acme-prod\n" +
      "# ---------------------------------------------------------------\n" +
      "Bucket: acme-prod-logs\n" +
      "  Grant: CanonicalUser (owner acme-prod)            -> FULL_CONTROL\n" +
      "  Public: NO   (private — owner only)\n" +
      "\n" +
      "Bucket: acme-prod-customer-exports\n" +
      "  Grant: CanonicalUser (owner acme-prod)            -> FULL_CONTROL\n" +
      "  Grant: Group http://acs.amazonaws.com/groups/global/AllUsers -> READ\n" +
      "  Public: YES  (!!! world-readable — anyone on the internet can list/GET objects)\n" +
      "\n" +
      "Bucket: acme-prod-backups\n" +
      "  Grant: CanonicalUser (owner acme-prod)            -> FULL_CONTROL\n" +
      "  Public: NO   (private — owner only)\n",

    "iam_policy.json":
      "{\n" +
      '  "Version": "2012-10-17",\n' +
      '  "Comment": "Role: acme-deploy-role — reviewed, least privilege, scoped to one bucket.",\n' +
      '  "Statement": [\n' +
      "    {\n" +
      '      "Sid": "DeployArtifactsReadWrite",\n' +
      '      "Effect": "Allow",\n' +
      '      "Action": ["s3:GetObject", "s3:PutObject"],\n' +
      '      "Resource": "arn:aws:s3:::acme-prod-backups/*"\n' +
      "    }\n" +
      "  ]\n" +
      "}\n",

    "notes.txt":
      "Cloud security audit — account: acme-prod\n" +
      "Review queue:\n" +
      " 1. S3 ACL export (s3_acl.txt): one bucket, acme-prod-customer-exports, grants READ to\n" +
      "    the AllUsers group — that is PUBLIC to the entire internet and holds customer data.\n" +
      "    The other two buckets (acme-prod-logs, acme-prod-backups) grant only the owner and\n" +
      "    are correctly private.\n" +
      " 2. IAM role (iam_policy.json): acme-deploy-role is scoped to a single bucket with only\n" +
      "    GetObject/PutObject — least privilege, no wildcard '*' action or resource. CLEAN.\n" +
      "\n" +
      "Remediation policy: a bucket exposed to AllUsers is a live data leak. Remove the public\n" +
      "grant to make it private again — do NOT block-public-access on the buckets that are\n" +
      "already private and in active use, that remediates nothing.\n" +
      "\n" +
      "Do NOT touch acme-prod-backups — it is private and is the deploy role's active target;\n" +
      "changing it would break deploys and fixes no exposure.\n",
  },

  commands: {
    // Decoy — an already-private, in-use bucket: warns, no flag.
    "make-private acme-prod-backups":
      "WARNING: acme-prod-backups is already PRIVATE (owner-only) and is the active target of " +
      "acme-deploy-role (see iam_policy.json / notes.txt).\n" +
      "It was never public — 'fixing' it changes nothing and risks breaking live deploys.\n" +
      "No flag. Re-read s3_acl.txt to find the bucket that actually grants AllUsers.",

    // Correct — the world-readable bucket exposed to AllUsers in s3_acl.txt.
    "make-private acme-prod-customer-exports":
      "[*] Inspecting ACL for acme-prod-customer-exports…\n" +
      "[+] Found public grant: Group AllUsers -> READ (world-readable).\n" +
      "[+] Public grant REMOVED — bucket ACL reset to owner-only (private).\n" +
      "[+] Block Public Access enabled on the bucket to prevent regression.\n" +
      "[+] Customer data is no longer exposed to the open internet.\n" +
      "FLAG: {{FLAG}}\n" +
      "[+] Exposure remediated at the source. Submit the flag above to complete the mission.",
  },
} as const;
