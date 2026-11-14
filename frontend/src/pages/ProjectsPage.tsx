import { useState, useEffect } from 'react'
import {
  FolderKanban, Plus, ArrowRight, Cloud, Database, Trash2,
  Library, Play, Pause, Download, Search, Sliders
} from 'lucide-react'
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
  const [activeTab, setActiveTab] = useState<'projects' | 'library'>('projects')
  const [projects, setProjects] = useState<SoundscapeProject[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

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

  const handleLoadInDaw = (p: SoundscapeProject) => {
    audioEngine.loadComposition(p.genre, p.mood, p.bpm)
    audioEngine.setTension(p.tension)
    onNavigate('daw')
  }

  const handleDeleteProject = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (activePlayingId === id) {
      audioEngine.stop()
      setActivePlayingId(null)
    }
    await apiClient.deleteProject(id)
    setProjects((prev) => prev.filter((p) => p.id !== id))
  }

  const handleTogglePlay = (track: SoundscapeProject) => {
    if (activePlayingId === track.id) {
      audioEngine.stop()
      setActivePlayingId(null)
    } else {
      audioEngine.loadComposition(track.genre, track.mood, track.bpm)
      audioEngine.setTension(track.tension)
      audioEngine.ensureContext()
      audioEngine.start()
      setActivePlayingId(track.id)
    }
  }

  const handleDownloadWav = async (track: SoundscapeProject) => {
    setDownloadingId(track.id)
    try {
      audioEngine.loadComposition(track.genre, track.mood, track.bpm)
      audioEngine.setTension(track.tension)
      const blob = await audioEngine.exportSoundscapeWav(15)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${track.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.wav`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDownloadingId(null)
    }
  }

  const filtered = projects.filter((t) =>
    (t.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.genre || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.mood || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const cardClass = isDark ? 'border-white/10 bg-black/45' : 'border-white/75 bg-white/60 shadow-sm'
  const accentText = isDark ? 'text-orange-500' : 'text-indigo-600'

  return (
    <MainLayout
      activePage="projects"
      isDark={isDark}
      onToggleTheme={onToggleTheme}
      onNavigate={onNavigate}
      title="Projects &amp; Library"
      subtitle="Saved Soundscape Sessions &amp; Stems Repository"
    >
      <div className="flex flex-col gap-4 flex-1">
        {/* Top Control Bar: Tab Switcher & Search */}
        <div className={`p-3 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${cardClass}`}>
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/30 border border-white/10 text-xs">
            <button
              onClick={() => setActiveTab('projects')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer transition ${
                activeTab === 'projects'
                  ? isDark ? 'bg-orange-500 text-zinc-950 shadow-sm' : 'bg-indigo-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <FolderKanban className="w-3.5 h-3.5" />
              <span>Saved Projects ({projects.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('library')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 cursor-pointer transition ${
                activeTab === 'library'
                  ? isDark ? 'bg-orange-500 text-zinc-950 shadow-sm' : 'bg-indigo-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Library className="w-3.5 h-3.5" />
              <span>Audio Library &amp; Stems</span>
            </button>
          </div>

          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <div className="relative w-full">
              <Search className={`w-3.5 h-3.5 absolute left-3 top-2.5 opacity-50 pointer-events-none ${accentText}`} />
              <input
                type="text"
                placeholder="Search projects or stems by genre, title, mood..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full rounded-xl border py-1.5 pl-8 pr-3 text-xs focus:outline-none transition ${
                  isDark ? 'bg-zinc-900 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
                }`}
              />
            </div>
            <button
              onClick={() => onNavigate('dashboard')}
              title="Create new soundscape in Studio Workspace"
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0 cursor-pointer transition ${
                isDark ? 'bg-orange-500 text-zinc-950 hover:bg-orange-400' : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Take</span>
            </button>
          </div>
        </div>

        {/* TAB 1: SAVED PROJECTS GRID */}
        {activeTab === 'projects' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-full text-center py-12 text-xs opacity-60">Loading saved studio projects...</div>
            ) : filtered.length === 0 ? (
              <div className={`col-span-full p-8 rounded-3xl border flex flex-col items-center justify-center text-center gap-2 ${cardClass}`}>
                <FolderKanban className="w-8 h-8 opacity-35" />
                <div className="text-xs font-semibold">No Projects Found</div>
                <div className="text-[11px] opacity-60 max-w-sm">
                  {searchQuery ? `No saved projects matching "${searchQuery}".` : 'Workspace is a clean slate. Start producing in the Studio Workspace to save takes.'}
                </div>
              </div>
            ) : (
              filtered.map((p) => (
                <div key={p.id} className={`p-4 rounded-3xl border flex flex-col justify-between gap-4 transition-all duration-200 hover:border-orange-500/40 ${cardClass}`}>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
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

                  <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                    <button
                      onClick={() => handleLoadProject(p)}
                      className={`flex-1 py-1.5 rounded-xl font-semibold text-xs flex items-center justify-center gap-1 cursor-pointer transition ${
                        isDark ? 'bg-orange-500 text-zinc-950 hover:bg-orange-400' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      <span>Studio</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleLoadInDaw(p)}
                      title="Open arrangement in FL Studio Web DAW"
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 cursor-pointer transition ${
                        isDark ? 'border-white/10 bg-white/5 text-zinc-300 hover:text-white' : 'border-slate-300 bg-white text-slate-700'
                      }`}
                    >
                      <Sliders className="w-3 h-3 text-orange-400" />
                      <span>DAW</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: AUDIO LIBRARY & STEMS REPOSITORY */}
        {activeTab === 'library' && (
          <div className={`p-4 rounded-3xl border flex-1 flex flex-col gap-3 ${cardClass}`}>
            <div className="flex items-center justify-between text-xs pb-2 border-b border-white/10">
              <span className="font-semibold opacity-70">
                Audition live synthesis takes and export 44.1kHz stereo audio
              </span>
              <span className="text-[10px] font-mono opacity-50">
                {filtered.length} stem collection{filtered.length === 1 ? '' : 's'}
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs opacity-50 font-sans">
                Loading stem repository...
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center text-xs opacity-50 font-sans">
                No audio tracks found matching your search.
              </div>
            ) : (
              <div className="divide-y divide-white/5 space-y-1">
                {filtered.map((track) => {
                  const isPlaying = activePlayingId === track.id
                  return (
                    <div
                      key={track.id}
                      className={`p-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                        isPlaying
                          ? isDark ? 'bg-orange-500/10 border border-orange-500/30' : 'bg-indigo-50 border border-indigo-200'
                          : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <button
                          onClick={() => handleTogglePlay(track)}
                          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 cursor-pointer shadow-md transition ${
                            isPlaying
                              ? 'bg-amber-400 text-zinc-950 animate-pulse'
                              : isDark
                              ? 'bg-orange-500 text-zinc-950 hover:bg-orange-400'
                              : 'bg-indigo-600 text-white hover:bg-indigo-700'
                          }`}
                        >
                          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold truncate text-white">{track.title}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/10 opacity-70">
                              {track.bpm} BPM
                            </span>
                          </div>
                          <div className="text-[11px] opacity-60 truncate">
                            {track.genre} • Mood: {track.mood} • Tension {track.tension}%
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleDownloadWav(track)}
                          disabled={downloadingId === track.id}
                          className={`px-2.5 py-1 rounded-xl border text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition ${
                            isDark ? 'border-white/10 bg-white/5 text-zinc-300 hover:text-white' : 'border-slate-300 bg-white text-slate-700'
                          }`}
                        >
                          <Download className="w-3 h-3 text-orange-400" />
                          <span>{downloadingId === track.id ? 'Rendering...' : 'WAV'}</span>
                        </button>

                        <button
                          onClick={() => handleLoadProject(track)}
                          className={`px-3 py-1 rounded-xl text-[11px] font-bold cursor-pointer transition flex items-center gap-1 ${
                            isDark ? 'bg-orange-500 text-zinc-950 hover:bg-orange-400' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                          }`}
                        >
                          <span>Open in Studio</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>

                        <button
                          onClick={() => handleDeleteProject(track.id)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 cursor-pointer transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  )
}
