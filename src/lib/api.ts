// All data requests go to our own Python backend under /api.
// The frontend never holds Supabase keys; it only keeps the signed-in user's access token.

const TOKEN_KEY = 'moodmap.session'

export type Session = { accessToken: string; email: string }

export type CheckIn = { checkin_date: string; mood: number; completed_habits: string[] }

export type WeekDay = { date: string; day: string; mood: number | null; completed_habits: string[] }

export type Summary = {
  week: WeekDay[]
  average_mood: number | null
  checkins_this_week: number
  total_checkins: number
  streak: number
  habit_rates: Record<string, number>
  insight: string
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export function loadSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(TOKEN_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

export function storeSession(session: Session | null) {
  try {
    if (session) sessionStorage.setItem(TOKEN_KEY, JSON.stringify(session))
    else sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    /* storage unavailable: session lasts for this page load only */
  }
}

export function localDate(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  const response = await fetch(`/api${path}`, { ...options, headers })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const detail = typeof body.detail === 'string' ? body.detail : `Something went wrong (error ${response.status}). Please try again.`
    throw new ApiError(detail, response.status)
  }
  return body as T
}

type AuthResponse = { access_token?: string; email?: string; needs_confirmation?: boolean }

export const api = {
  signup: (email: string, password: string) =>
    request<AuthResponse>('/auth/signup', { method: 'POST', body: JSON.stringify({ email, password }) }),
  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: (token: string) => request<{ email: string; habits: string[] }>('/me', {}, token),
  saveHabits: (token: string, habits: string[]) =>
    request<{ habits: string[] }>('/habits', { method: 'PUT', body: JSON.stringify({ habits }) }, token),
  todayCheckIn: (token: string) =>
    request<{ checkin: CheckIn | null }>(`/checkins/today?date=${localDate()}`, {}, token),
  saveCheckIn: (token: string, mood: number, completedHabits: string[]) =>
    request<{ checkin: CheckIn }>(
      '/checkins',
      { method: 'POST', body: JSON.stringify({ date: localDate(), mood, completed_habits: completedHabits }) },
      token,
    ),
  summary: (token: string) => request<Summary>(`/summary?date=${localDate()}`, {}, token),
}
