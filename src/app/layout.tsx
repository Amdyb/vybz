import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'VYBZ — Nightlife & Events Dakar',
  description: 'Découvrez les meilleurs événements et clubs à Dakar, Sénégal.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="antialiased min-h-screen">
        <Navbar />
        <main className="pb-24 md:pb-8">
          {children}
        </main>
        <footer className="pb-24 md:pb-6 text-center">
          <p className="text-xs text-white/25">Powered by AMDY LABS</p>
        </footer>
      </body>
    </html>
  )
}
