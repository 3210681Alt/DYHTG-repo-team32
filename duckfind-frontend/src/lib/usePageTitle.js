import { useEffect } from 'react'

// Sets the browser tab title, e.g. "Browse jobs – DuckFind"
export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? title + ' – DuckFind' : 'DuckFind – Find internships that fit you'
  }, [title])
}
