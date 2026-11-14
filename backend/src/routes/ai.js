import { Router } from 'express'

export const aiRouter = Router()

// Check if Gemini API Key is configured in backend/.env
aiRouter.get('/status', (req, res) => {
  res.json({
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0)
  })
})

// Arrange prompt via Gemini Flash API using backend/.env key
aiRouter.post('/arrange', async (req, res) => {
  const { prompt, duration } = req.body || {}
  const targetDuration = Math.max(10, Math.min(180, Number(duration) || 30))
  const apiKey = (process.env.GEMINI_API_KEY || '').trim()

  console.log(`[Dramatone Backend] 🎼 New arrange request: "${prompt || 'Default'}" (Target length: ${targetDuration}s)`)

  if (!apiKey) {
    console.warn('[Dramatone Backend] ⚠️ GEMINI_API_KEY not configured in backend/.env')
    return res.status(200).json({
      success: false,
      geminiConfigured: false,
      message: 'GEMINI_API_KEY not configured in backend/.env. Running procedural fallback.'
    })
  }

  const systemPrompt = `You are Dramatone AI, an elite adaptive soundscape composer, music theorist, and audio engineer built for independent indie game developers, filmmakers, and podcast producers.
Given a scene, gameplay state, podcast narrative beat, or emotional prompt, you arrange a multi-stem adaptive musical soundscape tailored to dynamic emotional pacing.
Target composition duration: ${targetDuration} seconds.
You MUST output valid, raw JSON only without markdown formatting.

Format:
{
  "title": "Short poetic title",
  "genre": "Genre name (e.g. Indie Game OST, Cinematic Underscore, Cyberpunk Action, Atmospheric Podcast Ambience)",
  "mood": "Primary emotion (e.g. Hesitant & Tender, Melancholic, Tense, Heroic)",
  "bpm": number (between 60 and 140),
  "key": "Musical Key (e.g. D Minor, Bb Major)",
  "tension": number (0 to 100),
  "durationSeconds": ${targetDuration},
  "leadInstrument": "keys" | "strings" | "pluck" | "trumpet" | "synth",
  "hasStrings": boolean,
  "hasRainFoley": boolean,
  "hasGradualBuild": boolean,
  "hasSubBass": boolean,
  "hasStaccato": boolean,
  "diffusionPrompt": "A rich, evocative studio-grade acoustic prompt for Meta MusicGen / Stable Audio (describe instruments, room acoustics, dialogue-friendly dynamic space, and emotional pacing)",
  "explanation": "1 concise sentence explaining the musical theory and narrative/gameplay justification for this pacing",
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
}
CRITICAL NOTE DISTRIBUTION:
You MUST generate 16 to 32 note events distributed evenly across all 4 measures (steps 0 through 63: Measure 1: steps 0-15, Measure 2: steps 16-31, Measure 3: steps 32-47, Measure 4: steps 48-63). DO NOT stop generating after step 12! Ensure melodic and harmonic notes exist in every measure!`

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: `${systemPrompt}\n\nCreator's Prompt: "${prompt || 'Adaptive Game & Narrative Soundscape'}"` }]
      }
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.7
    }
  }

  const candidateModels = [
    'gemini-flash-lite-latest',
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-3.8-flash',
    'gemini-3.5-flash'
  ]
  let lastError = null

  for (const model of candidateModels) {
    const startTime = Date.now()
    try {
      console.log(`[Dramatone Backend] 🤖 Calling Gemini model: ${model}...`)
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(20000)
      })

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}))
        const msg = errBody?.error?.message || response.statusText
        console.warn(`[Dramatone Backend] ⚠️ Model ${model} failed (${response.status}): ${msg}`)
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
      parsed.durationSeconds = targetDuration
      const elapsed = Date.now() - startTime
      console.log(`[Dramatone Backend] ✅ Model ${model} generated score in ${elapsed}ms: "${parsed.title}" (${parsed.notes?.length || 0} notes across 4 measures)`)
      return res.json({ success: true, arrangement: parsed, model })
    } catch (err) {
      console.warn(`[Dramatone Backend] ⚠️ Model ${model} error:`, err.message)
      lastError = err.message
    }
  }

  return res.status(200).json({
    success: false,
    geminiConfigured: true,
    error: lastError || 'All Gemini model candidates failed'
  })
})

