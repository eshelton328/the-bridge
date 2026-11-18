// The folder picker beside the main chat (D4 128:330): its title and Close,
// a note, the search, the recent folders (those the chat has are marked
// added; the chosen one has the cyan border) and the folders of one path,
// each opening its own (FolderPickerList), then Cancel and Add. It takes the
// side slot. The library has no folder picker (LIBRARY_GAPS.md: Folder
// picker). Props only.
import { Button, Inline, PlusIcon } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { FolderPicker } from '../types.ts'
import { FolderPickerList } from './FolderPickerList.tsx'

const panel = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '10',
  flex: '1',
  minH: '[0]',
  // D4 128:331: the title row sits 19 from the top; the 24 px close button centres it 16 down.
  pt: '16',
  px: '16',
  pb: '20',
  bg: 'surface.pane',
  borderLeftWidth: 'default',
  borderLeftStyle: 'solid',
  borderLeftColor: 'border.default',
})
const rest = css({ flex: '1' })

export type FolderPickerPaneProps = {
  picker: FolderPicker
  /** The chosen folder, by path. */
  picked: string | null
  onPick?: ((path: string) => void) | undefined
  onClose?: (() => void) | undefined
}

export function FolderPickerPane({ picker, picked, onPick, onClose }: FolderPickerPaneProps) {
  return (
    <aside data-figma="128:330" aria-label={picker.title} className={panel}>
      <FolderPickerList picker={picker} picked={picked} onPick={onPick} onClose={onClose} />
      <div className={rest} />
      <Inline gap="8" align="center" justify="end">
        <Button size="sm" textSize="sm" data-figma="128:398">
          {picker.cancel}
        </Button>
        <Button size="sm" textSize="smStrong" variant="primary" data-figma="128:400">
          <PlusIcon size="12" />
          {picker.add.replace('{folder}', picked ?? '')}
        </Button>
      </Inline>
    </aside>
  )
}
