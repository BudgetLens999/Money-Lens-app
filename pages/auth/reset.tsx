export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { createClient } from '../../lib/supabase'

export default function ResetPassword() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    // The recovery token in the URL is exchanged for a session automatically
    // by the Supabase client. We just need to know a session exists before
    // letting the user submit a new password.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (updateError) {
      setError(updateError.message)
      return
    }
    setDone(true)
    setTimeout(() => router.push('/dashboard'), 1500)
  }

  return (
    <>
      <Head><title>Reset password â€” MoneyLens</title></Head>
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-4">
        <Link href="/" className="font-serif text-2xl text-stone-900 mb-8">
          Money<span className="text-amber-700 italic">Lens</span>
        </Link>
        <div className="card p-8 w-full max-w-sm">
          <h1 className="text-xl font-semibold text-stone-900 mb-6">Set a new password</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}
          {done && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-4">
              Password updated â€” redirecting...
            </div>
          )}

          {!ready && !done && (
            <p className="text-stone-500 text-sm">Confirming your reset link...</p>
          )}

          {ready && !done && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">New password</label>
                <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Confirm password</label>
                <input className="input" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required minLength={8} />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full text-sm py-3 disabled:opacity-50">
                {loading ? 'Updating...' : 'Update password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  )
}

