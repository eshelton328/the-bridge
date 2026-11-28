// A scratch brain for the tests of the brain's writes: a git repository and a stub of the helper's Python, never the
// real brain or the real helper.
import { execFileSync } from 'node:child_process'
import { chmod, mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

/** A stub of the helper's Python: it saves its arguments and environment beside itself, then writes the home as `init` does. */
const stubInit = [
  '#!/bin/sh',
  String.raw`printf '%s\n' "$@" > "$0.args"`,
  'env > "$0.env"',
  'for a; do case "$a" in --slug=*) slug="${a#--slug=}";; --name=*) name="${a#--name=}";; --purpose=*) purpose="${a#--purpose=}";; esac; done',
  'mkdir "projects/$slug" || exit 1',
  String.raw`printf 'schema_version: 1\nslug: "%s"\nname: "%s"\npurpose: "%s"\nrepositories: []\nlinear: []\n' "$slug" "$name" "$purpose" > "projects/$slug/project.yaml"`,
  'for f in README.md AGENTS.md; do echo "# $slug" > "projects/$slug/$f"; done',
  'echo \'@AGENTS.md\' > "projects/$slug/CLAUDE.md"',
  'echo "- [$slug/AGENTS.md]($slug/AGENTS.md)" >> projects/AGENTS.md',
  'echo "- [$slug/README.md]($slug/README.md)" >> projects/README.md',
  `echo '{"ok": true, "created": true, "id": "x", "project": "p", "written": []}'`,
  '',
].join('\n')

/** Makes `brain` a git repository with the brain's index files, and `<chatRoot>/projects`; writes the stub to `python`. */
export async function stubBrain(brain: string, chatRoot: string, python: string): Promise<void> {
  await mkdir(join(brain, 'projects'), { recursive: true })
  await mkdir(join(chatRoot, 'projects'), { recursive: true })
  for (const path of ['AGENTS.md', 'projects/AGENTS.md', 'projects/README.md'])
    await writeFile(join(brain, path), '# index\n', { flag: 'a' })
  const git = (...args: string[]) => execFileSync('git', ['-C', brain, ...args])
  git('init', '-q')
  git('config', 'user.name', 'Test')
  git('config', 'user.email', 'test@example.com')
  git('add', '-A')
  git('commit', '-q', '-m', 'docs: start')
  await writeFile(python, stubInit)
  await chmod(python, 0o755)
}
