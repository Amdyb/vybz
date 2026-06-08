import type { Metadata } from 'next'
import LegalShell from '@/components/legal/LegalShell'
import CookieManager from '@/components/legal/CookieManager'
import type { Bilingual } from '@/components/legal/content'

export const metadata: Metadata = {
  title: 'Politique de Cookies — VYBZ',
  description: 'Comment VYBZ utilise les cookies et comment gérer vos préférences.',
}

const content: Bilingual = {
  fr: {
    title: 'Politique de Cookies',
    effectiveDate: 'Entrée en vigueur : juin 2026',
    intro:
      "VYBZ utilise des cookies et des technologies similaires pour faire fonctionner la plateforme, mesurer son audience et mémoriser vos préférences. Vous pouvez gérer vos choix à tout moment ci-dessous.",
    sections: [
      {
        heading: 'Cookies essentiels',
        blocks: [
          "Indispensables au fonctionnement de VYBZ : authentification, sécurité de la session et navigation. Ils ne peuvent pas être désactivés.",
        ],
      },
      {
        heading: 'Cookies analytiques',
        blocks: [
          "Ils nous permettent de comprendre comment VYBZ est utilisée (pages consultées, parcours) afin d'améliorer le service. Les données sont agrégées et anonymisées.",
        ],
      },
      {
        heading: 'Cookies de préférence',
        blocks: [
          "Ils mémorisent vos choix tels que la langue, la ville détectée et vos préférences d'affichage, pour une expérience personnalisée.",
        ],
      },
      {
        heading: 'Cookies tiers (Google Maps)',
        blocks: [
          "La carte VYBZ s'appuie sur Google Maps, qui peut déposer ses propres cookies lorsqu'une carte est affichée. Ces cookies sont régis par la politique de confidentialité de Google.",
        ],
      },
      {
        heading: 'Gestion des cookies',
        blocks: [
          "Vous pouvez accepter ou refuser les cookies non essentiels via la bannière affichée lors de votre première visite, ou à tout moment grâce au panneau ci-dessous. Vous pouvez également supprimer les cookies depuis les réglages de votre navigateur.",
        ],
      },
    ],
    footerNote: 'Éditeur : AmdyLabs LLC.',
  },
  en: {
    title: 'Cookie Policy',
    effectiveDate: 'Effective date: June 2026',
    intro:
      "VYBZ uses cookies and similar technologies to run the platform, measure its audience and remember your preferences. You can manage your choices at any time below.",
    sections: [
      {
        heading: 'Essential cookies',
        blocks: [
          "Essential to how VYBZ works: authentication, session security and navigation. They cannot be disabled.",
        ],
      },
      {
        heading: 'Analytics cookies',
        blocks: [
          "They help us understand how VYBZ is used (pages viewed, journeys) in order to improve the service. Data is aggregated and anonymized.",
        ],
      },
      {
        heading: 'Preference cookies',
        blocks: [
          "They remember choices such as language, detected city and display preferences, for a personalized experience.",
        ],
      },
      {
        heading: 'Third-party cookies (Google Maps)',
        blocks: [
          "The VYBZ map relies on Google Maps, which may set its own cookies when a map is displayed. These cookies are governed by Google’s privacy policy.",
        ],
      },
      {
        heading: 'Managing cookies',
        blocks: [
          "You can accept or decline non-essential cookies via the banner shown on your first visit, or at any time using the panel below. You can also delete cookies from your browser settings.",
        ],
      },
    ],
    footerNote: 'Publisher: AmdyLabs LLC.',
  },
}

export default function CookiesPage() {
  return <LegalShell content={content} extra={<CookieManager />} />
}
