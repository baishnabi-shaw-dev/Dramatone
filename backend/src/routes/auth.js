import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import nodemailer from 'nodemailer'
import { User } from '../models/User.js'
import { AdminRemovalRequest } from '../models/AdminRemovalRequest.js'

export const authRouter = express.Router()
const JWT_SECRET = process.env.JWT_SECRET || 'dramatone_hackathon_super_secret_jwt_key_2026'

// Strong password regex: 8+ chars, at least 1 uppercase, 1 lowercase, 1 digit, 1 special character
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/

function isStrongPassword(password) {
  return typeof password === 'string' && STRONG_PASSWORD_REGEX.test(password)
}

// Known disposable / temporary email domains blacklist
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', 'guerrillamailblock.com', '10minutemail.com',
  'tempmail.com', 'temp-mail.org', 'throwawaymail.com', 'trashmail.com', 'trashmail.net',
  'yopmail.com', 'sharklasers.com', 'dispostable.com', 'getairmail.com', 'mohmal.com',
  'crazymailing.com', 'inboxbear.com', 'maildrop.cc', 'mytemp.email', 'fakemailgenerator.com',
  'generator.email', 'tempail.com', 'burnermail.io', 'trashmail.me', 'emailondeck.com',
  'zillamail.com', 'getnada.com', 'dropmail.me', 'fakeinbox.com', 'minuteinbox.com'
])

export function isDisposableEmail(email) {
  if (!email || typeof email !== 'string') return false
  const parts = email.split('@')
  if (parts.length < 2) return false
  const domain = parts[1].toLowerCase().trim()
  return DISPOSABLE_EMAIL_DOMAINS.has(domain)
}

// In-memory store for pending registrations awaiting email OTP verification
const pendingSignups = new Map() // email -> { name, email, hashedPassword, otp, expiresAt, lastSentAt }

// Brevo (Sendinblue) SMTP Transporter
let transporter = null

function getBrevoTransporter() {
  if (!transporter) {
    const host = process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com'
    const port = parseInt(process.env.BREVO_SMTP_PORT || '587', 10)
    const user = process.env.BREVO_SMTP_USER
    const pass = process.env.BREVO_SMTP_KEY

    if (user && pass) {
      transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
      })
    }
  }
  return transporter
}

// Send transactional OTP email via Brevo SMTP relay
// Plaintext OTP is delivered ONLY to the recipient's secure inbox
async function sendBrevoEmail({ toEmail, subject, htmlContent }) {
  const mailer = getBrevoTransporter()
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'bogululoforexnews.bg@proton.me'
  const senderName = process.env.BREVO_SENDER_NAME || 'DRAMATONE-STUDIO.AI'

  if (!mailer) {
    console.warn(`⚠️ [Brevo SMTP] SMTP credentials not configured in backend/.env`)
    return { sent: false, reason: 'NO_SMTP_CREDENTIALS' }
  }

  // Anti-Spoofing & DMARC Protection:
  // If sending to a ProtonMail address (@proton.me or @protonmail.com) and the sender is also
  // set to @proton.me, ProtonMail strictly rejects the incoming message as an unauthorized spoofed identity.
  // We fall back to the Brevo SMTP account identity so SPF & DKIM signatures align properly.
  const isProtonRecipient = toEmail.toLowerCase().endsWith('@proton.me') || toEmail.toLowerCase().endsWith('@protonmail.com')
  const isProtonSender = senderEmail.toLowerCase().endsWith('@proton.me') || senderEmail.toLowerCase().endsWith('@protonmail.com')
  if (isProtonRecipient && isProtonSender) {
    senderEmail = process.env.BREVO_SMTP_USER || 'b922fe001@smtp-brevo.com'
  }

  try {
    const info = await mailer.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to: toEmail,
      subject,
      html: htmlContent
    })
    console.log(`✉️ [Brevo SMTP] Email dispatched to recipient (${toEmail}) from (${senderEmail}). MessageId: ${info.messageId}`)
    return { sent: true, messageId: info.messageId }
  } catch (err) {
    console.error('❌ [Brevo SMTP Error]:', err.message)
    return { sent: false, error: err.message }
  }
}

