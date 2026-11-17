// The Overview tab of an open item (D3, under `item tabs` 464:408): the
// description in full, then two columns: the item's main file rendered
// read-only (`ToolkitFilePreview`) and, beside it, what uses the item, its
// files and the link to its evals (`ToolkitItemSide`). Props only.
import { css } from '../../../../styled-system/css/index.js'
import type { ToolkitItemDetailView } from '../types.ts'
import { ToolkitFilePreview } from './ToolkitFilePreview.tsx'
import { ToolkitItemSide } from './ToolkitItemSide.tsx'

// D3: the description (427:271) is 16 under the tabs and 16 over the columns (427:272).
const overview = css({ display: 'flex', flexDirection: 'column', gap: '16' })
const description = css({ textStyle: 'body', color: 'fg.muted' })
// D3 427:272: the preview (560) and the side (364) are 24 apart. No size token has either width, so the columns
// share the row 3 to 2 (LIBRARY_GAPS.md, Item overview columns).
const columns = css({ display: 'grid', gridTemplateColumns: '[3fr 2fr]', columnGap: '24', alignItems: 'start' })

export type ToolkitItemOverviewProps = {
  detail: ToolkitItemDetailView
  onTabChange?: ((tab: string) => void) | undefined
}

export function ToolkitItemOverview({ detail, onTabChange }: ToolkitItemOverviewProps) {
  return (
    <div className={overview}>
      <p className={description} data-figma="427:271">
        {detail.description}
      </p>
      <div className={columns} data-figma="columns">
        <ToolkitFilePreview file={detail.preview.file} blocks={detail.preview.blocks} />
        <ToolkitItemSide detail={detail} onTabChange={onTabChange} />
      </div>
    </div>
  )
}
