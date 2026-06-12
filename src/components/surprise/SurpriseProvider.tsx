'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Shuffle } from 'lucide-react'
import SurpriseOverlay from './SurpriseOverlay'

type SurpriseValue = { open: () => void }

const Ctx = createContext<SurpriseValue>({ open: () => {} })

/** Trigger the Surprise Me overlay from anywhere inside the app shell. */
export function useSurprise(): SurpriseValue {
  return useContext(Ctx)
}

export function SurpriseProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const open  = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])

  // Hide the floating button where the bottom nav is hidden (1:1 conversations)
  // or while the overlay is already open.
  const hideFab = isOpen || /^\/messages\/[^/]+$/.test(pathname)

  return (
    <Ctx.Provider value={{ open }}>
      {children}

      {/* Center floating action button — sits above the mobile bottom nav */}
      {!hideFab && (
        <button
          onClick={open}
          aria-label="Surprends-moi"
          className="md:hidden fixed left-1/2 -translate-x-1/2 bottom-[72px] z-[55] w-14 h-14 rounded-full bg-gradient-to-br from-fuchsia-500 to-cyan-500 flex items-center justify-center text-white border-4 border-[#08080F] shadow-[0_0_22px_rgba(217,70,239,0.55)] active:scale-90 transition-transform animate-surprise-glow"
        >
          <Shuffle className="w-6 h-6" />
        </button>
      )}

      <SurpriseOverlay open={isOpen} onClose={close} />
    </Ctx.Provider>
  )
}
