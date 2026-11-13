import { useState, useEffect, useRef } from 'react'
import { Sparkles, Wand2, Plus, Piano, Drum, Guitar, Mic2, Film, Scissors, Download, Save, Check, Layers, Trash2, ChevronDown, ChevronUp, LocateFixed } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { AppRoute } from '@/components/layout/Sidebar'
import { DawPianoRoll } from '@/components/daw/DawPianoRoll'
import { audioEngine, StemId } from '@/services/audioEngine'
import { apiClient } from '@/services/apiClient'
import { soundscapeService } from '@/features/adaptive-soundscape/services/soundscapeService'

interface PageProps {
  isDark: boolean
  onToggleTheme: () => void
  onNavigate: (page: AppRoute) => void
}

function generateStemBars(stemType: string): number[] {
  const count = 48
  return Array.from({ length: count }, (_, i) => {
    if (stemType === 'drums') {
      return (i % 4 === 0) ? Math.floor(75 + Math.random() * 25) : (i % 2 === 0) ? Math.floor(35 + Math.random() * 25) : Math.floor(10 + Math.random() * 15)
    } else if (stemType === 'keys') {
      return Math.floor(40 + Math.sin(i / 3) * 25 + Math.random() * 20)
    } else if (stemType === 'guitar') {
      return Math.floor(30 + ((i % 8) / 8) * 45 + Math.random() * 15)
    } else {
      return Math.floor(25 + Math.cos(i / 5) * 20 + Math.random() * 20)
    }
  })
}

