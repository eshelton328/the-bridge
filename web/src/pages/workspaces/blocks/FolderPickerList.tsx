// The folder picker's content (D4 128:330, M8 128:736): its title and Close,
// a note, the search, the recent folders (those the chat has are marked
// added; the chosen one has the cyan border) and the folders of one path,
// each opening its own. The side panel beside the chat (D4, FolderPickerPane)
// and the folders sheet of the phone (M8) and the tablet (T5, PhoneFolders) draw it, each with its own
// buttons under it. The library has no folder picker (LIBRARY_GAPS.md:
// Folder picker). Props only.
import {
  Button,
  ChevronRightIcon,
  CloseIcon,
  FolderIcon,
  Inline,
  SearchField,
  SearchIcon,
  Stack,
} from '@eshelton328/component-library-1701'
import { css, cx } from '../../../../styled-system/css/index.js'
import type { FolderPicker } from '../types.ts'

// D4's Figma layers of the search, the recent and the listed folders, in order.
const d4: FolderPickerLayers = {
  search: '128:342',
  recent: ['128:349', '128:355', '128:361'],
  browse: ['128:367', '128:374', '128:381', '128:388'],
}

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
// Figma draws a listed folder's chevron grey (#8A97B8, fg.muted: D4 128:372, T5 128:610), under the row's fg.default.
const chevron = css({ display: 'inline-flex', color: 'fg.muted' })

/** The Figma layers of the picker's parts, for the fidelity checks; a part with no layer has none. */
type FolderPickerLayers = {
  /** The title row (M8 128:736). */
  title?: string | undefined
  search: string
  recent: readonly string[]
  browse: readonly string[]
}

export type FolderPickerListProps = {
  picker: FolderPicker
  /** The chosen folder, by path. */
  picked: string | null
  onPick?: ((path: string) => void) | undefined
  onClose?: (() => void) | undefined
  /** D4's when not set. */
  layers?: FolderPickerLayers | undefined
  /**
   * `side` (the default): the side panel's spacing (D4); `sheet`: the phone's folders sheet, whose parts and rows are
   * all 8 apart (M8 128:747 to 128:793), and the chosen folder's icon is in the accent colour (128:767); `tabletSheet`:
   * the tablet's folders sheet, the same with every part and row 10 apart (T5 128:569 to 128:626).
   */
  size?: 'side' | 'sheet' | 'tabletSheet' | undefined
}

export function FolderPickerList(props: FolderPickerListProps) {
  const { picker, picked, onPick, onClose, layers = d4, size = 'side' } = props
  const sheet = size !== 'side'
  const tablet = size === 'tabletSheet'
  return (
    <>
      <Inline gap="8" align="center" data-figma={layers.title}>
        <span className={icon}>
          <FolderIcon size="16" />
        </span>
        <h2 className={heading}>{picker.title}</h2>
        <Button variant="text" size="xs" iconOnly className={close} aria-label={picker.closeLabel} onClick={onClose}>
          <CloseIcon size="16" />
        </Button>
      </Inline>
      <p className={note}>{picker.note}</p>
      <div data-figma={layers.search}>
        <SearchField
          size="lg"
          label={picker.searchLabel}
          defaultValue={picker.query}
          icon={<SearchIcon size="16" />}
          clearIcon={<CloseIcon size="12" />}
        />
      </div>
      <Stack gap={tablet ? '10' : sheet ? '8' : '12'}>
        <Stack gap={tablet ? '10' : sheet ? '8' : '10'}>
          <span className={label}>{picker.recentLabel}</span>
          {picker.recent.map((f, i) => (
            <Button
              key={f.path}
              variant={f.path === picked ? 'secondary' : 'text'}
              pressed={f.path === picked}
              // M8 128:766: the sheet's chosen recent folder draws #5ee1ff at 0.5 (border.selected), not border.active.
              pressedBorder={sheet ? 'selected' : undefined}
              className={cx(row, plain)}
              data-figma={layers.recent[i]}
              onClick={() => onPick?.(f.path)}
            >
              {sheet && f.path === picked ? (
                <span className={icon}>
                  <FolderIcon size="16" />
                </span>
              ) : (
                <FolderIcon size="16" />
              )}
              <span className={path}>{f.path}</span>
              {f.added ? <span className={subtle}>{picker.addedLabel}</span> : null}
            </Button>
          ))}
        </Stack>
        <Stack gap={tablet ? '10' : '8'}>
          <Inline gap="8" align="center">
            <span className={label}>{picker.browseLabel}</span> <span className={subtle}>{picker.browsePath}</span>
          </Inline>
          {picker.browse.map((folder, i) => (
            <Button
              key={folder}
              variant="text"
              keepIconSize
              className={cx(row, plain)}
              aria-label={picker.openLabel.replace('{folder}', folder)}
              data-figma={layers.browse[i]}
            >
              <FolderIcon size="16" />
              <span className={name}>{folder}</span>
              <span className={chevron}>
                <ChevronRightIcon size="12" />
              </span>
            </Button>
          ))}
        </Stack>
      </Stack>
    </>
  )
}
