import { useState } from 'react'
import { Volume2, Play, Sparkles, ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { foleySynthesisService, FOLEY_PRESET_CUES, FoleyCuePreset, SynthesizedFoleyResult } from '@/services/foleySynthesisService'

export interface DroppedFoleyCue {
  id: string
  label: string
  cue: string
  duration: number
}

interface FoleySynthesizerPanelProps {
  isDark: boolean
  onDropFoley?: (cue: DroppedFoleyCue) => void
}

export function FoleySynthesizerPanel({ isDark, onDropFoley }: FoleySynthesizerPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [textCue, setTextCue] = useState('')
  const [volume, setVolume] = useState(85)
  const [isPlaying, setIsPlaying] = useState(false)
  const [lastResult, setLastResult] = useState<SynthesizedFoleyResult | null>(null)
  const [activePreset, setActivePreset] = useState<string | null>(null)
  const [addedNotice, setAddedNotice] = useState<string | null>(null)

  const handlePlayCue = async (cueToPlay = textCue) => {
    if (!cueToPlay.trim()) return
    setIsPlaying(true)
    try {
      const result = await foleySynthesisService.synthesizeAndPlay(cueToPlay, volume / 100)
      setLastResult(result)
    } catch (err) {
      console.error('Foley synthesis error:', err)
    } finally {
      setIsPlaying(false)
    }
  }

  const handleSelectPreset = async (preset: FoleyCuePreset) => {
    setActivePreset(preset.id)
    setTextCue(preset.cue)
    setIsPlaying(true)
    try {
      const result = await foleySynthesisService.synthesizeAndPlay(preset.cue, volume / 100)
      setLastResult(result)
    } catch (err) {
      console.error('Foley preset error:', err)
    } finally {
      setIsPlaying(false)
    }
  }

  const handleDropToTimeline = () => {
    if (!onDropFoley) return
    const cueName = activePreset
      ? FOLEY_PRESET_CUES.find((p) => p.id === activePreset)?.label || 'Cinematic Foley'
      : textCue.slice(0, 24) || 'Custom Foley'
    const dur = lastResult ? lastResult.duration : 2.0

    onDropFoley({
      id: `foley-${Date.now()}`,
      label: cueName,
      cue: textCue || cueName,
      duration: dur
    })

    setAddedNotice(`Dropped "${cueName}" onto timeline`)
    setTimeout(() => setAddedNotice(null), 2500)
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
          <span className="text-base">⚡</span>
          <span className="text-xs font-bold tracking-tight">Zero-Shot Cinematic Foley Synthesizer</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 font-medium">
            Native Web Audio DSP
          </span>
          {isCollapsed ? <ChevronDown className="w-3.5 h-3.5 opacity-60" /> : <ChevronUp className="w-3.5 h-3.5 opacity-60" />}
        </button>

        <div className="flex items-center gap-2">
          {addedNotice && (
            <span className="text-[10px] font-mono text-emerald-400 font-semibold animate-pulse">
              ✓ {addedNotice}
            </span>
          )}
          <span className="text-[10px] opacity-60 font-mono hidden sm:inline">Text-to-Acoustic SFX</span>
        </div>
      </div>

      {!isCollapsed && (
        <div className="mt-3 space-y-3">
          {/* Quick Preset Chips */}
          <div className="flex flex-wrap gap-1.5">
            {FOLEY_PRESET_CUES.map((p) => {
              const isSelected = activePreset === p.id
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectPreset(p)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-medium border flex items-center gap-1 cursor-pointer transition ${
                    isSelected
                      ? isDark
                        ? 'border-orange-500 bg-orange-500/20 text-orange-300 font-bold'
                        : 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                      : isDark
                      ? 'border-white/10 bg-white/5 text-zinc-300 hover:border-orange-500/40'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-400'
                  }`}
                >
                  <span>{p.icon}</span>
                  <span>{p.label}</span>
                </button>
              )
            })}
          </div>

          {/* Custom Cue Input & Action Row */}
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                value={textCue}
                onChange={(e) => {
                  setTextCue(e.target.value)
                  setActivePreset(null)
                }}
                onKeyDown={(e) => e.key === 'Enter' && handlePlayCue()}
                placeholder="Type any acoustic cue (e.g. 'blade ringing steel clash', 'creepy wooden door', 'sub drop')..."
                className={`w-full text-xs px-3 py-2 rounded-xl border focus:outline-none ${
                  isDark
                    ? 'bg-black/60 border-white/10 text-white placeholder:text-zinc-600'
                    : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
                }`}
              />
              <Sparkles className="w-3.5 h-3.5 absolute right-3 top-2.5 opacity-40 pointer-events-none" />
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
              {/* Volume Slider */}
              <div className="flex items-center gap-1 text-[10px] opacity-75">
                <Volume2 className="w-3 h-3 text-orange-400" />
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-16 h-1 accent-orange-500 cursor-pointer"
                  title={`Foley Volume: ${volume}%`}
                />
              </div>

              {/* Audition Play Button */}
              <button
                onClick={() => handlePlayCue()}
                disabled={isPlaying || !textCue.trim()}
                className={`px-3 py-1.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 cursor-pointer transition ${
                  isPlaying
                    ? 'opacity-50 cursor-wait bg-orange-500/20 text-orange-400'
                    : isDark
                    ? 'border-orange-500/40 bg-orange-500/15 text-orange-300 hover:bg-orange-500/25'
                    : 'border-indigo-400 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                }`}
              >
                <Play className="w-3 h-3 fill-current" />
                <span>{isPlaying ? 'Synthesizing...' : 'Audition'}</span>
              </button>

              {/* Drop to Timeline Button */}
              {onDropFoley && (
                <button
                  onClick={handleDropToTimeline}
                  disabled={!textCue.trim()}
                  title="Drop this synthesized Foley sound effect onto the current video timeline playhead"
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-zinc-950 font-bold text-xs flex items-center gap-1 cursor-pointer hover:brightness-110 transition shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Drop to Timeline</span>
                </button>
              )}
            </div>
          </div>

          {/* Last Synthesis Acoustic Analysis */}
          {lastResult && (
            <div className={`p-2 rounded-xl border text-[11px] flex flex-wrap items-center justify-between gap-2 ${
              isDark ? 'bg-black/40 border-white/5 text-zinc-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-orange-400 font-mono">[{lastResult.category}]</span>
                <span className="opacity-80 font-serif italic">{lastResult.description}</span>
              </div>
              <span className="text-[10px] font-mono opacity-60">
                Duration: {lastResult.duration.toFixed(1)}s • Zero-shot Web Audio DSP
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
