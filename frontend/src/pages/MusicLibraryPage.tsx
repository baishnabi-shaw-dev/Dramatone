import { useState, useEffect } from 'react'
import { Search, Download, Play, Pause, Disc, ArrowRight, Cloud, Database } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { AppRoute } from '@/components/layout/Sidebar'
import { apiClient, SoundscapeProject } from '@/services/apiClient'
import { audioEngine } from '@/services/audioEngine'

interface PageProps {
  isDark: boolean
  onToggleTheme: () => void
  onNavigate: (page: AppRoute) => void
}

export function MusicLibraryPage({ isDark, onToggleTheme, onNavigate }: PageProps) {
  const [query, setQuery] = useState('')
  const [projects, setProjects] = useState<SoundscapeProject[]>([])
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiClient.getProjects().then((items) => {
      setProjects(items)
      setLoading(false)
    })
  }, [])

  const filtered = projects.filter((t) =>
    t.title.toLowerCase().includes(query.toLowerCase()) ||
    t.genre.toLowerCase().includes(query.toLowerCase())
  )

  const handleTogglePlay = (track: SoundscapeProject) => {
    if (activePlayingId === track.id) {
      audioEngine.stop()
      setActivePlayingId(null)
    } else {
      audioEngine.setBpm(track.bpm)
      audioEngine.setTension(track.tension)
      audioEngine.start()
      setActivePlayingId(track.id)
    }
  }

  const handleDownloadWav = async (track: SoundscapeProject) => {
    setDownloadingId(track.id)
    try {
      audioEngine.setBpm(track.bpm)
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

  const cardClass = isDark ? 'border-white/10 bg-black/45' : 'border-white/75 bg-white/60 shadow-sm'
  const accentText = isDark ? 'text-orange-500' : 'text-indigo-600'

  return (
    <MainLayout activePage="library" isDark={isDark} onToggleTheme={onToggleTheme} onNavigate={onNavigate} title="Music Library" subtitle="Live Audition & Stems Repository">
      <div className={`p-5 rounded-3xl border flex-1 flex flex-col justify-between gap-4 ${cardClass}`}>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className={`w-4 h-4 absolute left-3.5 top-3 ${accentText}`} />
              <input
                type="text"
                placeholder="Search real sessions by name or genre..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={`w-full rounded-2xl border py-2.5 pl-10 pr-4 text-xs focus:outline-none transition ${
                  isDark ? 'bg-zinc-950/70 border-white/10 text-white' : 'bg-white/80 border-white text-slate-900'
                }`}
              />
            </div>

            <button
              onClick={() => onNavigate('generator')}
              className={`px-4 py-2.5 rounded-2xl font-semibold text-xs flex items-center gap-1.5 cursor-pointer shrink-0 transition ${
                isDark ? 'bg-orange-500 text-zinc-950 hover:bg-orange-400' : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              <Disc className="w-3.5 h-3.5" />
              <span>Generate New</span>
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-xs opacity-60">Reading studio soundscape library...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-xs opacity-60">No soundscape takes match your search.</div>
          ) : (
            <div className="space-y-2.5">
              {filtered.map((track) => {
                const isPlaying = activePlayingId === track.id
                return (
                  <div
                    key={track.id}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 transition ${
                      isPlaying
                        ? isDark ? 'border-orange-500/50 bg-orange-500/10' : 'border-indigo-500/50 bg-indigo-50/70'
                        : isDark ? 'border-white/10 bg-zinc-950/60' : 'border-white/85 bg-white/75'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => handleTogglePlay(track)}
                        title={isPlaying ? 'Pause' : 'Audition Audio Live'}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer shrink-0 transition ${
                          isPlaying
                            ? isDark ? 'bg-amber-400 text-zinc-950' : 'bg-indigo-700 text-white'
                            : isDark ? 'bg-orange-500 text-zinc-950 hover:bg-orange-400' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                      >
                        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                      </button>

                      <div className="min-w-0">
                        <div className={`text-xs font-semibold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {track.title}
                        </div>
                        <div className={`text-[10px] font-mono flex items-center gap-2 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                          <span>{track.genre}</span>
                          <span>•</span>
                          <span>{track.bpm} BPM</span>
                          <span>•</span>
                          <span>Tension {track.tension}%</span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5">
                            {track.syncedToCloud ? <Cloud className="w-2.5 h-2.5 text-emerald-400" /> : <Database className="w-2.5 h-2.5 text-zinc-400" />}
                            {track.syncedToCloud ? 'Cloud' : 'Local'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          audioEngine.setBpm(track.bpm)
                          audioEngine.setTension(track.tension)
                          onNavigate('dashboard')
                        }}
                        className={`px-3 py-1.5 rounded-xl border text-[11px] font-medium flex items-center gap-1 cursor-pointer transition ${
                          isDark ? 'border-white/10 bg-white/5 text-zinc-200 hover:text-white' : 'border-white bg-white text-slate-800'
                        }`}
                      >
                        <span>Open in DAW</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>

                      <button
                        onClick={() => handleDownloadWav(track)}
                        disabled={downloadingId === track.id}
                        title="Download True 16-bit 44.1kHz WAV"
                        className={`p-2 rounded-xl border cursor-pointer transition ${
                          isDark ? 'border-orange-500/30 text-orange-400 hover:bg-orange-500/15' : 'border-indigo-300 text-indigo-700 bg-white'
                        }`}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
