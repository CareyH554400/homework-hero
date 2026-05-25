# Homework Tracker

A simple, fast homework planner. Imports assignments from any `.ics` calendar (Canvas, Schoology, Google Calendar), lets you add manual tasks, and helps you plan your day.

## Local dev

1. `npm install`
2. Copy `.env.local.example` to `.env.local`
3. `npm run dev`

## Stack

- Next.js 14 (App Router)
- Supabase (Postgres + Auth)
- Tailwind CSS
- Vercel hosting

## Database

All tables prefixed `ht_` and protected with Row Level Security. See `supabase migrations`.
