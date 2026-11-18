// Figma Artifacts M7 "M7 · File in a project": on the phone the artifact
// page's ⋯ button opens File in a project as a sheet from the bottom that
// covers the tab bar, over M2's artifact. Copy word for word from
// references/artifacts/M07/frame.json. It is M2's data with the sheet's
// menu: Not in a project, the four projects with how many artifacts each
// holds, skill-evals checked (the artifact's project), and Remove from the
// library with its note. Remove takes only the link out of the library.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ArtifactsData, ArtifactsUi } from '../types.ts'
import { artifactPhone } from './artifactPhone.ts'

export const filePhone = {
  title: 'File in a project open over an artifact on a phone',
  frames: [{ id: 'M7', node: '407:919', viewport: 'phone' }],
  data: {
    ...artifactPhone.data,
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
  },
  ui: { ...artifactPhone.ui, fileOpen: true },
} satisfies ScreenState<ArtifactsData, ArtifactsUi>
