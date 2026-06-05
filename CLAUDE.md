# VYBZ – Claude Code Master Instructions

## WHO I AM
- Name: Amdy Boubacar (TonTon Amdy / AmdyLabs)
- Based in Portland, USA with roots in Dakar, Senegal
- I am NOT a coder — I give directions, you execute everything
- Languages: French, Wolof, English

## WHAT IS VYBZ
VYBZ is a global nightlife and events discovery platform.
- Domain: vybz.city
- GitHub: github.com/Amdyb/vybz
- Tagline: C'est quoi les VYBZ ce soir ? / What are VYBZ tonight?
- City subtitle changes dynamically based on user location
- Starting city: Dakar, Senegal
- Target: West Africa + diaspora + global

## TECH STACK
- Framework: Next.js 15, App Router, TypeScript
- Styling: Tailwind CSS
- Database: Supabase (PostgreSQL + RLS + Storage)
- Auth: Supabase Auth
- Icons: Lucide React ONLY — no emojis ever
- Hosting: Vercel (auto-deploys from GitHub main)
- Payments: PayDunya (organizer subscriptions only)
- WhatsApp: Twilio Business API
- Maps: Google Maps Platform
- Places: Google Places API

## SUPABASE
- Project URL: https://qxcpaxpttyzlqscwgigv.supabase.co
- Tables: profiles, venues, events, ticket_types, orders, tickets, favorites, reviews

## REVENUE MODEL
VYBZ never handles user-to-organizer payments.

1. ORGANIZER SUBSCRIPTIONS via PayDunya (VYBZ income)
   - Basic: free — list events only, no ticket sales
   - Pro: paid monthly — sell tickets, organizer page, analytics
   - Premium: paid monthly — everything + featured + VYBZ Drops + priority

2. AFFILIATE COMMISSIONS (passive income)
   - Ticketmaster affiliate
   - Eventbrite affiliate
   - Shotgun affiliate
   - Fever affiliate
   - Google Places referrals

3. SPONSORED PLACEMENTS
   - Featured on home page
   - Top of map results
   - City spotlight

## ORGANIZER PAYMENT SETUP
Each organizer sets up their OWN payment system:
- Wave (Senegal/West Africa)
- Orange Money (West Africa)
- PayPal (global)
- Stripe or credit card processor (global)
- Cash on arrival option
VYBZ only provides the platform — never touches ticket money.

## QR CODE TICKETING
- User buys ticket through organizer payment system
- VYBZ generates unique QR code
- QR sent via WhatsApp + stored in My Tickets
- Single-use QR — cannot be reused
- Organizer scans QR at door via VYBZ scanner
- Duplicate scan shows alert with previous scan time

## ORGANIZER/ARTIST PAGES
- Dedicated page: vybz.city/organizer/[slug]
- Custom logo + banner
- Bio and social links
- All their events listed
- Feels like their own mini-website
- Shareable URL
- Verified badge for trusted organizers

## LOCATION SYSTEM
- Auto-detect city on first open
- VYBZ + city name updates dynamically
- Works globally: Dakar, Paris, Abidjan, Detroit, New York
- Manual city change option
- Diaspora Mode: see events in your home city from anywhere

## EXTERNAL EVENT SOURCES
- Google Places API — venues and restaurants
- Eventbrite API — public events
- Ticketmaster API — concerts and festivals
- Shotgun — francophone nightlife
- Fever — premium experiences
- Facebook Events API — strong in Dakar
- Dice.fm — underground and live music
- Yapsody — African promoters

## SOCIAL FEATURES (VYBZ SOCIAL)
- Check-in at events
- Post photos and vibes from events
- Follow venues and organizers
- Crew system — create squads, plan nights together
- Crew leaderboard
- Reviews and ratings
- VYBZ Live — 30-second video clips from inside events
- The Morning After — rate event next day, earn points

## PULSE POINTS SYSTEM

### WAYS TO EARN POINTS

**Discovery**
- Open app daily: +2
- View event page: +1
- Save to favorites: +5
- Share an event: +10
- Follow an organizer: +5

