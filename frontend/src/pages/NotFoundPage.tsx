import { ArrowLeft } from 'lucide-react'
import { AppRoute } from '@/components/layout/Sidebar'

interface NotFoundProps {
  isDark: boolean
  onNavigate: (page: AppRoute) => void
}

export function NotFoundPage({ isDark, onNavigate }: NotFoundProps) {
  return (
    <main className={`min-h-screen flex items-center justify-center p-6 font-sans ${
      isDark
        ? 'bg-[#0d0c11] text-zinc-100'
        : 'bg-gradient-to-br from-[#e7c6d9] via-[#dfd6eb] to-[#cbe0e4] text-slate-800'
    }`}>
      <div className={`p-10 rounded-[36px] border backdrop-blur-2xl text-center space-y-4 max-w-md ${
        isDark ? 'border-white/15 bg-white/[0.04]' : 'border-white/70 bg-white/50'
      }`}>
        <div className={`text-5xl font-bold ${isDark ? 'text-orange-500' : 'text-indigo-600'}`}>404</div>
        <h1 className="text-xl font-bold">Frequency Not Found</h1>
        <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
          The studio route you requested does not exist.
        </p>
        <button
          onClick={() => onNavigate('home')}
          className={`px-6 py-2.5 rounded-full bg-gradient-to-r font-semibold text-xs inline-flex items-center gap-2 cursor-pointer ${
            isDark ? 'from-orange-500 to-amber-500 text-zinc-950' : 'from-sky-500 via-indigo-500 to-violet-500 text-white'
          }`}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Studio</span>
        </button>
      </div>
    </main>
  )
}