import { describe, expect, it } from 'vitest'
import { artifactsHome } from './home.ts'
import { addLinkInput, fullLink, sourceOfLink } from './screens/addLinkView.ts'
import { noProject } from './types.ts'

const form = {
  ...artifactsHome.data.addLinkForm,
  project: { ...artifactsHome.data.addLinkForm.project, value: noProject },
}
const ui = artifactsHome.ui

describe('addLinkView', () => {
  it('reads a claude.ai artifact link as a Claude artifact and any other address as a Codex site', () => {
    expect(sourceOfLink('https://claude.ai/artifact/00000000-0000-0000-0000-000000000001')).toBe('claude')
    expect(sourceOfLink('claude.ai/code/artifact/00000000')).toBe('claude')
    expect(sourceOfLink('sample-site.example.com/page')).toBe('codex')
    expect(sourceOfLink('  ')).toBeUndefined()
  })

  it('puts https:// before a link typed without a scheme', () => {
    expect(fullLink(' sample-site.example.com ')).toBe('https://sample-site.example.com')
    expect(fullLink('https://sample-site.example.com')).toBe('https://sample-site.example.com')
  })

  it('sends the typed link and title, the source read from the link, and no project for Not in a project', () => {
    expect(
      addLinkInput(form, { ...ui, addLinkLink: 'sample-site.example.com/page', addLinkTitle: ' Sample site ' }),
    ).toEqual({ link: 'https://sample-site.example.com/page', source: 'codex', title: 'Sample site', project: null })
    expect(
      addLinkInput(form, {
        ...ui,
        addLinkLink: 'sample-site.example.com',
        addLinkTitle: 'Sample',
        addLinkSource: 'claude',
        addLinkProject: 'sample-project',
      }),
    ).toEqual({ link: 'https://sample-site.example.com', source: 'claude', title: 'Sample', project: 'sample-project' })
  })
})
