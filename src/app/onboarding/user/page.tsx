'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Sparkles, Check, Loader2, MapPin, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { USER_CATEGORIES, CATEGORY_COLORS } from '@/lib/utils'

export default function UserOnboardingPage() {
  const router = useRouter()
  const [userId, setUserId]   = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [city, setCity] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/sign-in'); return }
      setUserId(user.id)
      setLoading(false)
    })
  }, [router])

  function toggle(cat: string) {
    setCategories((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat])
  }

  async function finish() {
    if (!userId) return
    setSaving(true)

    type Payload = {
      id: string
      favorite_categories: string[]
      is_organizer: boolean
      city?: string
    }
    const payload: Payload = {
      id: userId,
      favorite_categories: categories,
      is_organizer: false,
    }
    if (city.trim()) payload.city = city.trim()

    await supabase.from('profiles').upsert(payload as never, { onConflict: 'id' })
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#08080F]">
        <Loader2 className="w-8 h-8 text-fuchsia-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#08080F] px-6 py-10 flex flex-col">
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col">

        <div className="flex justify-center mb-8">
          <Link href="/">
            <Image src="/vybz-logo.png" alt="VYBZ" width={64} height={64} className="h-16 w-auto" priority />
          </Link>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-fuchsia-500/15 border border-fuchsia-500/30 mb-4">
            <Sparkles className="w-5 h-5 text-fuchsia-400" />
          </div>
          <h1 className="text-2xl font-black text-white mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
            Qu&apos;est-ce qui vous fait vibrer ?
          </h1>
          <p className="text-zinc-400 text-sm">
            Choisissez vos catégories préférées pour personnaliser votre feed.
          </p>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap justify-center gap-2.5 mb-8">
          {USER_CATEGORIES.map((cat) => {
            const active = categories.includes(cat)
            return (
              <button
                key={cat}
                onClick={() => toggle(cat)}
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

        {/* City (optional) */}
        <div className="mb-2">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 block">
            Votre ville (optionnel)
          </label>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ex: Dakar"
              className="w-full bg-zinc-900 border border-purple-900/30 rounded-xl pl-10 pr-4 py-3.5 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-fuchsia-500/50 transition-colors"
            />
          </div>
        </div>

        <div className="mt-auto pt-8 space-y-3">
          <button
            onClick={finish}
            disabled={saving}
            className="w-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white font-bold py-3.5 rounded-full text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement…</>
            ) : (
              <>Commencer l&apos;aventure <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
          <button
            onClick={() => router.push('/')}
            disabled={saving}
            className="w-full text-zinc-500 text-sm hover:text-white transition-colors py-2"
          >
            Passer pour l&apos;instant
          </button>
        </div>
      </div>
    </div>
  )
}
