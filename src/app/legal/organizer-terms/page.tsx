import type { Metadata } from 'next'
import LegalShell from '@/components/legal/LegalShell'
import type { Bilingual } from '@/components/legal/content'

export const metadata: Metadata = {
  title: 'Conditions Organisateurs — VYBZ',
  description: 'Conditions applicables aux organisateurs publiant des événements sur VYBZ.',
}

const content: Bilingual = {
  fr: {
    title: 'Conditions Organisateurs',
    effectiveDate: 'Entrée en vigueur : juin 2026',
    intro:
      "Les présentes conditions s'appliquent à tout organisateur, artiste ou promoteur qui publie des événements ou vend des billets via VYBZ, éditée par AmdyLabs LLC. Elles complètent les Conditions Générales d'Utilisation.",
    sections: [
      {
        heading: 'Éligibilité',
        blocks: [
          "Pour devenir organisateur, vous devez être majeur, disposer de la capacité juridique pour conclure des contrats et fournir des informations exactes sur votre activité.",
          "VYBZ se réserve le droit de refuser ou de suspendre tout compte organisateur ne respectant pas ces conditions.",
        ],
      },
      {
        heading: 'Abonnements et tarifs',
        blocks: [
          'Trois formules sont proposées :',
          {
            list: [
              'Basic (gratuit) : création et publication d\'événements, page organisateur publique, sans vente de billets.',
              'Pro (mensuel) : vente de billets avec QR codes, scanner à la porte, analytiques et revenus.',
              'Premium (mensuel) : toutes les fonctionnalités Pro, mise en avant sur l\'accueil, VYBZ Drops, réservation d\'artistes et support prioritaire.',
            ],
          },
          'Les abonnements payants sont facturés mensuellement via PayDunya, sans engagement, et peuvent être résiliés à tout moment.',
        ],
      },
      {
        heading: "Responsabilités de l'organisateur",
        blocks: [
          "L'organisateur est seul responsable de l'exactitude des informations de ses événements, du respect des autorisations légales, de la sécurité du public et du bon déroulement de l'événement.",
          "L'organisateur s'engage à honorer les billets vendus et à informer les participants de tout changement ou annulation.",
        ],
      },
      {
        heading: 'Gestion des paiements',
        blocks: [
          "VYBZ ne touche jamais l'argent des billets. Chaque organisateur configure et gère son propre moyen de paiement (Wave, Orange Money, PayPal, carte bancaire ou paiement sur place).",
          "L'organisateur est responsable de la collecte des fonds, de la facturation, des taxes applicables et des remboursements éventuels auprès de ses clients.",
        ],
      },
      {
        heading: 'Billetterie et QR codes',
        blocks: [
          "Pour chaque billet vendu, VYBZ génère un QR code unique et à usage unique. L'organisateur scanne ce QR code à l'entrée via le scanner VYBZ ; toute tentative de réutilisation est signalée avec l'heure du premier scan.",
          "L'organisateur s'engage à ne pas dupliquer, falsifier ou contourner le système de QR codes.",
        ],
      },
      {
        heading: 'Contenu interdit',
        blocks: [
          'Sont notamment interdits les événements ou contenus :',
          {
            list: [
              'Illégaux, dangereux ou portant atteinte à l\'ordre public.',
              'Trompeurs, frauduleux ou usurpant l\'identité d\'un tiers.',
              'Haineux, discriminatoires ou à caractère pornographique.',
            ],
          },
        ],
      },
      {
        heading: 'Résiliation',
        blocks: [
          "L'organisateur peut résilier son abonnement à tout moment depuis son espace. VYBZ peut suspendre ou résilier un compte en cas de violation des présentes conditions, de fraude ou de plaintes répétées.",
        ],
      },
      {
        heading: 'Commission et revenus VYBZ',
        blocks: [
          "VYBZ se rémunère principalement via les abonnements organisateurs, les commissions d'affiliation et les placements sponsorisés. VYBZ ne prélève pas de commission sur les ventes de billets gérées directement par l'organisateur.",
          "Toute offre de mise en avant ou de placement sponsorisé fait l'objet d'un accord distinct.",
        ],
      },
    ],
    footerNote:
      "Les présentes conditions sont régies par le droit sénégalais, dans le respect des normes internationales applicables. Éditeur : AmdyLabs LLC. Contact : hello@amdylabs.com.",
  },
  en: {
    title: 'Organizer Terms',
    effectiveDate: 'Effective date: June 2026',
    intro:
      "These terms apply to any organizer, artist or promoter who publishes events or sells tickets through VYBZ, operated by AmdyLabs LLC. They supplement the Terms of Use.",
    sections: [
      {
        heading: 'Eligibility',
        blocks: [
          "To become an organizer, you must be of legal age, have the legal capacity to enter into contracts and provide accurate information about your activity.",
          "VYBZ reserves the right to refuse or suspend any organizer account that does not comply with these terms.",
        ],
      },
      {
        heading: 'Subscriptions and pricing',
        blocks: [
          'Three plans are available:',
          {
            list: [
              'Basic (free): create and publish events, public organizer page, no ticket sales.',
              'Pro (monthly): ticket sales with QR codes, door scanner, analytics and revenue.',
              'Premium (monthly): all Pro features, home-page featuring, VYBZ Drops, artist booking and priority support.',
            ],
          },
          'Paid subscriptions are billed monthly through PayDunya, with no commitment, and can be cancelled at any time.',
        ],
      },
      {
        heading: 'Organizer responsibilities',
        blocks: [
          "The organizer is solely responsible for the accuracy of their event information, compliance with legal permits, public safety and the proper running of the event.",
          "The organizer agrees to honour tickets sold and to inform attendees of any change or cancellation.",
        ],
      },
      {
        heading: 'Payment handling',
        blocks: [
          "VYBZ never touches ticket money. Each organizer sets up and manages their own payment method (Wave, Orange Money, PayPal, credit card or cash on arrival).",
          "The organizer is responsible for collecting funds, invoicing, applicable taxes and any refunds to their customers.",
        ],
      },
      {
        heading: 'Ticketing and QR codes',
        blocks: [
          "For each ticket sold, VYBZ generates a unique, single-use QR code. The organizer scans this QR code at the door via the VYBZ scanner; any reuse attempt is flagged with the time of the first scan.",
          "The organizer agrees not to duplicate, forge or bypass the QR code system.",
        ],
      },
      {
        heading: 'Prohibited content',
        blocks: [
          'The following events or content are prohibited, among others:',
          {
            list: [
              'Illegal, dangerous or contrary to public order.',
              'Misleading, fraudulent or impersonating a third party.',
              'Hateful, discriminatory or pornographic.',
            ],
          },
        ],
      },
      {
        heading: 'Termination',
        blocks: [
          "The organizer may cancel their subscription at any time from their dashboard. VYBZ may suspend or terminate an account in the event of a breach of these terms, fraud or repeated complaints.",
        ],
      },
      {
        heading: 'VYBZ commission and revenue',
        blocks: [
          "VYBZ earns revenue mainly through organizer subscriptions, affiliate commissions and sponsored placements. VYBZ does not take a commission on ticket sales handled directly by the organizer.",
          "Any featuring or sponsored placement offer is subject to a separate agreement.",
        ],
      },
    ],
    footerNote:
      "These terms are governed by Senegalese law, in compliance with applicable international standards. Publisher: AmdyLabs LLC. Contact: hello@amdylabs.com.",
  },
}

export default function OrganizerTermsPage() {
  return <LegalShell content={content} />
}