// Middleware: Restrict access strictly to authenticated Admin users
function requireAdmin(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  const defaultAdminEmail = (process.env.DEFAULT_USER || 'admin@dramatone.ai').toLowerCase()

  if (!token) {
    return res.status(401).json({ error: 'Admin authorization token required' })
  }

  // Support local dev admin token fallback
  if (token.startsWith('local-token-admin') || token.startsWith('local-admin')) {
    req.user = { email: defaultAdminEmail, role: 'admin' }
    return next()
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired authorization token' })
    }
    if (decoded.role === 'admin' || (decoded.email && decoded.email.toLowerCase() === defaultAdminEmail)) {
      req.user = decoded
      return next()
    }
    return res.status(403).json({ error: 'Access denied: Administrator privileges required' })
  })
}

// Step 1: Request Registration OTP (Blocks Disposable/Temp Mails & Enforces Strong Passwords)
authRouter.post('/send-signup-otp', async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Full name, email, and password are required' })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // 1. Block Disposable & Temp Mail domains
    if (isDisposableEmail(normalizedEmail)) {
      return res.status(400).json({
        error: 'Temporary and disposable email addresses are blocked. Please use a valid personal or work email address.'
      })
    }

    // 2. Validate strong password complexity
    if (!isStrongPassword(password)) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*).'
      })
    }

    // 3. Check if account already exists
    const existingUser = await User.findOne({ email: normalizedEmail })
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email address already exists. Please sign in.' })
    }

    // 4. Check OTP cooldown
    const cooldownSeconds = parseInt(process.env.OTP_COOLDOWN_SECONDS, 10) || 60
    const existingPending = pendingSignups.get(normalizedEmail)
    if (existingPending && existingPending.lastSentAt) {
      const elapsed = Math.floor((Date.now() - existingPending.lastSentAt) / 1000)
      if (elapsed < cooldownSeconds) {
        const remaining = cooldownSeconds - elapsed
        return res.status(429).json({
          error: `Please wait ${remaining}s before requesting a new registration code.`
        })
      }
    }

    // 5. Generate secure 6-digit OTP & pre-hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    pendingSignups.set(normalizedEmail, {
      name: name.trim(),
      email: normalizedEmail,
      hashedPassword,
      otp,
      expiresAt: Date.now() + 10 * 60 * 1000,
      lastSentAt: Date.now()
    })

    // 6. Send verification code via Brevo SMTP relay
    await sendBrevoEmail({
      toEmail: normalizedEmail,
      subject: 'Verify Your Dramatone Studio Account Registration',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; background-color: #0d0c11; color: #f4f4f5; padding: 32px; border-radius: 16px; max-width: 520px; margin: auto; border: 1px solid rgba(255,255,255,0.1);">
          <h2 style="color: #f97316; margin-top: 0; font-size: 22px;">Welcome to Dramatone Studio</h2>
          <p style="color: #d4d4d8; font-size: 14px; line-height: 1.5;">To complete creating your neural audio workspace account, please enter the following 6-digit verification code:</p>
          <div style="background-color: #18181b; padding: 20px; border-radius: 12px; font-size: 32px; font-weight: 700; letter-spacing: 8px; text-align: center; color: #fb923c; margin: 24px 0; border: 1px solid rgba(249,115,22,0.3);">
            ${otp}
          </div>
          <p style="font-size: 12px; color: #71717a; margin-bottom: 0;">This registration code expires in 10 minutes. If you did not create this account, you can safely ignore this email.</p>
        </div>
      `
    })

    res.json({
      success: true,
      message: `A 6-digit verification code has been dispatched to ${normalizedEmail}.`
    })
  } catch (err) {
    console.error('Send signup OTP error:', err)
    res.status(500).json({ error: 'Failed to initiate account registration' })
  }
})

// Step 2: Verify Registration OTP & Create User in Database
authRouter.post('/verify-signup-otp', async (req, res) => {
  try {
    const { email, otp } = req.body
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and 6-digit verification code are required' })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const pending = pendingSignups.get(normalizedEmail)

    if (!pending || pending.otp !== otp.trim()) {
      return res.status(400).json({ error: 'Invalid or expired verification code' })
    }

    if (Date.now() > pending.expiresAt) {
      pendingSignups.delete(normalizedEmail)
      return res.status(400).json({ error: 'Verification code has expired. Please register again.' })
    }

    // Double check if account was registered concurrently
    const existing = await User.findOne({ email: normalizedEmail })
    if (existing) {
      pendingSignups.delete(normalizedEmail)
      return res.status(409).json({ error: 'An account with this email already exists' })
    }

    const defaultEmail = (process.env.DEFAULT_USER || 'admin@dramatone.ai').toLowerCase()
    const user = new User({
      name: pending.name,
      email: pending.email,
      password: pending.hashedPassword,
      role: pending.email === defaultEmail ? 'admin' : 'user',
      status: 'active'
    })

    await user.save()
    pendingSignups.delete(normalizedEmail)

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' })

    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token
    })
  } catch (err) {
    console.error('Verify signup OTP error:', err)
    res.status(500).json({ error: 'Failed to verify registration code' })
  }
})

// Direct Signup fallback (also strictly blocks disposable email addresses)
authRouter.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const normalizedEmail = email.toLowerCase().trim()
    if (isDisposableEmail(normalizedEmail)) {
      return res.status(400).json({
        error: 'Temporary and disposable email addresses are blocked. Please use a valid personal or work email address.'
      })
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*).'
      })
    }

    const defaultEmail = (process.env.DEFAULT_USER || 'admin@dramatone.ai').toLowerCase()
    const existingUser = await User.findOne({ email: normalizedEmail })
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists' })
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    const user = new User({
      name: name || 'Dramatone Producer',
      email: normalizedEmail,
      password: hashedPassword,
      role: normalizedEmail === defaultEmail ? 'admin' : 'user'
    })

    await user.save()

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' })

    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      token
    })
  } catch (err) {
    console.error('Signup error:', err)
    res.status(500).json({ error: 'Internal server error during registration' })
  }
})

// Step 1: Login with Email & Password
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const defaultEmail = (process.env.DEFAULT_USER || 'admin@dramatone.ai').toLowerCase()
    const defaultPass = process.env.DEFAULT_PASSWORD || 'BWU/bca/25@'

    let targetUser = null

    // Check default admin credentials configured in .env
    if (normalizedEmail === defaultEmail && password === defaultPass) {
      targetUser = await User.findOne({ email: defaultEmail })
      if (!targetUser) {
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(defaultPass, salt)
        targetUser = new User({
          name: 'Dramatone Super Admin',
          email: defaultEmail,
          password: hashedPassword,
          role: 'admin',
          status: 'active'
        })
        await targetUser.save()
      } else if (targetUser.role !== 'admin') {
        targetUser.role = 'admin'
        await targetUser.save()
      }
    } else {
      targetUser = await User.findOne({ email: normalizedEmail })
      if (!targetUser) {
        return res.status(401).json({ error: 'Invalid email or password' })
      }

      if (targetUser.status === 'suspended') {
        return res.status(403).json({ error: 'Your account has been suspended by an administrator.' })
      }

      const isMatch = await bcrypt.compare(password, targetUser.password)
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password' })
      }
    }

    // Credentials verified! Check OTP cooldown
    const cooldownSeconds = parseInt(process.env.OTP_COOLDOWN_SECONDS, 10) || 60
    if (targetUser.lastOtpSentAt) {
      const elapsedSeconds = Math.floor((Date.now() - new Date(targetUser.lastOtpSentAt).getTime()) / 1000)
      if (elapsedSeconds < cooldownSeconds) {
        const remaining = cooldownSeconds - elapsedSeconds
        return res.json({
          success: true,
          requireOtp: true,
          email: targetUser.email,
          message: `Verification code was recently sent. Please check your inbox (resend available in ${remaining}s).`
        })
      }
    }

    // Generate secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    targetUser.resetOtp = otp
    targetUser.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000)
    targetUser.lastOtpSentAt = new Date()
    await targetUser.save()

    // Dispatch OTP securely to recipient via Brevo SMTP relay
    await sendBrevoEmail({
      toEmail: targetUser.email,
      subject: 'Your Dramatone Studio Login Verification Code',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; background-color: #0d0c11; color: #f4f4f5; padding: 32px; border-radius: 16px; max-width: 520px; margin: auto; border: 1px solid rgba(255,255,255,0.1);">
          <h2 style="color: #f97316; margin-top: 0; font-size: 22px;">Two-Factor Sign-In Verification</h2>
          <p style="color: #d4d4d8; font-size: 14px; line-height: 1.5;">Your credentials were verified. Use the 6-digit verification code below to complete signing into Dramatone Studio:</p>
          <div style="background-color: #18181b; padding: 20px; border-radius: 12px; font-size: 32px; font-weight: 700; letter-spacing: 8px; text-align: center; color: #fb923c; margin: 24px 0; border: 1px solid rgba(249,115,22,0.3);">
            ${otp}
          </div>
          <p style="font-size: 12px; color: #71717a; margin-bottom: 0;">This code will expire in 10 minutes. If you did not attempt to sign in, please secure your account immediately.</p>
        </div>
      `
    })

    res.json({
      success: true,
      requireOtp: true,
      email: targetUser.email,
      message: 'Credentials verified. A 6-digit verification code has been dispatched to your email.'
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Internal server error during login' })
  }
})

