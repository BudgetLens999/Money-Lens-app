export const dynamic = 'force-dynamic'

import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { createClient } from '../lib/supabase'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resetSent, setResetSent] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
    if (loginError) {
      setError('Invalid email or password')
      setLoading(false)
      return
    }
    router.push('/dashboard')
  }

async function handleReset() {
  if (!email) { setError('Enter your email first'); return }
  const supabase = createClient()
  const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://budgetperiscope.com/auth/callback',
  })
  if (resetError) {
    setError(resetError.message)
  } else {
    setResetSent(true)
  }
}

  return (
    <>
      <Head><title>Sign in — MoneyLens</title></Head>
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-4">
        <Link href="/" className="font-serif text-2xl text-stone-900 mb-8">
          Money<span className="text-amber-700 italic">Lens</span>
        </Link>
        <div className="card p-8 w-full max-w-sm">
          <h1 className="text-xl font-semibold text-stone-900 mb-6">Sign in</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}
          {resetSent && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-4">
              Password reset email sent — check your inbox.
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Email</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Password</label>
              <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full text-sm py-3 disabled:opacity-50">
              {loading ? 'Signing in...' : 'Sign in →'}
            </button>
          </form>

          <button onClick={handleReset} className="text-xs text-stone-400 hover:text-amber-700 mt-3 block w-full text-center">
            Forgot password?
          </button>

          <p className="text-center text-stone-500 text-xs mt-4">
            No account?{' '}
            <Link href="/signup" className="text-amber-700 hover:underline">Start free trial</Link>
          </p>
        </div>
      </div>
    </>
  )
}
