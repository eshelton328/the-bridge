// An image in Markdown text: a file in the brain shows as the library's ImageFigure through the server's image route
// (`imageUrl.ts`); any other image shows its alt text and loads nothing. `hasShownImage` tells a paragraph that it
// holds a shown image, so it renders as a `div`: a figure may not sit in a `p`.
import { ImageFigure } from '@eshelton328/component-library-1701'
import type { ExtraProps } from 'react-markdown'
import { imageUrl } from './imageUrl.ts'

export function MarkdownImage({ src, alt }: { src?: string | undefined; alt?: string | undefined }) {
  const url = imageUrl(src)
  if (url === undefined) return alt ?? null
  return <ImageFigure src={url} alt={alt ?? ''} />
}

/** Whether the element `node` holds an image that shows as a picture. */
export function hasShownImage(node: ExtraProps['node']): boolean {
  return (
    node?.children.some((child) => {
      if (child.type !== 'element' || child.tagName !== 'img') return false
      const src = child.properties.src
      return imageUrl(typeof src === 'string' ? src : undefined) !== undefined
    }) ?? false
  )
}
