import type { Metadata } from 'next'
import LegalShell from '@/components/legal/LegalShell'
import type { Bilingual } from '@/components/legal/content'

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation — VYBZ",
  description: "Conditions Générales d'Utilisation de la plateforme VYBZ.",
}

const content: Bilingual = {
  fr: {
    title: "Conditions Générales d'Utilisation",
    effectiveDate: 'Entrée en vigueur : juin 2026',
    intro:
      "Les présentes Conditions Générales d'Utilisation (les « Conditions ») régissent votre accès et votre utilisation de VYBZ, plateforme de découverte de la vie nocturne et des événements éditée par AmdyLabs LLC. En utilisant VYBZ, vous acceptez ces Conditions dans leur intégralité.",
    sections: [
      {
        heading: 'Acceptation des conditions',
        blocks: [
          "En créant un compte ou en utilisant VYBZ de quelque manière que ce soit, vous reconnaissez avoir lu, compris et accepté les présentes Conditions ainsi que notre Politique de Confidentialité.",
          "Si vous n'acceptez pas ces Conditions, vous ne devez pas utiliser la plateforme.",
        ],
      },
      {
        heading: 'Description du service',
        blocks: [
          "VYBZ est une plateforme qui permet de découvrir des événements, des clubs et des lieux, de suivre des organisateurs, de gagner des Pulse Points et, le cas échéant, d'accéder à la billetterie proposée par les organisateurs.",
          "VYBZ agit en tant qu'intermédiaire technologique. VYBZ ne gère jamais directement les paiements entre les utilisateurs et les organisateurs.",
        ],
      },
      {
        heading: 'Compte utilisateur',
        blocks: [
          "Vous devez fournir des informations exactes lors de la création de votre compte et les maintenir à jour.",
          "Vous êtes responsable de la confidentialité de vos identifiants et de toute activité réalisée depuis votre compte.",
          "Vous vous engagez à n'utiliser qu'un seul compte personnel et à ne pas usurper l'identité d'un tiers.",
        ],
      },
      {
        heading: 'Compte organisateur et abonnements',
        blocks: [
          "Les organisateurs peuvent créer un espace dédié pour publier des événements et, selon leur formule, vendre des billets.",
          'Trois formules sont proposées :',
          {
            list: [
              'Basic (gratuit) : publication d\'événements uniquement, sans vente de billets.',
              'Pro (mensuel) : vente de billets, page organisateur et analytiques.',
              'Premium (mensuel) : toutes les fonctionnalités Pro, mise en avant, VYBZ Drops et support prioritaire.',
            ],
          },
          "Les abonnements payants sont facturés via PayDunya, sans engagement, et peuvent être résiliés à tout moment. Les conditions détaillées figurent dans les Conditions Organisateurs.",
        ],
      },
      {
        heading: 'Billetterie et paiements',
        blocks: [
          "VYBZ ne gère jamais les paiements de billets. Chaque organisateur met en place son propre moyen de paiement (Wave, Orange Money, PayPal, carte bancaire ou paiement sur place).",
          "Après l'achat auprès de l'organisateur, VYBZ génère un QR code unique transmis via WhatsApp et conservé dans « Mes Billets ». Ce QR code est à usage unique et scanné à l'entrée par l'organisateur.",
          "Toute réclamation relative à un paiement, un remboursement ou l'accès à un événement relève de la responsabilité de l'organisateur concerné.",
        ],
      },
      {
        heading: 'Propriété intellectuelle',
        blocks: [
          "La marque VYBZ, son logo, son interface, ses textes et ses éléments graphiques sont la propriété exclusive d'AmdyLabs LLC et sont protégés par les lois applicables.",
          "Aucune reproduction, modification ou exploitation n'est autorisée sans autorisation écrite préalable.",
        ],
      },
      {
        heading: 'Contenu utilisateur',
        blocks: [
          "Vous restez propriétaire des photos, avis et contenus que vous publiez. Vous accordez à VYBZ une licence non exclusive, mondiale et gratuite pour héberger et afficher ces contenus dans le cadre du service.",
          "Vous garantissez disposer des droits nécessaires sur les contenus publiés et acceptez qu'ils puissent être retirés en cas de non-respect des présentes Conditions.",
        ],
      },
      {
        heading: 'Conduite interdite',
        blocks: [
          'Il est notamment interdit de :',
          {
            list: [
              'Publier des contenus illégaux, haineux, diffamatoires ou pornographiques.',
              "Frauder, revendre des billets de manière non autorisée ou contourner la billetterie.",
              "Collecter les données d'autres utilisateurs sans consentement.",
              "Perturber le fonctionnement de la plateforme ou tenter d'y accéder de façon non autorisée.",
            ],
          },
        ],
      },
      {
        heading: 'Limitation de responsabilité',
        blocks: [
          "VYBZ est fournie « en l'état ». AmdyLabs LLC ne saurait être tenue responsable de la qualité, de l'annulation ou du déroulement des événements proposés par les organisateurs.",
          "Dans la limite autorisée par la loi, la responsabilité d'AmdyLabs LLC est limitée aux montants éventuellement versés à VYBZ au cours des douze derniers mois.",
        ],
      },
      {
        heading: 'Modification des conditions',
        blocks: [
          "VYBZ peut modifier les présentes Conditions à tout moment. En cas de changement substantiel, les utilisateurs seront informés. La poursuite de l'utilisation vaut acceptation des Conditions mises à jour.",
        ],
      },
      {
        heading: 'Contact',
        blocks: [
          "Pour toute question relative à ces Conditions : hello@amdylabs.com.",
        ],
      },
    ],
    footerNote:
      "Les présentes Conditions sont régies par le droit sénégalais, dans le respect des normes internationales applicables. Éditeur : AmdyLabs LLC.",
  },
  en: {
    title: 'Terms of Use',
    effectiveDate: 'Effective date: June 2026',
    intro:
      "These Terms of Use (the “Terms”) govern your access to and use of VYBZ, a nightlife and events discovery platform operated by AmdyLabs LLC. By using VYBZ, you agree to these Terms in full.",
    sections: [
      {
        heading: 'Acceptance of terms',
        blocks: [
          "By creating an account or using VYBZ in any way, you acknowledge that you have read, understood and accepted these Terms and our Privacy Policy.",
          "If you do not accept these Terms, you must not use the platform.",
        ],
      },
      {
        heading: 'Description of the service',
        blocks: [
          "VYBZ lets you discover events, clubs and venues, follow organizers, earn Pulse Points and, where applicable, access ticketing offered by organizers.",
          "VYBZ acts as a technology intermediary and never directly handles payments between users and organizers.",
        ],
      },
      {
        heading: 'User account',
        blocks: [
          "You must provide accurate information when creating your account and keep it up to date.",
          "You are responsible for keeping your credentials confidential and for all activity carried out from your account.",
          "You agree to maintain a single personal account and not to impersonate any third party.",
        ],
      },
      {
        heading: 'Organizer account and subscriptions',
        blocks: [
          "Organizers can create a dedicated space to publish events and, depending on their plan, sell tickets.",
          'Three plans are available:',
          {
            list: [
              'Basic (free): event listing only, no ticket sales.',
              'Pro (monthly): ticket sales, organizer page and analytics.',
              'Premium (monthly): all Pro features, featured placement, VYBZ Drops and priority support.',
            ],
          },
          "Paid subscriptions are billed through PayDunya, with no commitment, and can be cancelled at any time. Detailed terms are set out in the Organizer Terms.",
        ],
      },
      {
        heading: 'Ticketing and payments',
        blocks: [
          "VYBZ never handles ticket payments. Each organizer sets up their own payment method (Wave, Orange Money, PayPal, credit card or cash on arrival).",
          "After purchase from the organizer, VYBZ generates a unique QR code sent via WhatsApp and stored under “My Tickets”. The QR code is single-use and scanned at the door by the organizer.",
          "Any claim relating to a payment, refund or event access is the responsibility of the relevant organizer.",
        ],
      },
      {
        heading: 'Intellectual property',
        blocks: [
          "The VYBZ brand, logo, interface, text and graphic elements are the exclusive property of AmdyLabs LLC and are protected by applicable laws.",
          "No reproduction, modification or exploitation is permitted without prior written authorization.",
        ],
      },
      {
        heading: 'User content',
        blocks: [
          "You retain ownership of the photos, reviews and content you post. You grant VYBZ a non-exclusive, worldwide, royalty-free licence to host and display this content as part of the service.",
          "You warrant that you hold the necessary rights to the content posted and accept that it may be removed if these Terms are breached.",
        ],
      },
      {
        heading: 'Prohibited conduct',
        blocks: [
          'The following are prohibited, among others:',
          {
            list: [
              'Posting illegal, hateful, defamatory or pornographic content.',
              'Committing fraud, reselling tickets without authorization or bypassing ticketing.',
              'Collecting other users’ data without consent.',
              'Disrupting the platform or attempting unauthorized access.',
            ],
          },
        ],
      },
      {
        heading: 'Limitation of liability',
        blocks: [
          "VYBZ is provided “as is”. AmdyLabs LLC cannot be held responsible for the quality, cancellation or conduct of events offered by organizers.",
          "To the extent permitted by law, AmdyLabs LLC’s liability is limited to any amounts paid to VYBZ during the previous twelve months.",
        ],
      },
      {
        heading: 'Changes to the terms',
        blocks: [
          "VYBZ may amend these Terms at any time. In the event of a material change, users will be notified. Continued use constitutes acceptance of the updated Terms.",
        ],
      },
      {
        heading: 'Contact',
        blocks: [
          "For any question about these Terms: hello@amdylabs.com.",
        ],
      },
    ],
    footerNote:
      "These Terms are governed by Senegalese law, in compliance with applicable international standards. Publisher: AmdyLabs LLC.",
  },
}

export default function TermsPage() {
  return <LegalShell content={content} />
}
