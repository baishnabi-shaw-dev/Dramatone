import React from 'react'
import {
  Play,
  Pause,
  Square,
  Sliders,
  Music,
  LayoutGrid,
  Radio,
  Download,
  Upload,
  RotateCcw,
  Volume2,
  Sparkles,
  Film,
  Save
} from 'lucide-react'
import { PlaybackMode } from '@/services/flEngine'

interface DawTransportProps {
  isDark: boolean
  isPlaying: boolean
  mode: PlaybackMode
  bpm: number
  masterVolume: number
  currentStep: number
  currentBar: number
  currentBeat: number
  activePanels: {
    rack: boolean
    pianoRoll: boolean
    playlist: boolean
    mixer: boolean
  }
  hasAiComposition?: boolean
  onSyncAiScore?: () => void
  onSyncToTimeline?: () => void
  onSaveProject?: () => void
  onTogglePlay: () => void
  onStop: () => void
  onToggleMode: () => void
  onChangeBpm: (bpm: number) => void
  onChangeMasterVolume: (vol: number) => void
  onTogglePanel: (panel: 'rack' | 'pianoRoll' | 'playlist' | 'mixer') => void
  onExportProject: () => void
  onImportProject: (e: React.ChangeEvent<HTMLInputElement>) => void
  onResetProject: () => void
}

