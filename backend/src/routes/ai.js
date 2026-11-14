import { Router } from 'express'

export const aiRouter = Router()

// Check if Gemini API Key is configured in backend/.env
aiRouter.get('/status', (req, res) => {
  res.json({
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0)
  })
})

// Arrange prompt via Gemini 1.5/2.0 Flash API using backend/.env key
aiRouter.post('/arrange', async (req, res) => {
  const { prompt } = req.body
  const apiKey = (process.env.GEMINI_API_KEY || '').trim()

  if (!apiKey) {
    return res.status(200).json({
      success: false,
      geminiConfigured: false,
      message: 'GEMINI_API_KEY not configured in backend/.env. Running procedural fallback.'
    })
  }

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
  "leadInstrument": "keys" | "strings" | "pluck" | "trumpet" | "synth",
  "hasStrings": boolean,
  "hasRainFoley": boolean,
  "hasGradualBuild": boolean,
  "hasSubBass": boolean,
  "hasStaccato": boolean,
  "diffusionPrompt": "A rich, evocative studio-grade acoustic prompt for Meta MusicGen / Stable Audio",
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
        parts: [{ text: `${systemPrompt}\n\nDirector's Prompt: "${prompt || 'Cinematic Film Score'}"` }]
      }
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.7
    }
  }

  const candidateModels = ['gemini-3.5-flash-lite', 'gemini-flash-lite-latest', 'gemini-3.5-flash']
  let lastError = null

  for (const model of candidateModels) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000)
      })

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}))
        const msg = errBody?.error?.message || response.statusText
        console.warn(`Gemini model ${model} failed (${response.status}):`, msg)
        lastError = `Gemini API ${response.status}: ${msg}`
        continue
      }

      const data = await response.json()
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (!rawText) {
        lastError = 'Empty response from Gemini'
        continue
      }

      const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim()
      const parsed = JSON.parse(cleaned)
      return res.json({ success: true, arrangement: parsed, model })
    } catch (err) {
      console.warn(`Gemini model ${model} error:`, err.message)
      lastError = err.message
    }
  }

  return res.status(200).json({
    success: false,
    geminiConfigured: true,
    error: lastError || 'All Gemini model candidates failed'
  })
})

