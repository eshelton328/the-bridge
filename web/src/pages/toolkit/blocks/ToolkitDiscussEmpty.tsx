// An item's discussion before the first message (Figma "empty state", T5
// 464:350, M7 464:185): what to ask, what the chat can do, and questions to
// start with; a press puts the question in the reply box. The same library
// parts as the Artifacts discussion's empty state. On the tablet the
// suggestions sit in one row under "It can" (T5 464:371); on the phone they
// stack under "Try" (M7 464:205). Props only.
import {
  BookIcon,
  BubbleIcon,
  Button,
  ExternalLinkIcon,
  Inline,
  LinkIcon,
  Panel,
  Stack,
} from '@eshelton328/component-library-1701'
import type { ReactNode } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { ToolkitDiscussion } from '../types.ts'

// The library has no empty state with an icon tile (LIBRARY_GAPS.md, Discussion empty state); the tile is a round
// raised surface, as the Artifacts discussion draws it.
const tile = css({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  alignSelf: 'center',
  w: 'control.xl',
  h: 'control.xl',
  borderRadius: 'full',
  bg: 'surface.raised',
  color: 'accent.discuss',
})
// T5 464:354: SemiBold 17, centred.
const title = css({ textStyle: 'subtitle', color: 'fg.default', m: '0', textAlign: 'center' })
// T5 464:355: Regular 13/19 in a 420 px column, centred (`shell.widePane`); M7 464:190 in a 320 px one
// (`shell.popover`), so the lines break where Figma's do.
const texts = {
  tablet: css({
    textStyle: 'bodySm',
    color: 'fg.muted',
    m: '0',
    textAlign: 'center',
    alignSelf: 'center',
    maxW: 'shell.widePane',
  }),
  phone: css({
    textStyle: 'bodySm',
    color: 'fg.muted',
    m: '0',
    textAlign: 'center',
    alignSelf: 'center',
    maxW: 'shell.popover',
  }),
}
// T5 464:357: "It can" is 560 wide, centred in the 712 px area, 76 in from each side; no size or space token has 560
// or 76 (LIBRARY_GAPS.md, Discussion empty state), so two wrappers pad 40 and 32 and the box keeps 4 more at each side.
// M7 464:191 spans the area.
const canBox = { tablet: css({ px: '40' }), phone: undefined }
const canInner = { tablet: css({ px: '32' }), phone: undefined }
const canEdge = { tablet: css({ mx: '4' }), phone: undefined }
const can = css({ textStyle: 'small', color: 'fg.default' })
const canIcon = css({ display: 'inline-flex', color: 'fg.muted' })
const suggestionsRow = css({ alignSelf: 'center' })
// M7 464:206: "Try" in capitals, as the panel's label.
const tryLabel = css({ textStyle: 'eyebrow', textTransform: 'uppercase', color: 'fg.subtle', m: '0' })
const stacked = css({ justifyContent: 'flex-start' })

const icons = {
  book: <BookIcon size="12" />,
  links: <LinkIcon size="12" />,
  external: <ExternalLinkIcon size="12" />,
} as const satisfies Record<ToolkitDiscussion['empty']['can'][number]['icon'], ReactNode>

export type ToolkitDiscussEmptyProps = {
  empty: ToolkitDiscussion['empty']
  /** The tablet's page (T5, the suggestions in a row) or the phone's (M7, stacked under "Try"). */
  layout: 'tablet' | 'phone'
  /** A suggestion was pressed: its question goes in the reply box. */
  onPick?: ((text: string) => void) | undefined
  /**
   * The page's padding of the empty state's layer (`outer`) and of its content in it (`inner`), so the layer and the
   * text under the tile keep Figma's places (T5, M7); none in the desktop panel.
   */
  pad?: { outer?: string | undefined; inner?: string | undefined } | undefined
}

export function ToolkitDiscussEmpty({ empty, layout, onPick, pad }: ToolkitDiscussEmptyProps) {
  const pick = (s: string) => () => {
    onPick?.(s)
  }
  return (
    // T5: "It can" starts 12 under the empty state's layer, and the suggestions 12 under it (464:356, 464:371).
    <Stack gap="12">
      <div className={pad?.outer} data-figma="empty state">
        <Stack gap="10" className={pad?.inner}>
          <span className={tile}>
            <BubbleIcon size="20" />
          </span>
          <h3 className={title}>{empty.title}</h3>
          <p className={texts[layout]}>{empty.text}</p>
        </Stack>
      </div>
      <div className={canBox[layout]}>
        <div className={canInner[layout]}>
          <div className={canEdge[layout]} data-figma="it can">
            <Panel title={empty.canLabel}>
              <Stack gap="8">
                {empty.can.map((c) => (
                  <Inline key={c.text} gap="8" align="center" className={can}>
                    <span className={canIcon}>{icons[c.icon]}</span>
                    {c.text}
                  </Inline>
                ))}
              </Stack>
            </Panel>
          </div>
        </div>
      </div>
      {layout === 'phone' ? (
        <Stack gap="6" data-figma="suggestions">
          {empty.tryLabel === undefined ? null : <p className={tryLabel}>{empty.tryLabel}</p>}
          {empty.suggestions.map((s) => (
            <Button key={s} textSize="xs" className={stacked} data-figma={`button · ${s}`} onClick={pick(s)}>
              {s}
            </Button>
          ))}
        </Stack>
      ) : (
        <Inline gap="6" align="center" justify="center" wrap className={suggestionsRow} data-figma="suggestions">
          {empty.suggestions.map((s) => (
            <Button key={s} textSize="xs" data-figma={`button · ${s}`} onClick={pick(s)}>
              {s}
            </Button>
          ))}
        </Inline>
      )}
    </Stack>
  )
}