// Step 2: Verify Login 2FA OTP Code
authRouter.post('/verify-login-2fa', async (req, res) => {
  try {
    const { email, otp } = req.body
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and 6-digit verification code are required' })
    }

    const normalizedEmail = email.toLowerCase().trim()
    const defaultEmail = (process.env.DEFAULT_USER || 'admin@dramatone.ai').toLowerCase()
    const user = await User.findOne({ email: normalizedEmail })

    if (!user || user.resetOtp !== otp.trim()) {
      return res.status(400).json({ error: 'Invalid or expired verification code' })
    }

    if (user.resetOtpExpires && new Date() > user.resetOtpExpires) {
      return res.status(400).json({ error: 'Verification code has expired. Please sign in again.' })
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Your account has been suspended by an administrator.' })
    }

    user.resetOtp = null
    user.resetOtpExpires = null
    await user.save()

    const role = normalizedEmail === defaultEmail ? 'admin' : (user.role || 'user')
    const token = jwt.sign({ id: user._id, email: user.email, role }, JWT_SECRET, { expiresIn: '7d' })

    res.json({
      user: { id: user._id, name: user.name, email: user.email, role },
      token
    })
  } catch (err) {
    console.error('Login 2FA verification error:', err)
    res.status(500).json({ error: 'Failed to verify verification code' })
  }
})

