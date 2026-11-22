// The preview of an open artifact (Figma "preview", D2 403:482): its
// thumbnail the width of the column, and a footer with its link, Copy link
// and Open artifact, a link to the artifact's https address (`href`) in a
// new tab; with no `href` the link is text and neither control shows. The library has no framed
// preview with a footer (LIBRARY_GAPS.md: Artifact preview frame); the box
// takes the Card's border, radius and fill. Props only.
import { Inline, Thumbnail } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { ArtifactDetail, CopyLinkStatus } from '../types.ts'
import { CopyLinkButton } from './CopyLinkButton.tsx'
import { LinkMark } from './LinkMark.tsx'
import { OpenArtifactLink } from './OpenArtifactLink.tsx'

const box = css({
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  bg: 'surface.pane',
  borderRadius: 'lg',
  borderWidth: 'default',
  borderStyle: 'solid',
  borderColor: 'border.default',
})
// 403:499: 52 high, the link 14 in, Open artifact 10 from the end.
const footer = css({ p: '10', ps: '12', color: 'fg.muted' })
const link = css({ textStyle: 'mono', color: 'fg.muted', flex: '1', overflow: 'hidden', textDecoration: 'none' })

export type ArtifactPreviewProps = {
  artifact: Pick<ArtifactDetail, 'title' | 'preview' | 'link' | 'reference'>
  /** The https address the artifact's link opens (`artifactHref`); none for a link that is not one. */
  href?: string | undefined
  /** Copy link beside Open artifact was pressed; without it Copy link does nothing. */
  onCopyLink?: (() => void) | undefined
  /** What the last Copy link did, which the button shows ("Copied" or "Copy failed"). */
  copyLinkStatus?: CopyLinkStatus | undefined
}

export function ArtifactPreview({ artifact, href, onCopyLink, copyLinkStatus }: ArtifactPreviewProps) {
  return (
    <div className={box} data-figma="preview">
      <Thumbnail
        kind={artifact.preview}
        shape="banner"
        framed={false}
        label={`${artifact.title} preview`}
        {...(artifact.reference === undefined ? {} : { reference: artifact.reference })}
      />
      <Inline gap="8" align="center" className={footer} data-figma="preview footer">
        <LinkMark />
        {href === undefined ? (
          <span className={link}>{artifact.link}</span>
        ) : (
          <>
            <a className={link} href={href} target="_blank" rel="noopener noreferrer">
              {artifact.link}
            </a>
            {/* R40: Copy link next to Open artifact, as on the tablet and phone; the bar keeps its own. No Figma layer
                draws this one, so it has no data-figma name. */}
            <Inline gap="8" align="center" data-testid="open-actions">
              <CopyLinkButton status={copyLinkStatus} onClick={onCopyLink} />
              <span data-figma="button · Open artifact">
                <OpenArtifactLink href={href} />
              </span>
            </Inline>
          </>
        )}
      </Inline>
    </div>
  )
}
