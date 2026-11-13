import { useState, useEffect, useCallback } from 'react'
import { Music, Wand2, Circle } from 'lucide-react'
import { audioEngine } from '@/services/audioEngine'

// Standard MIDI note definitions from C3 (48) to C5 (72) — 25 keys matching DAW Piano Roll
export interface NoteBlock {
  id: string
  midi: number
  step: number // 0 to 31 (2 bars of 16th notes)
  duration: number // in steps (default 1 or 2)
}

const TOTAL_STEPS = 32 // 2 measures of 16th notes
const LOWEST_MIDI = 48 // C3
const HIGHEST_MIDI = 72 // C5

// Map MIDI note number to note name & accidental status
function getMidiInfo(midi: number) {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const semitone = midi % 12
  const octave = Math.floor(midi / 12) - 1
  const name = `${noteNames[semitone]}${octave}`
  const isBlack = [1, 3, 6, 8, 10].includes(semitone)
  const isRootC = semitone === 0
  return { name, isBlack, isRootC, octave, semitone }
}

// Generate the 25 rows in descending order (C5 down to C3, just like the DAW screenshot)
const PIANO_KEYS = Array.from(
  { length: HIGHEST_MIDI - LOWEST_MIDI + 1 },
  (_, i) => HIGHEST_MIDI - i
).map((midi) => ({
  midi,
  ...getMidiInfo(midi)
}))

// Computer keyboard mapping for zero-hardware MIDI entry
const KEYBOARD_MAP: Record<string, number> = {
  a: 60, // C4
  w: 61, // C#4
  s: 62, // D4
  e: 63, // D#4
  d: 64, // E4
  f: 65, // F4
  t: 66, // F#4
  g: 67, // G4
  y: 68, // G#4
  h: 69, // A4
  u: 70, // A#4
  j: 71, // B4
  k: 72  // C5
}

interface DawPianoRollProps {
  isDark: boolean
  className?: string
  showFullHeader?: boolean
}

