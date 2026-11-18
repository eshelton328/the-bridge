// Figma Artifacts M2 "M2 · An artifact": on the phone an artifact opens as
// its own page under Back, and the tab bar stays, with More selected, as M1.
// Copy word for word from references/artifacts/M02/frame.json. It is M1's
// library with D2's open artifact, Skill eval pass rates, in the phone's
// shorter words: who found it, the description, the source chip and where
// it was made, with Open in workspace as a link. The ⋯ button opens File in
// a project (M7) and Discuss the discussion (M9); Back closes it and shows
// M1's library. It holds the File in a project menu, from
// references/artifacts/M07/frame.json, so its ⋯ opens the sheet, and D7's
// discussion, which Discuss opens as its own
// page (M9); its Back label, the card's source, the label over the stacked
// suggestions and the node id of its one Open in workspace are from
// references/artifacts/M09/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ArtifactsData, ArtifactsUi } from '../types.ts'
import { artifactOpen } from './artifactOpen.ts'
import { libraryPhone } from './libraryPhone.ts'

const open = artifactOpen.data.open

export const artifactPhone = {
  title: 'An artifact on its own page on a phone',
  frames: [{ id: 'M2', node: '406:293', viewport: 'phone' }],
  data: {
    ...libraryPhone.data,
    open: {
      ...open,
      found: 'found 12m ago',
      description: 'Pass rates per round for every skill in the toolkit, with and without the skill.',
      sourceLabel: 'Claude',
      madeIn: {
        ...open.madeIn,
        title: 'Chat quiet-nebula',
        meta: 'workspace skill-evals · Artifact hook',
        action: 'Open in workspace ›',
      },
    },
    fileMenu: {
      title: 'File in a project',
      done: 'Done',
      none: { label: 'Not in a project', count: '1' },
      projects: [
        { value: 'ncc-1701', count: '9 artifacts' },
        { value: 'omni', count: '6 artifacts' },
        { value: 'omni-brain', count: '3 artifacts' },
        { value: 'skill-evals', count: '5 artifacts' },
      ],
      remove: 'Remove from the library',
      note: 'Removing takes the link out of the library only; the artifact stays where it was published.',
    },
    discussion: {
      ...artifactOpen.data.discussion,
      back: 'Artifact',
      sourceLabel: 'Claude artifact',
      empty: { ...artifactOpen.data.discussion.empty, tryLabel: 'Try' },
      layers: { header: '452:4076' },
    },
  },
  ui: { ...libraryPhone.ui },
} satisfies ScreenState<ArtifactsData, ArtifactsUi>
