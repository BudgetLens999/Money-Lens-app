import type { NextApiRequest, NextApiResponse } from 'next'
import { createAdminClient } from '../../lib/supabase-admin'
import { checkAccess, canAccess } from '../../lib/access'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const userId = req.headers['x-user-id'] as string
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const access = await checkAccess(userId)
  if (!canAccess(access)) return res.status(403).json({ error: 'Subscription required' })

  const { to, cc, subject, html, name } = req.body
  if (!to || !html) return res.status(400).json({ error: 'Missing to or html' })

  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey || resendKey.includes('placeholder')) {
    return res.status(500).json({ error: 'Email not configured' })
  }

  try {
    const payload: any = {
      from: 'MoneyLens <reports@moneylens.app>',
      to: [to],
      subject: subject || 'Your MoneyLens Budget Report',
      html,
    }
    if (cc && cc.length > 0) payload.cc = Array.isArray(cc) ? cc : [cc]

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = await response.json()
    if (!response.ok) {
      return res.status(500).json({ error: data.message || 'Failed to send email' })
    }

    return res.status(200).json({ success: true, id: data.id })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
}
