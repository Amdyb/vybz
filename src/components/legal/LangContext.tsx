'use client'

import { createContext, useContext } from 'react'
import type { Lang } from './content'

/** Active language for legal/help pages, provided by LegalShell. */
export const LangContext = createContext<Lang>('fr')

export function useLegalLang(): Lang {
  return useContext(LangContext)
}
