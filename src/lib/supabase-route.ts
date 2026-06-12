// Server-side Supabase helpers for route handlers (PayDunya flow).
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { PaidPlanId } from '@/lib/plans'

const URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/** A client scoped to the calling user's JWT — RLS sees auth.uid(). */
export function userClient(accessToken: string): SupabaseClient {
  return createClient(URL, ANON, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/** Elevated client for webhooks (no user session). Null when the key is absent. */
export function serviceClient(): SupabaseClient | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) return null
  return createClient(URL, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export function bearerFrom(req: Request): string | null {
  const h = req.headers.get('authorization')
  return h?.startsWith('Bearer ') ? h.slice(7) : null
}

/** Mark the subscription completed and upgrade the organizer's plan (+1 month). */
export async function activateSubscription(
  client: SupabaseClient,
  args: { userId: string; plan: PaidPlanId; subscriptionId?: string },
): Promise<void> {
  const now = new Date()
  const end = new Date(now)
  end.setMonth(end.getMonth() + 1)

  if (args.subscriptionId) {
    await client.from('subscriptions').update({
      status: 'completed', period_start: now.toISOString(), period_end: end.toISOString(),
    } as never).eq('id', args.subscriptionId).eq('organizer_id', args.userId)
  }
  await client.from('profiles').update({
    subscription_plan: args.plan, subscription_expires_at: end.toISOString(),
  } as never).eq('id', args.userId)
}
