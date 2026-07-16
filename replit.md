# ARCH-X

Cybersecurity training platform built by Zubair Shaikh — React 19 + TypeScript + Vite + Supabase Auth + three.js + motion.

## Running on Replit
- Dev server: `npx vite --port=5000 --host=0.0.0.0` (bound to the "Start application" workflow).
- Run `npm install` first if `node_modules` is missing.
- Run `npm run lint` for TypeScript type checking.
- Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` env vars to point at your Supabase project (required for auth and data persistence).
- `vite.config.ts` sets `server.allowedHosts: true` so the Replit iframe proxy can reach the dev server.

## User preferences
- Keep responses short and efficient — minimal explanations, do the work, summarize the outcome in 1-2 sentences. No long narration.
