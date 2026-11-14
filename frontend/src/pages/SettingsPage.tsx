import { useState, useEffect } from 'react'
import {
  User, LogOut, Sliders, Database, Cloud, Trash2, Film,
  ShieldCheck, Search, RefreshCw, Crown, AlertTriangle, Check, X, ShieldAlert
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

const SUPER_ADMIN_EMAIL = 'lund69633@gmail.com'

export function SettingsPage({ isDark, onToggleTheme, onNavigate }: PageProps) {
  const currentUser = apiClient.getCurrentUser()
  const currentEmail = (currentUser?.email || '').toLowerCase()
  const isSuperAdmin = currentEmail === SUPER_ADMIN_EMAIL || (currentUser as any)?.isSuperAdmin
  const isAdmin = currentUser?.role === 'admin' || isSuperAdmin || currentEmail === 'admin@dramatone.ai'
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
  const [removalRequests, setRemovalRequests] = useState<any[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all')
  const [adminTab, setAdminTab] = useState<'users' | 'removals' | 'mailing-list'>('users')
  const [adminLoading, setAdminLoading] = useState(false)
  const [adminMsg, setAdminMsg] = useState<string | null>(null)

  // Removal Request Modal State
  const [removalTargetUser, setRemovalTargetUser] = useState<any | null>(null)
  const [removalReasonText, setRemovalReasonText] = useState('')
  const [submittingRemoval, setSubmittingRemoval] = useState(false)

  const loadAdminData = async () => {
    setAdminLoading(true)
    try {
      const [allUsers, subscribers, requests] = await Promise.all([
        apiClient.getAdminUsers(),
        apiClient.getMailingList(),
        apiClient.getRemovalRequests()
      ])
      setUsers(allUsers)
      setMailingList(subscribers)
      setRemovalRequests(requests)
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
    if (user.email?.toLowerCase() === SUPER_ADMIN_EMAIL || user.isSuperAdmin) {
      alert('The Dramatone Super Admin account status cannot be altered.')
      return
    }
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
    if (user.email?.toLowerCase() === SUPER_ADMIN_EMAIL || user.isSuperAdmin) {
      alert('The Dramatone Super Admin account cannot be demoted.')
      return
    }
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
    const targetEmail = (user.email || '').toLowerCase()
    if (targetEmail === SUPER_ADMIN_EMAIL || user.isSuperAdmin) {
      alert('The Dramatone Super Admin account is permanently protected and cannot be deleted.')
      return
    }
    if (targetEmail === currentEmail) {
      alert('You cannot delete your own active administrator account.')
      return
    }

    // If target is an admin and current caller is NOT Super Admin, enforce removal request flow
    if (user.role === 'admin' && !isSuperAdmin) {
      setRemovalTargetUser(user)
      setRemovalReasonText('')
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

  const handleSubmitRemovalRequest = async () => {
    if (!removalTargetUser) return
    if (!removalReasonText.trim() || removalReasonText.trim().length < 8) {
      alert('Please provide a proper, detailed reason for removing this administrator (minimum 8 characters).')
      return
    }

    setSubmittingRemoval(true)
    try {
      await apiClient.submitRemovalRequest(removalTargetUser._id || removalTargetUser.id, removalReasonText.trim())
      setAdminMsg(`Removal request for ${removalTargetUser.email} submitted for Super Admin review`)
      setRemovalTargetUser(null)
      setRemovalReasonText('')
      loadAdminData()
      setTimeout(() => setAdminMsg(null), 4000)
    } catch (err: any) {
      alert(err.message || 'Failed to submit removal request')
    } finally {
      setSubmittingRemoval(false)
    }
  }

  const handleApproveRemoval = async (requestId: string) => {
    if (!confirm('Approve removal? This will PERMANENTLY delete the targeted administrator account.')) return
    try {
      await apiClient.approveRemovalRequest(requestId)
      setAdminMsg('Admin removal approved and executed.')
      loadAdminData()
      setTimeout(() => setAdminMsg(null), 3000)
    } catch (err: any) {
      alert(err.message || 'Failed to approve removal')
    }
  }

  const handleRejectRemoval = async (requestId: string) => {
    try {
      await apiClient.rejectRemovalRequest(requestId)
      setAdminMsg('Admin removal request rejected.')
      loadAdminData()
      setTimeout(() => setAdminMsg(null), 3000)
    } catch (err: any) {
      alert(err.message || 'Failed to reject removal')
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
            <div className="flex flex-wrap items-center gap-1.5 bg-black/30 p-1 rounded-2xl border border-white/10 text-xs">
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
                onClick={() => setAdminTab('removals')}
                className={`px-3 py-1 rounded-xl font-semibold cursor-pointer transition flex items-center gap-1.5 ${
                  adminTab === 'removals'
                    ? isDark ? 'bg-orange-500 text-zinc-950' : 'bg-indigo-600 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <ShieldAlert className="w-3 h-3" />
                <span>Admin Removal Requests</span>
                {removalRequests.filter((r) => r.status === 'pending').length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-black font-extrabold text-[9px]">
                    {removalRequests.filter((r) => r.status === 'pending').length}
                  </span>
                )}
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

          {/* TAB 1: USER ACCOUNTS TABLE */}
          {adminTab === 'users' && (
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
                      filteredUsers.map((u) => {
                        const targetIsSuperAdmin = u.isSuperAdmin || u.email?.toLowerCase() === SUPER_ADMIN_EMAIL
                        const isSelf = u.email?.toLowerCase() === currentEmail

                        return (
                          <tr key={u._id || u.id} className={`${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'}`}>
                            <td className="py-2 px-3">
                              <div className="font-semibold text-white font-sans flex items-center gap-1.5">
                                <span>{u.name || 'Studio User'}</span>
                                {targetIsSuperAdmin && (
                                  <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                                )}
                              </div>
                              <div className="opacity-60 text-[10px]">{u.email}</div>
                            </td>
                            <td className="py-2 px-3">
                              {targetIsSuperAdmin ? (
                                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-400/20 text-amber-300 border border-amber-400/50 flex items-center gap-1 w-fit">
                                  ⭐ SUPER ADMIN
                                </span>
                              ) : (
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  u.role === 'admin'
                                    ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30'
                                    : 'bg-white/10 text-zinc-400'
                                }`}>
                                  {(u.role || 'user').toUpperCase()}
                                </span>
                              )}
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
                                {targetIsSuperAdmin ? (
                                  <span className="text-[10px] font-mono text-amber-400 font-bold px-2 py-1 bg-amber-400/10 rounded-lg border border-amber-400/30">
                                    Permanent Super Admin
                                  </span>
                                ) : isSelf ? (
                                  <span className="text-[10px] opacity-40 px-2 py-1 font-mono">Active Account</span>
                                ) : (
                                  <>
                                    {/* Role toggle */}
                                    <button
                                      onClick={() => handleToggleRole(u)}
                                      className={`px-2 py-1 rounded-lg text-[10px] font-medium border cursor-pointer transition ${
                                        u.role === 'admin'
                                          ? 'border-fuchsia-500/40 text-fuchsia-400 hover:bg-fuchsia-500/20'
                                          : 'border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/20'
                                      }`}
                                      title={u.role === 'admin' ? 'Demote to regular user' : 'Grant Admin privileges'}
                                    >
                                      {u.role === 'admin' ? 'Demote' : 'Make Admin'}
                                    </button>

                                    {/* Status toggle */}
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

                                    {/* Delete or Request Removal */}
                                    {u.role === 'admin' && !isSuperAdmin ? (
                                      <button
                                        onClick={() => handleDeleteUser(u)}
                                        title="Submit formal removal request with reason to Super Admin"
                                        className="px-2 py-1 rounded-lg text-[10px] font-semibold border border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 cursor-pointer flex items-center gap-1 transition"
                                      >
                                        <AlertTriangle className="w-3 h-3" />
                                        <span>Request Removal</span>
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleDeleteUser(u)}
                                        className="px-2 py-1 rounded-lg text-[10px] font-medium border border-red-500/30 text-red-400 hover:bg-red-500/20 cursor-pointer transition"
                                      >
                                        Delete
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: ADMIN REMOVAL REQUESTS TABLE */}
          {adminTab === 'removals' && (
            <div className="border border-white/10 rounded-2xl overflow-hidden space-y-3">
              <div className="p-3 border-b border-white/10 flex items-center justify-between bg-black/40 text-xs">
                <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>Admin Removal Request Queue ({removalRequests.length})</span>
                </span>
                <span className="text-[10px] opacity-60 font-mono">
                  Super Admin Approval Required
                </span>
              </div>

              {removalRequests.length === 0 ? (
                <div className="py-10 text-center text-xs opacity-50 font-sans">
                  No administrator removal requests submitted.
                </div>
              ) : (
                <div className="divide-y divide-white/5 font-mono text-xs p-2">
                  {removalRequests.map((req) => (
                    <div key={req._id || req.id} className="p-3 rounded-xl hover:bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white font-sans">{req.targetName}</span>
                          <span className="text-[11px] text-orange-400 font-mono">({req.targetEmail})</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            req.status === 'pending'
                              ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 animate-pulse'
                              : req.status === 'approved'
                              ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/40'
                              : 'bg-red-400/20 text-red-300 border border-red-400/40'
                          }`}>
                            {req.status}
                          </span>
                        </div>

                        <div className="text-[11px] font-sans opacity-80 pl-2 border-l-2 border-amber-500/50">
                          <span className="font-semibold text-zinc-300">Stated Reason: </span>
                          "{req.reason}"
                        </div>

                        <div className="text-[10px] opacity-50 flex items-center gap-3">
                          <span>Requested by: {req.requestedByName} ({req.requestedByEmail})</span>
                          <span>•</span>
                          <span>{req.createdAt ? new Date(req.createdAt).toLocaleString() : 'Recent'}</span>
                        </div>
                      </div>

                      {/* Action buttons (Strictly Dramatone Super Admin) */}
                      {req.status === 'pending' && (
                        <div className="flex items-center gap-2 shrink-0 font-sans">
                          {isSuperAdmin ? (
                            <>
                              <button
                                onClick={() => handleApproveRemoval(req._id || req.id)}
                                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition shadow-sm"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Approve Removal</span>
                              </button>
                              <button
                                onClick={() => handleRejectRemoval(req._id || req.id)}
                                className="px-3 py-1.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs flex items-center gap-1 cursor-pointer transition"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] font-mono opacity-60 px-2 py-1 bg-white/5 rounded-lg border border-white/10">
                              Awaiting Super Admin Decision
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: FILTERED MAILING LIST */}
          {adminTab === 'mailing-list' && (
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

        {/* MODAL: Request Removal of Another Admin */}
        {removalTargetUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
            <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl space-y-4 ${
              isDark ? 'bg-zinc-950 border-amber-500/40 text-white' : 'bg-white border-slate-300 text-slate-900'
            }`}>
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-bold">Request Admin Removal</h3>
                </div>
                <button
                  onClick={() => setRemovalTargetUser(null)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
                  <span className="font-bold">Target Administrator:</span> {removalTargetUser.name} ({removalTargetUser.email})
                </div>

                <p className="opacity-70 leading-relaxed">
                  Under Dramatone security governance, administrators cannot directly delete peer administrators.
                  Please provide a detailed justification. This request will be submitted directly to the <strong>Dramatone Super Admin</strong> for final authorization.
                </p>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-zinc-300">
                    Reason for Removal (Required, min 8 characters):
                  </label>
                  <textarea
                    rows={3}
                    value={removalReasonText}
                    onChange={(e) => setRemovalReasonText(e.target.value)}
                    placeholder="Describe specific grounds for removal (e.g., policy violation, role transfer, unauthorized activity)..."
                    className={`w-full rounded-xl border p-2.5 text-xs resize-none focus:outline-none ${
                      isDark ? 'bg-black/60 border-white/15 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  onClick={() => setRemovalTargetUser(null)}
                  className="px-3 py-1.5 rounded-xl text-xs opacity-70 hover:opacity-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitRemovalRequest}
                  disabled={submittingRemoval || removalReasonText.trim().length < 8}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    removalReasonText.trim().length >= 8
                      ? 'bg-amber-400 text-zinc-950 hover:bg-amber-300 shadow-sm'
                      : 'opacity-40 cursor-not-allowed bg-zinc-800 text-zinc-500'
                  }`}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{submittingRemoval ? 'Submitting...' : 'Submit to Super Admin'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
