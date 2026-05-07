import type { NextApiRequest, NextApiResponse } from 'next'
import { stripe, PRICE_ID, TRIAL_DAYS } from '../../lib/stripe'
import { createAdminClient } from '../../lib/supabase-admin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const { userId, email, name, ref } = req.body
  if (!userId || !email) return res.status(400).json({ error: 'Missing required fields' })

  const supabase = createAdminClient()

  try {
    // Create Stripe customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: { supabase_user_id: userId },
    })

    // Create subscription with trial
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: PRICE_ID }],
      trial_period_days: TRIAL_DAYS,
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    })

    const trialEnd = new Date()
    trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS)

    // Save to Supabase
    await supabase.from('profiles').upsert({
      id: userId,
      email,
      full_name: name,
    })

    await supabase.from('subscriptions').insert({
      user_id: userId,
      stripe_customer_id: customer.id,
      stripe_subscription_id: subscription.id,
      status: 'trialing',
      trial_ends_at: trialEnd.toISOString(),
    })

    // Handle affiliate referral
    if (ref) {
      const { data: affiliate } = await supabase
        .from('affiliates')
        .select('id')
        .eq('referral_code', ref)
        .single()

      if (affiliate) {
        await supabase.from('referrals').insert({
          affiliate_id: affiliate.id,
          referred_user_id: userId,
          status: 'pending',
        })
        await supabase.from('affiliates')
          .update({ referred_users: supabase.rpc('increment', { x: 1 }) })
          .eq('id', affiliate.id)
      }
    }

    return res.status(200).json({ success: true })
  } catch (err: any) {
    console.error('Subscription creation error:', err)
    return res.status(500).json({ error: err.message })
  }
}
