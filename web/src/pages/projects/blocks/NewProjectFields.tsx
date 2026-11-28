// New project's fields (increment four, R2), in the desktop's dialog and the
// full screen of an iPad or a phone: Name with its folder line (or why the
// name cannot be made) and Description. No frame draws it yet. Props only.
import { Stack, TextField } from '@eshelton328/component-library-1701'

export const newProjectWords = {
  title: 'New project',
  back: 'Projects',
  backLabel: 'Back to Projects',
  cancel: 'Cancel',
  create: 'Create project',
  name: 'Name',
  description: 'Description',
} as const

const field = { size: 'form', padding: 'form', labelStyle: 'label' } as const

/** What the form holds. */
export type NewProjectDraft = { name: string; purpose: string }

export type NewProjectFieldsProps = {
  draft: NewProjectDraft
  /** The line under Name: "Folder: <slug>" when `free`, else the reason, as the field's error. */
  folder?: { readonly line: string; readonly free: boolean } | undefined
  onChange: (change: Partial<NewProjectDraft>) => void
}

export function NewProjectFields({ draft, folder, onChange }: NewProjectFieldsProps) {
  const words = newProjectWords
  return (
    <Stack gap="16">
      <TextField
        {...field}
        label={words.name}
        value={draft.name}
        onValueChange={(name) => {
          onChange({ name })
        }}
        {...(folder === undefined ? {} : folder.free ? { helperText: folder.line } : { error: folder.line })}
      />
      <TextField
        {...field}
        label={words.description}
        value={draft.purpose}
        onValueChange={(purpose) => {
          onChange({ purpose })
        }}
      />
    </Stack>
  )
}
