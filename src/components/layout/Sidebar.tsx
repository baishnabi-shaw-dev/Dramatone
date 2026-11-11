import {
  LayoutDashboard, Wand2, Sparkles, Activity, Library,
  FolderKanban, Settings, Sun, Moon, ArrowLeft
} from 'lucide-react'

export type AppRoute =
  | 'home'
  | 'about'
  | 'features'
  | 'login'
  | 'signup'
  | 'dashboard'
  | 'generator'
  | 'soundscape'
  | 'analysis'
  | 'library'
  | 'projects'
  | 'settings'

interface SidebarProps {
  activePage: AppRoute
  isDark: boolean
  onToggleTheme: () => void
  onNavigate: (page: AppRoute) => void
}

export function Sidebar({ activePage, isDark, onToggleTheme, onNavigate }: SidebarProps) {
  const navItems: { id: AppRoute; icon: typeof LayoutDashboard; label: string }[] = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Studio Workspace (1)' },
    { id: 'generator', icon: Wand2, label: 'Music Generator (2)' },
    { id: 'soundscape', icon: Sparkles, label: 'Adaptive Soundscape (3)' },
    { id: 'analysis', icon: Activity, label: 'Audio Analysis (4)' },
    { id: 'library', icon: Library, label: 'Music Library (5)' },
    { id: 'projects', icon: FolderKanban, label: 'Projects (6)' },
    { id: 'settings', icon: Settings, label: 'Settings (7)' }
  ]

  return (
    <aside className={`w-14 md:w-16 border-r flex flex-col items-center justify-between py-5 shrink-0 backdrop-blur-xl transition-colors ${
      isDark ? 'border-white/10 bg-black/45' : 'border-white/60 bg-white/50'
    }`}>
      <div className="flex flex-col items-center gap-3.5">
        <button
          onClick={() => onNavigate('home')}
          title="Back to Home"
          className={`w-9 h-9 rounded-xl border flex items-center justify-center transition cursor-pointer ${
            isDark
              ? 'border-white/10 bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10'
              : 'border-white/70 bg-white/70 text-slate-700 hover:text-slate-950 hover:bg-white'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className={`w-6 h-[1px] ${isDark ? 'bg-white/10' : 'bg-slate-900/10'}`} />

        <div className="flex flex-col items-center gap-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = activePage === item.id
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                title={item.label}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center transition cursor-pointer ${
                  active
                    ? isDark
                      ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-zinc-950 shadow-md shadow-orange-500/30'
                      : 'bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/25'
                    : isDark
                      ? 'text-zinc-400 hover:text-white hover:bg-white/5'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-white/60'
                }`}
              >
                <Icon className="w-4 h-4" />
              </button>
            )
          })}
        </div>
      </div>

      <button
        onClick={onToggleTheme}
        title="Toggle Theme"
        className={`w-9 h-9 rounded-full border flex items-center justify-center transition cursor-pointer ${
          isDark
            ? 'border-white/15 bg-white/5 text-amber-300 hover:bg-white/10'
            : 'border-white/70 bg-white/75 text-indigo-600 hover:bg-white'
        }`}
      >
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
    </aside>
  )
}