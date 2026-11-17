// Figma Artifacts D6 "D6 · Sort": the library (D1) with its Sort menu open
// under the list tools: sort by newest, oldest, title or project, Newest
// first picked. Found since you last looked stays at the top in every sort.
// Copy word for word from references/artifacts/D06/frame.json.
import type { ScreenState } from '../../../lib/screenState.ts'
import type { ArtifactsData, ArtifactsUi } from '../types.ts'
import { library } from './library.ts'

export const sortOpen = {
  title: 'The Sort menu open over the library',
  frames: [{ id: 'D6', node: '403:8309', viewport: 'desktop' }],
  data: {
    ...library.data,
    sorts: [
      { value: 'newest', label: 'Newest' },
      { value: 'oldest', label: 'Oldest' },
      { value: 'title', label: 'Title' },
      { value: 'project', label: 'Project' },
    ],
    sortMenu: {
      heading: 'Sort by',
      options: [
        { value: 'newest', label: 'Newest first', description: 'Most recently updated at the top' },
        { value: 'oldest', label: 'Oldest first', description: 'Least recently updated at the top' },
        { value: 'title', label: 'Title', description: 'A to Z' },
        { value: 'project', label: 'Project', description: 'Grouped by project, then newest' },
      ],
      note: 'Found since you last looked stays at the top.',
    },
  },
  ui: { ...library.ui, sortOpen: true },
} satisfies ScreenState<ArtifactsData, ArtifactsUi>
