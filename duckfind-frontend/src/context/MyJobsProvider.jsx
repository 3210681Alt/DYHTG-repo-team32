import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { statusLabel } from '@/lib/applications'
import { useAuth } from './auth'
import { MyJobsContext } from './myJobs'

const EMPTY = { userId: null, saved: new Set(), hidden: new Set(), applications: new Map() }

// Keeps track of which jobs the logged-in user saved, hid or applied to, so every card and page
// shows the right buttons. Changes show straight away and are undone if the request fails
// (the error itself is shown as a toast by lib/api.js).
export function MyJobsProvider({ children }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [state, setState] = useState(EMPTY)
  const userId = user?.id

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    Promise.all([api('/profile/saved-jobs'), api('/profile/hidden-jobs'), api('/profile/applications')])
      .then(([saved, hidden, applied]) => {
        if (cancelled) return
        setState({
          userId,
          saved: new Set(saved.savedJobs.map((item) => item.jobId)),
          hidden: new Set(hidden.hiddenJobs.map((item) => item.jobId)),
          applications: new Map(applied.applications.map((item) => [item.jobId, item.status])),
        })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [userId])

  // Nothing is tracked while logged out (or before this user's lists have loaded)
  const current = userId && state.userId === userId ? state : EMPTY

  function update(change) {
    setState((previous) => {
      const next = {
        ...previous,
        saved: new Set(previous.saved),
        hidden: new Set(previous.hidden),
        applications: new Map(previous.applications),
      }
      change(next)
      return next
    })
  }

  // Logged-out visitors are sent to log in first, then brought back
  function needsLogin(what) {
    if (userId) return false
    toast('Log in to ' + what)
    navigate('/login?next=' + encodeURIComponent(location.pathname + location.search))
    return true
  }

  // Shows the change, sends it, and puts things back if it fails
  async function change(apply, undo, request) {
    update(apply)
    try {
      await request()
      return true
    } catch {
      update(undo)
      return false
    }
  }

  async function toggleSaved(job) {
    if (needsLogin('save jobs')) return
    if (current.saved.has(job.id)) {
      const ok = await change(
        (s) => s.saved.delete(job.id),
        (s) => s.saved.add(job.id),
        () => api('/profile/saved-jobs/' + job.id, { method: 'DELETE' }),
      )
      if (ok) toast.success('Removed from saved jobs')
    } else {
      const ok = await change(
        (s) => s.saved.add(job.id),
        (s) => s.saved.delete(job.id),
        () => api('/profile/saved-jobs', { method: 'POST', body: { jobId: job.id } }),
      )
      if (ok) {
        toast.success('Saved ' + job.title, {
          action: { label: 'View saved', onClick: () => navigate('/my-jobs?tab=saved') },
        })
      }
    }
  }

  async function hide(job) {
    if (needsLogin('hide jobs')) return
    const ok = await change(
      (s) => s.hidden.add(job.id),
      (s) => s.hidden.delete(job.id),
      () => api('/profile/hidden-jobs', { method: 'POST', body: { jobId: job.id } }),
    )
    if (ok) {
      toast('Hidden: ' + job.title, {
        description: "You won't see it in your job lists.",
        action: { label: 'Undo', onClick: () => unhide(job) },
      })
    }
  }

  async function unhide(job) {
    const ok = await change(
      (s) => s.hidden.delete(job.id),
      (s) => s.hidden.add(job.id),
      () => api('/profile/hidden-jobs/' + job.id, { method: 'DELETE' }),
    )
    if (ok) toast.success('Showing ' + job.title + ' again')
  }

  async function markApplied(job) {
    if (needsLogin('track applications')) return
    const ok = await change(
      (s) => s.applications.set(job.id, 'applied'),
      (s) => s.applications.delete(job.id),
      () => api('/profile/applications', { method: 'POST', body: { jobId: job.id } }),
    )
    if (ok) {
      toast.success('Added to your applications', {
        action: { label: 'View', onClick: () => navigate('/my-jobs?tab=applied') },
      })
    }
  }

  async function setStatus(job, status) {
    const before = current.applications.get(job.id)
    const ok = await change(
      (s) => s.applications.set(job.id, status),
      (s) => s.applications.set(job.id, before),
      () => api('/profile/applications/' + job.id, { method: 'PATCH', body: { status } }),
    )
    if (ok) toast.success(job.title + ': ' + statusLabel(status))
  }

  async function removeApplication(job) {
    const before = current.applications.get(job.id)
    const ok = await change(
      (s) => s.applications.delete(job.id),
      (s) => s.applications.set(job.id, before),
      () => api('/profile/applications/' + job.id, { method: 'DELETE' }),
    )
    if (ok) toast.success('Removed from your applications')
  }

  const value = {
    loggedIn: Boolean(userId),
    isSaved: (id) => current.saved.has(id),
    isHidden: (id) => current.hidden.has(id),
    applicationStatus: (id) => current.applications.get(id) || null,
    toggleSaved,
    hide,
    unhide,
    markApplied,
    setStatus,
    removeApplication,
  }

  return <MyJobsContext.Provider value={value}>{children}</MyJobsContext.Provider>
}
