export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#08080F] flex flex-col">
      {children}
      <footer className="py-6 text-center">
        <p className="text-xs bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          Powered by AMDY LABS
        </p>
      </footer>
    </div>
  )
}
