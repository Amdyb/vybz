import { supabase } from '@/lib/supabase'
import type { EventWithVenue } from '@/lib/types'
import HomeClient from '@/components/home/HomeClient'

export const revalidate = 60

async function getAllEvents(): Promise<EventWithVenue[]> {
  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('events')
    .select('*, venues(*)')
    .eq('status', 'published')
    .gte('event_date', today)
    .order('event_date', { ascending: true })
    .limit(120)
  if (!data) return []
  // Deduplicate by title + date
  const seen = new Set<string>()
  return (data as EventWithVenue[]).filter((e) => {
    const key = `${e.title}|${e.event_date}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

async function getHeroEvents(): Promise<EventWithVenue[]> {
  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('events')
    .select('*, venues(*)')
    .eq('status', 'published')
    .gte('event_date', today)
    .not('cover_image', 'is', null)
    .order('is_featured', { ascending: false })
    .order('event_date', { ascending: true })
    .limit(8)
  return (data ?? []) as EventWithVenue[]
}

export default async function HomePage() {
  const [allEvents, heroEvents] = await Promise.all([getAllEvents(), getHeroEvents()])
  return <HomeClient allEvents={allEvents} heroEvents={heroEvents} />
}
