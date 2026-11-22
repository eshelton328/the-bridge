// An artifact on its own page on a tablet (Figma "artifact page", T2
// 405:413) or a phone (M2 406:360): the Back bar, then the status, title
// and chips, the preview, Open artifact and where it was made. Open
// artifact is a link to the artifact's https address (`href`) in a new
// tab; with no `href` it does not show, nor does the Copy link beside it.
// The tablet's bar has Discuss, Copy link and Remove, Open artifact has
// Copy link beside it (R40), and the link sits under them; the phone's bar
// has the ⋯ button, Open artifact takes the width, and Copy link and
// Discuss sit side by side under it. The Back bar stays at
// the top and only the page under it scrolls (d-107), in the shared
// DetailFrame, as the Inbox's task page. Back returns to the library (T1,
// M1). Props only.
import { BubbleIcon, Button, Grid, Inline, Stack, Thumbnail } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import { DetailFrame } from '../../../blocks/DetailFrame.tsx'
import { BlockBoundary } from '../../../errors/BlockBoundary.tsx'
import { ArtifactStatus } from '../blocks/ArtifactStatus.tsx'
import { ArtifactTitleBlock, type ProjectMenu } from '../blocks/ArtifactTitleBlock.tsx'
import { ArtifactTopBar } from '../blocks/ArtifactTopBar.tsx'
import { CopyLinkButton } from '../blocks/CopyLinkButton.tsx'
import { LinkMark } from '../blocks/LinkMark.tsx'
import { MadeIn } from '../blocks/MadeIn.tsx'
import { OpenArtifactLink } from '../blocks/OpenArtifactLink.tsx'
import type { ArtifactDetail, CopyLinkStatus } from '../types.ts'

// 405:467, 406:407: Open artifact takes the page's width; so do Copy link and Discuss their halves (406:411).
const wide = css({ w: '[100%]' })
// T2: Open artifact takes what Copy link beside it leaves.
const grow = css({ flex: '1' })
const link = css({ textStyle: 'mono', color: 'fg.muted', textDecoration: 'none', minW: '[0]' })
const linkRow = css({ color: 'fg.muted', alignSelf: 'flex-start' })

export type ArtifactPageProps = {
  artifact: ArtifactDetail
  /** The https address the artifact's link opens (`artifactHref`); without it no Open artifact or Copy link beside it. */
  href?: string | undefined
  /** `tablet` (T2) or `phone` (M2). */
  layout: 'tablet' | 'phone'
  /** The status pill, such as "New"; none without it. */
  badge?: string | undefined
  /** The list Back returns to, such as "Artifacts". */
  backLabel: string
  onBack?: (() => void) | undefined
  /** Discuss was pressed: the discussion opens as its own page (T4); without it Discuss does nothing. */
  onDiscuss?: (() => void) | undefined
  /** Copy link was pressed, in the tablet's bar, beside its Open artifact or under the phone's; without it Copy link does nothing. */
  onCopyLink?: (() => void) | undefined
  /** What the last Copy link did, which its control shows ("Copied" or "Copy failed"). */
  copyLinkStatus?: CopyLinkStatus | undefined
  /** The phone's ⋯ button was pressed: File in a project opens (M7). */
  onMore?: (() => void) | undefined
  /** The tablet's Remove was pressed (the live library); without it Remove does nothing. */
  onRemove?: (() => void) | undefined
  /** The menu the tablet's project chip opens; on the phone the chip opens File in a project, as the ⋯ button. */
  projectMenu?: ProjectMenu | undefined
}

export function ArtifactPage({
  artifact,
  href,
  layout,
  badge,
  backLabel,
  onBack,
  onDiscuss,
  onCopyLink,
  copyLinkStatus,
  onMore,
  onRemove,
  projectMenu,
}: ArtifactPageProps) {
  const phone = layout === 'phone'
  return (
    <DetailFrame
      layout={layout}
      back={
        <ArtifactTopBar
          backLabel={backLabel}
          layout={layout}
          onBack={onBack}
          onDiscuss={onDiscuss}
          onCopyLink={onCopyLink}
          copyLinkStatus={copyLinkStatus}
          onMore={onMore}
          onRemove={onRemove}
        />
      }
    >
      {/* T2: the sections are 18 apart (405:426 to 405:475), M2 14 (406:370 to 406:420); 20 and 16 on the 4 px grid
          (d-100: a tie takes the larger token, d-072). */}
      <Stack gap={phone ? '16' : '20'}>
        <ArtifactTitleBlock
          artifact={artifact}
          layout={phone ? 'phone' : 'tablet'}
          projectMenu={projectMenu}
          onProjectPress={phone ? onMore : undefined}
          status={<ArtifactStatus badge={badge} found={artifact.found} />}
        />
        <div data-figma="preview">
          {/* d-084: a preview that fails to render shows its fallback; the bar and the title stay. */}
          <BlockBoundary contentKey={artifact.id}>
            <Thumbnail
              kind={artifact.preview}
              shape="wide"
              label={`${artifact.title} preview`}
              {...(artifact.reference === undefined ? {} : { reference: artifact.reference })}
            />
          </BlockBoundary>
        </div>
        {phone ? (
          <Stack gap="16" data-testid="open-actions">
            {href === undefined ? null : (
              <span data-figma="button · Open artifact">
                <OpenArtifactLink href={href} size="xl" className={wide} />
              </span>
            )}
            {/* 406:411: two 40 px buttons, 8 apart. No control height is 40 (LIBRARY_GAPS.md: Phone secondary action
                height); 36 and 44 tie, and the tie takes the larger, the 44 px `xl` (d-072). */}
            <Grid columns="2" gap="8" data-figma="secondary actions">
              {href === undefined ? null : (
                <span data-figma="button · Copy link">
                  <CopyLinkButton size="xl" className={wide} status={copyLinkStatus} onClick={onCopyLink} />
                </span>
              )}
              <span data-figma="button · Discuss">
                <Button size="xl" className={wide} onClick={onDiscuss}>
                  <BubbleIcon />
                  Discuss
                </Button>
              </span>
            </Grid>
          </Stack>
        ) : href === undefined ? null : (
          // R40: Copy link beside Open artifact, at its height; the bar keeps its icon.
          // No T2 layer draws this Copy link, so it has no data-figma name.
          <Inline gap="8" align="center" data-testid="open-actions">
            <span className={grow} data-figma="button · Open artifact">
              <OpenArtifactLink href={href} size="xl" className={wide} />
            </span>
            <CopyLinkButton size="xl" status={copyLinkStatus} onClick={onCopyLink} />
          </Inline>
        )}
        {phone ? null : (
          <Inline gap="6" align="center" className={linkRow} data-figma="link">
            <LinkMark />
            {href === undefined ? (
              <span className={link}>{artifact.link}</span>
            ) : (
              <a className={link} href={href} target="_blank" rel="noopener noreferrer">
                {artifact.link}
              </a>
            )}
          </Inline>
        )}
        {/* A card opened from the library names no chat, so it has no Made in. */}
        {artifact.madeIn === undefined ? null : <MadeIn madeIn={artifact.madeIn} />}
      </Stack>
    </DetailFrame>
  )
}
