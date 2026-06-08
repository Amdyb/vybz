// ─── Cookie consent: shared storage between the banner and the cookies page ─────

export interface CookieConsent {
  essential: true            // always on — required for the app to work
  analytics: boolean
  preference: boolean
  ts: number
}

export const CONSENT_KEY = 'vybz_cookie_consent'
/** Fired on the window whenever consent changes, so mounted components can react. */
export const CONSENT_EVENT = 'vybz-consent-change'

export function getConsent(): CookieConsent | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CookieConsent
    return { ...parsed, essential: true }
  } catch {
    return null
  }
}

export function saveConsent(consent: Omit<CookieConsent, 'essential' | 'ts'>): CookieConsent {
  const full: CookieConsent = { essential: true, ...consent, ts: Date.now() }
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify(full))
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT))
  }
  return full
}

export function acceptAll(): CookieConsent {
  return saveConsent({ analytics: true, preference: true })
}
