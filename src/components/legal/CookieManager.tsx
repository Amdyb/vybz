'use client'

import { useEffect, useState } from 'react'
import { Check, Lock, SlidersHorizontal } from 'lucide-react'
import { getConsent, saveConsent } from '@/lib/cookies'
import { useLegalLang } from './LangContext'

const T = {
  fr: {
    title: 'Gérer mes préférences',
    essential: 'Cookies essentiels',
    essentialDesc: "Nécessaires au fonctionnement du site. Toujours actifs.",
    analytics: 'Cookies analytiques',
    analyticsDesc: "Nous aident à comprendre l'utilisation de VYBZ.",
    preference: 'Cookies de préférence',
    preferenceDesc: 'Mémorisent vos choix (langue, ville, affichage).',
    always: 'Toujours actif',
    save: 'Enregistrer mes préférences',
    saved: 'Préférences enregistrées',
  },
  en: {
    title: 'Manage my preferences',
    essential: 'Essential cookies',
    essentialDesc: 'Required for the site to work. Always on.',
    analytics: 'Analytics cookies',
    analyticsDesc: 'Help us understand how VYBZ is used.',
    preference: 'Preference cookies',
    preferenceDesc: 'Remember your choices (language, city, display).',
    always: 'Always on',
    save: 'Save my preferences',
    saved: 'Preferences saved',
  },
}

export default function CookieManager() {
  const lang = useLegalLang()
  const t = T[lang]
  const [analytics, setAnalytics]   = useState(false)
  const [preference, setPreference] = useState(false)
  const [saved, setSaved]           = useState(false)

  useEffect(() => {
    const c = getConsent()
    if (c) { setAnalytics(c.analytics); setPreference(c.preference) }
  }, [])

  function handleSave() {
    saveConsent({ analytics, preference })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="bg-zinc-900 border border-purple-900/30 rounded-[2rem] p-5 pt-6">
      <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2" style={{ fontFamily: 'Syne, sans-serif' }}>
        <SlidersHorizontal className="w-4 h-4 text-fuchsia-400" />
        {t.title}
      </h2>

      <div className="space-y-3">
        {/* Essential — locked on */}
        <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold">{t.essential}</p>
            <p className="text-zinc-400 text-xs mt-0.5">{t.essentialDesc}</p>
          </div>
          <span className="flex items-center gap-1 text-[11px] font-bold text-zinc-500 shrink-0 mt-0.5">
            <Lock className="w-3 h-3" />
            {t.always}
          </span>
        </div>

        <ToggleRow
          label={t.analytics} desc={t.analyticsDesc}
          on={analytics} onChange={setAnalytics}
        />
        <ToggleRow
          label={t.preference} desc={t.preferenceDesc}
          on={preference} onChange={setPreference}
        />
      </div>

      <button
        onClick={handleSave}
        className="w-full mt-5 bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white font-bold py-3.5 rounded-2xl text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all"
      >
        <Check className="w-4 h-4" />
        {saved ? t.saved : t.save}
      </button>
    </div>
  )
}

function ToggleRow({
  label, desc, on, onChange,
}: { label: string; desc: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
      <div className="min-w-0">
        <p className="text-white text-sm font-semibold">{label}</p>
        <p className="text-zinc-400 text-xs mt-0.5">{desc}</p>
      </div>
      <button
        role="switch"
        aria-checked={on}
        onClick={() => onChange(!on)}
        className={`shrink-0 mt-0.5 w-11 h-6 rounded-full p-0.5 transition-colors ${
          on ? 'bg-fuchsia-500' : 'bg-zinc-700'
        }`}
      >
        <span
          className={`block w-5 h-5 rounded-full bg-white transition-transform ${
            on ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}
