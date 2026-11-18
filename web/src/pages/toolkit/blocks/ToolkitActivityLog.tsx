// The log of the Activity view, on the desktop only (Figma `panel · LOG`, D11
// 444:689): a `Panel` with its header ("sample data · newest first" at its
// end) over one line per event (`log · 01:16:40` 444:694): the time in mono,
// the item's kind icon and what happened, 10 apart, the lines 26 apart. The
// library has no log line (LIBRARY_GAPS.md, Activity log line), so each is
// text in the library's styles. Props only.
import { Panel } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { ToolkitActivityCounts } from '../types.ts'
import { logLayer, panelLayer } from './activityPage.ts'
import { ToolkitEvalsHeader } from './ToolkitEvalsHeader.tsx'
import { ToolkitKindIcon } from './ToolkitKindIcon.tsx'

// D11 444:520: the two panels of a row are as tall as the taller: the row's grid stretches the section,
// and its Panel grows to fill it (a section Panel is as tall as its content).
const fill = css({ display: 'flex', flexDirection: 'column', '& > *': { flexGrow: '1' } })

const body = css({ display: 'flex', flexDirection: 'column', gap: '8' })
// D11 444:694 to 444:700: 17 high lines 26 apart; the text styles' lines are 16, so 10 between them.
const lines = css({ display: 'flex', flexDirection: 'column', gap: '10', listStyle: 'none', m: '0', p: '0' })
const line = css({ display: 'flex', alignItems: 'center', gap: '10', minW: '[0]' })
const time = css({ textStyle: 'mono', color: 'fg.muted', fontVariantNumeric: 'tabular-nums', flexShrink: '0' })
const text = css({ textStyle: 'small', color: 'fg.default', truncate: true, minW: '[0]' })

export type ToolkitActivityLogProps = { log: NonNullable<ToolkitActivityCounts['log']> }

export function ToolkitActivityLog({ log }: ToolkitActivityLogProps) {
  return (
    <section className={fill} aria-label={log.label} data-figma={panelLayer(log.label, 'desktop')}>
      <Panel>
        <div className={body}>
          <ToolkitEvalsHeader level={2} label={log.label} end={{ type: 'note', label: log.meta }} />
          <ul className={lines}>
            {log.rows.map((r) => (
              <li key={`${r.time} ${r.text}`} className={line} data-figma={logLayer(r)}>
                <span className={time}>{r.time}</span>
                <ToolkitKindIcon kind={r.kind} size="12" />
                <span className={text}>{r.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </Panel>
    </section>
  )
}
