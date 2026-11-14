import React, { useEffect, useState, useRef } from 'react'
import { FlChannel, flEngine } from '@/services/flEngine'
import { Sliders, Volume2 } from 'lucide-react'

interface DawMixerProps {
  isDark: boolean
  channels: FlChannel[]
  masterVolume: number
  selectedChannelId: string
  onUpdateChannel: (channelId: string, updates: Partial<FlChannel>) => void
  onUpdateMasterVolume: (val: number) => void
  onSelectChannel: (channelId: string) => void
}

export const DawMixer: React.FC<DawMixerProps> = ({
  isDark,
  channels,
  masterVolume,
  selectedChannelId,
  onUpdateChannel,
  onUpdateMasterVolume,
  onSelectChannel
}) => {
  // Real-time animated peak levels (0-100)
  const [levels, setLevels] = useState<Record<string, number>>({})
  const [masterLevel, setMasterLevel] = useState<number>(0)
  const animFrameRef = useRef<number | null>(null)

  useEffect(() => {
    const updateMeters = () => {
      const nextLevels: Record<string, number> = {}
      channels.forEach((ch) => {
        nextLevels[ch.id] = flEngine.getChannelMeter(ch.id)
      })
      setLevels(nextLevels)
      setMasterLevel(flEngine.getMasterMeter())
      animFrameRef.current = requestAnimationFrame(updateMeters)
    }

    animFrameRef.current = requestAnimationFrame(updateMeters)
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
    }
  }, [channels])

  return (
    <div
      className={`rounded-2xl border flex flex-col overflow-hidden select-none shadow-md ${
        isDark ? 'border-zinc-800 bg-[#161820]' : 'border-slate-200 bg-white'
      }`}
    >
      {/* Mixer Header */}
      <div
        className={`px-3 py-2 border-b flex items-center justify-between text-xs font-bold ${
          isDark ? 'border-zinc-800 bg-[#1b1e28] text-zinc-300' : 'border-slate-200 bg-slate-50 text-slate-700'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-sky-400 font-extrabold flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5" />
            Mixer Console & DSP Inserts
          </span>
          <span className="text-[10px] font-mono text-zinc-400">
            Real-Time Analyser Peak Meters & Dynamic Inserts
          </span>
        </div>
      </div>

      {/* Channel Strips Container */}
      <div className="flex items-stretch divide-x divide-zinc-800/40 p-3 overflow-x-auto gap-1">
        {/* MASTER CHANNEL STRIP */}
        <div
          className={`w-32 shrink-0 rounded-xl p-2.5 flex flex-col items-center justify-between border ${
            isDark
              ? 'border-orange-500/30 bg-orange-950/20 text-zinc-200'
              : 'border-indigo-200 bg-indigo-50/50 text-slate-800'
          }`}
        >
          {/* Header */}
          <div className="text-center w-full mb-2">
            <span className="text-[10px] font-mono font-extrabold text-orange-400 uppercase tracking-widest block">
              MASTER
            </span>
            <span className="text-[9px] font-mono opacity-50 block">BUS 0</span>
          </div>

          {/* Fader & Peak Meter Side-by-Side */}
          <div className="flex-1 flex items-center justify-center gap-2 w-full my-2">
            {/* Real-time Peak Meter Bar */}
            <div className="w-3.5 h-36 bg-zinc-950 rounded-full overflow-hidden border border-zinc-700/60 p-0.5 flex flex-col justify-end">
              <div
                className="w-full rounded-full transition-all duration-75"
                style={{
                  height: `${masterLevel}%`,
                  background:
                    masterLevel > 80
                      ? 'linear-gradient(to top, #10b981 0%, #f59e0b 60%, #ef4444 100%)'
                      : 'linear-gradient(to top, #10b981 0%, #f59e0b 100%)'
                }}
              />
            </div>

            {/* Vertical Volume Fader */}
            <div className="flex flex-col items-center h-36 justify-between">
              <span className="text-[8px] font-mono text-zinc-400 font-bold">+6dB</span>
              <input
                type="range"
                min={0}
                max={100}
                value={masterVolume}
                onChange={(e) => onUpdateMasterVolume(Number(e.target.value))}
                className="h-28 w-2 accent-orange-500 cursor-pointer appearance-slider-vertical"
                style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
              />
              <span className="text-[8px] font-mono text-zinc-400 font-bold">-inf</span>
            </div>
          </div>

          {/* Readout */}
          <div className="w-full text-center mt-2 border-t pt-1.5 border-zinc-700/40">
            <span className="text-[10px] font-mono font-bold text-orange-400">
              {masterVolume}%
            </span>
            <span className="text-[8px] font-mono opacity-50 block">OUTPUT</span>
          </div>
        </div>

        {/* INSTRUMENT CHANNEL STRIPS */}
        {channels.map((ch, idx) => {
          const isSelected = ch.id === selectedChannelId
          const level = levels[ch.id] || 0

          return (
            <div
              key={ch.id}
              onClick={() => onSelectChannel(ch.id)}
              className={`w-36 shrink-0 rounded-xl p-2.5 flex flex-col items-center justify-between border cursor-pointer transition ${
                isSelected
                  ? isDark
                    ? 'border-sky-500/60 bg-sky-500/10 shadow-sm'
                    : 'border-indigo-500 bg-indigo-50 shadow-sm'
                  : isDark
                  ? 'border-zinc-800/80 bg-zinc-900/60 hover:bg-zinc-800/50'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
              }`}
            >
              {/* Channel Strip Header */}
              <div className="w-full text-center mb-1">
                <span className="text-sm block">{ch.icon}</span>
                <span className="text-[11px] font-bold truncate block">{ch.name}</span>
                <span className="text-[9px] font-mono text-zinc-400">CH {idx + 1}</span>
              </div>

              {/* Mute & Solo Buttons */}
              <div className="flex items-center gap-1 my-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onUpdateChannel(ch.id, { muted: !ch.muted })
                  }}
                  className={`w-5 h-5 rounded text-[9px] font-bold uppercase transition ${
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
                  className={`w-5 h-5 rounded text-[9px] font-bold uppercase transition ${
                    ch.solo
                      ? 'bg-amber-400 text-zinc-950 font-black'
                      : isDark
                      ? 'bg-zinc-800 text-zinc-400 hover:text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  S
                </button>
              </div>

              {/* Pan Slider */}
              <div className="w-full flex flex-col items-center my-1 px-1">
                <div className="w-full flex justify-between text-[8px] font-mono text-zinc-400">
                  <span>PAN</span>
                  <span className="font-bold">
                    {ch.pan === 0 ? 'C' : ch.pan > 0 ? `R${ch.pan}` : `L${Math.abs(ch.pan)}`}
                  </span>
                </div>
                <input
                  type="range"
                  min={-100}
                  max={100}
                  value={ch.pan}
                  onChange={(e) => {
                    e.stopPropagation()
                    onUpdateChannel(ch.id, { pan: Number(e.target.value) })
                  }}
                  className="w-full h-1 accent-orange-500 cursor-pointer"
                />
              </div>

              {/* Fader & Peak Meter Side-by-Side */}
              <div className="flex-1 flex items-center justify-center gap-2 w-full my-2">
                {/* Channel Peak Meter */}
                <div className="w-2.5 h-32 bg-zinc-950 rounded-full overflow-hidden border border-zinc-700/60 p-0.5 flex flex-col justify-end">
                  <div
                    className="w-full rounded-full transition-all duration-75"
                    style={{
                      height: `${level}%`,
                      background:
                        level > 80
                          ? 'linear-gradient(to top, #10b981 0%, #f59e0b 60%, #ef4444 100%)'
                          : 'linear-gradient(to top, #10b981 0%, #f59e0b 100%)'
                    }}
                  />
                </div>

                {/* Vertical Volume Fader */}
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={ch.volume}
                  onChange={(e) => {
                    e.stopPropagation()
                    onUpdateChannel(ch.id, { volume: Number(e.target.value) })
                  }}
                  className="h-28 w-2 accent-amber-400 cursor-pointer"
                  style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                />
              </div>

              {/* Readout */}
              <div className="text-[9px] font-mono text-zinc-400 flex items-center gap-1 mb-2">
                <Volume2 className="w-2.5 h-2.5 opacity-60" />
                <span className="font-bold text-amber-400">{ch.volume}%</span>
              </div>

              {/* Built-in DSP Effects Slot */}
              <div className={`w-full p-1.5 rounded-lg border text-[9px] font-mono space-y-1.5 ${
                isDark ? 'border-zinc-800 bg-zinc-950/60' : 'border-slate-200 bg-white'
              }`}>
                {/* Effect 1: Low-Pass Filter */}
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 font-bold">LP FILTER</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onUpdateChannel(ch.id, {
                        effect: { ...ch.effect, filterEnabled: !ch.effect.filterEnabled }
                      })
                    }}
                    className={`px-1 py-0.2 rounded text-[8px] font-bold ${
                      ch.effect.filterEnabled
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {ch.effect.filterEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>
                {ch.effect.filterEnabled && (
                  <input
                    type="range"
                    min={300}
                    max={12000}
                    value={ch.effect.filterCutoff}
                    onChange={(e) => {
                      e.stopPropagation()
                      onUpdateChannel(ch.id, {
                        effect: { ...ch.effect, filterCutoff: Number(e.target.value) }
                      })
                    }}
                    className="w-full h-1 accent-emerald-400 cursor-pointer"
                    title={`Cutoff: ${ch.effect.filterCutoff}Hz`}
                  />
                )}

                {/* Effect 2: Delay Toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 font-bold">DELAY</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onUpdateChannel(ch.id, {
                        effect: { ...ch.effect, delayEnabled: !ch.effect.delayEnabled }
                      })
                    }}
                    className={`px-1 py-0.2 rounded text-[8px] font-bold ${
                      ch.effect.delayEnabled
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {ch.effect.delayEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

