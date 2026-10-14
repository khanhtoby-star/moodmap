/* This module intentionally exports the provider and its companion hook/state data. */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ApiError, api, loadSession, storeSession, type Session, type Summary } from '../lib/api.ts'

export const habits = [
  { id: 'sleep', label: 'Sleep 7+ hours', icon: '☾' },
  { id: 'move', label: 'Move my body', icon: '↗' },
  { id: 'water', label: 'Drink enough water', icon: '◒' },
  { id: 'focus', label: 'Make time to focus', icon: '◌' },
  { id: 'connect', label: 'Connect with someone', icon: '♡' },
  { id: 'outside', label: 'Get outside', icon: '☀' },
] as const

type MoodMapContextValue = {
  session: Session | null
  ready: boolean
  selectedHabits: string[]
  completedHabits: string[]
  selectedMood: number | null
  savedToday: boolean
  summary: Summary | null
  toggleSelectedHabit: (habitId: string) => void
  toggleCompletedHabit: (habitId: string) => void
  setSelectedMood: (mood: number) => void
  signIn: (mode: 'login' | 'signup', email: string, password: string) => Promise<{ needsConfirmation?: boolean; hasHabits: boolean }>
  signOut: () => void
  saveHabits: () => Promise<void>
  saveCheckIn: (completed?: string[]) => Promise<void>
  refreshSummary: () => Promise<void>
}

const MoodMapContext = createContext<MoodMapContextValue | null>(null)

export function MoodMapProvider({ children }: { children: ReactNode }) {
  const [initialSession] = useState<Session | null>(() => loadSession())
  const [session, setSession] = useState<Session | null>(initialSession)
  const [ready, setReady] = useState(initialSession === null)
  const [selectedHabits, setSelectedHabits] = useState<string[]>([])
  const [completedHabits, setCompletedHabits] = useState<string[]>([])
  const [selectedMood, setSelectedMood] = useState<number | null>(null)
  const [savedToday, setSavedToday] = useState(false)
  const [summary, setSummary] = useState<Summary | null>(null)

  const signOut = useCallback(() => {
    storeSession(null)
    setSession(null)
    setSelectedHabits([])
    setCompletedHabits([])
    setSelectedMood(null)
    setSavedToday(false)
    setSummary(null)
  }, [])

  // Any 401 from the backend means the token expired: sign the user out.
  const guard = useCallback(async <T,>(call: () => Promise<T>): Promise<T> => {
    try {
      return await call()
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) signOut()
      throw error
    }
  }, [signOut])

  const loadUserData = useCallback(async (token: string) => {
    const [profile, today] = await Promise.all([api.me(token), api.todayCheckIn(token)])
    setSelectedHabits(profile.habits)
    if (today.checkin) {
      setCompletedHabits(today.checkin.completed_habits)
      setSelectedMood(today.checkin.mood)
      setSavedToday(true)
    } else {
      setCompletedHabits([])
      setSelectedMood(null)
      setSavedToday(false)
    }
    return profile
  }, [])

  // On page refresh, restore the signed-in user's habits and today's check-in from the backend.
  useEffect(() => {
    if (!initialSession) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- state is set after the async request resolves
    guard(() => loadUserData(initialSession.accessToken))
      .catch(() => undefined)
      .finally(() => setReady(true))
  }, [initialSession, guard, loadUserData])

  const signIn = useCallback(async (mode: 'login' | 'signup', email: string, password: string) => {
    const response = mode === 'login' ? await api.login(email, password) : await api.signup(email, password)
    if (response.needs_confirmation || !response.access_token) return { needsConfirmation: true, hasHabits: false }
    const next = { accessToken: response.access_token, email: response.email ?? email }
    const profile = await loadUserData(next.accessToken)
    storeSession(next)
    setSession(next)
    return { hasHabits: profile.habits.length > 0 }
  }, [loadUserData])

  const saveHabits = useCallback(async () => {
    if (!session) return
    await guard(() => api.saveHabits(session.accessToken, selectedHabits))
    setCompletedHabits((current) => current.filter((id) => selectedHabits.includes(id)))
  }, [session, selectedHabits, guard])

  const refreshSummary = useCallback(async () => {
    if (!session) return
    setSummary(await guard(() => api.summary(session.accessToken)))
  }, [session, guard])

  const saveCheckIn = useCallback(async (completed?: string[]) => {
    if (!session || selectedMood === null) return
    const habitsToSave = (completed ?? completedHabits).filter((id) => selectedHabits.includes(id))
    const result = await guard(() => api.saveCheckIn(session.accessToken, selectedMood, habitsToSave))
    setCompletedHabits(result.checkin.completed_habits)
    setSavedToday(true)
  }, [session, selectedMood, completedHabits, selectedHabits, guard])

  const value = useMemo(
    () => ({
      session,
      ready,
      selectedHabits,
      completedHabits,
      selectedMood,
      savedToday,
      summary,
      toggleSelectedHabit: (habitId: string) => setSelectedHabits((current) =>
        current.includes(habitId) ? current.filter((id) => id !== habitId) : [...current, habitId]),
      toggleCompletedHabit: (habitId: string) => setCompletedHabits((current) =>
        current.includes(habitId) ? current.filter((id) => id !== habitId) : [...current, habitId]),
      setSelectedMood,
      signIn,
      signOut,
      saveHabits,
      saveCheckIn,
      refreshSummary,
    }),
    [session, ready, selectedHabits, completedHabits, selectedMood, savedToday, summary, signIn, signOut, saveHabits, saveCheckIn, refreshSummary],
  )

  return <MoodMapContext.Provider value={value}>{children}</MoodMapContext.Provider>
}

export function useMoodMap() {
  const context = useContext(MoodMapContext)
  if (!context) throw new Error('useMoodMap must be used within MoodMapProvider')
  return context
}
