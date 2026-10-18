import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { SlidersHorizontalIcon, XIcon } from 'lucide-react'
import JobCard from '@/components/JobCard'
import JobFilters from '@/components/JobFilters'
import Pager from '@/components/Pager'
import { EmptyState, ErrorState, JobListSkeleton } from '@/components/States'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useMyJobs } from '@/context/myJobs'
import { toQuery } from '@/lib/api'
import { seniorityLabels, toInternship, workplaceLabels } from '@/lib/internship'
import { useApi } from '@/lib/useApi'
import { usePageTitle } from '@/lib/usePageTitle'

const PAGE_SIZE = 20
const postedLabels = { 1: 'Last day', 7: 'Last week', 30: 'Last month' }
const sortLabels = { newest: 'Newest first', oldest: 'Oldest first', title: 'Title A–Z', relevance: 'Best match' }

// The filters live in the address bar (?uk=all&seniority=intern), so a search can be shared or bookmarked
function readFilters(params) {
  const list = (key) => (params.get(key) || '').split(',').filter(Boolean)
  return {
    keywords: params.get('keywords') || '',
    sort: params.get('sort') || '',
    sponsors: params.get('sponsors') === 'true',
    // UK jobs are shown unless the address says uk=all
    uk: params.get('uk') !== 'all',
    seniority: list('seniority'),
    workplace: list('workplace'),
    country: params.get('country') || '',
    company: params.get('company') || '',
    department: params.get('department') || '',
    postedWithin: params.get('postedWithin') || '',
    page: Math.max(1, Number(params.get('page')) || 1),
  }
}

function withChanges(params, changes) {
  const next = new URLSearchParams(params)
  for (const [key, value] of Object.entries(changes)) {
    if (key === 'uk') {
      if (value) next.delete('uk')
      else next.set('uk', 'all')
    } else if (Array.isArray(value) ? value.length > 0 : Boolean(value)) {
      next.set(key, Array.isArray(value) ? value.join(',') : String(value))
    } else {
      next.delete(key)
    }
  }
  // Changing a filter starts again from page 1
  if (!('page' in changes)) next.delete('page')
  return next
}

function jobsPath(filters) {
  return (
    '/jobs?' +
    toQuery({
      keywords: filters.keywords,
      // "Best match" only works with a search
      sort: filters.sort === 'relevance' && !filters.keywords ? '' : filters.sort,
      sponsors: filters.sponsors ? 'true' : '',
      uk: filters.uk ? 'true' : '',
      seniority: filters.seniority.join(','),
      workplace: filters.workplace.join(','),
      country: filters.country,
      company: filters.company,
      department: filters.department,
      postedWithin: filters.postedWithin,
      page: filters.page,
      limit: PAGE_SIZE,
    })
  )
}

// The filters that are switched on, each with what removing it changes
function activeFilters(filters, options) {
  const active = []
  if (filters.keywords) active.push(['“' + filters.keywords + '”', { keywords: '', sort: '' }])
  if (filters.sponsors) active.push(['Visa sponsors', { sponsors: false }])
  if (filters.uk) active.push(['UK jobs', { uk: false }])
  for (const level of filters.seniority) {
    active.push([seniorityLabels[level] || level, { seniority: filters.seniority.filter((l) => l !== level) }])
  }
  for (const place of filters.workplace) {
    active.push([workplaceLabels[place] || place, { workplace: filters.workplace.filter((p) => p !== place) }])
  }
  if (filters.postedWithin) active.push([postedLabels[filters.postedWithin] || 'Recent', { postedWithin: '' }])
  if (filters.country) active.push([filters.country, { country: '' }])
  if (filters.company) {
    const company = (options?.companies || []).find((c) => c.value === filters.company)
    active.push([company ? company.name : filters.company, { company: '' }])
  }
  if (filters.department) active.push([filters.department, { department: '' }])
  return active
}

