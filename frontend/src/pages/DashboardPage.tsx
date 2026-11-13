import { useState } from 'react'
import { Sparkles, Wand2, Plus, Piano, Drum, Guitar, Mic2, Film, Scissors, Download, Save, Check } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { AppRoute } from '@/components/layout/Sidebar'
import { audioEngine, StemId } from '@/services/audioEngine'
import { apiClient } from '@/services/apiClient'
import { soundscapeService } from '@/features/adaptive-soundscape/services/soundscapeService'

interface PageProps {
  isDark: boolean
  onToggleTheme: () => void
  onNavigate: (page: AppRoute) => void
}

export function DashboardPage({ isDark, onToggleTheme, onNavigate }: PageProps) {
  const [promptText, setPromptText] = useState('Warm analog arpeggio with punchy sub-bass and airy vocal Dramatones')
  const [isGenerating, setIsGenerating] = useState(false)
  const [playhead, setPlayhead] = useState(24)
  const [stems, setStems] = useState([
    { id: 'keys', name: 'Dramatone Keys', type: 'keys', muted: false, solo: false, bars: [35, 60, 80, 45, 70, 95, 65, 50, 85, 90, 60, 40, 75, 88, 55, 42, 68, 92, 74, 50, 65, 82, 54, 38] },
    { id: 'drums', name: 'Neural Drums', type: 'drums', muted: false, solo: false, bars: [90, 30, 65, 35, 95, 25, 70, 40, 92, 30, 68, 35, 96, 28, 72, 42, 88, 32, 66, 38, 91, 29, 70, 40] },
    { id: 'guitar', name: 'Acoustic Pluck', type: 'guitar', muted: false, solo: false, bars: [25, 45, 55, 70, 60, 40, 50, 75, 80, 65, 45, 35, 55, 72, 68, 50, 42, 60, 78, 62, 48, 36, 52, 30] },
    { id: 'vocal', name: 'Vocal Texture', type: 'vocal', muted: false, solo: false, bars: [15, 20, 45, 78, 88, 92, 70, 40, 20, 15, 50, 82, 95, 85, 60, 30, 18, 48, 76, 90, 74, 42, 22, 16] }
  ])

  const [saveStatus, setSaveStatus] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  const cardClass = isDark ? 'border-white/10 bg-black/45' : 'border-white/75 bg-white/60 shadow-sm'
  const accentText = isDark ? 'text-orange-500' : 'text-indigo-600'

  const handleGenerate = () => {
    setIsGenerating(true)
    audioEngine.ensureContext()
    setTimeout(() => {
      // Randomize bar shapes and modulate tension
      setStems((prev) =>
        prev.map((s) => ({
          ...s,
          bars: s.bars.map(() => Math.floor(20 + Math.random() * 75))
        }))
      )
      audioEngine.setTension(65)
      setIsGenerating(false)
    }, 500)
  }

  const handleToggleMute = (stemId: string) => {
    setStems((prev) =>
      prev.map((s) => {
        if (s.id === stemId) {
          const nextMuted = !s.muted
          if (['keys', 'drums', 'guitar', 'vocal'].includes(s.id)) {
            audioEngine.setStemMute(s.id as StemId, nextMuted)
          }
          return { ...s, muted: nextMuted }
        }
        return s
      })
    )
  }

  const handleToggleSolo = (stemId: string) => {
    setStems((prev) =>
      prev.map((s) => {
        if (s.id === stemId) {
          const nextSolo = !s.solo
          if (['keys', 'drums', 'guitar', 'vocal'].includes(s.id)) {
            audioEngine.setStemSolo(s.id as StemId, nextSolo)
          }
          return { ...s, solo: nextSolo }
        }
        return s
      })
    )
  }

  const handleSaveProject = async () => {
    setSaveStatus('Saving...')
    try {
      const saved = await apiClient.saveProject({
        title: promptText.slice(0, 32) || 'Untitled Soundscape',
        genre: 'Synthwave',
        mood: 'Euphoric',
        bpm: audioEngine.getBpm(),
        tension: audioEngine.getTension(),
        stems: stems.map((s) => ({ id: s.id, name: s.name, volume: 80, muted: s.muted, solo: s.solo }))
      })
      setSaveStatus(saved.syncedToCloud ? 'Saved to MongoDB!' : 'Saved Locally!')
      setTimeout(() => setSaveStatus(null), 3000)
    } catch {
      setSaveStatus('Saved Locally!')
      setTimeout(() => setSaveStatus(null), 3000)
    }
  }

  const handleExportWav = async () => {
    setIsExporting(true)
    try {
      await soundscapeService.exportWav('Dramatone_Master_Take', 16)
    } finally {
      setIsExporting(false)
    }
  }

  const handleSplitAtPlayhead = () => {
    setStems((prev) =>
      prev.map((s) => ({
        ...s,
        bars: s.bars.map((b, idx) => (idx >= Math.floor(s.bars.length / 2) ? Math.floor(b * 0.7) : b))
      }))
    )
  }

  return (
    <MainLayout
      activePage="dashboard"
      isDark={isDark}
      onToggleTheme={onToggleTheme}
      onNavigate={onNavigate}
      title="Studio Workspace"
      subtitle="Video-Synced Multi-Stem DAW"
    >
      {/* Top-Left Prompt & Presets Card (Sits beside Top-Right Video Monitor) */}
      <div className={`p-4 rounded-3xl border backdrop-blur-md space-y-3 ${cardClass}`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-semibold flex items-center gap-1.5 ${isDark ? 'text-zinc-200' : 'text-slate-900'}`}>
            <Sparkles className={`w-3.5 h-3.5 ${accentText}`} />
            AI Stem Diffusion &amp; Scene Scoring
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => onNavigate('soundscape')} className={`text-[11px] hover:underline cursor-pointer ${accentText}`}>
              Adaptive Score
            </button>
            <span className="opacity-30">|</span>
            <button onClick={() => onNavigate('generator')} className={`text-[11px] hover:underline cursor-pointer ${accentText}`}>
              Full Generator &rarr;
            </button>
          </div>
        </div>

        <textarea
          rows={2}
          value={promptText}
          onChange={(e) => setPromptText(e.target.value)}
          className={`w-full rounded-2xl border p-2.5 text-xs resize-none focus:outline-none ${
            isDark ? 'bg-zinc-950/70 border-white/10 text-zinc-100' : 'bg-white/80 border-white text-slate-900'
          }`}
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {['Cinematic Riser', 'Lo-Fi Beat', 'Ambient Pad', 'Action Pulse'].map((preset) => (
              <button
                key={preset}
                onClick={() => setPromptText(`${preset} tailored to match video scene transitions, 118 BPM`)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-medium border cursor-pointer transition ${
                  isDark
                    ? 'border-white/10 bg-white/5 text-zinc-300 hover:border-orange-500/40'
                    : 'border-white bg-white/80 text-slate-700 hover:border-indigo-400'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`px-4 py-1.5 rounded-full bg-gradient-to-r hover:brightness-110 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 ${
              isDark ? 'from-orange-500 to-amber-500 text-zinc-950' : 'from-sky-500 via-indigo-500 to-violet-500 text-white'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>{isGenerating ? 'Synthesizing...' : 'Generate Stems'}</span>
          </button>
        </div>
      </div>

      {/* Multi-Track Video + Audio Stem Timeline */}
      <div className={`p-3.5 rounded-3xl border backdrop-blur-md flex-1 flex flex-col justify-between gap-2 ${cardClass}`}>
        {/* Timeline Ruler & Split Toolbar */}
        <div className="flex items-center justify-between pb-1 border-b border-white/10">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSplitAtPlayhead}
              className={`px-2.5 py-1 rounded-lg border text-[10px] font-medium flex items-center gap-1 cursor-pointer ${
                isDark ? 'border-white/10 bg-white/5 text-zinc-300 hover:text-white' : 'border-white bg-white/85 text-slate-800'
              }`}
            >
              <Scissors className="w-3 h-3" />
              Split at Playhead
            </button>
            <span className={`text-[10px] font-mono ${isDark ? 'text-zinc-500' : 'text-slate-600'}`}>
              00:00 — 00:25 — 00:50 — 01:15 — 01:45
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {saveStatus && (
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded flex items-center gap-1 ${
                isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-indigo-500/15 text-indigo-700'
              }`}>
                <Check className="w-2.5 h-2.5" />
                {saveStatus}
              </span>
            )}

            <button
              onClick={handleSaveProject}
              title="Save Session to MongoDB / Local Cache"
              className={`px-2.5 py-1 rounded-lg border text-[10px] font-medium flex items-center gap-1 cursor-pointer transition ${
                isDark ? 'border-orange-500/40 bg-orange-500/15 text-orange-400 hover:bg-orange-500/25' : 'border-indigo-400 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
              }`}
            >
              <Save className="w-3 h-3" />
              Save Project
            </button>

            <button
              onClick={handleExportWav}
              disabled={isExporting}
              title="Render & Export 44.1kHz Stereo WAV"
              className={`px-2.5 py-1 rounded-lg border text-[10px] font-medium flex items-center gap-1 cursor-pointer transition ${
                isDark ? 'border-white/10 bg-white/5 text-zinc-300 hover:text-white' : 'border-white bg-white/85 text-slate-800'
              }`}
            >
              <Download className="w-3 h-3" />
              {isExporting ? 'Rendering...' : 'Export WAV'}
            </button>

            <button
              onClick={() => soundscapeService.exportGameConfig('Cyberpunk Scene')}
              title="Export Unity / Godot Adaptive Soundscape JSON"
              className={`px-2 py-1 rounded-lg border text-[10px] font-medium flex items-center gap-1 cursor-pointer ${
                isDark ? 'border-white/10 bg-white/5 text-zinc-400 hover:text-zinc-200' : 'border-white bg-white/85 text-slate-600'
              }`}
            >
              Game JSON
            </button>

            <button
              onClick={() =>
                setStems((prev) => [
                  ...prev,
                  {
                    id: `custom-${Date.now()}`,
                    name: `Synth Layer 0${prev.length + 1}`,
                    type: 'keys',
                    muted: false,
                    solo: false,
                    bars: Array.from({ length: 24 }, () => Math.floor(25 + Math.random() * 70))
                  }
                ])
              }
              className={`px-2.5 py-1 rounded-lg border text-[10px] font-medium flex items-center gap-1 cursor-pointer ${
                isDark ? 'border-white/10 bg-white/5 text-zinc-300' : 'border-white bg-white/85 text-slate-800'
              }`}
            >
              <Plus className="w-3 h-3" />
              Add Audio Track
            </button>
          </div>
        </div>

        {/* Tracks Stack: 1 Video Track + 4 Audio Stem Tracks */}
        <div className="space-y-1.5 overflow-y-auto">
          {/* Video Track Lane */}
          <div className={`p-2 rounded-2xl border flex items-center gap-3 ${
            isDark ? 'border-orange-500/30 bg-orange-500/10' : 'border-indigo-400/40 bg-indigo-500/10'
          }`}>
            <div className="w-28 shrink-0 flex items-center gap-2">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                isDark ? 'bg-orange-500 text-zinc-950' : 'bg-indigo-600 text-white'
              }`}>
                <Film className="w-3.5 h-3.5" />
              </div>
              <span className={`text-[11px] font-semibold truncate ${isDark ? 'text-orange-300' : 'text-indigo-900'}`}>
                Video Track
              </span>
            </div>

            <div
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                setPlayhead(((e.clientX - rect.left) / rect.width) * 100)
              }}
              className={`flex-1 h-7 rounded-xl px-2 flex items-center justify-between relative overflow-hidden cursor-pointer ${
                isDark ? 'bg-black/40 border border-orange-500/20' : 'bg-white/70 border border-indigo-300/50'
              }`}
            >
              <span className={`text-[10px] font-mono ${isDark ? 'text-orange-200/80' : 'text-indigo-800'}`}>
                [ Main_Video_Clip.mp4 • 24fps ]
              </span>
              <div
                style={{ left: `${playhead}%` }}
                className="absolute top-0 bottom-0 w-[2px] bg-red-500 pointer-events-none"
              />
            </div>
          </div>

          {/* Audio Stem Lanes */}
          {stems.map((stem) => (
            <div
              key={stem.id}
              className={`p-2 rounded-2xl border flex items-center gap-3 ${
                stem.muted ? 'opacity-45' : 'opacity-100'
              } ${isDark ? 'border-white/10 bg-zinc-950/60' : 'border-white/80 bg-white/75'}`}
            >
              <div className="w-28 shrink-0 flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  {stem.type === 'keys' && <Piano className={`w-3.5 h-3.5 shrink-0 ${accentText}`} />}
                  {stem.type === 'drums' && <Drum className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-amber-500' : 'text-violet-600'}`} />}
                  {stem.type === 'guitar' && <Guitar className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-orange-600' : 'text-sky-600'}`} />}
                  {stem.type === 'vocal' && <Mic2 className="w-3.5 h-3.5 shrink-0 text-rose-500" />}
                  <span className={`text-[11px] font-semibold truncate ${isDark ? 'text-zinc-200' : 'text-slate-900'}`}>
                    {stem.name}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleToggleMute(stem.id)}
                    className={`px-1 rounded text-[9px] font-bold cursor-pointer ${
                      stem.muted ? 'bg-red-500 text-white' : isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    M
                  </button>
                  <button
                    onClick={() => handleToggleSolo(stem.id)}
                    className={`px-1 rounded text-[9px] font-bold cursor-pointer ${
                      stem.solo
                        ? isDark ? 'bg-amber-400 text-zinc-950' : 'bg-indigo-600 text-white'
                        : isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    S
                  </button>
                </div>
              </div>

              <div
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  setPlayhead(((e.clientX - rect.left) / rect.width) * 100)
                }}
                className={`flex-1 h-7 rounded-xl px-2 flex items-center justify-between gap-1 relative overflow-hidden cursor-pointer ${
                  isDark ? 'bg-black/50' : 'bg-slate-900/5'
                }`}
              >
                {stem.bars.map((val, idx) => (
                  <span
                    key={idx}
                    style={{ height: `${val}%` }}
                    className={`w-1 rounded-full bg-gradient-to-t ${
                      isDark ? 'from-orange-500 to-amber-300' : 'from-violet-500 via-indigo-500 to-sky-400'
                    }`}
                  />
                ))}
                <div
                  style={{ left: `${playhead}%` }}
                  className="absolute top-0 bottom-0 w-[2px] bg-red-500 pointer-events-none"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  )
}