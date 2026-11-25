// The one contract suite of the FileStore. The disk store and the fake run
// it, so the fake cannot drift from what it stands for.
import { ChatId } from '@bridge/contract'
import { describe, expect, it } from 'vitest'
import type { FileStore } from '../services/fileStore.ts'

/** The brain a store reads: its tracked files, its files that git does not track, and a tracked symlink out of it. */
export type FileStoreFixture = {
  readonly tracked: Readonly<Record<string, string>>
  readonly untracked: Readonly<Record<string, string>>
  /** The path of a tracked symlink to a file outside the root. */
  readonly linkOut: string
  /** The path of a tracked symlink to a FIFO in the root, which a read must not open. */
  readonly fifo: string
}

const fixture: FileStoreFixture = {
  tracked: {
    'README.md': '# Brain\n',
    'toolkit/rules/writing.md': 'Twelve patterns.\n',
    '_local/state.md': 'machine state\n',
    'notes/big.md': 'x'.repeat(64),
  },
  untracked: { '.env': 'TOKEN=example\n', 'notes/draft.md': 'not added\n' },
  linkOut: 'notes/outside.md',
  fifo: 'notes/pipe',
}

const text = (bytes: Uint8Array) => new TextDecoder().decode(bytes)

export function describeFileStore(name: string, makeStore: (fixture: FileStoreFixture) => Promise<FileStore>): void {
  describe(`FileStore contract: ${name}`, () => {
    it("lists the brain's tracked files without _local/ and without untracked files", async () => {
      const store = await makeStore(fixture)
      const listed = await store.list('brain')
      if (!listed.ok) throw new Error(listed.error.reason)
      expect([...listed.value].sort()).toEqual(
        ['README.md', 'notes/big.md', fixture.linkOut, fixture.fifo, 'toolkit/rules/writing.md'].sort(),
      )
    })

    it('reads a tracked file', async () => {
      const store = await makeStore(fixture)
      const read = await store.read('brain', 'toolkit/rules/writing.md', 1024)
      if (!read.ok || typeof read.value === 'string') throw new Error('no bytes')
      expect(text(read.value)).toBe('Twelve patterns.\n')
    })

    it.each([
      ['an untracked file', '.env'],
      ['a file under _local/', '_local/state.md'],
      ['a missing file', 'notes/gone.md'],
      ['a folder', 'toolkit/rules'],
      ['a path out of the root', '../outside.md'],
      ['an encoded path out of the root', '%2e%2e/outside.md'],
      ['a symlink out of the root', fixture.linkOut],
      ['a FIFO', fixture.fifo],
      ['a pathspec pattern', 'toolkit/*/writing.md'],
    ])('does not read %s', async (_, path) => {
      const store = await makeStore(fixture)
      expect(await store.read('brain', path, 1024)).toEqual({ ok: true, value: 'notFound' })
    })

    it('serves no root but the brain: a chat root lists nothing and reads nothing', async () => {
      const store = await makeStore(fixture)
      const chat = ChatId.parse('test-mac/chat-a')
      expect(await store.list(chat)).toEqual({ ok: true, value: [] })
      expect(await store.read(chat, 'README.md', 1024)).toEqual({ ok: true, value: 'notFound' })
    })

    it('does not read a file over the size it is given', async () => {
      const store = await makeStore(fixture)
      expect(await store.read('brain', 'notes/big.md', 63)).toEqual({ ok: true, value: 'tooLarge' })
      const read = await store.read('brain', 'notes/big.md', 64)
      if (!read.ok || typeof read.value === 'string') throw new Error('no bytes')
      expect(read.value.length).toBe(64)
    })
  })
}
