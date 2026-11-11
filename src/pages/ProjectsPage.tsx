import { FolderKanban, Plus, ArrowRight } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { AppRoute } from '@/components/layout/Sidebar'

interface PageProps {
  isDark: boolean
  onToggleTheme: () => void
  onNavigate: (page: AppRoute) => void
}

export function ProjectsPage({ isDark, onToggleTheme, onNavigate }: PageProps) {
  const projects = [
    { name: 'Untitled_Diffusion_01.harm', updated: '2 mins ago', stems: 4, bpm: 118 },
    { name: 'Hackathon_Theme_Score.harm', updated: 'Yesterday', stems: 6, bpm: 128 },
    { name: 'Ambient_Scene_03.harm', updated: '3 days ago', stems: 4, bpm: 84 }
  ]
  const cardClass = isDark ? 'border-white/10 bg-black/45' : 'border-white/75 bg-white/60 shadow-sm'
  const accentText = isDark ? 'text-orange-500' : 'text-indigo-600'

  return (
    <MainLayout activePage="projects" isDark={isDark} onToggleTheme={onToggleTheme} onNavigate={onNavigate} title="Projects" subtitle="Saved .harm Studio Sessions">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {projects.map((p, idx) => (
          <div key={idx} className={`p-5 rounded-3xl border flex flex-col justify-between gap-4 ${cardClass}`}>
            <div className="space-y-2">
              <div className={`w-9 h-9 rounded-2xl flex items-center justify-center ${
                isDark ? 'bg-orange-500/15 text-orange-500' : 'bg-indigo-500/15 text-indigo-600'
              }`}>
                <FolderKanban className="w-4 h-4" />
              </div>
              <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{p.name}</div>
              <div className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                {p.stems} Stems • {p.bpm} BPM • Edited {p.updated}
              </div>
            </div>
            <button
              onClick={() => onNavigate('dashboard')}
              className={`w-full py-2 rounded-full bg-gradient-to-r font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                isDark ? 'from-orange-500 to-amber-500 text-zinc-950' : 'from-sky-500 via-indigo-500 to-violet-500 text-white'
              }`}
            >
              <span>Load in Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        <button
          onClick={() => onNavigate('dashboard')}
          className={`p-5 rounded-3xl border border-dashed flex flex-col items-center justify-center gap-2 min-h-[180px] cursor-pointer ${cardClass}`}
        >
          <Plus className={`w-6 h-6 ${accentText}`} />
          <span className="text-xs font-semibold">New Studio Project</span>
        </button>
      </div>
    </MainLayout>
  )
}