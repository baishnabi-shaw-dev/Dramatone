// Music Generation Service: In-House Procedural Composition & Prompt Synthesis
import { audioEngine } from '@/services/audioEngine'
import { apiClient } from '@/services/apiClient'

export interface GeneratedTake {
  id: number
  title: string
  seed: string
  key: string
  bpm: number
  genre: string
  mood: string
  bars: number[]
  duration?: number
}

class GenerationService {
  public generateTrack(prompt: string, genre: string, mood: string, bpm: number, duration = 180): GeneratedTake {
    const p = (prompt || '').toLowerCase()

    // 1. Explicit BPM parser: extract explicit BPM if prompted e.g. "90 BPM", "100bpm"
    const bpmMatch = p.match(/(\d{2,3})\s*bpm/i)
    const effectiveBpm = bpmMatch ? parseInt(bpmMatch[1], 10) : (bpm || 90)

    // 2. Semantic keywords extraction
    const hasStrings = p.includes('string') || p.includes('violin') || p.includes('cello') || p.includes('orchestr')
    const hasRain = p.includes('rain') || p.includes('water') || p.includes('storm') || p.includes('weather') || p.includes('foley')
    const hasBuild = p.includes('build') || p.includes('gradual') || p.includes('crescendo') || p.includes('swell') || p.includes('rise')
    const hasSubBass = p.includes('sub') || p.includes('bass') || p.includes('drone')
    const hasStaccato = p.includes('staccato') || p.includes('pulse') || p.includes('pulsing')

    let effectiveGenre = genre
    let effectiveMood = mood

    // Smart prompt recognition: prioritize rich acoustic/foley layers if prompted
    if (hasRain || (hasStrings && (p.includes('dark') || p.includes('tense') || hasBuild || p.includes('cinematic')))) {
      effectiveGenre = hasRain ? 'Dark Cinematic Build (Strings & Rain)' : 'Cinematic Score'
      effectiveMood = 'Tense'
    } else if (p.includes('trumpet') || p.includes('brass') || p.includes('horn') || p.includes('fanfare') || p.includes('bugle')) {
      effectiveGenre = 'Brass & Trumpet'
      effectiveMood = 'Heroic'
    } else if (p.includes('piano') || p.includes('lofi') || p.includes('lo-fi') || p.includes('chill') || p.includes('rhodes')) {
      effectiveGenre = 'Lo-Fi Chill'
      effectiveMood = 'Mellow'
    } else if (p.includes('ambient') || p.includes('drone') || p.includes('space') || p.includes('meditation')) {
      effectiveGenre = 'Ambient Drone'
      effectiveMood = 'Dreamy'
    } else if (p.includes('cyber') || p.includes('synth') || p.includes('retro') || p.includes('80s')) {
      effectiveGenre = 'Synthwave'
      effectiveMood = 'Euphoric'
    } else if (p.includes('cinematic') || p.includes('epic') || p.includes('score') || p.includes('film')) {
      effectiveGenre = 'Cinematic Score'
      effectiveMood = 'Dramatic'
    } else if (p.includes('eerie') || p.includes('dark') || p.includes('creepy') || p.includes('horror') || p.includes('scary')) {
      effectiveGenre = 'Eerie & Dark Horror'
      effectiveMood = 'Tense'
    }

    const compositionOptions = {
      hasStrings: hasStrings || effectiveGenre.includes('Cinematic') || effectiveGenre.includes('Strings'),
      hasRainFoley: hasRain,
      hasGradualBuild: hasBuild || effectiveGenre.includes('Build'),
      hasSubBass: hasSubBass || effectiveGenre.includes('Cinematic') || effectiveGenre.includes('Dark'),
      hasStaccato: hasStaccato || effectiveGenre.includes('Cinematic') || effectiveGenre.includes('Build')
    }

    // Load composition chords, scales, BPM, and synthesis options into audioEngine
    audioEngine.loadComposition(effectiveGenre, effectiveMood, effectiveBpm, compositionOptions)
    const profile = audioEngine.getActiveProfile()

    // Dynamic bar visualization derived from mood energy
    const baseEnergy = effectiveMood === 'Euphoric' || effectiveMood === 'Energetic' || effectiveMood === 'Heroic' ? 70 : effectiveMood === 'Tense' || effectiveMood === 'Suspense' ? 60 : 40
    const bars = Array.from({ length: 16 }, (_, i) => {
      const curve = Math.sin((i / 15) * Math.PI) * 25
      return Math.min(100, Math.max(20, Math.floor(baseEnergy + curve + (Math.random() * 30 - 15))))
    })

    const titlePrefix = effectiveGenre === 'Brass & Trumpet' ? 'Trumpet Fanfare' : effectiveGenre
    const take: GeneratedTake = {
      id: Date.now(),
      title: `${titlePrefix} (${effectiveMood}) Take #${Math.floor(1 + Math.random() * 99)}`,
      seed: `SEED-${Math.floor(1000 + Math.random() * 9000)}`,
      key: profile.key,
      bpm: effectiveBpm,
      genre: effectiveGenre,
      mood: effectiveMood,
      bars,
      duration: Math.max(15, Math.min(180, duration))
    }

    // Persist take to MongoDB / LocalStorage so it dynamically populates the library and projects
    apiClient.saveProject({
      title: take.title,
      genre: take.genre,
      mood: take.mood,
      bpm: take.bpm,
      tension: audioEngine.getTension(),
      stems: [
        { id: 'keys', name: compositionOptions.hasStrings ? 'Cinematic Strings (Violin/Cello)' : 'Dramatone Keys', volume: 85, muted: false, solo: false },
        { id: 'drums', name: compositionOptions.hasStrings ? 'Cinematic Timpani & Impacts' : 'Neural Drums', volume: compositionOptions.hasStrings ? 0 : 85, muted: compositionOptions.hasStrings, solo: false },
        { id: 'guitar', name: compositionOptions.hasStaccato ? 'Staccato String Ostinato' : 'Acoustic Pluck', volume: 80, muted: false, solo: false },
        { id: 'vocal', name: compositionOptions.hasRainFoley ? 'Ambient Rain Foley & Transients' : 'Vocal Texture', volume: 75, muted: false, solo: false }
      ]
    }).catch(() => {})

    return take
  }

  public auditionTake(take: GeneratedTake) {
    const isStrings = take.genre.includes('Cinematic') || take.genre.includes('Strings')
    const hasRain = take.genre.includes('Rain')
    const hasBuild = take.genre.includes('Build')
    audioEngine.loadComposition(take.genre, take.mood, take.bpm, {
      hasStrings: isStrings,
      hasRainFoley: hasRain,
      hasGradualBuild: hasBuild,
      hasSubBass: isStrings,
      hasStaccato: isStrings,
      duration: take.duration
    })
    audioEngine.ensureContext()
    audioEngine.start()
  }

  public async downloadWav(take: GeneratedTake) {
    const isStrings = take.genre.includes('Cinematic') || take.genre.includes('Strings')
    const hasRain = take.genre.includes('Rain')
    const hasBuild = take.genre.includes('Build')
    audioEngine.loadComposition(take.genre, take.mood, take.bpm, {
      hasStrings: isStrings,
      hasRainFoley: hasRain,
      hasGradualBuild: hasBuild,
      hasSubBass: isStrings,
      hasStaccato: isStrings,
      duration: take.duration
    })
    const blob = await audioEngine.exportSoundscapeWav(16)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${take.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.wav`
    a.click()
    URL.revokeObjectURL(url)
  }
}

export const generationService = new GenerationService()