// Resend Login OTP Code
authRouter.post('/resend-login-otp', async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ error: 'Email is required' })

    const normalizedEmail = email.toLowerCase().trim()
    const user = await User.findOne({ email: normalizedEmail })
    if (!user) {
      return res.status(404).json({ error: 'User account not found' })
    }

    const cooldownSeconds = parseInt(process.env.OTP_COOLDOWN_SECONDS, 10) || 60
    if (user.lastOtpSentAt) {
      const elapsedSeconds = Math.floor((Date.now() - new Date(user.lastOtpSentAt).getTime()) / 1000)
      if (elapsedSeconds < cooldownSeconds) {
        const remaining = cooldownSeconds - elapsedSeconds
        return res.status(429).json({
          error: `Please wait ${remaining}s before requesting a new code.`
        })
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    user.resetOtp = otp
    user.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000)
    user.lastOtpSentAt = new Date()
    await user.save()

    await sendBrevoEmail({
      toEmail: user.email,
      subject: 'Your New Dramatone Studio Login Verification Code',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; background-color: #0d0c11; color: #f4f4f5; padding: 32px; border-radius: 16px; max-width: 520px; margin: auto; border: 1px solid rgba(255,255,255,0.1);">
          <h2 style="color: #f97316; margin-top: 0; font-size: 22px;">New Verification Code</h2>
          <p style="color: #d4d4d8; font-size: 14px; line-height: 1.5;">Use the new 6-digit code below to complete sign-in:</p>
          <div style="background-color: #18181b; padding: 20px; border-radius: 12px; font-size: 32px; font-weight: 700; letter-spacing: 8px; text-align: center; color: #fb923c; margin: 24px 0; border: 1px solid rgba(249,115,22,0.3);">
            ${otp}
          </div>
          <p style="font-size: 12px; color: #71717a; margin-bottom: 0;">This code expires in 10 minutes.</p>
        </div>
      `
    })

    res.json({
      success: true,
      message: 'A fresh verification code has been dispatched to your email.'
    })
  } catch (err) {
    console.error('Resend login OTP error:', err)
    res.status(500).json({ error: 'Failed to resend verification code' })
  }
})

// Forgot Password: Issue 6-digit OTP via Brevo SMTP (Only for Existing Users!)
authRouter.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ error: 'Email is required' })

    const normalizedEmail = email.toLowerCase().trim()
    const user = await User.findOne({ email: normalizedEmail })

    // Bug 4 fix: Do NOT permit non-registered emails to request OTP or create users via forgot password
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email. Please register first.' })
    }

    const cooldownSeconds = parseInt(process.env.OTP_COOLDOWN_SECONDS, 10) || 60
    if (user.lastOtpSentAt) {
      const elapsedSeconds = Math.floor((Date.now() - new Date(user.lastOtpSentAt).getTime()) / 1000)
      if (elapsedSeconds < cooldownSeconds) {
        const remaining = cooldownSeconds - elapsedSeconds
        return res.status(429).json({
          error: `Please wait ${remaining}s before requesting a new verification code.`
        })
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    user.resetOtp = otp
    user.resetOtpExpires = new Date(Date.now() + 10 * 60 * 1000)
    user.lastOtpSentAt = new Date()
    await user.save()

    await sendBrevoEmail({
      toEmail: user.email,
      subject: 'Your Dramatone Password Reset Code',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; background-color: #0d0c11; color: #f4f4f5; padding: 32px; border-radius: 16px; max-width: 520px; margin: auto; border: 1px solid rgba(255,255,255,0.1);">
          <h2 style="color: #f97316; margin-top: 0; font-size: 22px;">Reset Your Dramatone Password</h2>
          <p style="color: #d4d4d8; font-size: 14px; line-height: 1.5;">We received a request to reset your password. Use the verification code below:</p>
          <div style="background-color: #18181b; padding: 20px; border-radius: 12px; font-size: 32px; font-weight: 700; letter-spacing: 8px; text-align: center; color: #fb923c; margin: 24px 0; border: 1px solid rgba(249,115,22,0.3);">
            ${otp}
          </div>
          <p style="font-size: 12px; color: #71717a; margin-bottom: 0;">This code expires in 10 minutes. If you did not request this, you can safely ignore this email.</p>
        </div>
      `
    })

    res.json({
      success: true,
      message: `Password reset verification code dispatched to ${normalizedEmail}.`
    })
  } catch (err) {
    console.error('Forgot password error:', err)
    res.status(500).json({ error: 'Failed to process forgot password request' })
  }
})

