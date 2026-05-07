import type { NextApiRequest, NextApiResponse } from 'next'
import { createAdminClient } from '../../lib/supabase-admin'

// All admin endpoints — protected by admin check
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createAdminClient()

  // Verify caller is admin via userId header
  const callerId = req.headers['x-user-id'] as string
  if (!callerId) return res.status(401).json({ error: 'Unauthorized' })

  const { data: caller } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', callerId)
    .single()

  if (!caller?.is_admin) return res.status(403).json({ error: 'Admin only' })

  // GET — list all users with subscription status
  if (req.method === 'GET') {
    const { data: profiles } = await supabase
      .from('profiles')
      .select(`*, subscriptions(status, trial_ends_at, current_period_ends_at, stripe_customer_id)`)
      .order('created_at', { ascending: false })

    const { data: affiliates } = await supabase
      .from('affiliates')
      .select('*, referrals(count)')

    return res.status(200).json({ profiles, affiliates })
  }

  // POST — admin actions
  if (req.method === 'POST') {
    const { action, targetUserId, value } = req.body

    switch (action) {
      case 'grant_free': {
        await supabase.from('profiles')
          .update({ free_account: true })
          .eq('id', targetUserId)
        return res.status(200).json({ success: true, message: 'Free account granted' })
      }

      case 'revoke_free': {
        await supabase.from('profiles')
          .update({ free_account: false })
          .eq('id', targetUserId)
        return res.status(200).json({ success: true, message: 'Free account revoked' })
      }

      case 'make_admin': {
        await supabase.from('profiles')
          .update({ is_admin: true })
          .eq('id', targetUserId)
        return res.status(200).json({ success: true, message: 'Admin granted' })
      }

      case 'cancel_subscription': {
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('stripe_subscription_id')
          .eq('user_id', targetUserId)
          .single()
        if (sub?.stripe_subscription_id) {
          const { stripe } = await import('../../lib/stripe')
          await stripe.subscriptions.cancel(sub.stripe_subscription_id)
        }
        return res.status(200).json({ success: true, message: 'Subscription cancelled' })
      }

      default:
        return res.status(400).json({ error: 'Unknown action' })
    }
  }

  res.status(405).end()
}
