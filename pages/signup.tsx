import type { NextApiRequest, NextApiResponse } from 'next'
import { createAdminClient } from '../../lib/supabase-admin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { userId, email, name, ref } = req.body
  if (!userId || !email) return res.status(400).json({ error: 'Missing fields' })
  const supabase = createAdminClient()
  try {
    await supabase.from('profiles').upsert({ id: userId, email, full_name: name || '' })
    const trialEnd = new Date()
    trialEnd.setDate(trialEnd.getDate() + 30)
    const { data: existing } = await supabase.from('subscriptions').select('id').eq('user_id', userId).single()
    if (!existing) {
      await supabase.from('subscriptions').insert({
        user_id: userId,
        stripe_customer_id: null,
        stripe_subscription_id: null,
        status: 'trialing',
        trial_ends_at: trialEnd.toISOString(),
      })
    }
    return res.status(200).json({ success: true })
  } catch (err: any) {
    return res.status(500).json({ error: err.message })
  }
}
