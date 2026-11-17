// The side column of an open item's Overview (Figma `side`, D3 427:291):
// the items that use it ("Used in workflows" and their count), its files
// (a line per file or folder, a folder's files side by side) and the link
// to its evals, which opens the Evals tab. A section the item does not have
// is left out; with none (the rule in D4) the column is empty. Props only.
import {
  ChartIcon,
  ChevronRightIcon,
  FileIcon,
  FolderIcon,
  KindTile,
  ListRow,
} from '@eshelton328/component-library-1701'
import { css, cx } from '../../../../styled-system/css/index.js'
import type { ToolkitItemDetailView } from '../types.ts'

// D3 427:291: the sections are 22 apart (457:206 ends at 301, files 427:351 starts at 323, evals 427:383 at 500);
// no space token has 22, and the larger of 20 and 24 is taken.
const side = css({ display: 'flex', flexDirection: 'column', gap: '24', minW: '[0]' })
// D3 427:351: the file lines are 23 apart (346, 369, 392 …, each 17 high), the first 6 under the heading. The mono
// line is 16 high, so the lines are 6 apart and 10 under the heading, which keeps each within 3 px of Figma's.
const section = css({ display: 'flex', flexDirection: 'column', gap: '10', minW: '[0]' })
// D3 427:351: the files section is as wide as its longest line (342).
const filesSection = css({ alignSelf: 'flex-start' })
const heading = css({ display: 'flex', gap: '8', textStyle: 'eyebrow', color: 'fg.muted' })
const count = css({ color: 'fg.subtle' })
const list = css({ display: 'flex', flexDirection: 'column', gap: '6', listStyle: 'none', m: '0', p: '0' })
// D3 427:353: the icon, then the names in mono 8 after it (Figma 7), a folder's count 8 after its name.
const line = css({
  display: 'flex',
  alignItems: 'center',
  alignSelf: 'flex-start',
  gap: '8',
  textStyle: 'mono',
  color: 'fg.default',
})
const icon = css({ display: 'inline-flex', flexShrink: '0', color: 'fg.muted' })
const names = css({ display: 'flex', flexWrap: 'wrap', columnGap: '16' })
// D3 427:383: the evals link is a bordered row, as wide as the column.
const evalsBox = css({
  borderWidth: 'default',
  borderStyle: 'solid',
  borderColor: 'border.default',
  borderRadius: 'lg',
  bg: 'surface.pane',
})
const chevron = css({ display: 'inline-flex', color: 'fg.muted' })

export type ToolkitItemSideProps = {
  detail: ToolkitItemDetailView
  onTabChange?: ((tab: string) => void) | undefined
}

export function ToolkitItemSide({ detail, onTabChange }: ToolkitItemSideProps) {
  const { usedIn, files, evals } = detail
  return (
    <div className={side} data-figma="side">
      {usedIn === undefined || usedIn.label === '' ? null : (
        <section aria-label={usedIn.label} className={section} data-figma="used in workflows">
          <h3 className={heading}>
            {usedIn.label}
            <span className={count}>{usedIn.items.length}</span>
          </h3>
          {usedIn.items.length === 0 ? null : (
            <ul className={list}>
              {usedIn.items.map((ref) => (
                <li key={ref.path} className={line}>
                  <KindTile kind={ref.kind} size="sm" />
                  {ref.name}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
      {files === undefined ? null : (
        <section aria-label="Files" className={cx(section, filesSection)} data-figma="files">
          <h3 className={heading}>
            Files
            <span className={count}>{files.count}</span>
          </h3>
          <ul className={list}>
            {files.lines.map((fileLine) => (
              <li key={fileLine.names.join(' ')} className={line} data-figma={`file · ${fileLine.names.join('  ')}`}>
                <span className={icon}>
                  {fileLine.type === 'folder' ? <FolderIcon size="16" /> : <FileIcon size="16" />}
                </span>
                <span className={names}>
                  {fileLine.names.map((n) => (
                    <span key={n}>{n}</span>
                  ))}
                </span>
                {fileLine.count === undefined ? null : <span className={count}>{fileLine.count}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}
      {evals === undefined ? null : (
        <div className={evalsBox} data-figma="evals link">
          <ListRow
            title={evals.title}
            meta={evals.caption}
            leading={<ChartIcon size="16" />}
            trailing={
              <span className={chevron}>
                <ChevronRightIcon size="16" />
              </span>
            }
            onSelect={() => {
              onTabChange?.(evals.tab)
            }}
          />
        </div>
      )}
    </div>
  )
}
