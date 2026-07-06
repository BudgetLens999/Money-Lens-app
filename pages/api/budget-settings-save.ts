import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' })

  const { var_targets, fixed_items, paid_items } = req.body

  const { error } = await supabase
    .from('budget_settings')
    .upsert({
      user_id: user.id,
      var_targets: var_targets || [],
      fixed_items: fixed_items || [],
      paid_items: paid_items || {},
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' })

  if (error) return res.status(500).json({ error: error.message })

  return res.status(200).json({ success: true })
}
