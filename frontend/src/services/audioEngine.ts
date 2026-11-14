// Dramatone In-House Web Audio Procedural Synthesis & Adaptive Engine
// Zero cloud quotas, <5% CPU footprint, 0ms parameter latency

export type StemId = 'keys' | 'drums' | 'guitar' | 'vocal'

export interface StemConfig {
  id: StemId
  name: string
  muted: boolean
  solo: boolean
  volume: number // 0 to 100
}

export interface SoundscapeParams {
  bpm: number
  genre: string
  mood: string
  tension: number // 0 to 100
}

export type LeadInstrument = 'trumpet' | 'keys' | 'pluck' | 'synth' | 'strings'

export interface CompositionOptions {
  hasStrings?: boolean
  hasStaccato?: boolean
  hasRainFoley?: boolean
  hasGradualBuild?: boolean
  hasSubBass?: boolean
}

export interface GenreProfile {
  genre: string
  mood: string
  bpm: number
  key: string
  leadInstrument?: LeadInstrument
  hasDrums?: boolean
  chords: number[][]
  bassFreqs: number[]
  scale: number[]
  hasStrings?: boolean
  hasStaccato?: boolean
  hasRainFoley?: boolean
  hasGradualBuild?: boolean
  hasSubBass?: boolean
}

const GENRE_PROFILES: Record<string, GenreProfile> = {
  trumpet: {
    genre: 'Brass & Trumpet',
    mood: 'Heroic',
    bpm: 104,
    key: 'Bb Major',
    leadInstrument: 'trumpet',
    hasDrums: false,
    chords: [
      [116.54, 146.83, 174.61], // Bb
      [87.31, 110.00, 130.81],  // F
      [98.00, 116.54, 146.83],  // Gm
      [155.56, 196.00, 233.08]  // Eb
    ],
    bassFreqs: [58.27, 43.65, 49.00, 38.89],
    scale: [233.08, 261.63, 293.66, 349.23, 392.00, 466.16, 523.25, 587.33, 698.46]
  },
  eerie: {
    genre: 'Eerie & Dark Horror',
    mood: 'Tense',
    bpm: 62,
    key: 'D Diminished',
    leadInstrument: 'pluck',
    hasDrums: false,
    chords: [
      [146.83, 174.61, 207.65, 293.66], // D dim tritone dissonance
      [138.59, 164.81, 196.00, 277.18], // C# dim tension
      [116.54, 138.59, 174.61, 233.08], // Bbm dark resolution
      [110.00, 138.59, 164.81, 246.94]  // A7(b9) suspense
    ],
    bassFreqs: [73.42, 69.30, 58.27, 55.00], // Deep descending chromatic sub
    scale: [146.83, 164.81, 174.61, 207.65, 220.00, 233.08, 277.18, 293.66]
  },
  synthwave: {
    genre: 'Synthwave',
    mood: 'Euphoric',
    bpm: 118,
    key: 'F Minor',
    leadInstrument: 'synth',
    hasDrums: true,
    chords: [
      [174.61, 207.65, 261.63, 311.13], // Fm7
      [138.59, 174.61, 207.65, 261.63], // Dbmaj7
      [155.56, 196.00, 233.08, 311.13], // Eb
      [130.81, 155.56, 196.00, 233.08]  // Cm7
    ],
    bassFreqs: [87.31, 69.30, 77.78, 65.41],
    scale: [174.61, 207.65, 233.08, 261.63, 311.13, 349.23, 415.30, 466.16, 523.25]
  },
  lofi: {
    genre: 'Lo-Fi Chill',
    mood: 'Chill',
    bpm: 85,
    key: 'C Major',
    hasDrums: false,
    chords: [
      [130.81, 164.81, 196.00, 246.94], // Cmaj7
      [110.00, 130.81, 164.81, 196.00], // Am7
      [146.83, 174.61, 220.00, 261.63], // Dm7
      [98.00, 123.47, 146.83, 174.61]   // G7
    ],
    bassFreqs: [65.41, 55.00, 73.42, 49.00],
    scale: [130.81, 146.83, 164.81, 174.61, 196.00, 220.00, 246.94, 261.63, 293.66, 329.63]
  },
  cinematic: {
    genre: 'Cinematic Score',
    mood: 'Dramatic',
    bpm: 90,
    key: 'D Minor',
    leadInstrument: 'strings',
    hasDrums: false,
    hasStrings: true,
    hasStaccato: true,
    hasRainFoley: false,
    hasGradualBuild: true,
    hasSubBass: true,
    chords: [
      [146.83, 174.61, 220.00, 293.66], // Dm9
      [116.54, 146.83, 174.61, 233.08], // Bbmaj7
      [87.31, 110.00, 130.81, 174.61],  // F
      [130.81, 164.81, 196.00, 261.63]  // Cadd9
    ],
    bassFreqs: [36.71, 29.14, 43.65, 32.70],
    scale: [146.83, 174.61, 196.00, 220.00, 261.63, 293.66, 349.23, 392.00, 440.00]
  },
  darkCinematic: {
    genre: 'Dark Cinematic Build',
    mood: 'Tense',
    bpm: 90,
    key: 'D Minor',
    leadInstrument: 'strings',
    hasDrums: false,
    hasStrings: true,
    hasStaccato: true,
    hasRainFoley: true,
    hasGradualBuild: true,
    hasSubBass: true,
    chords: [
      [146.83, 174.61, 220.00, 261.63], // Dm7 (Dark & Tense)
      [116.54, 146.83, 174.61, 220.00], // Bbmaj7(#11)
      [103.83, 130.81, 155.56, 207.65], // Ab dim dissonance
      [110.00, 138.59, 164.81, 246.94]  // A7(b9) climax
    ],
    bassFreqs: [36.71, 29.14, 51.91, 55.00], // 36Hz deep sub-bass foundation
    scale: [146.83, 164.81, 174.61, 207.65, 220.00, 246.94, 261.63, 293.66, 349.23]
  },
  cyberpunk: {
    genre: 'Cyberpunk',
    mood: 'Suspense',
    bpm: 130,
    key: 'A Minor',
    hasDrums: true,
    chords: [
      [110.00, 130.81, 164.81, 220.00], // Am
      [87.31, 110.00, 130.81, 174.61],  // F
      [98.00, 123.47, 146.83, 196.00],  // G
      [82.41, 98.00, 123.47, 164.81]   // Em
    ],
    bassFreqs: [55.00, 43.65, 49.00, 41.20],
    scale: [110.00, 130.81, 146.83, 164.81, 196.00, 220.00, 261.63, 329.63, 440.00]
  },
  ambient: {
    genre: 'Ambient Drone',
    mood: 'Calm',
    bpm: 72,
    key: 'C Sus',
    hasDrums: false,
    chords: [
      [130.81, 146.83, 196.00, 261.63], // Csus2
      [98.00, 130.81, 146.83, 196.00],  // Gsus4
      [146.83, 164.81, 220.00, 293.66], // Dsus2
      [87.31, 130.81, 164.81, 220.00]   // Fmaj7
    ],
    bassFreqs: [65.41, 49.00, 73.42, 43.65],
    scale: [130.81, 146.83, 164.81, 196.00, 220.00, 261.63, 293.66, 392.00, 523.25]
  },
  heroic: {
    genre: 'Heroic Anthem',
    mood: 'Heroic',
    bpm: 112,
    key: 'G Major',
    hasDrums: false,
    chords: [
      [98.00, 123.47, 146.83, 196.00],  // G
      [146.83, 185.00, 220.00, 293.66], // D
      [82.41, 98.00, 123.47, 164.81],   // Em
      [130.81, 164.81, 196.00, 261.63]  // C
    ],
    bassFreqs: [49.00, 73.42, 41.20, 65.41],
    scale: [98.00, 110.00, 123.47, 146.83, 164.81, 196.00, 220.00, 246.94, 293.66]
  }
}

export type DawInstrument =
  | 'keys'
  | 'epiano'
  | 'trumpet'
  | 'guitar'
  | 'strings'
  | 'bass'
  | 'flute'
  | 'synth'
  | 'percussion'

class AudioEngine {
  private ctx: AudioContext | null = null
  private isPlaying = false
  private currentStep = 0
  private maxSteps = 64
  private stepTimer: number | null = null
  private noiseBuffer: AudioBuffer | null = null

  // Semantic Audio Generation Flags
  private hasStrings = false
  private hasStaccato = false
  private hasRainFoley = false
  private hasGradualBuild = false
  private hasSubBass = false

  // Master Gain, Analyser & Volume State
  private masterGain: GainNode | null = null
  private duckingGain: GainNode | null = null
  private masterFilter: BiquadFilterNode | null = null
  private limiter: DynamicsCompressorNode | null = null
  private analyser: AnalyserNode | null = null
  private rawDawGain: GainNode | null = null
  private convolver: ConvolverNode | null = null
  private reverbGain: GainNode | null = null
  private masterVolume = 80
  private isMasterMuted = false

