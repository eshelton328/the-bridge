// The subagents panel beside the main chat (D3 105:1312): its title, the
// count and Close, then a card for each subagent and subtask of the chat.
// It takes the side slot, 420 wide (`sideWidth="wide"`). Props only.
import { Button, CloseIcon, Inline, Stack } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { SubagentsPanel } from '../types.ts'
import { SubagentCard } from './SubagentCard.tsx'

const panel = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '10',
  flex: '1',
  minH: '[0]',
  // D3 105:1313: the title row sits 17 from the top; the 24 px close button centres it 12 down.
  pt: '12',
  px: '16',
  bg: 'surface.pane',
  borderLeftWidth: 'default',
  borderLeftStyle: 'solid',
  borderLeftColor: 'border.default',
  overflowY: 'auto',
})
const heading = css({ textStyle: 'paneTitle', color: 'fg.default', m: '0' })
const count = css({ textStyle: 'mono', color: 'fg.subtle', flex: '1' })

export type SubagentsPaneProps = {
  panel: SubagentsPanel
  /** The subagents whose transcript is open. */
  open: readonly string[]
  onOpenChange?: ((open: string[]) => void) | undefined
  onClose?: (() => void) | undefined
  /** The Figma layers of the panel and of each card, by subagent id. */
  figma?: { panel?: string | undefined; cards?: Record<string, string> | undefined } | undefined
}

export function SubagentsPane({ panel: data, open, onOpenChange, onClose, figma }: SubagentsPaneProps) {
  return (
    <aside data-figma={figma?.panel} aria-label={data.title} className={panel}>
      <Inline gap="8" align="center">
        <h2 className={heading}>{data.title}</h2>
        <span className={count}>{data.items.length}</span>
        <Button variant="text" size="xs" iconOnly aria-label={data.closeLabel} onClick={onClose}>
          <CloseIcon size="16" />
        </Button>
      </Inline>
      <Stack gap="10">
        {data.items.map((item) => (
          <SubagentCard
            key={item.id}
            item={item}
            labels={data}
            figma={figma?.cards?.[item.id]}
            transcriptOpen={open.includes(item.id)}
            onTranscriptOpenChange={(next) =>
              onOpenChange?.(next ? [...open, item.id] : open.filter((id) => id !== item.id))
            }
          />
        ))}
      </Stack>
    </aside>
  )
}
