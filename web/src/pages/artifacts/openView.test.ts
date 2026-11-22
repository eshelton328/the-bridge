import { describe, expect, it } from 'vitest'
import type { ScreenState, Viewport } from '../../lib/screenState.ts'
import { artifactsHome } from './home.ts'
import { artifactHref, cardDetail, filedProject, openArtifact } from './screens/openView.ts'
import { artifactsStates } from './states/index.ts'
import type { ArtifactCard, ArtifactsData, ArtifactsUi } from './types.ts'

const { artifactOpen, artifactTablet, artifactPhone } = artifactsStates
const home: ArtifactsData = artifactsHome.data
const homeUi: ArtifactsUi = artifactsHome.ui
const card = (id: string): ArtifactCard => {
  const found = home.groups.flatMap((g) => g.cards).find((c) => c.id === id)
  if (found === undefined) throw new Error(`no card ${id}`)
  return found
}

describe('openArtifact', () => {
  it('opens nothing on the home until a card is opened', () => {
    expect(openArtifact(home, homeUi, 'desktop')).toBeUndefined()
  })

  it('keeps data.open and its discussion unchanged in D2, T2 and M2', () => {
    const frames: [ScreenState<ArtifactsData, ArtifactsUi>, Viewport][] = [
      [artifactOpen, 'desktop'],
      [artifactTablet, 'tablet'],
      [artifactPhone, 'phone'],
    ]
    for (const [state, layout] of frames) {
      const open = openArtifact(state.data, state.ui, layout)
      expect(open?.artifact).toBe(state.data.open)
      expect(open?.discussion).toBe(state.data.discussion)
      // The same artifact opened from its row is data.open too.
      expect(openArtifact(state.data, { ...state.ui, openId: state.data.open?.id }, layout)?.artifact).toBe(
        state.data.open,
      )
    }
  })

  it('builds a card\u2019s detail from its own fields and link, with no Made in or discussion', () => {
    const open = openArtifact(home, { ...homeUi, openId: 'hono-server-spike' }, 'desktop')
    expect(open).toEqual({
      artifact: {
        id: 'hono-server-spike',
        isNew: true,
        found: 'found 40m ago',
        title: 'Hono server spike',
        description: 'Routes, the RPC client and the owner check over Tailscale',
        source: 'codex',
        sourceLabel: 'Codex site',
        project: 'ncc-1701',
        updated: 'updated 40m ago',
        preview: 'ui',
        link: 'hono-spike.example.com/rpc',
      },
      discussion: undefined,
    })
    expect(open?.artifact.madeIn).toBeUndefined()
  })

  it('names the source as the chip does: "Claude artifact" on a desktop or tablet, the card’s "Claude" on a phone', () => {
    expect(cardDetail(card('logo-options'), 'tablet').sourceLabel).toBe('Claude artifact')
    expect(cardDetail(card('logo-options'), 'phone').sourceLabel).toBe('Claude')
  })

  it('keeps a card’s link', () => {
    expect(cardDetail({ ...card('logo-options'), link: 'example.com/logos' }, 'desktop').link).toBe('example.com/logos')
  })

  it('closes on Back on a tablet or phone, and stays beside the list on a desktop', () => {
    const ui = { ...homeUi, openId: 'logo-options', artifactClosed: true }
    expect(openArtifact(home, ui, 'tablet')).toBeUndefined()
    expect(openArtifact(home, ui, 'phone')).toBeUndefined()
    expect(openArtifact(home, ui, 'desktop')?.artifact.title).toBe('Logo options')
  })

  it('opens nothing for an id the library does not hold', () => {
    expect(openArtifact(home, { ...homeUi, openId: 'missing' }, 'desktop')).toBeUndefined()
  })
})

describe('filedProject', () => {
  const open = artifactPhone.data.open
  const other = cardDetail(card('logo-options'), 'phone')

  it("checks M7's pick for the state's open artifact", () => {
    expect(filedProject({ ...artifactPhone.ui, fileProject: 'skill-evals' }, open.id, open)).toBe('skill-evals')
  })

  it("shows another artifact's own project, not the pick made for the first one", () => {
    const ui = { ...artifactPhone.ui, fileProject: 'omni', fileFor: open.id }
    expect(filedProject(ui, open.id, other)).toBe(other.project)
  })

  it('checks a pick made for a card opened from the library', () => {
    const ui = { ...artifactPhone.ui, fileProject: 'omni', fileFor: other.id }
    expect(filedProject(ui, open.id, other)).toBe('omni')
  })
})

// Made-up links only.
describe('artifactHref', () => {
  it('puts https:// before a link the page shows without its scheme', () => {
    expect(artifactHref('claude.ai/artifact/00000000-0000-0000-0000-000000000000')).toBe(
      'https://claude.ai/artifact/00000000-0000-0000-0000-000000000000',
    )
    expect(artifactHref('sample-2.example.com/')).toBe('https://sample-2.example.com/')
  })

  it('gives none for a link that keeps another scheme, such as http:// in any case', () => {
    for (const link of ['http://sample.example.com/', 'HTTP://sample.example.com/', 'ftp://sample.example.com/'])
      expect(artifactHref(link)).toBeUndefined()
  })

  it('gives none for a link that is not an https address with a host', () => {
    for (const link of [
      '',
      'javascript:void(0)',
      'data:text/html,x',
      '/sample',
      '//sample.example.com',
      'a b.example.com',
    ])
      expect(artifactHref(link)).toBeUndefined()
  })

  it('encodes a space in the path or query, as Add a link takes such a link', () => {
    expect(artifactHref('sample.example.com/my page?q=a b')).toBe('https://sample.example.com/my%20page?q=a%20b')
  })

  it('gives none for a link with a user name, which would hide the host', () => {
    // Built from parts: the link before the host is a user name, as in `user@host`.
    expect(artifactHref(['claude.ai', 'sample.example.com/'].join('@'))).toBeUndefined()
  })
})
