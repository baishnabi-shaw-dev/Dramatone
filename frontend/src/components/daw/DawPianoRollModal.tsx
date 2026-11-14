import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { FlChannel, FlNote, flEngine } from '@/services/flEngine'
import { Music, X, Trash2, Layers, Eye, EyeOff, LocateFixed } from 'lucide-react'

interface DawPianoRollModalProps {
  isDark: boolean
  channel: FlChannel
  allChannels?: FlChannel[]
  selectedChannelId?: string
  currentStep: number
  onClose: () => void
  onUpdateChannel: (channelId: string, updates: Partial<FlChannel>) => void
  onToggleStep?: (channelId: string, stepIndex: number) => void
  onSelectChannel?: (channelId: string) => void
}

type OctaveRange = 'all' | 'bass' | 'mid' | 'high'

const OCTAVE_RANGES: Record<OctaveRange, { label: string; min: number; max: number }> = {
  bass: { label: 'Bass (C2–B3)', min: 36, max: 59 },
  mid: { label: 'Mid (C3–C5)', min: 48, max: 72 },
  high: { label: 'High (C4–C6)', min: 60, max: 84 },
  all: { label: 'All Keys (C1–C7)', min: 24, max: 96 }
}

function getMidiInfo(midi: number) {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const semitone = midi % 12
  const octave = Math.floor(midi / 12) - 1
  const name = `${noteNames[semitone]}${octave}`
  const isBlack = [1, 3, 6, 8, 10].includes(semitone)
  const isRootC = semitone === 0
  return { name, isBlack, isRootC, octave, semitone }
}

const getDrumPitch = (type: string, id: string): number => {
  if (type === 'kick' || id === 'ch-kick') return 36 // C2
  if (type === 'snare' || id === 'ch-snare') return 38 // D2
  if (type === 'hihat' || id === 'ch-hihat') return 42 // F#2
  return 40 // E2 default
}

interface DisplayNote extends FlNote {
  channelId: string
  channelName: string
  channelIcon: string
  channelColor: string
  isStepTrigger?: boolean
  isGhost?: boolean
}

