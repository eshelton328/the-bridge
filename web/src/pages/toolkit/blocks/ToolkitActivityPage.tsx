// The Activity view of the page (Figma D11 `toolkit` 444:153, T9 449:64, M10
// 449:395), the third view of the List, Map and Activity switch. On the
// desktop the page's header (where the counts come from), the kind chips,
// the source switch with since at its end, and the counts
// (`ToolkitActivityBody`). On a tablet the view is a page of its own in the
// shared `DetailFrame` (d-107): Back to Toolkit with since at the row's end,
// the title, the switch and the counts in one column 12 apart. On the phone
// the list's header (the views as icon buttons), the switch and the counts,
// 10 apart, running under the tab bar. Props only.
import { BackRow, Container, PageHeader } from '@eshelton328/component-library-1701'
import type { ReactNode } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import { DetailFrame } from '../../../blocks/DetailFrame.tsx'
import type { Viewport } from '../../../lib/screenState.ts'
import type { ToolkitActivitySource, ToolkitActivityView, ToolkitUi } from '../types.ts'
import { activityCounts, activitySource } from './activityPage.ts'
import { ToolkitActivityBody } from './ToolkitActivityBody.tsx'
import { ToolkitActivitySources } from './ToolkitActivitySources.tsx'

// D11 444:153: as the list, the library's `Container size="page"` on the desktop: 32 in from the rail and 24 down, 1448
// wide with 1384 of content in the 1512 px frame, and from `shell.detailWideFrom` at most 1448 wide in the middle of the
// detail. Its rows are 12 apart (header 24 to 62, chips at 74).
const page = {
  desktop: css({ display: 'flex', flexDirection: 'column', gap: '12' }),
  tablet: css({ display: 'flex', flexDirection: 'column', gap: '12' }),
  // M10 449:395: 12 in from the sides, 4 under the status bar, its rows 10 apart.
  phone: css({ display: 'flex', flexDirection: 'column', gap: '10' }),
}
const phonePad = css({ px: '12', pt: '4', pb: '12' })
const since = css({ textStyle: 'mono', color: 'fg.muted', whiteSpace: 'nowrap', ms: 'auto' })

export type ToolkitActivityPageProps = {
  view: ToolkitActivityView
  ui: Pick<ToolkitUi, 'activitySource' | 'filter' | 'run' | 'chat' | 'activityShowAll'>
  layout: Viewport
  /** The page's header on the desktop and the phone (`ToolkitHeader`). */
  header: ReactNode
  /** The kind chips, on the desktop only. */
  chips?: ReactNode
  onSourceChange?: ((source: ToolkitActivitySource) => void) | undefined
  onOpenRun?: ((id: string) => void) | undefined
  onOpenItem?: ((path: string) => void) | undefined
  onShowAll?: (() => void) | undefined
  onOpenChat?: ((id: string) => void) | undefined
  onOpenEvals?: ((path: string) => void) | undefined
  /** The tablet's Back to Toolkit: the list. */
  onBack?: (() => void) | undefined
}

export function ToolkitActivityPage({
  view,
  ui,
  layout,
  header,
  chips,
  onSourceChange,
  onOpenRun,
  onOpenItem,
  onShowAll,
  onOpenChat,
  onOpenEvals,
  onBack,
}: ToolkitActivityPageProps) {
  const counts = activityCounts(view, ui)
  const sources = (
    <ToolkitActivitySources view={view} value={activitySource(view, ui)} layout={layout} onChange={onSourceChange} />
  )
  const body =
    counts === undefined ? null : (
      <ToolkitActivityBody
        counts={counts}
        layout={layout}
        openRun={ui.run}
        onOpenRun={onOpenRun}
        onOpenItem={onOpenItem}
        showAll={ui.activityShowAll}
        onShowAll={onShowAll}
        openChat={ui.chat}
        onOpenChat={onOpenChat}
        onOpenEvals={onOpenEvals}
      />
    )
  if (layout === 'tablet') {
    return (
      <DetailFrame
        layout={layout}
        back={
          <div data-figma="back row">
            <BackRow label="Toolkit" onBack={onBack}>
              <span className={since}>{view.since}</span>
            </BackRow>
          </div>
        }
      >
        <section aria-label={view.title} className={page.tablet}>
          <PageHeader title={view.title} size="phone" />
          {sources}
          {body}
        </section>
      </DetailFrame>
    )
  }
  if (layout === 'phone') {
    // M10 449:395: Figma's `toolkit` is the content box, 12 in from the sides and 4 under the status bar.
    return (
      <div className={phonePad}>
        <section aria-label="Toolkit" className={page.phone} data-figma="toolkit">
          {header}
          {sources}
          {body}
        </section>
      </div>
    )
  }
  // The Container is the page Figma names `toolkit`, padding included.
  return (
    <Container size="page" data-figma="toolkit">
      <section aria-label="Toolkit" className={page.desktop}>
        {header}
        {chips}
        {sources}
        {body}
      </section>
    </Container>
  )
}
