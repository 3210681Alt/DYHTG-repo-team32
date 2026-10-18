import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router'
import { Duck } from '@/components/Duck'
import LoginForm from '@/components/LoginForm'
import { PageLoading } from '@/components/States'
import { useAuth } from '@/context/auth'
import { focusPageHeading } from '@/lib/focus'
import { usePageTitle } from '@/lib/usePageTitle'

// What a page that needs a login shows to logged-out visitors: the page's own heading (so the
// navbar link stays highlighted and you know where you are) and a log in form right there.
function LoginRequired({ title, reason }) {
  usePageTitle(title)
  const location = useLocation()
  const here = location.pathname + location.search

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:py-14">
      <h1 className="text-4xl leading-none font-black tracking-tight font-wide sm:text-5xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{reason}</p>

      <div className="relative mt-14 max-w-md rounded-md border-2 border-ink bg-card p-6 shadow-brutal-lg sm:p-8">
        <Duck className="absolute -top-11 right-6 w-16" />
        <h2 className="text-2xl leading-none font-black font-wide">Log in to continue</h2>
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
      <p className="mt-6">
        New to DuckFind?{' '}
        <Link
          to={'/register?next=' + encodeURIComponent(here)}
          className="font-bold underline decoration-2 underline-offset-4"
        >
          Create an account
        </Link>
      </p>
    </div>
  )
}

// Wraps pages that need a login. Logged-out visitors stay on the page and can log in from it.
export default function RequireAuth({ title, reason, children }) {
  const { user, loading } = useAuth()
  const showedLogin = useRef(false)

  // After logging in here the form disappears, so focus moves to the page's heading instead
  useEffect(() => {
    if (!user) {
      if (!loading) showedLogin.current = true
      return
    }
    if (!showedLogin.current) return
    showedLogin.current = false
    return focusPageHeading()
  }, [user, loading])

  if (loading) return <PageLoading />
  if (!user) return <LoginRequired title={title} reason={reason} />
  return children
}
