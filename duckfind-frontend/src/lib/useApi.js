import { useEffect, useState } from 'react'
import { api } from './api'

// Loads data from the backend whenever `path` changes.
// const { data, error, loading, retry } = useApi('/jobs?uk=true')
// Pass null as the path to skip loading. `data` keeps the previous result while the next one loads.
export function useApi(path) {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState({ key: null, data: null, error: null })
  const key = path + '#' + attempt

  useEffect(() => {
    if (!path) return
    const requestKey = path + '#' + attempt
    // Ignore the answer if the path changed before it arrived
    let cancelled = false

    api(path)
      .then((data) => {
        if (!cancelled) setResult({ key: requestKey, data, error: null })
      })
      .catch((error) => {
        if (!cancelled) setResult((previous) => ({ key: requestKey, data: previous.data, error }))
      })

    return () => {
      cancelled = true
    }
  }, [path, attempt])

  const done = result.key === key
  return {
    data: result.data,
    error: done ? result.error : null,
    loading: Boolean(path) && !done,
    retry: () => setAttempt((count) => count + 1),
  }
}
