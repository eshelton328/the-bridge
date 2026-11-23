// Shared by the Markdown route tests (WorkspacesMarkdownLinks, InboxMarkdownLinks; review R56, the owner: "Can we
// provide clickable links in the output text"): a made-up text with a bare URL, a `www.` link, a 200-character URL, a
// `javascript:` link, a `mailto:` link and a bare email address, and the checks of how the app draws them on the
// owner's screen. Every value in the text is made up.
import { expect } from 'vitest'

const bare = 'https://example.com/sample/runbook'
const www = 'www.example.org/sample-notes'
/** A URL of 200 characters with no place to break but its own characters. */
const longUrl = `https://example.com/sample/${'segment-'.repeat(21)}${'x'.repeat(5)}`

export const linkText = [
  `The runbook is at ${bare} today.`,
  '',
  `Notes: ${www} and the long one ${longUrl}`,
  '',
  '[Run it](javascript:alert(1)) or [write](mailto:sample@example.com) or sample@example.com.',
].join('\n')

/** The links in `scope`: their text, URL, target and rel. */
const linksIn = (scope: Element) =>
  [...scope.querySelectorAll('a')].map((a) => [
    a.textContent,
    a.getAttribute('href'),
    a.getAttribute('target'),
    a.getAttribute('rel'),
  ])

/** The colour `value` computes to, as an element of the page would draw it. */
function computed(value: string): string {
  const probe = document.createElement('span')
  probe.style.color = value
  document.body.append(probe)
  const color = getComputedStyle(probe).color
  probe.remove()
  return color
}

/**
 * Fails unless `scope` has exactly the http and https links, each opening in a new tab, the `www.` link going to
 * https, the other links and the email as text, each link in the accent colour and underlined, and the long URL
 * wrapped inside `scope` with no page-wide sideways scroll.
 */
export function expectLinks(scope: Element) {
  const tab = ['_blank', 'noopener noreferrer']
  expect(linksIn(scope)).toEqual([
    [bare, bare, ...tab],
    [www, `https://${www}`, ...tab],
    [longUrl, longUrl, ...tab],
  ])
  expect(scope.textContent).toContain('Run it')
  expect(scope.textContent).toContain('sample@example.com')
  const accent = computed('var(--colors-fg-accent)')
  expect(accent).not.toBe(computed('inherit'))
  for (const a of scope.querySelectorAll('a')) {
    const style = getComputedStyle(a)
    expect(style.color).toBe(accent)
    expect(style.textDecorationLine).toContain('underline')
  }
  const long = [...scope.querySelectorAll('a')].find((a) => a.textContent === longUrl)
  if (long === undefined) throw new Error('no long link')
  const box = long.getBoundingClientRect()
  const outer = scope.getBoundingClientRect()
  expect(box.left).toBeGreaterThanOrEqual(outer.left - 0.5)
  expect(box.right).toBeLessThanOrEqual(outer.right + 0.5)
  expect(long.getClientRects().length).toBeGreaterThan(1)
  for (let node = long.parentElement; node !== null && node !== scope; node = node.parentElement)
    expect(node.scrollWidth, `${node.tagName}.${node.className} is wider than its box`).toBeLessThanOrEqual(
      node.clientWidth,
    )
  expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(document.documentElement.clientWidth)
}
