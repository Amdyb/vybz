export type Database = {
  public: {
    Tables: {
      events: { Row: Event }
      venues: { Row: Venue }
      profiles: { Row: Profile }
      favorites: { Row: Favorite }
      reviews: { Row: Review }
    }
  }
}

export type Event = {
  id: string
  title: string
  description: string | null
  cover_image: string | null
  venue_id: string | null
  organizer_id: string | null
  city: string
  country: string | null
  category: string
  event_date: string
  start_time: string
  end_time: string | null
  price_min: number | null
  price_max: number | null
  currency: string | null
  is_free: boolean | null
  capacity: number | null
  status: string | null
  is_featured: boolean | null
  is_sponsored: boolean | null
  created_at: string | null
}

export type Venue = {
  id: string
  name: string
  category: string
  address: string | null
  city: string
  country: string | null
  latitude: number | null
  longitude: number | null
  cover_image: string | null
  description: string | null
  opening_hours: string | null
  phone: string | null
  website: string | null
  instagram: string | null
  rating: number | null
  review_count: number | null
  is_verified: boolean | null
  is_sponsored: boolean | null
  created_at: string | null
}

export type Profile = {
  id: string
  full_name: string | null
  avatar_url: string | null
  city: string | null
  country: string | null
  language: string | null
  created_at: string | null
}

export type Favorite = {
  id: string
  user_id: string | null
  event_id: string | null
  created_at: string | null
}

export type Review = {
  id: string
  user_id: string | null
  venue_id: string | null
  rating: number | null
  comment: string | null
  created_at: string | null
}

export type EventWithVenue = Event & { venues: Venue | null }
