// Native Web Audio API Sound Engine & Chris Wilson Lookahead Scheduler
// Designed for FL Studio-inspired Browser DAW

import { audioEngine, DawInstrument } from '@/services/audioEngine'

export interface FlNote {
  id: string
  midi: number // 48 (C3) to 72 (C5)
  step: number // 0 to 15
  duration: number // 1 to 4 steps
}

export interface FlChannelEffect {
  filterEnabled: boolean
  filterCutoff: number // 200 - 12000 Hz
  delayEnabled: boolean
  delayTime: number // 0.1 - 0.6s
  delayFeedback: number // 0.1 - 0.7
}

export interface FlChannel {
  id: string
  name: string
  icon: string
  color: string
  type: 'kick' | 'snare' | 'hihat' | 'bass' | 'lead' | 'custom'
  instrument?: DawInstrument
  volume: number // 0 to 100
  pan: number // -100 to 100
  muted: boolean
  solo: boolean
  steps: boolean[] // 16 steps
  notes: FlNote[]
  effect: FlChannelEffect
}

export interface FlPattern {
  id: string
  name: string
  channels: FlChannel[]
}

export interface FlPlaylistItem {
  id: string
  trackIndex: number // 0 to 4
  patternId: string
  startBar: number // 0 to 15
  durationBars: number // 1
}

export interface FlProject {
  title: string
  bpm: number
  masterVolume: number
  patterns: FlPattern[]
  activePatternId: string
  playlist: FlPlaylistItem[]
  version: string
}

export type PlaybackMode = 'PAT' | 'SONG'

interface ChannelAudioNodeGroup {
  panNode: StereoPannerNode
  filterNode: BiquadFilterNode
  delayNode: DelayNode
  delayFeedback: GainNode
  delayDryWet: GainNode
  gainNode: GainNode
  analyserNode: AnalyserNode
}

class FlEngine {
  private ctx: AudioContext | null = null
  private noiseBuffer: AudioBuffer | null = null

  // Master Nodes
  private masterGain: GainNode | null = null
  private masterLimiter: DynamicsCompressorNode | null = null
  private masterAnalyser: AnalyserNode | null = null

  // Channel Nodes (indexed by channel ID)
  private channelNodes: Map<string, ChannelAudioNodeGroup> = new Map()

  // Chris Wilson Lookahead Clock State
  private lookaheadMs = 25.0
  private scheduleAheadTime = 0.12 // 120ms lookahead window
  private timerId: number | null = null
  private nextStepTime = 0.0
  private currentStep = 0
  private isPlaying = false
  private bpm = 128
  private mode: PlaybackMode = 'PAT'

  // Callbacks & Observers
  private stepListeners: Set<(step: number, bar: number, beat: number) => void> = new Set()
  private stateProvider: (() => {
    project: FlProject
    mode: PlaybackMode
    activePattern: FlPattern
  }) | null = null

  constructor() {
    // Lazy audio context init on first user interaction
  }

  public ensureContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new AudioCtx()

      // Master Chain: Master Gain -> Compressor/Limiter -> Master Analyser -> Destination
      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.setValueAtTime(0.80, this.ctx.currentTime)

      this.masterLimiter = this.ctx.createDynamicsCompressor()
      this.masterLimiter.threshold.setValueAtTime(-1.0, this.ctx.currentTime)
      this.masterLimiter.knee.setValueAtTime(0.0, this.ctx.currentTime)
      this.masterLimiter.ratio.setValueAtTime(20.0, this.ctx.currentTime)
      this.masterLimiter.attack.setValueAtTime(0.003, this.ctx.currentTime)
      this.masterLimiter.release.setValueAtTime(0.1, this.ctx.currentTime)

      this.masterAnalyser = this.ctx.createAnalyser()
      this.masterAnalyser.fftSize = 128
      this.masterAnalyser.smoothingTimeConstant = 0.65

      this.masterGain.connect(this.masterLimiter)
      this.masterLimiter.connect(this.masterAnalyser)
      this.masterAnalyser.connect(this.ctx.destination)

