// ─────────────────────────────────────────────────────────────────────────────
// KUBERNETES SECURITY — DEEP GUIDEBOOK (textbook-grade course for ARCH-X)
//
// Content is authored as SEMANTIC HTML and rendered inside `.md-content`
// (see src/index.css) — h2/h3/p/ul/ol/li/pre/code/table/blockquote/strong are
// all styled there, so lessons render correctly without relying on Tailwind
// class scanning.
//
// Structure mirrors a real syllabus: Intro/Architecture → 4 C's → RBAC →
// Admission/Pod Security → Secrets → Network Policy → Supply Chain → Runtime
// Isolation → Attack Paths → Hardening/Benchmarks. Each lesson ends with an
// 8-question knowledge check.
// ─────────────────────────────────────────────────────────────────────────────

import type { Course } from "../courses";

type Lesson = Course["lessons"][number];

// New optional Overview fields (spread into the k8s-security course object).
export const META: Pick<
  Course,
  "prerequisites" | "learningOutcomes" | "mustKnow" | "commonGaps" | "prosCons" | "careerNotes"
> = {
  prerequisites: [
    "Comfort with a Linux shell (cd, ls, cat, ps) and the idea of processes, users, and filesystems.",
    "A working mental model of containers: an image is a template, a container is a running instance sharing the host kernel.",
    "Basic YAML literacy — you can read indentation-based key/value structure without fear.",
    "A little kubectl exposure helps but isn't required; every command is explained from zero.",
  ],
  learningOutcomes: [
    "Draw the Kubernetes control plane and node components from memory and explain what each trusts.",
    "Read a Pod spec and immediately spot the fields that grant a container the keys to the host.",
    "Design least-privilege RBAC and explain why a wildcard verb on secrets is a cluster-takeover risk.",
    "Enforce Pod Security Standards through admission control and know why PSPs were replaced.",
    "Write a default-deny NetworkPolicy and reason about east-west segmentation between namespaces.",
    "Trace a realistic attack path from an exposed dashboard or SSRF to full node and cluster compromise, mapped to MITRE ATT&CK.",
  ],
  mustKnow: [
    "control plane / kube-apiserver", "etcd", "kubelet", "kube-scheduler", "kube-controller-manager",
    "the 4 C's (Cloud, Cluster, Container, Code)", "RBAC Role/ClusterRole/RoleBinding", "ServiceAccount tokens",
    "Pod Security Standards (privileged/baseline/restricted)", "admission controllers", "OPA Gatekeeper / Kyverno",
    "securityContext", "privileged / hostPath / hostPID / hostNetwork", "Linux capabilities", "seccomp", "AppArmor",
    "NetworkPolicy", "Secrets & etcd encryption-at-rest", "image signing (cosign/sigstore)", "SBOM & CVE scanning",
    "CIS Kubernetes Benchmark", "kube-bench", "T1611 Escape to Host", "T1610 Deploy Container",
  ],
  commonGaps: [
    "Containers are not a security boundary by default. Beginners treat a container like a VM; it shares the host kernel, and one wrong flag erases the wall entirely.",
    "The default ServiceAccount token. Most learners never realise a pod is auto-mounted a cluster credential — often the very thing an attacker steals first.",
    "etcd is the crown jewels. Every secret lives there, historically in plaintext. People harden pods for weeks and leave etcd on an open port with no encryption.",
    "RBAC verbs that are secretly admin. 'get pods' looks harmless; 'create pods', 'exec', and 'get secrets' are effectively cluster-admin, and few grasp why.",
    "NetworkPolicy is default-allow. Without a single policy, every pod can talk to every other pod across namespaces. Learners assume namespaces isolate network traffic — they don't.",
    "Admission control is where real prevention happens. Scanning and detection get the attention, but the block that never lets a privileged pod schedule is worth more than any alert.",
  ],
  prosCons: {
    pros: [
      "Kubernetes centralises policy: one admission rule can harden every workload in the cluster at once.",
      "Declarative specs make security auditable — the desired state is text you can scan, diff, and gate in CI.",
      "A rich, layered control set (RBAC, PSS, NetworkPolicy, seccomp) enables genuine defence in depth when combined.",
    ],
    cons: [
      "Insecure by default in many places — permissive RBAC, auto-mounted tokens, no network policy, no seccomp — so hardening is opt-in work.",
      "Enormous attack surface: API server, kubelet, etcd, the container runtime, and every admission webhook are all reachable, trusted components.",
      "Complexity breeds misconfiguration; the most common breach is not a zero-day but a privileged pod or an over-broad role someone shipped by accident.",
    ],
  },
  careerNotes:
    "Kubernetes security sits at the intersection of cloud, platform engineering, and offensive/defensive security — increasingly its own specialty rather than a side skill. It underpins roles like Cloud Security Engineer, Platform/DevSecOps Engineer, Container Security Analyst, and Red/Blue teamers focused on cloud-native environments. The flagship certification is the CNCF/Linux Foundation CKS (Certified Kubernetes Security Specialist), which requires holding the CKA first; both are hands-on, performance-based exams. Complementary credentials include CKA/CKAD, cloud provider security certs (AWS/GCP/Azure), and offensive tracks touching cloud (e.g. OSCP-style pathways plus tools like kube-hunter, Peirates, and Trivy). Realistic targets: engineers already comfortable with Kubernetes ops can move into a dedicated cloud-native security role within 1–2 years, and the fastest-advancing practitioners are those who can both attack a cluster (prove the escape) and write the admission policy that prevents it.",
};

