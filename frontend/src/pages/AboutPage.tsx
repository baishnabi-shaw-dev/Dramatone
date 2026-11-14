import { useState } from 'react'
import { Sun, Moon, Cpu, Layers, Radio, Sparkles, ArrowRight, User, LogOut } from 'lucide-react'
import { AppRoute } from '@/components/layout/Sidebar'
import { apiClient } from '@/services/apiClient'
import logo from '@/assets/icons/favicon.svg'

interface AboutPageProps {
  isDark: boolean
  onToggleTheme: () => void
  onNavigate: (page: AppRoute) => void
}

export function AboutPage({ isDark, onToggleTheme, onNavigate }: AboutPageProps) {
  const [currentUser, setCurrentUser] = useState(() => apiClient.getCurrentUser())
  const pillars = [
    {
      icon: Cpu,
      title: 'Diffusion Acoustics',
      description: 'Trained on high-resolution spectral representations to synthesize realistic acoustic textures and Dramatones in real time.'
    },
    {
      icon: Layers,
      title: 'Multi-Stem Architecture',
      description: 'Deconstruct and shape individual vocal, percussion, bass, and Dramatone layers with sample-accurate phase alignment.'
    },
    {
      icon: Radio,
      title: 'Zero-Latency Studio',
      description: 'Browser-native WebAudio acceleration lets you audition, modulate, and export lossless stems without external hardware.'
    }
  ]

  const accentText = isDark ? 'text-orange-500' : 'text-indigo-600'

  return (
    <main className={`relative min-h-screen flex items-center justify-center p-4 md:p-8 overflow-x-hidden overflow-y-auto select-none font-sans transition-colors duration-300 ${
      isDark
        ? 'bg-[#0d0c11] text-zinc-100'
        : 'bg-gradient-to-br from-[#e7c6d9] via-[#dfd6eb] to-[#cbe0e4] text-slate-800'
    }`}>
      <div className={`absolute top-1/4 left-1/3 -translate-x-1/2 w-[520px] h-[520px] rounded-full blur-[160px] pointer-events-none ${
        isDark ? 'bg-fuchsia-600/25' : 'bg-rose-400/35'
      }`} />
      <div className={`absolute bottom-10 right-1/3 w-[500px] h-[450px] rounded-full blur-[170px] pointer-events-none ${
        isDark ? 'bg-orange-600/15' : 'bg-sky-300/45'
      }`} />

      <section className={`relative z-10 w-full max-w-[1080px] rounded-[36px] border backdrop-blur-2xl p-6 md:p-12 flex flex-col justify-between min-h-[500px] md:min-h-[640px] transition-all duration-300 ${
        isDark
          ? 'border-white/15 bg-white/[0.04] shadow-[0_30px_80px_rgba(0,0,0,0.85)]'
          : 'border-white/70 bg-white/45 shadow-[0_24px_70px_rgba(100,116,139,0.18)]'
      }`}>
        <header className={`flex items-center justify-between border-b pb-6 ${
          isDark ? 'border-white/[0.06]' : 'border-white/60'
        }`}>
          <button onClick={() => onNavigate('home')} className="flex items-center gap-2.5 cursor-pointer">
            <div className={`flex items-center gap-1 ${accentText}`}>
              <img src={logo} alt="Dramatone Studio Logo" className="w-8 h-8" />
            </div>
            <span className={`font-bold text-lg tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Dramatone <span className={accentText}>Studio</span>
            </span>
          </button>

          <nav className="hidden md:flex items-center gap-9 text-xs font-medium tracking-wide">
            <button onClick={() => onNavigate('home')} className={`transition cursor-pointer ${isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-700 hover:text-slate-950'}`}>Home</button>
            <button onClick={() => onNavigate('about')} className={`border-b pb-0.5 cursor-pointer ${isDark ? 'text-white border-white' : 'text-slate-900 border-indigo-600'}`}>About</button>
            <button onClick={() => onNavigate('features')} className={`transition cursor-pointer ${isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-700 hover:text-slate-950'}`}>Features</button>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={onToggleTheme}
              title="Toggle Theme"
              className={`p-2 rounded-full border transition cursor-pointer ${
                isDark ? 'border-white/15 bg-white/5 text-amber-300' : 'border-white/80 bg-white/75 text-indigo-600'
              }`}
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate('dashboard')}
                  className={`text-xs font-semibold px-4 py-2 rounded-full bg-gradient-to-r hover:brightness-110 transition cursor-pointer flex items-center gap-1.5 ${
                    isDark ? 'from-orange-500 to-amber-500 text-zinc-950' : 'from-sky-500 to-indigo-600 text-white'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>{currentUser.name.split(' ')[0]}'s Studio</span>
                </button>
                <button
                  onClick={() => {
                    apiClient.logout()
                    setCurrentUser(null)
                    onNavigate('home')
                  }}
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
                <button onClick={() => onNavigate('login')} className={`text-xs font-medium cursor-pointer ${isDark ? 'text-zinc-300 hover:text-white' : 'text-slate-700 hover:text-slate-950'}`}>Log In</button>
                <button onClick={() => onNavigate('signup')} className={`text-xs font-medium px-4 py-2 rounded-full border cursor-pointer ${
                  isDark ? 'border-orange-500/45 text-orange-300 hover:bg-orange-500/10' : 'border-white/80 text-indigo-700 bg-white/65 hover:bg-white'
                }`}>Get Started</button>
              </>
            )}
          </div>
        </header>

        <div className="my-auto py-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-medium ${
                isDark ? 'border-orange-500/35 bg-orange-500/10 text-orange-400' : 'border-indigo-500/30 bg-indigo-500/10 text-indigo-700'
              }`}>
                <Sparkles className="w-3 h-3" />
                <span>Next-Gen Acoustic Synthesis</span>
              </div>

              <h1 className={`text-3xl md:text-4xl font-bold tracking-tight leading-[1.2] ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Bridging Neural Intelligence &amp; Musical Craft
              </h1>

              <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>
                Dramatone Studio was engineered for composers, sound designers, and audio engineers who want direct control over generative diffusion models—without sacrificing studio-grade clarity or tactile workflow speed.
              </p>
            </div>

            <div className={`lg:col-span-5 p-5 rounded-3xl border backdrop-blur-md grid grid-cols-2 gap-4 ${
              isDark ? 'border-white/10 bg-black/40' : 'border-white/75 bg-white/60 shadow-sm'
            }`}>
              <div className="space-y-1">
                <span className={`text-2xl font-bold ${accentText}`}>48kHz</span>
                <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>Lossless 24-bit WAV stem export</p>
              </div>
              <div className="space-y-1">
                <span className={`text-2xl font-bold ${accentText}`}>&lt;18ms</span>
                <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>Real-time spectral inference</p>
              </div>
              <div className="space-y-1">
                <span className={`text-2xl font-bold ${accentText}`}>16-Stem</span>
                <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>Independent Dramatone isolation</p>
              </div>
              <div className="space-y-1">
                <span className={`text-2xl font-bold ${accentText}`}>100%</span>
                <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>Royalty-free commercial license</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {pillars.map((item, idx) => {
              const Icon = item.icon
              return (
                <div key={idx} className={`p-5 rounded-3xl border backdrop-blur-md space-y-3 ${
                  isDark ? 'border-white/10 bg-black/40' : 'border-white/75 bg-white/60 shadow-sm'
                }`}>
                  <div className={`w-9 h-9 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-md ${
                    isDark ? 'from-orange-500 to-amber-500 text-zinc-950' : 'from-sky-500 to-indigo-600 text-white'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.title}</h3>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>{item.description}</p>
                </div>
              )
            })}
          </div>
        </div>

        <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 border-t pt-5 ${
          isDark ? 'border-white/[0.06]' : 'border-white/60'
        }`}>
          <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>
            Ready to test the spectral engine in your browser?
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('features')}
              className={`px-5 py-2 rounded-full border text-xs font-medium cursor-pointer ${
                isDark ? 'border-orange-500/45 text-orange-300 hover:bg-orange-500/10' : 'border-white/80 text-indigo-700 bg-white/65 hover:bg-white'
              }`}
            >
              Explore Features
            </button>
            <button
              onClick={() => onNavigate('dashboard')}
              className={`px-5 py-2 rounded-full bg-gradient-to-r hover:brightness-110 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                isDark ? 'from-orange-500 to-amber-500 text-zinc-950' : 'from-sky-500 via-indigo-500 to-violet-500 text-white'
              }`}
            >
              <span>Open Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}