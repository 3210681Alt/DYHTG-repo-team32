import { createContext, useContext } from 'react'

export const AuthContext = createContext(null)

// const { user, login, logout } = useAuth()
export function useAuth() {
  return useContext(AuthContext)
}
