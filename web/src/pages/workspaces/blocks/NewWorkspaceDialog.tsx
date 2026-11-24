// The live New workspace dialog (W4, backend #471): the phone's and the
// tablet's + menu (M15) and the desktop sidebar's + (D2 105:617) open it, at
// every size. Its one field is the name, which may stay empty: the server
// names the workspace "untitled" (`defaultWorkspaceName`). A name the
// contract's `Label` refuses (over `maxLabel` characters, a control
// character) is the field's error and is not sent. Create, or Enter in the
// field, posts once at a time; `created` closes the dialog, and the page
// opens the workspace once the list shows it (useWorkspaceEdits.ts). A 400
// shows the server's words as the field's error; herdr's 502 or 503 and an
// unreachable server show a line with Retry, which posts the same name
// again; any other miss shows its line alone. Cancel and Escape send
// nothing. M15 draws New workspace as a workspace added with its name a
// field in edit mode; the live page asks for the name first, in one dialog
// at every size, as the desktop has no such field (bridge-coord, R59 part
// 2). The library's `Dialog` with a `TextField`, the focus in the field, as
// CompactDialog. Props only.
import { defaultWorkspaceName, Label, maxLabel } from '@bridge/contract'
import { Button, Dialog, DialogClose, TextField } from '@eshelton328/component-library-1701'
import { useId, useRef, useState } from 'react'
import type { NewWorkspaceAnswer } from '../types.ts'
import { TranscriptProblem } from './TranscriptProblem.tsx'

export type NewWorkspaceDialogProps = {
  onOpenChange: (open: boolean) => void
  /** Makes the workspace with the name as typed (empty for the server's name); none draws Create off. */
  onCreate?: ((name: string) => Promise<NewWorkspaceAnswer>) | undefined
}

/** The field's error for `name` by the contract's `Label`: none for an empty name, which the server names. */
function errorOf(name: string): string | undefined {
  if (name.trim() === '' || Label.safeParse(name).success) return undefined
  return `A name has 1 to ${String(maxLabel)} characters and no control character`
}

type Miss = { readonly line: string; readonly retry: boolean }

export function NewWorkspaceDialog({ onOpenChange, onCreate }: NewWorkspaceDialogProps) {
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState<string>()
  const [miss, setMiss] = useState<Miss>()
  const [pending, setPending] = useState(false)
  // A ref, not state: a second tap or Enter in the same frame must see the first one's post.
  const runningRef = useRef(false)
  const formId = useId()
  const formRef = useRef<HTMLFormElement>(null)
  const error = errorOf(name) ?? nameError
  const submit = () => {
    if (onCreate === undefined || runningRef.current || errorOf(name) !== undefined) return
    runningRef.current = true
    setPending(true)
    setMiss(undefined)
    setNameError(undefined)
    void onCreate(name)
      .then((answer) => {
        if (answer.kind === 'created') onOpenChange(false)
        else if (answer.kind === 'name') setNameError(answer.line)
        else setMiss({ line: answer.line, retry: answer.kind === 'retry' })
      })
      .finally(() => {
        runningRef.current = false
        setPending(false)
      })
  }
  return (
    <Dialog
      title="New workspace"
      description="A workspace with one shell, in the chat folder."
      open
      onOpenChange={onOpenChange}
      initialFocus={() => formRef.current?.querySelector('input') ?? null}
      actions={
        <>
          <DialogClose>
            <Button size="sm" textSize="sm">
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="submit"
            form={formId}
            size="sm"
            textSize="smStrong"
            variant="primary"
            disabled={onCreate === undefined || pending || errorOf(name) !== undefined}
          >
            {pending ? 'Creating…' : 'Create'}
          </Button>
        </>
      }
    >
      <form
        id={formId}
        ref={formRef}
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <TextField
          label="Name (optional)"
          placeholder={defaultWorkspaceName}
          value={name}
          onValueChange={(next) => {
            setName(next)
            setNameError(undefined)
          }}
          error={error}
        />
      </form>
      {miss === undefined ? null : <TranscriptProblem text={miss.line} onRetry={miss.retry ? submit : undefined} />}
    </Dialog>
  )
}
