// A live tool call's row (R32): its kind's icon, its readable title and, when
// the call has one, its own one-line label in a quieter colour, on one line
// that ends with an ellipsis. It keeps the look Figma draws for a tool line
// (D01 105:214, M12 147:373): mono, `fg.muted`, the parts 6 apart, and the
// icon takes the dot's place and colour, so a call that still runs draws its
// icon in the running colour and names it "Running" as the dot does. The raw
// tool name, such as Bash, is the icon's title. The library's `ToolLine` has
// no icon and draws its name and target as one text (LIBRARY_GAPS.md: Tool
// row icon and label). Props only.
import type { ToolKind } from '@bridge/contract'
import {
  AgentIcon,
  ChatIcon,
  EditIcon,
  FileIcon,
  LinkIcon,
  ListIcon,
  SearchIcon,
  TerminalIcon,
  ToolkitIcon,
  TruncatedText,
  type IconProps,
} from '@eshelton328/component-library-1701'
import { memo, type ComponentType } from 'react'
import { css, cx } from '../../../../styled-system/css/index.js'

// Each kind's library icon. The library has no globe for the web and no plug for an MCP tool (LIBRARY_GAPS.md: Tool
// row icon and label), so the web draws a link and an MCP tool the wrench of any other tool.
const icons: Record<ToolKind, ComponentType<IconProps>> = {
  shell: TerminalIcon,
  read: FileIcon,
  edit: EditIcon,
  search: SearchIcon,
  web: LinkIcon,
  agent: AgentIcon,
  message: ChatIcon,
  plan: ListIcon,
  mcp: ToolkitIcon,
  other: ToolkitIcon,
}

const row = css({
  display: 'flex',
  alignItems: 'center',
  gap: '6',
  minW: '[0]',
  maxW: '[100%]',
  textStyle: 'mono',
  color: 'fg.muted',
})
const mark = css({ display: 'inline-flex', flexShrink: '0' })
const running = css({ color: 'status.working.fg' })
// The title keeps its width and gives way only when it alone is wider than the row; the label takes the rest.
const title = css({ flex: '[0 1 auto]', minW: '[0]' })
const label = css({ flex: '[1 1 0]', minW: '[0]', color: 'fg.subtle' })

export type ToolRowProps = {
  kind: ToolKind
  /** The readable title, such as "Ran a command". */
  title: string
  /** The call's own one-line description; '' draws none. */
  label: string
  /** The raw tool name, such as "Bash": the icon's title. */
  name: string
  running?: boolean | undefined
}

export const ToolRow = memo(function ToolRow({ kind, title: text, label: note, name, running: busy }: ToolRowProps) {
  const Icon = icons[kind]
  return (
    <div className={row} data-tool-kind={kind}>
      <span
        className={cx(mark, busy === true ? running : undefined)}
        role="img"
        aria-label={busy === true ? 'Running' : 'Done'}
        title={name}
      >
        <Icon size="12" />
      </span>
      <span className={title}>
        <TruncatedText>{text}</TruncatedText>
      </span>
      {note === '' ? null : (
        <span className={label}>
          <TruncatedText>{note}</TruncatedText>
        </span>
      )}
    </div>
  )
})
