// New project's form for ProjectsPage.tsx (increment four): the draft and the
// folder of the name as typed (R2, R3). Only the newest folder answer counts,
// as answers can cross. On fixtures (`live` false) no read goes out.
import { useRef, useState } from 'react'
import type { NewProjectDraft } from './blocks/NewProjectFields.tsx'
import type { NewProjectView } from './blocks/NewProjectForm.tsx'
import { readSlug, type SlugCheck } from './liveProjects.ts'

const empty: NewProjectDraft = { name: '', purpose: '' }

type Form = { draft: NewProjectDraft; folder?: SlugCheck & { name: string } }

/** The form's view while it is open, and `open`. */
export function useNewProject(live: boolean) {
  const [form, setForm] = useState<Form | undefined>(undefined)
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
  const view: NewProjectView | undefined =
    form === undefined
      ? undefined
      : {
          draft: form.draft,
          folder,
          canCreate: live ? folder?.free === true : form.draft.name.trim() !== '',
          onChange,
          onClose: close,
        }
  return {
    view,
    open: () => {
      setForm({ draft: empty })
    },
  }
}