// Verify OTP
authRouter.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' })

    const user = await User.findOne({ email: email.toLowerCase().trim() })
    if (!user || user.resetOtp !== otp.trim()) {
      return res.status(400).json({ error: 'Invalid or expired verification code' })
    }

    if (user.resetOtpExpires && new Date() > user.resetOtpExpires) {
      return res.status(400).json({ error: 'Verification code has expired. Request a new one.' })
    }

    res.json({ success: true, message: 'Verification code verified successfully' })
  } catch (err) {
    console.error('Verify OTP error:', err)
    res.status(500).json({ error: 'Failed to verify OTP' })
  }
})

// Reset Password (Enforces Strong Password & Verifies User Exists)
authRouter.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP, and new password are required' })
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (!@#$%^&*).'
      })
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() })
    if (!user) {
      return res.status(404).json({ error: 'Account not found. Please register first.' })
    }

    if (user.resetOtp !== otp.trim()) {
      return res.status(400).json({ error: 'Invalid verification code' })
    }

    if (user.resetOtpExpires && new Date() > user.resetOtpExpires) {
      return res.status(400).json({ error: 'Verification code has expired. Request a new one.' })
    }

    const salt = await bcrypt.genSalt(10)
    user.password = await bcrypt.hash(newPassword, salt)
    user.resetOtp = null
    user.resetOtpExpires = null
    await user.save()

    res.json({ success: true, message: 'Password reset successfully. You can now login with your new password.' })
  } catch (err) {
    console.error('Reset password error:', err)
    res.status(500).json({ error: 'Failed to reset password' })
  }
})

// Protected Admin: Filtered Mailing List (Filters out Disposable/Temp Mails)
authRouter.get('/mailing-list', requireAdmin, async (req, res) => {
  try {
    const { status, search, excludeTemp } = req.query
    const query = { marketingSubscribed: true }

    if (status) query.status = status
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ]
    }

    let subscribers = await User.find(query).select('name email status createdAt').sort({ createdAt: -1 })

    // Bug 6 fix: Filter out disposable/temp mail domains from marketing broadcasts
    if (excludeTemp !== 'false') {
      subscribers = subscribers.filter((s) => !isDisposableEmail(s.email))
    }

    res.json({ count: subscribers.length, subscribers })
  } catch (err) {
    console.error('Mailing list error:', err)
    res.status(500).json({ error: 'Failed to fetch mailing list' })
  }
})

