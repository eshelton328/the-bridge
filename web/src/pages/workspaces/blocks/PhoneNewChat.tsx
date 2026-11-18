// The New chat form on the phone (M7 105:3248): it fills the screen with no
// tab bar. The header has Cancel at the start and the title in the middle;
// the fields (NewChatFields) scroll between it and the start bar, which sums
// up the choices over Start chat, within thumb reach. The header and the
// start bar stay put and only the fields scroll (d-107, `ScrollFrame`).
// With the keyboard up (M11 147:174) the start bar keeps Start chat alone,
// just over the keyboard. Props only.
import { ArrowUpIcon, Button, ScrollFrame } from '@eshelton328/component-library-1701'
import { useEffect, useRef } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { NewChatForm, NewChatLayers, Workspace } from '../types.ts'
import { NewChatFields } from './NewChatFields.tsx'

// The detail slot is a flex column; the form fills it.
const column = css({ display: 'flex', flexDirection: 'column', flex: '1', minW: '[0]', minH: '[0]' })
// M7 105:3273: Cancel 16 in from the start and the title centred on the screen; the row is 39 high.
const header = css({
  display: 'grid',
  gridTemplateColumns: '[1fr auto 1fr]',
  alignItems: 'center',
  px: '16',
  py: '6',
})
// Figma's Cancel (105:3274) is the bare word in the accent colour, 16 in. A text button pads its label 8, so the
// button starts 8 before it and the label carries the layer.
const cancel = css({ justifySelf: 'start', ms: '-8' })
const title = css({ textStyle: 'subtitle', color: 'fg.default', m: '0' })
// M7 105:3282: the fields start 4 under the header, 16 in from the sides; Figma puts them 18 apart, off the 4 px grid,
// so they are 16 apart (d-100).
const body = css({ px: '16', pt: '4', pb: '16', gap: '16' })
// M7 147:8: the summary 8 under the fields and Start chat 8 under it, 16 in from the sides. The footer clips what
// reaches past its edge, so the bar pads 4 under Start chat: its focus ring (2 out, 2 wide) shows whole.
const bar = css({ display: 'flex', flexDirection: 'column', gap: '8', px: '16', pt: '8', pb: '4' })
// The summary is as wide as its text, as Figma's (147:9).
const summary = css({ alignSelf: 'flex-start', textStyle: 'monoSm', color: 'fg.subtle', m: '0' })
const start = css({ w: '[100%]' })

export type PhoneNewChatProps = {
  form: NewChatForm
  workspaces: readonly Workspace[]
  /** Called when Erik presses Cancel. */
  onCancel?: (() => void) | undefined
  /** Called when Erik presses Start chat. */
  onStart?: (() => void) | undefined
  /** The keyboard is up (M11): the start bar has no summary. */
  keyboardOpen?: boolean | undefined
  /** The frame's Figma layers. */
  layers?: NewChatLayers | undefined
}

/** Fills in the summary's `{workspace}`, `{model}` and `{folders}` from the form's values. */
function summaryText(form: NewChatForm, workspaces: readonly Workspace[]): string | undefined {
  if (form.summary === undefined) return undefined
  const workspace = workspaces.find((w) => w.id === form.workspace)?.label ?? form.workspace
  const model = form.model.options.find((o) => o.value === form.model.value)
  return form.summary
    .replace('{workspace}', workspace)
    .replace('{model}', model?.short ?? model?.label ?? form.model.value)
    .replace('{folders}', String(form.folders.length))
}

export function PhoneNewChat({ form, workspaces, onCancel, onStart, keyboardOpen, layers }: PhoneNewChatProps) {
  const messageRef = useRef<HTMLDivElement>(null)
  const nameRef = useRef<HTMLDivElement>(null)
  const focus = form.focus ?? 'message'
  // The first message has the focus when the form opens, as Figma draws its cyan border (105:3327); in M11 the name
  // has it, the caret after the typed name (147:213).
  useEffect(() => {
    if (focus === 'name') {
      const input = nameRef.current?.querySelector('input')
      input?.focus()
      input?.setSelectionRange(input.value.length, input.value.length)
    } else messageRef.current?.querySelector('textarea')?.focus()
  }, [focus])
  const line = keyboardOpen === true ? undefined : summaryText(form, workspaces)
  return (
    <section aria-label={form.title} className={column}>
      <ScrollFrame
        bodyClassName={body}
        header={
          <div className={header} data-figma={layers?.header}>
            <Button variant="text" size="xs" className={cancel} onClick={onCancel}>
              <span data-figma={layers?.cancel}>{form.cancel}</span>
            </Button>
            <h2 className={title} data-figma={layers?.title}>
              {form.title}
            </h2>
          </div>
        }
        footer={
          <div className={bar} data-figma={layers?.startBar}>
            {line === undefined ? null : (
              <p className={summary} data-figma={layers?.summary}>
                {line}
              </p>
            )}
            <Button variant="primary" size="xl" className={start} onClick={onStart} data-figma={layers?.start}>
              <ArrowUpIcon size="16" />
              {form.start}
            </Button>
          </div>
        }
      >
        <NewChatFields form={form} workspaces={workspaces} messageRef={messageRef} nameRef={nameRef} layers={layers} />
      </ScrollFrame>
    </section>
  )
}
