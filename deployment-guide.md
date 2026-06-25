# 🚀 ARCH-X Production Deployment Guide

This guide provides step-by-step instructions for exporting this React-based cyber security training platform from Google AI Studio, deploying it to production using **Vercel**, and configuring required cloud database and AI integrations.

---

## 📋 Prerequisites
Before deploying to production, make sure you have the following:
1. A **GitHub** account.
2. A **Vercel** account (connected to your GitHub account).
3. A **Supabase** project (providing your database connection URLs and anonymous keys).
4. A **Google Gemini API Key** (for server-side security simulations and AI-assisted audits).

---

## 🔍 Step 1: Exporting the Codebase from AI Studio

To get your source code out of the interactive environment:
1. Open the **Settings Menu** in the upper-right corner of Google AI Studio.
2. Click **Export Project** and select **Download as ZIP file** (or directly **Export to GitHub** if available and linked).
3. Extract the downloaded ZIP archive into a local folder on your workstation.

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
   * `GEMINI_API_KEY`: Your private Google Gemini API token (kept server-side).
   * `VITE_SUPABASE_URL`: Your Supabase Project API URL.
   * `VITE_SUPABASE_ANON_KEY`: Your Supabase Anonymous Public Key.
5. Click **Deploy**. Vercel will automatically run `npm run build` and provision your secure production hosting URL.

---

## 🔒 Security Best Practices for Production

1. **Never Commit Secrets**: Never push actual API tokens or Supabase keys inside your `.env` or code files.
2. **Environment Isolation**: Always prefix variables destined for the browser with `VITE_` (e.g., `VITE_SUPABASE_URL`). Any keys without `VITE_` are kept safe from client inspect logs.
3. **Use GitHub Secrets for CD**: When configuring GitHub actions to build or deploy, pass the secrets securely as environment parameters rather than committing them to workflow files.
