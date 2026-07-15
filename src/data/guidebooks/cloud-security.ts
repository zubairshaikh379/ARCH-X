// ─────────────────────────────────────────────────────────────────────────────
// CLOUD SECURITY — DEEP GUIDEBOOK (textbook-grade course for the ARCH-X platform)
//
// Content is authored as SEMANTIC HTML and rendered inside `.md-content`
// (see src/index.css) — h2/h3/p/ul/ol/li/pre/code/table/blockquote/strong are
// all styled there, so lessons render correctly without relying on Tailwind
// class scanning.
//
// Structure mirrors a real syllabus: Intro → Shared Responsibility → Identity →
// Storage Exposure → Least Privilege → Secrets/KMS → Logging → Attacks →
// CSPM/Posture → Network → Incident Response. Each lesson ends with an
// 8-question knowledge check.
// ─────────────────────────────────────────────────────────────────────────────

import type { Course } from "../courses";

type Lesson = Course["lessons"][number];

// New optional Overview fields (spread into the cloud-security course object).
export const META: Pick<
  Course,
  "prerequisites" | "learningOutcomes" | "mustKnow" | "commonGaps" | "prosCons" | "careerNotes"
> = {
  prerequisites: [
    "Comfort with a Linux shell and reading JSON — cloud policies and CLI output are JSON all the way down.",
    "A mental model of TCP/IP: ports, IP addresses, public vs private networks, and DNS.",
    "Basic familiarity with at least one cloud console (AWS, Azure, or GCP) — you've clicked around, that's enough.",
    "No prior security experience required — every concept, from IAM to KMS, is built up from zero.",
  ],
  learningOutcomes: [
    "Draw the shared responsibility line for IaaS, PaaS, and SaaS — and know exactly which failures are yours to own.",
    "Read an IAM policy document and spot the wildcard that quietly grants an attacker everything.",
    "Find and remediate a publicly exposed S3 bucket, and explain why 'public' has four different meanings in AWS.",
    "Trace an SSRF-to-metadata attack that steals role credentials from a workload, and map it to MITRE ATT&CK.",
    "Read CloudTrail and GuardDuty findings to reconstruct what an identity actually did across an account.",
    "Contain a compromised cloud identity correctly — revoke sessions, quarantine keys, and preserve evidence.",
  ],
  mustKnow: [
    "Shared Responsibility Model", "IAM", "Principal / Policy / Role", "AssumeRole / STS",
    "Least Privilege", "Wildcard (*) grants", "S3 Block Public Access", "ACL vs Bucket Policy",
    "IMDSv1 vs IMDSv2", "SSRF → Instance Metadata", "T1552 Unsecured Credentials",
    "T1530 Data from Cloud Storage", "T1078.004 Cloud Accounts", "CloudTrail", "GuardDuty",
    "KMS / Key Vault / Cloud KMS", "Secrets Manager", "CSPM", "Security Groups vs NACLs",
    "VPC / Private Subnet", "Privilege Escalation (iam:PassRole)", "Confused Deputy",
  ],
  commonGaps: [
    "The responsibility line. Beginners assume 'the cloud is secure' and never ask which half of security is contractually theirs — almost every breach lives on the customer's side.",
    "Public means four things in AWS. Block Public Access, bucket ACLs, bucket policies, and object ACLs interact; learners fix one and leave the bucket wide open through another.",
    "Identity is the new perimeter. Courses drill network firewalls but skip that in the cloud a leaked access key beats any firewall — the control plane is reachable from anywhere.",
    "IMDS. Few beginners know an instance can be tricked (via SSRF) into handing out its own role credentials, or that IMDSv2 exists specifically to stop it.",
    "Least privilege is a process, not a setting. You grant broadly to ship, then never claw it back. Real posture comes from continuously right-sizing against access analyzer data.",
    "Logs aren't on by default everywhere. CloudTrail data events, VPC Flow Logs, and org-wide trails often must be explicitly enabled — the evidence you need may never have been recorded.",
  ],
  prosCons: {
    pros: [
      "Everything is an API with an audit log — CloudTrail gives you a near-complete, queryable record of every control-plane action.",
      "Policy-as-code and CSPM let you assert and continuously verify a secure baseline across thousands of resources at once.",
      "Skills transfer across employers: IAM, storage exposure, and posture management are universal cloud problems, not vendor trivia.",
    ],
    cons: [
      "The control plane is internet-reachable, so a single leaked credential can be exploited from anywhere — no network foothold required.",
      "Misconfiguration is the dominant failure mode, and the defaults plus wildcard-friendly policy language make insecure states easy to reach by accident.",
      "Multi-account, multi-cloud sprawl makes complete visibility genuinely hard; you can only defend the resources and regions you actually know exist.",
    ],
  },
  careerNotes:
    "Cloud security sits at the crossroads of the fastest-growing part of the industry. It's a natural next step from a SOC/analyst, sysadmin, or DevOps background, and feeds into Cloud Security Engineer, Cloud SecArchitect, and Detection Engineering roles. Certs that map directly to this material: the vendor-neutral CCSK (Certificate of Cloud Security Knowledge) and CCSP, plus provider tracks like the AWS Certified Security – Specialty, Microsoft SC-100/AZ-500, and Google Professional Cloud Security Engineer. Hands-on ranges like flaws.cloud, CloudGoat, and the PurpleCloud/AzureGoat labs are how most people actually build the skills. A cloud-security-focused role is a realistic 1–3 year target from an adjacent technical job; the people who advance fastest learn to read IAM policies fluently and automate posture checks rather than clicking through consoles.",
};

