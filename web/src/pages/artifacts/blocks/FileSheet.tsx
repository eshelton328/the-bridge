// File in a project on a phone (M7 407:1094): the artifact page's ⋯ button
// opens it as a sheet from the bottom that covers the tab bar, as the
// library's sheets do (M3, M4, M6). Done ends the title row; under it the
// artifact's title, a choice per project with how many artifacts it holds,
// the artifact's own project checked, then under a rule Remove from the
// library and what it does: Remove takes only the link out of the library.
// Picking a project checks it; Done, the scrim and Escape close the sheet.
// Props only.
import {
  BottomSheet,
  BottomSheetClose,
  Button,
  FolderIcon,
  OptionList,
  Stack,
  TrashIcon,
} from '@eshelton328/component-library-1701'
import { useRef } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import { type ArtifactFileMenu, noProject } from '../types.ts'

// M7 407:1060, 407:1092: the artifact's title and the note sit at the sheet's inset, in the description's grey.
const muted = css({ textStyle: 'small', color: 'fg.muted' })
// M7 407:1066: each count in mono at the end of its row.
const count = css({ textStyle: 'mono', color: 'fg.muted' })
// M7 407:1062, 407:1080: each folder is grey, the checked project's cyan, as its check.
const folder = css({ display: 'inline-flex', color: 'fg.muted' })
const checkedFolder = css({ display: 'inline-flex', color: 'fg.accent' })
// M7 407:1087: a 1 px rule between the projects and Remove.
const rule = css({ borderTopWidth: 'default', borderTopStyle: 'solid', borderTopColor: 'border.default' })
// M7 407:1088: Remove is a 44 px row the sheet's width, its trash and label at the start, 12 in, as the choices' text.
const remove = css({ w: '[100%]', justifyContent: 'flex-start', px: '12' })
// M7 407:1101: the body runs 8 past the note (801 to 809), as the Sort sheet's.
const body = css({ pb: '8' })
// M3 407:405, M6 408:707 and 408:711, M7 407:1100: Figma lines a header text button's label up with the sheet's
// content edge (17 from the screen's side). A `text` Button pads its label 8 inside a 1 px border, so the button
// reaches 8 past the header's edge on that side and its label sits 1 px inside Figma's.
const headerEnd = css({ me: '-8' })

export type FileSheetProps = {
  menu: ArtifactFileMenu
  /** The artifact's title, under the sheet's title. */
  artifactTitle: string
  /** The checked project, or `none`. */
  project: string
  open: boolean
  onOpenChange?: ((open: boolean) => void) | undefined
  /** A project was picked, or `none`. */
  onProjectChange?: ((project: string) => void) | undefined
  /** Remove from the library was pressed. */
  onRemove?: (() => void) | undefined
  /** The line of the last pick or Remove that missed (the live library), under the note; the sheet hides the page's. */
  notice?: string | undefined
}

export function FileSheet({
  menu,
  artifactTitle,
  project,
  open,
  onOpenChange,
  onProjectChange,
  onRemove,
  notice,
}: FileSheetProps) {
  // The sheet opens with the focus on the sheet itself: Figma draws no focus ring on a choice (M7 407:1079).
  const titleRef = useRef<HTMLSpanElement>(null)
  return (
    <BottomSheet
      title={menu.title}
      open={open}
      onOpenChange={onOpenChange}
      initialFocus={() => titleRef.current?.closest<HTMLElement>('[role="dialog"]') ?? null}
      actions={
        // M7 407:1100: Done is a cyan text button at the end of the title row.
        <BottomSheetClose>
          <Button variant="text" size="sm" className={headerEnd}>
            {menu.done}
          </Button>
        </BottomSheetClose>
      }
    >
      {/* M7 407:1101: the title, the choices, the rule, Remove and the note, each 2 apart. */}
      <Stack gap="2" className={body} data-figma="sheet body">
        <span className={muted} data-figma="artifact name" ref={titleRef}>
          {artifactTitle}
        </span>
        <OptionList
          label={menu.title}
          value={project}
          selectedFill
          // A click, a tap, Enter, Space or an arrow key picks a project; `onItemSelect` misses the arrow keys.
          onValueChange={(value) => {
            onProjectChange?.(value)
          }}
          items={[
            {
              value: noProject,
              label: menu.none.label,
              trailing: <span className={count}>{menu.none.count}</span>,
            },
            ...menu.projects.map((p) => ({
              value: p.value,
              label: p.value,
              leading: (
                <span className={p.value === project ? checkedFolder : folder}>
                  <FolderIcon size="16" />
                </span>
              ),
              trailing: <span className={count}>{p.count}</span>,
            })),
          ]}
        />
        <div className={rule} data-figma="divider" />
        <span data-figma="button · Remove from the library">
          <Button variant="dangerText" size="xl" className={remove} onClick={onRemove}>
            <TrashIcon />
            {menu.remove}
          </Button>
        </span>
        <span className={muted} data-figma="remove note">
          {menu.note}
        </span>
        {notice === undefined ? null : (
          <span className={muted} role="status">
            {notice}
          </span>
        )}
      </Stack>
    </BottomSheet>
  )
}
