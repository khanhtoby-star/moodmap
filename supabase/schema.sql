-- MoodMap database schema
-- Run once in Supabase: Dashboard > SQL Editor > New query > paste > Run

-- Which habits each user has chosen to track
create table if not exists public.user_habits (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  habits     text[] not null default '{}',
  updated_at timestamptz not null default now()
);

-- One check-in per user per day: mood (1-5) plus the habits completed that day
create table if not exists public.checkins (
  id               bigint generated always as identity primary key,
  user_id          uuid not null references auth.users (id) on delete cascade,
  checkin_date     date not null,
  mood             smallint not null check (mood between 1 and 5),
  completed_habits text[] not null default '{}',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (user_id, checkin_date)
);

create index if not exists checkins_user_date_idx on public.checkins (user_id, checkin_date desc);

-- Row Level Security is on with no public policies, so the public anon key
-- cannot read or write these tables. Only the Python backend, which holds the
-- service role key as an environment variable, can access the data.
alter table public.user_habits enable row level security;
alter table public.checkins enable row level security;
