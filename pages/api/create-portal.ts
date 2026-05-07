import type { NextApiRequest, NextApiResponse } from 'next'
import { stripe } from '../../lib/stripe'
import { createAdminClient } from '../../lib/supabase-admin'
import { createClient } from '../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Get user from cookie session
  const supabaseClient = createClient()
  
  // For server-side, we use the service role to look up the customer
  const userId = req.headers['x-user-id'] as string
  if (!userId) {
    // Redirect to login
    return res.redirect('/login')
  }

  const supabase = createAdminClient()
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .single()

  if (!sub?.stripe_customer_id) {
    return res.redirect('/dashboard')
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/account`,
  })

  res.redirect(session.url)
}
