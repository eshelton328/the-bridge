// Figma Artifacts M6 "M6 · Add a link by hand": on the phone Add a link opens
// D5's form as a sheet from the bottom that covers the tab bar, over M1's
// library, for an artifact the library did not find. Copy word for word from
// references/artifacts/M06/frame.json. It is M1's library with D5's form in
// the phone's shorter words: the one-line description, no line under Source
// or Project, and Add in the title row for Add artifact.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ArtifactsData, ArtifactsUi } from '../types.ts'
import { addLink } from './addLink.ts'
import { libraryPhone } from './libraryPhone.ts'

export const addLinkPhone = {
  title: 'The Add a link sheet open over the library on a phone',
  frames: [{ id: 'M6', node: '408:416', viewport: 'phone' }],
  data: {
    ...libraryPhone.data,
    addLinkForm: {
      ...addLink.data.addLinkForm,
      description: 'For an artifact the library did not find.',
      source: { ...addLink.data.addLinkForm.source, hint: undefined },
      project: { ...addLink.data.addLinkForm.project, hint: undefined },
      submit: 'Add',
    },
  },
  ui: { ...libraryPhone.ui, addLinkOpen: true, addLinkSource: 'codex' },
} satisfies ScreenState<ArtifactsData, ArtifactsUi>
