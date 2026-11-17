// Tests for checkText.ts. Run with `pnpm test:scripts`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { checkText, coveredBy, coveredInFigma } from './checkText.ts'
import type { Layer } from './figmaMetadata.ts'
import type { PageMeasure } from './inPage.ts'

const layer = (id: string, text: string, y = 10): Layer => ({
  id,
  name: text,
  type: 'text',
  x: 10,
  y,
  w: 50,
  h: 14,
  path: '',
  text,
})
const run = (text: string, covered = false) => ({ text, x: 0, y: 0, w: 10, h: 10, selector: 'span', covered })
const page = (visible: string[], extra: Partial<PageMeasure> = {}) => ({
  textContent: visible.join(''),
  innerText: visible.join(' '),
  allTexts: visible,
  fieldTexts: [],
  visibleTexts: visible.map((v) => run(v)),
  ...extra,
})
const none = { missing: [], extra: [] }
const ref = (layers: Layer[], exclude: { id: string; text: string; reason: string }[] = []) => ({
  layers,
  exclude,
  w: 390,
  h: 844,
})

void test('passes when every Figma string is shown and nothing else is', () => {
  const r = checkText(ref([layer('1', 'Inbox'), layer('2', '7')]), none, page(['Inbox', '7']))
  assert.equal(r.ok, true)
  assert.equal(r.checked, 2)
})

void test('reports a missing string and extra text', () => {
  const r = checkText(ref([layer('1', 'MY NOTES')]), none, page(['My notes']))
  assert.deepEqual(r.missing, [{ id: '1', text: 'MY NOTES' }])
  assert.deepEqual(
    r.extra.map((e) => e.text),
    ['My notes'],
  )
  assert.equal(r.ok, false)
})

void test('a short string must be a whole text node, not part of one', () => {
  const r = checkText(ref([layer('1', '4'), layer('2', 'NCC-46')]), none, page(['NCC-46']))
  assert.deepEqual(r.missing, [{ id: '1', text: '4' }])
})

void test('exclude and exceptions remove strings from the check; exceptions allow extra text', () => {
  const r = checkText(
    ref([layer('1', '9:41'), layer('2', 'Add a note…')], [{ id: '1', text: '9:41', reason: 'status bar' }]),
    {
      missing: [{ text: 'Add a note…', layers: ['2'], reason: 'placeholder in the library' }],
      extra: [{ text: 'Beta', reason: 'x' }],
    },
    page(['Beta']),
  )
  assert.deepEqual([r.ok, r.checked, r.excluded, r.excepted], [true, 0, 1, 1])
})

void test('placeholders count as present; text split over runs counts as seen', () => {
  const r = checkText(
    ref([layer('1', 'Search the inbox'), layer('2', 'ncc-1701 · f-005')]),
    none,
    page(['ncc-1701', ' · ', 'f-005'], {
      fieldTexts: ['Search the inbox'],
      visibleTexts: [run('Search the inbox'), run('ncc-1701'), run('·'), run('f-005')],
    }),
  )
  assert.equal(r.ok, true)
})

void test('a string in the DOM but not seen fails only when Figma shows it inside the frame', () => {
  const measure = page([], { textContent: 'Done Later', innerText: 'Done Later', allTexts: ['Done', 'Later'] })
  const r = checkText(ref([layer('1', 'Done'), layer('2', 'Later', 900)]), none, measure)
  assert.deepEqual(r.notVisible, [{ id: '1', text: 'Done' }])
  assert.equal(r.ok, false)
})

void test('coveredBy accepts runs made of Figma strings and punctuation', () => {
  assert.equal(coveredBy('Next steps 3', ['Next steps', '3']), true)
  assert.equal(coveredBy('drift', ['drift check']), true)
  assert.equal(coveredBy('nested', ['Next steps']), false)
})

void test('each Figma layer needs its own visible occurrence of its string', () => {
  // D01: the detail heading has the same text as its list row's title.
  const layers = [layer('1', 'Fix the drift check'), layer('2', 'Fix the drift check', 200)]
  const once = checkText(ref(layers), none, page(['Fix the drift check']))
  assert.deepEqual(once.notVisible, [{ id: '2', text: 'Fix the drift check' }])
  assert.equal(once.ok, false)
  const twice = checkText(ref(layers), none, page(['Fix the drift check', 'Fix the drift check']))
  assert.equal(twice.ok, true)
})

void test('a run claimed by a long string is not reused for a shorter string inside it', () => {
  const layers = [layer('1', 'Inbox'), layer('2', 'Inbox zero today')]
  assert.deepEqual(checkText(ref(layers), none, page(['Inbox zero today'])).notVisible, [{ id: '1', text: 'Inbox' }])
  assert.equal(checkText(ref(layers), none, page(['Inbox', 'Inbox zero today'])).ok, true)
})

void test('a missing exception skips only the layers it names; the same text in another layer is checked (d-101)', () => {
  // D14: the list row's title is under the task pane, the pane's heading is not.
  const layers = [layer('1', 'Write the tickets'), layer('2', 'Write the tickets', 200)]
  const exceptions = {
    missing: [{ text: 'Write the tickets', layers: ['1'], reason: 'under the task pane' }],
    extra: [],
  }
  const shown = checkText(ref(layers), exceptions, page(['Write the tickets']))
  assert.deepEqual([shown.ok, shown.checked, shown.excepted], [true, 1, 1])
  const gone = checkText(ref(layers), exceptions, page([]))
  assert.deepEqual(gone.missing, [{ id: '2', text: 'Write the tickets' }])
  assert.equal(gone.ok, false)
})