export function DashboardPage({ isDark, onToggleTheme, onNavigate }: PageProps) {
  const [promptText, setPromptText] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [playhead, setPlayhead] = useState(0)
  const [stems, setStems] = useState([
    { id: 'keys', name: 'Keys / Harmony', type: 'keys', volume: 80, muted: false, solo: false, bars: [] as number[] },
    { id: 'drums', name: 'Neural Drums', type: 'drums', volume: 80, muted: false, solo: false, bars: [] as number[] },
    { id: 'guitar', name: 'Acoustic Pluck', type: 'guitar', volume: 75, muted: false, solo: false, bars: [] as number[] },
    { id: 'vocal', name: 'Atmosphere / Texture', type: 'vocal', volume: 70, muted: false, solo: false, bars: [] as number[] }
  ])

  const [saveStatus, setSaveStatus] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [viewMode, setViewMode] = useState<'stems' | 'piano-roll'>('stems')
  const [isPromptCollapsed, setIsPromptCollapsed] = useState(false)
  const [followSlider, setFollowSlider] = useState(true)
  const timelineTracksRef = useRef<HTMLDivElement>(null)

  // Real-time Playhead sync with audio transport
  useEffect(() => {
    const unsub = audioEngine.addStepListener((step) => {
      if (step >= 0) {
        setPlayhead((step / 64) * 100)
      }
    })
    return () => unsub()
  }, [])

  // Auto-scroll timeline to follow slider/playhead during playback
  useEffect(() => {
    if (!followSlider || !timelineTracksRef.current) return
    const container = timelineTracksRef.current
    if (container.scrollWidth <= container.clientWidth) return

    const playheadPx = (playhead / 100) * container.scrollWidth
    const viewLeft = container.scrollLeft
    const viewRight = container.scrollLeft + container.clientWidth

    if (playheadPx > viewRight - 60 || playheadPx < viewLeft) {
      container.scrollTo({
        left: Math.max(0, playheadPx - container.clientWidth / 2),
        behavior: 'smooth'
      })
    }
  }, [playhead, followSlider])

  const handleSeekPlayhead = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
    setPlayhead(pct)
    const targetStep = Math.floor((pct / 100) * 64)
    audioEngine.seekStep(targetStep)
  }

  const cardClass = isDark ? 'border-white/10 bg-black/45' : 'border-white/75 bg-white/60 shadow-sm'
  const accentText = isDark ? 'text-orange-500' : 'text-indigo-600'

  const handleGenerate = () => {
    setIsGenerating(true)
    audioEngine.ensureContext()
    setTimeout(() => {
      const p = promptText.toLowerCase()
      const bpmMatch = p.match(/(\d{2,3})\s*bpm/i)
      const explicitBpm = bpmMatch ? parseInt(bpmMatch[1], 10) : undefined

      const hasStrings = p.includes('string') || p.includes('violin') || p.includes('cello') || p.includes('orchestr')
      const hasRain = p.includes('rain') || p.includes('water') || p.includes('storm') || p.includes('foley')
      const hasBuild = p.includes('build') || p.includes('gradual') || p.includes('crescendo') || p.includes('swell')
      const isTrumpet = p.includes('trumpet') || p.includes('brass') || p.includes('horn') || p.includes('fanfare')
      const isEerie = (p.includes('eerie') || p.includes('creepy') || p.includes('horror') || p.includes('ghost')) && !hasStrings

      if (hasRain || (hasStrings && (p.includes('dark') || hasBuild || p.includes('cinematic')))) {
        audioEngine.loadComposition('Dark Cinematic Build', 'Tense', explicitBpm || 90, {
          hasStrings: true,
          hasRainFoley: hasRain,
          hasGradualBuild: hasBuild,
          hasSubBass: true,
          hasStaccato: true
        })
        audioEngine.setTension(hasBuild ? 35 : 75)
      } else if (isTrumpet) {
        audioEngine.loadComposition('Brass & Trumpet', 'Heroic', explicitBpm || 104)
        audioEngine.setTension(60)
      } else if (isEerie) {
        audioEngine.loadComposition('Eerie & Dark Horror', 'Tense', explicitBpm || 62)
        audioEngine.setTension(80)
      } else if (p.includes('lo-fi') || p.includes('chill') || p.includes('piano')) {
        audioEngine.loadComposition('Lo-Fi Chill', 'Chill', explicitBpm || 85)
        audioEngine.setTension(40)
      } else if (p.includes('cinematic') || p.includes('epic') || p.includes('film')) {
        audioEngine.loadComposition('Cinematic Score', 'Dramatic', explicitBpm || 90, {
          hasStrings: true,
          hasGradualBuild: hasBuild
        })
        audioEngine.setTension(70)
      } else if (p.includes('action') || p.includes('cyber') || p.includes('pulse')) {
        audioEngine.loadComposition('Cyberpunk', 'Suspense', explicitBpm || 130)
        audioEngine.setTension(85)
      } else if (p.includes('ambient') || p.includes('drone')) {
        audioEngine.loadComposition('Ambient Drone', 'Calm', explicitBpm || 72)
        audioEngine.setTension(25)
      } else {
        audioEngine.loadComposition('Cinematic Score', 'Dramatic', explicitBpm || 90)
        audioEngine.setTension(55)
      }

      setStems((prev) =>
        prev.map((s) => ({
          ...s,
          name: s.id === 'keys'
            ? hasStrings ? 'Cinematic Strings (Violins)' : isEerie ? 'Dissonant Drone Pad' : isTrumpet ? 'Trumpet / Brass Lead' : 'Dramatone Keys'
            : s.id === 'drums'
            ? hasStrings ? 'Cinematic Timpani' : 'Neural Drums'
            : s.id === 'guitar'
            ? hasStrings ? 'Staccato String Ostinato' : 'Acoustic Pluck'
            : s.id === 'vocal'
            ? hasRain ? 'Ambient Rain Foley' : isEerie ? 'Phantom Whisper Texture' : 'Vocal Texture'
            : s.name,
          bars: generateStemBars(s.type)
        }))
      )
      setIsGenerating(false)
    }, 400)
  }

  // Selecting suggestion chips only pre-populates prompt without triggering immediate audio switch
  const handleSelectPreset = (preset: string) => {
    if (preset === 'Trumpet Fanfare') {
      setPromptText('Brass trumpet fanfare with majestic brass chords and heroic melody, 104 BPM')
    } else if (preset === 'Cinematic Riser') {
      setPromptText('Cinematic Riser with escalating string swells and brass impacts, 90 BPM')
    } else if (preset === 'Lo-Fi Beat') {
      setPromptText('Lo-Fi Beat with dusty keys, relaxed vinyl crackle and mellow Rhodes chords, 85 BPM')
    } else if (preset === 'Ambient Pad') {
      setPromptText('Ambient Pad with warm ethereal drones, sus2 chords, and tape flutter, 72 BPM')
    } else if (preset === 'Action Pulse') {
      setPromptText('Action Pulse with driving synth bassline, industrial percussion and glitch risers, 130 BPM')
    }
  }

  const handleDeleteStem = (stemId: string) => {
    setStems((prev) => prev.filter((s) => s.id !== stemId))
  }

  const handleAddTrack = (type: 'keys' | 'drums' | 'guitar' | 'vocal', labelPrefix: string) => {
    setStems((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}-${type}`,
        name: `${labelPrefix} 0${prev.filter((s) => s.type === type).length + 1}`,
        type,
        volume: 75,
        muted: false,
        solo: false,
        bars: generateStemBars(type)
      }
    ])
  }

  const handleVolumeChange = (stemId: string, volume: number) => {
    setStems((prev) =>
      prev.map((s) => {
        if (s.id === stemId) {
          if (['keys', 'drums', 'guitar', 'vocal'].includes(s.id)) {
            audioEngine.setStemVolume(s.id as StemId, volume)
          }
          return { ...s, volume }
        }
        return s
      })
    )
  }

  const handleToggleMute = (stemId: string) => {
    setStems((prev) =>
      prev.map((s) => {
        if (s.id === stemId) {
          const nextMuted = !s.muted
          if (['keys', 'drums', 'guitar', 'vocal'].includes(s.id)) {
            audioEngine.setStemMute(s.id as StemId, nextMuted)
          }
          return { ...s, muted: nextMuted }
        }
        return s
      })
    )
  }

  const handleToggleSolo = (stemId: string) => {
    setStems((prev) =>
      prev.map((s) => {
        if (s.id === stemId) {
          const nextSolo = !s.solo
          if (['keys', 'drums', 'guitar', 'vocal'].includes(s.id)) {
            audioEngine.setStemSolo(s.id as StemId, nextSolo)
          }
          return { ...s, solo: nextSolo }
        }
        return s
      })
    )
  }

  const handleSaveProject = async () => {
    setSaveStatus('Saving...')
    try {
      const activeProf = audioEngine.getActiveProfile()
      const saved = await apiClient.saveProject({
        title: promptText.slice(0, 32) || 'Untitled Soundscape',
        genre: activeProf.genre || 'Custom',
        mood: activeProf.mood || 'Neutral',
        bpm: audioEngine.getBpm(),
        tension: audioEngine.getTension(),
        stems: stems.map((s) => ({ id: s.id, name: s.name, volume: s.volume, muted: s.muted, solo: s.solo }))
      })
      setSaveStatus(saved.syncedToCloud ? 'Saved to MongoDB!' : 'Saved Locally!')
      setTimeout(() => setSaveStatus(null), 3000)
    } catch {
      setSaveStatus('Saved Locally!')
      setTimeout(() => setSaveStatus(null), 3000)
    }
  }

  const handleExportWav = async () => {
    setIsExporting(true)
    try {
      await soundscapeService.exportWav('Dramatone_Master_Take', 16)
    } finally {
      setIsExporting(false)
    }
  }

  const handleSplitAtPlayhead = () => {
    setStems((prev) =>
      prev.map((s) => ({
        ...s,
        bars: s.bars.map((b, idx) => (idx >= Math.floor(s.bars.length / 2) ? Math.floor(b * 0.7) : b))
      }))
    )
  }

  return (
    <MainLayout
      activePage="dashboard"
      isDark={isDark}
      onToggleTheme={onToggleTheme}
      onNavigate={onNavigate}
      title="Studio Workspace"
      subtitle="Video-Synced Multi-Stem DAW"
    >
      {/* Top-Left Prompt & Presets Card (Sits beside Top-Right Video Monitor) */}
      <div className={`p-3 sm:p-3.5 rounded-3xl border backdrop-blur-md transition-all duration-200 shrink-0 ${isPromptCollapsed ? 'space-y-0' : 'space-y-3'} ${cardClass}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setIsPromptCollapsed(!isPromptCollapsed)}
              title={isPromptCollapsed ? 'Expand AI Prompt & Presets' : 'Collapse Prompt Section for more Canvas Space'}
              className="flex items-center gap-1.5 text-xs font-semibold cursor-pointer hover:opacity-80 transition"
            >
              <Sparkles className={`w-3.5 h-3.5 ${accentText}`} />
              <span className={isDark ? 'text-zinc-200' : 'text-slate-900'}>AI Stem Diffusion &amp; Scene Scoring</span>
              {isPromptCollapsed ? <ChevronDown className="w-3.5 h-3.5 opacity-60" /> : <ChevronUp className="w-3.5 h-3.5 opacity-60" />}
            </button>
            {isPromptCollapsed && promptText && (
              <span className="text-[10px] font-mono opacity-50 truncate max-w-xs hidden sm:inline">
                "{promptText}"
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => onNavigate('soundscape')} className={`text-[11px] hover:underline cursor-pointer ${accentText}`}>
              Adaptive Score
            </button>
            <span className="opacity-30">|</span>
            <button onClick={() => onNavigate('generator')} className={`text-[11px] hover:underline cursor-pointer ${accentText}`}>
              Full Generator &rarr;
            </button>
          </div>
        </div>

        {!isPromptCollapsed && (
          <>
            <textarea
              rows={2}
              value={promptText}
              placeholder="Describe your desired soundscape (e.g. 'eerie sound', 'brass fanfare', 'cinematic score')..."
              onChange={(e) => setPromptText(e.target.value)}
              className={`w-full rounded-2xl border p-2.5 text-xs resize-none focus:outline-none ${isDark ? 'bg-zinc-950/70 border-white/10 text-zinc-100 placeholder:text-zinc-600' : 'bg-white/80 border-white text-slate-900 placeholder:text-slate-400'
                }`}
            />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
                {['Trumpet Fanfare', 'Cinematic Riser', 'Lo-Fi Beat', 'Ambient Pad', 'Action Pulse'].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handleSelectPreset(preset)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-medium border cursor-pointer transition ${isDark
                        ? 'border-white/10 bg-white/5 text-zinc-300 hover:border-orange-500/40'
                        : 'border-white bg-white/80 text-slate-700 hover:border-indigo-400'
                      }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className={`px-4 py-1.5 rounded-full bg-gradient-to-r hover:brightness-110 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 ${isDark ? 'from-orange-500 to-amber-500 text-zinc-950' : 'from-sky-500 via-indigo-500 to-violet-500 text-white'
                  }`}
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>{isGenerating ? 'Synthesizing...' : 'Generate Stems'}</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Multi-Track Video + Audio Stem Timeline */}
      <div className={`p-3.5 rounded-3xl border backdrop-blur-md flex-1 flex flex-col gap-3 min-h-[380px] ${cardClass}`}>
        {/* Timeline Ruler & Split Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/10">
          <div className="flex flex-wrap items-center gap-2">
            {/* View Switcher: Stems vs DAW Piano Roll */}
            <div className={`flex items-center gap-1 p-0.5 rounded-xl border text-[10px] ${isDark ? 'border-white/10 bg-black/40' : 'border-slate-200 bg-slate-100'
              }`}>
              <button
                onClick={() => setViewMode('stems')}
                className={`px-2 py-0.5 rounded-lg font-semibold flex items-center gap-1 cursor-pointer transition ${viewMode === 'stems'
                    ? isDark ? 'bg-orange-500 text-zinc-950' : 'bg-indigo-600 text-white'
                    : isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-600 hover:text-slate-950'
                  }`}
              >
                <Layers className="w-3 h-3" />
                Stems View
              </button>
              <button
                onClick={() => setViewMode('piano-roll')}
                className={`px-2 py-0.5 rounded-lg font-semibold flex items-center gap-1 cursor-pointer transition ${viewMode === 'piano-roll'
                    ? isDark ? 'bg-orange-500 text-zinc-950' : 'bg-indigo-600 text-white'
                    : isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-600 hover:text-slate-950'
                  }`}
              >
                <Piano className="w-3 h-3" />
                DAW Roll &amp; MIDI Studio
              </button>
            </div>

            <button
              onClick={handleSplitAtPlayhead}
              className={`px-2.5 py-1 rounded-lg border text-[10px] font-medium flex items-center gap-1 cursor-pointer ${isDark ? 'border-white/10 bg-white/5 text-zinc-300 hover:text-white' : 'border-white bg-white/85 text-slate-800'
                }`}
            >
              <Scissors className="w-3 h-3" />
              Split at Playhead
            </button>

            <button
              onClick={() => setFollowSlider(!followSlider)}
              title={followSlider ? 'Follow Slider: ON (auto-scrolls timeline to follow playhead)' : 'Follow Slider: OFF'}
              className={`px-2.5 py-1 rounded-lg border text-[10px] font-medium flex items-center gap-1 cursor-pointer transition ${
                followSlider
                  ? isDark ? 'border-amber-400/50 bg-amber-400/15 text-amber-300 font-semibold' : 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold'
                  : isDark ? 'border-white/10 bg-white/5 text-zinc-400 hover:text-white' : 'border-slate-300 bg-white text-slate-600 hover:text-slate-900'
              }`}
            >
              <LocateFixed className={`w-3 h-3 ${followSlider && audioEngine.getIsPlaying() ? 'animate-pulse text-amber-400' : ''}`} />
              <span>Follow Slider</span>
            </button>
            <span className={`text-[10px] font-mono ${isDark ? 'text-zinc-500' : 'text-slate-600'}`}>
              00:00 — 00:25 — 00:50 — 01:15 — 01:45
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {saveStatus && (
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded flex items-center gap-1 ${isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-indigo-500/15 text-indigo-700'
                }`}>
              <Check className="w-2.5 h-2.5" />
              {saveStatus}
            </span>
          )}

          <button
            onClick={handleSaveProject}
            title="Save Session to MongoDB / Local Cache"
            className={`px-2.5 py-1 rounded-lg border text-[10px] font-medium flex items-center gap-1 cursor-pointer transition ${isDark ? 'border-orange-500/40 bg-orange-500/15 text-orange-400 hover:bg-orange-500/25' : 'border-indigo-400 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
              }`}
          >
            <Save className="w-3 h-3" />
            Save Project
          </button>

          <button
            onClick={handleExportWav}
            disabled={isExporting}
            title="Render & Export 44.1kHz Stereo WAV"
            className={`px-2.5 py-1 rounded-lg border text-[10px] font-medium flex items-center gap-1 cursor-pointer transition ${isDark ? 'border-white/10 bg-white/5 text-zinc-300 hover:text-white' : 'border-white bg-white/85 text-slate-800'
              }`}
          >
            <Download className="w-3 h-3" />
            {isExporting ? 'Rendering...' : 'Export WAV'}
          </button>

          <button
            onClick={() => soundscapeService.exportGameConfig('Cyberpunk Scene')}
            title="Export Unity / Godot Adaptive Soundscape JSON"
            className={`px-2 py-1 rounded-lg border text-[10px] font-medium flex items-center gap-1 cursor-pointer ${isDark ? 'border-white/10 bg-white/5 text-zinc-400 hover:text-zinc-200' : 'border-white bg-white/85 text-slate-600'
              }`}
          >
            Game JSON
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={() => handleAddTrack('keys', 'Keys')}
              title="Add new Poly Keys / Pad track"
              className={`px-2 py-1 rounded-lg border text-[10px] font-medium flex items-center gap-1 cursor-pointer transition ${isDark ? 'border-white/10 bg-white/5 text-zinc-300 hover:text-white' : 'border-white bg-white/85 text-slate-800'}`}
            >
              <Plus className="w-2.5 h-2.5" />
              Add Track
            </button>
            <button
              onClick={() => handleAddTrack('drums', 'Drums')}
              title="Add Percussion / Beat stem"
              className={`px-1.5 py-1 rounded-lg border text-[10px] font-medium cursor-pointer transition ${isDark ? 'border-white/10 bg-white/5 text-zinc-400 hover:text-white' : 'border-slate-200 bg-white text-slate-700'}`}
            >
              +Beat
            </button>
            <button
              onClick={() => handleAddTrack('guitar', 'Pluck')}
              title="Add Pluck / Lead stem"
              className={`px-1.5 py-1 rounded-lg border text-[10px] font-medium cursor-pointer transition ${isDark ? 'border-white/10 bg-white/5 text-zinc-400 hover:text-white' : 'border-slate-200 bg-white text-slate-700'}`}
            >
              +Lead
            </button>
            <button
              onClick={() => handleAddTrack('vocal', 'Texture')}
              title="Add Ambient Texture / Foley stem"
              className={`px-1.5 py-1 rounded-lg border text-[10px] font-medium cursor-pointer transition ${isDark ? 'border-white/10 bg-white/5 text-zinc-400 hover:text-white' : 'border-slate-200 bg-white text-slate-700'}`}
            >
              +Foley
            </button>
          </div>
        </div>
      </div>

      {/* Tracks Stack or DAW Piano Roll */}
      {viewMode === 'piano-roll' ? (
        <DawPianoRoll isDark={isDark} showFullHeader={true} className="my-1 flex-1 min-h-[440px]" />
      ) : (
        <div ref={timelineTracksRef} className="space-y-1.5 overflow-y-auto flex-1 min-h-0">
          {/* Video Track Lane */}
          <div className={`p-2 rounded-2xl border flex items-center gap-3 ${isDark ? 'border-orange-500/30 bg-orange-500/10' : 'border-indigo-400/40 bg-indigo-500/10'
            }`}>
            <div className="w-48 sm:w-60 shrink-0 flex items-center gap-2">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isDark ? 'bg-orange-500 text-zinc-950' : 'bg-indigo-600 text-white'
                }`}>
                <Film className="w-3.5 h-3.5" />
              </div>
              <span className={`text-[11px] font-semibold truncate ${isDark ? 'text-orange-300' : 'text-indigo-900'}`}>
                Video Track
              </span>
            </div>

            <div
              onClick={handleSeekPlayhead}
              className={`flex-1 h-7 rounded-xl px-2 flex items-center justify-between relative overflow-hidden cursor-pointer ${isDark ? 'bg-black/40 border border-orange-500/20' : 'bg-white/70 border border-indigo-300/50'
                }`}
            >
              <span className={`text-[10px] font-mono ${isDark ? 'text-orange-200/80' : 'text-indigo-800'}`}>
                [ Main_Video_Clip.mp4 • 24fps ]
              </span>
              <div
                style={{ left: `${playhead}%` }}
                className="absolute top-0 bottom-0 w-[2px] bg-red-500 pointer-events-none"
              />
            </div>
          </div>

          {/* Audio Stem Lanes */}
          {stems.map((stem) => (
            <div
              key={stem.id}
              className={`p-2 rounded-2xl border flex items-center gap-3 ${stem.muted ? 'opacity-45' : 'opacity-100'
                } ${isDark ? 'border-white/10 bg-zinc-950/60' : 'border-white/80 bg-white/75'}`}
            >
              <div className="w-48 sm:w-60 shrink-0 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  {stem.type === 'keys' && <Piano className={`w-3.5 h-3.5 shrink-0 ${accentText}`} />}
                  {stem.type === 'drums' && <Drum className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-amber-500' : 'text-violet-600'}`} />}
                  {stem.type === 'guitar' && <Guitar className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-orange-600' : 'text-sky-600'}`} />}
                  {stem.type === 'vocal' && <Mic2 className="w-3.5 h-3.5 shrink-0 text-rose-500" />}
                  <span className={`text-[11px] font-semibold truncate ${isDark ? 'text-zinc-200' : 'text-slate-900'}`} title={stem.name}>
                    {stem.name}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={stem.volume}
                    onChange={(e) => handleVolumeChange(stem.id, Number(e.target.value))}
                    className={`w-12 h-1 cursor-pointer ${isDark ? 'accent-orange-500' : 'accent-indigo-600'}`}
                    title={`Volume: ${stem.volume}%`}
                  />

                  <button
                    onClick={() => handleToggleMute(stem.id)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${stem.muted ? 'bg-red-500 text-white' : isDark ? 'bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                  >
                    M
                  </button>
                  <button
                    onClick={() => handleToggleSolo(stem.id)}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${stem.solo
                        ? isDark ? 'bg-amber-400 text-zinc-950 font-extrabold' : 'bg-indigo-600 text-white font-extrabold'
                        : isDark ? 'bg-zinc-800 text-zinc-400 hover:text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                  >
                    S
                  </button>
                  <button
                    onClick={() => handleDeleteStem(stem.id)}
                    title={`Delete ${stem.name} stem track`}
                    className={`p-1 rounded text-zinc-400 hover:text-red-400 hover:bg-red-500/10 cursor-pointer transition`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

                <div
                  onClick={handleSeekPlayhead}
                  className={`flex-1 h-7 rounded-xl px-2 flex items-center justify-between gap-1 relative overflow-hidden cursor-pointer ${isDark ? 'bg-black/50' : 'bg-slate-900/5'
                    }`}
                >
                  {stem.bars.length === 0 ? (
                    <div className="w-full h-full flex items-center justify-center text-[10px] opacity-35 font-mono select-none">
                      Empty Track • Enter prompt or pick a preset to synthesize audio
                    </div>
                  ) : (
                    stem.bars.map((val, idx) => (
                      <span
                        key={idx}
                        style={{ height: `${val}%` }}
                        className={`w-1 rounded-full bg-gradient-to-t ${isDark ? 'from-orange-500 to-amber-300' : 'from-violet-500 via-indigo-500 to-sky-400'
                          }`}
                      />
                    ))
                  )}
                  <div
                    style={{ left: `${playhead}%` }}
                    className="absolute top-0 bottom-0 w-[2px] bg-red-500 pointer-events-none"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  )
}