export const LESSONS: Lesson[] = [
  // ── LESSON 1 ───────────────────────────────────────────────────────────────
  {
    title: "01 // The Cloud and the Shared Responsibility Model",
    summary: "What 'the cloud' actually is, why security is a split contract between provider and customer, and where that line moves for IaaS, PaaS, and SaaS.",
    content: `
      <h2>Welcome to someone else's computer</h2>
      <p>The <strong>cloud</strong> is, at its most honest, renting slices of a hyperscaler's data centres over an API. Instead of buying servers, you call <strong>AWS</strong>, <strong>Azure</strong>, or <strong>Google Cloud (GCP)</strong> and they conjure compute, storage, and networking on demand. The magic — and the danger — is that everything is programmable and reachable over the internet. That reachability is exactly why cloud security is its own discipline.</p>

      <p>You are <em>defensive</em>. Your job is to configure and watch cloud resources so that the enormous power of an API-driven data centre works for your organisation and not for an attacker.</p>

      <h3>The most important diagram in cloud security</h3>
      <p>The <strong>Shared Responsibility Model</strong> is the single idea everything else hangs from. The provider secures some layers; you secure the rest. Getting the line wrong is how most cloud breaches begin, because people assume "the cloud provider handles security" and leave their half unguarded.</p>
      <blockquote>The rule of thumb: the provider is responsible for security <strong>OF</strong> the cloud (the hardware, the hypervisor, the physical data centre, the managed service internals). You are responsible for security <strong>IN</strong> the cloud (your data, your identities, your configurations, your network rules).</blockquote>

      <h3>The line moves with the service model</h3>
      <p>How much you own depends on how much of the stack you rent. The three classic models:</p>
      <table>
        <thead><tr><th>Model</th><th>Example</th><th>Provider secures</th><th>You secure</th></tr></thead>
        <tbody>
          <tr><td><strong>IaaS</strong> (Infrastructure)</td><td>EC2 virtual machine</td><td>Hypervisor, host, physical layer</td><td>OS patching, apps, data, IAM, network config</td></tr>
          <tr><td><strong>PaaS</strong> (Platform)</td><td>Managed database (RDS)</td><td>OS and DB engine patching too</td><td>Data, access policies, who can connect</td></tr>
          <tr><td><strong>SaaS</strong> (Software)</td><td>Microsoft 365</td><td>Almost everything technical</td><td>Your data classification, user accounts, sharing settings</td></tr>
        </tbody>
      </table>
      <p>Notice a pattern: no matter how far right you slide, <strong>you always own your data and your identities</strong>. The provider will never decide who inside your company should be able to read the customer database — that is always your call, and therefore always your risk.</p>

      <h3>Why this matters more in the cloud than on-prem</h3>
      <p>On a traditional server in your own building, an attacker usually needs a network foothold first. In the cloud the management <strong>control plane</strong> — the APIs that create, delete, and reconfigure everything — is reachable from the whole internet, gated only by <em>identity</em>. That is the reframing this course keeps returning to: <strong>in the cloud, identity is the perimeter.</strong> A leaked access key can do from a café in another country what once required physically walking into a server room.</p>

      <h3>What you will build toward</h3>
      <p>By the capstone you will read an IAM policy and spot the over-grant, find a public bucket and lock it down, trace an SSRF that steals a workload's credentials, follow the attacker through CloudTrail and GuardDuty, and contain a compromised identity — and you'll be able to explain each step in the language of the Shared Responsibility Model and MITRE ATT&CK.</p>
    `,
    quizzes: [
      { id: "cloud-l1-q1", question: "In the Shared Responsibility Model, what is the provider generally responsible for?", options: ["Your data classification", "Security OF the cloud — hardware, hypervisor, physical data centre", "Your IAM policies", "Who in your company can read the database"], correctAnswerIndex: 1, explanation: "Providers secure the infrastructure of the cloud; the customer secures what they put in it (data, identity, config)." },
      { id: "cloud-l1-q2", question: "Which responsibility ALWAYS stays with the customer, regardless of service model?", options: ["Patching the hypervisor", "Physical data-centre security", "Their data and their identities/access", "The health of the host hardware"], correctAnswerIndex: 2, explanation: "Across IaaS, PaaS, and SaaS the customer always owns their data and who may access it." },
      { id: "cloud-l1-q3", question: "For an IaaS virtual machine (e.g. EC2), who patches the guest operating system?", options: ["The cloud provider", "The customer", "Nobody — it's automatic", "The hardware vendor"], correctAnswerIndex: 1, explanation: "In IaaS the provider stops at the hypervisor; guest-OS patching, apps, and config are the customer's job." },
      { id: "cloud-l1-q4", question: "As you move from IaaS toward SaaS, the customer's security burden generally…", options: ["Increases", "Decreases, but never reaches zero", "Stays exactly the same", "Disappears entirely"], correctAnswerIndex: 1, explanation: "More of the stack is managed by the provider in SaaS, but you always retain data and identity responsibilities." },    ],
  },

  // ── LESSON 2 ───────────────────────────────────────────────────────────────
  {
    title: "02 // Cloud IAM: Principals, Policies, and Roles",
    summary: "How cloud identity actually works — principals, the anatomy of a policy document, roles vs users, and the AssumeRole/STS mechanism that ties it all together.",
    content: `
      <h2>Everything is an identity decision</h2>
      <p>If identity is the perimeter, then <strong>Identity and Access Management (IAM)</strong> is the whole game. Every API call in the cloud is checked against the question: <em>is this principal allowed to perform this action on this resource, under these conditions?</em> Learn to read that sentence and you can read any cloud authorization decision.</p>

      <h3>The vocabulary you must own</h3>
      <table>
        <thead><tr><th>Term</th><th>Meaning</th></tr></thead>
        <tbody>
          <tr><td><strong>Principal</strong></td><td>The <em>who</em> — a user, a role, an application, or a service making the request.</td></tr>
          <tr><td><strong>Action</strong></td><td>The <em>what</em> — a specific API operation, e.g. <code>s3:GetObject</code>.</td></tr>
          <tr><td><strong>Resource</strong></td><td>The <em>on what</em> — a specific bucket, key, or instance, named by an ARN.</td></tr>
          <tr><td><strong>Policy</strong></td><td>A JSON document that allows or denies combinations of the above.</td></tr>
          <tr><td><strong>Condition</strong></td><td>Extra constraints — source IP, MFA present, time of day, tags.</td></tr>
        </tbody>
      </table>

      <h3>Anatomy of an IAM policy</h3>
      <p>AWS policies are JSON. Read this one out loud as a sentence:</p>
      <pre><code>{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::archx-reports/*",
      "Condition": {
        "Bool": { "aws:MultiFactorAuthPresent": "true" }
      }
    }
  ]
}</code></pre>
      <p>"Allow the principal to <code>GetObject</code> from any object in the <code>archx-reports</code> bucket, but only if they authenticated with MFA." Every real policy is just stacks of these statements. Azure calls the equivalent construct a <strong>role definition</strong> plus a <strong>role assignment</strong>; GCP uses <strong>IAM bindings</strong> that tie a member to a role on a resource. Different words, same triangle of who / what / where.</p>

      <h3>Users vs roles — the distinction beginners miss</h3>
      <ul>
        <li>A <strong>user</strong> is a long-lived identity with permanent credentials (a password, or an access key that doesn't expire). Great for a human, dangerous for a workload.</li>
        <li>A <strong>role</strong> has no permanent credentials. A principal <em>assumes</em> it and receives <strong>temporary</strong> credentials that expire in minutes to hours.</li>
      </ul>
      <p>Roles are the preferred pattern almost everywhere, because short-lived credentials that automatically expire dramatically shrink the damage of a leak.</p>

      <h3>AssumeRole and STS: temporary power on demand</h3>
      <p>In AWS the <strong>Security Token Service (STS)</strong> issues those temporary credentials. When an EC2 instance, a Lambda function, or an admin needs to act, they call <code>sts:AssumeRole</code> and receive a short-lived key/secret/session-token trio scoped to that role's permissions.</p>
      <pre><code>aws sts assume-role \\
  --role-arn arn:aws:iam::123456789012:role/ReportReader \\
  --role-session-name analyst-session</code></pre>
      <p>This is elegant and also the engine of many attacks: if an attacker can reach a principal that is allowed to assume a powerful role, the blast radius jumps instantly. Following <em>who can assume what</em> is a core cloud-hunting skill you'll use in Lesson 8.</p>

      <blockquote>Mental model: don't think "does this user have admin?" Think "what is the full set of roles this principal can reach, directly or by chaining AssumeRole?" That transitive reach — not the label on the account — is the real privilege.</blockquote>
    `,
    quizzes: [
      { id: "cloud-l2-q1", question: "In an IAM authorization decision, what does the 'principal' represent?", options: ["The API action being called", "The who — the identity making the request", "The resource being accessed", "The billing account"], correctAnswerIndex: 1, explanation: "The principal is the identity (user, role, service, app) making the request." },
      { id: "cloud-l2-q2", question: "What identifies a specific resource in an AWS policy?", options: ["A password", "An ARN (Amazon Resource Name)", "An IP address", "A MAC address"], correctAnswerIndex: 1, explanation: "Resources are named by their ARN, e.g. arn:aws:s3:::bucket/object." },
      { id: "cloud-l2-q3", question: "What is the key difference between an IAM user and an IAM role?", options: ["Users are for machines, roles for humans", "A user has long-lived credentials; a role is assumed for temporary, expiring credentials", "Roles cost money, users are free", "There is no difference"], correctAnswerIndex: 1, explanation: "Roles issue short-lived credentials on assumption, while users hold permanent credentials." },
      { id: "cloud-l2-q4", question: "Which AWS service issues the temporary credentials returned by AssumeRole?", options: ["S3", "STS (Security Token Service)", "CloudTrail", "KMS"], correctAnswerIndex: 1, explanation: "STS mints the temporary access key, secret, and session token for an assumed role." },    ],
  },

  // ── LESSON 3 ───────────────────────────────────────────────────────────────
  {
    title: "03 // Storage Exposure: The Public Bucket Problem",
    summary: "Why object storage leaks dominate the breach headlines, the four layers that control S3 access, and how to find and lock down a public bucket.",
    content: `
      <h2>The breach that keeps happening</h2>
      <p>Search any year of security news and you'll find another company that leaked millions of records from a <strong>publicly readable storage bucket</strong>. AWS calls its object store <strong>S3</strong>; Azure has <strong>Blob Storage</strong>; GCP has <strong>Cloud Storage</strong>. The pattern is identical everywhere: someone stores sensitive data, misconfigures access, and the whole internet can read it — no exploit, no malware, just a wrong setting.</p>

      <h3>Why buckets get exposed</h3>
      <ul>
        <li><strong>Convenience during development</strong> — "make it public so the website works" and nobody ever tightens it.</li>
        <li><strong>Confusion about what 'public' means</strong> — in AWS there are <em>four</em> overlapping controls, and fixing one leaves the others open.</li>
        <li><strong>Copy-paste policies</strong> — a broad example policy pasted from a tutorial that grants <code>"Principal": "*"</code>.</li>
        <li><strong>Discoverability</strong> — bucket names are guessable, and bots continuously enumerate them at internet scale.</li>
      </ul>

      <h3>The four layers of S3 access control</h3>
      <table>
        <thead><tr><th>Layer</th><th>What it controls</th></tr></thead>
        <tbody>
          <tr><td><strong>Block Public Access (BPA)</strong></td><td>Account/bucket master switch that overrides everything else. Should be ON.</td></tr>
          <tr><td><strong>Bucket policy</strong></td><td>A resource policy on the whole bucket — where a stray <code>Principal: *</code> makes it public.</td></tr>
          <tr><td><strong>Bucket ACL</strong></td><td>A legacy control that can grant <code>AllUsers</code> or <code>AuthenticatedUsers</code> access.</td></tr>
          <tr><td><strong>Object ACL</strong></td><td>Per-object grants — an object can be public even if the bucket looks private.</td></tr>
        </tbody>
      </table>
      <blockquote>This is the trap the guidebook warns about: a bucket can look "private" in one panel while an object ACL or a legacy bucket ACL quietly exposes the data. <strong>Block Public Access</strong> exists precisely to be the single override that shuts all these doors at once.</blockquote>

      <h3>A dangerously public bucket policy</h3>
      <p>This is the shape of the policy behind countless breaches — anonymous read of every object:</p>
      <pre><code>{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::archx-finance-records-01/*"
  }]
}</code></pre>
      <p><code>"Principal": "*"</code> means <em>anyone on the internet, unauthenticated</em>. Combined with a bucket full of financial records, that single line is a data breach waiting for a bot to find it.</p>

      <h3>Finding and fixing it</h3>
      <p>Auditing is fast from the CLI. List buckets, check public-access settings, and inspect the policy:</p>
      <pre><code># Is Block Public Access on for this bucket?
aws s3api get-public-access-block --bucket archx-finance-records-01

# What does the bucket policy actually say?
aws s3api get-bucket-policy --bucket archx-finance-records-01</code></pre>
      <p>The fix is to re-enable the master override, which neutralises stray policies and ACLs at once:</p>
      <pre><code>aws s3api put-public-access-block \\
  --bucket archx-finance-records-01 \\
  --public-access-block-configuration \\
  BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true</code></pre>
      <p>This maps directly to MITRE ATT&CK <strong>T1530 (Data from Cloud Storage)</strong> — the technique for exactly this "read the exposed bucket" behaviour.</p>
    `,
    quizzes: [
      { id: "cloud-l3-q1", question: "What is AWS's object storage service called?", options: ["Blob Storage", "S3", "Cloud Storage", "EBS"], correctAnswerIndex: 1, explanation: "S3 (Simple Storage Service) is AWS object storage; Azure has Blob Storage and GCP has Cloud Storage." },
      { id: "cloud-l3-q2", question: "In a bucket policy, what does \"Principal\": \"*\" mean?", options: ["Only administrators", "Anyone on the internet, unauthenticated", "Only the bucket owner", "Nobody"], correctAnswerIndex: 1, explanation: "A wildcard principal grants access to any anonymous requester — the classic public-exposure mistake." },
      { id: "cloud-l3-q3", question: "Which control acts as the master override that can shut all public access at once?", options: ["Object ACL", "Block Public Access (BPA)", "A single bucket tag", "The bucket name"], correctAnswerIndex: 1, explanation: "Block Public Access overrides bucket/object ACLs and public bucket policies when enabled." },
      { id: "cloud-l3-q4", question: "Why can a bucket appear 'private' yet still leak data?", options: ["Logs are disabled", "A per-object ACL or legacy bucket ACL can expose objects independently", "The region is wrong", "S3 has no access controls"], correctAnswerIndex: 1, explanation: "Multiple overlapping layers exist; an object ACL can make data public even when the bucket looks locked." },    ],
  },

  // ── LESSON 4 ───────────────────────────────────────────────────────────────
  {
    title: "04 // Least Privilege and Writing Good Policies",
    summary: "The principle that underpins all IAM, why over-permissioned roles are the norm, and how to right-size access using deny, conditions, and access analyzers.",
    content: `
      <h2>The one principle to rule them all</h2>
      <p><strong>Least privilege</strong> says every identity should have the minimum permissions needed to do its job — and nothing more. It sounds obvious. In practice, cloud environments drift toward the opposite because granting broadly is the fastest way to make something work, and nobody circles back to trim it. The result is a landscape of <strong>over-permissioned roles</strong> that hand an attacker far more than they need the moment one is compromised.</p>

      <h3>How over-permissioning happens</h3>
      <ul>
        <li><strong>Wildcards for convenience</strong> — <code>"Action": "s3:*"</code> or even <code>"Action": "*"</code> to stop the "access denied" errors, forever.</li>
        <li><strong>Managed admin policies attached "temporarily"</strong> — <code>AdministratorAccess</code> granted to debug, never removed.</li>
        <li><strong>Shared roles</strong> — one role reused by many apps, so it accumulates the union of everyone's needs.</li>
        <li><strong>Copy-forward</strong> — new roles cloned from an existing over-broad one.</li>
      </ul>

      <h3>Reading the danger in a policy</h3>
      <p>Contrast these two. The first is a loaded gun; the second does the same job safely:</p>
      <pre><code>// DANGEROUS — full control of all of S3, everywhere
{ "Effect": "Allow", "Action": "s3:*", "Resource": "*" }

// LEAST PRIVILEGE — read only, one bucket, only what's needed
{ "Effect": "Allow",
  "Action": ["s3:GetObject", "s3:ListBucket"],
  "Resource": [
    "arn:aws:s3:::archx-reports",
    "arn:aws:s3:::archx-reports/*"
  ] }</code></pre>
      <p>Two questions expose most over-grants: <em>Is the Action a wildcard?</em> and <em>Is the Resource <code>*</code>?</em> A statement that wildcards both is effectively "can do anything to everything" and deserves immediate scrutiny.</p>

      <h3>Deny wins, and conditions sharpen</h3>
      <p>In AWS policy evaluation, an explicit <strong>Deny always overrides an Allow</strong>. That makes deny statements a powerful guardrail — e.g. deny any action not coming from your corporate network, or deny deleting logs regardless of other grants. <strong>Conditions</strong> tighten further: require MFA, restrict to a source IP range, or scope by resource tag.</p>
      <pre><code>// Guardrail: forbid tampering with the audit trail, no matter what else is allowed
{ "Effect": "Deny",
  "Action": ["cloudtrail:StopLogging", "cloudtrail:DeleteTrail"],
  "Resource": "*" }</code></pre>

      <h3>Let the tools do the trimming</h3>
      <p>You don't have to guess at right-sizing. Providers ship analyzers that compare <em>granted</em> permissions against <em>actually used</em> ones:</p>
      <ul>
        <li><strong>AWS IAM Access Analyzer</strong> — flags external access and can generate least-privilege policies from CloudTrail usage history.</li>
        <li><strong>Azure PIM / access reviews</strong> — time-bound, just-in-time elevation instead of standing admin.</li>
        <li><strong>GCP Policy Analyzer / Recommender</strong> — surfaces unused permissions to remove.</li>
      </ul>

      <blockquote>Reframe: least privilege isn't a checkbox you tick once; it's a continuous loop. Grant narrowly, observe real usage, and prune what's unused — because every unused permission is free blast radius you're gifting to whoever compromises that identity next.</blockquote>
    `,
    quizzes: [
      { id: "cloud-l4-q1", question: "What does the principle of least privilege state?", options: ["Grant admin to everyone for simplicity", "Give each identity only the minimum permissions needed, and nothing more", "Never grant any permissions", "Rotate passwords weekly"], correctAnswerIndex: 1, explanation: "Least privilege minimises granted permissions to exactly what a task requires." },
      { id: "cloud-l4-q2", question: "Which statement is the most over-permissioned?", options: ["Allow s3:GetObject on one bucket", "Allow s3:* on Resource *", "Allow ListBucket on one bucket", "Deny cloudtrail:StopLogging"], correctAnswerIndex: 1, explanation: "Wildcarding both Action (s3:*) and Resource (*) grants full control of all of that service everywhere." },
      { id: "cloud-l4-q3", question: "In AWS policy evaluation, what happens when an explicit Deny and an Allow both match?", options: ["The Allow wins", "The Deny always overrides the Allow", "It is random", "The request errors out"], correctAnswerIndex: 1, explanation: "An explicit Deny always takes precedence over any Allow, making deny statements strong guardrails." },
      { id: "cloud-l4-q4", question: "Why do roles tend to become over-permissioned over time?", options: ["The provider adds permissions automatically", "Broad grants ship fast and are rarely trimmed later", "IAM requires wildcards", "Permissions expire and double"], correctAnswerIndex: 1, explanation: "Convenience grants (wildcards, temporary admin) accumulate because no one circles back to remove them." },    ],
  },

  // ── LESSON 5 ───────────────────────────────────────────────────────────────
  {
    title: "05 // Secrets and Key Management",
    summary: "Where credentials and encryption keys should live, the difference between a secrets manager and a KMS, and why hard-coded secrets are the gift that keeps giving to attackers.",
    content: `
      <h2>The problem with secrets</h2>
      <p>Applications need <strong>secrets</strong> — database passwords, API tokens, third-party keys — and encryption needs <strong>keys</strong>. Where those live decides whether a small mistake becomes a catastrophe. The cardinal sin is the <strong>hard-coded secret</strong>: a password or access key pasted into source code, a config file, or an environment variable committed to git. Once it's in a repo's history, it is effectively public forever, and bots scan public repos for exactly this.</p>

      <blockquote>MITRE ATT&CK calls the whole family <strong>T1552 Unsecured Credentials</strong> — credentials sitting in code, files, history, or environment variables where an attacker can simply read them. It is one of the most reliably successful cloud techniques because it needs no exploit.</blockquote>

      <h3>Two different tools for two different jobs</h3>
      <p>Beginners conflate these; keep them straight:</p>
      <table>
        <thead><tr><th></th><th>Secrets Manager</th><th>KMS (Key Management Service)</th></tr></thead>
        <tbody>
          <tr><td>Stores</td><td>The secret <em>values</em> (passwords, tokens, connection strings)</td><td>The <em>encryption keys</em> used to protect data</td></tr>
          <tr><td>Typical use</td><td>App fetches a DB password at runtime via API</td><td>Encrypt/decrypt data; keys never leave the service</td></tr>
          <tr><td>Signature feature</td><td>Automatic rotation of the stored secret</td><td>Keys are non-exportable; you call the service to use them</td></tr>
          <tr><td>Provider names</td><td>AWS Secrets Manager, Azure Key Vault, GCP Secret Manager</td><td>AWS KMS, Azure Key Vault (keys), GCP Cloud KMS</td></tr>
        </tbody>
      </table>
      <p>(Azure Key Vault blurs the line by doing both secrets and keys; AWS and GCP keep them as separate services.)</p>

      <h3>Why a KMS is clever</h3>
      <p>The insight of a KMS is that the raw key <strong>never leaves the service</strong>. You don't download a key and encrypt locally; you send data (or a data-key request) to KMS and it does the crypto inside its hardened boundary. This enables <strong>envelope encryption</strong>: KMS holds a master key that only ever encrypts small <em>data keys</em>, which in turn encrypt your bulk data. Even if your storage is stolen, the data is ciphertext and the master key was never exposed. Every KMS use is also logged, so you get an audit trail of who decrypted what.</p>

      <h3>Doing it right</h3>
      <ul>
        <li><strong>Never hard-code.</strong> Fetch secrets at runtime from the manager; keep nothing sensitive in the repo.</li>
        <li><strong>Prefer roles over keys.</strong> A workload that assumes a role needs no stored credential at all (see Lesson 6's metadata service).</li>
        <li><strong>Rotate automatically.</strong> A rotated secret limits how long a leak stays useful.</li>
        <li><strong>Scope key access.</strong> A KMS key has its own policy — grant decrypt only to the identities that truly need it.</li>
        <li><strong>Scan for leaks.</strong> Tools like git-secrets, truffleHog, or provider secret scanners catch secrets before (and after) they land in code.</li>
      </ul>

      <p>A quick check for a hard-coded AWS key in a codebase — the kind of grep that has saved countless incidents:</p>
      <pre><code>grep -rEn "AKIA[0-9A-Z]{16}" .   # AWS access key IDs start with AKIA</code></pre>
    `,
    quizzes: [
      { id: "cloud-l5-q1", question: "What is the cardinal sin of secret handling?", options: ["Rotating secrets too often", "Hard-coding secrets into source code or config committed to version control", "Encrypting data at rest", "Using a secrets manager"], correctAnswerIndex: 1, explanation: "Hard-coded secrets in code/repos are trivially discovered and effectively public forever once committed." },
      { id: "cloud-l5-q2", question: "Which MITRE ATT&CK technique covers credentials left in code, files, or environment variables?", options: ["T1530 Data from Cloud Storage", "T1552 Unsecured Credentials", "T1110 Brute Force", "T1078 Valid Accounts"], correctAnswerIndex: 1, explanation: "T1552 Unsecured Credentials describes readily-readable credentials attackers can simply collect." },
      { id: "cloud-l5-q3", question: "What does a Secrets Manager primarily store?", options: ["Encryption keys only", "The secret values like passwords and API tokens", "Log files", "Network routes"], correctAnswerIndex: 1, explanation: "A secrets manager stores and serves secret values (and can rotate them); KMS stores encryption keys." },
      { id: "cloud-l5-q4", question: "What is the defining security property of a KMS?", options: ["It emails keys to admins", "The raw key never leaves the service; you call the service to use it", "It stores keys in plaintext files", "It disables encryption"], correctAnswerIndex: 1, explanation: "KMS performs crypto inside its boundary; the key material is non-exportable, and usage is logged." },    ],
  },

  // ── LESSON 6 ───────────────────────────────────────────────────────────────
  {
    title: "06 // Logging and Monitoring: CloudTrail, GuardDuty, and Friends",
    summary: "The telemetry that makes cloud investigations possible — control-plane audit logs, flow logs, and the managed threat-detection services that watch them for you.",
    content: `
      <h2>If it wasn't logged, it didn't happen</h2>
      <p>Cloud's great gift to defenders is that nearly every action is an API call, and API calls can be logged. The catch is that the logs must be <em>turned on, centralised, and protected</em> — none of which is fully automatic. This lesson is your map of what to enable and what watches it.</p>

      <h3>The three kinds of cloud telemetry</h3>
      <table>
        <thead><tr><th>Layer</th><th>What it records</th><th>AWS</th><th>Azure / GCP</th></tr></thead>
        <tbody>
          <tr><td><strong>Control plane</strong></td><td>Management actions: who did what API call</td><td>CloudTrail</td><td>Azure Activity Log / GCP Cloud Audit Logs</td></tr>
          <tr><td><strong>Data plane</strong></td><td>Access to data itself (e.g. S3 object reads)</td><td>CloudTrail data events, S3 access logs</td><td>Storage logs</td></tr>
          <tr><td><strong>Network</strong></td><td>Connection metadata between resources</td><td>VPC Flow Logs</td><td>NSG Flow Logs / VPC Flow Logs</td></tr>
        </tbody>
      </table>

      <h3>CloudTrail: the account's flight recorder</h3>
      <p><strong>CloudTrail</strong> records control-plane API calls across an AWS account — who (principal), what (action), when, from where (source IP), and the result. A single CloudTrail event looks like this (trimmed):</p>
      <pre><code>{
  "eventTime": "2026-06-25T14:02:15Z",
  "eventName": "AssumeRole",
  "userIdentity": { "arn": "arn:aws:iam::123456789012:user/dev-jordan" },
  "sourceIPAddress": "198.51.100.12",
  "requestParameters": { "roleArn": "arn:aws:iam::123456789012:role/AdminRole" },
  "responseElements": { "credentials": { "accessKeyId": "ASIA..." } }
}</code></pre>
      <p>Read it as a sentence: user <code>dev-jordan</code>, from <code>198.51.100.12</code>, assumed <code>AdminRole</code>. In an investigation, CloudTrail is how you reconstruct exactly what an identity did — the cloud equivalent of the auth.log timeline.</p>

      <blockquote>Two hard-won lessons: enable a <strong>multi-region, organisation-wide trail</strong> so an attacker can't just act in a region you're not watching, and protect the log store (e.g. object-lock / immutability) so they can't delete their own trail — that deletion attempt is itself T1070 Indicator Removal.</blockquote>

      <h3>Managed detection: GuardDuty and its cousins</h3>
      <p>Reading raw CloudTrail by hand doesn't scale, so providers offer managed threat detection that ingests these logs and applies analytics and threat intel for you:</p>
      <ul>
        <li><strong>Amazon GuardDuty</strong> — analyses CloudTrail, VPC Flow Logs, and DNS logs. It raises findings like <em>UnauthorizedAccess:IAMUser/InstanceCredentialExfiltration</em> (role credentials used from a new IP) or <em>Recon:IAMUser/TorIPCaller</em>.</li>
        <li><strong>Microsoft Defender for Cloud</strong> — equivalent posture + threat detection for Azure (and beyond).</li>
        <li><strong>Google Security Command Center</strong> — findings and posture across GCP.</li>
      </ul>
      <p>These are your always-on Tier-1 analyst. A GuardDuty finding that instance role credentials are suddenly being used from an external IP is one of the highest-signal alerts in all of cloud security — it usually means the exact attack you'll study next lesson.</p>

      <h3>Centralise and correlate</h3>
      <p>Just like on-prem, the endgame is to ship all this into a <strong>SIEM</strong> (Sentinel, Splunk, Elastic, or a cloud-native log lake) so you can correlate cloud events with everything else. CloudTrail tells you a role was assumed; flow logs tell you where the traffic went; GuardDuty tells you it looked malicious — joined together, that's an incident.</p>
    `,
    quizzes: [
      { id: "cloud-l6-q1", question: "What does AWS CloudTrail primarily record?", options: ["CPU temperature", "Control-plane API calls: who did what action, when, and from where", "The contents of every file", "Employee emails"], correctAnswerIndex: 1, explanation: "CloudTrail is the audit log of management API calls across an AWS account." },
      { id: "cloud-l6-q2", question: "Which service records network connection metadata between cloud resources?", options: ["CloudTrail", "VPC Flow Logs", "KMS", "Secrets Manager"], correctAnswerIndex: 1, explanation: "VPC Flow Logs capture connection metadata (source, dest, ports, bytes, accept/reject)." },
      { id: "cloud-l6-q3", question: "What is Amazon GuardDuty?", options: ["A firewall", "A managed threat-detection service that analyses CloudTrail, flow, and DNS logs", "A storage bucket", "A billing tool"], correctAnswerIndex: 1, explanation: "GuardDuty ingests account telemetry and applies analytics/threat intel to raise findings." },
      { id: "cloud-l6-q4", question: "Why enable a multi-region, organisation-wide CloudTrail?", options: ["To reduce cost", "So an attacker can't operate in a region or account you aren't logging", "To speed up EC2", "To disable other logs"], correctAnswerIndex: 1, explanation: "Complete coverage prevents blind spots an attacker could exploit by acting where you don't watch." },    ],
  },

  // ── LESSON 7 ───────────────────────────────────────────────────────────────
  {
    title: "07 // SSRF and the Instance Metadata Service",
    summary: "The signature cloud attack chain — how a server-side request forgery bug reaches the metadata endpoint and steals a workload's role credentials, and how IMDSv2 stops it.",
    content: `
      <h2>The attack that defines cloud pentesting</h2>
      <p>If there is one attack chain every cloud defender must understand cold, it is <strong>SSRF → Instance Metadata → stolen role credentials</strong>. It ties together everything so far: roles, temporary credentials, and the reachability of the control plane. It is also the chain behind some of the largest cloud breaches on record.</p>

      <h3>What is the Instance Metadata Service?</h3>
      <p>Every cloud VM can ask the platform about itself via a special link-local address, <code>169.254.169.254</code> — the <strong>Instance Metadata Service (IMDS)</strong>. It returns things like the instance ID, region, and — critically — the <strong>temporary credentials for the role attached to the instance</strong>. This is the beautiful mechanism from Lesson 2: a workload gets credentials without any stored secret. The catch is that <em>anything running on the instance that can make an HTTP request can reach it too.</em></p>
      <pre><code># On the instance, this returns the role's live credentials:
curl http://169.254.169.254/latest/meta-data/iam/security-credentials/AppRole
# -> {"AccessKeyId":"ASIA...","SecretAccessKey":"...","Token":"..."}</code></pre>

      <h3>Enter SSRF</h3>
      <p><strong>Server-Side Request Forgery (SSRF)</strong> is a web vulnerability where an application can be tricked into making a request to a URL the attacker chooses. Imagine an app feature that fetches a user-supplied URL (a "preview this link" button). If it doesn't validate the target, an attacker submits <code>http://169.254.169.254/latest/meta-data/iam/security-credentials/AppRole</code> — and the vulnerable server dutifully fetches the metadata endpoint <em>from inside</em> and hands the role credentials back to the attacker.</p>

      <h3>The full chain</h3>
      <ol>
        <li><strong>Find SSRF</strong> in a web app running on a cloud VM.</li>
        <li><strong>Point it at 169.254.169.254</strong> — the metadata endpoint, reachable only from on the instance.</li>
        <li><strong>Exfiltrate the role's temporary credentials</strong> returned by IMDS (MITRE T1552.005, Cloud Instance Metadata API).</li>
        <li><strong>Use those credentials off-box</strong> — now the attacker acts as the instance's role (T1078.004 Cloud Accounts). If that role is over-permissioned (Lesson 4), it's game over — e.g. read every S3 bucket the role can touch.</li>
      </ol>
      <blockquote>This is why Lessons 4 and 7 are inseparable: SSRF gives the attacker <em>the instance's role</em>, and least privilege decides how catastrophic that is. A tightly-scoped role turns a breach into a shrug; an admin role turns it into a headline.</blockquote>

      <h3>IMDSv2: the fix</h3>
      <p>AWS's answer is <strong>IMDSv2</strong>, a session-oriented version that requires a preliminary <code>PUT</code> to obtain a token, which must then accompany the metadata request. Crucially it enforces this in a way that a naive SSRF (which can typically only make a simple <code>GET</code>) cannot satisfy, and it sets a low <em>hop limit</em> so the token can't be relayed off-instance:</p>
      <pre><code># IMDSv2 requires a token first — a simple SSRF GET can't do this step:
TOKEN=$(curl -X PUT "http://169.254.169.254/latest/api/token" \\
  -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
curl -H "X-aws-ec2-metadata-token: $TOKEN" \\
  http://169.254.169.254/latest/meta-data/</code></pre>
      <p>Best practice is to <strong>enforce IMDSv2 (disable v1 entirely)</strong> on all instances. Combine that with least-privilege roles and SSRF-resistant application code, and this whole devastating chain is defused at three independent layers — defence in depth applied to the cloud's signature attack.</p>
    `,
    quizzes: [
      { id: "cloud-l7-q1", question: "What IP address is the Instance Metadata Service (IMDS) reachable at?", options: ["127.0.0.1", "169.254.169.254", "8.8.8.8", "10.0.0.1"], correctAnswerIndex: 1, explanation: "IMDS lives at the link-local address 169.254.169.254, reachable from on the instance." },
      { id: "cloud-l7-q2", question: "Why is the metadata endpoint so valuable to an attacker?", options: ["It stores the OS password", "It can return the temporary credentials for the instance's attached role", "It hosts the website", "It contains the billing data"], correctAnswerIndex: 1, explanation: "IMDS serves the role's live temporary credentials, letting an attacker act as that role." },
      { id: "cloud-l7-q3", question: "What is Server-Side Request Forgery (SSRF)?", options: ["Guessing passwords", "Tricking a server into making a request to an attacker-chosen URL", "Encrypting a database", "A type of firewall rule"], correctAnswerIndex: 1, explanation: "SSRF coerces a vulnerable app into fetching a URL of the attacker's choosing, e.g. the metadata endpoint." },
      { id: "cloud-l7-q4", question: "In the classic chain, what does SSRF let the attacker reach that they otherwise couldn't?", options: ["The public internet", "The internal-only metadata endpoint at 169.254.169.254", "The user's browser", "The DNS server"], correctAnswerIndex: 1, explanation: "The metadata endpoint is only reachable from on the instance; SSRF makes the server fetch it on the attacker's behalf." },    ],
  },

  // ── LESSON 8 ───────────────────────────────────────────────────────────────
  {
    title: "08 // Privilege Escalation and Common Cloud Misconfigurations",
    summary: "How an attacker with a foothold climbs to admin — iam:PassRole, policy self-editing, the confused deputy, and the misconfiguration patterns that make it possible.",
    content: `
      <h2>From a toehold to the whole account</h2>
      <p>Rarely does an attacker land directly as admin. They compromise some limited identity — via SSRF (Lesson 7), a leaked key (Lesson 5), or a phished user — and then <strong>escalate</strong>. In the cloud, escalation is almost always an <em>IAM</em> problem: some permission the identity shouldn't have lets it grant itself more. Learning these patterns lets you spot the dangerous grant <em>before</em> an attacker does.</p>

      <h3>The classic IAM escalation paths</h3>
      <table>
        <thead><tr><th>Dangerous permission</th><th>How it escalates</th></tr></thead>
        <tbody>
          <tr><td><code>iam:CreatePolicyVersion</code> / <code>iam:PutUserPolicy</code></td><td>Rewrite your own attached policy to grant yourself admin.</td></tr>
          <tr><td><code>iam:PassRole</code> + <code>ec2:RunInstances</code></td><td>Launch an instance with a powerful role attached, then use the instance to act as that role.</td></tr>
          <tr><td><code>iam:CreateAccessKey</code></td><td>Mint new keys for a more-privileged user you can reach.</td></tr>
          <tr><td><code>iam:AttachUserPolicy</code></td><td>Attach <code>AdministratorAccess</code> to yourself directly.</td></tr>
          <tr><td><code>lambda:CreateFunction</code> + <code>iam:PassRole</code></td><td>Run code under a privileged execution role.</td></tr>
        </tbody>
      </table>
      <blockquote>Notice how many involve <strong>iam:PassRole</strong>. Passing a role to a service you control is the workhorse of cloud privilege escalation: you don't need the role's power directly if you can hand it to a compute service and let that service wield it for you. Treat <code>PassRole</code> as a high-privilege permission and always scope <em>which</em> roles can be passed.</blockquote>

      <h3>The confused deputy</h3>
      <p>A <strong>confused deputy</strong> is a trusted service tricked into misusing its authority on an attacker's behalf. The classic cloud case is cross-account role trust: you let a third-party SaaS assume a role in your account, but forget to pin the <code>ExternalId</code> condition — so any customer of that SaaS can assume <em>your</em> role. The fix is a condition that ties the trust to a specific, secret external ID:</p>
      <pre><code>"Condition": {
  "StringEquals": { "sts:ExternalId": "unique-secret-per-tenant" }
}</code></pre>

      <h3>The misconfiguration greatest hits</h3>
      <p>Most real cloud incidents are not exotic exploits — they're these recurring misconfigurations:</p>
      <ul>
        <li><strong>Public storage</strong> (Lesson 3) — the perennial number one.</li>
        <li><strong>Over-permissioned roles and wildcard policies</strong> (Lesson 4) — the escalation fuel.</li>
        <li><strong>IMDSv1 left enabled</strong> (Lesson 7) — the SSRF on-ramp.</li>
        <li><strong>Hard-coded / long-lived credentials</strong> (Lesson 5) — the easy foothold.</li>
        <li><strong>Overly open security groups</strong> — <code>0.0.0.0/0</code> on SSH/RDP/databases (Lesson 9).</li>
        <li><strong>Disabled or unmonitored logging</strong> (Lesson 6) — the reason breaches go unnoticed for months.</li>
        <li><strong>Public snapshots / AMIs / disk images</strong> — accidentally shared, leaking whole disks.</li>
      </ul>

      <h3>Hunting escalation with the audit log</h3>
      <p>Because IAM changes are control-plane calls, CloudTrail captures escalation attempts. High-value events to alert on: <code>AttachUserPolicy</code>, <code>PutUserPolicy</code>, <code>CreatePolicyVersion</code>, <code>CreateAccessKey</code>, and <code>AssumeRole</code> into privileged roles — especially from a principal that never did them before. That behavioural pivot — a low-privilege identity suddenly touching IAM — is the cloud equivalent of the failure→success moment: the instant a foothold becomes a takeover.</p>
    `,
    quizzes: [
      { id: "cloud-l8-q1", question: "In the cloud, privilege escalation is most often a problem in which subsystem?", options: ["DNS", "IAM — permissions that let an identity grant itself more", "The billing console", "The DHCP server"], correctAnswerIndex: 1, explanation: "Cloud escalation typically abuses IAM permissions that allow self-granting of additional access." },
      { id: "cloud-l8-q2", question: "Why is iam:PassRole considered a high-privilege permission?", options: ["It rotates keys", "It lets you hand a powerful role to a compute service you control, which then acts as that role", "It deletes logs", "It only reads data"], correctAnswerIndex: 1, explanation: "Passing a role to a service (EC2, Lambda) lets that service wield the role's power on your behalf." },
      { id: "cloud-l8-q3", question: "What does iam:AttachUserPolicy enable an attacker to do?", options: ["Read a bucket", "Attach a policy such as AdministratorAccess directly to themselves", "Encrypt a database", "Launch a website"], correctAnswerIndex: 1, explanation: "Attaching a managed admin policy to your own identity is a direct escalation to full control." },
      { id: "cloud-l8-q4", question: "What is a 'confused deputy' in cloud security?", options: ["A misconfigured DNS record", "A trusted service tricked into misusing its authority on an attacker's behalf", "A brute-force tool", "An expired certificate"], correctAnswerIndex: 1, explanation: "A confused deputy abuses a legitimate service's privileges — e.g. cross-account trust without an ExternalId." },    ],
  },

  // ── LESSON 9 ───────────────────────────────────────────────────────────────
  {
    title: "09 // Network Controls and Cloud Posture Management (CSPM)",
    summary: "Building the network guardrails — security groups, NACLs, VPC design — and using CSPM to continuously verify a secure baseline across the whole estate.",
    content: `
      <h2>Identity is the perimeter — but the network still matters</h2>
      <p>Even in an identity-centric world, sound network design shrinks the attack surface and contains blast radius. And because manually checking thousands of resources is impossible, <strong>Cloud Security Posture Management (CSPM)</strong> automates the auditing. This lesson pairs the network fundamentals with the tooling that keeps them honest at scale.</p>

      <h3>The VPC and its subnets</h3>
      <p>A <strong>VPC (Virtual Private Cloud)</strong> is your private, isolated network inside the provider. The core design move is splitting it into <strong>public subnets</strong> (resources that need internet-facing access, like a load balancer) and <strong>private subnets</strong> (databases and app servers that should never be directly reachable from the internet). Databases belong in private subnets — full stop. If the internet can't route to your database, a leaked DB password is far less catastrophic.</p>

      <h3>Security groups vs NACLs</h3>
      <p>AWS gives you two network filters that beginners constantly confuse:</p>
      <table>
        <thead><tr><th></th><th>Security Group</th><th>Network ACL (NACL)</th></tr></thead>
        <tbody>
          <tr><td>Attaches to</td><td>An instance/ENI</td><td>A whole subnet</td></tr>
          <tr><td>State</td><td><strong>Stateful</strong> — return traffic auto-allowed</td><td><strong>Stateless</strong> — must allow both directions</td></tr>
          <tr><td>Rules</td><td>Allow only</td><td>Allow <em>and</em> Deny</td></tr>
          <tr><td>Best for</td><td>Primary instance-level firewall</td><td>Coarse subnet-wide guardrails / explicit blocks</td></tr>
        </tbody>
      </table>
      <blockquote>The number-one network misconfiguration: a security group with <code>0.0.0.0/0</code> on port 22 (SSH), 3389 (RDP), or a database port — exposing an admin/data service to the entire internet. Restrict management and data ports to a bastion, VPN, or known admin CIDR, never the world.</blockquote>

      <h3>A sane vs an exposed rule</h3>
      <pre><code># DANGEROUS: SSH open to the whole internet
{ "IpProtocol": "tcp", "FromPort": 22, "ToPort": 22,
  "IpRanges": [{ "CidrIp": "0.0.0.0/0" }] }

# SAFER: SSH only from the corporate VPN range
{ "IpProtocol": "tcp", "FromPort": 22, "ToPort": 22,
  "IpRanges": [{ "CidrIp": "203.0.113.0/24" }] }</code></pre>

      <h3>What CSPM actually does</h3>
      <p><strong>CSPM</strong> tools continuously scan your cloud accounts against a library of best-practice and compliance checks, then report and prioritise the gaps. They answer, automatically and constantly, questions like: <em>Any public buckets? Any security group open to 0.0.0.0/0? Any IAM user without MFA? Any unencrypted volumes? Any IMDSv1 instances?</em> Examples include <strong>AWS Security Hub</strong>, <strong>Microsoft Defender for Cloud</strong> (posture), <strong>GCP Security Command Center</strong>, and third-party platforms like <strong>Prowler</strong> (open source), Wiz, and Prisma Cloud.</p>
      <ul>
        <li><strong>Continuous, not point-in-time</strong> — posture drifts constantly as engineers ship changes; CSPM re-checks continuously.</li>
        <li><strong>Benchmark-aligned</strong> — findings map to standards like the CIS Benchmarks, so "we're CIS-aligned" becomes measurable.</li>
        <li><strong>Prioritised</strong> — good CSPM ranks by risk (a public bucket with data beats an unencrypted empty test volume).</li>
      </ul>
      <p>A one-line Prowler scan illustrates the idea — run a broad assessment and get a prioritised list of misconfigurations back:</p>
      <pre><code>prowler aws --severity critical high</code></pre>
      <p>CSPM is how the abstract goals of Lessons 1–8 (private buckets, least privilege, IMDSv2, logging on, tight security groups) become an enforced, continuously-verified baseline instead of a hope.</p>
    `,
    quizzes: [
      { id: "cloud-l9-q1", question: "What is a VPC?", options: ["A public bucket", "A private, isolated virtual network inside the cloud provider", "A type of encryption key", "A logging service"], correctAnswerIndex: 1, explanation: "A Virtual Private Cloud is your isolated network space where you place and segment resources." },
      { id: "cloud-l9-q2", question: "Where should a database ideally be placed?", options: ["A public subnet with a public IP", "A private subnet not directly reachable from the internet", "On the load balancer", "In an S3 bucket"], correctAnswerIndex: 1, explanation: "Databases belong in private subnets so the internet can't route to them directly." },
      { id: "cloud-l9-q3", question: "How does a security group differ from a NACL?", options: ["Security groups are stateless; NACLs are stateful", "Security groups are stateful and attach to instances; NACLs are stateless and attach to subnets", "They are identical", "NACLs only allow, never deny"], correctAnswerIndex: 1, explanation: "Security groups are stateful (instance-level, allow-only); NACLs are stateless (subnet-level, allow+deny)." },
      { id: "cloud-l9-q4", question: "What is the number-one dangerous security group misconfiguration?", options: ["Allowing HTTPS from the internet", "0.0.0.0/0 on SSH/RDP/database ports, exposing admin/data services to everyone", "Blocking all traffic", "Using a private subnet"], correctAnswerIndex: 1, explanation: "Opening management or data ports to the entire internet is a top cause of cloud compromise." },    ],
  },

  // ── LESSON 10 ──────────────────────────────────────────────────────────────
  {
    title: "10 // Incident Response in the Cloud",
    summary: "Responding when identity is the perimeter — containing a compromised credential, preserving cloud-native evidence, and mapping the full attack to MITRE ATT&CK.",
    content: `
      <h2>The response playbook changes in the cloud</h2>
      <p>On-prem, containment often means pulling a network cable. In the cloud, the attacker isn't on a wire — they hold a <em>credential</em> and reach your control plane over the internet. So cloud incident response revolves around <strong>identity actions</strong> and <strong>API-driven forensics</strong>. The classic NIST lifecycle still applies; the mechanics are new.</p>

      <h3>The lifecycle, cloud-flavoured</h3>
      <ol>
        <li><strong>Preparation</strong> — logging on and centralised (Lesson 6), break-glass admin roles, and playbooks ready before anything happens.</li>
        <li><strong>Detection &amp; Analysis</strong> — a GuardDuty finding or a CloudTrail anomaly; scope it by asking <em>which identity, which actions, which resources, from where</em>.</li>
        <li><strong>Containment</strong> — neutralise the credential and isolate affected resources (below).</li>
        <li><strong>Eradication</strong> — remove attacker persistence: rogue IAM users, access keys, Lambda backdoors, added SSH keys, altered trust policies.</li>
        <li><strong>Recovery</strong> — restore from known-good, rotate everything the identity could touch, re-verify posture.</li>
        <li><strong>Lessons Learned</strong> — feed fixes back into least privilege, IMDSv2, and CSPM checks.</li>
      </ol>

      <h3>Containing a compromised identity</h3>
      <p>If an access key or role session is stolen, speed matters. The correct moves:</p>
      <ul>
        <li><strong>Deactivate or delete the access key</strong> immediately (<code>aws iam update-access-key --status Inactive</code>).</li>
        <li><strong>Revoke active role sessions</strong> — attach an inline deny keyed on <code>aws:TokenIssueTime</code> so already-issued temporary credentials stop working, since you can't "log out" an STS token directly.</li>
        <li><strong>Apply a restrictive/quarantine policy</strong> to the identity (AWS even publishes an <code>AWSCompromisedKeyQuarantine</code> managed policy for exactly this).</li>
        <li><strong>Isolate compute</strong> — move a suspect instance to a locked-down security group rather than terminating it, so evidence survives.</li>
      </ul>
      <blockquote>Golden rule, cloud edition: <strong>preserve before you purge.</strong> Snapshot the disk (EBS snapshot), capture memory if feasible, and export the relevant CloudTrail before you terminate anything. A terminated instance can take the only evidence with it.</blockquote>

      <h3>Cloud-native evidence sources</h3>
      <table>
        <thead><tr><th>Question</th><th>Where the answer lives</th></tr></thead>
        <tbody>
          <tr><td>What API calls did the identity make?</td><td>CloudTrail</td></tr>
          <tr><td>What data was accessed?</td><td>CloudTrail data events / S3 access logs</td></tr>
          <tr><td>Where did traffic go?</td><td>VPC Flow Logs</td></tr>
          <tr><td>What did the platform flag?</td><td>GuardDuty / Defender / SCC findings</td></tr>
          <tr><td>What was on the disk?</td><td>EBS snapshot of the volume</td></tr>
        </tbody>
      </table>

      <h3>Mapping the whole course to ATT&CK</h3>
      <p>Everything you've learned lines up as a single cloud kill chain:</p>
      <table>
        <thead><tr><th>Stage</th><th>Tactic</th><th>Technique</th></tr></thead>
        <tbody>
          <tr><td>Enumerating buckets / endpoints</td><td>Reconnaissance</td><td>T1595 Active Scanning</td></tr>
          <tr><td>Leaked key / SSRF-stolen creds</td><td>Credential Access</td><td>T1552 Unsecured Credentials (.005 Metadata)</td></tr>
          <tr><td>Acting with valid cloud creds</td><td>Initial Access / Defense Evasion</td><td>T1078.004 Cloud Accounts</td></tr>
          <tr><td>iam:PassRole / policy self-edit</td><td>Privilege Escalation</td><td>T1548 / IAM abuse</td></tr>
          <tr><td>Reading the exposed data</td><td>Collection / Exfiltration</td><td>T1530 Data from Cloud Storage</td></tr>
          <tr><td>Deleting the CloudTrail</td><td>Defense Evasion</td><td>T1070 Indicator Removal</td></tr>
        </tbody>
      </table>
      <p>Read defensively, that table is also your detection and hardening checklist: block the recon (CSPM), kill the credential paths (secrets hygiene + IMDSv2), constrain the identity (least privilege), watch the control plane (CloudTrail + GuardDuty), and protect the logs (immutability). Detection and hardening remain two halves of one job — now applied to a perimeter made of identities.</p>

      <blockquote>The one sentence to leave with: in the cloud you defend <em>configurations and identities</em>, you investigate <em>through API logs</em>, and you contain by <em>revoking access</em> — never assume a cut cable will save you, because there isn't one.</blockquote>
    `,
    quizzes: [
      { id: "cloud-l10-q1", question: "Why does cloud incident response revolve around identity rather than network cables?", options: ["Clouds have no networks", "The attacker holds a credential and reaches the control plane over the internet, not a physical wire", "Cables are too expensive", "Identity is irrelevant in the cloud"], correctAnswerIndex: 1, explanation: "There's no cable to pull; the attacker uses credentials against internet-reachable APIs, so containment is identity-centric." },
      { id: "cloud-l10-q2", question: "Why can't you simply 'log out' a stolen STS temporary credential?", options: ["STS tokens never expire", "They're valid until expiry; you must deny by TokenIssueTime or quarantine the identity to revoke early", "You can, with one click", "They aren't real credentials"], correctAnswerIndex: 1, explanation: "Temporary session credentials remain valid until expiry unless you deny based on issue time or apply a quarantine policy." },
      { id: "cloud-l10-q3", question: "What is the correct first move for a leaked long-lived access key?", options: ["Ignore it until the next audit", "Deactivate/delete the access key immediately", "Make the bucket public", "Reboot the region"], correctAnswerIndex: 1, explanation: "Deactivating or deleting the compromised key stops its use right away." },
      { id: "cloud-l10-q4", question: "Why isolate a suspect instance to a locked-down security group instead of terminating it?", options: ["Termination is impossible", "To preserve evidence (disk, memory) while cutting off the attacker", "It saves money", "Security groups encrypt disks"], correctAnswerIndex: 1, explanation: "Isolating contains the threat while keeping the instance intact for forensic evidence." },    ],
  },
];
