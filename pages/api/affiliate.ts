import type { NextApiRequest, NextApiResponse } from 'next'
import { createAdminClient } from '../../lib/supabase-admin'
import { nanoid } from 'nanoid'

// Simple nanoid replacement
function generateCode() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) result += chars[Math.floor(Math.random() * chars.length)]
  return result
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createAdminClient()
  const userId = req.headers['x-user-id'] as string
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    const { data } = await supabase
      .from('affiliates')
      .select('*')
      .eq('user_id', userId)
      .single()
    return res.status(200).json(data || {})
  }

  if (req.method === 'POST') {
    // Create affiliate account
    const { data: existing } = await supabase
      .from('affiliates')
      .select('id')
      .eq('user_id', userId)
      .single()
    if (existing) return res.status(200).json(existing)

    const code = generateCode()
    const { data } = await supabase
      .from('affiliates')
      .insert({ user_id: userId, referral_code: code })
      .select()
      .single()
    return res.status(200).json(data)
  }

  res.status(405).end()
}
