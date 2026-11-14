// Gemini Music Arranger & Director Service
// Bridges emotional/scene prompts with DAW MIDI notes, soundfont parameters, and audio diffusion prompts.

export interface NoteStep {
  id?: string
  midi: number
  step: number // 0 to 63
  duration?: number // in 16th steps
  stem?: 'keys' | 'drums' | 'guitar' | 'vocal' | string
}

export interface ArrangedComposition {
  title: string
  genre: string
  mood: string
  bpm: number
  key: string
  tension: number // 0 to 100
  leadInstrument: 'keys' | 'strings' | 'pluck' | 'trumpet' | 'synth'
  hasStrings: boolean
  hasRainFoley: boolean
  hasGradualBuild: boolean
  hasSubBass: boolean
  hasStaccato: boolean
  diffusionPrompt: string // High-fidelity acoustic prompt for MusicGen / Stable Audio
  explanation: string // 1-line justification of musical theory choices
  chords: number[][] // 4 chords with exact Hz frequencies
  scale: number[] // 8-10 scale frequencies in Hz
  bassFreqs: number[] // 4 root bass frequencies in Hz
  notes: NoteStep[] // 64-step DAW roll note blocks
  stemNames: {
    keys: string
    drums: string
    guitar: string
    vocal: string
  }
  durationSeconds?: number
  isAiGenerated: boolean
  isMock: boolean
}

