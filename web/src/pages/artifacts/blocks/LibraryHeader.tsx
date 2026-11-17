// The Artifacts header (Figma 402:15371): the title with the library's
// count, and at the end of the row when the library last checked its
// sources and Add a link. On a tablet (T1 405:106) the title is larger,
// Add a link is a 36 px control and the status goes on its own row under
// the header (405:114). Props only.
import { Button, PageHeader, PlusIcon, Stack } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import { FoundStatus } from './FoundStatus.tsx'

// T1's header is 44 high (405:106), more than its title and Add a link; the status takes its own width (405:114).
const tabletHeader = css({ minH: 'control.xl' })
const ownWidth = css({ alignSelf: 'flex-start' })

export type LibraryHeaderProps = {
  title: string
  /** The library's count, or during a search what it shows of it, such as "3 of 24". */
  count: number | string
  found: string
  addLink: string
  /** The desktop puts the status in the header's row; a tablet or phone puts it under the header. */
  layout?: Viewport | undefined
  onAddLink?: (() => void) | undefined
}

export function LibraryHeader({ title, count, found, addLink, layout = 'desktop', onAddLink }: LibraryHeaderProps) {
  const desktop = layout === 'desktop'
  const header = (
    <div data-figma="header" className={desktop ? undefined : tabletHeader}>
      {/* T1's title (405:107) is a 34 px text box; the nearest size is the library's phone title (28). */}
      <PageHeader
        title={title}
        count={count}
        countLabel={`${String(count)} artifacts`}
        size={desktop ? 'page' : 'phone'}
      >
        {desktop ? <FoundStatus text={found} /> : null}
        <span data-figma="button · Add a link">
          <Button size={desktop ? 'md' : 'lg'} onClick={onAddLink}>
            <PlusIcon />
            {addLink}
          </Button>
        </span>
      </PageHeader>
    </div>
  )
  if (desktop) return header
  // T1: the status row sits 10 under the header (405:106 to 405:114), as the library's rows.
  return (
    <Stack gap="10">
      {header}
      <div className={ownWidth}>
        <FoundStatus text={found} />
      </div>
    </Stack>
  )
}
