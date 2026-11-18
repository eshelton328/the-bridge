// An artifact on its own page on a tablet (Figma "artifact page", T2
// 405:413) or a phone (M2 406:360): the Back bar, then the status, title
// and chips, the preview, Open artifact the full width and where it was
// made. The tablet's bar has Discuss, Copy link and Remove, and the link
// sits under Open artifact; the phone's bar has the ⋯ button, and Copy link
// and Discuss sit side by side under Open artifact. The Back bar stays at
// the top and only the page under it scrolls (d-107), in the shared
// DetailFrame, as the Inbox's task page. Back returns to the library (T1,
// M1). Props only.
import {
  BubbleIcon,
  Button,
  CopyIcon,
  ExternalLinkIcon,
  Grid,
  Inline,
  Stack,
  Thumbnail,
} from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import { DetailFrame } from '../../../blocks/DetailFrame.tsx'
import { ArtifactStatus } from '../blocks/ArtifactStatus.tsx'
import { ArtifactTitleBlock } from '../blocks/ArtifactTitleBlock.tsx'
import { ArtifactTopBar } from '../blocks/ArtifactTopBar.tsx'
import { LinkMark } from '../blocks/LinkMark.tsx'
import { MadeIn } from '../blocks/MadeIn.tsx'
import type { ArtifactDetail } from '../types.ts'

// 405:467, 406:407: Open artifact takes the page's width; so do Copy link and Discuss their halves (406:411).
const wide = css({ w: '[100%]' })
const link = css({ textStyle: 'mono', color: 'fg.muted', textDecoration: 'none', minW: '[0]' })
const linkRow = css({ color: 'fg.muted', alignSelf: 'flex-start' })

export type ArtifactPageProps = {
  artifact: ArtifactDetail
  /** `tablet` (T2) or `phone` (M2). */
  layout: 'tablet' | 'phone'
  /** The status pill, such as "New"; none without it. */
  badge?: string | undefined
  /** The list Back returns to, such as "Artifacts". */
  backLabel: string
  onBack?: (() => void) | undefined
  /** Discuss was pressed: the discussion opens as its own page (T4); without it Discuss does nothing. */
  onDiscuss?: (() => void) | undefined
  onOpenArtifact?: (() => void) | undefined
  /** The phone's ⋯ button was pressed: File in a project opens (M7). */
  onMore?: (() => void) | undefined
}

export function ArtifactPage({
  artifact,
  layout,
  badge,
  backLabel,
  onBack,
  onDiscuss,
  onOpenArtifact,
  onMore,
}: ArtifactPageProps) {
  const phone = layout === 'phone'
  return (
    <DetailFrame
      layout={layout}
      back={
        <ArtifactTopBar backLabel={backLabel} layout={layout} onBack={onBack} onDiscuss={onDiscuss} onMore={onMore} />
      }
    >
      {/* T2: the sections are 18 apart (405:426 to 405:475), M2 14 (406:370 to 406:420); 20 and 16 on the 4 px grid
          (d-100: a tie takes the larger token, d-072). */}
      <Stack gap={phone ? '16' : '20'}>
        <ArtifactTitleBlock
          artifact={artifact}
          layout={phone ? 'phone' : 'wide'}
          status={<ArtifactStatus badge={badge} found={artifact.found} />}
        />
        <div data-figma="preview">
          <Thumbnail kind={artifact.preview} shape="wide" label={`${artifact.title} preview`} />
        </div>
        <span data-figma="button · Open artifact">
          <Button variant="primary" size="xl" className={wide} onClick={onOpenArtifact}>
            Open artifact
            <ExternalLinkIcon />
          </Button>
        </span>
        {phone ? (
          // 406:411: two 40 px buttons, 8 apart. No control height is 40 (LIBRARY_GAPS.md); 36 and 44 tie, and the
          // 36 px `lg` keeps Made in where Figma has it, where `xl` put it 7 lower (d-100).
          <Grid columns="2" gap="8" data-figma="secondary actions">
            <span data-figma="button · Copy link">
              <Button size="lg" className={wide}>
                <CopyIcon />
                Copy link
              </Button>
            </span>
            <span data-figma="button · Discuss">
              <Button size="lg" className={wide} onClick={onDiscuss}>
                <BubbleIcon />
                Discuss
              </Button>
            </span>
          </Grid>
        ) : (
          <Inline gap="6" align="center" className={linkRow} data-figma="link">
            <LinkMark />
            <a className={link} href={`https://${artifact.link}`} target="_blank" rel="noreferrer">
              {artifact.link}
            </a>
          </Inline>
        )}
        <MadeIn madeIn={artifact.madeIn} />
      </Stack>
    </DetailFrame>
  )
}
