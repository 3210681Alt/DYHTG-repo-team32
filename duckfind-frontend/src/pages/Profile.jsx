import { useRef, useState } from 'react'
import { PlusIcon, XIcon } from 'lucide-react'
import { toast } from 'sonner'
import EducationSection from '@/components/EducationSection'
import FormField from '@/components/FormField'
import ResumeSection from '@/components/ResumeSection'
import Section from '@/components/Section'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useAuth } from '@/context/auth'
import { api } from '@/lib/api'
import { fieldForMessage, focusField } from '@/lib/forms'
import { useApi } from '@/lib/useApi'
import { usePageTitle } from '@/lib/usePageTitle'

function SkillsSection() {
  const { user, updateUser, logout } = useAuth()
  const allSkills = useApi('/skills')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const addButton = useRef(null)

  const skills = user.skills || []
  const available = (allSkills.data?.skills || []).filter((skill) => !skills.includes(skill))

  async function handleError(err) {
    // The error itself is already shown as a toast (lib/api.js).
    // If the login ran out: log out locally, and this page shows its log in form.
    if (err.status === 401) await logout()
  }

  async function addSkill(skill) {
    setPickerOpen(false)
    setBusy(true)
    try {
      const data = await api('/profile/skills', { method: 'POST', body: { skill } })
      updateUser({ skills: data.skills })
      toast.success('Added ' + skill)
    } catch (err) {
      handleError(err)
    } finally {
      setBusy(false)
    }
  }

  async function removeSkill(skill) {
    setBusy(true)
    try {
      const data = await api('/profile/skills/' + encodeURIComponent(skill), { method: 'DELETE' })
      updateUser({ skills: data.skills })
      toast.success('Removed ' + skill)
      // The button that had focus is gone, so move focus somewhere sensible
      addButton.current?.focus()
    } catch (err) {
      handleError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Section
      id="skills-heading"
      title="Skills"
      intro="My matches finds jobs that ask for these skills. Add the ones you're comfortable with."
    >
      {skills.length > 0 ? (
        <ul aria-label="Your skills" className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <li
              key={skill}
              className="inline-flex items-center gap-1 rounded-md border-2 border-ink bg-duck-pale py-1 pr-1 pl-3 font-bold"
            >
              {skill}
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-8 hover:bg-duck hover:text-duck-ink"
                onClick={() => removeSkill(skill)}
                disabled={busy}
                aria-label={'Remove ' + skill}
              >
                <XIcon aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="font-bold">You haven't added any skills yet.</p>
      )}

      <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
        <PopoverTrigger asChild>
          {/* Not disabled while saving: it takes focus after a skill is removed */}
          <Button ref={addButton} variant="outline" className="mt-5" disabled={allSkills.loading}>
            <PlusIcon aria-hidden="true" />
            Add a skill
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 p-0">
          <Command>
            <CommandInput placeholder="Search skills" aria-label="Search skills" />
            <CommandList>
              <CommandEmpty>No matching skills.</CommandEmpty>
              <CommandGroup>
                {available.map((skill) => (
                  <CommandItem key={skill} value={skill} onSelect={() => addSkill(skill)}>
                    {skill}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {allSkills.error && <p className="mt-3 font-bold text-stamp">{allSkills.error.message}</p>}
    </Section>
  )
}

function EmailSection() {
  const { user, updateUser } = useAuth()
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  async function submit(event) {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    setSaving(true)
    setError(null)
    try {
      const data = await api('/profile/email', {
        method: 'PATCH',
        body: { email: form.get('email').trim(), currentPassword: form.get('currentPassword') },
      })
      updateUser(data.user)
      formElement.reset()
      toast.success('Email updated')
    } catch (err) {
      const field = fieldForMessage(err.message, [
        ['currentPassword', /current password/i],
        ['email', /email/i],
      ])
      setError({ message: err.message, field })
      if (field) focusField(field === 'email' ? 'email-new' : 'email-current-password')
    } finally {
      setSaving(false)
    }
  }

  const fieldError = (field) => (error && error.field === field ? error.message : null)

  return (
    <Section id="email-heading" title="Email" intro={'Your email is ' + user.email + '.'}>
      <form onSubmit={submit} noValidate className="grid gap-5 sm:max-w-md">
        {error && !error.field && <p className="font-bold text-stamp">{error.message}</p>}
        <FormField
          id="email-new"
          name="email"
          type="email"
          label="New email"
          autoComplete="email"
          required
          error={fieldError('email')}
        />
        <FormField
          id="email-current-password"
          name="currentPassword"
          type="password"
          label="Current password"
          hint="To confirm it's you."
          autoComplete="current-password"
          required
          error={fieldError('currentPassword')}
        />
        <Button type="submit" className="justify-self-start" disabled={saving}>
          {saving ? 'Saving…' : 'Change email'}
        </Button>
      </form>
    </Section>
  )
}

function PasswordSection() {
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  async function submit(event) {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    const currentPassword = form.get('currentPassword')
    const newPassword = form.get('newPassword')

    // Checked here first, so there's no wait for the server
    if (newPassword !== form.get('confirmPassword')) {
      setError({ field: 'confirmPassword', message: "The new passwords don't match" })
      toast.error("The new passwords don't match")
      focusField('password-confirm')
      return
    }
    if (newPassword && newPassword === currentPassword) {
      setError({ field: 'newPassword', message: 'New password must be different from current password' })
      toast.error('New password must be different from current password')
      focusField('password-new')
      return
    }

    setSaving(true)
    setError(null)
    try {
      await api('/profile/password', { method: 'PATCH', body: { currentPassword, newPassword } })
      formElement.reset()
      toast.success('Password changed')
    } catch (err) {
      const field = fieldForMessage(err.message, [
        ['currentPassword', /current password/i],
        ['newPassword', /password/i],
      ])
      setError({ message: err.message, field })
      if (field) focusField(field === 'currentPassword' ? 'password-current' : 'password-new')
    } finally {
      setSaving(false)
    }
  }

  const fieldError = (field) => (error && error.field === field ? error.message : null)

  return (
    <Section id="password-heading" title="Password">
      <form onSubmit={submit} noValidate className="grid gap-5 sm:max-w-md">
        {error && !error.field && <p className="font-bold text-stamp">{error.message}</p>}
        <FormField
          id="password-current"
          name="currentPassword"
          type="password"
          label="Current password"
          autoComplete="current-password"
          required
          error={fieldError('currentPassword')}
        />
        <FormField
          id="password-new"
          name="newPassword"
          type="password"
          label="New password"
          hint="At least 8 characters."
          autoComplete="new-password"
          required
          error={fieldError('newPassword')}
        />
        <FormField
          id="password-confirm"
          name="confirmPassword"
          type="password"
          label="Confirm new password"
          autoComplete="new-password"
          required
          error={fieldError('confirmPassword')}
        />
        <Button type="submit" className="justify-self-start" disabled={saving}>
          {saving ? 'Saving…' : 'Change password'}
        </Button>
      </form>
    </Section>
  )
}

export default function Profile() {
  usePageTitle('Your profile')
  const { user } = useAuth()

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
      <h1 className="text-4xl leading-none font-black tracking-tight font-wide sm:text-5xl">Your profile</h1>
      <p className="mt-3 text-lg text-muted-foreground">
        Logged in as {user.name} (@{user.username})
      </p>

      <div className="mt-10 grid gap-8">
        <SkillsSection />
        <ResumeSection />
        <EducationSection />
        <EmailSection />
        <PasswordSection />
      </div>
    </div>
  )
}
