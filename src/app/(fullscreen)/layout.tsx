import Navbar from '@/components/Navbar'

export default function FullscreenLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {/* Desktop: subtract 60px sticky top nav. Mobile: full dvh (bottom nav is fixed, outside flow). */}
      <main className="h-dvh md:h-[calc(100dvh-60px)] overflow-hidden">
        {children}
      </main>
    </>
  )
}
