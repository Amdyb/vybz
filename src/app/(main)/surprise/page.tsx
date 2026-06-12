'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useSurprise } from '@/components/surprise/SurpriseProvider'

/**
 * /surprise is a deep-link entry point: it triggers the global Surprise Me
 * overlay (mounted in the app shell) and drops the user back on Home, where
 * the overlay slides up over the feed.
 */
export default function SurprisePage() {
  const router = useRouter()
  const { open } = useSurprise()

  useEffect(() => {
    open()
    router.replace('/')
  }, [open, router])

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-fuchsia-400 animate-spin" />
    </div>
  )
}
