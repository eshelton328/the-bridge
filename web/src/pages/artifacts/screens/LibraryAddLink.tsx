// Add a link's dialog (D5) as the library and the open artifact's list pane
// (D2) both open it: the form of `data.addLinkForm`, open while
// `ui.addLinkOpen`. With `onSubmit` (the live library) the fields are the
// owner's and Add artifact sends them; without it Add artifact only closes
// the dialog, as Figma's mock-up does.
// Props only; changes go out through onUiChange.
import { AddLinkDialog } from '../blocks/AddLinkDialog.tsx'
import type { AddLinkForm, ArtifactsUi } from '../types.ts'
import { addLinkEntry, shownSource } from './addLinkView.ts'

export type LibraryAddLinkProps = {
  form: AddLinkForm
  ui: ArtifactsUi
  onUiChange?: ((change: Partial<ArtifactsUi>) => void) | undefined
  onSubmit?: (() => void) | undefined
  /** The last Add's miss, under the link field. */
  error?: string | undefined
}

export function LibraryAddLink({ form, ui, onUiChange, onSubmit, error }: LibraryAddLinkProps) {
  return (
    <AddLinkDialog
      form={form}
      open={ui.addLinkOpen ?? false}
      source={shownSource(form, ui)}
      entry={onSubmit === undefined ? undefined : addLinkEntry(form, ui, onUiChange, error)}
      onOpenChange={(addLinkOpen) => {
        onUiChange?.({ addLinkOpen })
      }}
      onSourceChange={(addLinkSource) => {
        onUiChange?.({ addLinkSource })
      }}
      project={ui.addLinkProject}
      onProjectChange={(addLinkProject) => {
        onUiChange?.({ addLinkProject })
      }}
      onSubmit={
        onSubmit ??
        (() => {
          onUiChange?.({ addLinkOpen: false })
        })
      }
    />
  )
}
