// A toolkit file rendered read-only (Figma `file preview`, D3 427:273): a
// bar with the file's name and Read-only, over the file's blocks in the
// library's MarkdownView (`ToolkitMarkdownBlocks`). A file shown as code (a hook's script, D9 433:1572) shows the code
// icon in the bar and its lines with their numbers in the library's
// CodeLines; on the phone (M22 487:2231) a long line wraps under itself.
// Props only.
import { CodeIcon, CodeLines, FileIcon, LockIcon, ScrollFrame } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { ToolkitItemDetailView, ToolkitMarkdownBlock } from '../types.ts'
import { ToolkitMarkdownBlocks } from './ToolkitMarkdownBlocks.tsx'

type Code = NonNullable<ToolkitItemDetailView['preview']['code']>

// D3 427:273: a bordered box with a bar (427:274, 37 high) over the rendered file. The library has no file preview
// frame (LIBRARY_GAPS.md, File preview), so the box and the bar are drawn here with the Panel's tokens.
const box = css({
  display: 'flex',
  flexDirection: 'column',
  minW: '[0]',
  bg: 'surface.pane',
  borderWidth: 'default',
  borderStyle: 'solid',
  borderColor: 'border.default',
  borderRadius: 'xl',
  overflow: 'hidden',
})
// D3 427:274: the file icon 14 in, the name 8 after it in mono, and Read-only with its lock at the end.
const bar = css({
  display: 'flex',
  alignItems: 'center',
  gap: '8',
  px: '12',
  py: '10',
  borderBottomWidth: 'default',
  borderBottomStyle: 'solid',
  borderBottomColor: 'border.default',
  color: 'fg.muted',
})
// M20 487:1650: the bar is one line; on the phone the name and its meta keep their width, and Read-only runs past
// the box's edge, where the box cuts it (487:1660 starts at 390, past the 378 px box).
const name = css({ textStyle: 'mono', color: 'fg.default', whiteSpace: 'nowrap', flexShrink: '0' })
// D7 433:567: text after the name, such as the file's length and what it is, in mono.
const fileMeta = css({ textStyle: 'mono', color: 'fg.muted', whiteSpace: 'nowrap', flexShrink: '0' })
const readOnly = css({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8',
  ms: 'auto',
  textStyle: 'small',
  whiteSpace: 'nowrap',
  flexShrink: '0',
})
// D9 433:1583: a line longer than the box runs past its edge (line 4, 433:1595). The code keeps its full width, so
// CodeLines itself does not scroll (its scroller takes no keyboard focus); the ScrollFrame body around it scrolls the
// code sideways and takes the focus (d-107).
const codeWidth = css({ w: '[max-content]', minW: '[100%]' })
export type ToolkitFilePreviewProps = {
  /** The file's name, such as "SKILL.md". */
  file: string
  /** Text after the name, such as "137 lines · the prompt" (D7 433:567); none when not set. */
  meta?: string | undefined
  blocks: readonly ToolkitMarkdownBlock[]
  /** The file's first lines as code, each split into its syntax colours (D9 433:1583); the blocks when not set. */
  code?: Code | undefined
  /** Lets the file references wrap as one line of text, as on the phone (M2); a row of separate paths when not set. */
  wrapRefs?: boolean | undefined
  /** Wraps a long line of `code` under itself, as on the phone (M22 487:2231); the code scrolls sideways when not set. */
  wrapCode?: boolean | undefined
}

export function ToolkitFilePreview({
  file,
  meta,
  blocks,
  code,
  wrapRefs = false,
  wrapCode = false,
}: ToolkitFilePreviewProps) {
  // Each line's text, from its coloured pieces.
  const lines = (code ?? []).map((line) => line.map((piece) => piece.text).join(''))
  return (
    <section aria-label={file} className={box} data-figma="file preview">
      <div className={bar} data-figma="preview bar">
        {/* D9 433:1574: a file shown as code has icon/code in the bar. */}
        {code === undefined ? <FileIcon size="16" /> : <CodeIcon size="16" />}
        <span className={name}>{file}</span>
        {meta === undefined ? null : <span className={fileMeta}>{meta}</span>}
        <span className={readOnly}>
          <LockIcon size="12" />
          Read-only
        </span>
      </div>
      {code === undefined ? (
        <div data-figma="rendered markdown">
          <ToolkitMarkdownBlocks blocks={blocks} wrapRefs={wrapRefs} />
        </div>
      ) : (
        // D9 433:1583: the lines 19 apart, numbered, the comments green.
        <div data-figma="code">
          {wrapCode ? (
            // M22 487:2231: on the phone lines 3, 4, 5 and 8 wrap in the text column, their number on the first line,
            // and nothing scrolls sideways. A wrapped line is 32 high (two lines of the 12/16 mono style, d-090), where
            // Figma draws 34; no line-height token has 17 (d-050).
            <CodeLines lines={lines} segments={code} wrap />
          ) : (
            <ScrollFrame>
              <div className={codeWidth}>
                <CodeLines lines={lines} segments={code} />
              </div>
            </ScrollFrame>
          )}
        </div>
      )}
    </section>
  )
}
