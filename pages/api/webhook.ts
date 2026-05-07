import type { NextApiRequest, NextApiResponse } from 'next'
import { stripe } from '../../lib/stripe'
import { createAdminClient } from '../../lib/supabase-admin'
import Stripe from 'stripe'

export const config = { api: { bodyParser: false } }

async function getRawBody(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const rawBody = await getRawBody(req)
  const sig = req.headers['stripe-signature'] as string

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: any) {
    return res.status(400).json({ error: `Webhook error: ${err.message}` })
  }

  const supabase = createAdminClient()

  switch (event.type) {
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string

      const { data: existing } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (existing) {
        await supabase.from('subscriptions').update({
          status: sub.status,
          current_period_ends_at: new Date(sub.current_period_end * 1000).toISOString(),
        }).eq('stripe_customer_id', customerId)
      }
      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string

      // Mark subscription as active
      await supabase.from('subscriptions')
        .update({ status: 'active' })
        .eq('stripe_customer_id', customerId)

      // Pay out affiliates for this user (20% = $4/mo)
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('stripe_customer_id', customerId)
        .single()

      if (sub) {
        const { data: referral } = await supabase
          .from('referrals')
          .select('*, affiliates(*)')
          .eq('referred_user_id', sub.user_id)
          .eq('status', 'pending')
          .single()

        if (referral) {
          await supabase.from('referrals')
            .update({ status: 'active' })
            .eq('id', referral.id)
          await supabase.from('affiliates')
            .update({ total_earnings: referral.affiliates.total_earnings + 4 })
            .eq('id', referral.affiliate_id)
        }
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      await supabase.from('subscriptions')
        .update({ status: 'past_due' })
        .eq('stripe_customer_id', invoice.customer as string)
      break
    }
  }

  res.status(200).json({ received: true })
}
