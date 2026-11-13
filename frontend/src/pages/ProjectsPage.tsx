import { useState, useEffect } from 'react'
import { FolderKanban, Plus, ArrowRight, Cloud, Database, Trash2 } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { AppRoute } from '@/components/layout/Sidebar'
import { apiClient, SoundscapeProject } from '@/services/apiClient'
import { audioEngine } from '@/services/audioEngine'

interface PageProps {
  isDark: boolean
  onToggleTheme: () => void
  onNavigate: (page: AppRoute) => void
}

export function ProjectsPage({ isDark, onToggleTheme, onNavigate }: PageProps) {
  const [projects, setProjects] = useState<SoundscapeProject[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.getProjects().then((items) => {
      setProjects(items)
      setLoading(false)
    })
  }, [])

  const handleLoadProject = (p: SoundscapeProject) => {
    audioEngine.loadComposition(p.genre, p.mood, p.bpm)
    audioEngine.setTension(p.tension)
    onNavigate('dashboard')
  }

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await apiClient.deleteProject(id)
    setProjects((prev) => prev.filter((p) => p.id !== id))
  }

  const cardClass = isDark ? 'border-white/10 bg-black/45' : 'border-white/75 bg-white/60 shadow-sm'
  const accentText = isDark ? 'text-orange-500' : 'text-indigo-600'

  return (
    <MainLayout activePage="projects" isDark={isDark} onToggleTheme={onToggleTheme} onNavigate={onNavigate} title="Projects" subtitle="Saved Soundscape Sessions (MongoDB & Local Cache)">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 text-center py-12 text-xs opacity-60">Loading saved studio projects...</div>
        ) : projects.length === 0 ? (
          <div className={`col-span-1 md:col-span-2 p-8 rounded-3xl border flex flex-col items-center justify-center text-center gap-2 ${cardClass}`}>
            <FolderKanban className="w-8 h-8 opacity-35" />
            <div className="text-xs font-semibold">Workspace is a Blank Slate</div>
            <div className="text-[11px] opacity-60 max-w-sm">No saved sessions found in MongoDB or browser storage. Start producing in the Studio or create a new project.</div>
          </div>
        ) : (
          projects.map((p) => (
            <div key={p.id} className={`p-5 rounded-3xl border flex flex-col justify-between gap-4 ${cardClass}`}>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className={`w-9 h-9 rounded-2xl flex items-center justify-center ${
                    isDark ? 'bg-orange-500/15 text-orange-500' : 'bg-indigo-500/15 text-indigo-600'
                  }`}>
                    <FolderKanban className="w-4 h-4" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1 font-mono ${
                      p.syncedToCloud
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-zinc-800 text-zinc-400 border border-white/10'
                    }`}>
                      {p.syncedToCloud ? <Cloud className="w-2.5 h-2.5" /> : <Database className="w-2.5 h-2.5" />}
                      {p.syncedToCloud ? 'MongoDB Atlas' : 'Local Storage'}
                    </span>
                    <button
                      onClick={(e) => handleDeleteProject(p.id, e)}
                      title="Delete Project"
                      className="p-1 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 cursor-pointer transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{p.title}</div>
                <div className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                  {p.genre} • {p.bpm} BPM • Tension {p.tension}%
                </div>
              </div>
              <button
                onClick={() => handleLoadProject(p)}
                className={`w-full py-2 rounded-full bg-gradient-to-r font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                  isDark ? 'from-orange-500 to-amber-500 text-zinc-950' : 'from-sky-500 via-indigo-500 to-violet-500 text-white'
                }`}
              >
                <span>Load in Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}

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