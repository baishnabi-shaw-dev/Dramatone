import { useState } from 'react'
import { Upload, HeartPulse, Gauge, Sliders } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { AppRoute } from '@/components/layout/Sidebar'

interface PageProps {
  isDark: boolean
  onToggleTheme: () => void
  onNavigate: (page: AppRoute) => void
}

export function AdaptiveSoundscapePage({ isDark, onToggleTheme, onNavigate }: PageProps) {
  const [emotion, setEmotion] = useState<'Calm' | 'Suspense' | 'Heroic' | 'Melancholy'>('Suspense')
  const [tension, setTension] = useState(68)
  const [layers, setLayers] = useState({ ambience: 75, strings: 62, subPulse: 80, foley: 45 })

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
              Scene &amp; Script Context Uploader
            </div>
            <p className={`text-[11px] max-w-xs ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              Drop a video clip, game state JSON, or narrative script to map emotional arcs automatically.
            </p>
            <button
              onClick={() => alert('Sample scene loaded: Midnight Chase Sequence')}
              className={`mt-1 px-4 py-1.5 rounded-full font-semibold text-xs cursor-pointer ${
                isDark ? 'bg-orange-500 text-zinc-950' : 'bg-indigo-600 text-white'
              }`}
            >
              Load Sample Scene
            </button>
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
                  onClick={() => setEmotion(em)}
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
        </div>

        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className={`p-5 rounded-3xl border space-y-3 ${cardClass}`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold flex items-center gap-1.5 ${isDark ? 'text-zinc-200' : 'text-slate-900'}`}>
                <Gauge className={`w-4 h-4 ${accentText}`} />
                Dramatic Tension Meter
              </span>
              <span className={`text-sm font-bold font-mono ${accentText}`}>{tension}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={tension}
              onChange={(e) => setTension(Number(e.target.value))}
              className={`w-full h-2 cursor-pointer ${isDark ? 'accent-orange-500' : 'accent-indigo-600'}`}
            />
            <div className={`flex justify-between text-[10px] font-mono ${isDark ? 'text-zinc-500' : 'text-slate-600'}`}>
              <span>0% • Ambient Stillness</span>
              <span>50% • Rising Pulse</span>
              <span>100% • Climax</span>
            </div>
          </div>

          <div className={`p-5 rounded-3xl border flex-1 space-y-4 ${cardClass}`}>
            <span className={`text-xs font-semibold flex items-center gap-1.5 ${isDark ? 'text-zinc-200' : 'text-slate-900'}`}>
              <Sliders className={`w-3.5 h-3.5 ${accentText}`} />
              Dynamic Soundscape Stem Mix ({emotion})
            </span>

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
                  onChange={(e) => setLayers((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
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