import Navbar from '@/components/Navbar'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="pb-24 md:pb-8">
        {children}
      </main>
      <footer className="pb-24 md:pb-6 text-center">
        <p className="text-xs text-white/25">Powered by AMDY LABS</p>
      </footer>
    </>
  )
}
