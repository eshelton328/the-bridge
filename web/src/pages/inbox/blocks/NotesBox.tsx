// "My notes" on a next step: Erik's note with who wrote it and when, and a
// field to add another. With no note yet it is the field alone; without
// the field (a started task on the tablet) it is the note alone. Props only.
import { Panel, Stack, TextArea } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import { draftProps, type InboxDrafts, type InboxNextStep } from '../types.ts'

// Figma 403:1889 and 403:1891: Geist Regular 13.
const text = css({ textStyle: 'bodySm', color: 'fg.default', m: '0' })
const by = css({ textStyle: 'monoSm', color: 'fg.muted' })

export type NotesBoxProps = {
  notes: NonNullable<InboxNextStep['notes']>
  /** Keeps the note Erik is typing; see `InboxDrafts` in types.ts. */
  drafts?: InboxDrafts | undefined
}

export function NotesBox({ notes, drafts }: NotesBoxProps) {
  const { note, add } = notes
  const typed = draftProps(drafts, 'note')
  if (note === undefined)
    return (
      <div data-figma="notes field">
        <TextArea textSize="sm" labelHidden label="Add a note" placeholder={add} autoresize rows={1} {...typed} />
      </div>
    )
  return (
    <Panel>
      {/* Figma T4 346:6219 and 346:6220: the note's 19 px line and its author 25 apart. */}
      <Stack gap="4">
        <p className={text}>{note.text}</p>
        <span className={by}>{note.by}</span>
      </Stack>
      {add === undefined ? null : (
        <TextArea
          variant="bare"
          textSize="sm"
          labelHidden
          label="Add a note"
          placeholder={add}
          autoresize
          rows={1}
          {...typed}
        />
      )}
    </Panel>
  )
}
