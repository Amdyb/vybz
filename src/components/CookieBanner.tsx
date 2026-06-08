'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Cookie, Check, SlidersHorizontal, X } from 'lucide-react'
import { getConsent, saveConsent, acceptAll } from '@/lib/cookies'
import type { Lang } from '@/components/legal/content'

const T = {
  fr: {
    title: 'Nous utilisons des cookies',
    body: 'VYBZ utilise des cookies pour faire fonctionner la plateforme, mesurer son audience et mémoriser vos préférences.',
    learn: 'En savoir plus',
    accept: 'Tout accepter',
    manage: 'Gérer',
    save: 'Enregistrer',
    analytics: 'Cookies analytiques',
    preference: 'Cookies de préférence',
    essential: 'Essentiels (toujours actifs)',
  },
  en: {
    title: 'We use cookies',
    body: 'VYBZ uses cookies to run the platform, measure its audience and remember your preferences.',
    learn: 'Learn more',
    accept: 'Accept all',
    manage: 'Manage',
    save: 'Save',
    analytics: 'Analytics cookies',
    preference: 'Preference cookies',
    essential: 'Essential (always on)',
  },
}

export default function CookieBanner() {
  const [visible, setVisible]   = useState(false)
  const [managing, setManaging] = useState(false)
  const [lang, setLang]         = useState<Lang>('fr')
  const [analytics, setAnalytics]   = useState(true)
  const [preference, setPreference] = useState(true)

  useEffect(() => {
    // Only show when no consent has been recorded yet
    if (!getConsent()) setVisible(true)
    const saved = window.localStorage.getItem('vybz_lang')
    if (saved === 'fr' || saved === 'en') setLang(saved)
  }, [])

  if (!visible) return null

  const t = T[lang]

  function handleAcceptAll() {
    acceptAll()
    setVisible(false)
  }

  function handleSave() {
    saveConsent({ analytics, preference })
    setVisible(false)
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[200] p-3 sm:p-4 pointer-events-none">
      <div className="pointer-events-auto max-w-2xl mx-auto bg-zinc-950/95 backdrop-blur-xl border border-purple-900/40 rounded-[1.75rem] shadow-[0_-8px_40px_rgba(0,0,0,0.6)] p-5 mb-20 md:mb-4">

        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-fuchsia-500/15 border border-fuchsia-500/30 flex items-center justify-center shrink-0">
            <Cookie className="w-4 h-4 text-fuchsia-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-bold mb-1">{t.title}</p>
            <p className="text-zinc-400 text-xs leading-relaxed">
              {t.body}{' '}
              <Link href="/legal/cookies" className="text-fuchsia-400 hover:text-fuchsia-300 underline underline-offset-2">
                {t.learn}
              </Link>
            </p>
          </div>
          <button
            onClick={handleAcceptAll}
            aria-label="Fermer"
            className="text-zinc-600 hover:text-white transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Manage panel */}
        {managing && (
          <div className="mt-4 space-y-2">
            <Row label={t.essential} locked />
            <Row label={t.analytics}  on={analytics}  onChange={setAnalytics} />
            <Row label={t.preference} on={preference} onChange={setPreference} />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4">
          {!managing ? (
            <>
              <button
                onClick={() => setManaging(true)}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-white/80 text-xs font-bold hover:bg-white/10 active:scale-[0.98] transition-all"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                {t.manage}
              </button>
              <button
                onClick={handleAcceptAll}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white text-xs font-bold hover:opacity-90 active:scale-[0.98] transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                {t.accept}
              </button>
            </>
          ) : (
            <button
              onClick={handleSave}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white text-xs font-bold hover:opacity-90 active:scale-[0.98] transition-all"
            >
              <Check className="w-3.5 h-3.5" />
              {t.save}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({
  label, on, onChange, locked = false,
}: { label: string; on?: boolean; onChange?: (v: boolean) => void; locked?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10">
      <span className="text-white/80 text-xs font-medium">{label}</span>
      {locked ? (
        <span className="w-9 h-5 rounded-full bg-fuchsia-500/40 p-0.5 flex">
          <span className="block w-4 h-4 rounded-full bg-white/70 translate-x-4" />
        </span>
      ) : (
        <button
          role="switch"
          aria-checked={!!on}
          onClick={() => onChange?.(!on)}
          className={`w-9 h-5 rounded-full p-0.5 transition-colors ${on ? 'bg-fuchsia-500' : 'bg-zinc-700'}`}
        >
          <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${on ? 'translate-x-4' : 'translate-x-0'}`} />
        </button>
      )}
    </div>
  )
}
