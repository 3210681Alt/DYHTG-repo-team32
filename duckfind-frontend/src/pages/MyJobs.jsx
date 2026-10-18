import { Link, useSearchParams } from 'react-router'
import { EyeIcon, Trash2Icon } from 'lucide-react'
import JobCard from '@/components/JobCard'
import { StatusSelect } from '@/components/JobActions'
import { EmptyState, ErrorState, JobListSkeleton } from '@/components/States'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useMyJobs } from '@/context/myJobs'
import { APPLICATION_STATUSES } from '@/lib/applications'
import { toInternship } from '@/lib/internship'
import { useApi } from '@/lib/useApi'
import { usePageTitle } from '@/lib/usePageTitle'

const TABS = ['saved', 'applied', 'hidden']

const shortDate = (date) =>
  new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

// What the buttons need to know about a job in these lists
const jobFor = (item) => ({
  id: item.jobId,
  title: item.jobTitle,
  company: item.companyName,
  url: item.jobUrl,
})

function TabBody({ request, empty, children }) {
  if (request.error && !request.data) {
    return <ErrorState message={request.error.message} onRetry={request.retry} />
  }
  if (!request.data) return <JobListSkeleton count={2} />
  return children.length ? <ul className="grid gap-5">{children}</ul> : empty
}

const browseButton = (
  <Button asChild>
    <Link to="/jobs">Browse internships</Link>
  </Button>
)

export default function MyJobs() {
  usePageTitle('My jobs')
  const [params, setParams] = useSearchParams()
  const tab = TABS.includes(params.get('tab')) ? params.get('tab') : 'saved'
  const { isSaved, isHidden, applicationStatus, toggleSaved, unhide, removeApplication } = useMyJobs()

  const saved = useApi('/profile/saved-jobs')
  const applied = useApi('/profile/applications')
  const hidden = useApi('/profile/hidden-jobs')

  // Lists from the server, minus anything removed on this page since
  const savedItems = (saved.data?.savedJobs || []).filter((item) => isSaved(item.jobId))
  const appliedItems = (applied.data?.applications || []).filter((item) => applicationStatus(item.jobId))
  const hiddenItems = (hidden.data?.hiddenJobs || []).filter((item) => isHidden(item.jobId))

  // How many applications are at each stage, e.g. 2 Applied, 1 Interview
  const stageCounts = APPLICATION_STATUSES.map(([value, label]) => [
    label,
    appliedItems.filter((item) => applicationStatus(item.jobId) === value).length,
  ]).filter(([, count]) => count > 0)

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:py-14">
      <h1 className="text-4xl leading-none font-black tracking-tight font-wide sm:text-5xl">My jobs</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
        Jobs you saved, the applications you're tracking, and jobs you hid.
      </p>

      <Tabs
        value={tab}
        onValueChange={(next) => setParams({ tab: next }, { replace: true })}
        className="mt-8"
      >
        <TabsList aria-label="My jobs">
          <TabsTrigger value="saved">Saved ({savedItems.length})</TabsTrigger>
          <TabsTrigger value="applied">Applied ({appliedItems.length})</TabsTrigger>
          <TabsTrigger value="hidden">Not interested ({hiddenItems.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="saved">
          <TabBody
            request={saved}
            empty={
              <EmptyState title="No saved jobs yet" action={browseButton}>
                Use the bookmark on any job to save it for later.
              </EmptyState>
            }
          >
            {savedItems.map((item) =>
              item.job ? (
                <JobCard key={item.jobId} internship={toInternship(item.job)} showHidden />
              ) : (
                // The company has taken the listing down
                <li
                  key={item.jobId}
                  className="flex flex-wrap items-center gap-3 rounded-md border-2 border-dashed border-ink bg-card p-5"
                >
                  <div className="mr-auto min-w-0">
                    <h2 className="text-lg font-extrabold">{item.jobTitle}</h2>
                    <p className="font-bold">{item.companyName}</p>
                    <p className="text-sm text-muted-foreground">No longer listed</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => toggleSaved(jobFor(item))}>
                    Remove
                  </Button>
                </li>
              ),
            )}
          </TabBody>
        </TabsContent>

        <TabsContent value="applied">
          {stageCounts.length > 0 && (
            <ul aria-label="Applications by stage" className="mb-5 flex flex-wrap gap-2">
              {stageCounts.map(([label, count]) => (
                <li key={label}>
                  <Badge variant="secondary" className="text-sm">
                    {count} {label}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
          <TabBody
            request={applied}
            empty={
              <EmptyState title="No applications yet" action={browseButton}>
                After you apply for a job, mark it as applied to keep track of where it's up to.
              </EmptyState>
            }
          >
            {appliedItems.map((item) => {
              const job = jobFor(item)
              return (
                <li
                  key={item.jobId}
                  className="flex flex-wrap items-center gap-4 rounded-md border-2 border-ink bg-card p-5 shadow-brutal"
                >
                  <div className="mr-auto min-w-0">
                    <h2 className="text-lg leading-snug font-extrabold">
                      {item.job ? (
                        <Link to={'/jobs/' + item.jobId} className="underline-offset-4 hover:underline">
                          {item.jobTitle}
                        </Link>
                      ) : (
                        item.jobTitle
                      )}
                    </h2>
                    <p className="font-bold">{item.companyName}</p>
                    <p className="text-sm text-muted-foreground">
                      Applied {shortDate(item.appliedAt)}
                      {item.job ? '' : '. No longer listed'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusSelect job={job} />
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeApplication(job)}
                      aria-label={'Remove ' + item.jobTitle + ' from my applications'}
                      title="Remove"
                    >
                      <Trash2Icon aria-hidden="true" />
                    </Button>
                  </div>
                </li>
              )
            })}
          </TabBody>
        </TabsContent>

        <TabsContent value="hidden">
          <TabBody
            request={hidden}
            empty={
              <EmptyState title="Nothing hidden">
                Jobs you mark as not interested go here, so you can bring them back.
              </EmptyState>
            }
          >
            {hiddenItems.map((item) => (
              <li
                key={item.jobId}
                className="flex flex-wrap items-center gap-3 rounded-md border-2 border-ink bg-card p-5"
              >
                <div className="mr-auto min-w-0">
                  <h2 className="text-lg font-extrabold">{item.jobTitle}</h2>
                  <p className="font-bold">{item.companyName}</p>
                  <p className="text-sm text-muted-foreground">Hidden {shortDate(item.hiddenAt)}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => unhide(jobFor(item))}>
                  <EyeIcon aria-hidden="true" />
                  Show again
                  <span className="sr-only"> {item.jobTitle}</span>
                </Button>
              </li>
            ))}
          </TabBody>
        </TabsContent>
      </Tabs>
    </div>
  )
}
