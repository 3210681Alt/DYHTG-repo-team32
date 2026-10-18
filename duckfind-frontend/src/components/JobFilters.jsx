import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { seniorityLabels, workplaceLabels } from '@/lib/internship'

// Select can't use an empty value, so "any" stands for "no filter"
const ANY = 'any'
const SENIORITY = ['intern', 'graduate', 'junior', 'mid', 'senior', 'lead']
const WORKPLACE = ['remote', 'hybrid', 'onsite']
const POSTED = [
  ['1', 'In the last day'],
  ['7', 'In the last week'],
  ['30', 'In the last month'],
]

const byLabel = (a, b) => a[1].localeCompare(b[1])

function ToggleFilter({ id, label, hint, checked, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <Label htmlFor={id} className="font-bold">
          {label}
        </Label>
        {hint && (
          <p id={id + '-hint'} className="mt-1 text-sm text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        aria-describedby={hint ? id + '-hint' : undefined}
      />
    </div>
  )
}

function CheckboxFilter({ legend, name, options, selected, onChange }) {
  function toggle(value, on) {
    onChange(on ? [...selected, value] : selected.filter((item) => item !== value))
  }

  return (
    <fieldset>
      <legend className="mb-3 font-bold">{legend}</legend>
      <div className="grid gap-3">
        {options.map(([value, label]) => (
          <div key={value} className="flex items-center gap-3">
            <Checkbox
              id={name + '-' + value}
              checked={selected.includes(value)}
              onCheckedChange={(on) => toggle(value, on === true)}
            />
            <Label htmlFor={name + '-' + value}>{label}</Label>
          </div>
        ))}
      </div>
    </fieldset>
  )
}

function SelectFilter({ id, label, anyLabel, value, options, onChange }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className="font-bold">
        {label}
      </Label>
      <Select value={value || ANY} onValueChange={(next) => onChange(next === ANY ? '' : next)}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" className="max-h-72">
          <SelectItem value={ANY}>{anyLabel}</SelectItem>
          {options.map(([optionValue, optionLabel]) => (
            <SelectItem key={optionValue} value={optionValue}>
              {optionLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// All the filters for the Browse page. `options` comes from GET /api/jobs/filters.
// `onChange` gets only what changed, e.g. { sponsors: true }.
export default function JobFilters({ idPrefix = 'filter', options, values, onChange, onReset }) {
  const countries = (options?.countries || []).map((c) => [c.value, c.value]).sort(byLabel)
  const departments = (options?.departments || []).map((d) => [d.value, d.value]).sort(byLabel)
  const companies = (options?.companies || []).map((c) => [c.value, c.name]).sort(byLabel)

  function chooseCountry(country) {
    // A country other than the UK can't be combined with "UK jobs only"
    if (country && country !== 'United Kingdom') onChange({ country, uk: false })
    else onChange({ country })
  }

  return (
    <div className="grid gap-7">
      <ToggleFilter
        id={idPrefix + '-sponsors'}
        label="Visa sponsors only"
        hint="Companies on the UK register of licensed sponsors"
        checked={values.sponsors}
        onChange={(on) => onChange({ sponsors: on })}
      />
      <ToggleFilter
        id={idPrefix + '-uk'}
        label="UK jobs only"
        checked={values.uk}
        onChange={(on) => onChange(on ? { uk: true, country: '' } : { uk: false })}
      />

      <CheckboxFilter
        legend="Experience level"
        name={idPrefix + '-seniority'}
        options={SENIORITY.map((value) => [value, seniorityLabels[value]])}
        selected={values.seniority}
        onChange={(seniority) => onChange({ seniority })}
      />
      <CheckboxFilter
        legend="Workplace"
        name={idPrefix + '-workplace'}
        options={WORKPLACE.map((value) => [value, workplaceLabels[value]])}
        selected={values.workplace}
        onChange={(workplace) => onChange({ workplace })}
      />

      <SelectFilter
        id={idPrefix + '-posted'}
        label="Posted"
        anyLabel="Any time"
        value={values.postedWithin}
        options={POSTED}
        onChange={(postedWithin) => onChange({ postedWithin })}
      />
      <SelectFilter
        id={idPrefix + '-country'}
        label="Country"
        anyLabel="Any country"
        value={values.country}
        options={countries}
        onChange={chooseCountry}
      />
      <SelectFilter
        id={idPrefix + '-company'}
        label="Company"
        anyLabel="Any company"
        value={values.company}
        options={companies}
        onChange={(company) => onChange({ company })}
      />
      <SelectFilter
        id={idPrefix + '-department'}
        label="Department"
        anyLabel="Any department"
        value={values.department}
        options={departments}
        onChange={(department) => onChange({ department })}
      />

      <Button variant="outline" onClick={onReset}>
        Clear all filters
      </Button>
    </div>
  )
}
