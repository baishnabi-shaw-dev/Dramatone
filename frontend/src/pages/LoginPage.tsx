import { useState, useEffect } from 'react'
import {
  Lock, Mail, ArrowRight, ArrowLeft, Sun, Moon, Check,
  KeyRound, Eye, EyeOff, ShieldCheck, RefreshCw
} from 'lucide-react'
import { apiClient } from '@/services/apiClient'

interface LoginPageProps {
  isDark: boolean
  onToggleTheme: () => void
  onBack: () => void
  onNavigateToSignUp: () => void
  onSuccess?: () => void
}

export function LoginPage({ isDark, onToggleTheme, onBack, onNavigateToSignUp, onSuccess }: LoginPageProps) {
  // Credentials & Visibility
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // 2-Step Login State: 'credentials' -> 'otp'
  const [loginStep, setLoginStep] = useState<'credentials' | 'otp'>('credentials')
  const [loginOtpCode, setLoginOtpCode] = useState('')
  const [cooldown, setCooldown] = useState(0)

  // Loading & Feedback
  const [isLoading, setIsLoading] = useState(false)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Forgot Password / Reset Flow
  const [isForgotMode, setIsForgotMode] = useState(false)
  const [forgotStep, setForgotStep] = useState<'email' | 'otp'>('email')
  const [resetOtpCode, setResetOtpCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown((c) => Math.max(0, c - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  // Strong password validator
  const isStrongPassword = (pass: string) => {
    return (
      pass.length >= 8 &&
      /[A-Z]/.test(pass) &&
      /[a-z]/.test(pass) &&
      /\d/.test(pass) &&
      /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pass)
    )
  }

  // Step 1: Submit Credentials -> Validates password & sends OTP via Brevo
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg(null)
    setStatusMsg(null)

    try {
      const res = await apiClient.login(email, password)
      setLoginStep('otp')
      setCooldown(60)
      setStatusMsg(res.message || 'Credentials verified. A 6-digit verification code has been dispatched to your email.')
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid email or password')
    } finally {
      setIsLoading(false)
    }
  }

  // Step 2: Verify Login 2FA OTP Code
  const handleVerify2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg(null)
    setStatusMsg(null)

    try {
      const user = await apiClient.verifyLogin2FA(email, loginOtpCode)
      setStatusMsg(`Security verified! Welcome back, ${user.name}`)
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

  // Resend Login OTP Code
  const handleResendLoginOtp = async () => {
    if (cooldown > 0 || isLoading) return
    setIsLoading(true)
    setErrorMsg(null)
    setStatusMsg(null)

    try {
      const res = await apiClient.resendLoginOtp(email)
      setCooldown(60)
      setStatusMsg(res.message || 'A fresh verification code has been dispatched to your email.')
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend code')
    } finally {
      setIsLoading(false)
    }
  }

  // Request Password Reset OTP
  const handleRequestResetOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg(null)
    setStatusMsg(null)

    try {
      const res = await apiClient.forgotPassword(email)
      setForgotStep('otp')
      setCooldown(60)
      setStatusMsg(res.message || 'Password reset verification code dispatched to your email.')
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to request password reset')
    } finally {
      setIsLoading(false)
    }
  }

  // Complete Password Reset
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setStatusMsg(null)

    if (!isStrongPassword(newPassword)) {
      setErrorMsg('New password must be at least 8 characters with uppercase, lowercase, number, and special character.')
      return
    }

    setIsLoading(true)
    try {
      await apiClient.resetPassword(email, resetOtpCode, newPassword)
      setStatusMsg('Password reset! Please sign in with your new password.')
      setTimeout(() => {
        setIsForgotMode(false)
        setForgotStep('email')
        setLoginStep('credentials')
        setPassword(newPassword)
        setStatusMsg(null)
      }, 1500)
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reset password')
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
      <div className={`absolute top-1/4 left-1/3 -translate-x-1/2 w-[520px] h-[520px] rounded-full blur-[160px] pointer-events-none transition-colors duration-300 ${
        isDark ? 'bg-fuchsia-600/25' : 'bg-rose-400/35'
      }`} />
      <div className={`absolute bottom-10 right-1/3 w-[500px] h-[450px] rounded-full blur-[170px] pointer-events-none transition-colors duration-300 ${
        isDark ? 'bg-orange-600/15' : 'bg-sky-300/45'
      }`} />

      <section className={`relative z-10 w-full max-w-[460px] rounded-[36px] border backdrop-blur-2xl p-8 md:p-10 flex flex-col gap-5 transition-all duration-300 ${
        isDark
          ? 'border-white/15 bg-white/[0.04] shadow-[0_30px_80px_rgba(0,0,0,0.85)]'
          : 'border-white/70 bg-white/50 shadow-[0_24px_70px_rgba(100,116,139,0.18)]'
      }`}>
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <button
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

        {/* Title & Guidance */}
        <div className="space-y-1 pt-1">
          <h1 className={`text-2xl md:text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {isForgotMode
              ? 'Reset Password'
              : loginStep === 'otp'
              ? 'Security Verification'
              : 'Welcome back'}
          </h1>
          <p className={`text-xs leading-relaxed ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>
            {isForgotMode
              ? forgotStep === 'email'
                ? 'Enter your account email to receive a password reset verification code.'
                : `Enter the 6-digit code dispatched to ${email} and set your new password.`
              : loginStep === 'otp'
              ? `A 6-digit verification code has been dispatched to ${email}. Check your inbox.`
              : 'Enter your credentials to access your audio diffusion workspace.'}
          </p>
        </div>

        {/* FORGOT PASSWORD FORM */}
        {isForgotMode ? (
          <form onSubmit={forgotStep === 'email' ? handleRequestResetOtp : handleResetPassword} className="space-y-3.5 pt-1">
            <div className="space-y-1">
              <label className={`text-[11px] font-medium tracking-wide uppercase ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>
                Account Email
              </label>
              <div className="relative flex items-center">
                <Mail className={`w-4 h-4 absolute left-3.5 pointer-events-none ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                <input
                  type="email"
                  required
                  placeholder="admin@dramatone.ai"
                  value={email}
                  disabled={forgotStep === 'otp'}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full border rounded-2xl py-2.5 pl-10 pr-4 text-xs focus:outline-none transition ${
                    isDark
                      ? 'bg-black/40 border-white/10 text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500/60'
                      : 'bg-white/75 border-white/85 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500/60'
                  }`}
                />
              </div>
            </div>

            {forgotStep === 'otp' && (
              <>
                <div className="space-y-1">
                  <label className={`text-[11px] font-medium tracking-wide uppercase ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>
                    6-Digit Verification Code
                  </label>
                  <div className="relative flex items-center">
                    <KeyRound className={`w-4 h-4 absolute left-3.5 pointer-events-none ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="Enter 6-digit code from email"
                      value={resetOtpCode}
                      onChange={(e) => setResetOtpCode(e.target.value)}
                      className={`w-full border rounded-2xl py-2.5 pl-10 pr-4 text-xs tracking-widest font-mono focus:outline-none transition ${
                        isDark
                          ? 'bg-black/40 border-white/10 text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500/60'
                          : 'bg-white/75 border-white/85 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500/60'
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className={`text-[11px] font-medium tracking-wide uppercase ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>
                    New Strong Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className={`w-4 h-4 absolute left-3.5 pointer-events-none ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={`w-full border rounded-2xl py-2.5 pl-10 pr-10 text-xs focus:outline-none transition ${
                        isDark
                          ? 'bg-black/40 border-white/10 text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500/60'
                          : 'bg-white/75 border-white/85 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500/60'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className={`absolute right-3.5 p-1 rounded transition cursor-pointer ${
                        isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                      }`}
                      title={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {newPassword.length > 0 && (
                    <div className="text-[10px] space-y-0.5 pt-1">
                      <span className={isStrongPassword(newPassword) ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
                        {isStrongPassword(newPassword) ? '✓ Password meets complexity standards' : '• Requires 8+ chars with uppercase, lowercase, number & symbol'}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}

            {errorMsg && (
              <div className="p-2.5 rounded-xl text-center text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
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
              disabled={isLoading}
              className={`w-full py-2.5 px-4 rounded-full bg-gradient-to-r hover:brightness-110 font-semibold text-xs tracking-wide transition cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-50 ${
                isDark
                  ? 'from-orange-500 to-amber-500 text-zinc-950 shadow-[0_4px_20px_rgba(249,115,22,0.35)]'
                  : 'from-sky-500 via-indigo-500 to-violet-500 text-white shadow-[0_4px_20px_rgba(99,102,241,0.3)]'
              }`}
            >
              <span>
                {isLoading
                  ? 'Processing...'
                  : forgotStep === 'email'
                  ? 'Send Verification Code'
                  : 'Verify Code & Set New Password'}
              </span>
              {!isLoading && <ArrowRight className="w-3.5 h-3.5" />}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsForgotMode(false)
                  setForgotStep('email')
                  setLoginStep('credentials')
                  setErrorMsg(null)
                  setStatusMsg(null)
                }}
                className={`text-xs hover:underline cursor-pointer ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}
              >
                Back to Sign In
              </button>
            </div>
          </form>
        ) : loginStep === 'credentials' ? (
          /* STEP 1: CREDENTIALS (EMAIL + PASSWORD WITH SHOW/HIDE) */
          <form onSubmit={handleCredentialsSubmit} className="space-y-3.5 pt-1">
            <div className="space-y-1">
              <label className={`text-[11px] font-medium tracking-wide uppercase ${isDark ? 'text-zinc-400' : 'text-slate-700'}`}>
                Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className={`w-4 h-4 absolute left-3.5 pointer-events-none ${isDark ? 'text-zinc-500' : 'text-slate-400'}`} />
                <input
                  type="email"
                  required
                  placeholder="admin@dramatone.ai"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotMode(true)
                    setErrorMsg(null)
                    setStatusMsg(null)
                  }}
                  className={`text-[11px] hover:underline cursor-pointer ${isDark ? 'text-orange-400 hover:text-orange-300' : 'text-indigo-600 hover:text-indigo-800'}`}
                >
                  Forgot?
                </button>
              </div>

              {/* Password field with Show/Hide toggle button */}
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
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl text-center text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
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
              disabled={isLoading}
              className={`w-full py-2.5 px-4 rounded-full bg-gradient-to-r hover:brightness-110 font-semibold text-xs tracking-wide transition cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-50 ${
                isDark
                  ? 'from-orange-500 to-amber-500 text-zinc-950 shadow-[0_4px_20px_rgba(249,115,22,0.35)]'
                  : 'from-sky-500 via-indigo-500 to-violet-500 text-white shadow-[0_4px_20px_rgba(99,102,241,0.3)]'
              }`}
            >
              <span>{isLoading ? 'Verifying Credentials...' : 'Sign In'}</span>
              {!isLoading && <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </form>
        ) : (
          /* STEP 2: TWO-FACTOR OTP VERIFICATION (AFTER PASSWORD ENTERED) */
          <form onSubmit={handleVerify2FASubmit} className="space-y-3.5 pt-1">
            <div className="p-3 rounded-2xl bg-black/30 border border-white/10 text-xs flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-semibold text-white">Password Authenticated</div>
                <div className="text-[11px] opacity-70">
                  A single-use 6-digit verification code was sent to <strong className="text-orange-400">{email}</strong>.
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
                  onClick={handleResendLoginOtp}
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
                  value={loginOtpCode}
                  onChange={(e) => setLoginOtpCode(e.target.value)}
                  className={`w-full border rounded-2xl py-2.5 pl-10 pr-4 text-xs tracking-widest font-mono focus:outline-none transition ${
                    isDark
                      ? 'bg-black/40 border-white/10 text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500/60'
                      : 'bg-white/75 border-white/85 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500/60'
                  }`}
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl text-center text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
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
              disabled={isLoading || loginOtpCode.trim().length !== 6}
              className={`w-full py-2.5 px-4 rounded-full bg-gradient-to-r hover:brightness-110 font-semibold text-xs tracking-wide transition cursor-pointer flex items-center justify-center gap-2 mt-2 disabled:opacity-50 ${
                isDark
                  ? 'from-orange-500 to-amber-500 text-zinc-950 shadow-[0_4px_20px_rgba(249,115,22,0.35)]'
                  : 'from-sky-500 via-indigo-500 to-violet-500 text-white shadow-[0_4px_20px_rgba(99,102,241,0.3)]'
              }`}
            >
              <span>{isLoading ? 'Verifying Code...' : 'Verify & Complete Sign In'}</span>
              {!isLoading && <ArrowRight className="w-3.5 h-3.5" />}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setLoginStep('credentials')
                  setLoginOtpCode('')
                  setErrorMsg(null)
                  setStatusMsg(null)
                }}
                className={`text-xs hover:underline cursor-pointer ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}
              >
                Back to Re-enter Password
              </button>
            </div>
          </form>
        )}

        <p className={`text-center text-[11px] ${isDark ? 'text-zinc-500' : 'text-slate-600'}`}>
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onNavigateToSignUp}
            className={`cursor-pointer transition font-medium ${
              isDark ? 'text-orange-400 hover:text-orange-300' : 'text-indigo-600 hover:text-indigo-800'
            }`}
          >
            Join Us
          </button>
        </p>
      </section>
    </main>
  )
}
