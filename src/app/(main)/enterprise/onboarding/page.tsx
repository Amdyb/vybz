'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  Building2, ChevronRight, CheckCircle2, Loader2,
  Zap, Star, Crown,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

// ─── Plan definitions ─────────────────────────────────────────────────────────

type Plan = 'basic' | 'pro' | 'premium'

const PLANS: {
  id: Plan
  label: string
  price: string
  period: string
  icon: React.ElementType
  color: string
  border: string
  bg: string
  features: string[]
  cta: string
  recommended?: boolean
}[] = [
  {
    id: 'basic',
    label: 'Basic',
    price: 'Gratuit',
    period: 'pour toujours',
    icon: Zap,
    color: 'text-zinc-300',
    border: 'border-zinc-700',
    bg: 'bg-zinc-800/50',
    cta: 'Commencer gratuitement',
    features: [
      'Créer et lister des événements',
      'Page organisateur publique',
      "Jusqu'à 5 événements actifs",
      'Support par email',
    ],
  },
  {
    id: 'pro',
    label: 'Pro',
    price: '9 900',
    period: 'XOF / mois',
    icon: Star,
    color: 'text-purple-300',
    border: 'border-purple-500/50',
    bg: 'bg-purple-900/20',
    cta: 'Choisir Pro',
    recommended: true,
    features: [
      'Tout ce qui est inclus dans Basic',
      'Vente de billets avec QR codes',
      'Scanner de billets à la porte',
      'Analytiques et revenus',
      "Jusqu'à 50 événements actifs",
      'Page organisateur personnalisée',
    ],
  },
  {
    id: 'premium',
    label: 'Premium',
    price: '24 900',
    period: 'XOF / mois',
    icon: Crown,
    color: 'text-amber-300',
    border: 'border-amber-500/40',
    bg: 'bg-amber-900/10',
    cta: 'Choisir Premium',
    features: [
      'Tout ce qui est inclus dans Pro',
      "Mise en avant sur l'accueil VYBZ",
      'Accès aux VYBZ Drops',
      'Événements illimités',
      'Support prioritaire 24/7',
      'Réservation artistes et DJs',
    ],
  },
]

const BUSINESS_TYPES = ['Club / Boîte de nuit', 'Festival', 'Restaurant / Bar', 'Association', 'Promoteur', 'Autre']

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EnterpriseOnboardingPage() {
  const router = useRouter()
  const [step, setStep]               = useState(1)
  const [businessName, setBusinessName] = useState('')
  const [businessType, setBusinessType] = useState(BUSINESS_TYPES[0])
  const [selectedPlan, setSelectedPlan] = useState<Plan>('pro')
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')

  // Guard: must be logged in; redirect if already organizer
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace('/sign-in'); return }
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()
      const role = (profile as { role?: string } | null)?.role
      if (role === 'organizer') { router.replace('/enterprise'); return }
      setLoading(false)
    })
  }, [router])

  async function handleSubmit() {
    setError('')
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/sign-in'); return }

    // Cast needed: our Database type only defines Row, not Insert
    type ProfileUpsert = { id: string; full_name: string | null; role: string; business_name: string; subscription_plan: string }
    const upsertPayload: ProfileUpsert = {
      id: user.id,
      full_name: (user.user_metadata?.full_name as string | undefined) ?? null,
      role: 'organizer',
      business_name: businessName.trim(),
      subscription_plan: selectedPlan,
    }
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert(upsertPayload as never, { onConflict: 'id' })

    if (upsertError) {
      setError('Une erreur est survenue. Réessaie.')
      setSaving(false)
      return
    }

    router.push('/enterprise')
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-8 max-w-2xl mx-auto">

      {/* Logo */}
      <div className="flex justify-center mb-8">
        <Link href="/">
          <Image src="/vybz-logo.webp" alt="VYBZ" width={64} height={64} className="h-16 w-auto" />
        </Link>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              s === step ? 'bg-purple-600 text-white' :
              s < step  ? 'bg-emerald-600 text-white' :
                          'bg-zinc-800 text-zinc-500'
            }`}>
              {s < step ? <CheckCircle2 className="w-4 h-4" /> : s}
            </div>
            {s < 2 && <div className="w-8 h-px bg-zinc-700" />}
          </div>
        ))}
      </div>

      {/* ── Step 1: Business info ── */}
      {step === 1 && (
        <div>
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-500/30 mb-4">
              <Building2 className="w-7 h-7 text-purple-400" />
            </div>
            <h1 className="text-2xl font-black text-white mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
              Créez votre espace organisateur
            </h1>
            <p className="text-zinc-400 text-sm">
              Rejoignez des centaines d&apos;organisateurs qui font confiance à VYBZ
            </p>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">
                Nom de votre établissement / marque
              </label>
              <input
                type="text"
                placeholder="Ex: Club XYZ, Festival Sunugal…"
                value={businessName}
                onChange={e => setBusinessName(e.target.value)}
                className="w-full bg-zinc-900 border border-purple-900/30 rounded-xl px-4 py-3.5 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-purple-500/50 transition-colors"
                autoFocus
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">
                Type d&apos;activité
              </label>
              <div className="grid grid-cols-2 gap-2">
                {BUSINESS_TYPES.map(type => (
                  <button
                    key={type}
                    onClick={() => setBusinessType(type)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-medium text-left transition-all border ${
                      businessType === type
                        ? 'bg-purple-600/20 border-purple-500/50 text-purple-300'
                        : 'bg-zinc-900 border-zinc-700/50 text-zinc-400 hover:border-purple-900/40'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                if (!businessName.trim()) { setError('Entrez le nom de votre établissement.'); return }
                setError('')
                setStep(2)
              }}
              className="w-full bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-bold py-3.5 rounded-full text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all mt-2"
            >
              Continuer
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Plan selection ── */}
      {step === 2 && (
        <div>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-white mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
              Choisissez votre plan
            </h1>
            <p className="text-zinc-400 text-sm">
              Vous pouvez changer de plan à tout moment
            </p>
          </div>

          <div className="space-y-3 mb-6">
            {PLANS.map(plan => {
              const Icon = plan.icon
              const isSelected = selectedPlan === plan.id
              return (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`w-full text-left rounded-2xl border p-4 transition-all ${
                    isSelected ? `${plan.bg} ${plan.border} ring-1 ring-purple-500/30` : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${plan.color}`} />
                      <span className={`font-black text-sm ${plan.color}`}>{plan.label}</span>
                      {plan.recommended && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-600/30 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/30">
                          Recommandé
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-white font-black text-base">{plan.price}</span>
                      {plan.period !== 'pour toujours' && (
                        <span className="text-zinc-500 text-xs ml-1">{plan.period}</span>
                      )}
                    </div>
                  </div>
                  <ul className="space-y-1">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-xs text-zinc-400">
                        <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${isSelected ? 'text-emerald-400' : 'text-zinc-600'}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>
              )
            })}
          </div>

          {selectedPlan !== 'basic' && (
            <p className="text-zinc-500 text-xs text-center mb-4">
              Le paiement sera activé via PayDunya — facturation mensuelle, sans engagement.
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-bold py-3.5 rounded-full text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Création en cours…</>
            ) : (
              <>{PLANS.find(p => p.id === selectedPlan)?.cta ?? 'Commencer'}</>
            )}
          </button>

          <button
            onClick={() => setStep(1)}
            className="w-full mt-3 text-zinc-500 text-sm hover:text-white transition-colors py-2"
          >
            Retour
          </button>
        </div>
      )}
    </div>
  )
}
