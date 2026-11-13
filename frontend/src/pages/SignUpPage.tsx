import { useState } from 'react'
import { Lock, Mail, User, ArrowRight, ArrowLeft, Sun, Moon, Check } from 'lucide-react'
import { apiClient } from '@/services/apiClient'

interface SignUpPageProps {
  isDark: boolean
  onToggleTheme: () => void
  onBack: () => void
  onNavigateToLogin: () => void
  onSuccess?: () => void
}

export function SignUpPage({ isDark, onToggleTheme, onBack, onNavigateToLogin, onSuccess }: SignUpPageProps) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match!')
      return
    }
    setIsLoading(true)
    try {
      const user = await apiClient.signup(fullName, email, password)
      setStatusMsg(`Account created for ${user.name}!`)
      setTimeout(() => {
        setIsLoading(false)
        if (onSuccess) onSuccess()
        else onBack()
      }, 700)
    } catch {
      setIsLoading(false)
    }
  }

  return (
    <main className={`relative min-h-screen flex items-center justify-center p-4 md:p-8 overflow-hidden select-none font-sans transition-colors duration-300 ${isDark
        ? 'bg-[#0d0c11] text-zinc-100'
        : 'bg-gradient-to-br from-[#e7c6d9] via-[#dfd6eb] to-[#cbe0e4] text-slate-800'
      }`}>
      <div className={`absolute top-1/4 left-1/3 -translate-x-1/2 w-[520px] h-[520px] rounded-full blur-[170px] pointer-events-none transition-colors duration-300 ${isDark ? 'bg-fuchsia-600/20' : 'bg-rose-400/35'
        }`} />
      <div className={`absolute bottom-10 right-1/3 w-[500px] h-[450px] rounded-full blur-[180px] pointer-events-none transition-colors duration-300 ${isDark ? 'bg-orange-600/15' : 'bg-sky-300/45'
        }`} />

      <section className={`relative z-10 w-full max-w-[460px] rounded-[36px] border backdrop-blur-2xl p-8 md:p-10 flex flex-col gap-6 transition-all duration-300 ${isDark
          ? 'border-white/15 bg-white/[0.04] shadow-[0_30px_80px_rgba(0,0,0,0.85)]'
          : 'border-white/70 bg-white/50 shadow-[0_24px_70px_rgba(100,116,139,0.18)]'
        }`}>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className={`flex items-center gap-1.5 text-xs transition cursor-pointer ${isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-700 hover:text-slate-950'
              }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleTheme}
              title="Toggle Theme"
              className={`p-1.5 rounded-full border transition cursor-pointer ${isDark
                  ? 'border-white/15 bg-white/5 text-amber-300 hover:bg-white/10'
                  : 'border-white/80 bg-white/75 text-indigo-600 hover:bg-white'
                }`}
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            <span className={`font-bold text-sm tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Dramatone <span className={isDark ? 'text-orange-500' : 'text-indigo-600'}>Studio</span>
            </span>
          </div>
        </div>

        <div className="space-y-1.5 pt-1">
          <h1 className={`text-2xl md:text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Create an account
          </h1>

          <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>
            Get access to the neural audio studio and custom training models.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
          <div className="space-y-1">
            <label className={`text-[11px] font-medium tracking-wide uppercase ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>
              Full Name
            </label>
            <div className="relative flex items-center">
              <User className={`w-4 h-4 absolute left-3.5 pointer-events-none ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
              <input
                type="text"
                required
                placeholder="Ram Altman"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={`w-full border rounded-2xl py-2.5 pl-10 pr-4 text-xs focus:outline-none transition ${isDark
                    ? 'bg-black/40 border-white/10 text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500/60'
                    : 'bg-white/75 border-white/85 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500/60'
                  }`}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className={`text-[11px] font-medium tracking-wide uppercase ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>
              Email Address
            </label>
            <div className="relative flex items-center">
              <Mail className={`w-4 h-4 absolute left-3.5 pointer-events-none ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
              <input
                type="email"
                required
                placeholder="example@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full border rounded-2xl py-2.5 pl-10 pr-4 text-xs focus:outline-none transition ${isDark
                    ? 'bg-black/40 border-white/10 text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500/60'
                    : 'bg-white/75 border-white/85 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500/60'
                  }`}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className={`text-[11px] font-medium tracking-wide uppercase ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className={`w-4 h-4 absolute left-3.5 pointer-events-none ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full border rounded-2xl py-2.5 pl-10 pr-4 text-xs focus:outline-none transition ${isDark
                    ? 'bg-black/40 border-white/10 text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500/60'
                    : 'bg-white/75 border-white/85 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500/60'
                  }`}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className={`text-[11px] font-medium tracking-wide uppercase ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>
              Confirm Password
            </label>
            <div className="relative flex items-center">
              <Lock className={`w-4 h-4 absolute left-3.5 pointer-events-none ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full border rounded-2xl py-2.5 pl-10 pr-4 text-xs focus:outline-none transition ${isDark
                    ? 'bg-black/40 border-white/10 text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500/60'
                    : 'bg-white/75 border-white/85 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500/60'
                  }`}
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-2 rounded-xl text-center text-xs font-semibold bg-rose-500/20 text-rose-400">
              {errorMsg}
            </div>
          )}

          {statusMsg && (
            <div className={`p-2 rounded-xl text-center text-xs font-semibold flex items-center justify-center gap-1.5 ${
              isDark ? 'bg-orange-500/20 text-orange-400' : 'bg-indigo-500/15 text-indigo-700'
            }`}>
              <Check className="w-3.5 h-3.5" />
              <span>{statusMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-2.5 px-4 rounded-full bg-gradient-to-r hover:brightness-110 font-semibold text-xs tracking-wide transition cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-50 ${isDark
                ? 'from-orange-500 to-amber-500 text-zinc-950 shadow-[0_4px_20px_rgba(249,115,22,0.35)]'
                : 'from-sky-500 via-indigo-500 to-violet-500 text-white shadow-[0_4px_20px_rgba(99,102,241,0.3)]'
              }`}
          >
            <span>{isLoading ? 'Creating Account...' : 'Get Started'}</span>
            {!isLoading && <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </form>

        <p className={`text-center text-[11px] ${isDark ? 'text-zinc-500' : 'text-slate-600'}`}>
          Already have an account?{' '}
          <button
            type="button"
            onClick={onNavigateToLogin}
            className={`cursor-pointer transition font-medium ${isDark ? 'text-orange-400 hover:text-orange-300' : 'text-indigo-600 hover:text-indigo-800'
              }`}
          >
            Log in here
          </button>
        </p>
      </section>
    </main>
  )
}