export const DawPianoRollModal: React.FC<DawPianoRollModalProps> = ({
  isDark,
  channel,
  allChannels,
  selectedChannelId,
  currentStep,
  onClose,
  onUpdateChannel,
  onToggleStep,
  onSelectChannel
}) => {
  const isAllChannels = channel.id === 'all' || selectedChannelId === 'all'

  const channelList = useMemo(() => {
    return allChannels && allChannels.length > 0 ? allChannels : [channel]
  }, [allChannels, channel])

  const [paintChannelId, setPaintChannelId] = useState<string>(() => {
    const defaultPaint = channelList.find((c) => c.type === 'bass' || c.type === 'lead') || channelList[0]
    return defaultPaint ? defaultPaint.id : channel.id
  })

  const [showGhostNotes, setShowGhostNotes] = useState<boolean>(true)

  const isBassChannel =
    channel.type === 'bass' ||
    channel.id === 'ch-bass' ||
    channel.instrument === 'subBass' ||
    channel.instrument === 'bassGuitar'

  const initialFilter = useMemo((): OctaveRange => {
    if (isAllChannels) return 'all'
    const notes = channel.notes || []
    if (notes.length === 0) return isBassChannel ? 'bass' : 'mid'
    const defMin = isBassChannel ? 36 : 48
    const defMax = isBassChannel ? 59 : 72
    const hasOut = notes.some((n) => n.midi < defMin || n.midi > defMax)
    return hasOut ? 'all' : isBassChannel ? 'bass' : 'mid'
  }, [isAllChannels, isBassChannel, channel.notes])

  const [octaveFilter, setOctaveFilter] = useState<OctaveRange>(initialFilter)

  useEffect(() => {
    setOctaveFilter(initialFilter)
  }, [initialFilter])
  const [activeDuration, setActiveDuration] = useState<number>(1)
  const [activeKeys, setActiveKeys] = useState<Set<number>>(new Set())

  const range = OCTAVE_RANGES[octaveFilter]
  const visibleKeys = Array.from(
    { length: range.max - range.min + 1 },
    (_, i) => range.max - i
  ).map((midi) => ({
    midi,
    ...getMidiInfo(midi)
  }))

  // Unified Notes List (combining all channels, step sequencer triggers, and ghost notes)
  const displayNotes: DisplayNote[] = useMemo(() => {
    const list: DisplayNote[] = []

    if (isAllChannels) {
      channelList.forEach((ch) => {
        // Explicit Piano Roll notes
        ;(ch.notes || []).forEach((n) => {
          list.push({
            ...n,
            channelId: ch.id,
            channelName: ch.name,
            channelIcon: ch.icon,
            channelColor: ch.color
          })
        })

        // Step Sequencer drum triggers at standardized GM pitches
        if (ch.type === 'kick' || ch.type === 'snare' || ch.type === 'hihat') {
          const drumPitch = getDrumPitch(ch.type, ch.id)
          ch.steps?.forEach((active, stepIdx) => {
            if (active && !(ch.notes || []).some((n) => n.midi === drumPitch && n.step === stepIdx)) {
              list.push({
                id: `step-${ch.id}-${stepIdx}`,
                midi: drumPitch,
                step: stepIdx,
                duration: 1,
                channelId: ch.id,
                channelName: ch.name,
                channelIcon: ch.icon,
                channelColor: ch.color,
                isStepTrigger: true
              })
            }
          })
        }
      })
      return list
    }

    // Single Channel Active Notes
    ;(channel.notes || []).forEach((n) => {
      list.push({
        ...n,
        channelId: channel.id,
        channelName: channel.name,
        channelIcon: channel.icon,
        channelColor: channel.color
      })
    })

    // Ghost notes from other channels
    if (showGhostNotes && allChannels) {
      allChannels
        .filter((ch) => ch.id !== channel.id)
        .forEach((ch) => {
          ;(ch.notes || []).forEach((n) => {
            list.push({
              ...n,
              channelId: ch.id,
              channelName: ch.name,
              channelIcon: ch.icon,
              channelColor: ch.color,
              isGhost: true
            })
          })

          if (ch.type === 'kick' || ch.type === 'snare' || ch.type === 'hihat') {
            const drumPitch = getDrumPitch(ch.type, ch.id)
            ch.steps?.forEach((active, stepIdx) => {
              if (active && !(ch.notes || []).some((n) => n.midi === drumPitch && n.step === stepIdx)) {
                list.push({
                  id: `ghost-step-${ch.id}-${stepIdx}`,
                  midi: drumPitch,
                  step: stepIdx,
                  duration: 1,
                  channelId: ch.id,
                  channelName: ch.name,
                  channelIcon: ch.icon,
                  channelColor: ch.color,
                  isStepTrigger: true,
                  isGhost: true
                })
              }
            })
          }
        })
    }

    return list
  }, [isAllChannels, channelList, channel, showGhostNotes, allChannels])

  const notesOutOfRangeCount = displayNotes.filter(
    (n) => (!n.isGhost || isAllChannels) && (n.midi < range.min || n.midi > range.max)
  ).length

  const gridScrollRef = useRef<HTMLDivElement>(null)

  const scrollToNotes = useCallback(() => {
    if (!gridScrollRef.current) return
    const targetNotes = displayNotes.filter((n) => !n.isGhost || isAllChannels)
    if (targetNotes.length === 0) return
    const midis = targetNotes.map((n) => n.midi).filter((m) => m >= range.min && m <= range.max)
    if (midis.length === 0) return
    const avgMidi = Math.round(midis.reduce((a, b) => a + b, 0) / midis.length)
    const rowIndex = range.max - avgMidi
    const targetY = Math.max(0, rowIndex * 20 - 140)
    gridScrollRef.current.scrollTo({ top: targetY, behavior: 'smooth' })
  }, [displayNotes, isAllChannels, range])

  // Auto-scroll to center notes when octave changes or channel changes
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToNotes()
    }, 60)
    return () => clearTimeout(timer)
  }, [octaveFilter, channel.id, scrollToNotes])

  // Audition note sound
  const auditionNote = (midi: number, targetCh?: FlChannel) => {
    const ch =
      targetCh ||
      (isAllChannels
        ? channelList.find((c) => c.id === paintChannelId) || channelList[0]
        : channel)
    flEngine.triggerChannelSound(ch, undefined, midi, 0.85, 0.4)
    setActiveKeys((prev) => new Set(prev).add(midi))
    setTimeout(() => {
      setActiveKeys((prev) => {
        const next = new Set(prev)
        next.delete(midi)
        return next
      })
    }, 180)
  }

  // Toggle note placement on grid
  const handleCellClick = (midi: number, step: number) => {
    // 1. Check if an active note exists on this cell
    const existing = displayNotes.find(
      (n) => n.midi === midi && n.step === step && (!n.isGhost || isAllChannels)
    )

    if (existing) {
      // Step sequencer trigger -> toggle off
      if (existing.isStepTrigger) {
        onToggleStep?.(existing.channelId, existing.step)
        return
      }

      // Explicit note -> delete from owning channel
      const targetCh = channelList.find((c) => c.id === existing.channelId) || channel
      const nextNotes = (targetCh.notes || []).filter((n) => n.id !== existing.id)
      onUpdateChannel(targetCh.id, { notes: nextNotes })
      return
    }

    // 2. Place new note in the selected painting channel
    const targetChannel = isAllChannels
      ? channelList.find((c) => c.id === paintChannelId) || channelList[0]
      : channel

    auditionNote(midi, targetChannel)

    const newNote: FlNote = {
      id: `fn-${Date.now()}-${midi}-${step}`,
      midi,
      step,
      duration: activeDuration
    }
    onUpdateChannel(targetChannel.id, { notes: [...(targetChannel.notes || []), newNote] })
  }

  const handleClearNotes = () => {
    if (isAllChannels) {
      if (window.confirm('Clear all notes across ALL channels in this pattern?')) {
        channelList.forEach((c) => onUpdateChannel(c.id, { notes: [] }))
      }
    } else {
      onUpdateChannel(channel.id, { notes: [] })
    }
  }

  return (
    <div
      className={`rounded-2xl border flex flex-col overflow-hidden select-none shadow-2xl animate-in fade-in duration-150 ${
        isDark ? 'border-amber-400/30 bg-[#14161f]' : 'border-slate-300 bg-white'
      }`}
    >
      {/* Piano Roll Header */}
      <div
        className={`px-3 py-2.5 border-b flex flex-wrap items-center justify-between gap-2 text-xs font-bold ${
          isDark ? 'border-zinc-800 bg-[#1b1e28] text-zinc-200' : 'border-slate-200 bg-slate-50 text-slate-800'
        }`}
      >
        <div className="flex items-center gap-2">
          {isAllChannels ? (
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-extrabold flex items-center gap-1.5">
              <span className="text-sm">🎼</span>
              <span>Piano Roll — All Channels (Master View)</span>
            </span>
          ) : (
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-extrabold flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5" />
              <span>Piano Roll — {channel.icon} {channel.name}</span>
            </span>
          )}

          <span className="text-[10px] font-mono text-zinc-400 hidden md:inline">
            {isAllChannels
              ? `(${displayNotes.length} notes across ${channelList.length} channels)`
              : `(${channel.notes?.length || 0} notes placed)`}
          </span>
        </div>

        {/* Center: Octave Range Quick Switcher */}
        <div className="flex items-center gap-1 p-0.5 rounded-lg border border-white/10 bg-black/40 text-[10px] font-mono">
          <Layers className="w-3 h-3 text-orange-400 ml-1 shrink-0" />
          {(['bass', 'mid', 'high', 'all'] as const).map((rKey) => (
            <button
              key={rKey}
              onClick={() => setOctaveFilter(rKey)}
              className={`px-2 py-0.5 rounded transition cursor-pointer font-bold ${
                octaveFilter === rKey
                  ? 'bg-amber-400 text-zinc-950 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {OCTAVE_RANGES[rKey].label.split(' ')[0]}
            </button>
          ))}
          {notesOutOfRangeCount > 0 && (
            <button
              onClick={() => {
                setOctaveFilter('all')
                setTimeout(() => scrollToNotes(), 100)
              }}
              title={`${notesOutOfRangeCount} notes are in other octaves. Click to view and center on all.`}
              className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/40 animate-pulse cursor-pointer flex items-center gap-1"
            >
              <LocateFixed className="w-2.5 h-2.5" />
              <span>+{notesOutOfRangeCount} more</span>
            </button>
          )}

          <button
            onClick={scrollToNotes}
            title="Locate and center view on placed notes"
            className="p-1 rounded text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 transition cursor-pointer"
          >
            <LocateFixed className="w-3 h-3" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Ghost Notes Toggle (Single Channel View) */}
          {!isAllChannels && allChannels && allChannels.length > 1 && (
            <button
              onClick={() => setShowGhostNotes(!showGhostNotes)}
              title="Toggle ghost notes from other channels"
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 transition cursor-pointer ${
                showGhostNotes
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : isDark
                  ? 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {showGhostNotes ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>Ghost Notes</span>
            </button>
          )}

          {/* Note Duration Selector */}
          <div className="flex items-center gap-1 text-[10px] font-mono">
            <span className="text-zinc-400">Step Len:</span>
            {[1, 2, 4].map((dur) => (
              <button
                key={dur}
                onClick={() => setActiveDuration(dur)}
                className={`px-1.5 py-0.5 rounded transition cursor-pointer ${
                  activeDuration === dur
                    ? 'bg-amber-400 text-zinc-950 font-bold'
                    : isDark
                    ? 'bg-zinc-800 text-zinc-400 hover:text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {dur}
              </button>
            ))}
          </div>

          {/* Clear Notes */}
          <button
            onClick={handleClearNotes}
            title={isAllChannels ? 'Clear all notes across all channels' : 'Clear notes for this channel'}
            className={`p-1 rounded text-zinc-400 hover:text-red-400 cursor-pointer ${
              isDark ? 'hover:bg-zinc-800' : 'hover:bg-slate-200'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Close Panel */}
          <button
            onClick={onClose}
            className={`p-1 rounded text-zinc-400 hover:text-white cursor-pointer ${
              isDark ? 'hover:bg-zinc-800' : 'hover:bg-slate-200'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sub-header Ribbon for All Channels Mode: Paint Instrument Selector & Color Legend */}
      {isAllChannels && (
        <div
          className={`px-3 py-1.5 border-b flex flex-wrap items-center justify-between gap-2 text-xs ${
            isDark ? 'border-zinc-800 bg-[#161823] text-zinc-300' : 'border-slate-200 bg-slate-100 text-slate-700'
          }`}
        >
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold pl-0.5">
              Paint As:
            </span>
            {channelList.map((ch) => {
              const isSelected = paintChannelId === ch.id
              return (
                <button
                  key={ch.id}
                  onClick={() => setPaintChannelId(ch.id)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition ${
                    isSelected
                      ? 'text-zinc-950 font-black shadow-sm ring-1 ring-white/50'
                      : isDark
                      ? 'bg-zinc-800 text-zinc-300 hover:text-white'
                      : 'bg-white text-slate-800 shadow-xs'
                  }`}
                  style={isSelected ? { backgroundColor: ch.color } : { borderLeft: `3px solid ${ch.color}` }}
                >
                  <span>{ch.icon}</span>
                  <span>{ch.name}</span>
                </button>
              )
            })}
          </div>

          <div className="text-[9px] font-mono text-zinc-400 flex items-center gap-2">
            <span>Click any note to audition / delete • Click empty step to paint</span>
          </div>
        </div>
      )}

      {/* Grid Body — Full Key Notes Canvas */}
      <div ref={gridScrollRef} className="flex flex-1 overflow-auto max-h-[520px] scroll-smooth">
        {/* Left: Vertical Piano Keyboard */}
        <div className="w-20 shrink-0 border-r border-zinc-800/80 flex flex-col sticky left-0 z-20">
          {visibleKeys.map((key) => {
            const isAuditioning = activeKeys.has(key.midi)
            const isDrumPitch = key.midi === 36 ? '🥁' : key.midi === 38 ? '🪘' : key.midi === 42 ? '🥢' : null

            return (
              <button
                key={key.midi}
                onClick={() => auditionNote(key.midi)}
                className={`h-5 border-b text-[9px] font-mono font-bold flex items-center justify-between px-1.5 cursor-pointer transition select-none ${
                  isAuditioning
                    ? 'bg-amber-400 text-zinc-950 font-black'
                    : key.isBlack
                    ? isDark
                      ? 'bg-zinc-900 border-zinc-950 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                      : 'bg-slate-800 border-slate-900 text-zinc-300 hover:bg-slate-700'
                    : isDark
                    ? 'bg-zinc-800/90 border-zinc-700/60 text-zinc-300 hover:bg-zinc-700'
                    : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-1">
                  {isDrumPitch && <span className="text-[8px]">{isDrumPitch}</span>}
                  <span className={key.isRootC ? 'text-amber-400 font-extrabold' : ''}>{key.name}</span>
                </div>
                {key.isRootC && <span className="text-[7px] text-amber-400">•</span>}
              </button>
            )
          })}
        </div>

        {/* Right: 16-Step Pitch Matrix Grid */}
        <div className="flex-1 flex flex-col min-w-[340px]">
          {visibleKeys.map((key) => {
            return (
              <div
                key={key.midi}
                className={`h-5 flex border-b ${
                  key.isRootC
                    ? isDark ? 'border-amber-500/30' : 'border-indigo-300'
                    : isDark ? 'border-zinc-800/50' : 'border-slate-200'
                }`}
              >
                {Array.from({ length: 16 }).map((_, stepIdx) => {
                  const beat = Math.floor(stepIdx / 4)
                  const isAmberBeat = beat === 0 || beat === 2

                  const cellNotes = displayNotes.filter((n) => n.midi === key.midi && n.step === stepIdx)
                  const activeNote = cellNotes.find((n) => !n.isGhost)
                  const ghostNote = cellNotes.find((n) => n.isGhost)
                  const isPlayhead = currentStep === stepIdx

                  return (
                    <div
                      key={stepIdx}
                      onClick={() => handleCellClick(key.midi, stepIdx)}
                      className={`flex-1 border-r cursor-pointer transition relative flex items-center justify-center p-0.5 ${
                        activeNote
                          ? 'border-transparent'
                          : isAmberBeat
                          ? isDark
                            ? 'bg-amber-950/20 border-zinc-800/60 hover:bg-amber-900/30'
                            : 'bg-amber-50/50 border-slate-200 hover:bg-amber-100/50'
                          : isDark
                          ? 'bg-zinc-900/40 border-zinc-800/60 hover:bg-zinc-800/60'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                      style={
                        activeNote
                          ? {
                              backgroundColor: activeNote.channelColor,
                              boxShadow: `0 0 8px ${activeNote.channelColor}66`
                            }
                          : undefined
                      }
                    >
                      {activeNote && (
                        <div className="w-full h-full rounded-sm bg-black/40 flex items-center justify-center text-[7px] font-mono font-bold text-white px-0.5 truncate gap-0.5 shadow-inner">
                          <span>{activeNote.channelIcon}</span>
                          <span className="hidden sm:inline">{key.name}</span>
                        </div>
                      )}

                      {!activeNote && ghostNote && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation()
                            onSelectChannel?.(ghostNote.channelId)
                          }}
                          className="w-full h-full border border-dashed rounded-sm flex items-center justify-center text-[7px] font-mono font-bold opacity-45 hover:opacity-90 transition cursor-pointer gap-0.5"
                          style={{
                            borderColor: ghostNote.channelColor,
                            color: ghostNote.channelColor,
                            backgroundColor: `${ghostNote.channelColor}15`
                          }}
                          title={`Ghost Note: ${ghostNote.channelName} (${key.name}). Click to select channel.`}
                        >
                          <span>{ghostNote.channelIcon}</span>
                          <span className="hidden sm:inline">{key.name}</span>
                        </div>
                      )}

                      {isPlayhead && (
                        <div className="absolute inset-y-0 left-0 w-0.5 bg-emerald-400 z-10 shadow-[0_0_6px_#10b981]" />
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
