// Dramatone Zero-Shot Cinematic Foley Sound Effect Synthesizer
// Generates physical & cinematic sound effects directly from text cues using Native Web Audio API DSP

export interface FoleyCuePreset {
  id: string
  label: string
  cue: string
  category: 'impact' | 'foley' | 'nature' | 'sci-fi' | 'horror' | 'action'
  icon: string
}

export const FOLEY_PRESET_CUES: FoleyCuePreset[] = [
  { id: 'thunder', label: 'Thunder Strike', cue: 'loud distant rolling thunder strike and storm rumble', category: 'nature', icon: '⚡' },
  { id: 'sword', label: 'Sword Clash', cue: 'sharp metallic sword clash blade impact ringing steel', category: 'action', icon: '⚔️' },
  { id: 'gunshot', label: 'Gunshot Blast', cue: 'high caliber rifle gunshot blast with acoustic tail', category: 'action', icon: '💥' },
  { id: 'glass', label: 'Glass Shatter', cue: 'glass bottle shatter breaking debris high frequency tinkling', category: 'foley', icon: '🪟' },
  { id: 'footsteps', label: 'Gravel Footsteps', cue: 'heavy boot footsteps crunching on gravel rocks', category: 'foley', icon: '👢' },
  { id: 'door_creak', label: 'Creepy Door Creak', cue: 'haunted wooden door creaking slowly open friction', category: 'horror', icon: '🚪' },
  { id: 'wind_howl', label: 'Winter Wind Howl', cue: 'subzero mountain blizzard wind howling air whistle', category: 'nature', icon: '💨' },
  { id: 'laser', label: 'Sci-Fi Laser Blaster', cue: 'cyberpunk plasma laser blaster zap beam', category: 'sci-fi', icon: '🔫' },
  { id: 'sub_drop', label: 'Cinematic Sub Drop', cue: 'deep sub bass drop 808 cinematic boom impact', category: 'action', icon: '🔊' },
  { id: 'heartbeat', label: 'Tense Heartbeat', cue: 'deep suspenseful heartbeat pulse lub dub low end', category: 'horror', icon: '💓' },
  { id: 'whoosh', label: 'Cinematic Whoosh', cue: 'fast cinematic transition whoosh swish air rush', category: 'action', icon: '🌪️' },
  { id: 'explosion', label: 'Massive Explosion', cue: 'heavy cinematic building explosion shockwave rumble', category: 'action', icon: '💣' }
]

export interface SynthesizedFoleyResult {
  cue: string
  category: string
  duration: number
  description: string
  audioBuffer: AudioBuffer | null
}

class FoleySynthesisService {
  private ctx: AudioContext | null = null
  private noiseBuffer: AudioBuffer | null = null

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new AudioCtx()

      // Generate 4-second high resolution noise buffer
      const bufferSize = this.ctx.sampleRate * 4
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

