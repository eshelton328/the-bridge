// A project's page in the shell's detail (D01, T01, T01b, M01; R4): its
// header and the tabs of increment one, Overview and Ideas (d-133). The
// Overview's panels are NCC-130's and the Ideas list NCC-132's, so each tab
// shows no panel yet. Props only.
import { BulbIcon, GridIcon, ItemTabs } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import { ProjectHeader } from '../blocks/ProjectHeader.tsx'
import { type ProjectCard, ProjectTab, type ProjectsData, type ProjectsUi } from '../types.ts'

// The page's sides, as the Projects home has them (D10, T10, M10), and its
// top: 24 on a desktop or tablet, where D01, T01 and T01b draw 28 (no
// spacing token has 28), and the home's 40 on a phone.
const page = {
  desktop: css({ pt: '24', pb: '32', px: '40' }),
  tablet: css({ pt: '24', pb: '32', px: '32' }),
  phone: css({ pt: '40', pb: '16', px: '16' }),
} as const satisfies Record<Viewport, string>
const tabs = css({ pt: '32' })

export type ProjectDetailProps = {
  project: ProjectCard
  data: ProjectsData
  ui: ProjectsUi
  layout: Viewport
  onUiChange?: ((change: Partial<ProjectsUi>) => void) | undefined
  onBack?: (() => void) | undefined
  onQuickChat?: (() => void) | undefined
}

export function ProjectDetail({ project, data, ui, layout, onUiChange, onBack, onQuickChat }: ProjectDetailProps) {
  const words = data.page
  return (
    <div className={page[layout]}>
      <ProjectHeader project={project} words={words} layout={layout} onBack={onBack} onQuickChat={onQuickChat} />
      <div className={tabs} data-figma="project tabs">
        <ItemTabs
          label={words.tabs}
          tone="accent"
          size={layout === 'desktop' ? 'md' : 'lg'}
          value={ui.tab ?? 'overview'}
          onValueChange={(tab) => {
            const picked = ProjectTab.safeParse(tab)
            if (picked.success) onUiChange?.({ tab: picked.data })
          }}
          items={[
            { value: 'overview', label: words.overview, icon: <GridIcon />, content: null },
            { value: 'ideas', label: words.ideas, icon: <BulbIcon />, content: null },
          ]}
        />
      </div>
    </div>
  )
}
