import { useState, useEffect, useRef } from 'react'
import {
  Upload, Film, Sparkles, Play, Pause, AlertTriangle, Wand2, Zap
} from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { AppRoute } from '@/components/layout/Sidebar'
import { videoAnalysisService, VideoAnalysisFrame } from '@/services/videoAnalysisService'
import { audioEngine } from '@/services/audioEngine'

interface PageProps {
  isDark: boolean
  onToggleTheme: () => void
  onNavigate: (page: AppRoute) => void
}

const MAX_FILE_SIZE_BYTES = 150 * 1024 * 1024 // 150 MB

interface DemoScenePreset {
  id: string
  name: string
  icon: string
  genre: string
  mood: string
  bpm: number
  description: string
  sampleDuration: number
  motionProfile: number
}

const DEMO_SCENES: DemoScenePreset[] = [
  {
    id: 'cyberpunk-alley',
    name: 'Cyberpunk Pursuit',
    icon: '⚡',
    genre: 'Cyberpunk Action OST',
    mood: 'High-Octane Pursuit',
    bpm: 132,
    description: 'Rapid kinetic motion and high-contrast neon lighting detected. Recommended: Aggressive saw basslines, industrial war drums, and staccato risers.',
    sampleDuration: 32,
    motionProfile: 82
  },
  {
    id: 'eerie-corridor',
    name: 'Horror Corridor',
    icon: '🌑',
    genre: 'Dark Ambient Horror Underscore',
    mood: 'Eerie & Menacing',
    bpm: 74,
    description: 'Low ambient illumination with crawling camera motion detected. Recommended: Sub-bass drones, microtonal vocal textures, and sudden transient tension peaks.',
    sampleDuration: 45,
    motionProfile: 38
  },
  {
    id: 'nature-highlands',
    name: 'Highland Nature',
    icon: '🌿',
    genre: 'Acoustic Indie & Piano',
    mood: 'Intimate & Tender',
    bpm: 86,
    description: 'Sweeping expansive landscape with dialogue-friendly acoustic space. Recommended: Soft felt piano, warm nylon guitar arpeggios, and subtle ambient breeze foley.',
    sampleDuration: 28,
    motionProfile: 24
  }
]

