import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { AuthContext } from './auth'

// Keeps track of who is logged in. The login itself is a cookie the backend sets.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // true until we know whether someone is logged in
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // silent: being logged out isn't an error
    api('/auth/checkAuth', { silent: true })
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  async function login(identifier, password) {
    const data = await api('/auth/login', { method: 'POST', body: { identifier, password } })
    setUser(data.user)
    return data
  }

  async function register(details) {
    const data = await api('/auth/register', { method: 'POST', body: details })
    setUser(data.user)
    return data
  }

  async function logout() {
    try {
      await api('/auth/logout', { method: 'POST' })
    } finally {
      setUser(null)
    }
  }

  // After the profile changes (email, skills), so the rest of the app sees it
  function updateUser(changes) {
    setUser((current) => (current ? { ...current, ...changes } : current))
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}
