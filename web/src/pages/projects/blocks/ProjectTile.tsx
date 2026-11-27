// The picture at the top of a project card (D10, T10, T10b, M10): the
// project's library icon when the owner set one the library has, else the
// first letter of its name in capitals, centred on the card's well. The
// library has no project tile, and no token has the frames' 40 px letter or
// the tile's height, so the tile pads with spacing tokens and draws the
// letter in `heading` (LIBRARY_GAPS.md). Props only.
import {
  BookIcon,
  BrainIcon,
  BranchIcon,
  ChartIcon,
  CodeIcon,
  CompassIcon,
  FolderIcon,
  type IconProps,
  InboxIcon,
  MapIcon,
  ProjectsIcon,
  SparkIcon,
  TerminalIcon,
  ToolkitIcon,
  WorkspacesIcon,
} from '@eshelton328/component-library-1701'
import type { ComponentType } from 'react'
import { css } from '../../../../styled-system/css/index.js'

/** The library icons a project can name in `project.yaml`, by their kebab-case name. */
const projectIcons: Readonly<Record<string, ComponentType<IconProps>>> = {
  book: BookIcon,
  brain: BrainIcon,
  branch: BranchIcon,
  chart: ChartIcon,
  code: CodeIcon,
  compass: CompassIcon,
  folder: FolderIcon,
  inbox: InboxIcon,
  map: MapIcon,
  projects: ProjectsIcon,
  spark: SparkIcon,
  terminal: TerminalIcon,
  toolkit: ToolkitIcon,
  workspaces: WorkspacesIcon,
}

const tileStyle = css.raw({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  py: '40',
  bg: 'surface.well',
  color: 'fg.muted',
  textStyle: 'heading',
})
// M10's tile is shorter than D10's.
const tile = { wide: css(tileStyle), phone: css(tileStyle, { py: '32' }) }

export type ProjectTileProps = {
  name: string
  icon: string | null
  /** The phone's tile is shorter (M10). */
  phone?: boolean | undefined
}

/** The first letter of `name`, in capitals: "omni" draws O. */
const tileLetter = (name: string) => (name.at(0) ?? '').toUpperCase()

export function ProjectTile({ name, icon, phone = false }: ProjectTileProps) {
  const Icon = icon !== null && Object.hasOwn(projectIcons, icon) ? projectIcons[icon] : undefined
  return (
    <div className={phone ? tile.phone : tile.wide} data-figma={`project tile · ${name}`} aria-hidden="true">
      {Icon === undefined ? tileLetter(name) : <Icon size="24" />}
    </div>
  )
}
