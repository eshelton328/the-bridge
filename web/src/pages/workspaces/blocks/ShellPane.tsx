// A shell pane's body: the terminal's lines in mono, coloured as git
// colours them, and the prompt (D1 105:337). The library has no terminal
// part (LIBRARY_GAPS.md), so the lines are mono text in status colours.
// Props only.
import { Stack } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { ShellLine } from '../types.ts'

const body = css({ flex: '1', p: '12', textStyle: 'mono', whiteSpace: 'pre' })
const tones = {
  plain: css({ color: 'fg.default' }),
  modified: css({ color: 'status.needsYou.fg' }),
  deleted: css({ color: 'status.danger.fg' }),
  untracked: css({ color: 'status.done.fg' }),
} satisfies Record<ShellLine['tone'], string>

export type ShellPaneProps = {
  /** Names the terminal for assistive technology, such as the pane's title. */
  label: string
  lines: readonly ShellLine[]
  prompt: string
}

export function ShellPane({ label, lines, prompt }: ShellPaneProps) {
  return (
    // The terminal takes the focus, as a shell does, so a short pane that scrolls it can reach it by keyboard.
    <Stack gap="4" className={body} data-figma="105:337" role="log" aria-label={label} tabIndex={0}>
      {lines.map((line) => (
        <span key={line.text} className={tones[line.tone]}>
          {line.text}
        </span>
      ))}
      <span className={tones.plain}>{prompt}</span>
    </Stack>
  )
}
