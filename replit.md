# ARCH-X

Cybersecurity training platform (React 19 + TypeScript + Vite + Supabase Auth + three.js + motion). See `PROJECT_STATUS.md` for the full feature build log and roadmap.

## Running on Replit
- Dev server: `npx vite --port=5000 --host=0.0.0.0` (bound to the "Start application" workflow, which the "Project" run button triggers).
- `npm install` first if `node_modules` is missing.
- `npm run lint` runs `tsc --noEmit` for type checking.
- Supabase URL/anon key have working fallback defaults hardcoded in `src/lib/supabase.ts`, so the app runs without secrets out of the box. To point at a different Supabase project, set `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` env vars. `GEMINI_API_KEY` is only needed for Gemini AI features.
- Vite `server.allowedHosts` is set to `true` (typed as literal `true`, not `boolean`, or `tsc` fails) so the Replit iframe proxy can reach the dev server.

## User preferences
None recorded yet.
