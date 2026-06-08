import Link from 'next/link'
import { LEGAL_LINKS, type Lang } from './content'

/** Footer block shown at the bottom of every legal / help page. */
export default function LegalFooter({ lang }: { lang: Lang }) {
  return (
    <footer className="mt-16 pt-8 border-t border-white/10">
      <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2 mb-5">
        {LEGAL_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="text-xs text-zinc-400 hover:text-white transition-colors"
          >
            {lang === 'fr' ? l.fr : l.en}
          </Link>
        ))}
      </nav>
      <p className="text-center text-xs text-zinc-600 mb-1">
        © {new Date().getFullYear()} AmdyLabs LLC — VYBZ
      </p>
      <p className="text-center text-xs bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
        Powered by AMDY LABS
      </p>
    </footer>
  )
}
