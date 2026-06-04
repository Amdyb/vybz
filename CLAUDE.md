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
- Payments: Wave, Orange Money, Stripe
- WhatsApp: Twilio Business API
- Maps: Google Maps Platform
- Places: Google Places API

## SUPABASE
- Project URL: https://qxcpaxpttyzlqscwgigv.supabase.co
- Tables: profiles, venues, events, ticket_types, orders, tickets, favorites, reviews

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

## DESIGN COMPONENTS
- Cards: rounded-2xl, border border-purple-900/30, bg-zinc-900
- Buttons primary: bg-gradient-to-r from-purple-600 to-cyan-500, rounded-full
- Chips/filters: rounded-full, active = gradient, inactive = bg-zinc-800
- Bottom nav: fixed, bg-zinc-900/95, backdrop-blur, border-t border-purple-900/30
- Hero card: rounded-2xl, h-48, gradient overlay, featured event
- Section headers: font-black text-sm + "Voir tout" link in purple-400

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
- No Wolof in UI yet (Phase 2)

## PAGES BUILT SO FAR
- / Home page with featured hero, events grid, venues preview
- /events Events listing with category filter
- /events/[id] Event detail page
- /venues Venues listing grouped by category
- /venues/[id] Venue detail page

## PAGES TO BUILD NEXT
- /sign-in
- /sign-up
- /profile
- /tickets (my tickets with QR codes)
- /map (Google Maps with venues and events)
- /enterprise (business dashboard)
- /enterprise/create-event
- /enterprise/scanner (QR scanner)

## HOW TO WORK
1. Always work in ~/vybz directory
2. Never break what already works
3. Build one feature at a time
4. Test locally before pushing
5. Always commit with clear messages
6. Push to GitHub after every working feature
7. Vercel auto-deploys on push

## GIT WORKFLOW
- Remote: https://github.com/Amdyb/vybz.git
- Branch: main
- Always push after every completed feature

## REVENUE MODEL
- Ticket commission: 5% per sale
- Business subscriptions: Basic / Pro / Premium
- Sponsored placements
- Google AdSense (Phase 5)

## CURRENT STATUS
- App is live at vybz.city
- Supabase connected with real Dakar events data
- Logo in navbar
- Footer with AMDY LABS credit
- Next: mobile responsive layout + auth
