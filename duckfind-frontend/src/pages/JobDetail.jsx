import { useMemo } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { ArrowLeftIcon } from 'lucide-react'
import { ApplyLink, DetailActions } from '@/components/JobActions'
import { EmptyState, ErrorState } from '@/components/States'
import VisaStamp from '@/components/VisaStamp'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { closingInfo, jobTags, postedLabel } from '@/lib/internship'
import { cleanDescription } from '@/lib/sanitize'
import { useApi } from '@/lib/useApi'
import { usePageTitle } from '@/lib/usePageTitle'

// First few sentences of the company's own description
function shorten(text, length = 360) {
  if (!text || text.length <= length) return text
  return text.slice(0, text.lastIndexOf(' ', length)) + '…'
}

export default function JobDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { data, error, retry } = useApi('/jobs/' + id)
  // Ignore the previous job's data while this one loads
  const job = data && data.job._id === id ? data.job : null
  usePageTitle(job ? job.title : 'Job')

  const description = useMemo(() => (job ? cleanDescription(job.descriptionHtml || '') : ''), [job])

  function goBack() {
    // "default" means this page was opened directly, so there's nothing to go back to
    if (location.key !== 'default') navigate(-1)
    else navigate('/jobs')
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-16">
        {error.status === 404 || error.status === 400 ? (
          <EmptyState
            title="This job isn't listed any more"
            action={
              <Button asChild>
                <Link to="/jobs">Browse jobs</Link>
              </Button>
            }
          >
            The company may have filled the role or taken the listing down.
          </EmptyState>
        ) : (
          <ErrorState message={error.message} onRetry={retry} />
        )}
      </div>
    )
  }

  const company = job?.company
  // What the save / hide / apply buttons need to know about this job
  const actionJob = job ? { id: job._id, title: job.title, company: company?.name || '', url: job.url } : null
  const tags = job ? jobTags(job) : []

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
      <Button variant="ghost" onClick={goBack} className="-ml-3">
        <ArrowLeftIcon aria-hidden="true" />
        Back to jobs
      </Button>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_320px]">
        <article className="min-w-0">
          <h1 className="text-3xl leading-tight font-black tracking-tight font-wide sm:text-4xl">
            {job ? job.title : 'Loading job…'}
          </h1>

          {!job ? (
            <div aria-hidden="true" className="mt-6 grid gap-3">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-5 w-1/4" />
              <Skeleton className="mt-6 h-40 w-full" />
            </div>
          ) : (
            <>
              <p className="mt-3 text-lg font-bold">
                {company ? (
                  <Link
                    to={'/jobs?' + new URLSearchParams({ company: company.boardToken, uk: 'all' })}
                    className="underline decoration-2 underline-offset-4 hover:text-pond"
                  >
                    {company.name}
                  </Link>
                ) : null}
              </p>
              <p className="text-muted-foreground">{job.location}</p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
                <span className="text-sm text-muted-foreground">{postedLabel(job.firstPublishedAt)}</span>
              </div>
              {closingInfo(job.closingDate) && (
                <p
                  className={
                    'mt-4 inline-block rounded-md border-2 px-3 py-1.5 font-bold ' +
                    (closingInfo(job.closingDate).closed
                      ? 'border-stamp text-stamp'
                      : closingInfo(job.closingDate).soon
                        ? 'border-ink bg-bill text-duck-ink'
                        : 'border-ink')
                  }
                >
                  {closingInfo(job.closingDate).long}
                </p>
              )}

              <div className="mt-8 border-t-2 border-ink pt-8">
                <h2 className="text-xl font-black font-wide">About the job</h2>
                {description ? (
                  <div className="job-description mt-4" dangerouslySetInnerHTML={{ __html: description }} />
                ) : (
                  <p className="mt-4 text-muted-foreground">
                    The company didn't add a description. Open the listing for details.
                  </p>
                )}
              </div>
            </>
          )}
        </article>

        {job && (
          <aside aria-label="Apply and company details" className="grid content-start gap-6 lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-md border-2 border-ink bg-card p-5 shadow-brutal">
              <ApplyLink job={actionJob} size="lg" className="w-full">
                Apply on {company ? company.name : 'the company site'}
              </ApplyLink>
              <p className="mt-3 mb-5 text-sm text-muted-foreground">
                You apply on the company's own site.
              </p>
              <DetailActions job={actionJob} />
            </div>

            <div className="rounded-md border-2 border-ink bg-card p-5 shadow-brutal">
              <h2 className="text-lg font-black">Visa sponsorship</h2>
              {company?.sponsorsVisa ? (
                <>
                  <VisaStamp size="lg" className="mt-4" />
                  <p className="mt-4">
                    {company.sponsorRegisterName || company.name} is on the UK government's register of
                    licensed sponsors, so it can sponsor work visas.
                  </p>
                  {company.sponsorRoutes?.length > 0 && (
                    <>
                      <p className="mt-3 font-bold">Licensed for</p>
                      <ul className="mt-1 list-disc pl-5">
                        {company.sponsorRoutes.map((route) => (
                          <li key={route}>{route}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  <p className="mt-3 text-sm text-muted-foreground">
                    A licence doesn't guarantee this role is sponsored. Check the description or ask the company.
                  </p>
                </>
              ) : (
                <p className="mt-2">
                  {company ? company.name : 'This company'} isn't on the UK register of licensed sponsors, so
                  it can't sponsor a work visa for this role.
                </p>
              )}
            </div>

            {company?.description && (
              <div className="rounded-md border-2 border-ink bg-card p-5 shadow-brutal">
                <h2 className="text-lg font-black">About {company.name}</h2>
                <p className="mt-2 text-muted-foreground">{shorten(company.description)}</p>
                <Button asChild variant="link" className="mt-1 h-auto px-0">
                  <Link to={'/jobs?' + new URLSearchParams({ company: company.boardToken, uk: 'all' })}>
                    All jobs at {company.name}
                  </Link>
                </Button>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  )
}
