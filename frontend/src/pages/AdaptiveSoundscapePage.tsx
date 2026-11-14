import { useState, useEffect } from 'react'
import { Upload, HeartPulse, Gauge, Sliders, Download, Play, Pause, ArrowRight, Check } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { AppRoute } from '@/components/layout/Sidebar'
import { soundscapeService } from '@/features/adaptive-soundscape/services/soundscapeService'
import { audioEngine } from '@/services/audioEngine'

interface PageProps {
  isDark: boolean
  onToggleTheme: () => void
  onNavigate: (page: AppRoute) => void
}

export function AdaptiveSoundscapePage({ isDark, onToggleTheme, onNavigate }: PageProps) {
  const [emotion, setEmotion] = useState<'Calm' | 'Suspense' | 'Heroic' | 'Melancholy'>('Suspense')
  const [tension, setTension] = useState(68)
  const [sceneName, setSceneName] = useState('Midnight Chase Sequence')
  const [isPlaying, setIsPlaying] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportedStatus, setExportedStatus] = useState<string | null>(null)
  const [layers, setLayers] = useState({ ambience: 75, strings: 62, subPulse: 80, foley: 45 })

  useEffect(() => {
    soundscapeService.setTension(tension)
  }, [tension])

  useEffect(() => {
    if (!audioEngine.hasComposition()) {
      audioEngine.loadComposition('Cyberpunk', 'Suspense', 120)
      audioEngine.setTension(tension)
    }
  }, [])

  const handleTogglePlay = () => {
    if (isPlaying) {
      audioEngine.stop()
      setIsPlaying(false)
    } else {
      audioEngine.ensureContext()
      if (!audioEngine.hasComposition()) {
        audioEngine.loadComposition('Cyberpunk', emotion, 120)
        audioEngine.setTension(tension)
      }
      audioEngine.start()
      setIsPlaying(true)
    }
  }

  const handleOpenInDaw = () => {
    audioEngine.ensureContext()
    const activeProf = audioEngine.getActiveProfile()
    audioEngine.loadComposition(activeProf.genre || 'Cyberpunk', emotion, activeProf.bpm || 120)
    audioEngine.setTension(tension)
    onNavigate('dashboard')
  }

  const handleTensionChange = (newVal: number) => {
    setTension(newVal)
    soundscapeService.setTension(newVal)
    const newLayers = {
      ambience: Math.round(90 - newVal * 0.2),
      strings: Math.round(Math.max(20, newVal * 0.9)),
      subPulse: Math.round(Math.max(10, newVal * 1.1)),
      foley: Math.round(Math.pow(newVal / 100, 1.4) * 100)
    }
    setLayers(newLayers)
    audioEngine.setStemVolume('keys', newLayers.ambience)
    audioEngine.setStemVolume('guitar', newLayers.strings)
    audioEngine.setStemVolume('drums', newLayers.subPulse)
    audioEngine.setStemVolume('vocal', newLayers.foley)
  }

  const handleLayerChange = (key: string, val: number) => {
    setLayers((prev) => ({ ...prev, [key]: val }))
    if (key === 'ambience') audioEngine.setStemVolume('keys', val)
    if (key === 'strings') audioEngine.setStemVolume('guitar', val)
    if (key === 'subPulse') audioEngine.setStemVolume('drums', val)
    if (key === 'foley') audioEngine.setStemVolume('vocal', val)
  }

  const handleEmotionSelect = (em: 'Calm' | 'Suspense' | 'Heroic' | 'Melancholy') => {
    setEmotion(em)
    if (em === 'Calm') {
      audioEngine.loadComposition('Ambient Drone', 'Calm', 72)
      handleTensionChange(20)
    } else if (em === 'Suspense') {
      audioEngine.loadComposition('Cyberpunk', 'Suspense', 120)
      handleTensionChange(65)
    } else if (em === 'Heroic') {
      audioEngine.loadComposition('Brass & Trumpet', 'Heroic', 104)
      handleTensionChange(85)
    } else if (em === 'Melancholy') {
      audioEngine.loadComposition('Cinematic Score', 'Dramatic', 84)
      handleTensionChange(35)
    }
  }

  const handleLoadSample = (name: string, em: 'Calm' | 'Suspense' | 'Heroic' | 'Melancholy', t: number) => {
    setSceneName(name)
    handleEmotionSelect(em)
    handleTensionChange(t)
  }

  const handleExportWav = async () => {
    setIsExporting(true)
    try {
      await soundscapeService.exportWav(sceneName, 180)
      setExportedStatus('WAV Downloaded!')
      setTimeout(() => setExportedStatus(null), 3000)
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportGameJson = () => {
    soundscapeService.exportGameConfig(sceneName)
    setExportedStatus('Game Config JSON Downloaded!')
    setTimeout(() => setExportedStatus(null), 3000)
  }

  const cardClass = isDark ? 'border-white/10 bg-black/45' : 'border-white/75 bg-white/60 shadow-sm'
  const accentText = isDark ? 'text-orange-500' : 'text-indigo-600'

  return (
    <MainLayout activePage="soundscape" isDark={isDark} onToggleTheme={onToggleTheme} onNavigate={onNavigate} title="Adaptive Soundscape" subtitle="Emotion & Scene-Reactive Audio Engine">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className={`p-5 rounded-3xl border border-dashed flex flex-col items-center justify-center text-center gap-2 ${cardClass}`}>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              isDark ? 'bg-orange-500/15 text-orange-500' : 'bg-indigo-500/15 text-indigo-600'
            }`}>
              <Upload className="w-5 h-5" />
            </div>
            <div className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Scene Context: {sceneName}
            </div>
            <p className={`text-[11px] max-w-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              Map emotional pacing and dynamic tension directly to real-time audio stems.
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center mt-1">
              <button
                onClick={() => handleLoadSample('Midnight Chase Sequence', 'Suspense', 78)}
                className={`px-3 py-1 rounded-full text-[10px] font-semibold cursor-pointer transition ${
                  isDark ? 'bg-orange-500 text-zinc-950' : 'bg-indigo-600 text-white'
                }`}
              >
                Sample 1: Chase Scene
              </button>
              <button
                onClick={() => handleLoadSample('Quiet Sanctuary Ruins', 'Calm', 22)}
                className={`px-3 py-1 rounded-full text-[10px] font-semibold border cursor-pointer transition ${
                  isDark ? 'border-white/10 bg-white/5 text-zinc-300' : 'border-white bg-white text-slate-700'
                }`}
              >
                Sample 2: Sanctuary
              </button>
            </div>
          </div>

          <div className={`p-4 rounded-3xl border space-y-3 ${cardClass}`}>
            <span className={`text-xs font-semibold flex items-center gap-1.5 ${isDark ? 'text-zinc-200' : 'text-slate-900'}`}>
              <HeartPulse className={`w-3.5 h-3.5 ${accentText}`} />
              Detected Emotion State
            </span>
            <div className="grid grid-cols-2 gap-2">
              {(['Calm', 'Suspense', 'Heroic', 'Melancholy'] as const).map((em) => (
                <button
                  key={em}
                  onClick={() => handleEmotionSelect(em)}
                  className={`py-2 px-3 rounded-2xl border text-xs font-medium transition cursor-pointer ${
                    emotion === em
                      ? isDark ? 'border-orange-500 bg-orange-500/20 text-orange-500 font-semibold' : 'border-indigo-500 bg-indigo-500/15 text-indigo-700 font-semibold'
                      : isDark ? 'border-white/10 bg-zinc-900/70 text-zinc-400' : 'border-white bg-white/75 text-slate-700'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex gap-2">
            <button
              onClick={handleTogglePlay}
              className={`flex-1 py-2.5 rounded-2xl font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition ${
                isDark ? 'bg-orange-500 text-zinc-950' : 'bg-indigo-600 text-white'
              }`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isPlaying ? 'Auditioning Live...' : 'Audition Soundscape'}</span>
            </button>
            <button
              onClick={handleOpenInDaw}
              className={`px-4 py-2.5 rounded-2xl border text-xs font-medium flex items-center gap-1.5 cursor-pointer ${
                isDark ? 'border-white/10 bg-white/5 text-zinc-200 hover:text-white' : 'border-white bg-white/80 text-slate-800'
              }`}
            >
              <span>DAW</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className={`p-5 rounded-3xl border space-y-3 ${cardClass}`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold flex items-center gap-1.5 ${isDark ? 'text-zinc-200' : 'text-slate-900'}`}>
                <Gauge className={`w-4 h-4 ${accentText}`} />
                Dramatic Tension Meter (Audible Live Modulation)
              </span>
              <span className={`text-sm font-bold font-mono ${accentText}`}>{tension}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={tension}
              onChange={(e) => handleTensionChange(Number(e.target.value))}
              className={`w-full h-2 cursor-pointer ${isDark ? 'accent-orange-500' : 'accent-indigo-600'}`}
            />
            <div className={`flex justify-between text-[10px] font-mono ${isDark ? 'text-zinc-500' : 'text-slate-600'}`}>
              <span>0% • Ambient Stillness</span>
              <span>50% • Rising Pulse</span>
              <span>100% • Climax</span>
            </div>
          </div>

          <div className={`p-5 rounded-3xl border flex-1 space-y-4 ${cardClass}`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold flex items-center gap-1.5 ${isDark ? 'text-zinc-200' : 'text-slate-900'}`}>
                <Sliders className={`w-3.5 h-3.5 ${accentText}`} />
                Dynamic Soundscape Stem Mix ({emotion})
              </span>
              <div className="flex items-center gap-2">
                {exportedStatus && (
                  <span className={`text-[10px] font-medium flex items-center gap-1 ${
                    isDark ? 'text-orange-400' : 'text-indigo-600'
                  }`}>
                    <Check className="w-2.5 h-2.5" />
                    {exportedStatus}
                  </span>
                )}
                <button
                  onClick={handleExportWav}
                  disabled={isExporting}
                  className={`px-2.5 py-1 rounded-lg border text-[10px] font-medium flex items-center gap-1 cursor-pointer ${
                    isDark ? 'border-white/10 bg-white/5 text-zinc-300' : 'border-white bg-white text-slate-800'
                  }`}
                >
                  <Download className="w-3 h-3" />
                  {isExporting ? 'Rendering...' : 'WAV'}
                </button>
                <button
                  onClick={handleExportGameJson}
                  className={`px-2.5 py-1 rounded-lg border text-[10px] font-medium flex items-center gap-1 cursor-pointer ${
                    isDark ? 'border-orange-500/40 bg-orange-500/15 text-orange-400' : 'border-indigo-400 bg-indigo-50 text-indigo-700'
                  }`}
                >
                  Game JSON
                </button>
              </div>
            </div>

            {Object.entries(layers).map(([key, val]) => (
              <div key={key} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="capitalize font-medium">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <span className={`font-mono ${accentText}`}>{val}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={val}
                  onChange={(e) => handleLayerChange(key, Number(e.target.value))}
                  className={`w-full h-1.5 cursor-pointer ${isDark ? 'accent-orange-500' : 'accent-indigo-600'}`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}