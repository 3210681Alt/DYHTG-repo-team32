import { cn } from '@/lib/utils'

// The "Visa sponsor" mark, drawn like a passport stamp.
// It's real text, so screen readers read it out like any other label.
export default function VisaStamp({ size = 'sm', className }) {
  const large = size === 'lg'

  return (
    <span
      className={cn(
        'inline-block -rotate-3 rounded-sm border-[3px] border-double border-stamp bg-card text-center leading-none font-black tracking-wider text-stamp uppercase font-wide select-none',
        large ? 'px-4 py-2.5 text-lg' : 'px-2 py-1 text-[11px]',
        className,
      )}
    >
      Visa sponsor
      {large && (
        <span className="mt-1.5 block text-[11px] tracking-[0.18em]">UK licensed</span>
      )}
    </span>
  )
}
