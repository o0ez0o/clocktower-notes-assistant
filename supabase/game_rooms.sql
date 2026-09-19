-- Run this migration in the Supabase SQL editor.  The public app uses only
-- VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY; never expose service_role.
create extension if not exists pgcrypto;

create table if not exists public.game_rooms (
  id uuid primary key default gen_random_uuid(),
  room_code char(7) not null unique check (room_code ~ '^[A-NP-Z1-9]{7}$'),
  room_name text not null default '未命名游戏局' check (char_length(room_name) between 1 and 30),
  game_type text not null check (char_length(game_type) <= 160),
  status text not null default 'waiting' check (status in ('waiting','active','finished','abandoned')),
  game_state jsonb not null default '{"day":1,"phase":"setup","nominations":[],"deaths":[],"peacefulDays":[],"publicAnnouncements":[],"gameEvents":[]}'::jsonb,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  updated_at timestamptz not null default now(),
  finished_at timestamptz,
  result jsonb,
  revision integer not null default 0 check (revision >= 0)
);
create index if not exists game_rooms_room_code_idx on public.game_rooms(room_code);

-- Safe to re-run when upgrading an existing project.
alter table public.game_rooms add column if not exists room_name text not null default '未命名游戏局';
alter table public.game_rooms drop constraint if exists game_rooms_room_name_check;
alter table public.game_rooms add constraint game_rooms_room_name_check check (char_length(room_name) between 1 and 30);

create table if not exists public.game_events (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.game_rooms(id) on delete cascade,
  event_type text not null check (event_type in ('nomination','vote','execution','death','phase_change','result')),
  event_data jsonb not null,
  created_at timestamptz not null default now(),
  revision integer not null check (revision >= 0)
);
create index if not exists game_events_room_revision_idx on public.game_events(room_id, revision);

alter table public.game_rooms enable row level security;
alter table public.game_events enable row level security;
grant usage on schema public to anon;
grant select, insert, update on public.game_rooms to anon;
grant select, insert on public.game_events to anon;

-- A caller may only see/update the one code it has placed in X-Room-Code.
-- This stops `select=*` enumeration even when the anonymous key is public.
create policy "anon can read one room by code" on public.game_rooms for select to anon
  using (room_code = ((current_setting('request.headers', true)::jsonb ->> 'x-room-code')::char(7)));
create policy "anon can create validated room" on public.game_rooms for insert to anon
  with check (room_code ~ '^[A-NP-Z1-9]{7}$' and jsonb_typeof(game_state) = 'object' and octet_length(game_state::text) < 65536);
create policy "anon can update public room state" on public.game_rooms for update to anon
  using (room_code = ((current_setting('request.headers', true)::jsonb ->> 'x-room-code')::char(7)) and room_code ~ '^[A-NP-Z1-9]{7}$')
  with check (room_code = ((current_setting('request.headers', true)::jsonb ->> 'x-room-code')::char(7)) and room_code ~ '^[A-NP-Z1-9]{7}$' and jsonb_typeof(game_state) = 'object' and octet_length(game_state::text) < 65536 and revision >= 0);
create policy "anon can read one room events" on public.game_events for select to anon using (
  exists (select 1 from public.game_rooms r where r.id = room_id and r.room_code = ((current_setting('request.headers', true)::jsonb ->> 'x-room-code')::char(7)) )
);
create policy "anon can insert constrained events" on public.game_events for insert to anon
  with check (jsonb_typeof(event_data) = 'object' and octet_length(event_data::text) < 16384 and exists (select 1 from public.game_rooms r where r.id = room_id and r.room_code = ((current_setting('request.headers', true)::jsonb ->> 'x-room-code')::char(7)) ));

do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'game_rooms'
  ) then
    alter publication supabase_realtime add table public.game_rooms;
  end if;
end $$;

-- Deliberately exposes only the newest 100 room summaries requested by the
-- product. Exact room reads and writes remain protected by X-Room-Code RLS.
create or replace function public.list_shared_game_rooms()
returns setof public.game_rooms
language sql
stable
security definer
set search_path = public
as $$
  select * from public.game_rooms
  where status <> 'abandoned'
  order by updated_at desc
  limit 100;
$$;
revoke all on function public.list_shared_game_rooms() from public;
grant execute on function public.list_shared_game_rooms() to anon;

-- Recommended hardening for production: move create/update into SECURITY
-- DEFINER RPC functions, validate allowed JSON keys and rate-limit them at an
-- Edge Function. This client already performs optimistic concurrency through
-- revision=eq.<current revision> and only sends public facts.
