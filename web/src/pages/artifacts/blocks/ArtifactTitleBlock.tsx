// The title block of an open artifact (Figma "title block", D2 403:464):
// the title, the description and three chips: the source, the project it
// is filed in (Figma's project menu, LIBRARY_GAPS.md) and when it was
// updated. Props only.
import { FolderIcon, Inline, KindMark, MetaChip, RefreshIcon, Stack } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { ArtifactDetail } from '../types.ts'

// 403:465 is about 26 px type in a 34 px box; `heading` (28/40) is the nearest style (LIBRARY_GAPS.md).
const title = css({ textStyle: 'heading', color: 'fg.default', m: '0', textWrap: 'wrap' })
// 403:467: the chips take their own width.
const chips = css({ alignSelf: 'flex-start' })
const description = css({ textStyle: 'body', color: 'fg.muted', m: '0' })

export type ArtifactTitleBlockProps = {
  artifact: Pick<ArtifactDetail, 'title' | 'description' | 'source' | 'sourceLabel' | 'project' | 'updated'>
}

export function ArtifactTitleBlock({ artifact }: ArtifactTitleBlockProps) {
  return (
    <Stack gap="6" data-figma="title block">
      <h2 className={title}>{artifact.title}</h2>
      <p className={description}>{artifact.description}</p>
      <Inline gap="6" align="center" wrap className={chips} data-figma="chips">
        <span data-figma="chip · Claude artifact">
          <MetaChip label={artifact.sourceLabel} icon={<KindMark kind={artifact.source} size="12" />} />
        </span>
        <span data-figma="project · File in a project">
          <MetaChip label={artifact.project} icon={<FolderIcon />} />
        </span>
        <span data-figma="chip · updated 12m ago">
          <MetaChip label={artifact.updated} icon={<RefreshIcon />} tone="muted" />
        </span>
      </Inline>
    </Stack>
  )
}
