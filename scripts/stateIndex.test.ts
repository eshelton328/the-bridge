// Tests for scripts/stateIndex.ts. Run with `pnpm test:scripts`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { addStateToIndex } from './stateIndex.ts'

const toolkit = `// Every Figma state of the Toolkit page, by id. scripts/genRegistry.ts reads the
// file names in this folder; each must be a key here and a story.
import { toolkitList } from './toolkitList.ts'
import { toolkitListTablet } from './toolkitListTablet.ts'
import { moreDrawer } from './moreDrawer.ts'

export const toolkitStates = {
  // The default state comes first.
  toolkitList,
  toolkitListTablet,
  moreDrawer,
}
`

void test('pnpm new state keeps the key order and comments and adds the state at the end', () => {
  assert.equal(
    addStateToIndex(toolkit, 'toolkit', 'agentDetail'),
    `// Every Figma state of the Toolkit page, by id. scripts/genRegistry.ts reads the
// file names in this folder; each must be a key here and a story.
import { toolkitList } from './toolkitList.ts'
import { toolkitListTablet } from './toolkitListTablet.ts'
import { moreDrawer } from './moreDrawer.ts'
import { agentDetail } from './agentDetail.ts'

export const toolkitStates = {
  // The default state comes first.
  toolkitList,
  toolkitListTablet,
  moreDrawer,
  agentDetail,
}
`,
  )
})

void test('pnpm new state refuses a key the index has and an index without the states object', () => {
  assert.throws(() => addStateToIndex(toolkit, 'toolkit', 'moreDrawer'), /has the key moreDrawer already/)
  assert.throws(() => addStateToIndex(toolkit, 'inbox', 'list'), /no "export const inboxStates = \{" object/)
})

void test('pnpm new state adds its import after a last import that spans several lines', () => {
  const source = `import { list } from './list.ts'
import {
  filterOpen,
  // The open filter menu.
  filterOpenTablet,
} from './filterOpen.ts'

export const inboxStates = {
  list,
  filterOpen,
  filterOpenTablet,
}
`
  assert.equal(
    addStateToIndex(source, 'inbox', 'sortOpen'),
    `import { list } from './list.ts'
import {
  filterOpen,
  // The open filter menu.
  filterOpenTablet,
} from './filterOpen.ts'
import { sortOpen } from './sortOpen.ts'

export const inboxStates = {
  list,
  filterOpen,
  filterOpenTablet,
  sortOpen,
}
`,
  )
})