export function DawPianoRoll({ isDark, className = '', showFullHeader = true }: DawPianoRollProps) {
  const [notes, setNotes] = useState<NoteBlock[]>([])
  const [currentStep, setCurrentStep] = useState<number>(-1)
  const [activeMidiKeys, setActiveMidiKeys] = useState<Set<number>>(new Set())
  const [selectedInstrument, setSelectedInstrument] = useState<'keys' | 'trumpet' | 'pluck' | 'bass'>('keys')
  const [isRecordMode, setIsRecordMode] = useState(false)
  const [midiDevices, setMidiDevices] = useState<string[]>([])
  const [midiStatus, setMidiStatus] = useState<string>('Not initialized')
  const [demoLoaded, setDemoLoaded] = useState(false)

  // Real-time synchronization with Audio Engine 16-step Sequencer
  useEffect(() => {
    audioEngine.setStepCallback((step) => {
      // Scale 16-step sequencer across 32 steps (loops 2 bars)
      setCurrentStep(step >= 0 ? step % TOTAL_STEPS : -1)
    })

    return () => {
      audioEngine.setStepCallback(null)
    }
  }, [])

  // Auto-play notes placed on current step during transport playback
  useEffect(() => {
    if (currentStep < 0) return
    const stepNotes = notes.filter((n) => n.step === currentStep)
    stepNotes.forEach((n) => {
      audioEngine.playMidiNote(n.midi, 0.35, 0.85, selectedInstrument)
      // Visual key flash
      setActiveMidiKeys((prev) => new Set(prev).add(n.midi))
      setTimeout(() => {
        setActiveMidiKeys((prev) => {
          const next = new Set(prev)
          next.delete(n.midi)
          return next
        })
      }, 180)
    })
  }, [currentStep, notes, selectedInstrument])

  // Play note handler
  const playNote = useCallback((midi: number, vel = 0.85) => {
    audioEngine.ensureContext()
    audioEngine.playMidiNote(midi, 0.4, vel, selectedInstrument)

    // Flash key visually
    setActiveMidiKeys((prev) => new Set(prev).add(midi))
    setTimeout(() => {
      setActiveMidiKeys((prev) => {
        const next = new Set(prev)
        next.delete(midi)
        return next
      })
    }, 200)

    // If recording, place note at current step (or step 0)
    if (isRecordMode) {
      const stepToPlace = currentStep >= 0 ? currentStep : 0
      setNotes((prev) => {
        const existing = prev.findIndex((n) => n.midi === midi && n.step === stepToPlace)
        if (existing >= 0) return prev
        return [...prev, { id: `rec-${Date.now()}-${midi}`, midi, step: stepToPlace, duration: 1 }]
      })
    }
  }, [selectedInstrument, isRecordMode, currentStep])

  // Toggle or place note on grid
  const handleCellClick = (midi: number, step: number) => {
    setNotes((prev) => {
      const existingIdx = prev.findIndex((n) => n.midi === midi && n.step === step)
      if (existingIdx >= 0) {
        // Remove note
        return prev.filter((_, idx) => idx !== existingIdx)
      } else {
        // Add note and sound it immediately
        playNote(midi, 0.8)
        return [...prev, { id: `note-${midi}-${step}`, midi, step, duration: 1 }]
      }
    })
  }

  // --- NATIVE WEB MIDI API INTEGRATION ---
  // Connects hardware USB/Bluetooth MIDI keyboards (Akai, Novation, Arturia, etc.)
  const initWebMidi = useCallback(() => {
    if (typeof window === 'undefined') return

    const nav = navigator as unknown as {
      requestMIDIAccess?: () => Promise<{
        inputs: Map<string, { name?: string; onmidimessage: ((e: { data: Uint8Array }) => void) | null }>
        onstatechange: ((e: unknown) => void) | null
      }>
    }

    if (!nav.requestMIDIAccess) {
      setMidiStatus('Web MIDI not supported on this browser (Chrome / Edge recommended)')
      return
    }

    nav.requestMIDIAccess()
      .then((midiAccess) => {
        const inputs = Array.from(midiAccess.inputs.values())
        const names = inputs.map((inp, idx) => inp.name || `MIDI Port ${idx + 1}`)
        setMidiDevices(names)
        setMidiStatus(names.length > 0 ? `Connected: ${names.join(', ')}` : 'Listening • Ready for MIDI Hardware')

        inputs.forEach((input) => {
          input.onmidimessage = (msg) => {
            const data = msg.data
            const status = data[0]
            const note = data[1]
            const velocity = data[2]
            const cmd = status >> 4

            if (cmd === 9 && velocity > 0) {
              // Note On
              playNote(note, velocity / 127)
            } else if (cmd === 8 || (cmd === 9 && velocity === 0)) {
              // Note Off
              setActiveMidiKeys((prev) => {
                const next = new Set(prev)
                next.delete(note)
                return next
              })
            }
          }
        })

        midiAccess.onstatechange = () => {
          const freshInputs = Array.from(midiAccess.inputs.values())
          const freshNames = freshInputs.map((inp, idx) => inp.name || `MIDI Port ${idx + 1}`)
          setMidiDevices(freshNames)
          setMidiStatus(freshNames.length > 0 ? `Connected: ${freshNames.join(', ')}` : 'No devices plugged in')
        }
      })
      .catch((err) => {
        setMidiStatus(`MIDI Access Denied or Blocked: ${err.message || 'Check permissions'}`)
      })
  }, [playNote])

  useEffect(() => {
    initWebMidi()
  }, [initWebMidi])

  // --- COMPUTER KEYBOARD MIDI LISTENER ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return
      const key = e.key.toLowerCase()
      if (KEYBOARD_MAP[key]) {
        e.preventDefault()
        const midi = KEYBOARD_MAP[key]
        playNote(midi, 0.85)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (KEYBOARD_MAP[key]) {
        const midi = KEYBOARD_MAP[key]
        setActiveMidiKeys((prev) => {
          const next = new Set(prev)
          next.delete(midi)
          return next
        })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [playNote])

  // --- PRELOAD NOTES FROM AI GENERATED COMPOSITION ---
  const handleLoadAiComposition = () => {
    const profile = audioEngine.getActiveProfile()
    const newNotes: NoteBlock[] = []

    // 1. Chords across steps (step 0, 4, 8, 12, 16, 20, 24, 28)
    if (profile.chords && profile.chords.length > 0) {
      profile.chords.forEach((chordFreqs, chordIdx) => {
        const baseStep = chordIdx * 4
        chordFreqs.forEach((freq) => {
          let midi = audioEngine.freqToMidi(freq)
          // Clamp within piano roll range C3..C5
          while (midi < LOWEST_MIDI) midi += 12
          while (midi > HIGHEST_MIDI) midi -= 12
          newNotes.push({
            id: `ai-chord-${chordIdx}-${midi}`,
            midi,
            step: baseStep,
            duration: 3
          })
          // Also duplicate for measure 2
          newNotes.push({
            id: `ai-chord-m2-${chordIdx}-${midi}`,
            midi,
            step: baseStep + 16,
            duration: 3
          })
        })
      })
    }

    // 2. Melody notes from scale
    if (profile.scale && profile.scale.length > 0) {
      const melSteps = [2, 6, 10, 14, 18, 22, 26, 30]
      melSteps.forEach((s, idx) => {
        const freq = profile.scale[idx % profile.scale.length]
        let midi = audioEngine.freqToMidi(freq)
        while (midi < LOWEST_MIDI + 7) midi += 12
        while (midi > HIGHEST_MIDI) midi -= 12
        newNotes.push({
          id: `ai-mel-${s}-${midi}`,
          midi,
          step: s,
          duration: 1
        })
      })
    }

    setNotes(newNotes)
    setDemoLoaded(true)
    setTimeout(() => setDemoLoaded(false), 2500)
  }

  // Demo Arpeggio
  const handleLoadDemo = () => {
    const arpeggioPattern = [
      { step: 0, midi: 48 }, // C3
      { step: 2, midi: 55 }, // G3
      { step: 4, midi: 60 }, // C4
      { step: 6, midi: 64 }, // E4
      { step: 8, midi: 67 }, // G4
      { step: 10, midi: 64 }, // E4
      { step: 12, midi: 60 }, // C4
      { step: 14, midi: 55 }, // G3
      // Bar 2 (Am)
      { step: 16, midi: 45 + 12 }, // A3
      { step: 18, midi: 52 + 12 }, // E4
      { step: 20, midi: 57 + 12 }, // A4
      { step: 22, midi: 60 + 12 }, // C5
      { step: 24, midi: 57 + 12 },
      { step: 26, midi: 52 + 12 },
      { step: 28, midi: 48 + 12 },
      { step: 30, midi: 55 + 12 }
    ]
    setNotes(arpeggioPattern.map((p, i) => ({ id: `demo-${i}`, ...p, duration: 1 })))
  }

  const cardBorder = isDark ? 'border-white/10 bg-zinc-950/85' : 'border-slate-200 bg-white/95 shadow-sm'

  return (
    <div className={`flex flex-col rounded-3xl border overflow-hidden backdrop-blur-md ${cardBorder} ${className}`}>
      {/* Top DAW & MIDI Device Control Bar */}
      {showFullHeader && (
        <div className={`px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 text-xs ${
          isDark ? 'border-white/10 bg-black/40 text-zinc-200' : 'border-slate-200 bg-slate-100 text-slate-800'
        }`}>
          {/* Left: Title & Live MIDI Device Status */}
          <div className="flex items-center gap-3">
            <span className="font-semibold flex items-center gap-1.5">
              <Music className="w-4 h-4 text-orange-400" />
              <span>DAW Piano Roll &amp; MIDI Studio</span>
            </span>

            {/* Hardware Web MIDI Status Pill */}
            <div className={`px-2 py-0.5 rounded-full border text-[10px] font-mono flex items-center gap-1.5 ${
              midiDevices.length > 0
                ? isDark ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300' : 'border-emerald-500 bg-emerald-50 text-emerald-800'
                : isDark ? 'border-white/10 bg-white/5 text-zinc-400' : 'border-slate-300 bg-white text-slate-600'
            }`}>
              <span className={`w-2 h-2 rounded-full ${midiDevices.length > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
              <span className="truncate max-w-[200px]" title={midiStatus}>
                {midiDevices.length > 0 ? `MIDI: ${midiDevices[0]}` : 'Web MIDI: Plug USB/BT Device'}
              </span>
            </div>

            <button
              onClick={initWebMidi}
              title="Rescan connected USB/Bluetooth MIDI keyboards"
              className={`text-[10px] px-2 py-0.5 rounded border cursor-pointer transition ${
                isDark ? 'border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300' : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              Scan MIDI
            </button>
          </div>

          {/* Right: Instrument Voice, Preload AI Notes & Clear */}
          <div className="flex items-center gap-2">
            {/* Instrument Selector */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] opacity-60">Voice:</span>
              <select
                value={selectedInstrument}
                onChange={(e) => setSelectedInstrument(e.target.value as any)}
                className={`text-[11px] font-medium py-1 px-2 rounded-lg border cursor-pointer focus:outline-none ${
                  isDark ? 'bg-zinc-900 border-white/15 text-zinc-200' : 'bg-white border-slate-300 text-slate-800'
                }`}
              >
                <option value="keys">Dramatone Keys (Synth)</option>
                <option value="trumpet">Brass Trumpet Lead</option>
                <option value="pluck">Acoustic Pluck</option>
                <option value="bass">Sub-Bass Foundation</option>
              </select>
            </div>

            {/* Preload AI Composition Notes */}
            <button
              onClick={handleLoadAiComposition}
              title="Map currently generated AI chord progression & melody to piano roll"
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition ${
                isDark ? 'border-orange-500/40 bg-orange-500/15 text-orange-400 hover:bg-orange-500/25' : 'border-indigo-400 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
              }`}
            >
              <Wand2 className="w-3 h-3" />
              <span>{demoLoaded ? 'AI Notes Loaded!' : 'Load AI Track Notes'}</span>
            </button>

            {/* Demo Arpeggio */}
            <button
              onClick={handleLoadDemo}
              className={`px-2 py-1 rounded-lg border text-[11px] cursor-pointer transition ${
                isDark ? 'border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300' : 'border-slate-300 bg-white text-slate-700'
              }`}
            >
              Arpeggio
            </button>

            {/* Live Record MIDI Input */}
            <button
              onClick={() => setIsRecordMode(!isRecordMode)}
              title={isRecordMode ? 'Recording live MIDI to grid (click to stop)' : 'Record MIDI live from keyboard/device into grid'}
              className={`px-2 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition ${
                isRecordMode
                  ? 'border-red-500 bg-red-500/20 text-red-400 animate-pulse'
                  : isDark ? 'border-white/10 bg-white/5 text-zinc-400 hover:text-white' : 'border-slate-300 bg-white text-slate-600'
              }`}
            >
              <Circle className="w-2.5 h-2.5 fill-current" />
              <span>{isRecordMode ? 'REC ON' : 'REC MIDI'}</span>
            </button>

            {/* Clear Grid */}
            <button
              onClick={() => setNotes([])}
              title="Clear all placed notes"
              className={`px-2 py-1 rounded-lg border text-[11px] cursor-pointer transition ${
                isDark ? 'border-white/10 bg-white/5 hover:bg-red-500/20 text-zinc-400 hover:text-red-400' : 'border-slate-300 bg-white hover:bg-red-50 text-slate-600 hover:text-red-600'
              }`}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Piano Roll Workspace Grid */}
      <div className="flex-1 flex flex-col min-h-[380px] overflow-hidden select-none">
        {/* Top Measures / Beats Timeline Header */}
        <div className="flex border-b border-white/10 bg-black/50 text-[10px] font-mono h-6 shrink-0">
          {/* Left Piano Key Header Spacer */}
          <div className="w-16 shrink-0 border-r border-white/10 flex items-center justify-center text-zinc-500 font-bold">
            Keys
          </div>

          {/* 32 Step Measure Timeline Header */}
          <div className="flex-1 grid relative" style={{ gridTemplateColumns: `repeat(${TOTAL_STEPS}, minmax(0, 1fr))` }}>
            {Array.from({ length: TOTAL_STEPS }, (_, s) => {
              const isMeasureStart = s % 16 === 0
              const measureNum = Math.floor(s / 16) + 1
              const isBeat = s % 4 === 0

              return (
                <div
                  key={s}
                  className={`flex items-center justify-center border-r text-[9px] ${
                    isMeasureStart
                      ? 'border-emerald-500 text-emerald-400 font-bold bg-emerald-500/10'
                      : isBeat
                      ? 'border-white/20 text-zinc-400'
                      : 'border-white/5 text-zinc-600'
                  }`}
                >
                  {isMeasureStart ? measureNum : isBeat ? `${measureNum}.${(s % 16) / 4 + 1}` : ''}
                </div>
              )
            })}
          </div>
        </div>

        {/* Piano Roll Body: Vertical Piano Keys (Left) + Note Grid (Right) */}
        <div className="flex-1 flex overflow-y-auto max-h-[520px]">
          {/* Left: Authentic Piano Keyboard (C5 down to C3) */}
          <div className="w-16 shrink-0 flex flex-col border-r border-white/15 bg-zinc-950 z-10 shadow-lg">
            {PIANO_KEYS.map((key) => {
              const isActive = activeMidiKeys.has(key.midi)
              return (
                <div
                  key={key.midi}
                  onClick={() => playNote(key.midi)}
                  title={`Play ${key.name} (MIDI ${key.midi})`}
                  className={`h-5 border-b cursor-pointer flex items-center justify-between px-1.5 transition-colors relative ${
                    key.isBlack
                      ? isActive
                        ? 'bg-orange-500 text-black border-orange-400'
                        : 'bg-[#181a1f] text-zinc-400 border-black/80 hover:bg-[#252830]'
                      : isActive
                      ? 'bg-amber-300 text-black border-amber-200'
                      : 'bg-[#eaecef] text-slate-900 border-slate-300 hover:bg-white'
                  }`}
                >
                  {/* Note label on C root keys or active notes */}
                  <span className={`text-[9px] font-bold font-mono ${key.isRootC ? 'opacity-100 underline decoration-orange-500' : 'opacity-70'}`}>
                    {key.isRootC ? key.name : key.isBlack ? '' : key.name}
                  </span>

                  {key.isBlack && (
                    <span className="w-3 h-1.5 rounded-sm bg-black/60 shrink-0" />
                  )}
                </div>
              )
            })}
          </div>

          {/* Right: Interactive 32-Step Grid */}
          <div className="flex-1 flex flex-col relative bg-[#13151b]">
            {/* Playhead Overlay Line */}
            {currentStep >= 0 && (
              <div
                className="absolute top-0 bottom-0 w-[2px] bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.8)] z-20 pointer-events-none transition-all duration-75"
                style={{
                  left: `${(currentStep / TOTAL_STEPS) * 100}%`
                }}
              />
            )}

            {/* Grid Rows for each pitch */}
            {PIANO_KEYS.map((key) => {
              const rowNotes = notes.filter((n) => n.midi === key.midi)

              return (
                <div
                  key={key.midi}
                  className={`h-5 flex border-b relative ${
                    key.isBlack
                      ? 'bg-[#14161d] border-white/5'
                      : 'bg-[#1a1d26] border-white/5'
                  }`}
                >
                  {/* 32 Step Grid Cells */}
                  {Array.from({ length: TOTAL_STEPS }, (_, s) => {
                    const hasNote = rowNotes.some((n) => n.step === s)
                    const isMeasureLine = s % 16 === 0
                    const isBeatLine = s % 4 === 0
                    const isCurrentStepActive = currentStep === s

                    return (
                      <div
                        key={s}
                        onClick={() => handleCellClick(key.midi, s)}
                        className={`flex-1 border-r cursor-pointer transition-all relative ${
                          isMeasureLine
                            ? 'border-emerald-500/40'
                            : isBeatLine
                            ? 'border-white/15'
                            : 'border-white/5'
                        } ${isCurrentStepActive ? 'bg-orange-500/10' : 'hover:bg-white/10'}`}
                      >
                        {/* Note Block */}
                        {hasNote && (
                          <div
                            className={`absolute inset-0.5 rounded-sm bg-gradient-to-r shadow-sm flex items-center px-1 text-[8px] font-bold text-white overflow-hidden transition-transform ${
                              isDark
                                ? 'from-orange-500 to-amber-500 shadow-orange-500/30'
                                : 'from-indigo-500 to-violet-500 shadow-indigo-500/30'
                            } ${isCurrentStepActive ? 'scale-105 brightness-125 ring-1 ring-white' : ''}`}
                          >
                            <span className="truncate opacity-90">{key.name}</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>

        {/* Bottom Helper Bar: Live Keyboard Controls & Tips */}
        <div className={`px-4 py-1.5 border-t flex flex-wrap items-center justify-between text-[10px] ${
          isDark ? 'border-white/10 bg-black/60 text-zinc-400' : 'border-slate-200 bg-slate-50 text-slate-600'
        }`}>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-orange-400">Computer Keyboard MIDI:</span>
            <span className="font-mono bg-white/5 px-1.5 py-0.5 rounded border border-white/10 text-zinc-300">
              A-K (C4-C5) • W, E, T, Y, U (Accidentals)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span>Click grid to add/remove notes</span>
            <span className="opacity-40">•</span>
            <span>Connect any USB/Bluetooth MIDI keyboard to play live</span>
          </div>
        </div>
      </div>
    </div>
  )
}
