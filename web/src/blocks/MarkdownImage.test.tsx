import { afterEach, describe, expect, it } from 'vitest'
import { page } from 'vitest/browser'
import { testRender } from '../lib/testRender.ts'
import { MarkdownText } from './MarkdownText.tsx'

// An image in a message: a brain file is the library's ImageFigure through the image route; any other image shows its
// alt text and loads nothing. The texts and paths are made up.
let view: { unmount: () => Promise<void> } | undefined

afterEach(async () => {
  await view?.unmount()
  view = undefined
})

const images = () => [...document.querySelectorAll('img')].map((img) => img.getAttribute('src'))

describe('a brain image', () => {
  it('shows through the image route, in a figure that no paragraph holds', async () => {
    view = await testRender(<MarkdownText text={'The builds:\n\n![Build chart](images/chart.png)\n\nEnd.'} />)
    await expect.poll(images).toEqual(['/api/files/raw?root=brain&path=images%2Fchart.png'])
    const figure = document.querySelector('figure')
    expect(figure?.closest('p')).toBeNull()
    // The other paragraphs stay paragraphs.
    expect([...document.querySelectorAll('p')].map((p) => p.textContent)).toEqual(['The builds:', 'End.'])
  })

  it('takes an absolute path and a file URL by their absolute path', async () => {
    view = await testRender(<MarkdownText text={'![a](/brain/a.png) and ![b](file:///brain/b.png)'} />)
    await expect.poll(images).toEqual(['/api/files/raw?path=%2Fbrain%2Fa.png', '/api/files/raw?path=%2Fbrain%2Fb.png'])
    expect(document.querySelector('figure')?.closest('p')).toBeNull()
  })

  it('says it did not load, with its alt text, when the route has no such image', async () => {
    // The test server has no image route, so the picture does not load.
    view = await testRender(<MarkdownText text={'![Build chart](images/none.png)'} />)
    await expect.element(page.getByRole('status')).toHaveTextContent('This image did not load: Build chart')
    expect(document.querySelector('img')).toBeNull()
  })
})

describe('a brain image in a link', () => {
  it('draws the picture outside the link, so the zoom button and the link are two targets', async () => {
    view = await testRender(
      <MarkdownText text={'See [![Build chart](images/chart.png)](https://example.com/builds) now.'} />,
    )
    await expect.poll(images).toEqual(['/api/files/raw?root=brain&path=images%2Fchart.png'])
    const figure = document.querySelector('figure')
    expect(figure?.closest('a')).toBeNull()
    expect(figure?.closest('p')).toBeNull()
    const links = [...document.querySelectorAll('a')]
    expect(links.map((a) => [a.textContent, a.getAttribute('href')])).toEqual([
      ['Build chart', 'https://example.com/builds'],
    ])
    expect(links[0]?.querySelector('button, img, figure')).toBeNull()
  })
})

describe('any other image', () => {
  it('shows its alt text and loads nothing', async () => {
    const text = [
      '![web](https://example.com/a.png)',
      '![proto](//example.com/b.png)',
      '![data](data:image/png;base64,AAAA)',
      '![script](javascript:alert(1))',
      '![up](../outside.png)',
      '![host](file://example.com/c.png)',
    ].join(' ')
    view = await testRender(<MarkdownText text={text} />)
    await expect.element(page.getByText('web proto data script up host')).toBeVisible()
    expect(document.querySelector('img')).toBeNull()
    expect(document.querySelector('figure')).toBeNull()
    // With no image shown, the paragraph stays a paragraph.
    expect(document.querySelector('p')?.textContent).toBe('web proto data script up host')
  })

  it('keeps a link with a file URL as plain text', async () => {
    view = await testRender(<MarkdownText text={'[notes](file:///brain/notes.md)'} />)
    await expect.element(page.getByText('notes')).toBeVisible()
    expect(document.querySelector('a')).toBeNull()
  })
})
