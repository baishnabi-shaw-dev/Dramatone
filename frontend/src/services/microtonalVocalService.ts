// Dramatone AI-Driven Microtonal Vocal Harmony Arranger
// Physical Formant Vocal Synthesis with 24-EDO Quarter-Tone & Just Intonation Tuning Systems
// Implemented via Native Web Audio API Formant Filter Banks & Glottal Pulse Resonators

export type MicrotonalScaleId = '24-edo' | 'byzantine' | 'just-intonation' | 'slendro' | 'pythagorean'

export interface MicrotonalScale {
  id: MicrotonalScaleId
  name: string
  region: string
  description: string
  cents: number[] // Microtonal pitch offsets from root in cents (100 cents = 1 standard semitone)
  harmonyIntervals: number[][] // Preset chord voicings in cents
}

export interface FormantVowel {
  id: string
  name: string
  label: string
  f1: number // Formant 1 center frequency in Hz
  f2: number // Formant 2 center frequency in Hz
  f3: number // Formant 3 center frequency in Hz
  q: number  // Resonance Q factor
}

export const FORMANT_VOWELS: FormantVowel[] = [
  { id: 'ah', name: 'Open Ah [ɑ]', label: 'Soprano Ah', f1: 800, f2: 1200, f3: 2500, q: 6.5 },
  { id: 'oh', name: 'Warm Oh [o]', label: 'Chamber Oh', f1: 500, f2: 1000, f3: 2400, q: 7.0 },
  { id: 'oo', name: 'Deep Oo [u]', label: 'Monastic Oo', f1: 350, f2: 800, f3: 2200, q: 8.0 },
  { id: 'ee', name: 'Bright Ee [i]', label: 'Ethereal Ee', f1: 280, f2: 2300, f3: 3000, q: 8.5 },
  { id: 'mm', name: 'Humming Mm [m]', label: 'Mystic Drone Mm', f1: 250, f2: 500, f3: 1800, q: 9.0 }
]

export const MICROTONAL_SCALES: Record<MicrotonalScaleId, MicrotonalScale> = {
  '24-edo': {
    id: '24-edo',
    name: '24-EDO Quarter-Tone',
    region: 'Contemporary Microtonal / Arab Maqam',
    description: 'Divides the octave into 24 equal 50-cent micro-steps. Unlocks neutral thirds and quarter-tone inflections.',
    cents: [0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950, 1000, 1050, 1100, 1150],
    harmonyIntervals: [
      [0, 350, 700],        // Root + Neutral 3rd (350¢) + Fifth (700¢)
      [0, 150, 500, 700],   // Maqam Bayati Quarter-tone tetrad
      [0, 350, 650, 1050],  // Neutral 7th Micro-Cluster
      [0, 250, 550, 850]    // Sub-minor Quarter-tone choir
    ]
  },
  'byzantine': {
    id: 'byzantine',
    name: 'Byzantine Neutral Intonation',
    region: 'Eastern Mediterranean / Byzantine Chant',
    description: 'Sacred choral tradition utilizing natural neutral thirds (353¢) and microtonal leading tones.',
    cents: [0, 150, 300, 353, 500, 702, 853, 1000, 1150],
    harmonyIntervals: [
      [0, 353, 702],        // Byzantine Sacred Triad (pure neutral third)
      [0, 150, 500, 702],   // Liturgical Drone 4-voice
      [-1200, 0, 353, 702]  // Monastic Isokrates Bass Drone + Harmony
    ]
  },
  'just-intonation': {
    id: 'just-intonation',
    name: 'Just Intonation 7-Limit',
    region: 'Pure Harmonic Series',
    description: 'Mathematically pure integer frequency ratios (4:5:6:7) without 12-TET beating. Luminous vocal resonance.',
    cents: [0, 204, 386, 498, 702, 884, 969, 1088],
    harmonyIntervals: [
      [0, 386, 702],        // Pure 4:5:6 Major Triad (Beatless 386¢)
      [0, 386, 702, 969],   // 4:5:6:7 Harmonic 7th Chord (Pure barbershop vocal lock)
      [0, 316, 702, 1018],  // Pure Minor 10:12:15 triad
      [-1200, 0, 702, 1200] // Octave / Pure Fifth Cathedral Drone
    ]
  },
  'slendro': {
    id: 'slendro',
    name: 'Javanese Slendro',
    region: 'Southeast Asian Gamelan / Vocal Sinden',
    description: '5 equidistant intervals (~240 cents each). Hypnotic spiritual vocal harmonies unmatched in Western scales.',
    cents: [0, 240, 480, 720, 960],
    harmonyIntervals: [
      [0, 240, 720],        // Slendro Primary Dyad
      [0, 480, 960],        // Slendro Open Gamelan Harmony
      [-1200, 0, 240, 480]  // Deep Gong Drone + Dual Vocal Sinden
    ]
  },
  'pythagorean': {
    id: 'pythagorean',
    name: 'Pythagorean 3:2 Pure Fifths',
    region: 'Ancient Greek & Medieval Organum',
    description: 'Harmonized solely on stacked 3:2 pure fifths (702¢) producing brilliant, piercing ancient vocal textures.',
    cents: [0, 204, 408, 498, 702, 906, 996, 1110],
    harmonyIntervals: [
      [0, 702, 1200],       // Parallel Medieval Organum (Fifth + Octave)
      [0, 498, 702],        // Pure Fourth & Fifth suspended vocal chord
      [-1200, 0, 702, 1902] // Stretched 2-Octave Cathedral organum
    ]
  }
}

