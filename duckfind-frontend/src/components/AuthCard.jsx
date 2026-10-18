import { Duck } from '@/components/Duck'

// The centred card used by the log in and sign up pages, with a duck perched on top
export default function AuthCard({ title, intro, children, footer }) {
  return (
    <div className="mx-auto max-w-md px-5 py-16 sm:py-24">
      <div className="relative rounded-md border-2 border-ink bg-card p-6 shadow-brutal-lg sm:p-8">
        <Duck className="absolute -top-11 right-6 w-16" />
        <h1 className="text-3xl leading-none font-black tracking-tight font-wide">{title}</h1>
        {intro && <p className="mt-3 text-muted-foreground">{intro}</p>}
        <div className="mt-7">{children}</div>
      </div>
      {footer && <p className="mt-6 text-center">{footer}</p>}
    </div>
  )
}
