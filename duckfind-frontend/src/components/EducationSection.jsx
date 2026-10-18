import { useState } from 'react'
import { PencilIcon, Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'
import FormField from '@/components/FormField'
import Section from '@/components/Section'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { api } from '@/lib/api'
import { COURSE_TYPES, GRADUATION_STATUSES, labelFor, monthYear } from '@/lib/education'
import { fieldForMessage, focusField } from '@/lib/forms'
import { useApi } from '@/lib/useApi'

const EMPTY_FORM = { university: '', course: '', courseType: '', status: '', graduationDate: '' }

const FIELD_IDS = {
  university: 'edu-university',
  course: 'edu-course',
  courseType: 'edu-course-type',
  status: 'edu-status',
  graduationDate: 'edu-graduation-date',
}

// Which field a backend message is about ("Course type…" is checked before "Course…")
const MESSAGE_FIELDS = [
  ['courseType', /^course type/i],
  ['course', /^course/i],
  ['status', /^status/i],
  ['graduationDate', /graduation date/i],
  ['university', /^university/i],
]

// "Expected to graduate in June 2027", "Graduated in June 2026"…
function graduationText(item) {
  const status = labelFor(GRADUATION_STATUSES, item.status)
  if (!item.graduationDate) return status
  return status + (item.status === 'not_graduated' ? ' (' : ' in ') + monthYear(item.graduationDate) + (item.status === 'not_graduated' ? ')' : '')
}

function SelectField({ id, label, value, options, placeholder, error, onChange }) {
  return (
    <div className="grid content-start gap-2">
      <Label htmlFor={id} className="font-bold">
        {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          id={id}
          className="w-full"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? id + '-error' : undefined}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent position="popper">
          {options.map(([optionValue, optionLabel]) => (
            <SelectItem key={optionValue} value={optionValue}>
              {optionLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p id={id + '-error'} className="text-sm font-bold text-stamp">
          {error}
        </p>
      )}
    </div>
  )
}

// Universities and courses (the user_universities table), with graduation status and date
export default function EducationSection() {
  const list = useApi('/profile/universities')
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const universities = list.data?.universities || []

  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const fieldError = (field) => (error && error.field === field ? error.message : null)

  function showError(message, field) {
    setError({ message, field })
    if (field) focusField(FIELD_IDS[field])
  }

  function startEditing(item) {
    setEditingId(item.id)
    setError(null)
    setForm({
      university: item.university,
      course: item.course,
      courseType: item.courseType,
      status: item.status,
      graduationDate: item.graduationDate || '',
    })
    focusField(FIELD_IDS.university)
  }

  function stopEditing() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setError(null)
  }

  async function submit(event) {
    event.preventDefault()

    // Required fields are checked here first, in the order they appear on the form
    const missing = [
      ['university', !form.university.trim(), 'University is required'],
      ['course', !form.course.trim(), 'Course is required'],
      ['courseType', !form.courseType, 'Choose a course type'],
      ['status', !form.status, 'Choose whether you have graduated'],
    ].find(([, isMissing]) => isMissing)
    if (missing) {
      toast.error(missing[2])
      return showError(missing[2], missing[0])
    }

    setSaving(true)
    setError(null)
    const body = { ...form, graduationDate: form.graduationDate || null }
    try {
      if (editingId) {
        await api('/profile/universities/' + editingId, { method: 'PATCH', body })
        toast.success('Education updated')
      } else {
        await api('/profile/universities', { method: 'POST', body })
        toast.success('Added ' + form.university.trim())
      }
      stopEditing()
      list.retry()
    } catch (err) {
      // The message is already shown as a toast (lib/api.js); also point at the field
      showError(err.message, fieldForMessage(err.message, MESSAGE_FIELDS))
    } finally {
      setSaving(false)
    }
  }

  async function remove(item) {
    try {
      await api('/profile/universities/' + item.id, { method: 'DELETE' })
      toast.success('Removed ' + item.university)
      if (editingId === item.id) stopEditing()
      list.retry()
    } catch {
      // shown as a toast by lib/api.js
    }
  }

  return (
    <Section
      id="education-heading"
      title="Education"
      intro="Where you study or studied, and when you graduate."
    >
      {universities.length > 0 ? (
        <ul aria-label="Your education" className="grid gap-3">
          {universities.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-start gap-3 rounded-md border-2 border-ink p-4"
            >
              <div className="mr-auto min-w-0">
                <p className="font-extrabold">{item.course}</p>
                <p className="font-bold">{item.university}</p>
                <p className="text-sm text-muted-foreground">
                  {labelFor(COURSE_TYPES, item.courseType)}. {graduationText(item)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => startEditing(item)}
                  aria-label={'Edit ' + item.course + ' at ' + item.university}
                >
                  <PencilIcon aria-hidden="true" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => remove(item)}
                  aria-label={'Remove ' + item.course + ' at ' + item.university}
                  title="Remove"
                >
                  <Trash2Icon aria-hidden="true" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        list.data && <p className="font-bold">You haven't added any education yet.</p>
      )}

      <form onSubmit={submit} noValidate className="mt-6 grid gap-5 border-t-2 border-ink pt-6">
        <h3 className="text-lg font-black">{editingId ? 'Edit education' : 'Add education'}</h3>
        {error && !error.field && <p className="font-bold text-stamp">{error.message}</p>}

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            id={FIELD_IDS.university}
            label="University"
            value={form.university}
            onChange={(event) => setField('university', event.target.value)}
            autoComplete="organization"
            required
            error={fieldError('university')}
          />
          <FormField
            id={FIELD_IDS.course}
            label="Course"
            hint="For example Computing Science"
            value={form.course}
            onChange={(event) => setField('course', event.target.value)}
            required
            error={fieldError('course')}
          />
          <SelectField
            id={FIELD_IDS.courseType}
            label="Course type"
            placeholder="Choose a course type"
            value={form.courseType}
            options={COURSE_TYPES}
            onChange={(value) => setField('courseType', value)}
            error={fieldError('courseType')}
          />
          <SelectField
            id={FIELD_IDS.status}
            label="Graduation"
            placeholder="Have you graduated?"
            value={form.status}
            options={GRADUATION_STATUSES}
            onChange={(value) => setField('status', value)}
            error={fieldError('status')}
          />
          <FormField
            id={FIELD_IDS.graduationDate}
            label="Graduation date"
            hint="When you graduated, or when you expect to. Optional."
            type="date"
            value={form.graduationDate}
            onChange={(event) => setField('graduationDate', event.target.value)}
            error={fieldError('graduationDate')}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add education'}
          </Button>
          {editingId && (
            <Button type="button" variant="outline" onClick={stopEditing}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Section>
  )
}
