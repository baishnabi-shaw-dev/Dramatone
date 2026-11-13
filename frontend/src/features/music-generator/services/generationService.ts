// Music Generation Service: In-House Procedural Composition & Prompt Synthesis
import { audioEngine } from '@/services/audioEngine'

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
  public generateTrack(_prompt: string, genre: string, mood: string, bpm: number): GeneratedTake {
    audioEngine.setBpm(bpm)

    // Compute dynamic bar visualization based on mood and genre energy
    const baseEnergy = mood === 'Euphoric' || mood === 'Energetic' ? 70 : mood === 'Tense' ? 60 : 40
    const bars = Array.from({ length: 16 }, (_, i) => {
      const curve = Math.sin((i / 15) * Math.PI) * 25
      return Math.min(100, Math.max(20, Math.floor(baseEnergy + curve + (Math.random() * 30 - 15))))
    })

    const take: GeneratedTake = {
      id: Date.now(),
      title: `${genre} (${mood}) — In-House Procedural Take`,
      seed: `SEED-${Math.floor(1000 + Math.random() * 9000)}`,
      key: 'F Minor',
      bpm,
      genre,
      mood,
      bars
    }

    return take
  }

  public async downloadWav(take: GeneratedTake) {
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
