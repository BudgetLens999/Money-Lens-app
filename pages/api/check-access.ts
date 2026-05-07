import type { NextApiRequest, NextApiResponse } from 'next'
import { createAdminClient } from '../../lib/supabase-admin'
import { checkAccess } from '../../lib/access'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const userId = req.headers['x-user-id'] as string
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const status = await checkAccess(userId)

  let daysLeft: number | null = null
  if (status === 'trialing') {
    const supabase = createAdminClient()
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('trial_ends_at')
      .eq('user_id', userId)
      .single()
    if (sub?.trial_ends_at) {
      const diff = new Date(sub.trial_ends_at).getTime() - Date.now()
      daysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
    }
  }

  return res.status(200).json({ status, daysLeft })
}
