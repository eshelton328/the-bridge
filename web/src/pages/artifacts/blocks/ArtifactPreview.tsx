// The preview of an open artifact (Figma "preview", D2 403:482): its
// thumbnail the width of the column, and a footer with its link and Open
// artifact, which opens the artifact's page. The library has no framed
// preview with a footer (LIBRARY_GAPS.md: Artifact preview frame); the box
// takes the Card's border, radius and fill. Props only.
import { Button, ExternalLinkIcon, Inline, Thumbnail } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { ArtifactDetail } from '../types.ts'
import { LinkMark } from './LinkMark.tsx'

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
  onOpenArtifact?: (() => void) | undefined
}

export function ArtifactPreview({ artifact, onOpenArtifact }: ArtifactPreviewProps) {
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
        {/* A card opened from the library has a link only when its card has; the space keeps Open artifact at the end. */}
        {artifact.link === undefined ? (
          <span className={link} />
        ) : (
          <>
            <LinkMark />
            <a className={link} href={`https://${artifact.link}`} target="_blank" rel="noreferrer">
              {artifact.link}
            </a>
          </>
        )}
        <span data-figma="button · Open artifact">
          <Button variant="primary" onClick={onOpenArtifact}>
            Open artifact
            <ExternalLinkIcon />
          </Button>
        </span>
      </Inline>
    </div>
  )
}
