// "My notes" on a next step: Erik's note with who wrote it and when, and a
// field to add another. Props only.
import { Panel, TextArea } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { InboxNextStep } from '../types.ts'

// Figma 403:1889 and 403:1891: Geist Regular 13.
const text = css({ textStyle: 'bodySm', color: 'fg.default', m: '0' })
const by = css({ textStyle: 'monoSm', color: 'fg.muted' })

export function NotesBox({ notes }: { notes: NonNullable<InboxNextStep['notes']> }) {
  return (
    <Panel>
      <p className={text}>{notes.text}</p>
      <span className={by}>{notes.by}</span>
      <TextArea
        variant="bare"
        textSize="sm"
        labelHidden
        label="Add a note"
        placeholder={notes.add}
        autoresize
        rows={1}
      />
    </Panel>
  )
}
