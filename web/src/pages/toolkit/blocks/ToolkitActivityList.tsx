// The list panel of the Activity tab (Figma `panel · chats`, D17 474:645):
// the library's `Panel` with its title in capitals and "newest first" at its
// header's end, and one library
// `ListRow` for each chat that loaded the item (`row · Linear workflow setup
// for NCC team` 474:650: the chat icon, the title, when and where it ran,
// and the chevron) or each round from the ledgers (D23, no icon). A round
// opens the skill it names on its Evals tab (`rowTap`); a chat's panel (D18)
// opens from the Activity view's Chats list, and the tab's data has no link
// to it, so its row is not a button. Props only.
import { ChatIcon, ChevronRightIcon, ListRow, Panel } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { ToolkitActivity } from '../types.ts'
import { rowLayer, rowTap } from './activityView.ts'

// D17 474:649: the header's note at its end, in the small style.
const end = css({ textStyle: 'small', color: 'fg.muted', whiteSpace: 'nowrap' })
// D17 474:650: each row 51 high and 59 apart; `padding="flush"` draws it 52 high (1 + 6 + 20 + 2 + 16 + 6 + 1), so the
// rows are 60 apart with the 8 between them.
const rows = css({ display: 'flex', flexDirection: 'column', gap: '8', listStyle: 'none', m: '0', p: '0' })

export type ToolkitActivityListProps = {
  list: ToolkitActivity['list']
  /** Opens the item a row names on its Evals tab, by its path (D23's rounds). */
  onOpenEvals?: ((path: string) => void) | undefined
}

export function ToolkitActivityList({ list, onOpenEvals }: ToolkitActivityListProps) {
  return (
    <div data-figma="panel · chats">
      <Panel title={list.label} actions={<span className={end}>{list.meta}</span>}>
        <ul className={rows}>
          {list.rows.map((r) => {
            const tap = rowTap(r)
            return (
              <li key={r.title} data-figma={rowLayer(r)}>
                <ListRow
                  // D17 474:650: no side padding, the icons centred, the meta in the small sans style.
                  padding="flush"
                  metaStyle="small"
                  title={r.title}
                  meta={r.meta}
                  leading={r.type === 'chat' ? <ChatIcon size="16" /> : undefined}
                  trailing={<ChevronRightIcon size="16" />}
                  onSelect={
                    tap.action === 'openEvals'
                      ? () => {
                          onOpenEvals?.(tap.path)
                        }
                      : undefined
                  }
                />
              </li>
            )
          })}
        </ul>
      </Panel>
    </div>
  )
}
