// A harness note in a chat's transcript (R46): a background task's report, a
// peer's message or a Stop hook. The owner saw these drawn as his own bubbles,
// so a note never takes the owner's bubble or its colour: it is a small line in
// `fg.muted` (which passes 4.5:1 on every surface) with its kind's library
// icon and no bubble. A task draws the agent (a robot), a peer's message the
// chat icon (a speech box) and a hook the toolkit's hook icon (an anchor). The
// icon is named by the note's label (Task, Message, Hook). Figma draws no note,
// so the line follows the tool row's quiet look; its text wraps, as a note says
// what happened in a sentence. Props only.
import type { NoteKind } from '@bridge/contract'
import { AgentIcon, ChatIcon, HookIcon, type IconProps } from '@eshelton328/component-library-1701'
import { memo, type ComponentType } from 'react'
import { css } from '../../../../styled-system/css/index.js'

const icons: Record<NoteKind, ComponentType<IconProps>> = {
  task: AgentIcon,
  peer: ChatIcon,
  hook: HookIcon,
}

const line = css({
  display: 'flex',
  alignItems: 'baseline',
  gap: '6',
  minW: '[0]',
  maxW: '[100%]',
  textStyle: 'small',
  color: 'fg.muted',
})
const mark = css({ display: 'inline-flex', flexShrink: '0' })
const text = css({ minW: '[0]', overflowWrap: 'anywhere' })

export type NoteLineProps = {
  kind: NoteKind
  /** The note's kind as a word, such as "Task": the icon's name. */
  label: string
  text: string
  /** The Figma layer the entry stands for, for the fidelity checks. */
  figma?: string | undefined
}

export const NoteLine = memo(function NoteLine({ kind, label, text: words, figma }: NoteLineProps) {
  const Icon = icons[kind]
  return (
    <p className={line} data-note-kind={kind} data-figma={figma}>
      <span className={mark}>
        <Icon size="12" title={label} />
      </span>
      <span className={text}>{words}</span>
    </p>
  )
})
