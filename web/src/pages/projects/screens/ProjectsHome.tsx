// The Projects home's content (D10, T10, T10b, M10): the header with the
// title, the count and New project, then one card per project in a grid, the
// pinned ones first (R2, R3). The grid has four columns on the desktop, two on
// a tablet and one on a phone; the library has no grid by width, so T10b's
// three columns at 1133 px are two (LIBRARY_GAPS.md). New project is drawn as
// the frames draw it and has no action until increment four (d-133). Props
// only; the open menu and a pin go out through the callbacks.
import { Button, Grid, PageHeader, Stack } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import { ProjectCardView } from '../blocks/ProjectCardView.tsx'
import type { ProjectsData, ProjectsUi } from '../types.ts'

// D10: the header 24 under the top and 40 in from the rail and the edge (Figma 36), so each of the four cards is
// Figma's 327 wide; the cards 24 under the header. T10 starts the header 40 down, and T10b, the iPad in landscape,
// 24 down, as D10 does; M10 starts lower and closer to the sides.
const page = {
  desktop: css({ pt: '24', pb: '32', px: '40' }),
  tablet: css({ pt: { base: '40', _landscape: '24' }, pb: '32', px: '32' }),
  phone: css({ pt: '40', pb: '16', px: '16' }),
}
const columns = { desktop: '4', tablet: '2', phone: '1' } as const satisfies Record<Viewport, string>
const gap = { desktop: '20', tablet: '20', phone: '12' } as const satisfies Record<Viewport, string>
// The header to the cards: D10 24, T10 20, M10 12 (Figma 14 from New project's bottom).
const stackGap = { desktop: '24', tablet: '20', phone: '12' } as const satisfies Record<Viewport, string>
const srOnly = css({ srOnly: true })

export type ProjectsHomeProps = {
  data: ProjectsData
  ui: ProjectsUi
  layout: Viewport
  onUiChange?: ((change: Partial<ProjectsUi>) => void) | undefined
  onPin?: ((slug: string, pinned: boolean) => void) | undefined
}

export function ProjectsHome({ data, ui, layout, onUiChange, onPin }: ProjectsHomeProps) {
  const count = data.projects.length
  return (
    <Stack gap={stackGap[layout]} className={page[layout]}>
      <div data-figma="header">
        <PageHeader
          title={data.title}
          count={count}
          countLabel={`${String(count)} projects`}
          size={layout === 'phone' ? 'phone' : 'page'}
        >
          <span data-figma="button · New project">
            <Button variant="primary" size={layout === 'desktop' ? 'md' : 'lg'}>
              {data.newProject}
            </Button>
          </span>
        </PageHeader>
      </div>
      <h2 className={srOnly}>{data.cardsHeading}</h2>
      <Grid columns={columns[layout]} gap={gap[layout]} data-figma="project cards">
        {data.projects.map((project) => (
          <ProjectCardView
            key={project.slug}
            project={project}
            words={data.menu}
            layout={layout}
            menuOpen={ui.menuFor === project.slug}
            onMenuOpenChange={(open) => {
              onUiChange?.({ menuFor: open ? project.slug : undefined })
            }}
            onPin={(slug, pinned) => {
              onUiChange?.({ menuFor: undefined })
              onPin?.(slug, pinned)
            }}
          />
        ))}
      </Grid>
    </Stack>
  )
}