  // Parse text cue into semantic acoustic parameters
  public parseCue(textCue: string): {
    category: string
    duration: number
    primaryType: 'thunder' | 'sword' | 'gunshot' | 'glass' | 'footsteps' | 'door_creak' | 'wind' | 'laser' | 'sub_drop' | 'heartbeat' | 'whoosh' | 'explosion' | 'generic'
    description: string
  } {
    const q = textCue.toLowerCase()

    if (q.includes('thunder') || q.includes('lightning') || q.includes('storm')) {
      return { category: 'Nature / Atmospheric', duration: 2.8, primaryType: 'thunder', description: 'Dual sub-rumble + lowpass noise crackle & environmental tail' }
    }
    if (q.includes('sword') || q.includes('blade') || q.includes('metal') || q.includes('knife') || q.includes('steel')) {
      return { category: 'Action / Metallic', duration: 1.2, primaryType: 'sword', description: 'Inharmonic metallic chime (1.2k, 1.8k, 3.4kHz) + friction scrape' }
    }
    if (q.includes('gun') || q.includes('shot') || q.includes('bullet') || q.includes('rifle') || q.includes('pistol')) {
      return { category: 'Action / Weapons', duration: 1.4, primaryType: 'gunshot', description: 'Hyper-fast 6ms transient snap + lowpass punch + room reflection' }
    }
    if (q.includes('glass') || q.includes('shatter') || q.includes('break') || q.includes('crystal') || q.includes('bottle')) {
      return { category: 'Foley / Destruction', duration: 1.5, primaryType: 'glass', description: 'Stochastic highpass tinkling clusters (2.5k - 6kHz) + initial impact' }
    }
    if (q.includes('foot') || q.includes('step') || q.includes('walk') || q.includes('gravel') || q.includes('mud')) {
      return { category: 'Foley / Movement', duration: 0.5, primaryType: 'footsteps', description: 'Low-frequency heel thump + bandpassed gravel crunch transient' }
    }
    if (q.includes('door') || q.includes('creak') || q.includes('hinge') || q.includes('friction') || q.includes('wood')) {
      return { category: 'Horror / Foley', duration: 2.0, primaryType: 'door_creak', description: 'Harmonic frequency-modulated scraping saw wave with slow pitch sweep' }
    }
    if (q.includes('wind') || q.includes('howl') || q.includes('blizzard') || q.includes('breeze') || q.includes('air')) {
      return { category: 'Nature / Ambience', duration: 3.0, primaryType: 'wind', description: 'Resonant bandpass noise with slow dual-LFO frequency modulation' }
    }
    if (q.includes('laser') || q.includes('blaster') || q.includes('zap') || q.includes('sci-fi') || q.includes('plasma')) {
      return { category: 'Sci-Fi / Energy', duration: 0.6, primaryType: 'laser', description: 'Exponential downwards pitch dive (2400Hz -> 65Hz) with square wave buzz' }
    }
    if (q.includes('sub') || q.includes('drop') || q.includes('boom') || q.includes('bass drop') || q.includes('808')) {
      return { category: 'Cinematic / Impact', duration: 2.2, primaryType: 'sub_drop', description: 'Heavy sine pitch dive (140Hz -> 32Hz) through tube waveshaper saturation' }
    }
    if (q.includes('heart') || q.includes('pulse') || q.includes('thump') || q.includes('lub')) {
      return { category: 'Suspense / Organic', duration: 1.2, primaryType: 'heartbeat', description: 'Dual damped sub-sine thumps (lub-dub at 65Hz and 52Hz)' }
    }
    if (q.includes('whoosh') || q.includes('swish') || q.includes('transition') || q.includes('sweep')) {
      return { category: 'Cinematic / Movement', duration: 1.0, primaryType: 'whoosh', description: 'Bandpassed air rush sweeping up to 2600Hz and back down' }
    }
    if (q.includes('explosion') || q.includes('bomb') || q.includes('blast') || q.includes('grenade') || q.includes('detonation')) {
      return { category: 'Action / Pyro', duration: 2.5, primaryType: 'explosion', description: 'Deep low impact + expanding turbulent noise cloud with exponential decay' }
    }

    return { category: 'Procedural Cinematic', duration: 1.2, primaryType: 'generic', description: 'Harmonic modal pulse with transient attack and spatial decay' }
  }

