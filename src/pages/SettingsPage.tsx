import { useState } from 'react'
import { MainLayout } from '@/components/layout/MainLayout'
import { AppRoute } from '@/components/layout/Sidebar'

interface PageProps {
  isDark: boolean
  onToggleTheme: () => void
  onNavigate: (page: AppRoute) => void
}

export function SettingsPage({ isDark, onToggleTheme, onNavigate }: PageProps) {
  const [sampleRate, setSampleRate] = useState('48000 Hz')
  const [bufferSize, setBufferSize] = useState('256 samples')
  const [exportFormat, setExportFormat] = useState('24-bit WAV (Lossless)')
  const cardClass = isDark ? 'border-white/10 bg-black/45' : 'border-white/75 bg-white/60 shadow-sm'

  return (
    <MainLayout activePage="settings" isDark={isDark} onToggleTheme={onToggleTheme} onNavigate={onNavigate} title="Settings" subtitle="Audio Engine & Workspace Preferences">
      <div className={`p-6 rounded-3xl border max-w-2xl space-y-5 ${cardClass}`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold">Appearance Theme</div>
            <div className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              Switch between Dark Neon and Pastel Iridescent Light mode
            </div>
          </div>
          <button
            onClick={onToggleTheme}
            className={`px-4 py-1.5 rounded-full font-semibold text-xs cursor-pointer ${
              isDark ? 'bg-orange-500 text-zinc-950' : 'bg-indigo-600 text-white'
            }`}
          >
            {isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="space-y-1">
            <label className="text-[11px] font-medium">Sample Rate</label>
            <select value={sampleRate} onChange={(e) => setSampleRate(e.target.value)} className={`w-full rounded-xl border p-2 text-xs ${isDark ? 'bg-zinc-900 border-white/10' : 'bg-white/80 border-white'}`}>
              <option>44100 Hz</option>
              <option>48000 Hz</option>
              <option>96000 Hz</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-medium">Buffer Size</label>
            <select value={bufferSize} onChange={(e) => setBufferSize(e.target.value)} className={`w-full rounded-xl border p-2 text-xs ${isDark ? 'bg-zinc-900 border-white/10' : 'bg-white/80 border-white'}`}>
              <option>128 samples</option>
              <option>256 samples</option>
              <option>512 samples</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-medium">Default Export</label>
            <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)} className={`w-full rounded-xl border p-2 text-xs ${isDark ? 'bg-zinc-900 border-white/10' : 'bg-white/80 border-white'}`}>
              <option>24-bit WAV (Lossless)</option>
              <option>FLAC</option>
              <option>320kbps MP3</option>
            </select>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}