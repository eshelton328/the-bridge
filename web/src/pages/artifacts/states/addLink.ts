// Figma Artifacts D5 "D5 · Add a link by hand": the library (D1) with the
// Add a link dialog open, for an artifact the library did not find, such as
// a Codex site on its own domain. The source is read from the link and the
// title from the page's <title>. Copy word for word from
// references/artifacts/D05/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ArtifactsData, ArtifactsUi } from '../types.ts'
import { library } from './library.ts'

export const addLink = {
  title: 'Add a link by hand',
  frames: [{ id: 'D5', node: '403:6968', viewport: 'desktop' }],
  data: {
    ...library.data,
    addLinkForm: {
      title: 'Add a link',
      description:
        'For an artifact the library did not find. Links from Claude chats and Codex sessions are added on their own.',
      link: {
        label: 'Link',
        value: 'https://panda-tokens.example.com/playground',
        hint: 'Any HTTPS link. A claude.ai/artifact link is saved as a Claude artifact.',
      },
      source: {
        label: 'Source',
        options: [
          { value: 'claude', label: 'Claude artifact' },
          { value: 'codex', label: 'Codex site' },
        ],
        hint: 'Chosen from the link; change it if it is wrong.',
      },
      name: { label: 'Title', value: 'Panda tokens playground', hint: 'Read from the page’s <title>.' },
      project: {
        label: 'Project',
        value: 'ncc-1701',
        hint: 'Optional. You can file it in a project later.',
        // The projects of the Filter menu (D3 403:6884).
        projects: ['ncc-1701', 'omni', 'skill-evals', 'omni-brain'],
      },
      cancel: 'Cancel',
      submit: 'Add artifact',
    },
  },
  ui: { ...library.ui, addLinkOpen: true, addLinkSource: 'codex' },
} satisfies ScreenState<ArtifactsData, ArtifactsUi>
