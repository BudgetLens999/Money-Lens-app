export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { createClient } from '../lib/supabase'
import Link from 'next/link'

type AccessStatus = 'active' | 'trialing' | 'free_account' | 'expired' | 'none' | 'loading'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [access, setAccess] = useState<AccessStatus>('loading')
  const [daysLeft, setDaysLeft] = useState<number | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUser(user)
      try {
        const res = await fetch('/api/check-access', { headers: { 'x-user-id': user.id } })
        const data = await res.json()
        setAccess(data.status)
        setDaysLeft(data.daysLeft)
      } catch(e) {
        setAccess('active')
      }
    })
  }, [router])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  if (access === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <div className="text-2xl font-serif text-stone-900 mb-2">Money<span className="text-amber-700 italic">Lens</span></div>
          <p className="text-stone-400 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  if (access === 'expired' || access === 'none') {
    return (
      <>
        <Head><title>Subscribe — MoneyLens</title></Head>
        <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-4">
          <div className="font-serif text-2xl text-stone-900 mb-8">Money<span className="text-amber-700 italic">Lens</span></div>
          <div className="card p-8 max-w-md w-full text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h1 className="text-xl font-semibold text-stone-900 mb-2">
              {access === 'expired' ? 'Your trial has ended' : 'Subscription required'}
            </h1>
            <p className="text-stone-500 text-sm mb-6">Subscribe to continue tracking your finances.</p>
            <div className="text-3xl font-bold text-stone-900 mb-1">$20<span className="text-stone-400 text-lg font-normal">/month</span></div>
            <p className="text-stone-400 text-xs mb-6">Cancel anytime</p>
            <button onClick={handleLogout} className="text-stone-400 text-xs hover:text-stone-600 mt-4 block mx-auto">Sign out</button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head><title>MoneyLens — Dashboard</title></Head>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#faf8f5' }}>
        {/* Slim top bar */}
        <div style={{ background: '#fff', borderBottom: '1px solid #e7e5e4', padding: '0 20px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: '18px', color: '#1c1917' }}>
            Money<span style={{ color: '#b45309', fontStyle: 'italic' }}>Lens</span>
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {access === 'trialing' && daysLeft !== null && (
              <span style={{ fontSize: '12px', background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e', padding: '2px 10px', borderRadius: '999px' }}>
                {daysLeft} days left in trial
              </span>
            )}
            <Link href="/account" style={{ fontSize: '13px', color: '#78716c', textDecoration: 'none' }}>Account</Link>
            <button onClick={handleLogout} style={{ fontSize: '13px', color: '#78716c', background: 'none', border: 'none', cursor: 'pointer' }}>Sign out</button>
          </div>
        </div>

        {/* Full BudgetLens app in iframe */}
        <iframe
          src="/app.html"
          style={{ flex: 1, border: 'none', width: '100%' }}
          title="MoneyLens App"
        />
      </div>
    </>
  )
}

export async function getServerSideProps() {
  return { props: {} }
}
