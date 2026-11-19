// The title block of an open artifact (Figma "title block", D2 403:464):
// the title, the description and three chips: the source, the project it
// is filed in (Figma's project menu, LIBRARY_GAPS.md) and when it was
// updated. On a phone (M2 406:370) the rows are 8 apart and the chips are
// the source and the project only. Props only.
import { FolderIcon, Inline, KindMark, MetaChip, RefreshIcon, Stack } from '@eshelton328/component-library-1701'
import type { ReactNode } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { ArtifactDetail } from '../types.ts'

// The desktop title (D2 403:465, D7, D8, D9) is SemiBold 26 in a 34 px box: `headingSm` (26/36, library beta.71).
// The tablet's (T2 405:433) is Figma's heading, 28/41: `heading` (28/40); the phone keeps `heading` too.
const desktopTitle = css({ textStyle: 'headingSm', color: 'fg.default', m: '0', textWrap: 'wrap' })
const title = css({ textStyle: 'heading', color: 'fg.default', m: '0', textWrap: 'wrap' })
// 403:467: the chips take their own width.
const chips = css({ alignSelf: 'flex-start' })
const description = css({ textStyle: 'body', color: 'fg.muted', m: '0' })

export type ArtifactTitleBlockProps = {
  artifact: Pick<ArtifactDetail, 'title' | 'description' | 'source' | 'sourceLabel' | 'project' | 'updated'>
  /** The status line over the title, as the tablet draws it (T2 405:427); the desktop has it in the artifact bar. */
  status?: ReactNode
  /** `desktop` (the default, D2): the `headingSm` title; `tablet` (T2): the `heading` title; `phone` (M2): the `heading` title, rows 8 apart and no updated chip. */
  layout?: 'desktop' | 'tablet' | 'phone' | undefined
}

export function ArtifactTitleBlock({ artifact, status, layout = 'desktop' }: ArtifactTitleBlockProps) {
  const phone = layout === 'phone'
  return (
    // D2 (403:464: the title at 76, 34 high, the description at 120 and the chips at 150) and T2 (405:426) put their
    // rows 10 apart; M2 8 (406:370).
    <Stack gap={phone ? '8' : '10'} data-figma="title block">
      {status}
      <h2 className={layout === 'desktop' ? desktopTitle : title}>{artifact.title}</h2>
      <p className={description}>{artifact.description}</p>
      <Inline gap="6" align="center" wrap className={chips} data-figma="chips">
        {/* D2 and T2 "chip · Claude artifact", M2 "chip · Claude". */}
        <span data-figma={`chip · ${artifact.sourceLabel}`}>
          <MetaChip label={artifact.sourceLabel} icon={<KindMark kind={artifact.source} size="12" />} />
        </span>
        <span data-figma="project · File in a project">
          <MetaChip label={artifact.project} icon={<FolderIcon />} />
        </span>
        {phone ? null : (
          <span data-figma="chip · updated 12m ago">
            <MetaChip label={artifact.updated} icon={<RefreshIcon />} tone="muted" />
          </span>
        )}
      </Inline>
    </Stack>
  )
}
