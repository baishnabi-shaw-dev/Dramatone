import React from 'react'
import {
  FlChannel,
  FlPattern,
  flEngine
} from '@/services/flEngine'
import { INSTRUMENT_OPTIONS } from '@/components/daw/DawPianoRoll'
import { DawInstrument } from '@/services/audioEngine'
import { Plus, Volume2 } from 'lucide-react'

interface DawChannelRackProps {
  isDark: boolean
  patterns: FlPattern[]
  activePatternId: string
  currentStep: number
  selectedChannelId: string
  onSelectPattern: (patternId: string) => void
  onAddPattern: () => void
  onAddChannel?: () => void
  onToggleStep: (channelId: string, stepIndex: number) => void
  onUpdateChannel: (channelId: string, updates: Partial<FlChannel>) => void
  onOpenPianoRoll: (channelId: string) => void
  onSelectChannel: (channelId: string) => void
}

export const DawChannelRack: React.FC<DawChannelRackProps> = ({
  isDark,
  patterns,
  activePatternId,
  currentStep,
  selectedChannelId,
  onSelectPattern,
  onAddPattern,
  onAddChannel,
  onToggleStep,
  onUpdateChannel,
  onOpenPianoRoll,
  onSelectChannel
}) => {
  const activePattern = patterns.find((p) => p.id === activePatternId) || patterns[0]

  return (
    <div
      className={`rounded-2xl border flex flex-col overflow-hidden select-none shadow-md ${
        isDark ? 'border-zinc-800 bg-[#161820]' : 'border-slate-200 bg-white'
      }`}
    >
      {/* Channel Rack Header: Pattern Selector & Controls */}
      <div
        className={`px-3 py-2 border-b flex items-center justify-between text-xs font-bold ${
          isDark ? 'border-zinc-800 bg-[#1b1e28] text-zinc-300' : 'border-slate-200 bg-slate-50 text-slate-700'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-orange-400 font-extrabold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            Channel Rack
          </span>

          {/* Pattern Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto max-w-sm">
            {patterns.map((pat) => (
              <button
                key={pat.id}
                onClick={() => onSelectPattern(pat.id)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-mono transition cursor-pointer shrink-0 ${
                  pat.id === activePatternId
                    ? 'bg-orange-500 text-zinc-950 font-bold shadow-sm'
                    : isDark
                    ? 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'
                    : 'bg-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                {pat.name}
              </button>
            ))}
            <button
              onClick={onAddPattern}
              title="Add New Pattern"
              className={`p-1 rounded-lg border text-zinc-400 hover:text-white cursor-pointer ${
                isDark ? 'border-zinc-700 bg-zinc-800' : 'border-slate-300 bg-slate-100'
              }`}
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="text-[10px] font-mono text-zinc-400 flex items-center gap-2">
          <span className="hidden sm:inline">16 Steps (4 Beats)</span>
          <button
            onClick={() => {
              onSelectChannel('all')
              onOpenPianoRoll('all')
            }}
            className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300 hover:bg-amber-400 hover:text-zinc-950 border border-amber-400/40 transition cursor-pointer flex items-center gap-1"
            title="Open Master Piano Roll showing all channels together"
          >
            <span>🎼</span>
            <span>All Channels Piano Roll</span>
          </button>
        </div>
      </div>

      {/* 16-Step Beat Numbers Bar */}
      <div
        className={`flex items-center px-3 py-1 border-b text-[10px] font-mono font-bold ${
          isDark ? 'border-zinc-800/80 bg-zinc-900/60 text-zinc-400' : 'border-slate-200 bg-slate-100 text-slate-500'
        }`}
      >
        {/* Left Spacer matching Channel Controls width */}
        <div className="w-56 sm:w-64 shrink-0 flex items-center justify-between pr-2">
          <span>INSTRUMENT CHANNEL</span>
          <span className="hidden sm:inline text-[9px] text-zinc-400">PAN / VOL / ROLL</span>
        </div>

        {/* 16 Step Markers Grouped into 4 Beats */}
        <div
          className="flex-1 grid gap-1 min-w-[340px]"
          style={{ gridTemplateColumns: 'repeat(16, minmax(0, 1fr))' }}
        >
          {Array.from({ length: 16 }).map((_, stepIdx) => {
            const beat = Math.floor(stepIdx / 4) + 1
            const isFirstInBeat = stepIdx % 4 === 0
            const isPlayingStep = currentStep === stepIdx
            return (
              <div
                key={stepIdx}
                className={`text-center py-0.5 rounded text-[9px] font-mono font-bold transition ${
                  isPlayingStep
                    ? 'bg-amber-400 text-zinc-950 shadow-sm'
                    : isFirstInBeat
                    ? 'text-orange-400 font-extrabold'
                    : 'text-zinc-400'
                }`}
              >
                {isFirstInBeat ? `${beat}` : `.${(stepIdx % 4) + 1}`}
              </div>
            )
          })}
        </div>
      </div>

      {/* Channel Rows */}
      <div className="divide-y divide-zinc-800/40 p-2 space-y-1.5 overflow-x-auto">
        {activePattern.channels.map((ch) => {
          const isSelected = ch.id === selectedChannelId
          return (
            <div
              key={ch.id}
              onClick={() => onSelectChannel(ch.id)}
              className={`flex items-center gap-2 p-1.5 rounded-xl border transition ${
                isSelected
                  ? isDark
                    ? 'border-orange-500/50 bg-orange-500/10 shadow-sm'
                    : 'border-indigo-400 bg-indigo-50/70 shadow-sm'
                  : isDark
                  ? 'border-zinc-800/60 bg-zinc-900/40 hover:bg-zinc-800/40'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
              }`}
            >
              {/* Channel Header (Name, Audition, Mute/Solo, Pan, Vol, Piano Roll Button) */}
              <div className="w-56 sm:w-64 shrink-0 flex items-center gap-1.5">
                {/* Mute & Solo Toggles */}
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onUpdateChannel(ch.id, { muted: !ch.muted })
                    }}
                    title={ch.muted ? 'Unmute Channel' : 'Mute Channel'}
                    className={`w-5 h-5 rounded text-[9px] font-bold uppercase cursor-pointer flex items-center justify-center transition ${
                      ch.muted
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : isDark
                        ? 'bg-zinc-800 text-zinc-400 hover:text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    M
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onUpdateChannel(ch.id, { solo: !ch.solo })
                    }}
                    title={ch.solo ? 'Disable Solo' : 'Solo Channel'}
                    className={`w-5 h-5 rounded text-[9px] font-bold uppercase cursor-pointer flex items-center justify-center transition ${
                      ch.solo
                        ? 'bg-amber-400 text-zinc-950 font-black shadow-sm'
                        : isDark
                        ? 'bg-zinc-800 text-zinc-400 hover:text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    S
                  </button>
                </div>

                {/* Instrument Name (Click to audition sound) & Voice Selector */}
                <div className="flex-1 min-w-0 relative flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectChannel(ch.id)
                      const auditionPitch = ch.instrument === 'bass' || ch.instrument === 'subBass' || ch.instrument === 'bassGuitar' || ch.instrument === 'cello' ? 48 : 60
                      flEngine.triggerChannelSound(ch, undefined, auditionPitch, 0.85)
                    }}
                    title="Click to audition instrument sound"
                    className={`px-2 py-1 rounded-lg border text-left flex items-center gap-1.5 flex-1 min-w-0 cursor-pointer transition ${
                      isDark
                        ? 'border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200'
                        : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <span className="text-xs shrink-0">{ch.icon}</span>
                    <span className="text-xs font-semibold truncate leading-tight flex-1">
                      {ch.name}
                    </span>
                    {/* Notes indicator if piano roll notes exist */}
                    {ch.notes && ch.notes.length > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" title="Has Piano Roll notes" />
                    )}
                  </button>

                  {/* Quick Voice Switcher to 16 Solo Instruments */}
                  <select
                    value={ch.instrument || ch.type}
                    onChange={(e) => {
                      e.stopPropagation()
                      const val = e.target.value
                      const matched = INSTRUMENT_OPTIONS.find((opt) => opt.id === val)
                      if (matched) {
                        onUpdateChannel(ch.id, {
                          name: matched.label,
                          icon: matched.icon,
                          instrument: matched.id as DawInstrument,
                          type: 'custom'
                        })
                      }
                    }}
                    title="Change channel instrument voice (16 Solo Instruments)"
                    className={`w-4 h-6 opacity-40 hover:opacity-100 rounded text-[9px] bg-transparent cursor-pointer focus:outline-none shrink-0 ${
                      isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-500'
                    }`}
                  >
                    <option value="" disabled>Change Voice...</option>
                    <optgroup label="Default Drums">
                      <option value="kick">🥁 Kick Drum</option>
                      <option value="snare">🪘 Snare Drum</option>
                      <option value="hihat">🥢 Closed Hat</option>
                    </optgroup>
                    <optgroup label="16 Solo Instruments">
                      {INSTRUMENT_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id} className={isDark ? 'bg-zinc-900 text-white' : 'bg-white text-slate-900'}>
                          {opt.icon} {opt.label} ({opt.category})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Pan Slider */}
                <div
                  className="flex flex-col items-center w-10 shrink-0"
                  title={`Pan: ${ch.pan > 0 ? `R${ch.pan}` : ch.pan < 0 ? `L${Math.abs(ch.pan)}` : 'Center'}`}
                >
                  <span className="text-[8px] font-mono text-zinc-400 leading-none">
                    {ch.pan === 0 ? 'C' : ch.pan > 0 ? `R${ch.pan}` : `L${Math.abs(ch.pan)}`}
                  </span>
                  <input
                    type="range"
                    min={-100}
                    max={100}
                    value={ch.pan}
                    onChange={(e) => {
                      e.stopPropagation()
                      onUpdateChannel(ch.id, { pan: Number(e.target.value) })
                    }}
                    className="w-10 h-1 accent-orange-500 cursor-pointer"
                  />
                </div>

                {/* Volume Slider */}
                <div
                  className="flex flex-col items-center w-12 shrink-0"
                  title={`Volume: ${ch.volume}%`}
                >
                  <span className="text-[8px] font-mono text-zinc-400 leading-none flex items-center gap-0.5">
                    <Volume2 className="w-2.5 h-2.5 opacity-60" />
                    {ch.volume}
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={ch.volume}
                    onChange={(e) => {
                      e.stopPropagation()
                      onUpdateChannel(ch.id, { volume: Number(e.target.value) })
                    }}
                    className="w-12 h-1 accent-amber-400 cursor-pointer"
                  />
                </div>

                {/* Piano Roll Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelectChannel(ch.id)
                    onOpenPianoRoll(ch.id)
                  }}
                  title={`Open Piano Roll for ${ch.name}`}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer transition shrink-0 ${
                    isDark
                      ? 'bg-zinc-800 hover:bg-orange-500 text-zinc-300 hover:text-zinc-950'
                      : 'bg-slate-200 hover:bg-indigo-600 text-slate-700 hover:text-white'
                  }`}
                >
                  🎹
                </button>
              </div>

              {/* 16-Step Sequencer Button Grid */}
              <div
                className="flex-1 grid gap-1 min-w-[340px]"
                style={{ gridTemplateColumns: 'repeat(16, minmax(0, 1fr))' }}
              >
                {ch.steps.map((isActive, stepIdx) => {
                  const beat = Math.floor(stepIdx / 4)
                  const isAmberBeat = beat === 0 || beat === 2 // Alternating dark red/amber beat vs dark grey
                  const isCurrent = currentStep === stepIdx

                  return (
                    <button
                      key={stepIdx}
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleStep(ch.id, stepIdx)
                        if (!isActive) {
                          // Audition note trigger
                          flEngine.triggerChannelSound(ch, undefined, 60, 0.8)
                        }
                      }}
                      title={`Step ${stepIdx + 1} (Beat ${beat + 1}.${(stepIdx % 4) + 1}) - Click to toggle`}
                      className={`h-7 sm:h-8 rounded-md border flex items-center justify-center font-mono text-[10px] font-bold cursor-pointer transition relative ${
                        isActive
                          ? isAmberBeat
                            ? 'bg-amber-400 text-zinc-950 border-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.5)] font-black'
                            : 'bg-orange-500 text-zinc-950 border-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.5)] font-black'
                          : isAmberBeat
                          ? isDark
                            ? 'bg-amber-950/40 border-amber-900/50 hover:bg-amber-900/50 text-amber-500/40'
                            : 'bg-amber-100/70 border-amber-200 hover:bg-amber-200 text-amber-800/40'
                          : isDark
                          ? 'bg-zinc-800/60 border-zinc-700/60 hover:bg-zinc-700/60 text-zinc-400'
                          : 'bg-slate-200 border-slate-300 hover:bg-slate-300 text-slate-500'
                      }`}
                    >
                      {/* Active inner core indicator */}
                      {isActive && (
                        <div className="w-2.5 h-2.5 rounded-sm bg-zinc-950/40 shadow-inner" />
                      )}

                      {/* Playhead LED Cursor Scan */}
                      {isCurrent && (
                        <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-1 bg-emerald-400 rounded-full animate-ping" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Add Solo Instrument Channel Button */}
        {onAddChannel && (
          <div className="pt-2 px-1 flex items-center justify-between border-t border-zinc-800/40">
            <button
              onClick={onAddChannel}
              className={`px-3 py-1.5 rounded-xl border text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition ${
                isDark
                  ? 'border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 shadow-sm'
                  : 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800'
              }`}
            >
              <Plus className="w-3.5 h-3.5 text-orange-400" />
              <span>Add Solo Voice Channel</span>
            </button>
            <span className="text-[10px] font-mono text-zinc-400">
              {activePattern.channels.length} Channels • 16-Step Grid
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