void test('a missing exception that names a layer without its text is an error', () => {
  const exceptions = { missing: [{ text: 'Reset', layers: ['9'], reason: 'hidden button' }], extra: [] }
  assert.throws(() => checkText(ref([layer('1', 'Reset')]), exceptions, page([])), /names layer 9/)
})

// Workbench D01: an open pane menu covered "…a chat." in the render and the
// text check passed. A run that another element covers is not visible,
// unless Figma draws a layer over the same text layer too.
const menu = (y: number): Layer => ({ id: 'm', name: 'menu', type: 'frame', x: 0, y, w: 200, h: 100, path: '' })
const chatText = layer('t', '…a chat.', 40)

void test('text covered in the render but not in Figma is not visible', () => {
  const r = checkText(ref([chatText]), none, page(['…a chat.'], { visibleTexts: [run('…a chat.', true)] }))
  assert.deepEqual(r.notVisible, [{ id: 't', text: '…a chat.', covered: true }])
  assert.equal(r.ok, false)
  // A menu that Figma draws elsewhere does not cover the text.
  const apart = checkText(
    ref([chatText, menu(300)]),
    none,
    page(['…a chat.'], { visibleTexts: [run('…a chat.', true)] }),
  )
  assert.equal(apart.ok, false)
})

void test('text covered in the render and in Figma passes', () => {
  const r = checkText(ref([chatText, menu(0)]), none, page(['…a chat.'], { visibleTexts: [run('…a chat.', true)] }))
  assert.deepEqual([r.ok, r.notVisible], [true, []])
})

void test('text covered in Figma may span covered and open runs of the render', () => {
  // A long prompt under a fade: Figma draws the fade over the text layer,
  // the render's fade covers only its last lines.
  const prompt = layer('t', 'Read the plan. Write the tickets.', 40)
  const runs = [run('Read the plan.'), run('Write the tickets.', true)]
  const measure = page(['Read the plan.', 'Write the tickets.'], { visibleTexts: runs })
  assert.equal(checkText(ref([prompt, menu(0)]), none, measure).ok, true)
  assert.deepEqual(checkText(ref([prompt]), none, measure).notVisible, [{ id: 't', text: prompt.text, covered: true }])
})

void test('text that nothing covers in the render passes', () => {
  assert.equal(checkText(ref([chatText]), none, page(['…a chat.'])).ok, true)
  assert.equal(checkText(ref([chatText, menu(0)]), none, page(['…a chat.'])).ok, true)
})

void test('only a later layer that is not an ancestor or descendant covers a text layer in Figma', () => {
  const at = (id: string, name: string, type: string, path: string, y = 0, h = 100): Layer => ({
    id,
    name,
    type,
    x: 0,
    y,
    w: 200,
    h,
    path,
  })
  const text: Layer = { ...layer('t', 'Ask'), path: 'pane > row' }
  const layers = [
    at('1', 'pane', 'frame', ''),
    at('2', 'row', 'frame', 'pane'),
    text,
    at('3', 'note', 'text', 'pane'),
    at('4', 'divider', 'line', 'pane'),
  ]
  // Its parent, its grandparent, a later text layer and a line do not cover it.
  assert.deepEqual([...coveredInFigma(layers)], [])
  // A later sibling of its parent, and a later layer inside one, do.
  assert.deepEqual([...coveredInFigma([...layers, at('5', 'menu', 'frame', 'pane')])], ['t'])
  assert.deepEqual(
    [...coveredInFigma([...layers, at('6', 'popover', 'frame', ''), at('7', 'bg', 'rounded-rectangle', 'popover')])],
    ['t'],
  )
  // An earlier layer is under it, and a later one that does not overlap it leaves it alone.
  assert.deepEqual([...coveredInFigma([at('0', 'backdrop', 'rounded-rectangle', ''), ...layers])], [])
  assert.deepEqual([...coveredInFigma([...layers, at('8', 'menu', 'frame', '', 400)])], [])
})

void test('a covered string that needs open fragments never takes the only open occurrence another layer needs', () => {
  // The covered prompt can use the open "Read the plan." and either
  // "Write the tickets."; the uncovered layer can use only the open one.
  const prompt = layer('t', 'Read the plan. Write the tickets.', 40)
  const tickets = layer('w', 'Write the tickets.', 200)
  const runs = [run('Write the tickets.'), run('Read the plan.'), run('Write the tickets.', true)]
  const measure = page(['Write the tickets.', 'Read the plan.', 'Write the tickets.'], { visibleTexts: runs })
  const r = checkText(ref([prompt, menu(0), tickets]), none, measure)
  assert.deepEqual([r.ok, r.notVisible], [true, []])
})

void test('a covered long string claims its open runs before a shorter string inside them', () => {
  // Inbox D01: the prompt under its fade, split into open runs, and the
  // source link "increment-1.md", which is also inside the prompt's runs.
  const prompt = layer('t', 'Read f-005-the-bridge/increment-1.md and write one ticket.', 40)
  const link = layer('l', 'increment-1.md', 300)
  const runs = [run('Read f-005-the-bridge/'), run('increment-1.md and write one ticket.'), run('increment-1.md')]
  const measure = page(
    runs.map((r) => r.text),
    { visibleTexts: runs },
  )
  const r = checkText(ref([prompt, menu(0), link]), none, measure)
  assert.deepEqual([r.ok, r.notVisible], [true, []])
})
