import { useState, useEffect, useCallback, useRef } from 'react'
import { Music, Circle, Play, Pause, RefreshCw, Sparkles, Check, PanelLeftClose, PanelLeftOpen, LocateFixed } from 'lucide-react'
import { audioEngine, DawInstrument } from '@/services/audioEngine'

// Standard MIDI note definitions from C3 (48) to C5 (72) — 25 keys matching DAW Piano Roll
export interface NoteBlock {
  id: string
  midi: number
  step: number // 0 to 63 (4 bars of 16th notes)
  duration: number // in steps (default 1 or 2)
}

export const INSTRUMENT_OPTIONS: { id: DawInstrument; label: string; icon: string; desc: string; category: string }[] = [
  // Keyboards
  { id: 'piano', label: 'Grand Piano', icon: '🎹', desc: 'Raw Acoustic Hammer', category: 'Keyboards' },
  { id: 'epiano', label: 'Rhodes Piano', icon: '✨', desc: 'Vintage Bell Tine & Chime', category: 'Keyboards' },

  // Guitars & Plucks
  { id: 'guitar', label: 'Acoustic Guitar', icon: '🎸', desc: 'Nylon Pluck & Resonant Body', category: 'Guitars & Plucks' },
  { id: 'electricGuitar', label: 'Electric Guitar', icon: '⚡', desc: 'Overdriven Solo Lead', category: 'Guitars & Plucks' },
  { id: 'harp', label: 'Celtic Harp', icon: '🪕', desc: 'Crystalline Acoustic Pluck', category: 'Guitars & Plucks' },

  // Bowed Strings
  { id: 'violin', label: 'Solo Violin', icon: '🎻', desc: 'Expressive Bow & 5.6Hz Vibrato', category: 'Bowed Strings' },
  { id: 'cello', label: 'Solo Cello', icon: '🎻', desc: 'Deep Resonant Bowed Wood', category: 'Bowed Strings' },
  { id: 'strings', label: 'String Ensemble', icon: '🎼', desc: 'Symphonic Stereo Swell', category: 'Bowed Strings' },

  // Brass & Woodwinds
  { id: 'trumpet', label: 'Solo Trumpet', icon: '🎺', desc: 'Raw Brass Fanfare & Lead', category: 'Brass & Woodwinds' },
  { id: 'saxophone', label: 'Solo Saxophone', icon: '🎷', desc: 'Soulful Expressive Reed', category: 'Brass & Woodwinds' },
  { id: 'flute', label: 'Concert Flute', icon: '🍃', desc: 'Airy Woodwind Breath', category: 'Brass & Woodwinds' },

  // Bass
  { id: 'bassGuitar', label: 'Electric Bass', icon: '🎸', desc: 'Punchy Finger Pluck', category: 'Bass' },
  { id: 'subBass', label: '808 Sub-Bass', icon: '🔊', desc: 'Deep Sub Pitch Dive', category: 'Bass' },

  // Synths
  { id: 'synthLead', label: 'Moog Synth Lead', icon: '⚡', desc: 'Resonant Analog Saw', category: 'Synths & Pads' },
  { id: 'pad', label: 'Ambient Pad', icon: '🌌', desc: 'Lush Detuned Atmosphere', category: 'Synths & Pads' },

  // Percussion
  { id: 'percussion', label: 'Drum Kit & 808', icon: '🥁', desc: 'Kick, Snare & Hi-Hats', category: 'Percussion' },
]

export const PRESET_PATTERNS = [
  { id: 'ai', name: 'AI Track Notes', icon: '🪄', desc: 'Syncs current AI prompt composition' },
  { id: 'darkCinematic', name: 'Dark Cinematic', icon: '🎬', desc: 'Dm Orchestral Build & Staccato' },
  { id: 'trumpet', name: 'Trumpet Fanfare', icon: '🎺', desc: 'Bb Major Heroic Brass' },
  { id: 'lofi', name: 'Lo-Fi Chill', icon: '☕', desc: 'Cmaj7 Mellow Rhodes Groove' },
  { id: 'cyberpunk', name: 'Cyberpunk Pulse', icon: '⚡', desc: 'Am Driving Synth Lead' },
  { id: 'ambient', name: 'Ambient Drone', icon: '🌌', desc: 'Ethereal Warm Sus2 Pads' },
]

