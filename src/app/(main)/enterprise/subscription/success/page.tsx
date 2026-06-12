'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Loader2, XCircle, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PLANS, type PlanId } from '@/lib/plans'

type Phase = 'verifying' | 'completed' | 'pending' | 'failed'

export default function SubscriptionSuccessPage() {
  const [phase, setPhase] = useState<Phase>('verifying')
  const [plan, setPlan]   = useState<PlanId | null>(null)

  useEffect(() => {
    async function run() {
      const token = new URLSearchParams(window.location.search).get('token')
      const { data: { session } } = await supabase.auth.getSession()
      if (!token || !session) { setPhase('failed'); return }

      try {
        const res = await fetch('/api/paydunya/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ token }),
        })
        const data = await res.json()
        if (res.ok && data.status === 'completed') { setPlan(data.plan as PlanId); setPhase('completed') }
        else if (data.status === 'pending') setPhase('pending')
        else setPhase('failed')
      } catch {
        setPhase('failed')
      }
    }
    run()
  }, [])

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center text-center px-6 max-w-sm mx-auto">
      {phase === 'verifying' && (
        <>
          <Loader2 className="w-10 h-10 text-purple-400 animate-spin mb-4" />
          <h1 className="text-xl font-black text-white" style={{ fontFamily: 'Syne, sans-serif' }}>Vérification du paiement…</h1>
          <p className="text-white/40 text-sm mt-1">Un instant, on confirme ta transaction.</p>
        </>
      )}

      {phase === 'completed' && (
        <>
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-black text-white mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>
            Abonnement {plan ? PLANS[plan].label : ''} activé !
          </h1>
          <p className="text-white/50 text-sm mb-6">Toutes les fonctionnalités sont débloquées. Bienvenue !</p>
          <Link href="/enterprise" className="bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-bold px-6 py-3 rounded-full text-sm hover:opacity-90 transition-opacity">
            Aller au dashboard
          </Link>
        </>
      )}

      {phase === 'pending' && (
        <>
          <div className="w-16 h-16 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-xl font-black text-white mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>Paiement en attente</h1>
          <p className="text-white/50 text-sm mb-6">Ton paiement est en cours de traitement. Ton plan sera activé dès confirmation.</p>
          <Link href="/enterprise/subscription" className="text-purple-400 text-sm font-semibold">Retour aux abonnements</Link>
        </>
      )}

      {phase === 'failed' && (
        <>
          <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-xl font-black text-white mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>Paiement non confirmé</h1>
          <p className="text-white/50 text-sm mb-6">Le paiement n&apos;a pas pu être validé. Aucun montant n&apos;a été débité si l&apos;opération a échoué.</p>
          <Link href="/enterprise/subscription" className="bg-zinc-900 border border-purple-900/30 text-white font-bold px-6 py-3 rounded-full text-sm hover:border-purple-500/40 transition-colors">
            Réessayer
          </Link>
        </>
      )}
    </div>
  )
}
