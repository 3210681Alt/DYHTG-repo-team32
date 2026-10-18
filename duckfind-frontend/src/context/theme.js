import { createContext, useContext } from 'react'

export const ThemeContext = createContext(null)

// const { theme, toggleTheme } = useTheme()   theme is 'light' or 'dark'
export function useTheme() {
  return useContext(ThemeContext)
}
