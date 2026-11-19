// "My notes" on a next step: the owner's note with who wrote it and when, and a
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
  /** Keeps the note the owner is typing; see `InboxDrafts` in types.ts. */
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
    // Figma's notes card (D1 346:404) pads 10 at the top and bottom and 12 at the sides: the notice
    // Panel. Its note, author and "Add a note…" lines start 25 and 20 px apart (D1 657, 682, 702;
    // T4 346:6219 and 346:6220); the 20, 16 and 20 px line boxes 4 apart start 24 and 20 apart.
    <Panel variant="notice">
      <Stack gap="4">
        <p className={text}>{note.text}</p>
        <span className={by}>{note.by}</span>
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
      </Stack>
    </Panel>
  )
}