export const LESSONS: Lesson[] = [
  // ── LESSON 1 ───────────────────────────────────────────────────────────────
  {
    title: "01 // The Cluster and the Cloud-Native Attack Surface",
    summary: "What Kubernetes actually is, why containers aren't a security boundary by default, and the map of everything an attacker can touch.",
    content: `
      <h2>Why Kubernetes needs its own security discipline</h2>
      <p><strong>Kubernetes</strong> (often written <strong>K8s</strong>) is a system for running containers across many machines automatically — deciding where each container runs, restarting the failed ones, scaling them up and down, and wiring them together over the network. It is the operating system of the modern cloud. And like any operating system, the moment it holds something valuable, people try to break in.</p>

      <p>You are here to defend it — and to understand attacks well enough to prevent them. This is <em>authorised, educational</em> study of a defensive discipline. Everything below is about knowing how a cluster falls so you can build one that doesn't.</p>

      <h3>The one idea that changes everything: containers share the kernel</h3>
      <p>A virtual machine has its own kernel; a hypervisor stands between it and the host. A <strong>container does not</strong>. Every container on a node shares that node's single Linux kernel, isolated only by kernel features (namespaces and cgroups) that the host chooses to enforce. Weaken or disable those features — with one flag in a Pod spec — and the wall between container and host simply isn't there.</p>

      <blockquote>The founding principle of this entire course: <strong>a container is not, by default, a security boundary.</strong> It is an isolation convenience that can be switched off. Treat every "escape" you learn about as the natural consequence of removing a wall that was never load-bearing to begin with.</blockquote>

      <h3>Cluster anatomy at a glance</h3>
      <p>A cluster has two kinds of machines. The <strong>control plane</strong> makes decisions; the <strong>worker nodes</strong> run your actual workloads. We dissect each in Lesson 2, but the shape matters now:</p>
      <table>
        <thead><tr><th>Plane</th><th>Runs</th><th>If compromised…</th></tr></thead>
        <tbody>
          <tr><td><strong>Control plane</strong></td><td>kube-apiserver, etcd, scheduler, controllers</td><td>Total cluster takeover — the attacker <em>is</em> the cluster.</td></tr>
          <tr><td><strong>Worker node</strong></td><td>kubelet, container runtime, your Pods</td><td>Every Pod on that node, plus its node credentials, are exposed.</td></tr>
        </tbody>
      </table>

      <h3>The attack surface, listed honestly</h3>
      <p>A Kubernetes attacker doesn't face one door; they face a building of them:</p>
      <ul>
        <li><strong>The API server</strong> — the single front door to everything. Every action goes through it; an over-permissive token here is game over.</li>
        <li><strong>etcd</strong> — the database holding all cluster state, including every Secret, historically in plaintext.</li>
        <li><strong>The kubelet</strong> — the agent on each node that runs containers; its API can be dangerously exposed.</li>
        <li><strong>Workloads themselves</strong> — a vulnerable app (SSRF, RCE) becomes the attacker's beachhead <em>inside</em> the cluster.</li>
        <li><strong>The supply chain</strong> — a poisoned image or dependency runs with whatever privileges you grant it.</li>
        <li><strong>Misconfiguration</strong> — by far the most common cause of real breaches: a privileged pod, an exposed dashboard, a wildcard RBAC role.</li>
      </ul>

      <h3>What you'll build toward</h3>
      <p>By the capstone you'll be able to look at a Pod spec and an RBAC binding and narrate, step by step, how an attacker would turn a single compromised container into control of the whole cluster — and then write the admission policy, network policy, and RBAC that stops each step. Defence, proven by understanding offence.</p>
    `,
    quizzes: [
      { id: "k8s-l1-q1", question: "What does Kubernetes primarily do?", options: ["Encrypts individual files on a laptop", "Orchestrates containers across many machines — scheduling, scaling, and restarting them", "Replaces the Linux kernel", "Serves as a password manager"], correctAnswerIndex: 1, explanation: "Kubernetes is a container orchestrator: it decides where containers run and keeps the desired state across a fleet of machines." },
      { id: "k8s-l1-q2", question: "Why is a container NOT a security boundary by default?", options: ["Containers have their own kernel and hypervisor", "Containers share the host's single kernel, isolated only by kernel features that can be weakened", "Containers cannot run code", "Containers are always encrypted"], correctAnswerIndex: 1, explanation: "Unlike VMs, containers share the host kernel; their isolation depends on namespaces/cgroups that a Pod spec can disable." },
      { id: "k8s-l1-q3", question: "Which two planes make up a Kubernetes cluster?", options: ["Frontend and backend", "Control plane and worker nodes", "Primary and secondary DNS", "Cache and storage"], correctAnswerIndex: 1, explanation: "The control plane makes cluster decisions; worker nodes run the actual Pods." },
      { id: "k8s-l1-q4", question: "What is the consequence of compromising the control plane?", options: ["Only one Pod is affected", "Total cluster takeover — the attacker effectively controls everything", "Nothing, it is isolated", "Only logging stops"], correctAnswerIndex: 1, explanation: "The control plane governs the whole cluster, so its compromise means the attacker controls all workloads and nodes." },
      { id: "k8s-l1-q5", question: "Why is etcd a critical target?", options: ["It runs the web UI", "It stores all cluster state including Secrets, historically in plaintext", "It manages GPU drivers", "It only holds logs"], correctAnswerIndex: 1, explanation: "etcd is the cluster's database of record; reading it can hand an attacker every Secret and configuration in the cluster." },
      { id: "k8s-l1-q6", question: "What is the single front door through which all cluster actions flow?", options: ["The kubelet", "The kube-apiserver (API server)", "etcd", "The scheduler"], correctAnswerIndex: 1, explanation: "Every request to change or read cluster state goes through the kube-apiserver, making it the central control point." },
      { id: "k8s-l1-q7", question: "What is the most common real-world cause of Kubernetes breaches?", options: ["Kernel zero-days", "Misconfiguration — e.g. privileged pods, exposed dashboards, wildcard RBAC", "Hardware failure", "Slow networks"], correctAnswerIndex: 1, explanation: "Most breaches stem from insecure configuration, not novel exploits — the defaults and human error do the damage." },
      { id: "k8s-l1-q8", question: "What does the kubelet do on a worker node?", options: ["Stores Secrets", "Acts as the node agent that runs and manages containers", "Balances DNS queries", "Encrypts etcd"], correctAnswerIndex: 1, explanation: "The kubelet is the per-node agent that talks to the container runtime to start, stop, and monitor Pods." },
    ],
  },

  // ── LESSON 2 ───────────────────────────────────────────────────────────────
  {
    title: "02 // Control Plane, Nodes, kubelet & etcd — Who Trusts Whom",
    summary: "A component-by-component tour of the cluster machinery, the trust relationships between them, and where each one leaks if left unguarded.",
    content: `
      <h2>Know the machine before you defend it</h2>
      <p>You cannot secure what you can't name. This lesson walks every core component, what it does, and — crucially — <strong>what it trusts</strong>, because attacks flow along trust relationships.</p>

      <h3>Control plane components</h3>
      <table>
        <thead><tr><th>Component</th><th>Job</th><th>Security note</th></tr></thead>
        <tbody>
          <tr><td><strong>kube-apiserver</strong></td><td>The front door; validates and serves every API request, enforces authn/authz.</td><td>Every other component talks through it. Its authorization (RBAC) is the cluster's master lock.</td></tr>
          <tr><td><strong>etcd</strong></td><td>Consistent key-value store holding all cluster state and Secrets.</td><td>Should be reachable <em>only</em> by the API server, over mutual TLS, encrypted at rest.</td></tr>
          <tr><td><strong>kube-scheduler</strong></td><td>Decides which node an unscheduled Pod lands on.</td><td>Influencing scheduling can place hostile Pods on high-value nodes.</td></tr>
          <tr><td><strong>kube-controller-manager</strong></td><td>Runs control loops (nodes, replicas, tokens) driving actual state toward desired state.</td><td>Holds powerful credentials; mints ServiceAccount tokens.</td></tr>
        </tbody>
      </table>

      <h3>Worker node components</h3>
      <ul>
        <li><strong>kubelet</strong> — the node agent. It receives Pod specs from the API server and instructs the container runtime to make them real. It exposes an API (port 10250) that, if unauthenticated, lets anyone run commands in any Pod on the node.</li>
        <li><strong>Container runtime</strong> — the software that actually runs containers (containerd, CRI-O). It talks to the kernel to set up namespaces, cgroups, and mounts.</li>
        <li><strong>kube-proxy</strong> — programs node networking rules so Services route to the right Pods.</li>
      </ul>

      <h3>The trust chain — follow it like an attacker</h3>
      <p>Trust in Kubernetes flows in a chain, and every link is an attack step:</p>
      <ol>
        <li>A <strong>client</strong> (you, or a Pod's ServiceAccount) authenticates to the <strong>API server</strong>.</li>
        <li>The API server checks <strong>RBAC</strong> to authorise the action.</li>
        <li>Approved state is written to <strong>etcd</strong>.</li>
        <li>The <strong>kubelet</strong> on each node watches the API server for Pods it should run.</li>
        <li>The kubelet tells the <strong>runtime</strong> to launch containers with the requested (possibly dangerous) settings.</li>
      </ol>
      <p>Compromise any link and you inherit its trust. Steal a token → you're a client. Reach the kubelet API → you skip authorization and run in Pods directly. Read etcd → you have every Secret without touching the API server at all.</p>

      <h3>etcd: the crown jewels</h3>
      <p>Historically, Secrets were stored in etcd <strong>base64-encoded, not encrypted</strong> — trivially readable by anyone who could reach the store. Two non-negotiable hardenings:</p>
      <pre><code># Restrict etcd to the API server over mutual TLS, and enable encryption at rest.
# apiserver flag:
--encryption-provider-config=/etc/kubernetes/enc/enc.yaml

# enc.yaml (conceptual): encrypt Secrets with aescbc before writing to etcd
kind: EncryptionConfiguration
apiVersion: apiserver.config.k8s.io/v1
resources:
  - resources: ["secrets"]
    providers:
      - aescbc:
          keys:
            - name: key1
              secret: &lt;base64-encoded-32-byte-key&gt;
      - identity: {}</code></pre>

      <blockquote>The mental model to carry forward: the API server is the <em>only</em> component that should be widely reachable, and even it is guarded by RBAC. etcd and the kubelet API are internal organs — if they're exposed, the front-door lock (RBAC) has been bypassed entirely.</blockquote>
    `,
    quizzes: [
      { id: "k8s-l2-q1", question: "Which component validates and serves every API request in the cluster?", options: ["etcd", "kube-apiserver", "kube-proxy", "the scheduler"], correctAnswerIndex: 1, explanation: "The kube-apiserver is the central front door that authenticates, authorises, and serves all API requests." },
      { id: "k8s-l2-q2", question: "Who should be able to talk to etcd directly?", options: ["Every Pod in the cluster", "Only the kube-apiserver, over mutual TLS", "Any node's kubelet", "External load balancers"], correctAnswerIndex: 1, explanation: "etcd should be reachable only by the API server over mTLS; direct access bypasses all cluster authorization." },
      { id: "k8s-l2-q3", question: "Why is an unauthenticated kubelet API (port 10250) dangerous?", options: ["It slows DNS", "It can let anyone run commands inside any Pod on that node, skipping RBAC", "It disables logging", "It encrypts traffic twice"], correctAnswerIndex: 1, explanation: "An exposed kubelet API allows command execution in Pods without going through the API server's authorization." },
      { id: "k8s-l2-q4", question: "Historically, how were Secrets stored in etcd by default?", options: ["AES-256 encrypted", "Base64-encoded but not encrypted — easily readable", "Not stored at all", "Hashed with bcrypt"], correctAnswerIndex: 1, explanation: "By default Secrets were merely base64-encoded in etcd, so anyone reading the store could recover them." },
      { id: "k8s-l2-q5", question: "What does the kube-scheduler do?", options: ["Stores logs", "Decides which node an unscheduled Pod runs on", "Encrypts etcd", "Runs the web dashboard"], correctAnswerIndex: 1, explanation: "The scheduler assigns Pods to nodes; influencing it can place hostile workloads on sensitive nodes." },
      { id: "k8s-l2-q6", question: "The kubelet learns which Pods to run by…", options: ["Reading a local file only", "Watching the API server for Pods assigned to its node", "Querying etcd directly", "Asking kube-proxy"], correctAnswerIndex: 1, explanation: "The kubelet watches the API server and reconciles the Pods scheduled to its node via the container runtime." },
      { id: "k8s-l2-q7", question: "Which apiserver capability protects Secrets sitting in etcd?", options: ["Horizontal pod autoscaling", "Encryption at rest via an EncryptionConfiguration provider", "Ingress controllers", "Node affinity"], correctAnswerIndex: 1, explanation: "Encryption at rest (e.g. aescbc/KMS providers) encrypts Secrets before they are written to etcd." },
      { id: "k8s-l2-q8", question: "Why does 'follow the trust chain' matter to an attacker?", options: ["It doesn't; components are isolated", "Compromising any link (token, kubelet, etcd) inherits that link's trust and privileges", "Trust is only cosmetic", "Only the scheduler has trust"], correctAnswerIndex: 1, explanation: "Attacks propagate along trust relationships; owning a component grants whatever that component is trusted to do." },
    ],
  },

  // ── LESSON 3 ───────────────────────────────────────────────────────────────
  {
    title: "03 // The 4 C's of Cloud-Native Security",
    summary: "The layered model — Cloud, Cluster, Container, Code — that organises every Kubernetes control into nested rings of defence.",
    content: `
      <h2>A framework so the rest of the course has a home</h2>
      <p>Kubernetes security has dozens of controls, and without a map they feel like a random pile. The CNCF's <strong>4 C's of Cloud-Native Security</strong> give that map. Picture four nested rings; each inner ring depends on the security of the ring around it.</p>

      <h3>The four layers</h3>
      <table>
        <thead><tr><th>Layer</th><th>What it covers</th><th>Example controls</th></tr></thead>
        <tbody>
          <tr><td><strong>Cloud</strong></td><td>The infrastructure the cluster runs on (AWS/GCP/Azure or your datacentre).</td><td>IAM, network firewalls, private control-plane endpoints, node hardening.</td></tr>
          <tr><td><strong>Cluster</strong></td><td>Kubernetes itself and cluster-wide policy.</td><td>RBAC, admission control, Pod Security Standards, NetworkPolicy, etcd encryption.</td></tr>
          <tr><td><strong>Container</strong></td><td>The image and its runtime configuration.</td><td>Minimal base images, non-root users, dropped capabilities, seccomp, image scanning.</td></tr>
          <tr><td><strong>Code</strong></td><td>The application you wrote.</td><td>Secure coding, dependency scanning, secrets never hard-coded, input validation.</td></tr>
        </tbody>
      </table>

      <h3>The nesting rule — and why it's ruthless</h3>
      <p>The rings are ordered from outside in, and <strong>an inner layer can never be more secure than the layer outside it</strong>. Perfect application code (Code) means nothing if the Container runs as root with host mounts. A hardened Container means nothing if the Cluster's RBAC hands out cluster-admin freely. And an immaculate Cluster means nothing if the Cloud account's IAM lets anyone reach the node's metadata service or the control-plane endpoint.</p>

      <blockquote>Read the 4 C's as a chain of dependencies: <strong>you must secure from the outside in.</strong> Effort spent on the Code ring while the Cloud ring is wide open is effort wasted — the attacker simply walks in through the outer door.</blockquote>

      <h3>Where the rest of this course lives</h3>
      <ul>
        <li><strong>Cluster</strong> — Lessons 4 (RBAC), 5 (admission/Pod Security), 6 (Secrets), 7 (NetworkPolicy).</li>
        <li><strong>Container</strong> — Lessons 8 (image/supply chain) and 9 (runtime isolation).</li>
        <li><strong>Cloud</strong> — appears throughout as the node metadata service, IAM, and control-plane exposure (a recurring escape target).</li>
        <li><strong>Code</strong> — the vulnerable app that becomes the attacker's beachhead in Lesson 10's attack paths.</li>
      </ul>

      <h3>The cloud metadata trap — a preview</h3>
      <p>One concrete way the Cloud ring bites: many clusters run on cloud VMs with a <strong>metadata service</strong> at <code>169.254.169.254</code> that hands out the node's cloud IAM credentials. A compromised Pod that can reach that address may steal the node's cloud identity and pivot into the wider cloud account — a Cloud-layer failure triggered from the Container layer. Blocking Pod access to metadata is a classic 4 C's control that spans two rings at once.</p>
    `,
    quizzes: [
      { id: "k8s-l3-q1", question: "What are the 4 C's of cloud-native security, from outer to inner?", options: ["Code, Container, Cluster, Cloud", "Cloud, Cluster, Container, Code", "Cluster, Cloud, Code, Container", "Container, Code, Cloud, Cluster"], correctAnswerIndex: 1, explanation: "The layers nest from the outside in: Cloud, then Cluster, then Container, then Code." },
      { id: "k8s-l3-q2", question: "Which layer includes RBAC, admission control, and NetworkPolicy?", options: ["Cloud", "Cluster", "Container", "Code"], correctAnswerIndex: 1, explanation: "Cluster-wide Kubernetes policy — RBAC, admission control, Pod Security, NetworkPolicy — lives in the Cluster ring." },
      { id: "k8s-l3-q3", question: "What is the central rule of the nested 4 C's model?", options: ["Inner layers are always safest", "An inner layer can never be more secure than the layer outside it", "Only the Code layer matters", "Layers are independent"], correctAnswerIndex: 1, explanation: "Security depends outward-in; a compromised outer ring undermines every ring inside it." },
      { id: "k8s-l3-q4", question: "Minimal base images, non-root users, and dropped capabilities belong to which C?", options: ["Cloud", "Cluster", "Container", "Code"], correctAnswerIndex: 2, explanation: "Image and runtime configuration hardening is the Container layer." },
      { id: "k8s-l3-q5", question: "Perfectly secure application code cannot help if…", options: ["The container also runs as non-root", "The container runs as root with host mounts and permissive cluster policy", "NetworkPolicy is enabled", "The image is scanned"], correctAnswerIndex: 1, explanation: "An insecure outer ring (Container/Cluster) nullifies a secure inner ring (Code)." },
      { id: "k8s-l3-q6", question: "IAM, network firewalls, and node hardening are controls in which layer?", options: ["Cloud", "Cluster", "Container", "Code"], correctAnswerIndex: 0, explanation: "The underlying infrastructure and its identity/network controls are the Cloud layer." },
      { id: "k8s-l3-q7", question: "What lives at 169.254.169.254 on many cloud nodes?", options: ["The DNS root server", "The cloud metadata service handing out the node's IAM credentials", "The kube-apiserver", "The container registry"], correctAnswerIndex: 1, explanation: "The link-local metadata endpoint exposes node cloud credentials, a prime pivot target from a compromised Pod." },
      { id: "k8s-l3-q8", question: "Why is blocking Pod access to the metadata service a good example of the 4 C's?", options: ["It only affects Code", "It prevents a Container-layer compromise from cascading into a Cloud-layer credential theft", "It disables all networking", "It replaces RBAC"], correctAnswerIndex: 1, explanation: "It stops a Container-ring breach from stealing Cloud-ring credentials — a control spanning two rings." },
    ],
  },

  // ── LESSON 4 ───────────────────────────────────────────────────────────────
  {
    title: "04 // RBAC & Service Accounts — Least Privilege or Bust",
    summary: "How Kubernetes authorization works, why certain innocuous-looking verbs are secretly cluster-admin, and how ServiceAccount tokens become an attacker's first prize.",
    content: `
      <h2>Authorization is the master lock</h2>
      <p>Once a request reaches the API server and is authenticated, <strong>RBAC (Role-Based Access Control)</strong> decides whether it's allowed. RBAC is the cluster's master lock, and misconfigured RBAC is one of the most common paths to total compromise. Get this lesson right and you've closed the widest door.</p>

      <h3>The four RBAC objects</h3>
      <table>
        <thead><tr><th>Object</th><th>What it is</th><th>Scope</th></tr></thead>
        <tbody>
          <tr><td><strong>Role</strong></td><td>A set of allowed verbs on resources (get/list/create/delete on pods, secrets…).</td><td>One namespace.</td></tr>
          <tr><td><strong>ClusterRole</strong></td><td>Same idea but cluster-wide, or for cluster-scoped resources.</td><td>Whole cluster.</td></tr>
          <tr><td><strong>RoleBinding</strong></td><td>Grants a Role (or ClusterRole) to a subject in a namespace.</td><td>One namespace.</td></tr>
          <tr><td><strong>ClusterRoleBinding</strong></td><td>Grants a ClusterRole to a subject across the whole cluster.</td><td>Whole cluster.</td></tr>
        </tbody>
      </table>
      <p>A <strong>subject</strong> is a user, group, or — most importantly here — a <strong>ServiceAccount</strong> (the identity a Pod runs as).</p>

      <h3>Verbs that are secretly admin</h3>
      <p>Beginners rank RBAC risk by how "scary" a verb sounds. Attackers rank it by what it actually enables. Several modest-looking grants are effectively cluster-admin:</p>
      <ul>
        <li><strong>get/list secrets</strong> — read every credential in scope, including other ServiceAccounts' tokens. Read all secrets and you can impersonate anyone.</li>
        <li><strong>create pods</strong> — schedule a Pod that mounts the host, runs privileged, or uses a powerful ServiceAccount. Create pods ≈ run code as anyone.</li>
        <li><strong>pods/exec</strong> — run commands inside existing Pods, inheriting their identity and secrets.</li>
        <li><strong>create/update rolebindings</strong> — grant yourself more privileges. This is privilege escalation by design; Kubernetes has special escalation-prevention rules around it.</li>
        <li><strong>impersonate</strong> — literally act as another user or ServiceAccount.</li>
      </ul>

      <blockquote>The lesson attackers know and beginners miss: <strong>RBAC risk is about capability, not vocabulary.</strong> "get secrets" and "create pods" sound harmless and are among the most dangerous grants in the cluster.</blockquote>

      <h3>ServiceAccount tokens — the auto-mounted prize</h3>
      <p>Every Pod runs as a ServiceAccount, and by default Kubernetes <strong>auto-mounts that account's token</strong> into the container at <code>/var/run/secrets/kubernetes.io/serviceaccount/token</code>. If an attacker gets code execution in a Pod, that token is right there — and whatever RBAC the ServiceAccount has, the attacker now has. If it's the <code>default</code> account with broad rights, or worse a cluster-admin binding, one compromised app becomes cluster compromise.</p>
      <pre><code># Turn off the auto-mount unless the Pod genuinely needs the API.
apiVersion: v1
kind: ServiceAccount
metadata:
  name: web-sa
automountServiceAccountToken: false
---
# ...or per-Pod:
apiVersion: v1
kind: Pod
metadata:
  name: web
spec:
  serviceAccountName: web-sa
  automountServiceAccountToken: false</code></pre>

      <h3>A least-privilege Role, done right</h3>
      <pre><code># Read-only access to Pods in ONE namespace — nothing more.
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: web
  name: pod-reader
rules:
  - apiGroups: [""]
    resources: ["pods"]
    verbs: ["get", "list", "watch"]   # note: no secrets, no create, no exec</code></pre>
      <p>Grant the narrowest set of verbs, on the fewest resources, in the smallest scope, to the specific subject that needs it. Audit for wildcards (<code>verbs: ["*"]</code>, <code>resources: ["*"]</code>) and for any ClusterRoleBinding to <code>cluster-admin</code> — those are the first things a competent auditor (and attacker) looks for.</p>
    `,
    quizzes: [
      { id: "k8s-l4-q1", question: "What does RBAC decide?", options: ["Which node a Pod runs on", "Whether an authenticated request is allowed to perform an action", "How images are built", "The Pod's CPU limit"], correctAnswerIndex: 1, explanation: "RBAC is the authorization layer: after authentication, it determines what a subject may do." },
      { id: "k8s-l4-q2", question: "What is the difference between a Role and a ClusterRole?", options: ["Roles are for admins only", "A Role is namespace-scoped; a ClusterRole applies cluster-wide or to cluster-scoped resources", "ClusterRoles cannot grant verbs", "They are identical"], correctAnswerIndex: 1, explanation: "Role permissions are confined to one namespace; ClusterRole permissions span the cluster." },
      { id: "k8s-l4-q3", question: "Why is 'get/list secrets' an effectively admin-level grant?", options: ["It reboots nodes", "It lets you read every credential in scope, including other ServiceAccounts' tokens, enabling impersonation", "It deletes the cluster", "It only reads logs"], correctAnswerIndex: 1, explanation: "Reading Secrets exposes tokens and credentials, letting an attacker impersonate other identities." },
      { id: "k8s-l4-q4", question: "Where is a ServiceAccount token mounted in a Pod by default?", options: ["/etc/passwd", "/var/run/secrets/kubernetes.io/serviceaccount/token", "/root/.kube/config", "/tmp/token"], correctAnswerIndex: 1, explanation: "Kubernetes auto-mounts the token at that path, making it immediately available to any code in the Pod." },
      { id: "k8s-l4-q5", question: "How do you stop a Pod's ServiceAccount token from being auto-mounted?", options: ["Delete the namespace", "Set automountServiceAccountToken: false on the ServiceAccount or Pod", "Rename the Pod", "Increase the Pod's memory"], correctAnswerIndex: 1, explanation: "Setting automountServiceAccountToken: false prevents the token from being injected when the Pod doesn't need the API." },
      { id: "k8s-l4-q6", question: "Why is 'create pods' a dangerous verb?", options: ["Pods are expensive", "You can schedule a privileged/host-mounting Pod or use a powerful ServiceAccount — effectively running code as anyone", "It disables DNS", "It has no effect"], correctAnswerIndex: 1, explanation: "The ability to create Pods lets an attacker craft a privileged or high-privilege workload, approximating cluster-admin." },
      { id: "k8s-l4-q7", question: "Why does Kubernetes have special rules around create/update of RoleBindings?", options: ["To speed up scheduling", "Because granting bindings is privilege escalation — you could grant yourself more rights", "To compress logs", "They are cosmetic"], correctAnswerIndex: 1, explanation: "Editing bindings can escalate privileges, so Kubernetes restricts granting rights you don't already hold." },
      { id: "k8s-l4-q8", question: "What should a least-privilege Role look like?", options: ["verbs: ['*'] on resources: ['*']", "The narrowest verbs, fewest resources, smallest scope, for the specific subject", "A ClusterRoleBinding to cluster-admin", "No rules at all"], correctAnswerIndex: 1, explanation: "Least privilege means granting only the minimal verbs/resources needed, scoped as tightly as possible." },
    ],
  },

  // ── LESSON 5 ───────────────────────────────────────────────────────────────
  {
    title: "05 // Pod Security Standards & Admission Control",
    summary: "How the cluster refuses to run dangerous Pods — the three Pod Security levels, why PSPs died, and how admission webhooks like OPA Gatekeeper and Kyverno enforce policy.",
    content: `
      <h2>Prevention beats detection — block the bad Pod before it runs</h2>
      <p>The most valuable security control is the one that stops a dangerous workload from ever scheduling. In Kubernetes that gate is <strong>admission control</strong>: after authentication and authorization, but <em>before</em> an object is persisted, admission controllers inspect it and can mutate or reject it.</p>

      <h3>The admission pipeline</h3>
      <ol>
        <li><strong>Authentication</strong> — who are you?</li>
        <li><strong>Authorization (RBAC)</strong> — are you allowed to do this?</li>
        <li><strong>Mutating admission</strong> — controllers may modify the object (e.g. inject defaults, drop capabilities).</li>
        <li><strong>Validating admission</strong> — controllers may reject the object if it violates policy.</li>
        <li><strong>Persist to etcd</strong> — only survivors are stored and scheduled.</li>
      </ol>
      <p>This is where "no privileged Pods, ever" becomes a hard, unbypassable rule rather than a hope.</p>

      <h3>Pod Security Standards: three levels</h3>
      <p>The community distilled Pod hardening into three named profiles, the <strong>Pod Security Standards (PSS)</strong>:</p>
      <table>
        <thead><tr><th>Level</th><th>Meaning</th><th>Allows…</th></tr></thead>
        <tbody>
          <tr><td><strong>Privileged</strong></td><td>Unrestricted — anything goes.</td><td>privileged, hostPath, hostNetwork, hostPID — the dangerous lot.</td></tr>
          <tr><td><strong>Baseline</strong></td><td>Blocks known privilege escalations while staying broadly compatible.</td><td>Most normal apps; no privileged, no host namespaces.</td></tr>
          <tr><td><strong>Restricted</strong></td><td>Heavily hardened best practice.</td><td>Non-root only, drop ALL capabilities, seccomp RuntimeDefault, no privilege escalation.</td></tr>
        </tbody>
      </table>

      <h3>Pod Security Admission (the built-in enforcer)</h3>
      <p>Modern Kubernetes ships <strong>Pod Security Admission (PSA)</strong>, a built-in controller that enforces a PSS level per namespace via labels, in three modes: <code>enforce</code> (reject), <code>audit</code> (log), <code>warn</code> (message the user).</p>
      <pre><code>apiVersion: v1
kind: Namespace
metadata:
  name: web
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/enforce-version: latest
    pod-security.kubernetes.io/warn: restricted</code></pre>

      <h3>Why PodSecurityPolicy (PSP) was removed</h3>
      <p>The original mechanism, <strong>PodSecurityPolicy</strong>, was deprecated in v1.21 and <strong>removed in v1.25</strong>. It was confusing (ordering was non-obvious, an authorization-based model that failed open in surprising ways) and hard to roll out safely. Its replacements are the built-in PSA above, or a full <strong>policy engine</strong> for anything more expressive.</p>

      <h3>Policy engines: OPA Gatekeeper and Kyverno</h3>
      <p>When you need richer rules than PSS's three levels — "images must come from our registry", "every Pod must have resource limits", "no <code>latest</code> tags" — you deploy a validating admission webhook:</p>
      <ul>
        <li><strong>OPA Gatekeeper</strong> — policies written in Rego (the Open Policy Agent language), highly expressive.</li>
        <li><strong>Kyverno</strong> — Kubernetes-native policies written in YAML, easier for teams already fluent in K8s manifests; can validate, mutate, and generate.</li>
      </ul>

      <blockquote>Carry this forward: <strong>admission control is where policy becomes physics.</strong> RBAC says who <em>may</em> act; admission control says which objects are even <em>allowed to exist</em>. A privileged Pod that admission rejects can never escape, because it never runs.</blockquote>
    `,
    quizzes: [
      { id: "k8s-l5-q1", question: "When does admission control act on an object?", options: ["After it is stored in etcd", "After authentication and authorization but before the object is persisted", "Only at Pod deletion", "Never, it's advisory"], correctAnswerIndex: 1, explanation: "Admission controllers inspect (and may mutate or reject) an object after authz and before it is written to etcd." },
      { id: "k8s-l5-q2", question: "Which Pod Security Standard is the most hardened?", options: ["Privileged", "Baseline", "Restricted", "Default"], correctAnswerIndex: 2, explanation: "Restricted enforces non-root, dropped capabilities, seccomp RuntimeDefault, and no privilege escalation." },
      { id: "k8s-l5-q3", question: "What does the Baseline level primarily do?", options: ["Allows everything including privileged", "Blocks known privilege escalations while staying broadly compatible", "Requires non-root and dropped capabilities", "Disables the API server"], correctAnswerIndex: 1, explanation: "Baseline prevents known escalations (no privileged, no host namespaces) without the strictness of Restricted." },
      { id: "k8s-l5-q4", question: "What are the three modes of Pod Security Admission?", options: ["read, write, execute", "enforce, audit, warn", "allow, deny, log", "start, stop, restart"], correctAnswerIndex: 1, explanation: "PSA supports enforce (reject), audit (log the violation), and warn (return a warning to the user)." },
      { id: "k8s-l5-q5", question: "What happened to PodSecurityPolicy (PSP)?", options: ["It became the default", "It was deprecated in v1.21 and removed in v1.25", "It replaced RBAC", "It was renamed to NetworkPolicy"], correctAnswerIndex: 1, explanation: "PSP was confusing and hard to roll out; it was removed in v1.25 in favour of PSA and policy engines." },
      { id: "k8s-l5-q6", question: "Which policy engine uses the Rego language?", options: ["Kyverno", "OPA Gatekeeper", "Falco", "Trivy"], correctAnswerIndex: 1, explanation: "OPA Gatekeeper enforces policies written in Rego, the Open Policy Agent language." },
      { id: "k8s-l5-q7", question: "How is Kyverno different from Gatekeeper in authoring style?", options: ["Kyverno uses assembly", "Kyverno policies are written as Kubernetes-native YAML rather than Rego", "Kyverno cannot mutate objects", "Kyverno only works on Windows"], correctAnswerIndex: 1, explanation: "Kyverno uses YAML manifests familiar to K8s users and can validate, mutate, and generate resources." },
      { id: "k8s-l5-q8", question: "Why is admission control described as 'where policy becomes physics'?", options: ["It compiles code", "A rejected object never exists, so a forbidden Pod can never run or escape", "It manages hardware", "It replaces etcd"], correctAnswerIndex: 1, explanation: "Admission control governs which objects may exist at all; a blocked privileged Pod simply never runs." },
    ],
  },

  // ── LESSON 6 ───────────────────────────────────────────────────────────────
  {
    title: "06 // Secrets Management Done Properly",
    summary: "Why Kubernetes Secrets are only base64 by default, how to encrypt them at rest, and how external secret managers close the remaining gaps.",
    content: `
      <h2>The word 'Secret' is doing a lot of optimistic work</h2>
      <p>A Kubernetes <strong>Secret</strong> is an object for holding sensitive data — passwords, tokens, TLS keys — separately from Pod specs and images. That separation is genuinely useful. But new engineers assume "Secret" means "encrypted", and by default <strong>it does not</strong>.</p>

      <h3>Base64 is encoding, not encryption</h3>
      <p>Secret values are stored <strong>base64-encoded</strong>. Base64 is a reversible transport encoding with no key — anyone can decode it instantly:</p>
      <pre><code>echo 'U3VwZXJTZWNyZXQxMjM=' | base64 -d
# -> SuperSecret123</code></pre>
      <p>So a Secret protects against shoulder-surfing YAML, not against an attacker who can read the object. Two things must be true for Secrets to actually be secret: <strong>encryption at rest</strong> in etcd, and <strong>tight RBAC</strong> on who can <code>get</code> them.</p>

      <h3>Layer 1 — encryption at rest</h3>
      <p>As covered in Lesson 2, enable an EncryptionConfiguration so the API server encrypts Secrets before writing them to etcd. Best practice is a <strong>KMS provider</strong> (cloud key management) rather than a static local key, so the encryption key itself isn't sitting on disk next to the data.</p>

      <h3>Layer 2 — RBAC on Secrets</h3>
      <p>Recall from Lesson 4: <code>get secrets</code> is effectively admin. Restrict which ServiceAccounts and users can read Secrets, scope Secrets to namespaces, and never grant blanket <code>get</code> on secrets cluster-wide. A Secret only the right Pod can read is far safer than a strongly-encrypted one everyone can read.</p>

      <h3>Layer 3 — don't leak them yourself</h3>
      <table>
        <thead><tr><th>Anti-pattern</th><th>Why it leaks</th><th>Better</th></tr></thead>
        <tbody>
          <tr><td>Secret as env var</td><td>Visible in <code>/proc</code>, crash dumps, child processes, and often logs.</td><td>Mount as a file (tmpfs volume); tighter blast radius.</td></tr>
          <tr><td>Secret baked into image</td><td>Anyone who pulls the image gets it forever, across all layers.</td><td>Inject at runtime from a Secret or external manager.</td></tr>
          <tr><td>Secret in a Git manifest</td><td>Plaintext in version history forever.</td><td>Sealed Secrets / external secret refs; never commit raw values.</td></tr>
        </tbody>
      </table>

      <h3>External secret managers</h3>
      <p>Mature setups often keep the real secrets <em>outside</em> Kubernetes entirely, in a dedicated manager, and sync or inject them on demand:</p>
      <ul>
        <li><strong>HashiCorp Vault</strong> — dynamic secrets, leasing, and rotation; can inject via an agent sidecar.</li>
        <li><strong>Cloud secret managers</strong> — AWS Secrets Manager, GCP Secret Manager, Azure Key Vault.</li>
        <li><strong>External Secrets Operator</strong> — syncs from those managers into K8s Secrets with controlled scope.</li>
        <li><strong>Sealed Secrets</strong> — encrypts a Secret so the ciphertext is safe to commit to Git; only the in-cluster controller can decrypt.</li>
      </ul>

      <blockquote>The rule to internalise: a Kubernetes Secret is a <em>reference and a namespace boundary</em>, not a vault. Real secret security is the combination of encryption at rest, disciplined RBAC, no leakage into env/images/Git, and — ideally — an external manager with rotation.</blockquote>
    `,
    quizzes: [
      { id: "k8s-l6-q1", question: "By default, how are Kubernetes Secret values stored in etcd?", options: ["AES-256 encrypted", "Base64-encoded (reversible, no key)", "Hashed with SHA-256", "Not stored at all"], correctAnswerIndex: 1, explanation: "By default Secrets are only base64-encoded — encoding, not encryption — so anyone who reads them can decode them." },
      { id: "k8s-l6-q2", question: "What is the difference between base64 encoding and encryption?", options: ["None", "Base64 is reversible with no key; encryption requires a key to reverse", "Base64 is stronger", "Encryption is reversible without a key"], correctAnswerIndex: 1, explanation: "Base64 is a keyless, trivially reversible transport encoding; encryption requires a secret key to decrypt." },
      { id: "k8s-l6-q3", question: "What makes Secrets actually protected in etcd?", options: ["Renaming them", "Encryption at rest via an EncryptionConfiguration, ideally a KMS provider", "Using longer names", "Storing them as ConfigMaps"], correctAnswerIndex: 1, explanation: "Encryption at rest (best via a KMS provider) ensures Secrets aren't readable straight from etcd." },
      { id: "k8s-l6-q4", question: "Why is exposing a Secret as an environment variable riskier than as a file?", options: ["Env vars are slower", "Env vars can leak via /proc, crash dumps, child processes, and logs", "Files cannot hold secrets", "Env vars are encrypted"], correctAnswerIndex: 1, explanation: "Environment variables are exposed in many places (proc, dumps, logs); a mounted tmpfs file has a tighter blast radius." },
      { id: "k8s-l6-q5", question: "Why should you never bake a secret into a container image?", options: ["Images are too small", "Anyone who pulls the image can extract the secret from its layers, permanently", "It slows the build", "Images cannot store text"], correctAnswerIndex: 1, explanation: "Secrets embedded in image layers are recoverable by anyone with the image and persist across all versions." },
      { id: "k8s-l6-q6", question: "What does HashiCorp Vault add over plain Kubernetes Secrets?", options: ["Nothing", "Dynamic secrets, leasing, and rotation, managed outside the cluster", "Faster networking", "Automatic Pod scaling"], correctAnswerIndex: 1, explanation: "Vault offers dynamic, leased, rotatable secrets kept outside K8s and injected on demand." },
      { id: "k8s-l6-q7", question: "What problem do Sealed Secrets solve?", options: ["Encrypting network traffic", "Letting you safely commit an encrypted Secret to Git that only the in-cluster controller can decrypt", "Scheduling Pods", "Scanning images"], correctAnswerIndex: 1, explanation: "Sealed Secrets encrypt values so the ciphertext is safe in version control, decryptable only in-cluster." },
      { id: "k8s-l6-q8", question: "Which combination truly secures Secrets?", options: ["Base64 alone", "Encryption at rest + tight RBAC + no leakage into env/images/Git + rotation", "Renaming Secrets frequently", "Storing them in ConfigMaps"], correctAnswerIndex: 1, explanation: "Real secret security is layered: encryption at rest, disciplined RBAC, no leakage, and ideally external rotation." },
    ],
  },

  // ── LESSON 7 ───────────────────────────────────────────────────────────────
  {
    title: "07 // Network Policies & East-West Segmentation",
    summary: "Why every Pod can talk to every other Pod by default, how NetworkPolicy imposes segmentation, and how to build a zero-trust default-deny posture.",
    content: `
      <h2>The flat network nobody warns you about</h2>
      <p>Here is a fact that surprises almost everyone: in a fresh Kubernetes cluster, <strong>every Pod can reach every other Pod, in every namespace, with no restriction.</strong> The network is flat and default-allow. Namespaces organise and scope objects — they do <em>not</em> isolate network traffic.</p>

      <p>This matters because attacks move <strong>east-west</strong>. Perimeter (north-south) controls stop outsiders getting in; but once an attacker owns one Pod, a flat network lets them freely reach databases, internal APIs, and the control plane. Segmentation limits that lateral movement.</p>

      <h3>What a NetworkPolicy is</h3>
      <p>A <strong>NetworkPolicy</strong> is a Kubernetes object that specifies which connections a set of Pods may make (egress) and accept (ingress), selected by labels. Two essential truths:</p>
      <ul>
        <li>NetworkPolicy is enforced by the <strong>CNI plugin</strong> (Calico, Cilium, etc.). If your CNI doesn't support it, the policies are silently ignored — a nasty gotcha.</li>
        <li>The moment <em>any</em> policy selects a Pod for a direction (ingress/egress), that direction flips to <strong>default-deny</strong> for that Pod — only what's explicitly allowed gets through.</li>
      </ul>

      <h3>Step 1 — default-deny the namespace</h3>
      <p>The zero-trust starting point: deny all ingress and egress, then open only what's needed.</p>
      <pre><code>apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: web
spec:
  podSelector: {}          # selects EVERY pod in the namespace
  policyTypes:
    - Ingress
    - Egress</code></pre>
      <p>With no <code>ingress</code> or <code>egress</code> rules listed, nothing is allowed in either direction. Now you add back precisely the flows you want.</p>

      <h3>Step 2 — allow the flows you need</h3>
      <pre><code>apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-frontend-to-api
  namespace: web
spec:
  podSelector:
    matchLabels:
      app: api           # this policy governs the api pods
  policyTypes: ["Ingress"]
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: frontend   # only frontend pods may connect
      ports:
        - protocol: TCP
          port: 8080</code></pre>
      <p>Read it: the <code>api</code> Pods accept ingress only from <code>frontend</code> Pods, only on TCP 8080. Everything else — other apps, other namespaces, the internet — is denied.</p>

      <h3>Selectors you'll use</h3>
      <table>
        <thead><tr><th>Selector</th><th>Chooses</th></tr></thead>
        <tbody>
          <tr><td><code>podSelector</code></td><td>Pods by label (within the policy's namespace).</td></tr>
          <tr><td><code>namespaceSelector</code></td><td>Whole namespaces by label — for cross-namespace rules.</td></tr>
          <tr><td><code>ipBlock</code></td><td>CIDR ranges — e.g. allow egress to a specific external service, or block the metadata IP.</td></tr>
        </tbody>
      </table>

      <blockquote>The strategic goal is <strong>microsegmentation</strong>: each workload can talk only to the specific peers it must, so a single compromised Pod is a dead end instead of a launch pad. Combine a default-deny baseline in every namespace with narrow allow-rules, and east-west movement — the attacker's favourite phase — grinds to a halt.</blockquote>
    `,
    quizzes: [
      { id: "k8s-l7-q1", question: "In a fresh cluster with no NetworkPolicies, which Pods can talk to each other?", options: ["Only Pods in the same namespace", "All Pods can reach all other Pods across all namespaces (default-allow)", "No Pods can communicate", "Only Pods with the same label"], correctAnswerIndex: 1, explanation: "The default network is flat and default-allow; namespaces do not isolate traffic on their own." },
      { id: "k8s-l7-q2", question: "What does 'east-west' movement refer to?", options: ["Traffic entering from the internet", "Lateral movement between internal Pods/services after an initial foothold", "DNS resolution", "Log shipping"], correctAnswerIndex: 1, explanation: "East-west is lateral internal traffic; segmentation limits an attacker moving from one Pod to others." },
      { id: "k8s-l7-q3", question: "Who actually enforces NetworkPolicy?", options: ["The scheduler", "The CNI plugin (e.g. Calico, Cilium)", "etcd", "The kubelet alone"], correctAnswerIndex: 1, explanation: "NetworkPolicy is enforced by the CNI plugin; if the CNI doesn't support it, policies are silently ignored." },
      { id: "k8s-l7-q4", question: "What happens once a NetworkPolicy selects a Pod for the Ingress direction?", options: ["All ingress is allowed", "Ingress becomes default-deny for that Pod — only explicitly allowed traffic passes", "The Pod is deleted", "Egress is disabled too automatically"], correctAnswerIndex: 1, explanation: "Being selected flips that direction to default-deny; only rules you add permit traffic." },
      { id: "k8s-l7-q5", question: "What does `podSelector: {}` combined with Ingress+Egress policyTypes and no rules achieve?", options: ["Allows all traffic", "Selects every Pod and denies all ingress and egress (default-deny)", "Deletes all Pods", "Only affects one Pod"], correctAnswerIndex: 1, explanation: "An empty podSelector selects all Pods; with no allow rules, all listed directions are denied." },
      { id: "k8s-l7-q6", question: "Which selector is used to allow traffic from Pods in another namespace?", options: ["ipBlock", "namespaceSelector", "portSelector", "nodeSelector"], correctAnswerIndex: 1, explanation: "namespaceSelector matches whole namespaces by label, enabling cross-namespace allow rules." },
      { id: "k8s-l7-q7", question: "What is the purpose of `ipBlock` in a NetworkPolicy?", options: ["To select Pods by name", "To allow or deny CIDR ranges — e.g. block the cloud metadata IP", "To set CPU limits", "To choose the CNI"], correctAnswerIndex: 1, explanation: "ipBlock matches IP CIDR ranges, useful for external egress control or blocking sensitive IPs like metadata." },
      { id: "k8s-l7-q8", question: "What is the strategic goal of NetworkPolicy microsegmentation?", options: ["Faster Pods", "Each workload talks only to required peers, so a compromised Pod is a dead end", "Larger clusters", "Eliminating RBAC"], correctAnswerIndex: 1, explanation: "Microsegmentation confines each Pod's connectivity, halting the lateral movement an attacker relies on." },
    ],
  },

  // ── LESSON 8 ───────────────────────────────────────────────────────────────
  {
    title: "08 // Image & Supply-Chain Security",
    summary: "Trusting what you run — vulnerability scanning, SBOMs, image signing with sigstore/cosign, and admission gates that reject unverified images.",
    content: `
      <h2>You are running other people's code — prove it's the code you think it is</h2>
      <p>Every container starts from an <strong>image</strong>: a stack of filesystem layers plus metadata. That image includes your app, its dependencies, and often an entire base OS — layers of code you didn't write. <strong>Supply-chain security</strong> is the discipline of trusting what's in those layers and proving it hasn't been tampered with.</p>

      <h3>The threats along the chain</h3>
      <ul>
        <li><strong>Vulnerable dependencies</strong> — a known-CVE library baked into the image (Log4Shell being the infamous example).</li>
        <li><strong>Malicious images</strong> — typosquatted or backdoored images from public registries.</li>
        <li><strong>Tampering</strong> — an image altered in the registry or in transit after it was built.</li>
        <li><strong>Compromised build pipeline</strong> — the CI system itself poisoned (the SolarWinds-style problem).</li>
      </ul>

      <h3>Scan for known vulnerabilities</h3>
      <p>A scanner inspects image layers and lists packages with known CVEs. Run it in CI (fail the build on criticals) and continuously in the registry (new CVEs are disclosed daily against images you already shipped):</p>
      <pre><code># Scan an image and fail on High/Critical findings.
trivy image --severity HIGH,CRITICAL --exit-code 1 myregistry.io/web:1.4.2</code></pre>
      <p>Common tools: <strong>Trivy</strong>, <strong>Grype</strong>, <strong>Clair</strong>. Scanning finds the <em>known</em> problems — necessary, but not proof of trustworthiness by itself.</p>

      <h3>Know what's inside: the SBOM</h3>
      <p>A <strong>Software Bill of Materials (SBOM)</strong> is a machine-readable inventory of every component and version in an artifact (formats: SPDX, CycloneDX). When the next Log4Shell drops, an SBOM answers "are we affected, and where?" in seconds instead of days.</p>

      <h3>Prove authenticity: signing with sigstore/cosign</h3>
      <p>Scanning tells you what's inside; <strong>signing</strong> tells you it's genuine and unmodified. With <strong>cosign</strong> (part of the <strong>sigstore</strong> project) you cryptographically sign an image so consumers can verify it came from you and hasn't changed:</p>
      <pre><code># Sign, then verify.
cosign sign myregistry.io/web:1.4.2
cosign verify --key cosign.pub myregistry.io/web:1.4.2</code></pre>

      <h3>Enforce trust at admission</h3>
      <p>Signing is worthless if the cluster runs unsigned images anyway. Close the loop with an admission policy (Kyverno, Gatekeeper, or a dedicated verifier) that <strong>rejects any Pod whose image isn't signed by a trusted key and free of critical CVEs</strong> — and only allows images from your registry:</p>
      <pre><code># Kyverno (conceptual): require images to come from the trusted registry.
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: restrict-registries
spec:
  validationFailureAction: Enforce
  rules:
    - name: only-trusted-registry
      match:
        any:
          - resources: { kinds: ["Pod"] }
      validate:
        message: "Images must come from myregistry.io"
        pattern:
          spec:
            containers:
              - image: "myregistry.io/*"</code></pre>

      <h3>SLSA — a maturity ladder</h3>
      <p><strong>SLSA</strong> (Supply-chain Levels for Software Artifacts) is a framework of increasing guarantees about build integrity and provenance. You don't need to memorise its levels — just know the industry now expects <em>provenance</em>: verifiable evidence of how an artifact was built and by whom.</p>

      <blockquote>The through-line: <strong>scan to find the known bad, sign to prove the genuine, and gate at admission so only genuine, scanned images ever run.</strong> Any one of the three alone leaves a hole; together they make the supply chain defensible.</blockquote>
    `,
    quizzes: [
      { id: "k8s-l8-q1", question: "What is a container image?", options: ["A running process", "A stack of filesystem layers plus metadata containing the app, dependencies, and often a base OS", "A network policy", "A type of Secret"], correctAnswerIndex: 1, explanation: "An image is the immutable template — layered filesystem plus metadata — from which containers are instantiated." },
      { id: "k8s-l8-q2", question: "What does an image vulnerability scanner (e.g. Trivy) do?", options: ["Signs the image", "Inspects layers and reports packages with known CVEs", "Encrypts the registry", "Schedules Pods"], correctAnswerIndex: 1, explanation: "Scanners enumerate components and flag those with known vulnerabilities (CVEs)." },
      { id: "k8s-l8-q3", question: "What is an SBOM?", options: ["A firewall rule", "A machine-readable inventory of every component and version in an artifact", "A signing key", "A network plugin"], correctAnswerIndex: 1, explanation: "A Software Bill of Materials lists all components/versions, enabling fast impact analysis when new CVEs appear." },
      { id: "k8s-l8-q4", question: "What does image signing with cosign provide that scanning does not?", options: ["Faster pulls", "Cryptographic proof the image is authentic and unmodified", "Smaller images", "More CPU"], correctAnswerIndex: 1, explanation: "Signing proves provenance and integrity; scanning only finds known vulnerabilities inside." },
      { id: "k8s-l8-q5", question: "Which project is cosign part of?", options: ["Prometheus", "sigstore", "Istio", "Helm"], correctAnswerIndex: 1, explanation: "cosign is part of the sigstore project for signing and verifying software artifacts." },
      { id: "k8s-l8-q6", question: "Why enforce image trust at admission control?", options: ["To speed builds", "Because signing/scanning is worthless if the cluster still runs unsigned or vulnerable images", "To reduce logging", "To bypass RBAC"], correctAnswerIndex: 1, explanation: "An admission gate ensures only signed, scanned, trusted-registry images actually run — closing the loop." },
      { id: "k8s-l8-q7", question: "What does the SLSA framework describe?", options: ["Pod scheduling priorities", "Increasing levels of build integrity and provenance guarantees", "Network segmentation tiers", "RBAC verbs"], correctAnswerIndex: 1, explanation: "SLSA (Supply-chain Levels for Software Artifacts) is a maturity model for build integrity and provenance." },
      { id: "k8s-l8-q8", question: "What is the complete supply-chain defence described in this lesson?", options: ["Only scan images", "Scan to find known bad, sign to prove genuine, and gate at admission so only genuine, scanned images run", "Only sign images", "Rename images randomly"], correctAnswerIndex: 1, explanation: "The three controls combine: scanning, signing, and admission enforcement together make the chain defensible." },
    ],
  },

  // ── LESSON 9 ───────────────────────────────────────────────────────────────
  {
    title: "09 // Runtime Security & Isolation — Namespaces, Capabilities, seccomp",
    summary: "The kernel-level knobs that keep a container contained — Linux namespaces, capabilities, the securityContext, seccomp/AppArmor, and detecting runtime abuse.",
    content: `
      <h2>Turning the isolation back on</h2>
      <p>Lesson 1 said a container is only as isolated as the kernel features you leave enabled. This lesson is the practical inverse: the specific settings that <strong>keep</strong> a container contained, and how to detect when one misbehaves at runtime.</p>

      <h3>What actually isolates a container</h3>
      <table>
        <thead><tr><th>Mechanism</th><th>Isolates</th><th>Broken by</th></tr></thead>
        <tbody>
          <tr><td><strong>Namespaces</strong> (pid, net, mnt, ipc, uts, user)</td><td>Process view, network, filesystem, hostname, etc.</td><td><code>hostPID</code>, <code>hostNetwork</code>, <code>hostIPC: true</code> — sharing the host's namespace.</td></tr>
          <tr><td><strong>cgroups</strong></td><td>CPU/memory/resource limits.</td><td>Missing limits → one Pod starves the node.</td></tr>
          <tr><td><strong>Capabilities</strong></td><td>Fine-grained root powers (e.g. CAP_NET_ADMIN, CAP_SYS_ADMIN).</td><td>Adding dangerous caps, or running <code>privileged</code> which grants them all.</td></tr>
          <tr><td><strong>seccomp / LSMs</strong></td><td>Which syscalls / actions the container may make.</td><td>Running <code>Unconfined</code> — no syscall filtering at all.</td></tr>
        </tbody>
      </table>

      <h3>The dangerous fields, named</h3>
      <p>These Pod-spec settings are the ones an auditor scans for first, because each erodes isolation:</p>
      <ul>
        <li><strong><code>privileged: true</code></strong> — grants nearly all host capabilities; effectively root on the node. Almost never legitimate.</li>
        <li><strong><code>hostPID: true</code></strong> — the container sees and can signal host processes.</li>
        <li><strong><code>hostNetwork: true</code></strong> — the container uses the host's network stack directly.</li>
        <li><strong><code>hostPath</code> mounts</strong> — mount host directories (e.g. <code>/</code>, <code>/var/run/docker.sock</code>) into the container; a direct escape vector.</li>
        <li><strong><code>allowPrivilegeEscalation: true</code></strong> — a process can gain more privileges than its parent (e.g. via setuid).</li>
        <li><strong><code>CAP_SYS_ADMIN</code></strong> — the "new root"; enables mounting, namespace manipulation, and many escape techniques.</li>
      </ul>

      <h3>A hardened securityContext</h3>
      <p>The <strong>securityContext</strong> is where you dial isolation back up. This is close to the Restricted PSS profile from Lesson 5:</p>
      <pre><code>apiVersion: v1
kind: Pod
metadata:
  name: hardened
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 10001
    seccompProfile:
      type: RuntimeDefault          # filter dangerous syscalls
  containers:
    - name: app
      image: myregistry.io/web:1.4.2
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        privileged: false
        capabilities:
          drop: ["ALL"]             # drop every capability
          # add: ["NET_BIND_SERVICE"]  # add back only if truly needed</code></pre>

      <h3>seccomp and AppArmor</h3>
      <p><strong>seccomp</strong> filters the system calls a process may make; the <code>RuntimeDefault</code> profile blocks a large set of dangerous, rarely-needed syscalls with near-zero effort. <strong>AppArmor</strong> (and SELinux) are Linux Security Modules that confine what files and operations a process may touch. Historically containers ran <code>seccomp: Unconfined</code> — no filtering — so simply switching to RuntimeDefault is a large, cheap win.</p>

      <h3>Stronger isolation when you need it</h3>
      <p>For genuinely untrusted workloads, you can trade some performance for a real kernel boundary: <strong>gVisor</strong> (a user-space kernel that intercepts syscalls) or <strong>Kata Containers</strong> (lightweight VMs per Pod). These restore a VM-like wall the shared kernel can't offer.</p>

      <h3>Detecting runtime abuse</h3>
      <p>Prevention isn't perfect, so you also watch. <strong>Falco</strong> (a CNCF runtime security tool) taps kernel syscalls and alerts on suspicious behaviour — a shell spawned in a container, an unexpected write to <code>/etc</code>, a process reading the ServiceAccount token, an outbound connection to the metadata IP. Runtime detection is your backstop for the escape that prevention missed.</p>

      <blockquote>The runtime mantra: <strong>drop everything, add back nothing you can't justify.</strong> Non-root, no privilege escalation, all capabilities dropped, RuntimeDefault seccomp, read-only root filesystem — that baseline defeats the overwhelming majority of container escapes before Falco ever has to fire.</blockquote>
    `,
    quizzes: [
      { id: "k8s-l9-q1", question: "Which Linux feature gives a container its isolated process/network/filesystem view?", options: ["Namespaces", "DNS", "Ingress", "ConfigMaps"], correctAnswerIndex: 0, explanation: "Kernel namespaces (pid, net, mnt, ipc, uts, user) provide the container's isolated views." },
      { id: "k8s-l9-q2", question: "What does `privileged: true` grant a container?", options: ["A faster network", "Nearly all host capabilities — effectively root on the node", "More disk space", "A dedicated kernel"], correctAnswerIndex: 1, explanation: "A privileged container gets almost all host capabilities, erasing the container/host boundary." },
      { id: "k8s-l9-q3", question: "Why is a hostPath mount of / or the docker socket dangerous?", options: ["It uses more memory", "It gives the container direct access to the host filesystem/runtime — a direct escape vector", "It disables DNS", "It is required for logging"], correctAnswerIndex: 1, explanation: "Mounting sensitive host paths lets an attacker read/alter the host or control the runtime, escaping the container." },
      { id: "k8s-l9-q4", question: "What does `capabilities: drop: ['ALL']` do?", options: ["Deletes the Pod", "Removes all Linux capabilities, minimising the container's root powers", "Adds admin rights", "Disables the network"], correctAnswerIndex: 1, explanation: "Dropping ALL capabilities strips the container's kernel privileges; you add back only what's strictly required." },
      { id: "k8s-l9-q5", question: "What does the seccomp RuntimeDefault profile do?", options: ["Runs the container as root", "Filters a large set of dangerous, rarely-needed syscalls with minimal effort", "Encrypts etcd", "Opens all ports"], correctAnswerIndex: 1, explanation: "RuntimeDefault applies a sensible syscall filter, blocking many dangerous calls containers rarely need." },
      { id: "k8s-l9-q6", question: "Why is CAP_SYS_ADMIN called 'the new root'?", options: ["It renames root", "It enables mounting, namespace manipulation, and many escape techniques", "It disables root", "It is harmless"], correctAnswerIndex: 1, explanation: "CAP_SYS_ADMIN grants such broad powers (mounts, namespaces) that it approximates full root and enables escapes." },
      { id: "k8s-l9-q7", question: "What do gVisor and Kata Containers provide?", options: ["Faster image pulls", "Stronger isolation — a user-space kernel or lightweight VM per Pod for untrusted workloads", "Better logging", "Automatic RBAC"], correctAnswerIndex: 1, explanation: "They add a real kernel boundary (sandboxed kernel or micro-VM) that the shared host kernel cannot provide alone." },
      { id: "k8s-l9-q8", question: "What is Falco used for?", options: ["Building images", "Runtime detection — alerting on suspicious syscall behaviour like a shell spawned in a container", "Signing artifacts", "Managing Secrets"], correctAnswerIndex: 1, explanation: "Falco monitors kernel syscalls and alerts on anomalous runtime behaviour, acting as a detection backstop." },
    ],
  },

  // ── LESSON 10 ──────────────────────────────────────────────────────────────
  {
    title: "10 // Attack Paths, Misconfigurations & CIS Hardening",
    summary: "Chaining everything together — real attack paths from privileged pod to node to cluster, mapped to MITRE ATT&CK, then hardened with CIS Benchmarks and kube-bench.",
    content: `
      <h2>Where all nine lessons meet</h2>
      <p>Individual controls are easier to grasp than the attacks they stop. This capstone chains the pieces: how a small misconfiguration becomes cluster compromise, mapped to <strong>MITRE ATT&CK for Containers</strong>, and how systematic hardening (CIS Benchmarks) closes the paths.</p>

      <h3>The classic attack path, step by step</h3>
      <ol>
        <li><strong>Initial access</strong> — a vulnerable app (SSRF, RCE) or an exposed Kubernetes Dashboard gives code execution in one Pod. <em>(ATT&CK: T1190 Exploit Public-Facing Application.)</em></li>
        <li><strong>Discovery</strong> — the attacker reads the auto-mounted ServiceAccount token and queries the API server to map permissions. <em>(T1613 Container and Resource Discovery.)</em></li>
        <li><strong>Privilege escalation / escape</strong> — the Pod is <code>privileged</code> or has a <code>hostPath</code> mount, so they break out to the node. <em>(T1611 Escape to Host.)</em></li>
        <li><strong>Credential theft</strong> — on the node they read other Pods' Secrets, the kubelet's credentials, and the cloud metadata IAM token. <em>(T1552 Unsecured Credentials.)</em></li>
        <li><strong>Lateral movement / new workloads</strong> — with a powerful token they schedule malicious Pods on other nodes. <em>(T1610 Deploy Container.)</em></li>
        <li><strong>Impact</strong> — cluster-wide control: data theft, cryptomining, or ransomware. <em>(various Impact techniques.)</em></li>
      </ol>
      <p>Notice how each step exploits exactly one lesson's gap: auto-mounted token (L4), privileged pod (L5/L9), unencrypted Secret (L6), flat network (L7), permissive RBAC (L4). Fix any single link and the chain breaks.</p>

      <h3>The greatest-hits misconfigurations</h3>
      <table>
        <thead><tr><th>Misconfiguration</th><th>Why it's catastrophic</th></tr></thead>
        <tbody>
          <tr><td>Exposed Kubernetes Dashboard with admin rights</td><td>The 2018 Tesla breach — cryptomining via an open, unauthenticated dashboard.</td></tr>
          <tr><td>Privileged pods / hostPath to <code>/</code> or docker.sock</td><td>Direct escape to the node (Lesson 9).</td></tr>
          <tr><td>Anonymous / unauthenticated API server or kubelet</td><td>No authentication means no authorization to enforce.</td></tr>
          <tr><td>cluster-admin bound to default ServiceAccounts</td><td>Any compromised Pod becomes cluster-admin.</td></tr>
          <tr><td>etcd exposed or unencrypted</td><td>Every Secret readable in one shot.</td></tr>
          <tr><td>No NetworkPolicy</td><td>Unrestricted lateral movement (Lesson 7).</td></tr>
        </tbody>
      </table>

      <h3>Systematic hardening: the CIS Kubernetes Benchmark</h3>
      <p>You don't invent hardening from scratch. The <strong>CIS Kubernetes Benchmark</strong> is a community-agreed, audited checklist covering the API server flags, kubelet config, etcd, RBAC, and Pod policy — hundreds of concrete checks with the exact settings. Being "CIS-aligned" gives you a defensible, recognised baseline.</p>

      <h3>Automate the audit: kube-bench and friends</h3>
      <p>You verify the benchmark with tools, not by hand:</p>
      <ul>
        <li><strong>kube-bench</strong> — runs the CIS Benchmark checks against a live cluster and reports pass/fail per control.</li>
        <li><strong>kube-hunter</strong> — actively probes a cluster for exploitable weaknesses (authorised testing only).</li>
        <li><strong>Trivy / kubescape</strong> — scan manifests and clusters against misconfiguration and compliance frameworks (including NSA/CISA guidance).</li>
      </ul>
      <pre><code># Audit a node against the CIS Benchmark.
kube-bench run --targets master,node
# -> [PASS] 1.2.1 Ensure --anonymous-auth is false
#    [FAIL] 1.2.6 Ensure --authorization-mode does not include AlwaysAllow
#    ...remediation guidance printed per finding</code></pre>

      <h3>The defender's synthesis</h3>
      <p>Put the whole course in one posture: least-privilege <strong>RBAC</strong> with no auto-mounted tokens (L4); <strong>admission control</strong> enforcing Restricted Pod Security so privileged pods can't schedule (L5, L9); <strong>encrypted Secrets</strong> with tight access (L6); <strong>default-deny NetworkPolicy</strong> everywhere (L7); a <strong>verified supply chain</strong> of signed, scanned images (L8); <strong>runtime detection</strong> with Falco (L9); all measured against the <strong>CIS Benchmark</strong> via kube-bench (L10).</p>

      <blockquote>Final takeaway: attackers win by <em>chaining</em> small misconfigurations into a path from one Pod to the whole cluster. Defenders win the same way in reverse — layer independent controls so that breaking any single link is enough to stop the chain. That is defence in depth, expressed in Kubernetes.</blockquote>
    `,
    quizzes: [
      { id: "k8s-l10-q1", question: "In the classic attack path, what does the attacker read first after landing in a Pod?", options: ["The kernel source", "The auto-mounted ServiceAccount token, to query the API server", "The Dockerfile", "The node's BIOS"], correctAnswerIndex: 1, explanation: "The auto-mounted token is the immediate prize; it lets the attacker query permissions against the API server." },
      { id: "k8s-l10-q2", question: "Which MITRE ATT&CK technique describes breaking out of a container to the node?", options: ["T1190 Exploit Public-Facing Application", "T1611 Escape to Host", "T1552 Unsecured Credentials", "T1610 Deploy Container"], correctAnswerIndex: 1, explanation: "T1611 Escape to Host covers container breakout to the underlying node, e.g. via a privileged pod or hostPath." },
      { id: "k8s-l10-q3", question: "Scheduling malicious Pods on other nodes with a stolen token maps to which technique?", options: ["T1610 Deploy Container", "T1078 Valid Accounts", "T1046 Network Service Discovery", "T1490 Inhibit System Recovery"], correctAnswerIndex: 0, explanation: "T1610 Deploy Container describes an adversary deploying containers to execute code or move laterally." },
      { id: "k8s-l10-q4", question: "What made the 2018 Tesla breach possible?", options: ["A kernel zero-day", "An exposed, unauthenticated Kubernetes Dashboard used for cryptomining", "A signed image", "A default-deny NetworkPolicy"], correctAnswerIndex: 1, explanation: "An open, admin-capable Kubernetes Dashboard let attackers run cryptomining workloads in the cluster." },
      { id: "k8s-l10-q5", question: "What is the CIS Kubernetes Benchmark?", options: ["A performance test", "A community-agreed, audited checklist of concrete hardening settings for a cluster", "A container runtime", "A signing tool"], correctAnswerIndex: 1, explanation: "The CIS Benchmark is a recognised, audited set of hardening checks across API server, kubelet, etcd, RBAC, and more." },
      { id: "k8s-l10-q6", question: "What does kube-bench do?", options: ["Signs images", "Runs CIS Benchmark checks against a live cluster and reports pass/fail per control", "Deploys Pods", "Encrypts Secrets"], correctAnswerIndex: 1, explanation: "kube-bench automates CIS Benchmark auditing, reporting which controls pass or fail with remediation guidance." },
      { id: "k8s-l10-q7", question: "Why does fixing any single link often break the whole attack chain?", options: ["It doesn't; you must fix all at once", "Each step depends on a specific gap, so closing one (e.g. no auto-mounted token or no privileged pods) stops progression", "Attackers only use one technique", "Chains are theoretical"], correctAnswerIndex: 1, explanation: "The path is a dependency chain; removing any required condition (token, escape, network) halts the attacker's progress." },
      { id: "k8s-l10-q8", question: "What is the defender's synthesis described in the lesson?", options: ["Rely on a single strong control", "Layer independent controls (RBAC, admission, encrypted Secrets, NetworkPolicy, supply chain, runtime detection, CIS auditing) for defence in depth", "Only run kube-bench", "Disable all Pods"], correctAnswerIndex: 1, explanation: "Defence in depth stacks independent Kubernetes controls so breaking any one link stops the chain." },
    ],
  },
];
