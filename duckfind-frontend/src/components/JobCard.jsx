import { Link } from 'react-router'
import { CardActions } from '@/components/JobActions'
import { Badge } from '@/components/ui/badge'
import VisaStamp from '@/components/VisaStamp'
import { useMyJobs } from '@/context/myJobs'
import { closingInfo, isNew, postedLabel, VISA_TAG } from '@/lib/internship'

// One result in a list. Takes an Internship (see lib/internship.js).
// Jobs the user marked "Not interested" disappear straight away (unless showHidden is set).
export default function JobCard({ internship, showHidden = false }) {
  const { isHidden } = useMyJobs()
  if (!showHidden && isHidden(internship.id)) return null

  const sponsor = internship.tags.includes(VISA_TAG)
  const tags = internship.tags.filter((tag) => tag !== VISA_TAG)
  const closing = closingInfo(internship.closingDate)
  const job = {
    id: internship.id,
    title: internship.title,
    company: internship.provider,
    url: internship.link,
  }

  return (
    <li className="relative rounded-md border-2 border-ink bg-card p-5 shadow-brutal">
      {/* On phones the stamp goes under the location, so long titles keep the full width */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-lg leading-snug font-extrabold">
            {/* after:inset-0 stretches the link over the whole card, so the card is clickable */}
            <Link
              to={'/jobs/' + internship.id}
              className="decoration-2 underline-offset-4 after:absolute after:inset-0 hover:underline"
            >
              {internship.title}
            </Link>
          </h2>
          <p className="mt-1 font-bold">{internship.provider}</p>
          <p className="text-muted-foreground">{internship.address}</p>
        </div>
        {sponsor && <VisaStamp className="shrink-0 self-start sm:mt-1" />}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {isNew(internship.postedAt) && <Badge className="bg-bill text-duck-ink">New</Badge>}
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary">
            {tag}
          </Badge>
        ))}
        <span className="text-sm text-muted-foreground">{postedLabel(internship.postedAt)}</span>
        {closing &&
          (closing.soon || closing.closed ? (
            <Badge className={closing.closed ? 'border-stamp bg-card text-stamp' : 'bg-bill text-duck-ink'}>
              {closing.short}
            </Badge>
          ) : (
            <span className="text-sm font-bold">{closing.short}</span>
          ))}
        <CardActions job={job} />
      </div>
    </li>
  )
}
