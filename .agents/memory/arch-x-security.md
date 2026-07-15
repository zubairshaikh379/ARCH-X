---
name: ARCH-X security decisions
description: Auth quirks, flag bypass fix, session restore guard, diagnostics XP fix, MFA fail-closed rule
---

## MFA must fail closed, not open
When checking whether a logged-in user has a verified TOTP factor (to decide whether to demand a 2FA challenge), treat any error from `supabase.auth.mfa.listFactors()` or `getAuthenticatorAssuranceLevel()` as "block the login," not "assume no MFA." Silently swallowing the error and returning `null`/proceeding lets an attacker bypass 2FA by causing that call to fail.
**Why:** app-driven MFA enforcement (Supabase doesn't block sign-in itself) means any fail-open path here is a real bypass, not just a UX bug.
**How to apply:** in `signInFlexible`-style flows, on a factor-list/AAL check error, sign the user back out and return an error instead of letting them through.

## Vite config: `allowedHosts: true` needs a literal type
In `vite.config.ts`, if the returned server config is built via `defineConfig(() => ({...}))`, `allowedHosts: true` gets widened to `boolean` by inference, which fails `tsc --noEmit` (Vite's type wants `true | string[]`). Use `allowedHosts: true as true` (or annotate the return type) to keep `npm run lint` clean while still allowing the Replit iframe proxy host.
