// Figma Artifacts M7 "M7 · File in a project": on the phone the artifact
// page's ⋯ button opens File in a project as a sheet from the bottom that
// covers the tab bar, over M2's artifact. Copy word for word from
// references/artifacts/M07/frame.json. It is M2's data with the sheet open;
// `artifactPhone` holds the sheet's menu, so M2's ⋯ opens it: Not in a
// project, the four projects with how many artifacts each holds,
// skill-evals checked (the artifact's project), and Remove from the library
// with its note. Remove takes only the link out of the library.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ArtifactsData, ArtifactsUi } from '../types.ts'
import { artifactPhone } from './artifactPhone.ts'

export const filePhone = {
  title: 'File in a project open over an artifact on a phone',
  frames: [{ id: 'M7', node: '407:919', viewport: 'phone' }],
  data: { ...artifactPhone.data },
  ui: { ...artifactPhone.ui, fileOpen: true },
} satisfies ScreenState<ArtifactsData, ArtifactsUi>
