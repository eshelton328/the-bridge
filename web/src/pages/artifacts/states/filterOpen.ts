// Figma Artifacts D3 "D3 · Filter": the library (D1) with its Filter menu
// open under the list tools: filter by source, project, how the artifact
// was found and when it changed. Claude artifacts and ncc-1701 are checked;
// the grid still shows every card, as the choice applies on Show 7. Copy
// word for word from references/artifacts/D03/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ArtifactsData, ArtifactsUi } from '../types.ts'
import { library } from './library.ts'

export const filterOpen = {
  title: 'The Filter menu open over the library',
  frames: [{ id: 'D3', node: '403:6269', viewport: 'desktop' }],
  data: {
    ...library.data,
    filterMenu: {
      label: 'Filter the artifacts',
      sections: [
        {
          label: 'Source',
          items: [
            { value: 'source:claude', label: 'Claude artifacts', count: 17, mono: false },
            { value: 'source:codex', label: 'Codex sites', count: 7, mono: false },
          ],
        },
        {
          label: 'Project',
          items: [
            { value: 'project:ncc-1701', label: 'ncc-1701', count: 9, mono: true },
            { value: 'project:omni', label: 'omni', count: 6, mono: true },
            { value: 'project:skill-evals', label: 'skill-evals', count: 5, mono: true },
            { value: 'project:omni-brain', label: 'omni-brain', count: 3, mono: true },
            { value: 'project:none', label: 'Not in a project', count: 1, mono: false },
          ],
        },
        {
          label: 'Found by',
          items: [
            { value: 'found:hook', label: 'Artifact hook', count: 14, mono: false },
            { value: 'found:codex-log', label: 'Codex session log', count: 6, mono: false },
            { value: 'found:hand', label: 'Added by hand', count: 4, mono: false },
          ],
        },
        {
          label: 'Updated',
          items: [
            { value: 'updated:today', label: 'Today', count: 3, mono: false },
            { value: 'updated:week', label: 'This week', count: 11, mono: false },
          ],
        },
      ],
      note: 'Claude artifacts in ncc-1701',
      show: 'Show 7',
    },
  },
  ui: { ...library.ui, filterOpen: true, filterChecks: ['source:claude', 'project:ncc-1701'] },
} satisfies ScreenState<ArtifactsData, ArtifactsUi>
