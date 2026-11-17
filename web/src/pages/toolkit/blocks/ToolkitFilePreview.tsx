// A toolkit file rendered read-only (Figma `file preview`, D3 427:273): a
// bar with the file's name and Read-only, over the file's blocks in the
// library's MarkdownView. The view parses no Markdown; the state gives the
// blocks. Props only.
import { FileIcon, LockIcon, MarkdownView } from '@eshelton328/component-library-1701'
import { css } from '../../../../styled-system/css/index.js'
import type { ToolkitMarkdownBlock } from '../types.ts'

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
const name = css({ textStyle: 'mono', color: 'fg.default' })
// D7 433:567: text after the name, such as the file's length and what it is, in mono.
const fileMeta = css({ textStyle: 'mono', color: 'fg.muted' })
const readOnly = css({ display: 'inline-flex', alignItems: 'center', gap: '8', ms: 'auto', textStyle: 'small' })
// D3 427:290: the file references sit on one line, two spaces apart.
const refs = css({ display: 'flex', flexWrap: 'wrap', columnGap: '16' })

function Block({ block }: { block: ToolkitMarkdownBlock }) {
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
}

export function ToolkitFilePreview({ file, meta, blocks }: ToolkitFilePreviewProps) {
  return (
    <section aria-label={file} className={box} data-figma="file preview">
      <div className={bar} data-figma="preview bar">
        <FileIcon size="16" />
        <span className={name}>{file}</span>
        {meta === undefined ? null : <span className={fileMeta}>{meta}</span>}
        <span className={readOnly}>
          <LockIcon size="12" />
          Read-only
        </span>
      </div>
      <div data-figma="rendered markdown">
        <MarkdownView>
          {blocks.map((block) => (
            <Block key={blockKey(block)} block={block} />
          ))}
        </MarkdownView>
      </div>
    </section>
  )
}
