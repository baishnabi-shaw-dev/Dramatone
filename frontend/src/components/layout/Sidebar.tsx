import { useState, useEffect, useRef } from 'react'
import {
  LayoutDashboard, Wand2,
  FolderKanban, Settings, Sun, Moon, PanelLeftClose, PanelLeftOpen,
  LogOut, User as UserIcon, Piano, Clapperboard
} from 'lucide-react'
import { apiClient } from '@/services/apiClient'

export type AppRoute =
  | 'home'
  | 'about'
  | 'features'
  | 'login'
  | 'signup'
  | 'dashboard'
  | 'scene'
  | 'daw'
  | 'generator'
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
  const [width, setWidth] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dramatone_sidebar_width')
      if (saved) {
        const val = Number(saved)
        if (!isNaN(val) && val >= 64) return val
      }
    }
    return 64
  })
  const [isDragging, setIsDragging] = useState(false)
  const isDraggingRef = useRef(false)
  const currentUser = apiClient.getCurrentUser()

  const isExpanded = width > 110

  const navItems: { id: AppRoute; icon: typeof LayoutDashboard; label: string }[] = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Studio Workspace' },
    { id: 'scene', icon: Clapperboard, label: 'Scene Intelligence' },
    { id: 'generator', icon: Wand2, label: 'Music Generator' },
    { id: 'daw', icon: Piano, label: 'FL Studio DAW' },
    { id: 'projects', icon: FolderKanban, label: 'Projects & Library' },
    { id: 'settings', icon: Settings, label: 'Settings' }
  ]

  // Persist sidebar width to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('dramatone_sidebar_width', String(width))
    } catch {
      // ignore
    }
  }, [width])

  // Toggle extend / collapse button
  const toggleExtend = () => {
    setWidth((prev) => {
      const next = prev > 110 ? 64 : 240
      localStorage.setItem('dramatone_sidebar_width', String(next))
      return next
    })
  }

  // Draggable horizontal resizer with snapping
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    isDraggingRef.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return
      const newWidth = Math.max(64, Math.min(320, e.clientX))
      setWidth(newWidth)
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (!isDraggingRef.current) return
      isDraggingRef.current = false
      setIsDragging(false)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''

      // Dynamic snap threshold: <120px snaps to 64px, >=120px snaps to 240px
      const finalWidth = e.clientX < 120 ? 64 : 240
      setWidth(finalWidth)
      localStorage.setItem('dramatone_sidebar_width', String(finalWidth))
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  const handleLogout = () => {
    apiClient.logout()
    onNavigate('login')
  }

  return (
    <aside
      style={{ width: `${width}px` }}
      className={`relative border-r flex flex-col justify-between py-4 shrink-0 backdrop-blur-xl transition-[width] ${
        isDragging ? 'duration-0' : 'duration-200'
      } ${isDark ? 'border-white/10 bg-black/45' : 'border-white/60 bg-white/50'}`}
    >
      {/* Top Header: Brand & Extend Button (NO backbutton) */}
      <div className="flex flex-col gap-3 px-3">
        <div className={`flex items-center ${isExpanded ? 'justify-between px-1' : 'justify-center'}`}>
          {isExpanded && (
            <div className="flex items-center gap-2 overflow-hidden">
              <span className={`w-2 h-2 rounded-full ${isDark ? 'bg-orange-500' : 'bg-indigo-600'}`} />
              <span className={`font-bold text-xs tracking-tight truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Dramatone <span className={isDark ? 'text-orange-500' : 'text-indigo-600'}>Studio</span>
              </span>
            </div>
          )}

          {/* Extend / Collapse Button */}
          <button
            onClick={toggleExtend}
            title={isExpanded ? 'Collapse Sidebar' : 'Extend Sidebar (Drag border to resize)'}
            className={`w-9 h-9 rounded-xl border flex items-center justify-center transition cursor-pointer shrink-0 ${
              isDark
                ? 'border-white/10 bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10'
                : 'border-white/70 bg-white/70 text-slate-700 hover:text-slate-950 hover:bg-white'
            }`}
          >
            {isExpanded ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>
        </div>

        <div className={`w-full h-[1px] ${isDark ? 'bg-white/10' : 'bg-slate-900/10'}`} />

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1.5 pt-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = activePage === item.id
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                title={item.label}
                className={`flex items-center rounded-2xl transition cursor-pointer ${
                  isExpanded ? 'px-3 py-2.5 gap-3 w-full justify-start' : 'w-10 h-10 justify-center mx-auto'
                } ${
                  active
                    ? isDark
                      ? 'bg-gradient-to-br from-orange-500 to-amber-500 text-zinc-950 font-semibold shadow-md shadow-orange-500/25'
                      : 'bg-gradient-to-br from-sky-500 via-indigo-500 to-violet-500 text-white font-semibold shadow-md shadow-indigo-500/20'
                    : isDark
                      ? 'text-zinc-400 hover:text-white hover:bg-white/5'
                      : 'text-slate-600 hover:text-slate-950 hover:bg-white/60'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {isExpanded && (
                  <span className="text-xs truncate tracking-wide whitespace-nowrap">
                    {item.label}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Footer Controls: User Account & Theme Toggle */}
      <div className="flex flex-col gap-2 px-3 pt-3 border-t border-white/10">
        {isExpanded && currentUser && (
          <div className={`p-2.5 rounded-2xl border flex items-center justify-between gap-2 ${
            isDark ? 'border-white/10 bg-white/5' : 'border-white bg-white/80'
          }`}>
            <div className="flex items-center gap-2 overflow-hidden min-w-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-indigo-500/15 text-indigo-700'
              }`}>
                <UserIcon className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className={`text-[11px] font-semibold truncate ${isDark ? 'text-zinc-200' : 'text-slate-900'}`}>
                  {currentUser.name}
                </div>
                <div className={`text-[9px] font-mono truncate ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>
                  {currentUser.email}
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Log Out"
              className={`p-1.5 rounded-lg border cursor-pointer transition shrink-0 ${
                isDark ? 'border-white/10 text-zinc-400 hover:text-red-400' : 'border-slate-200 text-slate-500 hover:text-red-600'
              }`}
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className={`flex items-center ${isExpanded ? 'justify-between px-1' : 'justify-center'}`}>
          {isExpanded && (
            <span className={`text-[11px] font-medium ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              {isDark ? 'Dark Neon' : 'Iridescent'}
            </span>
          )}

          <button
            onClick={onToggleTheme}
            title="Toggle Theme"
            className={`w-9 h-9 rounded-full border flex items-center justify-center transition cursor-pointer shrink-0 ${
              isDark
                ? 'border-white/15 bg-white/5 text-amber-300 hover:bg-white/10'
                : 'border-white/70 bg-white/75 text-indigo-600 hover:bg-white'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Draggable Resizer Edge on the right border */}
      <div
        onMouseDown={handleMouseDown}
        title="Drag to resize sidebar (snaps to collapsed/expanded)"
        className={`absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-orange-500/40 transition-colors z-30 ${
          isDragging ? 'bg-orange-500/60' : ''
        }`}
      />
    </aside>
  )
}
