import { useEffect, useState } from 'react'
import { ThemeContext } from './theme'

// Also read by the small script in index.html, so dark mode is on before the page first draws
const STORAGE_KEY = 'duckfind-theme'
const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)')

function savedChoice() {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    // storage can be blocked (private windows); then we just follow the device
    return null
  }
}

// Light or dark mode. Follows the device setting until someone picks one with the toggle.
export function ThemeProvider({ children }) {
  const [choice, setChoice] = useState(savedChoice)
  const [deviceDark, setDeviceDark] = useState(() => darkQuery().matches)
  const theme = choice || (deviceDark ? 'dark' : 'light')

  // Keep following the device if its setting changes while the page is open
  useEffect(() => {
    const query = darkQuery()
    const onChange = (event) => setDeviceDark(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  // The .dark class on <html> switches the colours in index.css
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setChoice(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // not saved, but still switched for this visit
    }
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}
