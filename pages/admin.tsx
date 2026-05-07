import { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { createClient } from '../lib/supabase'

type Profile = {
  id: string
  email: string
  full_name: string
  is_admin: boolean
  free_account: boolean
  created_at: string
  subscriptions: Array<{ status: string; trial_ends_at: string; stripe_customer_id: string }>
}

export default function AdminPanel() {
  const router = useRouter()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [actionMsg, setActionMsg] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      setUserId(user.id)
      const res = await fetch('/api/admin', { headers: { 'x-user-id': user.id } })
      if (res.status === 403) { router.push('/dashboard'); return }
      const data = await res.json()
      setProfiles(data.profiles || [])
      setLoading(false)
    })
  }, [router])

  async function doAction(action: string, targetUserId: string) {
    setActionMsg('')
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
      body: JSON.stringify({ action, targetUserId }),
    })
    const data = await res.json()
    setActionMsg(data.message || data.error)
    // Refresh
    const res2 = await fetch('/api/admin', { headers: { 'x-user-id': userId } })
    const d2 = await res2.json()
    setProfiles(d2.profiles || [])
  }

  const stats = {
    total: profiles.length,
    active: profiles.filter(p => p.subscriptions?.[0]?.status === 'active').length,
    trialing: profiles.filter(p => p.subscriptions?.[0]?.status === 'trialing').length,
    free: profiles.filter(p => p.free_account).length,
    mrr: profiles.filter(p => p.subscriptions?.[0]?.status === 'active').length * 20,
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-stone-400">Loading...</p></div>

  return (
    <>
      <Head><title>Admin — MoneyLens</title></Head>
      <div className="min-h-screen bg-stone-50">
        <nav className="bg-stone-900 text-white px-6 h-14 flex items-center justify-between">
          <span className="font-serif text-lg">MoneyLens <span className="text-stone-400 text-sm font-sans ml-2">Admin</span></span>
          <a href="/dashboard" className="text-stone-400 text-sm hover:text-white">← Dashboard</a>
        </nav>

        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Stats */}
          <div className="grid grid-cols-5 gap-4 mb-8">
            {[
              { label: 'Total users', value: stats.total },
              { label: 'Active', value: stats.active, color: 'text-green-600' },
              { label: 'Trialing', value: stats.trialing, color: 'text-amber-600' },
              { label: 'Free accounts', value: stats.free, color: 'text-blue-600' },
              { label: 'MRR', value: `$${stats.mrr}`, color: 'text-green-700' },
            ].map(s => (
              <div key={s.label} className="card p-4 text-center">
                <div className={`text-2xl font-bold ${s.color || 'text-stone-900'}`}>{s.value}</div>
                <div className="text-xs text-stone-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {actionMsg && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-4">
              {actionMsg}
            </div>
          )}

          {/* Users table */}
          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
              <h2 className="font-semibold text-stone-900">All users</h2>
              <span className="text-xs text-stone-400">{profiles.length} total</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">User</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Joined</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map(p => {
                    const sub = p.subscriptions?.[0]
                    const statusColor: Record<string, string> = {
                      active: 'bg-green-100 text-green-700',
                      trialing: 'bg-amber-100 text-amber-700',
                      canceled: 'bg-red-100 text-red-700',
                      past_due: 'bg-red-100 text-red-700',
                    }
                    return (
                      <tr key={p.id} className="border-b border-stone-50 hover:bg-stone-50">
                        <td className="px-5 py-3">
                          <div className="font-medium text-stone-900">{p.full_name || '—'}</div>
                          <div className="text-xs text-stone-400">{p.email}</div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex gap-1.5 flex-wrap">
                            {p.free_account && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Free</span>}
                            {p.is_admin && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Admin</span>}
                            {sub && <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[sub.status] || 'bg-stone-100 text-stone-600'}`}>{sub.status}</span>}
                            {!sub && !p.free_account && <span className="text-xs bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">No subscription</span>}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-stone-500 text-xs">
                          {new Date(p.created_at).toLocaleDateString('en-CA')}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex gap-2">
                            {!p.free_account ? (
                              <button onClick={() => doAction('grant_free', p.id)} className="text-xs text-blue-600 hover:underline">
                                Grant free
                              </button>
                            ) : (
                              <button onClick={() => doAction('revoke_free', p.id)} className="text-xs text-stone-400 hover:underline">
                                Revoke free
                              </button>
                            )}
                            {sub?.status === 'active' && (
                              <button onClick={() => doAction('cancel_subscription', p.id)} className="text-xs text-red-500 hover:underline">
                                Cancel sub
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
