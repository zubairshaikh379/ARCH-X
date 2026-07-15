# ARCH-X — Build Status & Roadmap

Cybersecurity training platform (React 19 + TS + Vite + Supabase + three.js + motion).
Dev: `npm run dev` → http://localhost:3000 (local `vite build` may OOM on this PC; deploy builds on Vercel).

## DONE
1. **Landing scroll bug** — fixed (`src/pages/LandingPage.tsx`: removed `overflow:hidden`, fail-safe `FadeSection`).
2. **OSINT de-spoiler** — `src/data/courses.ts` `OSINT_CHALLENGES`: numeric `OPERATION 0xx`, spoiler-free briefs, `objectives[]` questionnaire, 4 progressive hints. UI in `src/pages/OsintPage.tsx`.
3. **Deep guidebooks — ALL 16 courses** — one file each in `src/data/guidebooks/<id>.ts`, exporting `META` + `LESSONS` (10 lessons each). SOC uses `SOC_ANALYST_META/LESSONS`. Wired via `DEEP_GUIDEBOOKS` registry in `courses.ts`.
   - Quiz display: 2 Q/lesson check + ~10 final exam (`LESSON_QUIZ_COUNT` in `CoursesPage.tsx`) ≈ 30/course.
   - Overview extra fields: prerequisites, learningOutcomes, mustKnow, commonGaps, prosCons, careerNotes.
4. **Sandbox engine** — `src/App.tsx` `executeCmd`: virtual filesystem (ls/cat/grep), `objective`, progressive `hint N`, `{{FLAG}}` substitution. Sim type gained `objective/files/hints`. SOC lab fully wired (was unsolvable before).
5. **Tooling** — installed skills: `ui-ux-pro-max` (UI/UX) + `caveman` plugin (terse mode, saves tokens).

## LOGO
`public/ARCH-X LOGO.svg` — use for W5 certificate.

## DECISIONS
- No SMS/paid services ever. Phone = optional unique login identifier only (no OTP).
- 2FA = TOTP authenticator app (free). Email verification via Supabase (free).
- Login by email OR username OR phone + password. Register needs ≥1 of {email, phone}; add rest later in Settings; nudge on login.

## W2 — DONE
- Exam→Practice-Lab gating (CoursesPage tab bar, locks 🔒 until `quizPassed`).
- ALL 16 courses have solvable sandbox labs. soc-analyst + network-security inline in courses.ts; other 14 in `src/data/sandboxes/<id>.ts` (export SANDBOX{objective,hints,files,commands}) wired via SANDBOXES registry loop in courses.ts (merges into course.simulation).
- Remaining minor: OSINT already shows tools[] + objectives + hints; "real solved-mission images" still generic Unsplash (low priority polish).

## EFFICIENCY RULE (keep)
Max 2 subagents/burst (~35k each) to stay under $10/5h. Lean prompts (ref SOC as template).

## W3 — DONE (real Supabase Auth migration) — needs dashboard SETUP below to test
Real auth, not the old localStorage demo. Identity source of truth = Supabase Auth (JWT).
- Flexible login: email OR username OR phone + password (username/phone → email via `email_for_identifier` RPC).
- Register: username + email + password + optional phone. Email is the Supabase identity.
- Email verification: Supabase confirmation email ("check inbox" screen + resend).
- TOTP 2FA: Supabase native MFA (`supabase.auth.mfa.*`) — real authenticator app, free.
- Security nudge: post-login `SecurityCard` when email unconfirmed / no phone / no 2FA.
- Schema: profiles/user_vms keyed by `id = auth.users.id` with **strict RLS** (ULTIMATE
  MIGRATION, run in SQL editor). No email/phone columns — those live in `auth.users`.
  Profile row is created on **first authenticated login** (App.handleAuthSuccess), not at
  signup (strict insert RLS needs a session).
