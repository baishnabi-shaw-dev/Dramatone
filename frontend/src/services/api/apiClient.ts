// Dramatone Full-Stack API Client with Zero-Fail Offline LocalStorage Fallback

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export interface UserProfile {
  id: string
  name: string
  email: string
  token: string
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

  public async signup(name: string, email: string, password: string): Promise<UserProfile> {
    try {
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
          token: data.token
        }
        this.saveAuth(user)
        return user
      }
    } catch {
      // Backend offline: transparent fallback to LocalStorage
      console.warn('Backend server offline. Using LocalStorage fallback.')
    }

    // Local fallback user creation
    const fallbackUser: UserProfile = {
      id: `local-${Date.now()}`,
      name: name || 'Dramatone Producer',
      email,
      token: `local-token-${Date.now()}`
    }
    this.saveAuth(fallbackUser)
    return fallbackUser
  }

  public async login(email: string, password: string): Promise<UserProfile> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      if (res.ok) {
        const data = await res.json()
        const user: UserProfile = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          token: data.token
        }
        this.saveAuth(user)
        return user
      }
    } catch {
      console.warn('Backend server offline. Using LocalStorage fallback.')
    }

    // Local fallback user login
    const fallbackUser: UserProfile = {
      id: `local-${Date.now()}`,
      name: email.split('@')[0] || 'Studio Artist',
      email,
      token: `local-token-${Date.now()}`
    }
    this.saveAuth(fallbackUser)
    return fallbackUser
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

    // Read from localStorage (returns empty array if no saved projects)
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

    // Always persist to local cache as well
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
}

export const apiClient = new ApiClient()

