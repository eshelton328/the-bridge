// The Add a link dialog (D5 403:7541), for an artifact the library did not
// find, such as a Codex site on its own domain: the form's fields
// (`AddLinkFields`), then Cancel and Add artifact. It pads 24 and draws a
// 20 px close × (`padding="form"`, `closeSize="20"`, Figma 18). The link field has the
// focus when it opens. On a phone the same form is a sheet (`AddLinkSheet`,
// M6). Props only.
import { Button, Dialog, DialogClose, PlusIcon } from '@eshelton328/component-library-1701'
import { useRef } from 'react'
import type { AddLinkForm } from '../types.ts'
import { AddLinkFields, type AddLinkSource } from './AddLinkFields.tsx'

export type AddLinkDialogProps = {
  form: AddLinkForm
  open: boolean
  /** The picked source. */
  source: AddLinkSource
  onOpenChange?: ((open: boolean) => void) | undefined
  onSourceChange?: ((source: AddLinkSource) => void) | undefined
  /** The picked project; the form's `project.value` when not set. */
  project?: string | undefined
  onProjectChange?: ((project: string) => void) | undefined
  /** Add artifact was pressed. */
  onSubmit?: (() => void) | undefined
}

export function AddLinkDialog({
  form,
  open,
  source,
  onOpenChange,
  onSourceChange,
  project,
  onProjectChange,
  onSubmit,
}: AddLinkDialogProps) {
  const linkRef = useRef<HTMLDivElement>(null)
  return (
    <Dialog
      size="lg"
      padding="form"
      closeSize="20"
      title={form.title}
      description={form.description}
      closeButton
      open={open}
      onOpenChange={onOpenChange}
      initialFocus={() => linkRef.current?.querySelector('input') ?? null}
      data-figma="dialog · Add a link"
      actions={
        <>
          <DialogClose>
            <Button data-figma="button · Cancel">{form.cancel}</Button>
          </DialogClose>
          <Button variant="primary" data-figma="button · Add artifact" onClick={onSubmit}>
            <PlusIcon />
            {form.submit}
          </Button>
        </>
      }
    >
      <AddLinkFields
        form={form}
        layout="dialog"
        source={source}
        onSourceChange={onSourceChange}
        project={project}
        onProjectChange={onProjectChange}
        linkRef={linkRef}
      />
    </Dialog>
  )
}
