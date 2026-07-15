# 🚀 ARCH-X Production Deployment Guide
**Developed by Zubair Shaikh**

This guide provides step-by-step instructions for deploying this React-based cyber security training platform to production using **Vercel**, and configuring required cloud database and AI integrations.

---

## 📋 Prerequisites
Before deploying to production, make sure you have the following:
1. A **GitHub** account with your repository set up: [ARCH-X on GitHub](https://github.com/zubairshaikh379/ARCH-X).
2. A **Vercel** account (connected to your GitHub account).
3. A **Supabase** project (providing your database connection URLs and anonymous keys).
4. A **Gemini API Key** (for server-side security simulations and AI-assisted audits).

---

## 🔍 Step 1: Clone the Codebase

To work with your codebase locally or push to your hosting provider:
1. Clone the repository from your GitHub profile:
   ```bash
   git clone https://github.com/zubairshaikh379/ARCH-X.git
   cd ARCH-X
   ```
2. Open the directory in your preferred integrated development environment (IDE) like VS Code.

---

## 🛠️ Step 2: Verify Project Scripts and Structure

Open `package.json` inside your local directory. Ensure that the build scripts compile correctly. For a client-side Vite Single Page Application, the scripts block should match:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc && vite build",
  "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
  "preview": "vite preview"
}
```

Make sure you do NOT have any sensitive `.env` files committed. Add `.env` and other secret credentials to your `.gitignore` to prevent leaks to public repositories.

---

## 🛢️ Step 3: Setting Up Supabase Database

ARCH-X supports local storage caching by default but upgrades automatically to persistent cloud syncing when Supabase is detected.
1. Go to [Supabase](https://supabase.com/) and create a new project.
2. Go to **Project Settings** -> **API** to obtain:
   * **Project API URL**: (e.g. `https://your-project-id.supabase.co`)
   * **Anon Public API Key**: (Your anonymous public key token)
3. In the Supabase SQL Editor, run the schema queries required for profiles, Leaderboard, and user VMs tracking:
   ```sql
   -- Profiles Table
   create table public.profiles (
     username text primary key,
     role text,
     rank_title text,
     score integer default 0,
     completed_courses text[] default '{}',
     created_at timestamp with time zone default timezone('utc'::text, now())
   );

   -- User Virtual Machines Tracking Table
   create table public.user_vms (
     id uuid default gen_random_uuid() primary key,
     username text references public.profiles(username) on delete cascade,
     course_id text,
     vm_ip text,
     vm_port integer,
     uptime integer,
     status text,
     created_at timestamp with time zone default timezone('utc'::text, now())
   );
   ```

---

## ☁️ Step 4: Importing to Vercel and Setting Environment Variables

1. Push your clean local project repository to **GitHub**.
2. Go to the [Vercel Dashboard](https://vercel.com/) and click **Add New** -> **Project**.
3. Select your ARCH-X GitHub repository and click **Import**.
4. In the **Environment Variables** section, add the following variables:
   * `GEMINI_API_KEY`: Your private Gemini API token (kept server-side).
   * `VITE_SUPABASE_URL`: Your Supabase Project API URL.
   * `VITE_SUPABASE_ANON_KEY`: Your Supabase Anonymous Public Key.
5. Click **Deploy**. Vercel will automatically run `npm run build` and provision your secure production hosting URL.

---

## 🔒 Security Best Practices for Production

1. **Never Commit Secrets**: Never push actual API tokens or Supabase keys inside your `.env` or code files.
2. **Environment Isolation**: Always prefix variables destined for the browser with `VITE_` (e.g., `VITE_SUPABASE_URL`). Any keys without `VITE_` are kept safe from client inspect logs.
3. **Use GitHub Secrets for CD**: When configuring GitHub actions to build or deploy, pass the secrets securely as environment parameters rather than committing them to workflow files.
