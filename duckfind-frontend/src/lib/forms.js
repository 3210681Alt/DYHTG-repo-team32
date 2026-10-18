// Works out which field a backend message is about, e.g. "Email is already registered" -> "email".
// `fields` is a list of [fieldName, pattern] pairs, checked in order.
export function fieldForMessage(message, fields) {
  for (const [field, pattern] of fields) {
    if (pattern.test(message)) return field
  }
  return null
}

// Where to go after logging in. Only pages on this site are allowed, so a link like
// /login?next=https://evil.example can't send people elsewhere.
export function safeNext(next, fallback = '/jobs') {
  // "//site" and "/\site" would point at another website, so they're refused too
  if (next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\')) return next
  return fallback
}

// Moves the cursor to the field an error is about, so keyboard and screen reader users land on it
export function focusField(id) {
  requestAnimationFrame(() => document.getElementById(id)?.focus())
}
