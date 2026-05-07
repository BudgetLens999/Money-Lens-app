import type { NextApiRequest, NextApiResponse } from 'next'
import { createAdminClient } from '../../lib/supabase-admin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createAdminClient()
  const userId = req.headers['x-user-id'] as string
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    const { data } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single()
    return res.status(200).json(data || {})
  }

  if (req.method === 'POST') {
    const { budget_targets, fixed_costs, custom_categories, merchant_memory } = req.body
    await supabase.from('user_settings').upsert({
      user_id: userId,
      ...(budget_targets !== undefined && { budget_targets }),
      ...(fixed_costs !== undefined && { fixed_costs }),
      ...(custom_categories !== undefined && { custom_categories }),
      ...(merchant_memory !== undefined && { merchant_memory }),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    return res.status(200).json({ success: true })
  }

  res.status(405).end()
}
