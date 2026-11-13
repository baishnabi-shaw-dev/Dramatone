import { useState, useEffect } from 'react'
import {
  User, LogOut, Sliders, Database, Cloud, Trash2, Film,
  ShieldCheck, Search, RefreshCw
} from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { AppRoute } from '@/components/layout/Sidebar'
import { apiClient } from '@/services/apiClient'
import { audioEngine } from '@/services/audioEngine'
import { videoAnalysisService } from '@/services/videoAnalysisService'

interface PageProps {
  isDark: boolean
  onToggleTheme: () => void
  onNavigate: (page: AppRoute) => void
}

export function SettingsPage({ isDark, onToggleTheme, onNavigate }: PageProps) {
  const currentUser = apiClient.getCurrentUser()
  const isAdmin = currentUser?.role === 'admin' || currentUser?.email?.toLowerCase() === 'admin@dramatone.ai'
  const [ducking, setDucking] = useState(audioEngine.isDialogueDuckingEnabled())
  const [autoSyncTension, setAutoSyncTension] = useState(videoAnalysisService.isAutoSyncEnabled())
  const activeProfile = audioEngine.getActiveProfile()

  useEffect(() => {
    setDucking(audioEngine.isDialogueDuckingEnabled())
    setAutoSyncTension(videoAnalysisService.isAutoSyncEnabled())
  }, [])

  const handleToggleDucking = () => {
    const next = !ducking
    setDucking(next)
    audioEngine.setDialogueDuckingEnabled(next)
  }

  const handleToggleAutoSync = () => {
    const next = !autoSyncTension
    setAutoSyncTension(next)
    videoAnalysisService.setAutoSyncTension(next)
  }

  const handleLogout = () => {
    apiClient.logout()
    onNavigate('login')
  }

  // Admin & User Management State
  const [users, setUsers] = useState<any[]>([])
  const [mailingList, setMailingList] = useState<any[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all')
  const [adminTab, setAdminTab] = useState<'users' | 'mailing-list'>('users')
  const [adminLoading, setAdminLoading] = useState(false)
  const [adminMsg, setAdminMsg] = useState<string | null>(null)

  const loadAdminData = async () => {
    setAdminLoading(true)
    try {
      const [allUsers, subscribers] = await Promise.all([
        apiClient.getAdminUsers(),
        apiClient.getMailingList()
      ])
      setUsers(allUsers)
      setMailingList(subscribers)
    } finally {
      setAdminLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      loadAdminData()
    }
  }, [isAdmin])

  const handleToggleStatus = async (user: any) => {
    const nextStatus = user.status === 'suspended' ? 'active' : 'suspended'
    try {
      await apiClient.updateUserStatus(user._id || user.id, nextStatus)
      setAdminMsg(`User ${user.email} marked as ${nextStatus}`)
      loadAdminData()
      setTimeout(() => setAdminMsg(null), 3000)
    } catch (err: any) {
      alert(err.message || 'Failed to update status')
    }
  }

  const handleToggleRole = async (user: any) => {
    const nextRole = user.role === 'admin' ? 'user' : 'admin'
    try {
      await apiClient.updateUserStatus(user._id || user.id, undefined, nextRole)
      setAdminMsg(`User ${user.email} role updated to ${nextRole.toUpperCase()}`)
      loadAdminData()
      setTimeout(() => setAdminMsg(null), 3000)
    } catch (err: any) {
      alert(err.message || 'Failed to update role')
    }
  }

  const handleDeleteUser = async (user: any) => {
    if (user.email?.toLowerCase() === 'admin@dramatone.ai') {
      alert('The Dramatone Super Admin account is permanently protected and cannot be deleted.')
      return
    }
    if (user.email?.toLowerCase() === currentUser?.email?.toLowerCase()) {
      alert('You cannot delete your own active administrator account.')
      return
    }
    if (confirm(`Are you sure you want to delete user ${user.email}? This action cannot be undone.`)) {
      try {
        await apiClient.deleteUser(user._id || user.id)
        setAdminMsg(`User ${user.email} was deleted`)
        loadAdminData()
        setTimeout(() => setAdminMsg(null), 3000)
      } catch (err: any) {
        alert(err.message || 'Failed to delete user')
      }
    }
  }

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      (u.name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(userSearch.toLowerCase())
    const matchStatus = statusFilter === 'all' || u.status === statusFilter
    return matchSearch && matchStatus
  })

  const filteredMailingList = mailingList.filter((s) => {
    return (
      (s.name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
      (s.email || '').toLowerCase().includes(userSearch.toLowerCase())
    )
  })

  const handleResetWorkspace = () => {
    if (confirm('Reset all local projects and session data? Your workspace will return to a clean blank slate.')) {
      apiClient.clearAllData()
      audioEngine.resetComposition()
      onNavigate('home')
    }
  }

  const cardClass = isDark ? 'border-white/10 bg-black/45' : 'border-white/75 bg-white/60 shadow-sm'
  const accentText = isDark ? 'text-orange-500' : 'text-indigo-600'

  return (
    <MainLayout activePage="settings" isDark={isDark} onToggleTheme={onToggleTheme} onNavigate={onNavigate} title="Settings" subtitle="Audio DSP Engine & Account Preferences">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 max-w-4xl">
        {/* User Account Card */}
        <div className={`lg:col-span-6 p-6 rounded-3xl border flex flex-col justify-between gap-5 ${cardClass}`}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold flex items-center gap-1.5">
                <User className={`w-4 h-4 ${accentText}`} />
                Studio Account
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 ${
                currentUser?.token.startsWith('local-token')
                  ? 'bg-zinc-800 text-zinc-400 border border-white/10'
                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
              }`}>
                {currentUser?.token.startsWith('local-token') ? <Database className="w-2.5 h-2.5" /> : <Cloud className="w-2.5 h-2.5" />}
                {currentUser?.token.startsWith('local-token') ? 'Offline LocalStorage' : 'MongoDB Atlas Connected'}
              </span>
            </div>

            <div className={`p-4 rounded-2xl border space-y-1.5 ${isDark ? 'border-white/10 bg-zinc-950/60' : 'border-white bg-white/80'}`}>
              <div className="text-sm font-semibold">{currentUser?.name || 'Guest Creator'}</div>
              <div className="text-xs font-mono opacity-60">{currentUser?.email || 'Not authenticated'}</div>
              <div className="text-[10px] font-mono opacity-40 pt-1">User ID: {currentUser?.id || 'ANONYMOUS'}</div>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleLogout}
              className={`w-full py-2.5 rounded-2xl border font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition ${
                isDark ? 'border-white/10 bg-white/5 text-zinc-300 hover:text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out of Studio</span>
            </button>
            <button
              onClick={handleResetWorkspace}
              className={`w-full py-2 rounded-2xl border font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition ${
                isDark ? 'border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset Local Workspace (Blank Slate)</span>
            </button>
          </div>
        </div>

        {/* Audio Engine Hardware & DSP Diagnostics */}
        <div className={`lg:col-span-6 p-6 rounded-3xl border flex flex-col justify-between gap-5 ${cardClass}`}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold flex items-center gap-1.5">
                <Sliders className={`w-4 h-4 ${accentText}`} />
                Engine & Playback Preferences
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                audioEngine.hasComposition()
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-zinc-800 text-zinc-400 border border-white/10'
              }`}>
                {audioEngine.hasComposition() ? `Cued: ${activeProfile.genre}` : 'Silent (No Track Cued)'}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {/* Dialogue Auto-Ducking */}
              <div className="flex justify-between items-center py-1 border-b border-white/10">
                <div>
                  <div className="font-medium">Dialogue Auto-Ducking (-8dB)</div>
                  <div className="text-[10px] opacity-60">Lowers score volume when scene audio is present</div>
                </div>
                <button
                  onClick={handleToggleDucking}
                  className={`px-3 py-1 rounded-full text-[10px] font-semibold cursor-pointer transition ${
                    ducking
                      ? isDark ? 'bg-amber-500 text-zinc-950' : 'bg-indigo-600 text-white'
                      : isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {ducking ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>

              {/* Video Motion Auto-Sync */}
              <div className="flex justify-between items-center py-1">
                <div>
                  <div className="font-medium flex items-center gap-1">
                    <Film className="w-3 h-3 opacity-70" />
                    Video Motion Auto-Tension
                  </div>
                  <div className="text-[10px] opacity-60">Modulates audio tension from camera movement</div>
                </div>
                <button
                  onClick={handleToggleAutoSync}
                  className={`px-3 py-1 rounded-full text-[10px] font-semibold cursor-pointer transition ${
                    autoSyncTension
                      ? isDark ? 'bg-amber-500 text-zinc-950' : 'bg-indigo-600 text-white'
                      : isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {autoSyncTension ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <div>
              <div className="text-xs font-semibold">Appearance Theme</div>
              <div className="text-[10px] opacity-60">Toggle between Dark Neon and Iridescent Light</div>
            </div>
            <button
              onClick={onToggleTheme}
              className={`px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition ${
                isDark ? 'border-white/15 bg-white/5 text-amber-300' : 'border-slate-300 bg-white text-indigo-600'
              }`}
            >
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </div>

        {/* Full-Width Admin Governance & Filtered Mailing List Card (Admin Only) */}
        {isAdmin && (
          <div className={`lg:col-span-12 p-6 rounded-3xl border space-y-4 ${cardClass}`}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-orange-400" />
              <div>
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <span>Admin User Governance &amp; Security Oversight</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                    isDark ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    Cluster Live
                  </span>
                </h2>
                <p className="text-[11px] opacity-60">
                  Manage user credentials, suspend accounts, and view filtered marketing subscribers.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {adminMsg && (
                <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {adminMsg}
                </span>
              )}

              <button
                onClick={loadAdminData}
                disabled={adminLoading}
                className={`p-1.5 rounded-lg border cursor-pointer transition ${
                  isDark ? 'border-white/10 bg-white/5 text-zinc-300 hover:text-white' : 'border-slate-300 bg-white text-slate-700'
                }`}
                title="Refresh user data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${adminLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Admin Navigation Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 bg-black/30 p-1 rounded-2xl border border-white/10 text-xs">
              <button
                onClick={() => setAdminTab('users')}
                className={`px-3 py-1 rounded-xl font-semibold cursor-pointer transition ${
                  adminTab === 'users'
                    ? isDark ? 'bg-orange-500 text-zinc-950' : 'bg-indigo-600 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                User Accounts ({users.length})
              </button>

              <button
                onClick={() => setAdminTab('mailing-list')}
                className={`px-3 py-1 rounded-xl font-semibold cursor-pointer transition ${
                  adminTab === 'mailing-list'
                    ? isDark ? 'bg-orange-500 text-zinc-950' : 'bg-indigo-600 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Filtered Mailing List ({mailingList.length})
              </button>
            </div>

            {/* Search & Filter Toolbar */}
            <div className="flex items-center gap-2">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 absolute left-2.5 opacity-50 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className={`pl-8 pr-3 py-1 rounded-xl border text-xs focus:outline-none ${
                    isDark ? 'bg-zinc-900 border-white/15 text-zinc-200' : 'bg-white border-slate-300 text-slate-800'
                  }`}
                />
              </div>

              {adminTab === 'users' && (
                <div className="flex items-center gap-1 text-[11px]">
                  {(['all', 'active', 'suspended'] as const).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setStatusFilter(filter)}
                      className={`px-2 py-0.5 rounded-lg border capitalize cursor-pointer transition ${
                        statusFilter === filter
                          ? isDark ? 'border-orange-500 bg-orange-500/20 text-orange-400' : 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : isDark ? 'border-white/10 text-zinc-400' : 'border-slate-300 text-slate-600'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* User Table / Mailing List Table */}
          {adminTab === 'users' ? (
            <div className="border border-white/10 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className={`border-b border-white/10 ${isDark ? 'bg-black/50 text-zinc-400' : 'bg-slate-100 text-slate-600'}`}>
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">User</th>
                      <th className="py-2.5 px-3 font-semibold">Role</th>
                      <th className="py-2.5 px-3 font-semibold">Status</th>
                      <th className="py-2.5 px-3 font-semibold">Registered</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center opacity-50 font-sans">
                          No users match your filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u._id || u.id} className={`${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'}`}>
                          <td className="py-2 px-3">
                            <div className="font-semibold text-white font-sans">{u.name || 'Studio User'}</div>
                            <div className="opacity-60 text-[10px]">{u.email}</div>
                          </td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              u.role === 'admin'
                                ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30'
                                : 'bg-white/10 text-zinc-400'
                            }`}>
                              {(u.role || 'user').toUpperCase()}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              u.status === 'suspended'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}>
                              {(u.status || 'active').toUpperCase()}
                            </span>
                          </td>
                          <td className="py-2 px-3 opacity-60 text-[10px]">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Just now'}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5 font-sans">
                              {/* Make Super User / Demote to User */}
                              {u.email?.toLowerCase() !== 'admin@dramatone.ai' && (
                                <button
                                  onClick={() => handleToggleRole(u)}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-medium border cursor-pointer transition ${
                                    u.role === 'admin'
                                      ? 'border-fuchsia-500/40 text-fuchsia-400 hover:bg-fuchsia-500/20'
                                      : 'border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/20'
                                  }`}
                                  title={u.role === 'admin' ? 'Demote to regular user' : 'Grant Super User Administrator rights'}
                                >
                                  {u.role === 'admin' ? 'Demote' : 'Make Admin'}
                                </button>
                              )}

                              {u.email?.toLowerCase() !== 'admin@dramatone.ai' && (
                                <button
                                  onClick={() => handleToggleStatus(u)}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-medium border cursor-pointer transition ${
                                    u.status === 'suspended'
                                      ? 'border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20'
                                      : 'border-amber-500/40 text-amber-400 hover:bg-amber-500/20'
                                  }`}
                                >
                                  {u.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                                </button>
                              )}

                              {u.email?.toLowerCase() === 'admin@dramatone.ai' || u.email?.toLowerCase() === currentUser?.email?.toLowerCase() ? (
                                <span className="text-[10px] opacity-40 px-2 py-1 font-mono">Protected</span>
                              ) : (
                                <button
                                  onClick={() => handleDeleteUser(u)}
                                  className="px-2 py-1 rounded-lg text-[10px] font-medium border border-red-500/30 text-red-400 hover:bg-red-500/20 cursor-pointer transition"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="border border-white/10 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className={`border-b border-white/10 ${isDark ? 'bg-black/50 text-zinc-400' : 'bg-slate-100 text-slate-600'}`}>
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">Subscriber</th>
                      <th className="py-2.5 px-3 font-semibold">Email</th>
                      <th className="py-2.5 px-3 font-semibold">Security Filter</th>
                      <th className="py-2.5 px-3 font-semibold">Status</th>
                      <th className="py-2.5 px-3 font-semibold">Subscribed Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                    {filteredMailingList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center opacity-50 font-sans">
                          No subscribers found.
                        </td>
                      </tr>
                    ) : (
                      filteredMailingList.map((s, idx) => (
                        <tr key={idx} className={`${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'}`}>
                          <td className="py-2 px-3 font-sans font-medium">{s.name || 'Producer'}</td>
                          <td className="py-2 px-3 text-orange-400">{s.email}</td>
                          <td className="py-2 px-3 font-sans">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                              ✓ Verified Domain (No Burner)
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              ACTIVE
                            </span>
                          </td>
                          <td className="py-2 px-3 opacity-60 text-[10px]">
                            {s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'Active'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        )}
      </div>
    </MainLayout>
  )
}