const TOTAL_STEPS = 64 // 4 full measures of 16th notes (eliminates 1.9s loop limit)
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
  const [notes, setNotes] = useState<NoteBlock[]>(() => {
    try {
      const active = audioEngine.getActiveNotes()
      if (active && active.length > 0) return active
      const saved = localStorage.getItem('dramatone_daw_notes')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [currentStep, setCurrentStep] = useState<number>(-1)
  const [isDawPlaying, setIsDawPlaying] = useState<boolean>(false)
  const [activeMidiKeys, setActiveMidiKeys] = useState<Set<number>>(new Set())
  const [selectedInstrument, setSelectedInstrument] = useState<DawInstrument>(() => {
    try {
      const saved = localStorage.getItem('dramatone_daw_instrument')
      if (saved === 'keys') return 'piano'
      if (saved === 'bass') return 'subBass'
      if (saved === 'synth') return 'synthLead'
      if (saved === 'pluck') return 'harp'
      return (saved as DawInstrument) || 'piano'
    } catch {
      return 'piano'
    }
  })
  const [isSoloMode, setIsSoloMode] = useState<boolean>(() => audioEngine.getDawSolo())
  const [isRecordMode, setIsRecordMode] = useState(false)
  const [midiDevices, setMidiDevices] = useState<string[]>([])
  const [midiStatus, setMidiStatus] = useState<string>('Ready for MIDI controller')
  const [loadedPresetName, setLoadedPresetName] = useState<string | null>(null)
  const [zoomMode, setZoomMode] = useState<'fit' | '1x' | '1.5x'>('fit')
  const [isRackOpen, setIsRackOpen] = useState(true)
  const [followSlider, setFollowSlider] = useState(true)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Stable refs for real-time MIDI handlers to prevent re-subscribing on every step
  const currentStepRef = useRef(currentStep)
  currentStepRef.current = currentStep

  const isRecordModeRef = useRef(isRecordMode)
  isRecordModeRef.current = isRecordMode

  const selectedInstrumentRef = useRef(selectedInstrument)
  selectedInstrumentRef.current = selectedInstrument

  // Persist notes across tab switching & sync to audio engine
  useEffect(() => {
    try {
      localStorage.setItem('dramatone_daw_notes', JSON.stringify(notes))
      audioEngine.setActiveNotes(notes)
    } catch {}
  }, [notes])

  // Persist instrument selection
  useEffect(() => {
    try {
      localStorage.setItem('dramatone_daw_instrument', selectedInstrument)
    } catch {}
  }, [selectedInstrument])

  // Listen for external AI generation notes (from Gemini Arranger)
  useEffect(() => {
    const handleLoadAiNotes = (e: Event) => {
      const customEvent = e as CustomEvent<NoteBlock[]>
      if (Array.isArray(customEvent.detail) && customEvent.detail.length > 0) {
        setNotes(customEvent.detail)
        setLoadedPresetName('Gemini AI Score')
      }
    }
    window.addEventListener('dramatone:load-notes', handleLoadAiNotes)
    return () => {
      window.removeEventListener('dramatone:load-notes', handleLoadAiNotes)
    }
  }, [])

  // Dedicated DAW Sequencer Clock (Independent of video transport)
  useEffect(() => {
    if (!isDawPlaying) {
      setCurrentStep(-1)
      return
    }
    audioEngine.ensureContext()
    const bpm = audioEngine.getBpm() || 100
    const stepDurationMs = (60 / bpm / 4) * 1000
    let step = 0
    setCurrentStep(0)

    const timer = setInterval(() => {
      step = (step + 1) % TOTAL_STEPS
      setCurrentStep(step)
    }, stepDurationMs)

    return () => clearInterval(timer)
  }, [isDawPlaying])

  // External sync with Audio Engine transport when not playing independently
  useEffect(() => {
    if (isDawPlaying) return
    audioEngine.setStepCallback((step) => {
      setCurrentStep(step >= 0 ? step % TOTAL_STEPS : -1)
    })

    return () => {
      audioEngine.setStepCallback(null)
    }
  }, [isDawPlaying])

  // Auto-play notes placed on current step ONLY when DAW transport is actively playing
  useEffect(() => {
    if (!isDawPlaying || currentStep < 0) return
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
  }, [currentStep, isDawPlaying, notes, selectedInstrument])

  // Follow Slider / Playhead: Auto-scroll viewport horizontally during playback
  useEffect(() => {
    if (!followSlider || currentStep < 0 || !scrollContainerRef.current) return
    const container = scrollContainerRef.current
    const scrollWidth = container.scrollWidth
    const clientWidth = container.clientWidth

    if (scrollWidth <= clientWidth) return

    // Position of the playhead: 56px sticky keys column + step offset
    const stepRatio = currentStep / TOTAL_STEPS
    const gridWidth = scrollWidth - 56
    const playheadX = 56 + stepRatio * gridWidth

    // Visible bounds after the sticky keys
    const currentScroll = container.scrollLeft
    const viewLeft = currentScroll + 56
    const viewRight = currentScroll + clientWidth

    // Auto-scroll ahead smoothly when the playhead approaches or exits the visible window
    if (playheadX > viewRight - 80 || playheadX < viewLeft) {
      container.scrollTo({
        left: Math.max(0, playheadX - clientWidth / 2),
        behavior: 'smooth'
      })
    }
  }, [currentStep, followSlider])

  // Play note handler (stable callback via refs, prevents audio thrashing)
  const playNote = useCallback((midi: number, vel = 0.85) => {
    audioEngine.ensureContext()
    audioEngine.playMidiNote(midi, 0.4, vel, selectedInstrumentRef.current)

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
    if (isRecordModeRef.current) {
      const stepToPlace = currentStepRef.current >= 0 ? currentStepRef.current : 0
      setNotes((prev) => {
        const existing = prev.findIndex((n) => n.midi === midi && n.step === stepToPlace)
        if (existing >= 0) return prev
        return [...prev, { id: `rec-${Date.now()}-${midi}`, midi, step: stepToPlace, duration: 1 }]
      })
    }
  }, [])

  // Toggle record mode and start sequencer if stopped
  const toggleRecordMode = () => {
    const nextMode = !isRecordMode
    setIsRecordMode(nextMode)
    isRecordModeRef.current = nextMode
    if (nextMode && !isDawPlaying) {
      setIsDawPlaying(true)
    }
  }

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
  // Connects hardware USB/Bluetooth MIDI keyboards (Akai, Novation, Arturia, Yamaha, etc.)
  const initWebMidi = useCallback((isManualScan = false) => {
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

    if (isManualScan) {
      setMidiStatus('Scanning for MIDI hardware...')
    }

    nav.requestMIDIAccess()
      .then((midiAccess) => {
        const inputs = Array.from(midiAccess.inputs.values())
        const names = inputs.map((inp, idx) => inp.name || `MIDI Port ${idx + 1}`)
        setMidiDevices(names)
        setMidiStatus(names.length > 0 ? `Connected: ${names.join(', ')}` : 'Listening • Ready for USB/BT MIDI device')

        inputs.forEach((input) => {
          input.onmidimessage = (msg) => {
            const data = msg.data
            const status = data[0]
            const note = data[1]
            const velocity = data[2]
            const cmd = status >> 4

            if (cmd === 9 && velocity > 0) {
              playNote(note, velocity / 127)
            } else if (cmd === 8 || (cmd === 9 && velocity === 0)) {
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
          setMidiStatus(freshNames.length > 0 ? `Connected: ${freshNames.join(', ')}` : 'No MIDI devices plugged in')
        }
      })
      .catch((err) => {
        setMidiStatus(`MIDI Access: ${err.message || 'Check permissions'}`)
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

  // --- LOAD COMPOSITION & PATTERN PRESETS ---
  const handleLoadPreset = (presetId: string) => {
    let profile = audioEngine.getActiveProfile()

    if (presetId === 'ai') {
      const activeAiNotes = audioEngine.getActiveNotes()
      if (activeAiNotes && activeAiNotes.length > 0) {
        setNotes(
          activeAiNotes.map((n, i) => ({
            id: n.id || `ai-note-${i}`,
            midi: n.midi,
            step: n.step % TOTAL_STEPS,
            duration: n.duration || 1
          }))
        )
        let aiLead = (profile.leadInstrument as DawInstrument) || 'piano'
        if ((aiLead as string) === 'keys') aiLead = 'piano'
        setSelectedInstrument(aiLead)
        selectedInstrumentRef.current = aiLead
        setLoadedPresetName('Gemini AI Score')
        setTimeout(() => setLoadedPresetName(null), 2500)
        return
      }
      let aiLead = (profile.leadInstrument as DawInstrument) || 'piano'
      if ((aiLead as string) === 'keys') aiLead = 'piano'
      setSelectedInstrument(aiLead)
      selectedInstrumentRef.current = aiLead
    } else if (presetId === 'darkCinematic') {
      profile = {
        genre: 'Dark Cinematic',
        mood: 'Tense',
        bpm: 90,
        key: 'D Minor',
        chords: [
          [146.83, 174.61, 220.00, 261.63], // Dm7
          [116.54, 146.83, 174.61, 220.00], // Bbmaj7
          [103.83, 130.81, 155.56, 207.65], // Ab dim
          [110.00, 138.59, 164.81, 246.94]  // A7
        ],
        scale: [146.83, 164.81, 174.61, 207.65, 220.00, 246.94, 261.63, 293.66, 349.23],
        bassFreqs: [36.71, 29.14, 51.91, 55.00]
      }
    } else if (presetId === 'trumpet') {
      profile = {
        genre: 'Brass & Trumpet',
        mood: 'Heroic',
        bpm: 104,
        key: 'Bb Major',
        chords: [
          [116.54, 146.83, 174.61],
          [87.31, 110.00, 130.81],
          [98.00, 116.54, 146.83],
          [155.56, 196.00, 233.08]
        ],
        scale: [233.08, 261.63, 293.66, 349.23, 392.00, 466.16, 523.25, 587.33],
        bassFreqs: [58.27, 43.65, 49.00, 38.89]
      }
    } else if (presetId === 'lofi') {
      profile = {
        genre: 'Lo-Fi Chill',
        mood: 'Chill',
        bpm: 85,
        key: 'C Major',
        chords: [
          [130.81, 164.81, 196.00, 246.94],
          [110.00, 130.81, 164.81, 196.00],
          [146.83, 174.61, 220.00, 261.63],
          [98.00, 123.47, 146.83, 174.61]
        ],
        scale: [130.81, 146.83, 164.81, 174.61, 196.00, 220.00, 246.94, 261.63],
        bassFreqs: [65.41, 55.00, 73.42, 49.00]
      }
    } else if (presetId === 'cyberpunk') {
      profile = {
        genre: 'Cyberpunk',
        mood: 'Suspense',
        bpm: 130,
        key: 'A Minor',
        chords: [
          [110.00, 130.81, 164.81],
          [87.31, 110.00, 130.81],
          [130.81, 164.81, 196.00],
          [98.00, 123.47, 146.83]
        ],
        scale: [110.00, 123.47, 130.81, 146.83, 164.81, 174.61, 196.00, 220.00],
        bassFreqs: [55.00, 43.65, 65.41, 49.00]
      }
    } else if (presetId === 'ambient') {
      profile = {
        genre: 'Ambient Drone',
        mood: 'Calm',
        bpm: 72,
        key: 'F Minor',
        chords: [
          [87.31, 130.81, 174.61],
          [77.78, 116.54, 155.56],
          [69.30, 103.83, 138.59],
          [77.78, 116.54, 155.56]
        ],
        scale: [174.61, 196.00, 207.65, 233.08, 261.63, 293.66, 311.13, 349.23],
        bassFreqs: [43.65, 38.89, 34.65, 38.89]
      }
    }

    const newNotes: NoteBlock[] = []
    if (profile.chords && profile.chords.length > 0) {
      profile.chords.forEach((chordFreqs, chordIdx) => {
        const baseStep = chordIdx * 4
        chordFreqs.forEach((freq) => {
          let midi = audioEngine.freqToMidi(freq)
          while (midi < LOWEST_MIDI) midi += 12
          while (midi > HIGHEST_MIDI) midi -= 12
          for (let m = 0; m < 4; m++) {
            newNotes.push({
              id: `${presetId}-ch-m${m}-${chordIdx}-${midi}`,
              midi,
              step: baseStep + m * 16,
              duration: 3
            })
          }
        })
      })
    }

    if (profile.scale && profile.scale.length > 0) {
      const melSteps = [2, 6, 10, 14, 18, 22, 26, 30, 34, 38, 42, 46, 50, 54, 58, 62]
      melSteps.forEach((s, idx) => {
        const freq = profile.scale[idx % profile.scale.length]
        let midi = audioEngine.freqToMidi(freq)
        while (midi < LOWEST_MIDI + 7) midi += 12
        while (midi > HIGHEST_MIDI) midi -= 12
        newNotes.push({
          id: `${presetId}-mel-${s}-${midi}`,
          midi,
          step: s,
          duration: 1
        })
      })
    }

    setNotes(newNotes)
    if (presetId === 'darkCinematic') {
      setSelectedInstrument('violin')
      selectedInstrumentRef.current = 'violin'
    } else if (presetId === 'trumpet') {
      setSelectedInstrument('trumpet')
      selectedInstrumentRef.current = 'trumpet'
    } else if (presetId === 'lofi') {
      setSelectedInstrument('epiano')
      selectedInstrumentRef.current = 'epiano'
    } else if (presetId === 'cyberpunk') {
      setSelectedInstrument('synthLead')
      selectedInstrumentRef.current = 'synthLead'
    } else if (presetId === 'ambient') {
      setSelectedInstrument('pad')
      selectedInstrumentRef.current = 'pad'
    }
    const match = PRESET_PATTERNS.find((p) => p.id === presetId)
    setLoadedPresetName(match ? match.name : presetId)
    setTimeout(() => setLoadedPresetName(null), 2500)
  }

  const cardBorder = isDark ? 'border-white/10 bg-zinc-950/85' : 'border-slate-200 bg-white/95 shadow-sm'

  return (
    <div className={`flex flex-col rounded-3xl border overflow-hidden backdrop-blur-md ${cardBorder} ${className}`}>
      {/* Top Header & Presets Shelf (Separated from Instruments) */}
      {showFullHeader && (
        <div className={`border-b flex flex-col ${isDark ? 'border-white/10 bg-black/40 text-zinc-200' : 'border-slate-200 bg-slate-100 text-slate-800'}`}>
          {/* Main Top Header: Title, Live MIDI Hardware Status & Sequencer Transport */}
          <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs border-b border-white/5">
            {/* Left: Title & Live MIDI Device Status */}
            <div className="flex items-center gap-3">
              <span className="font-bold flex items-center gap-1.5 tracking-tight text-[13px]">
                <Music className="w-4 h-4 text-orange-400" />
                <span>DAW Roll &amp; MIDI Studio</span>
              </span>

              <span className={`px-2 py-0.5 rounded-full border text-[10px] font-mono ${isDark ? 'border-orange-500/30 bg-orange-500/10 text-orange-400' : 'border-indigo-300 bg-indigo-50 text-indigo-700'}`}>
                4-Bar Motif Loop (64 Steps)
              </span>

              {/* Hardware Web MIDI Status Pill */}
              <div className={`px-2 py-0.5 rounded-full border text-[10px] font-mono flex items-center gap-1.5 ${
                midiDevices.length > 0
                  ? isDark ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300' : 'border-emerald-500 bg-emerald-50 text-emerald-800'
                  : isDark ? 'border-white/10 bg-white/5 text-zinc-400' : 'border-slate-300 bg-white text-slate-600'
              }`}>
                <span className={`w-2 h-2 rounded-full ${midiDevices.length > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
                <span className="truncate max-w-[200px]" title={midiStatus}>
                  {midiDevices.length > 0 ? `MIDI: ${midiDevices[0]}` : 'Web MIDI: Plug Controller'}
                </span>
              </div>

              <button
                onClick={() => initWebMidi(true)}
                title="Rescan connected USB/Bluetooth MIDI keyboards & controllers"
                className={`text-[10px] px-2 py-0.5 rounded-lg border flex items-center gap-1 cursor-pointer transition ${
                  isDark ? 'border-white/10 bg-white/5 hover:bg-white/10 text-zinc-300' : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <RefreshCw className="w-2.5 h-2.5" />
                <span>Scan MIDI</span>
              </button>
            </div>

            {/* Right: Dedicated Transport Controls & Clear */}
            <div className="flex items-center gap-2">
              {/* Dynamic Zoom Mode Selector */}
              <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-xl border text-[10px] ${
                isDark ? 'border-white/10 bg-black/40 text-zinc-300' : 'border-slate-300 bg-white text-slate-700'
              }`}>
                <span className="text-[9px] font-mono opacity-50 uppercase tracking-wider pl-0.5">Zoom</span>
                {(['fit', '1x', '1.5x'] as const).map((z) => (
                  <button
                    key={z}
                    onClick={() => setZoomMode(z)}
                    title={z === 'fit' ? 'Fit 100% of 4 measures on screen' : `Zoom ${z} (scrollable detailed view)`}
                    className={`px-1.5 py-0.5 rounded-lg font-mono font-bold cursor-pointer transition ${
                      zoomMode === z
                        ? isDark ? 'bg-orange-500 text-zinc-950 shadow-xs' : 'bg-indigo-600 text-white shadow-xs'
                        : 'opacity-70 hover:opacity-100 hover:bg-white/10'
                    }`}
                  >
                    {z === 'fit' ? 'FIT' : z}
                  </button>
                ))}
              </div>

              {/* Follow Slider / Playhead Auto-Scroll Toggle */}
              <button
                onClick={() => setFollowSlider(!followSlider)}
                title={followSlider ? 'Follow Slider: ON (Viewport auto-scrolls with playhead)' : 'Follow Slider: OFF (Click to enable auto-scroll)'}
                className={`px-2 py-1 rounded-xl border text-[10px] font-bold flex items-center gap-1 cursor-pointer transition ${
                  followSlider
                    ? isDark ? 'border-amber-400/50 bg-amber-400/15 text-amber-300' : 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold'
                    : isDark ? 'border-white/10 bg-white/5 text-zinc-400 hover:text-white' : 'border-slate-300 bg-white text-slate-500 hover:text-slate-900'
                }`}
              >
                <LocateFixed className={`w-3 h-3 ${followSlider && (isDawPlaying || currentStep >= 0) ? 'animate-pulse text-amber-400' : ''}`} />
                <span className="hidden sm:inline">Follow Slider</span>
              </button>

              {/* Dedicated DAW Sequencer Play / Pause Button (Independent of video) */}
              <button
                onClick={() => setIsDawPlaying(!isDawPlaying)}
                title={isDawPlaying ? 'Pause DAW Roll' : 'Play DAW Roll (Independent of video)'}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition ${
                  isDawPlaying
                    ? 'bg-amber-400 text-zinc-950 animate-pulse'
                    : isDark
                    ? 'bg-orange-500 text-zinc-950 hover:bg-orange-400'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {isDawPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
                <span>{isDawPlaying ? 'Pause DAW' : 'Play DAW'}</span>
              </button>

              {/* Live Record MIDI Input */}
              <button
                onClick={toggleRecordMode}
                title={isRecordMode ? 'Recording live MIDI to grid (click to stop)' : 'Record MIDI live from keyboard/device into grid'}
                className={`px-2.5 py-1 rounded-xl border text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition ${
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
                className={`px-2 py-1 rounded-xl border text-[11px] cursor-pointer transition ${
                  isDark ? 'border-white/10 bg-white/5 hover:bg-red-500/20 text-zinc-400 hover:text-red-400' : 'border-slate-300 bg-white hover:bg-red-50 text-slate-600 hover:text-red-600'
                }`}
              >
                Clear
              </button>
            </div>
          </div>

          {/* DEDICATED PRESETS SHELF: Positioned at Top */}
          <div className={`px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs border-b border-white/5 ${
            isDark ? 'bg-black/30' : 'bg-slate-200/50'
          }`}>
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
              <span className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                <Sparkles className="w-3 h-3 text-amber-400" />
                Score Presets:
              </span>
              {PRESET_PATTERNS.map((p) => {
                const isLoaded = loadedPresetName === p.name
                return (
                  <button
                    key={p.id}
                    onClick={() => handleLoadPreset(p.id)}
                    title={p.desc}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-medium border flex items-center gap-1.5 cursor-pointer transition shrink-0 ${
                      isLoaded
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 font-bold'
                        : isDark
                        ? 'border-white/10 bg-white/5 text-zinc-300 hover:border-orange-500/40 hover:text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-400'
                    }`}
                  >
                    <span>{p.icon}</span>
                    <span>{p.name}</span>
                  </button>
                )
              })}
            </div>

            {loadedPresetName && (
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30 animate-pulse">
                <Check className="w-2.5 h-2.5" />
                Pattern Loaded: {loadedPresetName}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main Studio Body: Instruments Rack (Left) + Piano Roll Grid (Right) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden select-none bg-[#13151c] min-h-[360px]">
        {/* DEDICATED INSTRUMENTS RACK: Positioned at Left (Collapsible for maximum roll width) */}
        <div className={`w-full ${isRackOpen ? 'md:w-52' : 'md:w-12'} shrink-0 border-r flex flex-col transition-[width] duration-200 ${
          isDark ? 'border-[#262b37] bg-[#0d0f15]' : 'border-slate-200 bg-slate-50'
        }`}>
          <div className={`p-2 border-b flex items-center justify-between text-xs font-bold ${isDark ? 'border-white/5 text-zinc-300' : 'border-slate-200 text-slate-700'}`}>
            {isRackOpen ? (
              <>
                <div className="min-w-0">
                  <span className="flex items-center gap-1.5 uppercase text-[10px] tracking-wider font-extrabold text-orange-400">
                    <Music className="w-3.5 h-3.5" />
                    Raw Voices
                  </span>
                  <span className="text-[9px] font-normal text-zinc-500 block truncate">Direct Master Bus</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => {
                      const next = !isSoloMode
                      setIsSoloMode(next)
                      audioEngine.setDawSolo(next)
                    }}
                    title={isSoloMode ? "Solo Active: Background accompaniment muted, playing raw voice only" : "Solo Channel: Isolate raw instrument like FL Studio Channel Solo"}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase cursor-pointer transition ${
                      isSoloMode
                        ? 'bg-amber-400 text-zinc-950 font-black shadow-sm ring-1 ring-amber-300'
                        : isDark
                        ? 'bg-white/10 text-zinc-400 hover:text-white'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    {isSoloMode ? 'SOLO ON' : 'SOLO'}
                  </button>
                  <button
                    onClick={() => setIsRackOpen(false)}
                    title="Collapse Instruments Rack to icons"
                    className="text-zinc-400 hover:text-white cursor-pointer p-0.5 rounded hover:bg-white/10"
                  >
                    <PanelLeftClose className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-1 mx-auto">
                <button
                  onClick={() => setIsRackOpen(true)}
                  title="Expand Instruments Rack"
                  className="text-orange-400 hover:text-white cursor-pointer p-1 rounded hover:bg-white/10"
                >
                  <PanelLeftOpen className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    const next = !isSoloMode
                    setIsSoloMode(next)
                    audioEngine.setDawSolo(next)
                  }}
                  title={isSoloMode ? "Solo Active: Click to disable" : "Enable Channel Solo Mode"}
                  className={`w-6 h-4 rounded text-[8px] font-bold uppercase cursor-pointer flex items-center justify-center transition ${
                    isSoloMode ? 'bg-amber-400 text-zinc-950 font-black' : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  S
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 p-1.5 space-y-1 overflow-y-auto">
            {INSTRUMENT_OPTIONS.map((inst, idx) => {
              const isSelected = selectedInstrument === inst.id
              const prevCat = idx > 0 ? INSTRUMENT_OPTIONS[idx - 1].category : null
              const showCategory = isRackOpen && inst.category && inst.category !== prevCat
              const auditionPitch = (inst.id === 'subBass' || inst.id === 'bass' || inst.id === 'bassGuitar' || inst.id === 'cello') ? 48 : 60

              return (
                <div key={inst.id} className="space-y-0.5">
                  {showCategory && (
                    <div className={`px-1 pt-2 pb-0.5 text-[8px] font-mono uppercase tracking-wider font-semibold ${
                      isDark ? 'text-zinc-500' : 'text-slate-400'
                    }`}>
                      {inst.category}
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setSelectedInstrument(inst.id)
                      selectedInstrumentRef.current = inst.id
                      playNote(auditionPitch, 0.75) // preview note audition at natural register
                    }}
                    title={`${inst.label} (${inst.desc}) - Click to audition & switch voice`}
                    className={`w-full rounded-xl border flex items-center cursor-pointer transition ${
                      isRackOpen ? 'p-1.5 justify-between gap-1.5 text-left' : 'h-8 justify-center'
                    } ${
                      isSelected
                        ? isDark
                          ? 'border-orange-500 bg-orange-500/20 text-orange-300 shadow-sm'
                          : 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold shadow-sm'
                        : isDark
                        ? 'border-white/5 bg-white/[0.02] text-zinc-400 hover:border-white/15 hover:bg-white/5 hover:text-zinc-200'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {isRackOpen ? (
                      <>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm shrink-0">{inst.icon}</span>
                          <div className="truncate">
                            <div className={`text-[11px] leading-tight font-semibold truncate ${isSelected ? (isDark ? 'text-white' : 'text-indigo-950 font-bold') : ''}`}>
                              {inst.label}
                            </div>
                            <div className="text-[9px] opacity-60 truncate">
                              {inst.desc}
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isDark ? 'bg-orange-400 animate-pulse' : 'bg-indigo-600'}`} />
                        )}
                      </>
                    ) : (
                      <span className="text-sm">{inst.icon}</span>
                    )}
                  </button>
                </div>
              )
            })}
          </div>

          <div className={`p-1.5 border-t text-[9px] font-mono opacity-60 text-center flex items-center justify-between px-2 ${isDark ? 'border-white/5 text-zinc-400' : 'border-slate-200 text-slate-500'}`}>
            <span>{isRackOpen ? '16 FL Solo Voices' : '16'}</span>
            <span className="font-bold text-orange-400">{isRackOpen ? 'Keys: A - K' : 'A-K'}</span>
          </div>
        </div>

        {/* Right: Piano Roll Workspace Grid */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Scrollable Piano Roll Viewport (Unified Sticky Grid for seamless zoom & scroll) */}
          <div ref={scrollContainerRef} className="flex-1 overflow-auto min-h-0 relative select-none bg-[#13151c]">
            <div className={`flex flex-col min-h-full ${
              zoomMode === 'fit' ? 'w-full min-w-[960px]' : zoomMode === '1x' ? 'min-w-[1220px]' : 'min-w-[1850px]'
            }`}>
              {/* Sticky Top Measures / Beats Timeline Header */}
              <div className="sticky top-0 z-30 flex border-b border-[#262b37] bg-[#161821] text-[10px] font-mono h-7 shrink-0 shadow-sm">
                {/* Sticky Top-Left Corner: Keys Header Spacer */}
                <div className="w-14 shrink-0 sticky left-0 z-40 bg-[#161821] border-r border-[#262b37] flex items-center justify-center text-zinc-400 font-bold font-mono text-[9px] uppercase tracking-wider">
                  Keys
                </div>

                {/* 64-Step Measure Timeline Header (Measures 1, 2, 3, 4) */}
                <div className="flex-1 grid relative" style={{ gridTemplateColumns: `repeat(${TOTAL_STEPS}, minmax(0, 1fr))` }}>
                  {/* Playhead marker tick on timeline */}
                  {currentStep >= 0 && (
                    <div
                      className="absolute top-0 bottom-0 w-[2px] bg-emerald-400 z-20 pointer-events-none transition-all duration-75"
                      style={{
                        left: `${(currentStep / TOTAL_STEPS) * 100}%`
                      }}
                    >
                      <div className="w-2.5 h-2.5 bg-emerald-400 rotate-45 -ml-[4px] -top-1 absolute shadow-md" />
                    </div>
                  )}

                  {Array.from({ length: TOTAL_STEPS }, (_, s) => {
                    const isMeasureStart = s % 16 === 0
                    const measureNum = Math.floor(s / 16) + 1
                    const isBeat = s % 4 === 0

                    return (
                      <div
                        key={s}
                        className={`flex items-center justify-start relative text-[9px] select-none ${
                          isMeasureStart
                            ? 'border-l border-[#3a4256] text-zinc-200 font-bold'
                            : isBeat
                            ? 'border-l border-[#242938] text-zinc-500'
                            : 'border-l border-[#1a1d26] text-transparent'
                        }`}
                      >
                        {/* Green DAW measure marker tick (FL Studio / Ableton style) */}
                        {isMeasureStart && (
                          <div className="absolute top-0 left-0 w-[2px] h-2 bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.8)]" />
                        )}

                        {/* Measure Number */}
                        {isMeasureStart && (
                          <span className="text-[10px] font-bold text-zinc-300 pl-1 whitespace-nowrap">
                            Bar {measureNum}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Grid Body: Sticky Left Piano Keys + Interactive Note Grid */}
              <div className="flex flex-1">
                {/* Left: Sticky Piano Keyboard (C5 down to C3) */}
                <div className="w-14 shrink-0 sticky left-0 z-20 flex flex-col border-r border-[#262b37] bg-[#12141a] shadow-lg">
                  {PIANO_KEYS.map((key) => {
                    const isActive = activeMidiKeys.has(key.midi)
                    return (
                      <div
                        key={key.midi}
                        onClick={() => playNote(key.midi)}
                        title={`Play ${key.name} (MIDI ${key.midi})`}
                        className={`h-5 border-b cursor-pointer flex items-center transition-colors relative ${
                          key.isBlack
                            ? isActive
                              ? 'bg-orange-500 text-black border-orange-400'
                              : 'bg-[#0d0f15] border-black/90 hover:bg-[#1a1d26]'
                            : isActive
                            ? 'bg-amber-300 text-black border-amber-200'
                            : 'bg-white text-zinc-950 border-[#d1d5db] hover:bg-[#f1f3f6]'
                        }`}
                      >
                        {/* Black key inset block */}
                        {key.isBlack ? (
                          <div className={`w-9 h-3.5 ml-0 rounded-r-xs border-r border-b shadow-sm flex items-center justify-end pr-1 ${
                            isActive ? 'bg-orange-400 border-orange-300' : 'bg-[#090b0f] border-black/80'
                          }`}>
                            <span className="w-1 h-1 rounded-full bg-white/20" />
                          </div>
                        ) : (
                          /* White key note badge on C root keys */
                          <div className="w-full flex items-center justify-between px-1">
                            {key.isRootC ? (
                              <span className="text-[10px] font-extrabold font-mono text-zinc-950 tracking-tight">
                                {key.name}
                              </span>
                            ) : (
                              <span className="text-[8px] font-mono text-zinc-400 opacity-60">
                                {key.name.slice(0, 1)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Right: Interactive 64-Step Grid (4 Measures) */}
                <div className="flex-1 flex flex-col relative bg-[#13151c]">
                  {/* Playhead Overlay Line */}
                  {currentStep >= 0 && (
                    <div
                      className="absolute top-0 bottom-0 w-[2px] bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)] z-10 pointer-events-none transition-all duration-75"
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
                            ? 'bg-[#15171f] border-[#242836]'
                            : 'bg-[#1c202a] border-[#242836]'
                        }`}
                      >
                        {/* 64 Step Grid Cells */}
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
                                  ? 'border-[#363e52]'
                                  : isBeatLine
                                  ? 'border-[#242938]'
                                  : 'border-[#1a1d26]'
                              } ${isCurrentStepActive ? 'bg-emerald-500/15' : 'hover:bg-white/[0.08]'}`}
                            >
                              {/* Note Block */}
                              {hasNote && (
                                <div
                                  className={`absolute inset-0.5 rounded-[3px] bg-gradient-to-r shadow-sm flex items-center px-1 text-[8px] font-bold text-white overflow-hidden transition-transform ${
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
            </div>
          </div>

          {/* Bottom Helper Bar: Live Keyboard Controls & Tips */}
          <div className={`px-4 py-1.5 border-t flex flex-wrap items-center justify-between text-[10px] shrink-0 ${
            isDark ? 'border-white/10 bg-black/60 text-zinc-400' : 'border-slate-200 bg-slate-50 text-slate-600'
          }`}>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-orange-400">Keyboard:</span>
              <span className="font-mono bg-white/5 px-1.5 py-0.5 rounded border border-white/10 text-zinc-300">
                A-K • W, E, T, Y, U
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span>Click cells to place/delete notes</span>
              <span className="opacity-40">•</span>
              <span>Web MIDI Connected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