- **REQUIRED SETUP** (do once, else login won't work):
  1. Run the ULTIMATE MIGRATION schema, then `supabase/migrations/w3_auth.sql`
     (adds the `email_for_identifier` resolver RPC that reads `auth.users`).
  2. Supabase → Auth → Providers → Email: enable **Confirm email**.
  3. Auth → URL Configuration → **Site URL** = Vercel URL; add `http://localhost:3000` redirect for dev.
  4. Auth → **Multi-Factor Authentication**: enable **TOTP (Authenticator app)**.
  5. Leave Phone auth DISABLED (phone = identifier only, no SMS).
- Known gap: phone uniqueness not DB-enforced (phone only in user_metadata) — resolver
  returns first match. Add a mirrored unique column later if strict uniqueness needed.

## W4 — DONE (dashboard + Settings tab)
- New **Settings** tab (`src/pages/SettingsPage.tsx`) + Sidebar nav item + `AppTab` type.
- Account: username/email (with confirmed badge), **change email** (`updateUser`).
- Sign-in security: embeds `SecurityCard` panel (email confirm, phone, TOTP 2FA).
- **Change password** inline (`updatePassword`).
- About / Help / Privacy accordions.
- **Forgot password**: link on AuthPage login → `resetPasswordForEmail`; reset link opens
  `PasswordRecoveryModal` (`PASSWORD_RECOVERY` event) to set a new password.
- Auth helpers added to `src/lib/auth.ts`: `sendPasswordReset`, `updatePassword`,
  `updateEmail`, `getAuthUser`.
- Dashboard (HomePage) already covered the overview; left as-is. ProfilePage security block
  now points to Settings (no duplicate SecurityCard).

## Schema-rekey fixups (from ULTIMATE MIGRATION: id/user_id keys + strict RLS)
- **user_vms** sync fixed: writes now include `user_id` and use `onConflict:"user_id,course_id"`
  (was `username,course_id` → silently failed under new unique key + RLS).
- **Community** wired to real tables (`src/pages/CommunityPage.tsx`): insert with `user_id`,
  DB rows mapped ↔ app `CommunityIdea` shape. Votes via `toggle_vote` RPC (community_votes
  RLS hides others' rows, so counts are maintained server-side on community_ideas.votes).
  Requires **`supabase/migrations/w4_community.sql`** (adds `category` column + `toggle_vote`).
  Falls back to localStorage if Supabase unavailable.

## BACKEND SETUP CHECKLIST (run once — nothing works until done)
SQL editor: 1) ULTIMATE MIGRATION schema ✅(done)  2) `w3_auth.sql` (email_for_identifier RPC)
3) `w4_community.sql` (category + toggle_vote).
Dashboard Auth: Confirm email ON · Site URL + redirect URLs (localhost + Vercel) · TOTP MFA ON.

## W5 — DONE (downloadable certificate)
- `src/components/CertificateModal.tsx` — canvas-rendered cert (1600×1131): ARCH-X logo
  (watermark + header, loaded from `/ARCH-X LOGO.svg`), operator callsign, course title,
  date, **stable cert ID** (hash of username+courseId), level/XP, signature line. Download PNG
  (no external deps — pure canvas).
- Issued only for completed courses (exam pass unlocks lab → solving lab sets completedCourses).
- Entry points: CoursesPage completed-course header **Certificate** button; ProfilePage
  **Certificates** card listing every earned course.

## W6 — DONE (UI atmosphere foundation)
- **Lenis smooth scroll** (`lenis` dep + `src/hooks/useLenis.ts`) — mounted on LandingPage only
  (won't hijack in-app scroll containers); respects reduced-motion; `scrollTo` rewired the
  hero/browse/scroll buttons. Lenis CSS in index.css.
- **Custom flowing cursor** (`src/components/CustomCursor.tsx`) — dot + lagging ring, grows on
  interactive hover, click-shrink. Fine-pointer only (touch keeps native). Mounted in main.tsx.
- **Floating menu** (`src/components/FloatingMenu.tsx`) — pill nav appears past hero, section
  links via lenis.scrollTo + Sign In. Hero given `id="top"`.
- Landing already had 3D HeroScene + motion + scroll-reveal (FadeSection) — kept.

## W7 — DONE (landing motion polish)
- **Scroll progress bar** — top-of-viewport accent→purple gradient, spring-smoothed
  `scaleX` from motion `useScroll` (`.scroll-progress` in index.css).
- **Hero parallax** — `useScroll({target:heroRef})` drives: 3D scene drifts up + scales,
  ambient glow drifts down (opposite), text column drifts + fades. Section-scoped, not
  page-scroll.
- **Magnetic buttons** — `src/components/MagneticButton.tsx`: springs toward cursor on
  hover, back on leave, `whileTap` scale. Fine-pointer + non-reduced-motion only (touch
  gets plain button). Wired to all hero/CTA/browse buttons.
- **Richer scroll reveals** — `src/components/Reveal.tsx` replaces old inline FadeSection:
  directional variants (up/down/left/right/scale) + optional de-blur, same 1.2s fail-safe.
  Features alternate up/down, courses stagger up, headers scale/slide-left.
- **Tech marquee** — infinite CSS ticker strip (tools/tactics) between hero + features,
  pauses on hover, masked edges (`.marquee` in index.css).
- **Animated gradient text** — `.text-gradient-sweep` sweeps accent→purple on "LIKE AN"
  and "Infinite ceiling".
- **Grid floor** — faint scanning radial-masked grid behind hero (`.grid-floor`).
- All new CSS respects `prefers-reduced-motion`. `tsc --noEmit` clean.

## TODO (needs budget window)
- W8 — further iterative polish if desired (per-section 3D accents, page transitions).

## BUDGET
$10 / 5h AND $70 / week caps. Subagent content generation is the big spender (~$0.8/guidebook). Batch subagents ≤4, never 12. Total remaining est ~6–7 windows over 2–3 days.
