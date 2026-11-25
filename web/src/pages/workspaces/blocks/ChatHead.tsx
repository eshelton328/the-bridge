// The header of a chat shown alone (D2 105:785): the kind mark, the title over
// its workspace (and where the chat came from, D16), the status and the chat actions; under them the model (with its
// effort, W5), the context used and its label. While the owner renames the chat, a field takes the
// title's place (D21). On the phone (M3 105:2748) a back button comes
// first, in its own column, so the second row starts at the kind mark's left edge (d-121, option E), and the rows sit 8 apart under a 4 px top; the folders chip can take
// the context label's place (M8) or follow it (T5). While the phone's keyboard is up the
// header shrinks to one line: `meta`, the model, the context used and the
// folders, takes the workspace's place under the title, with no second row
// (M10 147:46). The library's `Pane`
// header has one row (LIBRARY_GAPS.md: Chat header). Props only.
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
import { css, cx } from '../../../../styled-system/css/index.js'
import type { PaneHead } from '../types.ts'
import { EffortPicker, type EffortControl } from './EffortPicker.tsx'

const head = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '4',
  pt: '12',
  px: '16',
  borderBottomWidth: 'default',
  borderBottomStyle: 'solid',
  borderBottomColor: 'border.default',
})
// M3 105:2748: the first row is 4 under the status bar. Figma's second row is 8 under the first, whose title and
// workspace are 37 high, where `subtitle` over `monoSm` is 40 and the model chip 4 taller than Figma's (LIBRARY_GAPS.md:
// Chat header), so the rows keep the 4 apart of the chat alone and the second row sits where Figma's does.
const sizes = { full: undefined, phone: css({ pt: '4' }) }
// Both rows end 8 over the rule.
const twoRows = css({ pb: '8' })
// M10 147:46: one row, 4 under the status bar and 8 over the rule in Figma, 46 high with the rule under it. The title
// over `monoSm` is 40 high against Figma's 34 (LIBRARY_GAPS.md: Chat header text), so the row pads 2 under it: the
// title starts where Figma's does, and the header with its rule is 47 high.
const oneRow = css({ pt: '4', pb: '2' })
// d-121 (option E): with a back button, the back button has its own column and both rows sit in the next one, so the
// second row starts at the kind mark's left edge, as it does with no back button.
// With no back button the rows stack as before, 4 apart.
const rows = css({ display: 'flex', flexDirection: 'column', gap: '4' })
const withBack = css({
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  columnGap: '8',
  rowGap: '4',
  alignItems: 'center',
})
const afterBack = css({ gridColumn: '2', minW: '[0]' })
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
  /** Drawn in place of the title while the owner renames the chat, such as the name field (D21). */
  rename?: ReactNode
  /** The Figma layers of the header and of the chat actions button, for the fidelity checks; D2's when not set. */
  figma?: { head?: string | undefined; actions?: string | undefined } | undefined
  /** `full` (the default): the chat alone beside the sidebar (D2); `phone`: the chat on the phone (M3). */
  size?: keyof typeof sizes | undefined
  /** Drawn before the kind mark, such as the phone's back button (M3 105:2750). */
  back?: ReactNode
  /** Drawn after the context used in place of its label, such as the phone's folders chip (M8 128:695). */
  extra?: ReactNode
  /** Draw `extra` after the context label, not in its place, as the tablet's folders chip is (T5 128:520). */
  extraAfterLabel?: boolean | undefined
  /**
   * Drawn under the title in place of the workspace, with no second row, such as "Opus 5.5 · 42% · 2 folders" while
   * the phone's keyboard is up (M10 147:53).
   */
  meta?: string | undefined
  /** A live Claude chat's chip (W10): it opens the model and effort menu; none keeps the chip as the head says. */
  effortPicker?: EffortControl | undefined
}

export function ChatHead(props: ChatHeadProps) {
  const {
    head: chat,
    workspace,
    contextLabel,
    menu,
    rename,
    figma,
    size = 'full',
    back,
    extra,
    meta,
    effortPicker,
  } = props
  // The "context" label names the meter, so a chat with no context share (a live chat, d-117) has neither.
  const contextText = chat.context === undefined ? null : <span className={label}>{contextLabel}</span>
  // What follows the model chip in the second row.
  const rest = (
    <>
      {chat.context === undefined ? null : <ContextMeter value={chat.context} high={chat.context >= 75} />}
      {props.extraAfterLabel === true && extra !== undefined && extra !== null ? contextText : null}
      {extra ?? contextText}
    </>
  )
  return (
    <header
      data-figma={figma?.head ?? '105:785'}
      data-fit="chatHead"
      className={cx(head, meta === undefined ? cx(sizes[size], twoRows) : oneRow)}
    >
      <div className={back === undefined ? rows : withBack}>
        {back}
        <Inline gap="8" align="center">
          <KindMark kind={chat.kind} size="20" />
          <div className={titles}>
            {rename ?? <h2 className={title}>{chat.title}</h2>}
            <span className={where}>
              {meta ?? (chat.origin === undefined ? workspace : `${workspace} · ${chat.origin}`)}
            </span>
          </div>
          <StatusPill label={chat.status.label} tone={chat.status.tone} dot />
          {menu === undefined ? (
            <Button
              size="xs"
              keepIconSize
              touch
              aria-label={`${chat.title} actions`}
              data-figma={figma?.actions ?? '400:2'}
            >
              <MoreIcon size="12" />
            </Button>
          ) : (
            menu
          )}
        </Inline>
        {meta === undefined ? (
          <div className={back === undefined ? undefined : afterBack}>
            {effortPicker === undefined ? (
              <Inline gap="8" align="center">
                {/* A live chat's model is read-only (d-101): with no picker its chip is text and opens no menu. */}
                <ModelChip
                  model={chat.model}
                  effort={chat.effort}
                  options={chat.readOnlyModel === true ? undefined : [{ value: chat.model, label: chat.model }]}
                  value={chat.model}
                  touch
                />
                {rest}
              </Inline>
            ) : (
              // A live Claude chat's chip opens its model and effort menu (W10); a model pick asks on a row under it.
              <EffortPicker
                model={chat.model}
                effort={effortPicker}
                working={chat.status.tone === 'working' || chat.status.tone === 'running'}
                after={rest}
              />
            )}
          </div>
        ) : null}
      </div>
    </header>
  )
}
