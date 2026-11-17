// The header of a chat shown alone (D2 105:785): the kind mark, the title over
// its workspace, the status and the chat actions; under them the model, the
// context used and its label. The library's `Pane` header has one row
// (LIBRARY_GAPS.md: Chat header). Props only.
import {
  Button,
  ContextMeter,
  Inline,
  KindMark,
  ModelChip,
  MoreIcon,
  StatusPill,
} from '@eshelton328/component-library-1701'
import type { ReactNode } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { PaneHead } from '../types.ts'

const head = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
  pt: '12',
  pb: '8',
  px: '16',
  borderBottomWidth: 'default',
  borderBottomStyle: 'solid',
  borderBottomColor: 'border.default',
})
const titles = css({ display: 'flex', flexDirection: 'column', flex: '1', minW: '[0]' })
const title = css({ textStyle: 'subtitle', color: 'fg.default', m: '0' })
const where = css({ textStyle: 'mono', color: 'fg.muted' })
const label = css({ textStyle: 'mono', color: 'fg.muted' })

export type ChatHeadProps = {
  head: PaneHead
  /** The workspace the chat is in. */
  workspace: string
  contextLabel: string
  /** The chat actions menu, with its trigger; a plain button when not set. */
  menu?: ReactNode
}

export function ChatHead({ head: chat, workspace, contextLabel, menu }: ChatHeadProps) {
  return (
    <header data-figma="105:785" className={head}>
      <Inline gap="8" align="center">
        <KindMark kind={chat.kind} size="20" />
        <div className={titles}>
          <h2 className={title}>{chat.title}</h2>
          <span className={where}>{workspace}</span>
        </div>
        <StatusPill label={chat.status.label} tone={chat.status.tone} dot />
        {menu ?? (
          <Button size="xs" aria-label={`${chat.title} actions`} data-figma="400:2">
            <MoreIcon size="12" />
          </Button>
        )}
      </Inline>
      <Inline gap="8" align="center">
        <ModelChip model={chat.model} options={[{ value: chat.model, label: chat.model }]} value={chat.model} />
        {chat.context === undefined ? null : <ContextMeter value={chat.context} high={chat.context >= 75} />}
        <span className={label}>{contextLabel}</span>
      </Inline>
    </header>
  )
}
