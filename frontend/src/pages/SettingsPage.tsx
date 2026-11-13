import { useState, useEffect } from 'react'
import { User, LogOut, Sliders, Database, Cloud, Trash2, Film } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { AppRoute } from '@/components/layout/Sidebar'
import { apiClient } from '@/services/apiClient'
import { audioEngine } from '@/services/audioEngine'
import { videoAnalysisService } from '@/services/videoAnalysisService'

interface PageProps {
  isDark: boolean
  onToggleTheme: () => void
  onNavigate: (page: AppRoute) => void
}

export function SettingsPage({ isDark, onToggleTheme, onNavigate }: PageProps) {
  const currentUser = apiClient.getCurrentUser()
  const [ducking, setDucking] = useState(audioEngine.isDialogueDuckingEnabled())
  const [autoSyncTension, setAutoSyncTension] = useState(videoAnalysisService.isAutoSyncEnabled())
  const activeProfile = audioEngine.getActiveProfile()

  useEffect(() => {
    setDucking(audioEngine.isDialogueDuckingEnabled())
    setAutoSyncTension(videoAnalysisService.isAutoSyncEnabled())
  }, [])

  const handleToggleDucking = () => {
    const next = !ducking
    setDucking(next)
    audioEngine.setDialogueDuckingEnabled(next)
  }

  const handleToggleAutoSync = () => {
    const next = !autoSyncTension
    setAutoSyncTension(next)
    videoAnalysisService.setAutoSyncTension(next)
  }

  const handleLogout = () => {
    apiClient.logout()
    onNavigate('login')
  }

  const handleResetWorkspace = () => {
    if (confirm('Reset all local projects and session data? Your workspace will return to a clean blank slate.')) {
      apiClient.clearAllData()
      audioEngine.resetComposition()
      onNavigate('home')
    }
  }

  const cardClass = isDark ? 'border-white/10 bg-black/45' : 'border-white/75 bg-white/60 shadow-sm'
  const accentText = isDark ? 'text-orange-500' : 'text-indigo-600'

  return (
    <MainLayout activePage="settings" isDark={isDark} onToggleTheme={onToggleTheme} onNavigate={onNavigate} title="Settings" subtitle="Audio DSP Engine & Account Preferences">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 max-w-4xl">
        {/* User Account Card */}
        <div className={`lg:col-span-6 p-6 rounded-3xl border flex flex-col justify-between gap-5 ${cardClass}`}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold flex items-center gap-1.5">
                <User className={`w-4 h-4 ${accentText}`} />
                Studio Account
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 ${
                currentUser?.token.startsWith('local-token')
                  ? 'bg-zinc-800 text-zinc-400 border border-white/10'
                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              }`}>
                {currentUser?.token.startsWith('local-token') ? <Database className="w-2.5 h-2.5" /> : <Cloud className="w-2.5 h-2.5" />}
                {currentUser?.token.startsWith('local-token') ? 'Offline LocalStorage' : 'MongoDB Atlas Connected'}
              </span>
            </div>

            <div className={`p-4 rounded-2xl border space-y-1.5 ${isDark ? 'border-white/10 bg-zinc-950/60' : 'border-white bg-white/80'}`}>
              <div className="text-sm font-semibold">{currentUser?.name || 'Guest Creator'}</div>
              <div className="text-xs font-mono opacity-60">{currentUser?.email || 'Not authenticated'}</div>
              <div className="text-[10px] font-mono opacity-40 pt-1">User ID: {currentUser?.id || 'ANONYMOUS'}</div>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleLogout}
              className={`w-full py-2.5 rounded-2xl border font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition ${
                isDark ? 'border-white/10 bg-white/5 text-zinc-300 hover:text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out of Studio</span>
            </button>
            <button
              onClick={handleResetWorkspace}
              className={`w-full py-2 rounded-2xl border font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition ${
                isDark ? 'border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Local Workspace (Blank Slate)</span>
            </button>
          </div>
        </div>

        {/* Audio Engine Hardware & DSP Diagnostics */}
        <div className={`lg:col-span-6 p-6 rounded-3xl border flex flex-col justify-between gap-5 ${cardClass}`}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold flex items-center gap-1.5">
                <Sliders className={`w-4 h-4 ${accentText}`} />
                Engine & Playback Preferences
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                audioEngine.hasComposition()
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-zinc-800 text-zinc-400 border border-white/10'
              }`}>
                {audioEngine.hasComposition() ? `Cued: ${activeProfile.genre}` : 'Silent (No Track Cued)'}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {/* Dialogue Auto-Ducking */}
              <div className="flex justify-between items-center py-1 border-b border-white/10">
                <div>
                  <div className="font-medium">Dialogue Auto-Ducking (-8dB)</div>
                  <div className="text-[10px] opacity-60">Lowers score volume when scene audio is present</div>
                </div>
                <button
                  onClick={handleToggleDucking}
                  className={`px-3 py-1 rounded-full text-[10px] font-semibold cursor-pointer transition ${
                    ducking
                      ? isDark ? 'bg-amber-500 text-zinc-950' : 'bg-indigo-600 text-white'
                      : isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {ducking ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>

              {/* Video Motion Auto-Sync */}
              <div className="flex justify-between items-center py-1">
                <div>
                  <div className="font-medium flex items-center gap-1">
                    <Film className="w-3 h-3 opacity-70" />
                    Video Motion Auto-Tension
                  </div>
                  <div className="text-[10px] opacity-60">Modulates audio tension from camera movement</div>
                </div>
                <button
                  onClick={handleToggleAutoSync}
                  className={`px-3 py-1 rounded-full text-[10px] font-semibold cursor-pointer transition ${
                    autoSyncTension
                      ? isDark ? 'bg-amber-500 text-zinc-950' : 'bg-indigo-600 text-white'
                      : isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {autoSyncTension ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <div>
              <div className="text-xs font-semibold">Appearance Theme</div>
              <div className="text-[10px] opacity-60">Toggle between Dark Neon and Iridescent Light</div>
            </div>
            <button
              onClick={onToggleTheme}
              className={`px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition ${
                isDark ? 'border-white/15 bg-white/5 text-amber-300' : 'border-slate-300 bg-white text-indigo-600'
              }`}
            >
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
