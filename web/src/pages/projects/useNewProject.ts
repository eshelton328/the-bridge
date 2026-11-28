// New project's form for ProjectsPage.tsx (increment four): the draft, the
// folder of the name as typed (R2, R3) and Create project (R6). Only the newest
// folder answer counts, as answers can cross. A create that misses keeps the
// form and its values with one line. On fixtures (`live` false) no read or
// create goes out.
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
    setForm(undefined)
  }
  const onChange = (change: Partial<NewProjectDraft>) => {
    if (form === undefined) return
    const draft = { ...form.draft, ...change }
    update({ draft })
    if (change.name === undefined || !live) return
    askedRef.current += 1
    const mine = askedRef.current
    if (draft.name.trim() === '') return
    void readSlug(draft.name).then((check) => {
      if (mine === askedRef.current) update({ folder: { ...check, name: draft.name } })
    })
  }
  const folder = form?.folder?.name === form?.draft.name ? form?.folder : undefined
  const onCreate = () => {
    if (form === undefined) return
    setBusy(true)
    void createProject(form.draft).then((made) => {
      setBusy(false)
      if (!made.ok) {
        update({ line: made.error })
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
