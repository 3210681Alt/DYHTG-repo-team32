import { createContext, useContext } from 'react'

export const MyJobsContext = createContext(null)

// The logged-in user's saved, hidden ("Not interested") and applied jobs, plus actions to change them.
// const { isSaved, toggleSaved, hide, applicationStatus, setStatus } = useMyJobs()
export function useMyJobs() {
  return useContext(MyJobsContext)
}
