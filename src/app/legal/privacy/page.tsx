import type { Metadata } from 'next'
import LegalShell from '@/components/legal/LegalShell'
import type { Bilingual } from '@/components/legal/content'

export const metadata: Metadata = {
  title: 'Politique de Confidentialité — VYBZ',
  description: 'Comment VYBZ collecte, utilise et protège vos données personnelles.',
}

const content: Bilingual = {
  fr: {
    title: 'Politique de Confidentialité',
    effectiveDate: 'Entrée en vigueur : juin 2026',
    intro:
      "AmdyLabs LLC accorde une grande importance à la protection de vos données personnelles. Cette politique décrit les données que nous collectons, leur utilisation et les droits dont vous disposez.",
    sections: [
      {
        heading: 'Données collectées',
        blocks: [
          'Nous collectons les catégories de données suivantes :',
          {
            list: [
              "Données de compte : nom, nom d'utilisateur, e-mail, photo de profil, ville et bio.",
              "Données d'utilisation : événements consultés, favoris, check-ins, avis, Pulse Points.",
              'Données de localisation : ville détectée afin d\'adapter le contenu (avec votre autorisation).',
              'Données techniques : type d\'appareil, navigateur et identifiants de session.',
            ],
          },
        ],
      },
      {
        heading: 'Utilisation des données',
        blocks: [
          'Vos données sont utilisées pour :',
          {
            list: [
              'Fournir et personnaliser le service VYBZ.',
              'Gérer votre compte, vos billets et vos Pulse Points.',
              'Vous envoyer des notifications utiles (via WhatsApp ou e-mail).',
              'Améliorer la sécurité et prévenir la fraude.',
            ],
          },
        ],
      },
      {
        heading: 'Partage des données',
        blocks: [
          "Nous ne vendons jamais vos données. Elles peuvent être partagées uniquement avec : les organisateurs d'événements pour lesquels vous achetez un billet, nos prestataires techniques (hébergement, messagerie, paiement) et les autorités lorsque la loi l'exige.",
        ],
      },
      {
        heading: 'Cookies et traceurs',
        blocks: [
          "VYBZ utilise des cookies essentiels, analytiques et de préférence, ainsi que des traceurs tiers (Google Maps). Pour en savoir plus et gérer vos choix, consultez notre Politique de Cookies.",
        ],
      },
      {
        heading: 'Droits des utilisateurs (RGPD)',
        blocks: [
          'Conformément au RGPD, vous disposez des droits suivants :',
          {
            list: [
              "Droit d'accès à vos données.",
              'Droit de rectification et de mise à jour.',
              "Droit à l'effacement (« droit à l'oubli »).",
              "Droit à la portabilité et droit d'opposition.",
            ],
          },
          'Pour exercer ces droits, contactez notre DPO à hello@amdylabs.com.',
        ],
      },
      {
        heading: 'Conservation des données',
        blocks: [
          "Vos données sont conservées tant que votre compte est actif. À la suppression du compte, elles sont effacées ou anonymisées sous 30 jours, sauf obligation légale de conservation.",
        ],
      },
      {
        heading: 'Sécurité',
        blocks: [
          "Nous mettons en œuvre des mesures techniques et organisationnelles (chiffrement, contrôle d'accès, RLS) pour protéger vos données contre tout accès non autorisé.",
        ],
      },
      {
        heading: 'Données des mineurs',
        blocks: [
          "VYBZ est destinée aux personnes âgées d'au moins 16 ans. Nous ne collectons pas sciemment de données concernant des personnes de moins de 16 ans. Tout compte identifié comme appartenant à un mineur sera supprimé.",
        ],
      },
      {
        heading: 'Contact DPO',
        blocks: [
          "Délégué à la Protection des Données — AmdyLabs LLC : hello@amdylabs.com.",
        ],
      },
    ],
    footerNote: 'Éditeur : AmdyLabs LLC. Politique conforme au RGPD et aux normes internationales applicables.',
  },
  en: {
    title: 'Privacy Policy',
    effectiveDate: 'Effective date: June 2026',
    intro:
      "AmdyLabs LLC takes the protection of your personal data seriously. This policy explains what data we collect, how we use it and the rights you have.",
    sections: [
      {
        heading: 'Data we collect',
        blocks: [
          'We collect the following categories of data:',
          {
            list: [
              'Account data: name, username, email, profile photo, city and bio.',
              'Usage data: viewed events, favorites, check-ins, reviews, Pulse Points.',
              'Location data: detected city to tailor content (with your permission).',
              'Technical data: device type, browser and session identifiers.',
            ],
          },
        ],
      },
      {
        heading: 'How we use data',
        blocks: [
          'Your data is used to:',
          {
            list: [
              'Provide and personalize the VYBZ service.',
              'Manage your account, tickets and Pulse Points.',
              'Send you useful notifications (via WhatsApp or email).',
              'Improve security and prevent fraud.',
            ],
          },
        ],
      },
      {
        heading: 'Data sharing',
        blocks: [
          "We never sell your data. It may only be shared with: organizers of events for which you buy a ticket, our technical providers (hosting, messaging, payment) and authorities where required by law.",
        ],
      },
      {
        heading: 'Cookies and trackers',
        blocks: [
          "VYBZ uses essential, analytics and preference cookies, as well as third-party trackers (Google Maps). To learn more and manage your choices, see our Cookie Policy.",
        ],
      },
      {
        heading: 'User rights (GDPR)',
        blocks: [
          'Under the GDPR, you have the following rights:',
          {
            list: [
              'Right to access your data.',
              'Right to rectification and update.',
              'Right to erasure (“right to be forgotten”).',
              'Right to portability and right to object.',
            ],
          },
          'To exercise these rights, contact our DPO at hello@amdylabs.com.',
        ],
      },
      {
        heading: 'Data retention',
        blocks: [
          "Your data is kept while your account is active. Upon account deletion, it is erased or anonymized within 30 days, unless a legal retention obligation applies.",
        ],
      },
      {
        heading: 'Security',
        blocks: [
          "We implement technical and organizational measures (encryption, access control, RLS) to protect your data against unauthorized access.",
        ],
      },
      {
        heading: 'Minors’ data',
        blocks: [
          "VYBZ is intended for people aged 16 or over. We do not knowingly collect data about anyone under 16. Any account identified as belonging to a minor will be deleted.",
        ],
      },
      {
        heading: 'DPO contact',
        blocks: [
          "Data Protection Officer — AmdyLabs LLC: hello@amdylabs.com.",
        ],
      },
    ],
    footerNote: 'Publisher: AmdyLabs LLC. Policy compliant with the GDPR and applicable international standards.',
  },
}

export default function PrivacyPage() {
  return <LegalShell content={content} />
}
