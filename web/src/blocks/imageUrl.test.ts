import { describe, expect, it } from 'vitest'
import { imageUrl } from './imageUrl.ts'

// Only a file in the brain loads, through the server's image route; any other URL loads nothing. The paths are made up.
describe('imageUrl', () => {
  it.each([
    ['images/chart.png', '/api/files/raw?root=brain&path=images%2Fchart.png'],
    ['./images/chart.png', '/api/files/raw?root=brain&path=images%2Fchart.png'],
    ['images/my%20chart.png', '/api/files/raw?root=brain&path=images%2Fmy+chart.png'],
    ['images/chart.png?v=2#top', '/api/files/raw?root=brain&path=images%2Fchart.png'],
    ['/brain/images/chart.png', '/api/files/raw?path=%2Fbrain%2Fimages%2Fchart.png'],
    ['file:///brain/images/chart.png', '/api/files/raw?path=%2Fbrain%2Fimages%2Fchart.png'],
    ['file://localhost/brain/images/chart.png', '/api/files/raw?path=%2Fbrain%2Fimages%2Fchart.png'],
    ['file:///brain/images/my%20chart.png', '/api/files/raw?path=%2Fbrain%2Fimages%2Fmy+chart.png'],
  ])('reads %s as a brain file', (src, url) => {
    expect(imageUrl(src)).toBe(url)
  })

  it.each([
    undefined,
    '',
    '   ',
    'https://example.com/chart.png',
    'HTTPS://example.com/chart.png',
    ' https://example.com/chart.png',
    'https:example.com/chart.png',
    'ftp://example.com/chart.png',
    'data:image/svg+xml,<svg/>',
    'vbscript:msgbox(1)',
    'http://example.com/chart.png',
    '//example.com/chart.png',
    'data:image/png;base64,AAAA',
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    'blob:https://example.com/1',
    'file://example.com/brain/chart.png',
    '../outside.png',
    'images/../../outside.png',
    'images//chart.png',
    '%2e%2e/outside.png',
    'images/%zz.png',
  ])('loads nothing for %s', (src) => {
    expect(imageUrl(src)).toBeUndefined()
  })

  it('gives only a URL of the image route on this origin, whatever the src', () => {
    const forms = [
      'images/chart.png',
      '/brain/a.png',
      'file:///brain/a.png',
      'https://example.com/a.png',
      '//example.com/a.png',
      '/\\example.com/a.png',
      '\\\\example.com\\a.png',
      'images/a.png?u=https://example.com',
      'javascript:fetch("https://example.com")',
      'data:text/html,<script>1</script>',
      '%68ttps://example.com/a.png',
    ]
    for (const src of forms) {
      const url = imageUrl(src)
      if (url === undefined) continue
      expect({ src, start: url.startsWith('/api/files/raw?') }).toEqual({ src, start: true })
      expect({ src, origin: new URL(url, window.location.origin).origin }).toEqual({
        src,
        origin: window.location.origin,
      })
    }
  })
})
