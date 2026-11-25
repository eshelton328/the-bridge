import { describe, expect, it } from 'vitest'
import { type DiagramColours, diagramColours, drawMermaid, sizedSvg } from './mermaidSvg.ts'

// Plain opaque colours in place of the tokens: the test page loads no library CSS variables it could read.
const colours: DiagramColours = {
  text: '#e6ecff',
  muted: '#8a97b8',
  fill: '#17213a',
  well: '#070b14',
  line: '#8a97b8',
  border: '#24314f',
  accent: '#5ee1ff',
}

describe('sizedSvg', () => {
  it('sets the width and height from the viewBox and drops the max-width style', () => {
    const out = sizedSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" width="100%" style="max-width: 300px" viewBox="0 0 299.5 120.2"><g/></svg>',
    )
    expect(out?.width).toBe(300)
    expect(out?.height).toBe(121)
    expect(out?.svg).toContain('width="300"')
    expect(out?.svg).not.toContain('max-width')
  })
  it('gives nothing for text that is not an SVG with a viewBox', () => {
    expect(sizedSvg('<svg xmlns="http://www.w3.org/2000/svg"><g/></svg>')).toBeUndefined()
    expect(sizedSvg('<html><body/></html>')).toBeUndefined()
    expect(sizedSvg('not xml')).toBeUndefined()
  })
})

describe('diagramColours', () => {
  it('reads each colour from its library CSS variable', () => {
    const style = { getPropertyValue: (name: string) => ` ${name} ` }
    expect(diagramColours(style).text).toBe('--colors-fg-default')
    expect(diagramColours(style).well).toBe('--colors-surface-well')
  })
})

describe('drawMermaid', () => {
  it('draws a flowchart as an SVG with its labels as SVG text', async () => {
    const result = await drawMermaid('flowchart LR\n  A[Prompt] --> B[Send]', colours, true)
    if (!result.ok) throw new Error(result.reason)
    expect(result.diagram.width).toBeGreaterThan(0)
    expect(result.diagram.svg).toContain('Prompt')
    expect(result.diagram.svg).not.toContain('foreignObject')
  })
  it('keeps HTML, script and click handlers in a label out of the SVG', async () => {
    const source = [
      'flowchart LR',
      '  A["<img src=x onerror=alert(1)>"] --> B["<script>alert(2)</script>"]',
      '  click A callback "x"',
      '  click B href "javascript:alert(3)"',
    ].join('\n')
    const result = await drawMermaid(source, colours, false)
    if (!result.ok) throw new Error(result.reason)
    const svg = result.diagram.svg.toLowerCase()
    expect(svg).not.toContain('<script')
    expect(svg).not.toContain('<img')
    expect(svg).not.toContain('onerror=')
    expect(svg).not.toContain('javascript:')
  })
  it('gives the reason, not a throw, for a source that does not parse', async () => {
    const result = await drawMermaid('flowchart LR\n  A -->', colours, true)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.reason.length).toBeGreaterThan(0)
  })
  it('leaves nothing in the page after a source that does not parse', async () => {
    await drawMermaid('flowchart LR\n  A -->', colours, true)
    expect(
      document.querySelectorAll('[id^="bridge-mermaid"], [id^="dbridge-mermaid"], [id^="ibridge-mermaid"]'),
    ).toHaveLength(0)
  })
})

describe('a node with an image', () => {
  // A same-site path that does not exist: a request for it shows as a resource entry, and nothing leaves the machine.
  const requested = (path: string) =>
    performance.getEntriesByType('resource').some((entry) => entry.name.endsWith(path))
  it('does not draw, and Mermaid requests no image, also when the key is written as a YAML escape', async () => {
    const sources = ['plain', 'escaped'].map((kind) => {
      const path = `/mermaid-image-probe-${kind}-${String(Date.now())}.png`
      const key = kind === 'plain' ? 'img' : '"\\x69mg"'
      return { path, source: `flowchart LR\n  A@{ ${key}: "${path}", h: 40, w: 40 }\n  A --> B` }
    })
    for (const { path, source } of sources) {
      const result = await drawMermaid(source, colours, true)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.reason).toContain('image')
      await new Promise((resolve) => setTimeout(resolve, 300))
      expect(requested(path)).toBe(false)
    }
  })
})

describe('a page with no token CSS', () => {
  it("still draws: an empty colour keeps Mermaid's own value", async () => {
    const none: DiagramColours = {
      text: '',
      muted: '',
      fill: '',
      well: '',
      line: '',
      border: '',
      accent: '',
    }
    const result = await drawMermaid('flowchart LR\n  A --> B', none, true)
    expect(result.ok).toBe(true)
  })
})
