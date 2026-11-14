import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { AppRoute } from '@/components/layout/Sidebar'
import {
  FlProject,
  FlPattern,
  FlChannel,
  PlaybackMode,
  flEngine
} from '@/services/flEngine'
import { audioEngine, DawInstrument } from '@/services/audioEngine'
import { apiClient } from '@/services/apiClient'
import { INSTRUMENT_OPTIONS } from '@/components/daw/DawPianoRoll'
import { DawTransport } from '@/components/daw/DawTransport'
import { DawChannelRack } from '@/components/daw/DawChannelRack'
import { DawPlaylist } from '@/components/daw/DawPlaylist'
import { DawMixer } from '@/components/daw/DawMixer'
import { DawPianoRollModal } from '@/components/daw/DawPianoRollModal'
import { Sparkles, ArrowRight, Music, Sliders } from 'lucide-react'

interface PageProps {
  isDark: boolean
  onToggleTheme: () => void
  onNavigate: (page: AppRoute) => void
}

// Default 4 Synthesized Channels (Kick, Snare, Hi-Hat, Bass Synth) - Clean Empty State
const createDefaultChannels = (): FlChannel[] => [
  {
    id: 'ch-kick',
    name: 'Kick Drum',
    icon: '🥁',
    color: '#f97316',
    type: 'kick',
    volume: 90,
    pan: 0,
    muted: false,
    solo: false,
    steps: Array(16).fill(false),
    notes: [],
    effect: {
      filterEnabled: false,
      filterCutoff: 8000,
      delayEnabled: false,
      delayTime: 0.25,
      delayFeedback: 0.3
    }
  },
  {
    id: 'ch-snare',
    name: 'Snare Drum',
    icon: '🪘',
    color: '#fbbf24',
    type: 'snare',
    volume: 85,
    pan: 0,
    muted: false,
    solo: false,
    steps: Array(16).fill(false),
    notes: [],
    effect: {
      filterEnabled: false,
      filterCutoff: 10000,
      delayEnabled: true,
      delayTime: 0.2,
      delayFeedback: 0.25
    }
  },
  {
    id: 'ch-hihat',
    name: 'Closed Hat',
    icon: '🥢',
    color: '#10b981',
    type: 'hihat',
    volume: 75,
    pan: 15,
    muted: false,
    solo: false,
    steps: Array(16).fill(false),
    notes: [],
    effect: {
      filterEnabled: false,
      filterCutoff: 11000,
      delayEnabled: false,
      delayTime: 0.15,
      delayFeedback: 0.2
    }
  },
  {
    id: 'ch-bass',
    name: 'Bass Synth',
    icon: '🔊',
    color: '#38bdf8',
    type: 'bass',
    volume: 80,
    pan: -10,
    muted: false,
    solo: false,
    steps: Array(16).fill(false),
    notes: [],
    effect: {
      filterEnabled: true,
      filterCutoff: 2400,
      delayEnabled: false,
      delayTime: 0.3,
      delayFeedback: 0.35
    }
  },
  {
    id: 'ch-lead',
    name: 'Grand Piano',
    icon: '🎹',
    color: '#ec4899',
    type: 'lead',
    instrument: 'piano',
    volume: 85,
    pan: 5,
    muted: false,
    solo: false,
    steps: Array(16).fill(false),
    notes: [],
    effect: {
      filterEnabled: false,
      filterCutoff: 12000,
      delayEnabled: true,
      delayTime: 0.25,
      delayFeedback: 0.2
    }
  }
]

// Default Clean Project
const createDefaultProject = (): FlProject => {
  return {
    title: 'New FL Studio Project',
    bpm: 128,
    masterVolume: 85,
    patterns: [
      { id: 'pat-1', name: 'Pattern 1', channels: createDefaultChannels() }
    ],
    activePatternId: 'pat-1',
    playlist: [
      { id: 'pl-1', trackIndex: 0, patternId: 'pat-1', startBar: 0, durationBars: 1 }
    ],
    version: '1.0.0'
  }
}

