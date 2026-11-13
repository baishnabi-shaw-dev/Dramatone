import { useState, useEffect } from 'react'
import { Play, Pause, Volume2, Sun, Moon, Shuffle, SkipBack, SkipForward, MoreHorizontal, Disc, Activity, User, LogOut } from 'lucide-react'
import { LoginPage } from '@/pages/LoginPage'
import { SignUpPage } from '@/pages/SignUpPage'
import { AboutPage } from '@/pages/AboutPage'
import { FeaturesPage } from '@/pages/FeaturesPage'
import { AppRoute } from '@/components/layout/Sidebar'
import { DashboardPage } from '@/pages/DashboardPage'
import { DawPage } from '@/pages/DawPage'
import { MusicGeneratorPage } from '@/pages/MusicGeneratorPage'
import { AdaptiveSoundscapePage } from '@/pages/AdaptiveSoundscapePage'
import { AudioAnalysisPage } from '@/pages/AudioAnalysisPage'
import { MusicLibraryPage } from '@/pages/MusicLibraryPage'
import { ProjectsPage } from '@/pages/ProjectsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { apiClient } from '@/services/apiClient'

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [wavePhase, setWavePhase] = useState(0)
  const [brightness, setBrightness] = useState(72) // Stereo Width / Spatial spread
  const [volume, setVolume] = useState(65)
  const [isMuted, setIsMuted] = useState(false)
  const [currentPage, setCurrentPage] = useState<AppRoute>('home')
  const [isDark, setIsDark] = useState(true)

  // Smooth wave propagation when playing
  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      setWavePhase((prev) => prev + 0.25)
    }, 50)
    return () => clearInterval(interval)
  }, [isPlaying])

  const spectrogramBars = [
    18, 25, 32, 28, 45, 60, 48, 70, 85, 62, 95, 100,
    88, 72, 65, 80, 52, 40, 35, 48, 30, 22, 16, 12
  ]

  const topWaveBars = [
    20, 35, 50, 75, 40, 60, 80, 95, 70, 55, 85, 90,
    60, 45, 70, 85, 60, 40, 25, 15, 30, 45, 20, 10
  ]

  const [currentUser, setCurrentUser] = useState(() => apiClient.getCurrentUser())
  const protectedRoutes: AppRoute[] = [
    'dashboard', 'daw', 'generator', 'soundscape', 'analysis', 'library', 'projects', 'settings'
  ]

  // Synchronize authenticated user state whenever page changes
  useEffect(() => {
    setCurrentUser(apiClient.getCurrentUser())
  }, [currentPage])

  const handleLogout = () => {
    apiClient.logout()
    setCurrentUser(null)
    setCurrentPage('home')
  }

  // Protected Route Guard: Redirect unauthenticated requests to Login
  if (protectedRoutes.includes(currentPage) && !currentUser) {
    return (
      <LoginPage
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        onBack={() => setCurrentPage('home')}
        onNavigateToSignUp={() => setCurrentPage('signup')}
        onSuccess={() => {
          setCurrentUser(apiClient.getCurrentUser())
          setCurrentPage(currentPage)
        }}
      />
    )
  }

  if (currentPage === 'dashboard') return <DashboardPage isDark={isDark} onToggleTheme={() => setIsDark(!isDark)} onNavigate={setCurrentPage} />
  if (currentPage === 'daw') return <DawPage isDark={isDark} onToggleTheme={() => setIsDark(!isDark)} onNavigate={setCurrentPage} />
  if (currentPage === 'generator') return <MusicGeneratorPage isDark={isDark} onToggleTheme={() => setIsDark(!isDark)} onNavigate={setCurrentPage} />
  if (currentPage === 'soundscape') return <AdaptiveSoundscapePage isDark={isDark} onToggleTheme={() => setIsDark(!isDark)} onNavigate={setCurrentPage} />
  if (currentPage === 'analysis') return <AudioAnalysisPage isDark={isDark} onToggleTheme={() => setIsDark(!isDark)} onNavigate={setCurrentPage} />
  if (currentPage === 'library') return <MusicLibraryPage isDark={isDark} onToggleTheme={() => setIsDark(!isDark)} onNavigate={setCurrentPage} />
  if (currentPage === 'projects') return <ProjectsPage isDark={isDark} onToggleTheme={() => setIsDark(!isDark)} onNavigate={setCurrentPage} />
  if (currentPage === 'settings') return <SettingsPage isDark={isDark} onToggleTheme={() => setIsDark(!isDark)} onNavigate={setCurrentPage} />

  if (currentPage === 'login') {
    return (
      <LoginPage
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        onBack={() => setCurrentPage('home')}
        onNavigateToSignUp={() => setCurrentPage('signup')}
        onSuccess={() => {
          setCurrentUser(apiClient.getCurrentUser())
          setCurrentPage('dashboard')
        }}
      />
    )
  }

  if (currentPage === 'signup') {
    return (
      <SignUpPage
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        onBack={() => setCurrentPage('home')}
        onNavigateToLogin={() => setCurrentPage('login')}
        onSuccess={() => {
          setCurrentUser(apiClient.getCurrentUser())
          setCurrentPage('dashboard')
        }}
      />
    )
  }

  if (currentPage === 'about') {
    return (
      <AboutPage
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        onNavigate={(page) => setCurrentPage(page)}
      />
    )
  }

  if (currentPage === 'features') {
    return (
      <FeaturesPage
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        onNavigate={(page) => setCurrentPage(page)}
      />
    )
  }

  return (
    <main className={`relative min-h-screen flex items-center justify-center p-4 md:p-8 overflow-hidden select-none font-sans transition-colors duration-300 ${
      isDark
        ? 'bg-[#0d0c11] text-zinc-100'
        : 'bg-gradient-to-br from-[#e7c6d9] via-[#dfd6eb] to-[#cbe0e4] text-slate-800'
    }`}>

      {/* Ambient Glows */}
      <div className={`absolute top-1/4 left-1/3 -translate-x-1/2 w-[520px] h-[520px] rounded-full blur-[160px] pointer-events-none transition-colors duration-300 ${
        isDark ? 'bg-fuchsia-600/25' : 'bg-rose-400/35'
      }`} />
      <div className={`absolute top-1/3 right-1/4 w-[460px] h-[460px] rounded-full blur-[150px] pointer-events-none transition-colors duration-300 ${
        isDark ? 'bg-purple-700/20' : 'bg-violet-400/30'
      }`} />
      <div className={`absolute bottom-10 right-1/3 w-[500px] h-[450px] rounded-full blur-[170px] pointer-events-none transition-colors duration-300 ${
        isDark ? 'bg-orange-600/15' : 'bg-sky-300/45'
      }`} />

      {/* Floating 3D Music Glass Rings */}
      <div className={`absolute -left-12 bottom-12 w-80 h-80 rounded-full border-[10px] pointer-events-none flex items-center justify-center -rotate-12 animate-float-slow ${
        isDark ? 'border-purple-500/20 shadow-[0_0_50px_rgba(168,85,247,0.2)]' : 'border-white/40 shadow-[0_0_50px_rgba(99,102,241,0.18)]'
      }`}>
        <div className={`w-64 h-64 rounded-full border-[8px] ${isDark ? 'border-fuchsia-400/20' : 'border-rose-300/35'}`} />
      </div>

      {/* Floating 3D Glowing Music Notes */}
      <div className={`absolute -bottom-6 right-6 md:right-16 pointer-events-none z-20 animate-float-reverse ${
        isDark ? 'text-orange-500/80 drop-shadow-[0_15px_30px_rgba(249,115,22,0.6)]' : 'text-indigo-500/75 drop-shadow-[0_15px_30px_rgba(99,102,241,0.35)]'
      }`}>
        <svg width="190" height="190" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="8" cy="18" r="4" fill="currentColor" fillOpacity="0.8" />
          <path d="M12 18V2l7 4" strokeWidth="2" />
          <circle cx="19" cy="6" r="2" fill="currentColor" />
        </svg>
      </div>

      <div className={`absolute top-4 right-12 pointer-events-none z-0 animate-float-slow ${
        isDark ? 'text-pink-500/70 drop-shadow-[0_10px_25px_rgba(236,72,153,0.5)]' : 'text-rose-400/75 drop-shadow-[0_10px_25px_rgba(244,114,182,0.35)]'
      }`}>
        <svg width="150" height="150" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
          <circle cx="9" cy="18" r="3.5" fill="currentColor" fillOpacity="0.8" />
          <circle cx="18" cy="16" r="3.5" fill="currentColor" fillOpacity="0.8" />
          <path d="M12.5 18V5l9-2v13" strokeWidth="2" />
        </svg>
      </div>

      <div className={`absolute top-10 left-6 pointer-events-none z-0 animate-float-reverse ${
        isDark ? 'text-purple-400/60 drop-shadow-[0_10px_30px_rgba(192,132,252,0.4)]' : 'text-sky-500/70 drop-shadow-[0_10px_30px_rgba(56,189,248,0.35)]'
      }`}>
        <svg width="130" height="130" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" fill="currentColor" fillOpacity="0.7" />
          <circle cx="18" cy="16" r="3" fill="currentColor" fillOpacity="0.7" />
        </svg>
      </div>

      {/* Glassmorphism Card */}
      <section className={`relative z-10 w-full max-w-[1080px] rounded-[36px] border backdrop-blur-2xl p-7 md:p-12 flex flex-col justify-between min-h-[640px] transition-all duration-300 ${
        isDark
          ? 'border-white/15 bg-white/[0.04] shadow-[0_30px_80px_rgba(0,0,0,0.85)]'
          : 'border-white/70 bg-white/45 shadow-[0_24px_70px_rgba(100,116,139,0.18)]'
      }`}>

        {/* Top Navbar */}
        <header className={`flex items-center justify-between border-b pb-6 transition-colors ${
          isDark ? 'border-white/[0.06]' : 'border-white/60'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`flex items-center gap-1 ${isDark ? 'text-orange-400' : 'text-indigo-600'}`}>
              <span className="w-1 h-3.5 bg-current rounded-full" />
              <span className="w-1 h-5 bg-current rounded-full" />
              <span className="w-1 h-3 bg-current rounded-full" />
            </div>
            <span className={`font-bold text-lg tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Dramatone <span className={isDark ? 'text-orange-500' : 'text-indigo-600'}>Studio</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-9 text-xs font-medium tracking-wide">
            <button
              onClick={() => setCurrentPage('home')}
              className={`transition-colors cursor-pointer border-b pb-0.5 font-semibold ${
                isDark ? 'text-white border-white' : 'text-slate-900 border-indigo-600'
              }`}>
              Home
            </button>
            <button
              onClick={() => setCurrentPage('about')}
              className={`transition-colors cursor-pointer ${
                isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-600 hover:text-slate-950'
              }`}>
              About
            </button>
            <button
              onClick={() => setCurrentPage('features')}
              className={`transition-colors cursor-pointer ${
                isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-600 hover:text-slate-950'
              }`}>
              Features
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDark(!isDark)}
              title="Toggle Theme"
              className={`p-2 rounded-full border transition cursor-pointer ${
                isDark
                  ? 'border-white/15 bg-white/5 text-amber-300 hover:bg-white/10'
                  : 'border-white/80 bg-white/75 text-indigo-600 hover:bg-white'
              }`}
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage('dashboard')}
                  className={`text-xs font-semibold px-4 py-2 rounded-full bg-gradient-to-r hover:brightness-110 transition cursor-pointer flex items-center gap-1.5 ${
                    isDark ? 'from-orange-500 to-amber-500 text-zinc-950' : 'from-sky-500 to-indigo-600 text-white'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>{currentUser.name.split(' ')[0]}'s Studio</span>
                </button>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className={`p-2 rounded-full border transition cursor-pointer ${
                    isDark ? 'border-white/15 text-zinc-400 hover:text-white' : 'border-slate-300 text-slate-600'
                  }`}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setCurrentPage('login')}
                  className={`text-xs font-medium transition cursor-pointer ${
                    isDark ? 'text-zinc-300 hover:text-white' : 'text-slate-700 hover:text-slate-950'
                  }`}
                >
                  Log In
                </button>
                <button
                  onClick={() => setCurrentPage('signup')}
                  className={`text-xs font-medium px-4 py-2 rounded-full border transition cursor-pointer ${
                    isDark
                      ? 'border-orange-500/45 text-orange-300 hover:bg-orange-500/10'
                      : 'border-white/80 text-indigo-700 bg-white/65 hover:bg-white'
                  }`}
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </header>

        {/* Card Main Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-auto py-6 items-center">

          {/* Left Hero Column */}
          <div className="lg:col-span-5 space-y-6">
            <h1 className={`text-4xl md:text-5xl font-bold tracking-tight leading-[1.15] ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              Dramatone <br /> Studio
            </h1>

            <p className={`text-xs leading-relaxed max-w-sm ${
              isDark ? 'text-zinc-400' : 'text-slate-700'
            }`}>
              Generate dynamic compositions, shape acoustic stems, and orchestrate Dramatone frequencies with real-time audio diffusion intelligence.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setCurrentPage(currentUser ? 'dashboard' : 'login')}
                className={`px-6 py-2.5 rounded-full bg-gradient-to-r hover:brightness-110 font-semibold text-xs tracking-wide transition cursor-pointer ${
                  isDark
                    ? 'from-orange-500 to-amber-500 text-zinc-950 shadow-[0_4px_20px_rgba(249,115,22,0.35)]'
                    : 'from-sky-500 via-indigo-500 to-violet-500 text-white shadow-[0_4px_20px_rgba(99,102,241,0.3)]'
                }`}
              >
                {currentUser ? 'Enter Studio Workspace' : 'Launch Studio (Login)'}
              </button>

              <button
                onClick={() => setCurrentPage(currentUser ? 'dashboard' : 'signup')}
                className={`px-6 py-2.5 rounded-full border font-medium text-xs transition cursor-pointer ${
                  isDark
                    ? 'border-orange-500/45 text-orange-300 hover:bg-orange-500/10'
                    : 'border-white/80 text-slate-800 bg-white/60 hover:bg-white'
                }`}>
                {currentUser ? 'My Projects' : 'Get Started'}
              </button>
            </div>
          </div>

          {/* Right Dashboard Preview Column */}
          <div className="lg:col-span-7 flex flex-col gap-4">

            {/* 1. Mini Top Audio Player Bar */}
            <div className={`px-4 py-2.5 rounded-2xl border backdrop-blur-md flex items-center justify-between gap-4 transition-colors ${
              isDark ? 'border-white/10 bg-black/40' : 'border-white/75 bg-white/60 shadow-sm'
            }`}>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                title={isPlaying ? 'Pause Wave' : 'Play Wave'}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition cursor-pointer shrink-0 shadow-md ${
                  isDark
                    ? 'bg-orange-500 hover:bg-orange-600 text-zinc-950 shadow-orange-500/20'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
                }`}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current ml-0.5" />}
              </button>

              <div className="flex-1 h-6 flex items-center gap-1 overflow-hidden px-1">
                {topWaveBars.map((height, idx) => {
                  const waveScale = isPlaying ? 0.72 + 0.35 * Math.sin(wavePhase * 1.4 + idx * 0.5) : 1
                  const gainFactor = isMuted ? 0.15 : Math.max(0.2, volume / 100)
                  return (
                    <span
                      key={idx}
                      style={{ height: `${Math.max(12, Math.min(100, height * waveScale * gainFactor))}%` }}
                      className={`w-1 rounded-full transition-all duration-75 ${
                        isDark ? 'bg-amber-200/70' : 'bg-indigo-500/75'
                      }`}
                    />
                  )
                })}
              </div>

              <div className={`flex items-center gap-3 shrink-0 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                <Volume2
                  onClick={() => setIsMuted(!isMuted)}
                  className={`w-3.5 h-3.5 transition cursor-pointer ${
                    isMuted ? 'text-red-500' : isDark ? 'hover:text-white' : 'hover:text-slate-950'
                  }`}
                />
                <Shuffle className={`w-3.5 h-3.5 transition cursor-pointer ${isDark ? 'hover:text-white' : 'hover:text-slate-950'}`} />
              </div>
            </div>

            {/* 2. Central Wireframe Spectrogram with Wave Motion scaled by Output Gain */}
            <div className={`p-5 rounded-3xl border backdrop-blur-md relative overflow-hidden flex flex-col justify-end h-56 transition-colors ${
              isDark ? 'border-white/10 bg-black/35' : 'border-white/75 bg-white/60 shadow-sm'
            }`}>
              <div className="w-full flex items-end justify-between gap-1.5 h-44 px-4 z-10">
                {spectrogramBars.map((bar, index) => {
                  const currentGain = isMuted ? 0.08 : Math.max(0.1, volume / 100)
                  const waveFactor = isPlaying
                    ? 0.72 + 0.34 * Math.sin(wavePhase + index * 0.45)
                    : 1
                  const animatedHeight = Math.max(6, Math.min(100, bar * waveFactor * currentGain))

                  return (
                    <div
                      key={index}
                      style={{ height: `${animatedHeight}%` }}
                      className={`w-full rounded-full transition-all duration-75 ${
                        index > 5 && index < 18
                          ? isDark
                            ? 'bg-gradient-to-t from-orange-500 via-amber-300 to-yellow-100 shadow-[0_0_15px_rgba(251,191,36,0.6)]'
                            : 'bg-gradient-to-t from-violet-500 via-indigo-400 to-sky-300 shadow-[0_0_15px_rgba(99,102,241,0.35)]'
                          : isDark
                            ? 'bg-orange-500/30'
                            : 'bg-indigo-400/35'
                      }`}
                    />
                  )
                })}
              </div>
            </div>

            {/* 3. Bottom Row: Audio Track Controls & Sidebar Player */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

              {/* Left Widget: Functional Audio Track Controls (7 cols) */}
              <div className={`md:col-span-7 p-4 rounded-3xl border backdrop-blur-md space-y-4 transition-colors ${
                isDark ? 'border-white/10 bg-black/40' : 'border-white/75 bg-white/60 shadow-sm'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>
                      Stem Master Rack
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                      isMuted
                        ? 'bg-red-500/20 text-red-500'
                        : isDark
                          ? 'bg-zinc-800 text-zinc-400'
                          : 'bg-indigo-500/10 text-indigo-800'
                    }`}>
                      {isMuted ? 'MUTED' : `${volume}% GAIN`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                      {brightness > 80 ? 'Wide' : brightness < 20 ? 'Mono' : 'Stereo'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsMuted(!isMuted)}
                      title="Toggle Master Stem Bypass"
                      className={`w-7 h-4 rounded-full transition-colors cursor-pointer relative ${
                        !isMuted
                          ? isDark ? 'bg-orange-500' : 'bg-indigo-600'
                          : 'bg-zinc-700'
                      }`}
                    >
                      <span className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all ${
                        !isMuted ? 'right-0.5' : 'left-0.5'
                      }`} />
                    </button>
                  </div>
                </div>

                {/* Dynamic Stereo Width Waveform Strip */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setBrightness(0)}
                    title="Collapse to Mono"
                    className={`w-8 h-8 rounded-full border flex items-center justify-center shadow-inner cursor-pointer transition ${
                      brightness === 0
                        ? isDark ? 'border-orange-500 bg-orange-500/20' : 'border-indigo-600 bg-indigo-500/20'
                        : isDark ? 'border-white/20 bg-zinc-900' : 'border-white/80 bg-white/80'
                    }`}
                  >
                    <Disc className={`w-4 h-4 ${isDark ? 'text-orange-400' : 'text-indigo-600'}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setBrightness(100)}
                    title="Expand to Full Stereo"
                    className={`w-8 h-8 rounded-full border flex items-center justify-center shadow-inner cursor-pointer transition ${
                      brightness === 100
                        ? isDark ? 'border-orange-500 bg-orange-500/20' : 'border-indigo-600 bg-indigo-500/20'
                        : isDark ? 'border-white/20 bg-zinc-900' : 'border-white/80 bg-white/80'
                    }`}
                  >
                    <Disc className={`w-4 h-4 ${isDark ? 'text-orange-400' : 'text-indigo-600'}`} />
                  </button>

                  <div className={`flex-1 h-7 border rounded-xl px-2 flex items-center justify-center transition-all ${
                    isDark ? 'bg-zinc-950/70 border-white/5' : 'bg-white/70 border-white/80'
                  }`}>
                    <div
                      style={{ width: `${Math.max(15, brightness)}%` }}
                      className={`h-2.5 bg-gradient-to-r rounded-full transition-all duration-150 ${
                        isMuted
                          ? 'bg-zinc-600 opacity-40'
                          : isDark
                            ? 'from-orange-500 via-amber-300 to-purple-500 opacity-90'
                            : 'from-rose-400 via-violet-500 to-sky-400 opacity-90'
                      }`}
                    />
                  </div>
                </div>

                {/* Active Control Sliders */}
                <div className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className={`flex items-center gap-1.5 ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                        <Activity className="w-3 h-3" />
                        Stereo Width (Spatial Spread)
                      </span>
                      <span className="font-mono font-medium">{brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={brightness}
                      onChange={(e) => setBrightness(Number(e.target.value))}
                      className={`w-full h-1.5 rounded-lg cursor-pointer ${
                        isDark ? 'accent-orange-500 bg-zinc-800' : 'accent-indigo-600 bg-slate-300'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <button
                        type="button"
                        onClick={() => setIsMuted(!isMuted)}
                        className={`flex items-center gap-1.5 cursor-pointer hover:underline ${
                          isMuted ? 'text-red-500' : isDark ? 'text-zinc-400' : 'text-slate-600'
                        }`}
                      >
                        <Volume2 className="w-3 h-3" />
                        Output Gain (Wave Amplitude)
                      </button>
                      <span className="font-mono font-medium">
                        {isMuted ? '0%' : `${volume}%`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                        setVolume(Number(e.target.value))
                        if (isMuted) setIsMuted(false)
                      }}
                      className={`w-full h-1.5 rounded-lg cursor-pointer ${
                        isMuted
                          ? 'accent-red-500 bg-zinc-800'
                          : isDark
                            ? 'accent-orange-500 bg-zinc-800'
                            : 'accent-indigo-600 bg-slate-300'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Right Widget: Sidebar Player */}
              <div className={`md:col-span-5 p-4 rounded-3xl border backdrop-blur-md flex flex-col justify-between gap-3 transition-colors ${
                isDark ? 'border-white/10 bg-black/40' : 'border-white/75 bg-white/60 shadow-sm'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>Sidebar</span>
                  <MoreHorizontal className={`w-3.5 h-3.5 cursor-pointer ${isDark ? 'text-zinc-400' : 'text-slate-600'}`} />
                </div>

                <div className="space-y-1.5">
                  <div className={`p-2 rounded-xl border flex items-center gap-2 ${
                    isDark ? 'bg-zinc-800/60 border-white/5' : 'bg-indigo-500/10 border-indigo-500/20'
                  }`}>
                    <Activity className={`w-3 h-3 ${isDark ? 'text-amber-300' : 'text-indigo-600'}`} />
                    <span className={`text-[11px] ${isDark ? 'text-zinc-200' : 'text-slate-800'}`}>Mini track</span>
                  </div>
                  <div className={`px-2 py-1 flex items-center gap-2 text-[10px] ${
                    isDark ? 'text-zinc-500' : 'text-slate-600'
                  }`}>
                    <span>Mini track</span>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <div className={`flex items-center justify-between text-[10px] font-mono ${
                    isDark ? 'text-zinc-500' : 'text-slate-600'
                  }`}>
                    <span>0:05</span>
                    <span>-0:45</span>
                  </div>
                  <div className="flex items-center justify-center gap-4">
                    <button
                      type="button"
                      title="Reset Wave Phase"
                      onClick={() => setWavePhase(0)}
                      className="cursor-pointer flex items-center justify-center"
                    >
                      <SkipBack
                        className={`w-3.5 h-3.5 transition ${
                          isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-600 hover:text-slate-950'
                        }`}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPlaying(!isPlaying)}
                      title={isPlaying ? 'Pause Spectrogram' : 'Play Spectrogram'}
                      className={`w-7 h-7 rounded-full bg-gradient-to-r flex items-center justify-center transition cursor-pointer shadow-md ${
                        isDark
                          ? 'from-orange-500 to-amber-400 text-zinc-950 shadow-orange-500/20'
                          : 'from-sky-500 to-indigo-600 text-white shadow-indigo-500/20'
                      }`}
                    >
                      {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
                    </button>
                    <button
                      type="button"
                      title="Advance Wave Phase"
                      onClick={() => setWavePhase((prev) => prev + 1.5)}
                      className="cursor-pointer flex items-center justify-center"
                    >
                      <SkipForward
                        className={`w-3.5 h-3.5 transition ${
                          isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-600 hover:text-slate-950'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>
    </main>
  )
}