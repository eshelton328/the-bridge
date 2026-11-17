// "My notes" on a next step: Erik's note with who wrote it and when, and a
// field to add another. With no note yet it is the field alone; without
// the field (a started task on the tablet) it is the note alone. Props only.
import { Panel, TextArea } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { InboxNextStep } from '../types.ts'

// Figma 403:1889 and 403:1891: Geist Regular 13.
const text = css({ textStyle: 'bodySm', color: 'fg.default', m: '0' })
const by = css({ textStyle: 'monoSm', color: 'fg.muted' })

export function NotesBox({ notes }: { notes: NonNullable<InboxNextStep['notes']> }) {
  const { note, add } = notes
  if (note === undefined)
    return (
      <div data-figma="notes field">
        <TextArea textSize="sm" labelHidden label="Add a note" placeholder={add} autoresize rows={1} />
      </div>
    )
  return (
    <Panel>
      <p className={text}>{note.text}</p>
      <span className={by}>{note.by}</span>
      {add === undefined ? null : (
        <TextArea variant="bare" textSize="sm" labelHidden label="Add a note" placeholder={add} autoresize rows={1} />
      )}
    </Panel>
  )
}
