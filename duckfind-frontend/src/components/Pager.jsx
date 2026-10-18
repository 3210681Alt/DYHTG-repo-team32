import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'

// Previous / Next links between pages of results. `linkTo(page)` builds the link for a page.
export default function Pager({ page, totalPages, linkTo }) {
  if (totalPages <= 1) return null

  return (
    <nav aria-label="Result pages" className="mt-10 flex items-center justify-between gap-4">
      {page > 1 ? (
        <Button asChild variant="outline">
          <Link to={linkTo(page - 1)}>
            <ChevronLeftIcon aria-hidden="true" />
            Previous
          </Link>
        </Button>
      ) : (
        <span />
      )}

      <p className="font-bold">
        Page {page} of {totalPages}
      </p>

      {page < totalPages ? (
        <Button asChild variant="outline">
          <Link to={linkTo(page + 1)}>
            Next
            <ChevronRightIcon aria-hidden="true" />
          </Link>
        </Button>
      ) : (
        <span />
      )}
    </nav>
  )
}
