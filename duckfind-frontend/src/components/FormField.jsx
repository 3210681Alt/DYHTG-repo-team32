import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// A labelled input with an optional hint and error, linked together for screen readers.
// <FormField id="email" label="Email" type="email" error={errors.email} />
export default function FormField({ id, label, hint, error, ...inputProps }) {
  const describedBy = [hint && id + '-hint', error && id + '-error'].filter(Boolean).join(' ')

  return (
    // content-start: label and input stay together at the top, even beside a taller field
    <div className="grid content-start gap-2">
      <Label htmlFor={id} className="font-bold">
        {label}
      </Label>
      <Input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        {...inputProps}
      />
      {hint && (
        <p id={id + '-hint'} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={id + '-error'} className="text-sm font-bold text-stamp">
          {error}
        </p>
      )}
    </div>
  )
}
