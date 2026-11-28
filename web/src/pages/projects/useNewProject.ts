// New project's form for ProjectsPage.tsx (increment four): the draft, the
// folder of the name as typed (R2, R3) and Create project (R6). Only the newest
// folder answer counts, as answers can cross. A create that misses keeps the
// form and its values with one line; with no answer, the folder is read again,
// so a project that was made shows as taken. A create's answer counts only for
// the form that sent it. On fixtures (`live` false) no read or create goes out.
import { useRef, useState } from 'react'
import type { NewProjectDraft } from './blocks/NewProjectFields.tsx'
import type { NewProjectView } from './blocks/NewProjectForm.tsx'
import { createProject, readSlug, type SlugCheck } from './liveProjects.ts'

const empty: NewProjectDraft = { name: '', purpose: '', icon: null }

type Form = { draft: NewProjectDraft; picking: boolean; folder?: SlugCheck & { name: string }; line?: string }

/** The form's view while it is open, and `open`; `onCreated` gets the new project's slug. */
export function useNewProject(live: boolean, onCreated: (slug: string) => void) {
  const [form, setForm] = useState<Form | undefined>(undefined)
  const [busy, setBusy] = useState(false)
  const askedRef = useRef(0)
  const update = (change: Partial<Form>) => {
    setForm((f) => (f === undefined ? f : { ...f, ...change }))
  }
  const close = () => {
    askedRef.current += 1
    formRef.current += 1
    setForm(undefined)
  }
  // The open form's number: a create's answer for a form that closed is not this form's.
  const formRef = useRef(0)
  const checkFolder = (name: string) => {
    askedRef.current += 1
    const mine = askedRef.current
    if (name.trim() === '') return
    void readSlug(name).then((check) => {
      if (mine === askedRef.current) update({ folder: { ...check, name } })
    })
  }
  const onChange = (change: Partial<NewProjectDraft>) => {
    if (form === undefined) return
    const draft = { ...form.draft, ...change }
    update({ draft })
    if (change.name !== undefined && live) checkFolder(draft.name)
  }
  const folder = form?.folder?.name === form?.draft.name ? form?.folder : undefined
  const onCreate = () => {
    if (form === undefined) return
    const sent = formRef.current
    setBusy(true)
    void createProject(form.draft).then((made) => {
      setBusy(false)
      if (sent !== formRef.current) return
      if (!made.ok) {
        update({ line: made.error.line })
        if (made.error.unknown) checkFolder(form.draft.name)
        return
      }
      close()
      onCreated(made.value)
    })
  }
  const view: NewProjectView | undefined =
    form === undefined
      ? undefined
      : {
          draft: form.draft,
          folder,
          picking: form.picking,
          line: form.line,
          canCreate: !busy && (live ? folder?.free === true : form.draft.name.trim() !== ''),
          onCreate: live ? onCreate : undefined,
          onChange,
          onPickingChange: (picking) => {
            update({ picking })
          },
          onClose: close,
        }
  return {
    view,
    open: () => {
      setForm({ draft: empty, picking: false })
    },
  }
}
