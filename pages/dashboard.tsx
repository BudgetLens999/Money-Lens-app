export const dynamic = 'force-dynamic'
import { useEffect, useState, useRef } from 'react'
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
  const [modalOpen, setModalOpen] = useState(false)
  const [reportEmail, setReportEmail] = useState('')
  const [sendStatus, setSendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [sendError, setSendError] = useState('')
  const [budgetData, setBudgetData] = useState<any>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

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

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (e.data && e.data.type === 'BUDGET_DATA') {
        setBudgetData(e.data)
        setModalOpen(true)
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  function handleEmailReportClick() {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage('REQUEST_BUDGET_DATA', '*')
    } else {
      setModalOpen(true)
    }
  }

  async function handleSendReport() {
    if (!reportEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reportEmail)) {
      setSendError('Please enter a valid email address.')
      return
    }
    setSendStatus('sending')
    setSendError('')
    try {
      const month = budgetData?.month || new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
      const res = await fetch('/api/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: reportEmail,
          userName: user?.email,
          month,
          totalSpent: budgetData?.totalSpent || 0,
          totalBudget: budgetData?.totalBudget || 0,
          categories: budgetData?.categories || [],
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setSendStatus('error')
        setSendError(data.error || 'Something went wrong.')
      } else {
        setSendStatus('sent')
      }
    } catch {
      setSendStatus('error')
      setSendError('Network error. Please try again.')
    }
  }

  function closeModal() {
    setModalOpen(false)
    setSendStatus('idle')
    setReportEmail('')
    setSendError('')
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
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-4">
        <Head><title>Subscribe - MoneyLens</title></Head>
        <div className="font-serif text-2xl text-stone-900 mb-8">Money<span className="text-amber-700 italic">Lens</span></div>
        <div className="card p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">Access Required</div>
          <h1 className="text-xl font-semibold text-stone-900 mb-2">
            {access === 'expired' ? 'Your trial has ended' : 'Subscription required'}
          </h1>
          <p className="text-stone-500 text-sm mb-6">Subscribe to continue tracking your finances.</p>
          <div className="text-3xl font-bold text-stone-900 mb-1">$20<span className="text-stone-400 text-lg font-normal">/month</span></div>
          <p className="text-stone-400 text-xs mb-6">Cancel anytime</p>
          <button onClick={handleLogout} className="text-stone-400 text-xs hover:text-stone-600 mt-4 block mx-auto">Sign out</button>
        </div>
      </div>
    )
  }

  const month = budgetData?.month || new Date().toLocaleString('default', { month: 'long', year: 'numeric' })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#faf8f5' }}>
      <Head><title>MoneyLens - Dashboard</title></Head>

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
          <button
            onClick={handleEmailReportClick}
            style={{ fontSize: '13px', color: '#fff', background: '#1e3a5f', border: 'none', borderRadius: '6px', padding: '4px 12px', cursor: 'pointer', fontWeight: 600 }}
          >
            Email Report
          </button>
          <button onClick={handleLogout} style={{ fontSize: '13px', color: '#78716c', background: 'none', border: 'none', cursor: 'pointer' }}>Sign out</button>
        </div>
      </div>

      <iframe
        ref={iframeRef}
        src="/app.html"
        style={{ flex: 1, border: 'none', width: '100%' }}
        title="MoneyLens App"
      />

      {modalOpen && (
        <div onClick={closeModal} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '12px', padding: '32px', width: '100%', maxWidth: '440px', boxShadow: '0 8px 32px rgba(0,0,0,0.16)' }}>
            {sendStatus === 'sent' ? (
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', margin: '0 0 8px' }}>Report sent!</p>
                <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#64748b' }}>Check <strong>{reportEmail}</strong> - it should arrive within a minute.</p>
                <button onClick={closeModal} style={{ padding: '10px 24px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Done</button>
              </div>
            ) : (
              <div>
                <p style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>Email your {month} report</p>
                <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#64748b' }}>We will send a budget summary to any email. No account connection required.</p>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Email address</label>
                <input
                  type="email"
                  value={reportEmail}
                  onChange={(e) => { setReportEmail(e.target.value); setSendError('') }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendReport()}
                  placeholder="you@example.com"
                  style={{ width: '100%', padding: '10px 12px', fontSize: '15px', border: `1px solid ${sendError ? '#dc2626' : '#d1d5db'}`, borderRadius: '8px', outline: 'none', boxSizing: 'border-box', color: '#1e293b', background: '#f9fafb' }}
                />
                {sendError && <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#dc2626' }}>{sendError}</p>}
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button onClick={closeModal} style={{ flex: 1, padding: '10px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button onClick={handleSendReport} disabled={sendStatus === 'sending'} style={{ flex: 2, padding: '10px', background: sendStatus === 'sending' ? '#93c5fd' : '#1e3a5f', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: sendStatus === 'sending' ? 'not-allowed' : 'pointer' }}>
                    {sendStatus === 'sending' ? 'Sending...' : 'Send Report'}
                  </button>
                </div>
                {status === 'error' && <p style={{ margin: '12px 0 0', fontSize: '13px', color: '#dc2626', textAlign: 'center' }}>{sendError}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export async function getServerSideProps() {
  return { props: {} }
}
