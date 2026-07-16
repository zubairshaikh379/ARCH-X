# 🚀 ARCH-X Production Deployment Guide
**Developed by Zubair Shaikh**

This guide provides step-by-step instructions for deploying this React-based cybersecurity training platform to production using **Vercel**, and configuring the required cloud database integrations.

---

## 📋 Prerequisites
Before deploying to production, make sure you have the following:
1. A **GitHub** account with your repository set up: [ARCH-X on GitHub](https://github.com/zubairshaikh379/ARCH-X).
2. A **Vercel** account (connected to your GitHub account).
3. A **Supabase** project (providing your database connection URLs and anonymous keys).

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

## 🛠️ Step 2: Install Dependencies & Verify Scripts

```bash
npm install
```

Open `package.json` and verify the scripts block. Make sure you do NOT have any sensitive `.env` files committed. Add `.env` to your `.gitignore` to prevent credential leaks.

---

## 🛢️ Step 3: Setting Up Supabase Database

ARCH-X supports local storage caching by default and upgrades to persistent cloud syncing when Supabase is configured.

1. Go to [Supabase](https://supabase.com/) and create a new project.
2. Go to **Project Settings** → **API** to obtain:
   * **Project API URL**: (e.g. `https://your-project-id.supabase.co`)
   * **Anon Public API Key**: (Your anonymous public key token)
3. In the Supabase SQL Editor, run the schema queries in `supabase/migrations/` to set up profiles, leaderboard, and user VM tracking tables.
4. Enable **Row Level Security (RLS)** on all tables.
5. Under **Auth → Providers → Email**, enable **Confirm email**.
6. Under **Auth → URL Configuration**, set **Site URL** to your Vercel production URL and add `http://localhost:3000` as an allowed redirect for local dev.

---

## ☁️ Step 4: Importing to Vercel and Setting Environment Variables

1. Push your clean local project repository to **GitHub**.
2. Go to the [Vercel Dashboard](https://vercel.com/) and click **Add New** → **Project**.
3. Select your ARCH-X GitHub repository and click **Import**.
4. In the **Environment Variables** section, add the following variables:
   * `VITE_SUPABASE_URL`: Your Supabase Project API URL.
   * `VITE_SUPABASE_ANON_KEY`: Your Supabase Anonymous Public Key.
5. Click **Deploy**. Vercel will automatically run `npm run build` and provision your secure production hosting URL.

---

## 🔒 Security Best Practices for Production

1. **Never Commit Secrets**: Never push actual API tokens or Supabase keys inside your `.env` or code files.
2. **Environment Isolation**: Always prefix variables destined for the browser with `VITE_` (e.g., `VITE_SUPABASE_URL`). Keys without `VITE_` are kept safe from client-side access.
3. **Use GitHub Secrets for CD**: When configuring GitHub Actions to build or deploy, pass secrets securely as environment parameters rather than committing them to workflow files.
4. **Rotate Keys Regularly**: Periodically regenerate your Supabase anon key from the dashboard and update your Vercel environment variables.
