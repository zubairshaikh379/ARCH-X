# ARCH-X — Cybersecurity Training Platform

> **Learn. Hack. Defend.**  
> A hands-on cybersecurity training platform with interactive courses, simulated terminal labs, OSINT missions, and real authentication — built for learners who want to go beyond theory.

---

## 🔥 What Is ARCH-X?

ARCH-X is a full-stack cybersecurity learning platform that puts real skills in your hands. Instead of passive reading, you work through structured guidebooks, answer quizzes, and then prove your knowledge inside sandboxed virtual terminal environments — exactly the way platforms like TryHackMe and HackTheBox do, but self-hostable and open to extend.

Whether you are a complete beginner or already working in security, ARCH-X covers the full spectrum — from SOC analysis and network security all the way to reverse engineering, SCADA/ICS threats, and cloud-native Kubernetes hardening.

---

## ✨ Features

### 🎓 16 Full Course Tracks
Each course includes a 10-lesson deep guidebook, concept quizzes, and a final CTF-style sandbox lab:

| Track | Focus |
|---|---|
| SOC Analyst | Security operations, alerting, threat triage |
| Network Security | Packet analysis, firewall rules, VPNs |
| Penetration Testing | Recon, exploitation, post-exploitation |
| Digital Forensics | Memory dumps, disk imaging, timeline analysis |
| Incident Responder | Containment, eradication, recovery playbooks |
| Threat Hunter | Proactive hunting, IOC chaining, hypothesis-driven |
| Reverse Engineer | Binary analysis, disassembly, malware behavior |
| Active Directory | AD attacks, Kerberoasting, BloodHound |
| Cloud Security | AWS/GCP/Azure misconfigs, IAM hardening |
| DevSecOps | Pipeline security, secret scanning, SAST/DAST |
| API Security | OWASP API Top 10, fuzzing, auth bypass |
| Identity & Access | OAuth, SAML, zero-trust principles |
| Mobile Security | SSL pinning bypass, SQLite forensics, sandbox leaks |
| Social Defender | Phishing defense, social engineering awareness |
| K8s Security | Pod security, RBAC, runtime threat detection |
| SCADA / ICS | Industrial control system threats and defenses |

### 🖥️ Virtual Terminal Sandbox Labs
Each course ends with a sandboxed CLI environment. Commands like `ls`, `cat`, `grep`, `nmap`, and course-specific exploit tools work inside a simulated virtual filesystem. Completing the lab unlocks a cryptographic flag that grants your certification credit.

### 🕵️ OSINT Missions
Open-source intelligence challenges with progressive hint systems, numeric operation codes, and spoiler-free briefs. Hone your recon skills against realistic targets.

### 🔐 Real Authentication
- Register with email + username + optional phone
- Login by email, username, or phone
- Email verification via Supabase
- TOTP two-factor authentication (authenticator app)
- Secure session management with JWT (Supabase Auth)

### 🏆 XP & Leaderboard
Earn XP for completing lessons, passing quizzes, and solving labs. Track your rank and compare with others on the leaderboard.

### 🎨 Premium UI/UX
- Three.js animated hero with live starfield
- Smooth scroll powered by Lenis
- Motion-powered page transitions and micro-animations
- Custom cursor, ambient audio, and logo preloader
- Fully dark-themed, cyberpunk-inspired design system built with Tailwind CSS v4

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript |
| Build tool | Vite 6 |
| Styling | Tailwind CSS v4 |
| 3D / Animation | Three.js + Motion (Framer Motion) |
| Smooth scroll | Lenis |
| Auth & Database | Supabase (PostgreSQL + Row Level Security) |
| Charts | Recharts |
| Deployment | Vercel + GitHub Actions |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works fine)

### 1. Clone the repo

```bash
git clone https://github.com/zubairshaikh379/ARCH-X.git
cd ARCH-X
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set environment variables

Copy the example file and fill in your Supabase credentials:

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Run the database migrations

In your Supabase SQL editor, run the migration files in `supabase/migrations/` in order. These set up the `profiles` and `user_vms` tables with proper Row Level Security policies.

Then under **Auth → Providers → Email**, enable **Confirm email**. Under **Auth → URL Configuration**, set your Site URL.

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Deployment

See [`deployment-guide.md`](./deployment-guide.md) for the full step-by-step guide covering Vercel setup, GitHub Actions CI/CD, and environment variable configuration.

The short version:
1. Push to GitHub
2. Import the repo in Vercel
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables
4. Deploy — Vercel builds and serves automatically on every push to `main`

---

## 📁 Project Structure

```
ARCH-X/
├── src/
│   ├── components/        # Reusable UI components (3D, layout, modals, etc.)
│   ├── data/
│   │   ├── courses.ts     # Course registry and OSINT challenges
│   │   ├── guidebooks/    # 16 deep guidebook files (one per course)
│   │   └── sandboxes/     # 14 sandbox lab definitions (objectives, files, commands)
│   ├── hooks/             # Custom React hooks (smooth scroll, etc.)
│   ├── lib/               # Supabase client, auth helpers, audio
│   ├── pages/             # Route-level components (Landing, Courses, OSINT, Profile…)
│   └── types/             # TypeScript type definitions
├── supabase/
│   └── migrations/        # SQL schema migrations with RLS policies
├── public/                # Static assets (logo, icons)
├── .github/workflows/     # GitHub Actions CI/CD pipeline
├── deployment-guide.md    # Full production deployment instructions
└── vite.config.ts         # Vite configuration
```

---

## 🧑‍💻 How Learners Use It

1. **Register** — create an account with your email and a username.
2. **Pick a course** — browse the 16 tracks and choose what matches your goals.
3. **Read the guidebook** — each course has 10 structured lessons covering theory, real-world context, and exam prep.
4. **Take quizzes** — 2 quick questions per lesson keep the concepts locked in.
5. **Attempt the lab** — once you pass the quiz gate, the terminal sandbox unlocks. Work through the commands, capture the flag.
6. **Earn XP and rank up** — your score feeds the leaderboard and your profile.
7. **Run OSINT missions** — side-challenges outside the course track for recon practice.

---

## 🔒 Security Design

- All database access goes through Supabase Row Level Security — users can only read and write their own rows.
- No secrets are stored client-side beyond the Supabase anon key (which is safe by design when RLS is enabled).
- TOTP 2FA is supported for all accounts via any standard authenticator app.
- Email confirmation is enforced before full account access.

---

## 📄 License

This project is the original work of **Zubair Shaikh**. All rights reserved.

---

## 🙌 Contributing

Pull requests are welcome for bug fixes, new sandbox lab definitions, or additional guidebook content. Please open an issue first to discuss what you'd like to change.

---

*ARCH-X — because the best way to defend a system is to know how to break it.*
