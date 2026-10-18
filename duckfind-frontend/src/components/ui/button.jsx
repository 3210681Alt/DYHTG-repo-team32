import { cva } from "class-variance-authority";
import { cn } from "cn"
import { Slot } from "radix-ui"

// Brutalist buttons: 2px ink border, hard shadow, and they press into the shadow when clicked
const pressable =
  "shadow-brutal-sm active:not-aria-[haspopup]:translate-x-[2px] active:not-aria-[haspopup]:translate-y-[2px] active:not-aria-[haspopup]:shadow-none"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border-2 border-ink text-sm font-bold whitespace-nowrap transition-[transform,box-shadow,background-color] duration-100 outline-none select-none disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: cn("bg-primary text-primary-foreground hover:bg-duck-dark", pressable),
        outline: cn("bg-card text-foreground hover:bg-duck-pale aria-expanded:bg-duck-pale", pressable),
        secondary: cn("bg-secondary text-secondary-foreground hover:bg-duck hover:text-duck-ink", pressable),
        ghost:
          "border-transparent hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
        destructive: cn(
          "border-stamp bg-card text-stamp shadow-[2px_2px_0_0_var(--stamp)] hover:bg-stamp/10 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
        ),
        link: "border-transparent text-pond underline underline-offset-4 hover:decoration-2",
      },
      size: {
        default:
          "h-11 gap-2 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-7 gap-1 px-2 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        lg: "h-14 gap-2 px-6 text-base has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5",
        icon: "size-11",
        "icon-xs": "size-7 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