// Protected Admin: Get all users
authRouter.get('/admin/users', requireAdmin, async (req, res) => {
  try {
    const defaultEmail = (process.env.DEFAULT_USER || 'lund69633@gmail.com').toLowerCase()
    const rawUsers = await User.find().select('name email role status createdAt marketingSubscribed').sort({ createdAt: -1 })
    const users = rawUsers.map((u) => {
      const obj = u.toObject ? u.toObject() : { ...u }
      obj.isSuperAdmin = obj.email.toLowerCase() === defaultEmail
      return obj
    })
    res.json(users)
  } catch (err) {
    console.error('Admin get users error:', err)
    res.status(500).json({ error: 'Failed to fetch users' })
  }
})

// Protected Admin: Update user status or role (Nobody gets super admin rather than Dramatone Super Admin)
authRouter.patch('/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { status, role } = req.body

    const targetUser = await User.findById(id)
    if (!targetUser) return res.status(404).json({ error: 'User not found' })

    const defaultEmail = (process.env.DEFAULT_USER || 'lund69633@gmail.com').toLowerCase()

    // Prevent modifying the permanent Dramatone Super Admin
    if (targetUser.email.toLowerCase() === defaultEmail) {
      return res.status(403).json({ error: 'The Dramatone Super Admin account is permanently protected and cannot be modified.' })
    }

    const updates = {}
    if (status) updates.status = status
    if (role && (role === 'admin' || role === 'user')) updates.role = role

    const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true }).select('name email role status createdAt')
    res.json({ success: true, user: updatedUser })
  } catch (err) {
    console.error('Admin update user error:', err)
    res.status(500).json({ error: 'Failed to update user' })
  }
})

// Protected Admin: Delete user
// Rules:
// 1. Dramatone Super Admin can NEVER be deleted.
// 2. An admin cannot delete their own active account.
// 3. A secondary admin CANNOT directly delete another admin — they must submit an admin removal request with a reason for Super Admin approval.
// 4. Dramatone Super Admin can directly delete any regular user or admin.
authRouter.delete('/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const targetUser = await User.findById(id)
    if (!targetUser) return res.status(404).json({ error: 'User not found' })

    const defaultEmail = (process.env.DEFAULT_USER || 'lund69633@gmail.com').toLowerCase()
    const callerEmail = (req.user?.email || '').toLowerCase()

    // Permanent Super Admin protection
    if (targetUser.email.toLowerCase() === defaultEmail) {
      return res.status(403).json({ error: 'The Dramatone Super Admin account is permanently protected and cannot be deleted.' })
    }

    // Caller cannot delete their own account
    if (callerEmail === targetUser.email.toLowerCase()) {
      return res.status(403).json({ error: 'You cannot delete your own active administrator account.' })
    }

    // Secondary Admin cannot delete another Admin directly
    if (targetUser.role === 'admin' && callerEmail !== defaultEmail) {
      return res.status(403).json({
        error: 'Only the Dramatone Super Admin can delete an administrator directly. Please submit an Admin Removal Request with a reason for approval.',
        requiresApproval: true
      })
    }

    const deletedUser = await User.findByIdAndDelete(id)
    res.json({ success: true, message: `User ${deletedUser.email} has been deleted.` })
  } catch (err) {
    console.error('Admin delete user error:', err)
    res.status(500).json({ error: 'Failed to delete user' })
  }
})

