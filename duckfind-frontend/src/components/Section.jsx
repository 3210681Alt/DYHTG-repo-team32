// A titled card, used for each part of the profile page
export default function Section({ id, title, intro, children }) {
  return (
    <section aria-labelledby={id} className="rounded-md border-2 border-ink bg-card p-6 shadow-brutal">
      <h2 id={id} className="text-xl font-black font-wide">
        {title}
      </h2>
      {intro && <p className="mt-2 text-muted-foreground">{intro}</p>}
      <div className="mt-5">{children}</div>
    </section>
  )
}
