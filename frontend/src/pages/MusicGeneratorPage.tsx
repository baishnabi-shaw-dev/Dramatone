import { useState, useEffect } from 'react'
import { Wand2, Sparkles, Sliders, Play, Pause, Trash2, Music, Flame, Zap, Bot, Save, Check } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { AppRoute } from '@/components/layout/Sidebar'
import { generationService, GeneratedTake } from '@/features/music-generator/services/generationService'
import { audioEngine } from '@/services/audioEngine'
import { geminiArrangerService } from '@/services/geminiArrangerService'
import { apiClient } from '@/services/apiClient'

interface PageProps {
  isDark: boolean
  onToggleTheme: () => void
  onNavigate: (page: AppRoute) => void
}

export function MusicGeneratorPage({ isDark, onToggleTheme, onNavigate }: PageProps) {
  const [prompt, setPrompt] = useState(() => localStorage.getItem('dramatone_gen_prompt') || 'Bright brass trumpet solo with heroic cinematic accompaniment')
  const [selectedGenre, setSelectedGenre] = useState(() => localStorage.getItem('dramatone_gen_genre') || 'auto')
  const [selectedMood, setSelectedMood] = useState(() => localStorage.getItem('dramatone_gen_mood') || 'auto')
  const [autoPacing, setAutoPacing] = useState(true)
  const [bpm, setBpm] = useState(() => Number(localStorage.getItem('dramatone_gen_bpm')) || 104)
  const [duration, setDuration] = useState(60)
  const [isGenerating, setIsGenerating] = useState(false)
  const [playingTakeId, setPlayingTakeId] = useState<number | null>(null)
  const [savedTakeIds, setSavedTakeIds] = useState<Set<number>>(new Set())
  const [takes, setTakes] = useState<GeneratedTake[]>(() => {
    try {
      const saved = localStorage.getItem('dramatone_gen_takes')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  // Persist state across tab navigation
  useEffect(() => {
    try {
      localStorage.setItem('dramatone_gen_takes', JSON.stringify(takes))
      localStorage.setItem('dramatone_gen_prompt', prompt)
      localStorage.setItem('dramatone_gen_genre', selectedGenre)
      localStorage.setItem('dramatone_gen_mood', selectedMood)
      localStorage.setItem('dramatone_gen_bpm', String(bpm))
    } catch {}
  }, [takes, prompt, selectedGenre, selectedMood, bpm])

  const genres = [
    'Brass & Trumpet Fanfare',
    'Eerie & Dark Horror',
    'Cinematic Orchestral',
    'Cyberpunk Dystopia',
    'Synthwave & Retrowave',
    'Lo-Fi Hip Hop & Chill',
    'Ambient Drone & Space',
    'Dark Trap & Phonk',
    'Gothic & Darkwave',
    'Anime OST & Japanese Fusion',
    'Classical Piano & Strings',
    'Industrial Metal & Heavy Bass',
    'Deep House & Techno',
    'Acoustic Indie Folk',
    'Reggae & Dub Soundscape',
    'Jazz Noir & Smoke Club',
    '8-Bit Chiptune Retro',
    'Epic Fantasy Battle Anthem',
    'Cybernetic Glitch & IDM',
    'Desert Mystic & World Fusion'
  ]

  const moods = [
    'Heroic',
    'Tense & Suspenseful',
    'Euphoric',
    'Melancholic',
    'Eerie & Menacing',
    'Dreamy & Ethereal',
    'Energetic',
    'Meditative & Calm',
    'Dark & Foreboding',
    'Nostalgic & Warm',
    'Romantic',
    'Aggressive & Furious',
    'Mysterious & Esoteric',
    'Playful & Whimsical',
    'Epic & Majestic',
    'Cyber & Robotic'
  ]

  const quickInspirations = [
    { label: '🎺 Heroic Trumpet Fanfare', genre: 'Brass & Trumpet Fanfare', mood: 'Heroic', bpm: 112, prompt: 'Bright brass trumpet solo with heroic cinematic orchestral fanfare' },
    { label: '🌑 Eerie Horror Tension', genre: 'Eerie & Dark Horror', mood: 'Eerie & Menacing', bpm: 72, prompt: 'Menacing low drone with dissonant string glissando and eerie clock ticking' },
    { label: '⚡ Cyberpunk Synthwave', genre: 'Cyberpunk Dystopia', mood: 'Cyber & Robotic', bpm: 124, prompt: 'Pulsing saw synthesizers with neon basslines and driving electronic drums' },
    { label: '🌌 Ethereal Ambient Space', genre: 'Ambient Drone & Space', mood: 'Dreamy & Ethereal', bpm: 60, prompt: 'Deep cosmic reverb pads with crystalline shimmer and warm drifting textures' }
  ]

  const cardClass = isDark ? 'border-white/10 bg-black/45' : 'border-white/75 bg-white/60 shadow-sm'
  const accentText = isDark ? 'text-orange-500' : 'text-indigo-600'

  const [genNotice, setGenNotice] = useState<string | null>(null)

  const handleGenerate = async () => {
    setIsGenerating(true)
    audioEngine.ensureContext()

    try {
      const g = selectedGenre === 'auto' ? '' : selectedGenre
      const m = selectedMood === 'auto' ? '' : selectedMood
      const tempo = autoPacing ? '' : `${bpm} BPM`
      const fullPrompt = [prompt.trim(), g, m, tempo].filter(Boolean).join(', ')

      // Call Gemini AI Arranger to compose the track
      let arranged: any
      try {
        arranged = await geminiArrangerService.arrangeMusic(fullPrompt, duration)
        setGenNotice(`🤖 Composed by Gemini AI (${arranged.notes?.length || 0} notes, ${arranged.key})`)
      } catch (gemErr) {
        console.warn('Gemini arrangement fallback:', gemErr)
        arranged = geminiArrangerService.proceduralArranger(fullPrompt, duration)
        setGenNotice('⚡ Composed via Procedural Engine')
      }
      setTimeout(() => setGenNotice(null), 4500)

      const takeId = Date.now()
      const newTake: GeneratedTake = {
        id: takeId,
        title: arranged.title || `Gemini Take #${takeId % 1000}`,
        seed: `GEMINI-${takeId.toString(36).toUpperCase()}`,
        key: arranged.key || 'D Minor',
        bpm: arranged.bpm || bpm || 110,
        genre: arranged.genre || (selectedGenre !== 'auto' ? selectedGenre : 'Cinematic Soundtrack'),
        mood: arranged.mood || (selectedMood !== 'auto' ? selectedMood : 'Evocative'),
        bars: Array.from({ length: 48 }, (_, i) => {
          const stepIdx = Math.floor((i / 48) * 64)
          const hasNote = arranged.notes?.some((n: any) => n.step === stepIdx)
          return hasNote ? Math.floor(60 + (stepIdx % 4 === 0 ? 30 : 15)) : Math.floor(25 + Math.sin(i / 3) * 15)
        }),
        duration: arranged.durationSeconds || duration
      }

      if (arranged.tension) {
        audioEngine.setTension(arranged.tension)
      }

      // Pre-load arrangement notes into audioEngine profile
      audioEngine.loadDirectProfile(
        {
          genre: arranged.genre,
          mood: arranged.mood,
          bpm: arranged.bpm,
          key: arranged.key,
          leadInstrument: arranged.leadInstrument as any,
          chords: arranged.chords,
          scale: arranged.scale,
          bassFreqs: arranged.bassFreqs
        },
        arranged.notes
      )

      setTakes((prev) => [newTake, ...prev])

      // Auto-save generated score to Dramatone Projects & Library (Cloud MongoDB + LocalStorage)
      try {
        await apiClient.saveProject({
          title: newTake.title,
          genre: newTake.genre,
          mood: newTake.mood,
          bpm: newTake.bpm,
          tension: arranged.tension || 50,
          stems: [
            { id: 'stem-drums', name: arranged.stemNames?.drums || 'Drums & Percussion', volume: 85, muted: false, solo: false },
            { id: 'stem-bass', name: arranged.stemNames?.bass || 'Bassline', volume: 80, muted: false, solo: false },
            { id: 'stem-inst', name: arranged.stemNames?.lead || 'Melodic Lead', volume: 90, muted: false, solo: false },
            { id: 'stem-vocal', name: arranged.stemNames?.harmony || 'Harmony / Atmosphere', volume: 75, muted: false, solo: false }
          ]
        })
        setSavedTakeIds((prev) => new Set(prev).add(takeId))
        setGenNotice(`✓ Generated & Auto-Saved "${newTake.title}" to Projects & Library!`)
      } catch (saveErr) {
        console.warn('Auto-save error:', saveErr)
      }
    } catch (err) {
      console.error('Generation error:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveTake = async (take: GeneratedTake) => {
    try {
      await apiClient.saveProject({
        title: take.title,
        genre: take.genre,
        mood: take.mood,
        bpm: take.bpm,
        tension: 50,
        stems: [
          { id: 'stem-drums', name: 'Drums & Percussion', volume: 85, muted: false, solo: false },
          { id: 'stem-bass', name: 'Bassline', volume: 80, muted: false, solo: false },
          { id: 'stem-inst', name: 'Melodic Lead', volume: 90, muted: false, solo: false },
          { id: 'stem-vocal', name: 'Harmony / Atmosphere', volume: 75, muted: false, solo: false }
        ]
      })
      setSavedTakeIds((prev) => new Set(prev).add(take.id))
      setGenNotice(`✓ Saved "${take.title}" to Projects & Library!`)
      setTimeout(() => setGenNotice(null), 3000)
    } catch (err) {
      console.error('Save take error:', err)
    }
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
    const isStrings = take.genre.includes('Cinematic') || take.genre.includes('Strings')
    const hasRain = take.genre.includes('Rain')
    const hasBuild = take.genre.includes('Build')
    audioEngine.loadComposition(take.genre, take.mood, take.bpm, {
      hasStrings: isStrings,
      hasRainFoley: hasRain,
      hasGradualBuild: hasBuild,
      hasSubBass: isStrings,
      hasStaccato: isStrings,
      duration: take.duration || duration
    })
    onNavigate('daw')
  }

  return (
    <MainLayout
      activePage="generator"
      isDark={isDark}
      onToggleTheme={onToggleTheme}
      onNavigate={onNavigate}
      title="Music Generator"
      subtitle="Neural Text-to-Audio Diffusion & Adaptive Arrangement"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1">
        {/* Left Column: Studio Diffusion Controls */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className={`p-5 rounded-3xl border space-y-4 ${cardClass}`}>
            {/* Prompt Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-zinc-200' : 'text-slate-900'}`}>
                  <Sparkles className={`w-3.5 h-3.5 ${accentText}`} />
                  <span>Composition Prompt</span>
                </label>
                <span className="text-[10px] font-mono opacity-50">Diffusion v2.4</span>
              </div>

              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe instruments, atmosphere, rhythm, and pacing..."
                className={`w-full rounded-2xl border p-3 text-xs resize-none focus:outline-none transition ${
                  isDark
                    ? 'bg-zinc-950/70 border-white/10 text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500/60'
                    : 'bg-white/80 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500/60'
                }`}
              />

              {/* Quick Prompt Inspiration Chips */}
              <div className="space-y-1">
                <div className="text-[10px] font-medium opacity-60 flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5 text-amber-400" />
                  <span>Quick Presets</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {quickInspirations.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setPrompt(p.prompt)
                        setSelectedGenre(p.genre)
                        setSelectedMood(p.mood)
                        setBpm(p.bpm)
                      }}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-medium transition cursor-pointer border ${
                        isDark
                          ? 'border-white/5 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white'
                          : 'border-slate-200 bg-white/70 text-slate-700 hover:bg-white hover:text-slate-950'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Clean Dropdown Selectors for Genre & Mood (Both Optional) */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className={`text-[11px] font-semibold flex items-center gap-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    <Music className="w-3 h-3 text-orange-400" />
                    <span>Genre</span>
                  </label>
                  <span className="text-[9px] font-mono opacity-50 uppercase tracking-wider">(Optional)</span>
                </div>
                <select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className={`w-full rounded-xl border py-2 px-2.5 text-xs font-medium cursor-pointer focus:outline-none transition ${
                    isDark
                      ? 'bg-zinc-900 border-white/10 text-zinc-100 focus:border-orange-500/60'
                      : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500/60 shadow-sm'
                  }`}
                >
                  <option value="auto">✨ Auto — Deduce from Prompt</option>
                  {genres.map((g) => (
                    <option key={g} value={g} className={isDark ? 'bg-zinc-900 text-zinc-100' : 'bg-white text-slate-900'}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className={`text-[11px] font-semibold flex items-center gap-1 ${isDark ? 'text-zinc-300' : 'text-slate-700'}`}>
                    <Flame className="w-3 h-3 text-amber-400" />
                    <span>Mood</span>
                  </label>
                  <span className="text-[9px] font-mono opacity-50 uppercase tracking-wider">(Optional)</span>
                </div>
                <select
                  value={selectedMood}
                  onChange={(e) => setSelectedMood(e.target.value)}
                  className={`w-full rounded-xl border py-2 px-2.5 text-xs font-medium cursor-pointer focus:outline-none transition ${
                    isDark
                      ? 'bg-zinc-900 border-white/10 text-zinc-100 focus:border-orange-500/60'
                      : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500/60 shadow-sm'
                  }`}
                >
                  <option value="auto">✨ Auto — Emotion from Prompt</option>
                  {moods.map((m) => (
                    <option key={m} value={m} className={isDark ? 'bg-zinc-900 text-zinc-100' : 'bg-white text-slate-900'}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tempo (Optional / Auto Pacing) & Duration Sliders */}
            <div className="space-y-3 pt-1 border-t border-white/5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <span className="opacity-70 font-medium">Pacing / Tempo</span>
                      <span className="text-[9px] font-mono opacity-50">(Optional)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAutoPacing(!autoPacing)}
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded cursor-pointer transition ${
                        autoPacing
                          ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                          : isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {autoPacing ? 'AUTO PACING' : 'MANUAL'}
                    </button>
                  </div>

                  {autoPacing ? (
                    <div className={`py-1.5 px-2 rounded-xl border text-center text-[10px] font-mono ${
                      isDark ? 'border-amber-400/30 bg-amber-400/10 text-amber-300' : 'border-indigo-200 bg-indigo-50 text-indigo-700'
                    }`}>
                      ✨ AI Selects Ideal Scene Tempo
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-mono text-orange-400 font-bold">
                        <span>Tempo Slider</span>
                        <span>{bpm} BPM</span>
                      </div>
                      <input
                        type="range"
                        min="60"
                        max="180"
                        value={bpm}
                        onChange={(e) => setBpm(Number(e.target.value))}
                        className={`w-full cursor-pointer ${isDark ? 'accent-orange-500' : 'accent-indigo-600'}`}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="opacity-70 font-medium">Length</span>
                    <span className="font-mono font-bold text-amber-400">
                      0{Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')} ({duration}s)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="180"
                    step="15"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className={`w-full cursor-pointer ${isDark ? 'accent-amber-400' : 'accent-indigo-600'}`}
                  />
                </div>
              </div>
            </div>

            {/* Gemini Live Notice Banner */}
            {genNotice && (
              <div className="p-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-300 text-xs font-mono font-bold flex items-center gap-2 animate-in fade-in">
                <Bot className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{genNotice}</span>
              </div>
            )}

            {/* Generate Action Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`w-full py-3 rounded-2xl bg-gradient-to-r hover:brightness-110 font-bold text-xs tracking-wide transition cursor-pointer flex items-center justify-center gap-2 shadow-lg ${
                isDark
                  ? 'from-orange-500 via-amber-500 to-yellow-500 text-zinc-950 shadow-orange-500/20'
                  : 'from-sky-500 via-indigo-500 to-violet-500 text-white shadow-indigo-500/25'
              }`}
            >
              <Wand2 className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'Diffusing Soundscape & Synthesizing Stems...' : 'Synthesize Audio Track'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Generated Audio Takes */}
        <div className={`lg:col-span-7 p-5 rounded-3xl border flex flex-col gap-4 ${cardClass}`}>
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <span className={`text-xs font-bold flex items-center gap-2 ${isDark ? 'text-zinc-200' : 'text-slate-900'}`}>
              <Sliders className={`w-4 h-4 ${accentText}`} />
              <span>Generated Takes</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-indigo-100 text-indigo-700'
              }`}>
                {takes.length}
              </span>
            </span>

            {takes.length > 0 && (
              <button
                onClick={handleClearAllTakes}
                className="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All Takes</span>
              </button>
            )}
          </div>

          <div className="space-y-3 overflow-y-auto flex-1 flex flex-col pr-0.5">
            {takes.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-60 space-y-3 my-auto">
                <div className={`w-14 h-14 rounded-3xl flex items-center justify-center border ${
                  isDark ? 'border-white/10 bg-white/5 text-orange-400' : 'border-slate-200 bg-white text-indigo-600'
                }`}>
                  <Wand2 className="w-7 h-7" />
                </div>
                <div className="text-sm font-bold">Studio Canvas is Clean</div>
                <div className="text-xs max-w-sm leading-relaxed opacity-80">
                  Select a genre and mood on the left, or click a Quick Preset, then press <strong>Synthesize Audio Track</strong> to generate stems.
                </div>
              </div>
            ) : (
              takes.map((take) => (
                <div
                  key={take.id}
                  className={`p-4 rounded-2xl border transition space-y-3 ${
                    playingTakeId === take.id
                      ? isDark
                        ? 'border-orange-500/40 bg-orange-500/[0.06] shadow-sm'
                        : 'border-indigo-500/40 bg-indigo-50/50 shadow-sm'
                      : isDark
                      ? 'border-white/10 bg-zinc-950/60 hover:border-white/20'
                      : 'border-slate-200 bg-white/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {take.title}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-mono opacity-70">
                        <span className="text-orange-400 font-semibold">{take.genre}</span>
                        <span>•</span>
                        <span>{take.mood}</span>
                        <span>•</span>
                        <span>{bpm} BPM</span>
                        <span>•</span>
                        <span>
                          0{Math.floor((take.duration || duration) / 60)}:{((take.duration || duration) % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTogglePlayTake(take)}
                        title={playingTakeId === take.id ? 'Pause Audition' : 'Audition Take'}
                        className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition shadow ${
                          playingTakeId === take.id
                            ? 'bg-amber-400 text-zinc-950 ring-2 ring-amber-400/30'
                            : isDark
                            ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
                            : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                        }`}
                      >
                        {playingTakeId === take.id ? (
                          <Pause className="w-4 h-4 fill-current" />
                        ) : (
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        )}
                      </button>

                      <button
                        onClick={() => handleOpenInDaw(take)}
                        className={`px-3 py-1.5 rounded-xl border text-[11px] font-semibold cursor-pointer transition ${
                          isDark
                            ? 'bg-orange-500/15 border-orange-500/40 text-orange-400 hover:bg-orange-500/25'
                            : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                        }`}
                      >
                        Open in DAW
                      </button>

                      <button
                        onClick={() => handleSaveTake(take)}
                        title={savedTakeIds.has(take.id) ? 'Saved to Projects & Library' : 'Save to Projects & Library'}
                        className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition ${
                          savedTakeIds.has(take.id)
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                            : isDark
                            ? 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-700'
                            : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {savedTakeIds.has(take.id) ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Saved</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" />
                            <span>Save to Projects</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleDeleteTake(take.id)}
                        title="Delete take"
                        className="p-1.5 rounded-lg opacity-40 hover:opacity-100 hover:text-red-400 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Waveform preview simulation */}
                  <div className="flex items-center gap-1 h-4 pt-1 opacity-70">
                    {Array.from({ length: 36 }).map((_, barIdx) => {
                      const heightPercent = 20 + Math.sin(barIdx * 0.5 + take.id) * 40 + (barIdx % 3) * 15
                      return (
                        <div
                          key={barIdx}
                          style={{ height: `${Math.max(15, Math.min(100, heightPercent))}%` }}
                          className={`flex-1 rounded-full transition-all ${
                            playingTakeId === take.id
                              ? 'bg-gradient-to-t from-orange-500 to-amber-300'
                              : isDark
                              ? 'bg-white/15'
                              : 'bg-slate-300'
                          }`}
                        />
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
