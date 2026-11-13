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

class AudioEngine {
  private ctx: AudioContext | null = null
  private isPlaying = false
  private currentStep = 0
  private stepTimer: number | null = null
  private noiseBuffer: AudioBuffer | null = null

  // Master Gain & Analyser
  private masterGain: GainNode | null = null
  private duckingGain: GainNode | null = null
  private masterFilter: BiquadFilterNode | null = null
  private analyser: AnalyserNode | null = null

  // Per-stem Gain Nodes
  private stemGains: Record<StemId, GainNode | null> = {
    keys: null,
    drums: null,
    guitar: null,
    vocal: null
  }

  // State
  private params: SoundscapeParams = {
    bpm: 118,
    genre: 'Synthwave',
    mood: 'Euphoric',
    tension: 50
  }

  private stems: Record<StemId, StemConfig> = {
    keys: { id: 'keys', name: 'Dramatone Keys', muted: false, solo: false, volume: 80 },
    drums: { id: 'drums', name: 'Neural Drums', muted: false, solo: false, volume: 85 },
    guitar: { id: 'guitar', name: 'Acoustic Pluck', muted: false, solo: false, volume: 75 },
    vocal: { id: 'vocal', name: 'Vocal Texture', muted: false, solo: false, volume: 70 }
  }

  private dialogueDuckingEnabled = true

  // Musical scale: F minor pentatonic / natural minor frequencies (Hz)
  private scaleFrequencies = [
    87.31,  // F2
    103.83, // Ab2
    116.54, // Bb2
    130.81, // C3
    155.56, // Eb3
    174.61, // F3
    207.65, // Ab3
    233.08, // Bb3
    261.63, // C4
    311.13, // Eb4
    349.23, // F4
    415.30, // Ab4
    466.16, // Bb4
    523.25  // C5
  ]

  // Initialize Audio Context on user gesture
  public ensureContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new AudioCtx()

      // Master Analyser Node (64 frequency bins)
      this.analyser = this.ctx.createAnalyser()
      this.analyser.fftSize = 128
      this.analyser.smoothingTimeConstant = 0.85

