import { useState, useEffect } from 'react'
import { Wand2, Sparkles, Sliders, Download, Play, Pause, Trash2 } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { AppRoute } from '@/components/layout/Sidebar'
import { generationService, GeneratedTake } from '@/features/music-generator/services/generationService'
import { audioEngine } from '@/services/audioEngine'

interface PageProps {
  isDark: boolean
  onToggleTheme: () => void
  onNavigate: (page: AppRoute) => void
}

export function MusicGeneratorPage({ isDark, onToggleTheme, onNavigate }: PageProps) {
  const [prompt, setPrompt] = useState(() => localStorage.getItem('dramatone_gen_prompt') || 'Bright brass trumpet solo with warm accompaniment')
  const [selectedGenre, setSelectedGenre] = useState(() => localStorage.getItem('dramatone_gen_genre') || 'Brass & Trumpet')
  const [selectedMood, setSelectedMood] = useState(() => localStorage.getItem('dramatone_gen_mood') || 'Heroic')
  const [bpm, setBpm] = useState(() => Number(localStorage.getItem('dramatone_gen_bpm')) || 104)
  const [duration, setDuration] = useState(60)
  const [isGenerating, setIsGenerating] = useState(false)
  const [playingTakeId, setPlayingTakeId] = useState<number | null>(null)
  const [takes, setTakes] = useState<GeneratedTake[]>(() => {
    try {
      const saved = localStorage.getItem('dramatone_gen_takes')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Retain generator state and takes across tab navigation (Bug 3)
  useEffect(() => {
    try {
      localStorage.setItem('dramatone_gen_takes', JSON.stringify(takes))
      localStorage.setItem('dramatone_gen_prompt', prompt)
      localStorage.setItem('dramatone_gen_genre', selectedGenre)
      localStorage.setItem('dramatone_gen_mood', selectedMood)
      localStorage.setItem('dramatone_gen_bpm', String(bpm))
    } catch {}
  }, [takes, prompt, selectedGenre, selectedMood, bpm])

  const genres = ['Eerie & Dark Horror', 'Brass & Trumpet', 'Synthwave', 'Lo-Fi Chill', 'Cinematic Score', 'Ambient Drone', 'Deep House', 'Acoustic Folk']
  const moods = ['Heroic', 'Euphoric', 'Melancholic', 'Tense', 'Dreamy', 'Energetic', 'Meditative']

  const cardClass = isDark ? 'border-white/10 bg-black/45' : 'border-white/75 bg-white/60 shadow-sm'
  const accentText = isDark ? 'text-orange-500' : 'text-indigo-600'

  const handleGenerate = () => {
    setIsGenerating(true)
    setTimeout(() => {
      const newTake = generationService.generateTrack(prompt, selectedGenre, selectedMood, bpm)
      setTakes((prev) => [newTake, ...prev])
      setIsGenerating(false)
      // Do NOT auto-play without user action (Bug 1 fix)
    }, 400)
  }

  const handleDeleteTake = (id: number) => {
    if (playingTakeId === id) {
      audioEngine.stop()
      setPlayingTakeId(null)
    }
    setTakes((prev) => prev.filter((t) => t.id !== id))
  }

  const handleClearAllTakes = () => {
    audioEngine.stop()
    setPlayingTakeId(null)
    setTakes([])
  }

  const handleTogglePlayTake = (take: GeneratedTake) => {
    if (playingTakeId === take.id) {
      audioEngine.stop()
      setPlayingTakeId(null)
    } else {
      generationService.auditionTake(take)
      setPlayingTakeId(take.id)
    }
  }

  const handleOpenInDaw = (take: GeneratedTake) => {
    audioEngine.loadComposition(take.genre, take.mood, take.bpm)
    onNavigate('dashboard')
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
            {takes.length > 0 && (
              <button
                onClick={handleClearAllTakes}
                className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer transition"
              >
                <Trash2 className="w-3 h-3" />
                Clear All
              </button>
            )}
          </div>

          <div className="space-y-3 overflow-y-auto flex-1 flex flex-col">
            {takes.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-60 space-y-2.5 my-auto">
                <Wand2 className="w-8 h-8 opacity-35" />
                <div className="text-xs font-semibold">Workspace is a Blank Slate</div>
                <div className="text-[11px] max-w-xs">No audio takes generated yet. Enter a prompt on the left and click "Generate Track" to synthesize your first stems.</div>
              </div>
            ) : (
              takes.map((take) => (
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
                      onClick={() => handleTogglePlayTake(take)}
                      title={playingTakeId === take.id ? 'Pause' : 'Audition Take Live'}
                      className={`w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition ${
                        playingTakeId === take.id
                          ? isDark ? 'bg-amber-400 text-zinc-950' : 'bg-indigo-700 text-white'
                          : isDark ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                      }`}
                    >
                      {playingTakeId === take.id ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                    </button>
                    <button
                      onClick={() => handleOpenInDaw(take)}
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
                    <button
                      onClick={() => handleDeleteTake(take.id)}
                      title="Delete Take"
                      className={`p-1.5 rounded-full border cursor-pointer transition ${
                        isDark ? 'border-red-500/30 text-red-400 hover:bg-red-500/20' : 'border-red-200 text-red-600 bg-white hover:bg-red-50'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
            )))}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}