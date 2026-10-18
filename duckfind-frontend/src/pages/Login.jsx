import { Link, Navigate, useSearchParams } from 'react-router'
import AuthCard from '@/components/AuthCard'
import LoginForm from '@/components/LoginForm'
import { useAuth } from '@/context/auth'
import { safeNext } from '@/lib/forms'
import { usePageTitle } from '@/lib/usePageTitle'

export default function Login() {
  usePageTitle('Log in')
  const { user } = useAuth()
  const [params] = useSearchParams()
  // After logging in: back to the page that asked for it, otherwise the internships page
  const next = safeNext(params.get('next'), '/jobs')

  // Logged in (already, or just now with the form below): carry on to the next page
  if (user) return <Navigate to={next} replace />

  return (
    <AuthCard
      title="Log in"
      intro="Welcome back. Log in to find internships that fit you."
      footer={
        <>
          New to DuckFind?{' '}
          <Link
            to={'/register' + (params.get('next') ? '?next=' + encodeURIComponent(next) : '')}
            className="font-bold underline decoration-2 underline-offset-4"
          >
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthCard>
  )
}
