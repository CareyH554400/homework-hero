# Homework Tracker — Handoff Setup Prompt

**Give this entire document to Claude Cowork (or Claude Code) to set up the project on your own infrastructure.**

---

## PROMPT START — PASTE EVERYTHING BELOW INTO CLAUDE

You are setting up the "Homework Tracker" web application. This is a complete, working Next.js app that has been handed off to you. You need to:

1. Set up a NEW Supabase project (the new developer's own database)
2. Deploy to the new developer's own Vercel account
3. Configure auth emails to work correctly

### What this app does

Homework Tracker is a student planner web app that:
- Imports assignments from .ics calendar feeds (Canvas, Schoology, Google Calendar, iCloud, etc.)
- Lets students manually add tasks
- Shows a dashboard with due-today, overdue, and planned counts
- Has a "Today" daily planner view where students plan their day
- Has a "Missing & Overdue" view for late assignments
- Supports email/password authentication with email confirmation
- Auto-syncs calendar feeds daily via a Vercel cron job at 6am UTC

### Tech Stack

- **Framework**: Next.js 14.2.15 with App Router, TypeScript strict mode
- **Database/Auth**: Supabase (Postgres + Auth + Row-Level Security)
- **Supabase Client**: @supabase/ssr package (NOT the old auth-helpers)
- **Hosting**: Vercel
- **Styling**: Tailwind CSS 3.4
- **ICS Parsing**: Custom lightweight parser in lib/ics.ts (no heavy dependencies)

### Step-by-step setup instructions

#### STEP 1: Create a Supabase project

1. Go to https://supabase.com and create a new project
2. Choose a region close to your users (e.g., US East)
3. Set a strong database password and save it somewhere safe
4. Wait for the project to finish provisioning

#### STEP 2: Run the database schema

1. Open the Supabase Dashboard for your new project
2. Go to SQL Editor
3. Open the file `database-schema.sql` included in this project
4. Paste the ENTIRE contents into the SQL Editor and click "Run"
5. This creates all 6 tables, RLS policies, and the auto-profile trigger

The tables created are:
- `ht_profile` — User profiles (auto-created on signup)
- `ht_course` — Courses/classes
- `ht_calendar_feed` — Stored .ics feed URLs
- `ht_task` — All tasks (both manual and imported from .ics feeds)
- `ht_daily_plan_item` — Tasks pinned to "today's plan"
- `ht_time_block` — Time blocks for scheduling (future feature)

All tables have Row-Level Security enabled so each user can only see their own data.

#### STEP 3: Configure Supabase Auth

1. In Supabase Dashboard → Authentication → URL Configuration:
   - **Site URL**: Set to your Vercel production URL (e.g., `https://your-app.vercel.app`)
   - **Redirect URLs**: Add these:
     - `https://your-app.vercel.app/auth/callback`
     - `https://your-app.vercel.app/**`
     - `http://localhost:3000/auth/callback` (for local dev)

2. In Authentication → Email Templates (optional):
   - The default templates work fine
   - Make sure "Confirm email" is enabled under Authentication → Providers → Email

#### STEP 4: Get your API keys

From Supabase Dashboard → Settings → API, copy:
- **Project URL** (looks like `https://xxxxx.supabase.co`)
- **anon/public key** (long JWT string, starts with `eyJ...`)
- **service_role key** (another JWT, KEEP THIS SECRET)

#### STEP 5: Set up environment variables

1. Copy `.env.local.example` to `.env.local`
2. Fill in:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   CRON_SECRET=generate-a-random-string-here
   NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
   ```
3. Generate CRON_SECRET with: `openssl rand -hex 32`

#### STEP 6: Test locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 — you should see the login page. Sign up with an email, confirm via email, and test adding tasks.

#### STEP 7: Deploy to Vercel

1. Push the project to a GitHub repo (or use Vercel CLI)
2. Connect the repo to Vercel (or run `npx vercel deploy --prod`)
3. In Vercel → Project Settings → Environment Variables, add ALL the same env vars from .env.local
4. Make sure to add them for Production, Preview, AND Development environments
5. Redeploy after adding env vars

#### STEP 8: Configure Vercel cron (automatic)

The file `vercel.json` already defines a daily cron job:
```json
{ "crons": [{ "path": "/api/cron/sync", "schedule": "0 6 * * *" }] }
```

This hits `/api/cron/sync` every day at 6am UTC, which syncs all active .ics feeds for all users. The endpoint is protected by the CRON_SECRET env var. Vercel automatically sends the correct Authorization header for its own cron jobs.

#### STEP 9: Disable Deployment Protection (IMPORTANT)

If using Vercel's Hobby plan:
1. Go to Project Settings → Deployment Protection
2. Set "Vercel Authentication" to **Disabled**
3. This is required so that Supabase's email confirmation links can reach the /auth/callback URL without being intercepted by Vercel's SSO

### Project structure

```
homework-tracker/
├── app/
│   ├── api/
│   │   ├── auth/signout/route.ts    — POST handler for sign-out
│   │   └── cron/sync/route.ts       — Daily cron endpoint (syncs all .ics feeds)
│   ├── auth/callback/route.ts       — Handles email confirmation redirects
│   ├── login/page.tsx               — Client component: sign-in/sign-up form
│   ├── missing/page.tsx             — Overdue tasks view
│   ├── settings/page.tsx            — Add/remove .ics feeds, sync controls
│   ├── tasks/page.tsx               — All assignments with filters and search
│   ├── today/page.tsx               — Daily planner view
│   ├── components.tsx               — Shared TaskCard client component
│   ├── globals.css                  — Tailwind imports
│   ├── layout.tsx                   — Root layout with nav bar
│   └── page.tsx                     — Dashboard (home page)
├── lib/
│   ├── actions.ts                   — Server Actions (addTask, toggleComplete, addFeed, sync, etc.)
│   ├── ics.ts                       — Custom .ics parser (handles VEVENT, date parsing, unfolding)
│   ├── sync.ts                      — Feed sync logic (fetch .ics → parse → upsert tasks)
│   └── supabase/
│       ├── client.ts                — Browser Supabase client
│       └── server.ts                — Server Supabase client (uses cookies)
├── middleware.ts                     — Auth redirect middleware
├── database-schema.sql              — FULL database schema (run this in Supabase SQL Editor)
├── .env.local.example               — Template for environment variables
├── vercel.json                      — Cron job configuration
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
└── next.config.mjs
```

### Known issues and gotchas

1. **Vercel Hobby plan has a 10-second function timeout.** The addFeed action does NOT sync immediately for this reason — it just saves the feed URL. The user must click "Sync" separately. For large feeds (120+ events), individual sync per feed may also approach the limit. If this becomes a problem, upgrade to Vercel Pro ($20/mo) for 60-second timeouts, or batch the upserts.

2. **Supabase Site URL MUST match your production domain.** If it doesn't, email confirmation links will go to the wrong URL and may trigger Vercel Deployment Protection.

3. **The trigger function `ht_handle_new_user` uses SECURITY DEFINER and `SET search_path TO 'public'`.** This is required because Supabase auth triggers run in a different schema context. Without the explicit search_path, the function can't find the ht_profile table.

4. **The .ics parser is intentionally lightweight.** It only handles VEVENT blocks and parses UID, SUMMARY, DESCRIPTION, DTSTART, and DTEND. It does NOT handle RRULE (recurring events) — each VEVENT becomes one task. This works well for LMS exports where each assignment is a separate event.

5. **Course name extraction** from .ics events uses two regex patterns:
   - `[COURSE] Title` → course = COURSE, title = Title
   - `Title (COURSE)` → course = COURSE, title = Title
   - If neither matches, course_name is null

6. **The `ht_task` table has a unique constraint** on `(user_id, feed_id, source_event_uid)` which enables upsert behavior — re-syncing a feed updates existing tasks instead of creating duplicates. Manual tasks (which have null feed_id) are unaffected because PostgreSQL treats NULLs as distinct in unique constraints.

### GitHub setup (if transferring via git)

If you want to put this on GitHub:
```bash
cd homework-tracker
git init
git add .
git commit -m "feat: initial homework tracker setup"
git remote add origin https://github.com/YOUR_USERNAME/homework-tracker.git
git push -u origin main
```

Then connect the GitHub repo to Vercel for automatic deploys on push.
