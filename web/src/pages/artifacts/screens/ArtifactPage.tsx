// An artifact on its own page on a tablet (Figma "artifact page", T2
// 405:413): the Back bar with Discuss, Copy link and Remove, then the
// status, title and chips, the preview, Open artifact the full width, the
// link and where it was made. The Back bar stays at the top and only the
// page under it scrolls (d-107), in the shared DetailFrame, as the Inbox's
// tablet task page. Back returns to the library (T1). Props only.
import { Button, ExternalLinkIcon, Inline, LinkIcon, Stack, Thumbnail } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import { DetailFrame } from '../../../blocks/DetailFrame.tsx'
import { ArtifactStatus } from '../blocks/ArtifactStatus.tsx'
import { ArtifactTitleBlock } from '../blocks/ArtifactTitleBlock.tsx'
import { ArtifactTopBar } from '../blocks/ArtifactTopBar.tsx'
import { MadeIn } from '../blocks/MadeIn.tsx'
import type { ArtifactDetail } from '../types.ts'

// 405:467: Open artifact takes the page's width.
const wide = css({ w: '[100%]' })
const link = css({ textStyle: 'mono', color: 'fg.muted', textDecoration: 'none', minW: '[0]' })
const linkRow = css({ color: 'fg.muted', alignSelf: 'flex-start' })

export type ArtifactPageProps = {
  artifact: ArtifactDetail
  /** The status pill, such as "New"; none without it. */
  badge?: string | undefined
  /** The list Back returns to, such as "Artifacts". */
  backLabel: string
  onBack?: (() => void) | undefined
  /** Discuss was pressed; without it Discuss does nothing (the tablet's discussion comes with T4). */
  onDiscuss?: (() => void) | undefined
  onOpenArtifact?: (() => void) | undefined
}

export function ArtifactPage({ artifact, badge, backLabel, onBack, onDiscuss, onOpenArtifact }: ArtifactPageProps) {
  return (
    <DetailFrame layout="tablet" back={<ArtifactTopBar backLabel={backLabel} onBack={onBack} onDiscuss={onDiscuss} />}>
      {/* T2: the sections are 18 apart (405:426 to 405:475); 20 on the 4 px grid (d-100). */}
      <Stack gap="20">
        <ArtifactTitleBlock artifact={artifact} status={<ArtifactStatus badge={badge} found={artifact.found} />} />
        <div data-figma="preview">
          <Thumbnail kind={artifact.preview} shape="wide" label={`${artifact.title} preview`} />
        </div>
        <span data-figma="button · Open artifact">
          <Button variant="primary" size="xl" className={wide} onClick={onOpenArtifact}>
            Open artifact
            <ExternalLinkIcon />
          </Button>
        </span>
        <Inline gap="6" align="center" className={linkRow} data-figma="link">
          <LinkIcon size="12" />
          <a className={link} href={`https://${artifact.link}`} target="_blank" rel="noreferrer">
            {artifact.link}
          </a>
        </Inline>
        <MadeIn madeIn={artifact.madeIn} />
      </Stack>
    </DetailFrame>
  )
}
