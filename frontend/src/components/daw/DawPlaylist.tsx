import React from 'react'
import { FlPattern, FlPlaylistItem } from '@/services/flEngine'
import { Radio, Plus } from 'lucide-react'

interface DawPlaylistProps {
  isDark: boolean
  patterns: FlPattern[]
  activePatternId: string
  playlist: FlPlaylistItem[]
  currentBar: number
  currentBeat: number
  currentStep: number
  totalBars?: number
  onSelectPattern: (patternId: string) => void
  onAddPattern: () => void
  onTogglePlaylistItem: (trackIndex: number, startBar: number, patternId: string) => void
  onClearPlaylist: () => void
}

const TRACK_NAMES = ['Track 1 (Drums)', 'Track 2 (Bass)', 'Track 3 (Lead)', 'Track 4 (Texture)', 'Track 5 (FX)']

export const DawPlaylist: React.FC<DawPlaylistProps> = ({
  isDark,
  patterns,
  activePatternId,
  playlist,
  currentBar,
  totalBars = 16,
  onSelectPattern,
  onAddPattern,
  onTogglePlaylistItem,
  onClearPlaylist
}) => {
  const activePattern = patterns.find((p) => p.id === activePatternId) || patterns[0]

  return (
    <div
      className={`rounded-2xl border flex flex-col overflow-hidden select-none shadow-md ${
        isDark ? 'border-zinc-800 bg-[#161820]' : 'border-slate-200 bg-white'
      }`}
    >
      {/* Playlist Top Toolbar */}
      <div
        className={`px-3 py-2 border-b flex items-center justify-between text-xs font-bold ${
          isDark ? 'border-zinc-800 bg-[#1b1e28] text-zinc-300' : 'border-slate-200 bg-slate-50 text-slate-700'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-extrabold flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5" />
            Playlist Arrangement (Song Mode)
          </span>

          {/* Paint Pattern Selector */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-mono text-zinc-400">Brush:</span>
            {patterns.map((pat) => (
              <button
                key={pat.id}
                onClick={() => onSelectPattern(pat.id)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-mono transition cursor-pointer ${
                  pat.id === activePatternId
                    ? 'bg-emerald-500 text-zinc-950 font-bold shadow-sm'
                    : isDark
                    ? 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {pat.name}
              </button>
            ))}
            <button
              onClick={onAddPattern}
              title="Add New Pattern"
              className={`p-1 rounded-lg border text-zinc-400 hover:text-white cursor-pointer ${
                isDark ? 'border-zinc-700 bg-zinc-800' : 'border-slate-300 bg-slate-100'
              }`}
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-zinc-400 hidden sm:inline">
            Click grid to paint / click block to remove
          </span>
          <button
            onClick={onClearPlaylist}
            className={`px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer transition ${
              isDark ? 'bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400' : 'bg-slate-200 hover:bg-red-50 text-slate-600 hover:text-red-600'
            }`}
          >
            Clear Playlist
          </button>
        </div>
      </div>

      {/* Playlist Grid Container */}
      <div className="flex-1 overflow-x-auto p-2">
        <div className="min-w-[700px]">
          {/* Measure Bars Timeline Header */}
          <div className="flex items-center border-b pb-1 mb-1 border-zinc-800/80">
            <div className="w-36 shrink-0 text-[10px] font-mono font-bold text-zinc-400">
              TIMELINE TRACKS
            </div>
            <div
              className="flex-1 grid gap-1"
              style={{ gridTemplateColumns: `repeat(${totalBars}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: totalBars }).map((_, barIdx) => {
                const isCurrent = currentBar === barIdx
                return (
                  <div
                    key={barIdx}
                    className={`text-center py-0.5 rounded text-[10px] font-mono font-bold ${
                      isCurrent
                        ? 'bg-amber-400 text-zinc-950 shadow-sm'
                        : isDark
                        ? 'text-zinc-400 hover:text-zinc-200'
                        : 'text-slate-500'
                    }`}
                  >
                    Bar {barIdx + 1}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Tracks 1 through 5 */}
          <div className="space-y-1.5">
            {TRACK_NAMES.map((trackName, trackIdx) => {
              return (
                <div key={trackIdx} className="flex items-center gap-2">
                  {/* Track Label */}
                  <div
                    className={`w-36 shrink-0 px-2 py-2 rounded-xl border text-[11px] font-semibold truncate ${
                      isDark
                        ? 'border-zinc-800 bg-zinc-900/80 text-zinc-300'
                        : 'border-slate-200 bg-slate-100 text-slate-700'
                    }`}
                  >
                    {trackName}
                  </div>

                  {/* Bar Grid Blocks */}
                  <div
                    className="flex-1 grid gap-1 relative"
                    style={{ gridTemplateColumns: `repeat(${totalBars}, minmax(0, 1fr))` }}
                  >
                    {Array.from({ length: totalBars }).map((_, barIdx) => {
                      // Find if a playlist item exists on this track & bar
                      const item = playlist.find(
                        (p) => p.trackIndex === trackIdx && p.startBar === barIdx
                      )
                      const isCurrent = currentBar === barIdx
                      const pat = item ? patterns.find((p) => p.id === item.patternId) : null

                      return (
                        <div
                          key={barIdx}
                          onClick={() => onTogglePlaylistItem(trackIdx, barIdx, activePattern.id)}
                          title={
                            item
                              ? `${pat?.name || 'Pattern'} at Bar ${barIdx + 1} (Click to remove)`
                              : `Paint ${activePattern.name} at Bar ${barIdx + 1}`
                          }
                          className={`h-9 rounded-lg border flex items-center justify-center font-mono text-[9px] font-bold cursor-pointer transition relative overflow-hidden ${
                            item
                              ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-sm font-extrabold'
                              : isDark
                              ? 'border-zinc-800/80 bg-zinc-900/40 hover:bg-emerald-500/20 hover:border-emerald-500/40'
                              : 'border-slate-200 bg-slate-50 hover:bg-emerald-100'
                          }`}
                        >
                          {item ? (
                            <span className="truncate px-1 leading-tight">{pat?.name || 'Pat'}</span>
                          ) : (
                            <span className="opacity-0 hover:opacity-40 text-[8px]">+</span>
                          )}

                          {/* Song Mode Playhead Bar Scanning */}
                          {isCurrent && (
                            <div className="absolute inset-y-0 left-0 w-1 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
