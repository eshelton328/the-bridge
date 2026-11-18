// The list a source adds to the Activity view, beside Most called on the
// desktop and over it elsewhere: the chats that used the toolkit (Figma
// `panel · CHATS THAT USED THE TOOLKIT`, D15 477:515, T11 477:1472, M13
// 477:2207; a `ToolkitChatRow` each) or the headless sessions by skill eval
// (`panel · BY SKILL EVAL`, D16 477:1117, T12 477:1864, M14 477:2544; a
// `ToolkitEvalRow` each), in a `Panel` with its header. Show all sits at the
// header's end on the desktop and under the rows elsewhere; it shows every
// row, and waits, disabled with a title, while the state knows fewer rows
// than it names (`showAllLink`). The Figma key keeps the label in capitals on
// every layout. Props only.
import { Button, Panel } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import type { ToolkitActivityList } from '../types.ts'
import { listRows, showAllLink } from './activitySources.ts'
import { panelLayer } from './activityPage.ts'
import { ToolkitChatRow } from './ToolkitChatRow.tsx'
import { ToolkitEvalsHeader } from './ToolkitEvalsHeader.tsx'
import { ToolkitEvalRow } from './ToolkitEvalRow.tsx'

// D15 477:338: the two panels of a row are as tall as the taller: the row's grid stretches the section,
// and its Panel grows to fill it (a section Panel is as tall as its content).
const fill = css({ display: 'flex', flexDirection: 'column', '& > *': { flexGrow: '1' } })
// D15 477:516 to 477:520: the rows 6 under the header and 6 apart; D16 477:1122: the evals 10 apart.
const body = css({ display: 'flex', flexDirection: 'column', gap: '6' })
const rows = {
  chats: css({ display: 'flex', flexDirection: 'column', gap: '6', listStyle: 'none', m: '0', p: '0' }),
  evals: css({ display: 'flex', flexDirection: 'column', gap: '10', listStyle: 'none', m: '0', p: '0' }),
}
const foot = css({ alignSelf: 'flex-start' })

export type ToolkitActivitySourceListProps = {
  list: ToolkitActivityList
  layout: Viewport
  /** Show all was pressed. */
  showAll?: boolean | undefined
  onShowAll?: (() => void) | undefined
  /** The id of the open chat, whose row is selected (D18). */
  openChat?: string | undefined
  onOpenChat?: ((id: string) => void) | undefined
  /** Opens an item on its page, by its path. */
  onOpenItem?: ((path: string) => void) | undefined
  /** Opens an eval's skill on its Evals tab, by its path. */
  onOpenEvals?: ((path: string) => void) | undefined
}

export function ToolkitActivitySourceList({
  list,
  layout,
  showAll,
  onShowAll,
  openChat,
  onOpenChat,
  onOpenItem,
  onOpenEvals,
}: ToolkitActivitySourceListProps) {
  const link = showAllLink(list, showAll)
  const desktop = layout === 'desktop'
  return (
    <section className={fill} aria-label={list.label} data-figma={panelLayer(list.label, 'desktop')}>
      <Panel>
        <div className={body}>
          <ToolkitEvalsHeader
            level={2}
            label={list.label}
            end={
              desktop && link !== null
                ? { type: 'link', label: link.label, onPress: onShowAll, waits: link.waits }
                : null
            }
          />
          {list.type === 'chats' ? (
            <ul className={rows.chats} aria-label={list.label}>
              {listRows(list, showAll).map((c) => (
                <ToolkitChatRow
                  key={c.id}
                  chat={c}
                  layout={layout}
                  selected={c.id === openChat}
                  onOpen={onOpenChat}
                  onOpenItem={onOpenItem}
                />
              ))}
            </ul>
          ) : (
            <ul className={rows.evals} aria-label={list.label}>
              {listRows(list, showAll).map((g) => (
                <ToolkitEvalRow key={g.name} group={g} onOpen={onOpenEvals} onOpenItem={onOpenItem} />
              ))}
            </ul>
          )}
          {desktop || link === null ? null : (
            <span className={foot}>
              <Button
                variant="text"
                size="xs"
                textSize="sm"
                aria-disabled={link.waits === undefined ? undefined : 'true'}
                title={link.waits}
                onClick={link.waits === undefined ? onShowAll : undefined}
              >
                {link.label}
              </Button>
            </span>
          )}
        </div>
      </Panel>
    </section>
  )
}
