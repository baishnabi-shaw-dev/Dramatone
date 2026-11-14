import { useState } from 'react'
import { Mic, Play, Sparkles, ChevronDown, ChevronUp } from 'lucide-react'
import {
  microtonalVocalService,
  MICROTONAL_SCALES,
  FORMANT_VOWELS,
  MicrotonalScaleId,
  VocalDensity
} from '@/services/microtonalVocalService'

interface MicrotonalVocalPanelProps {
  isDark: boolean
  onToggleActive?: (active: boolean) => void
}

export function MicrotonalVocalPanel({ isDark, onToggleActive }: MicrotonalVocalPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const initialConfig = microtonalVocalService.getConfig()
  const [isActive, setIsActive] = useState(initialConfig.isActive)
  const [scaleId, setScaleId] = useState<MicrotonalScaleId>(initialConfig.scaleId)
  const [vowelId, setVowelId] = useState(initialConfig.vowelId)
  const [density, setDensity] = useState<VocalDensity>(initialConfig.density)
  const [vibratoDepth, setVibratoDepth] = useState(initialConfig.vibratoDepth)
  const [humanDrift, setHumanDrift] = useState(initialConfig.humanizeDrift)
  const [isAuditioning, setIsAuditioning] = useState(false)

  const activeScale = MICROTONAL_SCALES[scaleId] || MICROTONAL_SCALES['24-edo']
  const activeVowel = FORMANT_VOWELS.find((v) => v.id === vowelId) || FORMANT_VOWELS[0]

  const handleToggleActive = () => {
    const next = !isActive
    setIsActive(next)
    microtonalVocalService.setConfig({ isActive: next })
    if (onToggleActive) onToggleActive(next)
  }

  const handleScaleChange = (id: MicrotonalScaleId) => {
    setScaleId(id)
    microtonalVocalService.setConfig({ scaleId: id })
  }

  const handleVowelChange = (id: string) => {
    setVowelId(id)
    microtonalVocalService.setConfig({ vowelId: id })
  }

  const handleDensityChange = (d: VocalDensity) => {
    setDensity(d)
    microtonalVocalService.setConfig({ density: d })
  }

  const handleVibratoChange = (val: number) => {
    setVibratoDepth(val)
    microtonalVocalService.setConfig({ vibratoDepth: val })
  }

  const handleDriftChange = (val: number) => {
    setHumanDrift(val)
    microtonalVocalService.setConfig({ humanizeDrift: val })
  }

  const handleAudition = () => {
    setIsAuditioning(true)
    microtonalVocalService.auditionHarmony(scaleId, vowelId, density)
    setTimeout(() => setIsAuditioning(false), 2400)
  }

  const cardClass = isDark
    ? 'border-white/10 bg-white/[0.03] text-zinc-100'
    : 'border-white/80 bg-white/70 text-slate-800 shadow-sm'

  return (
    <div className={`p-3.5 rounded-3xl border backdrop-blur-md transition-all duration-200 ${cardClass}`}>
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
        >
          <Mic className="w-4 h-4 text-orange-400" />
          <span className="text-xs font-bold tracking-tight">AI Microtonal Vocal Harmony Arranger</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 font-medium">
            Formant Filter Banks
          </span>
          {isCollapsed ? <ChevronDown className="w-3.5 h-3.5 opacity-60" /> : <ChevronUp className="w-3.5 h-3.5 opacity-60" />}
        </button>

        <div className="flex items-center gap-2">
          {/* Active Status Switch */}
          <button
            onClick={handleToggleActive}
            title={isActive ? 'Vocal Harmony is active on the Atmosphere/Vocal stem' : 'Enable Vocal Harmony on Vocal stem'}
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono border font-bold flex items-center gap-1 cursor-pointer transition ${
              isActive
                ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
                : 'border-zinc-700 bg-zinc-800/40 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
            <span>{isActive ? 'Stem Routing Active' : 'Muted'}</span>
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="mt-3 space-y-3">
          {/* Microtonal Tuning Scale Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-orange-400" />
                Microtonal Scale Tuning
              </span>
              <span className="text-[10px] font-mono opacity-60">{activeScale.region}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {(Object.keys(MICROTONAL_SCALES) as MicrotonalScaleId[]).map((id) => {
                const s = MICROTONAL_SCALES[id]
                const isSelected = scaleId === id
                return (
                  <button
                    key={id}
                    onClick={() => handleScaleChange(id)}
                    className={`px-2 py-1.5 rounded-xl text-[10px] font-medium border text-left cursor-pointer transition ${
                      isSelected
                        ? isDark
                          ? 'border-orange-500 bg-orange-500/20 text-orange-300 font-bold'
                          : 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                        : isDark
                        ? 'border-white/10 bg-white/5 text-zinc-300 hover:border-orange-500/40'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-400'
                    }`}
                  >
                    <div className="font-bold truncate">{s.name}</div>
                    <div className="text-[9px] opacity-65 truncate">{s.region}</div>
                  </button>
                )
              })}
            </div>
            <div className={`mt-1.5 p-2 rounded-xl text-[10px] border ${isDark ? 'bg-black/30 border-white/5 text-zinc-400' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
              <span className="font-semibold text-orange-400">{activeScale.name}: </span>
              {activeScale.description}
            </div>
          </div>

          {/* Formant Vowel & Density Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Formant Vowels */}
            <div>
              <div className="text-[11px] font-semibold text-zinc-300 mb-1.5 flex items-center justify-between">
                <span>Vocal Formant Vowel</span>
                <span className="text-[9px] font-mono opacity-60">F1:{activeVowel.f1}Hz F2:{activeVowel.f2}Hz</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {FORMANT_VOWELS.map((v) => {
                  const isSelected = vowelId === v.id
                  return (
                    <button
                      key={v.id}
                      onClick={() => handleVowelChange(v.id)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] border cursor-pointer transition ${
                        isSelected
                          ? isDark
                            ? 'border-orange-500 bg-orange-500/20 text-orange-300 font-bold'
                            : 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                          : isDark
                          ? 'border-white/10 bg-white/5 text-zinc-400 hover:text-white'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      {v.name}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Harmony Density */}
            <div>
              <div className="text-[11px] font-semibold text-zinc-300 mb-1.5 flex items-center justify-between">
                <span>Choir Harmony Density</span>
                <span className="text-[9px] font-mono opacity-60">{density}</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {(['solo', 'duet', 'triad', 'choir'] as VocalDensity[]).map((d) => {
                  const isSelected = density === d
                  const labels: Record<VocalDensity, string> = {
                    solo: 'Solo (1)',
                    duet: 'Duet (2)',
                    triad: 'Triad (3)',
                    choir: 'Choir (4)'
                  }
                  return (
                    <button
                      key={d}
                      onClick={() => handleDensityChange(d)}
                      className={`py-1 rounded-lg text-[10px] border font-medium text-center cursor-pointer transition ${
                        isSelected
                          ? isDark
                            ? 'border-orange-500 bg-orange-500/20 text-orange-300 font-bold'
                            : 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                          : isDark
                          ? 'border-white/10 bg-white/5 text-zinc-400 hover:text-white'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      {labels[d]}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Sliders & Audition Footer */}
          <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-4 text-[10px] opacity-80">
              {/* Vibrato Depth */}
              <div className="flex items-center gap-1.5">
                <span>Vibrato:</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={vibratoDepth}
                  onChange={(e) => handleVibratoChange(Number(e.target.value))}
                  className="w-16 h-1 accent-orange-500 cursor-pointer"
                  title={`Vibrato LFO: ${vibratoDepth}%`}
                />
                <span className="font-mono text-[9px]">{vibratoDepth}%</span>
              </div>

              {/* Human Micro-Drift */}
              <div className="flex items-center gap-1.5">
                <span>Micro-Drift:</span>
                <input
                  type="range"
                  min="0"
                  max="12"
                  value={humanDrift}
                  onChange={(e) => handleDriftChange(Number(e.target.value))}
                  className="w-16 h-1 accent-orange-500 cursor-pointer"
                  title={`Pitch Fluctuations: ±${humanDrift} cents`}
                />
                <span className="font-mono text-[9px]">±{humanDrift}¢</span>
              </div>
            </div>

            {/* Audition Button */}
            <button
              onClick={handleAudition}
              disabled={isAuditioning}
              className={`px-3 py-1.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 cursor-pointer transition ${
                isAuditioning
                  ? 'opacity-60 cursor-wait bg-orange-500/20 text-orange-400'
                  : isDark
                  ? 'border-orange-500/40 bg-orange-500/15 text-orange-300 hover:bg-orange-500/25'
                  : 'border-indigo-400 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
              }`}
            >
              <Play className="w-3 h-3 fill-current" />
              <span>{isAuditioning ? 'Chanting...' : 'Audition Microtonal Vocal'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
