// A chat row of the phone's list while the owner renames it in edit mode (M2
// 105:2535): the drag handle, the kind mark, and the name as a field with ×
// over the meta line. The field takes the row's width, so the row shows no
// status. A tap outside the field saves the name; × undoes the change. No
// library row holds a field (LIBRARY_GAPS.md: Rename field), so the row is
// laid out here from library parts. Props only.
import { GripIcon, Inline, KindMark, Stack } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { SidebarChat } from '../types.ts'
import { ChatMeta } from './ChatMeta.tsx'
import { ChatNameField } from './ChatNameField.tsx'

// M2 105:2535: the handle 10 in from the row's edge (105:2536), the field to 10 from its end (146:37). The field is
// 28 high (control.sm) where Figma's is 25, so the row pads 8 above it, as Figma does, and 4 under the meta line,
// and keeps Figma's 58.
const row = css({ px: '10', pt: '8', pb: '4' })
const grip = css({ color: 'fg.subtle', flexShrink: '0' })
// M2 105:2547: the meta line 3 under the field, in the row's mono.
const meta = css({ textStyle: 'monoSm', color: 'fg.muted' })
const text = css({ flex: '1', minW: '[0]' })

export type PhoneRenameRowProps = {
  chat: SidebarChat
  /** The text in the field as it opens. */
  draft: string
  /** The field takes the focus as it opens. */
  autoFocus: boolean
  onSave?: ((name: string) => void) | undefined
  onCancel?: (() => void) | undefined
  /** The Figma layers of the row and its field, for the fidelity checks. */
  figma?: string | undefined
  fieldFigma?: string | undefined
}

export function PhoneRenameRow({ chat, draft, autoFocus, onSave, onCancel, figma, fieldFigma }: PhoneRenameRowProps) {
  return (
    <Inline gap="6" align="center" className={row} data-figma={figma}>
      {/* M2 105:2543: the kind mark is 6 after the handle and the field 6 after the mark. */}
      <span className={grip}>
        <GripIcon size="12" />
      </span>
      <KindMark kind={chat.kind} size="16" />
      <Stack gap="2" className={text}>
        <ChatNameField
          name={chat.title}
          draft={draft}
          autoFocus={autoFocus}
          fill
          onSave={onSave}
          onCancel={onCancel}
          figma={fieldFigma}
        />
        <ChatMeta chat={chat} className={meta} />
      </Stack>
    </Inline>
  )
}
