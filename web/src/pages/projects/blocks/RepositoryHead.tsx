// The head of a repository card (d-135): its name with its visibility pill,
// its role from project.yaml (with the line of GitHub's facts not read), and
// Architecture and View on GitHub ("GitHub" on the phone), secondary, with a
// 16 px icon, md on the desktop and lg elsewhere, as the project's header
// sizes Quick chat. View on GitHub is a plain link that opens a new tab, drawn
// with the library's `button` recipe as `Button` draws it (as Artifacts' Open
// artifact), so the Home Screen app opens Safari. Off GitHub it is left out.
// Props only; the entry opens the Architecture tab.
import { Badge, Button, ExternalLinkIcon, LinksIcon } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import { button } from '../../../../styled-system/recipes/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import type { ProjectPageWords, RepositoryRow } from '../types.ts'

const head = css({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '12',
})
const titled = css({ display: 'flex', flexDirection: 'column' })
const nameRow = css({ display: 'flex', alignItems: 'center', gap: '8', flexWrap: 'wrap' })
const name = css({ textStyle: 'title', color: 'fg.default', overflowWrap: 'anywhere' })
const role = css({ textStyle: 'small', color: 'fg.muted' })
const actions = css({ display: 'flex', gap: '8', flexWrap: 'wrap' })

/** The words the head draws. */
export type RepositoryHeadWords = Pick<ProjectPageWords, 'visibility' | 'unread' | 'architecture' | 'repository'>

export type RepositoryHeadProps = {
  row: RepositoryRow
  words: RepositoryHeadWords
  layout: Viewport
  /** The ID of the card's name, which names the card. */
  nameId: string
  /** Opens the Architecture tab on this repository. */
  onArchitecture?: ((repo: string) => void) | undefined
}

export function RepositoryHead({ row, words, layout, nameId, onArchitecture }: RepositoryHeadProps) {
  const size = layout === 'desktop' ? 'md' : 'lg'
  const about = row.unread.includes('about') ? [words.unread.about] : []
  const github = row.github
  return (
    <div className={head} data-figma="repository head">
      <div className={titled}>
        <div className={nameRow}>
          <h2 id={nameId} className={name}>
            {row.id}
          </h2>
          {row.visibility === null ? null : (
            <Badge variant="pill" tone="idle" label={words.visibility[row.visibility]} />
          )}
        </div>
        <p className={role}>{[row.role, ...about].filter((part) => part !== '').join(' · ')}</p>
      </div>
      <div className={actions}>
        <Button variant="secondary" size={size} keepIconSize onClick={() => onArchitecture?.(row.id)}>
          <LinksIcon size="16" />
          {words.architecture}
        </Button>
        {github === null ? null : (
          <a
            className={button({ variant: 'secondary', size, keepIconSize: true })}
            href={`https://github.com/${encodeURIComponent(github.owner)}/${encodeURIComponent(github.name)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLinkIcon size="16" />
            {layout === 'phone' ? words.repository.githubShort : words.repository.github}
          </a>
        )}
      </div>
    </div>
  )
}
