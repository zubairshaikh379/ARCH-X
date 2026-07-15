// ─── Kubernetes Security Sandbox ──────────────────────────────────
// Authorized-education, conceptual lab. Nothing here touches a real cluster —
// the manifests, ServiceAccounts and RBAC bindings are fabricated demo values
// and the "remediate" verbs are simulated by the terminal engine (see
// App.tsx executeCmd). The mission teaches the Kubernetes-config audit loop:
// review the Pod spec and the RBAC binding → distinguish a genuinely
// dangerous privileged/host-mounted Pod and an over-broad cluster-admin
// binding from the safely-scoped ones → remediate the correct finding.
//
// Shape mirrors a course `simulation` block so the same engine drives it:
//   ls / cat / grep  → read `files`
//   objective        → `objective`
//   hint N           → `hints[N-1]`
//   <final command>  → `commands[...]`, with {{FLAG}} swapped for the live flag.

export const SANDBOX = {
  objective:
    "You are the platform security engineer hardening the 'payments' namespace before it goes " +
    "to production. Three artifacts are queued for review: a Pod manifest, an RBAC RoleBinding " +
    "export, and the auditor's notes. Read the evidence on disk and find the real risk — a Pod " +
    "running with a privileged securityContext (privileged: true + hostPath mount of the node " +
    "root filesystem, a container-escape path to the host) versus Pods that are correctly " +
    "sandboxed, and an RBAC subject bound to cluster-admin across all namespaces versus one " +
    "scoped with least privilege. Remediate the genuinely dangerous workload by dropping its " +
    "privileged access. Hardening the CORRECT privileged Pod reveals the CTF flag; touching an " +
    "already-sandboxed, in-use Pod does not.",

  hints: [
    // 1 — explore
    "Start by exploring. Run 'ls', then read the Pod manifest with 'cat pod.yaml', the RBAC " +
      "export with 'cat rolebinding.yaml', and the auditor notes with 'cat notes.txt'. " +
      "Everything you need is already on disk.",
    // 2 — narrow the evidence
    "Compare the Pods in pod.yaml. A safe Pod has 'privileged: false' (or no securityContext " +
      "escalation) and no hostPath volume. A DANGEROUS Pod sets 'privileged: true' and mounts " +
      "hostPath '/' — that gives the container full access to the node's root filesystem and " +
      "an escape to the host. Try 'grep privileged pod.yaml' to surface the offending Pod.",
    // 3 — commit to the finding
    "The Pod with 'privileged: true' plus the hostPath '/' mount is the real risk — a compromise " +
      "of that container is a compromise of the whole node. The other Pods drop capabilities and " +
      "run non-root, so they are fine. In rolebinding.yaml note that the app ServiceAccount is " +
      "bound only to a namespaced Role (least privilege), so the RBAC finding is clean — the " +
      "privileged Pod is your target.",
    // 4 — exact command FORM (never the literal answer)
    "Remediate by removing the privileged escalation so the workload runs sandboxed again. The " +
      "command form is:  harden-pod <pod-name>  — substitute the exact name of the Pod that sets " +
      "'privileged: true' in pod.yaml.",
  ],

  files: {
    "pod.yaml":
      "# kubectl get pods -n payments -o yaml  (trimmed export)\n" +
      "# ---------------------------------------------------------------\n" +
      "---\n" +
      "apiVersion: v1\n" +
      "kind: Pod\n" +
      "metadata:\n" +
      "  name: payments-api\n" +
      "  namespace: payments\n" +
      "spec:\n" +
      "  containers:\n" +
      "    - name: api\n" +
      "      image: registry.internal/payments-api:1.4.2\n" +
      "      securityContext:\n" +
      "        privileged: false\n" +
      "        runAsNonRoot: true\n" +
      "        allowPrivilegeEscalation: false\n" +
      "        capabilities:\n" +
      "          drop: [\"ALL\"]\n" +
      "  # SAFE: non-root, no privilege escalation, no host mounts.\n" +
      "---\n" +
      "apiVersion: v1\n" +
      "kind: Pod\n" +
      "metadata:\n" +
      "  name: node-debugger\n" +
      "  namespace: payments\n" +
      "spec:\n" +
      "  containers:\n" +
      "    - name: debug\n" +
      "      image: registry.internal/nettools:latest\n" +
      "      securityContext:\n" +
      "        privileged: true          # !!! full access to node devices/kernel\n" +
      "        allowPrivilegeEscalation: true\n" +
      "      volumeMounts:\n" +
      "        - name: host-root\n" +
      "          mountPath: /host\n" +
      "  volumes:\n" +
      "    - name: host-root\n" +
      "      hostPath:\n" +
      "        path: /                    # !!! mounts the NODE root filesystem\n" +
      "  # DANGEROUS: privileged + hostPath '/' = container escape to the host node.\n" +
      "---\n" +
      "apiVersion: v1\n" +
      "kind: Pod\n" +
      "metadata:\n" +
      "  name: ledger-worker\n" +
      "  namespace: payments\n" +
      "spec:\n" +
      "  containers:\n" +
      "    - name: worker\n" +
      "      image: registry.internal/ledger-worker:2.0.1\n" +
      "      securityContext:\n" +
      "        privileged: false\n" +
      "        runAsNonRoot: true\n" +
      "        allowPrivilegeEscalation: false\n" +
      "        capabilities:\n" +
      "          drop: [\"ALL\"]\n" +
      "  # SAFE: non-root, no privilege escalation, no host mounts.\n",

    "rolebinding.yaml":
      "# kubectl get rolebinding,clusterrolebinding -n payments -o yaml (trimmed)\n" +
      "# ---------------------------------------------------------------\n" +
      "---\n" +
      "apiVersion: rbac.authorization.k8s.io/v1\n" +
      "kind: RoleBinding\n" +
      "metadata:\n" +
      "  name: payments-api-read\n" +
      "  namespace: payments\n" +
      "roleRef:\n" +
      "  kind: Role                       # namespaced, not cluster-wide\n" +
      "  name: configmap-reader           # get/list configmaps only\n" +
      "  apiGroup: rbac.authorization.k8s.io\n" +
      "subjects:\n" +
      "  - kind: ServiceAccount\n" +
      "    name: payments-api\n" +
      "    namespace: payments\n" +
      "# CLEAN: app ServiceAccount scoped to a namespaced read-only Role (least privilege).\n",

    "notes.txt":
      "Kubernetes security review — namespace: payments\n" +
      "Review queue:\n" +
      " 1. Pod manifest (pod.yaml): one Pod, node-debugger, sets securityContext.privileged: true\n" +
      "    AND mounts hostPath '/' (the node root filesystem). That is a container-escape path —\n" +
      "    a compromise of that container compromises the whole worker node. The other two Pods\n" +
      "    (payments-api, ledger-worker) run non-root, drop ALL capabilities and have no host\n" +
      "    mounts — correctly sandboxed.\n" +
      " 2. RBAC (rolebinding.yaml): payments-api ServiceAccount is bound to a namespaced Role\n" +
      "    (configmap-reader, get/list only) — least privilege, no cluster-admin, no wildcard\n" +
      "    verbs or resources. CLEAN.\n" +
      "\n" +
      "Remediation policy: a privileged Pod with a hostPath root mount is a live host-takeover\n" +
      "risk. Drop privileged + the host mount so it runs sandboxed again — do NOT 'harden' the\n" +
      "Pods that are already non-root and sandboxed, that remediates nothing.\n" +
      "\n" +
      "Do NOT touch payments-api or ledger-worker — they are already least-privilege and in\n" +
      "active use; changing them fixes no exposure and risks breaking the service.\n",
  },

  commands: {
    // Decoy — an already-sandboxed, in-use Pod: warns, no flag.
    "harden-pod payments-api":
      "WARNING: payments-api already runs sandboxed — runAsNonRoot, allowPrivilegeEscalation: " +
      "false, capabilities dropped, no host mounts (see pod.yaml / notes.txt).\n" +
      "It was never privileged — 'hardening' it changes nothing and risks breaking a live " +
      "service.\n" +
      "No flag. Re-read pod.yaml to find the Pod that actually sets 'privileged: true'.",

    // Decoy — the clean RBAC subject, also already least-privilege: warns, no flag.
    "harden-pod ledger-worker":
      "WARNING: ledger-worker already runs sandboxed — non-root, no privilege escalation, no " +
      "hostPath mount (see pod.yaml).\n" +
      "It was never privileged. No flag. The real risk is the Pod with 'privileged: true' and a " +
      "hostPath '/' mount — re-read pod.yaml.",

    // Correct — the privileged, host-mounted Pod in pod.yaml.
    "harden-pod node-debugger":
      "[*] Inspecting securityContext for node-debugger…\n" +
      "[+] Found privileged: true and hostPath volume mounting '/' (node root filesystem).\n" +
      "[+] Removed 'privileged: true' and 'allowPrivilegeEscalation: true'.\n" +
      "[+] Dropped the hostPath '/' volume — container can no longer reach the node filesystem.\n" +
      "[+] Applied runAsNonRoot: true and capabilities drop ALL — Pod now runs sandboxed.\n" +
      "[+] Container-escape path to the host node closed.\n" +
      "FLAG: {{FLAG}}\n" +
      "[+] Exposure remediated at the source. Submit the flag above to complete the mission.",
  },
} as const;
