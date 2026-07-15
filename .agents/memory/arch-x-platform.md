---
name: ARCH-X platform architecture
description: Key structural decisions for the ARCH-X cybersecurity learning platform rebuild
---

## Stack
React 19 + TypeScript + Vite + Tailwind + Framer Motion (motion/react) + Three.js (imperative, no R3F) + Recharts + Supabase + Lucide

## State architecture
- All state lives in `src/App.tsx` — vmStatus, vmFlag, terminalHistory (lifted), userProfile, notifications
- Terminal history lifted to App to persist across tab switches
- `AnimatePresence` wraps tab pages via `motion.div` wrappers (not `key` on page components — React 19 broke that)

## React 19 quirks
- `React.FormEvent` / `React.ReactNode` require named imports (`import type { FormEvent } from 'react'`) — the `React.*` namespace no longer works without importing React
- `key` prop can no longer be passed directly to custom components in TypeScript strict mode; use `<motion.div key="..."><Component /></motion.div>` or `<Fragment key="...">` wrappers instead

## Supabase type quirk
- `PostgrestFilterBuilder` does NOT expose `.catch()` — use `.then(undefined, () => {})` for fire-and-forget calls

## Three.js / WebGL
- WebGL is unavailable in Replit screenshot sandbox (no GPU) — always check `canvas.getContext("webgl")` before constructing `THREE.WebGLRenderer`; show CSS fallback rings when unavailable
- HeroScene: IcosahedronGeometry wireframe + torus orbit rings + particle field + mouse parallax

## Supabase tables used
- `profiles` — username, callsign, accent_color, xp, level, completed_courses, completed_osint
- `user_vms` — username, course_id, status, ip_address, port, flag, solved
- `community_ideas` — does NOT exist yet; CommunityPage shows yellow warning + localStorage fallback

**Why:** Keeping all state in App avoids prop drilling for cross-cutting concerns (terminal, XP, notifications) and makes the lifted terminal history pattern trivial.