export const DawTransport: React.FC<DawTransportProps> = ({
  isDark,
  isPlaying,
  mode,
  bpm,
  masterVolume,
  currentStep,
  currentBar,
  currentBeat,
  activePanels,
  hasAiComposition = false,
  onSyncAiScore,
  onSyncToTimeline,
  onSaveProject,
  onTogglePlay,
  onStop,
  onToggleMode,
  onChangeBpm,
  onChangeMasterVolume,
  onTogglePanel,
  onExportProject,
  onImportProject,
  onResetProject
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Format digital 7-segment LED counter: Bar : Beat : 16th step (e.g. 001:02:03)
  const displayBar = String(currentBar + 1).padStart(3, '0')
  const displayBeat = String(currentBeat + 1).padStart(2, '0')
  const displayStep = String((currentStep % 4) + 1).padStart(2, '0')

  return (
    <header
      className={`px-3 py-2 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 select-none ${
        isDark ? 'border-zinc-800 bg-[#16181f] text-zinc-200' : 'border-slate-200 bg-white text-slate-800 shadow-sm'
      }`}
    >
      {/* Left: Transport Controls & Digital LED Counter */}
      <div className="flex items-center gap-2">
        {/* Play / Pause Button */}
        <button
          onClick={onTogglePlay}
          title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          className={`px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition shadow-md ${
            isPlaying
              ? 'bg-amber-400 text-zinc-950 shadow-[0_0_12px_rgba(251,191,36,0.6)] animate-pulse'
              : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950'
          }`}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
          <span className="text-xs">{isPlaying ? 'PAUSE' : 'PLAY'}</span>
        </button>

        {/* Stop Button */}
        <button
          onClick={onStop}
          title="Stop & Rewind to Start"
          className={`p-2 rounded-xl border cursor-pointer transition ${
            isDark
              ? 'border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300'
              : 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <Square className="w-3.5 h-3.5 fill-current" />
        </button>

        {/* PAT / SONG Mode Switch (FL Studio Signature) */}
        <div
          className={`flex rounded-xl p-0.5 border text-[11px] font-bold ${
            isDark ? 'border-zinc-700 bg-zinc-900' : 'border-slate-300 bg-slate-100'
          }`}
        >
          <button
            onClick={mode === 'SONG' ? onToggleMode : undefined}
            title="Pattern Mode: Loops currently selected pattern (16 steps)"
            className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
              mode === 'PAT'
                ? 'bg-orange-500 text-zinc-950 shadow-sm font-extrabold'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            PAT
          </button>
          <button
            onClick={mode === 'PAT' ? onToggleMode : undefined}
            title="Song Mode: Arranges all Playlist tracks across full bars"
            className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
              mode === 'SONG'
                ? 'bg-amber-400 text-zinc-950 shadow-sm font-extrabold'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            SONG
          </button>
        </div>

        {/* FL Studio Digital Green/Amber Bar:Beat:Step Display */}
        <div
          className={`px-2.5 py-1 rounded-xl border font-mono text-xs flex items-center gap-1.5 font-bold tracking-widest ${
            isDark
              ? 'border-emerald-500/30 bg-black/60 text-emerald-400 shadow-[inset_0_1px_4px_rgba(0,0,0,0.8)]'
              : 'border-indigo-200 bg-slate-900 text-emerald-400'
          }`}
        >
          <Radio className={`w-3 h-3 ${isPlaying ? 'animate-pulse text-amber-400' : 'text-emerald-500'}`} />
          <span>{displayBar}</span>
          <span className="opacity-40">:</span>
          <span>{displayBeat}</span>
          <span className="opacity-40">:</span>
          <span className="text-amber-400">{displayStep}</span>
        </div>

        {/* BPM Selector */}
        <div
          className={`flex items-center gap-1 px-2 py-0.5 rounded-xl border text-xs font-mono ${
            isDark ? 'border-zinc-700 bg-zinc-900/90 text-zinc-200' : 'border-slate-300 bg-slate-100 text-slate-800'
          }`}
        >
          <span className="text-[10px] font-bold text-zinc-500 tracking-wider">BPM</span>
          <button
            onClick={() => onChangeBpm(bpm - 1)}
            className="px-1 text-zinc-400 hover:text-white cursor-pointer"
          >
            -
          </button>
          <input
            type="number"
            value={bpm}
            onChange={(e) => onChangeBpm(Number(e.target.value))}
            min={40}
            max={240}
            className="w-12 text-center bg-transparent font-bold text-orange-400 focus:outline-none"
          />
          <button
            onClick={() => onChangeBpm(bpm + 1)}
            className="px-1 text-zinc-400 hover:text-white cursor-pointer"
          >
            +
          </button>
        </div>
      </div>

      {/* Center: Master Volume */}
      <div className="flex items-center gap-2">
        <Volume2 className="w-4 h-4 text-zinc-400 shrink-0" />
        <div className="flex flex-col">
          <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400 leading-tight">
            <span>MASTER VOL</span>
            <span className="font-bold text-orange-400">{masterVolume}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={masterVolume}
            onChange={(e) => onChangeMasterVolume(Number(e.target.value))}
            className="w-24 sm:w-32 h-1.5 accent-orange-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Integration: AI Score Sync & Timeline Sync */}
      <div className="flex items-center gap-1.5">
        {onSyncAiScore && (
          <button
            onClick={onSyncAiScore}
            title={
              hasAiComposition
                ? 'Load Gemini AI Score (BPM, lead melody & chords) into DAW'
                : 'Sync Gemini AI composition into DAW'
            }
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold border flex items-center gap-1.5 cursor-pointer transition ${
              hasAiComposition
                ? 'border-orange-500/50 bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 shadow-sm animate-pulse'
                : isDark
                ? 'border-zinc-700 bg-zinc-800/60 text-zinc-400 hover:text-white'
                : 'border-slate-300 bg-slate-100 text-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <span className="hidden md:inline font-bold">Sync AI Score</span>
          </button>
        )}

        {onSyncToTimeline && (
          <button
            onClick={onSyncToTimeline}
            title="Export this DAW arrangement back into the Video Timeline in Studio Workspace"
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold border flex items-center gap-1.5 cursor-pointer transition ${
              isDark
                ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <Film className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="hidden md:inline font-bold">Sync to Video</span>
          </button>
        )}
      </div>

      {/* Right: Panel Toggles & Project Import/Export */}
      <div className="flex items-center gap-1.5">
        {/* Toggle Channel Rack */}
        <button
          onClick={() => onTogglePanel('rack')}
          title="Toggle Channel Rack (F6)"
          className={`px-2.5 py-1 rounded-xl text-xs font-semibold border flex items-center gap-1.5 cursor-pointer transition ${
            activePanels.rack
              ? 'border-orange-500 bg-orange-500/20 text-orange-300 shadow-sm'
              : isDark
              ? 'border-zinc-700 bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'
              : 'border-slate-300 bg-slate-100 text-slate-600'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Channel Rack</span>
        </button>

        {/* Toggle Piano Roll */}
        <button
          onClick={() => onTogglePanel('pianoRoll')}
          title="Toggle Piano Roll (F7)"
          className={`px-2.5 py-1 rounded-xl text-xs font-semibold border flex items-center gap-1.5 cursor-pointer transition ${
            activePanels.pianoRoll
              ? 'border-amber-400 bg-amber-400/20 text-amber-300 shadow-sm'
              : isDark
              ? 'border-zinc-700 bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'
              : 'border-slate-300 bg-slate-100 text-slate-600'
          }`}
        >
          <Music className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Piano Roll</span>
        </button>

        {/* Toggle Playlist */}
        <button
          onClick={() => onTogglePanel('playlist')}
          title="Toggle Playlist Arrangement (F5)"
          className={`px-2.5 py-1 rounded-xl text-xs font-semibold border flex items-center gap-1.5 cursor-pointer transition ${
            activePanels.playlist
              ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-sm'
              : isDark
              ? 'border-zinc-700 bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'
              : 'border-slate-300 bg-slate-100 text-slate-600'
          }`}
        >
          <Radio className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Playlist</span>
        </button>

        {/* Toggle Mixer */}
        <button
          onClick={() => onTogglePanel('mixer')}
          title="Toggle Mixer Console (F9)"
          className={`px-2.5 py-1 rounded-xl text-xs font-semibold border flex items-center gap-1.5 cursor-pointer transition ${
            activePanels.mixer
              ? 'border-sky-500 bg-sky-500/20 text-sky-300 shadow-sm'
              : isDark
              ? 'border-zinc-700 bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'
              : 'border-slate-300 bg-slate-100 text-slate-600'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Mixer</span>
        </button>

        {/* Divider */}
        <div className={`h-4 w-px ${isDark ? 'bg-zinc-800' : 'bg-slate-300'}`} />

        {/* Save to Projects & Library */}
        {onSaveProject && (
          <button
            onClick={onSaveProject}
            title="Save Project to Dramatone Projects & Library (Cloud + Local)"
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold border flex items-center gap-1.5 cursor-pointer transition ${
              isDark
                ? 'border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25'
                : 'border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden md:inline font-bold">Save Project</span>
          </button>
        )}

        {/* Project Export */}
        <button
          onClick={onExportProject}
          title="Export Project JSON File"
          className={`p-1.5 rounded-xl border cursor-pointer transition ${
            isDark
              ? 'border-zinc-700 bg-zinc-800/60 hover:bg-zinc-700 text-zinc-300'
              : 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
        </button>

        {/* Project Import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={onImportProject}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          title="Import Project JSON File"
          className={`p-1.5 rounded-xl border cursor-pointer transition ${
            isDark
              ? 'border-zinc-700 bg-zinc-800/60 hover:bg-zinc-700 text-zinc-300'
              : 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
        </button>

        {/* Reset Project */}
        <button
          onClick={onResetProject}
          title="Reset to Default Demo Project"
          className={`p-1.5 rounded-xl border cursor-pointer transition ${
            isDark
              ? 'border-zinc-700 bg-zinc-800/60 hover:bg-red-500/20 text-zinc-400 hover:text-red-400'
              : 'border-slate-300 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  )
}