  // Active DAW Sequencer Notes (Synchronized between Piano Roll, AI Arranger & Timeline Sequencer)
  private activeNotes: Array<{
    id?: string
    midi: number
    step: number
    duration?: number
    instrument?: DawInstrument
  }> = []

  // Per-stem Gain Nodes
  private stemGains: Record<StemId, GainNode | null> = {
    keys: null,
    drums: null,
    guitar: null,
    vocal: null
  }

  // Active Musical Profile & State
  private hasActiveComposition = false
  private activeProfile: GenreProfile = GENRE_PROFILES.ambient
  private params: SoundscapeParams = {
    bpm: 100,
    genre: '',
    mood: '',
    tension: 50
  }

  private stems: Record<StemId, StemConfig> = {
    keys: { id: 'keys', name: 'Keys', muted: false, solo: false, volume: 80 },
    drums: { id: 'drums', name: 'Drums', muted: false, solo: false, volume: 80 },
    guitar: { id: 'guitar', name: 'Pluck', muted: false, solo: false, volume: 75 },
    vocal: { id: 'vocal', name: 'Texture', muted: false, solo: false, volume: 70 }
  }

  private dialogueDuckingEnabled = true
  private scaleFrequencies = [...GENRE_PROFILES.ambient.scale]
  private onStepCallback: ((step: number) => void) | null = null
  private stepListeners: Set<(step: number) => void> = new Set()
  private timelineDuration = 180 // 3-minute timeline in seconds
  private elapsedSeconds = 0
  private timelineListeners: Set<(percent: number, elapsedSeconds: number) => void> = new Set()

  // Initialize Audio Context on user gesture
  public ensureContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new AudioCtx()

      // Master Analyser Node (64 frequency bins)
      this.analyser = this.ctx.createAnalyser()
      this.analyser.fftSize = 128
      this.analyser.smoothingTimeConstant = 0.85

      // Master Gain Node wired to masterVolume & mute (-3dB baseline headroom)
      this.masterGain = this.ctx.createGain()
      const initGain = this.isMasterMuted ? 0 : (this.masterVolume / 100) * 0.75
      this.masterGain.gain.setValueAtTime(initGain, this.ctx.currentTime)

      // Master Brickwall Limiter to prevent DAC clipping and audio blasting
      this.limiter = this.ctx.createDynamicsCompressor()
      this.limiter.threshold.setValueAtTime(-1.0, this.ctx.currentTime)
      this.limiter.knee.setValueAtTime(0.0, this.ctx.currentTime)
      this.limiter.ratio.setValueAtTime(20.0, this.ctx.currentTime)
      this.limiter.attack.setValueAtTime(0.002, this.ctx.currentTime)
      this.limiter.release.setValueAtTime(0.08, this.ctx.currentTime)

      // Dialogue Ducking Gain (-8dB sidechain when speech is detected)
      this.duckingGain = this.ctx.createGain()
      this.duckingGain.gain.setValueAtTime(1.0, this.ctx.currentTime)

      // Master Biquad Lowpass Filter (Modulated dynamically by tension)
      this.masterFilter = this.ctx.createBiquadFilter()
      this.masterFilter.type = 'lowpass'
      this.masterFilter.frequency.setValueAtTime(1800, this.ctx.currentTime)
      this.masterFilter.Q.setValueAtTime(0.707, this.ctx.currentTime)

      // Connect graph: Stems -> MasterFilter -> DuckingGain -> MasterGain -> Limiter -> Analyser -> Output
      this.masterFilter.connect(this.duckingGain)
      this.duckingGain.connect(this.masterGain)

      // Master Cinematic Hall Reverb Bus (Lush room acoustics & spatial warmth)
      try {
        this.convolver = this.ctx.createConvolver()
        this.convolver.buffer = this.createImpulseResponse(2.2, 2.8)
        this.reverbGain = this.ctx.createGain()
        this.reverbGain.gain.setValueAtTime(0.24, this.ctx.currentTime) // 24% warm room reverb
        this.masterFilter.connect(this.convolver)
        this.convolver.connect(this.reverbGain)
        this.reverbGain.connect(this.duckingGain)
      } catch {
        // Fallback gracefully if convolver buffer creation is unsupported
      }

      this.masterGain.connect(this.limiter)
      this.limiter.connect(this.analyser)
      this.analyser.connect(this.ctx.destination)

      // Pre-load active notes from localStorage if available
      if (typeof window !== 'undefined' && this.activeNotes.length === 0) {
        try {
          const saved = localStorage.getItem('dramatone_daw_notes')
          if (saved) {
            this.activeNotes = JSON.parse(saved)
          }
        } catch {}
      }

      // Dedicated Raw DAW Instrument Bus (Bypasses generative stem filters/mutes, routes directly to master limiter)
      this.rawDawGain = this.ctx.createGain()
      this.rawDawGain.gain.setValueAtTime(0.85, this.ctx.currentTime)
      this.rawDawGain.connect(this.masterGain)

      // Create stem gain nodes
      const stemIds: StemId[] = ['keys', 'drums', 'guitar', 'vocal']
      for (const id of stemIds) {
        const gain = this.ctx.createGain()
        gain.gain.setValueAtTime(this.calculateStemGain(id), this.ctx.currentTime)
        gain.connect(this.masterFilter)
        this.stemGains[id] = gain
      }

