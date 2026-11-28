// A project's page in the shell's detail (D01, T01, T01b, M01; R4): its
// header and its tabs, Overview, Repositories, Architecture, QA and Ideas
// (d-133). The Overview shows the Inbox and Queue panels (R5, R6), the
// Repositories tab each repository and the Architecture tab its scopes
// (increment two), the QA tab the items that wait for the
// owner's check (increment three) and the Ideas tab the idea records (R10);
// an open idea's page shows in place of the tabs (R11).
// The Overview's other panels are later issues'. Props only.
import { BulbIcon, FolderIcon, GridIcon, ItemTabs, LinksIcon, PlayIcon } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import { ArchitectureView } from '../blocks/ArchitectureView.tsx'
import { IdeasList } from '../blocks/IdeasList.tsx'
import { IdeaView } from '../blocks/IdeaView.tsx'
import { OverviewPanels } from '../blocks/OverviewPanels.tsx'
import { QaList } from '../blocks/QaList.tsx'
import { RepositoriesList } from '../blocks/RepositoriesList.tsx'
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
// On the phone the tab row runs to the screen's right edge, as M01 draws it, so a scrolled tab is cut there and not
// at the page's side.
const tabs = { wide: css({ pt: '32' }), phone: css({ pt: '12', '& [role=tablist]': { mr: '-16' } }) }

export type ProjectDetailProps = {
  project: ProjectCard
  data: ProjectsData
  ui: ProjectsUi
  layout: Viewport
  onUiChange?: ((change: Partial<ProjectsUi>) => void) | undefined
  onBack?: (() => void) | undefined
  onQuickChat?: (() => void) | undefined
  onRunDrift?: (() => void) | undefined
  onChatOpen?: ((id: string) => void) | undefined
  /** Opens an idea's page (R11), and goes back from it to the Ideas tab. */
  onIdeaOpen?: ((id: string) => void) | undefined
  onIdeaBack?: (() => void) | undefined
  onIdeaChat?: (() => void) | undefined
  /** Opens the Architecture tab on a repository (a repository card's Architecture). */
  onArchitecture?: ((repo: string) => void) | undefined
}

export function ProjectDetail(props: ProjectDetailProps) {
  const {
    project,
    data,
    ui,
    layout,
    onUiChange,
    onBack,
    onQuickChat,
    onRunDrift,
    onChatOpen,
    onIdeaOpen,
    onIdeaBack,
    onIdeaChat,
    onArchitecture,
  } = props
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
        onRunDrift={onRunDrift}
        onChatOpen={onChatOpen}
      />
    ) : null
  const repositories =
    data.repositories === undefined ? null : (
      <RepositoriesList
        repositories={data.repositories}
        words={words}
        layout={layout}
        onArchitecture={onArchitecture}
      />
    )
  const architecture =
    data.architecture === undefined ? null : (
      <ArchitectureView
        architecture={data.architecture}
        words={words}
        layout={layout}
        onScopeChange={(scope) => onUiChange?.({ scope })}
      />
    )
  const qa = data.qa === undefined ? null : <QaList qa={data.qa} words={words} layout={layout} />
  const ideas =
    data.ideas === undefined ? null : (
      <IdeasList
        ideas={data.ideas}
        words={words}
        layout={layout}
        view={ui.ideasView}
        onViewChange={(ideasView) => onUiChange?.({ ideasView })}
        onOpen={onIdeaOpen}
      />
    )
  if (ui.idea !== undefined && data.idea !== undefined)
    return (
      <div className={page[layout]}>
        <IdeaView idea={data.idea} words={words} chat={ui.ideaChat} onBack={onIdeaBack} onChat={onIdeaChat} />
      </div>
    )
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
            { value: 'repositories', label: words.repositories, icon: <FolderIcon />, content: repositories },
            { value: 'architecture', label: words.architecture, icon: <LinksIcon />, content: architecture },
            { value: 'qa', label: words.qa, icon: <PlayIcon />, content: qa },
            { value: 'ideas', label: words.ideas, icon: <BulbIcon />, content: ideas },
          ]}
        />
      </div>
    </div>
  )
}
