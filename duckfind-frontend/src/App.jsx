import { lazy, Suspense, useEffect, useRef } from 'react'
import { Link, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router'
import { MoonIcon, SunIcon } from 'lucide-react'
import { toast } from 'sonner'
import duckfindIcon from '@/assets/duckfindicon.png'
import darkfindIcon from '@/assets/duckfindiconsplendid.png'
import { Duck, Waves } from '@/components/Duck'
import RequireAuth from '@/components/RequireAuth'
import { PageLoading } from '@/components/States'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/context/auth'
import { useTheme } from '@/context/theme'
import { focusPageHeading } from '@/lib/focus'
import { cn } from '@/lib/utils'
import Home from '@/pages/Home'

// The other pages download only when someone opens them, so the home page loads faster
const Jobs = lazy(() => import('@/pages/Jobs'))
const JobDetail = lazy(() => import('@/pages/JobDetail'))
const Matches = lazy(() => import('@/pages/Matches'))
const Profile = lazy(() => import('@/pages/Profile'))
const MyJobs = lazy(() => import('@/pages/MyJobs'))
const Login = lazy(() => import('@/pages/Login'))
const Register = lazy(() => import('@/pages/Register'))
const NotFound = lazy(() => import('@/pages/NotFound'))

// On phones the three links share the row equally, so a long label can wrap onto two lines
function navClass({ isActive }) {
  return cn(
    'inline-flex min-h-11 items-center justify-center rounded-md border-2 px-2 text-center text-sm leading-tight font-bold sm:px-4 sm:text-base sm:whitespace-nowrap',
    isActive ? 'border-ink bg-duck text-duck-ink shadow-brutal-sm' : 'border-transparent hover:border-ink',
  )
}

function UserMenu({ user }) {
  const { logout } = useAuth()
  const navigate = useNavigate()

  async function logOut() {
    await logout()
    toast.success('Logged out')
    navigate('/')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <span
            aria-hidden="true"
            className="grid size-6 place-items-center rounded-full border-2 border-ink bg-duck text-xs font-black text-duck-ink"
          >
            {user.name.charAt(0).toUpperCase()}
          </span>
          <span className="sr-only">Account menu for </span>
          {/* Phones show just the letter; the name is still read out to screen readers */}
          <span className="sr-only max-w-32 truncate sm:not-sr-only">{user.username}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <span className="block font-bold">{user.name}</span>
          <span className="block truncate font-normal text-muted-foreground">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/profile">Profile and skills</Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={logOut}>Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// A toggle button: screen readers hear "Dark mode, toggle button, pressed / not pressed"
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const dark = theme === 'dark'

  return (
    <Button
      variant="outline"
      size="icon"
      className="size-9 sm:size-11"
      onClick={toggleTheme}
      aria-pressed={dark}
      aria-label="Dark mode"
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {dark ? <SunIcon aria-hidden="true" /> : <MoonIcon aria-hidden="true" />}
    </Button>
  )
}

// The navbar from the first version of DuckFind: logo on the left, the main pages next to it
function Navbar() {
  const { user, loading } = useAuth()
  return (
    <header className="sticky top-0 z-40 border-b-2 border-ink bg-card">
      <nav
        aria-label="Main"
        className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-2 gap-y-3 px-5 py-3 sm:gap-x-6"
      >
        <Link to="/" className="shrink-0">
          <img src={useTheme === "dark" ? duckfindIcon : darkfindIcon} alt="Duckfind home" className="h-6 w-auto sm:h-8" />
        </Link>

        <div className="order-last grid w-full grid-cols-3 gap-2 sm:flex lg:order-none lg:ml-auto lg:w-auto">
          <NavLink to="/jobs" className={navClass}>
            Browse Internships
          </NavLink>
          <NavLink to="/matches" className={navClass}>
            My Matches
          </NavLink>
          <NavLink to="/my-jobs" className={navClass}>
            My Jobs
          </NavLink>
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2 lg:ml-0">
          <ThemeToggle />
          {loading ? null : user ? (
            <UserMenu user={user} />
          ) : (
            <>
              {/* NavLinks mark the page you're on (aria-current), styled like the main links */}
              <Button
                asChild
                variant="ghost"
                className="px-3 sm:px-4 aria-[current=page]:border-ink aria-[current=page]:bg-duck aria-[current=page]:text-duck-ink aria-[current=page]:shadow-brutal-sm"
              >
                <NavLink to="/login">Log in</NavLink>
              </Button>
              {/* Sign up is always yellow, so on its page it shows as pressed in */}
              <Button
                asChild
                className="px-3 sm:px-4 aria-[current=page]:translate-x-[2px] aria-[current=page]:translate-y-[2px] aria-[current=page]:shadow-none aria-[current=page]:underline aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-4"
              >
                <NavLink to="/register">Sign up</NavLink>
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}

// The footer is the duck pond: a wavy water line with a duck paddling along it
function Footer() {
  return (
    <footer className="mt-16 bg-water">
      <div aria-hidden="true" className="relative">
        <Duck className="absolute -top-9 right-[12%] w-14" />
        <Waves className="block h-4 w-full -translate-y-full text-water" />
      </div>
      <div className="mx-auto max-w-6xl px-5 pt-2 pb-8 text-sm text-muted-foreground">
        Jobs come from company job boards on Greenhouse. Visa sponsor status comes from the UK
        government's register of licensed sponsors.
      </div>
    </footer>
  )
}

function App() {
  const location = useLocation()
  const lastPath = useRef(location.pathname)
  const { theme } = useTheme()

  // On every page change: back to the top, and move keyboard and screen reader focus to the new heading.
  // Not on the first page load, so Tab still starts at "Skip to content".
  useEffect(() => {
    if (lastPath.current === location.pathname) return
    lastPath.current = location.pathname
    window.scrollTo(0, 0)
    return focusPageHeading()
  }, [location.pathname])

  return (
    <div className="flex min-h-svh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:border-2 focus:border-ink focus:bg-duck focus:text-duck-ink focus:px-4 focus:py-2 focus:font-bold"
      >
        Skip to content
      </a>

      <Navbar />

      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <Suspense fallback={<PageLoading />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/jobs/:id" element={<JobDetail />} />
            <Route
              path="/matches"
              element={
                <RequireAuth title="My matches" reason="Log in to see jobs that match your skills.">
                  <Matches />
                </RequireAuth>
              }
            />
            <Route
              path="/my-jobs"
              element={
                <RequireAuth title="My jobs" reason="Log in to see your saved jobs and keep track of your applications.">
                  <MyJobs />
                </RequireAuth>
              }
            />
            <Route
              path="/profile"
              element={
                <RequireAuth title="Your profile" reason="Log in to edit your skills, education and account.">
                  <Profile />
                </RequireAuth>
              }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>

      <Footer />
      <Toaster theme={theme} position="bottom-right" visibleToasts={1} />
    </div>
  )
}

export default App
