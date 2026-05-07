export const dynamic = 'force-dynamic'

import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { createClient } from '../../lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') router.push('/dashboard')
      if (event === 'PASSWORD_RECOVERY') router.push('/auth/reset')
    })
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-stone-500">Confirming your account...</p>
    </div>
  )
}