      // Create 2-second white noise buffer for snare and hi-hat synthesis
      const bufferSize = this.ctx.sampleRate * 2
      this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
      const data = this.noiseBuffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1
      }
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
    return this.ctx
  }

  public setStateProvider(
    provider: () => {
      project: FlProject
      mode: PlaybackMode
      activePattern: FlPattern
    }
  ) {
    this.stateProvider = provider
  }

  public setBpm(bpm: number) {
    this.bpm = Math.max(40, Math.min(240, bpm))
  }

  public getBpm(): number {
    return this.bpm
  }

  public setMode(mode: PlaybackMode) {
    this.mode = mode
  }

  public getMode(): PlaybackMode {
    return this.mode
  }

  public setMasterVolume(val: number) {
    if (this.masterGain && this.ctx) {
      const vol = Math.max(0, Math.min(1.2, val / 100))
      this.masterGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.02)
    }
  }

  // Sync or create channel audio nodes
  public syncChannels(channels: FlChannel[]) {
    this.ensureContext()
    if (!this.ctx || !this.masterGain) return

    const activeIds = new Set(channels.map((c) => c.id))

    // Remove deleted channels
    for (const [id, nodes] of this.channelNodes.entries()) {
      if (!activeIds.has(id)) {
        try {
          nodes.gainNode.disconnect()
          nodes.analyserNode.disconnect()
        } catch {}
        this.channelNodes.delete(id)
      }
    }

    // Check if any channel is soloed
    const hasSolo = channels.some((c) => c.solo)

    for (const ch of channels) {
      let nodes = this.channelNodes.get(ch.id)
      if (!nodes) {
        // Build Channel Audio Graph:
        // [Synth Output] -> filterNode -> [dry + delay] -> panNode -> gainNode -> analyserNode -> masterGain
        const panNode = this.ctx.createStereoPanner()
        const filterNode = this.ctx.createBiquadFilter()
        filterNode.type = 'lowpass'
        filterNode.frequency.setValueAtTime(ch.effect.filterCutoff || 10000, this.ctx.currentTime)

        const delayNode = this.ctx.createDelay(1.0)
        delayNode.delayTime.setValueAtTime(ch.effect.delayTime || 0.25, this.ctx.currentTime)

        const delayFeedback = this.ctx.createGain()
        delayFeedback.gain.setValueAtTime(ch.effect.delayFeedback || 0.35, this.ctx.currentTime)

        const delayDryWet = this.ctx.createGain()
        delayDryWet.gain.setValueAtTime(ch.effect.delayEnabled ? 0.3 : 0.0, this.ctx.currentTime)

        // Delay feedback loop
        delayNode.connect(delayFeedback)
        delayFeedback.connect(delayNode)
        delayNode.connect(delayDryWet)

        const gainNode = this.ctx.createGain()
        const analyserNode = this.ctx.createAnalyser()
        analyserNode.fftSize = 64
        analyserNode.smoothingTimeConstant = 0.6

        // Connect chain
        filterNode.connect(panNode)
        if (ch.effect.delayEnabled) {
          filterNode.connect(delayNode)
          delayDryWet.connect(panNode)
        }
        panNode.connect(gainNode)
        gainNode.connect(analyserNode)
        analyserNode.connect(this.masterGain)

        nodes = {
          panNode,
          filterNode,
          delayNode,
          delayFeedback,
          delayDryWet,
          gainNode,
          analyserNode
        }
        this.channelNodes.set(ch.id, nodes)
      }

      // Update parameters
      const isAudible = hasSolo ? ch.solo : !ch.muted
      const targetGain = isAudible ? (ch.volume / 100) : 0
      nodes.gainNode.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.02)
      nodes.panNode.pan.setTargetAtTime(Math.max(-1, Math.min(1, ch.pan / 100)), this.ctx.currentTime, 0.02)

      // Update Effects
      if (ch.effect.filterEnabled) {
        nodes.filterNode.frequency.setTargetAtTime(ch.effect.filterCutoff, this.ctx.currentTime, 0.02)
      } else {
        nodes.filterNode.frequency.setTargetAtTime(20000, this.ctx.currentTime, 0.02)
      }

      nodes.delayDryWet.gain.setTargetAtTime(ch.effect.delayEnabled ? 0.35 : 0.0, this.ctx.currentTime, 0.02)
      nodes.delayNode.delayTime.setTargetAtTime(ch.effect.delayTime, this.ctx.currentTime, 0.02)
      nodes.delayFeedback.gain.setTargetAtTime(ch.effect.delayFeedback, this.ctx.currentTime, 0.02)
    }
  }

  // ================= CHRIS WILSON LOOKAHEAD SCHEDULER =================

  public start() {
    this.ensureContext()
    if (this.isPlaying || !this.ctx) return
    this.isPlaying = true
    this.nextStepTime = this.ctx.currentTime + 0.04
    this.timerId = window.setInterval(() => this.scheduler(), this.lookaheadMs)
  }

  public stop() {
    this.isPlaying = false
    if (this.timerId !== null) {
      clearInterval(this.timerId)
      this.timerId = null
    }
    this.currentStep = 0
    this.notifyStepListeners(-1, 0, 0)
  }

  public getIsPlaying(): boolean {
    return this.isPlaying
  }

  public onStep(listener: (step: number, bar: number, beat: number) => void) {
    this.stepListeners.add(listener)
    return () => this.stepListeners.delete(listener)
  }

  private notifyStepListeners(step: number, bar: number, beat: number) {
    this.stepListeners.forEach((l) => {
      try {
        l(step, bar, beat)
      } catch {}
    })
  }

  private scheduler() {
    if (!this.ctx || !this.isPlaying) return
    while (this.nextStepTime < this.ctx.currentTime + this.scheduleAheadTime) {
      this.scheduleStep(this.currentStep, this.nextStepTime)
      this.advanceStep()
    }
  }

  private advanceStep() {
    const secondsPer16th = 60.0 / this.bpm / 4.0
    this.nextStepTime += secondsPer16th
    this.currentStep++

    const maxSteps = this.mode === 'PAT' ? 16 : 16 * 16 // 16 bars of 16th notes
    if (this.currentStep >= maxSteps) {
      this.currentStep = 0
    }
  }

  private scheduleStep(stepIndex: number, time: number) {
    if (!this.stateProvider) return
    const { project, mode, activePattern } = this.stateProvider()
    const patternStep = stepIndex % 16
    const bar = Math.floor(stepIndex / 16)
    const beat = Math.floor(patternStep / 4)

    // Notify UI (draw playhead cursor)
    const delayMs = Math.max(0, (time - this.ctx!.currentTime) * 1000)
    window.setTimeout(() => {
      if (this.isPlaying) {
        this.notifyStepListeners(patternStep, bar, beat)
      }
    }, delayMs)

    if (mode === 'PAT') {
      // PATTERN MODE: Stop playhead immediately if there are no notes or steps
      const hasAnyNotes = activePattern.channels.some(
        (c) => (c.notes && c.notes.length > 0) || (c.steps && c.steps.some(Boolean))
      )
      if (!hasAnyNotes) {
        this.stop()
        return
      }

      for (const ch of activePattern.channels) {
        const hasSolo = activePattern.channels.some((c) => c.solo)
        const isAudible = hasSolo ? ch.solo : !ch.muted
        if (!isAudible) continue

        // 1. Check Step Sequencer
        if (ch.steps[patternStep]) {
          this.triggerChannelSound(ch, time, 60, 0.85)
        }

        // 2. Check Piano Roll Notes placed on this step
        if (ch.notes && ch.notes.length > 0) {
          const notesOnStep = ch.notes.filter((n) => n.step === patternStep)
          notesOnStep.forEach((n) => {
            this.triggerChannelSound(ch, time, n.midi, 0.9, n.duration * (60.0 / this.bpm / 4.0))
          })
        }
      }
    } else {
      // SONG MODE: Arrange full playlist tracks across bars
      const activeClips = project.playlist.filter((p) => {
        const startStep = p.startBar * 16
        const endStep = startStep + (p.durationBars || 1) * 16
        return stepIndex >= startStep && stepIndex < endStep
      })

      activeClips.forEach((clip) => {
        const pat = project.patterns.find((p) => p.id === clip.patternId)
        if (!pat) return

        const hasSolo = pat.channels.some((c) => c.solo)
        pat.channels.forEach((ch) => {
          const isAudible = hasSolo ? ch.solo : !ch.muted
          if (!isAudible) return

          if (ch.steps[patternStep]) {
            this.triggerChannelSound(ch, time, 60, 0.85)
          }

          if (ch.notes && ch.notes.length > 0) {
            const notesOnStep = ch.notes.filter((n) => n.step === patternStep)
            notesOnStep.forEach((n) => {
              this.triggerChannelSound(ch, time, n.midi, 0.9, n.duration * (60.0 / this.bpm / 4.0))
            })
          }
        })
      })
    }
  }

  // ================= DSP SYNTHESIZERS =================

  public midiToFreq(midi: number): number {
    return 440 * Math.pow(2, (midi - 69) / 12)
  }

  public triggerChannelSound(
    ch: FlChannel,
    time?: number,
    midiNote = 60,
    velocity = 0.85,
    duration = 0.25
  ) {
    this.ensureContext()
    if (!this.ctx) return
    const t = time !== undefined ? time : this.ctx.currentTime
    const nodes = this.channelNodes.get(ch.id)
    const target = nodes ? nodes.filterNode : this.masterGain
    if (!target) return

    const freq = this.midiToFreq(midiNote)
    const vel = Math.max(0.1, Math.min(1.0, velocity))

    // Direct routing to the 16 solo physical instruments palette if configured
    if (ch.instrument) {
      audioEngine.playMidiNote(midiNote, duration, velocity, ch.instrument)
      return
    }

    switch (ch.type) {
      case 'kick': {
        // Punchy 808/909 Kick: Sine sweeping from 160Hz to 40Hz with rapid envelope & hammer click
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(165, t)
        osc.frequency.exponentialRampToValueAtTime(42, t + 0.08)

        gain.gain.setValueAtTime(0.9 * vel, t)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.26)

        osc.connect(gain)
        gain.connect(target)
        osc.start(t)
        osc.stop(t + 0.28)

        // Click transient
        const click = this.ctx.createOscillator()
        const clickGain = this.ctx.createGain()
        click.type = 'triangle'
        click.frequency.setValueAtTime(800, t)
        click.frequency.exponentialRampToValueAtTime(80, t + 0.012)
        clickGain.gain.setValueAtTime(0.4 * vel, t)
        clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.015)
        click.connect(clickGain)
        clickGain.connect(target)
        click.start(t)
        click.stop(t + 0.02)
        break
      }

      case 'snare': {
        // Snappy Snare: Triangle body tone (190Hz -> 85Hz) + Highpass filtered noise snap
        const tone = this.ctx.createOscillator()
        const toneGain = this.ctx.createGain()
        tone.type = 'triangle'
        tone.frequency.setValueAtTime(190, t)
        tone.frequency.exponentialRampToValueAtTime(85, t + 0.06)
        toneGain.gain.setValueAtTime(0.55 * vel, t)
        toneGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12)
        tone.connect(toneGain)
        toneGain.connect(target)
        tone.start(t)
        tone.stop(t + 0.13)

        if (this.noiseBuffer) {
          const noise = this.ctx.createBufferSource()
          noise.buffer = this.noiseBuffer
          const filter = this.ctx.createBiquadFilter()
          filter.type = 'highpass'
          filter.frequency.setValueAtTime(1200, t)
          const noiseGain = this.ctx.createGain()
          noiseGain.gain.setValueAtTime(0.65 * vel, t)
          noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18)
          noise.connect(filter)
          filter.connect(noiseGain)
          noiseGain.connect(target)
          noise.start(t)
          noise.stop(t + 0.2)
        }
        break
      }

      case 'hihat': {
        // Crisp Closed/Open Hat: Bandpass noise buffer (8kHz, Q=3.5)
        if (this.noiseBuffer) {
          const noise = this.ctx.createBufferSource()
          noise.buffer = this.noiseBuffer
          const filter = this.ctx.createBiquadFilter()
          filter.type = 'bandpass'
          filter.frequency.setValueAtTime(8200, t)
          filter.Q.setValueAtTime(3.5, t)
          const gain = this.ctx.createGain()
          gain.gain.setValueAtTime(0.5 * vel, t)
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06)
          noise.connect(filter)
          filter.connect(gain)
          gain.connect(target)
          noise.start(t)
          noise.stop(t + 0.07)
        } else {
          const osc = this.ctx.createOscillator()
          const gain = this.ctx.createGain()
          osc.type = 'square'
          osc.frequency.setValueAtTime(1200, t)
          gain.gain.setValueAtTime(0.2 * vel, t)
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04)
          osc.connect(gain)
          gain.connect(target)
          osc.start(t)
          osc.stop(t + 0.05)
        }
        break
      }

      case 'bass': {
        // Deep Resonant Bass Synth: Sawtooth + Sub Sine with lowpass cutoff envelope
        let bassFreq = freq
        while (bassFreq > 140) bassFreq /= 2
        const osc = this.ctx.createOscillator()
        const sub = this.ctx.createOscillator()
        const filter = this.ctx.createBiquadFilter()
        const gain = this.ctx.createGain()

        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(bassFreq, t)
        sub.type = 'sine'
        sub.frequency.setValueAtTime(bassFreq, t)

        filter.type = 'lowpass'
        filter.Q.setValueAtTime(4.0, t)
        filter.frequency.setValueAtTime(1800, t)
        filter.frequency.exponentialRampToValueAtTime(320, t + 0.15)

        gain.gain.setValueAtTime(0.001, t)
        gain.gain.linearRampToValueAtTime(0.6 * vel, t + 0.01)
        gain.gain.exponentialRampToValueAtTime(0.001, t + Math.max(0.25, duration))

        osc.connect(filter)
        sub.connect(filter)
        filter.connect(gain)
        gain.connect(target)

        osc.start(t)
        sub.start(t)
        osc.stop(t + Math.max(0.28, duration + 0.05))
        sub.stop(t + Math.max(0.28, duration + 0.05))
        break
      }

      case 'lead':
      default: {
        // Analog Lead: Triangle fundamental + Sine overtone with smooth envelope
        const osc1 = this.ctx.createOscillator()
        const osc2 = this.ctx.createOscillator()
        const filter = this.ctx.createBiquadFilter()
        const gain = this.ctx.createGain()

        osc1.type = 'triangle'
        osc1.frequency.setValueAtTime(freq, t)
        osc2.type = 'sawtooth'
        osc2.frequency.setValueAtTime(freq, t)
        osc2.detune.setValueAtTime(7, t)

        filter.type = 'lowpass'
        filter.frequency.setValueAtTime(Math.min(6000, freq * 4), t)

        gain.gain.setValueAtTime(0.001, t)
        gain.gain.linearRampToValueAtTime(0.35 * vel, t + 0.01)
        gain.gain.exponentialRampToValueAtTime(0.001, t + Math.max(0.2, duration))

        osc1.connect(filter)
        osc2.connect(filter)
        filter.connect(gain)
        gain.connect(target)

        osc1.start(t)
        osc2.start(t)
        osc1.stop(t + Math.max(0.22, duration + 0.05))
        osc2.stop(t + Math.max(0.22, duration + 0.05))
        break
      }
    }
  }

  // ================= REAL-TIME ANALYSER PEAK METERS =================

  public getChannelMeter(channelId: string): number {
    const nodes = this.channelNodes.get(channelId)
    if (!nodes) return 0
    const buffer = new Uint8Array(nodes.analyserNode.frequencyBinCount)
    nodes.analyserNode.getByteTimeDomainData(buffer)

    let sum = 0
    for (let i = 0; i < buffer.length; i++) {
      const v = (buffer[i] - 128) / 128
      sum += v * v
    }
    const rms = Math.sqrt(sum / buffer.length)
    return Math.min(100, Math.round(rms * 180))
  }

  public getMasterMeter(): number {
    if (!this.masterAnalyser) return 0
    const buffer = new Uint8Array(this.masterAnalyser.frequencyBinCount)
    this.masterAnalyser.getByteTimeDomainData(buffer)

    let sum = 0
    for (let i = 0; i < buffer.length; i++) {
      const v = (buffer[i] - 128) / 128
      sum += v * v
    }
    const rms = Math.sqrt(sum / buffer.length)
    return Math.min(100, Math.round(rms * 190))
  }
}

export const flEngine = new FlEngine()

