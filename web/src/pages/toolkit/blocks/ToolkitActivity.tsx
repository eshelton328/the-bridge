// The Activity tab of an open item (Figma `activity`, D17 474:583): the key
// figures (`ToolkitActivityKpis`), the counts by day and where the item ran
// side by side (`row · day and where` 474:601: `ToolkitActivityBars`), the
// chats that loaded it or the ledgers' rounds (`ToolkitActivityList`) and
// the source of it all under them. On a tablet or phone (T13, M15) the bar
// panels stand one under the other, and on the phone the key figures sit two
// by two with no caption (`activityLayout`). Props only.
import { css, cx } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import type { ToolkitActivity as Activity } from '../types.ts'
import { activityLayout } from './activityView.ts'
import { ToolkitActivityBars } from './ToolkitActivityBars.tsx'
import { ToolkitActivityKpis } from './ToolkitActivityKpis.tsx'
import { ToolkitActivityList } from './ToolkitActivityList.tsx'

// D17 474:583: the parts and the source 12 apart (`kpis` ends at 317, the row starts at 329).
const root = css({ display: 'flex', flexDirection: 'column', gap: '12', minW: '[0]' })
// D17 474:583: on the desktop the tab starts 16 under the tabs (474:421 ends at 212); the tabs' panel puts it 14 under
// them, so 2 more, as on Evals.
const rootDesktop = css({ mt: '2' })
// D17 474:601: two panels 468 wide, 12 apart, each as tall as its content (474:602 is 143 high, 474:620 168).
const pair = css({ display: 'grid', gridTemplateColumns: '[1fr 1fr]', alignItems: 'start', gap: '12' })
// T13 474:938: one under the other, 12 apart (474:939 ends at 430, 474:957 starts at 442).
const stack = css({ display: 'flex', flexDirection: 'column', gap: '12', minW: '[0]' })
const source = css({ textStyle: 'small', color: 'fg.muted' })

export type ToolkitActivityProps = {
  activity: Activity
  layout?: Viewport | undefined
  /** Opens another item on its Evals tab, by its path: a round's skill (D23). */
  onOpenEvals?: ((path: string) => void) | undefined
}

export function ToolkitActivity({ activity, layout = 'desktop', onOpenEvals }: ToolkitActivityProps) {
  return (
    <section
      aria-label="Activity"
      className={layout === 'desktop' ? cx(root, rootDesktop) : root}
      data-figma="activity"
    >
      <ToolkitActivityKpis kpis={activity.kpis} layout={layout} />
      <div className={activityLayout(layout).bars === 'pair' ? pair : stack} data-figma="row · day and where">
        <ToolkitActivityBars bars={activity.byDay} layer="panel · by day" />
        <ToolkitActivityBars bars={activity.where} layer="panel · where" />
      </div>
      <ToolkitActivityList list={activity.list} onOpenEvals={onOpenEvals} />
      <p className={source}>{activity.source}</p>
    </section>
  )
}
