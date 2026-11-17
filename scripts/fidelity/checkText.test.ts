// Tests for checkText.ts. Run with `pnpm test:scripts`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { checkText, coveredBy } from './checkText.ts'
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
const run = (text: string) => ({ text, x: 0, y: 0, w: 10, h: 10, selector: 'span' })
const page = (visible: string[], extra: Partial<PageMeasure> = {}) => ({
  textContent: visible.join(''),
  innerText: visible.join(' '),
  allTexts: visible,
  fieldTexts: [],
  visibleTexts: visible.map(run),
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