// Convert Note Name (e.g. "D3", "F#4") to MIDI number
function noteNameToMidi(note: string): number {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const m = note.trim().match(/^([A-Ga-g][#b]?)(-?\d+)$/)
  if (!m) return 60
  let name = m[1].toUpperCase()
  if (name === 'DB') name = 'C#'
  if (name === 'EB') name = 'D#'
  if (name === 'GB') name = 'F#'
  if (name === 'AB') name = 'G#'
  if (name === 'BB') name = 'A#'
  const octave = parseInt(m[2], 10)
  const idx = notes.indexOf(name)
  if (idx === -1) return 60
  return (octave + 1) * 12 + idx
}

const BACKEND_AI_URL = 'http://localhost:5000/api/ai'

class GeminiArrangerService {
  private sessionApiKey: string = ''
  private isBackendKeyActive: boolean = false

  constructor() {
    this.sessionApiKey = typeof window !== 'undefined' ? (localStorage.getItem('dramatone_gemini_api_key') || '').trim() : ''
    this.checkBackendStatus()
  }

  public async checkBackendStatus(): Promise<boolean> {
    try {
      const res = await fetch(`${BACKEND_AI_URL}/status`, { signal: AbortSignal.timeout(2000) })
      if (res.ok) {
        const data = await res.json()
        this.isBackendKeyActive = Boolean(data?.geminiConfigured)
        return this.isBackendKeyActive
      }
    } catch {
      // Backend not running or offline
    }
    this.isBackendKeyActive = false
    return false
  }

  public getApiKey(): string {
    const envKey = (import.meta.env.GEMINI_API_KEY || '').trim()
    return envKey || this.sessionApiKey
  }

  public setApiKey(key: string) {
    this.sessionApiKey = key.trim()
    if (typeof window !== 'undefined') {
      localStorage.setItem('dramatone_gemini_api_key', this.sessionApiKey)
    }
  }

  public hasApiKey(): boolean {
    return Boolean(this.getApiKey()) || this.isBackendKeyActive
  }

  // Primary method to arrange music from any prompt
  public async arrangeMusic(prompt: string): Promise<ArrangedComposition> {
    const activeKey = this.getApiKey()

    // 1. Try single backend/.env GEMINI_API_KEY via proxy if backend is online
    try {
      const backendRes = await fetch(`${BACKEND_AI_URL}/arrange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
        signal: AbortSignal.timeout(12000)
      })

      if (backendRes.ok) {
        const data = await backendRes.json()
        if (data.success && data.arrangement) {
          return this.sanitizeParsedArrangement(data.arrangement, prompt)
        }
        if (data.error) {
          throw new Error(data.error)
        }
      }
    } catch (e: any) {
      if (e?.message && !e.message.includes('fetch') && !e.message.includes('timeout') && !e.message.includes('Failed')) {
        throw e // Pass meaningful Gemini error to the caller
      }
      // If backend is offline, proceed to direct client call using activeKey
    }

    // 2. Direct Gemini API call using key from backend/.env or browser session
    if (activeKey) {
      try {
        const directResult = await this.queryGeminiApi(prompt, activeKey)
        if (directResult) return directResult
      } catch (err: any) {
        console.error('Gemini API Error:', err)
        throw new Error(`Gemini API ${err.message || 'Request failed'}`)
      }
    }

    // 3. Fallback procedural arranger (works when no API key is provided)
    return this.proceduralArranger(prompt)
  }

  // Helper to format and sanitize JSON from Gemini
  private sanitizeParsedArrangement(parsed: any, prompt: string): ArrangedComposition {
    const chords = Array.isArray(parsed.chords) && parsed.chords.length === 4
      ? parsed.chords
      : [
        [146.83, 174.61, 220.0, 261.63],
        [116.54, 146.83, 174.61, 220.0],
        [130.81, 164.81, 196.0, 246.94],
        [110.0, 138.59, 164.81, 220.0]
      ]

    const scale = Array.isArray(parsed.scale) && parsed.scale.length >= 5
      ? parsed.scale
      : [146.83, 164.81, 174.61, 196.0, 220.0, 246.94, 261.63, 293.66]

    const bassFreqs = Array.isArray(parsed.bassFreqs) && parsed.bassFreqs.length === 4
      ? parsed.bassFreqs
      : [73.42, 58.27, 65.41, 55.0]

    const notes: NoteStep[] = Array.isArray(parsed.notes)
      ? parsed.notes.map((n: { midi?: number; step?: number; duration?: number }, i: number) => ({
        id: `ai-note-${i}`,
        midi: Math.max(36, Math.min(84, n.midi || 60)),
        step: Math.max(0, Math.min(63, n.step || 0)),
        duration: Math.max(1, Math.min(8, n.duration || 1))
      }))
      : []

    return {
      title: parsed.title || 'Gemini Cinematic Arrangement',
      genre: parsed.genre || 'Cinematic Score',
      mood: parsed.mood || 'Expressive',
      bpm: Math.max(50, Math.min(180, parsed.bpm || 80)),
      key: parsed.key || 'D Minor',
      tension: Math.max(0, Math.min(100, parsed.tension ?? 40)),
      leadInstrument: parsed.leadInstrument === 'piano' ? 'keys' : (parsed.leadInstrument || 'keys'),
      hasStrings: Boolean(parsed.hasStrings),
      hasRainFoley: Boolean(parsed.hasRainFoley),
      hasGradualBuild: Boolean(parsed.hasGradualBuild),
      hasSubBass: Boolean(parsed.hasSubBass),
      hasStaccato: Boolean(parsed.hasStaccato),
      diffusionPrompt: parsed.diffusionPrompt || prompt,
      explanation: parsed.explanation || 'Composed dynamically by Gemini 1.5 Flash.',
      chords,
      scale,
      bassFreqs,
      notes,
      stemNames: {
        keys: parsed.stemNames?.keys || 'Harmonic Keys',
        drums: parsed.stemNames?.drums || 'Rhythm Track',
        guitar: parsed.stemNames?.guitar || 'Melodic Voice',
        vocal: parsed.stemNames?.vocal || 'Atmospheric Texture'
      },
      durationSeconds: Math.max(15, Math.min(180, Number(parsed.durationSeconds) || 180)),
      isAiGenerated: true,
      isMock: false
    }
  }

  // Real Gemini REST API Call
  private async queryGeminiApi(prompt: string, apiKey: string): Promise<ArrangedComposition | null> {
    const systemPrompt = `You are Dramatone AI, an elite Hollywood film composer, music theorist, and audio engineer.
Given a director's scene or emotional prompt, you arrange a multi-stem musical score.
You MUST output valid, raw JSON only without markdown formatting.

Format:
{
  "title": "Short poetic title",
  "genre": "Genre name (e.g. Cinematic Indie Score, Dark Orchestral, Cyberpunk)",
  "mood": "Primary emotion (e.g. Hesitant & Tender, Melancholic, Tense, Heroic)",
  "bpm": number (between 60 and 140),
  "key": "Musical Key (e.g. D Minor, Bb Major)",
  "tension": number (0 to 100),
  "leadInstrument": "piano" | "strings" | "pluck" | "trumpet" | "synth",
  "hasStrings": boolean,
  "hasRainFoley": boolean,
  "hasGradualBuild": boolean,
  "hasSubBass": boolean,
  "hasStaccato": boolean,
  "diffusionPrompt": "A rich, evocative studio-grade acoustic prompt for Meta MusicGen / Stable Audio (describe instruments, acoustic room resonance, microphone tone, and cinematic vibe)",
  "explanation": "1 concise sentence explaining the music theory justification for this emotion",
  "chords": [
    [freq1, freq2, freq3, freq4],
    [freq1, freq2, freq3, freq4],
    [freq1, freq2, freq3, freq4],
    [freq1, freq2, freq3, freq4]
  ],
  "scale": [freq1, freq2, freq3, freq4, freq5, freq6, freq7, freq8],
  "bassFreqs": [freq1, freq2, freq3, freq4],
  "notes": [
    {"midi": number (48-84), "step": number (0-63), "duration": number (1-4)}
  ],
  "stemNames": {
    "keys": "Descriptive instrument name for keys/chords",
    "drums": "Descriptive instrument name for percussion/beat",
    "guitar": "Descriptive instrument name for melody/pluck",
    "vocal": "Descriptive instrument name for texture/foley"
  }
}`

    const body = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nDirector's Prompt: "${prompt}"` }]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7
      }
    }

    const candidateModels = ['gemini-3.5-flash-lite', 'gemini-flash-lite-latest', 'gemini-3.5-flash']
    let lastError: Error | null = null

    for (const model of candidateModels) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(10000)
        })

        if (!res.ok) {
          const errBody = await res.json().catch(() => ({}))
          const msg = errBody?.error?.message || res.statusText
          lastError = new Error(`Google API ${res.status}: ${msg}`)
          continue
        }

        const data = await res.json()
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text
        if (!rawText) continue

        const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
        const parsed = JSON.parse(cleaned)
        return this.sanitizeParsedArrangement(parsed, prompt)
      } catch (err: any) {
        lastError = err
      }
    }

    if (lastError) throw lastError
    return null
  }

  // Intelligent Procedural Arranger (Works seamlessly before/without API Key)
  public proceduralArranger(prompt: string): ArrangedComposition {
    const p = (prompt || '').toLowerCase()

    // 1. Shy / Hesitant / Awkward / Intimate / Timid Archetype
    if (p.includes('shy') || p.includes('timid') || p.includes('hesitat') || p.includes('awkward') || p.includes('vulnerab') || p.includes('blush')) {
      const chords = [
        [146.83, 174.61, 220.0, 261.63], // Dm9 (gentle minor 9th)
        [116.54, 146.83, 174.61, 220.0],  // Bbmaj7 (tender warmth)
        [130.81, 164.81, 196.0, 246.94],  // Fsus2 / C (unresolved vulnerability)
        [110.0, 138.59, 164.81, 220.0]    // Asus4 (hesitating breath before repeat)
      ]
      const scale = [146.83, 164.81, 174.61, 196.0, 220.0, 246.94, 261.63, 293.66]
      const bassFreqs = [73.42, 58.27, 65.41, 55.0]

      // Sparser notes with hesitations on steps
      const notes: NoteStep[] = [
        // Measure 1: Dm9 gentle chord + hesitating pluck
        { id: 'shy-1', midi: noteNameToMidi('D4'), step: 0, duration: 4 },
        { id: 'shy-2', midi: noteNameToMidi('F4'), step: 0, duration: 3 },
        { id: 'shy-3', midi: noteNameToMidi('A4'), step: 2, duration: 2 },
        { id: 'shy-4', midi: noteNameToMidi('C5'), step: 6, duration: 2 }, // timid hesitation
        // Measure 2: Bbmaj7
        { id: 'shy-5', midi: noteNameToMidi('Bb3'), step: 16, duration: 4 },
        { id: 'shy-6', midi: noteNameToMidi('D4'), step: 16, duration: 3 },
        { id: 'shy-7', midi: noteNameToMidi('F4'), step: 18, duration: 2 },
        { id: 'shy-8', midi: noteNameToMidi('A4'), step: 24, duration: 2 },
        // Measure 3: Delicate Pluck motif
        { id: 'shy-9', midi: noteNameToMidi('C4'), step: 32, duration: 3 },
        { id: 'shy-10', midi: noteNameToMidi('E4'), step: 34, duration: 2 },
        { id: 'shy-11', midi: noteNameToMidi('G4'), step: 38, duration: 1 },
        { id: 'shy-12', midi: noteNameToMidi('D5'), step: 42, duration: 2 },
        // Measure 4: Lingering Asus4 fade
        { id: 'shy-13', midi: noteNameToMidi('A3'), step: 48, duration: 4 },
        { id: 'shy-14', midi: noteNameToMidi('D4'), step: 50, duration: 3 },
        { id: 'shy-15', midi: noteNameToMidi('E4'), step: 56, duration: 2 }
      ]

      return {
        title: 'Hesitant Heartbeats',
        genre: 'Intimate Indie Chamber',
        mood: 'Hesitant & Tender',
        bpm: 68,
        key: 'D Minor',
        tension: 28,
        leadInstrument: 'keys',
        hasStrings: true,
        hasRainFoley: false,
        hasGradualBuild: false,
        hasSubBass: false,
        hasStaccato: true,
        diffusionPrompt:
          'Delicate felt upright piano with quiet mechanical room noise, sparse acoustic nylon string plucks with hesitant timing, gentle room reverb, warm vinyl floor tone, 68 bpm, bittersweet indie film drama score.',
        explanation:
          'Mapped "shy" to 68 BPM D Minor with soft felt piano, delicate staccato plucks, and intentional rhythmic hesitations.',
        chords,
        scale,
        bassFreqs,
        notes,
        stemNames: {
          keys: 'Felt Upright Piano',
          drums: 'Soft Finger Snaps / Rim',
          guitar: 'Hesitant Nylon Plucks',
          vocal: 'Warm Room Ambient Tone'
        },
        isAiGenerated: false,
        isMock: true
      }
    }

    // 2. Rain / Foley / Storm / Sorrow Archetype
    if (p.includes('rain') || p.includes('water') || p.includes('storm') || p.includes('sad') || p.includes('melanchol') || p.includes('cry')) {
      const chords = [
        [130.81, 155.56, 196.0, 246.94], // Cm9
        [116.54, 138.59, 174.61, 207.65], // Abmaj7
        [87.31, 116.54, 138.59, 174.61],  // Fm7
        [98.0, 123.47, 146.83, 196.0]     // G7(b9)
      ]
      const scale = [130.81, 146.83, 155.56, 174.61, 196.0, 207.65, 233.08, 261.63]
      const bassFreqs = [65.41, 51.91, 43.65, 49.0]

      const notes: NoteStep[] = [
        { id: 'rain-1', midi: noteNameToMidi('C4'), step: 0, duration: 4 },
        { id: 'rain-2', midi: noteNameToMidi('Eb4'), step: 2, duration: 3 },
        { id: 'rain-3', midi: noteNameToMidi('G4'), step: 8, duration: 2 },
        { id: 'rain-4', midi: noteNameToMidi('Bb4'), step: 12, duration: 2 },
        { id: 'rain-5', midi: noteNameToMidi('Ab3'), step: 16, duration: 4 },
        { id: 'rain-6', midi: noteNameToMidi('C4'), step: 18, duration: 3 },
        { id: 'rain-7', midi: noteNameToMidi('Eb4'), step: 22, duration: 2 }
      ]

      return {
        title: 'Rain on Asphalt',
        genre: 'Cinematic Noir & Foley',
        mood: 'Melancholic',
        bpm: 72,
        key: 'C Minor',
        tension: 42,
        leadInstrument: 'strings',
        hasStrings: true,
        hasRainFoley: true,
        hasGradualBuild: true,
        hasSubBass: true,
        hasStaccato: false,
        diffusionPrompt:
          'Solo melancholic cello over soft electric Rhodes chords, steady soft rain hitting window glass, warm binaural room foley, 72 bpm, poignant drama film score.',
        explanation: 'Paired gentle rain foley with dark Cm9 cello chords at 72 BPM.',
        chords,
        scale,
        bassFreqs,
        notes,
        stemNames: {
          keys: 'Melancholic Rhodes',
          drums: 'Soft Brush Percussion',
          guitar: 'Solo Cello Ostinato',
          vocal: 'Binaural Rain Foley'
        },
        isAiGenerated: false,
        isMock: true
      }
    }

    // 3. Cyberpunk / Action / Neon Archetype
    if (p.includes('cyber') || p.includes('action') || p.includes('pulse') || p.includes('chase') || p.includes('speed')) {
      const chords = [
        [110.0, 130.81, 164.81],
        [87.31, 110.0, 130.81],
        [130.81, 164.81, 196.0],
        [98.0, 123.47, 146.83]
      ]
      const scale = [110.0, 123.47, 130.81, 146.83, 164.81, 174.61, 196.0, 220.0]
      const bassFreqs = [55.0, 43.65, 65.41, 49.0]
      const notes: NoteStep[] = [
        { id: 'cyber-1', midi: 57, step: 0, duration: 1 },
        { id: 'cyber-2', midi: 57, step: 2, duration: 1 },
        { id: 'cyber-3', midi: 60, step: 4, duration: 1 },
        { id: 'cyber-4', midi: 62, step: 6, duration: 1 },
        { id: 'cyber-5', midi: 57, step: 8, duration: 1 },
        { id: 'cyber-6', midi: 65, step: 10, duration: 1 }
      ]

      return {
        title: 'Neon Pursuit',
        genre: 'Cyberpunk Synthwave',
        mood: 'High Adrenaline',
        bpm: 130,
        key: 'A Minor',
        tension: 88,
        leadInstrument: 'synth',
        hasStrings: false,
        hasRainFoley: false,
        hasGradualBuild: true,
        hasSubBass: true,
        hasStaccato: true,
        diffusionPrompt:
          'Driving 130 bpm synthwave with analog Moog bassline, punchy LinnDrum kick, distorted gated snare, and soaring cyberpunk saw leads.',
        explanation: 'High-energy 130 BPM minor pulse with aggressive bass and staccato arpeggio.',
        chords,
        scale,
        bassFreqs,
        notes,
        stemNames: {
          keys: 'Analog Saw Pad',
          drums: 'Industrial Kick / Snare',
          guitar: 'Staccato Synth Arp',
          vocal: 'Cyber Sub-Bass Drone'
        },
        isAiGenerated: false,
        isMock: true
      }
    }

    // 4. Default / General Cinematic Orchestral Score
    const chords = [
      [146.83, 174.61, 220.0, 293.66],
      [116.54, 146.83, 174.61, 233.08],
      [87.31, 110.0, 130.81, 174.61],
      [130.81, 164.81, 196.0, 261.63]
    ]
    const scale = [146.83, 174.61, 196.0, 220.0, 261.63, 293.66, 349.23, 392.0]
    const bassFreqs = [36.71, 29.14, 43.65, 32.7]
    const notes: NoteStep[] = [
      { id: 'def-1', midi: 62, step: 0, duration: 3 },
      { id: 'def-2', midi: 65, step: 4, duration: 2 },
      { id: 'def-3', midi: 69, step: 8, duration: 2 },
      { id: 'def-4', midi: 72, step: 12, duration: 2 }
    ]

    return {
      title: 'Cinematic Resonance',
      genre: 'Cinematic Score',
      mood: 'Dramatic',
      bpm: 88,
      key: 'D Minor',
      tension: 50,
      leadInstrument: 'strings',
      hasStrings: true,
      hasRainFoley: false,
      hasGradualBuild: true,
      hasSubBass: true,
      hasStaccato: true,
      diffusionPrompt:
        'Expansive Hollywood symphonic score with rich violin section, deep French horns, subtle timpani rolls, and cinematic hall acoustics, 88 bpm.',
      explanation: 'Balanced cinematic arrangement in D Minor at 88 BPM.',
      chords,
      scale,
      bassFreqs,
      notes,
      stemNames: {
        keys: 'Violin Section / Pad',
        drums: 'Cinematic Timpani',
        guitar: 'Staccato Ostinato',
        vocal: 'Sub-Bass Drone Foundation'
      },
      isAiGenerated: false,
      isMock: true
    }
  }
}

export const geminiArrangerService = new GeminiArrangerService()
