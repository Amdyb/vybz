import { NextResponse } from 'next/server'
import { isPaidPlan } from '@/lib/plans'
import { confirmInvoice, paydunyaConfigured } from '@/lib/paydunya'
import { userClient, bearerFrom, activateSubscription } from '@/lib/supabase-route'

export const runtime = 'nodejs'

// Called by the success page on return from PayDunya. Confirms payment
// server-to-server, then activates the subscription using the user's own session.
export async function POST(req: Request) {
  const accessToken = bearerFrom(req)
  if (!accessToken) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const supa = userClient(accessToken)
  const { data: { user } } = await supa.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Session invalide.' }, { status: 401 })

  const { token } = await req.json().catch(() => ({})) as { token?: string }
  if (!token) return NextResponse.json({ error: 'Token manquant.' }, { status: 400 })
  if (!paydunyaConfigured()) return NextResponse.json({ status: 'unconfigured' }, { status: 503 })

  const conf = await confirmInvoice(token)
  if (conf.status !== 'completed') {
    return NextResponse.json({ status: conf.status })
  }

  // The invoice's custom_data must belong to the calling user.
  const plan = conf.customData.plan
  if (conf.customData.user_id !== user.id || !isPaidPlan(plan)) {
    return NextResponse.json({ status: 'mismatch' }, { status: 403 })
  }

  await activateSubscription(supa, { userId: user.id, plan, subscriptionId: conf.customData.subscription_id })
  return NextResponse.json({ status: 'completed', plan })
}
