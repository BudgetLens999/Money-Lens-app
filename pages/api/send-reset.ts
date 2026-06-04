import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  
  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'Email required' })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset`,
    }
  })

  if (error) return res.status(400).json({ error: error.message })

  const resetLink = data.properties.action_link

  await resend.emails.send({
    from: 'Budget Periscope <noreply@budgetperiscope.com>',
    to: email,
    subject: 'Reset your Budget Periscope password',
    html: `
      <p>Hi,</p>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <p><a href="${resetLink}">Reset my password</a></p>
      <p>If you didn't request this, you can ignore this email.</p>
      <p>— Budget Periscope</p>
    `
  })

  return res.status(200).json({ success: true })
}
