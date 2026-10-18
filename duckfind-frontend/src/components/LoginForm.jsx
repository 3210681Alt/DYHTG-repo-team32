import { useState } from 'react'
import { toast } from 'sonner'
import FormField from '@/components/FormField'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/auth'
import { fieldForMessage, focusField } from '@/lib/forms'

// The log in form. Used on the log in page, and inside pages that need a login (see RequireAuth),
// where the page's content appears as soon as you're logged in.
export default function LoginForm() {
  const { login } = useAuth()
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function submit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setSubmitting(true)
    setError(null)
    try {
      await login(form.get('identifier').trim(), form.get('password'))
      toast.success('Logged in')
    } catch (err) {
      const field = fieldForMessage(err.message, [
        ['identifier', /^email or username/i],
        ['password', /^password/i],
      ])
      setError({ message: err.message, field })
      setSubmitting(false)
      focusField(field ? 'login-' + field : 'login-identifier')
    }
  }

  const fieldError = (field) => (error && error.field === field ? error.message : null)

  return (
    <form onSubmit={submit} noValidate className="grid gap-5">
      {error && !error.field && (
        <p className="rounded-md border-2 border-stamp p-3 font-bold text-stamp">{error.message}</p>
      )}
      <FormField
        id="login-identifier"
        name="identifier"
        label="Email or username"
        autoComplete="username"
        required
        error={fieldError('identifier')}
      />
      <FormField
        id="login-password"
        name="password"
        type="password"
        label="Password"
        autoComplete="current-password"
        required
        error={fieldError('password')}
      />
      <Button type="submit" size="lg" disabled={submitting}>
        {submitting ? 'Logging in…' : 'Log in'}
      </Button>
    </form>
  )
}
