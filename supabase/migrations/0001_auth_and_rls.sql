-- ARCH-X — Real auth identity + locked-down Row Level Security
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query).
--
-- What it does:
--   * Ties every profile/VM row to a real auth.users id (no more username-only keys).
--   * Auto-creates a profile row on signup from the chosen username.
--   * Locks RLS so users can READ public data but only WRITE their own rows.
--   * Exposes a read-only public leaderboard view.
--
-- NOTE ON EXISTING DATA: the previous schema keyed rows by `username` with public
-- read/write. Those rows cannot be auto-linked to auth users. For an early-stage
-- project the simplest path is to start fresh (drop the old tables first). If you
-- have data to keep, migrate it manually by mapping usernames to new auth user ids.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. PROFILES
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id                   uuid primary key references auth.users(id) on delete cascade,
  username             text unique not null,
  callsign             text default 'Security Operator',
  accent_color         text default 'cyan',
  xp                   integer default 0,
  level                integer default 1,
  completed_courses    text[] default array[]::text[],
  completed_osint      text[] default array[]::text[],
  bio                  text default '',
  avatar               text default '',
  last_diagnostics_run bigint default 0,
  updated_at           timestamptz default timezone('utc', now()) not null
);

alter table public.profiles enable row level security;

drop policy if exists "Allow public profiles access" on public.profiles;
drop policy if exists "profiles_select_public" on public.profiles;
drop policy if exists "profiles_insert_own"   on public.profiles;
drop policy if exists "profiles_update_own"   on public.profiles;
drop policy if exists "profiles_delete_own"   on public.profiles;

-- Anyone may read profiles (needed for the public leaderboard).
create policy "profiles_select_public" on public.profiles
  for select using (true);

-- A user may only create / edit / delete their OWN profile row.
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_delete_own" on public.profiles
  for delete using (auth.uid() = id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Auto-create a profile when a new auth user signs up
--    (username comes from the signUp metadata; falls back to the email handle)
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. USER_VMS (owner-only)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.user_vms (
  id             uuid default gen_random_uuid() primary key,
  user_id        uuid not null references auth.users(id) on delete cascade,
  course_id      text not null,
  status         text default 'off',     -- 'off' | 'provisioning' | 'running'
  ip_address     text,
  port           integer,
  uptime_seconds integer default 0,
  files_json     jsonb default '[]'::jsonb,
  flag           text,
  solved         boolean default false,
  cpu_usage      float default 0.0,
  ram_usage      float default 0.0,
  created_at     timestamptz default timezone('utc', now()) not null,
  unique (user_id, course_id)
);

alter table public.user_vms enable row level security;

drop policy if exists "Allow public user_vms access" on public.user_vms;
drop policy if exists "user_vms_owner" on public.user_vms;

create policy "user_vms_owner" on public.user_vms
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. COMMUNITY IDEAS
--    Interim hardening: public read, authenticated insert of your OWN row.
--    Vote updates are allowed for any authenticated user for now; this is
--    replaced by a dedicated votes table + atomic RPC in the community PR.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.community_ideas (
  id        text primary key,
  user_id   uuid references auth.users(id) on delete set null,
  title     text not null,
  "desc"    text default '',
  category  text default 'Feature',
  votes     integer default 1,
  author    text,
  "timestamp" bigint
);

alter table public.community_ideas enable row level security;

drop policy if exists "community_select_public" on public.community_ideas;
drop policy if exists "community_insert_auth"   on public.community_ideas;
drop policy if exists "community_update_auth"   on public.community_ideas;

create policy "community_select_public" on public.community_ideas
  for select using (true);
create policy "community_insert_auth" on public.community_ideas
  for insert with check (auth.uid() = user_id);
create policy "community_update_auth" on public.community_ideas
  for update using (auth.uid() is not null);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Public leaderboard (read-only view over profiles)
-- ─────────────────────────────────────────────────────────────────────────────
create or replace view public.leaderboard as
  select
    username,
    callsign,
    xp,
    level,
    coalesce(array_length(completed_courses, 1), 0) as completed_count
  from public.profiles
  order by xp desc
  limit 100;

grant select on public.leaderboard to anon, authenticated;