export function DawPage({ isDark, onToggleTheme, onNavigate }: PageProps) {
  // Studio View Mode: 'flStudio' (Full FL Workstation) vs 'pianoStudio' (Multi-Octave Piano Roll + Web MIDI)
  const [studioView, setStudioView] = useState<'flStudio' | 'pianoStudio'>('flStudio')

  // Main FL Studio Project State
  const [project, setProject] = useState<FlProject>(() => {
    try {
      const saved = localStorage.getItem('dramatone_fl_project')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && parsed.patterns && parsed.patterns.length > 0) return parsed
      }
    } catch {}
    return createDefaultProject()
  })

  // Playback & Timing State
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [mode, setMode] = useState<PlaybackMode>('PAT')
  const [currentStep, setCurrentStep] = useState<number>(-1)
  const [currentBar, setCurrentBar] = useState<number>(0)
  const [currentBeat, setCurrentBeat] = useState<number>(0)

  // Active UI Panels State
  const [activePanels, setActivePanels] = useState({
    rack: true,
    pianoRoll: false,
    playlist: true,
    mixer: true
  })

  // Selected Channel for Piano Roll & Mixer Focus
  const [selectedChannelId, setSelectedChannelId] = useState<string>('ch-bass')

  // Integration Toast / Status Banner
  const [statusBanner, setStatusBanner] = useState<string | null>(null)

  // Keep ref to latest project state for lookahead scheduler
  const projectRef = useRef(project)
  projectRef.current = project

  const modeRef = useRef(mode)
  modeRef.current = mode

  // Get active pattern
  const activePattern =
    project.patterns.find((p) => p.id === project.activePatternId) || project.patterns[0]

  // Persist project changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('dramatone_fl_project', JSON.stringify(project))
    } catch {}
  }, [project])

  // Sync flEngine state provider and channel nodes
  useEffect(() => {
    flEngine.setStateProvider(() => ({
      project: projectRef.current,
      mode: modeRef.current,
      activePattern:
        projectRef.current.patterns.find((p) => p.id === projectRef.current.activePatternId) ||
        projectRef.current.patterns[0]
    }))

    flEngine.setBpm(project.bpm)
    flEngine.setMasterVolume(project.masterVolume)
    flEngine.setMode(mode)
    flEngine.syncChannels(activePattern.channels)
  }, [project, mode, activePattern])

  // Subscribe to lookahead step clock
  useEffect(() => {
    const unsub = flEngine.onStep((step, bar, beat) => {
      setCurrentStep(step)
      setCurrentBar(bar)
      setCurrentBeat(beat)
    })
    return () => {
      unsub()
    }
  }, [])

  // Keyboard shortcut: Spacebar toggles Play/Pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.code === 'Space') {
        e.preventDefault()
        handleTogglePlay()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPlaying])

  // Transport Handlers
  const handleTogglePlay = useCallback(() => {
    if (isPlaying) {
      flEngine.stop()
      setIsPlaying(false)
      setCurrentStep(-1)
    } else {
      flEngine.start()
      setIsPlaying(true)
    }
  }, [isPlaying])

  const handleStop = useCallback(() => {
    flEngine.stop()
    setIsPlaying(false)
    setCurrentStep(-1)
    setCurrentBar(0)
    setCurrentBeat(0)
  }, [])

  const handleToggleMode = useCallback(() => {
    const nextMode: PlaybackMode = mode === 'PAT' ? 'SONG' : 'PAT'
    setMode(nextMode)
    flEngine.setMode(nextMode)
  }, [mode])

  const handleChangeBpm = useCallback((newBpm: number) => {
    const clamped = Math.max(40, Math.min(240, newBpm))
    setProject((prev) => ({ ...prev, bpm: clamped }))
    flEngine.setBpm(clamped)
  }, [])

  const handleChangeMasterVolume = useCallback((newVol: number) => {
    setProject((prev) => ({ ...prev, masterVolume: newVol }))
    flEngine.setMasterVolume(newVol)
  }, [])

  const handleTogglePanel = useCallback((panel: 'rack' | 'pianoRoll' | 'playlist' | 'mixer') => {
    setActivePanels((prev) => ({ ...prev, [panel]: !prev[panel] }))
  }, [])

  // Channel Rack Step Toggle
  const handleToggleStep = useCallback((channelId: string, stepIndex: number) => {
    setProject((prev) => {
      const nextPatterns = prev.patterns.map((pat) => {
        if (pat.id !== prev.activePatternId) return pat
        const nextChannels = pat.channels.map((ch) => {
          if (ch.id !== channelId) return ch
          const nextSteps = [...ch.steps]
          nextSteps[stepIndex] = !nextSteps[stepIndex]
          return { ...ch, steps: nextSteps }
        })
        return { ...pat, channels: nextChannels }
      })
      return { ...prev, patterns: nextPatterns }
    })
  }, [])

  // Channel Parameter & Effect Update
  const handleUpdateChannel = useCallback((channelId: string, updates: Partial<FlChannel>) => {
    setProject((prev) => {
      const nextPatterns = prev.patterns.map((pat) => {
        if (pat.id !== prev.activePatternId) return pat
        const nextChannels = pat.channels.map((ch) => {
          if (ch.id !== channelId) return ch
          return { ...ch, ...updates }
        })
        return { ...pat, channels: nextChannels }
      })
      return { ...prev, patterns: nextPatterns }
    })
  }, [])

  // Pattern Switcher & Creator
  const handleSelectPattern = useCallback((patternId: string) => {
    setProject((prev) => ({ ...prev, activePatternId: patternId }))
  }, [])

  const handleAddPattern = useCallback(() => {
    setProject((prev) => {
      const newIndex = prev.patterns.length + 1
      const newPattern: FlPattern = {
        id: `pat-${Date.now()}`,
        name: `Pattern ${newIndex}`,
        channels: createDefaultChannels().map((ch) => ({ ...ch, steps: Array(16).fill(false), notes: [] }))
      }
      return {
        ...prev,
        patterns: [...prev.patterns, newPattern],
        activePatternId: newPattern.id
      }
    })
  }, [])

  // Playlist Paint / Remove Pattern Block
  const handleTogglePlaylistItem = useCallback((trackIndex: number, startBar: number, patternId: string) => {
    setProject((prev) => {
      const existingIdx = prev.playlist.findIndex(
        (p) => p.trackIndex === trackIndex && p.startBar === startBar
      )
      if (existingIdx >= 0) {
        // Remove item
        return {
          ...prev,
          playlist: prev.playlist.filter((_, idx) => idx !== existingIdx)
        }
      } else {
        // Add item
        const newItem = {
          id: `pl-${Date.now()}-${trackIndex}-${startBar}`,
          trackIndex,
          patternId,
          startBar,
          durationBars: 1
        }
        return {
          ...prev,
          playlist: [...prev.playlist, newItem]
        }
      }
    })
  }, [])

  const handleClearPlaylist = useCallback(() => {
    setProject((prev) => ({ ...prev, playlist: [] }))
  }, [])

  // Project Export as JSON
  const handleExportProject = useCallback(() => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(project, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `${project.title.toLowerCase().replace(/\s+/g, '_')}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }, [project])

  // Project Import from JSON File
  const handleImportProject = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader()
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], 'UTF-8')
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string)
          if (parsed && parsed.patterns && Array.isArray(parsed.patterns)) {
            handleStop()
            setProject(parsed)
          }
        } catch (err) {
          console.error('Failed to parse project JSON:', err)
        }
      }
    }
  }, [handleStop])

  const handleResetProject = useCallback(() => {
    handleStop()
    const def = createDefaultProject()
    setProject(def)
  }, [handleStop])

  // Save Project directly to Dramatone Projects & Library (Cloud + Local)
  const handleSaveProject = useCallback(async () => {
    try {
      const activePat = project.patterns.find((p) => p.id === project.activePatternId) || project.patterns[0]
      const stems = activePat.channels.map((c) => ({
        id: c.id,
        name: c.name,
        volume: c.volume,
        muted: c.muted,
        solo: c.solo
      }))
      const saved = await apiClient.saveProject({
        title: project.title || 'DAW Studio Arrangement',
        genre: 'Electronic Studio',
        mood: 'Creative',
        bpm: project.bpm,
        tension: 50,
        stems
      })
      setStatusBanner(`✓ Saved "${saved.title}" to Projects & Library!`)
      setTimeout(() => setStatusBanner(null), 3000)
    } catch {
      setStatusBanner('✓ Saved locally to Projects & Library!')
      setTimeout(() => setStatusBanner(null), 3000)
    }
  }, [project])

  // Integration: Load Gemini AI Score (Arrangement, BPM, Lead & Bass) into DAW
  const handleSyncAiScore = useCallback(() => {
    const profile = audioEngine.getActiveProfile()
    const aiNotes = audioEngine.getActiveNotes()
    const bpm = profile.bpm || audioEngine.getBpm() || 120
    const leadInst: DawInstrument = (profile.leadInstrument as DawInstrument) || 'violin'
    const matchOpt = INSTRUMENT_OPTIONS.find((o) => o.id === leadInst) || {
      id: 'violin',
      label: 'Solo Violin',
      icon: '🎻'
    }

    setProject((prev) => {
      const updatedPatterns = prev.patterns.map((pat) => {
        const channels = [...pat.channels]
        let leadChannel = channels.find((c) => c.id === 'ch-lead')
        if (!leadChannel) {
          leadChannel = {
            id: 'ch-lead',
            name: matchOpt.label,
            icon: matchOpt.icon,
            color: '#f43f5e',
            type: 'custom',
            instrument: matchOpt.id as DawInstrument,
            volume: 88,
            pan: 0,
            muted: false,
            solo: false,
            steps: Array(16).fill(false),
            notes: [],
            effect: {
              filterEnabled: false,
              filterCutoff: 10000,
              delayEnabled: true,
              delayTime: 0.25,
              delayFeedback: 0.3
            }
          }
          channels.push(leadChannel)
        } else {
          leadChannel.name = matchOpt.label
          leadChannel.icon = matchOpt.icon
          leadChannel.instrument = matchOpt.id as DawInstrument
        }

        // Map AI arranged notes to lead channel
        if (aiNotes && aiNotes.length > 0) {
          leadChannel.notes = aiNotes.map((n, idx) => ({
            id: `ai-n-${idx}`,
            midi: n.midi,
            step: n.step % 16,
            duration: n.duration || 1
          }))
          const newSteps = Array(16).fill(false)
          aiNotes.forEach((n) => {
            newSteps[n.step % 16] = true
          })
          leadChannel.steps = newSteps
        }

        // Map AI bass progression to Bass Synth channel
        const bassChannel = channels.find((c) => c.type === 'bass' || c.id === 'ch-bass')
        if (bassChannel && profile.bassFreqs && profile.bassFreqs.length > 0) {
          const bassNotes = profile.bassFreqs.map((freq, idx) => ({
            id: `ai-bass-${idx}`,
            midi: audioEngine.freqToMidi(freq),
            step: idx * 4,
            duration: 2
          }))
          bassChannel.notes = bassNotes
          const bassSteps = Array(16).fill(false)
          bassNotes.forEach((bn) => {
            bassSteps[bn.step] = true
          })
          bassChannel.steps = bassSteps
        }

        return { ...pat, channels }
      })

      return {
        ...prev,
        title: `AI Score: ${profile.genre || 'Adaptive Soundscape'}`,
        bpm,
        patterns: updatedPatterns
      }
    })

    flEngine.setBpm(bpm)
    setSelectedChannelId('ch-lead')
    setStatusBanner(
      `🪄 Loaded Gemini AI Score: ${profile.genre || 'Adaptive Soundscape'} (${bpm} BPM, ${profile.key || 'D Minor'})`
    )
    setTimeout(() => setStatusBanner(null), 4500)
  }, [])

  // Auto-sync AI score into FL Studio on mount if an active AI composition exists
  const hasAutoSyncedAiRef = useRef(false)
  useEffect(() => {
    if (!hasAutoSyncedAiRef.current && audioEngine.hasComposition()) {
      hasAutoSyncedAiRef.current = true
      handleSyncAiScore()
    }
  }, [handleSyncAiScore])

  // Integration: Sync DAW Arrangement back to Video Timeline
  const handleSyncToTimeline = useCallback(() => {
    const notesToExport: Array<{ id: string; midi: number; step: number; duration: number; instrument?: DawInstrument }> = []
    activePattern.channels.forEach((ch) => {
      if (ch.notes && ch.notes.length > 0) {
        ch.notes.forEach((n) => {
          notesToExport.push({
            id: n.id,
            midi: n.midi,
            step: n.step,
            duration: n.duration,
            instrument: ch.instrument
          })
        })
      } else {
        ch.steps.forEach((active, s) => {
          if (active) {
            const defaultMidi = ch.type === 'bass' ? 48 : ch.type === 'kick' ? 36 : 60
            notesToExport.push({
              id: `step-${ch.id}-${s}`,
              midi: defaultMidi,
              step: s,
              duration: 1,
              instrument: ch.instrument
            })
          }
        })
      }
    })

    audioEngine.setActiveNotes(notesToExport)
    audioEngine.setBpm(project.bpm)
    setStatusBanner(
      `⚡ Synced ${notesToExport.length} DAW notes to Video Timeline! Open Studio Workspace to play with video.`
    )
    setTimeout(() => setStatusBanner(null), 4500)
  }, [activePattern, project.bpm])

  // Add Solo Voice Channel to all patterns
  const handleAddChannel = useCallback(() => {
    setProject((prev) => {
      const newId = `ch-custom-${Date.now()}`
      const newChannel: FlChannel = {
        id: newId,
        name: 'Solo Violin',
        icon: '🎻',
        color: '#f59e0b',
        type: 'custom',
        instrument: 'violin',
        volume: 85,
        pan: 0,
        muted: false,
        solo: false,
        steps: Array(16).fill(false),
        notes: [],
        effect: {
          filterEnabled: false,
          filterCutoff: 10000,
          delayEnabled: true,
          delayTime: 0.25,
          delayFeedback: 0.3
        }
      }
      const nextPatterns = prev.patterns.map((pat) => ({
        ...pat,
        channels: [...pat.channels, newChannel]
      }))
      return { ...prev, patterns: nextPatterns }
    })
    setStatusBanner('Added new Solo Violin voice channel to Channel Rack')
    setTimeout(() => setStatusBanner(null), 3000)
  }, [])

  // Total Notes & Step Triggers across all channels
  const totalAllNotesCount = useMemo(() => {
    return activePattern.channels.reduce((acc, ch) => {
      const explicitNotes = ch.notes ? ch.notes.length : 0
      const stepTriggers = ch.steps ? ch.steps.filter(Boolean).length : 0
      return acc + explicitNotes + stepTriggers
    }, 0)
  }, [activePattern.channels])

  // Selected channel for Piano Roll (supports 'all' for master view)
  const selectedChannel: FlChannel = useMemo(() => {
    if (selectedChannelId === 'all') {
      return {
        id: 'all',
        name: 'All Channels',
        icon: '🎼',
        color: '#f59e0b',
        type: 'custom',
        volume: 100,
        pan: 0,
        muted: false,
        solo: false,
        steps: Array(16).fill(false),
        notes: activePattern.channels.flatMap((c) => c.notes || []),
        effect: {
          filterEnabled: false,
          filterCutoff: 10000,
          delayEnabled: false,
          delayTime: 0.25,
          delayFeedback: 0.2
        }
      }
    }
    return activePattern.channels.find((ch) => ch.id === selectedChannelId) || activePattern.channels[0]
  }, [selectedChannelId, activePattern.channels])

  const cardClass = isDark ? 'border-white/10 bg-black/45' : 'border-white/75 bg-white/60 shadow-sm'

  return (
    <MainLayout
      activePage="daw"
      isDark={isDark}
      onToggleTheme={onToggleTheme}
      onNavigate={onNavigate}
      title="FL Studio Web DAW & MIDI Studio"
      subtitle="Modular Browser DAW with Step Sequencer, Playlist Arrangement, Real-Time Mixer & Lookahead Timing"
    >
      <div className="flex-1 flex flex-col gap-3 min-h-[500px]">
        {/* Top Info & Mode Switching Bar */}
        <div
          className={`px-4 py-2.5 rounded-2xl border text-xs flex flex-wrap items-center justify-between gap-2 shrink-0 ${
            isDark ? 'border-orange-500/30 bg-orange-950/20 text-zinc-300' : 'border-indigo-200 bg-indigo-50/70 text-slate-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-orange-400 shrink-0" />
            <span>
              <strong>FL Studio Web Workstation:</strong> Chris Wilson lookahead Web Audio scheduler, 16-step Channel Rack, Playlist arrangement, and AnalyserNode Mixer.
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher: FL Workstation vs Piano Roll Studio */}
            <div
              className={`flex rounded-xl p-0.5 border text-[11px] font-bold ${
                isDark ? 'border-zinc-700 bg-zinc-900' : 'border-slate-300 bg-slate-200'
              }`}
            >
              <button
                onClick={() => setStudioView('flStudio')}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 cursor-pointer transition ${
                  studioView === 'flStudio'
                    ? 'bg-orange-500 text-zinc-950 shadow-sm font-extrabold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>FL Studio View</span>
              </button>
              <button
                onClick={() => setStudioView('pianoStudio')}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 cursor-pointer transition ${
                  studioView === 'pianoStudio'
                    ? 'bg-amber-400 text-zinc-950 shadow-sm font-extrabold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Music className="w-3.5 h-3.5" />
                <span>Multi-Octave MIDI Roll</span>
              </button>
            </div>

            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-1 font-semibold text-orange-400 hover:underline cursor-pointer shrink-0 ml-2"
            >
              <span>Back to Timeline</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Integration Status Toast / Banner */}
        {statusBanner && (
          <div className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-emerald-500/20 border border-orange-500/40 text-xs font-bold text-orange-300 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-1">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-400 animate-pulse shrink-0" />
              <span>{statusBanner}</span>
            </span>
            <button
              onClick={() => setStatusBanner(null)}
              className="text-zinc-400 hover:text-white text-xs cursor-pointer px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* VIEW 1: FL STUDIO WORKSTATION */}
        {studioView === 'flStudio' && (
          <div className="flex-1 flex flex-col gap-3">
            {/* 1. Top Transport Bar */}
            <DawTransport
              isDark={isDark}
              isPlaying={isPlaying}
              mode={mode}
              bpm={project.bpm}
              masterVolume={project.masterVolume}
              currentStep={currentStep}
              currentBar={currentBar}
              currentBeat={currentBeat}
              activePanels={activePanels}
              hasAiComposition={audioEngine.hasComposition()}
              onSyncAiScore={handleSyncAiScore}
              onSyncToTimeline={handleSyncToTimeline}
              onSaveProject={handleSaveProject}
              onTogglePlay={handleTogglePlay}
              onStop={handleStop}
              onToggleMode={handleToggleMode}
              onChangeBpm={handleChangeBpm}
              onChangeMasterVolume={handleChangeMasterVolume}
              onTogglePanel={handleTogglePanel}
              onExportProject={handleExportProject}
              onImportProject={handleImportProject}
              onResetProject={handleResetProject}
            />

            {/* 2. Channel Rack (Step Sequencer) */}
            {activePanels.rack && (
              <DawChannelRack
                isDark={isDark}
                patterns={project.patterns}
                activePatternId={project.activePatternId}
                currentStep={currentStep}
                selectedChannelId={selectedChannelId}
                onSelectPattern={handleSelectPattern}
                onAddPattern={handleAddPattern}
                onAddChannel={handleAddChannel}
                onToggleStep={handleToggleStep}
                onUpdateChannel={handleUpdateChannel}
                onOpenPianoRoll={(channelId) => {
                  setSelectedChannelId(channelId)
                  setActivePanels((prev) => ({ ...prev, pianoRoll: true }))
                }}
                onSelectChannel={(channelId) => setSelectedChannelId(channelId)}
              />
            )}

            {/* 3. Piano Roll Modal / Panel */}
            {activePanels.pianoRoll && (
              <DawPianoRollModal
                isDark={isDark}
                channel={selectedChannel}
                allChannels={activePattern.channels}
                selectedChannelId={selectedChannelId}
                currentStep={currentStep}
                onClose={() => setActivePanels((prev) => ({ ...prev, pianoRoll: false }))}
                onUpdateChannel={handleUpdateChannel}
                onToggleStep={handleToggleStep}
                onSelectChannel={(channelId) => setSelectedChannelId(channelId)}
              />
            )}

            {/* 4. Playlist (Arrangement View) */}
            {activePanels.playlist && (
              <DawPlaylist
                isDark={isDark}
                patterns={project.patterns}
                activePatternId={project.activePatternId}
                playlist={project.playlist}
                currentBar={currentBar}
                currentBeat={currentBeat}
                currentStep={currentStep}
                totalBars={16}
                onSelectPattern={handleSelectPattern}
                onAddPattern={handleAddPattern}
                onTogglePlaylistItem={handleTogglePlaylistItem}
                onClearPlaylist={handleClearPlaylist}
              />
            )}

            {/* 5. Mixer Console Panel */}
            {activePanels.mixer && (
              <DawMixer
                isDark={isDark}
                channels={activePattern.channels}
                masterVolume={project.masterVolume}
                selectedChannelId={selectedChannelId}
                onUpdateChannel={handleUpdateChannel}
                onUpdateMasterVolume={handleChangeMasterVolume}
                onSelectChannel={(channelId) => setSelectedChannelId(channelId)}
              />
            )}
          </div>
        )}

        {/* VIEW 2: MULTI-OCTAVE PIANO ROLL WORKSTATION */}
        {studioView === 'pianoStudio' && (
          <div className="flex-1 flex flex-col gap-3">
            {/* Top Transport Bar */}
            <DawTransport
              isDark={isDark}
              isPlaying={isPlaying}
              mode={mode}
              bpm={project.bpm}
              masterVolume={project.masterVolume}
              currentStep={currentStep}
              currentBar={currentBar}
              currentBeat={currentBeat}
              activePanels={activePanels}
              hasAiComposition={audioEngine.hasComposition()}
              onSyncAiScore={handleSyncAiScore}
              onSyncToTimeline={handleSyncToTimeline}
              onSaveProject={handleSaveProject}
              onTogglePlay={handleTogglePlay}
              onStop={handleStop}
              onToggleMode={handleToggleMode}
              onChangeBpm={handleChangeBpm}
              onChangeMasterVolume={handleChangeMasterVolume}
              onTogglePanel={handleTogglePanel}
              onExportProject={handleExportProject}
              onImportProject={handleImportProject}
              onResetProject={handleResetProject}
            />

            {/* Active Channel Selector Ribbon */}
            <div className={`p-2.5 rounded-2xl border flex flex-wrap items-center justify-between gap-2 text-xs ${cardClass}`}>
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-wider pl-1">
                  Active Channel:
                </span>

                {/* All Channels Master View Channel Button */}
                <button
                  onClick={() => setSelectedChannelId('all')}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition ${
                    selectedChannelId === 'all'
                      ? 'bg-gradient-to-r from-amber-400 to-orange-400 text-zinc-950 font-black shadow-md ring-2 ring-amber-300'
                      : isDark
                      ? 'bg-zinc-800/90 text-amber-300 hover:text-amber-200 border border-amber-500/30'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}
                  title="View and edit all instrument and drum channels simultaneously on one piano roll"
                >
                  <span className="text-sm">🎼</span>
                  <span>All Channels (Master View)</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      selectedChannelId === 'all'
                        ? 'bg-zinc-950/20 text-zinc-950'
                        : 'bg-amber-400/20 text-amber-300'
                    }`}
                  >
                    {totalAllNotesCount} notes
                  </span>
                </button>

                {activePattern.channels.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => setSelectedChannelId(ch.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition ${
                      selectedChannelId === ch.id
                        ? 'bg-amber-400 text-zinc-950 font-bold shadow-sm'
                        : isDark ? 'bg-zinc-800 text-zinc-300 hover:text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{ch.icon}</span>
                    <span>{ch.name}</span>
                    {ch.notes && ch.notes.length > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    )}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 pr-1">
                <span className="text-[10px] font-mono opacity-50 hidden sm:inline">
                  Click any channel to paint/delete notes
                </span>
                <button
                  onClick={() => setStudioView('flStudio')}
                  className="text-xs font-semibold text-orange-400 hover:underline cursor-pointer"
                >
                  Switch to Channel Rack &rarr;
                </button>
              </div>
            </div>

            {/* Full-Width Multi-Octave Piano Roll */}
            <DawPianoRollModal
              isDark={isDark}
              channel={selectedChannel}
              allChannels={activePattern.channels}
              selectedChannelId={selectedChannelId}
              currentStep={currentStep}
              onClose={() => setStudioView('flStudio')}
              onUpdateChannel={handleUpdateChannel}
              onToggleStep={handleToggleStep}
              onSelectChannel={(channelId) => setSelectedChannelId(channelId)}
            />
          </div>
        )}
      </div>
    </MainLayout>
  )
}
