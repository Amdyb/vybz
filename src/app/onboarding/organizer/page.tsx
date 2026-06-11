'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  Building2, MapPin, Wallet, Share2, ArrowLeft, ArrowRight,
  Check, Loader2, AtSign, Globe, Phone,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { OrganizerPreferences } from '@/lib/types'

const BUSINESS_TYPES = [
  'Club et Nightlife',
  'Restaurant',
  'Rooftop et Lounge',
  'Promoteur de concerts',
  'Artiste et DJ',
  'Organisateur de festivals',
  'Événements culturels',
  'Autre',
]

const PAYMENT_METHODS = [
  'Wave',
  'Orange Money',
  'PayPal',
  'Stripe',
  'Espèces sur place',
  'Virement bancaire',
]

const TOTAL_STEPS = 4

export default function OrganizerOnboardingPage() {
  const router = useRouter()
  const [userId, setUserId]   = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [step, setStep]       = useState(1)

  // Form state
  const [businessType, setBusinessType]     = useState('')
  const [city, setCity]                     = useState('')
  const [country, setCountry]               = useState('')
  const [paymentMethods, setPaymentMethods] = useState<string[]>([])
  const [instagram, setInstagram]           = useState('')
  const [whatsapp, setWhatsapp]             = useState('')
  const [website, setWebsite]               = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/sign-in'); return }

      // Already onboarded as organizer → skip straight to the dashboard
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_organizer')
        .eq('id', user.id)
        .maybeSingle()
      if ((profile as { is_organizer: boolean | null } | null)?.is_organizer) {
        router.replace('/enterprise')
        return
      }

      setUserId(user.id)
      setLoading(false)
    }
    load()
  }, [router])

  function togglePayment(method: string) {
    setPaymentMethods((prev) =>
      prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]
    )
  }

  function next() {
    setError('')
    if (step === 1 && !businessType) { setError('Sélectionnez un type de business.'); return }
    if (step === 2 && (!city.trim() || !country.trim())) { setError('Renseignez votre ville et votre pays.'); return }
    if (step === 3 && paymentMethods.length === 0) { setError('Sélectionnez au moins un moyen de paiement.'); return }
    if (step < TOTAL_STEPS) setStep(step + 1)
  }

  function back() {
    setError('')
    if (step > 1) setStep(step - 1)
  }

  async function finish() {
    if (!userId) return
    setSaving(true)
    setError('')

    const preferences: OrganizerPreferences = {
      business_type: businessType || null,
      city: city.trim() || null,
      country: country.trim() || null,
      payment_methods: paymentMethods,
      social: {
        instagram: instagram.trim() || null,
        whatsapp: whatsapp.trim() || null,
        website: website.trim() || null,
      },
    }

    type Payload = {
      id: string
      role: string
      is_organizer: boolean
      organizer_preferences: OrganizerPreferences
      city: string | null
      country: string | null
    }
    const payload: Payload = {
      id: userId,
      role: 'organizer',
      is_organizer: true,
      organizer_preferences: preferences,
      city: city.trim() || null,
      country: country.trim() || null,
    }

    const { error: saveErr } = await supabase
      .from('profiles')
      .upsert(payload as never, { onConflict: 'id' })

    if (saveErr) {
      setError('Une erreur est survenue. Réessaie.')
      setSaving(false)
      return
    }

    router.push('/enterprise')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#08080F]">
        <Loader2 className="w-8 h-8 text-fuchsia-400 animate-spin" />
      </div>
    )
  }

  const progress = (step / TOTAL_STEPS) * 100
  const STEP_META = [
    { icon: Building2, label: 'Type de business' },
    { icon: MapPin,    label: 'Votre ville' },
    { icon: Wallet,    label: 'Moyens de paiement' },
    { icon: Share2,    label: 'Vos réseaux sociaux' },
  ][step - 1]
  const StepIcon = STEP_META.icon

  return (
    <div className="min-h-screen bg-[#08080F] px-6 py-8 flex flex-col">
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col">

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Link href="/">
            <Image src="/vybz-logo.png" alt="VYBZ" width={56} height={56} className="h-14 w-auto" priority />
          </Link>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-white/70">Étape {step} sur {TOTAL_STEPS}</span>
            <span className="text-xs text-zinc-500">{STEP_META.label}</span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-fuchsia-500/15 border border-fuchsia-500/30 mb-3">
            <StepIcon className="w-5 h-5 text-fuchsia-400" />
          </div>
          <h1 className="text-xl font-black text-white" style={{ fontFamily: 'Syne, sans-serif' }}>
            {STEP_META.label}
          </h1>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <div className="flex-1">
          {/* ── Step 1: Business type ── */}
          {step === 1 && (
            <div className="grid grid-cols-1 gap-2.5">
              {BUSINESS_TYPES.map((type) => {
                const active = businessType === type
                return (
                  <button
                    key={type}
                    onClick={() => setBusinessType(type)}
                    className={`flex items-center justify-between gap-2 px-4 py-3.5 rounded-2xl border text-left text-sm font-medium transition-all active:scale-[0.99] ${
                      active
                        ? 'bg-fuchsia-500/10 border-fuchsia-500/50 text-white'
                        : 'bg-zinc-900 border-purple-900/30 text-zinc-300 hover:border-purple-700/40'
                    }`}
                  >
                    {type}
                    {active && (
                      <span className="w-5 h-5 rounded-full bg-gradient-to-br from-fuchsia-500 to-cyan-400 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-white" />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* ── Step 2: City + country ── */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-zinc-400 text-sm text-center -mt-2 mb-2">
                Où organisez-vous vos événements ?
              </p>
              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">Ville</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text" value={city} onChange={(e) => setCity(e.target.value)} autoFocus
                    placeholder="Ex: Dakar"
                    className="w-full bg-zinc-900 border border-purple-900/30 rounded-xl pl-10 pr-4 py-3.5 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-fuchsia-500/50 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">Pays</label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text" value={country} onChange={(e) => setCountry(e.target.value)}
                    placeholder="Ex: Sénégal"
                    className="w-full bg-zinc-900 border border-purple-900/30 rounded-xl pl-10 pr-4 py-3.5 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-fuchsia-500/50 transition-colors"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3: Payment methods ── */}
          {step === 3 && (
            <div className="grid grid-cols-2 gap-2.5">
              {PAYMENT_METHODS.map((method) => {
                const active = paymentMethods.includes(method)
                return (
                  <button
                    key={method}
                    onClick={() => togglePayment(method)}
                    className={`flex items-center justify-between gap-1.5 px-3.5 py-3.5 rounded-2xl border text-left text-xs font-medium transition-all active:scale-[0.98] ${
                      active
                        ? 'bg-fuchsia-500/10 border-fuchsia-500/50 text-white'
                        : 'bg-zinc-900 border-purple-900/30 text-zinc-300 hover:border-purple-700/40'
                    }`}
                  >
                    {method}
                    {active && (
                      <span className="w-4 h-4 rounded-full bg-gradient-to-br from-fuchsia-500 to-cyan-400 flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* ── Step 4: Socials ── */}
          {step === 4 && (
            <div className="space-y-4">
              <p className="text-zinc-400 text-sm text-center -mt-2 mb-2">
                Tous les champs sont optionnels.
              </p>
              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">Instagram</label>
                <div className="relative">
                  <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text" value={instagram} onChange={(e) => setInstagram(e.target.value)}
                    placeholder="@votre_compte"
                    className="w-full bg-zinc-900 border border-purple-900/30 rounded-xl pl-10 pr-4 py-3.5 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-fuchsia-500/50 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">WhatsApp Business</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+221 77 000 00 00"
                    className="w-full bg-zinc-900 border border-purple-900/30 rounded-xl pl-10 pr-4 py-3.5 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-fuchsia-500/50 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">Site web</label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="url" value={website} onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-zinc-900 border border-purple-900/30 rounded-xl pl-10 pr-4 py-3.5 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-fuchsia-500/50 transition-colors"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="mt-8 space-y-3">
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button
                onClick={back}
                disabled={saving}
                className="flex items-center justify-center gap-1.5 px-5 py-3.5 rounded-full bg-white/5 border border-white/10 text-white/80 text-sm font-bold hover:bg-white/10 active:scale-[0.98] transition-all disabled:opacity-60"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </button>
            )}

            {step < TOTAL_STEPS ? (
              <button
                onClick={next}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white font-bold py-3.5 rounded-full text-sm hover:opacity-90 active:scale-[0.98] transition-all"
              >
                Suivant
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={finish}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white font-bold py-3.5 rounded-full text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {saving ? (<><Loader2 className="w-4 h-4 animate-spin" /> Finalisation…</>) : (<>Terminer <Check className="w-4 h-4" /></>)}
              </button>
            )}
          </div>

          {/* Skip on step 4 (social media) */}
          {step === TOTAL_STEPS && (
            <button
              onClick={finish}
              disabled={saving}
              className="w-full text-zinc-500 text-sm hover:text-white transition-colors py-2 disabled:opacity-60"
            >
              Passer cette étape
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
