// Where an open artifact was made (Figma "section · MADE IN", D2 403:519):
// the chat that published it, its workspace, model and age, and Open in
// workspace, which opens that chat. On a phone (M2 406:420) the section has
// no box and Open in workspace is a link under the meta line. A proposal
// (D2 note): it needs the chat kept with each artifact. Props only.
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
// M2 406:422: the mark sits by the meta line, 22 under the title's top; the text column takes its own width.
const phoneRow = css({ alignItems: 'center' })
const phoneText = css({ alignItems: 'flex-start', minW: '[0]' })

export type MadeInProps = {
  madeIn: NonNullable<ArtifactDetail['madeIn']>
  onOpenInWorkspace?: (() => void) | undefined
  /**
   * The Figma layer of Open in workspace: its name, or its node id where the frame has two layers of that name (D7,
   * where the discussion's header has one too).
   */
  buttonLayer?: string | undefined
}

export function MadeIn({ madeIn, onOpenInWorkspace, buttonLayer = 'button · Open in workspace' }: MadeInProps) {
  return (
    // M2 puts the label's 17 px box 6 over the chat (406:421 to 406:422); the label is 16 high here, so 8, as D2 and T2.
    <Stack gap="8" data-figma="section · MADE IN">
      <h3 className={label}>{madeIn.label}</h3>
      {madeIn.action === undefined ? (
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
      ) : (
        <Inline gap="10" className={phoneRow} data-figma="made in">
          {/* 406:423 is 14 px; KindMark draws 12 or 16 (LIBRARY_GAPS.md, Made in on the phone). */}
          <KindMark kind={madeIn.source} size="12" />
          {/* 406:425: the lines 2 apart; with none here the 24 px text Button's label sits where Figma's 17 px link is. */}
          <Stack gap="0" className={phoneText} data-figma="text">
            <p className={title}>{madeIn.title}</p>
            <p className={meta}>{madeIn.meta}</p>
            {/* 452:4229: a mono cyan link 17 high; the nearest library part is the text Button (LIBRARY_GAPS.md). */}
            <span data-figma="link · Open in workspace">
              <Button variant="text" size="xs" textSize="xs" onClick={onOpenInWorkspace}>
                {madeIn.action}
              </Button>
            </span>
          </Stack>
        </Inline>
      )}
    </Stack>
  )
}