export type VocalDensity = 'solo' | 'duet' | 'triad' | 'choir'

export interface VocalHarmonyConfig {
  scaleId: MicrotonalScaleId
  vowelId: string
  density: VocalDensity
  vibratoDepth: number // 0 to 100%
  humanizeDrift: number // Micro-pitch fluctuation in cents
  isActive: boolean
}

class MicrotonalVocalService {
  private ctx: AudioContext | null = null
  private config: VocalHarmonyConfig = {
    scaleId: '24-edo',
    vowelId: 'ah',
    density: 'triad',
    vibratoDepth: 35,
    humanizeDrift: 4,
    isActive: true
  }

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new AudioCtx()
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
    return this.ctx
  }

  public getConfig(): VocalHarmonyConfig {
    return { ...this.config }
  }

  public setConfig(updates: Partial<VocalHarmonyConfig>) {
    this.config = { ...this.config, ...updates }
  }

  public centsToMultiplier(cents: number): number {
    return Math.pow(2, cents / 1200)
  }

  // Get active chord interval voicings for selected density and scale
  public getChordIntervals(density: VocalDensity = this.config.density, scaleId: MicrotonalScaleId = this.config.scaleId): number[] {
    const scale = MICROTONAL_SCALES[scaleId] || MICROTONAL_SCALES['24-edo']
    const preset = scale.harmonyIntervals[0] || [0, 350, 700]

    switch (density) {
      case 'solo':
        return [0]
      case 'duet':
        return [0, preset[1] ?? 350]
      case 'triad':
        return preset.slice(0, 3)
      case 'choir':
      default:
        return preset.length >= 4 ? preset : [...preset, -1200]
    }
  }

  // Synthesize a single formant-filtered vocal voice
  public playFormantVoice(
    ctx: AudioContext,
    targetGain: AudioNode,
    freq: number,
    time: number,
    duration: number,
    vowel: FormantVowel,
    velocity = 0.5,
    pan = 0
  ) {
    if (freq < 20 || freq > 4000) return

    // 1. Glottal source (Pulse / saw oscillator + subtle breath noise)
    const glottalOsc = ctx.createOscillator()
    glottalOsc.type = 'sawtooth'
    glottalOsc.frequency.setValueAtTime(freq, time)

    // 2. Human vibrato LFO (5.2 Hz with gradual onset)
    const lfo = ctx.createOscillator()
    const lfoGain = ctx.createGain()
    lfo.frequency.setValueAtTime(5.2 + (Math.random() * 0.4 - 0.2), time) // Humanized rate
    const vibratoAmount = freq * 0.015 * (this.config.vibratoDepth / 100)
    lfoGain.gain.setValueAtTime(0.001, time)
    lfoGain.gain.linearRampToValueAtTime(vibratoAmount, time + Math.min(0.6, duration * 0.5)) // Natural singing onset
    lfo.connect(lfoGain)
    lfoGain.connect(glottalOsc.frequency)

    // 3. Stereo Panner
    let panNode: StereoPannerNode | null = null
    if (ctx.createStereoPanner) {
      panNode = ctx.createStereoPanner()
      panNode.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), time)
    }

    // 4. Formant Filter Bank: 3 Parallel Bandpass Filters (F1, F2, F3)
    const formants = [
      { freq: vowel.f1, gainVal: 1.0, q: vowel.q },
      { freq: vowel.f2, gainVal: 0.7, q: vowel.q + 1.0 },
      { freq: vowel.f3, gainVal: 0.35, q: vowel.q + 2.0 }
    ]

    const voiceMasterGain = ctx.createGain()
    // Singing envelope (soft attack, sustained vowel, exponential release)
    const attack = Math.min(0.12, duration * 0.2)
    const release = Math.min(0.25, duration * 0.35)
    voiceMasterGain.gain.setValueAtTime(0.001, time)
    voiceMasterGain.gain.linearRampToValueAtTime(velocity * 0.38, time + attack)
    voiceMasterGain.gain.setValueAtTime(velocity * 0.35, time + duration - release)
    voiceMasterGain.gain.exponentialRampToValueAtTime(0.0001, time + duration)

    if (panNode) {
      voiceMasterGain.connect(panNode)
      panNode.connect(targetGain)
    } else {
      voiceMasterGain.connect(targetGain)
    }

    // Connect glottal source to each formant filter
    formants.forEach((f) => {
      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(f.freq, time)
      filter.Q.setValueAtTime(f.q, time)

      const fGain = ctx.createGain()
      fGain.gain.setValueAtTime(f.gainVal, time)

      glottalOsc.connect(filter)
      filter.connect(fGain)
      fGain.connect(voiceMasterGain)
    })

    // Start glottal generator and vibrato
    lfo.start(time)
    glottalOsc.start(time)
    lfo.stop(time + duration + 0.05)
    glottalOsc.stop(time + duration + 0.05)
  }

  // Synthesize multi-part microtonal vocal chord
  public playMicrotonalHarmony(
    ctx: AudioContext,
    targetGain: AudioNode,
    rootFreq: number,
    time: number,
    duration: number,
    scaleId = this.config.scaleId,
    vowelId = this.config.vowelId,
    density = this.config.density,
    volume = 0.75
  ) {
    const vowel = FORMANT_VOWELS.find((v) => v.id === vowelId) || FORMANT_VOWELS[0]
    const intervals = this.getChordIntervals(density, scaleId)

    // Pan voices across the stereo field
    const panSpread = [-0.6, 0.6, -0.25, 0.25, 0]

    intervals.forEach((centsOffset, idx) => {
      // Apply microtonal pitch ratio + organic micro-drift
      const drift = (Math.random() * 2 - 1) * this.config.humanizeDrift
      const finalCents = centsOffset + drift
      const voiceFreq = rootFreq * this.centsToMultiplier(finalCents)

      const pan = panSpread[idx % panSpread.length]
      const voiceVol = volume / Math.sqrt(intervals.length)

      this.playFormantVoice(ctx, targetGain, voiceFreq, time, duration, vowel, voiceVol, pan)
    })
  }

  // Live Audition Trigger in browser
  public auditionHarmony(
    scaleId = this.config.scaleId,
    vowelId = this.config.vowelId,
    density = this.config.density,
    rootMidi = 57 // A3 (220Hz)
  ) {
    const ctx = this.ensureContext()
    const now = ctx.currentTime
    const rootFreq = 440 * Math.pow(2, (rootMidi - 69) / 12)
    const duration = 2.4

    const auditionGain = ctx.createGain()
    auditionGain.gain.setValueAtTime(0.8, now)
    auditionGain.connect(ctx.destination)

    this.playMicrotonalHarmony(ctx, auditionGain, rootFreq, now, duration, scaleId, vowelId, density, 0.8)
  }
}

export const microtonalVocalService = new MicrotonalVocalService()