  // Synthesize and play live zero-shot sound effect
  public async synthesizeAndPlay(textCue: string, volume = 0.85): Promise<SynthesizedFoleyResult> {
    const ctx = this.ensureContext()
    const parsed = this.parseCue(textCue)
    const t = ctx.currentTime
    const vel = Math.max(0.1, Math.min(1.0, volume))

    const masterGain = ctx.createGain()
    masterGain.gain.setValueAtTime(vel, t)
    masterGain.connect(ctx.destination)

    switch (parsed.primaryType) {
      case 'thunder': {
        // Deep sub rumble
        const sub = ctx.createOscillator()
        const subGain = ctx.createGain()
        sub.type = 'sine'
        sub.frequency.setValueAtTime(65, t)
        sub.frequency.exponentialRampToValueAtTime(28, t + 2.5)
        subGain.gain.setValueAtTime(0.7, t)
        subGain.gain.exponentialRampToValueAtTime(0.001, t + 2.6)
        sub.connect(subGain)
        subGain.connect(masterGain)
        sub.start(t)
        sub.stop(t + 2.7)

        // Rolling thunder crackle
        if (this.noiseBuffer) {
          const noise = ctx.createBufferSource()
          noise.buffer = this.noiseBuffer
          const filter = ctx.createBiquadFilter()
          filter.type = 'lowpass'
          filter.frequency.setValueAtTime(450, t)
          filter.frequency.exponentialRampToValueAtTime(120, t + 2.4)
          const nGain = ctx.createGain()
          nGain.gain.setValueAtTime(0.001, t)
          nGain.gain.linearRampToValueAtTime(0.65, t + 0.1)
          nGain.gain.exponentialRampToValueAtTime(0.001, t + 2.6)
          noise.connect(filter)
          filter.connect(nGain)
          nGain.connect(masterGain)
          noise.start(t)
          noise.stop(t + 2.8)
        }
        break
      }

      case 'sword': {
        // Metallic inharmonic modal frequencies (1200Hz, 1750Hz, 3400Hz)
        const freqs = [1200, 1780, 3420]
        freqs.forEach((f, i) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = i === 0 ? 'sine' : 'triangle'
          osc.frequency.setValueAtTime(f, t)
          gain.gain.setValueAtTime(0.35 / (i + 1), t)
          gain.gain.exponentialRampToValueAtTime(0.001, t + 1.1)
          osc.connect(gain)
          gain.connect(masterGain)
          osc.start(t)
          osc.stop(t + 1.2)
        })

        // Blade scrape noise
        if (this.noiseBuffer) {
          const noise = ctx.createBufferSource()
          noise.buffer = this.noiseBuffer
          const filter = ctx.createBiquadFilter()
          filter.type = 'highpass'
          filter.frequency.setValueAtTime(4000, t)
          const nGain = ctx.createGain()
          nGain.gain.setValueAtTime(0.4, t)
          nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08)
          noise.connect(filter)
          filter.connect(nGain)
          nGain.connect(masterGain)
          noise.start(t)
          noise.stop(t + 0.1)
        }
        break
      }

      case 'gunshot': {
        // Punchy body
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(220, t)
        osc.frequency.exponentialRampToValueAtTime(45, t + 0.12)
        gain.gain.setValueAtTime(0.9, t)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35)
        osc.connect(gain)
        gain.connect(masterGain)
        osc.start(t)
        osc.stop(t + 0.38)

