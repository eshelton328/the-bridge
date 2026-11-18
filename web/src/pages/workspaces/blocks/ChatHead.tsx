// The header of a chat shown alone (D2 105:785): the kind mark, the title over
// its workspace (and where the chat came from, D16), the status and the chat actions; under them the model, the
// context used and its label. While Erik renames the chat, a field takes the
// title's place (D21). The library's `Pane` header has one row
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
// Figma's title is Geist SemiBold 16 (D19 417:1669), which no text style draws (LIBRARY_GAPS.md: Chat header text);
// the workspace is Geist Mono 11 (417:1670) and "context" Geist Regular 11 (417:1689).
const title = css({ textStyle: 'subtitle', color: 'fg.default', m: '0' })
const where = css({ textStyle: 'monoSm', color: 'fg.muted' })
const label = css({ textStyle: 'smallXs', color: 'fg.muted' })

export type ChatHeadProps = {
  head: PaneHead
  /** The workspace the chat is in. */
  workspace: string
  contextLabel: string
  /** The chat actions menu, with its trigger; a plain button when not set, and none when `null` (D4). */
  menu?: ReactNode
  /** Drawn in place of the title while Erik renames the chat, such as the name field (D21). */
  rename?: ReactNode
  /** The Figma layers of the header and of the chat actions button, for the fidelity checks; D2's when not set. */
  figma?: { head?: string | undefined; actions?: string | undefined } | undefined
}

export function ChatHead({ head: chat, workspace, contextLabel, menu, rename, figma }: ChatHeadProps) {
  return (
    <header data-figma={figma?.head ?? '105:785'} className={head}>
      <Inline gap="8" align="center">
        <KindMark kind={chat.kind} size="20" />
        <div className={titles}>
          {rename ?? <h2 className={title}>{chat.title}</h2>}
          <span className={where}>{chat.origin === undefined ? workspace : `${workspace} · ${chat.origin}`}</span>
        </div>
        <StatusPill label={chat.status.label} tone={chat.status.tone} dot />
        {menu === undefined ? (
          <Button size="xs" aria-label={`${chat.title} actions`} data-figma={figma?.actions ?? '400:2'}>
            <MoreIcon size="12" />
          </Button>
        ) : (
          menu
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
