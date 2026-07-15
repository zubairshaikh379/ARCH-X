// ─── API Security Sandbox ─────────────────────────────────────────
// Authorized-education, conceptual lab. Nothing here touches a real API —
// the endpoints, tokens and request/response logs are fabricated demo values
// and the "confirm" verb is simulated by the terminal engine (see App.tsx
// executeCmd). The mission teaches the API-access-control audit loop:
// review captured request/response logs → distinguish a genuine broken
// object-level authorization (BOLA / IDOR) flaw — where user A reads user B's
// object — from endpoints that correctly enforce ownership → confirm the one
// vulnerable endpoint.
//
// Shape mirrors a course `simulation` block so the same engine drives it:
//   ls / cat / grep  → read `files`
//   objective        → `objective`
//   hint N           → `hints[N-1]`
//   <final command>  → `commands[...]`, with {{FLAG}} swapped for the live flag.

export const SANDBOX = {
  objective:
    "You are the application security engineer reviewing captured traffic for the 'acme-pay' " +
    "REST API before launch. A pentester ran the same low-privilege user's token (user id 1001) " +
    "against several endpoints and recorded the request/response pairs. Read the evidence on " +
    "disk and find the real access-control flaw: an endpoint that returns another user's object " +
    "even though the caller does not own it — a Broken Object Level Authorization (BOLA / IDOR) " +
    "issue — versus endpoints that correctly reject the cross-account request with 403. Confirm " +
    "the single vulnerable endpoint. Flagging the CORRECT broken endpoint reveals the CTF flag; " +
    "flagging one that already enforces ownership does not.",

  hints: [
    // 1 — explore
    "Start by exploring. Run 'ls', then read the captured traffic with 'cat api_requests.txt', " +
      "the route list with 'cat endpoints.txt', and the reviewer notes with 'cat notes.txt'. " +
      "Everything you need is already on disk.",
    // 2 — narrow the evidence
    "In api_requests.txt every request is sent with the SAME token — user 1001's. Look at the " +
      "resource id in the path versus the owner in the response body. When user 1001 requests an " +
      "object owned by a DIFFERENT user, a safe endpoint answers 403 Forbidden. A vulnerable one " +
      "answers 200 OK and hands back the other user's data. Try 'grep 200 api_requests.txt' to " +
      "surface the successful cross-account reads.",
    // 3 — commit to the finding
    "The endpoint that returned 200 OK with '\"owner\": 1002' to caller 1001 is the real BOLA " +
      "flaw — it never checks that the requester owns the object, so any id can be enumerated. " +
      "The other routes returned 403 for the same cross-account attempt, so they enforce " +
      "ownership and are fine. Identify that one path from endpoints.txt.",
    // 4 — exact command FORM (never the literal answer)
    "Confirm the broken route so it can be patched. The command form is:  " +
      "confirm-vuln <method> <path>  — for example 'confirm-vuln GET /some/route/{id}'. " +
      "Substitute the exact method and path of the endpoint that leaked another user's object " +
      "in api_requests.txt.",
  ],

  files: {
    "api_requests.txt":
      "# Captured request/response pairs — all sent with Bearer token for user_id=1001\n" +
      "# api.acme-pay.internal   (staging capture, pentest run 2026-07-05)\n" +
      "# --------------------------------------------------------------------\n" +
      "\n" +
      "[REQ 1] GET /api/v1/users/1001/profile      Authorization: Bearer <user 1001>\n" +
      "  <- 200 OK   { \"user_id\": 1001, \"owner\": 1001, \"email\": \"a@acme.test\" }   (own object — expected)\n" +
      "\n" +
      "[REQ 2] GET /api/v1/users/1002/profile      Authorization: Bearer <user 1001>\n" +
      "  <- 403 Forbidden   { \"error\": \"not_owner\" }   (cross-account read blocked — GOOD)\n" +
      "\n" +
      "[REQ 3] GET /api/v1/invoices/9001            Authorization: Bearer <user 1001>\n" +
      "  <- 200 OK   { \"invoice_id\": 9001, \"owner\": 1002, \"amount\": 4200, \"card_last4\": \"3318\" }\n" +
      "  (!!! caller is 1001 but object owner is 1002 — leaked another user's invoice)\n" +
      "\n" +
      "[REQ 4] GET /api/v1/invoices/9002            Authorization: Bearer <user 1001>\n" +
      "  <- 200 OK   { \"invoice_id\": 9002, \"owner\": 1003, \"amount\": 88, \"card_last4\": \"0090\" }\n" +
      "  (!!! same route, another id enumerated — object owner 1003, still returned to 1001)\n" +
      "\n" +
      "[REQ 5] DELETE /api/v1/invoices/9001         Authorization: Bearer <user 1001>\n" +
      "  <- 403 Forbidden   { \"error\": \"not_owner\" }   (write path DOES check ownership — GOOD)\n" +
      "\n" +
      "[REQ 6] GET /api/v1/orders/7001              Authorization: Bearer <user 1001>\n" +
      "  <- 403 Forbidden   { \"error\": \"not_owner\" }   (order owned by 1002, blocked — GOOD)\n",

    "endpoints.txt":
      "# acme-pay API route inventory — auth model per route\n" +
      "# ---------------------------------------------------\n" +
      "GET    /api/v1/users/{id}/profile   auth: owner-check ENFORCED (returns 403 for non-owner)\n" +
      "GET    /api/v1/invoices/{id}        auth: owner-check MISSING  (returns object by id, no ownership filter)\n" +
      "DELETE /api/v1/invoices/{id}        auth: owner-check ENFORCED (returns 403 for non-owner)\n" +
      "GET    /api/v1/orders/{id}          auth: owner-check ENFORCED (returns 403 for non-owner)\n" +
      "\n" +
      "Note: the GET invoices read path resolves the object purely from the URL id and skips the\n" +
      "ownership predicate that every other route applies. Classic BOLA / IDOR.\n",

    "notes.txt":
      "API security review — service: acme-pay (pre-launch)\n" +
      "Test method: replay every request with one low-privilege token (user 1001) and try to\n" +
      "reach objects owned by other users by changing the id in the path.\n" +
      "\n" +
      "Findings:\n" +
      " 1. GET /api/v1/invoices/{id} returned 200 OK with objects owned by 1002 and 1003 to\n" +
      "    caller 1001 (see REQ 3 and REQ 4). It never verifies the caller owns the invoice, so\n" +
      "    any invoice id can be enumerated. This is the Broken Object Level Authorization flaw.\n" +
      " 2. GET /users/{id}/profile, DELETE /invoices/{id} and GET /orders/{id} all answered 403\n" +
      "    Forbidden for the same cross-account attempt — they enforce ownership. CLEAN.\n" +
      "\n" +
      "Confirmation policy: confirm the ONE read endpoint that leaks another user's object. Do\n" +
      "NOT flag a route that already returns 403 for non-owners — those enforce authorization and\n" +
      "confirming them fixes nothing. A 403 is the control working, not the vulnerability.\n",
  },

  commands: {
    // Decoy — an endpoint that already enforces ownership (403 for non-owner): warns, no flag.
    "confirm-vuln GET /api/v1/users/{id}/profile":
      "WARNING: GET /api/v1/users/{id}/profile already ENFORCES ownership — it returned 403 " +
      "Forbidden when caller 1001 requested user 1002's object (see REQ 2 in api_requests.txt).\n" +
      "That 403 is the access control working, not a flaw. No flag.\n" +
      "Re-read api_requests.txt for the endpoint that returned 200 OK with another user's object.",

    // Decoy — the write path on invoices is protected (403): warns, no flag.
    "confirm-vuln DELETE /api/v1/invoices/{id}":
      "WARNING: DELETE /api/v1/invoices/{id} returned 403 Forbidden for the cross-account " +
      "request (see REQ 5) — the write path checks ownership.\n" +
      "The BROKEN control is on the GET read path, not the delete. No flag. Re-check the logs.",

    // Correct — the read endpoint with no owner-check that leaked invoices 9001/9002.
    "confirm-vuln GET /api/v1/invoices/{id}":
      "[*] Replaying GET /api/v1/invoices/{id} with the user 1001 token…\n" +
      "[+] id=9001 -> 200 OK, object owner=1002 (not the caller).\n" +
      "[+] id=9002 -> 200 OK, object owner=1003 (not the caller).\n" +
      "[+] Confirmed: endpoint resolves the object by URL id with NO ownership check.\n" +
      "[+] Broken Object Level Authorization (BOLA / IDOR) verified — any invoice id is readable.\n" +
      "FLAG: {{FLAG}}\n" +
      "[+] Vulnerable endpoint confirmed at the source. Submit the flag above to complete the mission.",
  },
} as const;
