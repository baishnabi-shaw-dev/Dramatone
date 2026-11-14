import { useState, useEffect, useRef } from 'react'
import { Sparkles, Wand2, Plus, Piano, Drum, Guitar, Mic2, Film, Scissors, Download, Save, Check, Layers, Trash2, ChevronDown, ChevronUp, LocateFixed, GripVertical, RotateCcw, Key, Copy } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { AppRoute } from '@/components/layout/Sidebar'
import { DawPianoRoll } from '@/components/daw/DawPianoRoll'
import { audioEngine, StemId } from '@/services/audioEngine'
import { apiClient } from '@/services/apiClient'
import { soundscapeService } from '@/features/adaptive-soundscape/services/soundscapeService'
import { geminiArrangerService, ArrangedComposition } from '@/services/geminiArrangerService'

export interface StemClip {
  id: string
  name: string
  startPct: number // 0 to 100
  endPct: number // 0 to 100
  bars: number[]
  muted?: boolean
}

export interface StemTrack {
  id: string
  name: string
  type: 'keys' | 'drums' | 'guitar' | 'vocal' | string
  volume: number
  muted: boolean
  solo: boolean
  bars: number[]
  clips?: StemClip[]
  splitPoints?: number[]
}

interface PageProps {
  isDark: boolean
  onToggleTheme: () => void
  onNavigate: (page: AppRoute) => void
}

function formatTimelineTime(percent: number): string {
  const totalSeconds = Math.floor((percent / 100) * 105)
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `0${mins}:${secs < 10 ? `0${secs}` : secs}`
}

function generateStemBars(stemType: string, notes?: Array<{ step: number; stem?: string }>): number[] {
  const count = 48
  return Array.from({ length: count }, (_, i) => {
    const stepIdx = Math.floor((i / count) * 64)
    const hasNote = notes?.some(
      (n) => n.step === stepIdx && (n.stem === stemType || (!n.stem && stemType === 'keys'))
    )
    if (hasNote) return Math.floor(55 + (stepIdx % 4 === 0 ? 30 : 15))
    if (stemType === 'keys') return Math.floor(35 + Math.sin(i / 4) * 15)
    if (stemType === 'drums') return i % 8 === 0 ? 60 : i % 4 === 0 ? 30 : 12
    if (stemType === 'guitar') return i % 4 === 2 ? 45 : 18
    return 18 + Math.floor(Math.cos(i / 5) * 8)
  })
}

