import { BookmarkCheckIcon, BookmarkIcon, EyeIcon, EyeOffIcon, ExternalLinkIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useMyJobs } from '@/context/myJobs'
import { APPLICATION_STATUSES } from '@/lib/applications'
import { cn } from '@/lib/utils'

// `job` everywhere here is { id, title, company, url }

// The dropdown for where an application is up to (Applied, Online assessment, Interview…)
export function StatusSelect({ job, id, className, label }) {
  const { applicationStatus, setStatus } = useMyJobs()
  const status = applicationStatus(job.id)
  if (!status) return null

  return (
    <Select value={status} onValueChange={(next) => setStatus(job, next)}>
      <SelectTrigger
        id={id}
        size="sm"
        aria-label={label ? undefined : 'Application status for ' + job.title}
        className={cn('relative z-10 w-48', className)}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper">
        {APPLICATION_STATUSES.map(([value, text]) => (
          <SelectItem key={value} value={value}>
            {text}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// Opens the company's application. Afterwards, offers to add it to "My jobs".
export function ApplyLink({ job, className, size = 'sm', children }) {
  const { loggedIn, applicationStatus, markApplied } = useMyJobs()

  function opened() {
    if (!loggedIn || applicationStatus(job.id)) return
    toast('Did you apply for ' + job.title + '?', {
      description: 'Keep track of it in My jobs.',
      duration: 12000,
      action: { label: 'Mark as applied', onClick: () => markApplied(job) },
    })
  }

  return (
    <Button asChild size={size} className={cn('relative z-10', className)}>
      <a href={job.url} target="_blank" rel="noopener noreferrer" onClick={opened}>
        {children || 'Apply'}
        <span className="sr-only">
          {' '}for {job.title}
          {job.company ? ' at ' + job.company : ''} (opens in a new tab)
        </span>
        <ExternalLinkIcon aria-hidden="true" />
      </a>
    </Button>
  )
}

// Small icon buttons on a job card. relative z-10 lifts them above the card-wide link.
export function CardActions({ job }) {
  const { isSaved, toggleSaved, hide, applicationStatus } = useMyJobs()
  const saved = isSaved(job.id)

  return (
    <div className="ml-auto flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="icon-sm"
        className="relative z-10"
        onClick={() => toggleSaved(job)}
        aria-pressed={saved}
        aria-label={'Save ' + job.title}
        title={saved ? 'Saved' : 'Save'}
      >
        {saved ? (
          <BookmarkCheckIcon aria-hidden="true" className="fill-duck" />
        ) : (
          <BookmarkIcon aria-hidden="true" />
        )}
      </Button>
      <Button
        variant="outline"
        size="icon-sm"
        className="relative z-10"
        onClick={() => hide(job)}
        aria-label={'Not interested in ' + job.title}
        title="Not interested"
      >
        <EyeOffIcon aria-hidden="true" />
      </Button>
      {applicationStatus(job.id) ? <StatusSelect job={job} className="w-auto min-w-40" /> : <ApplyLink job={job} />}
    </div>
  )
}

// Labelled buttons for the job's own page
export function DetailActions({ job }) {
  const { isSaved, toggleSaved, isHidden, hide, unhide, applicationStatus, markApplied, removeApplication } =
    useMyJobs()
  const saved = isSaved(job.id)
  const hidden = isHidden(job.id)
  const status = applicationStatus(job.id)

  return (
    <div className="grid gap-3">
      {status ? (
        <div className="grid gap-2">
          <Label htmlFor="detail-status" className="font-bold">
            Application status
          </Label>
          <StatusSelect job={job} id="detail-status" label className="w-full" />
          <Button variant="link" size="sm" className="justify-self-start px-0" onClick={() => removeApplication(job)}>
            Remove from my applications
          </Button>
        </div>
      ) : (
        <Button variant="outline" onClick={() => markApplied(job)}>
          Mark as applied
        </Button>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" onClick={() => toggleSaved(job)} aria-pressed={saved}>
          {saved ? (
            <BookmarkCheckIcon aria-hidden="true" className="fill-duck" />
          ) : (
            <BookmarkIcon aria-hidden="true" />
          )}
          {saved ? 'Saved' : 'Save'}
        </Button>
        {hidden ? (
          <Button variant="outline" onClick={() => unhide(job)}>
            <EyeIcon aria-hidden="true" />
            Show again
          </Button>
        ) : (
          <Button variant="outline" onClick={() => hide(job)}>
            <EyeOffIcon aria-hidden="true" />
            Not interested
          </Button>
        )}
      </div>
      {hidden && (
        <p className="text-sm text-muted-foreground">
          You marked this job as not interested, so it's hidden from your job lists.
        </p>
      )}
    </div>
  )
}
