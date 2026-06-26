---
name: ARCH-X security decisions
description: Auth quirks, security fixes, and anti-exploit patterns for ARCH-X
---

## Auth
- Passwords hashed with SHA-256 via Web Crypto API (`src/lib/auth.ts`) — no plaintext, no library
- No dev bypass (removed from previous codebase)
- OTP: generated client-side, shown transparently in yellow "DEMO MODE" box — no hidden state

## Session restore guard (critical)
- `Session.get()` reads a raw username from localStorage
- On mount, MUST verify `UserStore.find(saved)` before calling `handleAuthSuccess` — prevents localStorage impersonation
- If saved username not found in UserStore, clear the session: `Session.clear()`

**Why:** Without this check, any user can write an arbitrary username to `archx_session_v2` in localStorage and be auto-logged in as that user.

## Flag submission (fixed)
- Strict: `input.trim() === vmFlag && vmFlag !== ""`
- Previous bug: used `.includes("flag")` substring check — fixed to exact equality
- `vmFlag` is always non-empty when a VM is running (set during provision); additional guard prevents submitting against empty string

## XP anti-farming
- Diagnostics: 24-hour cooldown via `lastDiagnosticsRun` timestamp in profile
- Diagnostics MUST call `onAddXp(50, ...)` — not just `onNotify` — to actually award XP (was a bug: notification fired but XP wasn't credited)

## MFA
- `mfaEnabled` flag on user; if true, login flow generates OTP and shows verify screen before calling `onAuthSuccess`