export function DashboardPage({ isDark, onToggleTheme, onNavigate }: PageProps) {
  const [promptText, setPromptText] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [playhead, setPlayhead] = useState(0)
  const [stems, setStems] = useState<StemTrack[]>([
    { id: 'keys', name: 'Keys / Harmony', type: 'keys', volume: 80, muted: false, solo: false, bars: generateStemBars('keys') },
    { id: 'drums', name: 'Neural Drums', type: 'drums', volume: 80, muted: false, solo: false, bars: generateStemBars('drums') },
    { id: 'guitar', name: 'Acoustic Pluck', type: 'guitar', volume: 75, muted: false, solo: false, bars: generateStemBars('guitar') },
    { id: 'vocal', name: 'Atmosphere / Texture', type: 'vocal', volume: 70, muted: false, solo: false, bars: generateStemBars('vocal') }
  ])

  const [videoSplits, setVideoSplits] = useState<number[]>([])
  const [splitNotice, setSplitNotice] = useState<string | null>(null)
  const [draggedStemIdx, setDraggedStemIdx] = useState<number | null>(null)
  const [dragOverStemIdx, setDragOverStemIdx] = useState<number | null>(null)

  const [saveStatus, setSaveStatus] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [viewMode, setViewMode] = useState<'stems' | 'piano-roll'>('stems')
  const [isPromptCollapsed, setIsPromptCollapsed] = useState(false)
  const [followSlider, setFollowSlider] = useState(true)

  // Gemini AI Arranger state
  const [aiArrangement, setAiArrangement] = useState<ArrangedComposition | null>(null)
  const [hasGeminiKey, setHasGeminiKey] = useState<boolean>(() => geminiArrangerService.hasApiKey())
  const [geminiError, setGeminiError] = useState<string | null>(null)
  const [showKeyPrompt, setShowKeyPrompt] = useState(false)
  const [tempApiKey, setTempApiKey] = useState('')
  const [copiedPrompt, setCopiedPrompt] = useState(false)
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

  const handleGenerate = async () => {
    setIsGenerating(true)
    audioEngine.ensureContext()

    try {
      const promptToUse = promptText.trim() || 'Cinematic score, emotional, tender'
      let arranged: ArrangedComposition

      try {
        arranged = await geminiArrangerService.arrangeMusic(promptToUse)
        setGeminiError(null)
      } catch (geminiErr: any) {
        console.warn('Gemini arrangement failed, falling back to procedural:', geminiErr)
        const errMsg = geminiErr?.message || 'API Error'
        setGeminiError(errMsg)
        setSplitNotice(`⚠️ ${errMsg} — generated via procedural arranger`)
        setTimeout(() => setSplitNotice(null), 4500)
        arranged = geminiArrangerService.proceduralArranger(promptToUse)
      }

      setAiArrangement(arranged)

      // 1. Direct load into audio engine with synthesized profile
      audioEngine.loadDirectProfile(
        {
          genre: arranged.genre,
          mood: arranged.mood,
          bpm: arranged.bpm,
          key: arranged.key,
          leadInstrument: arranged.leadInstrument,
          hasDrums: arranged.tension > 20,
          hasStrings: arranged.hasStrings,
          hasStaccato: arranged.hasStaccato,
          hasRainFoley: arranged.hasRainFoley,
          hasGradualBuild: arranged.hasGradualBuild,
          hasSubBass: arranged.hasSubBass,
          chords: arranged.chords,
          scale: arranged.scale,
          bassFreqs: arranged.bassFreqs
        },
        arranged.tension
      )
      audioEngine.setActiveNotes(arranged.notes)

      // 2. Dispatch event to populate DAW Piano Roll with 64-step note blocks
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('dramatone_daw_notes', JSON.stringify(arranged.notes))
          window.dispatchEvent(new CustomEvent('dramatone:load-notes', { detail: arranged.notes }))
        } catch {}
      }

      // 3. Update stems view with tailored names and deterministic waveforms
      setStems((prev) =>
        prev.map((s) => ({
          ...s,
          name:
            s.id === 'keys'
              ? arranged.stemNames.keys
              : s.id === 'drums'
              ? arranged.stemNames.drums
              : s.id === 'guitar'
              ? arranged.stemNames.guitar
              : s.id === 'vocal'
              ? arranged.stemNames.vocal
              : s.name,
          bars: generateStemBars(s.type, arranged.notes)
        }))
      )

      // 4. Start audio playback from step 0
      audioEngine.stop()
      audioEngine.seekStep(0)
      audioEngine.start()
      setPlayhead(0)

      if (!geminiError) {
        setSplitNotice(
          arranged.isMock
            ? `🤖 Procedural Score: "${arranged.title}" (${arranged.bpm} BPM • ${arranged.key})`
            : `⚡ Gemini 1.5 Score: "${arranged.title}" (${arranged.bpm} BPM • ${arranged.key})`
        )
        setTimeout(() => setSplitNotice(null), 3500)
      }
    } catch (err: any) {
      console.error('Error during AI generation:', err)
      setSplitNotice(`❌ ${err?.message || 'Generation failed'}`)
      setTimeout(() => setSplitNotice(null), 4000)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveApiKey = () => {
    if (!tempApiKey.trim()) return
    geminiArrangerService.setApiKey(tempApiKey.trim())
    setHasGeminiKey(true)
    setGeminiError(null)
    setShowKeyPrompt(false)
    setTempApiKey('')
    setSplitNotice('🔑 Gemini API Key saved to session!')
    setTimeout(() => setSplitNotice(null), 2500)
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
    const newBars = generateStemBars(type, audioEngine.getActiveNotes())
    const points = [0, ...videoSplits, 100]
    const clips: StemClip[] | undefined = videoSplits.length > 0 ? points.slice(0, -1).map((sPct, i) => {
      const ePct = points[i + 1]
      const startIdx = Math.floor((sPct / 100) * newBars.length)
      const endIdx = Math.min(newBars.length, Math.ceil((ePct / 100) * newBars.length))
      return {
        id: `custom-clip-${i}-${Date.now()}`,
        name: `Take ${String.fromCharCode(65 + i)}`,
        startPct: sPct,
        endPct: ePct,
        bars: newBars.slice(startIdx, endIdx),
        muted: false
      }
    }) : undefined

    setStems((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}-${type}`,
        name: `${labelPrefix} 0${prev.filter((s) => s.type === type).length + 1}`,
        type,
        volume: 75,
        muted: false,
        solo: false,
        bars: newBars,
        splitPoints: [...videoSplits],
        clips
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
    if (playhead <= 1 || playhead >= 99) {
      setSplitNotice('⚠️ Position playhead between 00:01 and 01:44 to split')
      setTimeout(() => setSplitNotice(null), 2500)
      return
    }

    const cutPct = Math.round(playhead * 10) / 10

    setStems((prev) =>
      prev.map((stem) => {
        const currentSplits = stem.splitPoints || []
        if (currentSplits.some((sp) => Math.abs(sp - cutPct) < 1.5)) {
          return stem
        }

        const newSplits = [...currentSplits, cutPct].sort((a, b) => a - b)
        const fullBars = stem.bars.length > 0 ? stem.bars : generateStemBars(stem.type, audioEngine.getActiveNotes())
        const points = [0, ...newSplits, 100]

        const clips: StemClip[] = []
        for (let i = 0; i < points.length - 1; i++) {
          const sPct = points[i]
          const ePct = points[i + 1]
          const startIdx = Math.floor((sPct / 100) * fullBars.length)
          const endIdx = Math.min(fullBars.length, Math.ceil((ePct / 100) * fullBars.length))
          const clipBars = fullBars.slice(startIdx, endIdx)

          clips.push({
            id: `${stem.id}-clip-${i}-${Math.round(sPct)}`,
            name: `Take ${String.fromCharCode(65 + (i % 26))}`,
            startPct: sPct,
            endPct: ePct,
            bars: clipBars.length > 0 ? clipBars : [40, 50, 40],
            muted: false
          })
        }

        return {
          ...stem,
          bars: fullBars,
          splitPoints: newSplits,
          clips
        }
      })
    )

    setVideoSplits((prev) => {
      if (prev.some((sp) => Math.abs(sp - cutPct) < 1.5)) return prev
      return [...prev, cutPct].sort((a, b) => a - b)
    })

    setSplitNotice(`✂️ Sliced timeline at ${formatTimelineTime(cutPct)} (${Math.round(cutPct)}%)`)
    setTimeout(() => setSplitNotice(null), 3000)
  }

  const handleClearSplits = () => {
    setStems((prev) => prev.map((s) => ({ ...s, splitPoints: [], clips: undefined })))
    setVideoSplits([])
    setSplitNotice('🔄 Merged all split clips back into continuous stems')
    setTimeout(() => setSplitNotice(null), 2500)
  }

  const handleToggleClipMute = (stemId: string, clipId: string) => {
    setStems((prev) =>
      prev.map((s) => {
        if (s.id !== stemId || !s.clips) return s
        const nextClips = s.clips.map((c) => (c.id === clipId ? { ...c, muted: !c.muted } : c))
        return { ...s, clips: nextClips }
      })
    )
  }

  // Drag and drop reordering handlers
  const handleStemDragStart = (e: React.DragEvent, index: number) => {
    setDraggedStemIdx(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
  }

  const handleStemDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverStemIdx !== index) {
      setDragOverStemIdx(index)
    }
  }

  const handleStemDragEnd = () => {
    setDraggedStemIdx(null)
    setDragOverStemIdx(null)
  }

  const handleStemDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedStemIdx === null || draggedStemIdx === dropIndex) {
      setDraggedStemIdx(null)
      setDragOverStemIdx(null)
      return
    }
    setStems((prev) => {
      const updated = [...prev]
      const [moved] = updated.splice(draggedStemIdx, 1)
      updated.splice(dropIndex, 0, moved)
      return updated
    })
    const movedName = stems[draggedStemIdx]?.name || 'Stem'
    setDraggedStemIdx(null)
    setDragOverStemIdx(null)
    setSplitNotice(`↕️ Reordered ${movedName}`)
    setTimeout(() => setSplitNotice(null), 2000)
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
            {geminiError ? (
              <button
                onClick={() => setShowKeyPrompt(!showKeyPrompt)}
                title={`Gemini API Error: ${geminiError}. Click to view/update API Key.`}
                className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-rose-500/40 bg-rose-500/10 text-rose-400 flex items-center gap-1 cursor-pointer hover:bg-rose-500/20 transition"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <span>Gemini Key Error</span>
              </button>
            ) : hasGeminiKey ? (
              <button
                onClick={() => setShowKeyPrompt(!showKeyPrompt)}
                title="Google Gemini API Active. Click to view/update API Key."
                className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 flex items-center gap-1 cursor-pointer hover:bg-emerald-500/20 transition"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Gemini Online</span>
              </button>
            ) : (
              <button
                onClick={() => setShowKeyPrompt(!showKeyPrompt)}
                title="Running in Procedural Mock Mode. Click to add your Gemini API Key."
                className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-400 flex items-center gap-1 cursor-pointer hover:bg-amber-500/20 transition"
              >
                <Key className="w-2.5 h-2.5" />
                <span>Gemini Mock Mode (Add Key)</span>
              </button>
            )}

            <button onClick={() => onNavigate('soundscape')} className={`text-[11px] hover:underline cursor-pointer ${accentText}`}>
              Adaptive Score
            </button>
            <span className="opacity-30">|</span>
            <button onClick={() => onNavigate('generator')} className={`text-[11px] hover:underline cursor-pointer ${accentText}`}>
              Full Generator &rarr;
            </button>
          </div>
        </div>

        {showKeyPrompt && (
          <div className={`p-2.5 rounded-2xl border flex flex-col sm:flex-row items-center gap-2 ${isDark ? 'bg-zinc-900 border-amber-500/30' : 'bg-amber-50 border-amber-300'}`}>
            <div className="flex items-center gap-1.5 flex-1 w-full">
              <Key className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <input
                type="password"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                placeholder="Paste Gemini API Key (e.g. AIzaSy...) or set GEMINI_API_KEY in backend/.env"
                className={`w-full text-xs px-2 py-1 rounded-lg border focus:outline-none font-mono ${isDark ? 'bg-black/60 border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900'}`}
              />
            </div>
            <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto justify-end">
              <button
                onClick={handleSaveApiKey}
                className="px-3 py-1 rounded-lg bg-amber-500 text-black text-xs font-bold hover:bg-amber-400 cursor-pointer transition"
              >
                Save Key
              </button>
              <button
                onClick={() => setShowKeyPrompt(false)}
                className="px-2 py-1 rounded-lg text-xs opacity-60 hover:opacity-100 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {!isPromptCollapsed && (
          <>
            <textarea
              rows={2}
              value={promptText}
              placeholder="Describe your desired soundscape (e.g. 'the main character is feeling shy', 'brass fanfare', 'cinematic score')..."
              onChange={(e) => setPromptText(e.target.value)}
              className={`w-full rounded-2xl border p-2.5 text-xs resize-none focus:outline-none ${isDark ? 'bg-zinc-950/70 border-white/10 text-zinc-100 placeholder:text-zinc-600' : 'bg-white/80 border-white text-slate-900 placeholder:text-slate-400'
                }`}
            />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
                {['Character Feeling Shy', 'Trumpet Fanfare', 'Cinematic Riser', 'Lo-Fi Beat', 'Ambient Pad', 'Action Pulse'].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      if (preset === 'Character Feeling Shy') {
                        setPromptText('The main character is feeling shy and hesitating to speak, looking down nervously')
                      } else {
                        handleSelectPreset(preset)
                      }
                    }}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-medium border cursor-pointer transition ${
                      preset === 'Character Feeling Shy'
                        ? isDark ? 'border-amber-400/50 bg-amber-400/10 text-amber-300 font-semibold' : 'border-indigo-400 bg-indigo-50 text-indigo-700 font-semibold'
                        : isDark
                        ? 'border-white/10 bg-white/5 text-zinc-300 hover:border-orange-500/40'
                        : 'border-white bg-white/80 text-slate-700 hover:border-indigo-400'
                    }`}
                  >
                    {preset === 'Character Feeling Shy' ? '✨ ' + preset : preset}
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
                <span>{isGenerating ? 'Arranging AI Score...' : 'Generate Stems'}</span>
              </button>
            </div>

            {aiArrangement && (
              <div className={`p-2.5 rounded-2xl border text-xs flex flex-col gap-1.5 transition-all ${
                isDark ? 'bg-orange-500/5 border-orange-500/20 text-zinc-300' : 'bg-indigo-50/80 border-indigo-200 text-slate-800'
              }`}>
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-orange-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {aiArrangement.title}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 opacity-75">
                      {aiArrangement.key} • {aiArrangement.bpm} BPM • {aiArrangement.mood}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono opacity-60">
                    {aiArrangement.isAiGenerated ? '⚡ Gemini 1.5 Flash' : '🤖 Procedural Arranger'}
                  </span>
                </div>

                <div className="text-[11px] font-serif italic opacity-90 pl-1 border-l-2 border-orange-500/40">
                  "{aiArrangement.explanation}"
                </div>

                {/* Diffusion Acoustic Brief */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
                  <div className="text-[10px] font-mono truncate text-zinc-400 flex-1">
                    <span className="font-semibold text-orange-300">MusicGen Prompt: </span>
                    {aiArrangement.diffusionPrompt}
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(aiArrangement.diffusionPrompt)
                      setCopiedPrompt(true)
                      setTimeout(() => setCopiedPrompt(false), 2000)
                    }}
                    title="Copy acoustic prompt for MusicGen / Stable Audio"
                    className={`px-2 py-0.5 rounded text-[10px] font-mono border cursor-pointer shrink-0 flex items-center gap-1 transition ${
                      copiedPrompt
                        ? 'bg-emerald-500 text-black border-emerald-400 font-bold'
                        : isDark ? 'border-white/10 bg-white/5 text-zinc-300 hover:text-white' : 'border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <Copy className="w-2.5 h-2.5" />
                    {copiedPrompt ? 'Copied!' : 'Copy Brief'}
                  </button>
                </div>
              </div>
            )}
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
              title={`Split clips at current playhead (${formatTimelineTime(playhead)})`}
              className={`px-2.5 py-1 rounded-lg border text-[10px] font-medium flex items-center gap-1 cursor-pointer transition ${
                isDark ? 'border-orange-500/40 bg-orange-500/15 text-orange-300 hover:bg-orange-500/25' : 'border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
              }`}
            >
              <Scissors className="w-3 h-3 text-orange-400" />
              <span>Split at Playhead ({formatTimelineTime(playhead)})</span>
            </button>

            {videoSplits.length > 0 && (
              <button
                onClick={handleClearSplits}
                title="Merge all sliced clips back into continuous stems"
                className={`px-2 py-1 rounded-lg border text-[10px] font-medium flex items-center gap-1 cursor-pointer transition ${
                  isDark ? 'border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20' : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                }`}
              >
                <RotateCcw className="w-3 h-3" />
                <span>Merge Cuts ({videoSplits.length})</span>
              </button>
            )}

            {splitNotice && (
              <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30 animate-pulse">
                {splitNotice}
              </span>
            )}

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
              {/* Scene Cut Markers */}
              {videoSplits.map((sp) => (
                <div
                  key={sp}
                  style={{ left: `${sp}%` }}
                  title={`Cut Marker at ${formatTimelineTime(sp)}`}
                  className="absolute top-0 bottom-0 w-[2px] bg-amber-400 z-10 flex flex-col items-center pointer-events-none"
                >
                  <span className="text-[8px] bg-amber-500 text-black font-extrabold px-1 rounded-b shadow -translate-x-1/2">
                    ✂
                  </span>
                </div>
              ))}
              <div
                style={{ left: `${playhead}%` }}
                className="absolute top-0 bottom-0 w-[2px] bg-red-500 pointer-events-none"
              />
            </div>
          </div>

          {/* Audio Stem Lanes */}
          {stems.map((stem, idx) => (
            <div
              key={stem.id}
              draggable
              onDragStart={(e) => handleStemDragStart(e, idx)}
              onDragOver={(e) => handleStemDragOver(e, idx)}
              onDragLeave={handleStemDragEnd}
              onDrop={(e) => handleStemDrop(e, idx)}
              onDragEnd={handleStemDragEnd}
              className={`p-2 rounded-2xl border flex items-center gap-3 transition-all duration-150 ${stem.muted ? 'opacity-45' : 'opacity-100'} ${
                draggedStemIdx === idx ? 'opacity-40 scale-[0.99] border-dashed border-orange-500' : ''
              } ${
                dragOverStemIdx === idx && draggedStemIdx !== idx
                  ? isDark ? 'ring-2 ring-orange-500/70 bg-orange-500/10' : 'ring-2 ring-indigo-500/70 bg-indigo-50'
                  : ''
              } ${isDark ? 'border-white/10 bg-zinc-950/60' : 'border-white/80 bg-white/75'}`}
            >
              <div className="w-48 sm:w-60 shrink-0 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <div
                    title="Drag handle: click and drag to reorder stems"
                    className="cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-white/10"
                  >
                    <GripVertical className="w-3.5 h-3.5 text-zinc-500 hover:text-orange-400 shrink-0" />
                  </div>
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
                className={`flex-1 h-7 rounded-xl px-1.5 flex items-center relative overflow-hidden cursor-pointer ${isDark ? 'bg-black/50' : 'bg-slate-900/5'
                  }`}
              >
                {stem.clips && stem.clips.length > 0 ? (
                  <div className="w-full h-full flex items-center relative">
                    {stem.clips.map((clip) => (
                      <div
                        key={clip.id}
                        style={{ width: `${clip.endPct - clip.startPct}%` }}
                        className={`h-full relative flex items-center px-1 border-r border-orange-500/50 transition-all ${
                          clip.muted ? 'opacity-35 bg-red-950/20' : 'hover:bg-white/5'
                        }`}
                        title={`${clip.name} (${formatTimelineTime(clip.startPct)} - ${formatTimelineTime(clip.endPct)})${clip.muted ? ' • Muted' : ''}`}
                      >
                        <div className="absolute top-0.5 left-1 z-10 flex items-center gap-1 select-none pointer-events-auto">
                          <span
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleClipMute(stem.id, clip.id)
                            }}
                            className={`text-[8px] px-1 py-0.2 rounded font-mono font-bold cursor-pointer transition ${
                              clip.muted
                                ? 'bg-red-500/80 text-white line-through'
                                : isDark
                                ? 'bg-orange-500/30 text-orange-200 hover:bg-orange-500/50'
                                : 'bg-indigo-600/20 text-indigo-900 hover:bg-indigo-600/40'
                            }`}
                          >
                            {clip.name} {clip.muted ? '(M)' : ''}
                          </span>
                        </div>

                        <div className="w-full h-full flex items-center justify-between gap-[1px] pt-2">
                          {clip.bars.map((val, bIdx) => (
                            <span
                              key={bIdx}
                              style={{ height: `${val}%` }}
                              className={`w-0.5 sm:w-1 rounded-full ${
                                clip.muted
                                  ? 'bg-zinc-600'
                                  : isDark
                                  ? 'bg-gradient-to-t from-orange-500 to-amber-300'
                                  : 'bg-gradient-to-t from-violet-500 via-indigo-500 to-sky-400'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : stem.bars.length === 0 ? (
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

                {stem.splitPoints?.map((sp) => (
                  <div
                    key={sp}
                    style={{ left: `${sp}%` }}
                    className="absolute top-0 bottom-0 w-[1px] bg-orange-400/80 pointer-events-none z-10"
                  />
                ))}

                <div
                  style={{ left: `${playhead}%` }}
                  className="absolute top-0 bottom-0 w-[2px] bg-red-500 pointer-events-none z-20"
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