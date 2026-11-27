// A project's page in the shell's detail (D01, T01, T01b, M01; R4): its
// header and the tabs of increment one, Overview and Ideas (d-133). The
// Overview shows the Inbox and Queue panels (R5, R6) and the Ideas tab the
// idea records (R10).
// The Overview's other panels are later issues'. Props only.
import { BulbIcon, GridIcon, ItemTabs } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import { IdeasList } from '../blocks/IdeasList.tsx'
import { OverviewPanels } from '../blocks/OverviewPanels.tsx'
import { ProjectHeader } from '../blocks/ProjectHeader.tsx'
import { type ProjectCard, ProjectTab, type ProjectsData, type ProjectsUi } from '../types.ts'

// The page's sides, as the Projects home has them (D10, T10, M10), and its
// top: 24 on a desktop or tablet, where D01, T01 and T01b draw 28 (no
// spacing token has 28), and 8 on a phone, as M01 draws it.
const page = {
  desktop: css({ pt: '24', pb: '32', px: '40' }),
  tablet: css({ pt: '24', pb: '32', px: '32' }),
  phone: css({ pt: '8', pb: '16', px: '16' }),
} as const satisfies Record<Viewport, string>
const tabs = { wide: css({ pt: '32' }), phone: css({ pt: '12' }) }

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
  // The panels are the Overview tab's content, so its tab controls them; the tabs' 12 gap and the panels' own
  // top (12, or 6 on a phone) keep them 24 (18) under the tabs.
  const overview =
    data.overview !== undefined ? (
      <OverviewPanels
        overview={data.overview}
        words={words}
        layout={layout}
        groupsOpen={ui.groupsOpen ?? {}}
        onGroupOpen={(group, open) => onUiChange?.({ groupsOpen: { ...ui.groupsOpen, [group]: open } })}
      />
    ) : null
  const ideas = data.ideas === undefined ? null : <IdeasList ideas={data.ideas} words={words} layout={layout} />
  return (
    <div className={page[layout]}>
      <ProjectHeader project={project} words={words} layout={layout} onBack={onBack} onQuickChat={onQuickChat} />
      <div className={layout === 'phone' ? tabs.phone : tabs.wide} data-figma="project tabs">
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
            { value: 'overview', label: words.overview, icon: <GridIcon />, content: overview },
            { value: 'ideas', label: words.ideas, icon: <BulbIcon />, content: ideas },
          ]}
        />
      </div>
    </div>
  )
}
