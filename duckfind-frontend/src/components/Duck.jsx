// DuckFind's rubber duck mascot, drawn in the same style as the site: yellow, thick ink outline.
// Decorative only, so screen readers skip it.
export function Duck({ className }) {
  const outline = {
    stroke: 'var(--duck-ink)',
    strokeWidth: 3,
    strokeLinejoin: 'round',
    strokeLinecap: 'round',
  }

  return (
    <svg viewBox="0 0 84 64" aria-hidden="true" focusable="false" className={className}>
      {/* body with a tail flicked up at the back */}
      <path
        d="M14 40 C10 33 8 26 5 19 C13 22 19 26 24 30 C32 27 44 28 54 33 C64 38 68 46 63 53 C58 60 46 62 34 61 C22 60 16 52 14 40 Z"
        fill="var(--duck)"
        {...outline}
      />
      {/* head */}
      <circle cx="54" cy="21" r="13" fill="var(--duck)" {...outline} />
      {/* wing */}
      <path d="M25 42 C31 35 43 36 47 43 C41 50 31 50 25 42 Z" fill="var(--duck-dark)" {...outline} />
      {/* bill */}
      <path d="M65 20 C72 18 79 20 80 25 C75 29 69 29 64 27 Z" fill="var(--bill)" {...outline} />
      {/* eye */}
      <circle cx="57" cy="17" r="2.6" fill="var(--duck-ink)" />
      <circle cx="58" cy="16" r="0.9" fill="#ffffff" />
    </svg>
  )
}

// A strip of water: a wavy ink line on top, filled with `currentColor` underneath.
// `count` is how many waves fit across it (fewer for small strips).
export function Waves({ className, count = 30 }) {
  const width = 1200 / count
  let line = 'M0 8'
  for (let i = 0; i < count; i++) {
    const x = i * width
    line += ` Q${x + width / 4} 0 ${x + width / 2} 8 T${x + width} 8`
  }

  return (
    <svg
      viewBox="0 0 1200 16"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d={line + ' V16 H0 Z'} fill="currentColor" />
      <path d={line} fill="none" stroke="var(--ink)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
