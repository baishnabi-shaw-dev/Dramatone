import { useState } from 'react'
import { Sun, Moon, Sliders, AudioWaveform, Wand2, Download, Mic2, ShieldCheck, ArrowRight, User, LogOut } from 'lucide-react'
import { AppRoute } from '@/components/layout/Sidebar'
import { apiClient } from '@/services/apiClient'

interface FeaturesPageProps {
  isDark: boolean
  onToggleTheme: () => void
  onNavigate: (page: AppRoute) => void
}

export function FeaturesPage({ isDark, onToggleTheme, onNavigate }: FeaturesPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'synthesis' | 'mixing'>('all')
  const [currentUser, setCurrentUser] = useState(() => apiClient.getCurrentUser())

  const features: { icon: typeof AudioWaveform; category: 'synthesis' | 'mixing'; badge: string; title: string; description: string; route: AppRoute }[] = [
    { icon: AudioWaveform, category: 'synthesis', badge: 'Core Engine', title: 'Live Wireframe Spectrogram', description: 'Inspect Dramatone overtones, transient peaks, and frequency distribution in real time with dynamic visual feedback.', route: 'analysis' },
    { icon: Wand2, category: 'synthesis', badge: 'Generative', title: 'Text-to-Stem Diffusion', description: 'Describe a mood, tempo, or instrumentation and generate isolated rhythm, synth, and bass stems ready for arrangement.', route: 'generator' },
    { icon: Sliders, category: 'mixing', badge: 'Precision', title: 'Tactile Rotary & Gain Controls', description: 'Dial in Dramatone brightness, stereo width, and dry/wet diffusion balance using responsive low-latency studio controls.', route: 'dashboard' },
    { icon: Mic2, category: 'synthesis', badge: 'Timbre', title: 'Neural Timbre Transfer', description: 'Reshape hummed melodies or raw instrument recordings into orchestral strings, analog synths, or warm acoustic textures.', route: 'dashboard' },
    { icon: Download, category: 'mixing', badge: 'Studio Ready', title: 'Multi-Track Stem Export', description: 'Export individual stems or mastered mixes directly in 24-bit WAV, FLAC, or MIDI for seamless DAW integration.', route: 'library' },
    { icon: ShieldCheck, category: 'mixing', badge: 'Cloud Sync', title: 'Workspace Version History', description: 'Every parameter tweak and generated take is automatically checkpointed in your personal cloud workspace.', route: 'projects' }
  ]

  const visibleFeatures = selectedCategory === 'all' ? features : features.filter((f) => f.category === selectedCategory)
  const accentText = isDark ? 'text-orange-500' : 'text-indigo-600'

  const handleLogout = () => {
    apiClient.logout()
    setCurrentUser(null)
    onNavigate('home')
  }

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
              <span className="w-1 h-3.5 bg-current rounded-full" />
              <span className="w-1 h-5 bg-current rounded-full" />
              <span className="w-1 h-3 bg-current rounded-full" />
            </div>
            <span className={`font-bold text-lg tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Dramatone <span className={accentText}>Studio</span>
            </span>
          </button>

          <nav className="hidden md:flex items-center gap-9 text-xs font-medium tracking-wide">
            <button onClick={() => onNavigate('home')} className={`transition cursor-pointer ${isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-700 hover:text-slate-950'}`}>Home</button>
            <button onClick={() => onNavigate('about')} className={`transition cursor-pointer ${isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-700 hover:text-slate-950'}`}>About</button>
            <button onClick={() => onNavigate('features')} className={`border-b pb-0.5 font-semibold cursor-pointer ${isDark ? 'text-white border-white' : 'text-slate-900 border-indigo-600'}`}>Features</button>
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
                <button onClick={() => onNavigate('login')} className={`text-xs font-medium cursor-pointer ${isDark ? 'text-zinc-300 hover:text-white' : 'text-slate-700 hover:text-slate-950'}`}>Log In</button>
                <button onClick={() => onNavigate('signup')} className={`text-xs font-medium px-4 py-2 rounded-full border cursor-pointer ${
                  isDark ? 'border-orange-500/45 text-orange-300 hover:bg-orange-500/10' : 'border-white/80 text-indigo-700 bg-white/65 hover:bg-white'
                }`}>Get Started</button>
              </>
            )}
          </div>
        </header>

        <div className="my-auto py-7 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1.5">
              <h1 className={`text-3xl md:text-4xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Studio Capabilities
              </h1>
              <p className={`text-xs max-w-md ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>
                Explore the tools inside Dramatone Studio—designed for rapid audio ideation and clean stem production.
              </p>
            </div>

            <div className={`inline-flex p-1 rounded-full border self-start ${
              isDark ? 'bg-black/40 border-white/10' : 'bg-white/65 border-white/80'
            }`}>
              {(['all', 'synthesis', 'mixing'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedCategory(tab)}
                  className={`px-3.5 py-1 rounded-full text-[11px] font-medium capitalize transition cursor-pointer ${
                    selectedCategory === tab
                      ? isDark
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-zinc-950 font-semibold'
                        : 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-semibold'
                      : isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-700 hover:text-slate-950'
                  }`}
                >
                  {tab === 'all' ? 'All Tools' : tab}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleFeatures.map((feature, idx) => {
              const Icon = feature.icon
              return (
                <div key={idx} className={`p-5 rounded-3xl border backdrop-blur-md flex flex-col justify-between gap-3 transition hover:scale-[1.01] ${
                  isDark ? 'border-white/10 bg-black/40 hover:border-orange-500/30' : 'border-white/75 bg-white/60 shadow-sm hover:border-indigo-300'
                }`}>
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${
                        isDark ? 'bg-orange-500/15 border-orange-500/30 text-orange-500' : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-600'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium ${
                        isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-white/80 text-slate-700'
                      }`}>
                        {feature.badge}
                      </span>
                    </div>
                    <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{feature.title}</h3>
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>{feature.description}</p>
                  </div>

                  <button
                    onClick={() => onNavigate(feature.route)}
                    className={`text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition pt-1 ${
                      isDark ? 'text-orange-400 hover:text-orange-300' : 'text-indigo-600 hover:text-indigo-800'
                    }`}
                  >
                    <span>Launch in Studio</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 border-t pt-5 ${
          isDark ? 'border-white/[0.06]' : 'border-white/60'
        }`}>
          <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>
            {currentUser ? 'Ready to produce? Head straight to your Studio workspace.' : 'Create a free workspace account to unlock full stem exports.'}
          </span>
          <button
            onClick={() => onNavigate(currentUser ? 'dashboard' : 'signup')}
            className={`px-6 py-2 rounded-full bg-gradient-to-r hover:brightness-110 font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 ${
              isDark ? 'from-orange-500 to-amber-500 text-zinc-950' : 'from-sky-500 via-indigo-500 to-violet-500 text-white'
            }`}
          >
            <span>{currentUser ? 'Open Studio Workspace' : 'Get Started Free'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>
    </main>
  )
}
