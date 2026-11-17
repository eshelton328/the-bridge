// The Artifacts header (Figma 402:15371): the title with the library's
// count, and at the end of the row when the library last checked its
// sources and Add a link. Props only.
import { Button, PageHeader, PlusIcon } from '@eshelton328/component-library-1701'
import { FoundStatus } from './FoundStatus.tsx'

export type LibraryHeaderProps = {
  title: string
  count: number
  found: string
  addLink: string
  onAddLink?: (() => void) | undefined
}

export function LibraryHeader({ title, count, found, addLink, onAddLink }: LibraryHeaderProps) {
  return (
    <div data-figma="header">
      <PageHeader title={title} count={count} countLabel={`${String(count)} artifacts`}>
        <FoundStatus text={found} />
        <span data-figma="button · Add a link">
          <Button onClick={onAddLink}>
            <PlusIcon />
            {addLink}
          </Button>
        </span>
      </PageHeader>
    </div>
  )
}
