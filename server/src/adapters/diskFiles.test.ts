import { execFileSync } from 'node:child_process'
import { mkdir, mkdtemp, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
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
  // A FIFO cannot be tracked, so a tracked symlink in the root points at one; an open would wait for a writer.
  execFileSync('mkfifo', [join(top, 'brain', '.pipe')])
  await symlink('.pipe', join(brainDir, fifo))
  execFileSync('git', ['init', '-q', brainDir])
  execFileSync('git', ['-C', brainDir, 'add', '--', ...Object.keys(tracked), linkOut, fifo])
  return createDiskFiles({ brainDir })
})
