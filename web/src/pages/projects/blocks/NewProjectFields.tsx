// New project's fields (increment four, R2, R4), in the desktop's dialog and
// the full screen of an iPad or a phone: Name with its folder line (or why
// the name cannot be made), "Picture or icon" with the tile the card will
// draw and Choose picture, which opens a grid of the library's project icons
// (a second press on the picked one goes back to the letter), and
// Description. No frame draws it yet. Props only.
import { type ProjectIconName, projectIconNames } from '@bridge/contract'
import { Button, Grid, Stack, TextField } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import { projectIcons, ProjectTile } from './ProjectTile.tsx'

export const newProjectWords = {
  title: 'New project',
  back: 'Projects',
  backLabel: 'Back to Projects',
  cancel: 'Cancel',
  create: 'Create project',
  name: 'Name',
  picture: 'Picture or icon',
  choose: 'Choose picture',
  icons: 'Project icons',
  description: 'Description',
} as const

// TextField's `label` label style: Medium 14 in `fg.default`, 6 over the control.
const label = css({ textStyle: 'label', color: 'fg.default' })
const pictureRow = css({ display: 'flex', alignItems: 'center', gap: '16' })
const missLine = css({ textStyle: 'small', color: 'fg.muted' })
const field = { size: 'form', padding: 'form', labelStyle: 'label' } as const

/** What the form holds; `icon` null draws the name's first letter, as a card does. */
export type NewProjectDraft = { name: string; purpose: string; icon: ProjectIconName | null }

export type NewProjectFieldsProps = {
  draft: NewProjectDraft
  /** The line under Name: "Folder: <slug>" when `free`, else the reason, as the field's error. */
  folder?: { readonly line: string; readonly free: boolean } | undefined
  /** The icon grid shows. */
  picking: boolean
  /** The last create's miss, such as "Not created — the brain is busy; try again in a moment". */
  line?: string | undefined
  onChange: (change: Partial<NewProjectDraft>) => void
  onPickingChange: (picking: boolean) => void
}

export function NewProjectFields({ draft, folder, picking, line, onChange, onPickingChange }: NewProjectFieldsProps) {
  const words = newProjectWords
  return (
    <Stack gap="16">
      <TextField
        {...field}
        label={words.name}
        value={draft.name}
        onValueChange={(name) => {
          onChange({ name })
        }}
        {...(folder === undefined ? {} : folder.free ? { helperText: folder.line } : { error: folder.line })}
      />
      <Stack gap="6">
        <span className={label}>{words.picture}</span>
        <div className={pictureRow}>
          <ProjectTile name={draft.name} icon={draft.icon} size="picture" />
          <Button
            pressed={picking}
            onClick={() => {
              onPickingChange(!picking)
            }}
          >
            {words.choose}
          </Button>
        </div>
        {picking ? (
          <Grid columns="6" gap="8" role="group" aria-label={words.icons}>
            {projectIconNames.map((name) => {
              const Icon = projectIcons[name]
              return (
                <Button
                  key={name}
                  aria-label={name}
                  pressed={draft.icon === name}
                  onClick={() => {
                    onChange({ icon: draft.icon === name ? null : name })
                  }}
                >
                  <Icon />
                </Button>
              )
            })}
          </Grid>
        ) : null}
      </Stack>
      <TextField
        {...field}
        label={words.description}
        value={draft.purpose}
        onValueChange={(purpose) => {
          onChange({ purpose })
        }}
      />
      {line === undefined ? null : (
        <p role="status" className={missLine}>
          {line}
        </p>
      )}
    </Stack>
  )
}
