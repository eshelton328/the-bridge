// An image in Markdown text with the `images` feature off (markdownFeatures.ts):
// a link to the picture in place of the picture, so the text loads no image
// and hides nothing. A brain file links to the server's image route
// (`imageUrl.ts`) and an http or https image to its own URL; the link's text
// is the alt text, or the URL when there is none. Any other image shows its
// alt text, as it does with the feature on. Props only.
import { imageUrl } from './imageUrl.ts'

export function MarkdownImageLink({ src, alt }: { src?: string | undefined; alt?: string | undefined }) {
  const raw = src?.trim() ?? ''
  const url = imageUrl(src) ?? (/^https?:\/\//i.test(raw) ? raw : undefined)
  if (url === undefined) return alt ?? null
  const text = alt === undefined || alt === '' ? raw : alt
  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      {text}
    </a>
  )
}
