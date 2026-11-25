// An image in Markdown text: a file in the brain shows as the library's ImageFigure through the server's image route
// (`imageUrl.ts`); any other image shows its alt text and loads nothing. `hasShownImage` tells a paragraph that it
// holds a shown image, so it renders as a `div`: a figure may not sit in a `p`. A link round a shown image draws the
// picture before the link and the link with the image's alt text (`textWithAlts`), so the picture's zoom button and the
// link are two targets, never a button in a link.
import { ImageFigure } from '@eshelton328/component-library-1701'
import type { ExtraProps } from 'react-markdown'
import { imageUrl } from './imageUrl.ts'

export function MarkdownImage({ src, alt }: { src?: string | undefined; alt?: string | undefined }) {
  const url = imageUrl(src)
  if (url === undefined) return alt ?? null
  return <ImageFigure src={url} alt={alt ?? ''} />
}

type Node = NonNullable<ExtraProps['node']>
type Child = Node['children'][number]

const shown = (child: Child): boolean => {
  if (child.type !== 'element') return false
  if (child.tagName === 'img') {
    const src = child.properties.src
    return imageUrl(typeof src === 'string' ? src : undefined) !== undefined
  }
  return child.children.some(shown)
}

/** Whether the element `node` holds, at any depth, an image that shows as a picture. */
export function hasShownImage(node: ExtraProps['node']): boolean {
  return node?.children.some(shown) ?? false
}

/** The text of `node` as a reader sees it, with each image as its alt text. */
export function textWithAlts(node: ExtraProps['node']): string {
  const text = (child: Child): string => {
    if (child.type === 'text') return child.value
    if (child.type !== 'element') return ''
    if (child.tagName === 'img') {
      const alt = child.properties.alt
      return typeof alt === 'string' ? alt : ''
    }
    return child.children.map(text).join('')
  }
  return node?.children.map(text).join('') ?? ''
}
