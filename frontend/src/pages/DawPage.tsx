import { MainLayout } from '@/components/layout/MainLayout'
import { AppRoute } from '@/components/layout/Sidebar'
import { DawPianoRoll } from '@/components/daw/DawPianoRoll'
import { Sparkles, ArrowRight } from 'lucide-react'

interface PageProps {
  isDark: boolean
  onToggleTheme: () => void
  onNavigate: (page: AppRoute) => void
}

export function DawPage({ isDark, onToggleTheme, onNavigate }: PageProps) {
  return (
    <MainLayout
      activePage="daw"
      isDark={isDark}
      onToggleTheme={onToggleTheme}
      onNavigate={onNavigate}
      title="DAW Roll & MIDI Studio"
      subtitle="Interactive Multi-Octave Piano Roll with Native Web MIDI Hardware Input"
    >
      <div className="flex-1 flex flex-col gap-3 min-h-[500px]">
        {/* Top Info Banner */}
        <div className={`px-4 py-2 rounded-2xl border text-xs flex items-center justify-between shrink-0 ${isDark ? 'border-orange-500/30 bg-orange-950/20 text-zinc-300' : 'border-indigo-200 bg-indigo-50/70 text-slate-800'
          }`}>
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-orange-400 shrink-0" />
            <span>
              <strong>Professional Web DAW:</strong> Edit note pitches, connect any USB/Bluetooth MIDI keyboard, or use computer keyboard (A-K).
            </span>
          </div>

          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-1 font-semibold text-orange-400 hover:underline cursor-pointer shrink-0"
          >
            <span>Back to Video Timeline</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* The DAW Piano Roll */}
        <DawPianoRoll isDark={isDark} className="flex-1 min-h-[440px]" />
      </div>
    </MainLayout>
  )
}

