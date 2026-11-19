// A shell pane's body: the terminal's lines in mono, coloured as git
// colours them, and the prompt with its block cursor (D1 105:337), drawn by
// the library's `TerminalLines`. The lines scroll in a `ScrollFrame` body,
// which takes the keyboard focus, as a shell does (d-107). A live shell
// shows "Terminal not live yet" in place of its lines (`notLive`, d-117).
// Props only.
import { ScrollFrame, TerminalLines } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import { BlockBoundary } from '../../../errors/BlockBoundary.tsx'
import type { ShellLine } from '../types.ts'
import { NotLive } from './NotLive.tsx'

// The pane's body is a flex column; the terminal fills it.
const fill = css({ display: 'flex', flexDirection: 'column', flex: '1', minH: '[0]' })

export type ShellPaneProps = {
  /** The pane's id; a new id resets the terminal's boundary. */
  paneId: string
  /** Names the terminal for assistive technology, such as the pane's title. */
  label: string
  lines: readonly ShellLine[]
  prompt: string
  /** A live shell's text in place of its terminal, such as "Terminal not live yet" (d-117); `lines` when not set. */
  notLive?: string | undefined
  /** The Figma layer of the terminal, for the fidelity checks; D1's when not set. */
  figma?: string | undefined
}

export function ShellPane({ paneId, label, lines, prompt, notLive, figma = '105:337' }: ShellPaneProps) {
  return (
    <div className={fill} data-figma={figma}>
      <ScrollFrame>
        {notLive === undefined ? (
          <BlockBoundary contentKey={paneId}>
            <TerminalLines label={label} lines={lines} prompt={prompt} />
          </BlockBoundary>
        ) : (
          <NotLive text={notLive} />
        )}
      </ScrollFrame>
    </div>
  )
}
