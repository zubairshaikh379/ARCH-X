import { createClient } from "@supabase/supabase-js";

// Supabase Connection Configuration
// We use the credentials provided directly by the user. If the user wants to configure custom credentials,
// they can define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in their Vercel environment settings.
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || "https://radhriwyqjchkbqooopw.supabase.co";
const SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhZGhyaXd5cWpjaGticW9vb3B3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxMTI1MzcsImV4cCI6MjA5NzY4ODUzN30.YR9Ys3hWyRv4DCwmv_uvY1GfDDwQU2qf_Yxv8dPbXZo";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper to check if Supabase is properly configured and reachable
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { data, error } = await supabase.from("profiles").select("count").limit(1);
    if (error) {
      console.warn("Supabase profiles table not found or query failed. Falling back to robust local database. Details:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("Supabase connection failed. Using local storage fallback.");
    return false;
  }
}

/**
 * SQL SCHEMA DESIGN (Run this inside the Supabase SQL Editor to initialize your database):
 * 
 * -- 1. Create Profiles Table (Syncs User Progress)
 * create table if not exists public.profiles (
 *   username text primary key,
 *   callsign text default 'Security Operator',
 *   accent_color text default 'slate',
 *   xp integer default 0,
 *   level integer default 1,
 *   completed_courses text[] default array[]::text[],
 *   completed_osint text[] default array[]::text[],
 *   updated_at timestamp with time zone default timezone('utc'::text, now()) not null
 * );
 * 
 * -- 2. Create User VMs Table (Durable dynamic VM container orchestration state)
 * create table if not exists public.user_vms (
 *   id uuid default gen_random_uuid() primary key,
 *   username text not null,
 *   course_id text not null,
 *   status text default 'off', -- 'off', 'provisioning', 'running'
 *   ip_address text,
 *   port integer,
 *   uptime_seconds integer default 0,
 *   files_json jsonb default '[]'::jsonb, -- Store the active virtual files of the container VM
 *   flag text,
 *   solved boolean default false,
 *   cpu_usage float default 0.0,
 *   ram_usage float default 0.0,
 *   created_at timestamp with time zone default timezone('utc'::text, now()) not null,
 *   unique (username, course_id)
 * );
 * 
 * -- Enable Row Level Security (RLS) or leave public for testing
 * alter table public.profiles enable row level security;
 * alter table public.user_vms enable row level security;
 * 
 * create policy "Allow public profiles access" on public.profiles for all using (true) with check (true);
 * create policy "Allow public user_vms access" on public.user_vms for all using (true) with check (true);
 */
