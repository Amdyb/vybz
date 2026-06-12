'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Languages, CalendarClock } from 'lucide-react'
import LegalFooter from './LegalFooter'
import { LangContext } from './LangContext'
import type { Bilingual, Block, Lang } from './content'

function renderBlock(block: Block, i: number) {
  if (typeof block === 'string') {
    return (
      <p key={i} className="text-zinc-300 text-sm leading-relaxed mb-3">
        {block}
      </p>
    )
  }
  return (
    <ul key={i} className="mb-3 space-y-1.5">
      {block.list.map((item, j) => (
        <li key={j} className="flex gap-2.5 text-zinc-300 text-sm leading-relaxed">
          <span className="mt-2 w-1.5 h-1.5 rounded-full bg-fuchsia-500 shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export default function LegalShell({
  content,
  extra,
}: {
  content: Bilingual
  /** Optional interactive block rendered after the sections. Reads the active language via LangContext. */
  extra?: React.ReactNode
}) {
  const [lang, setLang] = useState<Lang>('fr')

  // Persist / restore language preference
  useEffect(() => {
    const saved = window.localStorage.getItem('vybz_lang')
    if (saved === 'fr' || saved === 'en') setLang(saved)
  }, [])

  function toggleLang() {
    const next: Lang = lang === 'fr' ? 'en' : 'fr'
    setLang(next)
    window.localStorage.setItem('vybz_lang', next)
  }

  const c = content[lang]

  return (
    <div className="min-h-screen bg-[#08080F] px-4 py-6">
      <div className="max-w-2xl mx-auto">

        {/* ── Top bar: logo + back + language toggle ── */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-2 group">
            <Image src="/vybz-logo.webp" alt="VYBZ" width={48} height={48} className="h-12 w-auto" priority />
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/5 border border-white/10 text-white/80 text-xs font-bold hover:bg-white/10 active:scale-95 transition-all"
              aria-label="Changer de langue"
            >
              <Languages className="w-3.5 h-3.5" />
              {lang === 'fr' ? 'EN' : 'FR'}
            </button>
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/5 border border-white/10 text-white/80 text-xs font-bold hover:bg-white/10 active:scale-95 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {lang === 'fr' ? 'Retour' : 'Back'}
            </Link>
          </div>
        </div>

        {/* ── Title ── */}
        <h1
          className="text-3xl font-black text-white mb-3"
          style={{ fontFamily: 'Syne, sans-serif' }}
        >
          {c.title}
        </h1>

        {c.effectiveDate && (
          <div className="inline-flex items-center gap-1.5 text-xs text-zinc-400 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 mb-6">
            <CalendarClock className="w-3.5 h-3.5" />
            {c.effectiveDate}
          </div>
        )}

        {c.intro && (
          <p className="text-zinc-300 text-sm leading-relaxed mb-8">
            {c.intro}
          </p>
        )}

        {/* ── Sections ── */}
        <div className="space-y-8">
          {c.sections.map((section, idx) => (
            <section key={idx}>
              <h2
                className="text-lg font-bold text-white mb-3 flex items-baseline gap-2"
                style={{ fontFamily: 'Syne, sans-serif' }}
              >
                <span className="text-fuchsia-400 text-sm font-black">{idx + 1}.</span>
                {section.heading}
              </h2>
              {section.blocks.map(renderBlock)}
            </section>
          ))}
        </div>

        {extra && (
          <LangContext.Provider value={lang}>
            <div className="mt-10">{extra}</div>
          </LangContext.Provider>
        )}

        {c.footerNote && (
          <p className="text-zinc-500 text-xs leading-relaxed mt-10 pt-6 border-t border-white/5">
            {c.footerNote}
          </p>
        )}

        <LegalFooter lang={lang} />
      </div>
    </div>
  )
}
