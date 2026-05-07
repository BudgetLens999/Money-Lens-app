import { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { createClient } from '../lib/supabase'
import Link from 'next/link'

type User = { id: string; email: string; user_metadata: any }
type AccessStatus = 'active' | 'trialing' | 'free_account' | 'expired' | 'none' | 'loading'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [access, setAccess] = useState<AccessStatus>('loading')
  const [daysLeft, setDaysLeft] = useState<number | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUser(user as any)

      const res = await fetch('/api/check-access', {
        headers: { 'x-user-id': user.id }
      })
      const data = await res.json()
      setAccess(data.status)
      setDaysLeft(data.daysLeft)
    })
  }, [router])

  const supabase = createClient()
  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (access === 'loading') {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-stone-400">Loading...</p></div>
  }

  // Hard paywall
  if (access === 'expired' || access === 'none') {
    return (
      <>
        <Head><title>Subscribe — MoneyLens</title></Head>
        <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-4">
          <div className="font-serif text-2xl text-stone-900 mb-8">
            Money<span className="text-amber-700 italic">Lens</span>
          </div>
          <div className="card p-8 max-w-md w-full text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h1 className="text-xl font-semibold text-stone-900 mb-2">
              {access === 'expired' ? 'Your trial has ended' : 'Subscription required'}
            </h1>
            <p className="text-stone-500 text-sm mb-6">
              Subscribe to continue tracking your finances and getting AI-powered insights.
            </p>
            <div className="text-3xl font-bold text-stone-900 mb-1">$20<span className="text-stone-400 text-lg font-normal">/month</span></div>
            <p className="text-stone-400 text-xs mb-6">Cancel anytime</p>
            <a href="/api/create-portal" className="btn-primary block text-sm py-3 mb-3">
              Subscribe now →
            </a>
            <button onClick={handleLogout} className="text-stone-400 text-xs hover:text-stone-600">
              Sign out
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head><title>Dashboard — MoneyLens</title></Head>
      <div className="min-h-screen bg-stone-50">
        {/* Nav */}
        <nav className="bg-white border-b border-stone-200 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
            <span className="font-serif text-xl text-stone-900">
              Money<span className="text-amber-700 italic">Lens</span>
            </span>
            <div className="flex items-center gap-4">
              {access === 'trialing' && daysLeft !== null && (
                <span className="text-xs bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1 rounded-full">
                  {daysLeft} days left in trial
                </span>
              )}
              <Link href="/account" className="text-sm text-stone-500 hover:text-stone-800">Account</Link>
              <button onClick={handleLogout} className="text-sm text-stone-500 hover:text-stone-800">Sign out</button>
            </div>
          </div>
        </nav>

        {/* Welcome banner */}
        {router.query.welcome && (
          <div className="bg-green-50 border-b border-green-200 px-6 py-3 text-center text-sm text-green-700">
            🎉 Welcome to MoneyLens! Your 30-day free trial has started.
          </div>
        )}

        {/* Main app - embed the BudgetLens iframe */}
        <div className="max-w-5xl mx-auto px-4 py-6">
          <iframe
            src="/app"
            className="w-full rounded-xl border border-stone-200 shadow-sm"
            style={{ height: 'calc(100vh - 120px)', minHeight: '600px' }}
            title="MoneyLens App"
          />
        </div>
      </div>
    </>
  )
}
