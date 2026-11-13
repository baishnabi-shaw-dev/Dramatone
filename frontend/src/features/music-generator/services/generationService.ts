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
}

class GenerationService {
  public generateTrack(prompt: string, genre: string, mood: string, bpm: number): GeneratedTake {
    const p = (prompt || '').toLowerCase()
    let effectiveGenre = genre
    let effectiveMood = mood

    // Smart prompt recognition: prioritize instrument/style mentioned in prompt
    if (p.includes('eerie') || p.includes('dark') || p.includes('creepy') || p.includes('horror') || p.includes('scary') || p.includes('ghost') || p.includes('spooky') || p.includes('suspense')) {
      effectiveGenre = 'Eerie & Dark Horror'
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
    }

    // Load composition chords, scales, and BPM into audioEngine
    audioEngine.loadComposition(effectiveGenre, effectiveMood, bpm)
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
      bpm,
      genre: effectiveGenre,
      mood: effectiveMood,
      bars
    }

    // Persist take to MongoDB / LocalStorage so it dynamically populates the library and projects
    apiClient.saveProject({
      title: take.title,
      genre: take.genre,
      mood: take.mood,
      bpm: take.bpm,
      tension: audioEngine.getTension(),
      stems: [
        { id: 'keys', name: 'Dramatone Keys', volume: 80, muted: false, solo: false },
        { id: 'drums', name: 'Neural Drums', volume: 85, muted: false, solo: false },
        { id: 'guitar', name: 'Acoustic Pluck', volume: 75, muted: false, solo: false },
        { id: 'vocal', name: 'Vocal Texture', volume: 70, muted: false, solo: false }
      ]
    }).catch(() => {})

    return take
  }

  public auditionTake(take: GeneratedTake) {
    audioEngine.loadComposition(take.genre, take.mood, take.bpm)
    audioEngine.ensureContext()
    audioEngine.start()
  }

  public async downloadWav(take: GeneratedTake) {
    audioEngine.loadComposition(take.genre, take.mood, take.bpm)
    const blob = await audioEngine.exportSoundscapeWav(12)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${take.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.wav`
    a.click()
    URL.revokeObjectURL(url)
  }
}

export const generationService = new GenerationService()
