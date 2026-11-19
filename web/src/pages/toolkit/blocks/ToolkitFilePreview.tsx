// A toolkit file rendered read-only (Figma `file preview`, D3 427:273): the
// library's FileFrame, a bar with the file's name and Read-only, over the
// file's blocks in the library's MarkdownView (`ToolkitMarkdownBlocks`). A file
// shown as code (a hook's script, D9 433:1572) shows the code icon in the bar
// and its lines with their numbers in the library's CodeLines; on the phone
// (M22 487:2231) a long line wraps under itself. Props only.
import { CodeLines, FileFrame, ScrollFrame } from '@eshelton328/component-library-1701'
import { BlockBoundary } from '../../../errors/BlockBoundary.tsx'
import { css } from '../../../../styled-system/css/index.js'
import type { ToolkitItemDetailView, ToolkitMarkdownBlock } from '../types.ts'
import { ToolkitMarkdownBlocks } from './ToolkitMarkdownBlocks.tsx'

type Code = NonNullable<ToolkitItemDetailView['preview']['code']>

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
  /**
   * Lets the box cut the bar's end, so the name and its meta stay whole (FileFrame `barEnd="cut"`), as on the phone
   * (M20 487:1650: Read-only 487:1660 starts past the box). The bar's end holds only Read-only.
   */
  cutBarEnd?: boolean | undefined
}

export function ToolkitFilePreview({
  file,
  meta,
  blocks,
  code,
  wrapRefs = false,
  wrapCode = false,
  cutBarEnd = false,
}: ToolkitFilePreviewProps) {
  // Each line's text, from its coloured pieces.
  const lines = (code ?? []).map((line) => line.map((piece) => piece.text).join(''))
  return (
    // D3 427:273, 427:274: the box and its 37 px bar; the 14 px icons draw at 16 (no icon token has 14, d-050).
    <FileFrame
      name={file}
      icon={code === undefined ? 'file' : 'code'}
      meta={meta}
      readOnly
      barEnd={cutBarEnd ? 'cut' : 'keep'}
      figma={{ root: 'file preview', bar: 'preview bar' }}
    >
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
            <BlockBoundary contentKey={file}>
              <CodeLines lines={lines} segments={code} wrap />
            </BlockBoundary>
          ) : (
            <ScrollFrame>
              <div className={codeWidth}>
                <BlockBoundary contentKey={file}>
                  <CodeLines lines={lines} segments={code} />
                </BlockBoundary>
              </div>
            </ScrollFrame>
          )}
        </div>
      )}
    </FileFrame>
  )
}
