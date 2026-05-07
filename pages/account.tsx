export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { createClient } from '../lib/supabase'

export default function Account() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [access, setAccess] = useState<any>(null)
  const [affiliate, setAffiliate] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUser(user)
      const [accessRes, affRes] = await Promise.all([
        fetch('/api/check-access', { headers: { 'x-user-id': user.id } }),
        fetch('/api/affiliate', { headers: { 'x-user-id': user.id } }),
      ])
      setAccess(await accessRes.json())
      setAffiliate(await affRes.json())
      setLoading(false)
    })
  }, [router])

  async function createAffiliateAccount() {
    const res = await fetch('/api/affiliate', {
      method: 'POST',
      headers: { 'x-user-id': user.id },
    })
    const data = await res.json()
    setAffiliate(data)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-stone-400">Loading...</p></div>

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://yourapp.vercel.app'
  const referralLink = affiliate?.referral_code ? `${appUrl}/signup?ref=${affiliate.referral_code}` : null

  return (
    <>
      <Head><title>Account — MoneyLens</title></Head>
      <div className="min-h-screen bg-stone-50">
        <nav className="bg-white border-b border-stone-200 px-6 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="font-serif text-xl text-stone-900">
            Money<span className="text-amber-700 italic">Lens</span>
          </Link>
          <Link href="/dashboard" className="text-sm text-stone-500 hover:text-stone-800">← Dashboard</Link>
        </nav>

        <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">
          <h1 className="text-2xl font-serif text-stone-900">Your account</h1>

          {/* Subscription */}
          <div className="card p-6">
            <h2 className="font-semibold text-stone-900 mb-4">Subscription</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-600">
                  Status: <span className="font-medium capitalize">{access?.status?.replace('_', ' ')}</span>
                </p>
                {access?.daysLeft && (
                  <p className="text-sm text-amber-700">{access.daysLeft} days left in trial</p>
                )}
                <p className="text-sm text-stone-500 mt-1">{user?.email}</p>
              </div>
              <a
                href="/api/create-portal"
                className="btn-secondary text-sm py-2 px-4"
              >
                Manage billing →
              </a>
            </div>
          </div>

          {/* Affiliate */}
          <div className="card p-6">
            <h2 className="font-semibold text-stone-900 mb-1">Affiliate program</h2>
            <p className="text-sm text-stone-500 mb-4">Earn 20% ($4/month) for every paying user you refer. Paid monthly for up to 12 months per referral.</p>
            {affiliate?.referral_code ? (
              <div>
                <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-1.5">Your referral link</label>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={referralLink || ''}
                    className="input text-sm flex-1 bg-stone-50"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(referralLink || '')}
                    className="btn-secondary text-sm py-2 px-4"
                  >
                    Copy
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-stone-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-stone-900">{affiliate.referred_users}</div>
                    <div className="text-xs text-stone-500">Users referred</div>
                  </div>
                  <div className="bg-stone-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-700">${affiliate.total_earnings?.toFixed(2)}</div>
                    <div className="text-xs text-stone-500">Total earned</div>
                  </div>
                </div>
              </div>
            ) : (
              <button onClick={createAffiliateAccount} className="btn-primary text-sm py-2 px-5">
                Join affiliate program
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
