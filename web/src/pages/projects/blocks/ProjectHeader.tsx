// The head of a project's page (D01, T01, T01b, M01; R4): Back to Projects
// with Quick chat at the end of its row, then the project's picture beside
// its name and purpose. Props only; the entry goes back and opens Quick chat.
import { BackRow, Button, ChatIcon } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import type { ProjectCard, ProjectPageWords } from '../types.ts'
import { ProjectTile } from './ProjectTile.tsx'

// The picture's top meets the name's line on a desktop (D01). On a tablet
// or a phone it sits at the middle of the name and the purpose (T01, T01b),
// 16 from them.
const titleStyle = css.raw({ display: 'flex', alignItems: 'flex-start', gap: '16', pt: '16' })
const title = {
  desktop: css(titleStyle),
  tablet: css(titleStyle, { alignItems: 'center' }),
  phone: css(titleStyle, { alignItems: 'center' }),
} as const satisfies Record<Viewport, string>
const name = css({ textStyle: 'heading', color: 'fg.default' })
const purpose = css({ textStyle: 'body', color: 'fg.muted' })

export type ProjectHeaderProps = {
  project: ProjectCard
  words: ProjectPageWords
  layout: Viewport
  onBack?: (() => void) | undefined
  onQuickChat?: (() => void) | undefined
}

export function ProjectHeader({ project, words, layout, onBack, onQuickChat }: ProjectHeaderProps) {
  return (
    <header data-figma="project header">
      <BackRow label={words.back} backLabel={words.backLabel} onBack={onBack}>
        <span data-figma="button · Quick chat">
          <Button variant="primary" size={layout === 'desktop' ? 'md' : 'lg'} onClick={onQuickChat}>
            <ChatIcon />
            {words.quickChat}
          </Button>
        </span>
      </BackRow>
      <div className={title[layout]}>
        <ProjectTile name={project.name} icon={project.icon} size="picture" />
        <div>
          <h1 className={name}>{project.name}</h1>
          <p className={purpose}>{project.purpose}</p>
        </div>
      </div>
    </header>
  )
}
