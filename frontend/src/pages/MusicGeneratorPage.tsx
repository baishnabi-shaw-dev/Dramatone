import { useState } from 'react'
import { Wand2, Sparkles, Sliders, Download } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { AppRoute } from '@/components/layout/Sidebar'
import { generationService } from '@/features/music-generator/services/generationService'

interface PageProps {
  isDark: boolean
  onToggleTheme: () => void
  onNavigate: (page: AppRoute) => void
}

export function MusicGeneratorPage({ isDark, onToggleTheme, onNavigate }: PageProps) {
  const [prompt, setPrompt] = useState('Lush analog synthwave with warm Rhodes chords and crisp percussion')
  const [selectedGenre, setSelectedGenre] = useState('Synthwave')
  const [selectedMood, setSelectedMood] = useState('Euphoric')
  const [bpm, setBpm] = useState(118)
  const [duration, setDuration] = useState(60)
  const [isGenerating, setIsGenerating] = useState(false)
  const [takes, setTakes] = useState([
    { id: 1, title: 'Neon Horizon — Take 01', seed: 'SEED-8841', key: 'F Minor', bpm: 118, genre: 'Synthwave', mood: 'Euphoric', bars: [40, 75, 60, 90, 50, 82, 95, 70, 45, 68, 88, 60, 50, 78, 92, 65] },
    { id: 2, title: 'Neon Horizon — Take 02 (Ambient)', seed: 'SEED-9012', key: 'F Minor', bpm: 95, genre: 'Ambient Drone', mood: 'Dreamy', bars: [25, 45, 70, 65, 55, 80, 72, 60, 40, 52, 68, 75, 58, 44, 62, 50] }
  ])

  const genres = ['Synthwave', 'Lo-Fi Chill', 'Cinematic Score', 'Ambient Drone', 'Deep House', 'Acoustic Folk']
  const moods = ['Euphoric', 'Melancholic', 'Tense', 'Dreamy', 'Energetic', 'Meditative']

  const cardClass = isDark ? 'border-white/10 bg-black/45' : 'border-white/75 bg-white/60 shadow-sm'
  const accentText = isDark ? 'text-orange-500' : 'text-indigo-600'

  const handleGenerate = () => {
    setIsGenerating(true)
    setTimeout(() => {
      const newTake = generationService.generateTrack(prompt, selectedGenre, selectedMood, bpm)
      setTakes((prev) => [newTake, ...prev])
      setIsGenerating(false)
    }, 400)
  }

  return (
    <MainLayout activePage="generator" isDark={isDark} onToggleTheme={onToggleTheme} onNavigate={onNavigate} title="Music Generator" subtitle="Text-to-Audio Diffusion Engine">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className={`p-4 rounded-3xl border space-y-3 ${cardClass}`}>
            <label className={`text-xs font-semibold flex items-center gap-1.5 ${isDark ? 'text-zinc-200' : 'text-slate-900'}`}>
              <Sparkles className={`w-3.5 h-3.5 ${accentText}`} />
              Composition Prompt
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className={`w-full rounded-2xl border p-3 text-xs resize-none focus:outline-none ${
                isDark ? 'bg-zinc-950/70 border-white/10 text-zinc-100' : 'bg-white/80 border-white text-slate-900'
              }`}
            />

            <div className="space-y-1.5">
              <span className={`text-[11px] font-medium ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>Genre</span>
              <div className="flex flex-wrap gap-1.5">
                {genres.map((g) => (
                  <button
                    key={g}
                    onClick={() => setSelectedGenre(g)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition cursor-pointer ${
                      selectedGenre === g
                        ? isDark ? 'bg-orange-500 text-zinc-950 font-semibold' : 'bg-indigo-600 text-white font-semibold'
                        : isDark ? 'bg-zinc-900 text-zinc-400 hover:text-white' : 'bg-white/75 text-slate-700 hover:bg-white'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className={`text-[11px] font-medium ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>Mood</span>
              <div className="flex flex-wrap gap-1.5">
                {moods.map((m) => (
                  <button
                    key={m}
                    onClick={() => setSelectedMood(m)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition cursor-pointer ${
                      selectedMood === m
                        ? isDark ? 'bg-amber-500 text-zinc-950 font-semibold' : 'bg-violet-600 text-white font-semibold'
                        : isDark ? 'bg-zinc-900 text-zinc-400 hover:text-white' : 'bg-white/75 text-slate-700 hover:bg-white'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex justify-between text-[11px]">
                <span className={isDark ? 'text-zinc-400' : 'text-slate-700'}>Tempo: {bpm} BPM</span>
                <span className={isDark ? 'text-zinc-400' : 'text-slate-700'}>Length: {duration}s</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="range" min="60" max="180" value={bpm} onChange={(e) => setBpm(Number(e.target.value))} className={`cursor-pointer ${isDark ? 'accent-orange-500' : 'accent-indigo-600'}`} />
                <input type="range" min="15" max="180" step="15" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className={`cursor-pointer ${isDark ? 'accent-orange-500' : 'accent-indigo-600'}`} />
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`w-full py-2.5 rounded-full bg-gradient-to-r hover:brightness-110 font-semibold text-xs transition cursor-pointer flex items-center justify-center gap-2 ${
                isDark ? 'from-orange-500 to-amber-500 text-zinc-950' : 'from-sky-500 via-indigo-500 to-violet-500 text-white'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>{isGenerating ? 'Diffusing Audio...' : 'Generate Track'}</span>
            </button>
          </div>
        </div>

        <div className={`lg:col-span-7 p-4 rounded-3xl border flex flex-col gap-3 ${cardClass}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold flex items-center gap-1.5 ${isDark ? 'text-zinc-200' : 'text-slate-900'}`}>
              <Sliders className={`w-3.5 h-3.5 ${accentText}`} />
              Generated Takes ({takes.length})
            </span>
          </div>

          <div className="space-y-3 overflow-y-auto">
            {takes.map((take) => (
              <div key={take.id} className={`p-3.5 rounded-2xl border space-y-2.5 ${
                isDark ? 'border-white/10 bg-zinc-950/60' : 'border-white/85 bg-white/75'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{take.title}</div>
                    <div className={`text-[10px] font-mono ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                      {take.seed} • {take.key} • {bpm} BPM
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onNavigate('dashboard')}
                      className={`px-3 py-1 rounded-full border text-[11px] font-medium cursor-pointer ${
                        isDark ? 'bg-orange-500/15 border-orange-500/40 text-orange-500' : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-700'
                      }`}
                    >
                      Open in DAW
                    </button>
                    <button
                      onClick={() => generationService.downloadWav(take)}
                      title="Download Rendered .WAV"
                      className={`p-1.5 rounded-full border cursor-pointer ${
                        isDark ? 'border-white/10 text-zinc-300 hover:text-white' : 'border-white bg-white text-slate-700 hover:text-slate-950'
                      }`}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="h-10 flex items-end gap-1 px-1">
                  {take.bars.map((b, i) => (
                    <span
                      key={i}
                      style={{ height: `${b}%` }}
                      className={`flex-1 rounded-full bg-gradient-to-t ${
                        isDark ? 'from-orange-500 to-amber-300' : 'from-violet-500 via-indigo-500 to-sky-400'
                      }`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}