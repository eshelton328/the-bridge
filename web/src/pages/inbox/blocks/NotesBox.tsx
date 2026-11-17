// "My notes" on a next step: Erik's note with who wrote it and when, and a
// field to add another. Props only.
import { Panel, TextArea } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { InboxNextStep } from '../types.ts'

const text = css({ textStyle: 'body', color: 'fg.default', m: '0' })
const by = css({ textStyle: 'mono', color: 'fg.muted' })

export function NotesBox({ notes }: { notes: NonNullable<InboxNextStep['notes']> }) {
  return (
    <Panel>
      <p className={text}>{notes.text}</p>
      <span className={by}>{notes.by}</span>
      <TextArea variant="bare" labelHidden label="Add a note" placeholder={notes.add} rows={1} />
    </Panel>
  )
}
