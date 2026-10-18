import { Duck } from '@/components/Duck'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export function PageLoading() {
  return (
    <div role="status" className="grid justify-items-center gap-3 py-24 font-bold text-muted-foreground">
      <Duck className="w-14 animate-duck-bob" />
      Loading…
    </div>
  )
}

// Shown when the backend couldn't answer. The message comes from the backend or lib/api.js.
export function ErrorState({ message, onRetry }) {
  return (
    <div
      className="rounded-md border-2 border-stamp bg-card p-6 shadow-[4px_4px_0_0_var(--stamp)]"
    >
      <p className="font-bold text-stamp">{message}</p>
      {onRetry && (
        <Button className="mt-4" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}

// Shown when there is nothing to list, with what to do next
export function EmptyState({ title, children, action }) {
  return (
    <div className="rounded-md border-2 border-dashed border-ink bg-card p-8 text-center">
      <Duck className="mx-auto mb-4 w-14" />
      <p className="text-lg font-extrabold">{title}</p>
      {children && <div className="mx-auto mt-2 max-w-prose text-muted-foreground">{children}</div>}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  )
}

// Grey placeholder cards while results load
export function JobListSkeleton({ count = 4 }) {
  const cards = []
  for (let i = 0; i < count; i++) {
    cards.push(
      <li key={i} className="rounded-md border-2 border-ink/20 bg-card p-5">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="mt-3 h-4 w-1/3" />
        <Skeleton className="mt-2 h-4 w-1/4" />
        <div className="mt-5 flex gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-16" />
        </div>
      </li>,
    )
  }
  return (
    <ul aria-hidden="true" className="grid gap-5">
      {cards}
    </ul>
  )
}
