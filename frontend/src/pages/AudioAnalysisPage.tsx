import { useState, useEffect } from 'react'
import { Activity, BarChart3, Radio } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { AppRoute } from '@/components/layout/Sidebar'
import { analysisService } from '@/features/audio-analysis/services/analysisService'
import { audioEngine } from '@/services/audioEngine'

interface PageProps {
  isDark: boolean
  onToggleTheme: () => void
  onNavigate: (page: AppRoute) => void
}

export function AudioAnalysisPage({ isDark, onToggleTheme, onNavigate }: PageProps) {
  const [spectrum, setSpectrum] = useState<number[]>([
    14, 28, 45, 68, 88, 96, 82, 74, 90, 100, 86, 70, 62, 78, 84, 66, 52, 40, 32, 24, 18, 12
  ])
  const [metrics, setMetrics] = useState(analysisService.getMetrics())
  const [isLiveAudio, setIsLiveAudio] = useState(false)

  useEffect(() => {
    let animFrame: number

    const updateLoop = () => {
      const isPlaying = audioEngine.getIsPlaying()
      setIsLiveAudio(isPlaying)

      if (isPlaying) {
        const raw = analysisService.getFrequencySpectrum()
        // Subsample 64 raw bins down to 24 visual bars
        const step = Math.floor(raw.length / 22)
        const newBars: number[] = []
        for (let i = 0; i < 22; i++) {
          const val = raw[i * step] || 0
          newBars.push(Math.max(8, Math.round((val / 255) * 100)))
        }
        setSpectrum(newBars)
        setMetrics(analysisService.getMetrics())
      }

      animFrame = requestAnimationFrame(updateLoop)
    }

    animFrame = requestAnimationFrame(updateLoop)
    return () => cancelAnimationFrame(animFrame)
  }, [])

  const cardClass = isDark ? 'border-white/10 bg-black/45' : 'border-white/75 bg-white/60 shadow-sm'
  const accentText = isDark ? 'text-orange-500' : 'text-indigo-600'

  return (
    <MainLayout activePage="analysis" isDark={isDark} onToggleTheme={onToggleTheme} onNavigate={onNavigate} title="Audio Analysis" subtitle="Spectral & Loudness Diagnostics">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
        <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
          {metrics.map((m, i) => (
            <div key={i} className={`p-4 rounded-2xl border flex flex-col justify-between ${cardClass}`}>
              <span className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>{m.label}</span>
              <span className={`text-xl font-bold font-mono my-1 ${accentText}`}>{m.value}</span>
              <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>{m.note}</span>
            </div>
          ))}
        </div>

        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className={`p-5 rounded-3xl border flex-1 flex flex-col justify-between ${cardClass}`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold flex items-center gap-1.5 ${isDark ? 'text-zinc-200' : 'text-slate-900'}`}>
                <BarChart3 className={`w-4 h-4 ${accentText}`} />
                FFT Dramatone Spectrogram (Web Audio AnalyserNode)
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono flex items-center gap-1 px-2 py-0.5 rounded-full ${
                  isLiveAudio
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : isDark ? 'bg-zinc-800 text-zinc-500' : 'bg-slate-200 text-slate-500'
                }`}>
                  <Radio className="w-2.5 h-2.5 animate-pulse" />
                  {isLiveAudio ? 'LIVE DSP AUDIO' : 'PAUSED'}
                </span>
                <span className={`text-[10px] font-mono ${accentText}`}>64-pt FFT Stream</span>
              </div>
            </div>

            <div className="h-48 flex items-end justify-between gap-1.5 pt-4">
              {spectrum.map((val, idx) => (
                <div
                  key={idx}
                  style={{ height: `${val}%` }}
                  className={`flex-1 rounded-full bg-gradient-to-t transition-all duration-75 ${
                    isDark ? 'from-orange-600 via-amber-400 to-yellow-200' : 'from-violet-600 via-indigo-500 to-sky-300'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className={`p-4 rounded-3xl border space-y-2 ${cardClass}`}>
            <span className={`text-xs font-semibold flex items-center gap-1.5 ${isDark ? 'text-zinc-200' : 'text-slate-900'}`}>
              <Activity className={`w-3.5 h-3.5 ${accentText}`} />
              Stereo Phase &amp; Transient Waveform
            </span>
            <div className="h-14 flex items-center gap-1">
              {spectrum.concat(spectrum).map((val, i) => (
                <span
                  key={i}
                  style={{ height: `${Math.max(15, val * 0.85)}%` }}
                  className={`flex-1 rounded-full transition-all duration-75 ${isDark ? 'bg-orange-500/75' : 'bg-indigo-500/75'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}