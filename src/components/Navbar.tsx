'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'

const navLinks = [
  { href: '/',        label: 'Accueil', icon: HomeIcon },
  { href: '/events',  label: 'Événements', icon: CalendarIcon },
  { href: '/venues',  label: 'Lieux', icon: MapPinIcon },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop top bar */}
      <header className="hidden md:flex items-center justify-between px-8 py-4 border-b border-white/5 bg-[#07070f]/90 backdrop-blur-md sticky top-0 z-50">
        <Link href="/" className="flex items-center">
          <Image
            src="/assets/logos/vybz-neon-logo.png"
            alt="VYBZ"
            height={40}
            width={120}
            style={{ height: 40, width: 'auto' }}
            priority
          />
        </Link>
        <nav className="flex items-center gap-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                pathname === href
                  ? 'bg-violet-600/20 text-violet-300'
                  : 'text-white/50 hover:text-white/90 hover:bg-white/5'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a16]/95 backdrop-blur-xl border-t border-white/5">
        <div className="flex items-center justify-around py-3 px-2">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-1 px-4 py-1 rounded-xl transition-all ${
                  active ? 'text-violet-400' : 'text-white/40'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'text-violet-400' : 'text-white/40'}`} />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}
