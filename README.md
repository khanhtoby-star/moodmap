# MoodMap

MoodMap is a habit and mood tracker for young adults. Each day the user ticks off the habits they completed and picks a mood; the weekly mood map, streak and insight are then calculated from their saved check-ins so they can see which habits line up with their better days.

BUS4012 Vibe Coding for Startups, Assignment 3.

## Architecture

```
Browser (React + Vite + Tailwind)
        |  fetch /api/...   (user access token only, no database keys)
        v
Python backend (FastAPI, Vercel serverless function in /api)
        |  Supabase keys read from environment variables
        v
Supabase (Auth for accounts, Postgres for habits and check-ins)
```

The React app never talks to Supabase directly. Every request goes to the FastAPI backend, which checks the user's access token with Supabase Auth and then reads or writes the database with the service role key. Row Level Security is enabled on both tables with no public policies, so the public anon key cannot read user data.

## Project structure

```
api/index.py          FastAPI backend: auth, habits, check-ins, weekly summary
supabase/schema.sql   Database tables (run once in the Supabase SQL Editor)
src/                  React frontend
  lib/api.ts          All calls to the backend
  context/            App state (session, habits, today's check-in)
  pages/              Login, Habits, Check-in, Weekly map, Streak screens
  components/         Shared layout, navigation, buttons, cards
vercel.json           Routes /api/* to Python and everything else to React
requirements.txt      Python dependencies
.env.example          Names of the required environment variables (no values)
```

## API

| Method | Path | Purpose |
| --- | --- | --- |
| POST | /api/auth/signup | Create an account |
| POST | /api/auth/login | Sign in, returns an access token |
| GET | /api/me | Current user and chosen habits |
| PUT | /api/habits | Save chosen habits |
| GET | /api/checkins/today | Today's check-in, if saved |
| POST | /api/checkins | Save or update today's check-in |
| GET | /api/summary | Last 7 days, average mood, streak, insight |

## Environment variables

| Name | Where it is used |
| --- | --- |
| SUPABASE_URL | Backend only |
| SUPABASE_ANON_KEY | Backend only (Supabase Auth calls) |
| SUPABASE_SERVICE_ROLE_KEY | Backend only (database access) |

Locally they live in `.env` (ignored by Git). On Vercel they are set under Project Settings > Environment Variables.

## Run locally

```bash
npm install
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt uvicorn python-dotenv
# terminal 1: backend on port 8000
set -a; source .env; set +a; uvicorn api.index:app --reload --port 8000
# terminal 2: frontend on port 5173 (proxies /api to the backend)
npm run dev
```
