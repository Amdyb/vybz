'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { UserPreferences } from '@/lib/types'

type LocationValue = {
  detectedCity: string       // where the user physically is (ipapi)
  detectedCountry: string    // ISO country code for external APIs
  homeCity: string | null    // from profile.user_preferences.home_city
  diaspora: boolean          // true only when toggled ON *and* a home city exists
  activeCity: string         // the city that drives location-aware features
  activeCountry: string      // country code for the active city ('' for home city)
  setDiaspora: (v: boolean) => void
}

const FALLBACK: LocationValue = {
  detectedCity: 'Dakar', detectedCountry: 'SN', homeCity: null,
  diaspora: false, activeCity: 'Dakar', activeCountry: 'SN', setDiaspora: () => {},
}

const Ctx = createContext<LocationValue | null>(null)

const LS_DIASPORA = 'vybz-diaspora'
const LS_DETECTED = 'vybz-detected-loc'
const LS_HOME     = 'vybz-home-city'

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [detectedCity, setDetectedCity]       = useState('Dakar')
  const [detectedCountry, setDetectedCountry] = useState('SN')
  const [homeCity, setHomeCity]               = useState<string | null>(null)
  const [diaspora, setDiasporaState]          = useState(false)

  useEffect(() => {
    // 1. Hydrate instantly from cache (no flash, works offline)
    try {
      const d = localStorage.getItem(LS_DETECTED)
      if (d) { const { city, country } = JSON.parse(d); if (city) setDetectedCity(city); if (country) setDetectedCountry(country) }
      const h = localStorage.getItem(LS_HOME); if (h) setHomeCity(h)
      setDiasporaState(localStorage.getItem(LS_DIASPORA) === '1')
    } catch {}

    // 2. Refresh physical location
    fetch('https://ipapi.co/json/')
      .then((r) => r.json())
      .then((geo) => {
        if (geo.city) setDetectedCity(geo.city)
        if (geo.country_code) setDetectedCountry(geo.country_code)
        try { localStorage.setItem(LS_DETECTED, JSON.stringify({ city: geo.city, country: geo.country_code })) } catch {}
      })
      .catch(() => {})

    // 3. Load home city from the signed-in profile
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return
      const { data } = await supabase
        .from('profiles').select('user_preferences').eq('id', session.user.id).maybeSingle()
      const prefs = (data as { user_preferences: UserPreferences | null } | null)?.user_preferences
      const hc = prefs?.home_city ?? null
      setHomeCity(hc)
      try {
        if (hc) localStorage.setItem(LS_HOME, hc)
        else localStorage.removeItem(LS_HOME)
      } catch {}
    })
  }, [])

  const setDiaspora = useCallback((v: boolean) => {
    setDiasporaState(v)
    try { localStorage.setItem(LS_DIASPORA, v ? '1' : '0') } catch {}
  }, [])

  // Diaspora only takes effect when a home city is actually set.
  const effDiaspora  = diaspora && !!homeCity
  const activeCity    = effDiaspora ? (homeCity as string) : detectedCity
  const activeCountry = effDiaspora ? '' : detectedCountry

  return (
    <Ctx.Provider value={{ detectedCity, detectedCountry, homeCity, diaspora: effDiaspora, activeCity, activeCountry, setDiaspora }}>
      {children}
    </Ctx.Provider>
  )
}

export function useLocation(): LocationValue {
  return useContext(Ctx) ?? FALLBACK
}
