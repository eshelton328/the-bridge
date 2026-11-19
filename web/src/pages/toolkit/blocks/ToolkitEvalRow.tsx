// The headless sessions of one skill eval, in the Headless runs list of the
// Activity view (Figma `eval · writer`, D16 477:1122; T12 477:1866; M14
// 477:2546): the skill's chip (a library `MapNode`, as the chats' items) and
// the word after it, the eval's toolkit calls and the chevron, the share of
// its sessions that loaded an item as a bar (the library's
// `HorizontalBarChart` with one row and no label or value: the library has
// no progress bar with a track, LIBRARY_GAPS.md, Eval share bar) and the
// line under it. A tap on the row opens the skill on its Evals tab, a tap on
// the chip its page. The row's button lies under the content, which paints
// above it and lets the pointer through, so hover or focus lights the line
// behind the text and the chip stays a button of its own. A folder with no
// skill (T12 `eval · readme-reads folder` 477:1936) has its name as text and
// no tap. Props only.
import { ChevronRightIcon, HorizontalBarChart, MapNode, focusRing } from '@eshelton328/component-library-1701'
import { BlockBoundary } from '../../../errors/BlockBoundary.tsx'
import { css } from '../../../../styled-system/css/index.js'
import type { ToolkitEvalGroup } from '../types.ts'
import { evalLayer, evalShare, linkLayer } from './activitySources.ts'

const item = css({ position: 'relative' })
const button = css({
  position: 'absolute',
  inset: '0',
  p: '0',
  bg: 'transparent',
  border: 'none',
  borderRadius: 'md',
  cursor: 'pointer',
  _hover: { bg: 'surface.selected' },
  outline: 'none',
  [focusRing]: { outlineWidth: 'strong', outlineStyle: 'solid', outlineColor: 'border.focus' },
})
// D16 477:1123 to 477:1135: the top row (29 high), the bar 6 under it and the line 6 under the bar.
// A BlockBoundary alert takes the pointer back, so its Retry does not open the row under it.
const content = css({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  gap: '6',
  pointerEvents: 'none',
  '& [role=alert]': { pointerEvents: 'auto' },
})
const top = css({ display: 'flex', alignItems: 'center', gap: '8', minH: 'control.sm', color: 'fg.muted' })
const node = css({ display: 'inline-grid', h: 'control.sm', pointerEvents: 'auto' })
const name = css({ textStyle: 'label', color: 'fg.default' })
const after = css({ textStyle: 'small', color: 'fg.muted' })
const calls = css({ ms: 'auto', textStyle: 'mono', color: 'fg.muted', whiteSpace: 'nowrap' })
const meta = css({ textStyle: 'small', color: 'fg.muted' })

export type ToolkitEvalRowProps = {
  group: ToolkitEvalGroup
  /** Opens the eval's skill on its Evals tab, by its path. */
  onOpen?: ((path: string) => void) | undefined
  /** Opens the eval's skill on its page, by its path. */
  onOpenItem?: ((path: string) => void) | undefined
}

export function ToolkitEvalRow({ group, onOpen, onOpenItem }: ToolkitEvalRowProps) {
  const skill = group.skill
  return (
    <li className={item} data-figma={evalLayer(group)}>
      {skill === undefined ? null : (
        <button
          type="button"
          className={button}
          aria-label={`Open the ${group.name} evals`}
          onClick={() => {
            onOpen?.(skill.path)
          }}
        />
      )}
      <div className={content}>
        <div className={top}>
          {skill === undefined ? (
            <span className={name}>{group.name}</span>
          ) : (
            <span className={node} data-figma={linkLayer(group)}>
              <MapNode
                label={group.name}
                kind={skill.kind}
                onClick={() => {
                  onOpenItem?.(skill.path)
                }}
              />
            </span>
          )}
          {group.after === undefined ? null : <span className={after}>{group.after}</span>}
          <span className={calls}>{group.calls}</span>
          {skill === undefined ? null : <ChevronRightIcon size="16" />}
        </div>
        <BlockBoundary contentKey={group.name}>
          <HorizontalBarChart
            label={`${group.name}: the share of sessions that loaded an item`}
            rows={[{ label: '', value: evalShare(group) }]}
            max={100}
            formatValue={() => ''}
          />
        </BlockBoundary>
        <span className={meta}>{group.meta}</span>
      </div>
    </li>
  )
}
