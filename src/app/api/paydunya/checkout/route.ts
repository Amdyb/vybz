import { NextResponse } from 'next/server'
import { PLANS, isPaidPlan } from '@/lib/plans'
import { createInvoice, paydunyaConfigured } from '@/lib/paydunya'
import { userClient, bearerFrom } from '@/lib/supabase-route'
import type { Subscription } from '@/lib/types'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const accessToken = bearerFrom(req)
  if (!accessToken) return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })

  const supa = userClient(accessToken)
  const { data: { user } } = await supa.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Session invalide.' }, { status: 401 })

  const body = await req.json().catch(() => ({})) as { plan?: string }
  if (!body.plan || !isPaidPlan(body.plan)) {
    return NextResponse.json({ error: 'Plan invalide.' }, { status: 400 })
  }
  if (!paydunyaConfigured()) {
    return NextResponse.json({ error: 'Paiement indisponible : configuration PayDunya manquante.' }, { status: 503 })
  }

  const cfg = PLANS[body.plan]

  // 1. Pending subscription record (RLS: organizer_id = auth.uid())
  const { data: sub, error: insErr } = await supa
    .from('subscriptions')
    .insert({ organizer_id: user.id, plan: cfg.id, amount: cfg.amount, currency: 'XOF', status: 'pending' } as never)
    .select()
    .single()
  if (insErr || !sub) {
    return NextResponse.json({ error: 'Impossible de démarrer le paiement.' }, { status: 500 })
  }
  const subscriptionId = (sub as Subscription).id

  // 2. PayDunya invoice
  const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin
  const inv = await createInvoice({
    amount: cfg.amount,
    planLabel: cfg.label,
    description: `Abonnement VYBZ ${cfg.label} — 1 mois`,
    returnUrl: `${origin}/enterprise/subscription/success`,
    cancelUrl: `${origin}/enterprise/subscription`,
    callbackUrl: `${origin}/api/paydunya/callback`,
    customData: { user_id: user.id, plan: cfg.id, subscription_id: subscriptionId },
  })
  if (!inv.ok) {
    await supa.from('subscriptions').update({ status: 'failed' } as never).eq('id', subscriptionId)
    return NextResponse.json({ error: inv.error }, { status: 502 })
  }

  // 3. Save the token for verification on return / callback
  await supa.from('subscriptions').update({ paydunya_token: inv.token } as never).eq('id', subscriptionId)

  return NextResponse.json({ url: inv.url })
}
