'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft, Zap, Star, Crown, Check, Loader2, ShieldCheck, AlertCircle,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PLANS, PAID_PLANS, formatXOF, type PlanId } from '@/lib/plans'

const PLAN_ICON: Record<PlanId, React.ElementType> = { basic: Zap, pro: Star, premium: Crown }
const PLAN_ACCENT: Record<PlanId, string> = {
  basic:   'border-zinc-700 text-zinc-300',
  pro:     'border-purple-500/50 text-purple-300',
  premium: 'border-amber-500/40 text-amber-300',
}

export default function SubscriptionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [current, setCurrent] = useState<string>('basic')
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace('/sign-in'); return }
      const { data } = await supabase
        .from('profiles').select('subscription_plan, subscription_expires_at').eq('id', user.id).maybeSingle()
      const p = data as { subscription_plan?: string; subscription_expires_at?: string } | null
      setCurrent(p?.subscription_plan ?? 'basic')
      setExpiresAt(p?.subscription_expires_at ?? null)
      setLoading(false)
    })
  }, [router])

  async function subscribe(plan: 'pro' | 'premium') {
    setError('')
    setBusy(plan)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.replace('/sign-in'); return }

    try {
      const res = await fetch('/api/paydunya/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (res.ok && data.url) {
        window.location.href = data.url       // redirect to PayDunya checkout
        return
      }
      setError(data.error || 'Le paiement est momentanément indisponible.')
    } catch {
      setError('Connexion au paiement impossible. Réessaie.')
    }
    setBusy(null)
  }

  if (loading) {
    return <div className="min-h-[70vh] flex items-center justify-center"><Loader2 className="w-8 h-8 text-purple-400 animate-spin" /></div>
  }

  return (
    <div className="px-4 md:px-8 py-6 max-w-lg mx-auto">
      <Link href="/enterprise" className="inline-flex items-center gap-1.5 text-white/50 hover:text-white text-xs font-semibold mb-5 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Dashboard
      </Link>

      <h1 className="text-2xl font-black text-white" style={{ fontFamily: 'Syne, sans-serif' }}>Abonnement</h1>
      <p className="text-white/40 text-sm mt-1 mb-2">Facturation mensuelle via PayDunya, sans engagement.</p>

      {/* Current plan */}
      <div className="flex items-center gap-2 mb-6 text-xs">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span className="text-white/60">
          Plan actuel : <span className="text-white font-bold">{PLANS[(current as PlanId)] ? PLANS[current as PlanId].label : 'Basic'}</span>
          {expiresAt && current !== 'basic' && (
            <> · expire le {new Date(expiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</>
          )}
        </span>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      <div className="space-y-4">
        {(['basic', ...PAID_PLANS] as PlanId[]).map((id) => {
          const plan = PLANS[id]
          const Icon = PLAN_ICON[id]
          const isCurrent = current === id
          const paid = id !== 'basic'
          return (
            <div key={id} className={`rounded-[1.75rem] border bg-zinc-900 p-5 ${plan.recommended ? 'border-purple-500/50 shadow-[0_0_24px_rgba(168,85,247,0.12)]' : 'border-purple-900/30'}`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <span className={`w-10 h-10 rounded-2xl bg-white/5 border flex items-center justify-center ${PLAN_ACCENT[id]}`}>
                    <Icon className="w-5 h-5" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-white font-black text-lg" style={{ fontFamily: 'Syne, sans-serif' }}>{plan.label}</h2>
                      {plan.recommended && <span className="text-[9px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full">Populaire</span>}
                    </div>
                    <p className="text-white/40 text-xs">{plan.tagline}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-white font-black text-lg leading-none">{plan.amount === 0 ? 'Gratuit' : formatXOF(plan.amount)}</div>
                  <div className="text-white/40 text-[10px] mt-0.5">{plan.period}</div>
                </div>
              </div>

              <ul className="space-y-1.5 mb-4">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-zinc-300">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />{f}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div className="w-full text-center py-3 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-bold">
                  Plan actuel
                </div>
              ) : paid ? (
                <button
                  onClick={() => subscribe(id as 'pro' | 'premium')}
                  disabled={busy === id}
                  className={`w-full flex items-center justify-center gap-2 font-bold py-3 rounded-full text-sm transition-all active:scale-[0.98] disabled:opacity-60 ${
                    id === 'premium'
                      ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black'
                      : 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white'
                  }`}
                >
                  {busy === id ? <><Loader2 className="w-4 h-4 animate-spin" /> Redirection…</> : <>Passer à {plan.label}</>}
                </button>
              ) : (
                <div className="w-full text-center py-3 rounded-full bg-white/5 border border-white/10 text-white/40 text-sm font-semibold">
                  Plan de base
                </div>
              )}
            </div>
          )
        })}
      </div>

      <p className="text-white/25 text-[11px] text-center mt-5">
        Paiement sécurisé par PayDunya (Wave, Orange Money, carte). VYBZ ne stocke aucune donnée bancaire.
      </p>
    </div>
  )
}
