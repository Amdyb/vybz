// ─── Shared types & data for legal / help pages ────────────────────────────────

export type Lang = 'fr' | 'en'

/** A content block: a paragraph string, or a bullet list. */
export type Block = string | { list: string[] }

export interface Section {
  heading: string
  blocks: Block[]
}

export interface LegalContent {
  title: string
  intro?: string
  effectiveDate?: string
  sections: Section[]
  footerNote?: string
}

export type Bilingual = Record<Lang, LegalContent>

/** Footer link targets shared across every legal/help page and the app footer. */
export const LEGAL_LINKS: { href: string; fr: string; en: string }[] = [
  { href: '/legal/terms',           fr: "Conditions d'utilisation",  en: 'Terms of Use' },
  { href: '/legal/privacy',         fr: 'Confidentialité',           en: 'Privacy' },
  { href: '/legal/cookies',         fr: 'Cookies',                   en: 'Cookies' },
  { href: '/help',                  fr: "Centre d'aide",             en: 'Help Center' },
  { href: '/legal/organizer-terms', fr: 'Conditions organisateurs',  en: 'Organizer Terms' },
]
