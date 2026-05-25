-- ============================================================
-- Homework Tracker — Full Database Schema
-- Run this ENTIRE script in your Supabase SQL Editor (or psql)
-- after creating a new Supabase project.
-- ============================================================

-- 1. TABLES
-- All tables are prefixed with ht_ to isolate from other apps
-- sharing the same Supabase project.

CREATE TABLE public.ht_profile (
  id uuid NOT NULL PRIMARY KEY,
  display_name text,
  timezone text DEFAULT 'America/New_York'::text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.ht_course (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  color text DEFAULT '#3b82f6'::text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.ht_calendar_feed (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  source_type text NOT NULL DEFAULT 'ics'::text,
  feed_url text NOT NULL,
  is_active boolean DEFAULT true,
  last_synced_at timestamp with time zone,
  last_error text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.ht_task (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  source_type text NOT NULL DEFAULT 'manual'::text,
  feed_id uuid,
  source_event_uid text,
  title text NOT NULL,
  course_name text,
  description text,
  due_at timestamp with time zone,
  is_all_day boolean DEFAULT false,
  status text NOT NULL DEFAULT 'open'::text,
  is_manual boolean DEFAULT true,
  priority integer DEFAULT 0,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ht_task_user_feed_event_uniq UNIQUE (user_id, feed_id, source_event_uid)
);

CREATE TABLE public.ht_daily_plan_item (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  task_id uuid NOT NULL,
  plan_date date NOT NULL,
  position integer DEFAULT 0,
  note text,
  mode text DEFAULT 'copy'::text,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.ht_time_block (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  task_id uuid,
  plan_date date NOT NULL,
  start_at timestamp with time zone NOT NULL,
  end_at timestamp with time zone NOT NULL,
  status text DEFAULT 'planned'::text,
  created_at timestamp with time zone DEFAULT now()
);

-- 2. ROW LEVEL SECURITY (RLS)
-- Each user can only see/modify their own data.

ALTER TABLE public.ht_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ht_course ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ht_calendar_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ht_task ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ht_daily_plan_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ht_time_block ENABLE ROW LEVEL SECURITY;

CREATE POLICY ht_profile_self ON public.ht_profile FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY ht_course_self ON public.ht_course FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY ht_feed_self ON public.ht_calendar_feed FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY ht_task_self ON public.ht_task FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY ht_dpi_self ON public.ht_daily_plan_item FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY ht_tb_self ON public.ht_time_block FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. AUTO-CREATE PROFILE ON SIGNUP
-- When a user signs up via Supabase Auth, automatically
-- create a row in ht_profile for them.

CREATE OR REPLACE FUNCTION public.ht_handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
begin
  insert into public.ht_profile (id, display_name)
  values (new.id, coalesce(new.email, 'Student'))
  on conflict (id) do nothing;
  return new;
end;
$$;

CREATE TRIGGER ht_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION ht_handle_new_user();
