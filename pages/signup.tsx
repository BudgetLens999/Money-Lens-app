import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { createClient } from '../lib/supabase'

export default function Signup() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const ref = router.query.ref as string // affiliate referral code

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()

    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, referral_code: ref || null },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    })

    if (signupError) {
      setError(signupError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      // Create Stripe customer + trial subscription via API
      const res = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: data.user.id, email, name, ref }),
      })
      const result = await res.json()
      if (!res.ok) {
        setError(result.error || 'Failed to set up subscription')
        setLoading(false)
        return
      }
    }

    router.push('/dashboard?welcome=1')
  }

  return (
    <>
      <Head><title>Sign up — MoneyLens</title></Head>
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-4">
        <Link href="/" className="font-serif text-2xl text-stone-900 mb-8">
          Money<span className="text-amber-700 italic">Lens</span>
        </Link>
        <div className="card p-8 w-full max-w-sm">
          <h1 className="text-xl font-semibold text-stone-900 mb-1">Start your free trial</h1>
          <p className="text-stone-500 text-sm mb-6">30 days free · then $20/mo · cancel anytime</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Full name</label>
              <input className="input" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Jamie Jackson" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Email</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Password</label>
              <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 8 characters" minLength={8} required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full text-sm py-3 mt-2 disabled:opacity-50">
              {loading ? 'Creating account...' : 'Start free trial →'}
            </button>
          </form>

          <p className="text-center text-stone-500 text-xs mt-4">
            Already have an account?{' '}
            <Link href="/login" className="text-amber-700 hover:underline">Sign in</Link>
          </p>
        </div>
        <p className="text-stone-400 text-xs mt-4 text-center max-w-xs">
          By signing up you agree to our{' '}
          <Link href="/terms" className="underline">Terms</Link> and{' '}
          <Link href="/privacy" className="underline">Privacy Policy</Link>
        </p>
      </div>
    </>
  )
}
