"""MoodMap backend (FastAPI).

Runs as a Python serverless function on Vercel. Every request from the React
frontend goes through this API; the browser never talks to Supabase directly,
so the Supabase keys only exist as server-side environment variables.
"""

import os
from datetime import date, datetime, timedelta, timezone
from typing import Optional

import httpx
from fastapi import Depends, FastAPI, Header, HTTPException, Query
from pydantic import BaseModel, Field

app = FastAPI(title="MoodMap API")

HABIT_IDS = {"sleep", "move", "water", "focus", "connect", "outside"}
HABIT_LABELS = {
    "sleep": "Sleep 7+ hours",
    "move": "Move my body",
    "water": "Drink enough water",
    "focus": "Make time to focus",
    "connect": "Connect with someone",
    "outside": "Get outside",
}


# ---------- Supabase configuration (environment variables only) ----------

def _env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise HTTPException(status_code=500, detail=f"Server is missing the {name} environment variable")
    return value


def _supabase_url() -> str:
    return _env("SUPABASE_URL").rstrip("/")


def _key_headers(key: str) -> dict:
    # Legacy Supabase keys are JWTs and also go in the Authorization header.
    # Newer sb_publishable_ / sb_secret_ keys only need the apikey header.
    headers = {"apikey": key}
    if key.startswith("eyJ"):
        headers["Authorization"] = f"Bearer {key}"
    return headers


def _db_headers() -> dict:
    return _key_headers(_env("SUPABASE_SERVICE_ROLE_KEY"))


def _client() -> httpx.Client:
    return httpx.Client(timeout=10.0)


def _db(method: str, table: str, params: Optional[dict] = None, json=None, prefer: Optional[str] = None):
    headers = {**_db_headers(), "Content-Type": "application/json"}
    if prefer:
        headers["Prefer"] = prefer
    with _client() as client:
        response = client.request(method, f"{_supabase_url()}/rest/v1/{table}", params=params, json=json, headers=headers)
    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail="Database request failed")
    return response.json() if response.content else None


# ---------- Authentication ----------

class Credentials(BaseModel):
    email: str = Field(min_length=3, max_length=254)
    password: str = Field(min_length=8, max_length=72)


def _auth_error(response: httpx.Response, fallback: str) -> HTTPException:
    try:
        body = response.json()
        message = body.get("msg") or body.get("error_description") or body.get("message") or fallback
    except ValueError:
        message = fallback
    return HTTPException(status_code=400 if response.status_code < 500 else 502, detail=message)


def _session_payload(body: dict) -> dict:
    return {
        "access_token": body["access_token"],
        "expires_in": body.get("expires_in"),
        "email": body.get("user", {}).get("email"),
    }


@app.post("/api/auth/signup")
def signup(credentials: Credentials):
    with _client() as client:
        response = client.post(
            f"{_supabase_url()}/auth/v1/signup",
            json={"email": credentials.email.strip().lower(), "password": credentials.password},
            headers=_key_headers(_env("SUPABASE_ANON_KEY")),
        )
    if response.status_code >= 400:
        raise _auth_error(response, "Could not create the account")
    body = response.json()
    if "access_token" not in body:
        return {"needs_confirmation": True}
    return _session_payload(body)


@app.post("/api/auth/login")
def login(credentials: Credentials):
    with _client() as client:
        response = client.post(
            f"{_supabase_url()}/auth/v1/token",
            params={"grant_type": "password"},
            json={"email": credentials.email.strip().lower(), "password": credentials.password},
            headers=_key_headers(_env("SUPABASE_ANON_KEY")),
        )
    if response.status_code >= 400:
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    return _session_payload(response.json())


