// The title block of an open artifact (Figma "title block", D2 403:464):
// the title, the description and three chips: the source, the project it
// is filed in and when it was updated. With `projectMenu` the project chip
// is a button with a chevron (D2 403:472) that opens the project menu, a
// `RadioMenu` of Not in a project and the projects. On a phone (M2
// 406:370) the rows are 8 apart and the chips are the source and the
// project only; with `onProjectPress` the project chip is the same button
// (406:381), which opens File in a project as a sheet (M7). Props only.
import {
  FolderIcon,
  Inline,
  KindMark,
  MetaChip,
  MetaChipButton,
  RadioMenu,
  RefreshIcon,
  Stack,
} from '@eshelton328/component-library-1701'
import type { ReactNode } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import { type ArtifactDetail, type ArtifactFileMenu, noProject } from '../types.ts'

// The desktop title (D2 403:465, D7, D8, D9) is SemiBold 26 in a 34 px box: `headingSm` (26/36, library beta.71).
// The tablet's (T2 405:433) is Figma's heading, 28/41: `heading` (28/40); the phone keeps `heading` too.
const desktopTitle = css({ textStyle: 'headingSm', color: 'fg.default', m: '0', textWrap: 'wrap' })
const title = css({ textStyle: 'heading', color: 'fg.default', m: '0', textWrap: 'wrap' })
// 403:467: the chips take their own width.
const chips = css({ alignSelf: 'flex-start' })
const description = css({ textStyle: 'body', color: 'fg.muted', m: '0' })

export type ArtifactTitleBlockProps = {
  artifact: Pick<ArtifactDetail, 'title' | 'description' | 'source' | 'sourceLabel' | 'project' | 'updated'>
  /** The status line over the title, as the tablet draws it (T2 405:427); the desktop has it in the artifact bar. */
  status?: ReactNode
  /** `desktop` (the default, D2): the `headingSm` title; `tablet` (T2): the `heading` title; `phone` (M2): the `heading` title, rows 8 apart and no updated chip. */
  layout?: 'desktop' | 'tablet' | 'phone' | undefined
  /** The project menu the project chip opens on a desktop or tablet; without it the chip is text. */
  projectMenu?: ProjectMenu | undefined
  /** The phone's project chip was pressed: File in a project opens (M7); without it the phone's chip is text. */
  onProjectPress?: (() => void) | undefined
}

export type ProjectMenu = {
  menu: ArtifactFileMenu
  /** The checked project, or `none` (Not in a project). */
  value: string
  /** A project was picked, or `none`. */
  onValueChange?: ((project: string) => void) | undefined
}

type ProjectChipProps = {
  project: string
  projectMenu: ProjectMenu | undefined
  /** The phone: the chip is a button that opens the sheet, not the menu. */
  onPress: (() => void) | undefined
}

function ProjectChip({ project, projectMenu, onPress }: ProjectChipProps) {
  if (projectMenu === undefined) return <MetaChip label={project} icon={<FolderIcon />} />
  const { menu, value, onValueChange } = projectMenu
  const label = value === noProject ? menu.none.label : value
  if (onPress !== undefined)
    return (
      <MetaChipButton
        label={label}
        icon={<FolderIcon />}
        aria-label={`${menu.title}: ${label}`}
        aria-haspopup="dialog"
        onClick={onPress}
      />
    )
  return (
    <RadioMenu
      label={menu.title}
      options={[
        { value: noProject, label: menu.none.label },
        ...menu.projects.map((choice) => ({ value: choice.value, label: choice.value })),
      ]}
      value={value}
      onValueChange={onValueChange}
      width="sm"
      trigger={<MetaChipButton label={label} icon={<FolderIcon />} aria-label={`${menu.title}: ${label}`} />}
    />
  )
}

export function ArtifactTitleBlock({
  artifact,
  status,
  layout = 'desktop',
  projectMenu,
  onProjectPress,
}: ArtifactTitleBlockProps) {
  const phone = layout === 'phone'
  return (
    // D2 (403:464: the title at 76, 34 high, the description at 120 and the chips at 150) and T2 (405:426) put their
    // rows 10 apart; M2 8 (406:370).
    <Stack gap={phone ? '8' : '10'} data-figma="title block">
      {status}
      <h2 className={layout === 'desktop' ? desktopTitle : title}>{artifact.title}</h2>
      <p className={description}>{artifact.description}</p>
      <Inline gap="6" align="center" wrap className={chips} data-figma="chips">
        {/* D2 and T2 "chip · Claude artifact", M2 "chip · Claude". */}
        <span data-figma={`chip · ${artifact.sourceLabel}`}>
          <MetaChip label={artifact.sourceLabel} icon={<KindMark kind={artifact.source} size="12" />} />
        </span>
        <span data-figma="project · File in a project">
          <ProjectChip
            project={artifact.project}
            projectMenu={phone && onProjectPress === undefined ? undefined : projectMenu}
            onPress={phone ? onProjectPress : undefined}
          />
        </span>
        {phone ? null : (
          <span data-figma="chip · updated 12m ago">
            <MetaChip label={artifact.updated} icon={<RefreshIcon />} tone="muted" />
          </span>
        )}
      </Inline>
    </Stack>
  )
}
