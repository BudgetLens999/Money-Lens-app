import { createAdminClient } from './supabase-admin'

export type AccessStatus = 'active' | 'trialing' | 'free_account' | 'expired' | 'none'

export async function checkAccess(userId: string): Promise<AccessStatus> {
  const supabase = createAdminClient()

  // Check profile for free account grant (admin override)
  const { data: profile } = await supabase
    .from('profiles')
    .select('free_account, is_admin')
    .eq('id', userId)
    .single()

  if (profile?.free_account || profile?.is_admin) return 'free_account'

  // Check subscription
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!sub) return 'none'

  const now = new Date()

  if (sub.status === 'active') return 'active'
  
  if (sub.status === 'trialing') {
    const trialEnd = new Date(sub.trial_ends_at)
    if (now < trialEnd) return 'trialing'
    return 'expired'
  }

  if (sub.status === 'canceled' || sub.status === 'past_due') return 'expired'

  return 'none'
}

export function canAccess(status: AccessStatus): boolean {
  return ['active', 'trialing', 'free_account'].includes(status)
}