// Protected Admin: Submit Removal Request for another Admin (Requires proper reason)
authRouter.post('/admin/removal-requests', requireAdmin, async (req, res) => {
  try {
    const { targetUserId, reason } = req.body
    if (!targetUserId || !reason || reason.trim().length < 8) {
      return res.status(400).json({ error: 'A valid target admin and detailed removal reason (minimum 8 characters) are required.' })
    }

    const defaultEmail = (process.env.DEFAULT_USER || 'lund69633@gmail.com').toLowerCase()
    const callerEmail = (req.user?.email || '').toLowerCase()

    const targetUser = await User.findById(targetUserId)
    if (!targetUser) return res.status(404).json({ error: 'Target administrator not found.' })

    if (targetUser.email.toLowerCase() === defaultEmail) {
      return res.status(403).json({ error: 'The Dramatone Super Admin cannot be removed or targeted for removal.' })
    }

    if (callerEmail === targetUser.email.toLowerCase()) {
      return res.status(400).json({ error: 'You cannot request removal of your own account.' })
    }

    if (targetUser.role !== 'admin') {
      return res.status(400).json({ error: 'Target user is not an administrator. Non-admin users can be managed directly.' })
    }

    // Check if pending request already exists
    const existing = await AdminRemovalRequest.findOne({ targetUserId, status: 'pending' })
    if (existing) {
      return res.status(409).json({ error: 'A pending removal request for this administrator is already awaiting Super Admin review.' })
    }

    const callerUser = await User.findOne({ email: callerEmail })
    const request = new AdminRemovalRequest({
      targetUserId: targetUser._id,
      targetEmail: targetUser.email,
      targetName: targetUser.name,
      requestedByEmail: callerEmail,
      requestedByName: callerUser?.name || 'Administrator',
      reason: reason.trim(),
      status: 'pending'
    })

    await request.save()
    res.json({
      success: true,
      message: `Admin removal request for ${targetUser.email} submitted successfully for Dramatone Super Admin approval.`,
      request
    })
  } catch (err) {
    console.error('Submit admin removal request error:', err)
    res.status(500).json({ error: 'Failed to submit removal request' })
  }
})

// Protected Admin: Get all removal requests (Pending & Resolved)
authRouter.get('/admin/removal-requests', requireAdmin, async (req, res) => {
  try {
    const requests = await AdminRemovalRequest.find().sort({ createdAt: -1 })
    res.json(requests)
  } catch (err) {
    console.error('Get removal requests error:', err)
    res.status(500).json({ error: 'Failed to fetch removal requests' })
  }
})

// Protected Admin: Approve Removal Request (Strictly Dramatone Super Admin Only)
authRouter.post('/admin/removal-requests/:id/approve', requireAdmin, async (req, res) => {
  try {
    const defaultEmail = (process.env.DEFAULT_USER || 'lund69633@gmail.com').toLowerCase()
    const callerEmail = (req.user?.email || '').toLowerCase()

    if (callerEmail !== defaultEmail) {
      return res.status(403).json({ error: 'Access denied: Only the permanent Dramatone Super Admin can approve administrator removals.' })
    }

    const { id } = req.params
    const request = await AdminRemovalRequest.findById(id)
    if (!request) return res.status(404).json({ error: 'Removal request not found.' })
    if (request.status !== 'pending') {
      return res.status(400).json({ error: `This removal request has already been ${request.status}.` })
    }

    // Permanently delete target administrator
    await User.findByIdAndDelete(request.targetUserId)

    request.status = 'approved'
    request.resolvedAt = new Date()
    await request.save()

    res.json({
      success: true,
      message: `Removal request approved. Administrator ${request.targetEmail} has been deleted from Dramatone.`,
      request
    })
  } catch (err) {
    console.error('Approve removal request error:', err)
    res.status(500).json({ error: 'Failed to approve removal request' })
  }
})

// Protected Admin: Reject Removal Request (Strictly Dramatone Super Admin Only)
authRouter.post('/admin/removal-requests/:id/reject', requireAdmin, async (req, res) => {
  try {
    const defaultEmail = (process.env.DEFAULT_USER || 'lund69633@gmail.com').toLowerCase()
    const callerEmail = (req.user?.email || '').toLowerCase()

    if (callerEmail !== defaultEmail) {
      return res.status(403).json({ error: 'Access denied: Only the permanent Dramatone Super Admin can reject administrator removals.' })
    }

    const { id } = req.params
    const request = await AdminRemovalRequest.findById(id)
    if (!request) return res.status(404).json({ error: 'Removal request not found.' })
    if (request.status !== 'pending') {
      return res.status(400).json({ error: `This removal request has already been ${request.status}.` })
    }

    request.status = 'rejected'
    request.resolvedAt = new Date()
    await request.save()

    res.json({
      success: true,
      message: `Removal request for administrator ${request.targetEmail} rejected.`,
      request
    })
  } catch (err) {
    console.error('Reject removal request error:', err)
    res.status(500).json({ error: 'Failed to reject removal request' })
  }
})
