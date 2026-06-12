'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  Sparkles, MapPin, Music, Moon, ArrowLeft, ArrowRight,
  Check, Loader2, Globe,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { UserPreferences } from '@/lib/types'
import {
  USER_CATEGORIES, CATEGORY_COLORS,
  MUSIC_GENRES, GOING_OUT_FREQUENCIES, PREFERRED_NIGHTS,
} from '@/lib/utils'

const TOTAL_STEPS = 4

export default function UserOnboardingPage() {
  const router = useRouter()
  const [userId, setUserId]   = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [step, setStep]       = useState(1)

  // Form state
  const [categories, setCategories]   = useState<string[]>([])
  const [city, setCity]               = useState('')
  const [homeCity, setHomeCity]       = useState('')
  const [genres, setGenres]           = useState<string[]>([])
  const [frequency, setFrequency]     = useState('')
  const [nights, setNights]           = useState<string[]>([])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/sign-in'); return }

      // Already completed onboarding → don't re-run (and don't re-award points)
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_preferences')
        .eq('id', user.id)
        .maybeSingle()
      if ((profile as { user_preferences: UserPreferences | null } | null)?.user_preferences) {
        router.replace('/')
        return
      }

      setUserId(user.id)
      setLoading(false)
    }
    load()
  }, [router])

  const toggle = (list: string[], set: (v: string[]) => void) => (item: string) =>
    set(list.includes(item) ? list.filter((x) => x !== item) : [...list, item])

  function next() {
    setError('')
    if (step === 1 && categories.length === 0) { setError('Choisis au moins une vibe.'); return }
    if (step === 2 && !city.trim()) { setError('Indique ta ville.'); return }
    if (step === 3 && genres.length === 0) { setError('Choisis au moins un genre musical.'); return }
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

    const preferences: UserPreferences = {
      home_city: homeCity.trim() || null,
      music_genres: genres,
      going_out_frequency: frequency || null,
      preferred_nights: nights,
    }

    type Payload = {
      id: string
      favorite_categories: string[]
      is_organizer: boolean
      user_preferences: UserPreferences
      city: string | null
    }
    const payload: Payload = {
      id: userId,
      favorite_categories: categories,
      is_organizer: false,
      user_preferences: preferences,
      city: city.trim() || null,
    }

    const { error: saveErr } = await supabase
      .from('profiles')
      .upsert(payload as never, { onConflict: 'id' })

    if (saveErr) {
      setError('Une erreur est survenue. Réessaie.')
      setSaving(false)
      return
    }

    // Award "Complete onboarding: +15" (best-effort, guarded by the load-time check)
    await supabase.from('pulse_points_transactions').insert({
      user_id: userId,
      points: 15,
      action: 'onboarding',
      description: 'Onboarding complété',
    } as never)

    router.push('/')
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
    { icon: Sparkles, label: 'Tes vibes' },
    { icon: MapPin,   label: 'Ta ville' },
    { icon: Music,    label: 'Tes genres musicaux' },
    { icon: Moon,     label: 'Tu sors quand ?' },
  ][step - 1]
  const StepIcon = STEP_META.icon

  return (
    <div className="min-h-screen bg-[#08080F] px-6 py-8 flex flex-col">
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col">

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Link href="/">
            <Image src="/vybz-logo.svg" alt="VYBZ" unoptimized width={56} height={56} className="h-14 w-auto" priority />
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
          {/* ── Step 1: Vibes (categories) ── */}
          {step === 1 && (
            <>
              <p className="text-zinc-400 text-sm text-center -mt-2 mb-5">
                Choisis ce qui te fait vibrer pour personnaliser ton feed.
              </p>
              <div className="flex flex-wrap justify-center gap-2.5">
                {USER_CATEGORIES.map((cat) => {
                  const active = categories.includes(cat)
                  return (
                    <button
                      key={cat}
                      onClick={() => toggle(categories, setCategories)(cat)}
                      className={`flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider px-4 py-2.5 rounded-full border transition-all active:scale-95 ${
                        active
                          ? (CATEGORY_COLORS[cat] ?? 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30')
                          : 'bg-zinc-900 text-zinc-400 border-zinc-700/50 hover:border-zinc-600'
                      }`}
                    >
                      {active && <Check className="w-3.5 h-3.5" />}
                      {cat}
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {/* ── Step 2: City + home city ── */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-zinc-400 text-sm text-center -mt-2 mb-2">
                On t&apos;affiche les VYBZ autour de toi.
              </p>
              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">Ta ville</label>
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
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">
                  Ville d&apos;origine <span className="text-zinc-600 normal-case">(optionnel)</span>
                </label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text" value={homeCity} onChange={(e) => setHomeCity(e.target.value)}
                    placeholder="Ex: Abidjan"
                    className="w-full bg-zinc-900 border border-purple-900/30 rounded-xl pl-10 pr-4 py-3.5 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-fuchsia-500/50 transition-colors"
                  />
                </div>
                <p className="text-zinc-600 text-xs mt-2">Pour le Mode Diaspora : retrouve les events de chez toi, où que tu sois.</p>
              </div>
            </div>
          )}

          {/* ── Step 3: Music genres ── */}
          {step === 3 && (
            <>
              <p className="text-zinc-400 text-sm text-center -mt-2 mb-5">
                Quels sons te font bouger ?
              </p>
              <div className="flex flex-wrap justify-center gap-2.5">
                {MUSIC_GENRES.map((genre) => {
                  const active = genres.includes(genre)
                  return (
                    <button
                      key={genre}
                      onClick={() => toggle(genres, setGenres)(genre)}
                      className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-full border transition-all active:scale-95 ${
                        active
                          ? 'bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-500/40'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-700/50 hover:border-zinc-600'
                      }`}
                    >
                      {active && <Check className="w-3.5 h-3.5" />}
                      {genre}
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {/* ── Step 4: Going out ── */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 block">À quelle fréquence sors-tu ?</label>
                <div className="grid grid-cols-1 gap-2.5">
                  {GOING_OUT_FREQUENCIES.map((opt) => {
                    const active = frequency === opt
                    return (
                      <button
                        key={opt}
                        onClick={() => setFrequency(active ? '' : opt)}
                        className={`flex items-center justify-between gap-2 px-4 py-3.5 rounded-2xl border text-left text-sm font-medium transition-all active:scale-[0.99] ${
                          active
                            ? 'bg-fuchsia-500/10 border-fuchsia-500/50 text-white'
                            : 'bg-zinc-900 border-purple-900/30 text-zinc-300 hover:border-purple-700/40'
                        }`}
                      >
                        {opt}
                        {active && (
                          <span className="w-5 h-5 rounded-full bg-gradient-to-br from-fuchsia-500 to-cyan-400 flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 text-white" />
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 block">
                  Tes soirs préférés <span className="text-zinc-600 normal-case">(optionnel)</span>
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {PREFERRED_NIGHTS.map((nightOpt) => {
                    const active = nights.includes(nightOpt)
                    return (
                      <button
                        key={nightOpt}
                        onClick={() => toggle(nights, setNights)(nightOpt)}
                        className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-full border transition-all active:scale-95 ${
                          active
                            ? 'bg-cyan-500/15 text-cyan-200 border-cyan-500/40'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-700/50 hover:border-zinc-600'
                        }`}
                      >
                        {active && <Check className="w-3.5 h-3.5" />}
                        {nightOpt}
                      </button>
                    )
                  })}
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

          {/* Skip on step 4 */}
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
