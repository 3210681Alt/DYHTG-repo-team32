// Labels for the education fields (they match the backend's course_type and graduation_status)
export const COURSE_TYPES = [
  ['undergraduate', 'Undergraduate'],
  ['postgraduate', 'Postgraduate'],
  ['phd', 'PhD'],
  ['other', 'Other'],
]

export const GRADUATION_STATUSES = [
  ['expected', 'Expected to graduate'],
  ['graduated', 'Graduated'],
  ['not_graduated', 'Not graduated yet'],
]

export const labelFor = (options, value) => (options.find(([key]) => key === value) || [value, value])[1]

// "2027-06-30" -> "June 2027"
export const monthYear = (date) =>
  new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
