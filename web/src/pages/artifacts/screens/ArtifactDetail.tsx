// An artifact open beside the library list (Figma "artifact pane", D2
// 403:448): the bar, the title block, the preview and where it was made,
// 20 apart in the detail column (748 wide). Copy link, Remove, the project
// menu, Open artifact and Open in workspace render as Figma draws them;
// their screens come with later frames. Props only.
import { Container } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import { ArtifactBar } from '../blocks/ArtifactBar.tsx'
import { ArtifactPreview } from '../blocks/ArtifactPreview.tsx'
import { ArtifactTitleBlock } from '../blocks/ArtifactTitleBlock.tsx'
import { MadeIn } from '../blocks/MadeIn.tsx'
import type { ArtifactDetail as Artifact } from '../types.ts'

// The pane fills the shell's detail column, as Figma's 403:448 does.
const pane = css({ flex: '1' })

export type ArtifactDetailProps = {
  artifact: Artifact
}

export function ArtifactDetail({ artifact }: ArtifactDetailProps) {
  return (
    <div className={pane} data-figma="artifact pane">
      <Container size="detail" gap="20">
        <ArtifactBar isNew={artifact.isNew} found={artifact.found} />
        <ArtifactTitleBlock artifact={artifact} />
        <ArtifactPreview artifact={artifact} />
        <MadeIn madeIn={artifact.madeIn} />
      </Container>
    </div>
  )
}
