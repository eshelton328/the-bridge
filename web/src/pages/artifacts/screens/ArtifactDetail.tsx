// An artifact open beside the library list (Figma "artifact pane", D2
// 403:448): the bar, the title block, the preview and where it was made,
// 20 apart in the detail column (748 wide). With its discussion open (D7)
// the list closes and the library `DetailSplit` keeps the artifact's
// column and gives the discussion the rest of the pane, up to
// `shell.discussionPane`, as the Inbox's task and discussion (D14); the
// column and the discussion each scroll on their own (d-107). Copy
// link calls `onCopyLink`; Remove, Open artifact and Open in workspace
// render as Figma draws them; their screens come with later frames. The project chip opens the
// project menu (`projectMenu`). Props only.
import { Container, DetailSplit, Stack } from '@eshelton328/component-library-1701'
import type { ReactNode } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import { DetailFrame } from '../../../blocks/DetailFrame.tsx'
import { BlockBoundary } from '../../../errors/BlockBoundary.tsx'
import { ArtifactBar } from '../blocks/ArtifactBar.tsx'
import { ArtifactPreview } from '../blocks/ArtifactPreview.tsx'
import { ArtifactTitleBlock, type ProjectMenu } from '../blocks/ArtifactTitleBlock.tsx'
import { MadeIn } from '../blocks/MadeIn.tsx'
import type { ArtifactDetail as Artifact, CopyLinkStatus } from '../types.ts'

// The pane fills the shell's detail column, as Figma's 403:448 does.
const pane = css({ flex: '1' })
// D7: in DetailSplit's item the column fills the detail's height and no more, so its DetailFrame and the side's
// ScrollFrame each scroll on their own (d-107), as the Inbox's task and discussion.
const column = css({ display: 'flex', flexDirection: 'column', flex: '1', minH: '[0]' })
// DetailSplit's item keeps its content's width; the content keeps its full 748, so the detail Container is 828 with
// its 40 px sides, as the artifact pane beside the list, and the side takes the 620 left in a 1512 px frame.
const full = css({ w: 'shell.detail' })

export type ArtifactDetailProps = {
  artifact: Artifact
  /** The bar's pill, such as "New" or, after Apply, "Updated" (D9); none without it. */
  badge?: string | undefined
  /** Discuss was pressed; without it Discuss does nothing. */
  onDiscuss?: (() => void) | undefined
  /** Copy link was pressed; without it Copy link does nothing. */
  onCopyLink?: (() => void) | undefined
  /** What the last Copy link did, which the bar's button shows ("Copied" or "Copy failed"). */
  copyLinkStatus?: CopyLinkStatus | undefined
  /** Beside the artifact, such as its open discussion (D7); Discuss is pressed while it shows. */
  side?: ReactNode
  /**
   * The node id of "Made in"'s Open in workspace while a side shows: the discussion's header has a layer of the same
   * name (D7 452:2406, D8 452:3016).
   */
  madeInLayer?: string | undefined
  /** The menu the project chip opens; without it the chip is text. */
  projectMenu?: ProjectMenu | undefined
  /** Remove was pressed (the live library); without it Remove does nothing. */
  onRemove?: (() => void) | undefined
}

export function ArtifactDetail({
  artifact,
  badge,
  onDiscuss,
  onCopyLink,
  copyLinkStatus,
  side,
  madeInLayer,
  projectMenu,
  onRemove,
}: ArtifactDetailProps) {
  const parts = (
    <>
      <ArtifactBar
        badge={badge}
        found={artifact.found}
        discussOpen={side === undefined ? undefined : true}
        onDiscuss={onDiscuss}
        onCopyLink={onCopyLink}
        copyLinkStatus={copyLinkStatus}
        onRemove={onRemove}
      />
      <ArtifactTitleBlock artifact={artifact} projectMenu={projectMenu} />
      {/* d-084: a preview that fails to render shows its fallback; the bar and the title stay. */}
      <BlockBoundary contentKey={artifact.id}>
        <ArtifactPreview artifact={artifact} />
      </BlockBoundary>
      {/* A card opened from the library names no chat, so it has no Made in. */}
      {artifact.madeIn === undefined ? null : (
        <MadeIn madeIn={artifact.madeIn} buttonLayer={side === undefined ? undefined : madeInLayer} />
      )}
    </>
  )
  if (side === undefined)
    return (
      <div className={pane} data-figma="artifact pane">
        <Container size="detail" gap="20">
          {parts}
        </Container>
      </div>
    )
  return (
    <DetailSplit side={side}>
      <div className={column} data-figma="artifact pane">
        <DetailFrame layout="desktop">
          <Stack gap="20" className={full}>
            {parts}
          </Stack>
        </DetailFrame>
      </div>
    </DetailSplit>
  )
}
