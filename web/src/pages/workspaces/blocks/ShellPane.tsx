// A shell pane's body: the terminal's lines in mono, coloured as git
// colours them, and the prompt with its block cursor (D1 105:337), drawn by
// the library's `TerminalLines`. The lines scroll in a `ScrollFrame` body,
// which takes the keyboard focus, as a shell does (d-107). Props only.
import { ScrollFrame, TerminalLines } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { ShellLine } from '../types.ts'

// The pane's body is a flex column; the terminal fills it.
const fill = css({ display: 'flex', flexDirection: 'column', flex: '1', minH: '[0]' })

export type ShellPaneProps = {
  /** Names the terminal for assistive technology, such as the pane's title. */
  label: string
  lines: readonly ShellLine[]
  prompt: string
  /** The Figma layer of the terminal, for the fidelity checks; D1's when not set. */
  figma?: string | undefined
}

export function ShellPane({ label, lines, prompt, figma = '105:337' }: ShellPaneProps) {
  return (
    <div className={fill} data-figma={figma}>
      <ScrollFrame>
        <TerminalLines label={label} lines={lines} prompt={prompt} />
      </ScrollFrame>
    </div>
  )
}
