import { ArrowRight, CheckCircle2, Eye, EyeOff, HeartPulse, Lock } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AppFrame } from '../components/Layout.tsx'
import { PrimaryButton } from '../components/ui/PrimaryButton.tsx'
import { useMoodMap } from '../context/MoodMapContext.tsx'

export function LoginPage() {
  const navigate = useNavigate()
  const { session, ready, selectedHabits, signIn } = useMoodMap()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (ready && session) return <Navigate to={selectedHabits.length ? '/check-in' : '/habits'} replace />

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setNotice(null)
    if (mode === 'signup' && password.length < 8) {
      setError('Use at least 8 characters for your password.')
      return
    }
    setBusy(true)
    try {
      const result = await signIn(mode, email, password)
      if (result.needsConfirmation) {
        setNotice('Account created. Check your inbox to confirm your email, then sign in.')
        setMode('login')
      } else {
        navigate(result.hasHabits ? '/check-in' : '/habits')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setPassword('')
      setBusy(false)
    }
  }

  const isLogin = mode === 'login'

  return <AppFrame><section className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.1fr_.9fr] lg:py-16"><div className="max-w-xl"><div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#e5f3e8] px-3 py-1.5 text-sm font-semibold text-[#24643f]"><HeartPulse size={16} />A better way to notice your days</div><h1 className="max-w-lg text-5xl font-bold tracking-[-0.06em] text-[#17221e] sm:text-6xl">Know what helps you feel like <span className="text-[#3d8a5c]">you.</span></h1><p className="mt-6 max-w-md text-lg leading-8 text-[#65726b]">MoodMap turns small daily check-ins into a clearer view of the habits that support your wellbeing.</p><div className="mt-8 flex flex-wrap gap-4 text-sm font-medium text-[#53625a]"><span className="inline-flex items-center gap-2"><CheckCircle2 size={17} className="text-[#3d8a5c]" />Takes less than a minute</span><span className="inline-flex items-center gap-2"><CheckCircle2 size={17} className="text-[#3d8a5c]" />Built around you</span></div></div>
    <form onSubmit={onSubmit} className="rounded-3xl border border-white bg-white p-6 shadow-2xl shadow-[#183f2d]/10 sm:p-8">
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#47855f]">{isLogin ? 'Welcome back' : 'New here'}</p>
      <h2 className="mt-3 text-3xl font-bold tracking-[-0.045em]">{isLogin ? 'Start your daily reset.' : 'Create your MoodMap.'}</h2>
      <label className="mt-8 block text-sm font-semibold text-[#3b4941]" htmlFor="email">Email address</label>
      <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="mt-2 w-full rounded-xl border border-[#dce4de] bg-[#fafcfb] px-4 py-3.5 outline-none transition placeholder:text-[#9ba79f] focus:border-[#4e9667] focus:ring-4 focus:ring-[#dff1e3]" />
      <label className="mt-5 block text-sm font-semibold text-[#3b4941]" htmlFor="password">Password</label>
      <div className="relative mt-2">
        <input id="password" type={showPassword ? 'text' : 'password'} autoComplete={isLogin ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={isLogin ? 'Your password' : 'At least 8 characters'} required minLength={isLogin ? 1 : 8} className="w-full rounded-xl border border-[#dce4de] bg-[#fafcfb] py-3.5 pl-4 pr-12 outline-none transition placeholder:text-[#9ba79f] focus:border-[#4e9667] focus:ring-4 focus:ring-[#dff1e3]" />
        <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute inset-y-0 right-0 grid w-12 place-items-center text-[#839087] hover:text-[#173c2c]">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
      </div>
      {error && <p role="alert" className="mt-4 rounded-xl bg-[#fbeaea] px-4 py-3 text-sm font-semibold text-[#a03b3b]">{error}</p>}
      {notice && <p className="mt-4 rounded-xl bg-[#e9f5eb] px-4 py-3 text-sm font-semibold text-[#2c7047]">{notice}</p>}
      <PrimaryButton type="submit" disabled={busy} label={busy ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'} icon={<ArrowRight size={18} />} className="mt-5 w-full justify-center px-4 py-3.5" />
      <p className="mt-5 text-center text-sm text-[#68756e]">{isLogin ? 'New to MoodMap?' : 'Already have an account?'} <button type="button" onClick={() => { setMode(isLogin ? 'signup' : 'login'); setError(null); setNotice(null) }} className="font-bold text-[#3d8a5c] hover:text-[#173c2c]">{isLogin ? 'Create an account' : 'Sign in'}</button></p>
      <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-[#839087]"><Lock size={12} />Your check-ins are private to your account</p>
    </form></section></AppFrame>
}
