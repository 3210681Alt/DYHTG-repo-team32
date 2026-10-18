import { Link, useSearchParams } from 'react-router'
import JobCard from '@/components/JobCard'
import Pager from '@/components/Pager'
import { EmptyState, ErrorState, JobListSkeleton } from '@/components/States'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/context/auth'
import { useMyJobs } from '@/context/myJobs'
import { toQuery } from '@/lib/api'
import { toInternship } from '@/lib/internship'
import { useApi } from '@/lib/useApi'
import { usePageTitle } from '@/lib/usePageTitle'

const PAGE_SIZE = 20

// What each tab matches jobs against: the skills on the profile, or the keywords found in the CV
const SOURCES = {
  skills: {
    tab: 'From your skills',
    label: 'Your skills',
    edit: 'Edit skills',
    intro: 'Jobs that ask for your skills at your level, with the best matches first.',
    emptyTitle: 'Add your skills to see matches',
    emptyText: 'We use the skills on your profile to find jobs that ask for them.',
    emptyAction: 'Add skills',
  },
  cv: {
    tab: 'From your CV',
    label: 'From your CV',
    edit: 'Change CV',
    intro: 'Jobs that fit the skills and experience in your CV, with the best matches first.',
    emptyTitle: 'Upload your CV to see matches',
    emptyText: 'We pick out the skills and experience in your CV and find jobs that ask for them.',
    emptyAction: 'Upload your CV',
  },
}

// Matches are jobs scored on the user's skills or CV and their education, best match first
// (GET /api/jobs/matches?from=skills|cv)
export default function Matches() {
  usePageTitle('My matches')
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const from = params.get('from') === 'cv' ? 'cv' : 'skills'
  const source = SOURCES[from]
  const skills = (from === 'cv' ? user.resumeKeywords : user.skills) || []

  // Visa sponsors and UK are on unless the address turns them off
  const sponsorsOnly = params.get('sponsors') !== 'all'
  const ukOnly = params.get('uk') !== 'all'
  const earlyCareer = params.get('level') === 'early'
  const page = Math.max(1, Number(params.get('page')) || 1)

  const path = skills.length
    ? '/jobs/matches?' +
      toQuery({
        from: from === 'cv' ? 'cv' : '',
        sponsors: sponsorsOnly ? 'true' : '',
        uk: ukOnly ? 'true' : '',
        seniority: earlyCareer ? 'intern,graduate,junior' : '',
        page,
        limit: PAGE_SIZE,
      })
    : null
  const results = useApi(path)
  const data = results.data
  const { isHidden } = useMyJobs()
  // Jobs hidden just now are gone from the list; take them off the count too
  const total = data ? data.total - data.jobs.filter((job) => isHidden(job._id)).length : 0

  function setOption(key, value) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    setParams(next)
  }

  const toggles = [
    ['matches-sponsors', 'Visa sponsors only', sponsorsOnly, (on) => setOption('sponsors', on ? '' : 'all')],
    ['matches-uk', 'UK jobs only', ukOnly, (on) => setOption('uk', on ? '' : 'all')],
    [
      'matches-early',
      'Internships, graduate and junior roles only',
      earlyCareer,
      (on) => setOption('level', on ? 'early' : ''),
    ],
  ]

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:py-14">
      <h1 className="text-4xl leading-none font-black tracking-tight font-wide sm:text-5xl">My matches</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{source.intro}</p>

      {/* Each tab is its own address (?from=cv), so it can be linked to and the back button works */}
      <Tabs value={from} onValueChange={(next) => setOption('from', next === 'cv' ? 'cv' : '')} className="mt-8">
        <TabsList aria-label="Find matches">
          <TabsTrigger value="skills">{SOURCES.skills.tab}</TabsTrigger>
          <TabsTrigger value="cv">{SOURCES.cv.tab}</TabsTrigger>
        </TabsList>

        {/* Both panels exist for screen readers; only the open one has the results in it */}
        {Object.keys(SOURCES).map((value) => (
          <TabsContent key={value} value={value}>
            {value === from &&
              (skills.length === 0 ? (
                <div className="mt-8">
                  <EmptyState
                    title={source.emptyTitle}
                    action={
                      <Button asChild>
                        <Link to="/profile">{source.emptyAction}</Link>
                      </Button>
                    }
                  >
                    {source.emptyText}
                  </EmptyState>
                </div>
              ) : (
                <>
                  <div className="mt-6 rounded-md border-2 border-ink bg-card p-5 shadow-brutal">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="mr-1 font-bold">{source.label}</span>
                      {skills.map((skill) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                      <Button asChild variant="link" size="sm" className="px-1">
                        <Link to="/profile">{source.edit}</Link>
                      </Button>
                    </div>

                    <div className="mt-5 grid gap-4 border-t-2 border-ink pt-5 sm:grid-cols-3">
                      {toggles.map(([id, label, checked, onChange]) => (
                        <div key={id} className="flex items-center justify-between gap-3 sm:justify-start">
                          <Label htmlFor={id} className="font-bold sm:order-2">
                            {label}
                          </Label>
                          <Switch id={id} checked={checked} onCheckedChange={onChange} className="sm:order-1" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <p aria-live="polite" className="mt-8 text-lg font-black">
                    {results.loading
                      ? 'Finding matches…'
                      : data
                        ? total.toLocaleString() + (total === 1 ? ' match' : ' matches')
                        : ''}
                  </p>

                  <div className="mt-4">
                    {results.error ? (
                      <ErrorState message={results.error.message} onRetry={results.retry} />
                    ) : !data ? (
                      <JobListSkeleton />
                    ) : data.total === 0 ? (
                      <EmptyState title="No jobs match all of these settings">
                        {from === 'cv'
                          ? 'Turn off one of the switches above, or try the matches from your skills.'
                          : 'Turn off one of the switches above, or add more skills to your profile.'}
                      </EmptyState>
                    ) : (
                      <ul
                        aria-busy={results.loading}
                        className={'grid gap-5 transition-opacity ' + (results.loading ? 'opacity-60' : '')}
                      >
                        {data.jobs.map(toInternship).map((internship) => (
                          <JobCard key={internship.id} internship={internship} />
                        ))}
                      </ul>
                    )}
                  </div>

                  {data && (
                    <Pager
                      page={page}
                      totalPages={data.totalPages}
                      linkTo={(nextPage) => {
                        const next = new URLSearchParams(params)
                        next.set('page', nextPage)
                        return '?' + next.toString()
                      }}
                    />
                  )}
                </>
              ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
