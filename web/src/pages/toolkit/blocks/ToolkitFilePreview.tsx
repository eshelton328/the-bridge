// A toolkit file rendered read-only (Figma `file preview`, D3 427:273): a
// bar with the file's name and Read-only, over the file's blocks in the
// library's MarkdownView. The view parses no Markdown; the state gives the
// blocks. A file shown as code (a hook's script, D9 433:1572) shows the code
// icon in the bar and its lines with their numbers in the library's
// CodeLines; on the phone (M22 487:2231) a long line wraps under itself.
// Props only.
import { CodeIcon, CodeLines, FileIcon, LockIcon, MarkdownView, ScrollFrame } from '@eshelton328/component-library-1701'
import { Fragment } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { ToolkitItemDetailView, ToolkitMarkdownBlock } from '../types.ts'

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
// D3 427:290: the file references sit on one line, two spaces apart.
const refs = css({ display: 'flex', flexWrap: 'wrap', columnGap: '16' })
// M2 487:161: on the phone the references run as one line of code, two spaces apart, and wrap after a "/" too.
const refsText = css({ whiteSpace: 'pre-wrap' })

/** A path that may wrap after each "/", as Figma wraps references/ticket.md (M2 487:161). */
function Breakable({ path }: { path: string }) {
  const parts = path.split('/')
  return parts.map((part, i) => (
    // The parts of one path are in order and never move, so the index keys them.
    <Fragment key={`${String(i)}:${part}`}>
      {part}
      {i < parts.length - 1 ? (
        <>
          /<wbr />
        </>
      ) : null}
    </Fragment>
  ))
}

function Block({ block, wrapRefs }: { block: ToolkitMarkdownBlock; wrapRefs: boolean }) {
  switch (block.type) {
    case 'title':
      return <h1>{block.text}</h1>
    case 'heading':
      return <h2>{block.text}</h2>
    case 'paragraph':
      return <p>{block.text}</p>
    case 'pre':
      return (
        <pre>
          <code>{block.text}</code>
        </pre>
      )
    case 'code':
      if (wrapRefs)
        return (
          <p className={refsText}>
            <code>
              {block.items.map((item, i) => (
                <Fragment key={item}>
                  {i > 0 ? '  ' : null}
                  <Breakable path={item} />
                </Fragment>
              ))}
            </code>
          </p>
        )
      return (
        <p className={refs}>
          {block.items.map((item) => (
            <code key={item}>{item}</code>
          ))}
        </p>
      )
  }
}

/** A block's text, as its key: a file's blocks in the states never repeat a text. */
const blockKey = (block: ToolkitMarkdownBlock) =>
  block.type === 'code' ? `code:${block.items.join(' ')}` : `${block.type}:${block.text}`

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
          <MarkdownView>
            {blocks.map((block) => (
              <Block key={blockKey(block)} block={block} wrapRefs={wrapRefs} />
            ))}
          </MarkdownView>
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
