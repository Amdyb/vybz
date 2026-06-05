import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'VYBZ — Nightlife & Events',
  description: 'Découvrez les meilleurs événements et clubs près de chez vous.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="antialiased min-h-screen bg-[#08080F] text-white">
        {children}
      </body>
    </html>
  )
}
