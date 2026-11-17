// Tests for figmaMetadata.ts. Run with `pnpm test:scripts`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildFrameRef,
  findFrames,
  findNotes,
  frameCode,
  frameIdOf,
  normaliseFrameId,
  parseMetadata,
} from './figmaMetadata.ts'

const xml = `<canvas id="1:1" name="Inbox" x="0" y="0" width="0" height="0">
  <section id="1:2" name="Phone" x="0" y="0" width="900" height="900">
    <frame id="2:1" name="M3 · Edit the prompt" x="120" y="500" width="390" height="844">
      <ellipse id="2:2" name="star" x="5" y="5" width="1.5" height="1.5" />
      <frame id="2:3" name="Frame" x="0" y="0" width="390" height="38">
        <text id="2:4" name="9:41" x="30" y="14" width="28" height="18" />
      </frame>
      <frame id="2:5" name="content" x="0" y="38" width="390" height="400">
        <text id="2:6" name="Tom &amp; Jerry&#8217;s &quot;notes&quot;" x="12" y="10" width="100" height="20" />
      </frame>
      <frame id="2:7" name="keyboard (iOS, with Safari form bar)" x="0" y="464" width="390" height="380">
        <text id="2:8" name="q" x="4" y="50" width="10" height="20" />
      </frame>
    </frame>
    <frame id="2:9" name="note·M3 · Edit the prompt" x="120" y="1400" width="390" height="80">
      <text id="2:10" name="Edit opens the keyboard." x="13" y="13" width="300" height="20" />
    </frame>
  </section>
</canvas>
IMPORTANT: trailing text from the tool is ignored`

void test('parses nested and self-closing elements and decodes entities', () => {
  const root = parseMetadata(xml)
  assert.equal(root.tag, 'canvas')
  const frame = findFrames(root)[0]
  assert.equal(frame?.name, 'M3 · Edit the prompt')
  assert.equal(frame.children.length, 4)
  assert.equal(frame.children[2]?.children[0]?.name, 'Tom & Jerry’s "notes"')
})

void test('builds absolute boxes relative to the frame, skips stars and excludes chrome text', () => {
  const frame = findFrames(parseMetadata(xml))[0]
  assert.ok(frame)
  const ref = buildFrameRef(frame, 'KEY', 'test')
  assert.equal(ref.frameId, 'M03')
  assert.equal(ref.device, 'phone')
  assert.deepEqual(ref.skipped, { star: 1 })
  const text = ref.layers.find((l) => l.id === '2:6')
  assert.deepEqual([text?.x, text?.y, text?.text, text?.path], [12, 48, 'Tom & Jerry’s "notes"', 'content'])
  assert.deepEqual(
    ref.exclude.map((e) => e.id),
    ['2:4', '2:8'],
  )
  assert.match(ref.exclude[0]?.reason ?? '', /status bar/)
  assert.match(ref.exclude[1]?.reason ?? '', /keyboard/)
})

void test('finds note frames by the name of the frame they annotate', () => {
  assert.equal(findNotes(parseMetadata(xml)).get('M3 · Edit the prompt'), 'Edit opens the keyboard.')
})

void test('frame codes and ids', () => {
  assert.equal(frameCode('D12 · Snooze or dismiss'), 'D12')
  assert.equal(frameCode('note·D1 · Inbox'), null)
  assert.equal(frameIdOf('D1'), 'D01')
  assert.equal(normaliseFrameId('d1'), 'D01')
  assert.equal(normaliseFrameId('T03'), 'T03')
  assert.equal(normaliseFrameId('M12'), 'M12')
})

void test('rejects unbalanced XML', () => {
  assert.throws(() => parseMetadata('<frame id="1" name="a"></text>'), /Unbalanced/)
})
