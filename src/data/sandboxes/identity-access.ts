// ─── Identity & Access Management (IAM) Sandbox ───────────────────
// Authorized-education, conceptual lab. No real authentication service runs
// here — the JWT and its "secret" are fabricated demo values, and forging a
// token is simulated by the terminal engine (see App.tsx executeCmd). The
// mission teaches the IAM auth-review loop: inspect an issued JWT and the
// service's auth configuration → identify the fatal flaw (the verifier accepts
// `alg: none`, so signatures are not checked) → exploit it by forging an
// unsigned admin token to prove the impact.
//
// Shape mirrors a course `simulation` block so the same engine drives it:
//   ls / cat / grep  → read `files`
//   objective        → `objective`
//   hint N           → `hints[N-1]`
//   <final command>  → `commands[...]`, with {{FLAG}} swapped for the live flag.

export const SANDBOX = {
  objective:
    "You are the IAM engineer auditing the 'account-api' authentication layer before it " +
    "ships. A user's session token (token.txt) and the verifier's configuration " +
    "(auth_config.txt) are on disk. Decode the token, compare it against the config, and " +
    "identify the fatal flaw. The verifier trusts the token's own `alg` header and has " +
    "`allow_none: true`, so it will accept an UNSIGNED token whose header says " +
    "`alg: none` — meaning anyone can mint a valid admin token with no secret at all. " +
    "Prove the impact by forging an unsigned token that elevates the user to admin. " +
    "Forging the correct `alg:none` admin token reveals the CTF flag; a properly-signed " +
    "token or a wrong role does not.",

  hints: [
    // 1 — explore
    "Start by exploring. Run 'ls', then read the issued token with 'cat token.txt', the " +
      "verifier settings with 'cat auth_config.txt', and the audit notes with 'cat notes.txt'. " +
      "Everything you need is already on disk.",
    // 2 — narrow the evidence
    "A JWT is three base64url parts split by dots: header.payload.signature. Look at the " +
      "header of the token in token.txt and at the verifier settings — one of them decides " +
      "which algorithm to TRUST. Try 'grep alg auth_config.txt' to see how the service picks " +
      "its verification algorithm.",
    // 3 — commit to the flaw
    "The flaw is `alg:none` acceptance: auth_config.txt has 'allow_none: true' and derives " +
      "the algorithm FROM the token header instead of pinning it server-side. So a token with " +
      "header {\"alg\":\"none\",\"typ\":\"JWT\"} and an EMPTY signature (nothing after the last " +
      "dot) is accepted unverified. Forge a payload with \"role\":\"admin\" — the weak HS256 " +
      "secret in notes.txt is a red herring; you don't even need it.",
    // 4 — exact command FORM (never the literal answer)
    "Forge the unsigned admin token to prove the impact. The command form is:  " +
      "forge-token <role> <alg>  — substitute the elevated role and the algorithm the verifier " +
      "must never accept for an unsigned token.",
  ],

  files: {
    "token.txt":
      "# Issued session token for user 'jdoe' (captured from Authorization: Bearer …)\n" +
      "# JWT format = base64url(header).base64url(payload).signature\n" +
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9." +
      "eyJzdWIiOiJqZG9lIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NTE3MDAwMDB9." +
      "3n0tR3alS1gnatur3ForDem0Purpose5Only\n" +
      "\n" +
      "# Decoded header : {\"alg\":\"HS256\",\"typ\":\"JWT\"}\n" +
      "# Decoded payload: {\"sub\":\"jdoe\",\"role\":\"user\",\"iat\":1751700000}\n" +
      "# Note: this issued token is HS256-signed and only grants role=user.\n",

    "auth_config.txt":
      "# account-api — JWT verifier configuration (auth service)\n" +
      "jwt:\n" +
      "  issuer: account-api\n" +
      "  # BAD: the verification algorithm is taken from the INCOMING token header\n" +
      "  #      instead of being pinned to a fixed server-side value.\n" +
      "  algorithm_source: token_header\n" +
      "  # BAD: unsigned tokens (alg:none) are accepted — signatures are optional.\n" +
      "  allow_none: true\n" +
      "  # BAD: no expiry is enforced — tokens without an 'exp' claim never time out.\n" +
      "  require_exp: false\n" +
      "  hs256_secret_ref: notes.txt   # weak shared secret (see notes)\n",

    "notes.txt":
      "IAM auth review — service: account-api\n" +
      "Findings queue:\n" +
      " 1. alg:none ACCEPTED — auth_config.txt sets allow_none:true and derives the algorithm\n" +
      "    from the token header (algorithm_source: token_header). A token whose header is\n" +
      "    {\"alg\":\"none\"} with an EMPTY signature is trusted WITHOUT any verification. This is\n" +
      "    the critical, directly-exploitable flaw: anyone can mint an admin token, no secret.\n" +
      " 2. Weak HS256 secret: the shared secret is 'secret123' (short, dictionary-based). This\n" +
      "    is also a real problem — BUT it is a red herring for this exercise: with alg:none you\n" +
      "    do not need any secret to forge a valid token.\n" +
      " 3. No expiry (require_exp:false) — issued tokens never expire. Real, but secondary.\n" +
      "\n" +
      "Exploitation policy (authorized test): demonstrate impact by forging an UNSIGNED\n" +
      "(alg:none) token that elevates role=user to role=admin. A properly HS256-signed token or\n" +
      "a non-admin role does NOT demonstrate the alg:none bypass.\n" +
      "\n" +
      "Fix (post-exercise): pin algorithm server-side to HS256/RS256, set allow_none:false,\n" +
      "rotate to a long random secret, and enforce require_exp:true.\n",
  },

  commands: {
    // Decoy — a properly-signed token: this is the SAFE path, not the bypass. Warns, no flag.
    "forge-token admin HS256":
      "WARNING: an HS256 token must be signed with the shared secret, so this path exercises " +
      "the SIGNED verification code — not the vulnerability.\n" +
      "The finding under test is the alg:none bypass (allow_none:true), where the verifier " +
      "accepts an UNSIGNED token. Signing a token does not demonstrate that flaw.\n" +
      "No flag. Re-read auth_config.txt and notes.txt — forge the token with the algorithm the " +
      "verifier should NEVER accept unsigned.",

    // Decoy — right technique, wrong privilege: no elevation, so no proof of impact. Warns, no flag.
    "forge-token user none":
      "WARNING: you forged an unsigned (alg:none) token, but role=user is exactly what the " +
      "victim already had — this proves no privilege gain.\n" +
      "The exercise requires demonstrating IMPACT: elevate to the administrative role via the " +
      "unsigned-token bypass.\n" +
      "No flag. Re-run the forge with the elevated role from notes.txt.",

    // Correct — unsigned alg:none token elevated to admin: exploits the allow_none flaw.
    "forge-token admin none":
      "[*] Building token  header={\"alg\":\"none\",\"typ\":\"JWT\"}  payload={\"sub\":\"jdoe\"," +
      "\"role\":\"admin\"}\n" +
      "[*] Emitting  base64url(header).base64url(payload).   ← note the EMPTY signature after " +
      "the final dot\n" +
      "[*] Presenting forged token to account-api verifier…\n" +
      "[+] auth_config.allow_none=true & algorithm_source=token_header → signature check SKIPPED.\n" +
      "[+] Token ACCEPTED UNVERIFIED. Session elevated: role=user → role=admin.\n" +
      "FLAG: {{FLAG}}\n" +
      "[+] alg:none bypass confirmed. Fix: pin the algorithm server-side and set " +
      "allow_none:false. Submit the flag above to complete the mission.",
  },
} as const;
