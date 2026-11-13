// Dramatone Full-Stack API Client with Secure 2FA & Server Verification

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export interface UserProfile {
  id: string
  name: string
  email: string
  token: string
  role?: string
  status?: string
}

export interface SoundscapeProject {
  id: string
  title: string
  genre: string
  mood: string
  bpm: number
  tension: number
  stems: Array<{ id: string; name: string; volume: number; muted: boolean; solo: boolean }>
  createdAt: string
  syncedToCloud: boolean
}

class ApiClient {
  private token: string | null = null
  private currentUser: UserProfile | null = null

  constructor() {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('dramatone_user')
      if (savedUser) {
        try {
          this.currentUser = JSON.parse(savedUser)
          this.token = this.currentUser?.token || null
        } catch {
          // Ignore parse errors
        }
      }
    }
  }

  public getCurrentUser(): UserProfile | null {
    return this.currentUser
  }

  public logout() {
    this.token = null
    this.currentUser = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dramatone_user')
    }
  }

  public clearAllData() {
    this.token = null
    this.currentUser = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dramatone_user')
      localStorage.removeItem('dramatone_projects')
      localStorage.removeItem('dramatone_sidebar_width')
      localStorage.removeItem('dramatone_gen_takes')
      localStorage.removeItem('dramatone_gen_prompt')
      localStorage.removeItem('dramatone_gen_genre')
      localStorage.removeItem('dramatone_gen_mood')
      localStorage.removeItem('dramatone_gen_bpm')
    }
  }

  // --- AUTHENTICATION ---

  // Registration Step 1: Send registration OTP (blocks disposable emails & validates password)
  public async sendSignupOtp(name: string, email: string, password: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/send-signup-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    })

    if (res.ok) return await res.json()
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.error || 'Failed to send registration code')
  }

  // Registration Step 2: Verify registration OTP & create user account
  public async verifySignupOtp(email: string, otp: string): Promise<UserProfile> {
    const res = await fetch(`${API_BASE_URL}/auth/verify-signup-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    })

    if (res.ok) {
      const data = await res.json()
      const user: UserProfile = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        token: data.token,
        role: data.user.role || (email.toLowerCase() === 'admin@dramatone.ai' ? 'admin' : 'user'),
        status: data.user.status || 'active'
      }
      this.saveAuth(user)
      return user
    } else {
      const errData = await res.json().catch(() => ({}))
      throw new Error(errData.error || 'Invalid or expired verification code')
    }
  }

  public async signup(name: string, email: string, password: string): Promise<UserProfile> {
    const res = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    })

    if (res.ok) {
      const data = await res.json()
      const user: UserProfile = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        token: data.token,
        role: data.user.role || (email.toLowerCase() === 'admin@dramatone.ai' ? 'admin' : 'user'),
        status: data.user.status || 'active'
      }
      this.saveAuth(user)
      return user
    } else {
      const errData = await res.json().catch(() => ({}))
      throw new Error(errData.error || 'Failed to create account')
    }
  }

  // Step 1: Enter email & password -> Server verifies password & sends OTP to email
  public async login(email: string, password: string): Promise<{ requireOtp: boolean; email: string; message: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    if (res.ok) {
      const data = await res.json()
      return {
        requireOtp: true,
        email: data.email || email,
        message: data.message || 'Verification code sent to your email.'
      }
    } else {
      const errData = await res.json().catch(() => ({}))
      throw new Error(errData.error || 'Invalid email or password')
    }
  }

  // Step 2: Verify 6-digit OTP sent to email and receive final session token
  public async verifyLogin2FA(email: string, otp: string): Promise<UserProfile> {
    const res = await fetch(`${API_BASE_URL}/auth/verify-login-2fa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    })

    if (res.ok) {
      const data = await res.json()
      const user: UserProfile = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        token: data.token,
        role: data.user.role || (email.toLowerCase() === 'admin@dramatone.ai' ? 'admin' : 'user'),
        status: data.user.status || 'active'
      }
      this.saveAuth(user)
      return user
    } else {
      const errData = await res.json().catch(() => ({}))
      throw new Error(errData.error || 'Invalid or expired verification code')
    }
  }

  // Resend Login OTP
  public async resendLoginOtp(email: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/resend-login-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })

    if (res.ok) return await res.json()
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.error || 'Failed to resend verification code')
  }

  private saveAuth(user: UserProfile) {
    this.currentUser = user
    this.token = user.token
    localStorage.setItem('dramatone_user', JSON.stringify(user))
  }

  // --- PROJECTS ---

  public async getProjects(): Promise<SoundscapeProject[]> {
    try {
      if (this.token && !this.token.startsWith('local-token')) {
        const res = await fetch(`${API_BASE_URL}/projects`, {
          headers: { Authorization: `Bearer ${this.token}` }
        })
        if (res.ok) {
          const data = await res.json()
          return data.map((p: any) => ({
            id: p._id || p.id,
            title: p.title,
            genre: p.genre,
            mood: p.mood,
            bpm: p.bpm,
            tension: p.tension,
            stems: p.stems || [],
            createdAt: p.createdAt || new Date().toISOString(),
            syncedToCloud: true
          }))
        }
      }
    } catch {
      // Fallback
    }

    const local = localStorage.getItem('dramatone_projects')
    if (local) {
      try {
        return JSON.parse(local)
      } catch {
        return []
      }
    }

    return []
  }

  public async saveProject(project: Omit<SoundscapeProject, 'id' | 'createdAt' | 'syncedToCloud'>): Promise<SoundscapeProject> {
    let savedToCloud = false
    let newId = `local-${Date.now()}`

    try {
      if (this.token && !this.token.startsWith('local-token')) {
        const res = await fetch(`${API_BASE_URL}/projects`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.token}`
          },
          body: JSON.stringify(project)
        })
        if (res.ok) {
          const data = await res.json()
          newId = data._id || data.id
          savedToCloud = true
        }
      }
    } catch {
      savedToCloud = false
    }

    const newProject: SoundscapeProject = {
      ...project,
      id: newId,
      createdAt: new Date().toISOString(),
      syncedToCloud: savedToCloud
    }

    const existing = await this.getProjects()
    const updated = [newProject, ...existing.filter((p) => p.id !== newProject.id)]
    localStorage.setItem('dramatone_projects', JSON.stringify(updated))

    return newProject
  }

  public async deleteProject(id: string): Promise<void> {
    try {
      if (this.token && !this.token.startsWith('local-token')) {
        await fetch(`${API_BASE_URL}/projects/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${this.token}` }
        })
      }
    } catch {
      // Offline fallback
    }

    const existing = await this.getProjects()
    const updated = existing.filter((p) => p.id !== id)
    localStorage.setItem('dramatone_projects', JSON.stringify(updated))
  }

  // --- FORGOT PASSWORD & RESET ---
  public async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })
    if (res.ok) return await res.json()
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Failed to send password reset code')
  }

  public async verifyOtp(email: string, otp: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    })
    if (res.ok) return await res.json()
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Invalid verification code')
  }

  public async resetPassword(email: string, otp: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, newPassword })
    })
    if (res.ok) return await res.json()
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || 'Failed to reset password')
  }

  // --- ADMIN & FILTERED MAILING LIST ---
  public async getMailingList(status?: string, search?: string): Promise<any[]> {
    try {
      const params = new URLSearchParams()
      if (status) params.append('status', status)
      if (search) params.append('search', search)
      const res = await fetch(`${API_BASE_URL}/auth/mailing-list?${params.toString()}`, {
        headers: this.token ? { Authorization: `Bearer ${this.token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        return data.subscribers || []
      }
    } catch {}
    const user = this.getCurrentUser()
    return user ? [{ name: user.name, email: user.email, status: 'active', createdAt: new Date().toISOString() }] : []
  }

  public async getAdminUsers(): Promise<any[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/admin/users`, {
        headers: this.token ? { Authorization: `Bearer ${this.token}` } : {}
      })
      if (res.ok) return await res.json()
    } catch {}
    const user = this.getCurrentUser()
    return user ? [{ id: user.id, name: user.name, email: user.email, role: 'admin', status: 'active', createdAt: new Date().toISOString() }] : []
  }

  public async updateUserStatus(id: string, status?: string, role?: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/auth/admin/users/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {})
      },
      body: JSON.stringify({ status, role })
    })
    if (res.ok) return await res.json()
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.error || 'Failed to update user')
  }

  public async deleteUser(id: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/auth/admin/users/${id}`, {
      method: 'DELETE',
      headers: this.token ? { Authorization: `Bearer ${this.token}` } : {}
    })
    if (res.ok) return await res.json()
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.error || 'Failed to delete user')
  }
}

export const apiClient = new ApiClient()
