import { useState } from 'react'

type Category = {
  name: string
  spent: number
  budget: number
}

type Props = {
  month: string
  totalSpent: number
  totalBudget: number
  categories: Category[]
  userName?: string
}

export default function EmailReportModal({ month, totalSpent, totalBudget, categories, userName }: Props) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const handleSend = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg('Please enter a valid email address.')
      return
    }
    setStatus('sending')
    setErrorMsg('')
    try {
      const res = await fetch('/api/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientEmail: email, userName, month, totalSpent, totalBudget, categories }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setStatus('error')
        setErrorMsg(data.error || 'Something went wrong. Please try again.')
      } else {
        setStatus('sent')
      }
    } catch {
      setStatus('error')
      setErrorMsg('Network error. Please try again.')
    }
  }

  const handleClose = () => {
    setOpen(false)
    setStatus('idle')
    setEmail('')
    setErrorMsg('')
  }

  return (
    <div>
      <button
        onClick={() => setOpen(true)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', background: '#1e3a5f', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
      >
        ✉️ Email Report
      </button>

      {open && (
        <div
          onClick={handleClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#ffffff', borderRadius: '12px', padding: '32px', width: '100%', maxWidth: '440px', boxShadow: '0 8px 32px rgba(0,0,0,0.16)' }}
          >
            {status === 'sent' ? (
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <p style={{ fontSize: '40px', margin: '0 0 12px' }}>✅</p>
                <p style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>Report sent!</p>
                <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#64748b' }}>Check <strong>{email}</strong> — it should arrive within a minute.</p>
                <button onClick={handleClose} style={{ padding: '10px 24px', background: '#1e3a5f', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Done</button>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: '20px' }}>
                  <p style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>Email your {month} report</p>
                  <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>We'll send a full budget summary to any email address. No account connection required.</p>
                </div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrorMsg('') }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="you@example.com"
                  style={{ width: '100%', padding: '10px 12px', fontSize: '15px', border: `1px solid ${errorMsg ? '#dc2626' : '#d1d5db'}`, borderRadius: '8px', outline: 'none', boxSizing: 'border-box', color: '#1e293b', background: '#f9fafb' }}
                />
                {errorMsg && <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#dc2626' }}>{errorMsg}</p>}
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button onClick={handleClose} style={{ flex: 1, padding: '10px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  <button onClick={handleSend} disabled={status === 'sending'} style={{ flex: 2, padding: '10px', background: status === 'sending' ? '#93c5fd' : '#1e3a5f', color: '#ffffff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: status === 'sending' ? 'not-allowed' : 'pointer' }}>
                    {status === 'sending' ? 'Sending…' : 'Send Report'}
                  </button>
                </div>
                {status === 'error' && <p style={{ margin: '12px 0 0', fontSize: '13px', color: '#dc2626', textAlign: 'center' }}>{errorMsg || 'Send failed — check your Resend API key in Vercel env vars.'}</p>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
