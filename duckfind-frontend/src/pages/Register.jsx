import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { toast } from 'sonner'
import AuthCard from '@/components/AuthCard'
import FormField from '@/components/FormField'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/auth'
import { fieldForMessage, focusField, safeNext } from '@/lib/forms'
import { usePageTitle } from '@/lib/usePageTitle'

// Which field each backend message belongs to ("Username" is checked before "Name")
const MESSAGE_FIELDS = [
  ['username', /username/i],
  ['email', /email/i],
  ['password', /password/i],
  ['name', /\bname\b/i],
]

export default function Register() {
  usePageTitle('Create an account')
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  if (user && !submitting) return <Navigate to="/profile" replace />

  async function submit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setSubmitting(true)
    setError(null)
    try {
      await register({
        name: form.get('name').trim(),
        username: form.get('username').trim(),
        email: form.get('email').trim(),
        password: form.get('password'),
      })
      // New accounts go to their profile first, to add skills for matching
      const next = params.get('next')
      toast.success(next ? 'Account created' : 'Account created. Add your skills to get matches.')
      navigate(safeNext(next, '/profile'), { replace: true })
    } catch (err) {
      const field = fieldForMessage(err.message, MESSAGE_FIELDS)
      setError({ message: err.message, field })
      setSubmitting(false)
      if (field) focusField('register-' + field)
    }
  }

  const fieldError = (field) => (error && error.field === field ? error.message : null)

  return (
    <AuthCard
      title="Create your account"
      intro="Save your skills and get jobs matched to you."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-bold underline decoration-2 underline-offset-4">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate className="grid gap-5">
        {error && !error.field && (
          <p className="rounded-md border-2 border-stamp p-3 font-bold text-stamp">{error.message}</p>
        )}
        <FormField
          id="register-name"
          name="name"
          label="Name"
          autoComplete="name"
          required
          error={fieldError('name')}
        />
        <FormField
          id="register-username"
          name="username"
          label="Username"
          autoComplete="username"
          hint="3 to 30 letters, numbers or underscores."
          required
          error={fieldError('username')}
        />
        <FormField
          id="register-email"
          name="email"
          type="email"
          label="Email"
          autoComplete="email"
          required
          error={fieldError('email')}
        />
        <FormField
          id="register-password"
          name="password"
          type="password"
          label="Password"
          autoComplete="new-password"
          hint="At least 8 characters."
          required
          error={fieldError('password')}
        />
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthCard>
  )
}
