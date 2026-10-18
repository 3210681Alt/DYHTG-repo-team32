import { Link, useNavigate } from 'react-router'
import { Duck, Waves } from '@/components/Duck'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toQuery } from '@/lib/api'
import { usePageTitle } from '@/lib/usePageTitle'

// Shortcuts into Browse with a filter already set
const shortcuts = [
  ['Internships', '/jobs?seniority=intern'],
  ['Graduate roles', '/jobs?seniority=graduate'],
  ['Visa sponsors', '/jobs?sponsors=true'],
  ['Remote', '/jobs?workplace=remote'],
]

export default function Home() {
  usePageTitle(null)
  const navigate = useNavigate()

  function search(event) {
    event.preventDefault()
    const keywords = new FormData(event.currentTarget).get('keywords').trim()
    navigate('/jobs' + (keywords ? '?' + toQuery({ keywords }) : ''))
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-16 text-center sm:py-24">
      {/* The duck bobs on the pond a few times when the page opens */}
      <div aria-hidden="true" className="mx-auto mb-8 w-36">
        <Duck className="relative z-10 mx-auto w-20 animate-duck-bob-once" />
        <Waves count={5} className="-mt-3 block h-3 w-full text-water" />
      </div>

      <p className="text-sm font-bold tracking-[0.15em] text-balance text-gold">INTERNSHIPS, PERSONALISED FOR YOU</p>

      <h1 className="mt-5 text-[clamp(2.5rem,7vw,4.5rem)] leading-[0.95] font-black tracking-tight text-balance font-wide">
        Find internships that actually fit you.
      </h1>

      <p className="mx-auto mt-6 max-w-[650px] text-lg leading-relaxed text-muted-foreground sm:text-[19px]">
        Tell us about yourself and we'll compare opportunities
        from multiple sources to find your best matches.
      </p>

      <Button asChild size="lg" className="mt-9 px-7 text-[17px] shadow-brutal">
        <Link to="/matches">Find My Matches →</Link>
      </Button>

      <form role="search" onSubmit={search} className="mx-auto mt-16 flex max-w-xl gap-3 text-left">
        <Label htmlFor="home-search" className="sr-only">
          Search jobs
        </Label>
        <Input id="home-search" name="keywords" placeholder="Search jobs, e.g. data analyst" />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      <nav aria-label="Popular searches" className="mt-5 flex flex-wrap justify-center gap-3">
        {shortcuts.map(([label, to]) => (
          <Button key={to} asChild variant="secondary" size="sm">
            <Link to={to}>{label}</Link>
          </Button>
        ))}
      </nav>
    </div>
  )
}
