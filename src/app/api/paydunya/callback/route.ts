import { NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { isPaidPlan } from '@/lib/plans'
import { serviceClient, activateSubscription } from '@/lib/supabase-route'

export const runtime = 'nodejs'

// PayDunya IPN. Always returns 200 to acknowledge. Activation requires
// SUPABASE_SERVICE_ROLE_KEY (no user session here); otherwise the success-page
// verify flow handles activation. The hash guarantees the payload is genuine.
export async function POST(req: Request) {
  let payload: {
    status?: string
    hash?: string
    custom_data?: Record<string, string>
  } | null = null

  try {
    const ct = req.headers.get('content-type') ?? ''
    if (ct.includes('application/json')) {
      payload = await req.json()
    } else {
      const form = await req.formData()
      const raw = form.get('data')
      if (raw) payload = JSON.parse(String(raw))
    }
  } catch {
    return NextResponse.json({ ok: true })
  }

  const master = process.env.PAYDUNYA_MASTER_KEY ?? ''
  const expected = master ? crypto.createHash('sha512').update(master).digest('hex') : ''
  if (!master || payload?.hash !== expected) {
    // Unverifiable → acknowledge but do nothing.
    return NextResponse.json({ ok: true })
  }

  if (payload.status === 'completed') {
    const cd = payload.custom_data ?? {}
    const svc = serviceClient()
    if (svc && cd.user_id && isPaidPlan(cd.plan ?? '')) {
      await activateSubscription(svc, {
        userId: cd.user_id, plan: cd.plan as 'pro' | 'premium', subscriptionId: cd.subscription_id,
      })
    }
  }

  return NextResponse.json({ ok: true })
}