def current_user(authorization: Optional[str] = Header(default=None)) -> dict:
    """Checks the user's access token with Supabase Auth on every protected request."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Please sign in")
    token = authorization.split(" ", 1)[1]
    with _client() as client:
        response = client.get(
            f"{_supabase_url()}/auth/v1/user",
            headers={"apikey": _env("SUPABASE_ANON_KEY"), "Authorization": f"Bearer {token}"},
        )
    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Your session has expired, please sign in again")
    user = response.json()
    return {"id": user["id"], "email": user.get("email")}


# ---------- Helpers ----------

def _parse_day(value: str) -> date:
    try:
        day = date.fromisoformat(value)
    except ValueError:
        raise HTTPException(status_code=422, detail="Date must be YYYY-MM-DD")
    # The browser sends its local date; allow for time zones but block far-off dates.
    if abs((day - date.today()).days) > 1:
        raise HTTPException(status_code=422, detail="Date is out of range")
    return day


def _clean_habits(values: list[str]) -> list[str]:
    unknown = [value for value in values if value not in HABIT_IDS]
    if unknown:
        raise HTTPException(status_code=422, detail="Unknown habit")
    return sorted(set(values))


def _get_habits(user_id: str) -> list[str]:
    rows = _db("GET", "user_habits", params={"user_id": f"eq.{user_id}", "select": "habits"})
    return rows[0]["habits"] if rows else []


# ---------- Habits ----------

class HabitSelection(BaseModel):
    habits: list[str] = Field(min_length=1, max_length=6)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/me")
def me(user: dict = Depends(current_user)):
    return {"email": user["email"], "habits": _get_habits(user["id"])}


@app.put("/api/habits")
def save_habits(selection: HabitSelection, user: dict = Depends(current_user)):
    habits = _clean_habits(selection.habits)
    _db(
        "POST",
        "user_habits",
        params={"on_conflict": "user_id"},
        json={"user_id": user["id"], "habits": habits, "updated_at": datetime.now(timezone.utc).isoformat()},
        prefer="resolution=merge-duplicates,return=minimal",
    )
    return {"habits": habits}


# ---------- Check-ins ----------

class CheckIn(BaseModel):
    date: str
    mood: int = Field(ge=1, le=5)
    completed_habits: list[str] = Field(default_factory=list, max_length=6)


@app.get("/api/checkins/today")
def today_checkin(day: str = Query(alias="date"), user: dict = Depends(current_user)):
    checkin_day = _parse_day(day)
    rows = _db(
        "GET",
        "checkins",
        params={
            "user_id": f"eq.{user['id']}",
            "checkin_date": f"eq.{checkin_day.isoformat()}",
            "select": "checkin_date,mood,completed_habits",
        },
    )
    return {"checkin": rows[0] if rows else None}


@app.post("/api/checkins")
def save_checkin(checkin: CheckIn, user: dict = Depends(current_user)):
    checkin_day = _parse_day(checkin.date)
    rows = _db(
        "POST",
        "checkins",
        params={"on_conflict": "user_id,checkin_date"},
        json={
            "user_id": user["id"],
            "checkin_date": checkin_day.isoformat(),
            "mood": checkin.mood,
            "completed_habits": _clean_habits(checkin.completed_habits),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        },
        prefer="resolution=merge-duplicates,return=representation",
    )
    saved = rows[0]
    return {"checkin": {k: saved[k] for k in ("checkin_date", "mood", "completed_habits")}}


# ---------- Weekly summary, streak and insight ----------

def _streak(days_with_checkin: set[date], today: date) -> int:
    cursor = today if today in days_with_checkin else today - timedelta(days=1)
    count = 0
    while cursor in days_with_checkin:
        count += 1
        cursor -= timedelta(days=1)
    return count


def _insight(rows: list[dict], habits: list[str]) -> str:
    best = None
    for habit in habits:
        with_habit = [r["mood"] for r in rows if habit in r["completed_habits"]]
        without_habit = [r["mood"] for r in rows if habit not in r["completed_habits"]]
        if not with_habit or not without_habit:
            continue
        lift = sum(with_habit) / len(with_habit) - sum(without_habit) / len(without_habit)
        if best is None or lift > best[1]:
            best = (habit, lift)
    if best and best[1] > 0:
        return f"Your mood averages {best[1]:.1f} points higher on days you {HABIT_LABELS[best[0]].lower()}."
    if len(rows) < 3:
        return "Check in for a few more days and MoodMap will show which habit lines up with your better days."
    return "No single habit stands out yet. Keep checking in to sharpen the picture."


@app.get("/api/summary")
def summary(day: str = Query(alias="date"), user: dict = Depends(current_user)):
    today = _parse_day(day)
    history_start = today - timedelta(days=89)
    rows = _db(
        "GET",
        "checkins",
        params={
            "user_id": f"eq.{user['id']}",
            "checkin_date": f"gte.{history_start.isoformat()}",
            "select": "checkin_date,mood,completed_habits",
            "order": "checkin_date.asc",
        },
    )
    by_day = {date.fromisoformat(r["checkin_date"]): r for r in rows}
    week_days = [today - timedelta(days=offset) for offset in range(6, -1, -1)]
    week = [
        {
            "date": d.isoformat(),
            "day": d.strftime("%a"),
            "mood": by_day[d]["mood"] if d in by_day else None,
            "completed_habits": by_day[d]["completed_habits"] if d in by_day else [],
        }
        for d in week_days
    ]
    week_rows = [by_day[d] for d in week_days if d in by_day]
    average = round(sum(r["mood"] for r in week_rows) / len(week_rows), 1) if week_rows else None
    habits = _get_habits(user["id"])
    habit_rates = {
        habit: round(100 * sum(habit in r["completed_habits"] for r in week_rows) / len(week_rows)) if week_rows else 0
        for habit in HABIT_IDS
    }
    return {
        "week": week,
        "average_mood": average,
        "checkins_this_week": len(week_rows),
        "total_checkins": len(rows),
        "streak": _streak(set(by_day), today),
        "habit_rates": habit_rates,
        "insight": _insight(rows, habits),
    }