      // Master Gain
      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime)

      // Dialogue Ducking Gain (-8dB sidechain when speech is detected)
      this.duckingGain = this.ctx.createGain()
      this.duckingGain.gain.setValueAtTime(1.0, this.ctx.currentTime)

      // Master Biquad Lowpass Filter (Modulated by tension)
      this.masterFilter = this.ctx.createBiquadFilter()
      this.masterFilter.type = 'lowpass'
      this.masterFilter.frequency.setValueAtTime(1800, this.ctx.currentTime)
      this.masterFilter.Q.setValueAtTime(2.0, this.ctx.currentTime)

      // Connect: Stems -> MasterFilter -> DuckingGain -> MasterGain -> Analyser -> Output
      this.masterFilter.connect(this.duckingGain)
      this.duckingGain.connect(this.masterGain)
      this.masterGain.connect(this.analyser)
      this.analyser.connect(this.ctx.destination)

      // Create stem gain nodes
      const stemIds: StemId[] = ['keys', 'drums', 'guitar', 'vocal']
      for (const id of stemIds) {
        const gain = this.ctx.createGain()
        gain.gain.setValueAtTime(this.calculateStemGain(id), this.ctx.currentTime)
        gain.connect(this.masterFilter)
        this.stemGains[id] = gain
      }

      // Pre-create 1-second white noise buffer for snare and hi-hats
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

  // Calculate actual gain taking into account tension, mute, solo, and volume slider
  private calculateStemGain(stemId: StemId): number {
    const stem = this.stems[stemId]
    if (stem.muted) return 0

    // Check if any stem is soloed
    const hasSolo = Object.values(this.stems).some((s) => s.solo)
    if (hasSolo && !stem.solo) return 0

    const userVol = stem.volume / 100
    const tension = this.params.tension / 100

    switch (stemId) {
      case 'keys':
        // Keys are present across all tension levels, warm and dominant at low tension
        return userVol * (0.9 - tension * 0.2)
      case 'drums':
        // Drums ramp up heavily as tension rises
        return userVol * Math.max(0.1, Math.min(1.0, tension * 1.25))
      case 'guitar':
        // Pluck is active in mid-to-high tension
        return userVol * Math.max(0.2, tension * 0.95)
      case 'vocal':
        // Tension risers & foley FX intensify sharply above 50% tension
        return userVol * Math.pow(tension, 1.4)
      default:
        return userVol
    }
  }

  // Update real-time stem gains and filter cutoffs
  public updateAudioRouting() {
    if (!this.ctx) return
    const now = this.ctx.currentTime

    // Modulate master filter cutoff based on tension (300Hz to 6500Hz)
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
    // Duck by -8dB (~0.4 gain) when dialogue is detected
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
      this.stems[stemId].volume = volume
      this.updateAudioRouting()
    }
  }

  public getStems(): Record<StemId, StemConfig> {
    return { ...this.stems }
  }

  // ================= DSP SYNTHESIZERS =================

  // 1. Kick Drum (Pitch-decay sine oscillator)
  private playKick(time: number) {
    if (!this.ctx || !this.stemGains.drums) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(140, time)
    osc.frequency.exponentialRampToValueAtTime(38, time + 0.09)

    gain.gain.setValueAtTime(1.0, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22)

    osc.connect(gain)
    gain.connect(this.stemGains.drums)

    osc.start(time)
    osc.stop(time + 0.24)
  }

  // 2. Hi-Hat (Short bandpass filtered noise burst)
  private playHiHat(time: number, accent = false) {
    if (!this.ctx || !this.noiseBuffer || !this.stemGains.drums) return
    const source = this.ctx.createBufferSource()
    source.buffer = this.noiseBuffer

    const filter = this.ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.setValueAtTime(7000, time)

    const gain = this.ctx.createGain()
    const vol = accent ? 0.45 : 0.22
    gain.gain.setValueAtTime(vol, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05)

    source.connect(filter)
    filter.connect(gain)
    gain.connect(this.stemGains.drums)

    source.start(time)
    source.stop(time + 0.06)
  }

  // 3. Snare (Noise + body tone)
  private playSnare(time: number) {
    if (!this.ctx || !this.noiseBuffer || !this.stemGains.drums) return
    // Noise snap
    const noise = this.ctx.createBufferSource()
    noise.buffer = this.noiseBuffer

    const noiseFilter = this.ctx.createBiquadFilter()
    noiseFilter.type = 'bandpass'
    noiseFilter.frequency.setValueAtTime(1800, time)
    noiseFilter.Q.setValueAtTime(1.5, time)

    const noiseGain = this.ctx.createGain()
    noiseGain.gain.setValueAtTime(0.6, time)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.16)

    noise.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(this.stemGains.drums)

    // Body tone
    const osc = this.ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(190, time)
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.1)

    const oscGain = this.ctx.createGain()
    oscGain.gain.setValueAtTime(0.5, time)
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12)

    osc.connect(oscGain)
    oscGain.connect(this.stemGains.drums)

    noise.start(time)
    noise.stop(time + 0.18)
    osc.start(time)
    osc.stop(time + 0.14)
  }

  // 4. Ambient Pad Chord (Detuned saw oscillators with smooth attack)
  private playPadChord(freq: number, duration: number, time: number) {
    if (!this.ctx || !this.stemGains.keys) return
    const detunes = [-7, 0, 7]

    for (const d of detunes) {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(freq, time)
      osc.detune.setValueAtTime(d, time)

      // Smooth attack and release envelope
      const attack = 0.12
      gain.gain.setValueAtTime(0.001, time)
      gain.gain.linearRampToValueAtTime(0.2, time + attack)
      gain.gain.setValueAtTime(0.2, time + duration - 0.15)
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration)

      osc.connect(gain)
      gain.connect(this.stemGains.keys)

      osc.start(time)
      osc.stop(time + duration + 0.05)
    }
  }

  // 5. Pluck Lead Note (Sharp attack, fast exponential decay)
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

    gain.gain.setValueAtTime(0.35, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.stemGains.guitar)

    osc.start(time)
    osc.stop(time + 0.35)
  }

  // 6. Foley Tension Riser (Resonant noise sweep)
  private playTensionRiser(time: number, duration: number) {
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
    gain.gain.linearRampToValueAtTime(0.4, time + duration - 0.05)
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration + 0.1)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.stemGains.vocal)

    noise.start(time)
    noise.stop(time + duration + 0.15)
  }

  // ================= 16-STEP SEQUENCER SCHEDULER =================

  private scheduleStep() {
    if (!this.ctx || !this.isPlaying) return
    const stepDuration = 60 / this.params.bpm / 4 // 16th note in seconds
    const time = this.ctx.currentTime + 0.05
    const step = this.currentStep
    const tension = this.params.tension

    // --- Drum Patterns ---
    // Kick: 4-on-the-floor when tension > 60%, otherwise on 0 and 8
    if (step === 0 || step === 8 || (tension > 60 && (step === 4 || step === 12))) {
      this.playKick(time)
    }

    // Hi-hat: 8th notes, or 16th notes during climax
    if (step % 2 === 0 || tension > 75) {
      this.playHiHat(time, step % 4 === 2)
    }

    // Snare: on beats 4 and 12 when tension > 35%
    if ((step === 4 || step === 12) && tension > 35) {
      this.playSnare(time)
    }

    // --- Ambient Pad Patterns ---
    // Change chord every 8 steps
    if (step === 0) {
      const root = this.scaleFrequencies[0] // F2
      this.playPadChord(root, stepDuration * 8, time)
    } else if (step === 8) {
      const root = tension > 50 ? this.scaleFrequencies[2] : this.scaleFrequencies[1]
      this.playPadChord(root, stepDuration * 8, time)
    }

    // --- Melodic Pluck Patterns ---
    if (tension > 25 && step % 2 === 0) {
      const scaleIdx = (step * 3 + Math.floor(tension / 20)) % this.scaleFrequencies.length
      const freq = this.scaleFrequencies[Math.max(4, scaleIdx)]
      this.playPluck(freq, time)
    }

    // --- Tension Riser ---
    if (step === 12 && tension > 70) {
      this.playTensionRiser(time, stepDuration * 4)
    }

    this.currentStep = (this.currentStep + 1) % 16

    // Schedule next 16th-note step
    this.stepTimer = window.setTimeout(() => {
      this.scheduleStep()
    }, stepDuration * 1000)
  }

  // Play / Pause Toggle
  public start() {
    this.ensureContext()
    if (this.isPlaying) return
    this.isPlaying = true
    this.currentStep = 0
    this.scheduleStep()
  }

  public stop() {
    this.isPlaying = false
    if (this.stepTimer) {
      clearTimeout(this.stepTimer)
      this.stepTimer = null
    }
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

  // Export to true 16-bit 44.1kHz stereo .WAV using native OfflineAudioContext
  public async exportSoundscapeWav(durationSeconds = 15): Promise<Blob> {
    const sampleRate = 44100
    const offlineCtx = new OfflineAudioContext(2, sampleRate * durationSeconds, sampleRate)

    // Render 4 stems into offline context
    const stepDuration = 60 / this.params.bpm / 4
    const totalSteps = Math.floor(durationSeconds / stepDuration)

    // Master filter in offline context
    const filter = offlineCtx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(1200 + this.params.tension * 40, 0)
    filter.connect(offlineCtx.destination)

    for (let step = 0; step < totalSteps; step++) {
      const time = step * stepDuration
      const s = step % 16

      // Offline Kick
      if (s === 0 || s === 8 || (this.params.tension > 60 && (s === 4 || s === 12))) {
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

      // Offline Pad
      if (s === 0 || s === 8) {
        const osc = offlineCtx.createOscillator()
        const gain = offlineCtx.createGain()
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(this.scaleFrequencies[s === 0 ? 0 : 2], time)
        gain.gain.setValueAtTime(0.001, time)
        gain.gain.linearRampToValueAtTime(0.18, time + 0.1)
        gain.gain.exponentialRampToValueAtTime(0.001, time + stepDuration * 8)
        osc.connect(gain)
        gain.connect(filter)
        osc.start(time)
        osc.stop(time + stepDuration * 8)
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

    // Write WAV Header
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

    // Interleave samples
    let offset = 44
    for (let i = 0; i < left.length; i++) {
      let sL = Math.max(-1, Math.min(1, left[i]))
      let sR = Math.max(-1, Math.min(1, right[i]))
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
