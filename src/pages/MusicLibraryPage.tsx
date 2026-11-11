import { useState } from 'react'
import { Search, Download, Play } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { AppRoute } from '@/components/layout/Sidebar'

interface PageProps {
  isDark: boolean
  onToggleTheme: () => void
  onNavigate: (page: AppRoute) => void
}

export function MusicLibraryPage({ isDark, onToggleTheme, onNavigate }: PageProps) {
  const [query, setQuery] = useState('')
  const tracks = [
    { id: 1, name: 'Solaris Diffusion Master', genre: 'Synthwave', bpm: 118, key: 'F Min', duration: '02:14' },
    { id: 2, name: 'Rain Over Barasat Lo-Fi', genre: 'Lo-Fi', bpm: 86, key: 'C Maj', duration: '01:48' },
    { id: 3, name: 'Cybernetic Pulse Stems', genre: 'Electronic', bpm: 132, key: 'D Min', duration: '03:05' },
    { id: 4, name: 'Ethereal Vocal Pad 04', genre: 'Ambient', bpm: 72, key: 'A Min', duration: '02:40' }
  ].filter((t) => t.name.toLowerCase().includes(query.toLowerCase()))

  const cardClass = isDark ? 'border-white/10 bg-black/45' : 'border-white/75 bg-white/60 shadow-sm'
  const accentText = isDark ? 'text-orange-500' : 'text-indigo-600'

  return (
    <MainLayout activePage="library" isDark={isDark} onToggleTheme={onToggleTheme} onNavigate={onNavigate} title="Music Library" subtitle="Generated Stems & Masters">
      <div className={`p-4 rounded-3xl border flex-1 space-y-4 ${cardClass}`}>
        <div className="relative">
          <Search className={`w-4 h-4 absolute left-3.5 top-2.5 ${accentText}`} />
          <input
            type="text"
            placeholder="Search generated tracks or stems..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`w-full rounded-2xl border py-2 pl-10 pr-4 text-xs focus:outline-none ${
              isDark ? 'bg-zinc-950/70 border-white/10 text-white' : 'bg-white/80 border-white text-slate-900'
            }`}
          />
        </div>

        <div className="space-y-2.5">
          {tracks.map((track) => (
            <div key={track.id} className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
              isDark ? 'border-white/10 bg-zinc-950/60' : 'border-white/85 bg-white/75'
            }`}>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onNavigate('dashboard')}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer ${
                    isDark ? 'bg-orange-500 text-zinc-950' : 'bg-indigo-600 text-white'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                </button>
                <div>
                  <div className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{track.name}</div>
                  <div className={`text-[10px] font-mono ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                    {track.genre} • {track.bpm} BPM • {track.key}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-mono ${accentText}`}>{track.duration}</span>
                <button
                  onClick={() => alert(`Exporting ${track.name}.wav`)}
                  className={`p-2 rounded-full border cursor-pointer ${
                    isDark ? 'border-orange-500/30 text-orange-500' : 'border-indigo-500/30 text-indigo-600 bg-white'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  )
}