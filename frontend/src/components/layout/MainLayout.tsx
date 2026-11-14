import { useState, useEffect, ReactNode } from 'react'
import {
  Play, Pause, Square, SkipBack, SkipForward, Volume2, VolumeX,
  Repeat
} from 'lucide-react'
import { Sidebar, AppRoute } from './Sidebar'
import { audioEngine } from '@/services/audioEngine'

interface MainLayoutProps {
  activePage: AppRoute
  isDark: boolean
  onToggleTheme: () => void
  onNavigate: (page: AppRoute) => void
  title: string
  subtitle?: string
  children: ReactNode
}

export function MainLayout({
  activePage,
  isDark,
  onToggleTheme,
  onNavigate,
  title,
  subtitle,
  children
}: MainLayoutProps) {
  const [isPlaying, setIsPlaying] = useState(() => audioEngine.getIsPlaying())
  const [hasComposition, setHasComposition] = useState(() => audioEngine.hasComposition())
  const [timelineDuration, setTimelineDuration] = useState(() => audioEngine.getTimelineDuration())
  const [elapsedSeconds, setElapsedSeconds] = useState(() => audioEngine.getElapsedSeconds())
  const [playhead, setPlayhead] = useState(() => {
    const dur = audioEngine.getTimelineDuration()
    return dur > 0 ? (audioEngine.getElapsedSeconds() / dur) * 100 : 0
  })
  const [isLooping, setIsLooping] = useState(true)
  const [masterVolume, setMasterVolume] = useState(() => audioEngine.getMasterVolume())
  const [isMasterMuted, setIsMasterMuted] = useState(() => audioEngine.getIsMasterMuted())
  const [isExportingMix, setIsExportingMix] = useState(false)
  const [exportMixDone, setExportMixDone] = useState(false)

  const handleVolumeChange = (val: number) => {
    setMasterVolume(val)
    if (isMasterMuted) setIsMasterMuted(false)
    audioEngine.setMasterVolume(val, false)
  }

  const handleToggleMasterMute = () => {
    const next = !isMasterMuted
    setIsMasterMuted(next)
    audioEngine.setMasterVolume(masterVolume, next)
  }

  // Subscribe to audio engine changes
  useEffect(() => {
    const unsubPlayback = audioEngine.addPlaybackListener((playing) => {
      setIsPlaying(playing)
      setHasComposition(audioEngine.hasComposition())
      setTimelineDuration(audioEngine.getTimelineDuration())
    })

    const unsubTimeline = audioEngine.addTimelineListener((percent, seconds) => {
      setPlayhead(percent)
      setElapsedSeconds(seconds)
      setTimelineDuration(audioEngine.getTimelineDuration())
      setHasComposition(audioEngine.hasComposition())
    })

    return () => {
      unsubPlayback()
      unsubTimeline()
    }
  }, [])

  const handleTogglePlay = () => {
    audioEngine.ensureContext()
    if (isPlaying) {
      audioEngine.stop()
      setIsPlaying(false)
    } else {
      audioEngine.start()
      setIsPlaying(true)
    }
  }

  const handleStop = () => {
    audioEngine.stop()
    setIsPlaying(false)
    setPlayhead(0)
    setElapsedSeconds(0)
    audioEngine.seekTimelinePercent(0)
  }

  const handleScrub = (percent: number) => {
    const clamped = Math.max(0, Math.min(100, percent))
    setPlayhead(clamped)
    audioEngine.seekTimelinePercent(clamped)
  }

  const handleSkipBack = () => {
    const next = Math.max(0, playhead - 10)
    handleScrub(next)
  }

  const handleSkipForward = () => {
    const next = Math.min(100, playhead + 10)
    handleScrub(next)
  }

  const handleExportMix = () => {
    if (!hasComposition) return
    setIsExportingMix(true)
    setTimeout(() => {
      setIsExportingMix(false)
      setExportMixDone(true)
      setTimeout(() => setExportMixDone(false), 3000)
    }, 1200)
  }

  // Spacebar Play/Pause
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
  }, [isPlaying, hasComposition])

  const formatTime = (secs: number) => {
    if (!hasComposition || secs <= 0) return '00:00'
    const s = Math.floor(secs)
    const mins = Math.floor(s / 60)
    const rem = s % 60
    return `0${mins}:${rem < 10 ? `0${rem}` : rem}`
  }

  // Dynamic 24 FPS SMPTE Timecode
  const formatTimecode = (percent: number, duration = timelineDuration) => {
    if (!hasComposition || duration <= 0) return '00:00:00:00'
    const totalFrames = Math.floor((percent / 100) * duration * 24)
    const frames = totalFrames % 24
    const totalSecs = Math.floor(totalFrames / 24)
    const secs = totalSecs % 60
    const mins = Math.floor(totalSecs / 60) % 60
    const hours = Math.floor(totalSecs / 3600)
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)
    return `${pad(hours)}:${pad(mins)}:${pad(secs)}:${pad(frames)}`
  }

  const accentGradient = isDark
    ? 'from-orange-500 to-amber-500 text-zinc-950 shadow-orange-500/30'
    : 'from-sky-500 via-indigo-500 to-violet-500 text-white shadow-indigo-500/25'

  const accentText = isDark ? 'text-orange-500' : 'text-indigo-600'

  return (
    <main className={`relative w-full h-[100dvh] flex overflow-hidden select-none font-sans transition-colors duration-300 ${
      isDark
        ? 'bg-[#0d0c11] text-zinc-100'
        : 'bg-gradient-to-br from-[#e7c6d9] via-[#dfd6eb] to-[#cbe0e4] text-slate-800'
    }`}>
      {/* Iridescent Pastel Mesh Orbs */}
      <div className={`absolute -top-20 -left-20 w-[560px] h-[560px] rounded-full blur-[160px] pointer-events-none ${
        isDark ? 'bg-fuchsia-600/15' : 'bg-rose-400/35'
      }`} />
      <div className={`absolute bottom-0 right-0 w-[540px] h-[480px] rounded-full blur-[160px] pointer-events-none ${
        isDark ? 'bg-orange-600/15' : 'bg-sky-300/45'
      }`} />

      {/* Narrow Left Tool Rail */}
      <Sidebar
        activePage={activePage}
        isDark={isDark}
        onToggleTheme={onToggleTheme}
        onNavigate={onNavigate}
      />

      {/* Full-Viewport Editor Shell */}
      <div className={`relative z-10 flex-1 flex flex-col justify-between h-full overflow-hidden backdrop-blur-2xl ${
        isDark ? 'bg-white/[0.02]' : 'bg-white/35'
      }`}>
        
        {/* Top Editor Header Bar */}
        <header className={`px-4 py-2.5 border-b flex items-center justify-between gap-3 shrink-0 ${
          isDark ? 'border-white/10 bg-black/50' : 'border-white/60 bg-white/55'
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className={`flex items-center gap-1 shrink-0 ${accentText}`}>
              <span className="w-1 h-3 bg-current rounded-full" />
              <span className="w-1 h-4 bg-current rounded-full" />
              <span className="w-1 h-2.5 bg-current rounded-full" />
            </div>
            <span className={`font-bold text-sm tracking-tight truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Dramatone <span className={accentText}>Studio</span>
            </span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium shrink-0 ${
              isDark ? 'border-white/10 bg-white/5 text-zinc-200' : 'border-white/80 bg-white/80 text-slate-900'
            }`}>
              {title}
            </span>
            {subtitle && (
              <span className="text-xs opacity-50 truncate hidden md:inline">
                • {subtitle}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono shrink-0">
            <span className={`hidden md:inline px-2.5 py-0.5 rounded-lg border tracking-wider font-semibold ${
              isDark ? 'border-white/10 bg-black/40 text-amber-300' : 'border-white/80 bg-white/80 text-indigo-700'
            }`}>
              TC {formatTimecode(playhead)}
            </span>

            <button
              onClick={handleExportMix}
              disabled={isExportingMix}
              className={`px-3.5 py-1 rounded-full bg-gradient-to-r font-sans font-semibold text-xs cursor-pointer hover:brightness-110 transition flex items-center gap-1.5 ${accentGradient}`}
            >
              {isExportingMix ? 'Rendering...' : exportMixDone ? 'Exported!' : 'Export Mix'}
            </button>
          </div>
        </header>

        {/* ================= MAIN FULL-WIDTH WORKSPACE CANVAS ================= */}
        <div className="flex-1 flex flex-col gap-3 p-2.5 sm:p-3.5 overflow-y-auto min-h-0 min-w-0">
          {children}
        </div>

        {/* Full-Width Bottom Transport Bar */}
        <footer className={`px-4 py-2 border-t flex flex-wrap items-center justify-between gap-3 shrink-0 overflow-hidden max-w-full select-none ${
          isDark ? 'border-white/10 bg-black/55' : 'border-white/60 bg-white/55'
        }`}>
          <div className="flex items-center gap-2.5 w-36">
            <button
              onClick={handleToggleMasterMute}
              title={isMasterMuted ? 'Unmute Audio Engine' : 'Mute Audio Engine'}
              className={`cursor-pointer transition ${isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-700 hover:text-slate-950'}`}
            >
              {isMasterMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMasterMuted ? 0 : masterVolume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              title={`Master Volume: ${masterVolume}%`}
              className={`w-full h-1 cursor-pointer ${isDark ? 'accent-orange-500' : 'accent-indigo-600'}`}
            />
          </div>

          {/* Transport Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={handleSkipBack}
              disabled={!hasComposition}
              title="Skip Back 10s"
              className={`p-2 rounded-xl border transition cursor-pointer ${
                isDark ? 'border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300' : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={handleTogglePlay}
              disabled={!hasComposition}
              title={hasComposition ? (isPlaying ? 'Pause (Space)' : 'Play (Space)') : 'Generate audio or cue a scene to play'}
              className={`w-11 h-11 rounded-full flex items-center justify-center font-bold shadow-lg transition-transform active:scale-95 cursor-pointer ${
                !hasComposition
                  ? 'opacity-40 cursor-not-allowed bg-zinc-700 text-zinc-400'
                  : isDark
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-zinc-950 shadow-orange-500/30'
                  : 'bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500 text-white shadow-indigo-500/25'
              }`}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>

            <button
              onClick={handleStop}
              disabled={!hasComposition}
              title="Stop & Return to Start"
              className={`p-2 rounded-xl border transition cursor-pointer ${
                isDark ? 'border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300' : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <Square className="w-4 h-4" />
            </button>

            <button
              onClick={handleSkipForward}
              disabled={!hasComposition}
              title="Skip Forward 10s"
              className={`p-2 rounded-xl border transition cursor-pointer ${
                isDark ? 'border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300' : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsLooping(!isLooping)}
              title={isLooping ? 'Loop Mode: ON' : 'Loop Mode: OFF'}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                isLooping
                  ? isDark ? 'border-orange-500/40 bg-orange-500/20 text-orange-400' : 'border-indigo-500/40 bg-indigo-500/15 text-indigo-700'
                  : isDark ? 'border-white/10 bg-white/5 text-zinc-500' : 'border-slate-300 bg-white text-slate-400'
              }`}
            >
              <Repeat className="w-4 h-4" />
            </button>
          </div>

          {/* Time Scrubber (Protected against right edge clipping) */}
          <div className="flex items-center gap-2 w-40 sm:w-56 shrink-0 pr-1">
            <span className={`text-xs font-mono shrink-0 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              {formatTime(elapsedSeconds)}
            </span>
            <input
              type="range"
              min={0}
              max={hasComposition ? 100 : 0}
              value={hasComposition ? playhead : 0}
              disabled={!hasComposition}
              onChange={(e) => handleScrub(Number(e.target.value))}
              className={`flex-1 h-1.5 rounded-lg ${hasComposition ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'} ${
                isDark ? 'accent-orange-500' : 'accent-indigo-600'
              }`}
            />
            <span className={`text-xs font-mono shrink-0 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              {formatTime(timelineDuration)}
            </span>
          </div>
        </footer>
      </div>
    </main>
  )
}
