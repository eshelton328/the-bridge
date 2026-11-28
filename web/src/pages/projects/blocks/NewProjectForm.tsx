// New project's form (increment four, R1), plain: the library `Dialog` on the
// desktop, else a full screen whose back row has Projects and Create project,
// which is off while `canCreate` is false and does nothing without `onCreate`
// (fixtures). Props only.
import { BackRow, Button, Dialog, DialogClose, Stack } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import { NewProjectFields, type NewProjectFieldsProps, newProjectWords as words } from './NewProjectFields.tsx'

// The home's sides (ProjectsHome.tsx), 24 under the top.
const screen = {
  tablet: css({ pt: '24', pb: '32', px: '32' }),
  phone: css({ pt: '24', pb: '16', px: '16' }),
}
const title = css({ textStyle: 'heading', color: 'fg.default' })

export type NewProjectView = NewProjectFieldsProps & {
  canCreate: boolean
  onCreate?: (() => void) | undefined
  onClose: () => void
}

export type NewProjectFormProps = { view: NewProjectView; layout: Viewport }

export function NewProjectForm({ view, layout }: NewProjectFormProps) {
  const { canCreate, onCreate, onClose, ...fields } = view
  const create = (
    <Button variant="primary" size={layout === 'desktop' ? 'md' : 'lg'} disabled={!canCreate} onClick={onCreate}>
      {words.create}
    </Button>
  )
  if (layout === 'desktop')
    return (
      <Dialog
        size="lg"
        padding="form"
        title={words.title}
        closeButton
        open
        onOpenChange={(open) => {
          if (!open) onClose()
        }}
        actions={
          <>
            <DialogClose>
              <Button>{words.cancel}</Button>
            </DialogClose>
            {create}
          </>
        }
      >
        <NewProjectFields {...fields} />
      </Dialog>
    )
  return (
    <Stack gap="16" className={screen[layout]} data-figma="new project">
      <BackRow label={words.back} backLabel={words.backLabel} onBack={onClose}>
        {create}
      </BackRow>
      <h1 className={title}>{words.title}</h1>
      <NewProjectFields {...fields} />
    </Stack>
  )
}
