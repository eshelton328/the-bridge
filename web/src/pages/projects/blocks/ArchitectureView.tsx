// The Architecture tab (f-008 increment two, R9, R10, R14, R15, R16): the
// scope chips (System, then each repository), and the shown scope's title,
// caption and drawn diagram: the library's ArchitectureDiagram with the boxes
// of `layoutOf`, its legend and the hidden lists of its parts, boundaries and
// arrows. A repository's Stack groups its package.json badges. Regenerate and
// the Parts panel are a later PR's. Props only.
import { ArchitectureDiagram, Badge, FilterChips, Panel } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import { layoutOf } from '../../../lib/architectureLayout.ts'
import type { ProjectArchitecture, ProjectPageWords } from '../types.ts'

const tab = css({ display: 'flex', flexDirection: 'column', gap: '20', pt: '12' })
const body = {
  desktop: css({
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)',
    gap: '20',
    alignItems: 'start',
  }),
  // The frames draw 28 on a tablet; no spacing token has 28, so 24, as ProjectDetail's top.
  tablet: css({ display: 'flex', flexDirection: 'column', gap: '24' }),
  phone: css({ display: 'flex', flexDirection: 'column', gap: '20' }),
} as const satisfies Record<Viewport, string>
const line = css({ textStyle: 'small', color: 'fg.muted', px: '10', py: '6' })
const group = css({ display: 'flex', flexDirection: 'column', gap: '6', px: '10', py: '6' })
const badges = css({ display: 'flex', flexWrap: 'wrap', gap: '4' })

/** The words the tab draws. */
type ArchitectureWords = Pick<ProjectPageWords, 'arch'>

export type ArchitectureViewProps = {
  architecture: ProjectArchitecture
  words: ArchitectureWords
  layout: Viewport
  /** Shows another scope (`?scope=`). */
  onScopeChange?: ((scope: string) => void) | undefined
}

export function ArchitectureView({ architecture, words, layout, onScopeChange }: ArchitectureViewProps) {
  const { arch } = words
  const { model } = architecture
  const drawing = model === null ? null : layoutOf(model)
  const chips =
    architecture.chips.length === 0 ? null : (
      <FilterChips
        label={arch.chips}
        items={architecture.chips}
        value={[architecture.scope]}
        multiple={false}
        size={layout === 'phone' ? 'phone' : 'compact'}
        onValueChange={([next]) => {
          if (next !== undefined && next !== architecture.scope) onScopeChange?.(next)
        }}
      />
    )
  if (architecture.notRead !== undefined)
    return (
      <div className={tab}>
        {chips}
        <p role="status" className={line}>
          {architecture.notRead}
        </p>
      </div>
    )
  const stack = model?.stack ?? []
  return (
    <div className={tab}>
      {chips}
      <div className={body[layout]}>
        <Panel title={architecture.title}>
          {architecture.running ? (
            <p role="status" className={line}>
              {arch.running}
            </p>
          ) : null}
          {drawing === null ? (
            <p className={line}>{arch.none}</p>
          ) : (
            <ArchitectureDiagram
              title={architecture.title}
              caption={architecture.caption ?? undefined}
              width={drawing.width}
              height={drawing.height}
              parts={drawing.parts}
              boundaries={drawing.boundaries}
              arrows={drawing.arrows}
              scrollHint={arch.scrollHint}
            />
          )}
        </Panel>
        {stack.length === 0 ? null : (
          <Panel title={arch.stack} meta={arch.stackSource}>
            {stack.map((g) => (
              <section key={g.name} className={group} aria-label={g.name}>
                <span className={css({ textStyle: 'small', color: 'fg.muted' })}>{g.name}</span>
                <div className={badges}>
                  {g.badges.map((b) => (
                    <Badge key={b} label={b} />
                  ))}
                </div>
              </section>
            ))}
          </Panel>
        )}
      </div>
    </div>
  )
}
