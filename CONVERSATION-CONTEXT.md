# Homework Tracker — Conversation History & Context

This document summarizes all decisions, bugs found, and fixes applied during the original build so the next developer (and their Claude) understands the full context.

---

## Project Origin

Jordan (JORDAN@wediorknot.com) requested a homework tracking web app based on a detailed PRD. The original scope included PowerSchool/Synergy grade integrations, but Jordan explicitly scoped it down to just the "universal planner layer" — no grade portal integrations. The key insight was: "a calendar link converted to a task should achieve what's needed."

## Key Decisions Made

### Architecture
- **Supabase was chosen over local-only storage** because Jordan wanted a real deployed app with user accounts
- **Reused an existing Supabase project** ("company-deep-dive", ref: wylalwxxmonzywlyhvfb) instead of creating a new one. All tables are prefixed with `ht_` for isolation. **The new developer should create their own fresh Supabase project.**
- **Next.js 14.2.15** with App Router was chosen for simplicity and Vercel integration
- **Custom ICS parser** (lib/ics.ts) was written instead of using ical.js to keep cold starts small. Note: ical.js IS in package.json as a dependency but is NOT actually used in the code — it can be removed.

### Authentication
- Jordan insisted on proper email/password authentication with email confirmation ("No fix this properly there needs to be a login")
- The auth callback route (app/auth/callback/route.ts) handles both PKCE code flow and token_hash flow
- A suggestion to disable email confirmation was explicitly rejected by Jordan

### Deployment
- **Vercel team**: jaxeljews-projects (team_hX5PaWYFLlPWvIhjhrMvh9go)
- **Vercel project**: homework-tracker (prj_4zBQA9QycEcVck4rff6JvrXlTBuc)
- **Production URL**: https://homework-tracker-two.vercel.app
- **The new developer should create their own Vercel project**
- Vercel CLI was not pre-installed — had to use `npx vercel deploy --prod`

## Bugs Found and Fixed

### Bug 1: "Database error saving new user" on signup
**Cause**: The trigger function `ht_handle_new_user` couldn't find the `ht_profile` table because Supabase auth triggers run with a different search_path.
**Fix**: Recreated the function with `SECURITY DEFINER` and `SET search_path TO 'public'`, and used fully qualified `public.ht_profile`.

### Bug 2: Silent signup — no confirmation notice shown
**Cause**: The login page redirected to "/" even when email confirmation was required (no session returned).
**Fix**: Check `!data.session` after signUp and show a green notice: "We sent a confirmation link to {email}."

### Bug 3: Email confirmation link went to vercel.com/login
**Cause**: Two issues — (a) Supabase Site URL wasn't configured to the stable production alias, so confirmation emails used deployment-specific URLs; (b) Vercel Deployment Protection was potentially intercepting.
**Fix**: Vercel Authentication was already disabled. The Supabase Site URL configuration still needs to be done for the new deployment.

### Bug 4: .ics calendar feed sync produced 0 tasks (CRITICAL)
**Cause**: Two bugs working together:
1. Missing unique constraint on `(user_id, feed_id, source_event_uid)` — the upsert in sync.ts had no constraint to match against, so PostgREST returned errors
2. The Supabase client returns errors in `{ error }` instead of throwing — the code only caught thrown exceptions, so upsert failures were silently swallowed
**Fix**: Added the unique constraint to the database. Added error checking after upsert: `if (upsertErr) throw new Error(...)`.

### Bug 5: "Nothing happens" when clicking Add Feed button
**Cause**: The `addFeed` server action called `syncFeed` immediately after saving the feed. For feeds with 100+ events, this exceeded Vercel Hobby's 10-second function timeout.
**Fix**: Split into two steps — `addFeed` just saves the feed URL (instant), and sync is triggered separately via a "Sync" button per feed. Added `syncOneFeed` action.

## Features Implemented
- Email/password signup with email confirmation flow
- Dashboard with due-today, overdue, planned, and total open counts
- Assignments page with filters (all, today, upcoming, overdue, completed) and search
- Manual task creation with title, course, due date/time, notes
- Task completion toggle (checkbox)
- Task deletion
- "Add to Today" button on each task
- Today's Plan page showing tasks pinned to today
- Missing & Overdue page
- Settings page: add/remove .ics calendar feeds with individual sync buttons
- .ics calendar import with course name extraction from title patterns
- Daily cron job (6am UTC) to auto-sync all active feeds
- Sign out functionality
- Responsive nav bar

## Features NOT YET Implemented (from original PRD)
- Time blocking (database table exists: ht_time_block, but no UI)
- Drag-and-drop reordering in Today's plan
- Google/Facebook social login
- Push notifications / reminders
- Mobile native app
- Parent access view
- Course color coding in the UI
- Course management page (table exists: ht_course, but no UI)

## Competitive Analysis: myHomework (myhomeworkapp.com)
Jordan had us analyze myhomeworkapp.com as a competitor. Key findings:
- They use the same .ics import approach we use — validates our architecture
- Their auto-sync is a premium feature ($4.99/yr) — ours does it free via cron
- They lack our daily planner / time blocking features
- They have native apps on all platforms — we're web-only
- They charge schools <$2/student with bundled hall pass, rewards, violation tracking features
- Built on Python/Django with CloudFront CDN (15+ year old codebase)
