// The folder picker beside the main chat (D4 128:330): its title and Close,
// a note, the search, the recent folders (those the chat has are marked
// added; the chosen one has the cyan border) and the folders of one path,
// each opening its own, then Cancel and Add. It takes the side slot. The
// library has no folder picker (LIBRARY_GAPS.md: Folder picker). Props only.
import {
  Button,
  ChevronRightIcon,
  CloseIcon,
  FolderIcon,
  Inline,
  PlusIcon,
  SearchField,
  SearchIcon,
  Stack,
} from '@eshelton328/component-library-1701'
import { css, cx } from '../../../../styled-system/css/index.js'
import type { FolderPicker } from '../types.ts'

// D4's Figma layers of the recent and the listed folders, in order.
const recentLayers = ['128:349', '128:355', '128:361']
const browseLayers = ['128:367', '128:374', '128:381', '128:388']

const panel = css({
  display: 'flex',
  flexDirection: 'column',
  gap: '10',
  flex: '1',
  minH: '[0]',
  // D4 128:331: the title row sits 19 from the top; the 24 px close button centres it 16 down.
  pt: '16',
  px: '16',
  pb: '20',
  bg: 'surface.pane',
  borderLeftWidth: 'default',
  borderLeftStyle: 'solid',
  borderLeftColor: 'border.default',
})
const icon = css({ display: 'inline-flex', color: 'accent.default' })
const heading = css({ textStyle: 'paneTitle', color: 'fg.default', m: '0', flex: '1' })
const note = css({ textStyle: 'small', color: 'fg.muted', m: '0' })
const label = css({ textStyle: 'eyebrow', color: 'fg.muted' })
const subtle = css({ textStyle: 'mono', color: 'fg.subtle' })
const row = css({ w: '[100%]', justifyContent: 'flex-start' })
// A text button draws its label in the accent colour; Figma's folder rows are plain text (fg.default).
const plain = css({ color: 'fg.default' })
const path = css({ textStyle: 'mono', color: 'fg.default', flex: '1', textAlign: 'start' })
// The text button's label style is labelLg; Figma's listed folders are Regular 14 (body, D4 128:367).
const name = css({ textStyle: 'body', flex: '1', textAlign: 'start' })
// Figma's Close is the panel's grey (fg.muted, D4 128:338), not the text button's accent.
const close = css({ color: 'fg.muted' })
const rest = css({ flex: '1' })

export type FolderPickerPaneProps = {
  picker: FolderPicker
  /** The chosen folder, by path. */
  picked: string | null
  onPick?: ((path: string) => void) | undefined
  onClose?: (() => void) | undefined
}

export function FolderPickerPane({ picker, picked, onPick, onClose }: FolderPickerPaneProps) {
  return (
    <aside data-figma="128:330" aria-label={picker.title} className={panel}>
      <Inline gap="8" align="center">
        <span className={icon}>
          <FolderIcon size="16" />
        </span>
        <h2 className={heading}>{picker.title}</h2>
        <Button variant="text" size="xs" iconOnly className={close} aria-label={picker.closeLabel} onClick={onClose}>
          <CloseIcon size="16" />
        </Button>
      </Inline>
      <p className={note}>{picker.note}</p>
      <div data-figma="128:342">
        <SearchField
          size="lg"
          label={picker.searchLabel}
          defaultValue={picker.query}
          icon={<SearchIcon size="16" />}
          clearIcon={<CloseIcon size="12" />}
        />
      </div>
      <Stack gap="12">
        <Stack gap="10">
          <span className={label}>{picker.recentLabel}</span>
          {picker.recent.map((f, i) => (
            <Button
              key={f.path}
              variant={f.path === picked ? 'secondary' : 'text'}
              pressed={f.path === picked}
              className={cx(row, plain)}
              data-figma={recentLayers[i]}
              onClick={() => onPick?.(f.path)}
            >
              <FolderIcon size="16" />
              <span className={path}>{f.path}</span>
              {f.added ? <span className={subtle}>{picker.addedLabel}</span> : null}
            </Button>
          ))}
        </Stack>
        <Stack gap="8">
          <Inline gap="8" align="center">
            <span className={label}>{picker.browseLabel}</span> <span className={subtle}>{picker.browsePath}</span>
          </Inline>
          {picker.browse.map((folder, i) => (
            <Button
              key={folder}
              variant="text"
              className={cx(row, plain)}
              aria-label={picker.openLabel.replace('{folder}', folder)}
              data-figma={browseLayers[i]}
            >
              <FolderIcon size="16" />
              <span className={name}>{folder}</span>
              <ChevronRightIcon size="12" />
            </Button>
          ))}
        </Stack>
      </Stack>
      <div className={rest} />
      <Inline gap="8" align="center" justify="end">
        <Button size="sm" textSize="sm" data-figma="128:398">
          {picker.cancel}
        </Button>
        <Button size="sm" textSize="smStrong" variant="primary" data-figma="128:400">
          <PlusIcon size="12" />
          {picker.add.replace('{folder}', picked ?? '')}
        </Button>
      </Inline>
    </aside>
  )
}
