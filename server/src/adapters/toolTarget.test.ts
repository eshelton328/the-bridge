import { describe, expect, it } from 'vitest'
import { programsOf, toolTarget } from './toolTarget.ts'

const context = { cwd: '/home/dev/ncc-1701', home: '/home/dev' }
// A marker in place of a secret: it must never reach a target.
const marker = 'argument-that-must-stay-here'

describe('tool target', () => {
  it('gives only the program names of a shell command, never an argument', () => {
    const command = `API_KEY=${marker} curl -H "Authorization: Bearer ${marker}" https://api.example.com/v1?token=${marker} | jq .data && sudo /usr/bin/git push; echo "${marker}"`
    const target = toolTarget('Bash', { command, description: `send ${marker}` }, context)
    expect(target).toBe('curl | jq | git | echo')
    expect(target).not.toContain(marker)
  })

  it('reads no word inside quotes or after a quote that does not close, and no redirection', () => {
    expect(programsOf(`grep -E "x|${marker}|y" log.txt 2>&1 | head`)).toBe('grep | head')
    expect(programsOf(`echo 'a; ${marker}' && ls`)).toBe('echo | ls')
    expect(programsOf(`echo "a \\" | ${marker}" | wc`)).toBe('echo | wc')
    expect(programsOf(`printf "start | ${marker}`)).toBe('printf')
    expect(programsOf('pnpm test >out.log 2>&1; cat out.log')).toBe('pnpm | cat')
  })

  it('drops a word that is not a program name, such as a command substitution', () => {
    expect(programsOf('$(cat /home/dev/.token) --flag')).toBe('cat')
    expect(programsOf('"quoted thing" arg')).toBe('')
  })

  it("gives a file tool's path from the chat's folder, else with the home folder as ~, else the file name", () => {
    expect(toolTarget('Read', { file_path: '/home/dev/ncc-1701/web/src/theme.ts' }, context)).toBe('web/src/theme.ts')
    expect(toolTarget('Edit', { file_path: '/home/dev/.zshrc', old_string: marker }, context)).toBe('~/.zshrc')
    expect(toolTarget('Write', { file_path: '/etc/hosts', content: marker }, context)).toBe('hosts')
    expect(toolTarget('Grep', { pattern: marker, path: '/home/dev/ncc-1701/server' }, context)).toBe('server')
    expect(toolTarget('Glob', { pattern: marker }, context)).toBe('')
  })

  it('gives a web tool its host only, never the path or a query token', () => {
    const target = toolTarget(
      'WebFetch',
      { url: `https://docs.example.com/a/b?token=${marker}`, prompt: marker },
      context,
    )
    expect(target).toBe('docs.example.com')
    expect(toolTarget('WebSearch', { query: marker }, context)).toBe('')
  })

  it('gives "" for any other tool, an input with no known field and an input that is not an object', () => {
    expect(toolTarget('REPL', { code: marker }, context)).toBe('')
    expect(toolTarget('Bash', { description: marker }, context)).toBe('')
    expect(toolTarget('Read', marker, context)).toBe('')
  })

  it('keeps a target to 200 characters with no control character', () => {
    const long = Array.from({ length: 60 }, (_, i) => `p${String(i)}`).join(' | ')
    expect(toolTarget('Bash', { command: long }, context).length).toBeLessThanOrEqual(200)
    expect(toolTarget('Read', { file_path: 'a\x1b[31mb' }, context)).toBe('a[31mb')
  })
})
