// Where an open artifact was made (Figma "section · MADE IN", D2 403:519):
// the chat that published it, its workspace, model and age, and Open in
// workspace, which opens that chat. A proposal (D2 note): it needs the chat
// kept with each artifact. Props only.
import { Button, ChatIcon, Inline, KindMark, Stack } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { ArtifactDetail } from '../types.ts'

const label = css({ textStyle: 'eyebrow', textTransform: 'uppercase', color: 'fg.muted', m: '0' })
// 403:508: a bordered box, 15 in and 12 down in Figma; 16 at the sides on the 4 px grid.
const box = css({
  py: '12',
  px: '16',
  bg: 'surface.pane',
  borderRadius: 'lg',
  borderWidth: 'default',
  borderStyle: 'solid',
  borderColor: 'border.default',
})
const text = css({ flex: '1', overflow: 'hidden' })
const title = css({ textStyle: 'label', color: 'fg.default', m: '0' })
const meta = css({ textStyle: 'mono', color: 'fg.muted', m: '0' })

export type MadeInProps = {
  madeIn: ArtifactDetail['madeIn']
  onOpenInWorkspace?: (() => void) | undefined
  /**
   * The Figma layer of Open in workspace: its name, or its node id where the frame has two layers of that name (D7,
   * where the discussion's header has one too).
   */
  buttonLayer?: string | undefined
}

export function MadeIn({ madeIn, onOpenInWorkspace, buttonLayer = 'button · Open in workspace' }: MadeInProps) {
  return (
    <Stack gap="8" data-figma="section · MADE IN">
      <h3 className={label}>{madeIn.label}</h3>
      <Inline gap="12" align="center" className={box} data-figma="made in">
        <KindMark kind={madeIn.source} size="16" />
        <Stack gap="2" className={text}>
          <p className={title}>{madeIn.title}</p>
          <p className={meta}>{madeIn.meta}</p>
        </Stack>
        <span data-figma={buttonLayer}>
          <Button onClick={onOpenInWorkspace}>
            <ChatIcon />
            Open in workspace
          </Button>
        </span>
      </Inline>
    </Stack>
  )
}
