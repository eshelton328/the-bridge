// What an open chat shows under its header (D18 `side panel · chat`
// 475:373, T14 475:779, M16 475:1127): the line on the chat (475:385), Open
// the session in Workbench (475:386), its values with where each comes from
// (`fields` 475:390: the label, the value and the source in mono; the phone
// has no source column, M16 475:1144), the toolkit items it used
// (`ToolkitChatItems`, each opens its page) and the tools it called, each
// with its count (`steps` 475:428). The Workbench has no state that takes a
// toolkit chat, so the button is disabled with a title, as a run's is. The
// library has no field table and no dot for a tool's line (LIBRARY_GAPS.md,
// Run panel), so they are text in its styles. Props only.
import { Button, ExternalLinkIcon } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import type { ToolkitActivityChat } from '../types.ts'
import { toolLayer } from './activitySources.ts'
import { ToolkitChatItems } from './ToolkitChatItems.tsx'

/** Why Open the session in Workbench does nothing yet: its title. */
const sessionWaiting = 'The Workbench cannot open a toolkit chat’s session yet'

const root = css({ display: 'flex', flexDirection: 'column', gap: '12', minW: '[0]' })
const text = css({ textStyle: 'small', color: 'fg.muted', m: '0' })
const open = css({ display: 'grid' })
const fields = css({
  display: 'flex',
  flexDirection: 'column',
  m: '0',
  borderWidth: 'default',
  borderStyle: 'solid',
  borderColor: 'border.default',
  borderRadius: 'md',
  bg: 'surface.pane',
})
// D18 475:391: each field 12 in and 8 down: the label 100 wide, the value 132 and the source 120, 10 apart (25:33:30);
// T14 475:797: 100, 446 and 120 (5:22:6); M16 475:1145: the label 100 and the value 230 (10:23).
const field = {
  desktop: css({ display: 'grid', gridTemplateColumns: '[25fr 33fr 30fr]', columnGap: '10', px: '12', py: '8' }),
  tablet: css({ display: 'grid', gridTemplateColumns: '[5fr 22fr 6fr]', columnGap: '10', px: '12', py: '8' }),
  phone: css({ display: 'grid', gridTemplateColumns: '[10fr 23fr]', columnGap: '10', px: '12', py: '8' }),
}
const label = css({ textStyle: 'small', color: 'fg.muted', m: '0' })
const value = css({ textStyle: 'small', color: 'fg.default', m: '0' })
const source = css({ textStyle: 'mono', color: 'fg.muted', m: '0' })
const heading = css({ textStyle: 'monoCaps', color: 'fg.muted', m: '0' })
// D18 475:429: a tool a line 32 apart: the count in mono, then the tool's name.
const tools = css({ display: 'flex', flexDirection: 'column', listStyle: 'none', m: '0', p: '0' })
const tool = css({ display: 'flex', alignItems: 'center', gap: '10', minH: 'control.md' })
const count = css({ textStyle: 'mono', color: 'fg.muted', fontVariantNumeric: 'tabular-nums' })
const name = css({ textStyle: 'label', color: 'fg.default' })

export type ToolkitChatDetailProps = {
  chat: ToolkitActivityChat
  layout: Viewport
  /** The button's label, such as "Open the session in Workbench". */
  openSession: string
  /** Opens an item the chat used on its page, by its path. */
  onOpenItem?: ((path: string) => void) | undefined
}

export function ToolkitChatDetail({ chat, layout, openSession, onOpenItem }: ToolkitChatDetailProps) {
  const detail = chat.detail
  return (
    <div className={root}>
      <p className={text}>{detail?.summary ?? chat.meta}</p>
      <div className={open}>
        <Button
          variant="primary"
          size="lg"
          aria-disabled="true"
          title={sessionWaiting}
          data-figma={detail?.layers?.openSession ?? 'button · Open session'}
        >
          <ExternalLinkIcon size="16" />
          {openSession}
        </Button>
      </div>
      {detail === undefined ? (
        <ToolkitChatItems items={chat.items} onOpen={onOpenItem} layer="toolkit items" />
      ) : (
        <>
          <dl className={fields} data-figma="fields">
            {detail.fields.map((f) => (
              <div key={f.label} className={field[layout]} data-figma={`field · ${f.label}`}>
                <dt className={label}>{f.label}</dt>
                <dd className={value}>{f.value}</dd>
                {f.source === undefined ? null : <dd className={source}>{f.source}</dd>}
              </div>
            ))}
          </dl>
          <h3 className={heading}>{detail.itemsLabel}</h3>
          <ToolkitChatItems items={chat.items} onOpen={onOpenItem} layer="toolkit items" />
          <h3 className={heading}>{detail.toolsLabel}</h3>
          <ul className={tools} aria-label={detail.toolsLabel} data-figma="steps">
            {detail.tools.map((t) => (
              <li key={t.name} className={tool} data-figma={toolLayer(t)}>
                <span className={count}>{String(t.count)}</span>
                <span className={name}>{t.name}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
