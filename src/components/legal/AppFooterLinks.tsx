import Link from 'next/link'
import { LEGAL_LINKS } from './content'

/** Compact legal/help link row for the main app footers (French — app default). */
export default function AppFooterLinks() {
  return (
    <nav className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 px-4 mb-3">
      {LEGAL_LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          {l.fr}
        </Link>
      ))}
    </nav>
  )
}
