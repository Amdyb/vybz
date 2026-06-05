import Navbar from '@/components/Navbar'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="pb-24 md:pb-8">
        {children}
      </main>
      <footer className="pb-24 md:pb-6 text-center">
        <p className="text-xs bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          Powered by AMDY LABS
        </p>
      </footer>
    </>
  )
}
