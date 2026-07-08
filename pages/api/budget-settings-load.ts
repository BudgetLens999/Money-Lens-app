import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const userId = req.headers['x-user-id'] as string
  if (!userId) return res.status(401).json({ error: 'Missing user ID' })

  const { data, error } = await supabase
    .from('budget_settings')
    .select('var_targets, fixed_items, paid_items')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') return res.status(500).json({ error: error.message })

  return res.status(200).json(data || { var_targets: [], fixed_items: [], paid_items: {} })
}