export default function Jobs() {
  usePageTitle('Browse jobs')
  const [params, setParams] = useSearchParams()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const { isHidden } = useMyJobs()
  const filters = readFilters(params)

  const options = useApi('/jobs/filters')
  const results = useApi(jobsPath(filters))
  const filterOptions = options.data?.filters

  // Back to the top when moving between pages of results
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [filters.page])

  function change(changes) {
    setParams(withChanges(params, changes))
  }

  function clearAll() {
    setParams(new URLSearchParams())
  }

  function search(event) {
    event.preventDefault()
    const keywords = new FormData(event.currentTarget).get('keywords').trim()
    change({ keywords, sort: '' })
  }

  const data = results.data
  const internships = data ? data.jobs.map(toInternship) : []
  // Jobs hidden on this page just now are gone from the list; take them off the count too
  const total = data ? data.total - data.jobs.filter((job) => isHidden(job._id)).length : 0
  const active = activeFilters(filters, filterOptions)
  const sortValue = filters.sort || (filters.keywords ? 'relevance' : 'newest')
  const sorts = filters.keywords ? ['relevance', 'newest', 'oldest', 'title'] : ['newest', 'oldest', 'title']

  let status = ''
  if (results.loading) status = 'Loading jobs…'
  else if (data) status = total.toLocaleString() + (total === 1 ? ' job' : ' jobs')

  const filterPanel = (idPrefix) => (
    <JobFilters
      idPrefix={idPrefix}
      options={filterOptions}
      values={filters}
      onChange={change}
      onReset={clearAll}
    />
  )

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
      <h1 className="text-4xl leading-none font-black tracking-tight font-wide sm:text-5xl">
        Browse internships and jobs
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
        {filterOptions
          ? 'Jobs from ' + filterOptions.companies.length + ' companies, checked against the UK visa sponsor register.'
          : 'Jobs from companies hiring now, checked against the UK visa sponsor register.'}
      </p>

      {/* key: the box refills with the current search when it changes elsewhere, e.g. a removed chip */}
      <form key={filters.keywords} role="search" onSubmit={search} className="mt-8 flex max-w-2xl gap-3">
        <Label htmlFor="jobs-search" className="sr-only">
          Search jobs
        </Label>
        <Input
          id="jobs-search"
          name="keywords"
          defaultValue={filters.keywords}
          placeholder="Search titles and descriptions"
        />
        <Button type="submit">Search</Button>
      </form>

      <div className="mt-10 grid gap-10 lg:grid-cols-[280px_1fr]">
        <aside aria-labelledby="filters-heading" className="hidden lg:block">
          <h2 id="filters-heading" className="mb-6 text-xl font-black font-wide">
            Filters
          </h2>
          {filterPanel('filter')}
        </aside>

        <section aria-labelledby="results-heading" className="min-w-0">
          <h2 id="results-heading" className="sr-only">
            Results
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            <p aria-live="polite" className="mr-auto text-lg font-black">
              {status}
            </p>

            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden">
                  <SlidersHorizontalIcon aria-hidden="true" />
                  Filters{active.length ? ' (' + active.length + ')' : ''}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[88%] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="text-xl font-black font-wide">Filters</SheetTitle>
                  <SheetDescription>Results update as you change filters.</SheetDescription>
                </SheetHeader>
                <div className="px-4">{filterPanel('sheet-filter')}</div>
                <SheetFooter>
                  <Button onClick={() => setFiltersOpen(false)}>Show {status || 'jobs'}</Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2">
              <Label htmlFor="jobs-sort" className="font-bold">
                Sort
              </Label>
              <Select value={sortValue} onValueChange={(sort) => change({ sort })}>
                <SelectTrigger id="jobs-sort" className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  {sorts.map((sort) => (
                    <SelectItem key={sort} value={sort}>
                      {sortLabels[sort]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {active.length > 0 && (
            <ul aria-label="Active filters" className="mt-5 flex flex-wrap gap-2">
              {active.map(([label, changes]) => (
                <li key={label}>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => change(changes)}
                    aria-label={'Remove filter: ' + label}
                  >
                    {label}
                    <XIcon aria-hidden="true" />
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6">
            {results.error ? (
              <ErrorState message={results.error.message} onRetry={results.retry} />
            ) : !data ? (
              <JobListSkeleton />
            ) : data.total === 0 ? (
              <EmptyState
                title="No jobs match these filters"
                action={
                  <Button variant="outline" onClick={clearAll}>
                    Clear all filters
                  </Button>
                }
              >
                Try removing a filter or searching for something broader.
              </EmptyState>
            ) : (
              <ul
                aria-busy={results.loading}
                className={'grid gap-5 transition-opacity ' + (results.loading ? 'opacity-60' : '')}
              >
                {internships.map((internship) => (
                  <JobCard key={internship.id} internship={internship} />
                ))}
              </ul>
            )}
          </div>

          {data && (
            <Pager
              page={filters.page}
              totalPages={data.totalPages}
              linkTo={(page) => '?' + withChanges(params, { page }).toString()}
            />
          )}
        </section>
      </div>
    </div>
  )
}
