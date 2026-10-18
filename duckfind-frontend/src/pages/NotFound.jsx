import { Link } from 'react-router'
import { Duck } from '@/components/Duck'
import { Button } from '@/components/ui/button'
import { usePageTitle } from '@/lib/usePageTitle'

export default function NotFound() {
  usePageTitle('Page not found')

  return (
    <div className="mx-auto max-w-2xl px-5 py-24 text-center">
      <Duck className="mx-auto w-24 -scale-x-100" />
      <h1 className="mt-6 text-4xl leading-none font-black tracking-tight font-wide">Page not found</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        The link may be broken, or the page has waddled off.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link to="/jobs">Browse jobs</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/">Go home</Link>
        </Button>
      </div>
    </div>
  )
}
