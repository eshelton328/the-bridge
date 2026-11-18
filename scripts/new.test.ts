// `pnpm new` writes into the repo it runs from, so this test runs a copy
// of scripts/ beside a copy of one page's states in a temp folder.
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { after, test } from 'node:test'
import { fileURLToPath } from 'node:url'

const repo = fileURLToPath(new URL('..', import.meta.url))
const tmp = mkdtempSync(join(tmpdir(), 'bridge-new-'))
after(() => {
  rmSync(tmp, { recursive: true, force: true })
})

void test('a second screen of a page gets its own story title, not the States title of the main screen', () => {
  cpSync(join(repo, 'scripts'), join(tmp, 'scripts'), { recursive: true })
  cpSync(join(repo, 'web', 'src', 'structure.ts'), join(tmp, 'web', 'src', 'structure.ts'))
  cpSync(
    join(repo, 'web', 'src', 'pages', 'artifacts', 'states'),
    join(tmp, 'web', 'src', 'pages', 'artifacts', 'states'),
    {
      recursive: true,
    },
  )
  execFileSync(
    process.execPath,
    [join(tmp, 'scripts', 'new.ts'), 'screen', 'ArtifactsDetailScreen', '--page', 'artifacts'],
    {
      stdio: 'pipe',
    },
  )
  const stories = readFileSync(
    join(tmp, 'web', 'src', 'pages', 'artifacts', 'screens', 'ArtifactsDetailScreen.stories.tsx'),
    'utf8',
  )
  assert.match(stories, /title: 'Pages\/Artifacts\/ArtifactsDetailScreen',/)
  assert.doesNotMatch(stories, /title: 'Pages\/Artifacts\/States'/)
})
