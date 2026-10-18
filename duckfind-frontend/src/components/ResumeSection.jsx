import { useRef, useState } from 'react'
import { DownloadIcon, FileTextIcon, UploadIcon } from 'lucide-react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import Section from '@/components/Section'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/auth'
import { api } from '@/lib/api'

const MAX_MB = 5

// The user's CV: upload a PDF (stored on Cloudinary), download it, replace or remove it.
// The backend picks keywords out of it, which My matches uses in its "From your CV" tab.
export default function ResumeSection() {
  const { user, updateUser, logout } = useAuth()
  const [busy, setBusy] = useState(false)
  const fileInput = useRef(null)
  const uploadButton = useRef(null)
  const hasResume = Boolean(user.resumeUploadedAt)

  async function handleError(err) {
    // The error is already shown as a toast (lib/api.js)
    if (err.status === 401) await logout()
  }

  async function upload(event) {
    const file = event.target.files[0]
    // Clear the input so picking the same file again still counts as a change
    event.target.value = ''
    if (!file) return
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return toast.error('Your CV must be a PDF')
    }
    if (file.size > MAX_MB * 1024 * 1024) return toast.error(`Your CV must be ${MAX_MB} MB or smaller`)

    const form = new FormData()
    form.append('resume', file)
    setBusy(true)
    try {
      const { resume } = await api('/profile/resume', {
        method: 'PUT',
        body: form,
      })
      updateUser({
        resumeName: resume.name,
        resumeKeywords: resume.keywords,
        resumeUploadedAt: resume.uploadedAt,
      })
      toast.success(hasResume ? 'CV replaced' : 'CV uploaded')
    } catch (err) {
      handleError(err)
    } finally {
      setBusy(false)
    }
  }

  // The file is private, so ask for a fresh download link each time
  async function download() {
    try {
      const { resume } = await api('/profile/resume')
      if (resume.downloadUrl) window.location.assign(resume.downloadUrl)
    } catch (err) {
      handleError(err)
    }
  }

  async function remove() {
    setBusy(true)
    try {
      await api('/profile/resume', { method: 'DELETE' })
      updateUser({
        resumeName: null,
        resumeKeywords: [],
        resumeUploadedAt: null,
      })
      toast.success('CV removed')
      // The Remove button is gone, so move focus to the upload button
      uploadButton.current?.focus()
    } catch (err) {
      handleError(err)
    } finally {
      setBusy(false)
    }
  }

  const uploadedOn = hasResume
    ? new Date(user.resumeUploadedAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : ''

  return (
    <Section
      id="cv-heading"
      title="CV"
      intro="Upload your CV as a PDF and My matches will show jobs that fit it. Only you can download it."
    >
      {hasResume ? (
        <>
          <div className="flex items-start gap-3 rounded-md border-2 border-ink bg-duck-pale p-4">
            <FileTextIcon aria-hidden="true" className="mt-0.5 size-6 shrink-0" />
            <div className="min-w-0">
              <p className="font-bold break-words">{user.resumeName || 'Your CV'}</p>
              <p className="text-sm">Uploaded {uploadedOn}</p>
            </div>
          </div>

          {user.resumeKeywords?.length > 0 && (
            <div className="mt-5">
              <h3 className="font-bold">What we found in it</h3>
              <ul aria-label="Keywords from your CV" className="mt-2 flex flex-wrap gap-2">
                {user.resumeKeywords.map((keyword) => (
                  <li key={keyword}>
                    <Badge variant="secondary">{keyword}</Badge>
                  </li>
                ))}
              </ul>
              <Button asChild variant="link" className="mt-2 px-0">
                <Link to="/matches?from=cv">See jobs that fit your CV</Link>
              </Button>
            </div>
          )}
        </>
      ) : (
        <p className="font-bold">You haven't uploaded a CV yet.</p>
      )}

      <input
        ref={fileInput}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={upload}
      />
      <div className="mt-5 flex flex-wrap gap-3">
        <Button
          ref={uploadButton}
          variant={hasResume ? 'outline' : 'default'}
          onClick={() => fileInput.current.click()}
          disabled={busy}
        >
          <UploadIcon aria-hidden="true" />
          {busy ? 'Working…' : hasResume ? 'Replace CV' : 'Upload CV (PDF)'}
        </Button>
        {hasResume && (
          <>
            <Button variant="outline" onClick={download} disabled={busy}>
              <DownloadIcon aria-hidden="true" />
              Download
            </Button>
            <Button variant="ghost" onClick={remove} disabled={busy}>
              Remove
            </Button>
          </>
        )}
      </div>
    </Section>
  )
}
