import { useState, useEffect, useRef, ReactNode } from 'react'
import {
  Play, Pause, Square, SkipBack, SkipForward, Volume2, VolumeX,
  Film, Sparkles, Repeat, Upload, SlidersHorizontal, RotateCcw, Scissors
} from 'lucide-react'
import { Sidebar, AppRoute } from './Sidebar'

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
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLooping, setIsLooping] = useState(true)
  const [playhead, setPlayhead] = useState(24)
  const [masterVolume, setMasterVolume] = useState(80)
  const [isMasterMuted, setIsMasterMuted] = useState(false)

  // Video Upload & Minor Self-Editing States
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null)
  const [uploadedFileName, setUploadedFileName] = useState<string>('Scene_Preview_01.mp4')
  const [showVideoEdits, setShowVideoEdits] = useState(true)
  const [videoBrightness, setVideoBrightness] = useState(100)
  const [videoContrast, setVideoContrast] = useState(100)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9')
  const [trimStart, setTrimStart] = useState(0)
  const [trimEnd, setTrimEnd] = useState(100)
  const [videoAudioMuted, setVideoAudioMuted] = useState(true)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Global Keyboard Shortcuts (Space = Play/Pause, 1-7 = Switch Tool, 0 = Rewind, L = Loop)
  useEffect(() => {
    const toolRoutes: AppRoute[] = [
      'dashboard', 'generator', 'soundscape', 'analysis', 'library', 'projects', 'settings'
    ]
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      if (e.code === 'Space') {
        e.preventDefault()
        setIsPlaying((prev) => !prev)
      } else if (e.key === '0') {
        setPlayhead(trimStart)
        if (videoRef.current && videoRef.current.duration) {
          videoRef.current.currentTime = (trimStart / 100) * videoRef.current.duration
        }
      } else if (e.key.toLowerCase() === 'l') {
        setIsLooping((prev) => !prev)
      } else if (['1', '2', '3', '4', '5', '6', '7'].includes(e.key)) {
        const idx = Number(e.key) - 1
        if (toolRoutes[idx]) onNavigate(toolRoutes[idx])
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onNavigate, trimStart])

  // Sync HTML5 Video element with Transport, Speed, and Mute
  useEffect(() => {
    const vid = videoRef.current
    if (!vid) return
    vid.muted = videoAudioMuted
    vid.playbackRate = playbackRate
    if (isPlaying) {
      vid.play().catch(() => {})
    } else {
      vid.pause()
    }
  }, [isPlaying, uploadedVideoUrl, videoAudioMuted, playbackRate])

  // Master Playhead Loop respecting Trim In/Out
  useEffect(() => {
    if (!isPlaying) return
    const timer = setInterval(() => {
      setPlayhead((prev) => {
        if (prev >= trimEnd) {
          if (!isLooping) {
            setIsPlaying(false)
            return trimStart
          }
          if (videoRef.current && videoRef.current.duration) {
            videoRef.current.currentTime = (trimStart / 100) * videoRef.current.duration
          }
          return trimStart
        }
        return prev + 0.5 * playbackRate
      })
    }, 100)
    return () => clearInterval(timer)
  }, [isPlaying, isLooping, trimStart, trimEnd, playbackRate])

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadedVideoUrl(URL.createObjectURL(file))
    setUploadedFileName(file.name)
    setPlayhead(0)
    setTrimStart(0)
    setTrimEnd(100)
  }

  const handleScrub = (newPercent: number) => {
    const clamped = Math.max(trimStart, Math.min(trimEnd, newPercent))
    setPlayhead(clamped)
    if (videoRef.current && videoRef.current.duration) {
      videoRef.current.currentTime = (clamped / 100) * videoRef.current.duration
    }
  }

  const resetVideoEdits = () => {
    setVideoBrightness(100)
    setVideoContrast(100)
    setPlaybackRate(1)
    setAspectRatio('16:9')
    setTrimStart(0)
    setTrimEnd(100)
  }

  const formatTime = (percent: number) => {
    const totalSeconds = Math.floor((percent / 100) * 105)
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `0${mins}:${secs < 10 ? `0${secs}` : secs}`
  }

  const monitorBars = [
    22, 40, 65, 50, 82, 95, 72, 58, 90, 100, 76, 62,
    84, 92, 68, 48, 74, 88, 60, 42, 70, 85, 54, 32
  ]

  const accentGradient = isDark
    ? 'from-orange-500 to-amber-500 text-zinc-950 shadow-orange-500/30'
    : 'from-sky-500 via-indigo-500 to-violet-500 text-white shadow-indigo-500/25'

  const accentText = isDark ? 'text-orange-500' : 'text-indigo-600'

  return (
    <main className={`relative w-screen h-screen flex overflow-hidden select-none font-sans transition-colors duration-300 ${
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
        <header className={`px-4 py-2 border-b flex items-center justify-between gap-3 shrink-0 ${
          isDark ? 'border-white/10 bg-black/50' : 'border-white/60 bg-white/55'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1 ${accentText}`}>
              <span className="w-1 h-3 bg-current rounded-full" />
              <span className="w-1 h-4 bg-current rounded-full" />
              <span className="w-1 h-2.5 bg-current rounded-full" />
            </div>
            <span className={`font-bold text-sm tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Dramatone <span className={accentText}>Studio</span>
            </span>
            <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${
              isDark ? 'border-white/10 bg-white/5 text-zinc-200' : 'border-white/80 bg-white/80 text-slate-900'
            }`}>
              {title}
            </span>
            {subtitle && (
              <span className={`hidden md:inline text-[11px] ${isDark ? 'text-zinc-500' : 'text-slate-600'}`}>
                {subtitle}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono">
            <span className={`px-2.5 py-0.5 rounded-lg border ${
              isDark ? 'border-white/10 bg-black/40 text-amber-300' : 'border-white/80 bg-white/80 text-indigo-700 font-semibold'
            }`}>
              TC {formatTime(playhead)}:00
            </span>
            <button
              onClick={() => alert('Exporting synced Video + Master Audio Stem...')}
              className={`px-3.5 py-1 rounded-full bg-gradient-to-r font-sans font-semibold text-xs cursor-pointer hover:brightness-110 transition ${accentGradient}`}
            >
              Export Mix
            </button>
          </div>
        </header>

        {/* ================= MAIN EDITOR AREA ================= */}
        <div className="flex-1 flex flex-col gap-3 p-3 overflow-y-auto">
          
          {/* UPPER SPLIT: Top-Left Active Tool Panel (7 cols) + Top-Right Video Preview & Self-Edit Monitor (5 cols) */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 shrink-0">
            
            {/* TOP-LEFT: Active Tool / Prompt / Timeline Controls */}
            <div className="xl:col-span-7 flex flex-col gap-3">
              {children}
            </div>

            {/* TOP-RIGHT: Filmora-Style Video Preview Monitor + Minor Editing Controls */}
            <aside className={`xl:col-span-5 rounded-3xl border backdrop-blur-xl p-3.5 flex flex-col justify-between gap-2.5 ${
              isDark ? 'border-white/10 bg-black/50' : 'border-white/75 bg-white/65 shadow-sm'
            }`}>
              {/* Video Monitor Top Controls */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Film className={`w-3.5 h-3.5 shrink-0 ${accentText}`} />
                  <span className={`text-xs font-semibold truncate ${isDark ? 'text-zinc-100' : 'text-slate-900'}`}>
                    {uploadedFileName}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-medium flex items-center gap-1 border cursor-pointer transition ${
                      isDark
                        ? 'border-white/15 bg-white/5 text-zinc-200 hover:bg-white/10'
                        : 'border-white bg-white/85 text-slate-800 hover:bg-white'
                    }`}
                  >
                    <Upload className="w-2.5 h-2.5" />
                    Import Video
                  </button>

                  <button
                    onClick={() => setShowVideoEdits(!showVideoEdits)}
                    title="Toggle Video Adjustments"
                    className={`p-1.5 rounded-lg border cursor-pointer transition ${
                      showVideoEdits
                        ? isDark ? 'border-orange-500/40 bg-orange-500/15 text-orange-400' : 'border-indigo-500/40 bg-indigo-500/15 text-indigo-700'
                        : isDark ? 'border-white/10 text-zinc-400' : 'border-white bg-white/80 text-slate-700'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Video Canvas Viewport */}
              <div className="relative w-full h-52 rounded-2xl bg-zinc-950 border border-white/15 overflow-hidden flex items-center justify-center">
                <div
                  style={{
                    filter: `brightness(${videoBrightness}%) contrast(${videoContrast}%)`
                  }}
                  className={`relative h-full flex items-center justify-center overflow-hidden transition-all ${
                    aspectRatio === '16:9' ? 'w-full' : aspectRatio === '9:16' ? 'w-32' : 'w-52'
                  }`}
                >
                  {uploadedVideoUrl ? (
                    <video
                      ref={videoRef}
                      src={uploadedVideoUrl}
                      loop={isLooping}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full flex flex-col items-center justify-center p-4 ${
                      isDark
                        ? 'bg-gradient-to-br from-orange-950/80 via-zinc-900 to-amber-950/70'
                        : 'bg-gradient-to-br from-rose-400/50 via-indigo-500/50 to-sky-400/60'
                    }`}>
                      <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center ${
                        isDark ? 'border-orange-400/60' : 'border-white/80'
                      } ${isPlaying ? 'animate-pulse scale-105' : ''}`}>
                        <Sparkles className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-[11px] font-medium text-white/90 mt-2">
                        Import a video clip to preview &amp; edit
                      </span>

                      {/* Bottom Reactive Audio Bars */}
                      <div className="absolute inset-x-4 bottom-2 h-8 flex items-end gap-1 opacity-80">
                        {monitorBars.map((bar, idx) => (
                          <span
                            key={idx}
                            style={{ height: `${isPlaying ? Math.min(100, bar * (0.7 + Math.random() * 0.4)) : bar * 0.5}%` }}
                            className="flex-1 rounded-full bg-white/80 transition-all duration-150"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Top-Left Aspect & Speed Badge */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 text-[10px] font-mono text-white">
                  <span className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-md border border-white/15">
                    {aspectRatio}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-md border border-white/15">
                    {playbackRate}x
                  </span>
                </div>
              </div>

              {/* Dedicated Video Scrubber Bar (Just like Filmora's preview bar) */}
              <div className="flex items-center gap-2.5 px-1">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`w-6 h-6 rounded-full flex items-center justify-center cursor-pointer shrink-0 ${
                    isDark ? 'bg-orange-500 text-zinc-950' : 'bg-indigo-600 text-white'
                  }`}
                >
                  {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
                </button>

                <input
                  type="range"
                  min={trimStart}
                  max={trimEnd}
                  value={playhead}
                  onChange={(e) => handleScrub(Number(e.target.value))}
                  className={`flex-1 h-1 cursor-pointer ${isDark ? 'accent-orange-500' : 'accent-indigo-600'}`}
                />

                <span className={`text-[10px] font-mono shrink-0 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                  {formatTime(playhead)} / 01:45
                </span>
              </div>

              {/* Minor Self-Editing Controls Panel */}
              {showVideoEdits && (
                <div className={`p-2.5 rounded-2xl border space-y-2 text-[11px] ${
                  isDark ? 'border-white/10 bg-zinc-950/70' : 'border-white bg-white/80'
                }`}>
                  {/* Row 1: Aspect Ratio, Speed & Video Audio Mute */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      {(['16:9', '9:16', '1:1'] as const).map((ratio) => (
                        <button
                          key={ratio}
                          onClick={() => setAspectRatio(ratio)}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer ${
                            aspectRatio === ratio
                              ? isDark ? 'bg-orange-500 text-zinc-950 font-bold' : 'bg-indigo-600 text-white font-bold'
                              : isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {ratio}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1">
                      {[0.5, 1, 1.5, 2].map((spd) => (
                        <button
                          key={spd}
                          onClick={() => setPlaybackRate(spd)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono cursor-pointer ${
                            playbackRate === spd
                              ? isDark ? 'bg-amber-400 text-zinc-950 font-bold' : 'bg-violet-600 text-white font-bold'
                              : isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {spd}x
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setVideoAudioMuted(!videoAudioMuted)}
                        title="Mute/Unmute Original Video Audio"
                        className={`px-2 py-0.5 rounded text-[10px] cursor-pointer ${
                          !videoAudioMuted
                            ? isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-indigo-500/15 text-indigo-700'
                            : isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {videoAudioMuted ? 'Vid Muted' : 'Vid Audio'}
                      </button>
                      <button
                        onClick={resetVideoEdits}
                        title="Reset Video Edits"
                        className={`p-1 rounded cursor-pointer ${isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-600 hover:text-slate-950'}`}
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Row 2: Brightness, Contrast & Trim In/Out */}
                  <div className="grid grid-cols-3 gap-2 pt-0.5">
                    <div>
                      <div className="flex justify-between text-[10px] opacity-80">
                        <span>Bright</span>
                        <span>{videoBrightness}%</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="150"
                        value={videoBrightness}
                        onChange={(e) => setVideoBrightness(Number(e.target.value))}
                        className={`w-full h-1 cursor-pointer ${isDark ? 'accent-orange-500' : 'accent-indigo-600'}`}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] opacity-80">
                        <span>Contrast</span>
                        <span>{videoContrast}%</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="150"
                        value={videoContrast}
                        onChange={(e) => setVideoContrast(Number(e.target.value))}
                        className={`w-full h-1 cursor-pointer ${isDark ? 'accent-orange-500' : 'accent-indigo-600'}`}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] opacity-80">
                        <span className="flex items-center gap-0.5"><Scissors className="w-2.5 h-2.5" /> Trim Out</span>
                        <span>{trimEnd}%</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="100"
                        value={trimEnd}
                        onChange={(e) => {
                          const val = Number(e.target.value)
                          setTrimEnd(val)
                          if (playhead > val) setPlayhead(val)
                        }}
                        className={`w-full h-1 cursor-pointer ${isDark ? 'accent-orange-500' : 'accent-indigo-600'}`}
                      />
                    </div>
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>

        {/* Full-Width Bottom Transport Bar */}
        <footer className={`px-5 py-2 border-t flex flex-wrap items-center justify-between gap-4 shrink-0 ${
          isDark ? 'border-white/10 bg-black/55' : 'border-white/60 bg-white/55'
        }`}>
          <div className="flex items-center gap-2.5 w-36">
            <button
              onClick={() => setIsMasterMuted(!isMasterMuted)}
              className={`cursor-pointer ${isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-700 hover:text-slate-950'}`}
            >
              {isMasterMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMasterMuted ? 0 : masterVolume}
              onChange={(e) => {
                setMasterVolume(Number(e.target.value))
                if (isMasterMuted) setIsMasterMuted(false)
              }}
              className={`w-full h-1 cursor-pointer ${isDark ? 'accent-orange-500' : 'accent-indigo-600'}`}
            />
          </div>

          <div className="flex items-center gap-3.5">
            <button
              onClick={() => setIsLooping(!isLooping)}
              title="Toggle Loop (L)"
              className={`p-1.5 rounded-lg border cursor-pointer transition ${
                isLooping
                  ? isDark ? 'border-orange-500/40 bg-orange-500/15 text-orange-400' : 'border-indigo-500/30 bg-indigo-500/15 text-indigo-700'
                  : isDark ? 'border-white/10 text-zinc-500' : 'border-white/70 text-slate-500'
              }`}
            >
              <Repeat className="w-3.5 h-3.5" />
            </button>

            <button onClick={() => handleScrub(trimStart)} title="Rewind (0)" className={`cursor-pointer transition ${isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-700 hover:text-slate-950'}`}>
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              title="Play / Pause (Space)"
              className={`w-8 h-8 rounded-full bg-gradient-to-r flex items-center justify-center shadow-md hover:brightness-110 transition cursor-pointer ${accentGradient}`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
            </button>

            <button
              onClick={() => {
                setIsPlaying(false)
                handleScrub(trimStart)
              }}
              className={`cursor-pointer transition ${isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-700 hover:text-slate-950'}`}
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>

            <button onClick={() => handleScrub(trimEnd)} className={`cursor-pointer transition ${isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-700 hover:text-slate-950'}`}>
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3 flex-1 max-w-md">
            <span className={`text-[11px] font-mono ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>
              {formatTime(playhead)}
            </span>
            <input
              type="range"
              min={trimStart}
              max={trimEnd}
              value={playhead}
              onChange={(e) => handleScrub(Number(e.target.value))}
              className={`w-full h-1 cursor-pointer ${isDark ? 'accent-orange-500' : 'accent-indigo-600'}`}
            />
            <span className={`text-[11px] font-mono ${isDark ? 'text-zinc-500' : 'text-slate-600'}`}>
              01:45
            </span>
          </div>
        </footer>
      </div>
    </main>
  )
}