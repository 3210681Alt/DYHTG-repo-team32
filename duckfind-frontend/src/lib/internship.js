// The Internship class from the first version of DuckFind.
// `id`, `postedAt` and `closingDate` were added at the end so results can link to their own page
// and show their dates; `match` is how well the job fits the user (only on My matches).
export class Internship {
  constructor(title, provider, email, phone, desc, address, source, requirements, link, tags, id, postedAt, closingDate, match) {
    this.title = title
    this.provider = provider
    this.email = email
    this.phone = phone
    this.desc = desc
    this.address = address
    this.source = source
    this.requirements = requirements
    this.link = link
    this.tags = tags
    this.id = id
    this.postedAt = postedAt
    this.closingDate = closingDate
    this.match = match
  }
}

export const VISA_TAG = "Visa sponsor"

// Labels shown on the tags of each result
export const seniorityLabels = {
  intern: "Internship",
  graduate: "Graduate",
  junior: "Junior",
  mid: "Mid-level",
  senior: "Senior",
  lead: "Lead",
}
export const workplaceLabels = { remote: "Remote", hybrid: "Hybrid", onsite: "On-site" }

// Tags for what a job's title and location actually say. "mid" and "onsite" are only what the
// scraper assumes when a job doesn't say, so they aren't shown as facts (they can still be filtered).
export function jobTags(job) {
  const tags = []
  if (job.seniority !== 'mid' && seniorityLabels[job.seniority]) tags.push(seniorityLabels[job.seniority])
  for (const place of job.workplace || []) {
    if (place !== 'onsite' && workplaceLabels[place]) tags.push(workplaceLabels[place])
  }
  return tags
}

// Turns a job from our backend (GET /api/jobs) into an Internship
export function toInternship(job) {
  const tags = jobTags(job)
  if (job.sponsorsVisa) tags.push(VISA_TAG)

  return new Internship(
    job.title,
    job.company ? job.company.name : "",
    "",
    "",
    job.descriptionHtml || "",
    job.location || "",
    "Greenhouse",
    "",
    job.url,
    tags,
    job._id,
    job.firstPublishedAt,
    job.closingDate,
    job.match,
  )
}

// Posted in the last 3 days
export function isNew(date) {
  return Boolean(date) && Date.now() - new Date(date).getTime() < 3 * 86_400_000
}

// "2026-10-15T..." -> "Posted 3 days ago"
export function postedLabel(date) {
  if (!date) return ""
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000)
  if (days <= 0) return "Posted today"
  if (days === 1) return "Posted yesterday"
  if (days < 30) return "Posted " + days + " days ago"
  const months = Math.floor(days / 30)
  return "Posted " + months + (months === 1 ? " month ago" : " months ago")
}

// When applications close: { short: "Closes 1 Nov", long: "Applications close 1 November 2026", soon, closed }
// Null when the company didn't give a closing date.
export function closingInfo(date) {
  if (!date) return null
  const closes = new Date(date)
  const daysLeft = Math.ceil((closes.getTime() - Date.now()) / 86_400_000)
  const sameYear = closes.getFullYear() === new Date().getFullYear()
  const short = closes.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', ...(sameYear ? {} : { year: 'numeric' }) })
  const long = closes.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  if (daysLeft < 0) return { short: 'Closed', long: 'Applications closed on ' + long, soon: false, closed: true }
  if (daysLeft === 0) return { short: 'Closes today', long: 'Applications close today', soon: true, closed: false }
  if (daysLeft <= 7) {
    const days = daysLeft === 1 ? '1 day' : daysLeft + ' days'
    return { short: 'Closes in ' + days, long: 'Applications close in ' + days + ' (' + long + ')', soon: true, closed: false }
  }
  return { short: 'Closes ' + short, long: 'Applications close ' + long, soon: false, closed: false }
}