**Social**
- Check in at event: +20
- Post a photo: +15
- Tag a friend: +10
- Leave a review: +12
- Rate a venue: +8
- Create a crew: +25
- Invite a crew member: +15

**Transactions**
- Buy a ticket: +30
- Make a reservation: +20
- Refer friend who signs up: +50
- Refer friend who buys a ticket: +100

**Loyalty Bonuses**
- Attend same venue 3 times: +30 bonus
- Attend 5 events in one month: +50 bonus
- Complete your profile: +20
- Complete onboarding: +15
- First ticket purchase ever: +50 bonus

**Special**
- Check in on your birthday: +100
- Attend a featured event: +25
- First check-in at any event: +30
- VYBZ Drops purchase: +40

### TIERS
- Neon: 0–499 points
- Gold: 500–1999 points
- Diamond: 2000+ points

### MILESTONES AND REWARDS
- 100 pts — VYBZ Member badge
- 250 pts — 10% discount on next ticket
- 500 pts (Neon) — free drink voucher at partner venue
- 750 pts — early access to VYBZ Drops
- 1 000 pts — 1 free event entry of choice
- 1 500 pts — VIP upgrade on next ticket
- 2 000 pts (Gold) — 2 free tickets per month
- 3 000 pts — personal VYBZ concierge
- 5 000 pts (Diamond) — monthly VIP access + backstage passes

## UNIQUE FEATURES
1. Vibe Meter — real-time crowd energy from check-ins (Dead/Warming Up/Lit/On Fire)
2. Surprise Me — one tap finds best event near you right now
3. Diaspora Mode — buy tickets for home city events from anywhere
4. VYBZ Drops — flash ticket deals for Gold/Diamond users only
5. Artist/DJ Booking — organizers book talent directly in app
6. VYBZ Radio — ambient playlist matching nearby event vibe
7. The Comeback — post-event loyalty rewards from venues
8. Crew Leaderboard — most active squad wins monthly perks

## DESIGN RULES — NEVER BREAK THESE
- Background: #08080F (near black)
- Primary gradient: fuchsia-400 to cyan-400
- Card background: zinc-900
- Border: purple-900/30
- Text primary: white
- Text muted: zinc-400
- Price color: amber-400
- Free events: cyan-400
- NO emojis anywhere in the UI
- Lucide React icons only
- Mobile-first always
- DM Sans font for body
- Syne font for headings
- Dark mode only for now
- Colors are locked — do not change them

## LOGO
- Logo file: /public/vybz-logo.png
- Always use image, never text for the logo
- Navbar: logo on left, nav links on right
- Navbar background: black #000000

## FOOTER
- Always include: Powered by AMDY LABS
- Style: text-xs, centered, gradient text from blue-400 to cyan-400

## LANGUAGES
- UI language: French primary
- Auto-detect device language (French or English)
- French tagline: C'est quoi les VYBZ ce soir ?
- English tagline: What are VYBZ tonight?

## PAGES BUILT
- / Home page with featured hero, events grid, venues preview
- /events Events listing with category filter
- /events/[id] Event detail page
- /venues Venues listing grouped by category
- /venues/[id] Venue detail page

## PAGES TO BUILD (IN ORDER)
1. /sign-in and /sign-up (Auth)
2. /profile (User profile + Pulse Points)
3. /organizer/[slug] (Organizer mini-website)
4. /tickets (My tickets with QR codes)
5. /map (Google Maps with venues and events)
6. /enterprise (Business dashboard)
7. /enterprise/create-event
8. /enterprise/scanner (QR scanner at door)
9. /crew (Squad system)
10. /drops (VYBZ Drops flash deals)

## BUILD RULES
1. Always work in ~/vybz directory
2. Never break what already works
3. Build one feature at a time
4. Test locally before pushing
5. Always commit with clear messages
6. Push to GitHub after every working feature
7. Vercel auto-deploys on push
8. Mobile-first always
9. No emojis ever
10. Lucide React icons only
