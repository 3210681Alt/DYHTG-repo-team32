// Where an application is up to (matches the backend's application_status)
export const APPLICATION_STATUSES = [
  ['applied', 'Applied'],
  ['online_assessment', 'Online assessment'],
  ['interview', 'Interview'],
  ['assessment_centre', 'Assessment centre'],
  ['offer', 'Offer'],
  ['rejected', 'Rejected'],
  ['withdrawn', 'Withdrawn'],
]

export const statusLabel = (status) =>
  (APPLICATION_STATUSES.find(([value]) => value === status) || [status, status])[1]