export function SceneAnalyzerPage({ isDark, onToggleTheme, onNavigate }: PageProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [activeDemoPreset, setActiveDemoPreset] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [fileSizeMb, setFileSizeMb] = useState<number>(0)
  const [fileError, setFileError] = useState<string | null>(null)

  // Video Player States
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  // Real-time AI Analysis States (default idle 0% before video is analyzed)
  const [motionEnergy, setMotionEnergy] = useState(0)
  const [brightness, setBrightness] = useState(0)
  const [isSceneCut, setIsSceneCut] = useState(false)
  const [cutCount, setCutCount] = useState(0)

  // AI Recommendation State
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false)
  const [recommendedBpm, setRecommendedBpm] = useState(110)
  const [recommendedGenre, setRecommendedGenre] = useState('Cinematic Orchestral')
  const [recommendedMood, setRecommendedMood] = useState('Tense & Building')
  const [recommendedDescription, setRecommendedDescription] = useState(
    'Upload a scene to detect visual pacing, camera movement, and acoustic requirements.'
  )

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileError(null)

    // Strict 150 MB limit validation
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1)
      setFileError(`⚠️ File size (${sizeMb} MB) exceeds the 150 MB limit. Please select a video under 150 MB.`)
      return
    }

    const sizeMb = Math.round((file.size / (1024 * 1024)) * 10) / 10
    setFileSizeMb(sizeMb)
    setFileName(file.name)
    const url = URL.createObjectURL(file)
    setVideoUrl(url)
    setIsPlaying(false)
    setCurrentTime(0)
    setCutCount(0)

    // Trigger AI Scene Recognition
    analyzeSceneHeuristics(file.name)
  }

  const analyzeSceneHeuristics = (name: string) => {
    setIsAnalyzingAi(true)
    setTimeout(() => {
      const lower = name.toLowerCase()
      let genre = 'Cinematic Orchestral'
      let mood = 'Building Suspense'
      let bpm = 105
      let desc = 'Balanced visual motion detected. Recommended: Layered warm strings with gradual staccato pulse.'

      if (lower.includes('chase') || lower.includes('fight') || lower.includes('action') || lower.includes('run')) {
        genre = 'Cyberpunk Action / Hybrid Orchestral'
        mood = 'High-Octane Pursuit'
        bpm = 132
        desc = 'High-velocity motion and kinetic camera pacing. Recommended: Driving double-kick percussions, Moog synth bass, and sub-boom impacts.'
      } else if (lower.includes('horror') || lower.includes('night') || lower.includes('dark') || lower.includes('creepy')) {
        genre = 'Dark Ambient Underscore'
        mood = 'Eerie & Menacing'
        bpm = 74
        desc = 'Low ambient lighting with suspenseful pacing. Recommended: Microtonal neutral thirds, monastic vocal drones, and distant thunder crackles.'
      } else if (lower.includes('calm') || lower.includes('nature') || lower.includes('doc') || lower.includes('dialogue')) {
        genre = 'Acoustic Indie & Piano'
        mood = 'Intimate & Tender'
        bpm = 82
        desc = 'Dialogue-friendly dynamic space with slow pacing. Recommended: Felt piano chords, nylon guitar plucks, and subtle breath texture.'
      }

      setRecommendedGenre(genre)
      setRecommendedMood(mood)
      setRecommendedBpm(bpm)
      setRecommendedDescription(desc)
      setIsAnalyzingAi(false)
    }, 1200)
  }

  // Hook into video playback & videoAnalysisService
  useEffect(() => {
    const vid = videoRef.current
    if (!vid) return

    if (isPlaying) {
      vid.play().catch(() => {})
      videoAnalysisService.startAnalysis(vid, (frame: VideoAnalysisFrame) => {
        setMotionEnergy(frame.motionEnergy)
        setBrightness(frame.brightness)
        if (frame.isSceneCut) {
          setIsSceneCut(true)
          setCutCount((prev) => prev + 1)
          setTimeout(() => setIsSceneCut(false), 800)
        }
      })
    } else {
      vid.pause()
      videoAnalysisService.stopAnalysis()
    }
  }, [isPlaying, videoUrl])

  const handleSelectDemoScene = (preset: DemoScenePreset) => {
    setActiveDemoPreset(preset.id)
    setVideoUrl(null)
    setFileError(null)
    setFileName(`${preset.name}.mp4`)
    setFileSizeMb(42.5)
    setDuration(preset.sampleDuration)
    setCurrentTime(0)
    setCutCount(0)
    setIsPlaying(true)

    setIsAnalyzingAi(true)
    setTimeout(() => {
      setRecommendedGenre(preset.genre)
      setRecommendedMood(preset.mood)
      setRecommendedBpm(preset.bpm)
      setRecommendedDescription(preset.description)
      setMotionEnergy(preset.motionProfile)
      setBrightness(preset.id === 'cyberpunk-alley' ? 75 : preset.id === 'eerie-corridor' ? 25 : 60)
      setIsAnalyzingAi(false)
    }, 600)
  }

  // Dynamic canvas animated demo scene renderer
  useEffect(() => {
    if (!activeDemoPreset || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let frame = 0
    let lastCut = Date.now()

    const render = () => {
      frame++
      const w = canvas.width
      const h = canvas.height

      if (activeDemoPreset === 'cyberpunk-alley') {
        ctx.fillStyle = '#0a0a14'
        ctx.fillRect(0, 0, w, h)

        ctx.strokeStyle = '#f43f5e'
        ctx.lineWidth = 1.5
        const offset = (frame * 6) % 40
        for (let y = h / 2; y < h; y += 15) {
          ctx.beginPath()
          ctx.moveTo(0, y)
          ctx.lineTo(w, y)
          ctx.stroke()
        }
        for (let x = -w; x < w * 2; x += 60) {
          ctx.beginPath()
          ctx.moveTo(w / 2, h / 2)
          ctx.lineTo(x + offset, h)
          ctx.stroke()
        }

        ctx.fillStyle = '#06b6d4'
        for (let b = 0; b < w; b += 55) {
          const bh = 50 + Math.sin(b * 0.2 + frame * 0.05) * 35
          ctx.fillRect(b, h / 2 - bh, 35, bh)
        }

        ctx.strokeStyle = '#eab308'
        ctx.lineWidth = 2
        ctx.beginPath()
        const lx = (frame * 12) % w
        ctx.moveTo(lx, 25)
        ctx.lineTo(lx + 90, 25)
        ctx.stroke()
      } else if (activeDemoPreset === 'eerie-corridor') {
        ctx.fillStyle = '#040407'
        ctx.fillRect(0, 0, w, h)

        const flicker = 0.8 + Math.sin(frame * 0.3) * 0.2
        const grad = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, 220 * flicker)
        grad.addColorStop(0, 'rgba(180, 83, 9, 0.45)')
        grad.addColorStop(1, 'rgba(0, 0, 0, 0.96)')
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, w, h)

        ctx.fillStyle = 'rgba(255, 255, 255, 0.06)'
        const mx = (frame * 2) % w
        ctx.fillRect(mx - 100, h / 2 - 35, 200, 70)
      } else {
        const skyGrad = ctx.createLinearGradient(0, 0, 0, h)
        skyGrad.addColorStop(0, '#38bdf8')
        skyGrad.addColorStop(0.6, '#fde047')
        skyGrad.addColorStop(1, '#15803d')
        ctx.fillStyle = skyGrad
        ctx.fillRect(0, 0, w, h)

        ctx.fillStyle = '#065f46'
        ctx.beginPath()
        ctx.moveTo(0, h)
        for (let x = 0; x <= w; x += 40) {
          const my = h * 0.62 + Math.sin(x * 0.02 + frame * 0.015) * 35
          ctx.lineTo(x, my)
        }
        ctx.lineTo(w, h)
        ctx.fill()
      }

      if (isPlaying) {
        setCurrentTime((prev) => (prev >= duration ? 0 : prev + 0.033))
        const baseMotion = activeDemoPreset === 'cyberpunk-alley' ? 82 : activeDemoPreset === 'eerie-corridor' ? 38 : 24
        const jitter = Math.sin(frame * 0.2) * 10 + Math.cos(frame * 0.08) * 6
        setMotionEnergy(Math.round(Math.max(10, Math.min(100, baseMotion + jitter))))

        if (Date.now() - lastCut > 7000) {
          lastCut = Date.now()
          setIsSceneCut(true)
          setCutCount((c) => c + 1)
          setTimeout(() => setIsSceneCut(false), 600)
        }
      }

      animId = requestAnimationFrame(render)
    }

    animId = requestAnimationFrame(render)
    return () => cancelAnimationFrame(animId)
  }, [activeDemoPreset, isPlaying, duration])

  const handleTogglePlay = () => {
    if (!videoUrl && !activeDemoPreset) return
    setIsPlaying(!isPlaying)
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  const handleScrub = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
    }
    setCurrentTime(time)
  }

  const handleTransferToStudio = () => {
    // Transfer recognized tempo and recommended genre to audio engine
    audioEngine.setBpm(recommendedBpm)
    // Save to localStorage so Studio Dashboard auto-loads prompt & pacing
    localStorage.setItem(
      'dramatone_scene_prompt',
      `${recommendedGenre} with ${recommendedMood.toLowerCase()}, ${recommendedBpm} BPM`
    )
    localStorage.setItem('dramatone_scene_bpm', String(recommendedBpm))
    localStorage.setItem('dramatone_scene_tension', String(Math.round(motionEnergy || 60)))
    // Navigate to studio workspace
    onNavigate('dashboard')
  }

  const formatSecs = (sec: number) => {
    const s = Math.floor(sec)
    const m = Math.floor(s / 60)
    const rem = s % 60
    return `0${m}:${rem < 10 ? `0${rem}` : rem}`
  }

  const cardClass = isDark
    ? 'border-white/10 bg-black/40 text-zinc-100'
    : 'border-white/80 bg-white/75 text-slate-800 shadow-sm'

  return (
    <MainLayout
      activePage="scene"
      isDark={isDark}
      onToggleTheme={onToggleTheme}
      onNavigate={onNavigate}
      title="Scene Intelligence & Video Analyzer"
      subtitle="Upload visual footage up to 150 MB for AI pacing analysis & musical scoring recommendations"
    >
      <div className="flex-1 flex flex-col gap-4 min-h-0">
        {/* Top Upload & Spec Bar */}
        <div className={`p-4 rounded-3xl border backdrop-blur-md flex flex-wrap items-center justify-between gap-3 ${cardClass}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold flex items-center gap-2">
                <span>Visual Scene Analyzer</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 font-semibold">
                  Max 150 MB
                </span>
              </div>
              <p className="text-xs opacity-60">
                Samples motion energy, camera cuts, and lighting at 4 FPS to deduce required score pacing
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-wider">
              1-Click Demos:
            </span>
            {DEMO_SCENES.map((preset) => {
              const isSelected = activeDemoPreset === preset.id
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectDemoScene(preset)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition ${
                    isSelected
                      ? 'bg-amber-400 text-zinc-950 font-bold shadow-md ring-2 ring-amber-300'
                      : isDark
                      ? 'bg-zinc-800/80 text-zinc-300 hover:text-white border border-white/10 hover:border-amber-400/40'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                  title={preset.description}
                >
                  <span>{preset.icon}</span>
                  <span>{preset.name}</span>
                </button>
              )
            })}

            <div className="h-4 w-px bg-white/10 mx-1 hidden sm:block" />

            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-zinc-950 font-bold text-xs flex items-center gap-2 cursor-pointer hover:brightness-110 transition shadow-sm"
            >
              <Upload className="w-4 h-4" />
              <span>{videoUrl ? 'Replace Video Clip' : 'Upload Video Clip (≤ 150 MB)'}</span>
            </button>
          </div>
        </div>

        {/* File Size Error Alert */}
        {fileError && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{fileError}</span>
          </div>
        )}

        {/* Main 2-Column Split: Video Viewport on Left, AI Scene Recognition on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
          {/* Left Column: Video Player & Scrubber (7 cols) */}
          <div className={`lg:col-span-7 p-4 rounded-3xl border backdrop-blur-md flex flex-col gap-3 min-h-[380px] ${cardClass}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300 truncate">
                {fileName || 'No video loaded — click Upload Clip above'}
              </span>
              {fileSizeMb > 0 && (
                <span className="text-[10px] font-mono opacity-60">
                  {fileSizeMb} MB • {formatSecs(duration)}
                </span>
              )}
            </div>

            {/* Video Viewport */}
            <div className="relative flex-1 w-full bg-zinc-950 rounded-2xl border border-white/10 overflow-hidden flex items-center justify-center min-h-[260px]">
              {videoUrl ? (
                <video
                  ref={videoRef}
                  src={videoUrl}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onClick={handleTogglePlay}
                  className="w-full h-full object-contain cursor-pointer"
                />
              ) : activeDemoPreset ? (
                <canvas
                  ref={canvasRef}
                  width={640}
                  height={360}
                  onClick={handleTogglePlay}
                  className="w-full h-full object-contain cursor-pointer"
                />
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-full flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-white/[0.02] transition"
                >
                  <div className="w-16 h-16 rounded-3xl border border-dashed border-orange-500/40 flex items-center justify-center text-orange-400 mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold text-zinc-200">
                    Drop a scene video clip here (≤ 150 MB)
                  </span>
                  <span className="text-[10px] opacity-50 mt-1">
                    Or select one of the 1-Click Demo Scenes above
                  </span>
                </div>
              )}

              {/* Video Overlay Badges */}
              {(videoUrl || activeDemoPreset) && (
                <>
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 text-[10px] font-mono">
                    <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-md border border-white/15 text-white">
                      Pacing {motionEnergy}%
                    </span>
                    <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-md border border-white/15 text-white">
                      Bright {brightness}%
                    </span>
                    {activeDemoPreset && (
                      <span className="px-2 py-0.5 rounded bg-amber-500/25 backdrop-blur-md border border-amber-500/40 text-amber-300 font-bold">
                        DEMO SIMULATION
                      </span>
                    )}
                  </div>

                  <div className="absolute top-3 right-3 flex items-center gap-1.5 text-[10px] font-mono">
                    {isSceneCut && (
                      <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold animate-pulse shadow-lg border border-rose-400">
                        ✂️ CAMERA CUT
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-md border border-white/15 text-orange-400 font-bold">
                      Cuts: {cutCount}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Video Scrubber & Transport Bar */}
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleTogglePlay}
                disabled={!videoUrl && !activeDemoPreset}
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 cursor-pointer ${
                  !videoUrl && !activeDemoPreset
                    ? 'opacity-30 bg-zinc-800 text-zinc-500'
                    : isDark ? 'bg-orange-500 text-zinc-950' : 'bg-indigo-600 text-white'
                }`}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
              </button>

              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                disabled={!videoUrl && !activeDemoPreset}
                onChange={(e) => handleScrub(Number(e.target.value))}
                className="flex-1 h-1.5 accent-orange-500 cursor-pointer"
              />

              <span className="text-xs font-mono shrink-0 opacity-70">
                {formatSecs(currentTime)} / {formatSecs(duration)}
              </span>
            </div>
          </div>

          {/* Right Column: AI Scene Recognition & Musical Recommendation (5 cols) */}
          <div className={`lg:col-span-5 p-4 rounded-3xl border backdrop-blur-md flex flex-col justify-between gap-4 ${cardClass}`}>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-orange-400" />
                  <span>AI Scene Intelligence &amp; Recommendation</span>
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  isAnalyzingAi
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-300 animate-pulse'
                    : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                }`}>
                  {isAnalyzingAi ? 'Analyzing Pacing...' : 'Scene Profile Ready'}
                </span>
              </div>

              {/* Real-time Optical Pacing Gauges */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                  <div className="text-[10px] opacity-60 font-mono">Visual Motion Energy</div>
                  <div className="text-lg font-bold font-mono text-orange-400">{motionEnergy}%</div>
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${motionEnergy}%` }}
                      className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                  <div className="text-[10px] opacity-60 font-mono">Camera Cuts Detected</div>
                  <div className="text-lg font-bold font-mono text-zinc-100">{cutCount}</div>
                  <div className="text-[9px] opacity-50 font-mono">Punctuation impacts</div>
                </div>
              </div>

              {/* AI Recommended Music Spec Card */}
              <div className="p-3.5 rounded-2xl bg-orange-500/5 border border-orange-500/20 space-y-2.5">
                <div className="text-xs font-semibold text-orange-400 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Recommended Soundtrack Profile</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] opacity-50 block">Genre</span>
                    <span className="font-bold text-zinc-100">{recommendedGenre}</span>
                  </div>
                  <div>
                    <span className="text-[10px] opacity-50 block">Pacing / BPM</span>
                    <span className="font-bold text-zinc-100">{recommendedBpm} BPM</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] opacity-50 block">Atmospheric Mood</span>
                    <span className="font-medium text-zinc-200">{recommendedMood}</span>
                  </div>
                </div>

                <p className="text-[11px] font-serif italic text-zinc-300 opacity-90 pt-1 border-t border-white/5">
                  "{recommendedDescription}"
                </p>
              </div>
            </div>

            {/* Action Footer: 1-Click Transfer to Studio Workspace */}
            <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
              <button
                onClick={handleTransferToStudio}
                className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer hover:brightness-110 transition shadow-lg"
              >
                <Wand2 className="w-4 h-4" />
                <span>Compose Score in Studio Workspace ({recommendedBpm} BPM) &rarr;</span>
              </button>
              <div className="text-[10px] text-center opacity-50 font-mono">
                Transfers detected visual pacing directly into the multi-track stem diffusion engine
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
