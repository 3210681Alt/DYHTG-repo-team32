// Talks to the DuckFind backend. Every backend response looks like { status, message, ...data }.
import { toast } from 'sonner'

const OFFLINE_MESSAGE = "Can't reach DuckFind. Check the backend is running, then try again."

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

// Every failed request shows its message as a toast. `id` stops the same message stacking up
// when several requests fail at once (e.g. the backend is down).
function fail(error, silent) {
  if (!silent) toast.error(error.message, { id: error.message })
  throw error
}

// api('/jobs') or api('/auth/login', { method: 'POST', body: { identifier, password } })
// For file uploads, body can be a FormData; it's sent as it is.
// Pass silent: true for requests where failing is normal, like checking whether someone is logged in.
export async function api(path, { method = 'GET', body, silent = false } = {}) {
  const isForm = body instanceof FormData
  let response
  try {
    response = await fetch('/api' + path, {
      method,
      // sends the login cookie with every request
      credentials: 'include',
      headers: body && !isForm ? { 'Content-Type': 'application/json' } : undefined,
      body: body && !isForm ? JSON.stringify(body) : body,
    })
  } catch {
    return fail(new ApiError(0, OFFLINE_MESSAGE), silent)
  }

  let data = null
  try {
    data = await response.json()
  } catch {
    // not JSON: usually the dev server saying the backend is down
  }

  if (!response.ok) {
    if (!data) return fail(new ApiError(response.status, OFFLINE_MESSAGE), silent)
    return fail(new ApiError(response.status, data.message || 'Something went wrong. Try again.'), silent)
  }
  return data
}

// { uk: 'true', q: '' } -> "uk=true" (empty values are left out)
export function toQuery(params) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') query.set(key, value)
  }
  return query.toString()
}
