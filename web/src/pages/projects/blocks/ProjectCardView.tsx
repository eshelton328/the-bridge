// One project of the Projects home (D10, T10, T10b, M10): its tile with the
// ⋯ button in the tile's top end corner, the name with the pin after a pinned
// one, and the purpose. The ⋯ button opens the card's menu: Pin to top (Unpin
// on a pinned card), which goes out through `onPin`, and Edit details, which
// the frames draw and increment four builds (d-133), so it does nothing yet.
// A click on the card opens its project's page through `onOpen` (R4). Props only.
import { Badge, Button, Card, Clamp, Menu, MoreIcon } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { Viewport } from '../../../lib/screenState.ts'
import type { ProjectCard, ProjectMenuWords } from '../types.ts'
import { ProjectTile } from './ProjectTile.tsx'

// The ⋯ button sits 8 in from the tile's top and end (D10: 388, 89 on a card at 100, 80).
const media = css({ position: 'relative' })
// One grid cell, so the card fills its row's height: the cards of a row end together, as the frames draw them.
const cell = css({ display: 'grid' })
// The ⋯ button lifts over the card's own button, which covers the card once it opens the project (as
// LibraryCard lifts its alert), so the menu takes its own click.
const corner = css({ position: 'absolute', top: '8', right: '8', zIndex: '1' })
// The purpose in the frames' 13/20 text. Card's description shows one line at Small, or two, and D10 shows the
// whole purpose, so it goes in the meta row until the library's Card has it (LIBRARY_GAPS.md).
const purpose = css({ flex: '1', minW: '[0]', textStyle: 'bodySm', color: 'fg.muted' })

export type ProjectCardViewProps = {
  project: ProjectCard
  words: ProjectMenuWords
  /** The layout: the phone's card has a shorter tile and two lines of purpose (M10), and a tablet's or phone's ⋯ is 44 px (T10, M10). */
  layout: Viewport
  menuOpen: boolean
  onMenuOpenChange?: ((open: boolean) => void) | undefined
  /** Pin to top or Unpin was picked: the pin the card should have now. */
  onPin?: ((slug: string, pinned: boolean) => void) | undefined
  /** The card was clicked: open its project's page. Without it the card is not a button. */
  onOpen?: ((slug: string) => void) | undefined
}

export function ProjectCardView({
  project,
  words,
  layout,
  menuOpen,
  onMenuOpenChange,
  onPin,
  onOpen,
}: ProjectCardViewProps) {
  const phone = layout === 'phone'
  const label = words.label.replace('{name}', project.name)
  return (
    <div className={cell} data-figma={`project card · ${project.name}`}>
      <Card
        title={project.name}
        onSelect={
          onOpen === undefined
            ? undefined
            : () => {
                onOpen(project.slug)
              }
        }
        media={
          <div className={media}>
            <ProjectTile name={project.name} icon={project.icon} size={phone ? 'phone' : 'wide'} />
            <div className={corner} data-figma={`project menu · ${project.name}`}>
              <Menu
                trigger={
                  <Button variant="secondary" size={layout === 'desktop' ? 'md' : 'xl'} iconOnly aria-label={label}>
                    <MoreIcon />
                  </Button>
                }
                placement="bottom-end"
                open={menuOpen}
                onOpenChange={onMenuOpenChange}
                items={[
                  { value: 'pin', label: project.pinned ? words.unpin : words.pin },
                  { value: 'edit', label: words.edit },
                ]}
                onSelect={(value) => {
                  if (value === 'pin') onPin?.(project.slug, !project.pinned)
                }}
              />
            </div>
          </div>
        }
        // The pin after a pinned name (D10 NCC-1701); the library has no pin icon yet (LIBRARY_GAPS.md). The 16 px
        // pill fits inside the name's line, so a pinned card's name and purpose sit level with the others' (T10b).
        badge={project.pinned ? <Badge variant="pill" size="xs" label="Pinned" /> : undefined}
        meta={
          // M10 cuts the purpose at two lines; the desktop and the tablet show it whole. A div, not a p: the phone's
          // Clamp is a div, which a p may not hold (NCC-146).
          <div className={purpose}>{phone ? <Clamp lines={2}>{project.purpose}</Clamp> : project.purpose}</div>
        }
      />
    </div>
  )
}
