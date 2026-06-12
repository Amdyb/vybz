// Organizer subscription plans (shared by UI + API — no secrets here).

export type PlanId = 'basic' | 'pro' | 'premium'
export type PaidPlanId = 'pro' | 'premium'

export interface PlanConfig {
  id: PlanId
  label: string
  amount: number          // monthly price in XOF (0 for basic)
  period: string
  tagline: string
  features: string[]
  recommended?: boolean
}

export const PLANS: Record<PlanId, PlanConfig> = {
  basic: {
    id: 'basic', label: 'Basic', amount: 0, period: 'pour toujours',
    tagline: 'Listez vos événements gratuitement',
    features: [
      'Créer et lister des événements',
      'Page organisateur publique',
      "Jusqu'à 5 événements actifs",
      'Support par email',
    ],
  },
  pro: {
    id: 'pro', label: 'Pro', amount: 9900, period: 'XOF / mois',
    tagline: 'Vendez des billets et suivez vos revenus',
    recommended: true,
    features: [
      'Tout ce qui est inclus dans Basic',
      'Vente de billets avec QR codes',
      'Scanner de billets à la porte',
      'Analytiques et revenus',
      "Jusqu'à 50 événements actifs",
      'Page organisateur personnalisée',
    ],
  },
  premium: {
    id: 'premium', label: 'Premium', amount: 24900, period: 'XOF / mois',
    tagline: 'Visibilité maximale + VYBZ Drops',
    features: [
      'Tout ce qui est inclus dans Pro',
      "Mise en avant sur l'accueil VYBZ",
      'Accès aux VYBZ Drops',
      'Événements illimités',
      'Support prioritaire 24/7',
      'Réservation artistes et DJs',
    ],
  },
}

export const PAID_PLANS: PaidPlanId[] = ['pro', 'premium']

export function isPaidPlan(p: string): p is PaidPlanId {
  return p === 'pro' || p === 'premium'
}

export function formatXOF(n: number): string {
  return n.toLocaleString('fr-FR')
}
