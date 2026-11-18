// A toolkit file's blocks rendered read-only in the library's MarkdownView
// (D3 `rendered markdown` 427:280): its title, headings, paragraphs, lines of
// file references and preformatted lines. The view parses no Markdown; the
// state gives the blocks. The Overview's file preview (`ToolkitFilePreview`)
// and the Files tab's viewer (`ToolkitFileViewer`) use it. Props only.
import { MarkdownView } from '@eshelton328/component-library-1701'
import { Fragment } from 'react'
import { css } from '../../../../styled-system/css/index.js'
import type { ToolkitMarkdownBlock } from '../types.ts'

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

export type ToolkitMarkdownBlocksProps = {
  blocks: readonly ToolkitMarkdownBlock[]
  /** Lets the file references wrap as one line of text, as on the phone (M2); a row of separate paths when not set. */
  wrapRefs?: boolean | undefined
  /** `none` draws the text flush, for a box that sets its own padding (T4's viewer); the view's 20 by 24 when not set. */
  padding?: 'default' | 'none' | undefined
}

export function ToolkitMarkdownBlocks({ blocks, wrapRefs = false, padding }: ToolkitMarkdownBlocksProps) {
  return (
    <MarkdownView padding={padding}>
      {blocks.map((block) => (
        <Block key={blockKey(block)} block={block} wrapRefs={wrapRefs} />
      ))}
    </MarkdownView>
  )
}