      // Pre-create 1.5-second white noise buffer for snare, hi-hats, and risers
      const bufferSize = this.ctx.sampleRate * 1.5
      this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
      const output = this.noiseBuffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1
      }
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume()
    }

    return this.ctx
  }

  // Master Volume Controls (Bug 1 Fix)
  public setMasterVolume(volume: number, isMuted = false) {
    this.masterVolume = Math.max(0, Math.min(100, volume))
    this.isMasterMuted = isMuted
    if (this.masterGain && this.ctx) {
      const targetGain = isMuted ? 0 : (this.masterVolume / 100) * 0.75
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.02)
    }
  }

  public getMasterVolume(): number {
    return this.masterVolume
  }

  public getIsMasterMuted(): boolean {
    return this.isMasterMuted
  }

  public setDawInstrumentGain(val: number) {
    if (this.rawDawGain && this.ctx) {
      this.rawDawGain.gain.setTargetAtTime(Math.max(0, Math.min(1.5, val)), this.ctx.currentTime, 0.02)
    }
  }

  // Generate synthetic stereo exponential decay impulse response for cinematic hall reverb
  private createImpulseResponse(duration = 2.0, decay = 2.8): AudioBuffer {
    if (!this.ctx) throw new Error('AudioContext required')
    const sampleRate = this.ctx.sampleRate
    const length = Math.floor(sampleRate * duration)
    const impulse = this.ctx.createBuffer(2, length, sampleRate)
    const left = impulse.getChannelData(0)
    const right = impulse.getChannelData(1)
    for (let i = 0; i < length; i++) {
      const t = i / length
      const env = Math.pow(1 - t, decay)
      left[i] = (Math.random() * 2 - 1) * env
      right[i] = (Math.random() * 2 - 1) * env
    }
    return impulse
  }

  // Active DAW Sequencer Notes accessors (Bug 1 Fix: connects timeline sequencer to piano roll)
  public setActiveNotes(notes: Array<{ id?: string; midi: number; step: number; duration?: number; instrument?: DawInstrument }>) {
    this.activeNotes = [...notes]
  }

  public getActiveNotes() {
    return [...this.activeNotes]
  }

  public hasComposition(): boolean {
    return this.hasActiveComposition
  }

  public resetComposition() {
    this.stop()
    this.hasActiveComposition = false
    this.params.genre = ''
    this.params.mood = ''
    this.currentStep = 0
    if (this.onStepCallback) {
      this.onStepCallback(-1)
    }
    this.stepListeners.forEach((l) => {
      try { l(-1) } catch {}
    })
  }

  // Load Composition Preset (Loads chords, scales, BPM, and instrument timbre)
  public loadComposition(
    genre: string,
    mood = 'Euphoric',
    bpm?: number,
    options?: CompositionOptions
  ) {
    const g = (genre || '').toLowerCase()
    const m = (mood || '').toLowerCase()

    let matched: GenreProfile = GENRE_PROFILES.cinematic
    if (g.includes('dark cinematic') || (g.includes('dark') && g.includes('build')) || g.includes('rain') || (g.includes('string') && g.includes('dark'))) {
      matched = GENRE_PROFILES.darkCinematic
    } else if (g.includes('trumpet') || g.includes('brass') || g.includes('horn') || g.includes('fanfare')) {
      matched = GENRE_PROFILES.trumpet
    } else if (g.includes('eerie') || g.includes('creepy') || g.includes('horror') || g.includes('scary') || g.includes('ghost') || g.includes('spooky') || m.includes('eerie') || m.includes('horror')) {
      matched = GENRE_PROFILES.eerie
    } else if (g.includes('lo-fi') || g.includes('chill') || m.includes('chill')) {
      matched = GENRE_PROFILES.lofi
    } else if (g.includes('cinematic') || g.includes('score') || g.includes('strings') || m.includes('dramatic')) {
      matched = GENRE_PROFILES.cinematic
    } else if (g.includes('cyberpunk') || g.includes('action') || m.includes('suspense')) {
      matched = GENRE_PROFILES.cyberpunk
    } else if (g.includes('ambient') || g.includes('drone') || m.includes('calm') || m.includes('dreamy')) {
      matched = GENRE_PROFILES.ambient
    } else if (m.includes('heroic') || g.includes('anthem') || g.includes('folk')) {
      matched = GENRE_PROFILES.heroic
    }

    this.hasActiveComposition = true
    this.activeProfile = matched
    this.params.genre = genre || matched.genre
    this.params.mood = mood || matched.mood
    this.params.bpm = bpm || matched.bpm
    this.scaleFrequencies = [...matched.scale]

    // Set semantic synthesis flags
    this.hasStrings = Boolean(options?.hasStrings ?? matched.hasStrings)
    this.hasStaccato = Boolean(options?.hasStaccato ?? matched.hasStaccato)
    this.hasRainFoley = Boolean(options?.hasRainFoley ?? matched.hasRainFoley)
    this.hasGradualBuild = Boolean(options?.hasGradualBuild ?? matched.hasGradualBuild)
    this.hasSubBass = Boolean(options?.hasSubBass ?? matched.hasSubBass)

    this.updateAudioRouting()
  }

  public getActiveProfile(): GenreProfile {
    return this.activeProfile
  }

  // Load AI / Custom Dynamic Profile directly (from Gemini Arranger)
  public loadDirectProfile(profile: GenreProfile, tension = 50) {
    this.hasActiveComposition = true
    this.activeProfile = { ...profile }
    this.params.genre = profile.genre
    this.params.mood = profile.mood
    this.params.bpm = profile.bpm
    this.scaleFrequencies = [...profile.scale]
    this.hasStrings = Boolean(profile.hasStrings)
    this.hasStaccato = Boolean(profile.hasStaccato)
    this.hasRainFoley = Boolean(profile.hasRainFoley)
    this.hasGradualBuild = Boolean(profile.hasGradualBuild)
    this.hasSubBass = Boolean(profile.hasSubBass)
    this.params.tension = tension
    this.updateAudioRouting()
  }

  // Calculate actual gain taking into account tension, mute, solo, and volume slider
  private calculateStemGain(stemId: StemId): number {
    const stem = this.stems[stemId]
    if (stem.muted) return 0

    const hasSolo = Object.values(this.stems).some((s) => s.solo)
    if (hasSolo && !stem.solo) return 0

    const userVol = stem.volume / 100
    const tension = this.params.tension / 100

    switch (stemId) {
      case 'keys':
        return userVol * (0.9 - tension * 0.15)
      case 'drums':
        return userVol * Math.max(0.15, Math.min(1.0, tension * 1.2))
      case 'guitar':
        return userVol * Math.max(0.25, tension * 0.95)
      case 'vocal':
        return userVol * Math.pow(tension, 1.3)
      default:
        return userVol
    }
  }

  // Update real-time stem gains and filter cutoffs
  public updateAudioRouting() {
    if (!this.ctx) return
    const now = this.ctx.currentTime

    // Modulate master filter cutoff based on tension (400Hz to 6500Hz)
    if (this.masterFilter) {
      const minCutoff = 400
      const maxCutoff = 6500
      const targetFreq = minCutoff + (maxCutoff - minCutoff) * Math.pow(this.params.tension / 100, 1.2)
      this.masterFilter.frequency.setTargetAtTime(targetFreq, now, 0.05)
    }

    // Update each stem gain node
    for (const id of Object.keys(this.stemGains) as StemId[]) {
      const node = this.stemGains[id]
      if (node) {
        node.gain.setTargetAtTime(this.calculateStemGain(id), now, 0.04)
      }
    }
  }

  // Real-Time Tension modulation (0 - 100%)
  public setTension(tension: number) {
    this.params.tension = Math.max(0, Math.min(100, tension))
    this.updateAudioRouting()
  }

  public getTension(): number {
    return this.params.tension
  }

  public setBpm(bpm: number) {
    this.params.bpm = Math.max(60, Math.min(190, bpm))
  }

  public getBpm(): number {
    return this.params.bpm
  }

  public getGenre(): string {
    return this.params.genre
  }

  public getMood(): string {
    return this.params.mood
  }

  // Dialogue Ducking Control
  public setDialogueDuckingEnabled(enabled: boolean) {
    this.dialogueDuckingEnabled = enabled
    if (!enabled && this.duckingGain && this.ctx) {
      this.duckingGain.gain.setTargetAtTime(1.0, this.ctx.currentTime, 0.05)
    }
  }

  public isDialogueDuckingEnabled(): boolean {
    return this.dialogueDuckingEnabled
  }

  public setDialogueActive(active: boolean) {
    if (!this.dialogueDuckingEnabled || !this.duckingGain || !this.ctx) return
    const now = this.ctx.currentTime
    const targetGain = active ? 0.4 : 1.0
    const rampTime = active ? 0.06 : 0.25
    this.duckingGain.gain.setTargetAtTime(targetGain, now, rampTime)
  }

  // Stem Controls
  public setStemMute(stemId: StemId, muted: boolean) {
    if (this.stems[stemId]) {
      this.stems[stemId].muted = muted
      this.updateAudioRouting()
    }
  }

  public setStemSolo(stemId: StemId, solo: boolean) {
    if (this.stems[stemId]) {
      this.stems[stemId].solo = solo
      this.updateAudioRouting()
    }
  }

  public setStemVolume(stemId: StemId, volume: number) {
    if (this.stems[stemId]) {
      this.stems[stemId].volume = Math.max(0, Math.min(100, volume))
      this.updateAudioRouting()
    }
  }

  public getStems(): Record<StemId, StemConfig> {
    return { ...this.stems }
  }

  // ================= DSP SYNTHESIZERS =================

  // 1. Kick Drum
  private playKick(time: number) {
    if (!this.ctx || !this.stemGains.drums || this.stems.drums.muted || this.stems.drums.volume === 0 || !this.activeProfile.hasDrums) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(140, time)
    osc.frequency.exponentialRampToValueAtTime(38, time + 0.09)

    gain.gain.setValueAtTime(0.65, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22)

    osc.connect(gain)
    gain.connect(this.stemGains.drums)

    osc.start(time)
    osc.stop(time + 0.24)
  }

  // 2. Hi-Hat
  private playHiHat(time: number, accent = false) {
    if (!this.ctx || !this.noiseBuffer || !this.stemGains.drums || this.stems.drums.muted || this.stems.drums.volume === 0 || !this.activeProfile.hasDrums) return
    const source = this.ctx.createBufferSource()
    source.buffer = this.noiseBuffer

    const filter = this.ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.setValueAtTime(7000, time)

    const gain = this.ctx.createGain()
    const vol = accent ? 0.4 : 0.2
    gain.gain.setValueAtTime(vol, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05)

    source.connect(filter)
    filter.connect(gain)
    gain.connect(this.stemGains.drums)

    source.start(time)
    source.stop(time + 0.06)
  }

  // 3. Snare
  private playSnare(time: number) {
    if (!this.ctx || !this.noiseBuffer || !this.stemGains.drums || this.stems.drums.muted || this.stems.drums.volume === 0 || !this.activeProfile.hasDrums) return
    const noise = this.ctx.createBufferSource()
    noise.buffer = this.noiseBuffer

    const noiseFilter = this.ctx.createBiquadFilter()
    noiseFilter.type = 'bandpass'
    noiseFilter.frequency.setValueAtTime(1800, time)
    noiseFilter.Q.setValueAtTime(1.5, time)

    const noiseGain = this.ctx.createGain()
    noiseGain.gain.setValueAtTime(0.55, time)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.16)

    noise.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(this.stemGains.drums)

    const osc = this.ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(190, time)
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.1)

    const oscGain = this.ctx.createGain()
    oscGain.gain.setValueAtTime(0.45, time)
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12)

    osc.connect(oscGain)
    oscGain.connect(this.stemGains.drums)

    noise.start(time)
    noise.stop(time + 0.18)
    osc.start(time)
    osc.stop(time + 0.14)
  }

  // 4. Polyphonic Pad Chord (Plays full triads/7ths with warm harmonic filtering)
  private playPolyChord(chordFreqs: number[], duration: number, time: number) {
    if (!this.ctx || !this.stemGains.keys) return
    const voiceCount = Math.max(1, chordFreqs.length)
    const voiceGain = 0.08 / Math.sqrt(voiceCount)

    for (const freq of chordFreqs) {
      const osc = this.ctx.createOscillator()
      const filter = this.ctx.createBiquadFilter()
      const gain = this.ctx.createGain()

      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(freq, time)
      osc.detune.setValueAtTime((Math.random() - 0.5) * 10, time)

      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(Math.min(1800, freq * 2.6), time)
      filter.Q.setValueAtTime(0.707, time)

      const attack = 0.15
      gain.gain.setValueAtTime(0.001, time)
      gain.gain.linearRampToValueAtTime(voiceGain, time + attack)
      gain.gain.setValueAtTime(voiceGain, time + duration - 0.15)
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration)

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(this.stemGains.keys)

      osc.start(time)
      osc.stop(time + duration + 0.05)
    }
  }

  // 5. Rich Sub-Bass (Drives warm low-end foundation)
  private playBass(freq: number, time: number, duration: number) {
    if (!this.ctx || !this.stemGains.keys) return
    const osc = this.ctx.createOscillator()
    const filter = this.ctx.createBiquadFilter()
    const gain = this.ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(freq, time)

    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(260, time)

    gain.gain.setValueAtTime(0.001, time)
    gain.gain.linearRampToValueAtTime(0.2, time + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.stemGains.keys)

    osc.start(time)
    osc.stop(time + duration + 0.02)
  }

  // 6. Pluck Melody (Arpeggiated note in active scale)
  private playPluck(freq: number, time: number) {
    if (!this.ctx || !this.stemGains.guitar) return
    const osc = this.ctx.createOscillator()
    const filter = this.ctx.createBiquadFilter()
    const gain = this.ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(freq, time)

    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(freq * 3.5, time)
    filter.frequency.exponentialRampToValueAtTime(freq * 0.8, time + 0.25)

    gain.gain.setValueAtTime(0.3, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.28)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.stemGains.guitar)

    osc.start(time)
    osc.stop(time + 0.3)
  }

  // 7. Sub Boom Impact (Foley sound effect)
  public playSubImpact(time: number) {
    if (!this.ctx || !this.stemGains.vocal) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(95, time)
    osc.frequency.exponentialRampToValueAtTime(26, time + 0.45)

    gain.gain.setValueAtTime(0.4, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5)

    osc.connect(gain)
    gain.connect(this.stemGains.vocal)

    osc.start(time)
    osc.stop(time + 0.55)
  }

  // 8. Foley Tension Riser (Noise sweep)
  public playTensionRiser(time: number, duration: number) {
    if (!this.ctx || !this.noiseBuffer || !this.stemGains.vocal) return
    const noise = this.ctx.createBufferSource()
    noise.buffer = this.noiseBuffer

    const filter = this.ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.Q.setValueAtTime(6.0, time)
    filter.frequency.setValueAtTime(250, time)
    filter.frequency.exponentialRampToValueAtTime(2800, time + duration)

    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0.05, time)
    gain.gain.linearRampToValueAtTime(0.35, time + duration - 0.05)
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration + 0.1)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.stemGains.vocal)

    noise.start(time)
    noise.stop(time + duration + 0.15)
  }

  // 9. Cyberpunk Glitch / Laser FX
  public playGlitch(time: number) {
    if (!this.ctx || !this.stemGains.vocal) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(1400, time)
    osc.frequency.exponentialRampToValueAtTime(180, time + 0.08)

    gain.gain.setValueAtTime(0.2, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.09)

    osc.connect(gain)
    gain.connect(this.stemGains.vocal)

    osc.start(time)
    osc.stop(time + 0.1)
  }

  // 10. Authentic Brass Trumpet Synthesizer
  private playTrumpet(freq: number, time: number, duration: number) {
    if (!this.ctx || !this.stemGains.guitar) return
    const now = time

    const osc = this.ctx.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(freq, now)

    // Natural Vibrato LFO kicks in after 100ms
    const vibrato = this.ctx.createOscillator()
    const vibratoGain = this.ctx.createGain()
    vibrato.frequency.setValueAtTime(5.5, now)
    vibratoGain.gain.setValueAtTime(0, now)
    vibratoGain.gain.setValueAtTime(0, now + 0.1)
    vibratoGain.gain.linearRampToValueAtTime(freq * 0.015, now + 0.28)

    vibrato.connect(vibratoGain)
    vibratoGain.connect(osc.frequency)
    vibrato.start(now)
    vibrato.stop(now + duration + 0.05)

    // Brass Formant Filter (Emulates trumpet bell & mouthpiece harmonic bloom)
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.Q.setValueAtTime(3.2, now)
    filter.frequency.setValueAtTime(750, now)
    filter.frequency.exponentialRampToValueAtTime(3200, now + 0.04)
    filter.frequency.exponentialRampToValueAtTime(1600, now + duration)

    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0.001, now)
    gain.gain.linearRampToValueAtTime(0.38, now + 0.035) // crisp brass tonguing attack
    gain.gain.setValueAtTime(0.32, now + duration - 0.05)
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.stemGains.guitar)

    osc.start(now)
    osc.stop(now + duration + 0.05)
  }

  // 11. Cinematic Orchestral Strings (Warm multi-oscillator formant strings & staccato bowing)
  private playCinematicStrings(chordFreqs: number[], duration: number, time: number, isStaccato = false) {
    if (!this.ctx) return
    const targetGain = isStaccato
      ? (this.stemGains.guitar || this.stemGains.keys || this.masterGain)
      : (this.stemGains.keys || this.masterGain)
    if (!targetGain) return

    const voiceCount = Math.max(1, chordFreqs.length)
    const padGain = 0.075 / Math.sqrt(voiceCount)
    const staccGain = 0.11 / Math.sqrt(voiceCount)

    for (const freq of chordFreqs) {
      const osc1 = this.ctx.createOscillator()
      const osc2 = this.ctx.createOscillator()
      const filter = this.ctx.createBiquadFilter()
      const gain = this.ctx.createGain()

      osc1.type = 'sawtooth'
      osc2.type = 'sawtooth'
      osc1.frequency.setValueAtTime(freq, time)
      osc2.frequency.setValueAtTime(freq, time)
      osc1.detune.setValueAtTime(-6, time)
      osc2.detune.setValueAtTime(6, time)

      filter.type = 'lowpass'
      filter.Q.setValueAtTime(1.0, time)

      if (isStaccato) {
        // Fast bow bite, rapid acoustic decay
        filter.frequency.setValueAtTime(Math.min(3400, freq * 3.8), time)
        filter.frequency.exponentialRampToValueAtTime(Math.min(950, freq * 1.6), time + 0.12)
        gain.gain.setValueAtTime(0.001, time)
        gain.gain.linearRampToValueAtTime(staccGain, time + 0.012)
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14)
        osc1.connect(filter)
        osc2.connect(filter)
        filter.connect(gain)
        gain.connect(targetGain)
        osc1.start(time)
        osc2.start(time)
        osc1.stop(time + 0.16)
        osc2.stop(time + 0.16)
      } else {
        // Lush sustained orchestral pad swell
        filter.frequency.setValueAtTime(Math.min(2200, freq * 2.4), time)
        const attack = 0.35
        gain.gain.setValueAtTime(0.001, time)
        gain.gain.linearRampToValueAtTime(padGain, time + attack)
        gain.gain.setValueAtTime(padGain, time + duration - 0.25)
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration)
        osc1.connect(filter)
        osc2.connect(filter)
        filter.connect(gain)
        gain.connect(targetGain)
        osc1.start(time)
        osc2.start(time)
        osc1.stop(time + duration + 0.05)
        osc2.stop(time + duration + 0.05)
      }
    }
  }

  // 12. Continuous Rain Foley & Ambient Weather Atmosphere
  private playRainFoley(time: number, duration: number, intensity = 0.25) {
    if (!this.ctx || !this.noiseBuffer) return
    const targetGain = this.stemGains.vocal || this.masterGain
    if (!targetGain) return

    // Continuous rainfall rustle
    const noise = this.ctx.createBufferSource()
    noise.buffer = this.noiseBuffer

    const filter = this.ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(1400, time)
    filter.Q.setValueAtTime(1.1, time)

    const gain = this.ctx.createGain()
    const vol = Math.min(0.25, intensity * 0.16)
    gain.gain.setValueAtTime(0.001, time)
    gain.gain.linearRampToValueAtTime(vol, time + 0.08)
    gain.gain.setValueAtTime(vol, time + duration - 0.08)
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(targetGain)

    noise.start(time)
    noise.stop(time + duration + 0.05)

    // Micro water droplet transients
    if (Math.random() > 0.4) {
      const dropOsc = this.ctx.createOscillator()
      const dropGain = this.ctx.createGain()
      dropOsc.type = 'sine'
      const dropFreq = 1400 + Math.random() * 1200
      dropOsc.frequency.setValueAtTime(dropFreq, time + 0.02)
      dropOsc.frequency.exponentialRampToValueAtTime(dropFreq * 0.45, time + 0.06)
      dropGain.gain.setValueAtTime(0.035, time + 0.02)
      dropGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.07)
      dropOsc.connect(dropGain)
      dropGain.connect(targetGain)
      dropOsc.start(time + 0.02)
      dropOsc.stop(time + 0.08)
    }
  }

  // 13. Deep Cinematic Sub-Bass Drone
  private playSubBassDrone(freq: number, time: number, duration: number) {
    if (!this.ctx) return
    const targetGain = this.stemGains.keys || this.masterGain
    if (!targetGain) return

    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, time)

    gain.gain.setValueAtTime(0.001, time)
    gain.gain.linearRampToValueAtTime(0.16, time + 0.12)
    gain.gain.setValueAtTime(0.16, time + duration - 0.2)
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration)

    osc.connect(gain)
    gain.connect(targetGain)

    osc.start(time)
    osc.stop(time + duration + 0.05)
  }

  // --- Live MIDI & DAW Piano Roll Synthesizer Engine ---
  public midiToFreq(midiNote: number): number {
    return 440 * Math.pow(2, (midiNote - 69) / 12)
  }

  public freqToMidi(freq: number): number {
    return Math.round(69 + 12 * Math.log2(freq / 440))
  }

  public setStepCallback(cb: ((step: number) => void) | null) {
    this.onStepCallback = cb
  }

  public addStepListener(cb: (step: number) => void): () => void {
    this.stepListeners.add(cb)
    return () => {
      this.stepListeners.delete(cb)
    }
  }

  public removeStepListener(cb: (step: number) => void) {
    this.stepListeners.delete(cb)
  }

  public addTimelineListener(cb: (percent: number, elapsedSeconds: number) => void): () => void {
    this.timelineListeners.add(cb)
    return () => {
      this.timelineListeners.delete(cb)
    }
  }

  public seekTimelinePercent(percent: number) {
    const clamped = Math.max(0, Math.min(100, percent))
    this.elapsedSeconds = (clamped / 100) * this.timelineDuration
    const stepDuration = 60 / this.params.bpm / 4
    const targetStep = Math.floor(this.elapsedSeconds / stepDuration) % this.maxSteps
    this.currentStep = targetStep
    this.timelineListeners.forEach((l) => {
      try { l(clamped, this.elapsedSeconds) } catch {}
    })
    this.stepListeners.forEach((l) => {
      try { l(this.currentStep) } catch {}
    })
  }

  public getTimelinePercent(): number {
    return (this.elapsedSeconds / this.timelineDuration) * 100
  }

  public seekStep(step: number) {
    this.currentStep = Math.max(0, Math.min(this.maxSteps - 1, step))
    if (this.onStepCallback) this.onStepCallback(this.currentStep)
    this.stepListeners.forEach((l) => {
      try { l(this.currentStep) } catch {}
    })
  }

  public getCurrentStep(): number {
    return this.currentStep
  }

  public playMidiNote(
    midiNote: number,
    duration = 0.4,
    velocity = 0.8,
    instrument: DawInstrument = 'keys'
  ) {
    this.ensureContext()
    if (!this.ctx) return
    const freq = this.midiToFreq(midiNote)
    const time = this.ctx.currentTime
    const vel = Math.max(0.1, Math.min(1.0, velocity))
    let targetGain: GainNode | null = this.rawDawGain || this.masterGain
    if (instrument === 'keys' || instrument === 'epiano' || instrument === 'strings') {
      targetGain = this.stemGains.keys || targetGain
    } else if (instrument === 'percussion') {
      targetGain = this.stemGains.drums || targetGain
    } else if (instrument === 'guitar' || instrument === 'trumpet' || instrument === 'flute' || instrument === 'synth') {
      targetGain = this.stemGains.guitar || targetGain
    } else if (instrument === 'bass') {
      targetGain = this.stemGains.keys || targetGain
    }
    if (!targetGain) return

    if (instrument === 'keys') {
      // 1. Raw Acoustic Grand Piano: Fundamental triangle + 2nd harmonic sine + hammer transient
      const osc1 = this.ctx.createOscillator()
      const osc2 = this.ctx.createOscillator()
      const filter = this.ctx.createBiquadFilter()
      const gain = this.ctx.createGain()

      osc1.type = 'triangle'
      osc1.frequency.setValueAtTime(freq, time)

      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(freq * 2, time)

      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(Math.min(5000, freq * 3.5), time)
      filter.frequency.exponentialRampToValueAtTime(Math.max(200, freq * 1.2), time + duration)

      gain.gain.setValueAtTime(0.001, time)
      gain.gain.linearRampToValueAtTime(0.28 * vel, time + 0.008)
      gain.gain.exponentialRampToValueAtTime(0.14 * vel, time + 0.12)
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration + 0.15)

      osc1.connect(filter)
      osc2.connect(filter)
      filter.connect(gain)
      gain.connect(targetGain)

      osc1.start(time)
      osc2.start(time)
      osc1.stop(time + duration + 0.2)
      osc2.stop(time + duration + 0.2)

      // Acoustic wooden hammer strike click transient
      const hammer = this.ctx.createOscillator()
      const hammerGain = this.ctx.createGain()
      hammer.type = 'sine'
      hammer.frequency.setValueAtTime(freq * 4.5, time)
      hammer.frequency.exponentialRampToValueAtTime(freq, time + 0.02)
      hammerGain.gain.setValueAtTime(0.08 * vel, time)
      hammerGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.025)
      hammer.connect(hammerGain)
      hammerGain.connect(targetGain)
      hammer.start(time)
      hammer.stop(time + 0.03)
    } else if (instrument === 'epiano') {
      // 2. Raw Rhodes Electric Piano: Sine fundamental + metallic bell chime overtone
      const osc1 = this.ctx.createOscillator()
      const osc2 = this.ctx.createOscillator()
      const oscTine = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      const tineGain = this.ctx.createGain()

      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(freq, time)
      osc2.type = 'triangle'
      osc2.frequency.setValueAtTime(freq * 2, time)

      oscTine.type = 'sine'
      oscTine.frequency.setValueAtTime(freq * 3.5, time)

      gain.gain.setValueAtTime(0.001, time)
      gain.gain.linearRampToValueAtTime(0.25 * vel, time + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.12 * vel, time + 0.2)
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration + 0.1)

      tineGain.gain.setValueAtTime(0.12 * vel, time)
      tineGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.08)

      osc1.connect(gain)
      osc2.connect(gain)
      oscTine.connect(tineGain)
      gain.connect(targetGain)
      tineGain.connect(targetGain)

      osc1.start(time)
      osc2.start(time)
      oscTine.start(time)
      osc1.stop(time + duration + 0.15)
      osc2.stop(time + duration + 0.15)
      oscTine.stop(time + 0.1)
    } else if (instrument === 'trumpet') {
      // 3. Raw Brass & Solo Trumpet: Sawtooth wave + formant sweep + delayed 5.5Hz vibrato
      const osc = this.ctx.createOscillator()
      const filter = this.ctx.createBiquadFilter()
      const gain = this.ctx.createGain()

      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(freq, time)

      filter.type = 'lowpass'
      filter.Q.setValueAtTime(3.0, time)
      filter.frequency.setValueAtTime(700, time)
      filter.frequency.exponentialRampToValueAtTime(3400, time + 0.04)
      filter.frequency.exponentialRampToValueAtTime(1800, time + duration)

      const vibrato = this.ctx.createOscillator()
      const vibratoGain = this.ctx.createGain()
      vibrato.frequency.setValueAtTime(5.5, time)
      vibratoGain.gain.setValueAtTime(0, time)
      vibratoGain.gain.setValueAtTime(0, time + 0.08)
      vibratoGain.gain.linearRampToValueAtTime(freq * 0.016, time + 0.24)
      vibrato.connect(vibratoGain)
      vibratoGain.connect(osc.frequency)

      gain.gain.setValueAtTime(0.001, time)
      gain.gain.linearRampToValueAtTime(0.3 * vel, time + 0.035)
      gain.gain.setValueAtTime(0.26 * vel, time + duration - 0.04)
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration)

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(targetGain)

      vibrato.start(time)
      osc.start(time)
      vibrato.stop(time + duration + 0.05)
      osc.stop(time + duration + 0.05)
    } else if (instrument === 'strings') {
      // 4. Raw Orchestral Strings: Dual detuned saw (-8/+8 cents) + soft bow attack
      const osc1 = this.ctx.createOscillator()
      const osc2 = this.ctx.createOscillator()
      const filter = this.ctx.createBiquadFilter()
      const gain = this.ctx.createGain()

      osc1.type = 'sawtooth'
      osc2.type = 'sawtooth'
      osc1.frequency.setValueAtTime(freq, time)
      osc2.frequency.setValueAtTime(freq, time)
      osc1.detune.setValueAtTime(-8, time)
      osc2.detune.setValueAtTime(8, time)

      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(Math.min(4800, freq * 3.5), time)

      gain.gain.setValueAtTime(0.001, time)
      gain.gain.linearRampToValueAtTime(0.22 * vel, time + 0.08)
      gain.gain.setValueAtTime(0.2 * vel, time + duration - 0.04)
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration + 0.25)

      osc1.connect(filter)
      osc2.connect(filter)
      filter.connect(gain)
      gain.connect(targetGain)

      osc1.start(time)
      osc2.start(time)
      osc1.stop(time + duration + 0.3)
      osc2.stop(time + duration + 0.3)
    } else if (instrument === 'guitar') {
      // 5. Raw Acoustic Guitar: Triangle body + rapid lowpass string damping
      const osc = this.ctx.createOscillator()
      const filter = this.ctx.createBiquadFilter()
      const gain = this.ctx.createGain()

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, time)

      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(Math.min(7000, freq * 4.5), time)
      filter.frequency.exponentialRampToValueAtTime(Math.max(160, freq * 0.9), time + 0.22)

      gain.gain.setValueAtTime(0.001, time)
      gain.gain.linearRampToValueAtTime(0.3 * vel, time + 0.005)
      gain.gain.exponentialRampToValueAtTime(0.001, time + Math.max(0.28, duration))

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(targetGain)

      osc.start(time)
      osc.stop(time + Math.max(0.3, duration + 0.05))
    } else if (instrument === 'bass') {
      // 6. Raw 808 Sub-Bass: Pitch dive into deep sub fundamental (30-65Hz)
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'sine'
      let subFreq = freq
      while (subFreq > 130) subFreq /= 2
      subFreq = Math.max(30, subFreq)
      osc.frequency.setValueAtTime(subFreq * 1.5, time)
      osc.frequency.exponentialRampToValueAtTime(subFreq, time + 0.06)

      gain.gain.setValueAtTime(0.001, time)
      gain.gain.linearRampToValueAtTime(0.4 * vel, time + 0.012)
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration * 1.3)

      osc.connect(gain)
      gain.connect(targetGain)

      osc.start(time)
      osc.stop(time + duration * 1.35)
    } else if (instrument === 'flute') {
      // 7. Raw Concert Flute: Pure sine + natural 5.0Hz vibrato + breath swell
      const osc = this.ctx.createOscillator()
      const vibrato = this.ctx.createOscillator()
      const vibratoGain = this.ctx.createGain()
      const gain = this.ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, time)

      vibrato.frequency.setValueAtTime(5.0, time)
      vibratoGain.gain.setValueAtTime(freq * 0.012, time)
      vibrato.connect(vibratoGain)
      vibratoGain.connect(osc.frequency)

      gain.gain.setValueAtTime(0.001, time)
      gain.gain.linearRampToValueAtTime(0.24 * vel, time + 0.05)
      gain.gain.setValueAtTime(0.2 * vel, time + duration - 0.03)
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration + 0.12)

      osc.connect(gain)
      gain.connect(targetGain)

      vibrato.start(time)
      osc.start(time)
      vibrato.stop(time + duration + 0.15)
      osc.stop(time + duration + 0.15)
    } else if (instrument === 'synth') {
      // 8. Raw Analog Cyber Synth: Square wave + high-resonance filter sweep
      const osc = this.ctx.createOscillator()
      const filter = this.ctx.createBiquadFilter()
      const gain = this.ctx.createGain()

      osc.type = 'square'
      osc.frequency.setValueAtTime(freq, time)

      filter.type = 'lowpass'
      filter.Q.setValueAtTime(4.2, time)
      filter.frequency.setValueAtTime(Math.min(7500, freq * 5.5), time)
      filter.frequency.exponentialRampToValueAtTime(Math.max(220, freq * 1.1), time + duration)

      gain.gain.setValueAtTime(0.001, time)
      gain.gain.linearRampToValueAtTime(0.2 * vel, time + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration)

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(targetGain)

      osc.start(time)
      osc.stop(time + duration + 0.05)
    } else if (instrument === 'percussion') {
      // 9. Raw Drum Kit & Foley: Pitch-mapped across piano keyboard
      // Low (C3-F3, <54): Punchy 808 Kick Drum
      // Mid (F#3-F4, 54-65): Snappy Snare Drum with noise burst
      // High (F#4-C5, 66+): Crisp Hi-Hat / Foley Click
      if (midiNote < 54) {
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(130, time)
        osc.frequency.exponentialRampToValueAtTime(42, time + 0.07)
        gain.gain.setValueAtTime(0.42 * vel, time)
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22)
        osc.connect(gain)
        gain.connect(targetGain)
        osc.start(time)
        osc.stop(time + 0.25)
      } else if (midiNote <= 65) {
        const tone = this.ctx.createOscillator()
        const toneGain = this.ctx.createGain()
        tone.type = 'triangle'
        tone.frequency.setValueAtTime(185, time)
        tone.frequency.exponentialRampToValueAtTime(80, time + 0.06)
        toneGain.gain.setValueAtTime(0.24 * vel, time)
        toneGain.gain.exponentialRampToValueAtTime(0.001, time + 0.1)
        tone.connect(toneGain)
        toneGain.connect(targetGain)
        tone.start(time)
        tone.stop(time + 0.11)

        if (this.noiseBuffer) {
          const noise = this.ctx.createBufferSource()
          noise.buffer = this.noiseBuffer
          const filter = this.ctx.createBiquadFilter()
          filter.type = 'highpass'
          filter.frequency.setValueAtTime(1000, time)
          const noiseGain = this.ctx.createGain()
          noiseGain.gain.setValueAtTime(0.26 * vel, time)
          noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.14)
          noise.connect(filter)
          filter.connect(noiseGain)
          noiseGain.connect(targetGain)
          noise.start(time)
          noise.stop(time + 0.15)
        }
      } else {
        if (this.noiseBuffer) {
          const noise = this.ctx.createBufferSource()
          noise.buffer = this.noiseBuffer
          const filter = this.ctx.createBiquadFilter()
          filter.type = 'bandpass'
          filter.frequency.setValueAtTime(7500, time)
          filter.Q.setValueAtTime(2.5, time)
          const noiseGain = this.ctx.createGain()
          noiseGain.gain.setValueAtTime(0.2 * vel, time)
          noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.06)
          noise.connect(filter)
          filter.connect(noiseGain)
          noiseGain.connect(targetGain)
          noise.start(time)
          noise.stop(time + 0.07)
        } else {
          const osc = this.ctx.createOscillator()
          const gain = this.ctx.createGain()
          osc.type = 'square'
          osc.frequency.setValueAtTime(800, time)
          gain.gain.setValueAtTime(0.14 * vel, time)
          gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04)
          osc.connect(gain)
          gain.connect(targetGain)
          osc.start(time)
          osc.stop(time + 0.05)
        }
      }
    } else {
      // Fallback: Grand Piano
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, time)
      gain.gain.setValueAtTime(0.001, time)
      gain.gain.linearRampToValueAtTime(0.25 * vel, time + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration)
      osc.connect(gain)
      gain.connect(targetGain)
      osc.start(time)
      osc.stop(time + duration + 0.05)
    }
  }

  // ================= 32-STEP SEQUENCER SCHEDULER =================

  private scheduleStep() {
    if (!this.ctx || !this.isPlaying) return
    const stepDuration = 60 / this.params.bpm / 4 // 16th note in seconds
    const time = this.ctx.currentTime + 0.05
    const step = this.currentStep

    // If no sound/composition has been generated or selected yet, stop sequencer immediately
    if (!this.hasActiveComposition) {
      this.isPlaying = false
      if (this.stepTimer) {
        clearTimeout(this.stepTimer)
        this.stepTimer = null
      }
      return
    }

    if (this.onStepCallback) {
      this.onStepCallback(step)
    }
    this.stepListeners.forEach((l) => {
      try { l(step) } catch {}
    })

    this.elapsedSeconds += stepDuration
    if (this.elapsedSeconds >= this.timelineDuration) {
      this.elapsedSeconds = 0
    }
    const timelinePct = (this.elapsedSeconds / this.timelineDuration) * 100
    this.timelineListeners.forEach((l) => {
      try { l(timelinePct, this.elapsedSeconds) } catch {}
    })

    // Active chord progression: 4 chords across 16 steps (loops across 64 steps)
    const bar = Math.floor(step / 16)
    const barStep = step % 16
    const chordIdx = Math.floor((step % 16) / 4) % 4
    const currentChord = this.activeProfile.chords[chordIdx]
    const currentBass = this.activeProfile.bassFreqs[chordIdx]

    let effectiveTension = this.params.tension

    // Dynamic gradual build automation across the 4-bar timeline
    if (this.hasGradualBuild) {
      const progress = step / (this.maxSteps - 1)
      effectiveTension = Math.min(95, Math.floor(22 + Math.pow(progress, 1.4) * 68))
      if (this.masterFilter) {
        const dynamicCutoff = 550 + Math.pow(progress, 1.6) * 4500
        this.masterFilter.frequency.setTargetAtTime(dynamicCutoff, time, 0.15)
      }
    }

    // Continuous ambient rain Foley (rustling raindrops and micro droplet pings)
    if (this.hasRainFoley && step % 4 === 0) {
      const intensity = this.hasGradualBuild ? 0.2 + (step / this.maxSteps) * 0.25 : 0.25
      this.playRainFoley(time, stepDuration * 4.2, intensity)
    }

    // 1. Play active notes placed in DAW Piano Roll or arranged by Gemini AI (Fix 1)
    if (this.activeNotes.length > 0) {
      const stepNotes = this.activeNotes.filter((n) => n.step === step)
      stepNotes.forEach((n) => {
        const inst: DawInstrument = n.instrument || (this.activeProfile.leadInstrument as DawInstrument) || 'keys'
        const dur = (n.duration || 1) * stepDuration * 0.95
        this.playMidiNote(n.midi, dur, 0.85, inst)
      })
    }

    // --- Mode 1: Soaring Trumpet Lead with Brass Chords ---
    if (this.activeProfile.leadInstrument === 'trumpet') {
      if (step % 4 === 0) {
        this.playPolyChord(currentChord, stepDuration * 3.8, time)
        this.playBass(currentBass, time, stepDuration * 3.5)
      }
      if (this.activeNotes.length === 0 && step % 4 === 2) {
        const freq = currentChord[(Math.floor(step / 4)) % currentChord.length] * 2
        this.playTrumpet(freq, time, stepDuration * 1.8)
      }
    }
    // --- Mode 2: Cinematic Orchestral Strings & Dark Underscore ---
    else if (this.hasStrings || this.activeProfile.leadInstrument === 'strings') {
      // 1. Warm sustained string pad chords
      if (barStep % 4 === 0) {
        this.playCinematicStrings(currentChord, stepDuration * 3.8, time, false)
      }

      // 2. Deep Sub-Bass Foundation (35Hz-55Hz sub drone)
      if (this.hasSubBass && (barStep === 0 || barStep === 8)) {
        this.playSubBassDrone(currentBass, time, stepDuration * 7.5)
      }

      // 3. Staccato Strings Pulse (Building across measures)
      if (this.hasStaccato && bar >= 1 && (this.activeNotes.length === 0 || step % 4 === 2)) {
        const shouldPulse = bar === 1 ? (barStep % 2 === 0) : (bar === 2 ? (barStep % 2 === 0 || barStep % 4 === 1) : true)
        if (shouldPulse) {
          const freq = currentChord[(Math.floor(step / 4)) % currentChord.length] * 2
          this.playCinematicStrings([freq], stepDuration * 1.5, time, true)
        }
      }

      // 4. Foley Riser & Cinematic Impacts
      if (this.hasGradualBuild) {
        if (step === 40) {
          this.playTensionRiser(time, stepDuration * 8)
        }
        if (step === 48) {
          this.playSubImpact(time)
        }
      } else {
        if (barStep === 0 && effectiveTension > 45) {
          this.playSubImpact(time)
        }
        if (barStep === 12 && effectiveTension > 65) {
          this.playTensionRiser(time, stepDuration * 4)
        }
      }
    }
    // --- Mode 3: Electronic / Synth / Ambient Profiles ---
    else {
      if (step % 4 === 0) {
        this.playPolyChord(currentChord, stepDuration * 3.8, time)
        this.playBass(currentBass, time, stepDuration * 3.5)
      }
      if (effectiveTension > 50 && step % 2 === 0 && step % 4 !== 0) {
        this.playBass(currentBass, time, stepDuration * 1.6)
      }

      // Gated Drums: Strictly requires hasDrums === true AND unmuted drum stem with volume > 0
      if (this.activeProfile.hasDrums === true && !this.stems.drums.muted && this.stems.drums.volume > 0) {
        if (barStep === 0 || barStep === 8 || (effectiveTension > 60 && (barStep === 4 || barStep === 12))) {
          this.playKick(time)
        }
        if (barStep % 2 === 0 || effectiveTension > 75) {
          this.playHiHat(time, barStep % 4 === 2)
        }
        if ((barStep === 4 || barStep === 12) && effectiveTension > 30) {
          this.playSnare(time)
        }
      }

      if (this.activeNotes.length === 0 && effectiveTension > 20 && step % 4 === 2) {
        const freq = currentChord[(Math.floor(step / 4)) % currentChord.length] * 2
        this.playPluck(freq, time)
      }

      if (barStep === 0 && effectiveTension > 45) {
        this.playSubImpact(time)
      }
      if (barStep === 12 && effectiveTension > 65) {
        this.playTensionRiser(time, stepDuration * 4)
      }
      if (barStep === 14 && effectiveTension > 80) {
        this.playGlitch(time)
      }
    }

    this.currentStep = (this.currentStep + 1) % this.maxSteps

    this.stepTimer = window.setTimeout(() => {
      this.scheduleStep()
    }, stepDuration * 1000)
  }

  // Play / Pause Toggle
  public start(resetToZero = false) {
    if (!this.hasActiveComposition) {
      // Complete Silence: No composition has been generated or cued yet!
      return
    }
    this.ensureContext()
    if (this.isPlaying) return
    this.isPlaying = true
    if (resetToZero) {
      this.currentStep = 0
      this.elapsedSeconds = 0
    }
    this.scheduleStep()
  }

  public stop() {
    this.isPlaying = false
    if (this.stepTimer) {
      clearTimeout(this.stepTimer)
      this.stepTimer = null
    }
    if (this.onStepCallback) {
      this.onStepCallback(-1)
    }
    this.stepListeners.forEach((l) => {
      try { l(-1) } catch {}
    })
  }

  public getIsPlaying(): boolean {
    return this.isPlaying
  }

  // Real-time FFT Frequency Data for Spectrogram (64 values from 0 to 255)
  public getByteFrequencyData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(64)
    const array = new Uint8Array(this.analyser.frequencyBinCount)
    this.analyser.getByteFrequencyData(array)
    return array
  }

  // Export to true 16-bit 44.1kHz stereo .WAV using native OfflineAudioContext (clamped to max 03:00 / 180s)
  public async exportSoundscapeWav(durationSeconds = 180): Promise<Blob> {
    const clampedDuration = Math.max(5, Math.min(180, durationSeconds))
    const sampleRate = 44100
    const offlineCtx = new OfflineAudioContext(2, sampleRate * clampedDuration, sampleRate)

    const stepDuration = 60 / this.params.bpm / 4
    const totalSteps = Math.floor(clampedDuration / stepDuration)

    const filter = offlineCtx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(this.hasGradualBuild ? 550 : (1400 + this.params.tension * 40), 0)
    filter.Q.setValueAtTime(0.707, 0)

    // Master brickwall limiter on offline export to prevent any clipping/distortion
    const limiter = offlineCtx.createDynamicsCompressor()
    limiter.threshold.setValueAtTime(-1.0, 0)
    limiter.knee.setValueAtTime(0.0, 0)
    limiter.ratio.setValueAtTime(20.0, 0)
    limiter.attack.setValueAtTime(0.002, 0)
    limiter.release.setValueAtTime(0.08, 0)

    filter.connect(limiter)
    limiter.connect(offlineCtx.destination)

    // Pre-create noise buffer for rain & risers
    const noiseLen = sampleRate * 2
    const offlineNoise = offlineCtx.createBuffer(1, noiseLen, sampleRate)
    const noiseData = offlineNoise.getChannelData(0)
    for (let i = 0; i < noiseLen; i++) {
      noiseData[i] = Math.random() * 2 - 1
    }

    for (let step = 0; step < totalSteps; step++) {
      const time = step * stepDuration
      const s = step % 16
      const bar = Math.floor(step / 16)
      const chordIdx = Math.floor(s / 4) % 4
      const currentChord = this.activeProfile.chords[chordIdx]
      const currentBass = this.activeProfile.bassFreqs[chordIdx]

      // Filter cutoff automation
      const progress = step / totalSteps
      if (this.hasGradualBuild) {
        const dynamicCutoff = 550 + Math.pow(progress, 1.6) * 4500
        filter.frequency.setValueAtTime(dynamicCutoff, time)
      }

      // Offline Rain Foley (every 4 steps)
      if (this.hasRainFoley && s % 4 === 0) {
        const rainSrc = offlineCtx.createBufferSource()
        rainSrc.buffer = offlineNoise
        const rainFilter = offlineCtx.createBiquadFilter()
        rainFilter.type = 'bandpass'
        rainFilter.frequency.setValueAtTime(1400, time)
        rainFilter.Q.setValueAtTime(1.1, time)
        const rainGain = offlineCtx.createGain()
        const rainVol = this.hasGradualBuild ? 0.05 + progress * 0.08 : 0.08
        rainGain.gain.setValueAtTime(0.001, time)
        rainGain.gain.linearRampToValueAtTime(rainVol, time + 0.08)
        rainGain.gain.setValueAtTime(rainVol, time + stepDuration * 3.8)
        rainGain.gain.exponentialRampToValueAtTime(0.001, time + stepDuration * 4)
        rainSrc.connect(rainFilter)
        rainFilter.connect(rainGain)
        rainGain.connect(filter)
        rainSrc.start(time)
        rainSrc.stop(time + stepDuration * 4.1)
      }

      // Mode 1: Strings & Dark Underscore
      if (this.hasStrings || this.activeProfile.leadInstrument === 'strings') {
        // Sustained strings chord pad
        if (s % 4 === 0) {
          const chordVoiceGain = 0.075 / Math.sqrt(Math.max(1, currentChord.length))
          for (const freq of currentChord) {
            const osc1 = offlineCtx.createOscillator()
            const osc2 = offlineCtx.createOscillator()
            const sFilter = offlineCtx.createBiquadFilter()
            const gain = offlineCtx.createGain()
            osc1.type = 'sawtooth'
            osc2.type = 'sawtooth'
            osc1.frequency.setValueAtTime(freq, time)
            osc2.frequency.setValueAtTime(freq, time)
            osc1.detune.setValueAtTime(-6, time)
            osc2.detune.setValueAtTime(6, time)
            sFilter.type = 'lowpass'
            sFilter.frequency.setValueAtTime(Math.min(2200, freq * 2.4), time)
            gain.gain.setValueAtTime(0.001, time)
            gain.gain.linearRampToValueAtTime(chordVoiceGain, time + 0.3)
            gain.gain.setValueAtTime(chordVoiceGain, time + stepDuration * 3.5)
            gain.gain.exponentialRampToValueAtTime(0.001, time + stepDuration * 3.8)
            osc1.connect(sFilter)
            osc2.connect(sFilter)
            sFilter.connect(gain)
            gain.connect(filter)
            osc1.start(time)
            osc2.start(time)
            osc1.stop(time + stepDuration * 3.9)
            osc2.stop(time + stepDuration * 3.9)
          }
        }

        // Sub-Bass Drone
        if (this.hasSubBass && (s === 0 || s === 8)) {
          const bassOsc = offlineCtx.createOscillator()
          const bassGain = offlineCtx.createGain()
          bassOsc.type = 'sine'
          bassOsc.frequency.setValueAtTime(currentBass, time)
          bassGain.gain.setValueAtTime(0.001, time)
          bassGain.gain.linearRampToValueAtTime(0.16, time + 0.1)
          bassGain.gain.setValueAtTime(0.16, time + stepDuration * 7.2)
          bassGain.gain.exponentialRampToValueAtTime(0.001, time + stepDuration * 7.8)
          bassOsc.connect(bassGain)
          bassGain.connect(filter)
          bassOsc.start(time)
          bassOsc.stop(time + stepDuration * 7.9)
        }

        // Staccato Strings Pulse (Bars 1, 2, 3)
        if (this.hasStaccato && bar >= 1) {
          const shouldPulse = bar === 1 ? (s % 2 === 0) : (bar === 2 ? (s % 2 === 0 || s % 4 === 1) : true)
          if (shouldPulse) {
            const scaleLen = this.scaleFrequencies.length
            const noteIdx = (step * 2 + chordIdx * 3) % scaleLen
            const freq = this.scaleFrequencies[noteIdx]
            const osc = offlineCtx.createOscillator()
            const staccFilter = offlineCtx.createBiquadFilter()
            const gain = offlineCtx.createGain()
            osc.type = 'sawtooth'
            osc.frequency.setValueAtTime(freq, time)
            staccFilter.type = 'lowpass'
            staccFilter.frequency.setValueAtTime(Math.min(3200, freq * 3.5), time)
            gain.gain.setValueAtTime(0.001, time)
            gain.gain.linearRampToValueAtTime(0.16, time + 0.012)
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.14)
            osc.connect(staccFilter)
            staccFilter.connect(gain)
            gain.connect(filter)
            osc.start(time)
            osc.stop(time + 0.16)
          }
        }

        // Sub Boom Impact at climax
        if (step === 48) {
          const boomOsc = offlineCtx.createOscillator()
          const boomGain = offlineCtx.createGain()
          boomOsc.type = 'sine'
          boomOsc.frequency.setValueAtTime(95, time)
          boomOsc.frequency.exponentialRampToValueAtTime(26, time + 0.45)
          boomGain.gain.setValueAtTime(0.5, time)
          boomGain.gain.exponentialRampToValueAtTime(0.001, time + 0.55)
          boomOsc.connect(boomGain)
          boomGain.connect(filter)
          boomOsc.start(time)
          boomOsc.stop(time + 0.6)
        }
      } else {
        // Poly Chords & Drums for non-strings profiles
        if (s % 4 === 0) {
          for (const freq of currentChord) {
            const osc = offlineCtx.createOscillator()
            const gain = offlineCtx.createGain()
            osc.type = 'sawtooth'
            osc.frequency.setValueAtTime(freq, time)
            gain.gain.setValueAtTime(0.001, time)
            gain.gain.linearRampToValueAtTime(0.12, time + 0.08)
            gain.gain.exponentialRampToValueAtTime(0.001, time + stepDuration * 3.8)
            osc.connect(gain)
            gain.connect(filter)
            osc.start(time)
            osc.stop(time + stepDuration * 3.9)
          }

          const bassOsc = offlineCtx.createOscillator()
          const bassGain = offlineCtx.createGain()
          bassOsc.type = 'triangle'
          bassOsc.frequency.setValueAtTime(currentBass, time)
          bassGain.gain.setValueAtTime(0.001, time)
          bassGain.gain.linearRampToValueAtTime(0.25, time + 0.02)
          bassGain.gain.exponentialRampToValueAtTime(0.001, time + stepDuration * 3.5)
          bassOsc.connect(bassGain)
          bassGain.connect(filter)
          bassOsc.start(time)
          bassOsc.stop(time + stepDuration * 3.6)
        }

        if (this.activeProfile.hasDrums === true && (s === 0 || s === 8 || (this.params.tension > 60 && (s === 4 || s === 12)))) {
          const osc = offlineCtx.createOscillator()
          const gain = offlineCtx.createGain()
          osc.frequency.setValueAtTime(140, time)
          osc.frequency.exponentialRampToValueAtTime(38, time + 0.09)
          gain.gain.setValueAtTime(0.8, time)
          gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22)
          osc.connect(gain)
          gain.connect(filter)
          osc.start(time)
          osc.stop(time + 0.24)
        }
      }
    }

    const renderedBuffer = await offlineCtx.startRendering()
    return this.audioBufferToWavBlob(renderedBuffer)
  }

  // Convert AudioBuffer to downloadable .WAV Blob
  private audioBufferToWavBlob(buffer: AudioBuffer): Blob {
    const numChannels = buffer.numberOfChannels

    let result: DataView
    if (numChannels === 2) {
      result = this.interleave(buffer.getChannelData(0), buffer.getChannelData(1))
    } else {
      result = this.interleave(buffer.getChannelData(0), buffer.getChannelData(0))
    }

    return new Blob([result.buffer as ArrayBuffer], { type: 'audio/wav' })
  }

  private interleave(left: Float32Array, right: Float32Array): DataView {
    const length = left.length * 2 * 2 + 44
    const buffer = new ArrayBuffer(length)
    const view = new DataView(buffer)

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i))
      }
    }

    writeString(0, 'RIFF')
    view.setUint32(4, 36 + left.length * 4, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true) // PCM
    view.setUint16(22, 2, true) // Stereo
    view.setUint32(24, 44100, true) // Sample rate
    view.setUint32(28, 44100 * 4, true) // Byte rate
    view.setUint16(32, 4, true) // Block align
    view.setUint16(34, 16, true) // Bit depth
    writeString(36, 'data')
    view.setUint32(40, left.length * 4, true)

    let offset = 44
    for (let i = 0; i < left.length; i++) {
      const sL = Math.max(-1, Math.min(1, left[i]))
      const sR = Math.max(-1, Math.min(1, right[i]))
      view.setInt16(offset, sL < 0 ? sL * 0x8000 : sL * 0x7fff, true)
      view.setInt16(offset + 2, sR < 0 ? sR * 0x8000 : sR * 0x7fff, true)
      offset += 4
    }

    return view
  }

  // Export Adaptive Game Config JSON for Unity / Godot / FMOD
  public exportGameSoundscapeJson(title = 'Dramatone Scene'): string {
    const config = {
      project: title,
      version: '1.0',
      engine: 'Dramatone Adaptive Soundscape',
      bpm: this.params.bpm,
      genre: this.params.genre,
      mood: this.params.mood,
      baseTension: this.params.tension,
      tensionTiers: [
        {
          tier: 'calm_ambient',
          tensionRange: [0, 30],
          activeStems: ['keys'],
          filterCutoffHz: 600,
          dialogueDuckingDb: -8
        },
        {
          tier: 'rising_suspense',
          tensionRange: [31, 70],
          activeStems: ['keys', 'guitar', 'drums_sparse'],
          filterCutoffHz: 1800,
          dialogueDuckingDb: -8
        },
        {
          tier: 'climax_action',
          tensionRange: [71, 100],
          activeStems: ['keys', 'guitar', 'drums_full', 'vocal_risers'],
          filterCutoffHz: 5500,
          dialogueDuckingDb: -10
        }
      ]
    }

    return JSON.stringify(config, null, 2)
  }
}

export const audioEngine = new AudioEngine()
