import { execFileSync } from 'node:child_process'
import { mkdir, mkdtemp, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createDiskFiles } from './diskFiles.ts'
import { describeFileStore } from './fileStoreContract.ts'

// A brain in a new git repository: the tracked files added to its index, the untracked ones only written, and a
// tracked symlink to a file beside the repository.
describeFileStore('disk', async ({ tracked, untracked, linkOut, fifo }) => {
  const top = await mkdtemp(join(tmpdir(), 'bridge-files-'))
  const brainDir = join(top, 'brain')
  const put = async (path: string, text: string) => {
    await mkdir(dirname(join(brainDir, path)), { recursive: true })
    await writeFile(join(brainDir, path), text)
  }
  for (const [path, text] of Object.entries({ ...tracked, ...untracked })) await put(path, text)
  await writeFile(join(top, 'outside.md'), 'outside the brain\n')
  await symlink(join(top, 'outside.md'), join(brainDir, linkOut))
  // A FIFO cannot be tracked, so a tracked symlink points at one in the root; git does not track its target.
  execFileSync('mkfifo', [join(top, 'brain', '.pipe')])
  await symlink('../.pipe', join(brainDir, fifo))
  execFileSync('git', ['init', '-q', brainDir])
  execFileSync('git', ['-C', brainDir, 'add', '--', ...Object.keys(tracked), linkOut, fifo])
  return createDiskFiles({ brainDir })
})

// Disk faults a fake cannot have: a tracked symlink to an untracked file, and a path execFile cannot pass.
describe('createDiskFiles', () => {
  async function brainWithEnvLink() {
    const brainDir = await mkdtemp(join(tmpdir(), 'bridge-files-'))
    await writeFile(join(brainDir, 'README.md'), '# Brain\n')
    await writeFile(join(brainDir, '.env'), 'TOKEN=example\n')
    await symlink('.env', join(brainDir, 'env-link'))
    execFileSync('git', ['init', '-q', brainDir])
    execFileSync('git', ['-C', brainDir, 'add', '--', 'README.md', 'env-link'])
    return createDiskFiles({ brainDir })
  }

  it.each([
    ['a tracked symlink to an untracked file', 'env-link'],
    ['a path with a NUL, with no throw', 'README.md\0x'],
  ])('does not read %s', async (_, path) => {
    expect(await (await brainWithEnvLink()).read('brain', path, 1024)).toEqual({ ok: true, value: 'notFound' })
  })
})
