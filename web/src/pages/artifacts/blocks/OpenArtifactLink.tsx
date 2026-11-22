// Open artifact (D2 403:482's footer, T2 405:467, M2 406:407): a plain link
// to the artifact's https address that opens in a new tab, drawn with the
// library's primary button (its `button` recipe, as `Button` draws it). A
// link, not a button that opens a window, so a tap in the Home Screen app
// opens Safari: iOS blocks a window.open that comes after an await. Only an
// https address renders; any other `href` renders nothing. Props only.
import { ExternalLinkIcon } from '@eshelton328/component-library-1701'
import { cx } from '../../../../styled-system/css/index.js'
import { button } from '../../../../styled-system/recipes/index.js'

export type OpenArtifactLinkProps = {
  /** The artifact's https address (`artifactHref`, screens/openView.ts). */
  href: string
  /** The button's height, as `Button`'s `size`. */
  size?: 'md' | 'xl' | undefined
  className?: string | undefined
}

/** Whether `href` is an https address with a host: the only kind Open artifact links to. */
function isHttpsHref(href: string): boolean {
  try {
    const url = new URL(href)
    return url.protocol === 'https:' && url.hostname !== ''
  } catch {
    return false
  }
}

export function OpenArtifactLink({ href, size, className }: OpenArtifactLinkProps) {
  if (!isHttpsHref(href)) return null
  return (
    <a
      className={cx(button({ variant: 'primary', size }), className)}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      Open artifact
      <ExternalLinkIcon />
    </a>
  )
}
