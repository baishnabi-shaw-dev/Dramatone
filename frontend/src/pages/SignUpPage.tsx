import { useState, useEffect } from 'react'
import {
  Lock, Mail, User, ArrowRight, ArrowLeft, Sun, Moon, Check,
  Eye, EyeOff, KeyRound, ShieldCheck, RefreshCw
} from 'lucide-react'
import { apiClient } from '@/services/apiClient'

interface SignUpPageProps {
  isDark: boolean
  onToggleTheme: () => void
  onBack: () => void
  onNavigateToLogin: () => void
  onSuccess?: () => void
}

// Client-side quick check for disposable/temp mail providers
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', '10minutemail.com', 'tempmail.com',
  'temp-mail.org', 'throwawaymail.com', 'trashmail.com', 'yopmail.com',
  'sharklasers.com', 'dispostable.com', 'getairmail.com', 'mohmal.com',
  'fakemailgenerator.com', 'burnermail.io', 'emailondeck.com'
])

export function SignUpPage({ isDark, onToggleTheme, onBack, onNavigateToLogin, onSuccess }: SignUpPageProps) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // 2-Step Sign Up: 'info' -> 'otp'
  const [step, setStep] = useState<'info' | 'otp'>('info')
  const [otpCode, setOtpCode] = useState('')
  const [cooldown, setCooldown] = useState(0)

  const [isLoading, setIsLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const emailDomain = email.split('@')[1]?.toLowerCase().trim()
  const isTempMail = !!(emailDomain && DISPOSABLE_DOMAINS.has(emailDomain))

  const hasLength = password.length >= 8
  const hasUpper = /[A-Z]/.test(password)
  const hasLower = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)
  const isPasswordStrong = hasLength && hasUpper && hasLower && hasNumber && hasSpecial

  // Step 1: Send registration OTP via Brevo
  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setStatusMsg(null)

    if (isTempMail) {
      setErrorMsg('Temporary and disposable emails are blocked. Please use a valid personal or professional email address.')
      return
    }

    if (!isPasswordStrong) {
      setErrorMsg('Password must be at least 8 characters with uppercase, lowercase, number, and special character (!@#$%^&*).')
      return
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match!')
      return
    }

    setIsLoading(true)
    try {
      const res = await apiClient.sendSignupOtp(fullName, email, password)
      setStep('otp')
      setCooldown(60)
      setStatusMsg(res.message || 'Verification code dispatched to your email.')
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to initiate account registration')
    } finally {
      setIsLoading(false)
    }
  }

  // Step 2: Verify OTP and create user in database
  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setStatusMsg(null)
    setIsLoading(true)

    try {
      const user = await apiClient.verifySignupOtp(email, otpCode)
      setStatusMsg(`Account verified and created for ${user.name}!`)
      setTimeout(() => {
        setIsLoading(false)
        if (onSuccess) onSuccess()
        else onBack()
      }, 700)
    } catch (err: any) {
      setIsLoading(false)
      setErrorMsg(err.message || 'Invalid or expired verification code')
    }
  }

  // Resend code
  const handleResendOtp = async () => {
    if (cooldown > 0 || isLoading) return
    setIsLoading(true)
    setErrorMsg(null)
    setStatusMsg(null)

    try {
      const res = await apiClient.sendSignupOtp(fullName, email, password)
      setCooldown(60)
      setStatusMsg(res.message || 'A fresh verification code was sent to your email.')
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend code')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className={`relative min-h-screen flex items-center justify-center p-4 md:p-8 overflow-x-hidden overflow-y-auto select-none font-sans transition-colors duration-300 ${
      isDark
        ? 'bg-[#0d0c11] text-zinc-100'
        : 'bg-gradient-to-br from-[#e7c6d9] via-[#dfd6eb] to-[#cbe0e4] text-slate-800'
    }`}>
      <div className={`absolute top-1/4 left-1/3 -translate-x-1/2 w-[520px] h-[520px] rounded-full blur-[170px] pointer-events-none transition-colors duration-300 ${
        isDark ? 'bg-fuchsia-600/20' : 'bg-rose-400/35'
      }`} />
      <div className={`absolute bottom-10 right-1/3 w-[500px] h-[450px] rounded-full blur-[180px] pointer-events-none transition-colors duration-300 ${
        isDark ? 'bg-orange-600/15' : 'bg-sky-300/45'
      }`} />

      <section className={`relative z-10 w-full max-w-[460px] rounded-[36px] border backdrop-blur-2xl p-8 md:p-10 flex flex-col gap-5 transition-all duration-300 ${
        isDark
          ? 'border-white/15 bg-white/[0.04] shadow-[0_30px_80px_rgba(0,0,0,0.85)]'
          : 'border-white/70 bg-white/50 shadow-[0_24px_70px_rgba(100,116,139,0.18)]'
      }`}>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className={`flex items-center gap-1.5 text-xs transition cursor-pointer ${
              isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-700 hover:text-slate-950'
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
              className={`p-1.5 rounded-full border transition cursor-pointer ${
                isDark
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

        <div className="space-y-1 pt-1">
          <h1 className={`text-2xl md:text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {step === 'info' ? 'Create an account' : 'Verify your email'}
          </h1>

          <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>
            {step === 'info'
              ? 'Join Dramatone Studio to access audio diffusion and custom neural models.'
              : `A 6-digit verification code has been dispatched to ${email}. Check your inbox.`}
          </p>
        </div>

        {step === 'info' ? (
          /* STEP 1: REGISTRATION FORM */
          <form onSubmit={handleInfoSubmit} className="space-y-3 pt-1">
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
                  className={`w-full border rounded-2xl py-2.5 pl-10 pr-4 text-xs focus:outline-none transition ${
                    isDark
                      ? 'bg-black/40 border-white/10 text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500/60'
                      : 'bg-white/75 border-white/85 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500/60'
                  }`}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className={`text-[11px] font-medium tracking-wide uppercase ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>
                  Email Address
                </label>
                {isTempMail && (
                  <span className="text-[10px] text-rose-400 font-semibold">Disposable email detected</span>
                )}
              </div>
              <div className="relative flex items-center">
                <Mail className={`w-4 h-4 absolute left-3.5 pointer-events-none ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                <input
                  type="email"
                  required
                  placeholder="example@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full border rounded-2xl py-2.5 pl-10 pr-4 text-xs focus:outline-none transition ${
                    isTempMail
                      ? 'bg-rose-500/10 border-rose-500/50 text-rose-300'
                      : isDark
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
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full border rounded-2xl py-2.5 pl-10 pr-10 text-xs focus:outline-none transition ${
                    isDark
                      ? 'bg-black/40 border-white/10 text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500/60'
                      : 'bg-white/75 border-white/85 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500/60'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3.5 p-1 rounded transition cursor-pointer ${
                    isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {password.length > 0 && (
                <div className="grid grid-cols-2 gap-1 pt-1 text-[10px]">
                  <div className={`flex items-center gap-1 ${hasLength ? 'text-emerald-400 font-semibold' : 'text-zinc-500'}`}>
                    <span>{hasLength ? '✓' : '•'} 8+ characters</span>
                  </div>
                  <div className={`flex items-center gap-1 ${hasUpper && hasLower ? 'text-emerald-400 font-semibold' : 'text-zinc-500'}`}>
                    <span>{hasUpper && hasLower ? '✓' : '•'} Upper & lowercase</span>
                  </div>
                  <div className={`flex items-center gap-1 ${hasNumber ? 'text-emerald-400 font-semibold' : 'text-zinc-500'}`}>
                    <span>{hasNumber ? '✓' : '•'} At least 1 number</span>
                  </div>
                  <div className={`flex items-center gap-1 ${hasSpecial ? 'text-emerald-400 font-semibold' : 'text-zinc-500'}`}>
                    <span>{hasSpecial ? '✓' : '•'} 1 special char</span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className={`text-[11px] font-medium tracking-wide uppercase ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>
                Confirm Password
              </label>
              <div className="relative flex items-center">
                <Lock className={`w-4 h-4 absolute left-3.5 pointer-events-none ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full border rounded-2xl py-2.5 pl-10 pr-10 text-xs focus:outline-none transition ${
                    isDark
                      ? 'bg-black/40 border-white/10 text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500/60'
                      : 'bg-white/75 border-white/85 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500/60'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={`absolute right-3.5 p-1 rounded transition cursor-pointer ${
                    isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl text-center text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || isTempMail}
              className={`w-full py-2.5 px-4 rounded-full bg-gradient-to-r hover:brightness-110 font-semibold text-xs tracking-wide transition cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-50 ${
                isDark
                  ? 'from-orange-500 to-amber-500 text-zinc-950 shadow-[0_4px_20px_rgba(249,115,22,0.35)]'
                  : 'from-sky-500 via-indigo-500 to-violet-500 text-white shadow-[0_4px_20px_rgba(99,102,241,0.3)]'
              }`}
            >
              <span>{isLoading ? 'Verifying Details...' : 'Continue to Email Verification'}</span>
              {!isLoading && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </form>
        ) : (
          /* STEP 2: VERIFY REGISTRATION OTP */
          <form onSubmit={handleVerifyOtpSubmit} className="space-y-3.5 pt-1">
            <div className="p-3 rounded-2xl bg-black/30 border border-white/10 text-xs flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-semibold text-white">Dispatched Verification Code</div>
                <div className="text-[11px] opacity-70">
                  Please enter the 6-digit verification code sent to <strong className="text-orange-400">{email}</strong> to activate your account.
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className={`text-[11px] font-medium tracking-wide uppercase ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>
                  6-Digit Verification Code
                </label>
                <button
                  type="button"
                  disabled={cooldown > 0 || isLoading}
                  onClick={handleResendOtp}
                  className={`text-[11px] flex items-center gap-1 font-medium transition cursor-pointer disabled:opacity-50 ${
                    cooldown > 0 ? 'text-zinc-500 cursor-not-allowed' : isDark ? 'text-orange-400 hover:text-orange-300' : 'text-indigo-600 hover:text-indigo-800'
                  }`}
                >
                  <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>{cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}</span>
                </button>
              </div>

              <div className="relative flex items-center">
                <KeyRound className={`w-4 h-4 absolute left-3.5 pointer-events-none ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="Enter 6-digit code"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className={`w-full border rounded-2xl py-2.5 pl-10 pr-4 text-xs tracking-widest font-mono focus:outline-none transition ${
                    isDark
                      ? 'bg-black/40 border-white/10 text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500/60'
                      : 'bg-white/75 border-white/85 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500/60'
                  }`}
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl text-center text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                {errorMsg}
              </div>
            )}

            {statusMsg && (
              <div className={`p-2.5 rounded-xl text-center text-xs font-semibold flex items-center justify-center gap-1.5 ${
                isDark ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-indigo-500/15 text-indigo-700'
              }`}>
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>{statusMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || otpCode.trim().length !== 6}
              className={`w-full py-2.5 px-4 rounded-full bg-gradient-to-r hover:brightness-110 font-semibold text-xs tracking-wide transition cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-50 ${
                isDark
                  ? 'from-orange-500 to-amber-500 text-zinc-950 shadow-[0_4px_20px_rgba(249,115,22,0.35)]'
                  : 'from-sky-500 via-indigo-500 to-violet-500 text-white shadow-[0_4px_20px_rgba(99,102,241,0.3)]'
              }`}
            >
              <span>{isLoading ? 'Activating Account...' : 'Verify Code & Create Account'}</span>
              {!isLoading && <ArrowRight className="w-3.5 h-3.5" />}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setStep('info')
                  setOtpCode('')
                  setErrorMsg(null)
                  setStatusMsg(null)
                }}
                className={`text-xs hover:underline cursor-pointer ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}
              >
                Back to Edit Details
              </button>
            </div>
          </form>
        )}

        <p className={`text-center text-[11px] ${isDark ? 'text-zinc-500' : 'text-slate-600'}`}>
          Already have an account?{' '}
          <button
            type="button"
            onClick={onNavigateToLogin}
            className={`cursor-pointer transition font-medium ${
              isDark ? 'text-orange-400 hover:text-orange-300' : 'text-indigo-600 hover:text-indigo-800'
            }`}
          >
            Sign In
          </button>
        </p>
      </section>
    </main>
  )
}
