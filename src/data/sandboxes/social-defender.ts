// Social Engineering Defender — phishing-defense sandbox
// Authorized-education, conceptual lab. Learners triage a suspicious inbound
// email: read the raw headers, evaluate SPF/DKIM/DMARC results, inspect the
// display-name vs. envelope sender and the real link destination, confirm it
// is a credential-harvesting phish, and take the correct containment action
// (quarantine + report the malicious sender domain) to unlock the flag.
// Purely defensive framing — no offensive content is produced here.
export const SANDBOX = {
  objective:
    "A user in Finance forwarded an urgent 'password expiry' email to the SOC for review. Analyze the message artifacts — the raw headers (SPF/DKIM/DMARC authentication results), the visible body, and the analyst's notes — to determine whether it is legitimate or a phishing attempt. Confirm the spoofing evidence and the true link destination, then take the correct defensive action against the MALICIOUS sender domain. Quarantining and reporting the CORRECT domain reveals the flag. Do not block the legitimate corporate domain.",
  hints: [
    "Start by exploring. Run 'ls' to see the collected artifacts, then read the triage context with 'cat notes.txt' to understand what the user received and why it was flagged.",
    "Real senders authenticate. Open the raw headers with 'cat email_headers.txt' and check the Authentication-Results line — pay attention to whether spf, dkim, and dmarc each PASS or FAIL, and whether the 'From:' display name matches the actual envelope sender domain.",
    "Phishing hides the real destination behind friendly link text. Read 'cat email_body.txt' and compare the words the user SEES ('portal.acme-corp.com') against the true href the browser would actually open. A DMARC failure plus a look-alike domain is your confirmation.",
    "Once you've confirmed the spoofed sender, contain it by quarantining and reporting that exact malicious domain. The command form is:  quarantine <domain>  — substitute the look-alike domain the headers and body attribute to the attacker (NOT the real acme-corp.com).",
  ],
  files: {
    "notes.txt":
      "SOC TRIAGE — TICKET #PHISH-2043\n" +
      "Reporter: j.okafor@acme-corp.com (Finance) used the 'Report Phish' button.\n" +
      "Subject line received: 'ACTION REQUIRED: Your password expires in 2 hours'.\n" +
      "\n" +
      "Legitimate corporate mail domain for this org: acme-corp.com\n" +
      "  - Real IT/password portal: portal.acme-corp.com (TLS, internal SSO)\n" +
      "  - acme-corp.com publishes SPF, DKIM and a DMARC policy of p=reject.\n" +
      "\n" +
      "The forwarded message urges the user to 'verify' credentials via a link and\n" +
      "creates time pressure — both classic social-engineering pretexts. Confirm the\n" +
      "authentication results and the REAL link host before acting. One domain in\n" +
      "these artifacts is the legitimate corporate domain; one is an attacker\n" +
      "look-alike. Quarantine only the look-alike.",
    "email_headers.txt":
      "Return-Path: <it-support@acme-corp.security-verify.com>\n" +
      "Received: from mail.security-verify.com (unknown [45.146.223.71])\n" +
      "        by mx01.acme-corp.com with ESMTP; Sun, 05 Jul 2026 07:41:02 +0000\n" +
      "Authentication-Results: mx01.acme-corp.com;\n" +
      "        spf=fail (sender IP 45.146.223.71 not permitted by acme-corp.com)\n" +
      "          smtp.mailfrom=it-support@acme-corp.security-verify.com;\n" +
      "        dkim=fail (no valid signature) header.d=acme-corp.security-verify.com;\n" +
      "        dmarc=fail (p=reject) header.from=acme-corp.com\n" +
      "From: \"ACME IT Support\" <it-support@acme-corp.com>\n" +
      "Reply-To: <credentials@acme-corp.security-verify.com>\n" +
      "To: <j.okafor@acme-corp.com>\n" +
      "Subject: ACTION REQUIRED: Your password expires in 2 hours\n" +
      "\n" +
      "ANALYSIS: The From: display domain (acme-corp.com) does NOT match the\n" +
      "envelope sender / Return-Path domain (acme-corp.security-verify.com).\n" +
      "SPF fail + DKIM fail + DMARC fail against header.from=acme-corp.com means\n" +
      "this message spoofs the corporate brand. The true sending domain is the\n" +
      "look-alike: acme-corp.security-verify.com",
    "email_body.txt":
      "Rendered body (as the user sees it):\n" +
      "-------------------------------------------------------------\n" +
      "  Dear user,\n" +
      "  Your ACME network password will EXPIRE in 2 hours. To avoid\n" +
      "  losing access, verify your account now:\n" +
      "\n" +
      "      [ Verify My Password ]   <- link text shows: portal.acme-corp.com\n" +
      "-------------------------------------------------------------\n" +
      "\n" +
      "Underlying HTML (true link destination):\n" +
      "  <a href=\"https://acme-corp.security-verify.com/sso/login?redir=capture\">\n" +
      "     portal.acme-corp.com</a>\n" +
      "\n" +
      "MISMATCH: the visible text says portal.acme-corp.com, but the real href\n" +
      "resolves to acme-corp.security-verify.com — a credential-harvesting page.\n" +
      "This is deceptive link masking, a hallmark of phishing. The malicious host\n" +
      "domain is: acme-corp.security-verify.com",
  },
  commands: {
    "quarantine acme-corp.com":
      "WARNING: acme-corp.com is the organization's OWN legitimate mail domain — it\n" +
      "publishes valid SPF/DKIM and a DMARC p=reject policy. Quarantining it would\n" +
      "block all internal mail and lock out staff. This is NOT the attacker. No flag\n" +
      "— re-read email_headers.txt and quarantine the spoofed look-alike domain that\n" +
      "actually failed authentication.",
    "quarantine acme-corp.security-verify.com":
      "SUCCESS: acme-corp.security-verify.com quarantined and reported to the mail\n" +
      "gateway + threat-intel feed.\n" +
      "Evidence: From-domain spoof of acme-corp.com, SPF/DKIM/DMARC all FAIL, and a\n" +
      "masked link resolving to a credential-capture page. All matching messages\n" +
      "pulled from user inboxes; the sending domain is now blocklisted.\n" +
      "Phish contained. Flag decrypted:\n" +
      "FLAG: {{FLAG}}\n" +
      "Submit it above to close ticket PHISH-2043.",
  },
} as const;
