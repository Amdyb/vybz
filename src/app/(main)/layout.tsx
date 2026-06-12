import Navbar from '@/components/Navbar'
import AppFooterLinks from '@/components/legal/AppFooterLinks'
import { LocationProvider } from '@/components/LocationProvider'
import { SurpriseProvider } from '@/components/surprise/SurpriseProvider'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <LocationProvider>
      <SurpriseProvider>
        <Navbar />
        <main className="pb-24 md:pb-8">
          {children}
        </main>
        <footer className="pb-24 md:pb-6 pt-4 text-center">
          <AppFooterLinks />
          <p className="text-xs bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Powered by AMDY LABS
          </p>
        </footer>
      </SurpriseProvider>
    </LocationProvider>
  )
}
