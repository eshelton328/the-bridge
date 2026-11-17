// An artifact open beside the library list (Figma "artifact pane", D2
// 403:448): the bar, the title block, the preview and where it was made,
// 20 apart in the detail column (748 wide). With its discussion open (D7)
// the list closes, the artifact keeps its column and the discussion takes
// the rest of the pane, as the Inbox's task and discussion (D14). Copy
// link, Remove, the project menu, Open artifact and Open in workspace
// render as Figma draws them; their screens come with later frames. Props
// only.
import { Container } from '@eshelton328/component-library-1701'
import type { ReactNode } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import { ArtifactBar } from '../blocks/ArtifactBar.tsx'
import { ArtifactPreview } from '../blocks/ArtifactPreview.tsx'
import { ArtifactTitleBlock } from '../blocks/ArtifactTitleBlock.tsx'
import { MadeIn } from '../blocks/MadeIn.tsx'
import type { ArtifactDetail as Artifact } from '../types.ts'

// The pane fills the shell's detail column, as Figma's 403:448 does.
const pane = css({ flex: '1' })
// D7: the artifact keeps its column and scrolls on its own; the side fills the rest.
const withSide = css({ display: 'flex', flexDirection: 'row', flex: '1' })
const column = css({ flexShrink: '0', overflowY: 'auto' })
// Beside a side the column shrinks to its content; the container keeps its full 748 (content-box, so 828 with its
// 40 px sides), as the artifact pane beside the list does.
const full = css({ w: 'shell.detail' })

export type ArtifactDetailProps = {
  artifact: Artifact
  /** Discuss was pressed; without it Discuss does nothing. */
  onDiscuss?: (() => void) | undefined
  /** Beside the artifact, such as its open discussion (D7); Discuss is pressed while it shows. */
  side?: ReactNode
}

export function ArtifactDetail({ artifact, onDiscuss, side }: ArtifactDetailProps) {
  const content = (
    <Container size="detail" gap="20" className={side === undefined ? undefined : full}>
      <ArtifactBar
        isNew={artifact.isNew}
        found={artifact.found}
        discussOpen={side === undefined ? undefined : true}
        onDiscuss={onDiscuss}
      />
      <ArtifactTitleBlock artifact={artifact} />
      <ArtifactPreview artifact={artifact} />
      {/* D7 has two layers named "button · Open in workspace"; 452:2406 is this one. */}
      <MadeIn madeIn={artifact.madeIn} buttonLayer={side === undefined ? undefined : '452:2406'} />
    </Container>
  )
  if (side === undefined)
    return (
      <div className={pane} data-figma="artifact pane">
        {content}
      </div>
    )
  return (
    <div className={withSide}>
      <div className={column} data-figma="artifact pane">
        {content}
      </div>
      {side}
    </div>
  )
}