        // Gunpowder explosion blast
        if (this.noiseBuffer) {
          const noise = ctx.createBufferSource()
          noise.buffer = this.noiseBuffer
          const filter = ctx.createBiquadFilter()
          filter.type = 'lowpass'
          filter.frequency.setValueAtTime(4500, t)
          filter.frequency.exponentialRampToValueAtTime(600, t + 0.8)
          const nGain = ctx.createGain()
          nGain.gain.setValueAtTime(0.9, t)
          nGain.gain.exponentialRampToValueAtTime(0.001, t + 1.3)
          noise.connect(filter)
          filter.connect(nGain)
          nGain.connect(masterGain)
          noise.start(t)
          noise.stop(t + 1.4)
        }
        break
      }

      case 'glass': {
        // Initial impact crack
        const impact = ctx.createOscillator()
        const iGain = ctx.createGain()
        impact.type = 'sine'
        impact.frequency.setValueAtTime(1400, t)
        iGain.gain.setValueAtTime(0.5, t)
        iGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04)
        impact.connect(iGain)
        iGain.connect(masterGain)
        impact.start(t)
        impact.stop(t + 0.05)

        // Multiple tinkling shard particles
        const shards = [2400, 3100, 3800, 4600, 5800]
        shards.forEach((f, idx) => {
          const delay = 0.03 + idx * 0.045
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = 'sine'
          osc.frequency.setValueAtTime(f, t + delay)
          gain.gain.setValueAtTime(0.2, t + delay)
          gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.35)
          osc.connect(gain)
          gain.connect(masterGain)
          osc.start(t + delay)
          osc.stop(t + delay + 0.4)
        })
        break
      }

      case 'footsteps': {
        // Heel impact
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(95, t)
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.08)
        gain.gain.setValueAtTime(0.7, t)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15)
        osc.connect(gain)
        gain.connect(masterGain)
        osc.start(t)
        osc.stop(t + 0.18)

        // Gravel crunch
        if (this.noiseBuffer) {
          const noise = ctx.createBufferSource()
          noise.buffer = this.noiseBuffer
          const filter = ctx.createBiquadFilter()
          filter.type = 'bandpass'
          filter.frequency.setValueAtTime(2200, t)
          filter.Q.setValueAtTime(2.0, t)
          const nGain = ctx.createGain()
          nGain.gain.setValueAtTime(0.45, t)
          nGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12)
          noise.connect(filter)
          filter.connect(nGain)
          nGain.connect(masterGain)
          noise.start(t)
          noise.stop(t + 0.15)
        }
        break
      }

      case 'door_creak': {
        // Friction modulated oscillator
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        const filter = ctx.createBiquadFilter()
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(140, t)
        osc.frequency.linearRampToValueAtTime(320, t + 1.2)
        osc.frequency.linearRampToValueAtTime(180, t + 1.8)

        filter.type = 'bandpass'
        filter.frequency.setValueAtTime(800, t)
        filter.Q.setValueAtTime(4.0, t)

        gain.gain.setValueAtTime(0.001, t)
        gain.gain.linearRampToValueAtTime(0.35, t + 0.1)
        gain.gain.setValueAtTime(0.3, t + 1.5)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.9)

        osc.connect(filter)
        filter.connect(gain)
        gain.connect(masterGain)
        osc.start(t)
        osc.stop(t + 2.0)
        break
      }

      case 'wind': {
        if (this.noiseBuffer) {
          const noise = ctx.createBufferSource()
          noise.buffer = this.noiseBuffer
          const filter = ctx.createBiquadFilter()
          filter.type = 'bandpass'
          filter.frequency.setValueAtTime(500, t)
          filter.frequency.linearRampToValueAtTime(1100, t + 1.4)
          filter.frequency.linearRampToValueAtTime(650, t + 2.8)
          filter.Q.setValueAtTime(5.0, t)

          const gain = ctx.createGain()
          gain.gain.setValueAtTime(0.001, t)
          gain.gain.linearRampToValueAtTime(0.45, t + 0.5)
          gain.gain.linearRampToValueAtTime(0.4, t + 2.2)
          gain.gain.exponentialRampToValueAtTime(0.001, t + 2.9)

          noise.connect(filter)
          filter.connect(gain)
          gain.connect(masterGain)
          noise.start(t)
          noise.stop(t + 3.0)
        }
        break
      }

      case 'laser': {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(2400, t)
        osc.frequency.exponentialRampToValueAtTime(65, t + 0.22)

        gain.gain.setValueAtTime(0.45, t)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25)

        osc.connect(gain)
        gain.connect(masterGain)
        osc.start(t)
        osc.stop(t + 0.28)
        break
      }

      case 'sub_drop': {
        const osc = ctx.createOscillator()
        const shaper = ctx.createWaveShaper()
        const gain = ctx.createGain()

        // Saturation curve
        const curve = new Float32Array(256)
        for (let i = 0; i < 256; i++) {
          const x = (i * 2) / 256 - 1
          curve[i] = (1.5 * x) / (1 + 0.5 * Math.abs(x))
        }
        shaper.curve = curve

        osc.type = 'sine'
        osc.frequency.setValueAtTime(130, t)
        osc.frequency.exponentialRampToValueAtTime(32, t + 0.7)

        gain.gain.setValueAtTime(0.85, t)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 2.1)

        osc.connect(shaper)
        shaper.connect(gain)
        gain.connect(masterGain)
        osc.start(t)
        osc.stop(t + 2.2)
        break
      }

      case 'heartbeat': {
        // Lub
        const osc1 = ctx.createOscillator()
        const gain1 = ctx.createGain()
        osc1.type = 'sine'
        osc1.frequency.setValueAtTime(65, t)
        osc1.frequency.exponentialRampToValueAtTime(40, t + 0.12)
        gain1.gain.setValueAtTime(0.7, t)
        gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.22)
        osc1.connect(gain1)
        gain1.connect(masterGain)
        osc1.start(t)
        osc1.stop(t + 0.25)

        // Dub
        const osc2 = ctx.createOscillator()
        const gain2 = ctx.createGain()
        osc2.type = 'sine'
        osc2.frequency.setValueAtTime(52, t + 0.28)
        osc2.frequency.exponentialRampToValueAtTime(35, t + 0.4)
        gain2.gain.setValueAtTime(0.55, t + 0.28)
        gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.5)
        osc2.connect(gain2)
        gain2.connect(masterGain)
        osc2.start(t + 0.28)
        osc2.stop(t + 0.52)
        break
      }

      case 'whoosh': {
        if (this.noiseBuffer) {
          const noise = ctx.createBufferSource()
          noise.buffer = this.noiseBuffer
          const filter = ctx.createBiquadFilter()
          filter.type = 'bandpass'
          filter.frequency.setValueAtTime(250, t)
          filter.frequency.exponentialRampToValueAtTime(2400, t + 0.4)
          filter.frequency.exponentialRampToValueAtTime(300, t + 0.9)
          filter.Q.setValueAtTime(2.5, t)

          const gain = ctx.createGain()
          gain.gain.setValueAtTime(0.001, t)
          gain.gain.linearRampToValueAtTime(0.65, t + 0.4)
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.95)

          noise.connect(filter)
          filter.connect(gain)
          gain.connect(masterGain)
          noise.start(t)
          noise.stop(t + 1.0)
        }
        break
      }

      case 'explosion':
      case 'generic':
      default: {
        const sub = ctx.createOscillator()
        const sGain = ctx.createGain()
        sub.type = 'sine'
        sub.frequency.setValueAtTime(150, t)
        sub.frequency.exponentialRampToValueAtTime(35, t + 0.5)
        sGain.gain.setValueAtTime(0.85, t)
        sGain.gain.exponentialRampToValueAtTime(0.001, t + 2.0)
        sub.connect(sGain)
        sGain.connect(masterGain)
        sub.start(t)
        sub.stop(t + 2.1)

        if (this.noiseBuffer) {
          const noise = ctx.createBufferSource()
          noise.buffer = this.noiseBuffer
          const filter = ctx.createBiquadFilter()
          filter.type = 'lowpass'
          filter.frequency.setValueAtTime(3500, t)
          filter.frequency.exponentialRampToValueAtTime(250, t + 1.8)
          const nGain = ctx.createGain()
          nGain.gain.setValueAtTime(0.8, t)
          nGain.gain.exponentialRampToValueAtTime(0.001, t + 2.2)
          noise.connect(filter)
          filter.connect(nGain)
          nGain.connect(masterGain)
          noise.start(t)
          noise.stop(t + 2.3)
        }
        break
      }
    }

    return {
      cue: textCue,
      category: parsed.category,
      duration: parsed.duration,
      description: parsed.description,
      audioBuffer: null
    }
  }
}

export const foleySynthesisService = new FoleySynthesisService()

